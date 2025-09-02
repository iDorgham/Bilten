/**
 * Integration tests for RoutingEngine with Express
 */

import request from 'supertest';
import express from 'express';
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

describe('RoutingEngine Integration', () => {
  let app: express.Application;
  let routingEngine: RoutingEngine;

  beforeEach(() => {
    app = express();
    routingEngine = new RoutingEngine();

    // Middleware setup
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(routingEngine.middleware());

    // Mock upstream responses
    app.use((req, res, next) => {
      if (req.routeMatch) {
        const { route, params } = req.routeMatch;
        
        switch (route.id) {
          case 'users-get':
            res.json({ user: { id: params.id, name: 'Test User' } });
            break;
          case 'users-create':
            res.status(201).json({ message: 'User created', user: req.body });
            break;
          case 'health-check':
            res.json({ status: 'healthy' });
            break;
          default:
            res.status(502).json({ error: 'Service unavailable' });
        }
      } else {
        next();
      }
    });
  });

  describe('Route Registration and Matching', () => {
    it('should handle GET request to parameterized route', async () => {
      const route: RouteConfig = {
        id: 'users-get',
        path: '/api/users/:id',
        methods: ['GET'],
        upstream: 'http://user-service:3000',
        authentication: false,
        version: '1.0.0',
        enabled: true,
        metadata: {}
      };

      routingEngine.registerRoute(route);

      const response = await request(app)
        .get('/api/users/123')
        .expect(200);

      expect(response.body).toEqual({
        user: { id: '123', name: 'Test User' }
      });
      expect(response.headers['x-correlation-id']).toBeDefined();
    });

    it('should handle POST request with validation', async () => {
      const route: RouteConfig = {
        id: 'users-create',
        path: '/api/users',
        methods: ['POST'],
        upstream: 'http://user-service:3000',
        authentication: false,
        version: '1.0.0',
        enabled: true,
        metadata: {}
      };

      const validation: RouteValidation = {
        body: [
          { field: 'name', type: 'string', required: true, minLength: 2 },
          { field: 'email', type: 'string', required: true, pattern: '^[^@]+@[^@]+\\.[^@]+$' }
        ]
      };

      routingEngine.registerRoute(route, validation);

      // Valid request
      const validResponse = await request(app)
        .post('/api/users')
        .send({ name: 'John Doe', email: 'john@example.com' })
        .expect(201);

      expect(validResponse.body).toEqual({
        message: 'User created',
        user: { name: 'John Doe', email: 'john@example.com' }
      });

      // Invalid request - missing required field
      const invalidResponse = await request(app)
        .post('/api/users')
        .send({ name: 'John' })
        .expect(400);

      expect(invalidResponse.body.error.code).toBe('VALIDATION_ERROR');
      expect(invalidResponse.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'body.email',
            message: 'email is required'
          })
        ])
      );
    });

    it('should return 404 for non-matching routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body.error.code).toBe('ROUTE_NOT_FOUND');
      expect(response.body.error.message).toContain('No route found for GET /api/nonexistent');
    });

    it('should handle route specificity correctly', async () => {
      // Register less specific route first
      const genericRoute: RouteConfig = {
        id: 'users-generic',
        path: '/api/users/:id',
        methods: ['GET'],
        upstream: 'http://user-service:3000',
        authentication: false,
        version: '1.0.0',
        enabled: true,
        metadata: {}
      };

      // Register more specific route second
      const specificRoute: RouteConfig = {
        id: 'health-check',
        path: '/api/users/health',
        methods: ['GET'],
        upstream: 'http://health-service:3000',
        authentication: false,
        version: '1.0.0',
        enabled: true,
        metadata: {}
      };

      routingEngine.registerRoute(genericRoute);
      routingEngine.registerRoute(specificRoute);

      // Should match the more specific route
      const response = await request(app)
        .get('/api/users/health')
        .expect(200);

      expect(response.body).toEqual({ status: 'healthy' });
    });

    it('should handle disabled routes', async () => {
      const route: RouteConfig = {
        id: 'disabled-route',
        path: '/api/disabled',
        methods: ['GET'],
        upstream: 'http://service:3000',
        authentication: false,
        version: '1.0.0',
        enabled: false, // Disabled
        metadata: {}
      };

      routingEngine.registerRoute(route);

      const response = await request(app)
        .get('/api/disabled')
        .expect(404);

      expect(response.body.error.code).toBe('ROUTE_NOT_FOUND');
    });
  });

  describe('Request Processing', () => {
    beforeEach(() => {
      const route: RouteConfig = {
        id: 'users-get',
        path: '/api/users/:id',
        methods: ['GET'],
        upstream: 'http://user-service:3000',
        authentication: false,
        version: '1.0.0',
        enabled: true,
        metadata: {}
      };

      routingEngine.registerRoute(route);
    });

    it('should add correlation ID to response headers', async () => {
      const response = await request(app)
        .get('/api/users/123')
        .expect(200);

      expect(response.headers['x-correlation-id']).toBeDefined();
      expect(response.headers['x-correlation-id']).toMatch(/^rt-/);
    });

    it('should use existing correlation ID from request headers', async () => {
      const correlationId = 'test-correlation-id';

      const response = await request(app)
        .get('/api/users/123')
        .set('x-correlation-id', correlationId)
        .expect(200);

      expect(response.headers['x-correlation-id']).toBe(correlationId);
    });

    it('should handle URL encoded parameters', async () => {
      const response = await request(app)
        .get('/api/users/test%40example.com')
        .expect(200);

      expect(response.body.user.id).toBe('test@example.com');
    });
  });
});