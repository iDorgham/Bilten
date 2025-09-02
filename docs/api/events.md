# Events API

## Overview

The Events API provides comprehensive event management capabilities for the Bilten platform. It allows organizers to create, manage, and publish events, while providing attendees with search and discovery features.

## Base URL
```
GET /api/v1/events
```

## Endpoints

### List Events
Retrieves a paginated list of events with optional filtering.

**Endpoint**: `GET /events`

**Query Parameters**:
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `search` (string): Search term for event title/description
- `category` (string): Event category filter
- `location` (string): Location filter
- `startDate` (string): Start date filter (ISO 8601)
- `endDate` (string): End date filter (ISO 8601)
- `status` (string): Event status filter (draft, published, cancelled)
- `organizerId` (string): Filter by organizer ID

**Response**:
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "event_123456789",
        "title": "Tech Conference 2024",
        "description": "Annual technology conference",
        "category": "technology",
        "startDate": "2024-12-25T09:00:00Z",
        "endDate": "2024-12-25T17:00:00Z",
        "location": {
          "address": "123 Main St",
          "city": "New York",
          "state": "NY",
          "country": "USA",
          "coordinates": {
            "lat": 40.7128,
            "lng": -74.0060
          }
        },
        "organizer": {
          "id": "user_123456789",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "status": "published",
        "ticketTypes": [
          {
            "id": "ticket_123",
            "name": "General Admission",
            "price": 50.00,
            "currency": "USD",
            "available": 100,
            "sold": 25
          }
        ],
        "images": [
          {
            "id": "img_123",
            "url": "https://cdn.bilten.com/events/event_123/image.jpg",
            "alt": "Event banner"
          }
        ],
        "createdAt": "2024-11-01T10:00:00Z",
        "updatedAt": "2024-11-15T14:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

### Get Event
Retrieves detailed information about a specific event.

**Endpoint**: `GET /events/{eventId}`

**Response**:
```json
{
  "success": true,
  "data": {
    "event": {
      "id": "event_123456789",
      "title": "Tech Conference 2024",
      "description": "Annual technology conference featuring top speakers",
      "category": "technology",
      "tags": ["conference", "tech", "networking"],
      "startDate": "2024-12-25T09:00:00Z",
      "endDate": "2024-12-25T17:00:00Z",
      "timezone": "America/New_York",
      "location": {
        "name": "Tech Center",
        "address": "123 Main St",
        "city": "New York",
        "state": "NY",
        "country": "USA",
        "postalCode": "10001",
        "coordinates": {
          "lat": 40.7128,
          "lng": -74.0060
        }
      },
      "organizer": {
        "id": "user_123456789",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890"
      },
      "status": "published",
      "capacity": 500,
      "ticketTypes": [
        {
          "id": "ticket_123",
          "name": "General Admission",
          "description": "Access to all sessions",
          "price": 50.00,
          "currency": "USD",
          "available": 100,
          "sold": 25,
          "maxPerOrder": 10
        },
        {
          "id": "ticket_124",
          "name": "VIP Pass",
          "description": "Premium access with networking",
          "price": 150.00,
          "currency": "USD",
          "available": 50,
          "sold": 10,
          "maxPerOrder": 5
        }
      ],
      "images": [
        {
          "id": "img_123",
          "url": "https://cdn.bilten.com/events/event_123/banner.jpg",
          "alt": "Event banner",
          "type": "banner"
        },
        {
          "id": "img_124",
          "url": "https://cdn.bilten.com/events/event_123/thumbnail.jpg",
          "alt": "Event thumbnail",
          "type": "thumbnail"
        }
      ],
      "schedule": [
        {
          "id": "session_123",
          "title": "Opening Keynote",
          "startTime": "2024-12-25T09:00:00Z",
          "endTime": "2024-12-25T10:00:00Z",
          "speaker": "Jane Smith",
          "description": "Future of technology"
        }
      ],
      "createdAt": "2024-11-01T10:00:00Z",
      "updatedAt": "2024-11-15T14:30:00Z"
    }
  }
}
```

### Create Event
Creates a new event (requires organizer role).

**Endpoint**: `POST /events`

**Headers**:
```
Authorization: Bearer <access-token>
```

**Request Body**:
```json
{
  "title": "Tech Conference 2024",
  "description": "Annual technology conference",
  "category": "technology",
  "tags": ["conference", "tech", "networking"],
  "startDate": "2024-12-25T09:00:00Z",
  "endDate": "2024-12-25T17:00:00Z",
  "timezone": "America/New_York",
  "location": {
    "name": "Tech Center",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "postalCode": "10001"
  },
  "capacity": 500,
  "ticketTypes": [
    {
      "name": "General Admission",
      "description": "Access to all sessions",
      "price": 50.00,
      "currency": "USD",
      "available": 100,
      "maxPerOrder": 10
    }
  ],
  "images": [
    {
      "url": "https://cdn.bilten.com/events/event_123/banner.jpg",
      "alt": "Event banner",
      "type": "banner"
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "event": {
      "id": "event_123456789",
      "title": "Tech Conference 2024",
      "status": "draft",
      "createdAt": "2024-12-01T10:00:00Z"
    }
  },
  "message": "Event created successfully"
}
```

### Update Event
Updates an existing event (requires organizer role).

**Endpoint**: `PUT /events/{eventId}`

**Headers**:
```
Authorization: Bearer <access-token>
```

**Request Body**: (Same as create event)

**Response**:
```json
{
  "success": true,
  "data": {
    "event": {
      "id": "event_123456789",
      "title": "Tech Conference 2024",
      "updatedAt": "2024-12-01T15:30:00Z"
    }
  },
  "message": "Event updated successfully"
}
```

### Delete Event
Deletes an event (requires organizer role).

**Endpoint**: `DELETE /events/{eventId}`

**Headers**:
```
Authorization: Bearer <access-token>
```

**Response**:
```json
{
  "success": true,
  "message": "Event deleted successfully"
}
```

### Publish Event
Publishes a draft event (requires organizer role).

**Endpoint**: `POST /events/{eventId}/publish`

**Headers**:
```
Authorization: Bearer <access-token>
```

**Response**:
```json
{
  "success": true,
  "message": "Event published successfully"
}
```

### Cancel Event
Cancels a published event (requires organizer role).

**Endpoint**: `POST /events/{eventId}/cancel`

**Headers**:
```
Authorization: Bearer <access-token>
```

**Request Body**:
```json
{
  "reason": "Due to unforeseen circumstances",
  "refundPolicy": "Full refunds will be issued"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Event cancelled successfully"
}
```

### Get Event Analytics
Retrieves analytics data for an event (requires organizer role).

**Endpoint**: `GET /events/{eventId}/analytics`

**Headers**:
```
Authorization: Bearer <access-token>
```

**Query Parameters**:
- `period` (string): Analytics period (day, week, month, year)

**Response**:
```json
{
  "success": true,
  "data": {
    "analytics": {
      "totalViews": 1250,
      "uniqueVisitors": 890,
      "ticketsSold": 75,
      "revenue": 3750.00,
      "conversionRate": 8.4,
      "topReferrers": [
        {
          "source": "social_media",
          "visits": 450,
          "conversions": 25
        }
      ],
      "dailyStats": [
        {
          "date": "2024-12-01",
          "views": 150,
          "sales": 10,
          "revenue": 500.00
        }
      ]
    }
  }
}
```

## Event Categories

| Category | Description |
|----------|-------------|
| `technology` | Technology conferences and meetups |
| `business` | Business and professional events |
| `education` | Educational workshops and courses |
| `entertainment` | Entertainment and cultural events |
| `sports` | Sports and fitness events |
| `health` | Health and wellness events |
| `food` | Food and beverage events |
| `art` | Art and creative events |
| `music` | Music concerts and festivals |
| `other` | Other event types |

## Event Status

| Status | Description |
|--------|-------------|
| `draft` | Event is in draft mode, not visible to public |
| `published` | Event is published and visible to public |
| `cancelled` | Event has been cancelled |
| `completed` | Event has finished |
| `archived` | Event has been archived |

## Error Codes

| Code | Description |
|------|-------------|
| `EVENT_NOT_FOUND` | Event with specified ID not found |
| `INSUFFICIENT_PERMISSIONS` | User doesn't have permission to perform action |
| `EVENT_ALREADY_PUBLISHED` | Event is already published |
| `EVENT_CANNOT_BE_CANCELLED` | Event cannot be cancelled (e.g., already started) |
| `INVALID_EVENT_DATA` | Event data validation failed |
| `TICKET_TYPES_REQUIRED` | At least one ticket type is required |

## Code Examples

### JavaScript/TypeScript
```typescript
import { BiltenAPI } from '@bilten/sdk';

const api = new BiltenAPI({ token: 'your-token' });

// Create event
const event = await api.events.create({
  title: 'Tech Conference 2024',
  description: 'Annual technology conference',
  startDate: '2024-12-25T09:00:00Z',
  endDate: '2024-12-25T17:00:00Z',
  location: {
    address: '123 Main St',
    city: 'New York',
    state: 'NY',
    country: 'USA'
  }
});

// Publish event
await api.events.publish(event.id);

// Get event analytics
const analytics = await api.events.getAnalytics(event.id, {
  period: 'month'
});
```

### cURL Examples
```bash
# Create event
curl -X POST https://api.bilten.com/api/v1/events \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Tech Conference 2024",
    "startDate": "2024-12-25T09:00:00Z",
    "endDate": "2024-12-25T17:00:00Z"
  }'

# Get events with filters
curl "https://api.bilten.com/api/v1/events?category=technology&status=published&page=1&limit=10"
```

## Best Practices

1. **Event Creation**
   - Provide detailed descriptions
   - Use appropriate categories and tags
   - Set realistic capacity limits
   - Include high-quality images

2. **Pricing Strategy**
   - Research market prices
   - Offer multiple ticket tiers
   - Consider early bird pricing
   - Set appropriate max per order limits

3. **Location Information**
   - Provide complete address details
   - Include venue name and description
   - Add parking and accessibility information
   - Use accurate coordinates for mapping

4. **Content Management**
   - Keep event information up to date
   - Respond to attendee questions promptly
   - Monitor and moderate comments
   - Update status appropriately
