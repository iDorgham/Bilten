import { RateLimitService, RateLimitRule, RateLimitContext } from './RateLimitService';

// Mock Redis client
const mockRedisClient = {
  connect: jest.fn(),
  quit: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn(),
  ttl: jest.fn(),
  zAdd: jest.fn(),
  zRemRangeByScore: jest.fn(),
  zCard: jest.fn(),
  keys: jest.fn(),
  on: jest.fn()
};

// Mock ConfigManager
const mockConfigManager = {
  getRedisConfig: jest.fn(() => ({
    host: 'localhost',
    port: 6379,
    db: 0,
    password: undefined
  }))
};

// Mock Redis module
jest.mock('redis', () => ({
  createClient: jest.fn(() => mockRedisClient)
}));

describe('RateLimitService', () => {
  let rateLimitService: RateLimitService;

  beforeEach(() => {
    jest.clearAllMocks();
    rateLimitService = new RateLimitService(mockConfigManager as any);
  });

  afterEach(async () => {
    await rateLimitService.shutdown();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      mockRedisClient.connect.mockResolvedValue(undefined);
      
      await rateLimitService.initialize();
      
      expect(mockRedisClient.connect).toHaveBeenCalled();
    });

    it('should handle Redis connection failure in development', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      mockRedisClient.connect.mockRejectedValue(new Error('Connection failed'));
      
      await expect(rateLimitService.initialize()).resolves.not.toThrow();
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should throw error on Redis connection failure in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      mockRedisClient.connect.mockRejectedValue(new Error('Connection failed'));
      
      await expect(rateLimitService.initialize()).rejects.toThrow('Connection failed');
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('rule management', () => {
    beforeEach(async () => {
      mockRedisClient.connect.mockResolvedValue(undefined);
      await rateLimitService.initialize();
    });

    it('should add a new rule', async () => {
      const rule: RateLimitRule = {
        id: 'test-rule',
        name: 'Test Rule',
        clientType: 'user',
        endpoints: ['/api/test'],
        methods: ['GET'],
        requestsPerMinute: 10,
        action: 'throttle',
        conditions: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await rateLimitService.addRule(rule);
      
      const retrievedRule = rateLimitService.getRule('test-rule');
      expect(retrievedRule).toEqual(rule);
    });

    it('should update an existing rule', async () => {
      const rule: RateLimitRule = {
        id: 'test-rule',
        name: 'Test Rule',
        clientType: 'user',
        endpoints: ['/api/test'],
        methods: ['GET'],
        requestsPerMinute: 10,
        action: 'throttle',
        conditions: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await rateLimitService.addRule(rule);
      await rateLimitService.updateRule('test-rule', { requestsPerMinute: 20 });
      
      const updatedRule = rateLimitService.getRule('test-rule');
      expect(updatedRule?.requestsPerMinute).toBe(20);
    });

    it('should delete a rule', async () => {
      const rule: RateLimitRule = {
        id: 'test-rule',
        name: 'Test Rule',
        clientType: 'user',
        endpoints: ['/api/test'],
        methods: ['GET'],
        requestsPerMinute: 10,
        action: 'throttle',
        conditions: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await rateLimitService.addRule(rule);
      await rateLimitService.deleteRule('test-rule');
      
      const retrievedRule = rateLimitService.getRule('test-rule');
      expect(retrievedRule).toBeUndefined();
    });

    it('should validate rule properties', async () => {
      const invalidRule = {
        id: '',
        name: 'Test Rule',
        clientType: 'invalid' as any,
        endpoints: [],
        methods: [],
        action: 'invalid' as any,
        conditions: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await expect(rateLimitService.addRule(invalidRule)).rejects.toThrow();
    });
  });

  describe('rate limit checking', () => {
    beforeEach(async () => {
      mockRedisClient.connect.mockResolvedValue(undefined);
      await rateLimitService.initialize();
    });

    it('should allow requests within limits', async () => {
      const rule: RateLimitRule = {
        id: 'test-rule',
        name: 'Test Rule',
        clientType: 'user',
        endpoints: ['/api/test'],
        methods: ['GET'],
        requestsPerMinute: 10,
        action: 'throttle',
        conditions: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await rateLimitService.addRule(rule);

      const context: RateLimitContext = {
        clientId: 'user123',
        clientType: 'user',
        endpoint: '/api/test',
        method: 'GET',
        headers: {},
        query: {},
        ip: '127.0.0.1',
        timestamp: new Date()
      };

      mockRedisClient.incr.mockResolvedValue(1);
      mockRedisClient.ttl.mockResolvedValue(60);

      const result = await rateLimitService.checkRateLimit(context);
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThan(0);
    });

    it('should deny requests exceeding limits', async () => {
      const rule: RateLimitRule = {
        id: 'test-rule',
        name: 'Test Rule',
        clientType: 'user',
        endpoints: ['/api/test'],
        methods: ['GET'],
        requestsPerMinute: 10,
        action: 'throttle',
        conditions: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await rateLimitService.addRule(rule);

      const context: RateLimitContext = {
        clientId: 'user123',
        clientType: 'user',
        endpoint: '/api/test',
        method: 'GET',
        headers: {},
        query: {},
        ip: '127.0.0.1',
        timestamp: new Date()
      };

      mockRedisClient.incr.mockResolvedValue(11); // Exceeds limit of 10
      mockRedisClient.ttl.mockResolvedValue(30);

      const result = await rateLimitService.checkRateLimit(context);
      
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBe(30);
      expect(result.rule).toEqual(rule);
    });

    it('should handle burst limits', async () => {
      const rule: RateLimitRule = {
        id: 'test-rule',
        name: 'Test Rule',
        clientType: 'user',
        endpoints: ['/api/test'],
        methods: ['GET'],
        requestsPerMinute: 60,
        burstSize: 5,
        action: 'throttle',
        conditions: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await rateLimitService.addRule(rule);

      const context: RateLimitContext = {
        clientId: 'user123',
        clientType: 'user',
        endpoint: '/api/test',
        method: 'GET',
        headers: {},
        query: {},
        ip: '127.0.0.1',
        timestamp: new Date()
      };

      mockRedisClient.incr.mockResolvedValue(1);
      mockRedisClient.ttl.mockResolvedValue(60);
      mockRedisClient.zAdd.mockResolvedValue(1);
      mockRedisClient.zRemRangeByScore.mockResolvedValue(0);
      mockRedisClient.zCard.mockResolvedValue(6); // Exceeds burst limit of 5

      const result = await rateLimitService.checkRateLimit(context);
      
      expect(result.allowed).toBe(false);
    });

    it('should match wildcard endpoints', async () => {
      const rule: RateLimitRule = {
        id: 'test-rule',
        name: 'Test Rule',
        clientType: 'user',
        endpoints: ['/api/*'],
        methods: ['*'],
        requestsPerMinute: 10,
        action: 'throttle',
        conditions: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await rateLimitService.addRule(rule);

      const context: RateLimitContext = {
        clientId: 'user123',
        clientType: 'user',
        endpoint: '/api/users/profile',
        method: 'GET',
        headers: {},
        query: {},
        ip: '127.0.0.1',
        timestamp: new Date()
      };

      mockRedisClient.incr.mockResolvedValue(1);
      mockRedisClient.ttl.mockResolvedValue(60);

      const result = await rateLimitService.checkRateLimit(context);
      
      expect(result.allowed).toBe(true);
    });

    it('should evaluate conditions correctly', async () => {
      const rule: RateLimitRule = {
        id: 'test-rule',
        name: 'Test Rule',
        clientType: 'user',
        endpoints: ['/api/test'],
        methods: ['GET'],
        requestsPerMinute: 10,
        action: 'throttle',
        conditions: [
          {
            type: 'header',
            field: 'x-api-version',
            operator: 'equals',
            value: 'v1'
          }
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await rateLimitService.addRule(rule);

      const context: RateLimitContext = {
        clientId: 'user123',
        clientType: 'user',
        endpoint: '/api/test',
        method: 'GET',
        headers: { 'x-api-version': 'v1' },
        query: {},
        ip: '127.0.0.1',
        timestamp: new Date()
      };

      mockRedisClient.incr.mockResolvedValue(1);
      mockRedisClient.ttl.mockResolvedValue(60);

      const result = await rateLimitService.checkRateLimit(context);
      
      expect(result.allowed).toBe(true);
    });

    it('should skip rules when conditions do not match', async () => {
      const rule: RateLimitRule = {
        id: 'test-rule',
        name: 'Test Rule',
        clientType: 'user',
        endpoints: ['/api/test'],
        methods: ['GET'],
        requestsPerMinute: 1, // Very restrictive
        action: 'throttle',
        conditions: [
          {
            type: 'header',
            field: 'x-api-version',
            operator: 'equals',
            value: 'v2'
          }
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await rateLimitService.addRule(rule);

      const context: RateLimitContext = {
        clientId: 'user123',
        clientType: 'user',
        endpoint: '/api/test',
        method: 'GET',
        headers: { 'x-api-version': 'v1' }, // Different version
        query: {},
        ip: '127.0.0.1',
        timestamp: new Date()
      };

      const result = await rateLimitService.checkRateLimit(context);
      
      // Should be allowed because condition doesn't match
      expect(result.allowed).toBe(true);
    });
  });

  describe('statistics', () => {
    beforeEach(async () => {
      mockRedisClient.connect.mockResolvedValue(undefined);
      await rateLimitService.initialize();
    });

    it('should return statistics', async () => {
      mockRedisClient.keys.mockResolvedValue(['rate_limit:test-rule:user:123:minute']);

      const stats = await rateLimitService.getStatistics();
      
      expect(stats.totalKeys).toBe(1);
      expect(stats.activeRules).toBeGreaterThan(0);
      expect(stats.rulesByType).toBeDefined();
    });

    it('should handle Redis unavailable for statistics', async () => {
      const serviceWithoutRedis = new RateLimitService(mockConfigManager as any);
      
      const stats = await serviceWithoutRedis.getStatistics();
      
      expect(stats.error).toBe('Redis not available');
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      mockRedisClient.connect.mockResolvedValue(undefined);
      await rateLimitService.initialize();
    });

    it('should allow requests when Redis operations fail', async () => {
      const rule: RateLimitRule = {
        id: 'test-rule',
        name: 'Test Rule',
        clientType: 'user',
        endpoints: ['/api/test'],
        methods: ['GET'],
        requestsPerMinute: 10,
        action: 'throttle',
        conditions: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await rateLimitService.addRule(rule);

      const context: RateLimitContext = {
        clientId: 'user123',
        clientType: 'user',
        endpoint: '/api/test',
        method: 'GET',
        headers: {},
        query: {},
        ip: '127.0.0.1',
        timestamp: new Date()
      };

      mockRedisClient.incr.mockRejectedValue(new Error('Redis error'));

      const result = await rateLimitService.checkRateLimit(context);
      
      // Should allow request on Redis error to avoid blocking legitimate traffic
      expect(result.allowed).toBe(true);
    });
  });
});