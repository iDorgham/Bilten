import { Logger } from '../utils/Logger';

export interface GatewayConfig {
  server: {
    port: number;
    clusterMode: boolean;
    timeout: number;
  };
  redis: {
    host: string;
    port: number;
    password?: string | undefined;
    db: number;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
  services: {
    [key: string]: {
      url: string;
      timeout: number;
      retries: number;
    };
  };
  cors: {
    allowedOrigins: string[];
  };
}

export class ConfigManager {
  private logger = Logger.getInstance();
  private config: GatewayConfig | null = null;

  async loadConfig(): Promise<void> {
    try {
      this.config = {
        server: {
          port: Number(process.env.PORT) || 3000,
          clusterMode: process.env.CLUSTER_MODE === 'true',
          timeout: 30000
        },
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: Number(process.env.REDIS_PORT) || 6379,
          password: process.env.REDIS_PASSWORD ? process.env.REDIS_PASSWORD : undefined,
          db: Number(process.env.REDIS_DB) || 0
        },
        jwt: {
          secret: process.env.JWT_SECRET || 'default-secret',
          expiresIn: process.env.JWT_EXPIRES_IN || '1h'
        },
        rateLimit: {
          windowMs: Number(process.env.DEFAULT_RATE_LIMIT_WINDOW) || 60000,
          max: Number(process.env.DEFAULT_RATE_LIMIT_MAX) || 100
        },
        services: {
          user: {
            url: process.env.USER_SERVICE_URL || 'http://localhost:3001',
            timeout: 5000,
            retries: 3
          },
          event: {
            url: process.env.EVENT_SERVICE_URL || 'http://localhost:3002',
            timeout: 5000,
            retries: 3
          },
          payment: {
            url: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3003',
            timeout: 10000,
            retries: 2
          },
          notification: {
            url: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004',
            timeout: 5000,
            retries: 3
          },
          file: {
            url: process.env.FILE_SERVICE_URL || 'http://localhost:3005',
            timeout: 15000,
            retries: 2
          },
          analytics: {
            url: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3006',
            timeout: 5000,
            retries: 3
          }
        },
        cors: {
          allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']
        }
      };

      this.logger.info('Configuration loaded successfully');
    } catch (error) {
      this.logger.error('Failed to load configuration:', error);
      throw error;
    }
  }

  getConfig(): GatewayConfig {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call loadConfig() first.');
    }
    return this.config;
  }

  getAllowedOrigins(): string[] {
    return this.getConfig().cors.allowedOrigins;
  }

  getServiceConfig(serviceName: string) {
    const config = this.getConfig();
    return config.services[serviceName];
  }

  getRedisConfig() {
    return this.getConfig().redis;
  }

  getJWTConfig() {
    return this.getConfig().jwt;
  }

  getRateLimitConfig() {
    return this.getConfig().rateLimit;
  }
}