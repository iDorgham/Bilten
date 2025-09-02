import { Response, NextFunction } from 'express';
import { AuthorizationMiddleware, PermissionCondition } from './AuthorizationMiddleware';
import { AuthenticatedRequest } from './AuthenticationMiddleware';
import { Logger } from '../utils/Logger';

// Mock dependencies
jest.mock('../utils/Logger');

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  getInstance: jest.fn()
};

// Mock Logger.getInstance to return our mock
(Logger.getInstance as jest.Mock).mockReturnValue(mockLogger);

describe('AuthorizationMiddleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      path: '/api/test',
      method: 'GET',
      ip: '127.0.0.1'
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();

    // Clear all mocks
    jest.clearAllMocks();
    AuthorizationMiddleware.clearCaches();
  });

  describe('requirePermission', () => {
    it('should return 401 when user is not authenticated', async () => {
      const middleware = AuthorizationMiddleware.requirePermission('events', 'read');
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);
      
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication is required',
          timestamp: expect.any(String),
          traceId: 'unknown'
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow super_admin access to everything', async () => {
      mockRequest.user = {
        id: 'admin123',
        email: 'admin@example.com',
        role: 'super_admin',
        organizationId: 'org123',
        authType: 'jwt'
      };

      const middleware = AuthorizationMiddleware.requirePermission('events', 'delete');
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should allow admin to manage users in their organization', async () => {
      mockRequest.user = {
        id: 'admin123',
        email: 'admin@example.com',
        role: 'admin',
        organizationId: 'org123',
        authType: 'jwt'
      };

      const middleware = AuthorizationMiddleware.requirePermission('users', 'create');
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should deny user access to admin functions', async () => {
      mockRequest.user = {
        id: 'user123',
        email: 'user@example.com',
        role: 'user',
        organizationId: 'org123',
        authType: 'jwt'
      };

      const middleware = AuthorizationMiddleware.requirePermission('users', 'delete');
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'AUTHORIZATION_DENIED',
          message: expect.stringContaining('No permissions found'),
          timestamp: expect.any(String),
          traceId: 'unknown',
          requiredPermissions: expect.any(Array)
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow user to read events in their organization', async () => {
      mockRequest.user = {
        id: 'user123',
        email: 'user@example.com',
        role: 'user',
        organizationId: 'org123',
        authType: 'jwt'
      };

      const middleware = AuthorizationMiddleware.requirePermission('events', 'read');
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should allow user to manage their own profile', async () => {
      mockRequest.user = {
        id: 'user123',
        email: 'user@example.com',
        role: 'user',
        organizationId: 'org123',
        authType: 'jwt'
      };

      const middleware = AuthorizationMiddleware.requirePermission('profile', 'update');
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should allow moderator to update events', async () => {
      mockRequest.user = {
        id: 'mod123',
        email: 'moderator@example.com',
        role: 'moderator',
        organizationId: 'org123',
        authType: 'jwt'
      };

      const middleware = AuthorizationMiddleware.requirePermission('events', 'update');
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should allow API client to read events', async () => {
      mockRequest.user = {
        id: 'api_client_123',
        email: 'api@example.com',
        role: 'api_client',
        authType: 'api_key'
      };

      const middleware = AuthorizationMiddleware.requirePermission('events', 'read');
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should deny API client write access', async () => {
      mockRequest.user = {
        id: 'api_client_123',
        email: 'api@example.com',
        role: 'api_client',
        authType: 'api_key'
      };

      const middleware = AuthorizationMiddleware.requirePermission('events', 'create');
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle permission conditions', async () => {
      mockRequest.user = {
        id: 'user123',
        email: 'user@example.com',
        role: 'user',
        organizationId: 'org123',
        authType: 'jwt'
      };

      const conditions: PermissionCondition[] = [
        {
          type: 'user_id',
          operator: 'equals',
          value: 'user123'
        }
      ];

      const middleware = AuthorizationMiddleware.requirePermission('profile', 'read', conditions);
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should deny access when conditions are not met', async () => {
      mockRequest.user = {
        id: 'user123',
        email: 'user@example.com',
        role: 'user',
        organizationId: 'org123',
        authType: 'jwt'
      };

      const conditions: PermissionCondition[] = [
        {
          type: 'user_id',
          operator: 'equals',
          value: 'different_user'
        }
      ];

      const middleware = AuthorizationMiddleware.requirePermission('profile', 'read', conditions);
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'AUTHORIZATION_DENIED',
          message: 'Permission conditions not met',
          timestamp: expect.any(String),
          traceId: 'unknown',
          requiredPermissions: expect.any(Array)
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle authorization errors gracefully', async () => {
      mockRequest.user = {
        id: 'user123',
        email: 'user@example.com',
        role: 'invalid_role',
        organizationId: 'org123',
        authType: 'jwt'
      };

      const middleware = AuthorizationMiddleware.requirePermission('events', 'read');
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'AUTHORIZATION_DENIED',
          message: expect.stringContaining('Role \'invalid_role\' not found'),
          timestamp: expect.any(String),
          traceId: 'unknown',
          requiredPermissions: expect.any(Array)
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireAnyPermission', () => {
    it('should allow access if any permission matches', async () => {
      mockRequest.user = {
        id: 'user123',
        email: 'user@example.com',
        role: 'user',
        organizationId: 'org123',
        authType: 'jwt'
      };

      const permissions = [
        { resource: 'admin', action: 'read' }, // User doesn't have this
        { resource: 'events', action: 'read' }  // User has this
      ];

      const middleware = AuthorizationMiddleware.requireAnyPermission(permissions);
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should deny access if no permissions match', async () => {
      mockRequest.user = {
        id: 'user123',
        email: 'user@example.com',
        role: 'user',
        organizationId: 'org123',
        authType: 'jwt'
      };

      const permissions = [
        { resource: 'admin', action: 'read' },
        { resource: 'users', action: 'delete' }
      ];

      const middleware = AuthorizationMiddleware.requireAnyPermission(permissions);
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'AUTHORIZATION_DENIED',
          message: 'Access denied - insufficient permissions',
          timestamp: expect.any(String),
          traceId: 'unknown',
          requiredPermissions: permissions
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('hasPermission', () => {
    it('should return true for valid permissions', async () => {
      const user = {
        id: 'user123',
        email: 'user@example.com',
        role: 'user',
        organizationId: 'org123',
        authType: 'jwt' as const
      };

      const hasPermission = await AuthorizationMiddleware.hasPermission(user, 'events', 'read');
      expect(hasPermission).toBe(true);
    });

    it('should return false for invalid permissions', async () => {
      const user = {
        id: 'user123',
        email: 'user@example.com',
        role: 'user',
        organizationId: 'org123',
        authType: 'jwt' as const
      };

      const hasPermission = await AuthorizationMiddleware.hasPermission(user, 'users', 'delete');
      expect(hasPermission).toBe(false);
    });

    it('should return true for super_admin', async () => {
      const user = {
        id: 'admin123',
        email: 'admin@example.com',
        role: 'super_admin',
        organizationId: 'org123',
        authType: 'jwt' as const
      };

      const hasPermission = await AuthorizationMiddleware.hasPermission(user, 'anything', 'delete');
      expect(hasPermission).toBe(true);
    });
  });

  describe('getUserPermissions', () => {
    it('should return user permissions', async () => {
      const user = {
        id: 'user123',
        email: 'user@example.com',
        role: 'user',
        organizationId: 'org123',
        authType: 'jwt' as const
      };

      const permissions = await AuthorizationMiddleware.getUserPermissions(user);
      expect(permissions).toHaveLength(3); // events:read, events:create, profile:*
      expect(permissions.some(p => p.resource === 'events' && p.action === 'read')).toBe(true);
      expect(permissions.some(p => p.resource === 'events' && p.action === 'create')).toBe(true);
      expect(permissions.some(p => p.resource === 'profile' && p.action === '*')).toBe(true);
    });

    it('should return empty array for invalid role', async () => {
      const user = {
        id: 'user123',
        email: 'user@example.com',
        role: 'invalid_role',
        organizationId: 'org123',
        authType: 'jwt' as const
      };

      const permissions = await AuthorizationMiddleware.getUserPermissions(user);
      expect(permissions).toHaveLength(0);
    });
  });

  describe('clearCaches', () => {
    it('should clear authorization caches', () => {
      AuthorizationMiddleware.clearCaches();
      expect(mockLogger.info).toHaveBeenCalledWith('Authorization caches cleared');
    });
  });

  describe('condition evaluation', () => {
    it('should handle organization conditions', async () => {
      mockRequest.user = {
        id: 'user123',
        email: 'user@example.com',
        role: 'admin',
        organizationId: 'org123',
        authType: 'jwt'
      };

      const middleware = AuthorizationMiddleware.requirePermission('users', 'read');
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle template variables in conditions', async () => {
      mockRequest.user = {
        id: 'user123',
        email: 'user@example.com',
        role: 'user',
        organizationId: 'org123',
        authType: 'jwt'
      };

      const middleware = AuthorizationMiddleware.requirePermission('profile', 'update');
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle different condition operators', async () => {
      mockRequest.user = {
        id: 'user123',
        email: 'user@example.com',
        role: 'user',
        organizationId: 'org123',
        authType: 'jwt'
      };

      const conditions: PermissionCondition[] = [
        {
          type: 'role',
          operator: 'in',
          value: ['user', 'moderator', 'admin']
        }
      ];

      const middleware = AuthorizationMiddleware.requirePermission('events', 'read', conditions);
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });
});