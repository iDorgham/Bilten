/**
 * Integration tests for request/response transformation
 */

import request from 'supertest';
import express from 'express';
import { TransformationMiddleware } from '../../middleware/TransformationMiddleware';
import { RoutingEngine } from '../../routing/RoutingEngine';
import { TransformationRule } from '../../routing/types';

// Mock Logger
jest.mock('../../utils/Logger', () => ({
  Logger: {
    getInstance: () => ({
      debug: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      http: jest.fn()
    })
  }
}));

describe('Transformation Integration Tests', () => {
  let app: express.Application;
  let routingEngine: RoutingEngine;

  beforeEach(() => {
    app = express();
    routingEngine = new RoutingEngine();

    // Setup basic middleware
    app.use(express.json());
    
    // Setup routing engine
    app.use(routingEngine.middleware());
    
    // Setup transformation middleware
    app.use(TransformationMiddleware.transformRequest());
    app.use(TransformationMiddleware.transformResponse());
  });

  describe('Request Transformation', () => {
    it('should transform request headers', async () => {
      // Register route with transformation
      const transformationRule: TransformationRule = {
        requestTransform: {
          addHeaders: {
            'X-Service-Version': 'v2',
            'X-Gateway': 'bilten-gateway'
          },
          removeHeaders: ['X-Internal-Debug']
        }
      };

      routingEngine.registerRoute({
        id: 'test-route',
        path: '/api/test',
        methods: ['POST'],
        upstream: 'http://test-service',
        authentication: false,
        version: '1.0',
        enabled: true,
        metadata: {},
        transformation: transformationRule
      });

      // Setup test endpoint
      app.post('/api/test', (req, res) => {
        res.json({
          receivedHeaders: {
            'x-service-version': req.headers['x-service-version'],
            'x-gateway': req.headers['x-gateway'],
            'x-internal-debug': req.headers['x-internal-debug']
          }
        });
      });

      const response = await request(app)
        .post('/api/test')
        .set('X-Internal-Debug', 'should-be-removed')
        .send({ test: 'data' });

      expect(response.status).toBe(200);
      expect(response.body.receivedHeaders['x-service-version']).toBe('v2');
      expect(response.body.receivedHeaders['x-gateway']).toBe('bilten-gateway');
      expect(response.body.receivedHeaders['x-internal-debug']).toBeUndefined();
    });

    it('should transform request path', async () => {
      const transformationRule: TransformationRule = {
        requestTransform: {
          modifyPath: {
            stripPrefix: '/api/v1',
            addPrefix: '/v2/api'
          }
        }
      };

      routingEngine.registerRoute({
        id: 'path-transform-route',
        path: '/api/v1/users',
        methods: ['GET'],
        upstream: 'http://user-service',
        authentication: false,
        version: '1.0',
        enabled: true,
        metadata: {},
        transformation: transformationRule
      });

      // Setup test endpoint to capture transformed path
      app.get('/v2/api/users', (req, res) => {
        res.json({ transformedPath: req.url });
      });

      const response = await request(app)
        .get('/api/v1/users');

      expect(response.status).toBe(200);
      expect(response.body.transformedPath).toBe('/v2/api/users');
    });
  });

  describe('Response Transformation', () => {
    it('should transform response headers and body', async () => {
      const transformationRule: TransformationRule = {
        responseTransform: {
          addHeaders: {
            'X-API-Version': '2.0',
            'Cache-Control': 'public, max-age=300'
          },
          removeHeaders: ['X-Internal-Info'],
          fieldSelection: ['id', 'name', 'profile.email']
        }
      };

      routingEngine.registerRoute({
        id: 'response-transform-route',
        path: '/api/users',
        methods: ['GET'],
        upstream: 'http://user-service',
        authentication: false,
        version: '1.0',
        enabled: true,
        metadata: {},
        transformation: transformationRule
      });

      // Setup test endpoint
      app.get('/api/users', (_req, res) => {
        res.setHeader('X-Internal-Info', 'should-be-removed');
        res.json({
          id: 1,
          name: 'John Doe',
          password: 'secret',
          profile: {
            email: 'john@example.com',
            phone: '123-456-7890'
          },
          internalData: 'sensitive'
        });
      });

      const response = await request(app)
        .get('/api/users');

      expect(response.status).toBe(200);
      expect(response.headers['x-api-version']).toBe('2.0');
      expect(response.headers['cache-control']).toBe('public, max-age=300');
      expect(response.headers['x-internal-info']).toBeUndefined();
      
      expect(response.body).toEqual({
        id: 1,
        name: 'John Doe',
        profile: {
          email: 'john@example.com'
        }
      });
      
      expect(response.body.password).toBeUndefined();
      expect(response.body.internalData).toBeUndefined();
      expect(response.body.profile?.phone).toBeUndefined();
    });

    it('should handle array responses with field selection', async () => {
      const transformationRule: TransformationRule = {
        responseTransform: {
          fieldSelection: ['id', 'name', 'status']
        }
      };

      routingEngine.registerRoute({
        id: 'array-transform-route',
        path: '/api/events',
        methods: ['GET'],
        upstream: 'http://event-service',
        authentication: false,
        version: '1.0',
        enabled: true,
        metadata: {},
        transformation: transformationRule
      });

      app.get('/api/events', (_req, res) => {
        res.json([
          {
            id: 1,
            name: 'Event 1',
            status: 'active',
            secretKey: 'secret1',
            internalNotes: 'internal1'
          },
          {
            id: 2,
            name: 'Event 2',
            status: 'draft',
            secretKey: 'secret2',
            internalNotes: 'internal2'
          }
        ]);
      });

      const response = await request(app)
        .get('/api/events');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        { id: 1, name: 'Event 1', status: 'active' },
        { id: 2, name: 'Event 2', status: 'draft' }
      ]);
      
      expect(response.body[0].secretKey).toBeUndefined();
      expect(response.body[0].internalNotes).toBeUndefined();
    });
  });

  describe('Combined Transformations', () => {
    it('should apply both request and response transformations', async () => {
      const transformationRule: TransformationRule = {
        requestTransform: {
          addHeaders: {
            'X-Request-ID': '{{correlationId}}',
            'X-Service': 'user-service'
          }
        },
        responseTransform: {
          addHeaders: {
            'X-Processed-By': 'gateway',
            'X-Response-Time': '{{timestamp}}'
          },
          fieldSelection: ['id', 'username', 'email', 'receivedHeaders']
        }
      };

      routingEngine.registerRoute({
        id: 'combined-transform-route',
        path: '/api/profile',
        methods: ['GET'],
        upstream: 'http://user-service',
        authentication: false,
        version: '1.0',
        enabled: true,
        metadata: {},
        transformation: transformationRule
      });

      app.get('/api/profile', (req, res) => {
        res.json({
          id: 123,
          username: 'johndoe',
          email: 'john@example.com',
          password: 'hashed-password',
          apiKey: 'secret-api-key',
          receivedHeaders: {
            'x-service': req.headers['x-service'],
            'x-request-id': req.headers['x-request-id']
          }
        });
      });

      const response = await request(app)
        .get('/api/profile');

      expect(response.status).toBe(200);
      
      // Check response headers
      expect(response.headers['x-processed-by']).toBe('gateway');
      expect(response.headers['x-response-time']).toBeDefined();
      
      // Check request transformation worked
      expect(response.body.receivedHeaders['x-service']).toBe('user-service');
      expect(response.body.receivedHeaders['x-request-id']).toBeDefined();
      
      // Check response body transformation
      expect(response.body.id).toBe(123);
      expect(response.body.username).toBe('johndoe');
      expect(response.body.email).toBe('john@example.com');
      expect(response.body.password).toBeUndefined();
      expect(response.body.apiKey).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle routes without transformations', async () => {
      routingEngine.registerRoute({
        id: 'no-transform-route',
        path: '/api/simple',
        methods: ['GET'],
        upstream: 'http://simple-service',
        authentication: false,
        version: '1.0',
        enabled: true,
        metadata: {}
      });

      app.get('/api/simple', (_req, res) => {
        res.json({ message: 'no transformation' });
      });

      const response = await request(app)
        .get('/api/simple');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('no transformation');
    });

    it('should handle non-JSON responses', async () => {
      const transformationRule: TransformationRule = {
        responseTransform: {
          addHeaders: {
            'X-Content-Type': 'text'
          }
        }
      };

      routingEngine.registerRoute({
        id: 'text-response-route',
        path: '/api/text',
        methods: ['GET'],
        upstream: 'http://text-service',
        authentication: false,
        version: '1.0',
        enabled: true,
        metadata: {},
        transformation: transformationRule
      });

      app.get('/api/text', (_req, res) => {
        res.send('Plain text response');
      });

      const response = await request(app)
        .get('/api/text');

      expect(response.status).toBe(200);
      expect(response.text).toBe('Plain text response');
      expect(response.headers['x-content-type']).toBe('text');
    });
  });
});