# EventChain Integration Guide

## Overview
This guide provides comprehensive information for third-party developers and partners looking to integrate with the EventChain platform. It covers API integration, webhooks, SDKs, and best practices for building applications that work with EventChain.

## Table of Contents
- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [API Integration](#api-integration)
- [Webhooks](#webhooks)
- [SDKs and Libraries](#sdks-and-libraries)
- [Common Integration Patterns](#common-integration-patterns)
- [Testing and Sandbox](#testing-and-sandbox)
- [Rate Limiting and Best Practices](#rate-limiting-and-best-practices)
- [Error Handling](#error-handling)
- [Security Guidelines](#security-guidelines)
- [Support and Resources](#support-and-resources)

## Getting Started

### Prerequisites
- EventChain developer account
- API credentials (API key and secret)
- Basic understanding of REST APIs
- HTTPS-enabled application for webhook endpoints

### Quick Start
1. **Register as a Developer**
   - Visit [EventChain Developer Portal](https://developers.eventchain.com)
   - Create your developer account
   - Complete the application verification process

2. **Create an Application**
   - Navigate to the Developer Dashboard
   - Click "Create New Application"
   - Provide application details and use case
   - Obtain your API credentials

3. **Make Your First API Call**
   ```bash
   curl -X GET "https://api.eventchain.com/v1/events" \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json"
   ```

## Authentication

### API Key Authentication
EventChain uses API key-based authentication for most integrations:

```http
GET /v1/events
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

### OAuth 2.0 (For User-Facing Applications)
For applications that need to act on behalf of users:

1. **Authorization Request**
   ```
   https://auth.eventchain.com/oauth/authorize?
     client_id=YOUR_CLIENT_ID&
     response_type=code&
     scope=events:read tickets:write&
     redirect_uri=YOUR_REDIRECT_URI&
     state=RANDOM_STATE_STRING
   ```

2. **Token Exchange**
   ```http
   POST /oauth/token
   Content-Type: application/x-www-form-urlencoded
   
   grant_type=authorization_code&
   client_id=YOUR_CLIENT_ID&
   client_secret=YOUR_CLIENT_SECRET&
   code=AUTHORIZATION_CODE&
   redirect_uri=YOUR_REDIRECT_URI
   ```

### Scopes
- `events:read` - Read event information
- `events:write` - Create and modify events
- `tickets:read` - Read ticket information
- `tickets:write` - Purchase and manage tickets
- `analytics:read` - Access analytics data
- `payments:read` - Read payment information
- `payments:write` - Process payments and refunds

## API Integration

### Base URLs
- **Production**: `https://api.eventchain.com/v1`
- **Staging**: `https://staging-api.eventchain.com/v1`
- **Sandbox**: `https://sandbox-api.eventchain.com/v1`

### Common Headers
```http
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
Accept: application/json
X-API-Version: 2024-01-15
User-Agent: YourApp/1.0.0
```

### Response Format
All API responses follow a consistent format:

```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "meta": {
    "requestId": "req_123456789",
    "timestamp": "2024-01-15T10:00:00Z",
    "version": "v1"
  }
}
```

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      "field": "Specific field error details"
    }
  },
  "meta": {
    "requestId": "req_123456789",
    "timestamp": "2024-01-15T10:00:00Z"
  }
}
```

## Webhooks

### Setting Up Webhooks
1. **Configure Webhook URL**
   ```http
   POST /v1/webhooks
   Authorization: Bearer YOUR_API_KEY
   Content-Type: application/json
   
   {
     "url": "https://your-app.com/webhooks/eventchain",
     "events": ["ticket.purchased", "event.published"],
     "secret": "your_webhook_secret"
   }
   ```

2. **Verify Webhook Signatures**
   ```javascript
   const crypto = require('crypto');
   
   function verifyWebhookSignature(payload, signature, secret) {
     const expectedSignature = crypto
       .createHmac('sha256', secret)
       .update(payload)
       .digest('hex');
     
     return `sha256=${expectedSignature}` === signature;
   }
   ```

### Webhook Events
- `event.created` - New event created
- `event.published` - Event published
- `event.cancelled` - Event cancelled
- `ticket.purchased` - Ticket purchased
- `ticket.transferred` - Ticket transferred
- `payment.succeeded` - Payment completed
- `payment.failed` - Payment failed
- `refund.processed` - Refund completed

### Webhook Payload Example
```json
{
  "id": "evt_webhook_123",
  "type": "ticket.purchased",
  "data": {
    "ticketId": "tkt_111111111",
    "eventId": "evt_123456789",
    "purchaserId": "usr_987654321",
    "amount": 150.00,
    "currency": "USD"
  },
  "createdAt": "2024-01-15T10:00:00Z"
}
```

## SDKs and Libraries

### Official SDKs

#### JavaScript/Node.js
```bash
npm install @eventchain/sdk
```

```javascript
const EventChain = require('@eventchain/sdk');

const client = new EventChain({
  apiKey: 'your_api_key',
  environment: 'production' // or 'staging', 'sandbox'
});

// Get events
const events = await client.events.list({
  category: 'music',
  location: 'new-york'
});

// Purchase tickets
const purchase = await client.tickets.purchase({
  eventId: 'evt_123456789',
  tickets: [
    { tierId: 'tier_general', quantity: 2 }
  ],
  paymentMethodId: 'pm_1234567890'
});
```

#### Python
```bash
pip install eventchain-python
```

```python
import eventchain

client = eventchain.Client(
    api_key='your_api_key',
    environment='production'
)

# Get events
events = client.events.list(
    category='music',
    location='new-york'
)

# Purchase tickets
purchase = client.tickets.purchase(
    event_id='evt_123456789',
    tickets=[
        {'tier_id': 'tier_general', 'quantity': 2}
    ],
    payment_method_id='pm_1234567890'
)
```

#### PHP
```bash
composer require eventchain/eventchain-php
```

```php
<?php
require_once 'vendor/autoload.php';

use EventChain\EventChainClient;

$client = new EventChainClient([
    'api_key' => 'your_api_key',
    'environment' => 'production'
]);

// Get events
$events = $client->events->listEvents([
    'category' => 'music',
    'location' => 'new-york'
]);

// Purchase tickets
$purchase = $client->tickets->purchaseTickets([
    'event_id' => 'evt_123456789',
    'tickets' => [
        ['tier_id' => 'tier_general', 'quantity' => 2]
    ],
    'payment_method_id' => 'pm_1234567890'
]);
```

## Common Integration Patterns

### Event Discovery Widget
Create an embeddable widget to display events:

```html
<div id="eventchain-widget"></div>
<script>
  EventChainWidget.init({
    containerId: 'eventchain-widget',
    apiKey: 'your_public_api_key',
    filters: {
      category: 'music',
      location: 'user-location'
    },
    theme: 'light'
  });
</script>
```

### Ticket Purchase Flow
```javascript
// 1. Get event details
const event = await client.events.get('evt_123456789');

// 2. Get available ticket tiers
const tiers = event.ticketTiers.filter(tier => tier.available > 0);

// 3. Create purchase quote
const quote = await client.tickets.quote({
  eventId: 'evt_123456789',
  tickets: [{ tierId: 'tier_general', quantity: 2 }],
  promoCode: 'EARLY2024'
});

// 4. Process payment
const payment = await client.payments.process({
  amount: quote.finalAmount,
  paymentMethodId: 'pm_1234567890',
  orderId: quote.orderId
});

// 5. Complete ticket purchase
if (payment.status === 'succeeded') {
  const tickets = await client.tickets.purchase({
    orderId: quote.orderId,
    paymentId: payment.id
  });
}
```

### Event Management Dashboard
```javascript
// Get organizer's events
const events = await client.events.list({
  organizerId: 'current_user_id',
  status: 'published'
});

// Get analytics for each event
for (const event of events) {
  const analytics = await client.analytics.getEventOverview(event.id);
  console.log(`${event.title}: ${analytics.ticketsSold} tickets sold`);
}
```

## Testing and Sandbox

### Sandbox Environment
Use the sandbox environment for testing:
- **Base URL**: `https://sandbox-api.eventchain.com/v1`
- **Test API Key**: Provided in developer dashboard
- **Test Payment Methods**: Use test card numbers

### Test Data
```javascript
// Test credit card numbers
const testCards = {
  visa: '4242424242424242',
  mastercard: '5555555555554444',
  amex: '378282246310005',
  declined: '4000000000000002'
};

// Create test event
const testEvent = await client.events.create({
  title: 'Test Event',
  startDate: '2024-12-01T19:00:00Z',
  venue: {
    name: 'Test Venue',
    address: 'Test Address'
  },
  ticketTiers: [
    {
      name: 'Test Tier',
      price: 10.00,
      quantity: 100
    }
  ]
});
```

## Rate Limiting and Best Practices

### Rate Limits
- **Standard API**: 1000 requests/hour
- **Premium API**: 10000 requests/hour
- **Webhook delivery**: 5 retries with exponential backoff

### Best Practices
1. **Implement Exponential Backoff**
   ```javascript
   async function apiCallWithRetry(apiCall, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await apiCall();
       } catch (error) {
         if (error.status === 429 && i < maxRetries - 1) {
           await new Promise(resolve => 
             setTimeout(resolve, Math.pow(2, i) * 1000)
           );
           continue;
         }
         throw error;
       }
     }
   }
   ```

2. **Cache Frequently Accessed Data**
   ```javascript
   const cache = new Map();
   
   async function getEventWithCache(eventId) {
     if (cache.has(eventId)) {
       return cache.get(eventId);
     }
     
     const event = await client.events.get(eventId);
     cache.set(eventId, event);
     
     // Cache for 5 minutes
     setTimeout(() => cache.delete(eventId), 5 * 60 * 1000);
     
     return event;
   }
   ```

3. **Use Pagination for Large Datasets**
   ```javascript
   async function getAllEvents() {
     const allEvents = [];
     let page = 1;
     let hasMore = true;
     
     while (hasMore) {
       const response = await client.events.list({
         page: page,
         limit: 100
       });
       
       allEvents.push(...response.data);
       hasMore = response.meta.hasNextPage;
       page++;
     }
     
     return allEvents;
   }
   ```

## Error Handling

### Common Error Scenarios
```javascript
try {
  const tickets = await client.tickets.purchase(purchaseData);
} catch (error) {
  switch (error.code) {
    case 'TICKET_006':
      // Insufficient ticket availability
      showError('Sorry, not enough tickets available');
      break;
    case 'PAY_001':
      // Payment method declined
      showError('Payment was declined. Please try another card');
      break;
    case 'AUTH_003':
      // Token expired
      await refreshAuthToken();
      // Retry the request
      break;
    default:
      showError('An unexpected error occurred');
      logError(error);
  }
}
```

### Idempotency
Use idempotency keys for critical operations:

```javascript
const idempotencyKey = generateUniqueKey();

const purchase = await client.tickets.purchase({
  eventId: 'evt_123456789',
  tickets: [...],
  paymentMethodId: 'pm_1234567890'
}, {
  idempotencyKey: idempotencyKey
});
```

## Security Guidelines

### API Key Security
- Never expose API keys in client-side code
- Use environment variables for API keys
- Rotate API keys regularly
- Use different keys for different environments

### Webhook Security
- Always verify webhook signatures
- Use HTTPS for webhook endpoints
- Implement replay attack protection
- Log webhook events for debugging

### Data Protection
- Follow GDPR and data protection regulations
- Implement proper data encryption
- Use secure communication channels
- Regularly audit data access

## Support and Resources

### Documentation
- [API Reference](https://docs.eventchain.com/api)
- [Developer Portal](https://developers.eventchain.com)
- [SDK Documentation](https://docs.eventchain.com/sdks)

### Community
- [Developer Forum](https://forum.eventchain.com)
- [Discord Community](https://discord.gg/eventchain-dev)
- [GitHub Repositories](https://github.com/eventchain)

### Support Channels
- **Technical Support**: dev-support@eventchain.com
- **Partnership Inquiries**: partnerships@eventchain.com
- **Security Issues**: security@eventchain.com

### Status and Updates
- [API Status Page](https://status.eventchain.com)
- [Developer Newsletter](https://developers.eventchain.com/newsletter)
- [Changelog](https://docs.eventchain.com/changelog)

## Migration Guide

### From v1 to v2 API
If you're upgrading from a previous API version:

1. **Update Base URLs**
   - Old: `https://api.eventchain.com/v1`
   - New: `https://api.eventchain.com/v2`

2. **Update Response Format**
   - v2 includes additional metadata in responses
   - Error format has been standardized

3. **New Authentication**
   - Bearer token format required
   - OAuth 2.0 support added

4. **Breaking Changes**
   - Some field names have changed
   - Date formats now use ISO 8601
   - Pagination parameters updated

For detailed migration instructions, see our [Migration Guide](https://docs.eventchain.com/migration/v1-to-v2).

---

This integration guide provides the foundation for building robust integrations with EventChain. For specific use cases or advanced integration patterns, please refer to our detailed API documentation or contact our developer support team.