import axios from 'axios';
import cron from 'node-cron';
import { Logger } from '../utils/Logger';
import { ConfigManager } from '../config/ConfigManager';

export interface ServiceHealth {
  name: string;
  url: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  lastCheck: Date;
  responseTime?: number | undefined;
  error?: string | undefined;
}

export class HealthCheckService {
  private logger = Logger.getInstance();
  private configManager = new ConfigManager();
  private serviceHealthMap = new Map<string, ServiceHealth>();
  private healthCheckTask: cron.ScheduledTask | null = null;

  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing Health Check Service...');
      
      // Initialize service health status
      const services = this.configManager.getConfig().services;
      
      Object.entries(services).forEach(([name, config]) => {
        this.serviceHealthMap.set(name, {
          name,
          url: config.url,
          status: 'unknown',
          lastCheck: new Date()
        });
      });

      // Start periodic health checks
      this.startHealthChecks();
      
      // Perform initial health check
      await this.performHealthChecks();
      
      this.logger.info('Health Check Service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Health Check Service:', error);
      throw error;
    }
  }

  private startHealthChecks(): void {
    const interval = process.env.HEALTH_CHECK_INTERVAL || '30000'; // 30 seconds default
    const cronExpression = `*/${Math.floor(parseInt(interval) / 1000)} * * * * *`;
    
    this.healthCheckTask = cron.schedule(cronExpression, async () => {
      await this.performHealthChecks();
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    this.logger.info(`Health checks scheduled every ${interval}ms`);
  }

  private async performHealthChecks(): Promise<void> {
    const services = this.configManager.getConfig().services;
    const healthCheckPromises = Object.entries(services).map(([name, config]) =>
      this.checkServiceHealth(name, config.url)
    );

    await Promise.allSettled(healthCheckPromises);
  }

  private async checkServiceHealth(serviceName: string, serviceUrl: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      const healthEndpoint = `${serviceUrl}/health`;
      const response = await axios.get(healthEndpoint, {
        timeout: 5000,
        validateStatus: (status) => status < 500 // Accept 2xx, 3xx, 4xx as healthy
      });

      const responseTime = Date.now() - startTime;
      const isHealthy = response.status >= 200 && response.status < 400;

      this.serviceHealthMap.set(serviceName, {
        name: serviceName,
        url: serviceUrl,
        status: isHealthy ? 'healthy' : 'unhealthy',
        lastCheck: new Date(),
        responseTime,
        error: isHealthy ? undefined : `HTTP ${response.status}`
      });

      if (isHealthy) {
        this.logger.debug(`Service ${serviceName} is healthy`, {
          responseTime: `${responseTime}ms`,
          status: response.status
        });
      } else {
        this.logger.warn(`Service ${serviceName} returned unhealthy status`, {
          status: response.status,
          responseTime: `${responseTime}ms`
        });
      }

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.serviceHealthMap.set(serviceName, {
        name: serviceName,
        url: serviceUrl,
        status: 'unhealthy',
        lastCheck: new Date(),
        responseTime,
        error: errorMessage
      });

      this.logger.warn(`Health check failed for service ${serviceName}`, {
        error: errorMessage,
        responseTime: `${responseTime}ms`,
        url: serviceUrl
      });
    }
  }

  getServiceHealth(serviceName: string): ServiceHealth | undefined {
    return this.serviceHealthMap.get(serviceName);
  }

  getAllServiceHealth(): ServiceHealth[] {
    return Array.from(this.serviceHealthMap.values());
  }

  getHealthySummary(): {
    total: number;
    healthy: number;
    unhealthy: number;
    unknown: number;
    healthyPercentage: number;
  } {
    const services = Array.from(this.serviceHealthMap.values());
    const total = services.length;
    const healthy = services.filter(s => s.status === 'healthy').length;
    const unhealthy = services.filter(s => s.status === 'unhealthy').length;
    const unknown = services.filter(s => s.status === 'unknown').length;

    return {
      total,
      healthy,
      unhealthy,
      unknown,
      healthyPercentage: total > 0 ? (healthy / total) * 100 : 0
    };
  }

  isServiceHealthy(serviceName: string): boolean {
    const health = this.serviceHealthMap.get(serviceName);
    return health?.status === 'healthy';
  }

  async forceHealthCheck(serviceName?: string): Promise<void> {
    if (serviceName) {
      const serviceConfig = this.configManager.getServiceConfig(serviceName);
      if (serviceConfig) {
        await this.checkServiceHealth(serviceName, serviceConfig.url);
      }
    } else {
      await this.performHealthChecks();
    }
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down Health Check Service...');
    
    if (this.healthCheckTask) {
      this.healthCheckTask.stop();
      this.healthCheckTask = null;
    }
    
    this.serviceHealthMap.clear();
    this.logger.info('Health Check Service shutdown completed');
  }
}