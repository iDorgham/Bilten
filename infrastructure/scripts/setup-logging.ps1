# Bilten Platform - Centralized Logging Setup Script (PowerShell)
# This script sets up the centralized logging infrastructure on Windows

param(
    [switch]$SkipDependencies,
    [switch]$SkipTest
)

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if Docker is running
function Test-Docker {
    Write-Status "Checking Docker installation..."
    
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Error "Docker is not installed. Please install Docker Desktop first."
        exit 1
    }
    
    try {
        docker info | Out-Null
        Write-Success "Docker is running"
    }
    catch {
        Write-Error "Docker is not running. Please start Docker Desktop first."
        exit 1
    }
}

# Check if Docker Compose is available
function Test-DockerCompose {
    Write-Status "Checking Docker Compose installation..."
    
    if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
        Write-Error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    }
    
    Write-Success "Docker Compose is available"
}

# Create necessary directories
function New-LogDirectories {
    Write-Status "Creating log directories..."
    
    # Create log directories for each service
    $directories = @(
        "temp\logs",
        "apps\bilten-backend\logs",
        "apps\bilten-gateway\logs", 
        "apps\bilten-frontend\logs",
        "apps\bilten-scanner\logs",
        "infrastructure\monitoring\logstash\pipeline",
        "infrastructure\monitoring\logstash\config",
        "infrastructure\monitoring\logstash\templates",
        "infrastructure\monitoring\filebeat"
    )
    
    foreach ($dir in $directories) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Status "Created directory: $dir"
        }
    }
    
    Write-Success "Log directories created"
}

# Set up environment files
function Set-Environment {
    Write-Status "Setting up environment configuration..."
    
    $services = @("apps\bilten-backend", "apps\bilten-gateway", "apps\bilten-frontend", "apps\bilten-scanner")
    
    foreach ($service in $services) {
        if (Test-Path $service) {
            $envFile = "$service\.env.logging"
            if (-not (Test-Path $envFile)) {
                Copy-Item "infrastructure\monitoring\logging\.env.example" $envFile
                Write-Status "Created $envFile"
            }
            else {
                Write-Warning "$envFile already exists, skipping"
            }
        }
        else {
            Write-Warning "Service directory $service not found, skipping"
        }
    }
    
    Write-Success "Environment configuration completed"
}

# Install logging dependencies
function Install-Dependencies {
    if ($SkipDependencies) {
        Write-Status "Skipping dependency installation"
        return
    }
    
    Write-Status "Installing logging dependencies..."
    
    # Backend dependencies
    if (Test-Path "apps\bilten-backend") {
        Write-Status "Installing backend logging dependencies..."
        Push-Location "apps\bilten-backend"
        
        if (Test-Path "package.json") {
            try {
                npm install winston express-validator --save
                Write-Success "Backend dependencies installed"
            }
            catch {
                Write-Warning "Failed to install backend dependencies: $_"
            }
        }
        else {
            Write-Warning "Backend package.json not found"
        }
        
        Pop-Location
    }
    
    # Gateway dependencies
    if (Test-Path "apps\bilten-gateway") {
        Write-Status "Checking gateway logging dependencies..."
        Push-Location "apps\bilten-gateway"
        
        if (Test-Path "package.json") {
            try {
                # Check if winston is already installed
                $winstonInstalled = npm list winston 2>$null
                if ($LASTEXITCODE -eq 0) {
                    Write-Success "Gateway dependencies already installed"
                }
                else {
                    npm install winston --save
                    Write-Success "Gateway dependencies installed"
                }
            }
            catch {
                Write-Warning "Failed to check/install gateway dependencies: $_"
            }
        }
        else {
            Write-Warning "Gateway package.json not found"
        }
        
        Pop-Location
    }
    
    Write-Success "Dependencies installation completed"
}

# Start monitoring infrastructure
function Start-Monitoring {
    Write-Status "Starting monitoring infrastructure..."
    
    if (-not (Test-Path "infrastructure\docker\docker-compose.monitoring.yml")) {
        Write-Error "docker-compose.monitoring.yml not found"
        exit 1
    }
    
    # Start Elasticsearch first
    docker-compose -f infrastructure\docker\docker-compose.monitoring.yml up -d elasticsearch
    Write-Status "Elasticsearch starting..."
    
    # Wait for Elasticsearch to be ready
    Write-Status "Waiting for Elasticsearch to be ready..."
    $timeout = 60
    $counter = 0
    
    do {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:9200/_cluster/health" -TimeoutSec 2 -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                break
            }
        }
        catch {
            # Continue waiting
        }
        
        Start-Sleep -Seconds 2
        $counter += 2
        Write-Host "." -NoNewline
    } while ($counter -lt $timeout)
    
    Write-Host ""
    
    if ($counter -ge $timeout) {
        Write-Error "Elasticsearch failed to start within $timeout seconds"
        exit 1
    }
    
    Write-Success "Elasticsearch is ready"
    
    # Start Logstash
    docker-compose -f infrastructure\docker\docker-compose.monitoring.yml up -d logstash
    Write-Status "Logstash starting..."
    
    # Wait for Logstash to be ready
    Write-Status "Waiting for Logstash to be ready..."
    $counter = 0
    
    do {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:9600" -TimeoutSec 2 -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                break
            }
        }
        catch {
            # Continue waiting
        }
        
        Start-Sleep -Seconds 2
        $counter += 2
        Write-Host "." -NoNewline
    } while ($counter -lt $timeout)
    
    Write-Host ""
    
    if ($counter -ge $timeout) {
        Write-Error "Logstash failed to start within $timeout seconds"
        exit 1
    }
    
    Write-Success "Logstash is ready"
    
    # Start remaining monitoring services
    docker-compose -f infrastructure\docker\docker-compose.monitoring.yml up -d
    
    Write-Success "Monitoring infrastructure started"
}

# Verify setup
function Test-Setup {
    Write-Status "Verifying logging setup..."
    
    # Check Elasticsearch
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:9200/_cluster/health" -ErrorAction Stop
        $health = $response.Content | ConvertFrom-Json
        if ($health.status -eq "green" -or $health.status -eq "yellow") {
            Write-Success "Elasticsearch is healthy"
        }
        else {
            Write-Error "Elasticsearch health check failed"
            return $false
        }
    }
    catch {
        Write-Error "Elasticsearch health check failed: $_"
        return $false
    }
    
    # Check Logstash
    try {
        Invoke-WebRequest -Uri "http://localhost:9600" -ErrorAction Stop | Out-Null
        Write-Success "Logstash is responding"
    }
    catch {
        Write-Error "Logstash health check failed: $_"
        return $false
    }
    
    # Check Grafana
    try {
        Invoke-WebRequest -Uri "http://localhost:3003" -ErrorAction Stop | Out-Null
        Write-Success "Grafana is responding"
    }
    catch {
        Write-Warning "Grafana may still be starting up"
    }
    
    Write-Success "Setup verification completed"
    return $true
}

# Create test log entry
function Test-Logging {
    if ($SkipTest) {
        Write-Status "Skipping logging test"
        return
    }
    
    Write-Status "Testing log ingestion..."
    
    # Wait a moment for services to be fully ready
    Start-Sleep -Seconds 5
    
    # Create a test log entry
    $timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    $hostname = $env:COMPUTERNAME
    
    $testLog = @{
        logs = @(
            @{
                '@timestamp' = $timestamp
                level = "INFO"
                service = "setup-script"
                component = "test"
                message = "Centralized logging setup completed successfully"
                environment = "development"
                version = "1.0.0"
                hostname = $hostname
                setupTest = $true
            }
        )
    } | ConvertTo-Json -Depth 3
    
    # Try to send test log via HTTP (if backend is running)
    try {
        $healthResponse = Invoke-WebRequest -Uri "http://localhost:3001/health" -TimeoutSec 5 -ErrorAction Stop
        if ($healthResponse.StatusCode -eq 200) {
            try {
                $logResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/v1/logs" -Method POST -Body $testLog -ContentType "application/json" -TimeoutSec 5 -ErrorAction Stop
                $responseContent = $logResponse.Content | ConvertFrom-Json
                if ($responseContent.success) {
                    Write-Success "Log ingestion via backend API working"
                }
                else {
                    Write-Warning "Backend API log ingestion test failed"
                }
            }
            catch {
                Write-Warning "Backend API log ingestion test failed: $_"
            }
        }
    }
    catch {
        Write-Warning "Backend not running, skipping API test"
    }
    
    # Try to send test log directly to Logstash HTTP endpoint
    try {
        Invoke-WebRequest -Uri "http://localhost:8080" -Method POST -Body $testLog -ContentType "application/json" -TimeoutSec 5 -ErrorAction Stop | Out-Null
        Write-Success "Direct Logstash ingestion working"
    }
    catch {
        Write-Warning "Direct Logstash ingestion test failed: $_"
    }
    
    Write-Success "Logging test completed"
}

# Display access information
function Show-AccessInfo {
    Write-Host ""
    Write-Host "🎉 Centralized Logging Setup Complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Access URLs:"
    Write-Host "  📊 Grafana:      http://localhost:3003 (admin/bilten_admin_password)"
    Write-Host "  🔍 Elasticsearch: http://localhost:9200"
    Write-Host "  ⚙️  Logstash:     http://localhost:9600"
    Write-Host "  📈 Prometheus:   http://localhost:9090"
    Write-Host ""
    Write-Host "Log Ingestion Endpoints:"
    Write-Host "  🌐 HTTP API:     http://localhost:3001/api/v1/logs"
    Write-Host "  🔌 TCP JSON:     localhost:5000"
    Write-Host "  📡 HTTP Direct:  http://localhost:8080"
    Write-Host "  📄 Filebeat:     localhost:5044"
    Write-Host ""
    Write-Host "Next Steps:"
    Write-Host "  1. Start your application services"
    Write-Host "  2. Check logs in Grafana dashboards"
    Write-Host "  3. Configure log levels in service .env files"
    Write-Host "  4. Set up alerting rules as needed"
    Write-Host ""
    Write-Host "Documentation:"
    Write-Host "  📚 Logging Guide: infrastructure\monitoring\logging\README.md"
    Write-Host "  🔧 Monitoring:    infrastructure\monitoring\README.md"
    Write-Host ""
}

# Main execution
function Main {
    Write-Host "🔧 Bilten Platform - Centralized Logging Setup" -ForegroundColor Cyan
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host ""
    
    try {
        Test-Docker
        Test-DockerCompose
        New-LogDirectories
        Set-Environment
        Install-Dependencies
        Start-Monitoring
        
        if (Test-Setup) {
            Test-Logging
            Show-AccessInfo
            Write-Success "Centralized logging setup completed successfully! 🎉"
        }
        else {
            Write-Error "Setup verification failed. Please check the logs and try again."
            exit 1
        }
    }
    catch {
        Write-Error "Setup failed: $_"
        exit 1
    }
}

# Run main function
Main