# API Documentation

## 📚 Overview

This section contains comprehensive API documentation for the Bilten platform, including REST API endpoints, GraphQL schema, authentication mechanisms, and integration guides.

## 🗂️ API Documentation Structure

### 🔐 [Authentication](./authentication.md)
- JWT token authentication
- OAuth 2.0 integration
- API key management
- Role-based access control

### 📋 [REST API Reference](./rest-api/)
- Complete endpoint documentation
- Request/response examples
- Error codes and handling
- Rate limiting information

### 🔍 [GraphQL API](./graphql/)
- Schema documentation
- Query and mutation examples
- Subscription guides
- Schema introspection

### 🔗 [Integration Guides](./integrations/)
- SDK documentation
- Webhook integration
- Third-party integrations
- API client examples

### 🧪 [API Testing](./testing/)
- Postman collections
- API testing tools
- Mock server setup
- Testing best practices

## 🚀 Quick Start

### 1. Authentication Setup
```bash
# Get your API credentials
curl -X POST https://api.bilten.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

### 2. Make Your First API Call
```bash
# Get list of events
curl -X GET https://api.bilten.com/api/v1/events \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. GraphQL Query Example
```graphql
query GetEvents {
  events {
    id
    title
    description
    eventDate
    location {
      name
      address
    }
    tickets {
      id
      price
      available
    }
  }
}
```

## 📊 API Statistics

### Current API Version
- **Version**: v1.0
- **Base URL**: `https://api.bilten.com/api/v1`
- **GraphQL Endpoint**: `https://api.bilten.com/graphql`
- **WebSocket Endpoint**: `wss://api.bilten.com/ws`

### Rate Limits
- **Standard Plan**: 1,000 requests/hour
- **Professional Plan**: 10,000 requests/hour
- **Enterprise Plan**: 100,000 requests/hour

### Response Times
- **Average**: < 200ms
- **95th Percentile**: < 500ms
- **99th Percentile**: < 1s

## 🔧 API Features

### REST API Features
- **RESTful Design**: Follows REST principles
- **JSON Responses**: All responses in JSON format
- **Pagination**: Built-in pagination support
- **Filtering**: Advanced filtering capabilities
- **Sorting**: Flexible sorting options
- **Search**: Full-text search functionality

### GraphQL Features
- **Schema Introspection**: Self-documenting API
- **Real-time Subscriptions**: WebSocket support
- **Batching**: Multiple queries in single request
- **Field Selection**: Request only needed fields
- **Type Safety**: Strong typing system

### Authentication Features
- **JWT Tokens**: Secure token-based authentication
- **Refresh Tokens**: Automatic token refresh
- **API Keys**: Simple API key authentication
- **OAuth 2.0**: Third-party authentication
- **Role-based Access**: Granular permissions

## 📋 API Endpoints Overview

### Core Resources
- **Events**: Event management and operations
- **Tickets**: Ticket sales and management
- **Users**: User account management
- **Organizations**: Organization management
- **Payments**: Payment processing
- **Notifications**: Notification system

### Supporting Resources
- **Media**: File upload and management
- **Analytics**: Analytics and reporting
- **Settings**: Platform configuration
- **Webhooks**: Event notifications

## 🔍 API Versioning

### Version Strategy
- **URL Versioning**: `/api/v1/`, `/api/v2/`
- **Header Versioning**: `Accept: application/vnd.bilten.v1+json`
- **Backward Compatibility**: Maintained for 12 months
- **Deprecation Policy**: 6-month deprecation notice

### Current Versions
- **v1.0**: Current stable version
- **v1.1**: Beta version (new features)
- **v0.9**: Legacy version (deprecated)

## 🛠️ SDKs and Libraries

### Official SDKs
- **JavaScript/Node.js**: `npm install @bilten/api`
- **Python**: `pip install bilten-api`
- **PHP**: `composer require bilten/api`
- **Java**: Maven dependency available
- **C#**: NuGet package available

### Community Libraries
- **Ruby**: Community-maintained gem
- **Go**: Community-maintained package
- **Swift**: iOS SDK
- **Kotlin**: Android SDK

## 📚 Code Examples

### JavaScript/Node.js
```javascript
const BiltenAPI = require('@bilten/api');

const client = new BiltenAPI({
  apiKey: 'your-api-key',
  environment: 'production'
});

// Create an event
const event = await client.events.create({
  title: 'Tech Conference 2024',
  description: 'Annual technology conference',
  eventDate: '2024-06-15T09:00:00Z',
  location: {
    name: 'Convention Center',
    address: '123 Main St, City, State'
  }
});

// Get events with pagination
const events = await client.events.list({
  page: 1,
  limit: 10,
  status: 'published'
});
```

### Python
```python
from bilten_api import BiltenAPI

client = BiltenAPI(api_key='your-api-key')

# Create a ticket
ticket = client.tickets.create(
    event_id='event_123',
    name='General Admission',
    price=50.00,
    quantity=100
)

# Get analytics
analytics = client.analytics.get_event_stats(
    event_id='event_123',
    start_date='2024-01-01',
    end_date='2024-12-31'
)
```

### PHP
```php
use Bilten\API\Client;

$client = new Client('your-api-key');

// Create an organization
$organization = $client->organizations->create([
    'name' => 'Tech Events Inc',
    'description' => 'Technology event organizer',
    'website' => 'https://techevents.com'
]);

// Get user profile
$user = $client->users->get('user_123');
```

## 🔗 Webhook Integration

### Webhook Setup
```bash
# Register webhook endpoint
curl -X POST https://api.bilten.com/api/v1/webhooks \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app.com/webhooks/bilten",
    "events": ["event.created", "ticket.sold"],
    "secret": "your-webhook-secret"
  }'
```

### Webhook Events
- **event.created**: New event created
- **event.updated**: Event updated
- **event.deleted**: Event deleted
- **ticket.sold**: Ticket purchased
- **ticket.refunded**: Ticket refunded
- **payment.completed**: Payment successful
- **payment.failed**: Payment failed

## 🧪 Testing Your Integration

### Postman Collection
Download our [Postman Collection](./testing/postman-collection.json) to test all API endpoints.

### Mock Server
```bash
# Start mock server for testing
npm install -g @bilten/mock-server
bilten-mock-server --port 3001
```

### API Testing Tools
- **Postman**: Complete API testing suite
- **Insomnia**: Modern API client
- **curl**: Command-line testing
- **HTTPie**: User-friendly HTTP client

## 📞 Support and Resources

### Getting Help
- **API Documentation**: This documentation
- **API Status**: [status.bilten.com](https://status.bilten.com)
- **Community Forum**: [community.bilten.com](https://community.bilten.com)
- **Support Email**: api-support@bilten.com

### Additional Resources
- **API Changelog**: [Changelog](./changelog.md)
- **Migration Guide**: [Migration Guide](./migration-guide.md)
- **Best Practices**: [Best Practices](./best-practices.md)
- **Rate Limiting**: [Rate Limiting](./rate-limiting.md)

## 🔒 Security

### Security Best Practices
- **HTTPS Only**: All API calls must use HTTPS
- **Token Security**: Keep access tokens secure
- **Rate Limiting**: Respect rate limits
- **Input Validation**: Validate all inputs
- **Error Handling**: Handle errors gracefully

### Security Headers
```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Maintained by**: API Team
