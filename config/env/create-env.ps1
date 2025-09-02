# Create Frontend .env File
$envContent = @"
# Frontend Environment Variables
REACT_APP_API_BASE_URL=http://localhost:3001/api/v1
REACT_APP_USE_MOCK_API=false
REACT_APP_ENVIRONMENT=development
REACT_APP_VERSION=1.0.0

# Feature Flags
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_NOTIFICATIONS=true
REACT_APP_ENABLE_SOCIAL_LOGIN=true

# External Services
REACT_APP_GOOGLE_ANALYTICS_ID=
REACT_APP_STRIPE_PUBLIC_KEY=
REACT_APP_SENTRY_DSN=

# Development Settings
REACT_APP_DEBUG_MODE=true
REACT_APP_LOG_LEVEL=debug
"@

# Write to bilten-frontend/.env
$envContent | Out-File -FilePath "bilten-frontend\.env" -Encoding UTF8 -Force

Write-Host "✅ Frontend .env file created successfully!" -ForegroundColor Green
Write-Host "📁 Location: bilten-frontend\.env" -ForegroundColor Cyan
Write-Host "🔗 API Base URL: http://localhost:3001/api/v1" -ForegroundColor Yellow
