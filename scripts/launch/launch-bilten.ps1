# Bilten Project Launch Script
# Complete environment setup and launch

param(
    [switch]$Production,
    [switch]$SkipHealthChecks,
    [switch]$SkipDatabase,
    [switch]$SkipMonitoring
)

Write-Host "🚀 Bilten Project Launch Script" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Configuration
$DOCKER_COMPOSE_FILE = "infrastructure/docker/docker-compose.yml"
$MONITORING_COMPOSE_FILE = "infrastructure/docker/docker-compose.monitoring.yml"
$PROD_COMPOSE_FILE = "infrastructure/docker/docker-compose.prod.yml"

# Colors for output
$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"
$Cyan = "Cyan"
$White = "White"

function Write-Status {
    param($Message, $Color = $White, $Status = "")
    if ($Status) {
        Write-Host "[$Status] $Message" -ForegroundColor $Color
    } else {
        Write-Host $Message -ForegroundColor $Color
    }
}

function Test-Prerequisites {
    Write-Status "Checking prerequisites..." $Cyan "CHECK"
    
    # Check Docker
    try {
        $dockerVersion = docker --version
        Write-Status "✓ Docker: $dockerVersion" $Green
    } catch {
        Write-Status "✗ Docker not found. Please install Docker Desktop." $Red
        exit 1
    }
    
    # Check Docker Compose
    try {
        $composeVersion = docker-compose --version
        Write-Status "✓ Docker Compose: $composeVersion" $Green
    } catch {
        Write-Status "✗ Docker Compose not found. Please install Docker Compose." $Red
        exit 1
    }
    
    # Check Node.js
    try {
        $nodeVersion = node --version
        Write-Status "✓ Node.js: $nodeVersion" $Green
    } catch {
        Write-Status "✗ Node.js not found. Please install Node.js." $Red
        exit 1
    }
    
    # Check if Docker is running
    try {
        docker info | Out-Null
        Write-Status "✓ Docker is running" $Green
    } catch {
        Write-Status "✗ Docker is not running. Please start Docker Desktop." $Red
        exit 1
    }
}

function Setup-Environment {
    Write-Status "Setting up environment files..." $Cyan "SETUP"
    
    # Run environment setup script
    if (Test-Path "config/env/setup-env.ps1") {
        & "config/env/setup-env.ps1"
        Write-Status "✓ Environment files created" $Green
    } else {
        Write-Status "✗ Environment setup script not found" $Red
        exit 1
    }
}

function Install-WorkspaceDependencies {
    Write-Status "Installing workspace dependencies..." $Cyan "DEPS"
    
    # Install root dependencies first
    if (!(Test-Path "node_modules")) {
        Write-Status "Installing root dependencies..." $Yellow
        npm install
    }
    
    # Install dependencies for each app without changing directories
    $apps = @("bilten-backend", "bilten-gateway", "bilten-frontend", "bilten-scanner")
    
    foreach ($app in $apps) {
        $appPath = "apps/$app"
        if (Test-Path $appPath) {
            Write-Status "Installing dependencies for $app..." $Yellow
            npm install --prefix $appPath
        }
    }
    
    Write-Status "✓ All dependencies installed" $Green
}

function Start-Database {
    if ($SkipDatabase) {
        Write-Status "Skipping database startup..." $Yellow "SKIP"
        return
    }
    
    Write-Status "Starting database services..." $Cyan "DB"
    
    # Start PostgreSQL and related services
    docker-compose -f $DOCKER_COMPOSE_FILE up -d postgres postgres-replica redis-session redis-cache redis-realtime clickhouse elasticsearch
    
    # Wait for PostgreSQL to be ready
    Write-Status "Waiting for PostgreSQL to be ready..." $Yellow "WAIT"
    $maxAttempts = 30
    $attempt = 0
    
    do {
        Start-Sleep -Seconds 2
        $attempt++
        try {
            $result = docker exec bilten-postgres-primary pg_isready -U bilten_user -d bilten_primary 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Status "✓ PostgreSQL is ready" $Green
                break
            }
        } catch {
            # Continue waiting
        }
        
        if ($attempt -ge $maxAttempts) {
            Write-Status "✗ PostgreSQL failed to start within timeout" $Red
            exit 1
        }
        
        Write-Status "Waiting for PostgreSQL... (attempt $attempt/$maxAttempts)" $Yellow
    } while ($true)
    
    # Initialize database if needed
    Write-Status "Initializing database..." $Cyan "INIT"
    try {
        docker exec bilten-postgres-primary psql -U bilten_user -d bilten_primary -c "SELECT 1;" 2>$null
        Write-Status "✓ Database initialized" $Green
    } catch {
        Write-Status "⚠ Database initialization failed, but continuing..." $Yellow
    }
}

function Start-Monitoring {
    if ($SkipMonitoring) {
        Write-Status "Skipping monitoring startup..." $Yellow "SKIP"
        return
    }
    
    Write-Status "Starting monitoring stack..." $Cyan "MONITOR"
    
    if (Test-Path $MONITORING_COMPOSE_FILE) {
        docker-compose -f $MONITORING_COMPOSE_FILE up -d
        Write-Status "✓ Monitoring stack started" $Green
    } else {
        Write-Status "⚠ Monitoring compose file not found" $Yellow
    }
}

function Start-Backend {
    Write-Status "Starting Bilten Backend..." $Cyan "BACKEND"
    
    # Check if backend directory exists
    if (!(Test-Path "apps/bilten-backend")) {
        Write-Status "✗ Backend directory not found" $Red
        exit 1
    }
    
    # Start backend in background
    Write-Status "Starting backend server..." $Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'apps/bilten-backend'; npm run dev" -WindowStyle Normal
    Start-Sleep -Seconds 5
    
    # Wait for backend to be ready
    Write-Status "Waiting for backend to be ready..." $Yellow
    $maxAttempts = 30
    $attempt = 0
    
    do {
        Start-Sleep -Seconds 2
        $attempt++
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -TimeoutSec 5 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Status "✓ Backend is ready" $Green
                break
            }
        } catch {
            # Continue waiting
        }
        
        if ($attempt -ge $maxAttempts) {
            Write-Status "⚠ Backend health check failed, but continuing..." $Yellow
            break
        }
        
        Write-Status "Waiting for backend... (attempt $attempt/$maxAttempts)" $Yellow
    } while ($true)
}

function Start-Gateway {
    Write-Status "Starting Bilten Gateway..." $Cyan "GATEWAY"
    
    # Check if gateway directory exists
    if (!(Test-Path "apps/bilten-gateway")) {
        Write-Status "✗ Gateway directory not found" $Red
        exit 1
    }
    
    # Start gateway in background
    Write-Status "Starting gateway server..." $Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'apps/bilten-gateway'; npm run dev" -WindowStyle Normal
    Start-Sleep -Seconds 3
    
    # Wait for gateway to be ready
    Write-Status "Waiting for gateway to be ready..." $Yellow
    $maxAttempts = 20
    $attempt = 0
    
    do {
        Start-Sleep -Seconds 2
        $attempt++
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3003/health" -TimeoutSec 5 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Status "✓ Gateway is ready" $Green
                break
            }
        } catch {
            # Continue waiting
        }
        
        if ($attempt -ge $maxAttempts) {
            Write-Status "⚠ Gateway health check failed, but continuing..." $Yellow
            break
        }
        
        Write-Status "Waiting for gateway... (attempt $attempt/$maxAttempts)" $Yellow
    } while ($true)
}

function Start-Frontend {
    Write-Status "Starting Bilten Frontend..." $Cyan "FRONTEND"
    
    # Check if frontend directory exists
    if (!(Test-Path "apps/bilten-frontend")) {
        Write-Status "✗ Frontend directory not found" $Red
        exit 1
    }
    
    # Start frontend in background
    Write-Status "Starting frontend server..." $Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'apps/bilten-frontend'; npm start" -WindowStyle Normal
    Start-Sleep -Seconds 3
    
    Write-Status "✓ Frontend started" $Green
}

function Start-Scanner {
    Write-Status "Starting Bilten Scanner..." $Cyan "SCANNER"
    
    # Check if scanner directory exists
    if (!(Test-Path "apps/bilten-scanner")) {
        Write-Status "✗ Scanner directory not found" $Red
        exit 1
    }
    
    # Start scanner in background
    Write-Status "Starting scanner server..." $Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'apps/bilten-scanner'; npm run dev" -WindowStyle Normal
    Start-Sleep -Seconds 3
    
    Write-Status "✓ Scanner started" $Green
}

function Test-HealthChecks {
    if ($SkipHealthChecks) {
        Write-Status "Skipping health checks..." $Yellow "SKIP"
        return
    }
    
    Write-Status "Running health checks..." $Cyan "HEALTH"
    
    $services = @(
        @{Name="PostgreSQL"; URL="http://localhost:5432"; Test="docker exec bilten-postgres-primary pg_isready -U bilten_user -d bilten_primary"},
        @{Name="Redis Session"; URL="http://localhost:6379"; Test="docker exec bilten-redis-session redis-cli ping"},
        @{Name="Backend API"; URL="http://localhost:3001/health"; Test="Invoke-WebRequest -Uri 'http://localhost:3001/health' -TimeoutSec 5"},
        @{Name="Gateway"; URL="http://localhost:3003/health"; Test="Invoke-WebRequest -Uri 'http://localhost:3003/health' -TimeoutSec 5"},
        @{Name="Frontend"; URL="http://localhost:3000"; Test="Invoke-WebRequest -Uri 'http://localhost:3000' -TimeoutSec 5"},
        @{Name="Scanner"; URL="http://localhost:3002"; Test="Invoke-WebRequest -Uri 'http://localhost:3002' -TimeoutSec 5"}
    )
    
    foreach ($service in $services) {
        try {
            if ($service.Test -like "docker*") {
                $result = Invoke-Expression $service.Test 2>$null
                if ($LASTEXITCODE -eq 0) {
                    Write-Status "✓ $($service.Name) is healthy" $Green
                } else {
                    Write-Status "✗ $($service.Name) health check failed" $Red
                }
            } else {
                $response = Invoke-Expression $service.Test -ErrorAction SilentlyContinue
                if ($response.StatusCode -eq 200) {
                    Write-Status "✓ $($service.Name) is healthy" $Green
                } else {
                    Write-Status "✗ $($service.Name) health check failed" $Red
                }
            }
        } catch {
            Write-Status "✗ $($service.Name) health check failed" $Red
        }
    }
}

function Show-LaunchInfo {
    Write-Host ""
    Write-Host "🎉 Bilten Environment Launched Successfully!" -ForegroundColor Green
    Write-Host "=============================================" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "📱 Applications:" -ForegroundColor Cyan
    Write-Host "   Frontend:     http://localhost:3000" -ForegroundColor White
    Write-Host "   Backend API:  http://localhost:3001" -ForegroundColor White
    Write-Host "   Gateway:      http://localhost:3003" -ForegroundColor White
    Write-Host "   Scanner:      http://localhost:3002" -ForegroundColor White
    Write-Host ""
    
    Write-Host "🗄️  Database Tools:" -ForegroundColor Cyan
    Write-Host "   pgAdmin:      http://localhost:5050" -ForegroundColor White
    Write-Host "   phpMyAdmin:   http://localhost:8080" -ForegroundColor White
    Write-Host ""
    
    Write-Host "📊 Monitoring:" -ForegroundColor Cyan
    Write-Host "   Grafana:      http://localhost:3000/grafana" -ForegroundColor White
    Write-Host "   Prometheus:   http://localhost:9090" -ForegroundColor White
    Write-Host ""
    
    Write-Host "🔧 Management:" -ForegroundColor Cyan
    Write-Host "   Docker:       docker ps" -ForegroundColor White
    Write-Host "   Logs:         docker-compose logs -f" -ForegroundColor White
    Write-Host "   Stop:         docker-compose down" -ForegroundColor White
    Write-Host ""
    
    Write-Host "📚 Documentation:" -ForegroundColor Cyan
    Write-Host "   API Docs:     http://localhost:3001/docs" -ForegroundColor White
    Write-Host "   Project Docs: docs/" -ForegroundColor White
    Write-Host ""
    
    Write-Host "⚠️  Important Notes:" -ForegroundColor Yellow
    Write-Host "   - All services are running in development mode" -ForegroundColor White
    Write-Host "   - Check logs for any errors" -ForegroundColor White
    Write-Host "   - Use Ctrl+C in terminal windows to stop services" -ForegroundColor White
    Write-Host ""
}

# Main execution
try {
    Test-Prerequisites
    Setup-Environment
    Install-WorkspaceDependencies
    Start-Database
    Start-Monitoring
    Start-Backend
    Start-Gateway
    Start-Frontend
    Start-Scanner
    Test-HealthChecks
    Show-LaunchInfo
} catch {
    Write-Status "Error during launch: $($_.Exception.Message)" $Red
    exit 1
}
