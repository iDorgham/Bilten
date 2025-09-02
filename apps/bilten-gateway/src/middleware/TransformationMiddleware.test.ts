/**
 * Tests for TransformationMiddleware
 */

import { Request, Response, NextFunction } from 'express';
import { TransformationMiddleware } from './TransformationMiddleware';
import { TransformationRule } from '../routing/types';

// Mock Logger
jest.mock('../utils/Logger', () => ({
  Logger: {
    getInstance: () => ({
      debug: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    })
  }
}));

describe('TransformationMiddleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {},
      url: '/api/users',
      originalUrl: '/api/users',
      routingContext: {
        method: 'GET',
        path: '/api/users',
        headers: {},
        query: {},
        correlationId: 'test-correlation-id',
        timestamp: new Date()
      }
    };

    mockRes = {
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      removeHeader: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();
  });

  describe('transformRequest', () => {
    it('should pass through when no transformation rule exists', () => {
      const middleware = TransformationMiddleware.transformRequest();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should add request headers', () => {
      const transformationRule: TransformationRule = {
        requestTransform: {
          addHeaders: {
            'X-Custom-Header': 'custom-value',
            'X-User-ID': '{{request.headers.authorization}}'
          }
        }
      };

      mockReq.headers = { authorization: 'Bearer token123' };
      mockReq.routeMatch = {
        route: {
          id: 'test-route',
          path: '/api/users',
          methods: ['GET'],
          upstream: 'http://user-service',
          authentication: false,
          version: '1.0',
          enabled: true,
          metadata: {},
          transformation: transformationRule
        },
        params: {},
        query: {}
      };

      const middleware = TransformationMiddleware.transformRequest();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.headers['x-custom-header']).toBe('custom-value');
      expect(mockReq.headers['x-user-id']).toBe('Bearer token123');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should remove request headers', () => {
      const transformationRule: TransformationRule = {
        requestTransform: {
          removeHeaders: ['x-internal-header', 'x-debug']
        }
      };

      mockReq.headers = {
        'x-internal-header': 'internal-value',
        'x-debug': 'debug-info',
        'authorization': 'Bearer token123'
      };

      mockReq.routeMatch = {
        route: {
          id: 'test-route',
          path: '/api/users',
          methods: ['GET'],
          upstream: 'http://user-service',
          authentication: false,
          version: '1.0',
          enabled: true,
          metadata: {},
          transformation: transformationRule
        },
        params: {},
        query: {}
      };

      const middleware = TransformationMiddleware.transformRequest();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.headers['x-internal-header']).toBeUndefined();
      expect(mockReq.headers['x-debug']).toBeUndefined();
      expect(mockReq.headers['authorization']).toBe('Bearer token123');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should strip path prefix', () => {
      const transformationRule: TransformationRule = {
        requestTransform: {
          modifyPath: {
            stripPrefix: '/api/v1'
          }
        }
      };

      mockReq.url = '/api/v1/users';
      mockReq.routeMatch = {
        route: {
          id: 'test-route',
          path: '/api/users',
          methods: ['GET'],
          upstream: 'http://user-service',
          authentication: false,
          version: '1.0',
          enabled: true,
          metadata: {},
          transformation: transformationRule
        },
        params: {},
        query: {}
      };

      const middleware = TransformationMiddleware.transformRequest();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.url).toBe('/users');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should add path prefix', () => {
      const transformationRule: TransformationRule = {
        requestTransform: {
          modifyPath: {
            addPrefix: '/v2'
          }
        }
      };

      mockReq.url = '/users';
      mockReq.routeMatch = {
        route: {
          id: 'test-route',
          path: '/api/users',
          methods: ['GET'],
          upstream: 'http://user-service',
          authentication: false,
          version: '1.0',
          enabled: true,
          metadata: {},
          transformation: transformationRule
        },
        params: {},
        query: {}
      };

      const middleware = TransformationMiddleware.transformRequest();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.url).toBe('/v2/users');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should rewrite path using regex', () => {
      const transformationRule: TransformationRule = {
        requestTransform: {
          modifyPath: {
            rewrite: '/api/users/(\\d+) -> /users/$1/profile'
          }
        }
      };

      mockReq.url = '/api/users/123';
      mockReq.routeMatch = {
        route: {
          id: 'test-route',
          path: '/api/users',
          methods: ['GET'],
          upstream: 'http://user-service',
          authentication: false,
          version: '1.0',
          enabled: true,
          metadata: {},
          transformation: transformationRule
        },
        params: {},
        query: {}
      };

      const middleware = TransformationMiddleware.transformRequest();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.url).toBe('/users/123/profile');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle transformation errors gracefully', () => {
      // Mock a scenario that would cause an error by making the transformation throw
      const transformationRule: TransformationRule = {
        requestTransform: {
          addHeaders: {
            'X-Test': '{{invalid.template.variable}}'
          }
        }
      };

      mockReq.routeMatch = {
        route: {
          id: 'test-route',
          path: '/api/users',
          methods: ['GET'],
          upstream: 'http://user-service',
          authentication: false,
          version: '1.0',
          enabled: true,
          metadata: {},
          transformation: transformationRule
        },
        params: {},
        query: {}
      };

      // Mock the processTemplateValue to throw an error
      const originalProcessTemplateValue = (TransformationMiddleware as any).processTemplateValue;
      (TransformationMiddleware as any).processTemplateValue = jest.fn().mockImplementation(() => {
        throw new Error('Template processing error');
      });

      const middleware = TransformationMiddleware.transformRequest();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'TRANSFORMATION_ERROR',
          message: 'Request transformation failed',
          timestamp: expect.any(String)
        }
      });

      // Restore original method
      (TransformationMiddleware as any).processTemplateValue = originalProcessTemplateValue;
    });
  });

  describe('transformResponse', () => {
    it('should pass through when no transformation rule exists', () => {
      const middleware = TransformationMiddleware.transformResponse();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should add response headers', () => {
      const transformationRule: TransformationRule = {
        responseTransform: {
          addHeaders: {
            'X-API-Version': '1.0',
            'X-Response-Time': '{{timestamp}}'
          }
        }
      };

      mockReq.routeMatch = {
        route: {
          id: 'test-route',
          path: '/api/users',
          methods: ['GET'],
          upstream: 'http://user-service',
          authentication: false,
          version: '1.0',
          enabled: true,
          metadata: {},
          transformation: transformationRule
        },
        params: {},
        query: {}
      };

      const middleware = TransformationMiddleware.transformResponse();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      // Simulate response
      const responseData = { users: [{ id: 1, name: 'John' }] };
      (mockRes.json as jest.Mock)(responseData);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-API-Version', '1.0');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should remove response headers', () => {
      const transformationRule: TransformationRule = {
        responseTransform: {
          removeHeaders: ['X-Internal-Info', 'X-Debug-Data']
        }
      };

      mockReq.routeMatch = {
        route: {
          id: 'test-route',
          path: '/api/users',
          methods: ['GET'],
          upstream: 'http://user-service',
          authentication: false,
          version: '1.0',
          enabled: true,
          metadata: {},
          transformation: transformationRule
        },
        params: {},
        query: {}
      };

      const middleware = TransformationMiddleware.transformResponse();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      // Simulate response
      const responseData = { users: [{ id: 1, name: 'John' }] };
      (mockRes.json as jest.Mock)(responseData);

      expect(mockRes.removeHeader).toHaveBeenCalledWith('X-Internal-Info');
      expect(mockRes.removeHeader).toHaveBeenCalledWith('X-Debug-Data');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should apply field selection to response body', () => {
      const transformationRule: TransformationRule = {
        responseTransform: {
          fieldSelection: ['id', 'name', 'profile.email']
        }
      };

      mockReq.routeMatch = {
        route: {
          id: 'test-route',
          path: '/api/users',
          methods: ['GET'],
          upstream: 'http://user-service',
          authentication: false,
          version: '1.0',
          enabled: true,
          metadata: {},
          transformation: transformationRule
        },
        params: {},
        query: {}
      };

      let transformedData: any;

      mockRes.json = jest.fn().mockImplementation((data) => {
        transformedData = data;
        return mockRes;
      });

      const middleware = TransformationMiddleware.transformResponse();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      // Simulate response with more fields than selected
      const responseData = {
        id: 1,
        name: 'John',
        password: 'secret',
        profile: {
          email: 'john@example.com',
          phone: '123-456-7890'
        },
        internalData: 'sensitive'
      };

      (mockRes.json as jest.Mock)(responseData);

      expect(transformedData).toEqual({
        id: 1,
        name: 'John',
        profile: {
          email: 'john@example.com'
        }
      });
      expect(transformedData.password).toBeUndefined();
      expect(transformedData.internalData).toBeUndefined();
      expect(transformedData.profile.phone).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle array responses with field selection', () => {
      const transformationRule: TransformationRule = {
        responseTransform: {
          fieldSelection: ['id', 'name']
        }
      };

      mockReq.routeMatch = {
        route: {
          id: 'test-route',
          path: '/api/users',
          methods: ['GET'],
          upstream: 'http://user-service',
          authentication: false,
          version: '1.0',
          enabled: true,
          metadata: {},
          transformation: transformationRule
        },
        params: {},
        query: {}
      };

      let transformedData: any;
      mockRes.json = jest.fn().mockImplementation((data) => {
        transformedData = data;
        return mockRes;
      });

      const middleware = TransformationMiddleware.transformResponse();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      // Simulate array response
      const responseData = [
        { id: 1, name: 'John', password: 'secret1' },
        { id: 2, name: 'Jane', password: 'secret2' }
      ];

      (mockRes.json as jest.Mock)(responseData);

      expect(transformedData).toEqual([
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' }
      ]);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('createTransformationRule', () => {
    it('should create transformation rule from configuration', () => {
      const config = {
        request: {
          addHeaders: { 'X-Custom': 'value' },
          removeHeaders: ['X-Internal'],
          modifyPath: { stripPrefix: '/api' }
        },
        response: {
          addHeaders: { 'X-Version': '1.0' },
          removeHeaders: ['X-Debug'],
          fieldSelection: ['id', 'name']
        }
      };

      const rule = TransformationMiddleware.createTransformationRule(config);

      expect(rule.requestTransform).toEqual(config.request);
      expect(rule.responseTransform).toEqual(config.response);
    });
  });

  describe('validateTransformationRule', () => {
    it('should return no errors for valid rule', () => {
      const rule: TransformationRule = {
        requestTransform: {
          addHeaders: { 'X-Valid-Header': 'value' },
          removeHeaders: ['X-Remove'],
          modifyPath: { rewrite: '/old/(\\d+) -> /new/$1' }
        },
        responseTransform: {
          fieldSelection: ['id', 'name', 'profile.email']
        }
      };

      const errors = TransformationMiddleware.validateTransformationRule(rule);
      expect(errors).toHaveLength(0);
    });

    it('should return errors for invalid header names', () => {
      const rule: TransformationRule = {
        requestTransform: {
          addHeaders: { 'Invalid Header Name!': 'value' }
        }
      };

      const errors = TransformationMiddleware.validateTransformationRule(rule);
      expect(errors).toContain('Invalid header name: Invalid Header Name!');
    });

    it('should return errors for invalid regex patterns', () => {
      const rule: TransformationRule = {
        requestTransform: {
          modifyPath: { rewrite: '[invalid-regex -> replacement' }
        }
      };

      const errors = TransformationMiddleware.validateTransformationRule(rule);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('Invalid rewrite regex pattern');
    });

    it('should return errors for invalid field selections', () => {
      const rule: TransformationRule = {
        responseTransform: {
          fieldSelection: ['valid-field', '', 'another-valid']
        }
      };

      const errors = TransformationMiddleware.validateTransformationRule(rule);
      expect(errors).toContain('Invalid field selection: ');
    });
  });
});