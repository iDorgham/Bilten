import axios from 'axios';
import { ServiceRegistry } from '../../services/ServiceRegistry';
import { ServiceRegistration } from '../../services/types';
import { ConfigManager } from '../../config/ConfigManager';

// Mock dependencies
jest.mock('axios');
jest.mock('../../config/ConfigManager');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const MockedConfigManager = ConfigManager as jest.MockedClass<typeof ConfigManager>;

// Mock timers
jest.useFakeTimers();

describe('ServiceRegistry Integration', () => {
  let registry: ServiceRegistry;
  let mockConfigManager: jest.Mocked<ConfigManager>;
  let mockRegistration: ServiceRegistration;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();

    // Setup mock config manager
    mockConfigManager = new MockedConfigManager() as jest.Mocked<ConfigManager>;
    mockConfigManager.getConfig.mockReturnValue({
      services: {
        'user-service': { url: 'http://localhost:3001' },
        'event-service': { url: 'http://localhost:3002' }
      }
    } as any);

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

    registry = new ServiceRegistry({
      enabled: true,
      registrationTtl: 300,
      healthCheckInterval: 30,
      cleanupInterval: 60,
      retryAttempts: 3,
      retryDelay: 1000
    }, mockConfigManager);
  });

  afterEach(async () => {
    await registry.shutdown();
    jest.runOnlyPendingTimers();
  });

  describe('initialization', () => {
    it('should initialize with default services from config', async () => {
      mockedAxios.get.mockResolvedValue({ status: 200, data: { status: 'ok' } });

      await registry.initialize();

      // Check that default services are registered in both legacy and discovery systems
      const legacySummary = registry.getServiceSummary();
      const comprehensiveSummary = registry.getComprehensiveRegistrySummary();

      expect(legacySummary.totalServices).toBe(2);
      expect(comprehensiveSummary.discovery.totalServices).toBe(2);
    });

    it('should handle initialization errors gracefully', async () => {
      mockConfigManager.getConfig.mockImplementation(() => {
        throw new Error('Config error');
      });

      await expect(registry.initialize()).rejects.toThrow('Config error');
    });
  });

  describe('service registration with discovery', () => {
    beforeEach(async () => {
      mockedAxios.get.mockResolvedValue({ status: 200, data: { status: 'ok' } });
      await registry.initialize();
    });

    it('should register service in both legacy and discovery systems', async () => {
      await registry.registerServiceWithDiscovery(mockRegistration);

      // Check legacy system
      const legacyInstances = registry.getServiceInstances('test-service');
      expect(legacyInstances).toHaveLength(1);
      expect(legacyInstances[0].id).toBe('test-service-1');

      // Check discovery system
      const discoveredServices = registry.discoverServices('test-service');
      expect(discoveredServices).toHaveLength(1);
      expect(discoveredServices[0].id).toBe('test-service-1');
    });

    it('should unregister service from both systems', async () => {
      await registry.registerServiceWithDiscovery(mockRegistration);
      
      const result = await registry.unregisterServiceFromDiscovery('test-service', 'test-service-1');

      expect(result).toBe(true);
      expect(registry.getServiceInstances('test-service')).toHaveLength(0);
      expect(registry.discoverServices('test-service')).toHaveLength(0);
    });
  });

  describe('service selection and load balancing', () => {
    beforeEach(async () => {
      mockedAxios.get.mockResolvedValue({ status: 200, data: { status: 'ok' } });
      await registry.initialize();

      // Register multiple instances
      await registry.registerServiceWithDiscovery(mockRegistration);
      await registry.registerServiceWithDiscovery({
        ...mockRegistration,
        id: 'test-service-2',
        port: 3001
      });
      await registry.registerServiceWithDiscovery({
        ...mockRegistration,
        id: 'test-service-3',
        port: 3002,
        weight: 200
      });
    });

    it('should select service instance using round-robin', () => {
      const instance1 = registry.selectServiceInstance('test-service', 'round_robin');
      const instance2 = registry.selectServiceInstance('test-service', 'round_robin');
      const instance3 = registry.selectServiceInstance('test-service', 'round_robin');

      expect(instance1?.id).toBe('test-service-1');
      expect(instance2?.id).toBe('test-service-2');
      expect(instance3?.id).toBe('test-service-3');
    });

    it('should select service instance using weighted strategy', () => {
      const instance = registry.selectServiceInstance('test-service', 'weighted');
      expect(instance).toBeTruthy();
      expect(['test-service-1', 'test-service-2', 'test-service-3']).toContain(instance?.id);
    });

    it('should handle IP hash strategy', () => {
      const context = { clientIp: '192.168.1.100' };
      const instance1 = registry.selectServiceInstance('test-service', 'ip_hash', context);
      const instance2 = registry.selectServiceInstance('test-service', 'ip_hash', context);

      // Same IP should get same instance
      expect(instance1?.id).toBe(instance2?.id);
    });

    it('should return null when no healthy instances available', () => {
      // Mark all instances as unhealthy
      const discoveryClient = registry.getDiscoveryClient();
      discoveryClient.updateServiceHealth('test-service', 'test-service-1', 'unhealthy');
      discoveryClient.updateServiceHealth('test-service', 'test-service-2', 'unhealthy');
      discoveryClient.updateServiceHealth('test-service', 'test-service-3', 'unhealthy');

      const instance = registry.selectServiceInstance('test-service', 'round_robin');
      expect(instance).toBeNull();
    });
  });

  describe('health monitoring integration', () => {
    beforeEach(async () => {
      await registry.initialize();
      await registry.registerServiceWithDiscovery(mockRegistration);
    });

    it('should perform health checks and update service status', async () => {
      mockedAxios.get.mockResolvedValueOnce({ status: 200, data: { status: 'ok' } });

      // Trigger health check
      jest.advanceTimersByTime(30000);
      await Promise.resolve();

      const healthyInstances = registry.getHealthyInstancesFromDiscovery('test-service');
      expect(healthyInstances).toHaveLength(1);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:3000/health',
        expect.objectContaining({ timeout: 5000 })
      );
    });

    it('should mark service as unhealthy on failed health check', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Connection refused'));

      // Trigger health check
      jest.advanceTimersByTime(30000);
      await Promise.resolve();

      const healthyInstances = registry.getHealthyInstancesFromDiscovery('test-service');
      const allInstances = registry.discoverServices('test-service');

      expect(healthyInstances).toHaveLength(0);
      expect(allInstances[0].status).toBe('unhealthy');
    });

    it('should retry failed health checks', async () => {
      mockedAxios.get
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce({ status: 200, data: { status: 'ok' } });

      // Trigger health check
      jest.advanceTimersByTime(30000);
      await Promise.resolve();

      expect(mockedAxios.get).toHaveBeenCalledTimes(3);
    });
  });

  describe('service discovery events', () => {
    beforeEach(async () => {
      mockedAxios.get.mockResolvedValue({ status: 200, data: { status: 'ok' } });
      await registry.initialize();
    });

    it('should emit events for service lifecycle', async () => {
      const discoveryClient = registry.getDiscoveryClient();
      const eventSpy = jest.fn();
      
      discoveryClient.addEventHandler(eventSpy);

      // Register service
      await registry.registerServiceWithDiscovery(mockRegistration);
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'registered',
          service: expect.objectContaining({ id: 'test-service-1' })
        })
      );

      // Update service health
      discoveryClient.updateServiceHealth('test-service', 'test-service-1', 'unhealthy');
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'health_changed',
          service: expect.objectContaining({ status: 'unhealthy' })
        })
      );

      // Unregister service
      await registry.unregisterServiceFromDiscovery('test-service', 'test-service-1');
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'unregistered',
          service: expect.objectContaining({ id: 'test-service-1' })
        })
      );
    });
  });

  describe('comprehensive registry summary', () => {
    beforeEach(async () => {
      mockedAxios.get.mockResolvedValue({ status: 200, data: { status: 'ok' } });
      await registry.initialize();
    });

    it('should provide comprehensive summary of both systems', async () => {
      await registry.registerServiceWithDiscovery(mockRegistration);
      await registry.registerServiceWithDiscovery({
        ...mockRegistration,
        id: 'test-service-2',
        status: 'unhealthy'
      });

      const summary = registry.getComprehensiveRegistrySummary();

      expect(summary.legacy.totalServices).toBeGreaterThan(0);
      expect(summary.discovery.totalServices).toBeGreaterThan(0);
      expect(summary.discovery.totalInstances).toBeGreaterThan(0);
      expect(summary.discovery.healthyInstances).toBeGreaterThan(0);
      expect(summary.discovery.unhealthyInstances).toBeGreaterThan(0);
    });
  });

  describe('backward compatibility', () => {
    beforeEach(async () => {
      mockedAxios.get.mockResolvedValue({ status: 200, data: { status: 'ok' } });
      await registry.initialize();
    });

    it('should maintain backward compatibility with legacy methods', async () => {
      // Test legacy registration still works
      const legacyInstance = {
        id: 'legacy-1',
        name: 'legacy-service',
        version: '1.0.0',
        host: 'localhost',
        port: 4000,
        protocol: 'http' as const,
        weight: 100,
        tags: ['legacy'],
        status: 'healthy' as const,
        lastHealthCheck: new Date(),
        metadata: {},
        registeredAt: new Date(),
        updatedAt: new Date()
      };

      registry.registerService(legacyInstance);

      const instances = registry.getServiceInstances('legacy-service');
      expect(instances).toHaveLength(1);
      expect(instances[0].id).toBe('legacy-1');

      // Test legacy load balancing still works
      const selectedInstance = registry.getServiceInstance('legacy-service');
      expect(selectedInstance?.id).toBe('legacy-1');
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      mockedAxios.get.mockResolvedValue({ status: 200, data: { status: 'ok' } });
      await registry.initialize();
    });

    it('should handle service registration errors gracefully', async () => {
      const invalidRegistration = { ...mockRegistration, name: '' };
      
      await expect(registry.registerServiceWithDiscovery(invalidRegistration))
        .rejects.toThrow();
    });

    it('should handle health check failures gracefully', async () => {
      await registry.registerServiceWithDiscovery(mockRegistration);
      
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      // Should not throw, just log and update status
      jest.advanceTimersByTime(30000);
      await Promise.resolve();

      const instances = registry.discoverServices('test-service');
      expect(instances[0].status).toBe('unhealthy');
    });
  });

  describe('cleanup and shutdown', () => {
    it('should cleanup expired services', async () => {
      const shortTtlRegistry = new ServiceRegistry({
        enabled: true,
        registrationTtl: 1, // 1 second TTL
        cleanupInterval: 1
      }, mockConfigManager);

      mockedAxios.get.mockResolvedValue({ status: 200, data: { status: 'ok' } });
      await shortTtlRegistry.initialize();
      
      await shortTtlRegistry.registerServiceWithDiscovery(mockRegistration);
      expect(shortTtlRegistry.discoverServices('test-service')).toHaveLength(1);

      // Fast-forward past TTL and cleanup interval
      jest.advanceTimersByTime(2000);
      
      expect(shortTtlRegistry.discoverServices('test-service')).toHaveLength(0);
      
      await shortTtlRegistry.shutdown();
    });

    it('should shutdown gracefully', async () => {
      mockedAxios.get.mockResolvedValue({ status: 200, data: { status: 'ok' } });
      await registry.initialize();
      await registry.registerServiceWithDiscovery(mockRegistration);

      await expect(registry.shutdown()).resolves.not.toThrow();

      // Verify cleanup
      expect(registry.getServiceSummary().totalInstances).toBe(0);
    });
  });
});