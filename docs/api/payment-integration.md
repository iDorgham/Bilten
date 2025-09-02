# Payment Integration Guide

## Overview

Bilten platform includes comprehensive payment processing with Stripe integration. This guide covers setup, usage, and testing.

## Quick Setup

### 1. Environment Configuration

Add to your `.env` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```

### 2. Automated Setup

```bash
node scripts/setup-payment-integration.js
```

### 3. Database Migration

```bash
npm run db:migrate
```

## Frontend Usage

### Payment Form

```jsx
import StripeProvider from './components/StripeProvider';
import PaymentForm from './components/PaymentForm';

<StripeProvider>
  <PaymentForm
    amount={2500} // Amount in cents
    currency="usd"
    eventId="event_123"
    onSuccess={handleSuccess}
    onError={handleError}
  />
</StripeProvider>
```

### Checkout Page

Navigate to `/checkout/:eventId` to access the checkout flow.

## Backend API

### Create Payment Intent

```bash
POST /api/v1/payment/create-payment-intent
{
  "amount": 2500,
  "currency": "usd",
  "metadata": { "eventId": "event_123" }
}
```

### Get Transactions

```bash
GET /api/v1/payment/transactions
```

### Process Refund

```bash
POST /api/v1/payment/refund
{
  "paymentIntentId": "pi_123",
  "amount": 2500
}
```

## Testing

### Test Cards

- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **3D Secure**: 4000 0025 0000 3155

### Test Commands

```bash
npm run test:payment
npm run health
```

## Security

- Webhook signature verification
- PCI DSS compliant (no card data on servers)
- 3D Secure support
- Environment-based key management

## Deployment

1. Update environment with live Stripe keys
2. Configure webhook URL in Stripe Dashboard
3. Run database migrations
4. Test payment flow

## Support

- [Stripe Documentation](https://stripe.com/docs)
- [API Reference](./rest-api.md)
- Technical Support: support@bilten.com
