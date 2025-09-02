# Bilten Platform Monitoring Health Check Script (PowerShell)

Write-Host "🏥 Checking Bilten Platform Monitoring Health..." -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Function to check service health
function Check-Service {
    param(
        [string]$ServiceName,
        [string]$Url,
        [int]$ExpectedStatus = 200
    )
    
    Write-Host "Checking $ServiceName... " -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-Host "✅ Healthy (HTTP $($response.StatusCode))" -ForegroundColor Green
            return $true
        } else {
            Write-Host "⚠️  Unexpected status (HTTP $($response.StatusCode))" -ForegroundColor Yellow
            return $false
        }
    } catch {
        Write-Host "❌ Unreachable" -ForegroundColor Red
        return $false
    }
}

# Function to check if port is open
function Check-Port {
    param(
        [string]$ServiceName,
        [int]$Port
    )
    
    Write-Host "Checking $ServiceName port $Port... " -NoNewline
    
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $tcpClient.ConnectAsync("localhost", $Port).Wait(1000)
        if ($tcpClient.Connected) {
            Write-Host "✅ Open" -ForegroundColor Green
            $tcpClient.Close()
            return $true
        } else {
            Write-Host "❌ Closed" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Closed" -ForegroundColor Red
        return $false
    }
}

# Check core monitoring services
Write-Host ""
Write-Host "Core Monitoring Services:" -ForegroundColor Yellow
Write-Host "------------------------" -ForegroundColor Yellow
Check-Service "Prometheus" "http://localhost:9090/-/healthy"
Check-Service "Grafana" "http://localhost:3003/api/health"
Check-Service "Alertmanager" "http://localhost:9093/-/healthy"

Write-Host ""
Write-Host "Exporters:" -ForegroundColor Yellow
Write-Host "----------" -ForegroundColor Yellow
Check-Port "Node Exporter" 9100
Check-Port "cAdvisor" 8080
Check-Port "PostgreSQL Exporter" 9187
Check-Port "Redis Exporter" 9121
Check-Port "Elasticsearch Exporter" 9114
Check-Port "ClickHouse Exporter" 9116

Write-Host ""
Write-Host "Log Management:" -ForegroundColor Yellow
Write-Host "---------------" -ForegroundColor Yellow
Check-Port "Logstash" 5044

Write-Host ""
Write-Host "Data Sources:" -ForegroundColor Yellow
Write-Host "-------------" -ForegroundColor Yellow
Check-Service "Elasticsearch" "http://localhost:9200/_cluster/health"

# Check Prometheus targets
Write-Host ""
Write-Host "Prometheus Targets:" -ForegroundColor Yellow
Write-Host "-------------------" -ForegroundColor Yellow
try {
    $targets = Invoke-RestMethod -Uri "http://localhost:9090/api/v1/targets" -UseBasicParsing -TimeoutSec 5
    if ($targets.data.activeTargets) {
        $activeCount = $targets.data.activeTargets.Count
        $upCount = ($targets.data.activeTargets | Where-Object { $_.health -eq "up" }).Count
        Write-Host "Active targets: $activeCount, Up: $upCount" -ForegroundColor Green
        
        # Show any down targets
        $downTargets = $targets.data.activeTargets | Where-Object { $_.health -ne "up" }
        if ($downTargets) {
            Write-Host "Down targets:" -ForegroundColor Red
            foreach ($target in $downTargets) {
                Write-Host "  - $($target.discoveredLabels.job) ($($target.health))" -ForegroundColor Red
            }
        }
    }
} catch {
    Write-Host "❌ Could not fetch targets" -ForegroundColor Red
}

# Check Grafana datasources
Write-Host ""
Write-Host "Grafana Datasources:" -ForegroundColor Yellow
Write-Host "--------------------" -ForegroundColor Yellow
try {
    $credentials = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("admin:bilten_admin_password"))
    $headers = @{ Authorization = "Basic $credentials" }
    $datasources = Invoke-RestMethod -Uri "http://localhost:3003/api/datasources" -Headers $headers -UseBasicParsing -TimeoutSec 5
    
    if ($datasources) {
        Write-Host "Configured datasources: $($datasources.Count)"
        foreach ($ds in $datasources) {
            Write-Host "  - $($ds.name) ($($ds.type))"
        }
    }
} catch {
    Write-Host "❌ Could not fetch datasources" -ForegroundColor Red
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Health check complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Quick Access URLs:" -ForegroundColor Cyan
Write-Host "  - Grafana: http://localhost:3003"
Write-Host "  - Prometheus: http://localhost:9090"
Write-Host "  - Alertmanager: http://localhost:9093"