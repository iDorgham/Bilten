# Payments API Documentation

## Overview
The EventChain Payments API handles all financial transactions including ticket purchases, refunds, and organizer payouts. It integrates with multiple payment providers and supports various payment methods.

## Base URL
```
Production: https://api.eventchain.com/v1/payments
Staging: https://staging-api.eventchain.com/v1/payments
Development: http://localhost:3001/v1/payments
```

## Payment Methods

### Add Payment Method
```http
POST /methods
Authorization: Bearer {userToken}
Content-Type: application/json

{
  "type": "card",
  "cardDetails": {
    "number": "4242424242424242",
    "expMonth": 12,
    "expYear": 2025,
    "cvc": "123"
  },
  "billingAddress": {
    "line1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "US"
  },
  "setAsDefault": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "pm_1234567890",
    "type": "card",
    "card": {
      "brand": "visa",
      "last4": "4242",
      "expMonth": 12,
      "expYear": 2025
    },
    "billingAddress": {...},
    "isDefault": true,
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

### Get Payment Methods
```http
GET /methods
Authorization: Bearer {userToken}
```

### Update Payment Method
```http
PUT /methods/{paymentMethodId}
Authorization: Bearer {userToken}
Content-Type: application/json

{
  "billingAddress": {
    "line1": "456 Oak Ave",
    "city": "Los Angeles",
    "state": "CA",
    "postalCode": "90210",
    "country": "US"
  }
}
```

### Delete Payment Method
```http
DELETE /methods/{paymentMethodId}
Authorization: Bearer {userToken}
```

## Payment Processing

### Process Payment
```http
POST /process
Authorization: Bearer {userToken}
Content-Type: application/json

{
  "orderId": "ord_987654321",
  "paymentMethodId": "pm_1234567890",
  "amount": 285.00,
  "currency": "USD",
  "description": "Ticket purchase for Summer Music Festival 2024",
  "metadata": {
    "eventId": "evt_123456789",
    "ticketCount": 2
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "pay_111111111",
    "status": "succeeded",
    "amount": 285.00,
    "currency": "USD",
    "paymentMethod": {
      "type": "card",
      "card": {
        "brand": "visa",
        "last4": "4242"
      }
    },
    "receipt": {
      "url": "https://receipts.eventchain.com/pay_111111111",
      "number": "EC-2024-001234"
    },
    "processedAt": "2024-01-15T10:00:00Z"
  }
}
```

### Get Payment Status
```http
GET /{paymentId}
Authorization: Bearer {userToken}
```

### Payment Intent (3D Secure Support)
```http
POST /intents
Authorization: Bearer {userToken}
Content-Type: application/json

{
  "amount": 285.00,
  "currency": "USD",
  "paymentMethodId": "pm_1234567890",
  "orderId": "ord_987654321",
  "returnUrl": "https://app.eventchain.com/payment/complete"
}
```

## Refunds

### Process Refund
```http
POST /refunds
Authorization: Bearer {organizerToken}
Content-Type: application/json

{
  "paymentId": "pay_111111111",
  "amount": 150.00,
  "reason": "event_cancelled",
  "description": "Refund for cancelled event"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "refundId": "ref_222222222",
    "paymentId": "pay_111111111",
    "amount": 150.00,
    "currency": "USD",
    "status": "pending",
    "reason": "event_cancelled",
    "estimatedArrival": "2024-01-20T00:00:00Z",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

### Get Refund Status
```http
GET /refunds/{refundId}
Authorization: Bearer {userToken}
```

### Bulk Refunds
```http
POST /refunds/bulk
Authorization: Bearer {organizerToken}
Content-Type: application/json

{
  "eventId": "evt_123456789",
  "reason": "event_cancelled",
  "refundPolicy": "full",
  "paymentIds": [
    "pay_111111111",
    "pay_222222222",
    "pay_333333333"
  ]
}
```

## Organizer Payouts

### Get Payout Summary
```http
GET /payouts/summary
Authorization: Bearer {organizerToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "availableBalance": 15750.00,
    "pendingBalance": 2250.00,
    "totalEarnings": 18000.00,
    "platformFees": 900.00,
    "processingFees": 540.00,
    "nextPayoutDate": "2024-01-22T00:00:00Z",
    "currency": "USD"
  }
}
```

### Request Payout
```http
POST /payouts/request
Authorization: Bearer {organizerToken}
Content-Type: application/json

{
  "amount": 15750.00,
  "bankAccountId": "ba_987654321"
}
```

### Get Payout History
```http
GET /payouts/history?page=1&limit=20
Authorization: Bearer {organizerToken}
```

## Bank Accounts (Organizers)

### Add Bank Account
```http
POST /bank-accounts
Authorization: Bearer {organizerToken}
Content-Type: application/json

{
  "accountHolderName": "Festival Productions Inc.",
  "accountNumber": "123456789",
  "routingNumber": "021000021",
  "accountType": "checking",
  "currency": "USD"
}
```

### Get Bank Accounts
```http
GET /bank-accounts
Authorization: Bearer {organizerToken}
```

## Payment Analytics

### Get Payment Statistics
```http
GET /analytics/stats?eventId=evt_123456789&period=daily&startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer {organizerToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRevenue": 2250000.00,
    "totalTransactions": 15000,
    "averageOrderValue": 150.00,
    "paymentMethods": {
      "card": 85.5,
      "digital_wallet": 12.3,
      "bank_transfer": 2.2
    },
    "refundRate": 2.1,
    "chargebackRate": 0.1,
    "dailyBreakdown": [...]
  }
}
```

### Get Revenue Breakdown
```http
GET /analytics/revenue?eventId=evt_123456789
Authorization: Bearer {organizerToken}
```

## Webhooks

### Payment Webhook Events
EventChain sends webhooks for payment events:

```http
POST {your_webhook_url}
Content-Type: application/json
X-EventChain-Signature: sha256=...

{
  "id": "evt_webhook_123",
  "type": "payment.succeeded",
  "data": {
    "paymentId": "pay_111111111",
    "orderId": "ord_987654321",
    "amount": 285.00,
    "currency": "USD",
    "status": "succeeded"
  },
  "createdAt": "2024-01-15T10:00:00Z"
}
```

### Webhook Event Types
- `payment.succeeded`: Payment completed successfully
- `payment.failed`: Payment failed
- `payment.requires_action`: Payment requires additional authentication
- `refund.created`: Refund initiated
- `refund.succeeded`: Refund completed
- `refund.failed`: Refund failed
- `payout.created`: Payout initiated
- `payout.paid`: Payout completed

## Supported Payment Methods

### Credit/Debit Cards
- Visa, Mastercard, American Express, Discover
- 3D Secure authentication support
- Saved card tokenization

### Digital Wallets
- Apple Pay
- Google Pay
- PayPal

### Bank Transfers
- ACH (US)
- SEPA (EU)
- Wire transfers for large amounts

### Cryptocurrency (Beta)
- Bitcoin (BTC)
- Ethereum (ETH)
- USDC

## Currency Support
- USD (US Dollar)
- EUR (Euro)
- GBP (British Pound)
- CAD (Canadian Dollar)
- AUD (Australian Dollar)

## Fee Structure

### Platform Fees
- Standard events: 2.9% + $0.30 per transaction
- Premium events: 2.4% + $0.30 per transaction
- Enterprise: Custom pricing

### Processing Fees
- Card payments: Included in platform fee
- Digital wallets: +0.5%
- International cards: +1.5%
- Currency conversion: +2.0%

## Error Responses

### Common Error Codes
- `PAY_001`: Payment method declined
- `PAY_002`: Insufficient funds
- `PAY_003`: Invalid payment method
- `PAY_004`: Payment requires authentication
- `PAY_005`: Refund not allowed
- `PAY_006`: Payout failed
- `PAY_007`: Currency not supported

## Rate Limiting
- Payment processing: 100 per minute per user
- Refund requests: 50 per hour per organizer
- Payout requests: 10 per day per organizer

## Security
- PCI DSS Level 1 compliant
- End-to-end encryption
- Fraud detection and prevention
- 3D Secure authentication
- Webhook signature verification