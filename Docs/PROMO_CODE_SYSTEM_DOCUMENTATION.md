# Promo Code System Documentation

## Overview

The Bilten promo code system provides event organizers with comprehensive tools to create, manage, and track discount codes for their events. The system includes both backend API endpoints and frontend React components for a complete user experience.

## Features

### For Event Organizers
- **Create Discount Codes**: Generate percentage or fixed amount discounts
- **Manage Codes**: Edit, activate/deactivate, and delete promo codes
- **Usage Analytics**: Track usage statistics and conversion rates
- **Flexible Configuration**: Set usage limits, validity periods, and applicability rules
- **Real-time Monitoring**: View active codes and their performance

### For Users
- **Easy Application**: Simple input field during checkout
- **Real-time Validation**: Instant feedback on code validity
- **Clear Display**: Shows applied discounts and final amounts
- **Usage Tracking**: Prevents duplicate usage per user

## Database Schema

### Tables

#### `promo_codes`
```sql
- id (UUID, Primary Key)
- code (String, Unique)
- name (String)
- description (Text, Optional)
- discount_type (Enum: 'percentage', 'fixed_amount')
- discount_value (Decimal)
- minimum_order_amount (Decimal)
- maximum_discount_amount (Decimal, Optional)
- max_uses (Integer, Optional)
- used_count (Integer)
- max_uses_per_user (Integer)
- valid_from (Timestamp)
- valid_until (Timestamp, Optional)
- applicable_events (JSON, Optional)
- applicable_ticket_types (JSON, Optional)
- is_active (Boolean)
- created_by (UUID, Foreign Key to users)
- created_at (Timestamp)
- updated_at (Timestamp)
```

#### `promo_code_usage`
```sql
- id (UUID, Primary Key)
- promo_code_id (UUID, Foreign Key)
- user_id (UUID, Foreign Key)
- order_id (UUID, Foreign Key)
- discount_amount (Decimal)
- used_at (Timestamp)
```

#### `orders` (Extended)
```sql
- promo_code_id (UUID, Foreign Key, Optional)
- discount_amount (Decimal)
- promo_code_used (String, Optional)
```

## API Endpoints

### Base URL
```
/api/v1/promo-codes
```

### Endpoints

#### 1. Create Promo Code
```http
POST /api/v1/promo-codes
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "SUMMER2024",
  "name": "Summer Sale",
  "description": "20% off all tickets",
  "discountType": "percentage",
  "discountValue": 20,
  "minimumOrderAmount": 50,
  "maximumDiscountAmount": 100,
  "maxUses": 100,
  "maxUsesPerUser": 1,
  "validFrom": "2024-06-01T00:00:00Z",
  "validUntil": "2024-08-31T23:59:59Z",
  "applicableEvents": ["event-id-1", "event-id-2"],
  "applicableTicketTypes": ["vip", "general"],
  "isActive": true
}
```

#### 2. Get All Promo Codes
```http
GET /api/v1/promo-codes?page=1&limit=10&isActive=true&eventId=event-id
Authorization: Bearer <token>
```

#### 3. Get Promo Code by ID
```http
GET /api/v1/promo-codes/{id}
Authorization: Bearer <token>
```

#### 4. Update Promo Code
```http
PUT /api/v1/promo-codes/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Summer Sale",
  "discountValue": 25,
  "isActive": false
}
```

#### 5. Delete Promo Code
```http
DELETE /api/v1/promo-codes/{id}
Authorization: Bearer <token>
```

#### 6. Validate Promo Code
```http
POST /api/v1/promo-codes/{code}/validate
Authorization: Bearer <token>
Content-Type: application/json

{
  "eventId": "event-id",
  "ticketTypes": ["vip", "general"],
  "orderAmount": 150.00
}
```

#### 7. Validate for Checkout
```http
POST /api/v1/promo-codes/validate-checkout
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "SUMMER2024",
  "eventId": "event-id",
  "ticketTypes": ["vip", "general"],
  "orderAmount": 150.00
}
```

#### 8. Get Active Promo Codes for Event
```http
GET /api/v1/promo-codes/event/{eventId}/active
```

#### 9. Get Usage History
```http
GET /api/v1/promo-codes/{id}/usage-history?timeRange=30d
Authorization: Bearer <token>
```

## Frontend Components

### 1. PromoCodeManagement

A comprehensive component for event organizers to manage their discount codes.

#### Props
```javascript
{
  eventId: string,        // Optional: Filter codes for specific event
  onClose: function       // Optional: Callback when component is closed
}
```

#### Features
- Create new promo codes with form validation
- Edit existing codes
- View all codes in a table format
- Activate/deactivate codes
- Delete codes with confirmation
- Real-time status indicators
- Usage statistics display

#### Usage Example
```jsx
import PromoCodeManagement from '../components/PromoCodeManagement';

function OrganizerDashboard() {
  return (
    <div>
      <h1>Event Management</h1>
      <PromoCodeManagement 
        eventId="event-123"
        onClose={() => setShowPromoManagement(false)}
      />
    </div>
  );
}
```

### 2. PromoCodeInput

A component for users to enter and apply promo codes during checkout.

#### Props
```javascript
{
  eventId: string,                    // Required: Event ID
  ticketTypes: array,                 // Optional: Selected ticket types
  orderAmount: number,                // Required: Total order amount
  onPromoCodeApplied: function,       // Optional: Callback when code is applied
  onPromoCodeRemoved: function,       // Optional: Callback when code is removed
  className: string                   // Optional: Additional CSS classes
}
```

#### Features
- Real-time validation
- Success/error messaging
- Applied code display with discount details
- Easy removal of applied codes
- Keyboard support (Enter to apply)

#### Usage Example
```jsx
import PromoCodeInput from '../components/PromoCodeInput';

function CheckoutPage() {
  const [appliedPromoCode, setAppliedPromoCode] = useState(null);
  
  const handlePromoCodeApplied = (promoData) => {
    setAppliedPromoCode(promoData);
    // Update order total with discount
  };
  
  const handlePromoCodeRemoved = () => {
    setAppliedPromoCode(null);
    // Recalculate order total without discount
  };
  
  return (
    <div>
      <h2>Checkout</h2>
      <PromoCodeInput
        eventId="event-123"
        ticketTypes={["vip", "general"]}
        orderAmount={150.00}
        onPromoCodeApplied={handlePromoCodeApplied}
        onPromoCodeRemoved={handlePromoCodeRemoved}
      />
      {/* Rest of checkout form */}
    </div>
  );
}
```

### 3. PromoCodeAnalytics

A detailed analytics component for viewing promo code performance.

#### Props
```javascript
{
  eventId: string,        // Required: Event ID
  promoCodeId: string     // Required: Promo code ID to analyze
}
```

#### Features
- Usage statistics overview
- Conversion rate calculation
- Average discount per use
- Usage history table
- Time range filtering
- Visual status indicators

#### Usage Example
```jsx
import PromoCodeAnalytics from '../components/PromoCodeAnalytics';

function PromoCodeDetails({ promoCodeId }) {
  return (
    <div>
      <h1>Promo Code Analytics</h1>
      <PromoCodeAnalytics 
        eventId="event-123"
        promoCodeId={promoCodeId}
      />
    </div>
  );
}
```

## Integration Examples

### 1. Adding Promo Code Management to Organizer Dashboard

```jsx
import React, { useState } from 'react';
import PromoCodeManagement from '../components/PromoCodeManagement';

function OrganizerDashboard() {
  const [activeTab, setActiveTab] = useState('events');
  const [selectedEvent, setSelectedEvent] = useState(null);

  return (
    <div className="organizer-dashboard">
      <nav className="dashboard-nav">
        <button 
          className={activeTab === 'events' ? 'active' : ''}
          onClick={() => setActiveTab('events')}
        >
          Events
        </button>
        <button 
          className={activeTab === 'promo-codes' ? 'active' : ''}
          onClick={() => setActiveTab('promo-codes')}
        >
          Promo Codes
        </button>
      </nav>

      <div className="dashboard-content">
        {activeTab === 'events' && (
          <div>
            {/* Events management */}
          </div>
        )}
        
        {activeTab === 'promo-codes' && (
          <PromoCodeManagement 
            eventId={selectedEvent?.id}
          />
        )}
      </div>
    </div>
  );
}
```

### 2. Integrating Promo Code Input in Checkout

```jsx
import React, { useState, useEffect } from 'react';
import PromoCodeInput from '../components/PromoCodeInput';

function CheckoutPage() {
  const [cart, setCart] = useState([]);
  const [promoCode, setPromoCode] = useState(null);
  const [orderTotal, setOrderTotal] = useState(0);
  const [finalTotal, setFinalTotal] = useState(0);

  useEffect(() => {
    calculateTotals();
  }, [cart, promoCode]);

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    setOrderTotal(subtotal);
    
    if (promoCode) {
      setFinalTotal(promoCode.finalAmount);
    } else {
      setFinalTotal(subtotal);
    }
  };

  const handlePromoCodeApplied = (promoData) => {
    setPromoCode(promoData);
  };

  const handlePromoCodeRemoved = () => {
    setPromoCode(null);
  };

  return (
    <div className="checkout-page">
      <div className="checkout-summary">
        <h2>Order Summary</h2>
        
        {/* Cart items */}
        {cart.map(item => (
          <div key={item.id} className="cart-item">
            <span>{item.name}</span>
            <span>${item.price * item.quantity}</span>
          </div>
        ))}
        
        <div className="order-totals">
          <div className="subtotal">
            <span>Subtotal:</span>
            <span>${orderTotal.toFixed(2)}</span>
          </div>
          
          {promoCode && (
            <div className="discount">
              <span>Discount ({promoCode.promoCode.code}):</span>
              <span>-${promoCode.discountAmount.toFixed(2)}</span>
            </div>
          )}
          
          <div className="final-total">
            <span>Total:</span>
            <span>${finalTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="checkout-form">
        <h2>Checkout</h2>
        
        <PromoCodeInput
          eventId="event-123"
          ticketTypes={cart.map(item => item.ticketType)}
          orderAmount={orderTotal}
          onPromoCodeApplied={handlePromoCodeApplied}
          onPromoCodeRemoved={handlePromoCodeRemoved}
        />
        
        {/* Payment form */}
        <form onSubmit={handleSubmit}>
          {/* Payment fields */}
          <button type="submit">
            Pay ${finalTotal.toFixed(2)}
          </button>
        </form>
      </div>
    </div>
  );
}
```

### 3. Adding Analytics to Promo Code Details

```jsx
import React, { useState } from 'react';
import PromoCodeAnalytics from '../components/PromoCodeAnalytics';

function PromoCodeDetailsPage({ promoCodeId }) {
  const [showAnalytics, setShowAnalytics] = useState(false);

  return (
    <div className="promo-code-details">
      <div className="page-header">
        <h1>Promo Code Details</h1>
        <button 
          onClick={() => setShowAnalytics(!showAnalytics)}
          className="btn btn-primary"
        >
          {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
        </button>
      </div>

      {showAnalytics && (
        <PromoCodeAnalytics 
          eventId="event-123"
          promoCodeId={promoCodeId}
        />
      )}
    </div>
  );
}
```

## Validation Rules

### Promo Code Creation
- **Code**: 3-20 characters, uppercase letters and numbers only
- **Name**: 1-100 characters
- **Description**: Optional, max 500 characters
- **Discount Value**: Must be positive
- **Percentage Discount**: Cannot exceed 100%
- **Usage Limits**: Must be positive integers
- **Validity Period**: Valid until must be after valid from

### Promo Code Application
- Code must be active
- Current time must be within validity period
- Order amount must meet minimum requirement
- Usage limits must not be exceeded
- User must not have exceeded per-user limit
- Event and ticket type restrictions must be satisfied

## Error Handling

### Common Error Messages
- "Promo code not found"
- "Promo code is not yet active"
- "Promo code has expired"
- "Minimum order amount of $X required"
- "Promo code is not applicable to this event"
- "Promo code is not applicable to selected ticket types"
- "Promo code usage limit reached"
- "You have already used this promo code the maximum number of times"

### Error States in Components
- Loading states with spinners
- Error messages with dismiss options
- Success confirmations
- Validation feedback
- Network error handling

## Security Considerations

### Authorization
- Only organizers and admins can create/manage promo codes
- Users can only validate and apply codes
- Usage tracking prevents abuse

### Validation
- Server-side validation for all inputs
- SQL injection protection
- Rate limiting on validation endpoints
- Input sanitization

### Data Protection
- Sensitive user data is not exposed in analytics
- Usage history is limited to authorized users
- Audit trail for all promo code operations

## Performance Optimization

### Database Indexes
- Index on `promo_codes.code` for fast lookups
- Index on `promo_codes.is_active` for filtering
- Index on `promo_codes.valid_from, valid_until` for date queries
- Index on `promo_code_usage.promo_code_id, user_id` for usage tracking

### Caching
- Active promo codes can be cached
- Usage statistics can be cached with TTL
- Validation results can be cached briefly

### Pagination
- Large result sets are paginated
- Usage history is limited to recent entries
- Analytics data is aggregated efficiently

## Testing

### Unit Tests
- Promo code validation logic
- Discount calculation functions
- Usage tracking methods
- Component rendering and interactions

### Integration Tests
- API endpoint functionality
- Database operations
- Authentication and authorization
- Error handling scenarios

### End-to-End Tests
- Complete promo code workflow
- Checkout process with promo codes
- Analytics dashboard functionality
- User experience flows

## Deployment

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=your-jwt-secret

# API Configuration
API_BASE_URL=http://localhost:3001/api/v1
```

### Database Migrations
```bash
# Run migrations
npm run migrate

# Seed sample data
npm run seed
```

### Frontend Build
```bash
# Install dependencies
npm install

# Build for production
npm run build
```

## Support and Maintenance

### Monitoring
- Track promo code usage patterns
- Monitor for abuse or unusual activity
- Alert on system errors or performance issues

### Maintenance
- Regular database cleanup of expired codes
- Archive old usage data
- Update validation rules as needed
- Monitor and optimize performance

### Troubleshooting
- Check database connectivity
- Verify JWT token validity
- Review API endpoint logs
- Test promo code validation logic
- Check frontend component state

## Future Enhancements

### Planned Features
- Bulk promo code generation
- Advanced analytics with charts
- Email notifications for code usage
- Integration with marketing tools
- A/B testing for promo codes
- Automated code generation based on events
- Social media sharing of promo codes
- Loyalty program integration

### Technical Improvements
- Real-time analytics updates
- Advanced caching strategies
- Mobile-optimized components
- Offline support for validation
- Enhanced security measures
- Performance optimizations
- Accessibility improvements
