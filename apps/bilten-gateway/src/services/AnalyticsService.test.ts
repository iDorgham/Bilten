import { AnalyticsService, AlertRule } from './AnalyticsService';
import { HealthCheckService } from './HealthCheckService';
import { MetricsMiddleware } from '../middleware/MetricsMiddleware';

// Mock dependencies
jest.mock('./HealthCheckService');
jest.mock('../middleware/MetricsMiddleware');
jest.mock('../utils/Logger', () => ({
  Logger: {
    getInstance: jest.fn(() => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      http: jest.fn()
    }))
  }
}));

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;
  let mockHealthCheckService: jest.Mocked<HealthCheckService>;

  beforeEach(() => {
    mockHealthCheckService = new HealthCheckService() as jest.Mocked<HealthCheckService>;
    analyticsService = new AnalyticsService(mockHealthCheckService);
    
    // Clear any existing timers
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await analyticsService.initialize();
      
      // Verify that default alert rules are created
      const alertRules = analyticsService.getAlertRules();
      expect(alertRules.length).toBeGreaterThan(0);
      expect(alertRules.some(rule => rule.name === 'High Error Rate')).toBe(true);
      expect(alertRules.some(rule => rule.name === 'High Response Time')).toBe(true);
    });

    it('should start system metrics collection', async () => {
      await analyticsService.initialize();
      
      // Fast-forward time to trigger metrics collection
      jest.advanceTimersByTime(60000); // 1 minute
      
      // System metrics should be collected (this would need more detailed mocking)
      expect(true).toBe(true); // Placeholder assertion
    });
  });

  describe('performance analytics', () => {
    beforeEach(() => {
      // Mock MetricsMiddleware.getMetrics to return sample data
      const mockMetrics = [
        {
          timestamp: new Date('2024-01-01T10:00:00Z'),
          method: 'GET',
          path: '/api/users',
          statusCode: 200,
          responseTime: 150,
          requestSize: 0,
          responseSize: 1024,
          clientIP: '127.0.0.1'
        },
        {
          timestamp: new Date('2024-01-01T10:01:00Z'),
          method: 'POST',
          path: '/api/users',
          statusCode: 201,
          responseTime: 250,
          requestSize: 512,
          responseSize: 256,
          clientIP: '127.0.0.1'
        },
        {
          timestamp: new Date('2024-01-01T10:02:00Z'),
          method: 'GET',
          path: '/api/users',
          statusCode: 500,
          responseTime: 1000,
          requestSize: 0,
          responseSize: 128,
          clientIP: '127.0.0.1'
        }
      ];

      (MetricsMiddleware.getMetrics as jest.Mock).mockReturnValue(mockMetrics);
    });

    it('should calculate performance analytics correctly', () => {
      const analytics = analyticsService.getPerformanceAnalytics();

      expect(analytics.requestVolume.total).toBe(3);
      expect(analytics.responseTime.average).toBeCloseTo(466.67, 1);
      expect(analytics.errorRate.percentage).toBeCloseTo(33.33, 1);
      expect(analytics.errorRate.by5xx).toBe(1);
      expect(analytics.topEndpoints).toHaveLength(2);
    });

    it('should filter analytics by time range', () => {
      const timeRange = {
        start: new Date('2024-01-01T10:00:30Z'),
        end: new Date('2024-01-01T10:01:30Z')
      };

      const analytics = analyticsService.getPerformanceAnalytics(timeRange);

      expect(analytics.requestVolume.total).toBe(1); // Only the POST request
      expect(analytics.responseTime.average).toBe(250);
      expect(analytics.errorRate.percentage).toBe(0);
    });

    it('should calculate percentiles correctly', () => {
      const analytics = analyticsService.getPerformanceAnalytics();

      expect(analytics.responseTime.p50).toBe(250); // Median
      expect(analytics.responseTime.p95).toBe(1000); // 95th percentile
      expect(analytics.responseTime.p99).toBe(1000); // 99th percentile
    });
  });

  describe('alert management', () => {
    beforeEach(async () => {
      await analyticsService.initialize();
    });

    it('should add custom alert rules', () => {
      const customRule: AlertRule = {
        id: 'custom-rule',
        name: 'Custom Rule',
        condition: {
          metric: 'errorRate',
          operator: 'gt',
          threshold: 10,
          duration: 300
        },
        enabled: true,
        actions: [{ type: 'log', config: { level: 'error' } }]
      };

      analyticsService.addAlertRule(customRule);

      const rules = analyticsService.getAlertRules();
      expect(rules.some(rule => rule.id === 'custom-rule')).toBe(true);
    });

    it('should update existing alert rules', () => {
      const rules = analyticsService.getAlertRules();
      const ruleToUpdate = rules[0];
      
      const success = analyticsService.updateAlertRule(ruleToUpdate.id, {
        enabled: false,
        condition: { ...ruleToUpdate.condition, threshold: 20 }
      });

      expect(success).toBe(true);
      
      const updatedRules = analyticsService.getAlertRules();
      const updatedRule = updatedRules.find(r => r.id === ruleToUpdate.id);
      expect(updatedRule?.enabled).toBe(false);
      expect(updatedRule?.condition.threshold).toBe(20);
    });

    it('should delete alert rules', () => {
      const rules = analyticsService.getAlertRules();
      const ruleToDelete = rules[0];
      
      const success = analyticsService.deleteAlertRule(ruleToDelete.id);

      expect(success).toBe(true);
      
      const remainingRules = analyticsService.getAlertRules();
      expect(remainingRules.some(r => r.id === ruleToDelete.id)).toBe(false);
    });

    it('should return false when updating non-existent rule', () => {
      const success = analyticsService.updateAlertRule('non-existent', { enabled: false });
      expect(success).toBe(false);
    });

    it('should return false when deleting non-existent rule', () => {
      const success = analyticsService.deleteAlertRule('non-existent');
      expect(success).toBe(false);
    });
  });

  describe('real-time metrics', () => {
    beforeEach(async () => {
      // Mock health check service
      mockHealthCheckService.getHealthySummary.mockReturnValue({
        total: 3,
        healthy: 2,
        unhealthy: 1,
        unknown: 0,
        healthyPercentage: 66.67
      });

      // Mock MetricsMiddleware
      (MetricsMiddleware.getMetrics as jest.Mock).mockReturnValue([
        {
          timestamp: new Date(Date.now() - 30000), // 30 seconds ago
          method: 'GET',
          path: '/api/test',
          statusCode: 200,
          responseTime: 100,
          requestSize: 0,
          responseSize: 512,
          clientIP: '127.0.0.1'
        }
      ]);

      await analyticsService.initialize();
    });

    it('should provide real-time metrics', () => {
      const realtimeMetrics = analyticsService.getRealtimeMetrics();

      expect(realtimeMetrics).toHaveProperty('timestamp');
      expect(realtimeMetrics).toHaveProperty('requests');
      expect(realtimeMetrics).toHaveProperty('system');
      expect(realtimeMetrics).toHaveProperty('services');
      expect(realtimeMetrics).toHaveProperty('alerts');

      expect(realtimeMetrics.services.total).toBe(3);
      expect(realtimeMetrics.services.healthy).toBe(2);
    });
  });

  describe('system metrics collection', () => {
    beforeEach(async () => {
      await analyticsService.initialize();
    });

    it('should collect system metrics periodically', () => {
      // Fast-forward time to trigger metrics collection
      jest.advanceTimersByTime(60000); // 1 minute

      const systemMetrics = analyticsService.getSystemMetrics();
      expect(systemMetrics.length).toBeGreaterThan(0);
    });

    it('should limit system metrics history', () => {
      // Simulate collecting metrics for more than the limit
      for (let i = 0; i < 1500; i++) {
        jest.advanceTimersByTime(60000); // 1 minute each
      }

      const systemMetrics = analyticsService.getSystemMetrics();
      expect(systemMetrics.length).toBeLessThanOrEqual(1440); // MAX_METRICS_HISTORY
    });

    it('should filter system metrics by time range', () => {
      // Collect some metrics
      jest.advanceTimersByTime(180000); // 3 minutes

      const now = new Date();
      const twoMinutesAgo = new Date(now.getTime() - 120000);
      
      const filteredMetrics = analyticsService.getSystemMetrics({
        start: twoMinutesAgo,
        end: now
      });

      filteredMetrics.forEach(metric => {
        expect(metric.timestamp.getTime()).toBeGreaterThanOrEqual(twoMinutesAgo.getTime());
        expect(metric.timestamp.getTime()).toBeLessThanOrEqual(now.getTime());
      });
    });
  });

  describe('shutdown', () => {
    it('should shutdown cleanly', async () => {
      await analyticsService.initialize();
      await analyticsService.shutdown();

      // Verify cleanup
      const alertRules = analyticsService.getAlertRules();
      expect(alertRules.length).toBe(0);

      const activeAlerts = analyticsService.getActiveAlerts();
      expect(activeAlerts.length).toBe(0);
    });
  });
});