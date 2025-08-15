# EventChain API Documentation

Welcome to the EventChain API documentation. This directory contains comprehensive documentation for all EventChain APIs and services.

## API Overview

EventChain uses a microservices architecture with the following main components:

- **API Gateway** - Central entry point for all client requests
- **Event Service** - Manages events, venues, and scheduling
- **Order Service** - Handles ticket purchases and order management
- **Analytics Service** - Provides reporting and analytics data

## Quick Start

### Base URL
```
Development: http://localhost:3001/api
Production: https://api.eventchain.com/api
```

### Authentication
All API requests require authentication using JWT tokens:

```bash
curl -H "Authorization: Bearer <your-jwt-token>" \
     https://api.eventchain.com/api/events
```

### Content Type
All requests should use JSON content type:
```
Content-Type: application/json
```

## API Services

### Event Service
Manages events, venues, and event-related operations.

**Base Path**: `/api/events`

Key endpoints:
- `GET /api/events` - List all events
- `POST /api/events` - Create new event
- `GET /api/events/{id}` - Get event details
- `PUT /api/events/{id}` - Update event
- `DELETE /api/events/{id}` - Delete event

### Order Service
Handles ticket purchases, order management, and payment processing.

**Base Path**: `/api/orders`

Key endpoints:
- `POST /api/orders` - Create new order
- `GET /api/orders/{id}` - Get order details
- `GET /api/orders/user/{userId}` - Get user orders
- `PUT /api/orders/{id}/status` - Update order status

### Analytics Service
Provides reporting and analytics data for events and sales.

**Base Path**: `/api/analytics`

Key endpoints:
- `GET /api/analytics/events/{id}/stats` - Event statistics
- `GET /api/analytics/sales/summary` - Sales summary
- `GET /api/analytics/reports/revenue` - Revenue reports

## API Documentation Files

### Service-Specific Documentation
- [Event Service API](event-service-api.md) - Complete event management API
- [Order Service API](order-service-api.md) - Order and payment processing API
- [Analytics Service API](analytics-service-api.md) - Reporting and analytics API

### Integration Guides
- [Authentication Guide](authentication.md) - JWT authentication implementation
- [Webhook Integration](webhooks.md) - Event-driven integrations
- [Rate Limiting](rate-limiting.md) - API usage limits and best practices

### Reference Documentation
- [Error Codes](error-codes.md) - Complete error code reference
- [Data Models](data-models.md) - API request/response schemas
- [API Changelog](changelog.md) - Version history and breaking changes

## Common Patterns

### Pagination
List endpoints support pagination using query parameters:
```
GET /api/events?page=1&limit=20&sort=date&order=desc
```

### Filtering
Most list endpoints support filtering:
```
GET /api/events?category=music&status=active&date_from=2024-01-01
```

### Error Handling
All APIs return consistent error responses:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

## Development Tools

### API Testing
- Use Postman collection: [EventChain.postman_collection.json](postman/EventChain.postman_collection.json)
- Swagger UI available at: `http://localhost:3001/api-docs`
- OpenAPI specification: [openapi.yaml](openapi.yaml)

### SDK and Libraries
- JavaScript/TypeScript: `@eventchain/api-client`
- Python: `eventchain-python-sdk`
- PHP: `eventchain/php-sdk`

## Environment-Specific Information

### Development
- Base URL: `http://localhost:3001/api`
- Database: Local PostgreSQL
- Authentication: Development JWT tokens

### Staging
- Base URL: `https://staging-api.eventchain.com/api`
- Database: Staging PostgreSQL
- Authentication: Staging JWT tokens

### Production
- Base URL: `https://api.eventchain.com/api`
- Database: Production PostgreSQL cluster
- Authentication: Production JWT tokens
- Rate limiting: Enforced
- Monitoring: Full observability stack

## Support and Feedback

### Getting Help
- Check [troubleshooting guide](../development/troubleshooting.md)
- Review [FAQ](faq.md)
- Contact API support: api-support@eventchain.com

### Contributing
- Report API issues on GitHub
- Suggest improvements via pull requests
- Follow [contribution guidelines](../CONTRIBUTING.md)

### Versioning
- Current version: v1
- Versioning strategy: Semantic versioning
- Deprecation policy: 6 months notice for breaking changes

## Security

### Best Practices
- Always use HTTPS in production
- Store JWT tokens securely
- Implement proper error handling
- Validate all input data
- Use rate limiting

### Reporting Security Issues
See [SECURITY.md](../SECURITY.md) for security vulnerability reporting.

## Additional Resources

- [API Status Page](https://status.eventchain.com)
- [Developer Blog](https://blog.eventchain.com/developers)
- [Community Forum](https://community.eventchain.com)
- [GitHub Repository](https://github.com/eventchain/api)