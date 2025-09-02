/**
 * Example demonstrating the routing engine functionality
 */

import express from 'express';
import { RoutingEngine } from '../routing/RoutingEngine';
import { RouteConfig, RouteValidation } from '../routing/types';

// Create Express app and routing engine
const app = express();
const routingEngine = new RoutingEngine();

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Example route configurations
const routes: RouteConfig[] = [
  {
    id: 'users-list',
    path: '/api/users',
    methods: ['GET'],
    upstream: 'http://user-service:3000',
    authentication: true,
    version: '1.0.0',
    enabled: true,
    metadata: { description: 'List all users' }
  },
  {
    id: 'users-create',
    path: '/api/users',
    methods: ['POST'],
    upstream: 'http://user-service:3000',
    authentication: true,
    version: '1.0.0',
    enabled: true,
    metadata: { description: 'Create a new user' }
  },
  {
    id: 'users-get',
    path: '/api/users/:id',
    methods: ['GET'],
    upstream: 'http://user-service:3000',
    authentication: true,
    version: '1.0.0',
    enabled: true,
    metadata: { description: 'Get user by ID' }
  },
  {
    id: 'users-profile',
    path: '/api/users/profile',
    methods: ['GET'],
    upstream: 'http://user-service:3000',
    authentication: true,
    version: '1.0.0',
    enabled: true,
    metadata: { description: 'Get current user profile' }
  },
  {
    id: 'events-list',
    path: '/api/events',
    methods: ['GET'],
    upstream: 'http://event-service:3000',
    authentication: false,
    version: '1.0.0',
    enabled: true,
    metadata: { description: 'List public events' }
  },
  {
    id: 'events-create',
    path: '/api/events',
    methods: ['POST'],
    upstream: 'http://event-service:3000',
    authentication: true,
    version: '1.0.0',
    enabled: true,
    metadata: { description: 'Create a new event' }
  },
  {
    id: 'health-check',
    path: '/health',
    methods: ['GET'],
    upstream: 'http://localhost:3000',
    authentication: false,
    version: '1.0.0',
    enabled: true,
    metadata: { description: 'Health check endpoint' }
  }
];

// Example validation rules
const validationRules: Record<string, RouteValidation> = {
  'users-create': {
    body: [
      { field: 'name', type: 'string', required: true, minLength: 2, maxLength: 50 },
      { field: 'email', type: 'string', required: true, pattern: '^[^@]+@[^@]+\\.[^@]+$' },
      { field: 'age', type: 'number', required: false }
    ]
  },
  'events-create': {
    body: [
      { field: 'title', type: 'string', required: true, minLength: 5, maxLength: 100 },
      { field: 'description', type: 'string', required: true, minLength: 10 },
      { field: 'date', type: 'string', required: true },
      { field: 'category', type: 'string', required: true, enum: ['conference', 'workshop', 'meetup', 'webinar'] }
    ]
  }
};

// Register routes with the routing engine
routes.forEach(route => {
  const validation = validationRules[route.id];
  routingEngine.registerRoute(route, validation);
});

// Apply routing middleware
app.use(routingEngine.middleware());

// Mock upstream service responses for demonstration
app.use((req, res, next) => {
  if (req.routeMatch) {
    const { route, params } = req.routeMatch;
    
    // Mock response based on route
    switch (route.id) {
      case 'users-list':
        res.json({
          users: [
            { id: 1, name: 'John Doe', email: 'john@example.com' },
            { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
          ]
        });
        break;
        
      case 'users-get':
        res.json({
          user: { id: params.id, name: 'John Doe', email: 'john@example.com' }
        });
        break;
        
      case 'users-profile':
        res.json({
          user: { id: 'current', name: 'Current User', email: 'current@example.com' }
        });
        break;
        
      case 'users-create':
        res.status(201).json({
          message: 'User created successfully',
          user: { id: 3, ...req.body }
        });
        break;
        
      case 'events-list':
        res.json({
          events: [
            { id: 1, title: 'Tech Conference 2024', category: 'conference' },
            { id: 2, title: 'React Workshop', category: 'workshop' }
          ]
        });
        break;
        
      case 'events-create':
        res.status(201).json({
          message: 'Event created successfully',
          event: { id: 3, ...req.body }
        });
        break;
        
      case 'health-check':
        res.json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        });
        break;
        
      default:
        res.status(502).json({
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Upstream service not available'
          }
        });
    }
  } else {
    next();
  }
});

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An internal error occurred'
    }
  });
});

// Start server for demonstration
const PORT = process.env.PORT || 3001;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Routing engine example server running on port ${PORT}`);
    console.log('\nAvailable routes:');
    routingEngine.getRoutes().forEach(route => {
      console.log(`  ${route.methods.join(',')} ${route.path} -> ${route.upstream}`);
    });
    
    console.log('\nExample requests:');
    console.log(`  GET http://localhost:${PORT}/health`);
    console.log(`  GET http://localhost:${PORT}/api/events`);
    console.log(`  GET http://localhost:${PORT}/api/users/123`);
    console.log(`  GET http://localhost:${PORT}/api/users/profile`);
    console.log(`  POST http://localhost:${PORT}/api/users (with body: {"name": "Test User", "email": "test@example.com"})`);
  });
}

export { app, routingEngine };