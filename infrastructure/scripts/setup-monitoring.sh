#!/bin/bash

# Bilten Platform Monitoring Setup Script
# This script sets up the complete monitoring infrastructure

set -e

echo "🚀 Setting up Bilten Platform Monitoring Infrastructure..."

# Create necessary directories
echo "📁 Creating monitoring directories..."
mkdir -p infrastructure/monitoring/prometheus/rules
mkdir -p infrastructure/monitoring/alertmanager
mkdir -p infrastructure/monitoring/grafana/provisioning/{datasources,dashboards/json}
mkdir -p infrastructure/monitoring/logstash/{config,pipeline}
mkdir -p infrastructure/monitoring/filebeat
mkdir -p logs

# Set proper permissions for Grafana
echo "🔐 Setting up permissions..."
sudo chown -R 472:472 infrastructure/monitoring/grafana/ || echo "Warning: Could not set Grafana permissions (may need to run as root)"

# Create logs directory with proper permissions
chmod 755 logs

# Start monitoring services
echo "🐳 Starting monitoring infrastructure..."
docker-compose -f docker-compose.monitoring.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check service health
echo "🏥 Checking service health..."

# Check Prometheus
if curl -s http://localhost:9090/-/healthy > /dev/null; then
    echo "✅ Prometheus is healthy"
else
    echo "❌ Prometheus health check failed"
fi

# Check Grafana
if curl -s http://localhost:3003/api/health > /dev/null; then
    echo "✅ Grafana is healthy"
else
    echo "❌ Grafana health check failed"
fi

# Check Alertmanager
if curl -s http://localhost:9093/-/healthy > /dev/null; then
    echo "✅ Alertmanager is healthy"
else
    echo "❌ Alertmanager health check failed"
fi

echo ""
echo "🎉 Monitoring infrastructure setup complete!"
echo ""
echo "📊 Access URLs:"
echo "  - Prometheus: http://localhost:9090"
echo "  - Grafana: http://localhost:3003 (admin/bilten_admin_password)"
echo "  - Alertmanager: http://localhost:9093"
echo ""
echo "📈 Exporters:"
echo "  - Node Exporter: http://localhost:9100"
echo "  - cAdvisor: http://localhost:8080"
echo "  - PostgreSQL Exporter: http://localhost:9187"
echo "  - Redis Exporter: http://localhost:9121"
echo "  - Elasticsearch Exporter: http://localhost:9114"
echo "  - ClickHouse Exporter: http://localhost:9116"
echo ""
echo "📝 Next steps:"
echo "  1. Configure alert notification channels in Alertmanager"
echo "  2. Import additional Grafana dashboards as needed"
echo "  3. Set up log rotation for application logs"
echo "  4. Configure backup for monitoring data"