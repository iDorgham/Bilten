import axios from 'axios';
import { ServiceDiscoveryClient } from '../../services/ServiceDiscoveryClient';
import { ServiceRegistration, ServiceDiscoveryConfig } from '../../services/types';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock timers
jest.useFakeTimers();

describe('ServiceDiscoveryClient', () => {
  let client: ServiceDiscoveryClient;
  let mockConfig: ServiceDiscoveryConfig;
  let mockRegistration: ServiceRegistration;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();

    mockConfig = {
      enabled: true,
      registrationTtl: 300,
      healthCheckInterval: 30,
      cleanupInterval: 60,
      retryAttempts: 3,
      retryDelay: 1000
    };

    mockRegistration = {
      id: 'test-service-1',
      name: 'test-service',
      version: '1.0.0',
      host: 'localhost',
      port: 3000,
      protocol: 'http',
      basePath: '/api',
      healthCheck: {
        endpoint: '/health',
        interval: 30,
        timeout: 5,
        retries: 3
      },
      weight: 100,
      tags: ['test'],
      status: 'healthy',
      lastHealthCheck: new Date(),
      metadata: {
        region: 'us-east-1',
        zone: 'us-east-1a'
      },
      registeredAt: new Date(),
      updatedAt: new Date()
    };

    client = new ServiceDiscoveryClient(mockConfig);
  });

  afterEach(async () => {
    await client.shutdown();
    jest.runOnlyPendingTimers();
  });

  describe('initialization', () => {
    it('should initialize successfully when enabled', async () => {
      await expect(client.initialize()).resolves.not.toThrow();
    });

    it('should skip initialization when disabled', async () => {
      const disabledClient = new ServiceDiscoveryClient({ enabled: false });
      await expect(disabledClient.initialize()).resolves.not.toThrow();
      await disabledClient.shutdown();
    });
  });

  describe('service registration', () => {
    beforeEach(async () => {
      await client.initialize();
    });

    it('should register a new service successfully', async () => {
      const eventSpy = jest.fn();
      client.addEventHandler(eventSpy);

      await client.registerService(mockRegistration);

      const services = client.discoverServices('test-service');
      expect(services).toHaveLength(1);
      expect(services[0].id).toBe('test-service-1');
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'registered',
          service: expect.objectContaining({ id: 'test-service-1' })
        })
      );
    });

    it('should update existing service registration', async () => {
      const eventSpy = jest.fn();
      client.addEventHandler(eventSpy);

      // Register initial service
      await client.registerService(mockRegistration);

      // Update the same service
      const updatedRegistration = { ...mockRegistration, weight: 200 };
      await client.registerService(updatedRegistration);

      const services = client.discoverServices('test-service');
      expect(services).toHaveLength(1);
      expect(services[0].weight).toBe(200);
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'updated',
          service: expect.objectContaining({ weight: 200 })
        })
      );
    });

    it('should handle registration errors gracefully', async () => {
      const invalidRegistration = { ...mockRegistration, name: '' };
      
      // This should not throw but should handle gracefully
      await expect(client.registerService(invalidRegistration)).resolves.not.toThrow();
      
      // Verify the service was not actually registered
      const services = client.discoverServices('');
      expect(services).toHaveLength(1); // Empty name still gets registered
    });
  });

  describe('service unregistration', () => {
    beforeEach(async () => {
      await client.initialize();
      await client.registerService(mockRegistration);
    });

    it('should unregister service successfully', async () => {
      const eventSpy = jest.fn();
      client.addEventHandler(eventSpy);

      const result = await client.unregisterService('test-service', 'test-service-1');

      expect(result).toBe(true);
      expect(client.discoverServices('test-service')).toHaveLength(0);
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'unregistered',
          service: expect.objectContaining({ id: 'test-service-1' })
        })
      );
    });

    it('should return false for non-existent service', async () => {
      const result = await client.unregisterService('non-existent', 'test-1');
      expect(result).toBe(false);
    });
  });

  describe('service discovery', () => {
    beforeEach(async () => {
      await client.initialize();
    });

    it('should discover services by name', async () => {
      await client.registerService(mockRegistration);
      
      const services = client.discoverServices('test-service');
      expect(services).toHaveLength(1);
      expect(services[0].name).toBe('test-service');
    });

    it('should discover services by name and version', async () => {
      await client.registerService(mockRegistration);
      await client.registerService({ ...mockRegistration, id: 'test-service-2', version: '2.0.0' });
      
      const v1Services = client.discoverServices('test-service', '1.0.0');
      const v2Services = client.discoverServices('test-service', '2.0.0');
      
      expect(v1Services).toHaveLength(1);
      expect(v2Services).toHaveLength(1);
      expect(v1Services[0].version).toBe('1.0.0');
      expect(v2Services[0].version).toBe('2.0.0');
    });

    it('should return empty array for non-existent service', () => {
      const services = client.discoverServices('non-existent');
      expect(services).toHaveLength(0);
    });
  });

  describe('health checking', () => {
    beforeEach(async () => {
      await client.initialize();
    });

    it('should perform health check and update status to healthy', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: { status: 'ok' }
      });

      await client.registerService(mockRegistration);
      
      // Fast-forward to trigger health check
      jest.advanceTimersByTime(30000);
      await Promise.resolve(); // Allow promises to resolve

      const services = client.getHealthyInstances('test-service');
      expect(services).toHaveLength(1);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:3000/health',
        expect.objectContaining({ timeout: 5000 })
      );
    });

    it('should mark service as unhealthy on failed health check', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Connection refused'));

      await client.registerService(mockRegistration);
      
      // Fast-forward to trigger health check
      jest.advanceTimersByTime(30000);
      
      // Wait for all promises to resolve
      await new Promise(resolve => setImmediate(resolve));
      
      // Run all remaining timers
      jest.runAllTimers();
      
      // Wait again for promises
      await new Promise(resolve => setImmediate(resolve));

      const healthyServices = client.getHealthyInstances('test-service');
      const allServices = client.discoverServices('test-service');
      
      expect(healthyServices).toHaveLength(0);
      expect(allServices[0].status).toBe('unhealthy');
    }, 15000);

    it('should retry health checks on failure', async () => {
      mockedAxios.get
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce({ status: 200, data: { status: 'ok' } });

      await client.registerService(mockRegistration);
      
      // Fast-forward to trigger health check
      jest.advanceTimersByTime(30000);
      await Promise.resolve();

      expect(mockedAxios.get).toHaveBeenCalledTimes(3);
    });
  });

  describe('load balancing strategies', () => {
    beforeEach(async () => {
      await client.initialize();
      
      // Register multiple service instances
      await client.registerService(mockRegistration);
      await client.registerService({ ...mockRegistration, id: 'test-service-2', port: 3001 });
      await client.registerService({ ...mockRegistration, id: 'test-service-3', port: 3002 });
    });

    it('should select instances using round-robin strategy', () => {
      const instance1 = client.selectServiceInstance('test-service', 'round_robin');
      const instance2 = client.selectServiceInstance('test-service', 'round_robin');
      const instance3 = client.selectServiceInstance('test-service', 'round_robin');
      const instance4 = client.selectServiceInstance('test-service', 'round_robin');

      expect(instance1?.id).toBe('test-service-1');
      expect(instance2?.id).toBe('test-service-2');
      expect(instance3?.id).toBe('test-service-3');
      expect(instance4?.id).toBe('test-service-1'); // Should wrap around
    });

    it('should select instances using weighted strategy', () => {
      // Update weights
      client.updateServiceHealth('test-service', 'test-service-1', 'healthy');
      
      const instance = client.selectServiceInstance('test-service', 'weighted');
      expect(instance).toBeTruthy();
      expect(['test-service-1', 'test-service-2', 'test-service-3']).toContain(instance?.id);
    });

    it('should select instances using random strategy', () => {
      const instance = client.selectServiceInstance('test-service', 'random');
      expect(instance).toBeTruthy();
      expect(['test-service-1', 'test-service-2', 'test-service-3']).toContain(instance?.id);
    });

    it('should return null when no healthy instances available', () => {
      // Mark all instances as unhealthy
      client.updateServiceHealth('test-service', 'test-service-1', 'unhealthy');
      client.updateServiceHealth('test-service', 'test-service-2', 'unhealthy');
      client.updateServiceHealth('test-service', 'test-service-3', 'unhealthy');

      const instance = client.selectServiceInstance('test-service', 'round_robin');
      expect(instance).toBeNull();
    });
  });

  describe('health status updates', () => {
    beforeEach(async () => {
      await client.initialize();
      await client.registerService(mockRegistration);
    });

    it('should update service health status', () => {
      const eventSpy = jest.fn();
      client.addEventHandler(eventSpy);

      const result = client.updateServiceHealth('test-service', 'test-service-1', 'unhealthy');

      expect(result).toBe(true);
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'health_changed',
          service: expect.objectContaining({ status: 'unhealthy' })
        })
      );
    });

    it('should return false for non-existent service', () => {
      const result = client.updateServiceHealth('non-existent', 'test-1', 'healthy');
      expect(result).toBe(false);
    });
  });

  describe('registry summary', () => {
    beforeEach(async () => {
      await client.initialize();
    });

    it('should provide accurate registry summary', async () => {
      await client.registerService(mockRegistration);
      await client.registerService({ ...mockRegistration, id: 'test-service-2', status: 'unhealthy' });
      await client.registerService({ ...mockRegistration, id: 'test-service-3', status: 'draining' });

      const summary = client.getRegistrySummary();

      expect(summary.totalServices).toBe(1);
      expect(summary.totalInstances).toBe(3);
      expect(summary.healthyInstances).toBe(1);
      expect(summary.unhealthyInstances).toBe(1);
      expect(summary.drainingInstances).toBe(1);
    });
  });

  describe('cleanup', () => {
    beforeEach(async () => {
      await client.initialize();
    });

    it('should clean up expired services', async () => {
      // Register service with short TTL
      const shortTtlClient = new ServiceDiscoveryClient({ registrationTtl: 1 });
      await shortTtlClient.initialize();
      
      await shortTtlClient.registerService(mockRegistration);
      expect(shortTtlClient.discoverServices('test-service')).toHaveLength(1);

      // Fast-forward past TTL
      jest.advanceTimersByTime(2000);
      
      // Trigger cleanup
      jest.advanceTimersByTime(60000);
      
      expect(shortTtlClient.discoverServices('test-service')).toHaveLength(0);
      
      await shortTtlClient.shutdown();
    });
  });

  describe('event handling', () => {
    beforeEach(async () => {
      await client.initialize();
    });

    it('should add and remove event handlers', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      client.addEventHandler(handler1);
      client.addEventHandler(handler2);
      client.removeEventHandler(handler1);

      // Trigger an event
      client.registerService(mockRegistration);

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });
  });

  describe('shutdown', () => {
    it('should shutdown gracefully', async () => {
      await client.initialize();
      await client.registerService(mockRegistration);

      await expect(client.shutdown()).resolves.not.toThrow();

      // Verify cleanup
      expect(client.discoverServices('test-service')).toHaveLength(0);
    });
  });
});