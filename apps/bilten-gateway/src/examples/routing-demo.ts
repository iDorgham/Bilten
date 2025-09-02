/**
 * Simple demonstration of the routing engine functionality
 */

import { RoutingEngine } from '../routing/RoutingEngine';
import { RouteConfig, RouteValidation } from '../routing/types';

// Create routing engine instance
const routingEngine = new RoutingEngine();

// Define sample routes
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

// Define validation rules
const validationRules: Record<string, RouteValidation> = {
  'users-create': {
    body: [
      { field: 'name', type: 'string', required: true, minLength: 2, maxLength: 50 },
      { field: 'email', type: 'string', required: true, pattern: '^[^@]+@[^@]+\\.[^@]+$' },
      { field: 'age', type: 'number', required: false }
    ]
  }
};

// Register routes
console.log('🚀 Registering routes...\n');
routes.forEach(route => {
  const validation = validationRules[route.id];
  routingEngine.registerRoute(route, validation);
  console.log(`✅ Registered: ${route.methods.join(',')} ${route.path} -> ${route.upstream}`);
});

console.log('\n📋 Route Registration Summary:');
console.log(`Total routes registered: ${routingEngine.getRoutes().length}`);

// Demonstrate route matching
console.log('\n🔍 Testing Route Matching:\n');

const testRequests = [
  { method: 'GET', path: '/health' },
  { method: 'GET', path: '/api/users' },
  { method: 'GET', path: '/api/users/123' },
  { method: 'GET', path: '/api/users/profile' },
  { method: 'GET', path: '/api/events' },
  { method: 'POST', path: '/api/users' },
  { method: 'GET', path: '/api/nonexistent' },
  { method: 'DELETE', path: '/api/users/123' }
];

testRequests.forEach(({ method, path }) => {
  const match = routingEngine.findRoute(method, path);
  
  if (match) {
    console.log(`✅ ${method} ${path}`);
    console.log(`   → Route: ${match.route.id}`);
    console.log(`   → Upstream: ${match.route.upstream}`);
    console.log(`   → Params: ${JSON.stringify(match.params)}`);
    console.log(`   → Auth Required: ${match.route.authentication}`);
  } else {
    console.log(`❌ ${method} ${path} - No matching route`);
  }
  console.log('');
});

// Demonstrate route specificity
console.log('🎯 Route Specificity Demonstration:\n');
const sortedRoutes = routingEngine.getRoutes();
console.log('Routes sorted by specificity (most specific first):');
sortedRoutes.forEach((route, index) => {
  console.log(`${index + 1}. ${route.methods.join(',')} ${route.path} (${route.id})`);
});

// Demonstrate route management
console.log('\n⚙️  Route Management:\n');

// Update a route
console.log('Disabling users-get route...');
const updateResult = routingEngine.updateRoute('users-get', { enabled: false });
console.log(`Update result: ${updateResult}`);

// Test matching after update
const matchAfterUpdate = routingEngine.findRoute('GET', '/api/users/123');
console.log(`Matching /api/users/123 after disabling: ${matchAfterUpdate ? 'Found' : 'Not found'}`);

// Re-enable the route
routingEngine.updateRoute('users-get', { enabled: true });
console.log('Re-enabled users-get route');

// Demonstrate correlation ID generation
console.log('\n🔗 Correlation ID Generation:\n');
const mockRequest = {
  method: 'GET',
  path: '/api/users/123',
  headers: {},
  query: {},
  body: {}
} as any;

const context1 = routingEngine.createRoutingContext(mockRequest);
const context2 = routingEngine.createRoutingContext(mockRequest);

console.log(`Generated correlation ID 1: ${context1.correlationId}`);
console.log(`Generated correlation ID 2: ${context2.correlationId}`);
console.log(`IDs are unique: ${context1.correlationId !== context2.correlationId}`);

// Test with existing correlation ID
mockRequest.headers['x-correlation-id'] = 'existing-correlation-id';
const context3 = routingEngine.createRoutingContext(mockRequest);
console.log(`Using existing correlation ID: ${context3.correlationId}`);

console.log('\n✨ Routing Engine Demo Complete!');