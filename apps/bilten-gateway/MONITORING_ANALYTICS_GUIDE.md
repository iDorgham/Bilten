# Comprehensive Monitoring and Analytics Guide

This document provides a complete guide to the comprehensive monitoring and analytics system implemented in the Bilten API Gateway.

## Overview

The monitoring and analytics system provides real-time insights into gateway performance, system health, service availability, and user behavior. It includes automated alerting, historical data analysis, and comprehensive reporting capabilities.

## Architecture

### Core Components

1. **AnalyticsService** - Collects and processes metrics, manages alerts
2. **MonitoringDashboard** - Provides dashboard data and real-time updates
3. **MetricsMiddleware** - Captures request/response metrics
4. **HealthCheckService** - Monitors service availability

### Data Flow

```
Request → MetricsMiddleware → AnalyticsService → MonitoringDashboard → API Endpoints
                ↓
         System Metrics Collection
                ↓
         Alert Rule Evaluation
                ↓
         Real-time Broadcasting
```

## Features

### 1. Real-time Monitoring

- **Request Metrics**: Response times, status codes, request/response sizes
- **System Metrics**: CPU usage, memory consumption, load averages
- **Service Health**: Availability and response times of downstream services
- **Error Tracking**: Detailed error analysis and categorization

### 2. Performance Analytics

- **Request Volume**: Total requests, requests per minute/hour
- **Response Time Analysis**: Average, P50, P95, P99 percentiles
- **Error Rate Monitoring**: Overall error rates, 4xx vs 5xx breakdown
- **Endpoint Performance**: Top and slowest endpoints analysis

### 3. Alerting System

- **Configurable Rules**: Custom alert conditions and thresholds
- **Multiple Severity Levels**: Low, Medium, High, Critical
- **Action Types**: Logging, webhooks, email notifications
- **Auto-resolution**: Alerts automatically resolve when conditions normalize

### 4. Historical Data

- **Time-series Data**: Minute, hour, and day-level aggregations
- **Trend Analysis**: Performance trends over time
- **Capacity Planning**: Historical usage patterns for scaling decisions

## API Endpoints

### Dashboard and Real-time Data

#### Get Dashboard Data
```http
GET /api/gateway/dashboard
```

Returns comprehensive dashboard data including overview, performance, system metrics, service health, and active alerts.

**Response Structure:**
```json
{
  "overview": {
    "status": "healthy|warning|critical",
    "uptime": 3600,
    "totalRequests": 1000,
    "activeAlerts": 2,
    "servicesHealth": {
      "healthy": 3,
      "total": 4,
      "percentage": 75
    }
  },
  "performance": {
    "requestsPerSecond": 16.67,
    "averageResponseTime": 150,
    "errorRate": 2.5,
    "p95ResponseTime": 300
  },
  "system": {
    "cpuUsage": 25,
    "memoryUsage": 60,
    "loadAverage": [0.5, 0.6, 0.7]
  },
  "services": [...],
  "alerts": [...],
  "trafficControl": {...}
}
```

#### Get Real-time Metrics
```http
GET /api/gateway/metrics/realtime
```

Returns real-time metrics updated every few seconds.

### Analytics Endpoints

#### Performance Analytics
```http
GET /api/gateway/analytics/performance?start=2024-01-01T00:00:00Z&end=2024-01-01T23:59:59Z
```

**Query Parameters:**
- `start` (optional): Start date for analysis
- `end` (optional): End date for analysis

#### Historical Data
```http
GET /api/gateway/analytics/historical?start=2024-01-01T00:00:00Z&end=2024-01-01T23:59:59Z&interval=hour
```

**Query Parameters:**
- `start` (required): Start date
- `end` (required): End date  
- `interval` (optional): `minute`, `hour`, or `day` (default: `hour`)

#### Endpoint Analytics
```http
GET /api/gateway/analytics/endpoints/{endpoint}?method=GET
```

**Path Parameters:**
- `endpoint`: URL-encoded endpoint path (e.g., `/api/users`)

**Query Parameters:**
- `method` (optional): HTTP method filter

#### Top Endpoints
```http
GET /api/gateway/analytics/top-endpoints?limit=10&start=2024-01-01T00:00:00Z&end=2024-01-01T23:59:59Z
```

#### Slowest Endpoints
```http
GET /api/gateway/analytics/slowest-endpoints?limit=10&start=2024-01-01T00:00:00Z&end=2024-01-01T23:59:59Z
```

### Health Monitoring

#### System Health
```http
GET /api/gateway/health/system
```

#### Service Health Details
```http
GET /api/gateway/health/services
```

#### Force Health Check
```http
POST /api/gateway/health/check/{service}
```

### Alert Management

#### Get Active Alerts
```http
GET /api/gateway/alerts
```

#### Get Alert Rules
```http
GET /api/gateway/alerts/rules
```

#### Add Alert Rule
```http
POST /api/gateway/alerts/rules
Content-Type: application/json

{
  "id": "custom-rule",
  "name": "High Memory Usage",
  "condition": {
    "metric": "memoryUsage",
    "operator": "gt",
    "threshold": 80,
    "duration": 300
  },
  "enabled": true,
  "actions": [
    {
      "type": "log",
      "config": { "level": "warn" }
    }
  ]
}
```

#### Update Alert Rule
```http
PUT /api/gateway/alerts/rules/{ruleId}
Content-Type: application/json

{
  "enabled": false,
  "condition": {
    "threshold": 90
  }
}
```

#### Delete Alert Rule
```http
DELETE /api/gateway/alerts/rules/{ruleId}
```

### Data Export

#### Export Metrics
```http
GET /api/gateway/export/metrics?format=json&start=2024-01-01T00:00:00Z&end=2024-01-01T23:59:59Z
```

**Query Parameters:**
- `format`: `json`, `csv`, or `prometheus`
- `start` (optional): Start date for export
- `end` (optional): End date for export

**Supported Formats:**

1. **JSON**: Complete structured data export
2. **CSV**: Tabular format for spreadsheet analysis
3. **Prometheus**: Metrics format for Prometheus ingestion

### Utility Endpoints

#### Raw Metrics
```http
GET /api/gateway/metrics/raw?limit=100
```

#### Clear Metrics (Development/Testing)
```http
DELETE /api/gateway/metrics
```

#### Gateway Configuration
```http
GET /api/gateway/config
```

## Alert Rules Configuration

### Available Metrics

- `errorRate`: Error percentage (0-100)
- `averageResponseTime`: Average response time in milliseconds
- `memoryUsage`: Memory usage percentage (0-100)
- `healthyServicePercentage`: Percentage of healthy services (0-100)

### Operators

- `gt`: Greater than
- `gte`: Greater than or equal
- `lt`: Less than
- `lte`: Less than or equal
- `eq`: Equal to

### Action Types

1. **Log Actions**
   ```json
   {
     "type": "log",
     "config": {
       "level": "error|warn|info"
     }
   }
   ```

2. **Webhook Actions** (Future Implementation)
   ```json
   {
     "type": "webhook",
     "config": {
       "url": "https://example.com/webhook",
       "method": "POST",
       "headers": {...}
     }
   }
   ```

3. **Email Actions** (Future Implementation)
   ```json
   {
     "type": "email",
     "config": {
       "to": ["admin@example.com"],
       "subject": "Alert: {{ruleName}}"
     }
   }
   ```

### Default Alert Rules

The system comes with pre-configured alert rules:

1. **High Error Rate**: Triggers when error rate > 5% for 5 minutes
2. **High Response Time**: Triggers when average response time > 2000ms for 5 minutes
3. **High Memory Usage**: Triggers when memory usage > 85% for 10 minutes
4. **Service Unhealthy**: Triggers when healthy service percentage < 80% for 1 minute

## Real-time Updates (WebSocket)

The monitoring dashboard supports real-time updates via WebSocket connections. Connect to the gateway and listen for monitoring events:

```javascript
const ws = new WebSocket('ws://gateway-host/ws');

ws.onmessage = (event) => {
  const { event: eventType, data, timestamp } = JSON.parse(event.data);
  
  switch (eventType) {
    case 'initial-data':
      // Handle initial dashboard data
      break;
    case 'realtime-update':
      // Handle real-time metric updates
      break;
  }
};
```

## Performance Considerations

### Metrics Storage

- **In-Memory Buffer**: 1000 request metrics (configurable)
- **System Metrics**: 1440 data points (24 hours of minute-level data)
- **Automatic Cleanup**: Old data is automatically purged to prevent memory issues

### Collection Intervals

- **Request Metrics**: Collected on every request
- **System Metrics**: Collected every 60 seconds
- **Health Checks**: Configurable interval (default: 30 seconds)
- **Alert Evaluation**: Every 30 seconds

### Optimization Tips

1. **Adjust Buffer Sizes**: Modify `MAX_METRICS_BUFFER` for your memory constraints
2. **Filter Endpoints**: Exclude health check endpoints from detailed metrics
3. **Sampling**: Implement request sampling for high-traffic scenarios
4. **External Storage**: Consider persisting metrics to external time-series databases

## Integration Examples

### Grafana Dashboard

Export metrics in Prometheus format and configure Grafana:

```bash
curl "http://gateway:3000/api/gateway/export/metrics?format=prometheus" > gateway-metrics.txt
```

### Custom Monitoring

```javascript
// Fetch performance analytics
const analytics = await fetch('/api/gateway/analytics/performance')
  .then(res => res.json());

console.log(`Error Rate: ${analytics.errorRate.percentage}%`);
console.log(`Average Response Time: ${analytics.responseTime.average}ms`);
```

### Alert Integration

```javascript
// Add custom alert rule
const alertRule = {
  id: 'high-traffic',
  name: 'High Traffic Alert',
  condition: {
    metric: 'requestsPerMinute',
    operator: 'gt',
    threshold: 1000,
    duration: 300
  },
  enabled: true,
  actions: [
    { type: 'log', config: { level: 'warn' } }
  ]
};

await fetch('/api/gateway/alerts/rules', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(alertRule)
});
```

## Troubleshooting

### Common Issues

1. **High Memory Usage**
   - Reduce metrics buffer size
   - Implement request sampling
   - Clear metrics periodically in development

2. **Missing Metrics**
   - Verify MetricsMiddleware is properly configured
   - Check for middleware ordering issues
   - Ensure services are properly initialized

3. **Alert Not Triggering**
   - Verify alert rule configuration
   - Check metric availability
   - Review alert evaluation logs

4. **Performance Impact**
   - Monitor metrics collection overhead
   - Consider async processing for heavy operations
   - Optimize database queries if using external storage

### Debug Endpoints

- `/api/gateway/metrics/raw` - View raw collected metrics
- `/api/gateway/config` - Verify gateway configuration
- `/health` - Basic health check

## Security Considerations

1. **Access Control**: Secure monitoring endpoints with authentication
2. **Data Sensitivity**: Be careful with PII in metrics and logs
3. **Rate Limiting**: Apply rate limiting to monitoring endpoints
4. **CORS**: Configure appropriate CORS policies for dashboard access

## Future Enhancements

1. **External Storage**: Integration with InfluxDB, Prometheus, or other time-series databases
2. **Advanced Alerting**: Webhook and email notification support
3. **Machine Learning**: Anomaly detection and predictive analytics
4. **Custom Dashboards**: User-configurable dashboard layouts
5. **Mobile App**: Mobile monitoring application
6. **Distributed Tracing**: Integration with Jaeger or Zipkin

## Conclusion

The comprehensive monitoring and analytics system provides deep insights into gateway performance and system health. It enables proactive monitoring, quick issue identification, and data-driven optimization decisions. The system is designed to be extensible and can be enhanced with additional features as needed.

For additional support or feature requests, please refer to the project documentation or contact the development team.