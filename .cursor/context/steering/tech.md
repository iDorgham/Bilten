# Technology Stack

## Backend Framework
- **Node.js 18+** - Runtime environment
- **Express.js** - Web application framework
- **PostgreSQL 15+** - Primary database
- **Redis 7+** - Caching and session storage
- **Knex.js** - SQL query builder and migrations

## Key Dependencies
- **Authentication**: bcryptjs, jsonwebtoken
- **Security**: helmet, cors
- **File Upload**: multer, aws-sdk
- **Payment**: stripe
- **Email**: nodemailer
- **Logging**: winston
- **Environment**: dotenv

## Development Tools
- **nodemon** - Development server with hot reload
- **jest** - Testing framework
- **supertest** - HTTP testing
- **eslint** - Code linting
- **prettier** - Code formatting

## Common Commands

### Development
```bash
npm run dev          # Start development server with hot reload
npm start           # Start production server
npm run lint        # Run ESLint
npm run lint:fix    # Fix ESLint issues automatically
```

### Testing
```bash
npm test            # Run all tests
npm run test:watch  # Run tests in watch mode
```

### Database
```bash
npm run db:migrate   # Run database migrations
npm run db:seed     # Seed database with sample data
npm run db:rollback # Rollback last migration
```

### Docker
```bash
docker-compose up -d              # Start all services
docker-compose up -d postgres redis  # Start only database services
docker-compose logs -f api        # View API logs
docker-compose down              # Stop all services
```

## Environment Configuration
- Copy `.env.example` to `.env` and configure
- Database runs on port 5432 (PostgreSQL)
- Redis runs on port 6379
- API server runs on port 3001
- Frontend expected on port 3000

## Code Style
- Use ESLint for code linting
- Follow consistent error handling patterns
- Use environment variables for configuration
- Implement proper logging with winston