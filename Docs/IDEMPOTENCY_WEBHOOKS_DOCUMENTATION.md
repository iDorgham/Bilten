# Idempotency & Webhooks System Documentation

## Overview

The Bilten platform now includes a comprehensive idempotency and webhooks system that ensures reliable, duplicate-free operations and real-time event notifications to external systems.

## 🚀 Idempotency System

### What is Idempotency?

Idempotency ensures that identical requests are processed only once, preventing duplicate operations and data inconsistencies. This is crucial for payment processing, order creation, and other critical operations.

### Key Features

- **Request Deduplication**: Prevents duplicate processing of identical requests
- **Configurable TTL**: Idempotency keys expire after a configurable time period
- **User-Scoped**: Keys are scoped to individual users
- **Automatic Cleanup**: Expired keys are automatically cleaned up
- **Flexible Configuration**: Can be required or optional per endpoint

### Implementation

#### Middleware Usage

```javascript
const { createIdempotencyMiddleware, validateIdempotencyKey } = require('../middleware/idempotency');

// Create middleware instance
const idempotencyMiddleware = createIdempotencyMiddleware({
  ttl: 60 * 60 * 1000, // 1 hour
  required: true
});

// Apply to routes
router.post('/create-payment-intent', 
  authenticateToken, 
  validateIdempotencyKey, 
  idempotencyMiddleware, 
  async (req, res) => {
    // Your route logic here
  }
);
```

#### Client Usage

```javascript
// Generate idempotency key
const idempotencyKey = crypto.randomBytes(32).toString('hex');

// Include in request headers
const response = await fetch('/api/v1/payments/create-payment-intent', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Idempotency-Key': idempotencyKey
  },
  body: JSON.stringify(paymentData)
});
```

### Database Schema

```sql
CREATE TABLE idempotency_keys (
  id SERIAL PRIMARY KEY,
  key VARCHAR(64) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  response_data TEXT NOT NULL,
  response_status INTEGER NOT NULL DEFAULT 200,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(key, user_id),
  INDEX idx_key_user (key, user_id),
  INDEX idx_expires (expires_at)
);
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `ttl` | number | 24 hours | Time-to-live for idempotency keys |
| `keyHeader` | string | 'Idempotency-Key' | HTTP header name for idempotency key |
| `required` | boolean | true | Whether idempotency is required |

## 🔗 Webhooks System

### What are Webhooks?

Webhooks provide real-time event notifications to external systems when specific events occur in the Bilten platform (e.g., payment success, order completion, ticket scanning).

### Key Features

- **Event Processing**: Handles various event types with dedicated processors
- **Retry Logic**: Automatic retry with exponential backoff for failed deliveries
- **Signature Verification**: Secure webhook delivery with signature verification
- **Delivery Tracking**: Comprehensive tracking of webhook delivery status
- **Endpoint Management**: CRUD operations for webhook endpoints
- **Error Handling**: Robust error handling and logging

### Supported Event Types

#### Payment Events
- `payment_intent.succeeded` - Payment completed successfully
- `payment_intent.payment_failed` - Payment failed
- `payment_intent.canceled` - Payment canceled
- `charge.refunded` - Charge refunded

#### Order Events
- `order.created` - New order created
- `order.completed` - Order completed
- `order.payment_failed` - Order payment failed
- `order.canceled` - Order canceled
- `order.refunded` - Order refunded

#### Ticket Events
- `ticket.scanned` - Ticket scanned at event

#### User Events
- `user.registered` - New user registration

### Implementation

#### Webhook Service Usage

```javascript
const WebhookService = require('../services/webhookService');

// Process webhook event
await WebhookService.processWebhookEvent('payment_intent.succeeded', paymentData, 'stripe');

// Send webhook to external endpoint
await WebhookService.sendWebhook(endpointUrl, payload, headers);

// Retry failed webhooks
await WebhookService.retryFailedWebhooks();
```

#### Webhook Endpoint Management

```javascript
// Create webhook endpoint
POST /api/v1/webhook-management/endpoints
{
  "name": "My Webhook",
  "url": "https://myapp.com/webhooks/bilten",
  "eventTypes": ["order.completed", "payment_intent.succeeded"],
  "secretKey": "my-secret-key"
}

// List webhook endpoints
GET /api/v1/webhook-management/endpoints

// Update webhook endpoint
PUT /api/v1/webhook-management/endpoints/:id

// Delete webhook endpoint
DELETE /api/v1/webhook-management/endpoints/:id

// Retry failed webhooks
POST /api/v1/webhook-management/retry-failed
```

### Database Schema

#### Webhook Events
```sql
CREATE TABLE webhook_events (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  source VARCHAR(50) NOT NULL DEFAULT 'stripe',
  event_data TEXT NOT NULL,
  status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  result TEXT,
  error_message TEXT,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_event_type (event_type),
  INDEX idx_source (source),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);
```

#### Webhook Deliveries
```sql
CREATE TABLE webhook_deliveries (
  id SERIAL PRIMARY KEY,
  webhook_id VARCHAR(36) NOT NULL,
  endpoint VARCHAR(500) NOT NULL,
  payload TEXT NOT NULL,
  headers TEXT NOT NULL,
  status ENUM('pending', 'delivered', 'failed') DEFAULT 'pending',
  response_status INTEGER,
  response_data TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  delivered_at TIMESTAMP,
  last_retry_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_webhook_id (webhook_id),
  INDEX idx_status (status),
  INDEX idx_retry_count (retry_count),
  INDEX idx_created_at (created_at)
);
```

#### Webhook Endpoints
```sql
CREATE TABLE webhook_endpoints (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  url VARCHAR(500) NOT NULL UNIQUE,
  secret_key VARCHAR(255) NOT NULL,
  event_types TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_is_active (is_active)
);
```

### Retry Configuration

The webhook system uses exponential backoff for retries:

```javascript
const retryDelays = [1000, 5000, 15000, 60000, 300000]; // 1s, 5s, 15s, 1m, 5m
const maxRetries = 5;
```

## 🛠️ Utilities

### Cleanup Service

The cleanup service provides utilities for maintaining the idempotency and webhooks system:

```javascript
const CleanupService = require('../utils/idempotencyCleanup');

// Cleanup expired idempotency keys
await CleanupService.cleanupIdempotencyKeys();

// Cleanup old webhook data (keep last 30 days)
await CleanupService.cleanupWebhookData(30);

// Retry failed webhook deliveries
await CleanupService.retryFailedWebhooks();

// Get cleanup statistics
const stats = await CleanupService.getCleanupStats();

// Run full cleanup
await CleanupService.runFullCleanup(30);
```

### CLI Usage

```bash
# Cleanup expired idempotency keys
node src/utils/idempotencyCleanup.js idempotency

# Cleanup old webhook data (keep last 30 days)
node src/utils/idempotencyCleanup.js webhooks 30

# Retry failed webhook deliveries
node src/utils/idempotencyCleanup.js retry

# Show cleanup statistics
node src/utils/idempotencyCleanup.js stats

# Run full cleanup
node src/utils/idempotencyCleanup.js full 30
```

## 🔒 Security

### Idempotency Security

- Keys are scoped to individual users
- Keys expire after configurable TTL
- Automatic cleanup prevents storage bloat
- Request validation ensures proper key format

### Webhook Security

- Signature verification for webhook authenticity
- Secret keys for endpoint authentication
- HTTPS-only endpoint URLs
- Rate limiting and timeout protection

## 📊 Monitoring

### Key Metrics

- Idempotency key usage and expiration rates
- Webhook delivery success/failure rates
- Retry attempt counts and success rates
- Endpoint response times and error rates

### Logging

All idempotency and webhook operations are logged with appropriate levels:

- **INFO**: Successful operations
- **WARN**: Retry attempts and temporary failures
- **ERROR**: Permanent failures and system errors

## 🚀 Deployment

### Environment Variables

```bash
# Idempotency configuration
IDEMPOTENCY_TTL=86400000  # 24 hours in milliseconds
IDEMPOTENCY_REQUIRED=true

# Webhook configuration
WEBHOOK_MAX_RETRIES=5
WEBHOOK_TIMEOUT=30000     # 30 seconds
WEBHOOK_CLEANUP_DAYS=30   # Keep data for 30 days
```

### Database Migrations

Run the following migrations to set up the required tables:

```bash
# Run migrations
npm run migrate

# Or manually run specific migrations
npx knex migrate:up 014_create_idempotency_tables.js
npx knex migrate:up 015_create_webhook_tables.js
```

### Scheduled Tasks

Set up cron jobs for cleanup operations:

```bash
# Cleanup expired idempotency keys (daily)
0 2 * * * node src/utils/idempotencyCleanup.js idempotency

# Cleanup old webhook data (weekly)
0 3 * * 0 node src/utils/idempotencyCleanup.js webhooks 30

# Retry failed webhooks (every 15 minutes)
*/15 * * * * node src/utils/idempotencyCleanup.js retry
```

## 🧪 Testing

### Idempotency Testing

```javascript
// Test idempotency with duplicate requests
const idempotencyKey = generateIdempotencyKey();

// First request
const response1 = await createPaymentIntent(paymentData, idempotencyKey);

// Duplicate request with same key
const response2 = await createPaymentIntent(paymentData, idempotencyKey);

// response2 should be identical to response1
expect(response2.data).toEqual(response1.data);
expect(response2.cached).toBe(true);
```

### Webhook Testing

```javascript
// Test webhook delivery
const testPayload = {
  event_type: 'test.webhook',
  message: 'Test webhook from Bilten',
  timestamp: new Date().toISOString()
};

const result = await WebhookService.sendWebhook(
  'https://webhook.site/your-unique-url',
  testPayload,
  { 'Authorization': 'Bearer test-secret' }
);

expect(result.success).toBe(true);
expect(result.status).toBe(200);
```

## 📚 API Reference

### Idempotency Headers

| Header | Type | Required | Description |
|--------|------|----------|-------------|
| `Idempotency-Key` | string | Yes | Unique identifier for the request |

### Webhook Headers

| Header | Type | Description |
|--------|------|-------------|
| `X-Webhook-ID` | string | Unique webhook delivery ID |
| `X-Webhook-Timestamp` | number | Unix timestamp of webhook |
| `X-Webhook-Source` | string | Source system (e.g., 'bilten') |
| `X-Webhook-Retry` | number | Retry attempt number |
| `Authorization` | string | Bearer token for authentication |

### Response Format

#### Idempotent Response
```json
{
  "success": true,
  "message": "Idempotent response from cache",
  "data": { /* original response data */ },
  "idempotency_key": "abc123...",
  "cached": true
}
```

#### Webhook Response
```json
{
  "success": true,
  "webhookId": "uuid-here",
  "status": 200,
  "data": { /* response from webhook endpoint */ }
}
```

## 🔧 Troubleshooting

### Common Issues

1. **Idempotency Key Already Used**
   - Check if the key was used recently
   - Generate a new unique key
   - Verify TTL configuration

2. **Webhook Delivery Failures**
   - Check endpoint URL accessibility
   - Verify secret key configuration
   - Review retry logs and response data

3. **Database Performance**
   - Monitor idempotency key cleanup
   - Review webhook delivery statistics
   - Consider archiving old data

### Debug Commands

```bash
# Check cleanup statistics
node src/utils/idempotencyCleanup.js stats

# Manual cleanup
node src/utils/idempotencyCleanup.js full 30

# Test webhook endpoint
curl -X POST https://your-api.com/api/v1/webhook-management/endpoints/1/test \
  -H "Authorization: Bearer your-token"
```

## 📈 Performance Considerations

- Idempotency keys are automatically cleaned up to prevent storage bloat
- Webhook deliveries use connection pooling and timeouts
- Retry logic prevents overwhelming external systems
- Database indexes optimize query performance
- Asynchronous processing for non-critical operations

## 🔄 Future Enhancements

- Webhook event filtering and transformation
- Advanced retry strategies (circuit breaker, dead letter queues)
- Real-time webhook delivery monitoring dashboard
- Webhook payload compression and encryption
- Multi-region webhook delivery for high availability
