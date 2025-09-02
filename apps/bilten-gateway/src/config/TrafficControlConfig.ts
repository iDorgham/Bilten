import { TrafficControlConfig } from '../middleware/RateLimitMiddleware';

export class TrafficControlConfigManager {
  private static defaultConfig: TrafficControlConfig = {
    enabled: process.env.TRAFFIC_CONTROL_ENABLED !== 'false',
    globalLimits: {
      windowMs: parseInt(process.env.GLOBAL_RATE_LIMIT_WINDOW || '60000'),
      max: parseInt(process.env.GLOBAL_RATE_LIMIT_MAX || '1000')
    },
    userLimits: {
      windowMs: parseInt(process.env.USER_RATE_LIMIT_WINDOW || '60000'),
      max: parseInt(process.env.USER_RATE_LIMIT_MAX || '100')
    },
    endpointLimits: {
      '/api/auth/login': {
        windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW || '900000'), // 15 minutes
        max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '5')
      },
      '/api/auth/register': {
        windowMs: parseInt(process.env.REGISTER_RATE_LIMIT_WINDOW || '3600000'), // 1 hour
        max: parseInt(process.env.REGISTER_RATE_LIMIT_MAX || '3')
      },
      '/api/payments': {
        windowMs: parseInt(process.env.PAYMENT_RATE_LIMIT_WINDOW || '60000'),
        max: parseInt(process.env.PAYMENT_RATE_LIMIT_MAX || '10')
      },
      '/api/files/upload': {
        windowMs: parseInt(process.env.UPLOAD_RATE_LIMIT_WINDOW || '60000'),
        max: parseInt(process.env.UPLOAD_RATE_LIMIT_MAX || '5')
      }
    },
    burstProtection: {
      enabled: process.env.BURST_PROTECTION_ENABLED !== 'false',
      threshold: parseInt(process.env.BURST_PROTECTION_THRESHOLD || '50'),
      blockDuration: parseInt(process.env.BURST_PROTECTION_BLOCK_DURATION || '300000') // 5 minutes
    },
    adaptiveRateLimit: {
      enabled: process.env.ADAPTIVE_RATE_LIMIT_ENABLED === 'true',
      baseLimit: parseInt(process.env.ADAPTIVE_BASE_LIMIT || '100'),
      maxLimit: parseInt(process.env.ADAPTIVE_MAX_LIMIT || '500'),
      adjustmentFactor: parseFloat(process.env.ADAPTIVE_ADJUSTMENT_FACTOR || '0.1')
    }
  };

  static getDefaultConfig(): TrafficControlConfig {
    return JSON.parse(JSON.stringify(this.defaultConfig));
  }

  static validateConfig(config: Partial<TrafficControlConfig>): boolean {
    try {
      // Validate global limits
      if (config.globalLimits) {
        if (config.globalLimits.windowMs <= 0 || config.globalLimits.max <= 0) {
          return false;
        }
      }

      // Validate user limits
      if (config.userLimits) {
        if (config.userLimits.windowMs <= 0 || config.userLimits.max <= 0) {
          return false;
        }
      }

      // Validate endpoint limits
      if (config.endpointLimits) {
        for (const [endpoint, limits] of Object.entries(config.endpointLimits)) {
          if (!endpoint.startsWith('/') || limits.windowMs <= 0 || limits.max <= 0) {
            return false;
          }
        }
      }

      // Validate burst protection
      if (config.burstProtection) {
        if (config.burstProtection.threshold <= 0 || config.burstProtection.blockDuration <= 0) {
          return false;
        }
      }

      // Validate adaptive rate limit
      if (config.adaptiveRateLimit) {
        const adaptive = config.adaptiveRateLimit;
        if (adaptive.baseLimit <= 0 || 
            adaptive.maxLimit <= adaptive.baseLimit || 
            adaptive.adjustmentFactor <= 0 || 
            adaptive.adjustmentFactor > 1) {
          return false;
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  static mergeWithDefaults(config: Partial<TrafficControlConfig>): TrafficControlConfig {
    const defaultConfig = this.getDefaultConfig();
    
    return {
      enabled: config.enabled !== undefined ? config.enabled : defaultConfig.enabled,
      globalLimits: {
        ...defaultConfig.globalLimits,
        ...config.globalLimits
      },
      userLimits: {
        ...defaultConfig.userLimits,
        ...config.userLimits
      },
      endpointLimits: {
        ...defaultConfig.endpointLimits,
        ...config.endpointLimits
      },
      burstProtection: {
        ...defaultConfig.burstProtection,
        ...config.burstProtection
      },
      adaptiveRateLimit: {
        ...defaultConfig.adaptiveRateLimit,
        ...config.adaptiveRateLimit
      }
    };
  }

  static getEnvironmentVariableDocumentation(): Record<string, string> {
    return {
      'TRAFFIC_CONTROL_ENABLED': 'Enable/disable traffic control (default: true)',
      'GLOBAL_RATE_LIMIT_WINDOW': 'Global rate limit window in milliseconds (default: 60000)',
      'GLOBAL_RATE_LIMIT_MAX': 'Global rate limit maximum requests (default: 1000)',
      'USER_RATE_LIMIT_WINDOW': 'User rate limit window in milliseconds (default: 60000)',
      'USER_RATE_LIMIT_MAX': 'User rate limit maximum requests (default: 100)',
      'AUTH_RATE_LIMIT_WINDOW': 'Authentication rate limit window in milliseconds (default: 900000)',
      'AUTH_RATE_LIMIT_MAX': 'Authentication rate limit maximum requests (default: 5)',
      'REGISTER_RATE_LIMIT_WINDOW': 'Registration rate limit window in milliseconds (default: 3600000)',
      'REGISTER_RATE_LIMIT_MAX': 'Registration rate limit maximum requests (default: 3)',
      'PAYMENT_RATE_LIMIT_WINDOW': 'Payment rate limit window in milliseconds (default: 60000)',
      'PAYMENT_RATE_LIMIT_MAX': 'Payment rate limit maximum requests (default: 10)',
      'UPLOAD_RATE_LIMIT_WINDOW': 'Upload rate limit window in milliseconds (default: 60000)',
      'UPLOAD_RATE_LIMIT_MAX': 'Upload rate limit maximum requests (default: 5)',
      'BURST_PROTECTION_ENABLED': 'Enable/disable burst protection (default: true)',
      'BURST_PROTECTION_THRESHOLD': 'Burst protection threshold (default: 50)',
      'BURST_PROTECTION_BLOCK_DURATION': 'Burst protection block duration in milliseconds (default: 300000)',
      'ADAPTIVE_RATE_LIMIT_ENABLED': 'Enable/disable adaptive rate limiting (default: false)',
      'ADAPTIVE_BASE_LIMIT': 'Adaptive rate limit base limit (default: 100)',
      'ADAPTIVE_MAX_LIMIT': 'Adaptive rate limit maximum limit (default: 500)',
      'ADAPTIVE_ADJUSTMENT_FACTOR': 'Adaptive rate limit adjustment factor (default: 0.1)'
    };
  }
}