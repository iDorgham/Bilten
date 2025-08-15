# Bilten Payment System Documentation

## 🎯 Overview

The Bilten Payment System is a comprehensive payment processing solution built with Stripe integration, providing secure and reliable payment processing for event ticket purchases. The system includes both backend API endpoints and frontend components for a complete payment experience.

## 🏗️ Architecture

### Components
- **Backend API**: Node.js/Express with Stripe integration
- **Frontend**: React with Stripe Elements
- **Database**: PostgreSQL with Knex.js ORM
- **Webhooks**: Real-time payment event handling
- **Security**: JWT authentication and PCI compliance

### Payment Flow
1. **User Selection**: User selects event and tickets
2. **Checkout**: User proceeds to checkout page
3. **Payment Intent**: Backend creates Stripe payment intent
4. **Payment Processing**: Frontend processes payment with Stripe Elements
5. **Confirmation**: Backend confirms payment and creates tickets
6. **Webhook**: Real-time order status updates via webhooks

## 💳 Payment Features

### Supported Payment Methods
- **Credit/Debit Cards**: Visa, Mastercard, American Express, Discover, Diners Club, JCB, UnionPay
- **Digital Wallets**: Apple Pay, Google Pay (ready for implementation)
- **Future**: PayPal, ACH, SEPA bank transfers

### Fee Structure
- **Standard Events**: 2.9% + $0.30 per transaction
- **Premium Events**: 2.4% + $0.30 per transaction
- **Enterprise**: 1.9% + $0.30 per transaction

### Security Features
- PCI DSS compliance through Stripe
- Card data never touches our servers
- 3D Secure authentication support
- Fraud detection and prevention
- Secure webhook signature verification

## 🔧 Backend API Endpoints

### Payment Endpoints

#### Create Payment Intent
```http
POST /v1/payments/create-payment-intent
Authorization: Bearer {token}
Content-Type: application/json

{
  "eventId": "event-uuid",
  "tickets": [
    {
      "ticketId": "ticket-uuid",
      "quantity": 2
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "clientSecret": "pi_xxx_secret_xxx",
    "orderId": "order-uuid",
    "orderNumber": "BLT-1234567890-ABC123",
    "subtotal": 150.00,
    "fees": 4.65,
    "total": 154.65,
    "items": [...]
  }
}
```

#### Confirm Payment
```http
POST /v1/payments/confirm
Authorization: Bearer {token}
Content-Type: application/json

{
  "paymentIntentId": "pi_xxx"
}
```

#### Get Orders
```http
GET /v1/payments/orders?page=1&limit=10&status=completed
Authorization: Bearer {token}
```

#### Get Order Details
```http
GET /v1/payments/orders/{orderId}
Authorization: Bearer {token}
```

### Webhook Endpoints

#### Stripe Webhook
```http
POST /v1/webhooks/stripe
Content-Type: application/json
X-Stripe-Signature: {signature}

{
  "id": "evt_xxx",
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_xxx",
      "status": "succeeded",
      "metadata": {
        "orderId": "order-uuid"
      }
    }
  }
}
```

## 🎨 Frontend Components

### Checkout Page (`/checkout`)
- **Order Summary**: Displays selected tickets and pricing
- **Payment Form**: Stripe Elements integration
- **Customer Information**: User details and order number
- **Security Indicators**: SSL and PCI compliance badges

### Payment Form Features
- **Card Element**: Secure card input with real-time validation
- **Error Handling**: User-friendly error messages
- **Loading States**: Visual feedback during processing
- **Success Confirmation**: Payment success page with redirect

### Integration Points
- **Event Details**: "Get Tickets" button navigates to checkout
- **Order History**: View past orders and payment status
- **Order Details**: Complete order information and tickets

## 🗄️ Database Schema

### Orders Table
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  event_id UUID REFERENCES events(id),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  subtotal DECIMAL(10,2) NOT NULL,
  fees DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  stripe_payment_intent_id VARCHAR(100),
  stripe_charge_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Order Items Table
```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  ticket_id UUID REFERENCES tickets(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### User Tickets Table
```sql
CREATE TABLE user_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  order_id UUID REFERENCES orders(id),
  ticket_id UUID REFERENCES tickets(id),
  ticket_number VARCHAR(100) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  qr_code TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🔐 Security Implementation

### Authentication
- JWT token required for all payment operations
- User must be authenticated to access checkout
- Session validation on each request

### Data Protection
- Card data never stored on our servers
- Stripe handles all sensitive payment information
- Encrypted database connections
- HTTPS enforcement

### Webhook Security
- Stripe signature verification
- Endpoint secret validation
- Idempotency key handling
- Error logging and monitoring

## 🧪 Testing

### Test Cards
```javascript
// Successful payments
Visa: 4242424242424242
Mastercard: 5555555555554444
American Express: 378282246310005

// Failed payments
Declined: 4000000000000002
Insufficient funds: 4000000000009995
Expired card: 4000000000000069
```

### Test Environment
- Stripe test mode enabled in development
- Mock payment processing available
- Test webhook endpoints
- Sandbox database

## 🚀 Deployment

### Environment Variables
```bash
# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bilten_dev
DB_USER=bilten_user
DB_PASSWORD=bilten_password

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

### Production Checklist
- [ ] Stripe live keys configured
- [ ] Webhook endpoints registered
- [ ] SSL certificates installed
- [ ] Database backups configured
- [ ] Monitoring and alerting set up
- [ ] Error tracking implemented

## 📊 Monitoring & Analytics

### Payment Metrics
- Transaction success rates
- Average order value
- Payment method distribution
- Refund rates
- Dispute handling

### Error Tracking
- Failed payment attempts
- Webhook processing errors
- Database transaction failures
- API response times

## 🔄 Webhook Events

### Payment Events
- `payment_intent.succeeded`: Payment completed
- `payment_intent.payment_failed`: Payment failed
- `payment_intent.canceled`: Payment canceled
- `payment_intent.requires_action`: 3D Secure required

### Refund Events
- `charge.refunded`: Refund processed
- `charge.refund.updated`: Refund status updated

### Dispute Events
- `charge.dispute.created`: Dispute initiated
- `charge.dispute.closed`: Dispute resolved
- `charge.dispute.funds_reinstated`: Funds returned
- `charge.dispute.funds_withdrawn`: Funds withdrawn

## 🛠️ Development

### Local Development
```bash
# Start services
docker-compose up -d postgres redis

# Run migrations
docker exec -it bilten-api npm run db:migrate

# Seed database
docker exec -it bilten-api npm run db:seed

# Start development server
npm run dev
```

### Testing Payment Flow
1. Navigate to an event page
2. Select tickets and click "Get Tickets"
3. Complete checkout with test card
4. Verify order creation and ticket generation
5. Check webhook processing

### Debugging
- Stripe dashboard for payment monitoring
- Webhook logs in application
- Database queries for order tracking
- Frontend console for client-side errors

## 📚 API Documentation

### Error Responses
```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  }
}
```

### Common Error Codes
- `PAYMENT_INTENT_FAILED`: Payment processing failed
- `INSUFFICIENT_TICKETS`: Not enough tickets available
- `INVALID_TICKET_DATA`: Invalid ticket selection
- `ORDER_NOT_FOUND`: Order not found
- `PAYMENT_ALREADY_COMPLETED`: Payment already processed

## 🔮 Future Enhancements

### Planned Features
- **Subscription Payments**: Recurring event payments
- **Split Payments**: Multiple payment methods
- **International Payments**: Multi-currency support
- **Payment Plans**: Installment payments
- **Gift Cards**: Gift card integration
- **Loyalty Program**: Points and rewards

### Technical Improvements
- **Caching**: Redis caching for payment data
- **Queue System**: Background payment processing
- **Analytics**: Advanced payment analytics
- **Mobile SDK**: Native mobile payment integration
- **API Versioning**: Backward compatibility

## 📞 Support

### Documentation
- [Stripe Documentation](https://stripe.com/docs)
- [React Stripe Elements](https://stripe.com/docs/stripe-js/react)
- [Webhook Guide](https://stripe.com/docs/webhooks)

### Contact
- **Technical Support**: dev@bilten.com
- **Payment Issues**: payments@bilten.com
- **Security Concerns**: security@bilten.com

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Status**: Production Ready ✅
