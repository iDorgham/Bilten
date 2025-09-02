import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { createClient, RedisClientType } from 'redis';
import { Logger } from '../utils/Logger';
import { ConfigManager } from '../config/ConfigManager';
import { TrafficControlConfigManager } from '../config/TrafficControlConfig';
import { RateLimitService, RateLimitContext } from '../services/RateLimitService';

export interface TrafficControlConfig {
  enabled: boolean;
  globalLimits: {
    windowMs: number;
    max: number;
  };
  userLimits: {
    windowMs: number;
    max: number;
  };
  endpointLimits: {
    [endpoint: string]: {
      windowMs: number;
      max: number;
    };
  };
  burstProtection: {
    enabled: boolean;
    threshold: number;
    blockDuration: number;
  };
  adaptiveRateLimit: {
    enabled: boolean;
    baseLimit: number;
    maxLimit: number;
    adjustmentFactor: number;
  };
}

export class RateLimitMiddleware {
  private static logger = Logger.getInstance();
  private static configManager = new ConfigManager();
  private static redisClient: RedisClientType | null = null;
  private static trafficControlConfig: TrafficControlConfig = TrafficControlConfigManager.getDefaultConfig();
  private static rateLimitService: RateLimitService;

  static async initialize(configManager?: ConfigManager): Promise<void> {
    try {
      if (configManager) {
        RateLimitMiddleware.configManager = configManager;
      }
      
      // Initialize the new RateLimitService
      RateLimitMiddleware.rateLimitService = RateLimitService.getInstance(RateLimitMiddleware.configManager);
      await RateLimitMiddleware.rateLimitService.initialize();
      
      // Skip Redis initialization in development if Redis is not available
      if (process.env.NODE_ENV === 'development') {
        RateLimitMiddleware.logger.warn('Running in development mode - Redis connection is optional');
        try {
          const redisConfig = RateLimitMiddleware.configManager.getRedisConfig();
          const clientConfig: any = {
            socket: {
              host: redisConfig.host,
              port: redisConfig.port,
              connectTimeout: 5000
            },
            database: redisConfig.db
          };

          if (redisConfig.password) {
            clientConfig.password = redisConfig.password;
          }

          RateLimitMiddleware.redisClient = createClient(clientConfig);
          await RateLimitMiddleware.redisClient.connect();
          RateLimitMiddleware.logger.info('Redis connected successfully');
        } catch (redisError) {
          RateLimitMiddleware.logger.warn('Redis connection failed in development mode, continuing without Redis', { error: redisError });
          RateLimitMiddleware.redisClient = null;
        }
      } else {
        const redisConfig = RateLimitMiddleware.configManager.getRedisConfig();
        const clientConfig: any = {
          socket: {
            host: redisConfig.host,
            port: redisConfig.port
          },
          database: redisConfig.db
        };

        if (redisConfig.password) {
          clientConfig.password = redisConfig.password;
        }

        RateLimitMiddleware.redisClient = createClient(clientConfig);
        await RateLimitMiddleware.redisClient.connect();
        RateLimitMiddleware.logger.info('Redis client connected for rate limiting');
      } catch (error) {
      RateLimitMiddleware.logger.error('Failed to initialize Redis for rate limiting:', error);
      throw error;
    }
  }

  static async shutdown(): Promise<void> {
    if (RateLimitMiddleware.rateLimitService) {
      await RateLimitMiddleware.rateLimitService.shutdown();
    }
    if (RateLimitMiddleware.redisClient) {
      await RateLimitMiddleware.redisClient.quit();
      RateLimitMiddleware.logger.info('Redis client disconnected');
    }
  }

  // Enhanced rate limiting using RateLimitService
  static enhancedRateLimit() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = (req as any).user;
        const clientId = user ? user.id : req.ip || 'unknown';
        const clientType = user ? 'user' : 'ip';

        const context: RateLimitContext = {
          clientId,
          clientType,
          endpoint: req.path,
          method: req.method,
          headers: req.headers as Record<string, string>,
          query: req.query,
          body: req.body,
          ip: req.ip || 'unknown',
          timestamp: new Date()
        };

        const result = await RateLimitMiddleware.rateLimitService.checkRateLimit(context);

        if (!result.allowed) {
          // Set rate limit headers
          res.set({
            'X-RateLimit-Limit': '0',
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetTime.toISOString()
          });

          if (result.retryAfter) {
            res.set('Retry-After', result.retryAfter.toString());
          }

          return res.status(429).json({
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: `Rate limit exceeded for ${result.rule?.name || 'unknown rule'}`,
              details: `Request limit exceeded. Try again after ${result.retryAfter || 60} seconds.`,
              timestamp: new Date().toISOString(),
              traceId: req.headers['x-trace-id'] || 'unknown',
              retryAfter: result.retryAfter || 60
            }
          });
        }

        // Set rate limit headers for successful requests
        res.set({
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetTime.toISOString()
        });

        next();
      } catch (error) {
        RateLimitMiddleware.logger.error('Enhanced rate limit error:', error);
        next(); // Continue on error to avoid blocking legitimate requests
      }
    };
  }

  // Advanced traffic control middleware
  static trafficControl() {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (!RateLimitMiddleware.trafficControlConfig.enabled) {
        return next();
      }

      try {
        const user = (req as any).user;
        const clientId = user ? `user:${user.id}` : `ip:${req.ip}`;
        const endpoint = req.path;

        // Check if client is blocked due to burst protection
        if (await RateLimitMiddleware.isClientBlocked(clientId)) {
          return RateLimitMiddleware.sendRateLimitResponse(res, 'CLIENT_BLOCKED', 'Client temporarily blocked due to excessive requests');
        }

        // Check burst protection
        if (RateLimitMiddleware.trafficControlConfig.burstProtection.enabled) {
          const burstViolation = await RateLimitMiddleware.checkBurstProtection(clientId);
          if (burstViolation) {
            await RateLimitMiddleware.blockClient(clientId);
            return RateLimitMiddleware.sendRateLimitResponse(res, 'BURST_PROTECTION_TRIGGERED', 'Too many requests in short time period');
          }
        }

        // Check endpoint-specific limits
        const endpointLimit = RateLimitMiddleware.trafficControlConfig.endpointLimits[endpoint];
        if (endpointLimit) {
          const endpointKey = `endpoint:${endpoint}:${clientId}`;
          const endpointAllowed = await RateLimitMiddleware.checkRateLimit(endpointKey, endpointLimit.max, endpointLimit.windowMs);
          if (!endpointAllowed) {
            return RateLimitMiddleware.sendRateLimitResponse(res, 'ENDPOINT_RATE_LIMIT_EXCEEDED', `Rate limit exceeded for ${endpoint}`);
          }
        }

        // Check user-specific limits
        const userKey = `user:${clientId}`;
        const userAllowed = await RateLimitMiddleware.checkRateLimit(
          userKey,
          RateLimitMiddleware.trafficControlConfig.userLimits.max,
          RateLimitMiddleware.trafficControlConfig.userLimits.windowMs
        );
        if (!userAllowed) {
          return RateLimitMiddleware.sendRateLimitResponse(res, 'USER_RATE_LIMIT_EXCEEDED', 'User rate limit exceeded');
        }

        // Check global limits with adaptive rate limiting
        const globalLimit = RateLimitMiddleware.trafficControlConfig.adaptiveRateLimit.enabled
          ? await RateLimitMiddleware.getAdaptiveGlobalLimit()
          : RateLimitMiddleware.trafficControlConfig.globalLimits.max;

        const globalKey = 'global:requests';
        const globalAllowed = await RateLimitMiddleware.checkRateLimit(
          globalKey,
          globalLimit,
          RateLimitMiddleware.trafficControlConfig.globalLimits.windowMs
        );
        if (!globalAllowed) {
          return RateLimitMiddleware.sendRateLimitResponse(res, 'GLOBAL_RATE_LIMIT_EXCEEDED', 'Global rate limit exceeded');
        }

        // Record request for burst protection
        await RateLimitMiddleware.recordRequest(clientId);

        next();
      } catch (error) {
        RateLimitMiddleware.logger.error('Traffic control error:', error);
        next(); // Continue on error to avoid blocking legitimate requests
      }
    };
  }

  static createRateLimiter() {
    const config = RateLimitMiddleware.configManager.getRateLimitConfig();

    return rateLimit({
      windowMs: config.windowMs,
      max: config.max,
      message: {
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests from this IP, please try again later',
          timestamp: new Date().toISOString(),
          retryAfter: Math.ceil(config.windowMs / 1000)
        }
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req: Request) => {
        // Use user ID if authenticated, otherwise use IP
        const user = (req as any).user;
        return user ? `user:${user.id}` : `ip:${req.ip}`;
      },
      handler: (req: Request) => {
        const user = (req as any).user;
        const identifier = user ? `user:${user.id}` : `ip:${req.ip}`;

        RateLimitMiddleware.logger.warn('Rate limit exceeded', {
          identifier,
          path: req.path,
          method: req.method,
          userAgent: req.get('User-Agent')
        });
      },
      skip: (req: Request) => {
        // Skip rate limiting for health checks and internal endpoints
        const skipPaths = ['/health', '/api/gateway/metrics'];
        return skipPaths.includes(req.path);
      }
    });
  }

  static createCustomRateLimit(options: {
    windowMs: number;
    max: number;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
  }) {
    return rateLimit({
      windowMs: options.windowMs,
      max: options.max,
      skipSuccessfulRequests: options.skipSuccessfulRequests || false,
      skipFailedRequests: options.skipFailedRequests || false,
      message: {
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Rate limit exceeded for this endpoint',
          timestamp: new Date().toISOString(),
          retryAfter: Math.ceil(options.windowMs / 1000)
        }
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req: Request) => {
        const user = (req as any).user;
        return user ? `user:${user.id}:${req.path}` : `ip:${req.ip}:${req.path}`;
      },
      handler: (req: Request) => {
        const user = (req as any).user;
        const identifier = user ? `user:${user.id}` : `ip:${req.ip}`;

        RateLimitMiddleware.logger.warn('Custom rate limit exceeded', {
          identifier,
          path: req.path,
          method: req.method,
          windowMs: options.windowMs,
          max: options.max
        });
      }
    });
  }

  // Specific rate limiters for different endpoint types
  static authRateLimit() {
    return RateLimitMiddleware.createCustomRateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 attempts per window
      skipSuccessfulRequests: true
    });
  }

  static apiRateLimit() {
    return RateLimitMiddleware.createCustomRateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 100 // 100 requests per minute
    });
  }

  static uploadRateLimit() {
    return RateLimitMiddleware.createCustomRateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 10 // 10 uploads per minute
    });
  }

  // Helper methods for advanced traffic control
  private static async checkRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
    if (!RateLimitMiddleware.redisClient) {
      RateLimitMiddleware.logger.warn('Redis client not available, allowing request');
      return true;
    }

    try {
      const current = await RateLimitMiddleware.redisClient.incr(key);

      if (current === 1) {
        await RateLimitMiddleware.redisClient.expire(key, Math.ceil(windowMs / 1000));
      }

      return current <= limit;
    } catch (error) {
      RateLimitMiddleware.logger.error('Rate limit check error:', error);
      return true; // Allow on error
    }
  }

  private static async checkBurstProtection(clientId: string): Promise<boolean> {
    if (!RateLimitMiddleware.redisClient) {
      return false;
    }

    try {
      const burstKey = `burst:${clientId}`;
      const requests = await RateLimitMiddleware.redisClient.lLen(burstKey);

      return requests >= RateLimitMiddleware.trafficControlConfig.burstProtection.threshold;
    } catch (error) {
      RateLimitMiddleware.logger.error('Burst protection check error:', error);
      return false;
    }
  }

  private static async recordRequest(clientId: string): Promise<void> {
    if (!RateLimitMiddleware.redisClient) {
      return;
    }

    try {
      const burstKey = `burst:${clientId}`;
      const now = Date.now();

      // Add current request
      await RateLimitMiddleware.redisClient.lPush(burstKey, now.toString());

      // Remove requests older than 10 seconds
      const tenSecondsAgo = now - 10000;
      await RateLimitMiddleware.redisClient.lTrim(burstKey, 0, -1);

      // Clean old entries
      const requests = await RateLimitMiddleware.redisClient.lRange(burstKey, 0, -1);
      const validRequests = requests.filter(timestamp => parseInt(timestamp) > tenSecondsAgo);

      await RateLimitMiddleware.redisClient.del(burstKey);
      if (validRequests.length > 0) {
        for (const request of validRequests) {
          await RateLimitMiddleware.redisClient.lPush(burstKey, request);
        }
        await RateLimitMiddleware.redisClient.expire(burstKey, 10);
      }
    } catch (error) {
      RateLimitMiddleware.logger.error('Record request error:', error);
    }
  }

  private static async blockClient(clientId: string): Promise<void> {
    if (!RateLimitMiddleware.redisClient) {
      return;
    }

    try {
      const blockKey = `blocked:${clientId}`;
      await RateLimitMiddleware.redisClient.setEx(
        blockKey,
        Math.ceil(RateLimitMiddleware.trafficControlConfig.burstProtection.blockDuration / 1000),
        'blocked'
      );

      RateLimitMiddleware.logger.warn('Client blocked due to burst protection', { clientId });
    } catch (error) {
      RateLimitMiddleware.logger.error('Block client error:', error);
    }
  }

  private static async isClientBlocked(clientId: string): Promise<boolean> {
    if (!RateLimitMiddleware.redisClient) {
      return false;
    }

    try {
      const blockKey = `blocked:${clientId}`;
      const blocked = await RateLimitMiddleware.redisClient.get(blockKey);
      return blocked === 'blocked';
    } catch (error) {
      RateLimitMiddleware.logger.error('Check client blocked error:', error);
      return false;
    }
  }

  private static async getAdaptiveGlobalLimit(): Promise<number> {
    if (!RateLimitMiddleware.redisClient) {
      return RateLimitMiddleware.trafficControlConfig.adaptiveRateLimit.baseLimit;
    }

    try {
      const config = RateLimitMiddleware.trafficControlConfig.adaptiveRateLimit;
      const systemLoadKey = 'system:load';

      // Get current system load (simplified - in production, this would be more sophisticated)
      const currentLoad = await RateLimitMiddleware.redisClient.get(systemLoadKey);
      const load = currentLoad ? parseFloat(currentLoad) : 0.5; // Default to 50% load

      // Adjust limit based on system load
      const adjustment = (1 - load) * config.adjustmentFactor;
      const adaptiveLimit = Math.floor(config.baseLimit * (1 + adjustment));

      return Math.min(Math.max(adaptiveLimit, config.baseLimit), config.maxLimit);
    } catch (error) {
      RateLimitMiddleware.logger.error('Adaptive limit calculation error:', error);
      return RateLimitMiddleware.trafficControlConfig.adaptiveRateLimit.baseLimit;
    }
  }

  private static sendRateLimitResponse(res: Response, code: string, message: string): void {
    res.status(429).json({
      error: {
        code,
        message,
        timestamp: new Date().toISOString(),
        retryAfter: 60 // Default retry after 60 seconds
      }
    });
  }

  // Traffic control configuration methods
  static updateTrafficControlConfig(config: Partial<TrafficControlConfig>): void {
    if (!TrafficControlConfigManager.validateConfig(config)) {
      throw new Error('Invalid traffic control configuration');
    }

    RateLimitMiddleware.trafficControlConfig = TrafficControlConfigManager.mergeWithDefaults(config);
    RateLimitMiddleware.logger.info('Traffic control configuration updated', config);
  }

  static getTrafficControlConfig(): TrafficControlConfig {
    return { ...RateLimitMiddleware.trafficControlConfig };
  }

  // System load monitoring (simplified implementation)
  static async updateSystemLoad(load: number): Promise<void> {
    if (!RateLimitMiddleware.redisClient) {
      return;
    }

    try {
      const systemLoadKey = 'system:load';
      await RateLimitMiddleware.redisClient.setEx(systemLoadKey, 60, load.toString());
    } catch (error) {
      RateLimitMiddleware.logger.error('Update system load error:', error);
    }
  }

  // Get rate limit statistics
  static async getRateLimitStats(): Promise<any> {
    if (!RateLimitMiddleware.redisClient) {
      return { error: 'Redis not available' };
    }

    try {
      const keys = await RateLimitMiddleware.redisClient.keys('*');
      const stats = {
        totalKeys: keys.length,
        blockedClients: keys.filter(key => key.startsWith('blocked:')).length,
        activeRateLimits: keys.filter(key => key.startsWith('user:') || key.startsWith('endpoint:') || key.startsWith('global:')).length,
        burstProtectionActive: keys.filter(key => key.startsWith('burst:')).length
      };

      return stats;
    } catch (error) {
      RateLimitMiddleware.logger.error('Get rate limit stats error:', error);
      return { error: 'Failed to get stats' };
    }
  }

  // Access to RateLimitService for rule management
  static getRateLimitService(): RateLimitService {
    return RateLimitMiddleware.rateLimitService;
  }

  // Enhanced statistics combining both systems
  static async getEnhancedStats(): Promise<any> {
    try {
      const legacyStats = await RateLimitMiddleware.getRateLimitStats();
      const serviceStats = await RateLimitMiddleware.rateLimitService.getStatistics();

      return {
        legacy: legacyStats,
        enhanced: serviceStats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      RateLimitMiddleware.logger.error('Get enhanced stats error:', error);
      return { error: 'Failed to get enhanced stats' };
    }
  }
}