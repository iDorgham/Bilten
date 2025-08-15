# 📦 Installation Guide

This guide will walk you through installing and setting up Bilten on your local development environment.

## 🎯 Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software
- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher (comes with Node.js)
- **PostgreSQL** 15.0 or higher
- **Redis** 7.0 or higher
- **Git** 2.30.0 or higher

### Optional Software
- **Docker** 20.10.0 or higher (for containerized setup)
- **Docker Compose** 2.0.0 or higher
- **VS Code** or your preferred code editor

## 🔧 System Requirements

### Minimum Requirements
- **RAM**: 4GB
- **Storage**: 10GB free space
- **CPU**: 2 cores
- **OS**: Windows 10+, macOS 10.15+, or Ubuntu 20.04+

### Recommended Requirements
- **RAM**: 8GB or more
- **Storage**: 20GB free space
- **CPU**: 4 cores or more
- **OS**: Latest stable version

## 📥 Installation Steps

### Step 1: Clone the Repository

```bash
# Clone the main repository
git clone https://github.com/iDorgham/Bilten.git
cd Bilten

# Verify the clone
ls -la
```

### Step 2: Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd bilten-frontend
npm install
cd ..

# Install scanner app dependencies
cd bilten-scanner
npm install
cd ..
```

### Step 3: Database Setup

#### Option A: Using Docker (Recommended)

```bash
# Start PostgreSQL and Redis with Docker
docker-compose up -d postgres redis

# Verify containers are running
docker-compose ps
```

#### Option B: Manual Installation

**PostgreSQL Setup:**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS (using Homebrew)
brew install postgresql
brew services start postgresql

# Windows
# Download and install from https://www.postgresql.org/download/windows/
```

**Redis Setup:**
```bash
# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis-server

# macOS (using Homebrew)
brew install redis
brew services start redis

# Windows
# Download and install from https://redis.io/download
```

### Step 4: Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Copy frontend environment template
cp bilten-frontend/.env.example bilten-frontend/.env

# Copy scanner app environment template
cp bilten-scanner/.env.example bilten-scanner/.env
```

#### Configure Environment Variables

Edit the `.env` file with your configuration:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bilten_db
DB_USER=bilten_user
DB_PASSWORD=your_secure_password

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# AWS Configuration (for file storage)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=bilten-files

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_test_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Frontend URL
FRONTEND_URL=http://localhost:3000

# API Base URL
API_BASE_URL=http://localhost:3001/v1
```

### Step 5: Database Initialization

```bash
# Create database and run migrations
npm run migrate

# Seed the database with sample data
npm run seed
```

### Step 6: Verify Installation

```bash
# Test the backend API
npm run dev

# In a new terminal, test the frontend
cd bilten-frontend
npm start

# In another terminal, test the scanner app
cd bilten-scanner
npm run dev
```

## 🐳 Docker Installation (Alternative)

If you prefer to use Docker for everything:

```bash
# Clone the repository
git clone https://github.com/iDorgham/Bilten.git
cd Bilten

# Copy environment files
cp .env.example .env
cp bilten-frontend/.env.example bilten-frontend/.env
cp bilten-scanner/.env.example bilten-scanner/.env

# Start all services with Docker
docker-compose up -d

# Run database migrations
docker-compose exec backend npm run migrate

# Seed the database
docker-compose exec backend npm run seed
```

## 🔍 Verification

After installation, verify that everything is working:

### Backend API
```bash
curl http://localhost:3001/health
```
Expected response:
```json
{
  "success": true,
  "message": "Bilten API Server is running",
  "timestamp": "2025-08-15T10:00:00.000Z",
  "environment": "development"
}
```

### Frontend Application
Open your browser and navigate to `http://localhost:3000`

### Scanner App
Open your browser and navigate to `http://localhost:3002`

## 🧪 Testing the Installation

```bash
# Run backend tests
npm test

# Run frontend tests
cd bilten-frontend
npm test

# Run scanner app tests
cd bilten-scanner
npm test
```

## 🚨 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check if Redis is running
sudo systemctl status redis

# Test database connection
psql -h localhost -U bilten_user -d bilten_db
```

#### Port Conflicts
If you get port conflicts, check what's using the ports:
```bash
# Check what's using port 3000
lsof -i :3000

# Check what's using port 3001
lsof -i :3001

# Check what's using port 3002
lsof -i :3002
```

#### Permission Issues
```bash
# Fix npm permissions (Linux/macOS)
sudo chown -R $USER:$GROUP ~/.npm
sudo chown -R $USER:$GROUP ~/.config
```

#### Node.js Version Issues
```bash
# Check Node.js version
node --version

# If you need to update Node.js, use nvm:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

## 📚 Next Steps

After successful installation:

1. **Read the [Quick Start Guide](Quick-Start)** to get familiar with the platform
2. **Explore the [API Documentation](API-Documentation)** to understand the endpoints
3. **Check the [Development Guide](Development-Guide)** for development workflows
4. **Review the [Testing Guide](Testing-Guide)** to run tests

## 🆘 Getting Help

If you encounter issues during installation:

1. Check the [Common Issues](Common-Issues) page
2. Search existing [GitHub Issues](https://github.com/iDorgham/Bilten/issues)
3. Create a new issue with detailed information about your problem
4. Join our [Discussions](https://github.com/iDorgham/Bilten/discussions) for community support

---

**Need help?** Don't hesitate to reach out to our community or create an issue on GitHub!
