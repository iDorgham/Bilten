# Promo Codes System Documentation

## Overview

The promo codes system allows event organizers to create and manage discount codes that can be applied to ticket purchases. The system supports various types of discounts, usage limits, and validation rules.

## Database Schema

### Tables

#### 1. `promo_codes`
Main table storing promo code information.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `code` | VARCHAR | Unique promo code (uppercase) |
| `name` | VARCHAR | Display name |
| `description` | TEXT | Optional description |
| `discount_type` | ENUM | 'percentage' or 'fixed_amount' |
| `discount_value` | DECIMAL(10,2) | Discount amount/percentage |
| `minimum_order_amount` | DECIMAL(10,2) | Minimum order amount required |
| `maximum_discount_amount` | DECIMAL(10,2) | Maximum discount cap |
| `max_uses` | INTEGER | Total usage limit (null = unlimited) |
| `used_count` | INTEGER | Current usage count |
| `max_uses_per_user` | INTEGER | Per-user usage limit |
| `valid_from` | TIMESTAMP | Start date |
| `valid_until` | TIMESTAMP | End date (null = no expiration) |
| `applicable_events` | JSONB | Array of event IDs (null = all events) |
| `applicable_ticket_types` | JSONB | Array of ticket types (null = all types) |
| `is_active` | BOOLEAN | Whether code is active |
| `created_by` | UUID | User who created the code |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

#### 2. `promo_code_usage`
Tracks individual usage of promo codes.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `promo_code_id` | UUID | Reference to promo_codes |
| `user_id` | UUID | User who used the code |
| `order_id` | UUID | Order where code was applied |
| `discount_amount` | DECIMAL(10,2) | Actual discount applied |
| `used_at` | TIMESTAMP | Usage timestamp |

#### 3. Updated `orders` table
Added promo code fields to existing orders table.

| Column | Type | Description |
|--------|------|-------------|
| `promo_code_id` | UUID | Reference to promo_codes |
| `discount_amount` | DECIMAL(10,2) | Discount amount applied |
| `promo_code_used` | VARCHAR | Actual code used |

## API Endpoints

### Base URL: `/api/v1/promo-codes`

#### 1. Create Promo Code
**POST** `/`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "code": "WELCOME10",
  "name": "Welcome Discount",
  "description": "10% off for new customers",
  "discountType": "percentage",
  "discountValue": 10.00,
  "minimumOrderAmount": 25.00,
  "maximumDiscountAmount": 50.00,
  "maxUses": 100,
  "maxUsesPerUser": 1,
  "validFrom": "2024-01-01T00:00:00Z",
  "validUntil": "2024-12-31T23:59:59Z",
  "applicableEvents": ["event-id-1", "event-id-2"],
  "applicableTicketTypes": ["vip", "premium"]
}
```

**Response:**
```json
{
  "message": "Promo code created successfully",
  "promoCode": {
    "id": "uuid",
    "code": "WELCOME10",
    "name": "Welcome Discount",
    "discount_type": "percentage",
    "discount_value": 10.00,
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### 2. Get All Promo Codes
**GET** `/?page=1&limit=10&isActive=true&eventId=uuid`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `isActive` (optional): Filter by active status
- `eventId` (optional): Filter by applicable events

**Response:**
```json
{
  "promoCodes": [
    {
      "id": "uuid",
      "code": "WELCOME10",
      "name": "Welcome Discount",
      "discount_type": "percentage",
      "discount_value": 10.00,
      "is_active": true,
      "used_count": 5,
      "max_uses": 100
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

#### 3. Get Promo Code by ID
**GET** `/:id`

**Response:**
```json
{
  "promoCode": {
    "id": "uuid",
    "code": "WELCOME10",
    "name": "Welcome Discount",
    "discount_type": "percentage",
    "discount_value": 10.00,
    "is_active": true
  },
  "usageStats": {
    "total_uses": 5,
    "unique_users": 3,
    "total_discount_given": 125.50
  }
}
```

#### 4. Validate Promo Code
**POST** `/:code/validate`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "eventId": "event-uuid",
  "ticketTypes": ["vip", "general"],
  "orderAmount": 100.00
}
```

**Response (Valid):**
```json
{
  "valid": true,
  "promoCode": {
    "id": "uuid",
    "code": "WELCOME10",
    "name": "Welcome Discount",
    "discount_type": "percentage",
    "discount_value": 10.00
  },
  "discountAmount": 10.00,
  "finalAmount": 90.00
}
```

**Response (Invalid):**
```json
{
  "valid": false,
  "error": "Minimum order amount of $25.00 required"
}
```

#### 5. Update Promo Code
**PUT** `/:id`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Updated Welcome Discount",
  "isActive": false
}
```

#### 6. Delete Promo Code
**DELETE** `/:id`

**Headers:**
```
Authorization: Bearer <token>
```

#### 7. Get User's Promo Codes
**GET** `/user/my-promo-codes`

**Headers:**
```
Authorization: Bearer <token>
```

#### 8. Get Active Promo Codes for Event
**GET** `/event/:eventId/active`

**Response:**
```json
{
  "promoCodes": [
    {
      "id": "uuid",
      "code": "EVENT10",
      "name": "Event Discount",
      "discount_type": "percentage",
      "discount_value": 10.00
    }
  ]
}
```

#### 9. Get Usage Statistics
**GET** `/:id/usage-stats`

**Headers:**
```
Authorization: Bearer <token>
```

## Discount Types

### 1. Percentage Discount
- Reduces order total by a percentage
- Example: 20% off = $20 discount on $100 order
- Can be capped with `maximum_discount_amount`

### 2. Fixed Amount Discount
- Reduces order total by a fixed amount
- Example: $10 off = $10 discount regardless of order amount
- Cannot exceed order total

## Validation Rules

1. **Code Format**: 3-20 characters, uppercase letters and numbers only
2. **Validity Period**: Must be within `valid_from` and `valid_until` dates
3. **Active Status**: Code must be marked as active
4. **Usage Limits**: Cannot exceed `max_uses` or `max_uses_per_user`
5. **Minimum Order**: Order amount must meet `minimum_order_amount`
6. **Event Applicability**: Must be applicable to the specific event
7. **Ticket Type Applicability**: Must be applicable to selected ticket types

## Usage Examples

### Creating a Welcome Discount
```javascript
const promoCode = await PromoCode.create({
  code: 'WELCOME10',
  name: 'Welcome Discount',
  description: '10% off for new customers',
  discountType: 'percentage',
  discountValue: 10.00,
  minimumOrderAmount: 25.00,
  maximumDiscountAmount: 50.00,
  maxUses: 100,
  maxUsesPerUser: 1,
  validFrom: new Date(),
  validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  createdBy: userId
});
```

### Validating a Promo Code
```javascript
const validation = await PromoCode.validate(
  'WELCOME10',
  userId,
  eventId,
  ['vip', 'general'],
  100.00
);

if (validation.valid) {
  const discountAmount = PromoCode.calculateDiscount(
    validation.promoCode,
    100.00
  );
  console.log(`Discount: $${discountAmount}`);
}
```

### Creating an Order with Promo Code
```javascript
const order = await Order.create({
  userId: userId,
  eventId: eventId,
  totalAmount: 90.00, // After discount
  paymentIntentId: 'pi_xxx',
  items: ticketItems,
  promoCodeId: promoCode.id,
  discountAmount: 10.00,
  promoCodeUsed: 'WELCOME10'
});
```

## Error Handling

Common error responses:

```json
{
  "error": "Promo code not found"
}
```

```json
{
  "error": "Promo code has expired"
}
```

```json
{
  "error": "Minimum order amount of $25.00 required"
}
```

```json
{
  "error": "You have already used this promo code the maximum number of times"
}
```

## Security Considerations

1. **Authentication**: All write operations require authentication
2. **Authorization**: Users can only manage their own promo codes
3. **Validation**: Comprehensive input validation on all endpoints
4. **Rate Limiting**: API endpoints are rate-limited
5. **SQL Injection**: Uses parameterized queries via Knex.js

## Testing

Run the test suite:

```bash
npm test -- --testPathPattern=promoCode.test.js
```

## Migration

To set up the promo codes system:

```bash
# Run migrations
npx knex migrate:latest

# Seed with sample data
npx knex seed:run --specific=005_promo_codes.js
```

## Performance Considerations

1. **Indexes**: Database indexes on frequently queried columns
2. **Caching**: Consider Redis caching for frequently accessed promo codes
3. **Pagination**: Large result sets are paginated
4. **Transactions**: Usage tracking uses database transactions for consistency

## Future Enhancements

1. **Bulk Operations**: Create/update multiple promo codes at once
2. **Analytics**: Advanced usage analytics and reporting
3. **Automated Expiration**: Background job to deactivate expired codes
4. **Email Integration**: Notify users when promo codes are about to expire
5. **A/B Testing**: Support for testing different discount strategies
