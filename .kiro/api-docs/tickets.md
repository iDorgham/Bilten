# Tickets API Documentation

## Overview
The EventChain Tickets API handles ticket purchasing, management, and validation. It supports various ticket types, pricing tiers, and blockchain-based verification.

## Base URL
```
Production: https://api.eventchain.com/v1/tickets
Staging: https://staging-api.eventchain.com/v1/tickets
Development: http://localhost:3001/v1/tickets
```

## Ticket Purchase

### Purchase Tickets
```http
POST /purchase
Authorization: Bearer {userToken}
Content-Type: application/json

{
  "eventId": "evt_123456789",
  "tickets": [
    {
      "tierId": "tier_general",
      "quantity": 2,
      "attendeeInfo": [
        {
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com"
        },
        {
          "firstName": "Jane",
          "lastName": "Smith",
          "email": "jane@example.com"
        }
      ]
    }
  ],
  "paymentMethodId": "pm_1234567890",
  "promoCode": "EARLY2024"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "ord_987654321",
    "tickets": [
      {
        "id": "tkt_111111111",
        "eventId": "evt_123456789",
        "tierId": "tier_general",
        "attendeeName": "John Doe",
        "attendeeEmail": "john@example.com",
        "qrCode": "https://cdn.eventchain.com/qr/tkt_111111111.png",
        "blockchainHash": "0x1234567890abcdef...",
        "status": "active"
      },
      {
        "id": "tkt_222222222",
        "eventId": "evt_123456789",
        "tierId": "tier_general",
        "attendeeName": "Jane Smith",
        "attendeeEmail": "jane@example.com",
        "qrCode": "https://cdn.eventchain.com/qr/tkt_222222222.png",
        "blockchainHash": "0xabcdef1234567890...",
        "status": "active"
      }
    ],
    "totalAmount": 300.00,
    "fees": 15.00,
    "discount": 30.00,
    "finalAmount": 285.00
  }
}
```

### Get Purchase Quote
```http
POST /quote
Authorization: Bearer {userToken}
Content-Type: application/json

{
  "eventId": "evt_123456789",
  "tickets": [
    {
      "tierId": "tier_general",
      "quantity": 2
    }
  ],
  "promoCode": "EARLY2024"
}
```

## Ticket Management

### Get User Tickets
```http
GET /my-tickets?status=active&page=1&limit=20
Authorization: Bearer {userToken}
```

**Query Parameters:**
- `status`: Filter by ticket status (active, used, cancelled, refunded)
- `eventId`: Filter by specific event
- `page`: Page number
- `limit`: Results per page

### Get Ticket Details
```http
GET /{ticketId}
Authorization: Bearer {userToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "tkt_111111111",
    "eventId": "evt_123456789",
    "event": {
      "title": "Summer Music Festival 2024",
      "startDate": "2024-07-15T18:00:00Z",
      "venue": {
        "name": "Central Park",
        "address": "New York, NY 10024"
      }
    },
    "tier": {
      "name": "General Admission",
      "price": 150.00,
      "benefits": ["Event access", "Parking included"]
    },
    "attendeeName": "John Doe",
    "attendeeEmail": "john@example.com",
    "purchaseDate": "2024-01-15T10:00:00Z",
    "qrCode": "https://cdn.eventchain.com/qr/tkt_111111111.png",
    "blockchainHash": "0x1234567890abcdef...",
    "status": "active",
    "transferable": true,
    "refundable": true
  }
}
```

### Transfer Ticket
```http
POST /{ticketId}/transfer
Authorization: Bearer {userToken}
Content-Type: application/json

{
  "recipientEmail": "recipient@example.com",
  "recipientName": "New Owner",
  "message": "Enjoy the event!"
}
```

### Cancel/Refund Ticket
```http
POST /{ticketId}/refund
Authorization: Bearer {userToken}
Content-Type: application/json

{
  "reason": "Cannot attend due to schedule conflict"
}
```

## Ticket Validation

### Validate Ticket (Entry Scanning)
```http
POST /validate
Authorization: Bearer {scannerToken}
Content-Type: application/json

{
  "ticketId": "tkt_111111111",
  "eventId": "evt_123456789",
  "scanLocation": "Main Entrance",
  "scannerDeviceId": "scanner_001"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "ticket": {
      "id": "tkt_111111111",
      "attendeeName": "John Doe",
      "tierName": "General Admission",
      "status": "used",
      "entryTime": "2024-07-15T17:45:00Z"
    },
    "message": "Entry granted"
  }
}
```

### Bulk Validate Tickets
```http
POST /validate/bulk
Authorization: Bearer {scannerToken}
Content-Type: application/json

{
  "eventId": "evt_123456789",
  "tickets": [
    {
      "ticketId": "tkt_111111111",
      "scanLocation": "Main Entrance"
    },
    {
      "ticketId": "tkt_222222222",
      "scanLocation": "VIP Entrance"
    }
  ]
}
```

## Ticket Analytics

### Get Event Ticket Statistics
```http
GET /analytics/{eventId}
Authorization: Bearer {organizerToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSold": 15000,
    "totalRevenue": 2250000.00,
    "byTier": [
      {
        "tierId": "tier_general",
        "name": "General Admission",
        "sold": 12000,
        "available": 18000,
        "revenue": 1800000.00
      },
      {
        "tierId": "tier_vip",
        "name": "VIP",
        "sold": 3000,
        "available": 2000,
        "revenue": 450000.00
      }
    ],
    "salesByDate": [...],
    "refunds": {
      "count": 150,
      "amount": 22500.00
    }
  }
}
```

### Get Attendance Data
```http
GET /analytics/{eventId}/attendance
Authorization: Bearer {organizerToken}
```

## Promo Codes

### Create Promo Code
```http
POST /promo-codes
Authorization: Bearer {organizerToken}
Content-Type: application/json

{
  "code": "EARLY2024",
  "eventId": "evt_123456789",
  "discountType": "percentage",
  "discountValue": 10,
  "maxUses": 1000,
  "validFrom": "2024-01-01T00:00:00Z",
  "validUntil": "2024-03-01T23:59:59Z",
  "applicableTiers": ["tier_general", "tier_vip"]
}
```

### Validate Promo Code
```http
GET /promo-codes/{code}/validate?eventId=evt_123456789
```

## Ticket Status Values
- `active`: Valid ticket, not yet used
- `used`: Ticket has been scanned for entry
- `cancelled`: Ticket cancelled by user
- `refunded`: Ticket refunded
- `transferred`: Ticket transferred to another user
- `expired`: Ticket expired (event passed)

## Blockchain Integration

### Get Blockchain Verification
```http
GET /{ticketId}/blockchain
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ticketId": "tkt_111111111",
    "blockchainHash": "0x1234567890abcdef...",
    "blockNumber": 18500000,
    "transactionHash": "0xabcdef1234567890...",
    "verified": true,
    "timestamp": "2024-01-15T10:00:00Z"
  }
}
```

## Error Responses

### Common Error Codes
- `TICKET_001`: Ticket not found
- `TICKET_002`: Ticket already used
- `TICKET_003`: Invalid ticket for event
- `TICKET_004`: Ticket not transferable
- `TICKET_005`: Refund period expired
- `TICKET_006`: Insufficient ticket availability
- `TICKET_007`: Invalid promo code

## Rate Limiting
- Ticket purchases: 10 per minute per user
- Ticket validation: 1000 per minute per scanner
- Ticket transfers: 5 per hour per user