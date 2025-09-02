# EventChain Development Environment Setup

## Overview
This guide provides step-by-step instructions for setting up a complete EventChain development environment on your local machine.

## Prerequisites

### System Requirements
- **Operating System**: Windows 10/11, macOS 10.15+, or Ubuntu 18.04+
- **RAM**: Minimum 8GB, Recommended 16GB
- **Storage**: 50GB free space
- **Network**: Stable internet connection for package downloads

### Required Software
- **Node.js**: Version 18.x or higher
- **Docker**: Latest stable version
- **Docker Compose**: Version 2.0+
- **Git**: Latest version
- **PostgreSQL**: Version 14+ (or use Docker)
- **Redis**: Version 6+ (or use Docker)

## Installation Steps

### 1. Install Node.js and npm
```bash
# Using Node Version Manager (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Verify installation
node --version
npm --version
```

### 2. Install Docker
#### Windows
1. Download Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop)
2. Run the installer and follow setup instructions
3. Enable WSL 2 integration if prompted

#### macOS
```bash
# Using Homebrew
brew install --cask docker

# Or download from docker.com
```

#### Linux (Ubuntu)
```bash
# Update package index
sudo apt-get update

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 3. Clone the Repository
```bash
git clone https://github.com/eventchain/eventchain-platform.git
cd eventchain-platform
```

### 4. Environment Configuration

#### Create Environment Files
```bash
# Copy environment templates
cp .env.example .env.development
cp .env.example .env.test

# Edit development environment
nano .env.development
```

#### Development Environment Variables
```bash
# .env.development
NODE_ENV=development
PORT=3001

# Database Configuration
DATABASE_URL=postgresql://eventchain:password@localhost:5432/eventchain_dev
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-for-development
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_SECRET=your-refresh-token-secret

# Payment Configuration (Stripe Test)
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email Configuration (Development)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
FROM_EMAIL=noreply@eventchain.local

# File Storage (Local Development)
STORAGE_TYPE=local
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# Blockchain Configuration (Testnet)
BLOCKCHAIN_NETWORK=sepolia
INFURA_PROJECT_ID=your-infura-project-id
PRIVATE_KEY=your-test-private-key

# External APIs
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
SENDGRID_API_KEY=your-sendgrid-api-key

# Logging
LOG_LEVEL=debug
LOG_FILE=./logs/app.log

# Security
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### 5. Database Setup

#### Using Docker (Recommended)
```bash
# Start PostgreSQL and Redis containers
docker-compose up -d postgres redis

# Wait for containers to be ready
docker-compose logs -f postgres
```

#### Manual Installation
```bash
# PostgreSQL (Ubuntu)
sudo apt-get install postgresql postgresql-contrib
sudo -u postgres createuser --interactive eventchain
sudo -u postgres createdb eventchain_dev

# Redis (Ubuntu)
sudo apt-get install redis-server
sudo systemctl start redis-server
```

### 6. Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install mobile app dependencies (if developing mobile)
cd mobile
npm install
cd ..
```

### 7. Database Migration and Seeding
```bash
# Run database migrations
npm run migrate

# Seed development data
npm run seed:dev

# Verify database setup
npm run db:status
```

### 8. Build and Start Services

#### Development Mode
```bash
# Start all services in development mode
npm run dev

# Or start services individually
npm run dev:backend    # Backend API server
npm run dev:frontend   # Frontend development server
npm run dev:worker     # Background job worker
```

#### Using Docker Compose
```bash
# Start all services with Docker
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Development Tools Setup

### 1. Code Editor Configuration

#### VS Code Extensions
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-json",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "ms-vscode-remote.remote-containers",
    "ms-vscode.vscode-docker"
  ]
}
```

#### VS Code Settings
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.next": true
  }
}
```

### 2. Git Hooks Setup
```bash
# Install husky for git hooks
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm run test:unit"

# Add commit message hook
npx husky add .husky/commit-msg "npx commitlint --edit $1"
```

### 3. Testing Setup
```bash
# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e

# Run tests with coverage
npm run test:coverage
```

## Service Configuration

### 1. Email Service (Development)
```bash
# Install and start MailHog for email testing
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog

# Access web interface at http://localhost:8025
```

### 2. File Storage (Development)
```bash
# Create upload directories
mkdir -p uploads/events
mkdir -p uploads/users
mkdir -p uploads/temp

# Set permissions
chmod 755 uploads
```

### 3. Background Jobs
```bash
# Start Redis for job queue
docker-compose up -d redis

# Start job worker
npm run worker:dev
```

## Verification Steps

### 1. Health Check
```bash
# Check API health
curl http://localhost:3001/health

# Expected response:
# {
#   "status": "ok",
#   "timestamp": "2024-01-15T10:00:00Z",
#   "services": {
#     "database": "connected",
#     "redis": "connected",
#     "storage": "available"
#   }
# }
```

### 2. Database Connection
```bash
# Test database connection
npm run db:test

# Run a simple query
psql -h localhost -U eventchain -d eventchain_dev -c "SELECT version();"
```

### 3. Frontend Access
- Open browser to `http://localhost:3000`
- Verify homepage loads correctly
- Check browser console for errors

### 4. API Testing
```bash
# Test authentication endpoint
curl -X POST http://localhost:3001/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@eventchain.com","password":"admin123"}'

# Test events endpoint
curl http://localhost:3001/v1/events \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Common Issues and Solutions

### Port Conflicts
```bash
# Check what's using port 3001
lsof -i :3001

# Kill process if needed
kill -9 PID
```

### Database Connection Issues
```bash
# Reset database
npm run db:reset

# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Docker Issues
```bash
# Clean up Docker
docker system prune -a

# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Node.js Version Issues
```bash
# Switch Node.js version
nvm use 18

# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Development Workflow

### 1. Daily Startup
```bash
# Start development environment
npm run dev:start

# This script runs:
# - docker-compose up -d postgres redis
# - npm run migrate
# - npm run dev
```

### 2. Code Changes
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and test
npm run test
npm run lint

# Commit changes
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/new-feature
```

### 3. Daily Shutdown
```bash
# Stop development services
npm run dev:stop

# This script runs:
# - docker-compose down
# - Clean up temporary files
```

## IDE Integration

### WebStorm Configuration
1. Open project in WebStorm
2. Configure Node.js interpreter: Settings → Languages & Frameworks → Node.js
3. Enable ESLint: Settings → Languages & Frameworks → JavaScript → Code Quality Tools → ESLint
4. Configure Prettier: Settings → Languages & Frameworks → JavaScript → Prettier

### Debugging Setup
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/server.js",
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "restart": true,
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev:debug"]
    }
  ]
}
```

## Performance Optimization

### Development Build Optimization
```bash
# Enable development optimizations
export NODE_ENV=development
export WEBPACK_ANALYZE=true

# Build with analysis
npm run build:analyze
```

### Database Performance
```sql
-- Add development indexes
CREATE INDEX CONCURRENTLY idx_events_start_date ON events(start_date);
CREATE INDEX CONCURRENTLY idx_tickets_event_id ON tickets(event_id);
```

## Security Considerations

### Development Security
- Use different secrets for development
- Never commit real API keys
- Use HTTPS in development when testing payments
- Regularly update dependencies

### Environment Isolation
```bash
# Use separate databases
createdb eventchain_dev
createdb eventchain_test
createdb eventchain_staging
```

## Next Steps
After completing the environment setup:
1. Review the [Coding Standards](.kiro/CODING_STANDARDS.md)
2. Read the [API Documentation](.kiro/api-docs/)
3. Check the [Project Structure Overview](.kiro/PROJECT_STRUCTURE_OVERVIEW.md)
4. Start with a simple feature implementation
5. Run the test suite to ensure everything works

For additional help, consult the [Integration Guide](.kiro/INTEGRATION_GUIDE.md) or reach out to the development team.