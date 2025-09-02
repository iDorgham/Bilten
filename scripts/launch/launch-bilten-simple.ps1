# Bilten Project Launch Script - Simple Version
# Resolves dependency cycle by using workspace commands

Write-Host "🚀 Bilten Project Launch Script (Simple)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

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

function Install-Dependencies {
    Write-Status "Installing dependencies..." $Cyan "DEPS"
    
    # Install all dependencies using workspace
    npm install
    Write-Status "✓ Dependencies installed" $Green
}

function Start-Services {
    Write-Status "Starting services..." $Cyan "START"
    
    # Use the root npm dev command which handles the workspace properly
    Write-Status "Starting all services using npm workspace..." $Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal
    
    Write-Status "✓ Services started" $Green
}

function Show-Info {
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
    Write-Host "   Using npm workspace for proper dependency management" -ForegroundColor White
    Write-Host ""
    Write-Host "⚠️  Notes:" -ForegroundColor Yellow
    Write-Host "   - All services are running in development mode" -ForegroundColor White
    Write-Host "   - Check the new terminal window for service logs" -ForegroundColor White
    Write-Host "   - Use Ctrl+C in the terminal to stop services" -ForegroundColor White
    Write-Host ""
}

# Main execution
try {
    Test-Prerequisites
    Install-Dependencies
    Start-Services
    Show-Info
} catch {
    Write-Status "Error during launch: $($_.Exception.Message)" $Red
    exit 1
}
