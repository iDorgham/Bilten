# Analytics API Documentation

## Overview
The Bilten Analytics API provides comprehensive data insights for events, ticket sales, user behavior, and platform performance. It offers real-time and historical analytics for organizers and platform administrators.

## Base URL
```
Production: https://api.bilten.com/v1/analytics
Staging: https://staging-api.bilten.com/v1/analytics
Development: http://localhost:3001/v1/analytics
```

## Event Analytics

### Get Event Overview
```http
GET /events/{eventId}/overview
Authorization: Bearer {organizerToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "eventId": "evt_123456789",
    "title": "Summer Music Festival 2024",
    "status": "published",
    "metrics": {
      "totalViews": 125000,
      "uniqueVisitors": 85000,
      "ticketsSold": 15000,
      "totalRevenue": 2250000.00,
      "conversionRate": 17.6,
      "averageOrderValue": 150.00,
      "refundRate": 2.1
    },
    "period": {
      "startDate": "2024-01-01T00:00:00Z",
      "endDate": "2024-01-31T23:59:59Z"
    }
  }
}
```

### Get Sales Analytics
```http
GET /events/{eventId}/sales?period=daily&startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer {organizerToken}
```

**Query Parameters:**
- `period`: Aggregation period (hourly, daily, weekly, monthly)
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)
- `tierIds`: Filter by specific ticket tiers

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSales": 2250000.00,
    "totalTickets": 15000,
    "breakdown": [
      {
        "date": "2024-01-01",
        "sales": 45000.00,
        "tickets": 300,
        "orders": 150
      },
      {
        "date": "2024-01-02",
        "sales": 67500.00,
        "tickets": 450,
        "orders": 225
      }
    ],
    "byTier": [
      {
        "tierId": "tier_general",
        "name": "General Admission",
        "sales": 1800000.00,
        "tickets": 12000,
        "percentage": 80.0
      },
      {
        "tierId": "tier_vip",
        "name": "VIP",
        "sales": 450000.00,
        "tickets": 3000,
        "percentage": 20.0
      }
    ]
  }
}
```

### Get Attendance Analytics
```http
GET /events/{eventId}/attendance
Authorization: Bearer {organizerToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalAttendees": 14250,
    "attendanceRate": 95.0,
    "checkInTimes": [
      {
        "hour": "17:00",
        "count": 2850,
        "percentage": 20.0
      },
      {
        "hour": "18:00",
        "count": 4275,
        "percentage": 30.0
      }
    ],
    "entryPoints": [
      {
        "location": "Main Entrance",
        "count": 8550,
        "percentage": 60.0
      },
      {
        "location": "VIP Entrance",
        "count": 2850,
        "percentage": 20.0
      }
    ],
    "demographics": {
      "ageGroups": [
        {"range": "18-24", "count": 4275, "percentage": 30.0},
        {"range": "25-34", "count": 5700, "percentage": 40.0},
        {"range": "35-44", "count": 2850, "percentage": 20.0},
        {"range": "45+", "count": 1425, "percentage": 10.0}
      ],
      "genderDistribution": {
        "male": 45.5,
        "female": 52.3,
        "other": 2.2
      }
    }
  }
}
```

## User Behavior Analytics

### Get User Journey
```http
GET /events/{eventId}/user-journey
Authorization: Bearer {organizerToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "funnel": [
      {
        "stage": "event_view",
        "users": 85000,
        "dropoffRate": 0
      },
      {
        "stage": "ticket_selection",
        "users": 25500,
        "dropoffRate": 70.0
      },
      {
        "stage": "checkout_start",
        "users": 17850,
        "dropoffRate": 30.0
      },
      {
        "stage": "payment_complete",
        "users": 15000,
        "dropoffRate": 16.0
      }
    ],
    "averageTimeToConversion": 1800,
    "topExitPoints": [
      {
        "stage": "ticket_selection",
        "exitRate": 45.2,
        "commonReasons": ["price_concern", "date_conflict"]
      }
    ]
  }
}
```

### Get Traffic Sources
```http
GET /events/{eventId}/traffic-sources?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer {organizerToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSessions": 125000,
    "sources": [
      {
        "source": "organic_search",
        "sessions": 37500,
        "percentage": 30.0,
        "conversionRate": 18.5
      },
      {
        "source": "social_media",
        "sessions": 31250,
        "percentage": 25.0,
        "conversionRate": 15.2,
        "breakdown": {
          "facebook": 15625,
          "instagram": 9375,
          "twitter": 6250
        }
      },
      {
        "source": "direct",
        "sessions": 25000,
        "percentage": 20.0,
        "conversionRate": 22.1
      },
      {
        "source": "email_marketing",
        "sessions": 18750,
        "percentage": 15.0,
        "conversionRate": 28.3
      },
      {
        "source": "paid_advertising",
        "sessions": 12500,
        "percentage": 10.0,
        "conversionRate": 12.8
      }
    ]
  }
}
```

## Financial Analytics

### Get Revenue Analytics
```http
GET /events/{eventId}/revenue?period=daily&startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer {organizerToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRevenue": 2250000.00,
    "netRevenue": 2025000.00,
    "fees": {
      "platform": 67500.00,
      "processing": 40500.00,
      "total": 108000.00
    },
    "refunds": {
      "amount": 47250.00,
      "count": 315,
      "rate": 2.1
    },
    "revenueByDate": [...],
    "revenueByTier": [...],
    "paymentMethods": [
      {
        "method": "credit_card",
        "revenue": 1912500.00,
        "percentage": 85.0
      },
      {
        "method": "digital_wallet",
        "revenue": 270000.00,
        "percentage": 12.0
      },
      {
        "method": "bank_transfer",
        "revenue": 67500.00,
        "percentage": 3.0
      }
    ]
  }
}
```

### Get Profit Analysis
```http
GET /events/{eventId}/profit-analysis
Authorization: Bearer {organizerToken}
```

## Platform Analytics (Admin Only)

### Get Platform Overview
```http
GET /platform/overview?period=monthly&startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer {adminToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalEvents": 15420,
    "activeEvents": 2340,
    "totalUsers": 1250000,
    "totalOrganizers": 8500,
    "totalRevenue": 125000000.00,
    "platformRevenue": 3750000.00,
    "metrics": {
      "averageEventSize": 850,
      "averageTicketPrice": 85.50,
      "platformGrowthRate": 15.2,
      "userRetentionRate": 68.5
    }
  }
}
```

### Get User Analytics
```http
GET /platform/users?period=daily&startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer {adminToken}
```

### Get Event Category Performance
```http
GET /platform/categories
Authorization: Bearer {adminToken}
```

## Real-Time Analytics

### Get Live Event Data
```http
GET /events/{eventId}/live
Authorization: Bearer {organizerToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "currentAttendees": 12450,
    "checkInsLastHour": 850,
    "activeScans": 15,
    "queueStatus": [
      {
        "entrance": "Main Entrance",
        "queueLength": 45,
        "averageWaitTime": 8
      }
    ],
    "alerts": [
      {
        "type": "capacity_warning",
        "message": "Approaching 90% capacity",
        "timestamp": "2024-07-15T19:30:00Z"
      }
    ]
  }
}
```

### Get Real-Time Sales
```http
GET /events/{eventId}/sales/live
Authorization: Bearer {organizerToken}
```

## Custom Reports

### Generate Custom Report
```http
POST /reports/custom
Authorization: Bearer {organizerToken}
Content-Type: application/json

{
  "name": "Q1 2024 Performance Report",
  "eventIds": ["evt_123456789", "evt_987654321"],
  "metrics": ["sales", "attendance", "demographics"],
  "period": {
    "startDate": "2024-01-01",
    "endDate": "2024-03-31"
  },
  "format": "pdf",
  "schedule": {
    "frequency": "monthly",
    "recipients": ["organizer@example.com"]
  }
}
```

### Get Report Status
```http
GET /reports/{reportId}
Authorization: Bearer {organizerToken}
```

### Download Report
```http
GET /reports/{reportId}/download
Authorization: Bearer {organizerToken}
```

## Data Export

### Export Event Data
```http
POST /export/events
Authorization: Bearer {organizerToken}
Content-Type: application/json

{
  "eventIds": ["evt_123456789"],
  "dataTypes": ["tickets", "attendees", "sales"],
  "format": "csv",
  "dateRange": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  }
}
```

### Get Export Status
```http
GET /export/{exportId}
Authorization: Bearer {organizerToken}
```

## Comparative Analytics

### Compare Events
```http
GET /compare/events?eventIds=evt_123456789,evt_987654321&metrics=sales,attendance
Authorization: Bearer {organizerToken}
```

### Benchmark Analysis
```http
GET /events/{eventId}/benchmark?category=music&region=north_america
Authorization: Bearer {organizerToken}
```

## Error Responses

### Common Error Codes
- `ANALYTICS_001`: Insufficient data for analysis
- `ANALYTICS_002`: Invalid date range
- `ANALYTICS_003`: Unauthorized access to analytics
- `ANALYTICS_004`: Report generation failed
- `ANALYTICS_005`: Export limit exceeded

## Rate Limiting
- Analytics queries: 1000 per hour per organizer
- Report generation: 10 per day per organizer
- Data exports: 5 per day per organizer
- Real-time endpoints: 100 per minute per organizer

## Data Retention
- Real-time data: 7 days
- Daily aggregates: 2 years
- Monthly aggregates: 5 years
- Raw event data: Permanent (with user consent)