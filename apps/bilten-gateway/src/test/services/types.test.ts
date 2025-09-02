import { 
  ServiceRegistration, 
  ServiceDiscoveryConfig, 
  HealthCheckResult, 
  ServiceDiscoveryEvent,
  LoadBalancingStrategy,
  ResourceInfo
} from '../../services/types';

describe('Service Discovery Types', () => {
  describe('ServiceRegistration', () => {
    it('should create a valid service registration', () => {
      const registration: ServiceRegistration = {
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
        tags: ['test', 'api'],
        status: 'healthy',
        lastHealthCheck: new Date(),
        metadata: {
          region: 'us-east-1',
          zone: 'us-east-1a',
          capabilities: ['rest', 'graphql'],
          resources: {
            cpu: { cores: 4, usage: 50 },
            memory: { total: 8192, usage: 60 },
            connections: { active: 10, max: 100 }
          }
        },
        registeredAt: new Date(),
        updatedAt: new Date()
      };

      expect(registration.id).toBe('test-service-1');
      expect(registration.name).toBe('test-service');
      expect(registration.protocol).toBe('http');
      expect(registration.healthCheck.endpoint).toBe('/health');
      expect(registration.metadata.capabilities).toContain('rest');
    });

    it('should support optional fields', () => {
      const minimalRegistration: ServiceRegistration = {
        id: 'minimal-service',
        name: 'minimal',
        version: '1.0.0',
        host: 'localhost',
        port: 3000,
        protocol: 'https',
        healthCheck: {
          endpoint: '/health',
          interval: 30,
          timeout: 5,
          retries: 3
        },
        weight: 100,
        tags: [],
        status: 'healthy',
        lastHealthCheck: new Date(),
        metadata: {},
        registeredAt: new Date(),
        updatedAt: new Date()
      };

      expect(minimalRegistration.basePath).toBeUndefined();
      expect(minimalRegistration.metadata.region).toBeUndefined();
      expect(minimalRegistration.tags).toHaveLength(0);
    });
  });

  describe('ServiceDiscoveryConfig', () => {
    it('should create a valid configuration', () => {
      const config: ServiceDiscoveryConfig = {
        enabled: true,
        registrationTtl: 300,
        healthCheckInterval: 30,
        cleanupInterval: 60,
        retryAttempts: 3,
        retryDelay: 1000
      };

      expect(config.enabled).toBe(true);
      expect(config.registrationTtl).toBe(300);
      expect(config.healthCheckInterval).toBe(30);
    });

    it('should support disabled configuration', () => {
      const config: ServiceDiscoveryConfig = {
        enabled: false,
        registrationTtl: 0,
        healthCheckInterval: 0,
        cleanupInterval: 0,
        retryAttempts: 0,
        retryDelay: 0
      };

      expect(config.enabled).toBe(false);
    });
  });

  describe('HealthCheckResult', () => {
    it('should create a successful health check result', () => {
      const result: HealthCheckResult = {
        serviceId: 'test-service-1',
        serviceName: 'test-service',
        status: 'healthy',
        responseTime: 150,
        timestamp: new Date(),
        metadata: {
          httpStatus: 200,
          endpoint: '/health'
        }
      };

      expect(result.status).toBe('healthy');
      expect(result.responseTime).toBe(150);
      expect(result.error).toBeUndefined();
    });

    it('should create a failed health check result', () => {
      const result: HealthCheckResult = {
        serviceId: 'test-service-1',
        serviceName: 'test-service',
        status: 'unhealthy',
        responseTime: 5000,
        timestamp: new Date(),
        error: 'Connection timeout',
        metadata: {
          attempt: 3,
          finalAttempt: true
        }
      };

      expect(result.status).toBe('unhealthy');
      expect(result.error).toBe('Connection timeout');
      expect(result.metadata?.finalAttempt).toBe(true);
    });

    it('should handle timeout status', () => {
      const result: HealthCheckResult = {
        serviceId: 'test-service-1',
        serviceName: 'test-service',
        status: 'timeout',
        responseTime: 10000,
        timestamp: new Date(),
        error: 'Request timeout after 10s'
      };

      expect(result.status).toBe('timeout');
      expect(result.responseTime).toBe(10000);
    });
  });

  describe('ServiceDiscoveryEvent', () => {
    it('should create service registration event', () => {
      const service: ServiceRegistration = {
        id: 'test-service-1',
        name: 'test-service',
        version: '1.0.0',
        host: 'localhost',
        port: 3000,
        protocol: 'http',
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
        metadata: {},
        registeredAt: new Date(),
        updatedAt: new Date()
      };

      const event: ServiceDiscoveryEvent = {
        type: 'registered',
        service,
        timestamp: new Date(),
        metadata: {
          source: 'api',
          userId: 'admin'
        }
      };

      expect(event.type).toBe('registered');
      expect(event.service.id).toBe('test-service-1');
      expect(event.metadata?.source).toBe('api');
    });

    it('should create health change event', () => {
      const service: ServiceRegistration = {
        id: 'test-service-1',
        name: 'test-service',
        version: '1.0.0',
        host: 'localhost',
        port: 3000,
        protocol: 'http',
        healthCheck: {
          endpoint: '/health',
          interval: 30,
          timeout: 5,
          retries: 3
        },
        weight: 100,
        tags: ['test'],
        status: 'unhealthy',
        lastHealthCheck: new Date(),
        metadata: {},
        registeredAt: new Date(),
        updatedAt: new Date()
      };

      const event: ServiceDiscoveryEvent = {
        type: 'health_changed',
        service,
        timestamp: new Date(),
        metadata: {
          previousStatus: 'healthy',
          reason: 'health_check_failed'
        }
      };

      expect(event.type).toBe('health_changed');
      expect(event.service.status).toBe('unhealthy');
      expect(event.metadata?.previousStatus).toBe('healthy');
    });
  });

  describe('ResourceInfo', () => {
    it('should create complete resource information', () => {
      const resources: ResourceInfo = {
        cpu: {
          cores: 8,
          usage: 75
        },
        memory: {
          total: 16384,
          usage: 60
        },
        connections: {
          active: 25,
          max: 200
        }
      };

      expect(resources.cpu?.cores).toBe(8);
      expect(resources.cpu?.usage).toBe(75);
      expect(resources.memory?.total).toBe(16384);
      expect(resources.connections?.active).toBe(25);
    });

    it('should support partial resource information', () => {
      const resources: ResourceInfo = {
        cpu: {
          cores: 4
          // usage is optional
        },
        memory: {
          total: 8192
          // usage is optional
        }
        // connections is optional
      };

      expect(resources.cpu?.cores).toBe(4);
      expect(resources.cpu?.usage).toBeUndefined();
      expect(resources.memory?.total).toBe(8192);
      expect(resources.connections).toBeUndefined();
    });
  });

  describe('LoadBalancingStrategy', () => {
    it('should define valid strategy names', () => {
      const strategies: LoadBalancingStrategy['name'][] = [
        'round_robin',
        'weighted',
        'least_connections',
        'random',
        'ip_hash'
      ];

      strategies.forEach(strategy => {
        expect(typeof strategy).toBe('string');
        expect(strategy.length).toBeGreaterThan(0);
      });
    });

    it('should create a mock load balancing strategy', () => {
      const mockInstances: ServiceRegistration[] = [
        {
          id: 'service-1',
          name: 'test-service',
          version: '1.0.0',
          host: 'localhost',
          port: 3000,
          protocol: 'http',
          healthCheck: {
            endpoint: '/health',
            interval: 30,
            timeout: 5,
            retries: 3
          },
          weight: 100,
          tags: [],
          status: 'healthy',
          lastHealthCheck: new Date(),
          metadata: {},
          registeredAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const mockStrategy: LoadBalancingStrategy = {
        name: 'round_robin',
        selectInstance: (instances: ServiceRegistration[]) => {
          return instances.length > 0 ? instances[0] : null;
        }
      };

      const selected = mockStrategy.selectInstance(mockInstances);
      expect(selected?.id).toBe('service-1');

      const selectedEmpty = mockStrategy.selectInstance([]);
      expect(selectedEmpty).toBeNull();
    });
  });

  describe('Type compatibility', () => {
    it('should ensure protocol types are compatible', () => {
      const httpProtocol: ServiceRegistration['protocol'] = 'http';
      const httpsProtocol: ServiceRegistration['protocol'] = 'https';
      const grpcProtocol: ServiceRegistration['protocol'] = 'grpc';

      expect(httpProtocol).toBe('http');
      expect(httpsProtocol).toBe('https');
      expect(grpcProtocol).toBe('grpc');
    });

    it('should ensure status types are compatible', () => {
      const healthyStatus: ServiceRegistration['status'] = 'healthy';
      const unhealthyStatus: ServiceRegistration['status'] = 'unhealthy';
      const drainingStatus: ServiceRegistration['status'] = 'draining';

      expect(healthyStatus).toBe('healthy');
      expect(unhealthyStatus).toBe('unhealthy');
      expect(drainingStatus).toBe('draining');
    });

    it('should ensure event types are compatible', () => {
      const registeredEvent: ServiceDiscoveryEvent['type'] = 'registered';
      const unregisteredEvent: ServiceDiscoveryEvent['type'] = 'unregistered';
      const healthChangedEvent: ServiceDiscoveryEvent['type'] = 'health_changed';
      const updatedEvent: ServiceDiscoveryEvent['type'] = 'updated';

      expect(registeredEvent).toBe('registered');
      expect(unregisteredEvent).toBe('unregistered');
      expect(healthChangedEvent).toBe('health_changed');
      expect(updatedEvent).toBe('updated');
    });
  });
});