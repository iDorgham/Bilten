# Getting Started Guide

## 🚀 Welcome to Bilten

Welcome to the Bilten event management platform! This guide will help you get up and running with the project quickly.

## 📋 Prerequisites

### Required Software
- **Node.js**: Version 18 or higher
- **npm**: Version 8 or higher
- **Git**: Version 2.30 or higher
- **Docker**: Version 20.10 or higher
- **Docker Compose**: Version 2.0 or higher

### Optional Software
- **PostgreSQL**: Version 14 or higher (if not using Docker)
- **Redis**: Version 7 or higher (if not using Docker)
- **VS Code**: Recommended IDE with extensions

### VS Code Extensions
```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "ms-vscode.vscode-json"
  ]
}
```

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/bilten.git
cd bilten
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install app-specific dependencies
cd apps/bilten-backend && npm install
cd ../bilten-frontend && npm install
cd ../bilten-gateway && npm install
cd ../bilten-scanner && npm install
```

### 3. Environment Setup
```bash
# Copy environment files
cp config/env/.env.example .env
cp apps/bilten-backend/.env.example apps/bilten-backend/.env
cp apps/bilten-frontend/.env.example apps/bilten-frontend/.env
```

### 4. Configure Environment Variables
```bash
# .env file
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/bilten
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 🐳 Docker Setup (Recommended)

### 1. Start Services with Docker Compose
```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### 2. Database Setup
```bash
# Run database migrations
docker-compose exec bilten-backend npm run migrate

# Seed database with sample data
docker-compose exec bilten-backend npm run seed
```

### 3. Verify Installation
```bash
# Check backend health
curl http://localhost:3001/health

# Check frontend
open http://localhost:3000

# Check gateway
curl http://localhost:3002/health
```

## 🔧 Manual Setup (Alternative)

### 1. Database Setup
```bash
# Create PostgreSQL database
createdb bilten

# Run migrations
cd apps/bilten-backend
npm run migrate

# Seed database
npm run seed
```

### 2. Redis Setup
```bash
# Start Redis server
redis-server

# Test Redis connection
redis-cli ping
```

### 3. Start Services
```bash
# Terminal 1: Backend
cd apps/bilten-backend
npm run dev

# Terminal 2: Frontend
cd apps/bilten-frontend
npm run dev

# Terminal 3: Gateway
cd apps/bilten-gateway
npm run dev

# Terminal 4: Scanner
cd apps/bilten-scanner
npm run dev
```

## 🧪 Testing

### 1. Run Tests
```bash
# Run all tests
npm test

# Run specific app tests
cd apps/bilten-backend && npm test
cd apps/bilten-frontend && npm test

# Run tests with coverage
npm run test:coverage
```

### 2. E2E Testing
```bash
# Install Playwright
npm install -g playwright

# Install browsers
playwright install

# Run E2E tests
npm run test:e2e
```

## 📚 Development Workflow

### 1. Code Style
```bash
# Format code
npm run format

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

### 2. Git Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/your-feature-name

# Create pull request
# Go to GitHub and create PR
```

### 3. Development Commands
```bash
# Start development servers
npm run dev

# Build for production
npm run build

# Start production servers
npm run start

# Database operations
npm run migrate
npm run seed
npm run db:reset
```

## 🏗️ Project Structure

```
bilten/
├── apps/
│   ├── bilten-backend/     # Node.js API server
│   ├── bilten-frontend/    # React frontend
│   ├── bilten-gateway/     # API gateway
│   └── bilten-scanner/     # Mobile scanner app
├── docs/                   # Documentation
├── infrastructure/         # Infrastructure configs
├── config/                 # Configuration files
└── tools/                  # Development tools
```

### Key Directories
- **`apps/bilten-backend/src/`**: Backend source code
- **`apps/bilten-frontend/src/`**: Frontend source code
- **`docs/`**: Project documentation
- **`infrastructure/`**: Docker and deployment configs

## 🔍 Debugging

### 1. Backend Debugging
```bash
# Start with debugging
cd apps/bilten-backend
npm run dev:debug

# Use VS Code debugger
# Set breakpoints in VS Code
# Press F5 to start debugging
```

### 2. Frontend Debugging
```bash
# Start with debugging
cd apps/bilten-frontend
npm run dev:debug

# Use browser dev tools
# Set breakpoints in browser
# Use React DevTools extension
```

### 3. Database Debugging
```bash
# Connect to database
psql postgresql://user:password@localhost:5432/bilten

# View tables
\dt

# Query data
SELECT * FROM events LIMIT 5;
```

## 📊 Monitoring

### 1. Application Logs
```bash
# View backend logs
docker-compose logs -f bilten-backend

# View frontend logs
docker-compose logs -f bilten-frontend

# View all logs
docker-compose logs -f
```

### 2. Database Monitoring
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U user -d bilten

# Monitor queries
SELECT * FROM pg_stat_activity;
```

### 3. Performance Monitoring
```bash
# Check resource usage
docker stats

# Monitor API performance
curl -w "@curl-format.txt" http://localhost:3001/api/events
```

## 🚀 Deployment

### 1. Build for Production
```bash
# Build all applications
npm run build

# Build specific app
cd apps/bilten-backend && npm run build
```

### 2. Docker Production Build
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Environment Configuration
```bash
# Production environment
cp config/env/.env.prod.example .env.prod

# Update production variables
NODE_ENV=production
DATABASE_URL=postgresql://prod-user:prod-password@prod-db:5432/bilten
REDIS_URL=redis://prod-redis:6379
```

## 📖 Next Steps

### 1. Read Documentation
- [Architecture Overview](../architecture/system-overview.md)
- [API Documentation](../api/rest-api.md)
- [Development Style Guide](STYLE_GUIDE.md)

### 2. Explore the Codebase
- Review the main components
- Understand the data flow
- Check existing tests

### 3. Join the Team
- Set up communication channels
- Review coding standards
- Understand the development process

## 🆘 Getting Help

### Common Issues

#### Port Already in Use
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

#### Database Connection Issues
```bash
# Check database status
docker-compose ps postgres

# Restart database
docker-compose restart postgres
```

#### Docker Issues
```bash
# Clean up Docker
docker system prune -a

# Rebuild containers
docker-compose build --no-cache
```

### Support Channels
- **Documentation**: Check this guide and other docs
- **Issues**: Create GitHub issues for bugs
- **Discussions**: Use GitHub Discussions for questions
- **Team Chat**: Join the team communication channel

## 🎯 Quick Reference

### Essential Commands
```bash
# Development
npm run dev              # Start all services
npm test                 # Run tests
npm run lint             # Check code style
npm run format           # Format code

# Database
npm run migrate          # Run migrations
npm run seed             # Seed database
npm run db:reset         # Reset database

# Docker
docker-compose up -d     # Start services
docker-compose down      # Stop services
docker-compose logs -f   # View logs
```

### Important URLs
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Gateway**: http://localhost:3002
- **Scanner App**: http://localhost:3003
- **Database**: localhost:5432
- **Redis**: localhost:6379

---

**Last Updated**: December 2024  
**Version**: 2.0  
**Maintained by**: Development Team
