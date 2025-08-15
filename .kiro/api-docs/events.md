# Events API Documentation

## Overview
The EventChain Events API manages event creation, updates, and retrieval. It supports various event types including concerts, festivals, and private events.

## Base URL
```
Production: https://api.eventchain.com/v1/events
Staging: https://staging-api.eventchain.com/v1/events
Development: http://localhost:3001/v1/events
```

## Event Management

### Create Event
```http
POST /
Authorization: Bearer {organizerToken}
Content-Type: application/json

{
  "title": "Summer Music Festival 2024",
  "description": "A three-day outdoor music festival featuring top artists",
  "category": "music",
  "type": "festival",
  "startDate": "2024-07-15T18:00:00Z",
  "endDate": "2024-07-17T23:00:00Z",
  "venue": {
    "name": "Central Park",
    "address": "New York, NY 10024",
    "coordinates": {
      "latitude": 40.7829,
      "longitude": -73.9654
    },
    "capacity": 50000
  },
  "ticketTiers": [
    {
      "name": "General Admission",
      "price": 150.00,
      "quantity": 30000,
      "description": "Standard festival access"
    },
    {
      "name": "VIP",
      "price": 350.00,
      "quantity": 5000,
      "description": "VIP area access with premium amenities"
    }
  ],
  "images": [
    "https://cdn.eventchain.com/events/festival-banner.jpg"
  ],
  "tags": ["music", "outdoor", "festival", "summer"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "evt_123456789",
    "title": "Summer Music Festival 2024",
    "slug": "summer-music-festival-2024",
    "status": "draft",
    "organizerId": "org_987654321",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

### Get Event Details
```http
GET /{eventId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "evt_123456789",
    "title": "Summer Music Festival 2024",
    "description": "A three-day outdoor music festival featuring top artists",
    "category": "music",
    "type": "festival",
    "status": "published",
    "startDate": "2024-07-15T18:00:00Z",
    "endDate": "2024-07-17T23:00:00Z",
    "venue": {
      "name": "Central Park",
      "address": "New York, NY 10024",
      "coordinates": {
        "latitude": 40.7829,
        "longitude": -73.9654
      },
      "capacity": 50000
    },
    "ticketTiers": [...],
    "images": [...],
    "tags": [...],
    "organizer": {
      "id": "org_987654321",
      "name": "Festival Productions Inc.",
      "verified": true
    },
    "stats": {
      "ticketsSold": 15000,
      "revenue": 2250000.00,
      "attendeeCount": 15000
    }
  }
}
```

### Update Event
```http
PUT /{eventId}
Authorization: Bearer {organizerToken}
Content-Type: application/json

{
  "title": "Updated Event Title",
  "description": "Updated description"
}
```

### Delete Event
```http
DELETE /{eventId}
Authorization: Bearer {organizerToken}
```

## Event Discovery

### Search Events
```http
GET /search?q=music&category=music&location=new-york&date=2024-07-15&page=1&limit=20
```

**Query Parameters:**
- `q`: Search query (title, description, tags)
- `category`: Event category filter
- `location`: Location filter
- `date`: Date filter (YYYY-MM-DD)
- `startDate`: Start date range
- `endDate`: End date range
- `priceMin`: Minimum ticket price
- `priceMax`: Maximum ticket price
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20, max: 100)

### Get Featured Events
```http
GET /featured?limit=10
```

### Get Events by Category
```http
GET /category/{categorySlug}?page=1&limit=20
```

### Get Nearby Events
```http
GET /nearby?lat=40.7829&lng=-73.9654&radius=50&unit=km
```

## Event Status Management

### Publish Event
```http
POST /{eventId}/publish
Authorization: Bearer {organizerToken}
```

### Cancel Event
```http
POST /{eventId}/cancel
Authorization: Bearer {organizerToken}
Content-Type: application/json

{
  "reason": "Due to unforeseen circumstances",
  "refundPolicy": "full"
}
```

### Postpone Event
```http
POST /{eventId}/postpone
Authorization: Bearer {organizerToken}
Content-Type: application/json

{
  "newStartDate": "2024-08-15T18:00:00Z",
  "newEndDate": "2024-08-17T23:00:00Z",
  "reason": "Weather concerns"
}
```

## Event Analytics

### Get Event Statistics
```http
GET /{eventId}/stats
Authorization: Bearer {organizerToken}
```

### Get Ticket Sales Data
```http
GET /{eventId}/sales?period=daily&startDate=2024-01-01&endDate=2024-01-31
```

## Event Categories
- `music`: Concerts, festivals, live performances
- `sports`: Sporting events, tournaments
- `business`: Conferences, seminars, networking
- `arts`: Theater, exhibitions, cultural events
- `food`: Food festivals, tastings, culinary events
- `technology`: Tech conferences, workshops
- `education`: Classes, workshops, lectures
- `community`: Local events, meetups

## Event Status Values
- `draft`: Event created but not published
- `published`: Event live and accepting ticket sales
- `sold_out`: All tickets sold
- `cancelled`: Event cancelled
- `postponed`: Event postponed to new date
- `completed`: Event has ended

## Error Responses

### Common Error Codes
- `EVENT_001`: Event not found
- `EVENT_002`: Unauthorized access
- `EVENT_003`: Invalid event data
- `EVENT_004`: Event capacity exceeded
- `EVENT_005`: Event already published
- `EVENT_006`: Cannot modify past event

## Rate Limiting
- Event creation: 10 per hour per organizer
- Event updates: 100 per hour per organizer
- Search requests: 1000 per hour per IP