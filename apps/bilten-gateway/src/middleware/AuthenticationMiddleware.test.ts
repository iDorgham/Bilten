import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticationMiddleware, AuthenticatedRequest } from './AuthenticationMiddleware';
import { ConfigManager } from '../config/ConfigManager';
import { Logger } from '../utils/Logger';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../config/ConfigManager');
jest.mock('../utils/Logger');
jest.mock('axios');

const mockJwt = jwt as jest.Mocked<typeof jwt>;
const mockConfigManager = ConfigManager as jest.MockedClass<typeof ConfigManager>;
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  getInstance: jest.fn()
};

// Mock Logger.getInstance to return our mock
(Logger.getInstance as jest.Mock).mockReturnValue(mockLogger);

describe('AuthenticationMiddleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockConfigManagerInstance: any;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      query: {},
      ip: '127.0.0.1'
    } as AuthenticatedRequest;
    (mockRequest as any).path = '/api/test';
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();

    mockConfigManagerInstance = {
      getJWTConfig: jest.fn().mockReturnValue({
        secret: 'test-secret',
        expiresIn: '1h',
        issuer: 'bilten-api',
        audience: 'bilten-clients'
      })
    };

    mockConfigManager.mockImplementation(() => mockConfigManagerInstance);

    // Clear all mocks
    jest.clearAllMocks();
    AuthenticationMiddleware.clearCaches();
  });

  describe('authenticate', () => {
    it('should skip authentication for public paths', async () => {
      (mockRequest as any).path = '/health';
      
      const middleware = AuthenticationMiddleware.authenticate();
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 401 when no token is provided', async () => {
      const middleware = AuthenticationMiddleware.authenticate();
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);
      
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication token is required',
          timestamp: expect.any(String),
          traceId: 'unknown'
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should authenticate valid JWT token', async () => {
      const mockDecoded = {
        id: 'user123',
        email: 'test@example.com',
        role: 'user',
        organizationId: 'org123',
        scopes: ['read:events'],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      };

      mockRequest.headers!.authorization = 'Bearer valid-jwt-token';
      (mockJwt.verify as jest.Mock).mockReturnValue(mockDecoded);

      const middleware = AuthenticationMiddleware.authenticate();
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockJwt.verify).toHaveBeenCalledWith('valid-jwt-token', 'test-secret');
      expect(mockRequest.user).toEqual({
        id: 'user123',
        email: 'test@example.com',
        role: 'user',
        organizationId: 'org123',
        scopes: ['read:events'],
        clientId: undefined,
        authType: 'jwt'
      });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should authenticate valid API key', async () => {
      mockRequest.headers!['x-api-key'] = 'ak_test_12345';

      const middleware = AuthenticationMiddleware.authenticate();
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockRequest.user).toEqual({
        id: 'client_test_123',
        email: 'client_test_123@api.bilten.com',
        role: 'api_client',
        organizationId: 'org_123',
        scopes: ['read:events', 'write:events', 'read:users'],
        clientId: 'client_test_123',
        authType: 'api_key'
      });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should authenticate valid OAuth token', async () => {
      mockRequest.headers!.authorization = 'Bearer oauth_valid_token';

      const middleware = AuthenticationMiddleware.authenticate();
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockRequest.user).toEqual({
        id: 'oauth_user_456',
        email: 'oauth_user',
        role: 'oauth_client',
        scopes: ['read:events', 'write:events', 'read:users'],
        clientId: 'oauth_client_123',
        authType: 'oauth'
      });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 for invalid JWT token', async () => {
      mockRequest.headers!.authorization = 'Bearer invalid-jwt-token';
      (mockJwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const middleware = AuthenticationMiddleware.authenticate();
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'AUTHENTICATION_FAILED',
          message: 'Invalid or expired authentication token',
          timestamp: expect.any(String),
          traceId: 'unknown'
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid API key', async () => {
      mockRequest.headers!['x-api-key'] = 'invalid_api_key';

      const middleware = AuthenticationMiddleware.authenticate();
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should check required scopes', async () => {
      // Clear any previous mock calls
      jest.clearAllMocks();
      
      const mockDecoded = {
        id: 'user123',
        email: 'test@example.com',
        role: 'user',
        scopes: ['read:events']
      };

      mockRequest.headers!.authorization = 'Bearer valid-jwt-token';
      (mockJwt.verify as jest.Mock).mockReturnValue(mockDecoded);

      const middleware = AuthenticationMiddleware.authenticate({
        requiredScopes: ['read:events', 'write:events']
      });
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'INSUFFICIENT_SCOPES',
          message: 'Required scopes: read:events, write:events',
          timestamp: expect.any(String),
          traceId: 'unknown'
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow specific auth types only', async () => {
      mockRequest.headers!['x-api-key'] = 'ak_test_12345';

      const middleware = AuthenticationMiddleware.authenticate({
        allowedAuthTypes: ['jwt'] // Only JWT allowed
      });
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should extract token from Basic auth header', async () => {
      const apiKey = 'ak_test_12345';
      const basicAuth = Buffer.from(`:${apiKey}`).toString('base64');
      mockRequest.headers!.authorization = `Basic ${basicAuth}`;

      const middleware = AuthenticationMiddleware.authenticate();
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockRequest.user?.authType).toBe('api_key');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should extract token from query parameter', async () => {
      mockRequest.query!.api_key = 'ak_test_12345';

      const middleware = AuthenticationMiddleware.authenticate();
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockRequest.user?.authType).toBe('api_key');
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    beforeEach(() => {
      mockRequest.user = {
        id: 'user123',
        email: 'test@example.com',
        role: 'user',
        organizationId: 'org123',
        authType: 'jwt'
      };
    });

    it('should allow access for sufficient role', () => {
      const middleware = AuthenticationMiddleware.requireRole('user');
      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should deny access for insufficient role', () => {
      const middleware = AuthenticationMiddleware.requireRole('admin');
      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Access denied. Required role(s): admin',
          timestamp: expect.any(String),
          traceId: 'unknown'
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow multiple roles', () => {
      mockRequest.user!.role = 'moderator';
      const middleware = AuthenticationMiddleware.requireRole(['user', 'moderator']);
      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', () => {
      delete mockRequest.user;
      const middleware = AuthenticationMiddleware.requireRole('user');
      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireScopes', () => {
    beforeEach(() => {
      mockRequest.user = {
        id: 'user123',
        email: 'test@example.com',
        role: 'user',
        organizationId: 'org123',
        scopes: ['read:events', 'read:users'],
        authType: 'jwt'
      };
    });

    it('should allow access with sufficient scopes', () => {
      const middleware = AuthenticationMiddleware.requireScopes('read:events');
      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny access with insufficient scopes', () => {
      const middleware = AuthenticationMiddleware.requireScopes('write:events');
      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'INSUFFICIENT_SCOPES',
          message: 'Access denied. Required scope(s): write:events',
          timestamp: expect.any(String),
          traceId: 'unknown'
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should require all scopes when multiple provided', () => {
      const middleware = AuthenticationMiddleware.requireScopes(['read:events', 'write:events']);
      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireOrganization', () => {
    beforeEach(() => {
      mockRequest.user = {
        id: 'user123',
        email: 'test@example.com',
        role: 'user',
        organizationId: 'org123',
        authType: 'jwt'
      };
      mockRequest.params = { organizationId: 'org123' };
    });

    it('should allow access to own organization', () => {
      const middleware = AuthenticationMiddleware.requireOrganization();
      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny access to different organization', () => {
      mockRequest.params!.organizationId = 'org456';
      const middleware = AuthenticationMiddleware.requireOrganization();
      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'ORGANIZATION_ACCESS_DENIED',
          message: 'Access denied to this organization',
          timestamp: expect.any(String),
          traceId: 'unknown'
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow super_admin to access any organization', () => {
      mockRequest.user!.role = 'super_admin';
      mockRequest.params!.organizationId = 'org456';
      const middleware = AuthenticationMiddleware.requireOrganization();
      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 400 when organization ID is missing', () => {
      mockRequest.params = {};
      const middleware = AuthenticationMiddleware.requireOrganization();
      middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'ORGANIZATION_ID_REQUIRED',
          message: 'Organization ID is required',
          timestamp: expect.any(String),
          traceId: 'unknown'
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('optional', () => {
    it('should proceed without authentication when no token provided', async () => {
      const middleware = AuthenticationMiddleware.optional();
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should authenticate when valid token is provided', async () => {
      // Clear any previous mock calls and reset request
      jest.clearAllMocks();
      mockRequest = {
        headers: { authorization: 'Bearer valid-jwt-token' },
        query: {},
        ip: '127.0.0.1'
      } as AuthenticatedRequest;
      (mockRequest as any).path = '/api/test';
      
      const mockDecoded = {
        id: 'user123',
        email: 'test@example.com',
        role: 'user'
      };

      (mockJwt.verify as jest.Mock).mockReturnValue(mockDecoded);

      const middleware = AuthenticationMiddleware.optional();
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockRequest.user).toBeDefined();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('clearCaches', () => {
    it('should clear authentication caches', () => {
      AuthenticationMiddleware.clearCaches();
      expect(mockLogger.info).toHaveBeenCalledWith('Authentication caches cleared');
    });
  });
});