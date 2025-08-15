const winston = require('winston');
const WinstonCloudWatch = require('winston-cloudwatch');
const knex = require('../utils/database');

/**
 * Comprehensive monitoring service for Bilten
 * Integrates New Relic APM, CloudWatch logging, and custom metrics
 */
class MonitoringService {
  constructor() {
    this.logger = this.setupLogger();
    this.metrics = {
      requests: 0,
      errors: 0,
      responseTime: [],
      databaseQueries: 0,
      databaseErrors: 0,
      externalAPICalls: 0,
      externalAPIErrors: 0
    };
    this.startTime = Date.now();
  }

  /**
   * Setup Winston logger with CloudWatch integration
   */
  setupLogger() {
    const logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'bilten-backend' },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });

    // Add CloudWatch transport in production
    if (process.env.NODE_ENV === 'production' && process.env.AWS_REGION) {
      logger.add(new WinstonCloudWatch({
        logGroupName: 'bilten-backend-logs',
        logStreamName: `bilten-backend-${new Date().toISOString().slice(0, 10)}`,
        awsRegion: process.env.AWS_REGION,
        awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
        awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }));
    }

    return logger;
  }

  /**
   * Log application events
   */
  log(level, message, meta = {}) {
    this.logger.log(level, message, {
      ...meta,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });
  }

  /**
   * Track request metrics
   */
  trackRequest(method, path, statusCode, responseTime, userId = null) {
    this.metrics.requests++;
    this.metrics.responseTime.push(responseTime);

    // Log request details
    this.log('info', 'HTTP Request', {
      method,
      path,
      statusCode,
      responseTime,
      userId,
      userAgent: 'tracked-separately'
    });

    // Track slow requests
    if (responseTime > 1000) {
      this.log('warn', 'Slow Request Detected', {
        method,
        path,
        responseTime,
        threshold: 1000
      });
    }

    // Track errors
    if (statusCode >= 400) {
      this.metrics.errors++;
      this.log('error', 'HTTP Error', {
        method,
        path,
        statusCode,
        responseTime
      });
    }
  }

  /**
   * Track database operations
   */
  trackDatabaseQuery(query, duration, success = true) {
    this.metrics.databaseQueries++;
    
    if (!success) {
      this.metrics.databaseErrors++;
    }

    // Log slow queries
    if (duration > 100) {
      this.log('warn', 'Slow Database Query', {
        query: query.substring(0, 100) + '...',
        duration,
        success
      });
    }
  }

  /**
   * Track external API calls
   */
  trackExternalAPI(service, endpoint, duration, success = true) {
    this.metrics.externalAPICalls++;
    
    if (!success) {
      this.metrics.externalAPIErrors++;
    }

    this.log('info', 'External API Call', {
      service,
      endpoint,
      duration,
      success
    });
  }

  /**
   * Track business metrics
   */
  async trackBusinessMetric(metricName, value, tags = {}) {
    try {
      await knex('business_metrics').insert({
        metric_name: metricName,
        value: value,
        tags: JSON.stringify(tags),
        recorded_at: new Date()
      });
    } catch (error) {
      this.log('error', 'Failed to track business metric', {
        metricName,
        value,
        error: error.message
      });
    }
  }

  /**
   * Get system health metrics
   */
  async getHealthMetrics() {
    const uptime = Date.now() - this.startTime;
    const avgResponseTime = this.metrics.responseTime.length > 0 
      ? this.metrics.responseTime.reduce((a, b) => a + b, 0) / this.metrics.responseTime.length 
      : 0;

    // Get database health
    let dbHealth = 'unknown';
    try {
      await knex.raw('SELECT 1');
      dbHealth = 'healthy';
    } catch (error) {
      dbHealth = 'unhealthy';
      this.log('error', 'Database health check failed', { error: error.message });
    }

    // Get memory usage
    const memUsage = process.memoryUsage();

    return {
      uptime,
      requests: this.metrics.requests,
      errors: this.metrics.errors,
      errorRate: this.metrics.requests > 0 ? (this.metrics.errors / this.metrics.requests) * 100 : 0,
      avgResponseTime,
      databaseQueries: this.metrics.databaseQueries,
      databaseErrors: this.metrics.databaseErrors,
      externalAPICalls: this.metrics.externalAPICalls,
      externalAPIErrors: this.metrics.externalAPIErrors,
      databaseHealth: dbHealth,
      memoryUsage: {
        rss: memUsage.rss,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external
      },
      environment: process.env.NODE_ENV
    };
  }

  /**
   * Reset metrics (useful for testing)
   */
  resetMetrics() {
    this.metrics = {
      requests: 0,
      errors: 0,
      responseTime: [],
      databaseQueries: 0,
      databaseErrors: 0,
      externalAPICalls: 0,
      externalAPIErrors: 0
    };
    this.startTime = Date.now();
  }

  /**
   * Create custom New Relic metrics
   */
  recordCustomMetric(metricName, value) {
    if (global.newrelic) {
      global.newrelic.recordMetric(metricName, value);
    }
  }

  /**
   * Add custom attributes to New Relic transactions
   */
  addCustomAttributes(attributes) {
    if (global.newrelic) {
      global.newrelic.addCustomAttributes(attributes);
    }
  }

  /**
   * Record custom events in New Relic
   */
  recordCustomEvent(eventType, attributes) {
    if (global.newrelic) {
      global.newrelic.recordCustomEvent(eventType, attributes);
    }
  }
}

// Create singleton instance
const monitoringService = new MonitoringService();

module.exports = monitoringService;
