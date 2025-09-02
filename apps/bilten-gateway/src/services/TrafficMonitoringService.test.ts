import { TrafficMonitoringService } from './TrafficMonitoringService';

// Mock Redis client
const mockRedisClient = {
  connect: jest.fn(),
  quit: jest.fn(),
  setEx: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
  incr: jest.fn(),
  sAdd: jest.fn(),
  sCard: jest.fn(),
  zIncrBy: jest.fn(),
  zRangeWithScores: jest.fn(),
  expire: jest.fn(),
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

describe('TrafficMonitoringService', () => {
  let trafficMonitoringService: TrafficMonitoringService;

  beforeEach(() => {
    jest.clearAllMocks();
    trafficMonitoringService = new TrafficMonitoringService(mockConfigManager as any);
  });

  afterEach(async () => {
    await trafficMonitoringService.shutdown();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      mockRedisClient.connect.mockResolvedValue(undefined);
      
      await trafficMonitoringService.initialize();
      
      expect(mockRedisClient.connect).toHaveBeenCalled();
    });

    it('should handle Redis connection failure in development', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      mockRedisClient.connect.mockRejectedValue(new Error('Connection failed'));
      
      await expect(trafficMonitoringService.initialize()).resolves.not.toThrow();
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('request recording', () => {
    beforeEach(async () => {
      mockRedisClient.connect.mockResolvedValue(undefined);
      await trafficMonitoringService.initialize();
    });

    it('should record a request and update traffic pattern', async () => {
      const request = {
        clientId: 'user123',
        clientType: 'user' as const,
        endpoint: '/api/test',
        method: 'GET',
        ip: '192.168.1.1',
        country: 'US',
        region: 'CA',
        userAgent: 'Mozilla/5.0',
        statusCode: 200,
        responseTime: 100,
        timestamp: new Date()
      };

      mockRedisClient.setEx.mockResolvedValue('OK');

      await trafficMonitoringService.recordRequest(request);

      const patterns = trafficMonitoringService.getTrafficPatterns();
      expect(patterns).toHaveLength(1);
      
      const pattern = patterns[0];
      expect(pattern.clientId).toBe('user123');
      expect(pattern.requestCount).toBe(1);
      expect(pattern.countries).toContain('US');
      expect(pattern.endpoints).toContain('/api/test');
    });

    it('should detect rapid requests as suspicious activity', async () => {
      const baseRequest = {
        clientId: 'user123',
        clientType: 'user' as const,
        endpoint: '/api/test',
        method: 'GET',
        ip: '192.168.1.1',
        country: 'US',
        userAgent: 'Mozilla/5.0',
        statusCode: 200,
        responseTime: 100,
        timestamp: new Date()
      };

      mockRedisClient.setEx.mockResolvedValue('OK');

      // Simulate rapid requests by recording multiple requests quickly
      for (let i = 0; i < 15; i++) {
        await trafficMonitoringService.recordRequest({
          ...baseRequest,
          timestamp: new Date(Date.now() + i * 100) // 100ms apart
        });
      }

      const patterns = trafficMonitoringService.getTrafficPatterns();
      const pattern = patterns[0];
      
      expect(pattern.suspiciousActivities.length).toBeGreaterThan(0);
      expect(pattern.suspiciousActivities.some(a => a.type === 'rapid_requests')).toBe(true);
    });

    it('should detect geographic anomalies', async () => {
      const countries = ['US', 'UK', 'DE', 'FR', 'JP', 'AU', 'CA'];
      
      mockRedisClient.setEx.mockResolvedValue('OK');

      for (let i = 0; i < countries.length; i++) {
        await trafficMonitoringService.recordRequest({
          clientId: 'user123',
          clientType: 'user' as const,
          endpoint: '/api/test',
          method: 'GET',
          ip: '192.168.1.1',
          country: countries[i],
          userAgent: 'Mozilla/5.0',
          statusCode: 200,
          responseTime: 100,
          timestamp: new Date(Date.now() + i * 1000)
        });
      }

      const patterns = trafficMonitoringService.getTrafficPatterns();
      const pattern = patterns[0];
      
      expect(pattern.countries.length).toBe(countries.length);
      expect(pattern.suspiciousActivities.some(a => a.type === 'geographic_anomaly')).toBe(true);
    });

    it('should detect endpoint scanning', async () => {
      mockRedisClient.setEx.mockResolvedValue('OK');

      // Simulate scanning many different endpoints
      for (let i = 0; i < 60; i++) {
        await trafficMonitoringService.recordRequest({
          clientId: 'user123',
          clientType: 'user' as const,
          endpoint: `/api/endpoint${i}`,
          method: 'GET',
          ip: '192.168.1.1',
          country: 'US',
          userAgent: 'Mozilla/5.0',
          statusCode: 404,
          responseTime: 50,
          timestamp: new Date(Date.now() + i * 1000)
        });
      }

      const patterns = trafficMonitoringService.getTrafficPatterns();
      const pattern = patterns[0];
      
      expect(pattern.endpoints.length).toBe(60);
      expect(pattern.suspiciousActivities.some(a => a.type === 'endpoint_scanning')).toBe(true);
    });
  });

  describe('client blocking', () => {
    beforeEach(async () => {
      mockRedisClient.connect.mockResolvedValue(undefined);
      await trafficMonitoringService.initialize();
    });

    it('should block a client', async () => {
      mockRedisClient.setEx.mockResolvedValue('OK');

      await trafficMonitoringService.blockClient('user123', 'user', 'Test block', 3600);

      mockRedisClient.get.mockResolvedValue(JSON.stringify({
        clientId: 'user123',
        clientType: 'user',
        reason: 'Test block'
      }));

      const isBlocked = await trafficMonitoringService.isClientBlocked('user123', 'user');
      expect(isBlocked).toBe(true);
    });

    it('should unblock a client', async () => {
      mockRedisClient.setEx.mockResolvedValue('OK');
      mockRedisClient.del.mockResolvedValue(1);

      await trafficMonitoringService.blockClient('user123', 'user', 'Test block', 3600);
      await trafficMonitoringService.unblockClient('user123', 'user');

      mockRedisClient.get.mockResolvedValue(null);

      const isBlocked = await trafficMonitoringService.isClientBlocked('user123', 'user');
      expect(isBlocked).toBe(false);
    });
  });

  describe('geographic restrictions', () => {
    beforeEach(async () => {
      mockRedisClient.connect.mockResolvedValue(undefined);
      await trafficMonitoringService.initialize();
    });

    it('should add a geographic restriction', async () => {
      const restriction = {
        name: 'Block High Risk Countries',
        type: 'block' as const,
        countries: ['XX', 'YY'],
        isActive: true
      };

      const id = await trafficMonitoringService.addGeographicRestriction(restriction);
      
      expect(id).toBeDefined();
      
      const restrictions = trafficMonitoringService.getGeographicRestrictions();
      expect(restrictions).toHaveLength(2); // 1 default + 1 added
      expect(restrictions.some(r => r.name === restriction.name)).toBe(true);
    });

    it('should remove a geographic restriction', async () => {
      const restriction = {
        name: 'Test Restriction',
        type: 'block' as const,
        countries: ['XX'],
        isActive: true
      };

      const id = await trafficMonitoringService.addGeographicRestriction(restriction);
      await trafficMonitoringService.removeGeographicRestriction(id);
      
      const restrictions = trafficMonitoringService.getGeographicRestrictions();
      expect(restrictions.some(r => r.id === id)).toBe(false);
    });
  });

  describe('IP access control', () => {
    beforeEach(async () => {
      mockRedisClient.connect.mockResolvedValue(undefined);
      await trafficMonitoringService.initialize();
    });

    it('should add IP access control', async () => {
      const control = {
        ipAddress: '192.168.1.100',
        type: 'blacklist' as const,
        reason: 'Malicious activity',
        isActive: true
      };

      const id = await trafficMonitoringService.addIPAccessControl(control);
      
      expect(id).toBeDefined();
      
      const controls = trafficMonitoringService.getIPAccessControls();
      expect(controls).toHaveLength(1);
      expect(controls[0].ipAddress).toBe(control.ipAddress);
    });

    it('should check IP access correctly', async () => {
      const control = {
        ipAddress: '192.168.1.100',
        type: 'blacklist' as const,
        reason: 'Malicious activity',
        isActive: true
      };

      await trafficMonitoringService.addIPAccessControl(control);
      
      const blockedResult = await trafficMonitoringService.checkIPAccess('192.168.1.100');
      expect(blockedResult.allowed).toBe(false);
      expect(blockedResult.reason).toBe(control.reason);
      
      const allowedResult = await trafficMonitoringService.checkIPAccess('192.168.1.200');
      expect(allowedResult.allowed).toBe(true);
    });

    it('should handle whitelist correctly', async () => {
      const control = {
        ipAddress: '192.168.1.100',
        type: 'whitelist' as const,
        reason: 'Trusted IP',
        isActive: true
      };

      await trafficMonitoringService.addIPAccessControl(control);
      
      const result = await trafficMonitoringService.checkIPAccess('192.168.1.100');
      expect(result.allowed).toBe(true);
    });
  });

  describe('analytics', () => {
    beforeEach(async () => {
      mockRedisClient.connect.mockResolvedValue(undefined);
      await trafficMonitoringService.initialize();
    });

    it('should return analytics data', async () => {
      mockRedisClient.get.mockResolvedValue('100');
      mockRedisClient.sCard.mockResolvedValue(50);
      mockRedisClient.zRangeWithScores.mockResolvedValue([
        { value: 'US', score: 30 },
        { value: 'UK', score: 20 }
      ]);

      const analytics = await trafficMonitoringService.getAnalytics();
      
      expect(analytics.totalRequests).toBe(100);
      expect(analytics.uniqueClients).toBe(50);
      expect(analytics.topCountries).toHaveLength(2);
      expect(analytics.topCountries[0].country).toBe('US');
      expect(analytics.topCountries[0].count).toBe(30);
    });

    it('should handle Redis unavailable for analytics', async () => {
      const serviceWithoutRedis = new TrafficMonitoringService(mockConfigManager as any);
      
      const analytics = await serviceWithoutRedis.getAnalytics();
      
      expect(analytics.totalRequests).toBe(0);
      expect(analytics.uniqueClients).toBe(0);
      expect(analytics.topCountries).toHaveLength(0);
    });
  });

  describe('configuration', () => {
    it('should update configuration', () => {
      const newConfig = {
        rapidRequestThreshold: 20,
        autoBlockEnabled: true
      };

      trafficMonitoringService.updateConfig(newConfig);
      
      // Configuration should be updated (we can't directly test private config,
      // but we can test that the method doesn't throw)
      expect(() => trafficMonitoringService.updateConfig(newConfig)).not.toThrow();
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      mockRedisClient.connect.mockResolvedValue(undefined);
      await trafficMonitoringService.initialize();
    });

    it('should handle Redis errors gracefully during request recording', async () => {
      mockRedisClient.setEx.mockRejectedValue(new Error('Redis error'));

      const request = {
        clientId: 'user123',
        clientType: 'user' as const,
        endpoint: '/api/test',
        method: 'GET',
        ip: '192.168.1.1',
        country: 'US',
        userAgent: 'Mozilla/5.0',
        statusCode: 200,
        responseTime: 100,
        timestamp: new Date()
      };

      // Should not throw error
      await expect(trafficMonitoringService.recordRequest(request)).resolves.not.toThrow();
    });

    it('should handle Redis errors gracefully during client blocking check', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Redis error'));

      const isBlocked = await trafficMonitoringService.isClientBlocked('user123', 'user');
      
      // Should return false on error to avoid blocking legitimate requests
      expect(isBlocked).toBe(false);
    });
  });
});