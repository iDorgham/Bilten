import { Request, Response } from 'express';
import { RateLimitMiddleware } from './RateLimitMiddleware';
import { ConfigManager } from '../config/ConfigManager';

// Mock dependencies
jest.mock('../utils/Logger', () => ({
  Logger: {
    getInstance: jest.fn(() => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    }))
  }
}));
jest.mock('../config/ConfigManager');
jest.mock('../config/TrafficControlConfig', () => ({
  TrafficControlConfigManager: {
    getDefaultConfig: jest.fn(() => ({
      enabled: true,
      globalLimits: { windowMs: 60000, max: 1000 },
      userLimits: { windowMs: 60000, max: 100 },
      endpointLimits: {},
      burstProtection: { enabled: true, threshold: 50, blockDuration: 300000 },
      adaptiveRateLimit: { enabled: false, baseLimit: 100, maxLimit: 500, adjustmentFactor: 0.1 }
    })),
    validateConfig: jest.fn(() => true),
    mergeWithDefaults: jest.fn((config) => ({
      enabled: config.enabled !== undefined ? config.enabled : true,
      globalLimits: config.globalLimits || { windowMs: 60000, max: 1000 },
      userLimits: config.userLimits || { windowMs: 60000, max: 100 },
      endpointLimits: config.endpointLimits || {},
      burstProtection: config.burstProtection || { enabled: true, threshold: 50, blockDuration: 300000 },
      adaptiveRateLimit: config.adaptiveRateLimit || { enabled: false, baseLimit: 100, maxLimit: 500, adjustmentFactor: 0.1 }
    }))
  }
}));
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    quit: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    lLen: jest.fn(),
    lPush: jest.fn(),
    lTrim: jest.fn(),
    lRange: jest.fn(),
    del: jest.fn(),
    setEx: jest.fn(),
    get: jest.fn(),
    keys: jest.fn()
  }))
}));

interface MockRequest extends Partial<Request> {
  user?: { id: string } | undefined;
}

describe('RateLimitMiddleware', () => {
  let mockRequest: MockRequest;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;
  let mockRedisClient: any;

  beforeEach(() => {
    mockRequest = {
      ip: '127.0.0.1',
      path: '/api/test',
      method: 'GET',
      user: undefined
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();

    // Mock Redis client
    const { createClient } = require('redis');
    mockRedisClient = createClient();
    
    // Set the mocked Redis client on the RateLimitMiddleware
    (RateLimitMiddleware as any).redisClient = mockRedisClient;
    
    // Mock ConfigManager
    const mockConfigManager = new ConfigManager();
    (mockConfigManager.getRedisConfig as jest.Mock) = jest.fn().mockReturnValue({
      host: 'localhost',
      port: 6379,
      password: undefined,
      db: 0
    });

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('Traffic Control', () => {
    it('should allow requests when traffic control is disabled', async () => {
      RateLimitMiddleware.updateTrafficControlConfig({ enabled: false });
      
      const middleware = RateLimitMiddleware.trafficControl();
      await middleware(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should block requests when client is blocked', async () => {
      RateLimitMiddleware.updateTrafficControlConfig({ enabled: true });
      mockRedisClient.get.mockResolvedValue('blocked');

      const middleware = RateLimitMiddleware.trafficControl();
      await middleware(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'CLIENT_BLOCKED'
          })
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should trigger burst protection when threshold is exceeded', async () => {
      RateLimitMiddleware.updateTrafficControlConfig({
        enabled: true,
        burstProtection: {
          enabled: true,
          threshold: 5,
          blockDuration: 300000
        }
      });

      mockRedisClient.get.mockResolvedValue(null); // Not blocked initially
      mockRedisClient.lLen.mockResolvedValue(6); // Exceeds threshold

      const middleware = RateLimitMiddleware.trafficControl();
      await middleware(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockRedisClient.setEx).toHaveBeenCalled(); // Client should be blocked
      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'BURST_PROTECTION_TRIGGERED'
          })
        })
      );
    });

    it('should enforce endpoint-specific rate limits', async () => {
      RateLimitMiddleware.updateTrafficControlConfig({
        enabled: true,
        endpointLimits: {
          '/api/test': { windowMs: 60000, max: 10 }
        }
      });

      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.lLen.mockResolvedValue(0);
      mockRedisClient.incr.mockResolvedValue(11); // Exceeds endpoint limit

      const middleware = RateLimitMiddleware.trafficControl();
      await middleware(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'ENDPOINT_RATE_LIMIT_EXCEEDED'
          })
        })
      );
    });

    it('should enforce user-specific rate limits', async () => {
      mockRequest.user = { id: 'user123' };
      
      RateLimitMiddleware.updateTrafficControlConfig({
        enabled: true,
        userLimits: { windowMs: 60000, max: 100 }
      });

      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.lLen.mockResolvedValue(0);
      mockRedisClient.incr.mockResolvedValue(101); // User limit exceeded

      const middleware = RateLimitMiddleware.trafficControl();
      await middleware(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'USER_RATE_LIMIT_EXCEEDED'
          })
        })
      );
    });

    it('should enforce global rate limits', async () => {
      RateLimitMiddleware.updateTrafficControlConfig({
        enabled: true,
        globalLimits: { windowMs: 60000, max: 1000 },
        adaptiveRateLimit: { enabled: false, baseLimit: 1000, maxLimit: 2000, adjustmentFactor: 0.1 }
      });

      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.lLen.mockResolvedValue(0);
      mockRedisClient.incr
        .mockResolvedValueOnce(50) // User limit check passes
        .mockResolvedValueOnce(1001); // Global limit exceeded

      const middleware = RateLimitMiddleware.trafficControl();
      await middleware(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'GLOBAL_RATE_LIMIT_EXCEEDED'
          })
        })
      );
    });

    it('should allow requests when all limits are within bounds', async () => {
      RateLimitMiddleware.updateTrafficControlConfig({
        enabled: true,
        userLimits: { windowMs: 60000, max: 100 },
        globalLimits: { windowMs: 60000, max: 1000 }
      });

      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.lLen.mockResolvedValue(0);
      mockRedisClient.incr
        .mockResolvedValueOnce(50) // User limit check passes
        .mockResolvedValueOnce(500); // Global limit check passes
      mockRedisClient.lRange.mockResolvedValue([]);

      const middleware = RateLimitMiddleware.trafficControl();
      await middleware(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('Configuration Management', () => {
    it('should update traffic control configuration', () => {
      const newConfig = {
        enabled: false,
        globalLimits: { windowMs: 120000, max: 2000 }
      };

      RateLimitMiddleware.updateTrafficControlConfig(newConfig);
      const config = RateLimitMiddleware.getTrafficControlConfig();

      expect(config.enabled).toBe(false);
      expect(config.globalLimits.windowMs).toBe(120000);
      expect(config.globalLimits.max).toBe(2000);
    });

    it('should get current traffic control configuration', () => {
      const config = RateLimitMiddleware.getTrafficControlConfig();
      
      expect(config).toHaveProperty('enabled');
      expect(config).toHaveProperty('globalLimits');
      expect(config).toHaveProperty('userLimits');
      expect(config).toHaveProperty('endpointLimits');
      expect(config).toHaveProperty('burstProtection');
      expect(config).toHaveProperty('adaptiveRateLimit');
    });
  });

  describe('Statistics', () => {
    it('should return rate limit statistics', async () => {
      mockRedisClient.keys.mockResolvedValue([
        'blocked:client1',
        'blocked:client2',
        'user:user1',
        'endpoint:/api/test:user1',
        'global:requests',
        'burst:client1'
      ]);

      const stats = await RateLimitMiddleware.getRateLimitStats();

      expect(stats).toEqual({
        totalKeys: 6,
        blockedClients: 2,
        activeRateLimits: 3,
        burstProtectionActive: 1
      });
    });

    it('should handle Redis errors gracefully in statistics', async () => {
      mockRedisClient.keys.mockRejectedValue(new Error('Redis error'));

      const stats = await RateLimitMiddleware.getRateLimitStats();

      expect(stats).toEqual({ error: 'Failed to get stats' });
    });
  });

  describe('System Load Management', () => {
    it('should update system load', async () => {
      await RateLimitMiddleware.updateSystemLoad(0.7);

      expect(mockRedisClient.setEx).toHaveBeenCalledWith('system:load', 60, '0.7');
    });

    it('should handle Redis errors gracefully when updating system load', async () => {
      mockRedisClient.setEx.mockRejectedValue(new Error('Redis error'));

      // Should not throw
      await expect(RateLimitMiddleware.updateSystemLoad(0.5)).resolves.toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should continue on Redis errors to avoid blocking legitimate requests', async () => {
      RateLimitMiddleware.updateTrafficControlConfig({ enabled: true });
      
      // Mock Redis to throw an error
      mockRedisClient.get.mockRejectedValue(new Error('Redis connection error'));
      mockRedisClient.lLen.mockRejectedValue(new Error('Redis connection error'));
      mockRedisClient.incr.mockRejectedValue(new Error('Redis connection error'));

      const middleware = RateLimitMiddleware.trafficControl();
      await middleware(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should handle missing Redis client gracefully', async () => {
      // Simulate uninitialized Redis client
      (RateLimitMiddleware as any).redisClient = null;

      const middleware = RateLimitMiddleware.trafficControl();
      await middleware(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });
});