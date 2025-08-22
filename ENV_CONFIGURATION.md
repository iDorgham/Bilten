# Environment Configuration Guide for Bilten Project

## 📝 How to Create Your .env File

Since .env files are gitignored for security, you need to create them manually. Follow these steps:

### 1. Create Main .env File

Create a file named `.env` in the root directory with the following content:

```env
# Bilten Project Environment Configuration
# Database Configuration
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

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Email Configuration (for notifications and verification)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@bilten.com

# File Upload Configuration
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp

# AWS S3 Configuration (for production file storage)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=bilten-uploads

# Redis Configuration (for caching and sessions)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Payment Configuration (Stripe)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Google Analytics
GA_MEASUREMENT_ID=G-XXXXXXXXXX

# New Relic Monitoring
NEW_RELIC_LICENSE_KEY=your-new-relic-license-key
NEW_RELIC_APPLICATION_ID=your-new-relic-app-id

# Security Configuration
BCRYPT_ROUNDS=12
CORS_ORIGIN=http://localhost:3000
SESSION_SECRET=your-session-secret-key

# Logging Configuration
LOG_LEVEL=debug
LOG_FILE=logs/app.log

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_NOTIFICATIONS=true
ENABLE_PAYMENTS=true
ENABLE_FILE_UPLOAD=true

# Development Configuration
DEBUG=true
ENABLE_SWAGGER=true
ENABLE_CORS=true
```

### 2. Create Frontend .env File

Create a file named `.env` in the `bilten-frontend` directory:

```env
# Bilten Frontend Environment Configuration
REACT_APP_API_BASE_URL=http://localhost:3001/v1
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
REACT_APP_GA_MEASUREMENT_ID=G-XXXXXXXXXX
REACT_APP_NEW_RELIC_LICENSE_KEY=your-new-relic-license-key
REACT_APP_NEW_RELIC_APPLICATION_ID=your-new-relic-app-id
REACT_APP_VERSION=1.0.0
REACT_APP_USE_MOCK_API=false
```

### 3. Create Scanner .env File

Create a file named `.env` in the `bilten-scanner` directory:

```env
# Bilten Scanner Environment Configuration
SCANNER_API_BASE_URL=http://localhost:3001/v1
SCANNER_INTERVAL=30000
SCANNER_ENABLED=true
```

## 🚀 Quick Setup Commands

### Using PowerShell (Windows):
```powershell
# Create main .env file
New-Item -Path ".env" -ItemType File
# Then copy and paste the content above

# Create frontend .env file
New-Item -Path "bilten-frontend\.env" -ItemType File
# Then copy and paste the frontend content above

# Create scanner .env file
New-Item -Path "bilten-scanner\.env" -ItemType File
# Then copy and paste the scanner content above
```

### Using Command Line:
```bash
# Create main .env file
touch .env
# Then edit with your preferred editor

# Create frontend .env file
touch bilten-frontend/.env
# Then edit with your preferred editor

# Create scanner .env file
touch bilten-scanner/.env
# Then edit with your preferred editor
```

## 🔧 Required Configuration

### Essential Variables (Must Configure):

1. **Database Configuration** ✅ (Already set for PostgreSQL)
   - `DB_HOST=localhost`
   - `DB_PORT=5432`
   - `DB_NAME=bilten_dev`
   - `DB_USER=bilten_user`
   - `DB_PASSWORD=bilten_password`

2. **JWT Secret** (Generate a secure key)
   ```bash
   # Generate a secure JWT secret
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

3. **Session Secret** (Generate a secure key)
   ```bash
   # Generate a secure session secret
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

### Optional Variables (Configure as needed):

1. **Email Configuration** - For user verification and notifications
2. **AWS S3 Configuration** - For file uploads in production
3. **Stripe Configuration** - For payment processing
4. **Google Analytics** - For tracking
5. **New Relic** - For monitoring

## 🔒 Security Best Practices

### 1. Never Commit .env Files
- .env files are already in .gitignore
- Never share .env files in version control
- Use .env.example for templates

### 2. Use Strong Secrets
```bash
# Generate strong secrets
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Environment-Specific Files
- `.env.development` - Development environment
- `.env.test` - Testing environment
- `.env.production` - Production environment

## 🧪 Testing Your Configuration

### 1. Test Database Connection
```bash
# Test PostgreSQL connection
docker exec bilten-postgres psql -U bilten_user -d bilten_dev -c "SELECT 1;"
```

### 2. Test Environment Variables
```bash
# Test if environment variables are loaded
node -e "console.log('DB_HOST:', process.env.DB_HOST)"
node -e "console.log('NODE_ENV:', process.env.NODE_ENV)"
```

### 3. Test Application Startup
```bash
# Start the application and check for errors
npm start
```

## 🔄 Environment Management

### Development Environment
```env
NODE_ENV=development
DEBUG=true
LOG_LEVEL=debug
```

### Production Environment
```env
NODE_ENV=production
DEBUG=false
LOG_LEVEL=info
```

### Testing Environment
```env
NODE_ENV=test
DEBUG=false
LOG_LEVEL=error
```

## 📋 Configuration Checklist

- [ ] Create `.env` file in root directory
- [ ] Create `.env` file in `bilten-frontend` directory
- [ ] Create `.env` file in `bilten-scanner` directory
- [ ] Configure database connection variables
- [ ] Generate and set JWT_SECRET
- [ ] Generate and set SESSION_SECRET
- [ ] Configure API_BASE_URL
- [ ] Test database connection
- [ ] Test application startup
- [ ] Verify environment variables are loaded

## 🆘 Troubleshooting

### Common Issues:

1. **Environment variables not loading**
   - Ensure .env file is in the correct directory
   - Check file permissions
   - Verify variable names match code expectations

2. **Database connection errors**
   - Verify PostgreSQL is running: `docker-compose ps`
   - Check connection details in .env file
   - Test connection manually

3. **Frontend API errors**
   - Verify REACT_APP_API_BASE_URL is correct
   - Check if backend is running
   - Ensure CORS is configured properly

### Debug Commands:
```bash
# Check if .env file exists
ls -la .env

# Check environment variables
node -e "console.log(process.env)"

# Test database connection
docker exec bilten-postgres pg_isready -U bilten_user
```

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section
2. Verify all required variables are set
3. Test each component individually
4. Check application logs for specific errors

## 🐧 Windows WSL2 Tips

### Use Docker Desktop integration (recommended)
- Enable Docker Desktop → Settings → Resources → WSL Integration for your Ubuntu distro
- Run `docker compose` from Ubuntu; the engine runs via Docker Desktop

### Performance recommendations
- Prefer the Linux filesystem (e.g., `~/work/Bilten`) for repos with heavy file I/O
- Accessing files under `/mnt/c` or `/mnt/d` is convenient but slower for large bind mounts
- Example:
  ```bash
  mkdir -p ~/work && cp -r /mnt/d/Work/AI/Projects/Bilten ~/work/Bilten
  cd ~/work/Bilten
  docker compose up -d
  ```

### Common WSL fixes
- Restart integration: Quit Docker Desktop → `wsl --shutdown` (PowerShell) → start Docker Desktop
- Ensure Ubuntu is WSL2: `wsl -l -v` and `wsl --set-version Ubuntu 2`
