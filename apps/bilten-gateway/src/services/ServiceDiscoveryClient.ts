import { EventEmitter } from 'events';
import axios, { AxiosError } from 'axios';
import { Logger } from '../utils/Logger';
import { 
  ServiceRegistration, 
  ServiceDiscoveryConfig, 
  HealthCheckResult, 
  ServiceDiscoveryEvent,
  ServiceDiscoveryEventHandler,
  LoadBalancingStrategy
} from './types';

/**
 * Service Discovery Client for dynamic service registration and discovery
 */
export class ServiceDiscoveryClient extends EventEmitter {
  private logger = Logger.getInstance();
  private services = new Map<string, ServiceRegistration[]>();
  private serviceIndex = new Map<string, number>(); // For round-robin
  private healthCheckTimers = new Map<string, NodeJS.Timeout>();
  private cleanupTimer?: NodeJS.Timeout;
  private config: ServiceDiscoveryConfig;
  private eventHandlers = new Set<ServiceDiscoveryEventHandler>();

  constructor(config: Partial<ServiceDiscoveryConfig> = {}) {
    super();
    
    this.config = {
      enabled: true,
      registrationTtl: 300, // 5 minutes
      healthCheckInterval: 30, // 30 seconds
      cleanupInterval: 60, // 1 minute
      retryAttempts: 3,
      retryDelay: 1000, // 1 second
      ...config
    };
  }

  async initialize(): Promise<void> {
    if (!this.config.enabled) {
      this.logger.info('Service Discovery is disabled');
      return;
    }

    try {
      this.logger.info('Initializing Service Discovery Client...');
      
      // Start cleanup timer for expired services
      this.startCleanupTimer();
      
      this.logger.info('Service Discovery Client initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Service Discovery Client:', error);
      throw error;
    }
  }

  /**
   * Register a service instance
   */
  async registerService(registration: ServiceRegistration): Promise<void> {
    try {
      const serviceName = registration.name;
      
      if (!this.services.has(serviceName)) {
        this.services.set(serviceName, []);
        this.serviceIndex.set(serviceName, 0);
      }

      const instances = this.services.get(serviceName)!;
      
      // Check if instance already exists
      const existingIndex = instances.findIndex(i => i.id === registration.id);
      
      if (existingIndex >= 0) {
        // Update existing instance
        instances[existingIndex] = { ...registration, updatedAt: new Date() };
        
        this.logger.info(`Updated service registration: ${serviceName}/${registration.id}`);
        this.emitEvent('updated', instances[existingIndex]);
      } else {
        // Add new instance
        const newRegistration = { ...registration, registeredAt: new Date(), updatedAt: new Date() };
        instances.push(newRegistration);
        
        this.logger.info(`Registered new service: ${serviceName}/${registration.id}`, {
          host: registration.host,
          port: registration.port,
          protocol: registration.protocol
        });
        
        this.emitEvent('registered', newRegistration);
      }

      // Start health checking for this service
      this.startHealthCheck(registration);
      
    } catch (error) {
      this.logger.error(`Failed to register service ${registration.name}/${registration.id}:`, error);
      throw error;
    }
  }

  /**
   * Unregister a service instance
   */
  async unregisterService(serviceName: string, instanceId: string): Promise<boolean> {
    try {
      const instances = this.services.get(serviceName);
      
      if (!instances) {
        return false;
      }

      const instanceIndex = instances.findIndex(i => i.id === instanceId);
      
      if (instanceIndex >= 0) {
        const removedInstance = instances.splice(instanceIndex, 1)[0];
        
        // Stop health checking
        this.stopHealthCheck(instanceId);
        
        this.logger.info(`Unregistered service: ${serviceName}/${instanceId}`);
        this.emitEvent('unregistered', removedInstance);
        
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error(`Failed to unregister service ${serviceName}/${instanceId}:`, error);
      return false;
    }
  }

  /**
   * Discover services by name
   */
  discoverServices(serviceName: string, version?: string): ServiceRegistration[] {
    const instances = this.services.get(serviceName) || [];
    
    if (version) {
      return instances.filter(i => i.version === version);
    }
    
    return [...instances];
  }

  /**
   * Get healthy service instances
   */
  getHealthyInstances(serviceName: string): ServiceRegistration[] {
    const instances = this.discoverServices(serviceName);
    return instances.filter(i => i.status === 'healthy');
  }

  /**
   * Select a service instance using load balancing strategy
   */
  selectServiceInstance(
    serviceName: string, 
    strategy: LoadBalancingStrategy['name'] = 'round_robin',
    context?: any
  ): ServiceRegistration | null {
    const healthyInstances = this.getHealthyInstances(serviceName);
    
    if (healthyInstances.length === 0) {
      this.logger.warn(`No healthy instances available for service: ${serviceName}`);
      return null;
    }

    switch (strategy) {
      case 'round_robin':
        return this.selectRoundRobin(serviceName, healthyInstances);
      case 'weighted':
        return this.selectWeighted(healthyInstances);
      case 'least_connections':
        return this.selectLeastConnections(healthyInstances);
      case 'random':
        return this.selectRandom(healthyInstances);
      case 'ip_hash':
        return this.selectIpHash(healthyInstances, context?.clientIp);
      default:
        return healthyInstances[0];
    }
  }

  /**
   * Update service health status
   */
  updateServiceHealth(serviceName: string, instanceId: string, status: ServiceRegistration['status']): boolean {
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
        this.logger.info(`Service health changed: ${serviceName}/${instanceId}`, {
          oldStatus,
          newStatus: status
        });
        
        this.emitEvent('health_changed', instance);
      }
      
      return true;
    }

    return false;
  }

  /**
   * Get service registry summary
   */
  getRegistrySummary(): {
    totalServices: number;
    totalInstances: number;
    healthyInstances: number;
    unhealthyInstances: number;
    drainingInstances: number;
  } {
    let totalInstances = 0;
    let healthyInstances = 0;
    let unhealthyInstances = 0;
    let drainingInstances = 0;

    this.services.forEach(instances => {
      totalInstances += instances.length;
      healthyInstances += instances.filter(i => i.status === 'healthy').length;
      unhealthyInstances += instances.filter(i => i.status === 'unhealthy').length;
      drainingInstances += instances.filter(i => i.status === 'draining').length;
    });

    return {
      totalServices: this.services.size,
      totalInstances,
      healthyInstances,
      unhealthyInstances,
      drainingInstances
    };
  }

  /**
   * Add event handler for service discovery events
   */
  addEventHandler(handler: ServiceDiscoveryEventHandler): void {
    this.eventHandlers.add(handler);
  }

  /**
   * Remove event handler
   */
  removeEventHandler(handler: ServiceDiscoveryEventHandler): void {
    this.eventHandlers.delete(handler);
  }

  // Private methods

  private selectRoundRobin(serviceName: string, instances: ServiceRegistration[]): ServiceRegistration {
    const currentIndex = this.serviceIndex.get(serviceName) || 0;
    const instance = instances[currentIndex % instances.length];
    
    this.serviceIndex.set(serviceName, (currentIndex + 1) % instances.length);
    
    return instance;
  }

  private selectWeighted(instances: ServiceRegistration[]): ServiceRegistration {
    const totalWeight = instances.reduce((sum, instance) => sum + instance.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const instance of instances) {
      random -= instance.weight;
      if (random <= 0) {
        return instance;
      }
    }
    
    return instances[0];
  }

  private selectLeastConnections(instances: ServiceRegistration[]): ServiceRegistration {
    // For now, use random selection as we don't track connections yet
    // In a real implementation, this would select the instance with fewest active connections
    return this.selectRandom(instances);
  }

  private selectRandom(instances: ServiceRegistration[]): ServiceRegistration {
    const randomIndex = Math.floor(Math.random() * instances.length);
    return instances[randomIndex];
  }

  private selectIpHash(instances: ServiceRegistration[], clientIp?: string): ServiceRegistration {
    if (!clientIp) {
      return this.selectRandom(instances);
    }
    
    // Simple hash function for IP-based selection
    let hash = 0;
    for (let i = 0; i < clientIp.length; i++) {
      hash = ((hash << 5) - hash + clientIp.charCodeAt(i)) & 0xffffffff;
    }
    
    const index = Math.abs(hash) % instances.length;
    return instances[index];
  }

  private startHealthCheck(registration: ServiceRegistration): void {
    const healthCheckId = `${registration.name}-${registration.id}`;
    
    // Clear existing timer if any
    this.stopHealthCheck(registration.id);
    
    const timer = setInterval(async () => {
      await this.performHealthCheck(registration);
    }, registration.healthCheck.interval * 1000);
    
    this.healthCheckTimers.set(healthCheckId, timer);
    
    // Perform initial health check
    this.performHealthCheck(registration);
  }

  private stopHealthCheck(instanceId: string): void {
    // Find and clear timer for this instance
    for (const [key, timer] of this.healthCheckTimers.entries()) {
      if (key.endsWith(`-${instanceId}`)) {
        clearInterval(timer);
        this.healthCheckTimers.delete(key);
        break;
      }
    }
  }

  private async performHealthCheck(registration: ServiceRegistration): Promise<void> {
    const startTime = Date.now();
    let attempt = 0;
    
    while (attempt < this.config.retryAttempts) {
      try {
        const healthUrl = `${registration.protocol}://${registration.host}:${registration.port}${registration.healthCheck.endpoint}`;
        
        const response = await axios.get(healthUrl, {
          timeout: registration.healthCheck.timeout * 1000,
          validateStatus: (status) => status < 500
        });

        const responseTime = Date.now() - startTime;
        const isHealthy = response.status >= 200 && response.status < 400;
        
        const result: HealthCheckResult = {
          serviceId: registration.id,
          serviceName: registration.name,
          status: isHealthy ? 'healthy' : 'unhealthy',
          responseTime,
          timestamp: new Date(),
          metadata: {
            httpStatus: response.status,
            attempt: attempt + 1
          }
        };

        this.updateServiceHealth(registration.name, registration.id, result.status === 'timeout' ? 'unhealthy' : result.status);
        
        if (isHealthy) {
          this.logger.debug(`Health check passed for ${registration.name}/${registration.id}`, {
            responseTime: `${responseTime}ms`,
            status: response.status
          });
        } else {
          this.logger.warn(`Health check failed for ${registration.name}/${registration.id}`, {
            status: response.status,
            responseTime: `${responseTime}ms`
          });
        }
        
        break; // Success, exit retry loop
        
      } catch (error) {
        attempt++;
        const responseTime = Date.now() - startTime;
        
        if (attempt >= this.config.retryAttempts) {
          const errorMessage = error instanceof AxiosError ? error.message : 'Unknown error';
          
          this.updateServiceHealth(registration.name, registration.id, 'unhealthy');
          
          this.logger.warn(`Health check failed for ${registration.name}/${registration.id} after ${attempt} attempts`, {
            error: errorMessage,
            responseTime: `${responseTime}ms`
          });
        } else {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        }
      }
    }
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredServices();
    }, this.config.cleanupInterval * 1000);
  }

  private cleanupExpiredServices(): void {
    const now = new Date();
    const ttlMs = this.config.registrationTtl * 1000;
    
    for (const [serviceName, instances] of this.services.entries()) {
      const validInstances = instances.filter(instance => {
        const age = now.getTime() - instance.updatedAt.getTime();
        const isExpired = age > ttlMs;
        
        if (isExpired) {
          this.logger.info(`Cleaning up expired service: ${serviceName}/${instance.id}`);
          this.stopHealthCheck(instance.id);
          this.emitEvent('unregistered', instance);
        }
        
        return !isExpired;
      });
      
      if (validInstances.length !== instances.length) {
        this.services.set(serviceName, validInstances);
      }
      
      // Remove empty service entries
      if (validInstances.length === 0) {
        this.services.delete(serviceName);
        this.serviceIndex.delete(serviceName);
      }
    }
  }

  private emitEvent(type: ServiceDiscoveryEvent['type'], service: ServiceRegistration): void {
    const event: ServiceDiscoveryEvent = {
      type,
      service,
      timestamp: new Date()
    };
    
    // Emit to EventEmitter listeners
    this.emit('service_event', event);
    
    // Call registered handlers
    this.eventHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        this.logger.error('Error in service discovery event handler:', error);
      }
    });
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down Service Discovery Client...');
    
    // Clear all timers
    this.healthCheckTimers.forEach(timer => clearInterval(timer));
    this.healthCheckTimers.clear();
    
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    // Clear services
    this.services.clear();
    this.serviceIndex.clear();
    this.eventHandlers.clear();
    
    this.logger.info('Service Discovery Client shutdown completed');
  }
}