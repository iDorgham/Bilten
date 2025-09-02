@echo off
echo 🚀 Bilten Project Launch Script
echo =================================

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)
echo ✓ Docker is running

REM Setup environment if not exists
if not exist ".env" (
    echo Setting up environment...
    if exist "config\env\setup-env.ps1" (
        powershell -ExecutionPolicy Bypass -File "config\env\setup-env.ps1"
    )
)

REM Start database services
echo Starting database services...
docker-compose -f infrastructure/docker/docker-compose.yml up -d postgres redis-session redis-cache clickhouse elasticsearch

REM Wait for database
echo Waiting for database to be ready...
timeout /t 10 /nobreak >nul

REM Start applications
echo Starting applications...

REM Backend
if exist "apps\bilten-backend" (
    start "Bilten Backend" cmd /k "cd apps\bilten-backend && npm install && npm run dev"
    echo ✓ Backend starting...
)

REM Frontend
if exist "apps\bilten-frontend" (
    start "Bilten Frontend" cmd /k "cd apps\bilten-frontend && npm install && npm start"
    echo ✓ Frontend starting...
)

REM Gateway
if exist "apps\bilten-gateway" (
    start "Bilten Gateway" cmd /k "cd apps\bilten-gateway && npm install && npm run dev"
    echo ✓ Gateway starting...
)

REM Scanner
if exist "apps\bilten-scanner" (
    start "Bilten Scanner" cmd /k "cd apps\bilten-scanner && npm install && npm run dev"
    echo ✓ Scanner starting...
)

echo.
echo 🎉 Launch completed!
echo.
echo 📱 Applications:
echo    Frontend:     http://localhost:3000
echo    Backend API:  http://localhost:3001
echo    Gateway:      http://localhost:3003
echo    Scanner:      http://localhost:3002
echo.
echo 🗄️  Database Tools:
echo    pgAdmin:      http://localhost:5050
echo    phpMyAdmin:   http://localhost:8080
echo.
echo ⚠️  Note: Applications may take a few minutes to fully start.
pause
