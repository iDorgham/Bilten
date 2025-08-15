# Comprehensive Tracking and Analytics System Documentation

## Overview

The Bilten platform now includes a comprehensive tracking and analytics system that provides deep insights into user behavior, event performance, conversion tracking, and real-time analytics. This system enables data-driven decision making and optimization of the platform.

## Features

### 🎯 **Core Tracking Capabilities**
- **User Activity Tracking**: Page views, clicks, scrolls, searches, and custom events
- **Event Interaction Tracking**: Event-specific interactions like views, likes, shares, bookmarks
- **Conversion Tracking**: Purchase, registration, signup, and other conversion events
- **Performance Tracking**: API response times, error rates, and system performance
- **Heatmap Tracking**: Click and hover data for UI optimization
- **Campaign Tracking**: UTM parameters and campaign performance
- **A/B Testing**: Statistical testing for feature optimization

### 📊 **Analytics & Insights**
- **Real-Time Analytics**: Live dashboard with minute-by-minute updates
- **User Journey Analysis**: Complete user path analysis and behavior patterns
- **Funnel Analysis**: Conversion funnel tracking and optimization
- **Performance Metrics**: System health and API performance monitoring
- **Data Export**: CSV and JSON export capabilities
- **Advanced Visualizations**: Interactive charts and graphs

## Architecture

### Backend Components
- **TrackingService**: Core tracking logic and data processing
- **Tracking Routes**: RESTful API endpoints for tracking operations
- **Database Tables**: Optimized schema for tracking data storage
- **Real-time Processing**: Efficient data aggregation and analysis

### Frontend Components
- **AdvancedAnalyticsDashboard**: Comprehensive analytics interface
- **Real-time Charts**: Live data visualization with Recharts
- **Interactive Filters**: Time range and data filtering capabilities
- **Export Functionality**: Data export in multiple formats

## Database Schema

### Core Tracking Tables

#### 1. user_activity_tracking
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key)
- session_id (String)
- event_type (String) - page_view, click, scroll, search, etc.
- event_data (JSON) - Additional event-specific data
- page_url (String)
- user_agent (Text)
- ip_address (String)
- created_at (Timestamp)
```

#### 2. event_interaction_tracking
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key)
- event_id (UUID, Foreign Key)
- interaction_type (String) - view, like, share, bookmark, etc.
- interaction_data (JSON) - Additional interaction data
- session_id (String)
- created_at (Timestamp)
```

#### 3. conversion_tracking
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key)
- conversion_type (String) - purchase, registration, signup, etc.
- conversion_value (Decimal) - Monetary value of conversion
- conversion_data (JSON) - Additional conversion data
- session_id (String)
- campaign_id (String) - For campaign tracking
- created_at (Timestamp)
```

#### 4. performance_tracking
```sql
- id (UUID, Primary Key)
- endpoint (String)
- response_time (Integer) - in milliseconds
- status_code (Integer)
- error_message (Text)
- created_at (Timestamp)
```

### Metrics Tables

#### 5. user_engagement_metrics
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key)
- total_events (Integer)
- total_sessions (Integer)
- total_page_views (Integer)
- total_clicks (Integer)
- total_conversions (Integer)
- total_conversion_value (Decimal)
- avg_session_duration (Integer) - in seconds
- last_activity (Timestamp)
- first_activity (Timestamp)
```

#### 6. event_engagement_metrics
```sql
- id (UUID, Primary Key)
- event_id (UUID, Foreign Key)
- total_views (Integer)
- total_interactions (Integer)
- total_likes (Integer)
- total_shares (Integer)
- total_bookmarks (Integer)
- total_conversions (Integer)
- total_conversion_value (Decimal)
- engagement_rate (Decimal) - percentage
- last_interaction (Timestamp)
- first_interaction (Timestamp)
```

### Advanced Features Tables

#### 7. heatmap_data
```sql
- id (UUID, Primary Key)
- page_url (String)
- element_selector (String)
- x_position (Integer)
- y_position (Integer)
- click_count (Integer)
- hover_count (Integer)
- scroll_depth (Integer)
- session_id (String)
- user_id (UUID, Foreign Key)
- created_at (Timestamp)
```

#### 8. campaign_tracking
```sql
- id (UUID, Primary Key)
- campaign_id (String, Unique)
- campaign_name (String)
- campaign_source (String)
- campaign_medium (String)
- campaign_term (String)
- campaign_content (String)
- start_date (Timestamp)
- end_date (Timestamp)
- is_active (Boolean)
- campaign_data (JSON)
```

#### 9. ab_testing
```sql
- id (UUID, Primary Key)
- test_name (String)
- test_type (String) - page, feature, content, etc.
- variants (JSON) - Array of test variants
- total_participants (Integer)
- variant_a_participants (Integer)
- variant_b_participants (Integer)
- variant_a_conversions (Integer)
- variant_b_conversions (Integer)
- variant_a_conversion_rate (Decimal)
- variant_b_conversion_rate (Decimal)
- confidence_level (Decimal)
- winner (String) - A, B, or null
- is_active (Boolean)
- start_date (Timestamp)
- end_date (Timestamp)
```

## API Endpoints

### Tracking Endpoints

#### POST /api/v1/tracking/activity
Track user activity and behavior.

**Request Body:**
```json
{
  "eventType": "page_view",
  "sessionId": "session-123",
  "pageUrl": "https://bilten.com/events",
  "eventData": {
    "referrer": "google.com",
    "searchTerm": "music events"
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

#### POST /api/v1/tracking/event-interaction
Track event-specific interactions.

**Request Body:**
```json
{
  "eventId": "event-uuid",
  "interactionType": "view",
  "sessionId": "session-123",
  "interactionData": {
    "duration": 45,
    "scrollDepth": 75
  }
}
```

#### POST /api/v1/tracking/conversion
Track conversion events.

**Request Body:**
```json
{
  "conversionType": "purchase",
  "conversionValue": 99.99,
  "sessionId": "session-123",
  "campaignId": "summer2024",
  "conversionData": {
    "orderId": "order-123",
    "ticketCount": 2
  }
}
```

#### POST /api/v1/tracking/performance
Track performance metrics.

**Request Body:**
```json
{
  "endpoint": "/api/v1/events",
  "responseTime": 245,
  "statusCode": 200,
  "errorMessage": null
}
```

### Analytics Endpoints

#### GET /api/v1/tracking/real-time
Get real-time analytics data.

**Query Parameters:**
- `timeRange`: 1h, 6h, 24h, 7d, 30d
- `eventTypes`: Array of event types to filter
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
    "realTimeConversions": [
      {
        "conversion_type": "purchase",
        "count": 3,
        "total_value": 299.97,
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
    ],
    "lastUpdated": "2024-01-15T10:30:00Z"
  }
}
```

#### GET /api/v1/tracking/user-journey/:userId
Get user journey analysis.

**Query Parameters:**
- `startDate`: ISO 8601 date
- `endDate`: ISO 8601 date
- `includeEvents`: Boolean
- `includeInteractions`: Boolean

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user-uuid",
    "userActivity": [...],
    "eventInteractions": [...],
    "journeyAnalysis": {
      "mostVisitedPages": {...},
      "commonFlows": [...],
      "sessionDuration": 1800,
      "bounceRate": 25.5
    },
    "totalSessions": 5,
    "totalEvents": 45,
    "totalInteractions": 12
  }
}
```

#### POST /api/v1/tracking/funnel-analysis
Get funnel analysis.

**Request Body:**
```json
{
  "funnelSteps": [
    { "name": "Page View", "eventType": "page_view" },
    { "name": "Event View", "eventType": "event_view" },
    { "name": "Add to Cart", "eventType": "add_to_cart" },
    { "name": "Purchase", "eventType": "purchase" }
  ],
  "timeRange": "30d",
  "filters": {
    "userId": "user-uuid"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "funnelSteps": [
      {
        "step": "Page View",
        "eventType": "page_view",
        "count": 1000,
        "conversionRate": 100.0
      },
      {
        "step": "Event View",
        "eventType": "event_view",
        "count": 450,
        "conversionRate": 45.0
      }
    ],
    "timeRange": "30d",
    "totalSteps": 4,
    "overallConversionRate": 12.5
  }
}
```

#### POST /api/v1/tracking/export
Export analytics data.

**Request Body:**
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

### Heatmap Endpoints

#### GET /api/v1/tracking/heatmap/:pageUrl
Get heatmap data for a specific page.

#### POST /api/v1/tracking/heatmap
Track heatmap data.

**Request Body:**
```json
{
  "pageUrl": "https://bilten.com/events",
  "xPosition": 150,
  "yPosition": 200,
  "elementSelector": ".event-card",
  "clickCount": 1,
  "hoverCount": 3,
  "scrollDepth": 75,
  "sessionId": "session-123"
}
```

## Frontend Integration

### 1. Tracking Service Setup

Create a tracking service for frontend integration:

```javascript
// services/tracking.js
class TrackingService {
  static async trackActivity(eventType, eventData = {}) {
    try {
      const response = await fetch('/api/v1/tracking/activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          eventType,
          sessionId: this.getSessionId(),
          pageUrl: window.location.href,
          eventData
        })
      });
      return response.json();
    } catch (error) {
      console.error('Error tracking activity:', error);
    }
  }

  static async trackEventInteraction(eventId, interactionType, interactionData = {}) {
    try {
      const response = await fetch('/api/v1/tracking/event-interaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          eventId,
          interactionType,
          sessionId: this.getSessionId(),
          interactionData
        })
      });
      return response.json();
    } catch (error) {
      console.error('Error tracking event interaction:', error);
    }
  }

  static async trackConversion(conversionType, conversionValue, conversionData = {}) {
    try {
      const response = await fetch('/api/v1/tracking/conversion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          conversionType,
          conversionValue,
          sessionId: this.getSessionId(),
          conversionData
        })
      });
      return response.json();
    } catch (error) {
      console.error('Error tracking conversion:', error);
    }
  }

  static getSessionId() {
    let sessionId = localStorage.getItem('tracking_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('tracking_session_id', sessionId);
    }
    return sessionId;
  }
}

export default TrackingService;
```

### 2. React Hook for Tracking

Create a custom hook for easy tracking integration:

```javascript
// hooks/useTracking.js
import { useEffect, useCallback } from 'react';
import TrackingService from '../services/tracking';

export const useTracking = () => {
  const trackPageView = useCallback((pageData = {}) => {
    TrackingService.trackActivity('page_view', {
      title: document.title,
      referrer: document.referrer,
      ...pageData
    });
  }, []);

  const trackEvent = useCallback((eventType, eventData = {}) => {
    TrackingService.trackActivity(eventType, eventData);
  }, []);

  const trackEventInteraction = useCallback((eventId, interactionType, interactionData = {}) => {
    TrackingService.trackEventInteraction(eventId, interactionType, interactionData);
  }, []);

  const trackConversion = useCallback((conversionType, conversionValue, conversionData = {}) => {
    TrackingService.trackConversion(conversionType, conversionValue, conversionData);
  }, []);

  // Auto-track page views
  useEffect(() => {
    trackPageView();
  }, [trackPageView]);

  return {
    trackPageView,
    trackEvent,
    trackEventInteraction,
    trackConversion
  };
};
```

### 3. Component Integration

Integrate tracking into React components:

```javascript
// components/EventCard.js
import React from 'react';
import { useTracking } from '../hooks/useTracking';

const EventCard = ({ event }) => {
  const { trackEvent, trackEventInteraction } = useTracking();

  const handleEventClick = () => {
    trackEvent('event_click', {
      eventId: event.id,
      eventTitle: event.title,
      eventCategory: event.category
    });
  };

  const handleEventView = () => {
    trackEventInteraction(event.id, 'view', {
      duration: 30,
      scrollDepth: 50
    });
  };

  const handleEventLike = () => {
    trackEventInteraction(event.id, 'like', {
      previousLikes: event.likes
    });
  };

  return (
    <div 
      className="event-card"
      onClick={handleEventClick}
      onMouseEnter={handleEventView}
    >
      <h3>{event.title}</h3>
      <p>{event.description}</p>
      <button onClick={handleEventLike}>
        Like ({event.likes})
      </button>
    </div>
  );
};

export default EventCard;
```

### 4. Analytics Dashboard Integration

Use the advanced analytics dashboard:

```javascript
// pages/Analytics.js
import React from 'react';
import AdvancedAnalyticsDashboard from '../components/analytics/AdvancedAnalyticsDashboard';

const AnalyticsPage = () => {
  return (
    <div className="analytics-page">
      <AdvancedAnalyticsDashboard />
    </div>
  );
};

export default AnalyticsPage;
```

## Usage Examples

### 1. Basic Activity Tracking

```javascript
// Track page view
TrackingService.trackActivity('page_view', {
  page: '/events',
  referrer: 'google.com'
});

// Track button click
TrackingService.trackActivity('button_click', {
  buttonId: 'buy-ticket',
  buttonText: 'Buy Ticket',
  eventId: 'event-123'
});

// Track search
TrackingService.trackActivity('search', {
  query: 'music events',
  results: 45,
  filters: { category: 'music' }
});
```

### 2. Event Interaction Tracking

```javascript
// Track event view
TrackingService.trackEventInteraction('event-123', 'view', {
  duration: 120,
  scrollDepth: 80,
  source: 'search_results'
});

// Track event like
TrackingService.trackEventInteraction('event-123', 'like', {
  previousLikes: 45,
  userType: 'registered'
});

// Track event share
TrackingService.trackEventInteraction('event-123', 'share', {
  platform: 'facebook',
  shareText: 'Check out this amazing event!'
});
```

### 3. Conversion Tracking

```javascript
// Track ticket purchase
TrackingService.trackConversion('purchase', 99.99, {
  orderId: 'order-123',
  eventId: 'event-123',
  ticketCount: 2,
  ticketType: 'vip',
  paymentMethod: 'credit_card'
});

// Track user registration
TrackingService.trackConversion('registration', 0, {
  source: 'event_page',
  referrer: 'google.com',
  userType: 'new'
});

// Track newsletter signup
TrackingService.trackConversion('newsletter_signup', 0, {
  source: 'homepage',
  emailType: 'marketing'
});
```

### 4. Performance Tracking

```javascript
// Track API performance
const startTime = Date.now();
try {
  const response = await fetch('/api/v1/events');
  const endTime = Date.now();
  
  TrackingService.trackPerformance({
    endpoint: '/api/v1/events',
    responseTime: endTime - startTime,
    statusCode: response.status,
    errorMessage: null
  });
} catch (error) {
  TrackingService.trackPerformance({
    endpoint: '/api/v1/events',
    responseTime: Date.now() - startTime,
    statusCode: 500,
    errorMessage: error.message
  });
}
```

## Performance Optimization

### 1. Database Optimization

```sql
-- Create indexes for better query performance
CREATE INDEX idx_user_activity_user_id_created_at ON user_activity_tracking(user_id, created_at);
CREATE INDEX idx_user_activity_event_type_created_at ON user_activity_tracking(event_type, created_at);
CREATE INDEX idx_conversion_tracking_conversion_type_created_at ON conversion_tracking(conversion_type, created_at);
CREATE INDEX idx_performance_tracking_endpoint_created_at ON performance_tracking(endpoint, created_at);
```

### 2. Data Retention Policy

```javascript
// Clean up old tracking data (older than 1 year)
const cleanupOldData = async () => {
  const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  
  await knex('user_activity_tracking')
    .where('created_at', '<', oneYearAgo)
    .del();
    
  await knex('conversion_tracking')
    .where('created_at', '<', oneYearAgo)
    .del();
    
  await knex('performance_tracking')
    .where('created_at', '<', oneYearAgo)
    .del();
};
```

### 3. Batch Processing

```javascript
// Batch tracking requests for better performance
class BatchTrackingService {
  constructor() {
    this.batch = [];
    this.batchSize = 10;
    this.flushInterval = 5000; // 5 seconds
    
    setInterval(() => this.flush(), this.flushInterval);
  }
  
  addToBatch(trackingData) {
    this.batch.push(trackingData);
    
    if (this.batch.length >= this.batchSize) {
      this.flush();
    }
  }
  
  async flush() {
    if (this.batch.length === 0) return;
    
    try {
      await fetch('/api/v1/tracking/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: this.batch })
      });
      
      this.batch = [];
    } catch (error) {
      console.error('Error flushing tracking batch:', error);
    }
  }
}
```

## Security Considerations

### 1. Data Privacy

```javascript
// Anonymize sensitive data
const anonymizeData = (data) => {
  const anonymized = { ...data };
  
  // Remove or hash sensitive fields
  if (anonymized.ipAddress) {
    anonymized.ipAddress = hashIP(anonymized.ipAddress);
  }
  
  if (anonymized.userAgent) {
    anonymized.userAgent = anonymized.userAgent.split(' ')[0]; // Keep only browser
  }
  
  return anonymized;
};
```

### 2. Rate Limiting

```javascript
// Rate limiting middleware for tracking endpoints
const trackingRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many tracking requests from this IP'
});

app.use('/api/v1/tracking', trackingRateLimit);
```

### 3. GDPR Compliance

```javascript
// User consent tracking
const trackWithConsent = (trackingData) => {
  const userConsent = localStorage.getItem('tracking_consent');
  
  if (userConsent === 'granted') {
    return TrackingService.trackActivity(trackingData);
  } else {
    // Store in temporary storage for later processing
    storePendingTracking(trackingData);
  }
};

// Data deletion endpoint
app.delete('/api/v1/tracking/user/:userId', async (req, res) => {
  const { userId } = req.params;
  
  await knex('user_activity_tracking')
    .where('user_id', userId)
    .del();
    
  await knex('conversion_tracking')
    .where('user_id', userId)
    .del();
    
  res.json({ success: true, message: 'User data deleted' });
});
```

## Monitoring and Alerts

### 1. Performance Monitoring

```javascript
// Monitor tracking system performance
const monitorTrackingPerformance = async () => {
  const metrics = await knex('performance_tracking')
    .select('endpoint')
    .avg('response_time as avg_response_time')
    .count('* as request_count')
    .where('created_at', '>=', new Date(Date.now() - 5 * 60 * 1000)) // Last 5 minutes
    .groupBy('endpoint');
    
  metrics.forEach(metric => {
    if (metric.avg_response_time > 1000) { // Alert if > 1 second
      sendAlert(`High response time for ${metric.endpoint}: ${metric.avg_response_time}ms`);
    }
  });
};
```

### 2. Data Quality Monitoring

```javascript
// Monitor data quality
const monitorDataQuality = async () => {
  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  
  const todayCount = await knex('user_activity_tracking')
    .where('created_at', '>=', today)
    .count('* as count')
    .first();
    
  const yesterdayCount = await knex('user_activity_tracking')
    .where('created_at', '>=', yesterday)
    .where('created_at', '<', today)
    .count('* as count')
    .first();
    
  const dropPercentage = ((yesterdayCount.count - todayCount.count) / yesterdayCount.count) * 100;
  
  if (dropPercentage > 50) {
    sendAlert(`Significant drop in tracking data: ${dropPercentage}% decrease`);
  }
};
```

## Future Enhancements

### 1. Machine Learning Integration
- Predictive analytics for user behavior
- Automated anomaly detection
- Personalized recommendations based on tracking data

### 2. Real-time Streaming
- WebSocket integration for live dashboard updates
- Real-time event processing with Apache Kafka
- Live user journey visualization

### 3. Advanced Analytics
- Cohort analysis
- Retention analysis
- Customer lifetime value calculation
- Attribution modeling

### 4. Integration Capabilities
- Google Analytics 4 integration
- Facebook Pixel integration
- Custom webhook support
- Third-party analytics platform exports

## Support and Troubleshooting

### Common Issues

1. **High Database Load**
   - Implement data archiving
   - Use read replicas for analytics queries
   - Optimize database indexes

2. **Missing Tracking Data**
   - Check network connectivity
   - Verify API endpoints
   - Monitor error logs

3. **Performance Issues**
   - Implement batch processing
   - Use caching for frequently accessed data
   - Optimize database queries

### Debug Mode

Enable debug logging:

```javascript
// Enable debug mode
localStorage.setItem('tracking_debug', 'true');

// Debug tracking calls
const debugTracking = (method, data) => {
  if (localStorage.getItem('tracking_debug') === 'true') {
    console.log(`[Tracking Debug] ${method}:`, data);
  }
};
```

## Conclusion

The comprehensive tracking and analytics system provides deep insights into user behavior, enabling data-driven optimization of the Bilten platform. With real-time analytics, user journey analysis, and conversion tracking, you can make informed decisions to improve user experience and business performance.

For additional support or feature requests, please refer to the API documentation or contact the development team.
