# RESTful API Endpoints for Tracking Operations

## Overview

Complete RESTful API documentation for all tracking operations in the Bilten platform, covering user activity, event interactions, conversions, analytics, and performance monitoring.

## Base URL
```
https://api.bilten.com/api/v1/tracking
```

## Authentication
All endpoints require JWT token: `Authorization: Bearer <token>`

---

## 📊 Core Tracking Endpoints

### 1. User Activity Tracking

#### POST /tracking/activity
Track user activity and behavior.

**Request:**
```json
{
  "eventType": "page_view",
  "sessionId": "session_123456789",
  "pageUrl": "https://bilten.com/events",
  "eventData": {
    "title": "Events Page",
    "scrollDepth": 75,
    "timeOnPage": 120
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Activity tracked successfully",
  "data": {
    "trackingId": "uuid",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### 2. Event Interaction Tracking

#### POST /tracking/event-interaction
Track event-specific interactions.

**Request:**
```json
{
  "eventId": "event-uuid",
  "interactionType": "view",
  "sessionId": "session_123456789",
  "interactionData": {
    "duration": 45,
    "scrollDepth": 75
  }
}
```

### 3. Conversion Tracking

#### POST /tracking/conversion
Track conversion events.

**Request:**
```json
{
  "conversionType": "purchase",
  "conversionValue": 99.99,
  "sessionId": "session_123456789",
  "campaignId": "summer2024",
  "conversionData": {
    "orderId": "order-123",
    "ticketCount": 2
  }
}
```

### 4. Performance Tracking

#### POST /tracking/performance
Track API performance metrics.

**Request:**
```json
{
  "endpoint": "/api/v1/events",
  "responseTime": 245,
  "statusCode": 200,
  "errorMessage": null
}
```

---

## 📈 Analytics Endpoints

### 5. Real-Time Analytics

#### GET /tracking/real-time
Get real-time analytics data.

**Query Parameters:**
- `timeRange`: 1h, 6h, 24h, 7d, 30d
- `eventTypes`: Array of event types
- `userId`: Specific user ID
- `eventId`: Specific event ID

**Response:**
```json
{
  "success": true,
  "data": {
    "timeRange": "1h",
    "realTimeActivity": [
      {
        "event_type": "page_view",
        "count": 45,
        "time_bucket": "2024-01-15T10:30:00Z"
      }
    ],
    "activeSessions": 23,
    "performanceMetrics": [
      {
        "endpoint": "/api/v1/events",
        "avg_response_time": 245,
        "request_count": 156,
        "error_count": 2
      }
    ]
  }
}
```

**Required Role:** admin, organizer

### 6. User Journey Analysis

#### GET /tracking/user-journey/:userId
Get detailed user journey analysis.

**Query Parameters:**
- `startDate`: ISO 8601 date
- `endDate`: ISO 8601 date
- `includeEvents`: Boolean
- `includeInteractions`: Boolean

**Required Role:** admin

### 7. Funnel Analysis

#### POST /tracking/funnel-analysis
Get conversion funnel analysis.

**Request:**
```json
{
  "funnelSteps": [
    { "name": "Page View", "eventType": "page_view" },
    { "name": "Event View", "eventType": "event_view" },
    { "name": "Purchase", "eventType": "purchase" }
  ],
  "timeRange": "30d",
  "filters": {
    "userId": "user-uuid"
  }
}
```

**Required Role:** admin, organizer

### 8. Data Export

#### POST /tracking/export
Export analytics data.

**Request:**
```json
{
  "dataType": "user_activity",
  "format": "csv",
  "filters": {
    "userId": "user-uuid",
    "eventType": "page_view"
  },
  "dateRange": {
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-01-31T23:59:59Z"
  }
}
```

**Required Role:** admin

---

## 🗺️ Heatmap Endpoints

### 9. Heatmap Data

#### GET /tracking/heatmap/:pageUrl
Get heatmap data for a specific page.

**Query Parameters:**
- `timeRange`: 1h, 6h, 24h, 7d, 30d

**Required Role:** admin, organizer

#### POST /tracking/heatmap
Track heatmap data.

**Request:**
```json
{
  "pageUrl": "https://bilten.com/events",
  "xPosition": 150,
  "yPosition": 200,
  "elementSelector": ".event-card",
  "clickCount": 1,
  "hoverCount": 3,
  "scrollDepth": 75,
  "sessionId": "session_123456789"
}
```

---

## 📢 Campaign Tracking

### 10. Campaign Analytics

#### GET /tracking/campaign/:campaignId
Get campaign analytics and performance.

**Query Parameters:**
- `timeRange`: 1h, 6h, 24h, 7d, 30d, 90d

**Required Role:** admin

---

## 🧪 A/B Testing

### 11. A/B Test Results

#### GET /tracking/ab-test/:testName
Get A/B test results and statistical analysis.

**Required Role:** admin

---

## 📊 Advanced Analytics

### 12. User Engagement Metrics

#### GET /tracking/engagement/:userId
Get detailed user engagement metrics.

**Query Parameters:**
- `timeRange`: 1h, 6h, 24h, 7d, 30d, 90d

**Required Role:** admin

### 13. Event Performance Analytics

#### GET /tracking/event-performance/:eventId
Get detailed event performance analytics.

**Query Parameters:**
- `timeRange`: 1h, 6h, 24h, 7d, 30d, 90d

**Required Role:** admin, organizer

---

## 🔧 System Endpoints

### 14. Health Check

#### GET /tracking/health
Check tracking service health and status.

**Response:**
```json
{
  "success": true,
  "message": "Tracking service is healthy",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 15. System Metrics

#### GET /tracking/system-metrics
Get system performance and health metrics.

**Query Parameters:**
- `timeRange`: 1h, 6h, 24h, 7d

**Required Role:** admin

---

## 🚨 Error Handling

### Standard Error Responses

#### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "eventType",
      "message": "Event type is required"
    }
  ]
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required"
}
```

#### 403 Forbidden
```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## 📝 Rate Limiting

- **POST endpoints**: 100 requests per minute per IP
- **GET endpoints**: 1000 requests per minute per IP
- **Analytics endpoints**: 60 requests per minute per user

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642234567
```

---

## 🔒 Security Considerations

1. **Authentication**: All endpoints require valid JWT tokens
2. **Authorization**: Role-based access control for sensitive endpoints
3. **Data Privacy**: User data is anonymized where possible
4. **Input Validation**: All inputs are validated and sanitized
5. **Rate Limiting**: Prevents abuse and ensures service stability
6. **HTTPS**: All endpoints require HTTPS in production

---

## 📚 Usage Examples

### Frontend Integration

```javascript
// Track page view
await fetch('/api/v1/tracking/activity', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    eventType: 'page_view',
    sessionId: sessionId,
    pageUrl: window.location.href,
    eventData: {
      title: document.title,
      referrer: document.referrer
    }
  })
});

// Track event interaction
await fetch('/api/v1/tracking/event-interaction', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    eventId: eventId,
    interactionType: 'view',
    sessionId: sessionId,
    interactionData: {
      duration: 30,
      scrollDepth: 75
    }
  })
});
```

### Analytics Dashboard Integration

```javascript
// Get real-time analytics
const response = await fetch('/api/v1/tracking/real-time?timeRange=1h', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log('Real-time activity:', data.data.realTimeActivity);
```

---

This comprehensive API documentation covers all tracking operations in the Bilten platform, providing a complete reference for developers integrating with the tracking system.
