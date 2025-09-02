/**
 * Unit tests for RoutingEngine
 */

import { Request, Response, NextFunction } from 'express';
import { RoutingEngine } from '../../routing/RoutingEngine';
import { RouteConfig, RouteValidation } from '../../routing/types';

// Mock Logger
jest.mock('../../utils/Logger', () => ({
  Logger: {
    getInstance: () => ({
      info: jest.fn(),
      error: jest.fn(),
      http: jest.fn()
    })
  }
}));

describe('RoutingEngine', () => {
  let routingEngine: RoutingEngine;
  let mockRoute: RouteConfig;

  beforeEach(() => {
    routingEngine = new RoutingEngine();
    mockRoute = {
      id: 'test-route',
      path: '/api/users/:id',
      methods: ['GET', 'POST'],
      upstream: 'http://user-service:3000',
      authentication: true,
      version: '1.0.0',
      enabled: true,
      metadata: {}
    };
  });

  describe('registerRoute', () => {
    it('should register a valid route', () => {
      expect(() => routingEngine.registerRoute(mockRoute)).not.toThrow();
      expect(routingEngine.getRoutes()).toHaveLength(1);
      expect(routingEngine.getRoute('test-route')).toEqual(mockRoute);
    });

    it('should register route with validation rules', () => {
      const validation: RouteValidation = {
        body: [{ field: 'name', type: 'string', required: true }]
      };

      expect(() => routingEngine.registerRoute(mockRoute, validation)).not.toThrow();
      expect(routingEngine.getRoutes()).toHaveLength(1);
    });

    it('should throw error for invalid route configuration', () => {
      const invalidRoute = { ...mockRoute, id: '' };
      expect(() => routingEngine.registerRoute(invalidRoute)).toThrow('Route ID is required');
    });

    it('should throw error for duplicate route IDs', () => {
      routingEngine.registerRoute(mockRoute);
      expect(() => routingEngine.registerRoute(mockRoute)).toThrow('Route with ID test-route already exists');
    });

    it('should throw error for invalid HTTP methods', () => {
      const invalidRoute = { ...mockRoute, methods: ['INVALID'] };
      expect(() => routingEngine.registerRoute(invalidRoute)).toThrow('Invalid HTTP method: INVALID');
    });

    it('should sort routes by specificity after registration', () => {
      const specificRoute = {
        ...mockRoute,
        id: 'specific-route',
        path: '/api/users/profile'
      };

      routingEngine.registerRoute(mockRoute);
      routingEngine.registerRoute(specificRoute);

      const routes = routingEngine.getRoutes();
      expect(routes[0].path).toBe('/api/users/profile'); // More specific first
      expect(routes[1].path).toBe('/api/users/:id');
    });
  });

  describe('unregisterRoute', () => {
    it('should unregister existing route', () => {
      routingEngine.registerRoute(mockRoute);
      expect(routingEngine.getRoutes()).toHaveLength(1);

      const result = routingEngine.unregisterRoute('test-route');
      expect(result).toBe(true);
      expect(routingEngine.getRoutes()).toHaveLength(0);
    });

    it('should return false for non-existent route', () => {
      const result = routingEngine.unregisterRoute('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('findRoute', () => {
    beforeEach(() => {
      routingEngine.registerRoute(mockRoute);
    });

    it('should find matching route', () => {
      const match = routingEngine.findRoute('GET', '/api/users/123');
      expect(match).not.toBeNull();
      expect(match!.route.id).toBe('test-route');
      expect(match!.params).toEqual({ id: '123' });
    });

    it('should return null for non-matching path', () => {
      const match = routingEngine.findRoute('GET', '/api/posts/123');
      expect(match).toBeNull();
    });

    it('should return null for non-matching method', () => {
      const match = routingEngine.findRoute('DELETE', '/api/users/123');
      expect(match).toBeNull();
    });

    it('should return null for disabled routes', () => {
      const disabledRoute = { ...mockRoute, id: 'disabled-route', enabled: false };
      routingEngine.registerRoute(disabledRoute);

      const match = routingEngine.findRoute('GET', '/api/users/123');
      expect(match!.route.id).toBe('test-route'); // Should match enabled route
    });

    it('should handle case-insensitive HTTP methods', () => {
      const match = routingEngine.findRoute('get', '/api/users/123');
      expect(match).not.toBeNull();
      expect(match!.route.id).toBe('test-route');
    });
  });

  describe('createRoutingContext', () => {
    it('should create routing context from request', () => {
      const req = {
        method: 'GET',
        path: '/api/users/123',
        headers: { 'content-type': 'application/json' },
        query: { page: '1' },
        body: { name: 'test' }
      } as unknown as Request;

      const context = routingEngine.createRoutingContext(req);

      expect(context.method).toBe('GET');
      expect(context.path).toBe('/api/users/123');
      expect(context.headers).toEqual({ 'content-type': 'application/json' });
      expect(context.query).toEqual({ page: '1' });
      expect(context.body).toEqual({ name: 'test' });
      expect(context.correlationId).toMatch(/^rt-/);
      expect(context.timestamp).toBeInstanceOf(Date);
    });

    it('should use existing correlation ID from headers', () => {
      const req = {
        method: 'GET',
        path: '/api/users/123',
        headers: { 'x-correlation-id': 'existing-id' },
        query: {},
        body: {}
      } as unknown as Request;

      const context = routingEngine.createRoutingContext(req);
      expect(context.correlationId).toBe('existing-id');
    });
  });

  describe('middleware', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
      req = {
        method: 'GET',
        path: '/api/users/123',
        headers: {},
        query: {},
        body: {}
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        setHeader: jest.fn()
      };
      next = jest.fn();

      routingEngine.registerRoute(mockRoute);
    });

    it('should process valid request and call next', () => {
      const middleware = routingEngine.middleware();
      middleware(req as Request, res as Response, next);

      expect(req.routeMatch).toBeDefined();
      expect(req.routingContext).toBeDefined();
      expect(res.setHeader).toHaveBeenCalledWith('x-correlation-id', expect.any(String));
      expect(next).toHaveBeenCalled();
    });

    it('should return 404 for non-matching routes', () => {
      (req as any).path = '/api/nonexistent';

      const middleware = routingEngine.middleware();
      middleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: 'ROUTE_NOT_FOUND',
          message: 'No route found for GET /api/nonexistent',
          timestamp: expect.any(String),
          correlationId: expect.any(String)
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should validate request when validation rules exist', () => {
      const validation: RouteValidation = {
        body: [{ field: 'name', type: 'string', required: true }]
      };

      routingEngine.registerRoute({
        ...mockRoute,
        id: 'validated-route',
        path: '/api/validated'
      }, validation);

      (req as any).path = '/api/validated';
      (req as any).body = {}; // Missing required field

      const middleware = routingEngine.middleware();
      middleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: expect.any(Array),
          timestamp: expect.any(String),
          correlationId: expect.any(String)
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle middleware errors gracefully', () => {
      // Mock findRoute to throw an error
      jest.spyOn(routingEngine, 'findRoute').mockImplementation(() => {
        throw new Error('Test error');
      });

      const middleware = routingEngine.middleware();
      middleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: 'ROUTING_ERROR',
          message: 'Internal routing error',
          timestamp: expect.any(String)
        }
      });
    });
  });

  describe('updateRoute', () => {
    beforeEach(() => {
      routingEngine.registerRoute(mockRoute);
    });

    it('should update existing route', () => {
      const updates = { enabled: false, version: '2.0.0' };
      const result = routingEngine.updateRoute('test-route', updates);

      expect(result).toBe(true);
      const updatedRoute = routingEngine.getRoute('test-route');
      expect(updatedRoute!.enabled).toBe(false);
      expect(updatedRoute!.version).toBe('2.0.0');
    });

    it('should return false for non-existent route', () => {
      const result = routingEngine.updateRoute('non-existent', { enabled: false });
      expect(result).toBe(false);
    });

    it('should re-sort routes when path or methods change', () => {
      const anotherRoute = {
        ...mockRoute,
        id: 'another-route',
        path: '/api/users/profile'
      };
      routingEngine.registerRoute(anotherRoute);

      // Update to make it less specific
      routingEngine.updateRoute('another-route', { path: '/api/*' });

      const routes = routingEngine.getRoutes();
      expect(routes[0].path).toBe('/api/users/:id'); // More specific first
      expect(routes[1].path).toBe('/api/*');
    });
  });

  describe('clearRoutes', () => {
    it('should clear all routes', () => {
      routingEngine.registerRoute(mockRoute);
      expect(routingEngine.getRoutes()).toHaveLength(1);

      routingEngine.clearRoutes();
      expect(routingEngine.getRoutes()).toHaveLength(0);
    });
  });
});