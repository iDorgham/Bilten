# Bilten Platform Centralized Logging

This directory contains the centralized logging configuration and utilities for the Bilten platform. The logging system provides structured, searchable logs across all services with centralized collection and analysis.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │───▶│    Backend      │───▶│   Logstash      │
│   (Browser)     │    │   Log API       │    │                 │
└─────────────────┘    └─────────────────┘    │ - Processing    │
                                              │ - Parsing       │
┌─────────────────┐    ┌─────────────────┐    │ - Enrichment    │
│   Scanner       │───▶│    Backend      │───▶│                 │
│   (Mobile)      │    │   Log API       │    └─────────────────┘
└─────────────────┘    └─────────────────┘             │
                                                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Backend       │───▶│   File Logs     │───▶│ Elasticsearch   │
│   (Server)      │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    │ - Storage       │
                                              │ - Indexing      │
┌─────────────────┐    ┌─────────────────┐    │ - Search        │
│   Gateway       │───▶│   File Logs     │───▶│                 │
│   (Server)      │    │                 │    └─────────────────┘
└─────────────────┘    └─────────────────┘             │
                                                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │    Filebeat     │───▶│    Grafana      │
                       │                 │    │                 │
                       │ - Log Shipping  │    │ - Visualization │
                       │ - Collection    │    │ - Dashboards    │
                       └─────────────────┘    │ - Alerting      │
                                              └─────────────────┘
```

## Features

### Structured Logging
- **JSON Format**: All logs are structured in JSON format for easy parsing and searching
- **Consistent Schema**: Standardized fields across all services
- **Rich Context**: Includes request IDs, user IDs, session information, and more
- **Error Tracking**: Detailed error information with stack traces

### Multi-Service Support
- **Backend Services**: Node.js/Express applications with Winston
- **Frontend Applications**: React applications with custom logger
- **Mobile Applications**: React Native scanner app with offline support
- **API Gateway**: TypeScript service with enhanced routing logs

### Centralized Collection
- **Log Aggregation**: All logs collected in Elasticsearch
- **Real-time Processing**: Logstash processes logs in real-time
- **Multiple Inputs**: File-based, HTTP API, and direct TCP inputs
- **Reliable Delivery**: Retry mechanisms and offline storage

### Advanced Features
- **Log Levels**: ERROR, WARN, INFO, DEBUG, HTTP
- **Component Tagging**: Logs tagged by service component
- **Request Tracing**: Full request lifecycle tracking
- **Performance Metrics**: Duration and performance logging
- **Security**: Sensitive data redaction and secure transmission

## Quick Start

### 1. Start Monitoring Infrastructure

```bash
# Start Elasticsearch, Logstash, and Grafana
docker-compose -f docker-compose.monitoring.yml up -d

# Check services are running
docker-compose -f docker-compose.monitoring.yml ps
```

### 2. Configure Services

Copy the environment configuration to each service:

```bash
# Backend
cp monitoring/logging/.env.example bilten-backend/.env.logging

# Gateway  
cp monitoring/logging/.env.example bilten-gateway/.env.logging

# Frontend
cp monitoring/logging/.env.example bilten-frontend/.env.logging

# Scanner
cp monitoring/logging/.env.example bilten-scanner/.env.logging
```

### 3. Update Service Configurations

Each service needs to load the logging configuration:

**Backend (bilten-backend/src/server.js):**
```javascript
const { logger, httpLoggerMiddleware, errorLoggerMiddleware } = require('./utils/logger');

// Add middleware
app.use(httpLoggerMiddleware);
app.use(errorLoggerMiddleware);

// Use structured logging
logger.info('Server started', { port: PORT });
```

**Gateway (bilten-gateway/src/app.ts):**
```typescript
import { Logger } from './utils/Logger';

const logger = Logger.getInstance();
app.use(logger.getHttpMiddleware());
app.use(logger.getErrorMiddleware());
```

**Frontend (bilten-frontend/src/App.js):**
```javascript
import logger, { createComponentLogger } from './utils/logger';

const componentLogger = createComponentLogger('App');
componentLogger.info('Application started');
```

**Scanner (bilten-scanner/src/App.js):**
```javascript
import logger, { createComponentLogger } from './utils/logger';

const componentLogger = createComponentLogger('Scanner');
componentLogger.info('Scanner app started');
```

## Log Structure

### Standard Fields

All logs include these standard fields:

```json
{
  "@timestamp": "2024-01-01T12:00:00.000Z",
  "level": "INFO",
  "service": "backend",
  "component": "auth",
  "message": "User login successful",
  "environment": "production",
  "version": "1.0.0",
  "hostname": "backend-server-01",
  "pid": 1234
}
```

### Request Context

HTTP requests include additional context:

```json
{
  "requestId": "req-abc-123",
  "method": "POST",
  "url": "/api/v1/auth/login",
  "statusCode": 200,
  "duration": 150,
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0..."
}
```

### User Context

User-related logs include:

```json
{
  "userId": "user-456",
  "sessionId": "session-789",
  "action": "login"
}
```

### Error Context

Error logs include detailed information:

```json
{
  "error": {
    "message": "Database connection failed",
    "stack": "Error: Connection timeout...",
    "name": "ConnectionError"
  }
}
```

## Service-Specific Features

### Backend Service
- **Database Logging**: Connection, query, and transaction logs
- **Cache Logging**: Redis operations and performance
- **Authentication Logging**: Login attempts, token validation
- **API Logging**: Request/response cycles with timing

### Gateway Service
- **Routing Logging**: Route matching and forwarding
- **Service Discovery**: Backend service health and discovery
- **Load Balancing**: Request distribution and failover
- **Rate Limiting**: Throttling and abuse detection

### Frontend Service
- **User Interactions**: Button clicks, form submissions
- **API Calls**: HTTP requests with timing and status
- **Page Navigation**: Route changes and page views
- **Error Tracking**: JavaScript errors and crashes
- **Performance**: Page load times and metrics

### Scanner Service
- **QR Code Scanning**: Scan attempts and results
- **Offline Operations**: Local storage and sync
- **Camera Access**: Permission and error handling
- **Ticket Validation**: Success and failure cases

## Log Levels

### ERROR (0)
- Application errors and exceptions
- Failed API calls and database operations
- Security violations and authentication failures
- Critical system failures

### WARN (1)
- Deprecated feature usage
- Performance degradation warnings
- Configuration issues
- Recoverable errors

### INFO (2)
- Application lifecycle events (start, stop)
- Successful operations and transactions
- User actions and business events
- System state changes

### HTTP (3)
- HTTP request/response logging
- API endpoint access
- Request timing and status codes
- Client information

### DEBUG (4)
- Detailed execution flow
- Variable values and state
- Development and troubleshooting information
- Performance profiling data

## Searching and Analysis

### Elasticsearch Queries

**Find all errors in the last hour:**
```json
{
  "query": {
    "bool": {
      "must": [
        { "term": { "level": "ERROR" } },
        { "range": { "@timestamp": { "gte": "now-1h" } } }
      ]
    }
  }
}
```

**Find logs for a specific request:**
```json
{
  "query": {
    "term": { "requestId": "req-abc-123" }
  }
}
```

**Find logs for a specific user:**
```json
{
  "query": {
    "term": { "userId": "user-456" }
  }
}
```

### Grafana Dashboards

Pre-built dashboards are available for:

1. **Application Overview**: Service health and error rates
2. **Request Analytics**: API performance and usage patterns
3. **Error Analysis**: Error trends and root cause analysis
4. **User Activity**: User behavior and engagement metrics
5. **Performance Monitoring**: Response times and throughput

### Common Queries

**Top errors by service:**
```
service:backend AND level:ERROR | top service
```

**API response time analysis:**
```
component:http AND duration:>1000 | stats avg(duration) by url
```

**User activity tracking:**
```
userId:* AND action:* | timeline action by userId
```

## Configuration

### Environment Variables

**All Services:**
- `LOG_LEVEL`: Minimum log level (ERROR, WARN, INFO, DEBUG)
- `LOG_DIR`: Directory for log files
- `ENABLE_LOGSTASH`: Enable Logstash integration
- `LOGSTASH_HOST`: Logstash server hostname
- `LOGSTASH_PORT`: Logstash TCP port

**Frontend/Scanner:**
- `REACT_APP_API_URL`: Backend API URL for log submission
- `REACT_APP_VERSION`: Application version

### Logstash Configuration

**Input Ports:**
- `5044`: Filebeat input (log files)
- `5000`: TCP JSON input (direct from applications)
- `8080`: HTTP input (frontend/scanner logs)

**Processing:**
- JSON parsing and validation
- Field enrichment and normalization
- Geoip lookup for IP addresses
- User agent parsing

**Output:**
- `bilten-logs-*`: Main log index
- `bilten-errors-*`: Error-specific index
- `bilten-access-*`: HTTP access logs

### Elasticsearch Configuration

**Index Templates:**
- Optimized field mappings for log data
- Proper data types for timestamps and numbers
- Text analysis for message content
- Keyword fields for aggregations

**Retention:**
- Logs: 30 days (configurable)
- Errors: 90 days (configurable)
- Access logs: 7 days (configurable)

## Performance Considerations

### Log Volume Management
- **Sampling**: High-volume debug logs can be sampled
- **Buffering**: Client-side buffering reduces network overhead
- **Compression**: Gzip compression for log transmission
- **Batching**: Multiple logs sent in single requests

### Resource Usage
- **Memory**: Logstash configured with appropriate heap size
- **Disk**: Log rotation and retention policies
- **Network**: Efficient serialization and compression
- **CPU**: Optimized parsing and processing pipelines

### Scaling
- **Horizontal**: Multiple Logstash instances for high volume
- **Vertical**: Increased resources for processing power
- **Sharding**: Elasticsearch sharding for large datasets
- **Caching**: Redis caching for frequent queries

## Security

### Data Protection
- **Sensitive Data**: Automatic redaction of passwords, tokens
- **PII Handling**: User data anonymization options
- **Encryption**: TLS for log transmission
- **Access Control**: Role-based access to log data

### Compliance
- **GDPR**: User data retention and deletion
- **Audit Trails**: Immutable log records
- **Data Residency**: Geographic data storage controls
- **Retention Policies**: Automated data lifecycle management

## Troubleshooting

### Common Issues

**Logs not appearing in Elasticsearch:**
1. Check Logstash connectivity: `curl http://localhost:9600`
2. Verify Elasticsearch health: `curl http://localhost:9200/_cluster/health`
3. Check Logstash logs: `docker logs bilten-logstash`

**High log volume:**
1. Increase log level to reduce volume
2. Implement log sampling for debug logs
3. Scale Logstash horizontally
4. Optimize Elasticsearch indexing

**Missing log context:**
1. Verify middleware order in Express applications
2. Check request ID propagation
3. Ensure logger configuration is loaded

### Monitoring

**Key Metrics:**
- Log ingestion rate (logs/second)
- Processing latency (milliseconds)
- Error rates by service
- Elasticsearch cluster health
- Disk usage and retention

**Alerts:**
- High error rates (>5% of total logs)
- Log processing delays (>30 seconds)
- Elasticsearch cluster issues
- Disk space warnings (>80% full)

## Development

### Adding New Log Fields

1. **Update Logger Configuration:**
   ```javascript
   // Add new field to log entry
   const logEntry = {
     ...existingFields,
     newField: value
   };
   ```

2. **Update Elasticsearch Template:**
   ```json
   {
     "newField": {
       "type": "keyword",
       "fields": {
         "text": { "type": "text" }
       }
     }
   }
   ```

3. **Update Logstash Pipeline:**
   ```ruby
   # Add processing for new field
   if [newField] {
     mutate {
       add_tag => ["has_new_field"]
     }
   }
   ```

### Testing

**Unit Tests:**
```javascript
// Test logger functionality
const logger = require('./utils/logger');
logger.info('Test message', { testField: 'value' });
```

**Integration Tests:**
```javascript
// Test log ingestion API
const response = await fetch('/api/v1/logs', {
  method: 'POST',
  body: JSON.stringify({ logs: [logEntry] })
});
```

### Best Practices

1. **Use Appropriate Log Levels**: Don't log everything at INFO level
2. **Include Context**: Always include relevant request/user context
3. **Avoid Sensitive Data**: Never log passwords, tokens, or PII
4. **Use Structured Data**: Prefer structured fields over string concatenation
5. **Performance**: Be mindful of logging overhead in hot paths
6. **Consistency**: Use consistent field names across services

## Support

For issues with the logging system:

1. Check the troubleshooting section above
2. Review service-specific logs in the `logs/` directory
3. Monitor Elasticsearch and Logstash health
4. Consult the Grafana dashboards for system metrics

The centralized logging system is designed to provide comprehensive visibility into the Bilten platform while maintaining performance and security standards.