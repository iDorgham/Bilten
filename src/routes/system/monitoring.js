const express = require('express');
const router = express.Router();
const monitoringService = require('../../services/monitoringService');
const knex = require('../../utils/database');

/**
 * GET /monitoring/health - Health check endpoint
 */
router.get('/health', async (req, res) => {
  try {
    const healthMetrics = await monitoringService.getHealthMetrics();
    
    // Determine overall health status
    const isHealthy = healthMetrics.databaseHealth === 'healthy' && 
                     healthMetrics.errorRate < 10 && 
                     healthMetrics.avgResponseTime < 2000;

    const status = isHealthy ? 'healthy' : 'unhealthy';
    const statusCode = isHealthy ? 200 : 503;

    res.status(statusCode).json({
      status,
      timestamp: new Date().toISOString(),
      uptime: healthMetrics.uptime,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV,
      checks: {
        database: healthMetrics.databaseHealth,
        memory: healthMetrics.memoryUsage.heapUsed < 500 * 1024 * 1024 ? 'healthy' : 'warning',
        errorRate: healthMetrics.errorRate < 5 ? 'healthy' : 'warning'
      },
      metrics: {
        requests: healthMetrics.requests,
        errors: healthMetrics.errors,
        errorRate: healthMetrics.errorRate,
        avgResponseTime: healthMetrics.avgResponseTime,
        databaseQueries: healthMetrics.databaseQueries,
        databaseErrors: healthMetrics.databaseErrors
      }
    });
  } catch (error) {
    monitoringService.log('error', 'Health check failed', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /monitoring/metrics - Detailed metrics endpoint
 */
router.get('/metrics', async (req, res) => {
  try {
    const healthMetrics = await monitoringService.getHealthMetrics();
    
    // Get additional business metrics from database
    const businessMetrics = await knex('business_metrics')
      .select('*')
      .orderBy('recorded_at', 'desc')
      .limit(100);

    res.json({
      timestamp: new Date().toISOString(),
      system: healthMetrics,
      business: businessMetrics,
      custom: monitoringService.metrics
    });
  } catch (error) {
    monitoringService.log('error', 'Metrics endpoint failed', { error: error.message });
    res.status(500).json({
      error: 'Failed to retrieve metrics',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /monitoring/status - System status endpoint
 */
router.get('/status', async (req, res) => {
  try {
    const healthMetrics = await monitoringService.getHealthMetrics();
    
    // Get recent errors
    const recentErrors = await knex('error_logs')
      .select('*')
      .orderBy('created_at', 'desc')
      .limit(10)
      .catch(() => []);

    // Get system load
    const loadAvg = process.cpuUsage();
    const memUsage = process.memoryUsage();

    res.json({
      status: 'operational',
      timestamp: new Date().toISOString(),
      uptime: healthMetrics.uptime,
      system: {
        cpu: {
          user: loadAvg.user,
          system: loadAvg.system
        },
        memory: {
          rss: memUsage.rss,
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          external: memUsage.external
        }
      },
      performance: {
        requests: healthMetrics.requests,
        avgResponseTime: healthMetrics.avgResponseTime,
        errorRate: healthMetrics.errorRate
      },
      database: {
        health: healthMetrics.databaseHealth,
        queries: healthMetrics.databaseQueries,
        errors: healthMetrics.databaseErrors
      },
      recentErrors: recentErrors.length > 0 ? recentErrors : []
    });
  } catch (error) {
    monitoringService.log('error', 'Status endpoint failed', { error: error.message });
    res.status(500).json({
      error: 'Failed to retrieve system status',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /monitoring/log - Manual log endpoint
 */
router.post('/log', (req, res) => {
  const { level, message, meta } = req.body;
  
  if (!level || !message) {
    return res.status(400).json({
      error: 'Level and message are required'
    });
  }

  monitoringService.log(level, message, meta || {});
  
  res.json({
    success: true,
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /monitoring/metric - Manual metric tracking
 */
router.post('/metric', async (req, res) => {
  const { name, value, tags } = req.body;
  
  if (!name || value === undefined) {
    return res.status(400).json({
      error: 'Name and value are required'
    });
  }

  try {
    await monitoringService.trackBusinessMetric(name, value, tags || {});
    monitoringService.recordCustomMetric(`Custom/${name}`, value);
    
    res.json({
      success: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    monitoringService.log('error', 'Failed to track metric', { error: error.message });
    res.status(500).json({
      error: 'Failed to track metric',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /monitoring/alerts - Get active alerts
 */
router.get('/alerts', async (req, res) => {
  try {
    const healthMetrics = await monitoringService.getHealthMetrics();
    const alerts = [];

    // Check for high error rate
    if (healthMetrics.errorRate > 5) {
      alerts.push({
        type: 'error_rate_high',
        severity: 'high',
        message: `Error rate is ${healthMetrics.errorRate.toFixed(2)}%`,
        value: healthMetrics.errorRate,
        threshold: 5
      });
    }

    // Check for slow response time
    if (healthMetrics.avgResponseTime > 1000) {
      alerts.push({
        type: 'response_time_slow',
        severity: 'medium',
        message: `Average response time is ${healthMetrics.avgResponseTime.toFixed(2)}ms`,
        value: healthMetrics.avgResponseTime,
        threshold: 1000
      });
    }

    // Check for database issues
    if (healthMetrics.databaseHealth !== 'healthy') {
      alerts.push({
        type: 'database_unhealthy',
        severity: 'high',
        message: 'Database health check failed',
        value: healthMetrics.databaseHealth
      });
    }

    // Check for high memory usage
    const memoryUsagePercent = (healthMetrics.memoryUsage.heapUsed / healthMetrics.memoryUsage.heapTotal) * 100;
    if (memoryUsagePercent > 80) {
      alerts.push({
        type: 'memory_usage_high',
        severity: 'medium',
        message: `Memory usage is ${memoryUsagePercent.toFixed(2)}%`,
        value: memoryUsagePercent,
        threshold: 80
      });
    }

    res.json({
      alerts,
      count: alerts.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    monitoringService.log('error', 'Alerts endpoint failed', { error: error.message });
    res.status(500).json({
      error: 'Failed to retrieve alerts',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
