# Bilten Platform Monitoring Infrastructure Setup

## Overview

This document describes the complete monitoring infrastructure setup for the Bilten platform, including metrics collection, alerting, log aggregation, and visualization.

## Architecture

The monitoring infrastructure consists of:

### Metrics Stack (Prometheus)
- **Prometheus**: Time-series database and metrics collection
- **Alertmanager**: Alert routing and notification management  
- **Grafana**: Visualization and dashboarding
- **Exporters**: Service-specific metrics collection

### Logging Stack (ELK)
- **Elasticsearch**: Log storage and search (already configured)
- **Logstash**: Log processing and transformation
- **Filebeat**: Log shipping and collection

## Quick Start

### 1. Start Monitoring Infrastructure

```powershell
# Windows PowerShell
.\scripts\setup-monitoring.ps1

# Or manually
docker-compose -f docker-compose.monitoring.yml up -d
```

### 2. Verify Setup

```powershell
# Check service health
.\scripts\check-monitoring-health.ps1
```

### 3. Access Dashboards

- **Grafana**: http://localhost:3003 (admin/bilten_admin_password)
- **Prometheus**: http://localhost:9090
- **Alertmanager**: http://localhost:9093

## Services and Ports

| Service | Port | Purpose |
|---------|------|---------|
| Grafana | 3003 | Visualization dashboards |
| Prometheus | 9090 | Metrics collection and queries |
| Alertmanager | 9093 | Alert management |
| Node Exporter | 9100 | System metrics |
| cAdvisor | 8080 | Container metrics |
| PostgreSQL Exporter | 9187 | Database metrics |
| Redis Exporter | 9121 | Cache metrics |
| Elasticsearch Exporter | 9114 | Search metrics |
| ClickHouse Exporter | 9116 | Analytics metrics |
| Logstash | 5044 | Log processing |

## Configuration Files

### Prometheus Configuration
- `monitoring/prometheus/prometheus.yml` - Main configuration
- `monitoring/prometheus/rules/bilten-alerts.yml` - Alert rules

### Grafana Configuration  
- `monitoring/grafana/grafana.ini` - Main configuration
- `monitoring/grafana/provisioning/` - Datasources and dashboards

### Alertmanager Configuration
- `monitoring/alertmanager/alertmanager.yml` - Alert routing

### Log Processing
- `monitoring/logstash/pipeline/logstash.conf` - Log processing pipeline
- `monitoring/filebeat/filebeat.yml` - Log shipping configuration

## Pre-configured Dashboards

1. **Bilten Platform Overview**
   - Service status and availability
   - Request rates and response times
   - Error rates and performance metrics

2. **Database Monitoring**
   - PostgreSQL connection and query metrics
   - Redis memory usage and operations
   - ClickHouse query performance

3. **Application Logs**
   - Log volume by service
   - Error log analysis
   - Log level distribution

## Alert Rules

### Critical Alerts
- Service down (any service unavailable > 1 minute)
- High error rate (>5% error rate > 2 minutes)
- Database connection issues
- Redis/ClickHouse/Elasticsearch down

### Warning Alerts
- High API response time (95th percentile > 2s)
- High memory usage (>85%)
- High disk usage (>85%)

## Monitoring Targets

### Application Services
- Backend API (`bilten-backend:3001/metrics`)
- API Gateway (`bilten-gateway:8080/metrics`)
- Frontend (via reverse proxy)
- Scanner App (via reverse proxy)

### Infrastructure Services
- PostgreSQL (via postgres-exporter)
- Redis instances (via redis-exporter)
- ClickHouse (via clickhouse-exporter)
- Elasticsearch (via elasticsearch-exporter)

### System Metrics
- Host system (via node-exporter)
- Docker containers (via cAdvisor)

## Log Collection

### Application Logs
Applications should log in JSON format to `/logs` directory:

```json
{
  "timestamp": "2024-01-01T12:00:00Z",
  "level": "INFO",
  "service": "backend",
  "message": "User login successful",
  "userId": "12345",
  "requestId": "req-abc-123"
}
```

### Container Logs
Docker container logs are automatically collected by Filebeat and processed through Logstash.

## Maintenance

### Data Retention
- **Prometheus**: 200 hours (8+ days)
- **Elasticsearch**: 30 days (configurable)
- **Grafana**: Persistent configurations

### Backup Recommendations
- Grafana dashboards and configurations
- Prometheus alert rules
- Alertmanager configuration
- Custom dashboard exports

## Security Configuration

### Production Recommendations
1. Change default Grafana admin password
2. Configure proper authentication
3. Secure Prometheus and Alertmanager endpoints
4. Use TLS for external communications
5. Implement network segmentation

### Current Development Settings
- Grafana: admin/bilten_admin_password
- No authentication on Prometheus/Alertmanager
- HTTP-only communications

## Troubleshooting

### Common Issues

1. **Port Conflicts**
   - Check if ports 3003, 9090-9200 are available
   - Modify port mappings in docker-compose.monitoring.yml if needed

2. **Memory Issues**
   - Ensure at least 4GB RAM available
   - Adjust JVM settings for Elasticsearch/Logstash

3. **Permission Issues**
   - Grafana data directory permissions
   - Log file access permissions

### Health Checks

```powershell
# Check all services
.\scripts\check-monitoring-health.ps1

# Check specific service
curl http://localhost:9090/-/healthy  # Prometheus
curl http://localhost:3003/api/health # Grafana
curl http://localhost:9093/-/healthy  # Alertmanager
```

## Integration with Applications

### Adding Metrics to Services

1. Install Prometheus client library
2. Expose `/metrics` endpoint
3. Add custom business metrics
4. Update Prometheus scrape configuration

### Example Metrics Implementation (Node.js)

```javascript
const promClient = require('prom-client');

// Create metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status']
});

// Middleware to collect metrics
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration);
  });
  next();
});

// Expose metrics endpoint
app.get('/metrics', (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(promClient.register.metrics());
});
```

## Extending the Setup

### Adding New Services
1. Add scrape target to `prometheus.yml`
2. Create service-specific dashboard
3. Define relevant alert rules
4. Update log processing if needed

### Custom Dashboards
1. Create in Grafana UI
2. Export JSON configuration  
3. Add to `monitoring/grafana/provisioning/dashboards/json/`
4. Restart Grafana or reload configuration

### Additional Exporters
Consider adding:
- **Nginx Exporter**: Web server metrics
- **Blackbox Exporter**: Endpoint monitoring
- **JMX Exporter**: Java application metrics

## Performance Tuning

### Resource Requirements
- **Prometheus**: 2GB RAM, 2 CPU cores
- **Grafana**: 512MB RAM, 1 CPU core  
- **Elasticsearch**: 2GB RAM, 2 CPU cores
- **Logstash**: 1GB RAM, 1 CPU core

### Optimization Tips
- Adjust scrape intervals based on requirements
- Use recording rules for complex queries
- Configure appropriate retention periods
- Implement proper Elasticsearch indexing

## Next Steps

1. **Configure Alert Notifications**
   - Set up email/Slack integration in Alertmanager
   - Test notification channels

2. **Create Custom Dashboards**
   - Business-specific metrics
   - User journey analytics
   - Performance optimization views

3. **Implement Log Rotation**
   - Configure application log rotation
   - Set up Elasticsearch index lifecycle management

4. **Security Hardening**
   - Change default passwords
   - Configure authentication
   - Set up TLS certificates

5. **Backup Strategy**
   - Automated configuration backups
   - Monitoring data retention policies
   - Disaster recovery procedures