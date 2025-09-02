# Bilten API Gateway

The API Gateway serves as the central entry point for all client requests to the Bilten platform, providing unified access to microservices through a scalable, secure, and feature-rich gateway architecture.

## Features

- **Unified API Access**: Single entry point for all platform services
- **Authentication & Authorization**: JWT-based authentication with RBAC
- **Rate Limiting**: Configurable rate limiting to prevent abuse
- **Load Balancing**: Intelligent request distribution across service instances
- **Service Discovery**: Automatic service registration and health monitoring
- **Request/Response Transformation**: Protocol adaptation and data format conversion
- **Monitoring & Analytics**: Comprehensive metrics collection and reporting
- **High Availability**: Clustering support for production deployments

## Quick Start

### Prerequisites

- Node.js 18+ 
- Redis (for rate limiting and caching)
- Backend services (user, event, payment, etc.)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd bilten-gateway

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### Development

```bash
# Start in development mode with hot reload
npm run dev

# Build the project
npm run build

# Start production build
npm start

# Run tests
npm test

# Run linting
npm run lint
```

### Docker Deployment

```bash
# Build Docker image
docker build -t bilten-gateway .

# Run with Docker
docker run -p 3000:3000 --env-file .env bilten-gateway

# Or use docker-compose (recommended)
docker-compose up -d
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |
| `CLUSTER_MODE` | Enable clustering | `false` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `JWT_SECRET` | JWT signing secret | Required |
| `DEFAULT_RATE_LIMIT_MAX` | Default rate limit | `100` |
| `USER_SERVICE_URL` | User service URL | `http://localhost:3001` |
| `EVENT_SERVICE_URL` | Event service URL | `http://localhost:3002` |

### Service Configuration

The gateway automatically discovers and routes to the following services:

- **User Service** (`/api/users`, `/api/auth`)
- **Event Service** (`/api/events`)
- **Payment Service** (`/api/payments`)
- **Notification Service** (`/api/notifications`)
- **File Service** (`/api/files`)
- **Analytics Service** (`/api/analytics`)

## API Endpoints

### Health & Monitoring

```
GET /health                    # Gateway health check
GET /api/gateway/metrics       # Performance metrics
GET /api/gateway/config        # Configuration status
```

### Service Proxying

All requests to `/api/*` are automatically routed to the appropriate backend services based on the path prefix.

## Architecture

```
Client Applications
        ↓
    Load Balancer
        ↓
   API Gateway Cluster
        ↓
   Backend Services
```

### Components

- **GatewayServer**: Main server orchestration
- **RouteManager**: Dynamic request routing
- **AuthenticationMiddleware**: JWT validation and user context
- **RateLimitMiddleware**: Request throttling and abuse prevention
- **MetricsMiddleware**: Performance monitoring and analytics
- **ServiceRegistry**: Service discovery and health tracking
- **HealthCheckService**: Automated service health monitoring

## Security

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Protection against abuse and DDoS
- **CORS Configuration**: Cross-origin request security
- **Helmet Security**: HTTP security headers
- **Input Validation**: Request sanitization and validation

## Monitoring

The gateway provides comprehensive monitoring capabilities:

- **Request Metrics**: Response times, status codes, throughput
- **Service Health**: Automated health checks and status tracking
- **Error Tracking**: Detailed error logging and alerting
- **Performance Analytics**: Endpoint performance analysis

## High Availability

### Clustering

Enable clustering for production deployments:

```bash
# Set environment variable
CLUSTER_MODE=true

# Or use PM2 for process management
pm2 start ecosystem.config.js
```

### Load Balancing

The gateway supports multiple load balancing algorithms:

- **Round Robin**: Equal distribution across instances
- **Weighted**: Distribution based on instance capacity
- **Least Connections**: Route to least busy instance

## Development

### Project Structure

```
src/
├── config/          # Configuration management
├── middleware/      # Express middleware
├── routing/         # Request routing logic
├── services/        # Core services
├── utils/          # Utility functions
└── index.ts        # Application entry point
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm test -- --coverage
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

MIT License - see LICENSE file for details