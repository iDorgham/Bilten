# Bilten Project Environment Setup Script
# Updated version with improved configuration and error handling

Write-Host "Setting up Bilten Project Environment Files..." -ForegroundColor Green

# Check if Node.js is available
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Generate secure secrets
Write-Host "Generating secure secrets..." -ForegroundColor Yellow
$jwtSecret = node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
$sessionSecret = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
$bcryptRounds = 12

Write-Host "Generated secure secrets" -ForegroundColor Green

# Check if Docker is running
try {
    $dockerStatus = docker info 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Docker is running" -ForegroundColor Green
    } else {
        Write-Host "Docker might not be running. Please start Docker Desktop." -ForegroundColor Yellow
    }
} catch {
    Write-Host "Docker not available. Some features may not work." -ForegroundColor Yellow
}

# Main .env content with updated configuration
$mainEnvContent = @"
# Bilten Project Environment Configuration
# Generated on: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

# Database Configuration (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bilten_dev
DB_USER=bilten_user
DB_PASSWORD=bilten_password

# Database Connection String
DATABASE_URL=postgresql://bilten_user:bilten_password@localhost:5432/bilten_dev

# Application Configuration
NODE_ENV=development
PORT=3001
API_BASE_URL=http://localhost:3001/v1
APP_NAME=Bilten
APP_VERSION=1.0.0

# JWT Configuration
JWT_SECRET=$jwtSecret
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
JWT_ISSUER=bilten-app
JWT_AUDIENCE=bilten-users

# Email Configuration (for notifications and verification)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@bilten.com
EMAIL_FROM_NAME=Bilten Team
EMAIL_VERIFICATION_ENABLED=true

# File Upload Configuration
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp,application/pdf
UPLOAD_PROVIDER=local
ENABLE_IMAGE_RESIZE=true
IMAGE_MAX_WIDTH=1920
IMAGE_MAX_HEIGHT=1080

# AWS S3 Configuration (for production file storage)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=bilten-uploads
AWS_S3_ENDPOINT=https://s3.amazonaws.com
AWS_CLOUDFRONT_DISTRIBUTION_ID=your-cloudfront-distribution-id

# Redis Configuration (for caching and sessions)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TTL=3600
REDIS_ENABLED=true

# Payment Configuration (Stripe)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_CURRENCY=usd
STRIPE_ENABLED=true

# Google Analytics
GA_MEASUREMENT_ID=G-XXXXXXXXXX
GA_ENABLED=true

# New Relic Monitoring
NEW_RELIC_LICENSE_KEY=your-new-relic-license-key
NEW_RELIC_APPLICATION_ID=your-new-relic-app-id
NEW_RELIC_ENABLED=false

# Security Configuration
BCRYPT_ROUNDS=$bcryptRounds
CORS_ORIGIN=http://localhost:3000
SESSION_SECRET=$sessionSecret
SESSION_COOKIE_SECURE=false
SESSION_COOKIE_HTTPONLY=true
SESSION_COOKIE_MAX_AGE=86400000
HELMET_ENABLED=true
RATE_LIMITING_ENABLED=true

# Logging Configuration
LOG_LEVEL=debug
LOG_FILE=logs/app.log
LOG_MAX_SIZE=10m
LOG_MAX_FILES=5
LOG_COLORIZE=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=false
RATE_LIMIT_SKIP_FAILED_REQUESTS=false

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_NOTIFICATIONS=true
ENABLE_PAYMENTS=true
ENABLE_FILE_UPLOAD=true
ENABLE_USER_REGISTRATION=true
ENABLE_EMAIL_VERIFICATION=true
ENABLE_PASSWORD_RESET=true
ENABLE_SOCIAL_LOGIN=false
ENABLE_TWO_FACTOR_AUTH=false

# Development Configuration
DEBUG=true
ENABLE_SWAGGER=true
ENABLE_CORS=true
ENABLE_LOGGING=true
ENABLE_ERROR_REPORTING=false
ENABLE_PERFORMANCE_MONITORING=false

# Cache Configuration
CACHE_TTL=3600
CACHE_CHECK_PERIOD=600
CACHE_MAX_KEYS=1000

# Queue Configuration (for background jobs)
QUEUE_ENABLED=false
QUEUE_REDIS_URL=redis://localhost:6379
QUEUE_MAX_CONCURRENT_JOBS=5

# Notification Configuration
PUSH_NOTIFICATIONS_ENABLED=false
SMS_ENABLED=false
EMAIL_NOTIFICATIONS_ENABLED=true

# API Configuration
API_VERSION=v1
API_PREFIX=/api
API_TIMEOUT=30000
API_RETRY_ATTEMPTS=3

# Database Pool Configuration
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_POOL_ACQUIRE=30000
DB_POOL_IDLE=10000

# Timezone Configuration
TIMEZONE=UTC
DATE_FORMAT=YYYY-MM-DD
TIME_FORMAT=HH:mm:ss
DATETIME_FORMAT=YYYY-MM-DD HH:mm:ss
"@

# Frontend .env content with updated configuration
$frontendEnvContent = @"
# Bilten Frontend Environment Configuration
# Generated on: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

# API Configuration
REACT_APP_API_BASE_URL=http://localhost:3001/v1
REACT_APP_API_TIMEOUT=30000
REACT_APP_API_VERSION=v1

# Payment Configuration
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_51R0ijeRoDcHlFS1D77oMNlDYd31WKJWGXYcHrKn6tyrhGils5JcH86i4rPCLrxRqu2ZWgxYHvODMuX7RE0i27tUk006RyIdbDN
REACT_APP_STRIPE_CURRENCY=usd
REACT_APP_PAYMENTS_ENABLED=true

# Analytics Configuration
REACT_APP_GA_MEASUREMENT_ID=G-XXXXXXXXXX
REACT_APP_GA_ENABLED=true
REACT_APP_ANALYTICS_ENABLED=true

# Monitoring Configuration
REACT_APP_NEW_RELIC_LICENSE_KEY=your-new-relic-license-key
REACT_APP_NEW_RELIC_APPLICATION_ID=your-new-relic-app-id
REACT_APP_MONITORING_ENABLED=false

# Application Configuration
REACT_APP_VERSION=1.0.0
REACT_APP_NAME=Bilten
REACT_APP_DESCRIPTION=Event Management Platform
REACT_APP_USE_MOCK_API=false
REACT_APP_DEBUG_MODE=true

# Feature Flags
REACT_APP_ENABLE_REGISTRATION=true
REACT_APP_ENABLE_SOCIAL_LOGIN=false
REACT_APP_ENABLE_NOTIFICATIONS=true
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_PAYMENTS=true

# UI Configuration
REACT_APP_THEME=light
REACT_APP_LANGUAGE=en
REACT_APP_TIMEZONE=UTC
REACT_APP_DATE_FORMAT=YYYY-MM-DD
REACT_APP_TIME_FORMAT=HH:mm:ss

# File Upload Configuration
REACT_APP_MAX_FILE_SIZE=10485760
REACT_APP_ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp
REACT_APP_UPLOAD_ENABLED=true

# Security Configuration
REACT_APP_ENABLE_HTTPS=false
REACT_APP_ENABLE_CSRF_PROTECTION=true
REACT_APP_SESSION_TIMEOUT=3600000

# Development Configuration
REACT_APP_ENABLE_HOT_RELOAD=true
REACT_APP_ENABLE_SOURCE_MAPS=true
REACT_APP_ENABLE_ERROR_BOUNDARIES=true
"@

# Scanner .env content with updated configuration
$scannerEnvContent = @"
# Bilten Scanner Environment Configuration
# Generated on: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

# API Configuration
SCANNER_API_BASE_URL=http://localhost:3001/v1
SCANNER_API_TIMEOUT=30000
SCANNER_API_VERSION=v1

# Scanner Configuration
SCANNER_INTERVAL=30000
SCANNER_ENABLED=true
SCANNER_MAX_CONCURRENT_SCANS=5
SCANNER_RETRY_ATTEMPTS=3
SCANNER_RETRY_DELAY=5000

# Database Configuration
SCANNER_DB_HOST=localhost
SCANNER_DB_PORT=5432
SCANNER_DB_NAME=bilten_dev
SCANNER_DB_USER=bilten_user
SCANNER_DB_PASSWORD=bilten_password

# Logging Configuration
SCANNER_LOG_LEVEL=info
SCANNER_LOG_FILE=logs/scanner.log
SCANNER_LOG_MAX_SIZE=10m
SCANNER_LOG_MAX_FILES=5

# Performance Configuration
SCANNER_MEMORY_LIMIT=512MB
SCANNER_CPU_LIMIT=50
SCANNER_TIMEOUT=60000

# Feature Flags
SCANNER_ENABLE_NOTIFICATIONS=true
SCANNER_ENABLE_REPORTING=true
SCANNER_ENABLE_ALERTS=false
"@

# Create directories if they don't exist
$directories = @("logs", "uploads", "temp")
foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "Created directory: $dir" -ForegroundColor Green
    }
}

# Write content to files with error handling
try {
    $mainEnvContent | Out-File -FilePath ".env" -Encoding UTF8 -Force
    $frontendEnvContent | Out-File -FilePath "bilten-frontend\.env" -Encoding UTF8 -Force
    $scannerEnvContent | Out-File -FilePath "bilten-scanner\.env" -Encoding UTF8 -Force
    
    Write-Host "Created .env files with secure configuration" -ForegroundColor Green
} catch {
    Write-Host "Error creating .env files: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test database connection if Docker is available
if ($dockerStatus) {
    Write-Host "Testing database connection..." -ForegroundColor Yellow
    try {
        $dbTest = docker exec bilten-postgres psql -U bilten_user -d bilten_dev -c "SELECT 1 as test;" 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Database connection successful" -ForegroundColor Green
        } else {
            Write-Host "Database connection failed. Make sure PostgreSQL is running." -ForegroundColor Yellow
        }
    } catch {
        Write-Host "Could not test database connection" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Files created:" -ForegroundColor Yellow
Write-Host "   - .env (root directory)" -ForegroundColor White
Write-Host "   - bilten-frontend\.env" -ForegroundColor White
Write-Host "   - bilten-scanner\.env" -ForegroundColor White
Write-Host "   - logs/ (directory)" -ForegroundColor White
Write-Host "   - uploads/ (directory)" -ForegroundColor White
Write-Host "   - temp/ (directory)" -ForegroundColor White

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "   1. Review and customize the configuration" -ForegroundColor White
Write-Host "   2. Update email, AWS, and payment settings as needed" -ForegroundColor White
Write-Host "   3. Start PostgreSQL: docker-compose up -d postgres" -ForegroundColor White
Write-Host "   4. Test database connection: docker exec bilten-postgres psql -U bilten_user -d bilten_dev -c 'SELECT 1;'" -ForegroundColor White
Write-Host "   5. Start your application: npm start" -ForegroundColor White
Write-Host "   6. Access pgAdmin: http://localhost:5050" -ForegroundColor White

Write-Host ""
Write-Host "Security Information:" -ForegroundColor Red
Write-Host "   - JWT Secret: $($jwtSecret.Substring(0, 16))..." -ForegroundColor White
Write-Host "   - Session Secret: $($sessionSecret.Substring(0, 16))..." -ForegroundColor White
Write-Host "   - These files contain sensitive information and are gitignored" -ForegroundColor White
Write-Host "   - Never commit them to version control!" -ForegroundColor White

Write-Host ""
Write-Host "Documentation:" -ForegroundColor Cyan
Write-Host "   - ENV_CONFIGURATION.md - Complete setup guide" -ForegroundColor White
Write-Host "   - POSTGRESQL_SETUP.md - Database configuration guide" -ForegroundColor White

Write-Host ""
Write-Host "Environment setup completed successfully!" -ForegroundColor Green
