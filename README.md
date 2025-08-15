# Bilten Platform

Bilten is a comprehensive event management and ticketing platform that enables organizers to create, manage, and promote events while providing attendees with a seamless ticket purchasing and event discovery experience.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (recommended)

### Current Status
- ✅ **Backend API**: Running on http://localhost:3001
- ✅ **Frontend**: Running on http://localhost:3000
- ✅ **Database**: PostgreSQL container healthy
- ✅ **Cache**: Redis container healthy
- 🔴 **Testing**: Configuration issues (see [Immediate Tasks](Docs/IMMEDIATE_TASKS.md))
- 🔴 **Git**: Repository not initialized

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/bilten/bilten-platform.git
cd bilten-platform
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment setup**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Database setup**
```bash
# Using Docker Compose (recommended)
docker-compose up -d postgres redis

# Or install PostgreSQL and Redis locally
# Then run migrations
npm run db:migrate
npm run db:seed
```

5. **Start development server**
```bash
npm run dev
```

The API will be available at `http://localhost:3001`

### Using Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down
```

## 📁 Project Structure

```
bilten-platform/
├── src/
│   ├── routes/          # API route handlers
│   ├── models/          # Database models
│   ├── middleware/      # Express middleware
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   └── server.js        # Application entry point
├── database/
│   ├── migrations/      # Database migrations
│   └── seeds/           # Database seed files
├── tests/               # Test files
├── docs/                # Documentation
└── .kiro/               # Kiro IDE configuration
```

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data
- `npm run db:rollback` - Rollback last migration

### API Endpoints

#### Health Check
- `GET /health` - API health status

#### Authentication
- `POST /v1/auth/register` - User registration
- `POST /v1/auth/login` - User login
- `POST /v1/auth/logout` - User logout
- `POST /v1/auth/refresh` - Refresh JWT token

#### Users
- `GET /v1/users/profile` - Get user profile
- `PUT /v1/users/profile` - Update user profile
- `GET /v1/users/:id` - Get user by ID

#### Events
- `GET /v1/events` - List events
- `POST /v1/events` - Create event
- `GET /v1/events/:id` - Get event details
- `PUT /v1/events/:id` - Update event
- `DELETE /v1/events/:id` - Delete event

## 🏗️ Architecture

Bilten follows a modular architecture with the following components:

- **API Server** - Express.js REST API
- **Database** - PostgreSQL with Knex.js ORM
- **Cache** - Redis for session and data caching
- **File Storage** - AWS S3 for file uploads
- **Payment Processing** - Stripe integration
- **Email Service** - SMTP with Nodemailer

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📚 Documentation

### Current Documentation
- [Project Progress Report](Docs/PROJECT_PROGRESS_REPORT.md) - Comprehensive project status
- [Immediate Tasks](Docs/IMMEDIATE_TASKS.md) - Critical issues and fixes needed
- [Development Guide](Docs/DEVELOPMENT.md) - Setup and development workflow
- [API Integration](Docs/FRONTEND_INTEGRATION.md) - Frontend-Backend integration
- [Payment System](Docs/PAYMENT_SYSTEM_DOCUMENTATION.md) - Stripe integration
- [Promo Codes](Docs/PROMO_CODE_SYSTEM_DOCUMENTATION.md) - Discount system
- [Analytics & Tracking](Docs/TRACKING_ANALYTICS_DOCUMENTATION.md) - User tracking
- [File Upload](Docs/FILE_UPLOAD_TESTING.md) - S3 integration
- [Search System](Docs/SEARCH_SYSTEM_TESTING.md) - Full-text search
- [Monitoring](Docs/MONITORING_SETUP.md) - System monitoring

### Missing Documentation
- [ ] Deployment Guide
- [ ] Testing Guide  
- [ ] Troubleshooting Guide
- [ ] API Reference (Swagger/OpenAPI)

## 🤝 Contributing

Please read our [Contributing Guide](.kiro/CONTRIBUTING.md) and [Code of Conduct](.kiro/CODE_OF_CONDUCT.md).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.bilten.com](https://docs.bilten.com)
- **Email**: support@bilten.com
- **Issues**: [GitHub Issues](https://github.com/bilten/bilten-platform/issues)

## 🗺️ Roadmap

### Current Phase: Development & Testing
- [ ] Fix testing infrastructure issues
- [ ] Initialize git repository
- [ ] Complete test coverage
- [ ] Prepare for deployment

### Next Phase: Production Ready
- [ ] Set up CI/CD pipeline
- [ ] Configure production environment
- [ ] Security audit
- [ ] Performance optimization

### Future Features
- [ ] Mobile app development
- [ ] Advanced analytics
- [ ] Multi-tenant support
- [ ] API marketplace

See [Project Progress Report](Docs/PROJECT_PROGRESS_REPORT.md) for detailed status and [Immediate Tasks](Docs/IMMEDIATE_TASKS.md) for current priorities.

---

Built with ❤️ by the Bilten Team
