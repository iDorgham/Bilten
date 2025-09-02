# Bilten - Event Management Platform

A comprehensive, enterprise-grade event management platform built with modern microservices architecture, featuring React frontend, Node.js backend, API Gateway, and robust data infrastructure with PostgreSQL, Redis, and ClickHouse.

## 🏗️ System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        Web[Web App - React]
        Mobile[Mobile Scanner]
        API[External APIs]
    end
    
    subgraph "Gateway Layer"
        Gateway[API Gateway - Express/TypeScript]
        Auth[Authentication Service]
        RateLimit[Rate Limiting]
    end
    
    subgraph "Service Layer"
        Backend[Backend API - Node.js/Express]
        Analytics[Analytics Service]
        Payment[Payment Processing]
        Email[Email Service]
    end
    
    subgraph "Data Layer"
        PostgreSQL[(PostgreSQL - Primary DB)]
        Redis[(Redis - Cache/Sessions)]
        ClickHouse[(ClickHouse - Analytics)]
    end
    
    subgraph "Infrastructure"
        Monitoring[Prometheus/Grafana]
        Logging[ELK Stack]
        Docker[Docker Containers]
    end
    
    Web --> Gateway
    Mobile --> Gateway
    API --> Gateway
    Gateway --> Backend
    Gateway --> Analytics
    Backend --> PostgreSQL
    Backend --> Redis
    Analytics --> ClickHouse
    Backend --> Payment
    Backend --> Email
    Monitoring --> Backend
    Logging --> Backend
```

## 📊 Project Status

### ✅ **Completed Features (Q4 2024)**
- **Backend Infrastructure**: Core API, authentication, database setup
- **Frontend Application**: User authentication, event browsing, basic UI
- **Payment Processing**: Stripe integration, basic payment flows
- **API Gateway**: Service routing, monitoring, rate limiting
- **Analytics Service**: Data collection and basic reporting

### 🔄 **In Progress (Q1 2025)**
- **Payment System**: PayPal integration, refund processing, fraud detection
- **Frontend Enhancement**: Shopping cart, checkout flow, mobile optimization
- **User Experience**: Internationalization, accessibility compliance

### 📋 **Planned Features (Q2-Q3 2025)**
- **Mobile Scanner App**: React Native QR code scanning application
- **Advanced Analytics**: Comprehensive reporting and business intelligence
- **Marketing Tools**: Campaign management and promotional features
- **Platform Admin**: System administration and content moderation

## 🚀 Quick Start

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher
- **PostgreSQL**: v14.0.0 or higher
- **Redis**: v6.0.0 or higher
- **Docker**: v20.10.0 or higher
- **Docker Compose**: v2.0.0 or higher

### Development Setup

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd Bilten
   npm install
   ```

2. **Environment Configuration**
   ```bash
   # Copy environment template
   cp config/env/deploy.env.prod.example .env
   
   # Run automated setup (Windows)
   ./config/env/setup-env.ps1
   
   # Or manual setup (Linux/Mac)
   ./config/env/setup-env.sh
   ```

3. **Database & Infrastructure**
   ```bash
   # Start all infrastructure services
   docker-compose -f infrastructure/docker/docker-compose.yml up -d
   
   # Run database migrations
   npm run db:migrate
   
   # Initialize Redis infrastructure
   npm run redis:init
   ```

4. **Start Development Environment**
   ```bash
   # Quick launch (recommended)
   ./scripts/launch/quick-launch.ps1
   
   # Or manual startup
   npm run dev
   ```

## 🛠️ Technology Stack

### Frontend (`bilten-frontend`) - **Status: 80% Complete**
- **Framework**: React 19.1.1 with React Router DOM 7.8.1 ✅
- **Styling**: Tailwind CSS 3.4.17 with PostCSS ✅
- **State Management**: React Context API + Custom Hooks ✅
- **Charts**: Chart.js 4.4.0 + React Chart.js 2 5.2.0 ✅
- **Internationalization**: i18next 25.3.6 🔄 *In Progress*
- **Payment**: Stripe React Components ✅
- **PDF Generation**: jsPDF 3.0.1 ✅
- **Excel Export**: xlsx 0.18.5 ✅
- **Monitoring**: New Relic 11.10.0 ✅

### Backend (`bilten-backend`) - **Status: 95% Complete**
- **Runtime**: Node.js with Express 4.18.2 ✅
- **Database**: PostgreSQL with pg 8.11.3 ✅
- **Caching**: Redis 4.6.10 ✅
- **Authentication**: JWT with bcryptjs 2.4.3 ✅
- **Validation**: express-validator 7.0.1 ✅
- **Security**: Helmet 7.1.0, CORS, Rate Limiting ✅
- **File Upload**: Multer 1.4.5-lts.1 ✅
- **Email**: Nodemailer 6.9.7 ✅
- **QR Codes**: qrcode 1.5.3 ✅
- **Payments**: Stripe 14.7.0 ✅ *PayPal integration in progress*

### API Gateway (`bilten-gateway`) - **Status: 100% Complete**
- **Runtime**: Node.js with TypeScript 5.2.2 ✅
- **Framework**: Express 4.18.2 ✅
- **Proxy**: http-proxy-middleware 2.0.6 ✅
- **Rate Limiting**: express-rate-limit 7.1.5 ✅
- **WebSockets**: Socket.io 4.7.4 ✅
- **Logging**: Winston 3.11.0 ✅
- **Scheduling**: node-cron 3.0.3 ✅

### Data Infrastructure
- **Primary Database**: PostgreSQL 14+ (ACID compliance)
- **Caching Layer**: Redis 6+ (sessions, caching)
- **Analytics Database**: ClickHouse (OLAP, real-time analytics)
- **Data Pipeline**: Custom ETL with data lineage tracking

### DevOps & Monitoring
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **CI/CD**: GitHub Actions (configurable)
- **Testing**: Jest, Supertest, React Testing Library

## 📁 Project Structure

```
Bilten/
├── 📁 apps/                          # Microservices applications
│   ├── bilten-backend/               # Core API service (Node.js/Express)
│   │   ├── src/                      # Source code
│   │   ├── scripts/                  # Database & infrastructure scripts
│   │   ├── tests/                    # Unit & integration tests
│   │   ├── tools/                    # Backend development tools
│   │   └── package.json              # Dependencies & scripts
│   ├── bilten-frontend/              # React SPA
│   │   ├── src/                      # React components & logic
│   │   ├── public/                   # Static assets
│   │   └── package.json              # Frontend dependencies
│   ├── bilten-gateway/               # API Gateway (TypeScript/Express)
│   │   ├── src/                      # Gateway source code
│   │   ├── dist/                     # Compiled TypeScript
│   │   └── package.json              # Gateway dependencies
│   └── bilten-scanner/               # Mobile scanner app
│       ├── src/                      # Scanner source code
│       └── package.json              # Scanner dependencies
│
├── 📁 infrastructure/                # Infrastructure & deployment
│   ├── database/                     # Database schemas & migrations
│   ├── monitoring/                   # Prometheus, Grafana configs
│   ├── docker/                       # Docker configurations
│   ├── scripts/                      # Infrastructure automation
│   └── temp/                         # Temporary files & logs
│
├── 📁 docs/                          # Comprehensive documentation
│   ├── architecture/                 # System architecture docs
│   ├── api/                          # API documentation
│   ├── deployment/                   # Deployment guides
│   ├── guides/                       # Developer & user guides
│   ├── plans/                        # Project roadmaps & ADRs
│   └── reports/                      # Launch reports & analytics
│
├── 📁 config/                        # Configuration management
│   ├── env/                          # Environment configurations
│   ├── ci-cd/                        # CI/CD pipeline configs
│   ├── development/                  # Development tooling
│   └── root/                         # Root-level configurations
│
├── 📁 tools/                         # Development tools & utilities
│   ├── scripts/                      # Development automation
│   ├── utilities/                    # Utility functions
│   ├── dev-utilities/                # Development and debugging utilities
│   └── mcp-workflows/                # AI-powered workflows
│
├── 📁 scripts/                       # Platform scripts
│   └── launch/                       # Quick launch scripts
│
├── 📄 package.json                   # Root workspace configuration
├── 📄 docker-compose.yml             # Development environment
├── 📄 .env.example                   # Environment template
└── 📄 README.md                      # This file
```

## 🔧 Development Workflow

### Available Scripts

#### Root Level Commands
```bash
# Development
npm run dev                    # Start all services in development mode
npm run dev:backend           # Start backend only
npm run dev:frontend          # Start frontend only
npm run dev:gateway           # Start gateway only

# Building
npm run build                 # Build all applications
npm run build:backend         # Build backend
npm run build:frontend        # Build frontend
npm run build:gateway         # Build gateway

# Testing
npm run test                  # Run all tests
npm run test:backend          # Backend tests only
npm run test:frontend         # Frontend tests only
npm run test:gateway          # Gateway tests only
npm run test:e2e              # End-to-end tests
npm run test:payment          # Payment integration tests
npm run test:performance      # Performance tests

# Database Operations
npm run db:migrate            # Run database migrations
npm run db:status             # Check migration status
npm run redis:health          # Redis health check
npm run clickhouse:health     # ClickHouse health check

# Analytics & Data
npm run analytics:start       # Start analytics ingestion
npm run etl:run               # Run ETL pipeline
npm run lineage:setup         # Setup data lineage tracking

# Deployment
npm run deploy                # Deploy to staging
npm run deploy:prod           # Deploy to production
npm run monitor               # Start monitoring
npm run health                # Health check all services

# Utilities
npm run setup                 # Complete setup (install + migrate + init)
npm run clean                 # Clean all dependencies and containers
npm run logs                  # View all logs
npm run logs:backend          # Backend logs only
```

#### Backend-Specific Commands
```bash
cd apps/bilten-backend

# Database
npm run migrate               # Run migrations
npm run migrate:down          # Rollback migrations
npm run migrate:status        # Migration status
npm run migrate:create        # Create new migration

# Redis Operations
npm run redis:init            # Initialize Redis infrastructure
npm run redis:optimize        # Optimize Redis configuration
npm run redis:monitor         # Redis monitoring dashboard
npm run redis:health          # Health check with detailed output

# ClickHouse Analytics
npm run clickhouse:setup      # Setup ClickHouse analytics
npm run clickhouse:monitor    # ClickHouse monitoring
npm run clickhouse:health     # Health check

# Data Pipeline
npm run analytics:start       # Start analytics ingestion service
npm run analytics:test        # Test analytics pipeline
npm run etl:run               # Run ETL pipeline
npm run etl:dimensions        # Process dimension tables
npm run etl:facts             # Process fact tables
npm run etl:quality           # Data quality checks

# Data Lineage
npm run lineage:setup         # Setup data lineage tracking
npm run lineage:export        # Export lineage data
npm run lineage:analyze       # Analyze data lineage
npm run lineage:metrics       # Lineage metrics

# Data Warehouse
npm run warehouse:setup       # Setup data warehouse
npm run warehouse:full-setup  # Complete warehouse setup
```

### Development Best Practices

#### Code Quality
- **TypeScript**: Used in gateway and critical backend modules
- **ESLint**: Consistent code style across all applications
- **Prettier**: Automatic code formatting
- **Jest**: Comprehensive testing framework
- **Supertest**: API endpoint testing

#### Security
- **Helmet**: Security headers
- **Rate Limiting**: API protection against abuse
- **Input Validation**: express-validator for all inputs
- **XSS Protection**: Built-in XSS filtering
- **CORS**: Configured for production domains
- **JWT**: Secure authentication with refresh tokens

#### Performance
- **Redis Caching**: Session storage and API response caching
- **Database Indexing**: Optimized PostgreSQL queries
- **Connection Pooling**: Efficient database connections
- **Compression**: Gzip compression for all responses
- **CDN Ready**: Static asset optimization

#### Monitoring & Observability
- **Health Checks**: Comprehensive service health monitoring
- **Metrics Collection**: Prometheus metrics for all services
- **Logging**: Structured logging with Winston
- **Error Tracking**: New Relic integration
- **Performance Monitoring**: Real-time performance metrics

## 🚀 Deployment

### Environment Configuration

#### Development
```bash
# Copy environment template
cp config/env/deploy.env.prod.example .env

# Configure variables
DATABASE_URL=postgresql://user:pass@localhost:5432/bilten_dev
REDIS_URL=redis://localhost:6379
CLICKHOUSE_URL=http://localhost:8123
JWT_SECRET=your-dev-secret
STRIPE_SECRET_KEY=sk_test_...
```

#### Production
```bash
# Use production Docker Compose
docker-compose -f infrastructure/docker/docker-compose.prod.yml up -d

# Start monitoring stack
docker-compose -f infrastructure/docker/docker-compose.monitoring.yml up -d

# Run health checks
npm run health
```

### Infrastructure Services

#### Database Setup
```bash
# PostgreSQL
docker-compose up -d postgres
npm run db:migrate

# Redis
docker-compose up -d redis
npm run redis:init

# ClickHouse
docker-compose up -d clickhouse
npm run clickhouse:setup
```

#### Monitoring Stack
```bash
# Start monitoring services
docker-compose -f infrastructure/docker/docker-compose.monitoring.yml up -d

# Access dashboards
# Grafana: http://localhost:3000
# Prometheus: http://localhost:9090
# Kibana: http://localhost:5601
```

## 📊 Monitoring & Analytics

### Real-time Monitoring
- **Prometheus**: Metrics collection and alerting
- **Grafana**: Visualization dashboards
- **AlertManager**: Automated alerting
- **Health Checks**: Service availability monitoring

### Analytics Pipeline
- **ClickHouse**: High-performance analytics database
- **ETL Pipeline**: Automated data transformation
- **Data Lineage**: Track data flow and dependencies
- **Quality Checks**: Automated data validation

### Performance Metrics
- **Response Times**: API endpoint performance
- **Throughput**: Requests per second
- **Error Rates**: Service reliability metrics
- **Resource Usage**: CPU, memory, disk utilization

## 🔍 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check PostgreSQL status
docker-compose ps postgres

# Test connection
npm run db:status

# Reset database
docker-compose down -v
docker-compose up -d postgres
npm run db:migrate
```

#### Redis Issues
```bash
# Check Redis health
npm run redis:health

# Monitor Redis
npm run redis:monitor

# Reset Redis
docker-compose restart redis
npm run redis:init
```

#### Frontend Build Issues
```bash
# Clear cache
rm -rf apps/bilten-frontend/node_modules/.cache

# Reinstall dependencies
cd apps/bilten-frontend
rm -rf node_modules package-lock.json
npm install
```

### Logs & Debugging
```bash
# View all logs
npm run logs

# Service-specific logs
npm run logs:backend
npm run logs:frontend
npm run logs:gateway

# Real-time logs
docker-compose logs -f [service-name]
```

## 🤝 Contributing

### Development Workflow
1. **Fork** the repository
2. **Create** feature branch: `git checkout -b feature/amazing-feature`
3. **Follow** coding standards and run tests
4. **Commit** changes: `git commit -m 'Add amazing feature'`
5. **Push** to branch: `git push origin feature/amazing-feature`
6. **Submit** pull request with detailed description

### Code Standards
- **TypeScript**: Use for new backend modules and gateway
- **Testing**: Minimum 80% code coverage
- **Documentation**: Update docs for new features
- **Security**: Follow OWASP guidelines
- **Performance**: Optimize for production loads

### Review Process
1. **Self-review**: Run all tests and linting
2. **Code review**: Technical review by team members
3. **Integration testing**: Automated CI/CD pipeline
4. **Performance testing**: Load testing for critical changes
5. **Security review**: Security team approval for sensitive changes

## 📚 Documentation

### 📊 **Project Status & Progress**
- **📈 Current Status**: [`docs/project-status.md`](docs/project-status.md) - Comprehensive progress report
- **⚡ Implementation Summary**: [`docs/implementation-summary.md`](docs/implementation-summary.md) - Quick technical overview
- **🧹 Cleanup Summary**: [`docs/cleanup-summary.md`](docs/cleanup-summary.md) - Project organization improvements
- **📋 Documentation Audit**: [`docs/documentation-audit.md`](docs/documentation-audit.md) - Documentation quality review
- **📋 Complete Documentation Index**: [`.kiro/INDEX.md`](.kiro/INDEX.md) - All documentation links

### Architecture Documentation
- **System Overview**: `docs/architecture/system-overview.md`
- **Technology Stack**: `docs/architecture/technology-stack.md`
- **API Design**: `docs/architecture/api-design.md`
- **Database Schema**: `docs/architecture/database-schema.md`

### API Documentation
- **API Overview**: [`docs/api/README.md`](docs/api/README.md) - Complete API documentation guide
- **API Reference**: [`docs/api/reference/README.md`](docs/api/reference/README.md) - Comprehensive endpoint reference
- **Authentication**: [`docs/api/authentication.md`](docs/api/authentication.md) - Authentication methods
- **REST API**: [`docs/api/rest-api.md`](docs/api/rest-api.md) - REST API specifications
- **Events API**: [`docs/api/events.md`](docs/api/events.md) - Event management endpoints
- **Tickets API**: [`docs/api/tickets.md`](docs/api/tickets.md) - Ticketing system endpoints
- **Users API**: [`docs/api/users.md`](docs/api/users.md) - User management endpoints

### Development Guides
- **Getting Started**: `docs/guides/getting-started.md`
- **Style Guide**: `docs/guides/STYLE_GUIDE.md`
- **Testing Guide**: `docs/guides/testing-guide.md`
- **Deployment Guide**: `docs/deployment/`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help
- **Documentation**: Start with `docs/guides/`
- **Issues**: Create GitHub issues for bugs
- **Discussions**: Use GitHub Discussions for questions
- **Security**: Report security issues privately

### Community
- **Contributors**: See [CONTRIBUTORS.md](CONTRIBUTORS.md)
- **Changelog**: See [CHANGELOG.md](CHANGELOG.md)
- **Roadmap**: See `docs/plans/roadmap.md`

---

**Bilten** - Empowering event organizers with enterprise-grade management tools.

*Built with ❤️ by the Bilten Team*
