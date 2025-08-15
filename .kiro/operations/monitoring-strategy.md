# EventChain Monitoring Strategy

## Overview
This document outlines the comprehensive monitoring strategy for the EventChain platform, covering application performance, infrastructure health, business metrics, and security monitoring.

## Monitoring Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │    │   Infrastructure│    │   Business      │
│   Monitoring    │────│   Monitoring    │────│   Metrics       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Log           │    │   Alerting      │    │   Dashboards    │
│   Aggregation   │────│   System        │────│   & Reports     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Monitoring Stack

### Core Components
- **Application Performance**: New Relic, Datadog
- **Infrastructure**: AWS CloudWatch, Prometheus
- **Log Management**: AWS CloudWatch Logs, ELK Stack
- **Alerting**: PagerDuty, Slack, Email
- **Uptime Monitoring**: Pingdom, StatusCake
- **Security Monitoring**: AWS GuardDuty, Falco

## Application Performance Monitoring (APM)

### 1. New Relic Configuration

#### Backend Monitoring
```javascript
// newrelic.js
'use strict'

exports.config = {
  app_name: ['EventChain Backend Production'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  logging: {
    level: 'info',
    filepath: 'stdout'
  },
  allow_all_headers: true,
  attributes: {
    exclude: [
      'request.headers.cookie',
      'request.headers.authorization',
      'request.headers.proxyAuthorization',
      'request.headers.setCookie*',
      'request.headers.x*',
      'response.headers.cookie',
      'response.headers.authorization',
      'response.headers.proxyAuthorization',
      'response.headers.setCookie*',
      'response.headers.x*'
    ]
  },
  distributed_tracing: {
    enabled: true
  },
  transaction_tracer: {
    enabled: true,
    transaction_threshold: 'apdex_f',
    record_sql: 'obfuscated',
    explain_threshold: 500
  },
  error_collector: {
    enabled: true,
    ignore_status_codes: [404]
  },
  browser_monitoring: {
    enable: true
  },
  application_logging: {
    enabled: true,
    forwarding: {
      enabled: true,
      max_samples_stored: 10000
    },
    metrics: {
      enabled: true
    },
    local_decorating: {
      enabled: false
    }
  }
}
```

#### Custom Metrics
```javascript
// monitoring/metrics.js
const newrelic = require('newrelic');

class MetricsCollector {
  // Track ticket purchases
  recordTicketPurchase(eventId, amount, currency) {
    newrelic.recordMetric('Custom/TicketPurchase/Count', 1);
    newrelic.recordMetric('Custom/TicketPurchase/Amount', amount);
    newrelic.addCustomAttribute('eventId', eventId);
    newrelic.addCustomAttribute('currency', currency);
  }

  // Track API response times
  recordApiResponseTime(endpoint, duration) {
    newrelic.recordMetric(`Custom/API/${endpoint}/ResponseTime`, duration);
  }

  // Track database query performance
  recordDatabaseQuery(query, duration) {
    newrelic.recordMetric('Custom/Database/QueryTime', duration);
    newrelic.addCustomAttribute('queryType', query);
  }

  // Track payment processing
  recordPaymentProcessing(status, amount, provider) {
    newrelic.recordMetric(`Custom/Payment/${status}/Count`, 1);
    newrelic.recordMetric(`Custom/Payment/${provider}/Amount`, amount);
  }

  // Track user activity
  recordUserActivity(action, userId) {
    newrelic.recordMetric(`Custom/User/${action}/Count`, 1);
    newrelic.addCustomAttribute('userId', userId);
  }
}

module.exports = new MetricsCollector();
```

### 2. Frontend Monitoring

#### React Error Boundary
```javascript
// components/ErrorBoundary.js
import React from 'react';
import * as Sentry from '@sentry/react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log to Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack
        }
      }
    });

    // Log to custom analytics
    window.gtag('event', 'exception', {
      description: error.toString(),
      fatal: false
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong.</h2>
          <button onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

#### Performance Monitoring
```javascript
// monitoring/performance.js
class PerformanceMonitor {
  constructor() {
    this.observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.handlePerformanceEntry(entry);
      }
    });

    this.observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] });
  }

  handlePerformanceEntry(entry) {
    switch (entry.entryType) {
      case 'navigation':
        this.trackPageLoad(entry);
        break;
      case 'paint':
        this.trackPaintTiming(entry);
        break;
      case 'largest-contentful-paint':
        this.trackLCP(entry);
        break;
    }
  }

  trackPageLoad(entry) {
    const metrics = {
      dns_lookup: entry.domainLookupEnd - entry.domainLookupStart,
      tcp_connect: entry.connectEnd - entry.connectStart,
      request_response: entry.responseEnd - entry.requestStart,
      dom_processing: entry.domContentLoadedEventEnd - entry.responseEnd,
      total_load_time: entry.loadEventEnd - entry.navigationStart
    };

    // Send to analytics
    this.sendMetrics('page_load', metrics);
  }

  trackPaintTiming(entry) {
    this.sendMetrics('paint_timing', {
      name: entry.name,
      start_time: entry.startTime
    });
  }

  trackLCP(entry) {
    this.sendMetrics('largest_contentful_paint', {
      start_time: entry.startTime,
      element: entry.element?.tagName
    });
  }

  sendMetrics(event, data) {
    // Send to New Relic
    if (window.newrelic) {
      window.newrelic.addPageAction(event, data);
    }

    // Send to Google Analytics
    if (window.gtag) {
      window.gtag('event', event, data);
    }
  }
}

export default new PerformanceMonitor();
```

## Infrastructure Monitoring

### 1. CloudWatch Metrics

#### Custom CloudWatch Metrics
```javascript
// monitoring/cloudwatch.js
const AWS = require('aws-sdk');
const cloudwatch = new AWS.CloudWatch({ region: 'us-east-1' });

class CloudWatchMetrics {
  async putMetric(namespace, metricName, value, unit = 'Count', dimensions = []) {
    const params = {
      Namespace: namespace,
      MetricData: [{
        MetricName: metricName,
        Value: value,
        Unit: unit,
        Dimensions: dimensions,
        Timestamp: new Date()
      }]
    };

    try {
      await cloudwatch.putMetricData(params).promise();
    } catch (error) {
      console.error('Failed to put CloudWatch metric:', error);
    }
  }

  // Business metrics
  async recordTicketSale(eventId, amount) {
    await this.putMetric('EventChain/Business', 'TicketSales', 1, 'Count', [
      { Name: 'EventId', Value: eventId }
    ]);
    
    await this.putMetric('EventChain/Business', 'Revenue', amount, 'None', [
      { Name: 'EventId', Value: eventId }
    ]);
  }

  // Application metrics
  async recordApiCall(endpoint, statusCode, responseTime) {
    await this.putMetric('EventChain/API', 'RequestCount', 1, 'Count', [
      { Name: 'Endpoint', Value: endpoint },
      { Name: 'StatusCode', Value: statusCode.toString() }
    ]);

    await this.putMetric('EventChain/API', 'ResponseTime', responseTime, 'Milliseconds', [
      { Name: 'Endpoint', Value: endpoint }
    ]);
  }

  // Database metrics
  async recordDatabaseOperation(operation, duration, success) {
    await this.putMetric('EventChain/Database', 'OperationCount', 1, 'Count', [
      { Name: 'Operation', Value: operation },
      { Name: 'Success', Value: success.toString() }
    ]);

    await this.putMetric('EventChain/Database', 'OperationDuration', duration, 'Milliseconds', [
      { Name: 'Operation', Value: operation }
    ]);
  }
}

module.exports = new CloudWatchMetrics();
```

### 2. Prometheus Configuration

#### Prometheus Config (prometheus.yml)
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "eventchain_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'eventchain-backend'
    static_configs:
      - targets: ['backend:3001']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'eventchain-database'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'eventchain-redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
```

#### Custom Metrics Endpoint
```javascript
// routes/metrics.js
const express = require('express');
const promClient = require('prom-client');
const router = express.Router();

// Create custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const ticketSalesTotal = new promClient.Counter({
  name: 'ticket_sales_total',
  help: 'Total number of ticket sales',
  labelNames: ['event_id', 'tier']
});

const activeUsers = new promClient.Gauge({
  name: 'active_users_current',
  help: 'Current number of active users'
});

// Middleware to collect HTTP metrics
const collectHttpMetrics = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    
    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);
    
    httpRequestTotal
      .labels(req.method, route, res.statusCode)
      .inc();
  });
  
  next();
};

// Metrics endpoint
router.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', promClient.register.contentType);
    res.end(await promClient.register.metrics());
  } catch (error) {
    res.status(500).end(error);
  }
});

module.exports = { router, collectHttpMetrics, ticketSalesTotal, activeUsers };
```

## Log Management

### 1. Structured Logging

#### Winston Configuration
```javascript
// config/logger.js
const winston = require('winston');
const { ElasticsearchTransport } = require('winston-elasticsearch');

const esTransportOpts = {
  level: 'info',
  clientOpts: {
    node: process.env.ELASTICSEARCH_URL,
    auth: {
      username: process.env.ELASTICSEARCH_USERNAME,
      password: process.env.ELASTICSEARCH_PASSWORD
    }
  },
  index: 'eventchain-logs',
  indexTemplate: {
    name: 'eventchain-logs-template',
    pattern: 'eventchain-logs-*',
    settings: {
      number_of_shards: 1,
      number_of_replicas: 1
    },
    mappings: {
      properties: {
        '@timestamp': { type: 'date' },
        level: { type: 'keyword' },
        message: { type: 'text' },
        service: { type: 'keyword' },
        userId: { type: 'keyword' },
        eventId: { type: 'keyword' },
        requestId: { type: 'keyword' },
        duration: { type: 'integer' }
      }
    }
  }
};

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'eventchain-backend',
    environment: process.env.NODE_ENV
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
});

// Add Elasticsearch transport in production
if (process.env.NODE_ENV === 'production') {
  logger.add(new ElasticsearchTransport(esTransportOpts));
}

module.exports = logger;
```

#### Request Logging Middleware
```javascript
// middleware/requestLogger.js
const logger = require('../config/logger');
const { v4: uuidv4 } = require('uuid');

const requestLogger = (req, res, next) => {
  const requestId = uuidv4();
  const startTime = Date.now();
  
  req.requestId = requestId;
  
  // Log request
  logger.info('HTTP Request', {
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id
  });
  
  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    logger.info('HTTP Response', {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userId: req.user?.id
    });
  });
  
  next();
};

module.exports = requestLogger;
```

### 2. Log Analysis Queries

#### Elasticsearch Queries
```json
{
  "query": {
    "bool": {
      "must": [
        {
          "range": {
            "@timestamp": {
              "gte": "now-1h"
            }
          }
        },
        {
          "term": {
            "level": "error"
          }
        }
      ]
    }
  },
  "aggs": {
    "error_types": {
      "terms": {
        "field": "message.keyword",
        "size": 10
      }
    }
  }
}
```

## Alerting System

### 1. Alert Rules Configuration

#### Prometheus Alert Rules (eventchain_rules.yml)
```yaml
groups:
  - name: eventchain.rules
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.1
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors per second"

      # High response time
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          description: "95th percentile response time is {{ $value }} seconds"

      # Database connection issues
      - alert: DatabaseConnectionHigh
        expr: pg_stat_activity_count > 80
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High database connection count"
          description: "Database has {{ $value }} active connections"

      # Low ticket sales
      - alert: LowTicketSales
        expr: rate(ticket_sales_total[1h]) < 0.1
        for: 30m
        labels:
          severity: warning
        annotations:
          summary: "Low ticket sales rate"
          description: "Ticket sales rate is {{ $value }} per hour"

      # Memory usage
      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.9
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High memory usage"
          description: "Memory usage is {{ $value | humanizePercentage }}"

      # Disk space
      - alert: LowDiskSpace
        expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) < 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Low disk space"
          description: "Disk space is {{ $value | humanizePercentage }} full"
```

### 2. PagerDuty Integration

#### Alert Manager Configuration
```yaml
# alertmanager.yml
global:
  pagerduty_url: 'https://events.pagerduty.com/v2/enqueue'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'
  routes:
    - match:
        severity: critical
      receiver: 'pagerduty-critical'
    - match:
        severity: warning
      receiver: 'slack-warnings'

receivers:
  - name: 'web.hook'
    webhook_configs:
      - url: 'http://127.0.0.1:5001/'

  - name: 'pagerduty-critical'
    pagerduty_configs:
      - service_key: 'YOUR_PAGERDUTY_SERVICE_KEY'
        description: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'

  - name: 'slack-warnings'
    slack_configs:
      - api_url: 'YOUR_SLACK_WEBHOOK_URL'
        channel: '#eventchain-alerts'
        title: 'EventChain Alert'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
```

## Business Metrics Monitoring

### 1. Key Performance Indicators (KPIs)

#### Revenue Tracking
```javascript
// monitoring/businessMetrics.js
class BusinessMetrics {
  constructor(cloudwatch, database) {
    this.cloudwatch = cloudwatch;
    this.database = database;
  }

  async trackDailyRevenue() {
    const today = new Date().toISOString().split('T')[0];
    
    const revenue = await this.database.query(`
      SELECT 
        SUM(amount) as total_revenue,
        COUNT(*) as transaction_count,
        AVG(amount) as average_order_value
      FROM payments 
      WHERE DATE(created_at) = $1 
      AND status = 'succeeded'
    `, [today]);

    await this.cloudwatch.putMetric(
      'EventChain/Business',
      'DailyRevenue',
      revenue.rows[0].total_revenue || 0,
      'None'
    );

    await this.cloudwatch.putMetric(
      'EventChain/Business',
      'DailyTransactions',
      revenue.rows[0].transaction_count || 0,
      'Count'
    );

    await this.cloudwatch.putMetric(
      'EventChain/Business',
      'AverageOrderValue',
      revenue.rows[0].average_order_value || 0,
      'None'
    );
  }

  async trackEventPerformance() {
    const events = await this.database.query(`
      SELECT 
        e.id,
        e.title,
        COUNT(t.id) as tickets_sold,
        SUM(p.amount) as revenue,
        e.capacity,
        (COUNT(t.id)::float / e.capacity) * 100 as capacity_utilization
      FROM events e
      LEFT JOIN tickets t ON e.id = t.event_id
      LEFT JOIN payments p ON t.payment_id = p.id AND p.status = 'succeeded'
      WHERE e.status = 'published'
      GROUP BY e.id, e.title, e.capacity
    `);

    for (const event of events.rows) {
      await this.cloudwatch.putMetric(
        'EventChain/Events',
        'TicketsSold',
        event.tickets_sold,
        'Count',
        [{ Name: 'EventId', Value: event.id }]
      );

      await this.cloudwatch.putMetric(
        'EventChain/Events',
        'CapacityUtilization',
        event.capacity_utilization,
        'Percent',
        [{ Name: 'EventId', Value: event.id }]
      );
    }
  }

  async trackUserEngagement() {
    const engagement = await this.database.query(`
      SELECT 
        COUNT(DISTINCT user_id) as daily_active_users,
        COUNT(*) as total_sessions,
        AVG(session_duration) as avg_session_duration
      FROM user_sessions 
      WHERE DATE(created_at) = CURRENT_DATE
    `);

    await this.cloudwatch.putMetric(
      'EventChain/Users',
      'DailyActiveUsers',
      engagement.rows[0].daily_active_users || 0,
      'Count'
    );

    await this.cloudwatch.putMetric(
      'EventChain/Users',
      'AverageSessionDuration',
      engagement.rows[0].avg_session_duration || 0,
      'Seconds'
    );
  }
}
```

### 2. Real-time Dashboards

#### Grafana Dashboard Configuration
```json
{
  "dashboard": {
    "title": "EventChain Production Dashboard",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          },
          {
            "expr": "histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "50th percentile"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "singlestat",
        "targets": [
          {
            "expr": "rate(http_requests_total{status_code=~\"5..\"}[5m]) / rate(http_requests_total[5m]) * 100",
            "legendFormat": "Error Rate %"
          }
        ]
      },
      {
        "title": "Daily Revenue",
        "type": "singlestat",
        "targets": [
          {
            "expr": "increase(ticket_sales_revenue_total[1d])",
            "legendFormat": "Revenue"
          }
        ]
      }
    ]
  }
}
```

## Security Monitoring

### 1. AWS GuardDuty Integration
```javascript
// monitoring/security.js
const AWS = require('aws-sdk');
const guardduty = new AWS.GuardDuty({ region: 'us-east-1' });

class SecurityMonitoring {
  async checkGuardDutyFindings() {
    const params = {
      DetectorId: process.env.GUARDDUTY_DETECTOR_ID,
      FindingCriteria: {
        Criterion: {
          'severity': {
            Gte: 7.0 // High severity findings
          },
          'updatedAt': {
            Gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      }
    };

    try {
      const findings = await guardduty.listFindings(params).promise();
      
      if (findings.FindingIds.length > 0) {
        const details = await guardduty.getFindings({
          DetectorId: process.env.GUARDDUTY_DETECTOR_ID,
          FindingIds: findings.FindingIds
        }).promise();

        // Send alerts for high severity findings
        for (const finding of details.Findings) {
          await this.sendSecurityAlert(finding);
        }
      }
    } catch (error) {
      console.error('Error checking GuardDuty findings:', error);
    }
  }

  async sendSecurityAlert(finding) {
    const alert = {
      title: `Security Alert: ${finding.Title}`,
      description: finding.Description,
      severity: finding.Severity,
      type: finding.Type,
      service: finding.Service.ServiceName,
      timestamp: finding.UpdatedAt
    };

    // Send to PagerDuty for critical alerts
    if (finding.Severity >= 8.0) {
      await this.sendToPagerDuty(alert);
    }

    // Send to Slack for all alerts
    await this.sendToSlack(alert);
  }
}
```

### 2. Application Security Monitoring
```javascript
// middleware/securityMonitoring.js
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const logger = require('../config/logger');

// Rate limiting with monitoring
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message,
    onLimitReached: (req) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.path,
        userId: req.user?.id
      });
    }
  });
};

// Security headers with monitoring
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
    reportOnly: false
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Failed login attempt monitoring
const monitorFailedLogins = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    if (res.statusCode === 401 && req.path === '/auth/login') {
      logger.warn('Failed login attempt', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        email: req.body.email,
        timestamp: new Date().toISOString()
      });
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

module.exports = {
  createRateLimiter,
  securityHeaders,
  monitorFailedLogins
};
```

## Health Checks

### 1. Application Health Checks
```javascript
// routes/health.js
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const redis = require('redis');

const dbPool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const redisClient = redis.createClient({
  url: process.env.REDIS_URL
});

// Basic health check
router.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    services: {}
  };

  try {
    // Database health
    const dbResult = await dbPool.query('SELECT 1');
    health.services.database = 'connected';
  } catch (error) {
    health.services.database = 'disconnected';
    health.status = 'degraded';
  }

  try {
    // Redis health
    await redisClient.ping();
    health.services.redis = 'connected';
  } catch (error) {
    health.services.redis = 'disconnected';
    health.status = 'degraded';
  }

  // External services health
  try {
    const stripeHealth = await checkStripeHealth();
    health.services.stripe = stripeHealth ? 'connected' : 'disconnected';
  } catch (error) {
    health.services.stripe = 'disconnected';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Detailed health check
router.get('/health/detailed', async (req, res) => {
  const detailed = {
    application: {
      name: 'EventChain Backend',
      version: process.env.npm_package_version,
      environment: process.env.NODE_ENV,
      nodeVersion: process.version
    },
    system: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      platform: process.platform
    },
    database: await getDatabaseHealth(),
    redis: await getRedisHealth(),
    external: await getExternalServicesHealth()
  };

  res.json(detailed);
});

async function getDatabaseHealth() {
  try {
    const result = await dbPool.query(`
      SELECT 
        count(*) as active_connections,
        (SELECT setting FROM pg_settings WHERE name = 'max_connections') as max_connections
    `);
    
    return {
      status: 'connected',
      activeConnections: result.rows[0].active_connections,
      maxConnections: result.rows[0].max_connections
    };
  } catch (error) {
    return {
      status: 'disconnected',
      error: error.message
    };
  }
}

module.exports = router;
```

## Monitoring Automation

### 1. Automated Monitoring Setup
```bash
#!/bin/bash
# setup-monitoring.sh

echo "Setting up EventChain monitoring infrastructure..."

# Deploy Prometheus
kubectl apply -f monitoring/prometheus/

# Deploy Grafana
kubectl apply -f monitoring/grafana/

# Deploy AlertManager
kubectl apply -f monitoring/alertmanager/

# Configure CloudWatch alarms
aws cloudformation deploy \
  --template-file monitoring/cloudwatch-alarms.yml \
  --stack-name eventchain-monitoring \
  --parameter-overrides \
    Environment=production \
    NotificationTopic=arn:aws:sns:us-east-1:ACCOUNT:eventchain-alerts

# Set up log forwarding
aws logs create-log-group --log-group-name /ecs/eventchain-backend-prod
aws logs create-log-group --log-group-name /ecs/eventchain-frontend-prod

echo "Monitoring setup completed!"
```

### 2. Monitoring Maintenance
```bash
#!/bin/bash
# monitoring-maintenance.sh

# Clean up old metrics
prometheus_retention_days=30
grafana_retention_days=90

# Rotate logs
find /var/log/eventchain -name "*.log" -mtime +7 -delete

# Update dashboards
curl -X POST "http://grafana:3000/api/dashboards/db" \
  -H "Authorization: Bearer $GRAFANA_API_KEY" \
  -H "Content-Type: application/json" \
  -d @monitoring/dashboards/eventchain-dashboard.json

# Test alert rules
promtool check rules monitoring/prometheus/rules/*.yml

echo "Monitoring maintenance completed!"
```

This comprehensive monitoring strategy ensures full visibility into the EventChain platform's performance, security, and business metrics, enabling proactive issue detection and resolution.