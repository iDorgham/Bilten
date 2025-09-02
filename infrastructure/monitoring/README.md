# Bilten Platform Monitoring Infrastructure

This directory contains the complete monitoring setup for the Bilten platform, including metrics collection, alerting, and log aggregation.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Applications  │───▶│   Prometheus    │───▶│    Grafana      │
│                 │    │                 │    │                 │
│ - Backend API   │    │ - Metrics Store │    │ - Visualization │
│ - Frontend      │    │ - Alert Rules   │    │ - Dashboards    │
│ - Gateway       │    │ - Exporters     │    │ - Analytics     │
│ - Scanner       │    └─────────────────┘    └─────────────────┘
└─────────────────┘             │
         │                      ▼
         │              ┌─────────────────┐
         │              │  Alertmanager   │
         │              │                 │
         │              │ - Notifications │
         │              │ - Routing       │
         │              │ - Silencing     │
         ▼              └─────────────────┘
┌─────────────────┐
│  Elasticsearch  │◀───┌─────────────────┐
│                 │    │    Logstash     │◀───┌─────────────────┐
│ - Log Storage   │    │                 │    │    Filebeat     │
│ - Search        │    │ - Log Processing│    │                 │
│ - Indexing      │    │ - Parsing       │    │ - Log Shipping  │
└─────────────────┘    │ - Enrichment    │    │ - Collection    │
                       └─────────────────┘    └─────────────────┘
```

## Components

### Metrics Collection (Prometheus Stack)

- **Prometheus**: Time-series database and metrics collection
- **Alertmanager**: Alert routing and notification management
- **Grafana**: Visualization and dashboarding
- **Node Exporter**: System-level metrics
- **cAdvisor**: Container metrics
- **Database Exporters**: PostgreSQL, Redis, ClickHouse, Elasticsearch metrics

### Log Management (ELK Stack)

- **Elasticsearch**: Log storage and search engine
- **Logstash**: Log processing and transformation
- **Filebeat**: Log shipping and collection

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- At least 4GB RAM available for monitoring services
- Ports 3003, 9090, 9093, 9100-9200 available

### Setup

1. **Run the setup script:**
   ```bash
   # Linux/macOS
   chmod +x scripts/setup-monitoring.sh
   ./scripts/setup-monitoring.sh
   
   # Windows PowerShell
   .\scripts\setup-monitoring.ps1
   ```

2. **Or manually start services:**
   ```bash
   docker-compose -f docker-compose.monitoring.yml up -d
   ```

### Access URLs

- **Grafana**: http://localhost:3003
  - Username: `admin`
  - Password: `bilten_admin_password`
- **Prometheus**: http://localhost:9090
- **Alertmanager**: http://localhost:9093

## Configuration

### Prometheus Configuration

The main configuration is in `monitoring/prometheus/prometheus.yml`:

- **Scrape Intervals**: 15s default, 30s for application services
- **Retention**: 200 hours (configurable)
- **Targets**: All Bilten services and exporters

### Alert Rules

Alert rules are defined in `monitoring/prometheus/rules/bilten-alerts.yml`:

- Service availability monitoring
- Performance thresholds
- Error rate monitoring
- Resource utilization alerts

### Grafana Dashboards

Pre-configured dashboards:

1. **Bilten Platform Overview**: High-level service metrics
2. **Database Monitoring**: PostgreSQL, Redis, ClickHouse metrics
3. **Application Logs**: Log analysis and error tracking

### Log Processing

Logstash pipeline configuration in `monitoring/logstash/pipeline/logstash.conf`:

- JSON log parsing
- Service identification
- HTTP access log parsing
- Elasticsearch indexing

## Monitoring Targets

### Application Services

- **Backend API** (`bilten-backend:3001/metrics`)
- **API Gateway** (`bilten-gateway:8080/metrics`)
- **Frontend** (via reverse proxy metrics)
- **Scanner App** (via reverse proxy metrics)

### Infrastructure Services

- **PostgreSQL** (via postgres-exporter)
- **Redis** (via redis-exporter)
- **ClickHouse** (via clickhouse-exporter)
- **Elasticsearch** (via elasticsearch-exporter)

### System Metrics

- **Host System** (via node-exporter)
- **Docker Containers** (via cAdvisor)

## Alert Configuration

### Alert Levels

- **Critical**: Service down, high error rates, security issues
- **Warning**: Performance degradation, resource usage
- **Info**: Maintenance notifications, deployment events

### Notification Channels

Configure in `monitoring/alertmanager/alertmanager.yml`:

- Email notifications
- Webhook integrations
- Slack/Teams integration (configure as needed)

## Maintenance

### Data Retention

- **Prometheus**: 200 hours (8+ days)
- **Elasticsearch**: 30 days (configurable via index lifecycle)
- **Grafana**: Persistent dashboards and configurations

### Backup

Important data to backup:

- Grafana dashboards and configurations
- Prometheus alert rules
- Alertmanager configuration

### Log Rotation

Configure log rotation for:

- Application logs in `/logs` directory
- Container logs (Docker handles this)
- Monitoring service logs

## Troubleshooting

### Common Issues

1. **Services not starting**:
   - Check port conflicts
   - Verify Docker resources
   - Check file permissions

2. **No metrics appearing**:
   - Verify service endpoints
   - Check Prometheus targets page
   - Validate network connectivity

3. **Alerts not firing**:
   - Check alert rule syntax
   - Verify Alertmanager configuration
   - Test notification channels

### Health Checks

```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Check Grafana health
curl http://localhost:3003/api/health

# Check Alertmanager status
curl http://localhost:9093/api/v1/status
```

## Security Considerations

- Change default passwords in production
- Configure proper authentication for Grafana
- Secure Prometheus and Alertmanager endpoints
- Use TLS for external communications
- Implement proper network segmentation

## Performance Tuning

### Resource Allocation

Recommended minimum resources:

- **Prometheus**: 2GB RAM, 2 CPU cores
- **Grafana**: 512MB RAM, 1 CPU core
- **Elasticsearch**: 2GB RAM, 2 CPU cores
- **Logstash**: 1GB RAM, 1 CPU core

### Optimization

- Adjust scrape intervals based on needs
- Configure appropriate retention periods
- Use recording rules for complex queries
- Implement proper indexing in Elasticsearch

## Integration with Applications

### Adding Metrics to Applications

1. **Install Prometheus client library**
2. **Expose metrics endpoint** (`/metrics`)
3. **Add custom business metrics**
4. **Update Prometheus configuration**

### Structured Logging

Applications should log in JSON format:

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

## Extending the Setup

### Adding New Services

1. Add scrape configuration to Prometheus
2. Create service-specific dashboards
3. Define relevant alert rules
4. Update log processing if needed

### Custom Dashboards

1. Create dashboard in Grafana UI
2. Export JSON configuration
3. Add to provisioning directory
4. Restart Grafana or reload configuration

### Additional Exporters

Common exporters to consider:

- **Nginx Exporter**: Web server metrics
- **Blackbox Exporter**: Endpoint monitoring
- **SNMP Exporter**: Network device monitoring
- **JMX Exporter**: Java application metrics