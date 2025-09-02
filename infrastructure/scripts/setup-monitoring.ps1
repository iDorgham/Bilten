# Bilten Platform Monitoring Setup Script (PowerShell)
# This script sets up the complete monitoring infrastructure on Windows

Write-Host "🚀 Setting up Bilten Platform Monitoring Infrastructure..." -ForegroundColor Green

# Create necessary directories
Write-Host "📁 Creating monitoring directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "infrastructure\monitoring\prometheus\rules"
New-Item -ItemType Directory -Force -Path "infrastructure\monitoring\alertmanager"
New-Item -ItemType Directory -Force -Path "infrastructure\monitoring\grafana\provisioning\datasources"
New-Item -ItemType Directory -Force -Path "infrastructure\monitoring\grafana\provisioning\dashboards\json"
New-Item -ItemType Directory -Force -Path "infrastructure\monitoring\logstash\config"
New-Item -ItemType Directory -Force -Path "infrastructure\monitoring\logstash\pipeline"
New-Item -ItemType Directory -Force -Path "infrastructure\monitoring\filebeat"
New-Item -ItemType Directory -Force -Path "temp\logs"

# Start monitoring services
Write-Host "🐳 Starting monitoring infrastructure..." -ForegroundColor Yellow
docker-compose -f infrastructure\docker\docker-compose.monitoring.yml up -d

# Wait for services to be ready
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Check service health
Write-Host "🏥 Checking service health..." -ForegroundColor Yellow

# Check Prometheus
try {
    $response = Invoke-WebRequest -Uri "http://localhost:9090/-/healthy" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Prometheus is healthy" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Prometheus health check failed" -ForegroundColor Red
}

# Check Grafana
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3003/api/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Grafana is healthy" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Grafana health check failed" -ForegroundColor Red
}

# Check Alertmanager
try {
    $response = Invoke-WebRequest -Uri "http://localhost:9093/-/healthy" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Alertmanager is healthy" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Alertmanager health check failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Monitoring infrastructure setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Access URLs:" -ForegroundColor Cyan
Write-Host "  - Prometheus: http://localhost:9090"
Write-Host "  - Grafana: http://localhost:3003 (admin/bilten_admin_password)"
Write-Host "  - Alertmanager: http://localhost:9093"
Write-Host ""
Write-Host "📈 Exporters:" -ForegroundColor Cyan
Write-Host "  - Node Exporter: http://localhost:9100"
Write-Host "  - cAdvisor: http://localhost:8080"
Write-Host "  - PostgreSQL Exporter: http://localhost:9187"
Write-Host "  - Redis Exporter: http://localhost:9121"
Write-Host "  - Elasticsearch Exporter: http://localhost:9114"
Write-Host "  - ClickHouse Exporter: http://localhost:9116"
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Configure alert notification channels in Alertmanager"
Write-Host "  2. Import additional Grafana dashboards as needed"
Write-Host "  3. Set up log rotation for application logs"
Write-Host "  4. Configure backup for monitoring data"