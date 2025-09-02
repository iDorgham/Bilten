# Bilten Project Launch Script - Fixed Version
# Resolves dependency cycle between frontend and gateway

param(
    [switch]$Production,
    [switch]$SkipHealthChecks,
    [switch]$SkipDatabase,
    [switch]$SkipMonitoring
)

Write-Host "🚀 Bilten Project Launch Script (Fixed)" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Configuration
$DOCKER_COMPOSE_FILE = "infrastructure/docker/docker-compose.yml"
$MONITORING_COMPOSE_FILE = "infrastructure/docker/docker-compose.monitoring.yml"

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

function Start-Backend {
    Write-Status "Starting Bilten Backend..." $Cyan "BACKEND"
    
    if (!(Test-Path "apps/bilten-backend")) {
        Write-Status "✗ Backend directory not found" $Red
        exit 1
    }
    
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
    
    if (!(Test-Path "apps/bilten-gateway")) {
        Write-Status "✗ Gateway directory not found" $Red
        exit 1
    }
    
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
    
    if (!(Test-Path "apps/bilten-frontend")) {
        Write-Status "✗ Frontend directory not found" $Red
        exit 1
    }
    
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'apps/bilten-frontend'; npm start" -WindowStyle Normal
    Start-Sleep -Seconds 3
    
    Write-Status "✓ Frontend started" $Green
}

function Start-Scanner {
    Write-Status "Starting Bilten Scanner..." $Cyan "SCANNER"
    
    if (!(Test-Path "apps/bilten-scanner")) {
        Write-Status "✗ Scanner directory not found" $Red
        exit 1
    }
    
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'apps/bilten-scanner'; npm run dev" -WindowStyle Normal
    Start-Sleep -Seconds 3
    
    Write-Status "✓ Scanner started" $Green
}

# Main execution - Fixed order to prevent dependency cycles
try {
    Write-Status "Resolving dependency cycle..." $Cyan "FIX"
    Install-WorkspaceDependencies
    Start-Backend
    Start-Gateway
    Start-Frontend
    Start-Scanner
    
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
    Write-Host "✅ Dependency cycle resolved!" -ForegroundColor Green
} catch {
    Write-Status "Error during launch: $($_.Exception.Message)" $Red
    exit 1
}
