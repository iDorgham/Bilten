import { Logger } from '../utils/Logger';
import { ConfigManager } from '../config/ConfigManager';
import { ServiceDiscoveryClient } from './ServiceDiscoveryClient';
import { ServiceRegistration, ServiceDiscoveryConfig } from './types';

// Legacy interface for backward compatibility
export interface ServiceInstance {
  id: string;
  name: string;
  version: string;
  host: string;
  port: number;
  protocol: 'http' | 'https';
  basePath?: string | undefined;
  weight: number;
  tags: string[];
  status: 'healthy' | 'unhealthy' | 'draining';
  lastHealthCheck: Date;
  metadata: {
    region?: string | undefined;
    zone?: string | undefined;
    capabilities?: string[] | undefined;
  };
  registeredAt: Date;
  updatedAt: Date;
}

export class ServiceRegistry {
  private logger = Logger.getInstance();
  private configManager: ConfigManager;
  private discoveryClient: ServiceDiscoveryClient;
  private services = new Map<string, ServiceInstance[]>();
  private serviceIndex = new Map<string, number>(); // For round-robin load balancing

  constructor(discoveryConfig?: Partial<ServiceDiscoveryConfig>, configManager?: ConfigManager) {
    this.configManager = configManager || new ConfigManager();
    this.discoveryClient = new ServiceDiscoveryClient(discoveryConfig);
    
    // Listen to service discovery events
    this.discoveryClient.addEventHandler((event) => {
      this.logger.info(`Service discovery event: ${event.type}`, {
        service: `${event.service.name}/${event.service.id}`,
        timestamp: event.timestamp
      });
    });
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing Service Registry...');
      
      // Initialize service discovery client
      await this.discoveryClient.initialize();
      
      // Register default services from configuration
      await this.registerDefaultServices();
      
      this.logger.info('Service Registry initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Service Registry:', error);
      throw error;
    }
  }

  private async registerDefaultServices(): Promise<void> {
    const config = this.configManager.getConfig();
    const services = config?.services || {};
    
    for (const [name, serviceConfig] of Object.entries(services)) {
      const url = new URL(serviceConfig.url);
      
      const registration: ServiceRegistration = {
        id: `${name}-default`,
        name,
        version: '1.0.0',
        host: url.hostname,
        port: parseInt(url.port) || (url.protocol === 'https:' ? 443 : 80),
        protocol: url.protocol.replace(':', '') as 'http' | 'https',
        basePath: url.pathname !== '/' ? url.pathname : undefined,
        healthCheck: {
          endpoint: '/health',
          interval: 30,
          timeout: 5,
          retries: 3
        },
        weight: 100,
        tags: ['default'],
        status: 'healthy',
        lastHealthCheck: new Date(),
        metadata: {
          region: 'local',
          zone: 'default'
        },
        registeredAt: new Date(),
        updatedAt: new Date()
      };

      // Register with both legacy system and new discovery client
      await this.discoveryClient.registerService(registration);
      this.registerService(this.convertToLegacyInstance(registration));
    }
  }

  registerService(instance: ServiceInstance): void {
    const serviceName = instance.name;
    
    if (!this.services.has(serviceName)) {
      this.services.set(serviceName, []);
      this.serviceIndex.set(serviceName, 0);
    }

    const instances = this.services.get(serviceName);
    if (!instances) {
      return;
    }
    
    // Check if instance already exists (by ID)
    const existingIndex = instances.findIndex(i => i.id === instance.id);
    
    if (existingIndex >= 0) {
      // Update existing instance
      instances[existingIndex] = { ...instance, updatedAt: new Date() };
      this.logger.info(`Updated service instance: ${instance.name}/${instance.id}`);
    } else {
      // Add new instance
      instances.push(instance);
      this.logger.info(`Registered new service instance: ${instance.name}/${instance.id}`, {
        host: instance.host,
        port: instance.port,
        protocol: instance.protocol
      });
    }
  }

  unregisterService(serviceName: string, instanceId: string): boolean {
    const instances = this.services.get(serviceName);
    
    if (!instances) {
      return false;
    }

    const initialLength = instances.length;
    const filteredInstances = instances.filter(i => i.id !== instanceId);
    
    if (filteredInstances.length < initialLength) {
      this.services.set(serviceName, filteredInstances);
      this.logger.info(`Unregistered service instance: ${serviceName}/${instanceId}`);
      return true;
    }

    return false;
  }

  getServiceInstances(serviceName: string): ServiceInstance[] {
    return this.services.get(serviceName) || [];
  }

  getHealthyInstances(serviceName: string): ServiceInstance[] {
    const instances = this.getServiceInstances(serviceName);
    return instances.filter(i => i.status === 'healthy');
  }

  getServiceInstance(serviceName: string, algorithm: 'round_robin' | 'weighted' | 'least_connections' = 'round_robin'): ServiceInstance | null {
    const healthyInstances = this.getHealthyInstances(serviceName);
    
    if (healthyInstances.length === 0) {
      this.logger.warn(`No healthy instances available for service: ${serviceName}`);
      return null;
    }

    switch (algorithm) {
      case 'round_robin':
        return this.getRoundRobinInstance(serviceName, healthyInstances);
      case 'weighted':
        return this.getWeightedInstance(healthyInstances);
      case 'least_connections':
        // For now, fallback to round robin (least connections would require connection tracking)
        return this.getRoundRobinInstance(serviceName, healthyInstances);
      default:
        return healthyInstances[0];
    }
  }

  private getRoundRobinInstance(serviceName: string, instances: ServiceInstance[]): ServiceInstance {
    const currentIndex = this.serviceIndex.get(serviceName) || 0;
    const instance = instances[currentIndex % instances.length];
    
    // Update index for next request
    this.serviceIndex.set(serviceName, (currentIndex + 1) % instances.length);
    
    return instance;
  }

  private getWeightedInstance(instances: ServiceInstance[]): ServiceInstance {
    const totalWeight = instances.reduce((sum, instance) => sum + instance.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const instance of instances) {
      random -= instance.weight;
      if (random <= 0) {
        return instance;
      }
    }
    
    // Fallback to first instance
    return instances[0];
  }

  updateServiceHealth(serviceName: string, instanceId: string, status: 'healthy' | 'unhealthy' | 'draining'): boolean {
    const instances = this.services.get(serviceName);
    
    if (!instances) {
      return false;
    }

    const instance = instances.find(i => i.id === instanceId);
    
    if (instance) {
      const oldStatus = instance.status;
      instance.status = status;
      instance.lastHealthCheck = new Date();
      instance.updatedAt = new Date();
      
      if (oldStatus !== status) {
        this.logger.info(`Service health updated: ${serviceName}/${instanceId}`, {
          oldStatus,
          newStatus: status
        });
      }
      
      return true;
    }

    return false;
  }

  getAllServices(): { [serviceName: string]: ServiceInstance[] } {
    const result: { [serviceName: string]: ServiceInstance[] } = {};
    
    this.services.forEach((instances, serviceName) => {
      result[serviceName] = [...instances];
    });

    return result;
  }

  getServiceSummary(): {
    totalServices: number;
    totalInstances: number;
    healthyInstances: number;
    unhealthyInstances: number;
  } {
    let totalInstances = 0;
    let healthyInstances = 0;
    let unhealthyInstances = 0;

    this.services.forEach(instances => {
      totalInstances += instances.length;
      healthyInstances += instances.filter(i => i.status === 'healthy').length;
      unhealthyInstances += instances.filter(i => i.status === 'unhealthy').length;
    });

    return {
      totalServices: this.services.size,
      totalInstances,
      healthyInstances,
      unhealthyInstances
    };
  }

  // New service discovery methods

  /**
   * Register a service using the new ServiceRegistration model
   */
  async registerServiceWithDiscovery(registration: ServiceRegistration): Promise<void> {
    await this.discoveryClient.registerService(registration);
    this.registerService(this.convertToLegacyInstance(registration));
  }

  /**
   * Unregister a service from discovery
   */
  async unregisterServiceFromDiscovery(serviceName: string, instanceId: string): Promise<boolean> {
    const result = await this.discoveryClient.unregisterService(serviceName, instanceId);
    this.unregisterService(serviceName, instanceId);
    return result;
  }

  /**
   * Discover services using the new discovery client
   */
  discoverServices(serviceName: string, version?: string): ServiceRegistration[] {
    return this.discoveryClient.discoverServices(serviceName, version);
  }

  /**
   * Get healthy instances using discovery client
   */
  getHealthyInstancesFromDiscovery(serviceName: string): ServiceRegistration[] {
    return this.discoveryClient.getHealthyInstances(serviceName);
  }

  /**
   * Select service instance with load balancing
   */
  selectServiceInstance(
    serviceName: string, 
    strategy: 'round_robin' | 'weighted' | 'least_connections' | 'random' | 'ip_hash' = 'round_robin',
    context?: any
  ): ServiceRegistration | null {
    return this.discoveryClient.selectServiceInstance(serviceName, strategy, context);
  }

  /**
   * Get service discovery client for advanced operations
   */
  getDiscoveryClient(): ServiceDiscoveryClient {
    return this.discoveryClient;
  }

  /**
   * Get comprehensive registry summary including discovery metrics
   */
  getComprehensiveRegistrySummary() {
    return {
      legacy: this.getServiceSummary(),
      discovery: this.discoveryClient.getRegistrySummary()
    };
  }

  // Helper methods

  private convertToLegacyInstance(registration: ServiceRegistration): ServiceInstance {
    return {
      id: registration.id,
      name: registration.name,
      version: registration.version,
      host: registration.host,
      port: registration.port,
      protocol: registration.protocol as 'http' | 'https',
      basePath: registration.basePath,
      weight: registration.weight,
      tags: registration.tags,
      status: registration.status,
      lastHealthCheck: registration.lastHealthCheck,
      metadata: {
        region: registration.metadata.region,
        zone: registration.metadata.zone,
        capabilities: registration.metadata.capabilities
      },
      registeredAt: registration.registeredAt,
      updatedAt: registration.updatedAt
    };
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down Service Registry...');
    
    // Shutdown discovery client
    await this.discoveryClient.shutdown();
    
    this.services.clear();
    this.serviceIndex.clear();
    
    this.logger.info('Service Registry shutdown completed');
  }
}