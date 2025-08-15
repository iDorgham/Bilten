# 🔌 API Documentation

This document provides comprehensive documentation for the Bilten API endpoints, authentication, and usage examples.

## 📋 Table of Contents

- [Authentication](#authentication)
- [Base URL](#base-url)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Endpoints](#endpoints)
  - [Authentication](#authentication-endpoints)
  - [Users](#users-endpoints)
  - [Events](#events-endpoints)
  - [Tickets](#tickets-endpoints)
  - [Orders](#orders-endpoints)
  - [Analytics](#analytics-endpoints)
  - [File Upload](#file-upload-endpoints)
  - [Search](#search-endpoints)

## 🔐 Authentication

Bilten API uses JWT (JSON Web Tokens) for authentication. Most endpoints require authentication except for public endpoints like event listing and health checks.

### Authentication Flow

1. **Register** or **Login** to get an access token
2. **Include the token** in the Authorization header
3. **Refresh the token** when it expires

### Headers

```http
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

## 🌐 Base URL

- **Development**: `http://localhost:3001/v1`
- **Production**: `https://api.bilten.com/v1`

## 📄 Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "message": "Operation completed successfully",
  "timestamp": "2025-08-15T10:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "issue": "Email is required"
    }
  },
  "timestamp": "2025-08-15T10:00:00.000Z"
}
```

## ⚠️ Error Handling

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `429` - Rate Limited
- `500` - Internal Server Error

### Error Codes

- `AUTHENTICATION_FAILED` - Invalid credentials
- `TOKEN_EXPIRED` - JWT token has expired
- `VALIDATION_ERROR` - Input validation failed
- `RESOURCE_NOT_FOUND` - Requested resource not found
- `PERMISSION_DENIED` - Insufficient permissions
- `RATE_LIMIT_EXCEEDED` - Too many requests

## 🚦 Rate Limiting

- **Public endpoints**: 100 requests per minute
- **Authenticated endpoints**: 1000 requests per minute
- **File uploads**: 10 requests per minute

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640000000
```

## 🔌 Endpoints

### Authentication Endpoints

#### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "role": "attendee"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "attendee",
      "createdAt": "2025-08-15T10:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 86400
    }
  }
}
```

#### Login User
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:** Same as register response

#### Refresh Token
```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Logout
```http
POST /auth/logout
```

**Headers:** Requires Authorization header

### Users Endpoints

#### Get User Profile
```http
GET /users/profile
```

**Headers:** Requires Authorization header

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "role": "attendee",
    "avatar": "https://example.com/avatar.jpg",
    "createdAt": "2025-08-15T10:00:00.000Z",
    "updatedAt": "2025-08-15T10:00:00.000Z"
  }
}
```

#### Update User Profile
```http
PUT /users/profile
```

**Headers:** Requires Authorization header

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+1234567890"
}
```

### Events Endpoints

#### List Events
```http
GET /events?page=1&limit=10&category=music&location=cairo&date=2025-09-01
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 50)
- `category` - Event category filter
- `location` - Location filter
- `date` - Date filter (YYYY-MM-DD)
- `search` - Search term
- `sort` - Sort by (date, price, popularity)

**Response:**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": 1,
        "title": "Summer Music Festival",
        "description": "Amazing summer music festival",
        "category": "music",
        "location": "Cairo, Egypt",
        "venue": "Cairo Stadium",
        "startDate": "2025-09-15T18:00:00.000Z",
        "endDate": "2025-09-15T23:00:00.000Z",
        "image": "https://example.com/event-image.jpg",
        "organizer": {
          "id": 2,
          "name": "Music Events Co."
        },
        "ticketTypes": [
          {
            "id": 1,
            "name": "General Admission",
            "price": 50.00,
            "available": 100
          }
        ],
        "createdAt": "2025-08-15T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

#### Get Event Details
```http
GET /events/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Summer Music Festival",
    "description": "Amazing summer music festival",
    "category": "music",
    "location": "Cairo, Egypt",
    "venue": "Cairo Stadium",
    "address": "123 Stadium Road, Cairo",
    "coordinates": {
      "lat": 30.0444,
      "lng": 31.2357
    },
    "startDate": "2025-09-15T18:00:00.000Z",
    "endDate": "2025-09-15T23:00:00.000Z",
    "image": "https://example.com/event-image.jpg",
    "gallery": [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg"
    ],
    "organizer": {
      "id": 2,
      "name": "Music Events Co.",
      "email": "contact@musicevents.com"
    },
    "ticketTypes": [
      {
        "id": 1,
        "name": "General Admission",
        "description": "General admission ticket",
        "price": 50.00,
        "available": 100,
        "sold": 25,
        "maxPerOrder": 5
      }
    ],
    "tags": ["music", "festival", "summer"],
    "createdAt": "2025-08-15T10:00:00.000Z"
  }
}
```

#### Create Event (Organizer Only)
```http
POST /events
```

**Headers:** Requires Authorization header

**Request Body:**
```json
{
  "title": "Summer Music Festival",
  "description": "Amazing summer music festival",
  "category": "music",
  "location": "Cairo, Egypt",
  "venue": "Cairo Stadium",
  "address": "123 Stadium Road, Cairo",
  "startDate": "2025-09-15T18:00:00.000Z",
  "endDate": "2025-09-15T23:00:00.000Z",
  "ticketTypes": [
    {
      "name": "General Admission",
      "description": "General admission ticket",
      "price": 50.00,
      "available": 100,
      "maxPerOrder": 5
    }
  ]
}
```

### Tickets Endpoints

#### List User Tickets
```http
GET /tickets
```

**Headers:** Requires Authorization header

**Response:**
```json
{
  "success": true,
  "data": {
    "tickets": [
      {
        "id": 1,
        "event": {
          "id": 1,
          "title": "Summer Music Festival",
          "startDate": "2025-09-15T18:00:00.000Z"
        },
        "ticketType": {
          "name": "General Admission",
          "price": 50.00
        },
        "qrCode": "bilten://ticket/abc123",
        "status": "valid",
        "purchasedAt": "2025-08-15T10:00:00.000Z"
      }
    ]
  }
}
```

### Orders Endpoints

#### Create Order
```http
POST /orders
```

**Headers:** Requires Authorization header

**Request Body:**
```json
{
  "eventId": 1,
  "tickets": [
    {
      "ticketTypeId": 1,
      "quantity": 2
    }
  ],
  "promoCode": "SUMMER20"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": 1,
      "total": 80.00,
      "discount": 20.00,
      "finalTotal": 60.00,
      "status": "pending",
      "paymentIntent": "pi_1234567890",
      "createdAt": "2025-08-15T10:00:00.000Z"
    }
  }
}
```

#### Get Order Details
```http
GET /orders/:id
```

**Headers:** Requires Authorization header

#### Validate Ticket (QR Scanner)
```http
POST /orders/validate
```

**Headers:** Requires Authorization header

**Request Body:**
```json
{
  "qrCode": "bilten://ticket/abc123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "ticket": {
      "id": 1,
      "eventTitle": "Summer Music Festival",
      "attendeeName": "John Doe",
      "ticketType": "General Admission",
      "status": "valid"
    }
  }
}
```

### Analytics Endpoints

#### Get Event Analytics
```http
GET /analytics/events/:id
```

**Headers:** Requires Authorization header (Organizer/Admin only)

**Response:**
```json
{
  "success": true,
  "data": {
    "eventId": 1,
    "totalTickets": 100,
    "soldTickets": 75,
    "revenue": 3750.00,
    "ticketTypes": [
      {
        "name": "General Admission",
        "sold": 50,
        "revenue": 2500.00
      }
    ],
    "salesByDate": [
      {
        "date": "2025-08-15",
        "tickets": 10,
        "revenue": 500.00
      }
    ]
  }
}
```

### File Upload Endpoints

#### Upload Image
```http
POST /uploads/image
```

**Headers:** Requires Authorization header

**Request:** Multipart form data

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://example.com/uploads/image.jpg",
    "filename": "image.jpg",
    "size": 1024000
  }
}
```

### Search Endpoints

#### Search Events
```http
GET /search/events?q=music festival&location=cairo&date=2025-09
```

**Query Parameters:**
- `q` - Search query
- `location` - Location filter
- `date` - Date filter
- `category` - Category filter

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": 1,
        "title": "Summer Music Festival",
        "description": "Amazing summer music festival",
        "location": "Cairo, Egypt",
        "startDate": "2025-09-15T18:00:00.000Z",
        "relevance": 0.95
      }
    ],
    "total": 1,
    "query": "music festival"
  }
}
```

## 📝 Usage Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

const API_BASE = 'http://localhost:3001/v1';

// Login
const login = async (email, password) => {
  const response = await axios.post(`${API_BASE}/auth/login`, {
    email,
    password
  });
  return response.data.data.tokens.accessToken;
};

// Get events
const getEvents = async (token) => {
  const response = await axios.get(`${API_BASE}/events`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.data.data.events;
};

// Create order
const createOrder = async (token, eventId, tickets) => {
  const response = await axios.post(`${API_BASE}/orders`, {
    eventId,
    tickets
  }, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.data.data.order;
};
```

### cURL Examples

```bash
# Login
curl -X POST http://localhost:3001/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get events
curl -X GET http://localhost:3001/v1/events \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create order
curl -X POST http://localhost:3001/v1/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"eventId":1,"tickets":[{"ticketTypeId":1,"quantity":2}]}'
```

## 🔧 SDKs and Libraries

### JavaScript/TypeScript
```bash
npm install bilten-api-client
```

```javascript
import { BiltenAPI } from 'bilten-api-client';

const api = new BiltenAPI({
  baseURL: 'http://localhost:3001/v1',
  token: 'your_jwt_token'
});

const events = await api.events.list();
const order = await api.orders.create({
  eventId: 1,
  tickets: [{ ticketTypeId: 1, quantity: 2 }]
});
```

## 📚 Additional Resources

- [Authentication Guide](Authentication-Guide)
- [Webhook Documentation](Webhook-Documentation)
- [Error Handling Guide](Error-Handling-Guide)
- [Rate Limiting Guide](Rate-Limiting-Guide)

---

**Need help?** Check our [API Examples](API-Examples) or create an issue on GitHub!
