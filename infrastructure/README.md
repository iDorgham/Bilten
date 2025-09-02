# Infrastructure

This directory contains all infrastructure-related configurations, scripts, and resources for the Bilten platform.

## Directory Structure

### `database/`
Database configurations and migrations
- PostgreSQL configurations
- Redis configurations (cache, session, realtime)
- ClickHouse configurations
- Database initialization scripts
- Migration files

### `docker/`
Docker configurations
- Docker Compose files
- Dockerfile configurations
- Container orchestration
- Service definitions

### `monitoring/`
Monitoring and observability stack
- Prometheus configurations
- Grafana dashboards
- AlertManager rules
- Log aggregation setup
- Health check configurations

### `scripts/`
Infrastructure automation scripts
- Deployment scripts
- Backup scripts
- Maintenance scripts
- Environment setup scripts

### `temp/`
Temporary files and logs
- Application logs
- Temporary uploads
- Debug files
- Cache files

## Usage

### Database Setup
```bash
# Initialize database
cd infrastructure/database
./init/01-init.sql

# Start database services
docker-compose -f infrastructure/docker/docker-compose.yml up -d
```

### Monitoring Setup
```bash
# Start monitoring stack
docker-compose -f infrastructure/monitoring/docker-compose.monitoring.yml up -d

# Access Grafana
http://localhost:3000
```

### Infrastructure Scripts
```bash
# Run deployment scripts
./infrastructure/scripts/deploy.sh

# Run backup scripts
./infrastructure/scripts/backup.sh
```

## Configuration Files

### Database
- `database/postgresql.conf` - PostgreSQL configuration
- `database/redis-*.conf` - Redis configurations
- `database/clickhouse/` - ClickHouse configurations

### Docker
- `docker/docker-compose.yml` - Main Docker Compose
- `docker/docker-compose.prod.yml` - Production Docker Compose
- `docker/docker-compose.monitoring.yml` - Monitoring Docker Compose

### Monitoring
- `monitoring/prometheus.yml` - Prometheus configuration
- `monitoring/grafana/` - Grafana dashboards
- `monitoring/alertmanager/` - Alert rules

## Environment Variables

Infrastructure components use environment variables for configuration:
- Database connections
- Service endpoints
- API keys
- Feature flags

See `config/env/` for environment templates.

## Security

- All sensitive configurations use environment variables
- Database credentials are managed securely
- API keys are stored in secure locations
- Network access is restricted appropriately

## Maintenance

### Regular Tasks
- Database backups
- Log rotation
- Certificate renewal
- Security updates
- Performance monitoring

### Emergency Procedures
- Service recovery
- Data restoration
- Rollback procedures
- Incident response
