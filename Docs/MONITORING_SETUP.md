# Bilten Monitoring Setup Guide

This document provides comprehensive instructions for setting up and configuring the monitoring system for the Bilten platform.

## Overview

The monitoring system integrates multiple tools to provide comprehensive observability:

- **New Relic APM**: Application performance monitoring
- **AWS CloudWatch**: Infrastructure monitoring and logging
- **Custom Metrics**: Business-specific metrics and health checks
- **Frontend Monitoring**: Browser performance and user interaction tracking

## Prerequisites

1. New Relic account and license key
2. AWS account with CloudWatch access
3. Environment variables configured

## Environment Variables

### Backend (.env)

```bash
# New Relic Configuration
NEW_RELIC_LICENSE_KEY=your_new_relic_license_key
NEW_RELIC_APP_NAME=Bilten Backend

# AWS CloudWatch Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key

# Logging Configuration
LOG_LEVEL=info
NODE_ENV=production

# Application Configuration
API_VERSION=v1
FRONTEND_URL=https://your-frontend-domain.com
```

### Frontend (.env)

```bash
# New Relic Browser Configuration
REACT_APP_NEW_RELIC_LICENSE_KEY=your_new_relic_license_key
REACT_APP_NEW_RELIC_APPLICATION_ID=your_application_id

# API Configuration
REACT_APP_API_URL=https://your-backend-domain.com
```

## Installation

### 1. Install Dependencies

```bash
# Backend
npm install

# Frontend
cd bilten-frontend
npm install
```

### 2. Run Database Migrations

```bash
npm run migrate
```

### 3. Start the Application

```bash
# Backend
npm start

# Frontend
cd bilten-frontend
npm start
```

## Monitoring Endpoints

### Health Check
- **URL**: `GET /monitoring/health`
- **Description**: Overall system health status
- **Response**: Health status, uptime, and key metrics

### Metrics
- **URL**: `GET /monitoring/metrics`
- **Description**: Detailed system and business metrics
- **Response**: Comprehensive metrics data

### Status
- **URL**: `GET /monitoring/status`
- **Description**: System status with performance data
- **Response**: System information and performance metrics

### Alerts
- **URL**: `GET /monitoring/alerts`
- **Description**: Active system alerts
- **Response**: List of current alerts with severity levels

### Manual Logging
- **URL**: `POST /monitoring/log`
- **Description**: Manual log entry
- **Body**: `{ "level": "info", "message": "Log message", "meta": {} }`

### Manual Metrics
- **URL**: `POST /monitoring/metric`
- **Description**: Manual metric tracking
- **Body**: `{ "name": "metric_name", "value": 1, "tags": {} }`

## New Relic Integration

### Backend APM

The backend automatically integrates with New Relic APM when the `NEW_RELIC_LICENSE_KEY` environment variable is set.

**Features:**
- Automatic transaction tracing
- Database query monitoring
- Error tracking and alerting
- Custom metrics and events
- Distributed tracing

### Frontend Browser Monitoring

The frontend integrates with New Relic Browser monitoring for:
- Page load performance
- User interaction tracking
- Error monitoring
- Custom events and metrics

## CloudWatch Integration

### Logging

Logs are automatically sent to CloudWatch when running in production with proper AWS credentials.

**Log Groups:**
- `bilten-backend-logs`: Application logs
- `bilten-frontend-logs`: Frontend logs (if configured)

### Metrics

Custom metrics are sent to CloudWatch for:
- Request/response times
- Error rates
- Database performance
- Business metrics

## Custom Metrics

### Business Metrics

Track important business events:

```javascript
// Backend
const monitoringService = require('./services/monitoringService');

// Track event creation
await monitoringService.trackBusinessMetric('events_created', 1, {
  eventType: 'concert',
  organizerId: 'user123'
});

// Track order completion
await monitoringService.trackBusinessMetric('orders_completed', 1, {
  orderValue: 150.00,
  currency: 'USD'
});
```

### Frontend Metrics

```javascript
// Frontend
import monitoringService from './services/monitoringService';

// Track page view
monitoringService.trackPageView('home', {
  referrer: 'google.com'
});

// Track user interaction
monitoringService.trackButtonClick('signup-button', 'Sign Up', 'home');

// Track form submission
monitoringService.trackFormSubmission('contact-form', true, 2500);
```

## Monitoring Dashboard

### Access

The monitoring dashboard is available at `/monitoring` in the frontend application.

### Features

- **Real-time Health Status**: Overall system health with color-coded indicators
- **Performance Metrics**: Response times, request volumes, and error rates
- **Active Alerts**: Current system alerts with severity levels
- **System Information**: Environment details and uptime

### Dashboard Components

1. **Health Status Cards**
   - Overall system status
   - Database health
   - Memory usage
   - Error rate

2. **Performance Charts**
   - Response time trends
   - Request volume
   - Database query performance

3. **Alert Management**
   - Active alerts display
   - Severity-based color coding
   - Alert details and thresholds

## Alerting

### Automatic Alerts

The system automatically generates alerts for:

- **High Error Rate**: > 5% error rate
- **Slow Response Time**: > 1000ms average response time
- **Database Issues**: Database health check failures
- **High Memory Usage**: > 80% memory utilization

### Alert Severity Levels

- **High**: Critical issues requiring immediate attention
- **Medium**: Issues that should be addressed soon
- **Low**: Informational alerts

## Performance Monitoring

### Key Metrics

1. **Response Time**
   - Average response time
   - 95th percentile response time
   - Slow request identification

2. **Throughput**
   - Requests per second
   - Database queries per second
   - Error rate

3. **Resource Usage**
   - Memory utilization
   - CPU usage
   - Database connection pool

### Performance Thresholds

- **Response Time**: < 1000ms (warning), < 2000ms (critical)
- **Error Rate**: < 1% (healthy), < 5% (warning), > 5% (critical)
- **Memory Usage**: < 70% (healthy), < 80% (warning), > 80% (critical)

## Troubleshooting

### Common Issues

1. **New Relic Not Loading**
   - Check license key configuration
   - Verify network connectivity
   - Check browser console for errors

2. **CloudWatch Logs Not Appearing**
   - Verify AWS credentials
   - Check IAM permissions
   - Confirm region configuration

3. **Metrics Not Updating**
   - Check database connectivity
   - Verify monitoring service is running
   - Check for JavaScript errors in frontend

### Debug Mode

Enable debug logging by setting:

```bash
LOG_LEVEL=debug
```

### Health Check Failures

If health checks are failing:

1. Check database connectivity
2. Verify all required services are running
3. Review error logs for specific issues
4. Check environment variable configuration

## Security Considerations

### Data Privacy

- Sensitive data is automatically filtered from logs
- User IDs are anonymized in metrics
- PII is excluded from monitoring data

### Access Control

- Monitoring endpoints should be protected in production
- Consider IP whitelisting for monitoring access
- Use authentication for sensitive monitoring data

### Compliance

- GDPR-compliant data handling
- Data retention policies
- Audit trail for monitoring access

## Scaling Considerations

### High Traffic

- Monitor database connection pool usage
- Set up auto-scaling based on metrics
- Implement rate limiting for monitoring endpoints

### Data Retention

- Configure log retention policies
- Archive old metrics data
- Implement data cleanup procedures

## Best Practices

1. **Regular Monitoring**
   - Set up automated health checks
   - Monitor key business metrics
   - Review performance trends

2. **Alert Management**
   - Configure appropriate alert thresholds
   - Set up escalation procedures
   - Regular alert review and tuning

3. **Performance Optimization**
   - Monitor slow queries
   - Track resource usage
   - Optimize based on metrics

4. **Documentation**
   - Document custom metrics
   - Maintain runbooks for common issues
   - Keep monitoring configuration updated

## Support

For monitoring-related issues:

1. Check the troubleshooting section
2. Review New Relic and CloudWatch documentation
3. Contact the development team
4. Check system logs for detailed error information

## Future Enhancements

Planned monitoring improvements:

- **Grafana Integration**: Custom dashboards
- **Prometheus Metrics**: Additional metrics collection
- **SLA Monitoring**: Service level agreement tracking
- **Cost Monitoring**: AWS cost tracking and optimization
- **Security Monitoring**: Security event tracking and alerting
