# Development Workflow Guide

## 📋 Overview

This guide outlines the development workflow for the Bilten platform, including setup, development practices, and deployment procedures.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- Docker Desktop
- Git
- PowerShell (Windows) or Bash (Linux/Mac)

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/bilten/bilten-platform.git
   cd bilten-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   # Windows
   .\config\env\setup-env.ps1
   
   # Linux/Mac
   ./config/env/setup-env.sh
   ```

## 🔄 Development Workflow

### Starting the Development Environment

#### Recommended Approach (Workspace-based)
```bash
# Start all services using npm workspace
npm run dev
```

This command starts all services in the correct order:
1. Backend API (Port 3001)
2. Gateway (Port 3003)
3. Frontend (Port 3000)
4. Scanner (Port 3002)

#### Alternative Approach (Individual Services)
```bash
# Start services individually in correct order
npm run dev:backend
npm run dev:gateway
npm run dev:frontend
npm run dev:scanner
```

#### Using Launch Scripts
```bash
# Windows
.\launch-bilten.ps1

# Linux/Mac
./launch-bilten.sh
```

### ⚠️ Important: Service Startup Order

**Correct Order (Prevents Dependency Cycles):**
```
Backend → Gateway → Frontend → Scanner
```

**Why This Order Matters:**
- **Backend**: Provides core API services
- **Gateway**: Routes API requests and depends on Backend
- **Frontend**: Depends on Gateway for API routing
- **Scanner**: Independent service, can start anytime

### Development Commands

#### Core Development
```bash
# Start development environment
npm run dev

# Build all applications
npm run build

# Run tests
npm run test

# Run end-to-end tests
npm run test:e2e
```

#### Individual Service Commands
```bash
# Backend
npm run dev:backend
npm run build:backend
npm run test:backend

# Frontend
npm run dev:frontend
npm run build:frontend
npm run test:frontend

# Gateway
npm run dev:gateway
npm run build:gateway
npm run test:gateway

# Scanner
npm run dev:scanner
npm run build:scanner
npm run test:scanner
```

#### Database Operations
```bash
# Run migrations
npm run db:migrate

# Check migration status
npm run db:status

# Reset database
npm run db:reset
```

#### Monitoring and Health Checks
```bash
# Check service health
npm run health

# Monitor services
npm run monitor

# Check Redis health
npm run redis:health

# Check ClickHouse health
npm run clickhouse:health
```

## 🛠️ Development Practices

### Code Organization

#### Project Structure
```
bilten-platform/
├── apps/                    # Application services
│   ├── bilten-backend/      # Backend API
│   ├── bilten-frontend/     # React frontend
│   ├── bilten-gateway/      # API Gateway
│   └── bilten-scanner/      # QR Scanner app
├── docs/                    # Documentation
├── infrastructure/          # Infrastructure configs
├── tools/                   # Development tools
└── config/                  # Configuration files
```

#### Workspace Management
- Use npm workspaces for dependency management
- Install dependencies at root level: `npm install`
- Use workspace commands for consistent behavior
- Avoid individual `npm install` in app directories

### Dependency Management

#### Preventing Dependency Cycles
1. **Use Workspace Commands**: Always use `npm run dev` from root
2. **Follow Startup Order**: Backend → Gateway → Frontend → Scanner
3. **Avoid Direct Dependencies**: Don't add direct package.json dependencies between apps
4. **Use API Communication**: Services communicate via HTTP APIs, not direct imports

#### Dependency Installation
```bash
# ✅ Correct - Install at workspace level
npm install

# ❌ Avoid - Installing in individual apps
cd apps/bilten-frontend && npm install
```

### Code Quality

#### Pre-commit Checks
```bash
# Run linting
npm run lint

# Run type checking
npm run type-check

# Run tests
npm run test
```

#### Code Style
- Follow the established style guide
- Use TypeScript for type safety
- Write comprehensive tests
- Document API changes

### Testing Strategy

#### Test Types
- **Unit Tests**: Test individual components and functions
- **Integration Tests**: Test service interactions
- **End-to-End Tests**: Test complete user workflows
- **Performance Tests**: Test system performance under load

#### Running Tests
```bash
# Run all tests
npm run test

# Run specific test suites
npm run test:backend
npm run test:frontend
npm run test:gateway

# Run tests in watch mode
npm run test:watch

# Run performance tests
npm run test:performance
```

## 🔧 Development Tools

### IDE Setup

#### Recommended Extensions
- **TypeScript**: For type checking
- **ESLint**: For code linting
- **Prettier**: For code formatting
- **Docker**: For container management
- **GitLens**: For Git integration

#### Configuration Files
- `.vscode/settings.json`: IDE settings
- `.eslintrc.js`: Linting rules
- `.prettierrc`: Formatting rules
- `tsconfig.json`: TypeScript configuration

### Debugging

#### Backend Debugging
```bash
# Start backend in debug mode
cd apps/bilten-backend
npm run dev:debug
```

#### Frontend Debugging
- Use browser developer tools
- Enable React DevTools
- Use Redux DevTools for state management

#### Gateway Debugging
```bash
# Start gateway in debug mode
cd apps/bilten-gateway
npm run dev:debug
```

### Logging

#### Log Levels
- **ERROR**: System errors and failures
- **WARN**: Warning conditions
- **INFO**: General information
- **DEBUG**: Detailed debugging information

#### Viewing Logs
```bash
# View all service logs
npm run logs

# View specific service logs
npm run logs:backend
npm run logs:frontend
npm run logs:gateway

# View Docker logs
docker-compose logs -f
```

## 🚀 Deployment

### Development Deployment
```bash
# Deploy to development environment
npm run deploy

# Deploy to production
npm run deploy:prod
```

### Environment Configuration
- Use environment-specific configuration files
- Never commit sensitive information
- Use `.env` files for local development
- Use environment variables in production

## 🔍 Troubleshooting

### Common Issues

#### Dependency Cycle Issues
- **Problem**: `dependency cycle detected: bilten-frontend -> bilten-gateway -> bilten-frontend`
- **Solution**: Use `npm run dev` from root directory
- **Prevention**: Follow correct startup order

#### Service Startup Failures
- **Problem**: Services fail to start
- **Solution**: Check logs and ensure dependencies are installed
- **Prevention**: Use workspace commands

#### Database Connection Issues
- **Problem**: Cannot connect to database
- **Solution**: Ensure Docker containers are running
- **Prevention**: Use proper startup sequence

### Getting Help

1. **Check Documentation**: Review this guide and other docs
2. **Check Logs**: Look for error messages in service logs
3. **Search Issues**: Check existing GitHub issues
4. **Create Issue**: Report new problems with detailed information

## 📚 Additional Resources

- [API Documentation](./api/README.md)
- [Architecture Guide](./architecture/README.md)
- [Deployment Guide](./deployment/README.md)
- [Troubleshooting Guide](./troubleshooting.md)

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Maintained by**: Development Team
