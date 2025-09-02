/**
 * Service Discovery Types and Interfaces
 */

export interface ServiceRegistration {
  id: string;
  name: string;
  version: string;
  
  // Network information
  host: string;
  port: number;
  protocol: 'http' | 'https' | 'grpc';
  basePath?: string | undefined;
  
  // Health check configuration
  healthCheck: {
    endpoint: string;
    interval: number;
    timeout: number;
    retries: number;
  };
  
  // Load balancing
  weight: number;
  tags: string[];
  
  // Status
  status: 'healthy' | 'unhealthy' | 'draining';
  lastHealthCheck: Date;
  
  // Metadata
  metadata: {
    region?: string;
    zone?: string;
    capabilities?: string[];
    resources?: ResourceInfo;
  };
  
  registeredAt: Date;
  updatedAt: Date;
}

export interface ResourceInfo {
  cpu?: {
    cores: number;
    usage?: number; // percentage
  };
  memory?: {
    total: number; // MB
    usage?: number; // percentage
  };
  connections?: {
    active: number;
    max: number;
  };
}

export interface ServiceDiscoveryConfig {
  enabled: boolean;
  registrationTtl: number; // seconds
  healthCheckInterval: number; // seconds
  cleanupInterval: number; // seconds
  retryAttempts: number;
  retryDelay: number; // milliseconds
}

export interface HealthCheckResult {
  serviceId: string;
  serviceName: string;
  status: 'healthy' | 'unhealthy' | 'timeout';
  responseTime: number;
  timestamp: Date;
  error?: string;
  metadata?: Record<string, any>;
}

export interface ServiceDiscoveryEvent {
  type: 'registered' | 'unregistered' | 'health_changed' | 'updated';
  service: ServiceRegistration;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export type ServiceDiscoveryEventHandler = (event: ServiceDiscoveryEvent) => void;

export interface LoadBalancingStrategy {
  name: 'round_robin' | 'weighted' | 'least_connections' | 'random' | 'ip_hash';
  selectInstance(instances: ServiceRegistration[], context?: any): ServiceRegistration | null;
}