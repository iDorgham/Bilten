import { MonitoringDashboard } from './MonitoringDashboard';
import { AnalyticsService } from './AnalyticsService';
import { HealthCheckService } from './HealthCheckService';
import { MetricsMiddleware } from '../middleware/MetricsMiddleware';

// Mock dependencies
jest.mock('./AnalyticsService');
jest.mock('./HealthCheckService');
jest.mock('../middleware/MetricsMiddleware');
jest.mock('../utils/Logger', () => ({
  Logger: {
    getInstance: jest.fn(() => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    }))
  }
}));

describe('MonitoringDashboard', () => {
  let monitoringDashboard: MonitoringDashboard;
  let mockAnalyticsService: jest.Mocked<AnalyticsService>;
  let mockHealthCheckService: jest.Mocked<HealthCheckService>;

  beforeEach(() => {
    mockAnalyticsService = new AnalyticsService({} as any) as jest.Mocked<AnalyticsService>;
    mockHealthCheckService = new HealthCheckService() as jest.Mocked<HealthCheckService>;
    monitoringDashboard = new MonitoringDashboard(mockAnalyticsService, mockHealthCheckService);

    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await monitoringDashboard.initialize();
      expect(true).toBe(true); // Placeholder - would need more detailed testing
    });
  });

  describe('dashboard data', () => {
    beforeEach(() => {
      // Mock analytics service responses
      mockAnalyticsService.getRealtimeMetrics.mockReturnValue({
        timestamp: new Date(),
        requests: {
          lastMinute: 10,
          last5Minutes: 45,
          averageResponseTime: 150
        },
        system: {
          timestamp: new Date(),
          cpu: { usage: 25, loadAverage: [0.5, 0.6, 0.7] },
          memory: { used: 512000000, total: 1024000000, percentage: 50 },
          uptime: 3600,
          activeConnections: 5
        },
        services: {
          total: 3,
          healthy: 2,
          unhealthy: 1,
          unknown: 0,
          healthyPercentage: 66.67
        },
        alerts: {
          active: 1,
          critical: 0
        }
      });

      mockAnalyticsService.getPerformanceAnalytics.mockReturnValue({
        requestVolume: { total: 1000, perMinute: 16.67, perHour: 1000 },
        responseTime: { average: 150, p50: 120, p95: 300, p99: 500 },
        errorRate: { percentage: 2.5, total: 25, by4xx: 20, by5xx: 5 },
        topEndpoints: [
          { endpoint: 'GET /api/users', count: 500, averageResponseTime: 120 },
          { endpoint: 'POST /api/events', count: 300, averageResponseTime: 200 }
        ],
        slowestEndpoints: [
          { endpoint: 'GET /api/analytics', averageResponseTime: 800, requestCount: 50 }
        ],
        statusCodeDistribution: { '2xx': 950, '4xx': 20, '5xx': 5 }
      });

      mockHealthCheckService.getHealthySummary.mockReturnValue({
        total: 3,
        healthy: 2,
        unhealthy: 1,
        unknown: 0,
        healthyPercentage: 66.67
      });

      mockHealthCheckService.getAllServiceHealth.mockReturnValue([
        {
          name: 'user-service',
          url: 'http://user-service:3001',
          status: 'healthy',
          lastCheck: new Date(),
          responseTime: 50
        },
        {
          name: 'event-service',
          url: 'http://event-service:3002',
          status: 'healthy',
          lastCheck: new Date(),
          responseTime: 75
        },
        {
          name: 'payment-service',
          url: 'http://payment-service:3003',
          status: 'unhealthy',
          lastCheck: new Date(),
          error: 'Connection timeout'
        }
      ]);

      mockAnalyticsService.getActiveAlerts.mockReturnValue([
        {
          id: 'alert-1',
          ruleId: 'high-error-rate',
          ruleName: 'High Error Rate',
          message: 'Error rate is above threshold',
          severity: 'medium',
          timestamp: new Date(),
          resolved: false,
          metadata: {}
        }
      ]);
    });

    it('should provide comprehensive dashboard data', () => {
      const dashboardData = monitoringDashboard.getDashboardData();

      expect(dashboardData).toHaveProperty('overview');
      expect(dashboardData).toHaveProperty('performance');
      expect(dashboardData).toHaveProperty('system');
      expect(dashboardData).toHaveProperty('services');
      expect(dashboardData).toHaveProperty('alerts');
      expect(dashboardData).toHaveProperty('trafficControl');

      // Verify overview data
      expect(dashboardData.overview.status).toBe('warning'); // Due to unhealthy service
      expect(dashboardData.overview.totalRequests).toBe(1000);
      expect(dashboardData.overview.activeAlerts).toBe(1);
      expect(dashboardData.overview.servicesHealth.healthy).toBe(2);
      expect(dashboardData.overview.servicesHealth.total).toBe(3);

      // Verify performance data
      expect(dashboardData.performance.requestsPerSecond).toBeCloseTo(0.167, 2);
      expect(dashboardData.performance.averageResponseTime).toBe(150);
      expect(dashboardData.performance.errorRate).toBe(2.5);

      // Verify system data
      expect(dashboardData.system.cpuUsage).toBe(25);
      expect(dashboardData.system.memoryUsage).toBe(50);

      // Verify services data
      expect(dashboardData.services).toHaveLength(3);
      expect(dashboardData.services[0].name).toBe('user-service');
      expect(dashboardData.services[2].status).toBe('unhealthy');

      // Verify alerts data
      expect(dashboardData.alerts).toHaveLength(1);
      expect(dashboardData.alerts[0].severity).toBe('medium');
    });

    it('should determine overall status correctly', () => {
      // Test healthy status
      mockAnalyticsService.getActiveAlerts.mockReturnValue([]);
      mockHealthCheckService.getHealthySummary.mockReturnValue({
        total: 3, healthy: 3, unhealthy: 0, unknown: 0, healthyPercentage: 100
      });

      let dashboardData = monitoringDashboard.getDashboardData();
      expect(dashboardData.overview.status).toBe('healthy');

      // Test critical status
      mockAnalyticsService.getActiveAlerts.mockReturnValue([
        {
          id: 'critical-alert',
          ruleId: 'test',
          ruleName: 'Test',
          message: 'Critical issue',
          severity: 'critical',
          timestamp: new Date(),
          resolved: false,
          metadata: {}
        }
      ]);

      dashboardData = monitoringDashboard.getDashboardData();
      expect(dashboardData.overview.status).toBe('critical');
    });
  });

  describe('real-time data', () => {
    it('should provide real-time dashboard data', () => {
      mockAnalyticsService.getRealtimeMetrics.mockReturnValue({
        timestamp: new Date(),
        requests: { lastMinute: 5, last5Minutes: 20, averageResponseTime: 100 },
        system: {
          timestamp: new Date(),
          cpu: { usage: 30, loadAverage: [0.8, 0.9, 1.0] },
          memory: { used: 600000000, total: 1024000000, percentage: 58.6 },
          uptime: 7200,
          activeConnections: 8
        },
        services: { total: 3, healthy: 3, unhealthy: 0, unknown: 0, healthyPercentage: 100 },
        alerts: { active: 0, critical: 0 }
      });

      mockAnalyticsService.getActiveAlerts.mockReturnValue([]);

      const realtimeData = monitoringDashboard.getRealtimeDashboardData();

      expect(realtimeData).toHaveProperty('timestamp');
      expect(realtimeData).toHaveProperty('requests');
      expect(realtimeData).toHaveProperty('system');
      expect(realtimeData).toHaveProperty('services');
      expect(realtimeData).toHaveProperty('alerts');

      expect(realtimeData.requests.lastMinute).toBe(5);
      expect(realtimeData.system.cpu.usage).toBe(30);
      expect(realtimeData.alerts.active).toBe(0);
    });
  });

  describe('historical data', () => {
    beforeEach(() => {
      const mockSystemMetrics = [
        {
          timestamp: new Date('2024-01-01T10:00:00Z'),
          cpu: { usage: 20, loadAverage: [0.5, 0.6, 0.7] },
          memory: { used: 400000000, total: 1024000000, percentage: 39.1 },
          uptime: 3600,
          activeConnections: 3
        },
        {
          timestamp: new Date('2024-01-01T11:00:00Z'),
          cpu: { usage: 25, loadAverage: [0.6, 0.7, 0.8] },
          memory: { used: 450000000, total: 1024000000, percentage: 44.0 },
          uptime: 7200,
          activeConnections: 5
        }
      ];

      const mockRequestMetrics = [
        {
          timestamp: new Date('2024-01-01T10:30:00Z'),
          method: 'GET',
          path: '/api/users',
          statusCode: 200,
          responseTime: 150,
          requestSize: 0,
          responseSize: 1024,
          clientIP: '127.0.0.1'
        },
        {
          timestamp: new Date('2024-01-01T11:30:00Z'),
          method: 'POST',
          path: '/api/events',
          statusCode: 201,
          responseTime: 200,
          requestSize: 512,
          responseSize: 256,
          clientIP: '127.0.0.1'
        }
      ];

      mockAnalyticsService.getSystemMetrics.mockReturnValue(mockSystemMetrics);
      (MetricsMiddleware.getMetrics as jest.Mock).mockReturnValue(mockRequestMetrics);
    });

    it('should provide historical data with correct grouping', () => {
      const timeRange = {
        start: new Date('2024-01-01T10:00:00Z'),
        end: new Date('2024-01-01T12:00:00Z')
      };

      const historicalData = monitoringDashboard.getHistoricalData(timeRange, 'hour');

      expect(historicalData.timeRange.start).toEqual(timeRange.start);
      expect(historicalData.timeRange.end).toEqual(timeRange.end);
      expect(historicalData.timeRange.interval).toBe('hour');
      expect(historicalData.metrics).toHaveLength(2);

      // Verify grouped metrics
      const firstHourMetrics = historicalData.metrics[0];
      expect(firstHourMetrics.requestCount).toBe(1);
      expect(firstHourMetrics.averageResponseTime).toBe(150);
      expect(firstHourMetrics.cpuUsage).toBe(20);

      const secondHourMetrics = historicalData.metrics[1];
      expect(secondHourMetrics.requestCount).toBe(1);
      expect(secondHourMetrics.averageResponseTime).toBe(200);
      expect(secondHourMetrics.cpuUsage).toBe(25);
    });
  });

  describe('endpoint analytics', () => {
    beforeEach(() => {
      const mockMetrics = [
        {
          timestamp: new Date('2024-01-01T10:00:00Z'),
          method: 'GET',
          path: '/api/users',
          statusCode: 200,
          responseTime: 100,
          requestSize: 0,
          responseSize: 1024,
          clientIP: '127.0.0.1',
          userAgent: 'Test Agent'
        },
        {
          timestamp: new Date('2024-01-01T10:01:00Z'),
          method: 'GET',
          path: '/api/users',
          statusCode: 200,
          responseTime: 150,
          requestSize: 0,
          responseSize: 1024,
          clientIP: '127.0.0.1',
          userAgent: 'Test Agent'
        },
        {
          timestamp: new Date('2024-01-01T10:02:00Z'),
          method: 'GET',
          path: '/api/users',
          statusCode: 500,
          responseTime: 300,
          requestSize: 0,
          responseSize: 128,
          clientIP: '127.0.0.1',
          userAgent: 'Test Agent'
        }
      ];

      (MetricsMiddleware.getMetrics as jest.Mock).mockReturnValue(mockMetrics);
    });

    it('should provide endpoint analytics', () => {
      const analytics = monitoringDashboard.getEndpointAnalytics('/api/users', 'GET');

      expect(analytics).not.toBeNull();
      expect(analytics!.endpoint).toBe('GET /api/users');
      expect(analytics!.method).toBe('GET');
      expect(analytics!.path).toBe('/api/users');

      expect(analytics!.metrics.totalRequests).toBe(3);
      expect(analytics!.metrics.averageResponseTime).toBeCloseTo(183.33, 1);
      expect(analytics!.metrics.errorRate).toBeCloseTo(33.33, 1);

      expect(analytics!.recentActivity).toHaveLength(3);
      expect(analytics!.errors).toHaveLength(1);
      expect(analytics!.errors[0].statusCode).toBe(500);
    });

    it('should return null for non-existent endpoint', () => {
      const analytics = monitoringDashboard.getEndpointAnalytics('/api/nonexistent');
      expect(analytics).toBeNull();
    });
  });

  describe('WebSocket connections', () => {
    let mockWebSocket: any;

    beforeEach(() => {
      mockWebSocket = {
        readyState: 1, // WebSocket.OPEN
        send: jest.fn(),
        on: jest.fn()
      };
    });

    it('should add WebSocket connection and send initial data', () => {
      mockAnalyticsService.getRealtimeMetrics.mockReturnValue({
        timestamp: new Date(),
        requests: { lastMinute: 0, last5Minutes: 0, averageResponseTime: 0 },
        system: {
          timestamp: new Date(),
          cpu: { usage: 0, loadAverage: [0, 0, 0] },
          memory: { used: 0, total: 0, percentage: 0 },
          uptime: 0,
          activeConnections: 0
        },
        services: { total: 0, healthy: 0, unhealthy: 0, unknown: 0, healthyPercentage: 0 },
        alerts: { active: 0, critical: 0 }
      });

      mockAnalyticsService.getPerformanceAnalytics.mockReturnValue({
        requestVolume: { total: 0, perMinute: 0, perHour: 0 },
        responseTime: { average: 0, p50: 0, p95: 0, p99: 0 },
        errorRate: { percentage: 0, total: 0, by4xx: 0, by5xx: 0 },
        topEndpoints: [],
        slowestEndpoints: [],
        statusCodeDistribution: {}
      });

      mockHealthCheckService.getHealthySummary.mockReturnValue({
        total: 0, healthy: 0, unhealthy: 0, unknown: 0, healthyPercentage: 0
      });

      mockHealthCheckService.getAllServiceHealth.mockReturnValue([]);
      mockAnalyticsService.getActiveAlerts.mockReturnValue([]);

      monitoringDashboard.addWebSocketConnection(mockWebSocket);

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('"event":"initial-data"')
      );
      expect(mockWebSocket.on).toHaveBeenCalledWith('close', expect.any(Function));
    });
  });

  describe('data export', () => {
    beforeEach(() => {
      mockAnalyticsService.getPerformanceAnalytics.mockReturnValue({
        requestVolume: { total: 100, perMinute: 10, perHour: 100 },
        responseTime: { average: 150, p50: 120, p95: 300, p99: 500 },
        errorRate: { percentage: 5, total: 5, by4xx: 3, by5xx: 2 },
        topEndpoints: [],
        slowestEndpoints: [],
        statusCodeDistribution: { '2xx': 95, '4xx': 3, '5xx': 2 }
      });

      mockAnalyticsService.getSystemMetrics.mockReturnValue([
        {
          timestamp: new Date(),
          cpu: { usage: 25, loadAverage: [0.5, 0.6, 0.7] },
          memory: { used: 512000000, total: 1024000000, percentage: 50 },
          uptime: 3600,
          activeConnections: 5
        }
      ]);

      (MetricsMiddleware.getMetrics as jest.Mock).mockReturnValue([
        {
          timestamp: new Date(),
          method: 'GET',
          path: '/api/test',
          statusCode: 200,
          responseTime: 100,
          requestSize: 0,
          responseSize: 512,
          clientIP: '127.0.0.1'
        }
      ]);
    });

    it('should export metrics in JSON format', async () => {
      const exported = await monitoringDashboard.exportMetrics('json');

      expect(exported).toHaveProperty('performance');
      expect(exported).toHaveProperty('system');
      expect(exported).toHaveProperty('requests');
      
      if (typeof exported === 'object' && exported !== null && 'performance' in exported) {
        expect((exported as any).performance.requestVolume.total).toBe(100);
      }
    });

    it('should export metrics in CSV format', async () => {
      const exported = await monitoringDashboard.exportMetrics('csv');

      expect(typeof exported).toBe('string');
      expect(exported).toContain('timestamp,method,path,statusCode');
      expect(exported).toContain('GET,/api/test,200');
    });

    it('should export metrics in Prometheus format', async () => {
      const exported = await monitoringDashboard.exportMetrics('prometheus');

      expect(typeof exported).toBe('string');
      expect(exported).toContain('# HELP gateway_requests_total');
      expect(exported).toContain('gateway_requests_total 100');
      expect(exported).toContain('gateway_error_rate 5');
    });

    it('should throw error for unsupported format', async () => {
      await expect(
        monitoringDashboard.exportMetrics('xml' as any)
      ).rejects.toThrow('Unsupported export format: xml');
    });
  });

  describe('shutdown', () => {
    it('should shutdown cleanly', async () => {
      await monitoringDashboard.shutdown();
      expect(true).toBe(true); // Placeholder - would need more detailed testing
    });
  });
});