# REST API Reference

## 📋 Overview

Complete REST API reference for the Bilten platform with all endpoints, request/response examples, and error handling.

## 🔗 Base URL

- **Production**: `https://api.bilten.com/api/v1`
- **Sandbox**: `https://api-sandbox.bilten.com/api/v1`

## 📊 Common Response Format

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "meta": {
    "timestamp": "2024-12-01T10:00:00Z",
    "version": "1.0"
  }
}
```

## 🎫 Events API

### Get Events
```http
GET /events
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 100)
- `status` (string): Filter by status (draft, published, cancelled)
- `category` (string): Filter by category
- `date_from` (string): Filter events from date (ISO 8601)
- `date_to` (string): Filter events to date (ISO 8601)

**Response:**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "event_123",
        "title": "Tech Conference 2024",
        "description": "Annual technology conference",
        "eventDate": "2024-06-15T09:00:00Z",
        "status": "published",
        "category": "technology",
        "location": {
          "name": "Convention Center",
          "address": "123 Main St, City, State"
        },
        "tickets": [
          {
            "id": "ticket_456",
            "name": "General Admission",
            "price": 50.00,
            "available": 100
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 150,
      "pages": 15
    }
  }
}
```

### Create Event
```http
POST /events
```

**Request Body:**
```json
{
  "title": "Tech Conference 2024",
  "description": "Annual technology conference",
  "eventDate": "2024-06-15T09:00:00Z",
  "category": "technology",
  "location": {
    "name": "Convention Center",
    "address": "123 Main St, City, State"
  },
  "tickets": [
    {
      "name": "General Admission",
      "price": 50.00,
      "quantity": 100
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "event_123",
    "title": "Tech Conference 2024",
    "status": "draft",
    "createdAt": "2024-12-01T10:00:00Z"
  }
}
```

### Get Event by ID
```http
GET /events/{event_id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "event_123",
    "title": "Tech Conference 2024",
    "description": "Annual technology conference",
    "eventDate": "2024-06-15T09:00:00Z",
    "status": "published",
    "category": "technology",
    "location": {
      "name": "Convention Center",
      "address": "123 Main St, City, State"
    },
    "tickets": [
      {
        "id": "ticket_456",
        "name": "General Admission",
        "price": 50.00,
        "available": 100,
        "sold": 25
      }
    ],
    "analytics": {
      "views": 1250,
      "registrations": 75,
      "revenue": 3750.00
    }
  }
}
```

## 🎟️ Tickets API

### Get Tickets
```http
GET /events/{event_id}/tickets
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tickets": [
      {
        "id": "ticket_456",
        "name": "General Admission",
        "description": "Access to all sessions",
        "price": 50.00,
        "quantity": 100,
        "available": 75,
        "sold": 25,
        "status": "active"
      }
    ]
  }
}
```

### Purchase Ticket
```http
POST /tickets/purchase
```

**Request Body:**
```json
{
  "eventId": "event_123",
  "ticketId": "ticket_456",
  "quantity": 2,
  "customer": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  },
  "paymentMethod": {
    "type": "card",
    "token": "tok_visa"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "order_789",
    "tickets": [
      {
        "id": "ticket_instance_001",
        "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
        "status": "confirmed"
      }
    ],
    "total": 100.00,
    "status": "paid"
  }
}
```

## 👥 Users API

### Get User Profile
```http
GET /users/me
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "organizer",
    "organizations": [
      {
        "id": "org_456",
        "name": "Tech Events Inc",
        "role": "admin"
      }
    ],
    "preferences": {
      "notifications": {
        "email": true,
        "sms": false
      }
    }
  }
}
```

### Update User Profile
```http
PUT /users/me
```

**Request Body:**
```json
{
  "name": "John Smith",
  "phone": "+1234567890",
  "preferences": {
    "notifications": {
      "email": true,
      "sms": true
    }
  }
}
```

## 🏢 Organizations API

### Get Organizations
```http
GET /organizations
```

**Response:**
```json
{
  "success": true,
  "data": {
    "organizations": [
      {
        "id": "org_456",
        "name": "Tech Events Inc",
        "description": "Technology event organizer",
        "website": "https://techevents.com",
        "logo": "https://cdn.bilten.com/logos/org_456.png",
        "status": "active",
        "memberCount": 15
      }
    ]
  }
}
```

### Create Organization
```http
POST /organizations
```

**Request Body:**
```json
{
  "name": "Tech Events Inc",
  "description": "Technology event organizer",
  "website": "https://techevents.com",
  "address": {
    "street": "456 Tech Ave",
    "city": "Tech City",
    "state": "CA",
    "zip": "90210",
    "country": "US"
  }
}
```

## 💳 Payments API

### Process Payment
```http
POST /payments/process
```

**Request Body:**
```json
{
  "orderId": "order_789",
  "amount": 100.00,
  "currency": "USD",
  "paymentMethod": {
    "type": "card",
    "token": "tok_visa"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "pay_123",
    "status": "succeeded",
    "amount": 100.00,
    "currency": "USD",
    "transactionId": "txn_456"
  }
}
```

## 📊 Analytics API

### Get Event Analytics
```http
GET /analytics/events/{event_id}
```

**Query Parameters:**
- `start_date` (string): Start date (ISO 8601)
- `end_date` (string): End date (ISO 8601)
- `group_by` (string): Group by (day, week, month)

**Response:**
```json
{
  "success": true,
  "data": {
    "eventId": "event_123",
    "period": {
      "start": "2024-01-01T00:00:00Z",
      "end": "2024-12-31T23:59:59Z"
    },
    "metrics": {
      "views": 12500,
      "registrations": 750,
      "ticketsSold": 650,
      "revenue": 32500.00,
      "conversionRate": 5.2
    },
    "trends": [
      {
        "date": "2024-01-01",
        "views": 100,
        "registrations": 5,
        "ticketsSold": 3,
        "revenue": 150.00
      }
    ]
  }
}
```

## 🔔 Notifications API

### Send Notification
```http
POST /notifications/send
```

**Request Body:**
```json
{
  "recipients": ["user_123", "user_456"],
  "type": "email",
  "template": "event_reminder",
  "data": {
    "eventTitle": "Tech Conference 2024",
    "eventDate": "2024-06-15T09:00:00Z"
  }
}
```

## 📁 Media API

### Upload File
```http
POST /media/upload
```

**Request Body (multipart/form-data):**
```
file: [binary file data]
type: image
folder: events
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "media_123",
    "url": "https://cdn.bilten.com/media/events/image_123.jpg",
    "filename": "event-banner.jpg",
    "size": 1024000,
    "mimeType": "image/jpeg"
  }
}
```

## ⚠️ Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  }
}
```

### Common Error Codes
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `429` - Rate Limited
- `500` - Internal Server Error

### Rate Limiting
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1640995200
```

## 📋 Pagination

### Pagination Headers
```http
X-Pagination-Page: 1
X-Pagination-Limit: 10
X-Pagination-Total: 150
X-Pagination-Pages: 15
```

### Pagination Response
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "pages": 15,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Maintained by**: API Team
