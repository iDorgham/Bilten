/**
 * Service Discovery Demo
 * 
 * This example demonstrates how to use the Service Discovery Client
 * for dynamic service registration, health monitoring, and load balancing.
 */

import { ServiceDiscoveryClient } from '../services/ServiceDiscoveryClient';
import { ServiceRegistry } from '../services/ServiceRegistry';
import { ServiceRegistration } from '../services/types';

async function serviceDiscoveryDemo() {
  console.log('🚀 Starting Service Discovery Demo...\n');

  // Initialize Service Discovery Client
  const discoveryClient = new ServiceDiscoveryClient({
    enabled: true,
    registrationTtl: 300, // 5 minutes
    healthCheckInterval: 30, // 30 seconds
    cleanupInterval: 60, // 1 minute
    retryAttempts: 3,
    retryDelay: 1000 // 1 second
  });

  await discoveryClient.initialize();

  // Register multiple service instances
  const userService1: ServiceRegistration = {
    id: 'user-service-1',
    name: 'user-service',
    version: '1.0.0',
    host: 'localhost',
    port: 3001,
    protocol: 'http',
    basePath: '/api/v1',
    healthCheck: {
      endpoint: '/health',
      interval: 30,
      timeout: 5,
      retries: 3
    },
    weight: 100,
    tags: ['api', 'users'],
    status: 'healthy',
    lastHealthCheck: new Date(),
    metadata: {
      region: 'us-east-1',
      zone: 'us-east-1a',
      capabilities: ['rest', 'graphql']
    },
    registeredAt: new Date(),
    updatedAt: new Date()
  };

  const userService2: ServiceRegistration = {
    ...userService1,
    id: 'user-service-2',
    port: 3002,
    weight: 150, // Higher weight for better performance
    metadata: {
      ...userService1.metadata,
      zone: 'us-east-1b'
    }
  };

  const eventService: ServiceRegistration = {
    id: 'event-service-1',
    name: 'event-service',
    version: '2.0.0',
    host: 'localhost',
    port: 3003,
    protocol: 'http',
    basePath: '/api/v2',
    healthCheck: {
      endpoint: '/health',
      interval: 30,
      timeout: 5,
      retries: 3
    },
    weight: 100,
    tags: ['api', 'events'],
    status: 'healthy',
    lastHealthCheck: new Date(),
    metadata: {
      region: 'us-east-1',
      zone: 'us-east-1c',
      capabilities: ['rest', 'websocket']
    },
    registeredAt: new Date(),
    updatedAt: new Date()
  };

  console.log('📝 Registering services...');
  await discoveryClient.registerService(userService1);
  await discoveryClient.registerService(userService2);
  await discoveryClient.registerService(eventService);

  // Add event handler to monitor service changes
  discoveryClient.addEventHandler((event) => {
    console.log(`📡 Service Event: ${event.type} - ${event.service.name}/${event.service.id}`);
  });

  // Demonstrate service discovery
  console.log('\n🔍 Discovering services...');
  const userServices = discoveryClient.discoverServices('user-service');
  console.log(`Found ${userServices.length} user service instances:`);
  userServices.forEach(service => {
    console.log(`  - ${service.id} at ${service.host}:${service.port} (weight: ${service.weight})`);
  });

  const eventServices = discoveryClient.discoverServices('event-service');
  console.log(`Found ${eventServices.length} event service instances:`);
  eventServices.forEach(service => {
    console.log(`  - ${service.id} at ${service.host}:${service.port} (version: ${service.version})`);
  });

  // Demonstrate load balancing strategies
  console.log('\n⚖️ Testing load balancing strategies...');
  
  console.log('Round-robin selection:');
  for (let i = 0; i < 5; i++) {
    const instance = discoveryClient.selectServiceInstance('user-service', 'round_robin');
    console.log(`  Request ${i + 1}: ${instance?.id} (${instance?.host}:${instance?.port})`);
  }

  console.log('\nWeighted selection (5 attempts):');
  for (let i = 0; i < 5; i++) {
    const instance = discoveryClient.selectServiceInstance('user-service', 'weighted');
    console.log(`  Request ${i + 1}: ${instance?.id} (weight: ${instance?.weight})`);
  }

  console.log('\nRandom selection (3 attempts):');
  for (let i = 0; i < 3; i++) {
    const instance = discoveryClient.selectServiceInstance('user-service', 'random');
    console.log(`  Request ${i + 1}: ${instance?.id}`);
  }

  // Demonstrate health status management
  console.log('\n🏥 Testing health status management...');
  console.log('Marking user-service-1 as unhealthy...');
  discoveryClient.updateServiceHealth('user-service', 'user-service-1', 'unhealthy');

  const healthyInstances = discoveryClient.getHealthyInstances('user-service');
  console.log(`Healthy user service instances: ${healthyInstances.length}`);
  healthyInstances.forEach(service => {
    console.log(`  - ${service.id} (status: ${service.status})`);
  });

  // Test load balancing with unhealthy instance
  console.log('\nLoad balancing with unhealthy instance:');
  for (let i = 0; i < 3; i++) {
    const instance = discoveryClient.selectServiceInstance('user-service', 'round_robin');
    console.log(`  Request ${i + 1}: ${instance?.id || 'No healthy instances'}`);
  }

  // Restore health
  console.log('\nRestoring user-service-1 to healthy...');
  discoveryClient.updateServiceHealth('user-service', 'user-service-1', 'healthy');

  // Get registry summary
  console.log('\n📊 Registry Summary:');
  const summary = discoveryClient.getRegistrySummary();
  console.log(`Total services: ${summary.totalServices}`);
  console.log(`Total instances: ${summary.totalInstances}`);
  console.log(`Healthy instances: ${summary.healthyInstances}`);
  console.log(`Unhealthy instances: ${summary.unhealthyInstances}`);
  console.log(`Draining instances: ${summary.drainingInstances}`);

  // Demonstrate ServiceRegistry integration
  console.log('\n🔗 Testing ServiceRegistry integration...');
  const registry = new ServiceRegistry({
    enabled: true,
    registrationTtl: 300,
    healthCheckInterval: 30,
    cleanupInterval: 60,
    retryAttempts: 3,
    retryDelay: 1000
  });

  await registry.initialize();

  // Register a service through the registry
  const paymentService: ServiceRegistration = {
    id: 'payment-service-1',
    name: 'payment-service',
    version: '1.0.0',
    host: 'localhost',
    port: 3004,
    protocol: 'https',
    basePath: '/api/v1',
    healthCheck: {
      endpoint: '/health',
      interval: 30,
      timeout: 5,
      retries: 3
    },
    weight: 100,
    tags: ['api', 'payments', 'secure'],
    status: 'healthy',
    lastHealthCheck: new Date(),
    metadata: {
      region: 'us-east-1',
      zone: 'us-east-1a',
      capabilities: ['rest', 'webhooks']
    },
    registeredAt: new Date(),
    updatedAt: new Date()
  };

  await registry.registerServiceWithDiscovery(paymentService);

  // Test service selection through registry
  const selectedPaymentService = registry.selectServiceInstance('payment-service', 'round_robin');
  console.log(`Selected payment service: ${selectedPaymentService?.id} at ${selectedPaymentService?.protocol}://${selectedPaymentService?.host}:${selectedPaymentService?.port}`);

  // Get comprehensive summary
  const comprehensiveSummary = registry.getComprehensiveRegistrySummary();
  console.log('\nComprehensive Registry Summary:');
  console.log('Legacy system:', comprehensiveSummary.legacy);
  console.log('Discovery system:', comprehensiveSummary.discovery);

  // Cleanup
  console.log('\n🧹 Cleaning up...');
  await discoveryClient.shutdown();
  await registry.shutdown();

  console.log('✅ Service Discovery Demo completed!');
}

// Run the demo if this file is executed directly
if (require.main === module) {
  serviceDiscoveryDemo().catch(console.error);
}

export { serviceDiscoveryDemo };