# Quick Launch Script for Bilten
# Simplified version for immediate use

Write-Host "Quick Launch - Bilten Environment" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "Docker is running" -ForegroundColor Green
} catch {
    Write-Host "Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Setup environment if not exists
if (!(Test-Path ".env")) {
    Write-Host "Setting up environment..." -ForegroundColor Yellow
    if (Test-Path "config/env/setup-env.ps1") {
        & "config/env/setup-env.ps1"
    }
}

# Start database services
Write-Host "Starting database services..." -ForegroundColor Yellow
docker-compose -f infrastructure/docker/docker-compose.yml up -d postgres redis-session redis-cache clickhouse elasticsearch

# Wait for database
Write-Host "Waiting for database to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Start applications in background
Write-Host "Starting applications..." -ForegroundColor Yellow

# Backend
if (Test-Path "apps/bilten-backend") {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'apps/bilten-backend'; npm install; npm run dev" -WindowStyle Normal
    Write-Host "Backend starting..." -ForegroundColor Green
}

# Frontend
if (Test-Path "apps/bilten-frontend") {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'apps/bilten-frontend'; npm install; npm start" -WindowStyle Normal
    Write-Host "Frontend starting..." -ForegroundColor Green
}

# Gateway
if (Test-Path "apps/bilten-gateway") {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'apps/bilten-gateway'; npm install; npm run dev" -WindowStyle Normal
    Write-Host "Gateway starting..." -ForegroundColor Green
}

# Scanner
if (Test-Path "apps/bilten-scanner") {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'apps/bilten-scanner'; npm install; npm run dev" -WindowStyle Normal
    Write-Host "Scanner starting..." -ForegroundColor Green
}

Write-Host ""
Write-Host "Quick launch completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Applications:" -ForegroundColor Cyan
Write-Host "   Frontend:     http://localhost:3000" -ForegroundColor White
Write-Host "   Backend API:  http://localhost:3001" -ForegroundColor White
Write-Host "   Gateway:      http://localhost:3003" -ForegroundColor White
Write-Host "   Scanner:      http://localhost:3002" -ForegroundColor White
Write-Host ""
Write-Host "Database Tools:" -ForegroundColor Cyan
Write-Host "   pgAdmin:      http://localhost:5050" -ForegroundColor White
Write-Host "   phpMyAdmin:   http://localhost:8080" -ForegroundColor White
Write-Host ""
Write-Host "Note: Applications may take a few minutes to fully start." -ForegroundColor Yellow
