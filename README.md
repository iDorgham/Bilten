# 🎫 Bilten - Event Management & Ticketing Platform

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.1.1-blue.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://docker.com/)

A comprehensive event management and ticketing platform that enables organizers to create, manage, and promote events while providing attendees with a seamless ticket purchasing and event discovery experience.

## ✨ Features

### 🎪 Event Management
- **Event Creation & Management** - Create, edit, and manage events with rich details
- **Ticket Types & Pricing** - Flexible ticket categories with dynamic pricing
- **Event Calendar** - Interactive calendar view for event discovery
- **Event Search & Filtering** - Advanced search with location, date, and category filters
- **QR Code Generation** - Unique QR codes for each ticket

### 💳 Payment & Checkout
- **Stripe Integration** - Secure payment processing
- **Promo Codes** - Discount system with analytics
- **Order Management** - Complete order tracking and history
- **Secure Checkout** - PCI-compliant payment flow

### 👥 User Management
- **Authentication System** - JWT-based auth with refresh tokens
- **User Profiles** - Comprehensive user profiles and preferences
- **Role-based Access** - Admin, organizer, and attendee roles
- **Email Verification** - Secure account verification

### 📱 Mobile Experience
- **QR Scanner App** - PWA for ticket validation at events
- **Responsive Design** - Mobile-first approach
- **Offline Support** - PWA capabilities for scanner app

### 📊 Analytics & Insights
- **Real-time Analytics** - Live event performance metrics
- **User Tracking** - Comprehensive user behavior analytics
- **Sales Reports** - Detailed financial reporting
- **Export Capabilities** - Data export in multiple formats

### 🌐 Internationalization
- **Multi-language Support** - English, Arabic, German, Spanish, French, Italian
- **RTL Support** - Right-to-left language support
- **Localized Content** - Region-specific content and pricing

### 🔧 Technical Features
- **Full-text Search** - PostgreSQL FTS for fast event discovery
- **Image Optimization** - Automatic image processing and optimization
- **File Upload** - AWS S3 integration for media storage
- **Webhook System** - Real-time notifications and integrations
- **Monitoring** - Comprehensive system monitoring and logging

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Scanner App   │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (PWA)         │
│   Port: 3000    │    │   Port: 3001    │    │   Port: 3002    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │     Redis       │    │   AWS S3        │
│   Database      │    │     Cache       │    │   Storage       │
│   Port: 5432    │    │   Port: 6379    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **PostgreSQL** 15+
- **Redis** 7+
- **Docker & Docker Compose** (recommended)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-username/bilten-platform.git
cd bilten-platform
```

2. **Install dependencies**
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd bilten-frontend && npm install && cd ..

# Install scanner app dependencies
cd bilten-scanner && npm install && cd ..
```

3. **Environment setup**
```bash
# Copy environment files
cp .env.example .env
cp bilten-frontend/.env.example bilten-frontend/.env
cp bilten-scanner/.env.example bilten-scanner/.env

# Edit environment variables
nano .env
```

4. **Database setup**
```bash
# Using Docker Compose (recommended)
docker-compose up -d postgres redis

# Run migrations and seed data
npm run migrate
npm run seed
```

5. **Start development servers**
```bash
# Start backend API
npm run dev

# In another terminal, start frontend
cd bilten-frontend && npm start

# In another terminal, start scanner app
cd bilten-scanner && npm run dev
```

### Using Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📁 Project Structure

```
bilten-platform/
├── src/                    # Backend API source
│   ├── routes/            # API route handlers
│   ├── controllers/       # Request controllers
│   ├── middleware/        # Express middleware
│   ├── services/          # Business logic
│   ├── utils/             # Utility functions
│   └── server.js          # Application entry point
├── bilten-frontend/       # React frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API services
│   │   └── utils/         # Frontend utilities
│   └── public/            # Static assets
├── bilten-scanner/        # QR Scanner PWA
│   ├── src/
│   │   ├── qr-scanner.js  # QR scanning logic
│   │   └── ticket-validator.js
│   └── index.html         # PWA entry point
├── database/
│   ├── migrations/        # Database migrations
│   └── seeds/             # Database seed files
├── tests/                 # Test files
├── Docs/                  # Documentation
└── uploads/               # File uploads
```

## 🛠️ Development

### Available Scripts

#### Backend
```bash
npm run dev              # Start development server with hot reload
npm start               # Start production server
npm test                # Run tests
npm run test:watch      # Run tests in watch mode
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues
npm run migrate         # Run database migrations
npm run seed            # Seed database with sample data
```

#### Frontend
```bash
cd bilten-frontend
npm start               # Start development server
npm run build           # Build for production
npm test                # Run tests
```

#### Scanner App
```bash
cd bilten-scanner
npm run dev             # Start development server
npm run build           # Build PWA
npm run preview         # Preview production build
```

## 🔌 API Endpoints

### Authentication
- `POST /v1/auth/register` - User registration
- `POST /v1/auth/login` - User login
- `POST /v1/auth/logout` - User logout
- `POST /v1/auth/refresh` - Refresh JWT token

### Events
- `GET /v1/events` - List events with filtering
- `POST /v1/events` - Create new event
- `GET /v1/events/:id` - Get event details
- `PUT /v1/events/:id` - Update event
- `DELETE /v1/events/:id` - Delete event

### Tickets
- `GET /v1/tickets` - List tickets
- `POST /v1/tickets` - Create ticket
- `GET /v1/tickets/:id` - Get ticket details
- `PUT /v1/tickets/:id` - Update ticket

### Orders
- `GET /v1/orders` - List user orders
- `POST /v1/orders` - Create new order
- `GET /v1/orders/:id` - Get order details
- `POST /v1/orders/:id/validate` - Validate ticket

### Analytics
- `GET /v1/analytics/events` - Event analytics
- `GET /v1/analytics/sales` - Sales reports
- `GET /v1/analytics/users` - User analytics

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test suites
npm test -- --testPathPattern=auth
```

## 📚 Documentation

- [Project Progress Report](Docs/PROJECT_PROGRESS_REPORT.md) - Comprehensive project status
- [Development Guide](Docs/DEVELOPMENT.md) - Setup and development workflow
- [API Integration](Docs/FRONTEND_INTEGRATION.md) - Frontend-Backend integration
- [Payment System](Docs/PAYMENT_SYSTEM_DOCUMENTATION.md) - Stripe integration
- [Promo Codes](Docs/PROMO_CODE_SYSTEM_DOCUMENTATION.md) - Discount system
- [Analytics & Tracking](Docs/TRACKING_ANALYTICS_DOCUMENTATION.md) - User tracking
- [File Upload](Docs/FILE_UPLOAD_TESTING.md) - S3 integration
- [Search System](Docs/SEARCH_SYSTEM_TESTING.md) - Full-text search
- [Monitoring](Docs/MONITORING_SETUP.md) - System monitoring

## 🚀 Deployment

### Production Deployment

1. **Environment Setup**
```bash
# Set production environment variables
NODE_ENV=production
DATABASE_URL=your_production_db_url
REDIS_URL=your_production_redis_url
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
STRIPE_SECRET_KEY=your_stripe_secret
```

2. **Build Applications**
```bash
# Build backend
npm run build

# Build frontend
cd bilten-frontend && npm run build && cd ..

# Build scanner app
cd bilten-scanner && npm run build && cd ..
```

3. **Database Migration**
```bash
npm run migrate
```

4. **Start Production Server**
```bash
npm start
```

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# Or build individual images
docker build -t bilten-backend .
docker build -t bilten-frontend ./bilten-frontend
docker build -t bilten-scanner ./bilten-scanner
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow ESLint configuration
- Use Prettier for code formatting
- Write tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.bilten.com](https://docs.bilten.com)
- **Email**: support@bilten.com
- **Issues**: [GitHub Issues](https://github.com/your-username/bilten-platform/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/bilten-platform/discussions)

## 🗺️ Roadmap

### Current Phase: Development & Testing
- [ ] Complete test coverage
- [ ] Performance optimization
- [ ] Security audit
- [ ] CI/CD pipeline setup

### Next Phase: Production Ready
- [ ] Load testing
- [ ] Monitoring and alerting
- [ ] Backup and recovery
- [ ] Documentation completion

### Future Features
- [ ] Mobile app development
- [ ] Advanced analytics dashboard
- [ ] Multi-tenant support
- [ ] API marketplace
- [ ] Social media integration
- [ ] Live streaming integration

## 🙏 Acknowledgments

- Built with ❤️ by the Bilten Team
- Powered by React, Node.js, and PostgreSQL
- Special thanks to our contributors and the open-source community

---

**Bilten** - Making event management simple and efficient since 2025.
