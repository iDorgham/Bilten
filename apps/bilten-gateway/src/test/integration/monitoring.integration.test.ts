import request from 'supertest';
import { GatewayServer } from '../../server/GatewayServer';
import { MetricsMiddleware } from '../../middleware/MetricsMiddleware';

describe('Monitoring Integration Tests', () => {
  let gatewayServer: GatewayServer;
  let app: any;

  beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.REDIS_URL = 'redis://localhost:6379';
    
    gatewayServer = new GatewayServer();
    await gatewayServer.initialize();
    app = (gatewayServer as any).app;
  });

  afterAll(async () => {
    if (gatewayServer) {
      // Use process.kill to trigger graceful shutdown
      process.emit('SIGTERM', 'SIGTERM');
    }
  });

  beforeEach(() => {
    // Clear metrics before each test
    MetricsMiddleware.clearMetrics();
  });

  describe('Dashboard Endpoints', () => {
    it('should return dashboard data', async () => {
      const response = await request(app)
        .get('/api/gateway/dashboard')
        .expect(200);

      expect(response.body).toHaveProperty('overview');
      expect(response.body).toHaveProperty('performance');
      expect(response.body).toHaveProperty('system');
      expect(response.body).toHaveProperty('services');
      expect(response.body).toHaveProperty('alerts');
      expect(response.body).toHaveProperty('trafficControl');

      // Verify overview structure
      expect(response.body.overview).toHaveProperty('status');
      expect(response.body.overview).toHaveProperty('uptime');
      expect(response.body.overview).toHaveProperty('totalRequests');
      expect(response.body.overview).toHaveProperty('activeAlerts');
      expect(response.body.overview).toHaveProperty('servicesHealth');

      // Verify performance structure
      expect(response.body.performance).toHaveProperty('requestsPerSecond');
      expect(response.body.performance).toHaveProperty('averageResponseTime');
      expect(response.body.performance).toHaveProperty('errorRate');
      expect(response.body.performance).toHaveProperty('p95ResponseTime');
    });

    it('should return real-time metrics', async () => {
      const response = await request(app)
        .get('/api/gateway/metrics/realtime')
        .expect(200);

      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('requests');
      expect(response.body).toHaveProperty('system');
      expect(response.body).toHaveProperty('services');
      expect(response.body).toHaveProperty('alerts');

      expect(response.body.requests).toHaveProperty('lastMinute');
      expect(response.body.requests).toHaveProperty('last5Minutes');
      expect(response.body.requests).toHaveProperty('averageResponseTime');
    });
  });

  describe('Analytics Endpoints', () => {
    beforeEach(async () => {
      // Generate some test metrics by making requests
      await request(app).get('/health');
      await request(app).get('/api/gateway/config');
      await request(app).get('/nonexistent').expect(404);
    });

    it('should return performance analytics', async () => {
      const response = await request(app)
        .get('/api/gateway/analytics/performance')
        .expect(200);

      expect(response.body).toHaveProperty('requestVolume');
      expect(response.body).toHaveProperty('responseTime');
      expect(response.body).toHaveProperty('errorRate');
      expect(response.body).toHaveProperty('topEndpoints');
      expect(response.body).toHaveProperty('slowestEndpoints');
      expect(response.body).toHaveProperty('statusCodeDistribution');

      expect(response.body.requestVolume.total).toBeGreaterThan(0);
      expect(Array.isArray(response.body.topEndpoints)).toBe(true);
    });

    it('should return performance analytics with time range', async () => {
      const start = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
      const end = new Date().toISOString();

      const response = await request(app)
        .get(`/api/gateway/analytics/performance?start=${start}&end=${end}`)
        .expect(200);

      expect(response.body).toHaveProperty('requestVolume');
      expect(response.body.requestVolume.total).toBeGreaterThanOrEqual(0);
    });

    it('should return historical data', async () => {
      const start = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
      const end = new Date().toISOString();

      const response = await request(app)
        .get(`/api/gateway/analytics/historical?start=${start}&end=${end}&interval=minute`)
        .expect(200);

      expect(response.body).toHaveProperty('timeRange');
      expect(response.body).toHaveProperty('metrics');
      expect(response.body.timeRange.interval).toBe('minute');
      expect(Array.isArray(response.body.metrics)).toBe(true);
    });

    it('should return 400 for historical data without time range', async () => {
      await request(app)
        .get('/api/gateway/analytics/historical')
        .expect(400);
    });

    it('should return top endpoints', async () => {
      const response = await request(app)
        .get('/api/gateway/analytics/top-endpoints?limit=5')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(5);
    });

    it('should return slowest endpoints', async () => {
      const response = await request(app)
        .get('/api/gateway/analytics/slowest-endpoints?limit=5')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Endpoint Analytics', () => {
    beforeEach(async () => {
      // Generate metrics for specific endpoint
      await request(app).get('/health');
      await request(app).get('/health');
      await request(app).get('/health');
    });

    it('should return analytics for specific endpoint', async () => {
      const endpoint = encodeURIComponent('/health');
      
      const response = await request(app)
        .get(`/api/gateway/analytics/endpoints/${endpoint}?method=GET`)
        .expect(200);

      expect(response.body).toHaveProperty('endpoint');
      expect(response.body).toHaveProperty('method');
      expect(response.body).toHaveProperty('path');
      expect(response.body).toHaveProperty('metrics');
      expect(response.body).toHaveProperty('recentActivity');
      expect(response.body).toHaveProperty('errors');

      expect(response.body.endpoint).toBe('GET /health');
      expect(response.body.method).toBe('GET');
      expect(response.body.path).toBe('/health');
      expect(response.body.metrics.totalRequests).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent endpoint', async () => {
      const endpoint = encodeURIComponent('/nonexistent-endpoint');
      
      await request(app)
        .get(`/api/gateway/analytics/endpoints/${endpoint}`)
        .expect(404);
    });
  });

  describe('Health Endpoints', () => {
    it('should return system health', async () => {
      const response = await request(app)
        .get('/api/gateway/health/system')
        .expect(200);

      expect(response.body).toHaveProperty('overall');
      expect(response.body).toHaveProperty('system');
      expect(response.body).toHaveProperty('services');
      expect(response.body).toHaveProperty('alerts');

      expect(response.body.overall).toHaveProperty('status');
      expect(response.body.overall).toHaveProperty('uptime');
      expect(response.body.overall).toHaveProperty('version');
    });

    it('should return service health details', async () => {
      const response = await request(app)
        .get('/api/gateway/health/services')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // Services array might be empty in test environment
    });

    it('should trigger health check for all services', async () => {
      const response = await request(app)
        .post('/api/gateway/health/check')
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Health check triggered for all services');
    });

    it('should trigger health check for specific service', async () => {
      const response = await request(app)
        .post('/api/gateway/health/check/test-service')
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Health check triggered for test-service');
    });
  });

  describe('Alert Management', () => {
    it('should return active alerts', async () => {
      const response = await request(app)
        .get('/api/gateway/alerts')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return alert rules', async () => {
      const response = await request(app)
        .get('/api/gateway/alerts/rules')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0); // Should have default rules
    });

    it('should add new alert rule', async () => {
      const newRule = {
        id: 'test-rule',
        name: 'Test Rule',
        condition: {
          metric: 'errorRate',
          operator: 'gt',
          threshold: 10,
          duration: 300
        },
        enabled: true,
        actions: [{ type: 'log', config: { level: 'warn' } }]
      };

      const response = await request(app)
        .post('/api/gateway/alerts/rules')
        .send(newRule)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Alert rule added successfully');
    });

    it('should update existing alert rule', async () => {
      // First, get existing rules to find one to update
      const rulesResponse = await request(app)
        .get('/api/gateway/alerts/rules')
        .expect(200);

      if (rulesResponse.body.length > 0) {
        const ruleId = rulesResponse.body[0].id;
        const updates = { enabled: false };

        const response = await request(app)
          .put(`/api/gateway/alerts/rules/${ruleId}`)
          .send(updates)
          .expect(200);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('Alert rule updated successfully');
      }
    });

    it('should return 404 when updating non-existent rule', async () => {
      const updates = { enabled: false };

      await request(app)
        .put('/api/gateway/alerts/rules/non-existent-rule')
        .send(updates)
        .expect(404);
    });

    it('should delete alert rule', async () => {
      // First add a rule to delete
      const newRule = {
        id: 'rule-to-delete',
        name: 'Rule to Delete',
        condition: {
          metric: 'errorRate',
          operator: 'gt',
          threshold: 50,
          duration: 300
        },
        enabled: true,
        actions: [{ type: 'log', config: { level: 'error' } }]
      };

      await request(app)
        .post('/api/gateway/alerts/rules')
        .send(newRule)
        .expect(200);

      // Now delete it
      const response = await request(app)
        .delete('/api/gateway/alerts/rules/rule-to-delete')
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Alert rule deleted successfully');
    });

    it('should return 404 when deleting non-existent rule', async () => {
      await request(app)
        .delete('/api/gateway/alerts/rules/non-existent-rule')
        .expect(404);
    });
  });

  describe('Metrics Export', () => {
    beforeEach(async () => {
      // Generate some metrics
      await request(app).get('/health');
      await request(app).get('/api/gateway/config');
    });

    it('should export metrics in JSON format', async () => {
      const response = await request(app)
        .get('/api/gateway/export/metrics?format=json')
        .expect(200);

      expect(response.body).toHaveProperty('performance');
      expect(response.body).toHaveProperty('system');
      expect(response.body).toHaveProperty('requests');
    });

    it('should export metrics in CSV format', async () => {
      const response = await request(app)
        .get('/api/gateway/export/metrics?format=csv')
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.text).toContain('timestamp,method,path,statusCode');
    });

    it('should export metrics in Prometheus format', async () => {
      const response = await request(app)
        .get('/api/gateway/export/metrics?format=prometheus')
        .expect(200);

      expect(response.headers['content-type']).toContain('text/plain');
      expect(response.text).toContain('# HELP gateway_requests_total');
      expect(response.text).toContain('gateway_requests_total');
    });

    it('should export metrics with time range', async () => {
      const start = new Date(Date.now() - 3600000).toISOString();
      const end = new Date().toISOString();

      const response = await request(app)
        .get(`/api/gateway/export/metrics?format=json&start=${start}&end=${end}`)
        .expect(200);

      expect(response.body).toHaveProperty('performance');
      expect(response.body).toHaveProperty('requests');
    });
  });

  describe('Raw Metrics and Utilities', () => {
    beforeEach(async () => {
      // Generate some metrics
      await request(app).get('/health');
      await request(app).get('/api/gateway/config');
    });

    it('should return raw metrics', async () => {
      const response = await request(app)
        .get('/api/gateway/metrics/raw?limit=50')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(50);
      
      if (response.body.length > 0) {
        const metric = response.body[0];
        expect(metric).toHaveProperty('timestamp');
        expect(metric).toHaveProperty('method');
        expect(metric).toHaveProperty('path');
        expect(metric).toHaveProperty('statusCode');
        expect(metric).toHaveProperty('responseTime');
      }
    });

    it('should clear metrics', async () => {
      // First verify we have metrics
      let response = await request(app)
        .get('/api/gateway/metrics/raw')
        .expect(200);

      // const initialCount = response.body.length;

      // Clear metrics
      await request(app)
        .delete('/api/gateway/metrics')
        .expect(200);

      // Verify metrics are cleared
      response = await request(app)
        .get('/api/gateway/metrics/raw')
        .expect(200);

      expect(response.body.length).toBe(0);
    });

    it('should return gateway configuration', async () => {
      const response = await request(app)
        .get('/api/gateway/config')
        .expect(200);

      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('services');
      expect(response.body).toHaveProperty('features');

      expect(response.body.features).toHaveProperty('analytics');
      expect(response.body.features).toHaveProperty('monitoring');
      expect(response.body.features).toHaveProperty('alerting');
      expect(response.body.features.analytics).toBe(true);
      expect(response.body.features.monitoring).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully in dashboard endpoint', async () => {
      // This test would require mocking internal services to throw errors
      // For now, we'll just verify the endpoint exists and returns data
      const response = await request(app)
        .get('/api/gateway/dashboard')
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('should handle invalid time ranges in historical data', async () => {
      await request(app)
        .get('/api/gateway/analytics/historical?start=invalid&end=invalid')
        .expect(500); // Should handle invalid date parsing
    });

    it('should handle invalid endpoint encoding', async () => {
      const invalidEndpoint = '%'; // Invalid URL encoding
      
      await request(app)
        .get(`/api/gateway/analytics/endpoints/${invalidEndpoint}`)
        .expect(500); // Should handle decoding errors gracefully
    });
  });
});