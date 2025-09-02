# Event Analytics and Reporting Implementation

## Overview

This document describes the comprehensive event analytics and reporting system implemented for the Bilten platform. The system provides real-time analytics tracking, detailed reporting, and insights for events, organizers, and platform-wide metrics.

## Components Implemented

### 1. Analytics Service (`src/services/AnalyticsService.js`)

**Core Functionality:**

- Event tracking with ClickHouse and fallback to cache/database
- Real-time analytics counters using Redis
- Event, organizer, and platform-wide analytics aggregation
- Automatic fallback mechanisms for high availability

**Key Methods:**

- `trackEvent(eventData)` - Track analytics events
- `getEventAnalytics(eventId, timeframe)` - Get event performance metrics
- `getOrganizerAnalytics(organizerId, timeframe)` - Get organizer dashboard data
- `getPlatformAnalytics(timeframe)` - Get platform-wide statistics
- `getRealTimeAnalytics(entityType, entityId)` - Get real-time metrics

### 2. Analytics Routes (`src/routes/analytics.js`)

**API Endpoints:**

- `POST /analytics/track` - Track analytics events
- `GET /analytics/events/:eventId` - Get event analytics
- `GET /analytics/organizers/:organizerId` - Get organizer analytics
- `GET /analytics/platform` - Get platform analytics
- `GET /analytics/realtime/:entityType/:entityId` - Get real-time data
- `GET /analytics/reports/:type/:entityId` - Generate reports
- `POST /analytics/events/summary` - Get multiple events summary
- `GET /analytics/popular/events` - Get popular events
- `GET /analytics/health` - Analytics system health check

### 3. Analytics Middleware (`src/middleware/analyticsMiddleware.js`)

**Middleware Components:**

- `analyticsMiddleware` - Automatic page view tracking
- `eventAnalyticsMiddleware` - Event-specific interaction tracking
- `ticketAnalyticsMiddleware` - Ticket purchase tracking
- `userAnalyticsMiddleware` - User registration/login tracking

**Features:**

- Session management with cookies
- Automatic event tracking for common interactions
- Non-blocking analytics (doesn't affect user experience)
- Configurable tracking options

### 4. Report Generator (`src/utils/reportGenerator.js`)

**Report Types:**

- Event Performance Reports
- Organizer Dashboard Reports
- Platform Overview Reports
- Trending Analysis Reports
- Conversion Funnel Reports

**Output Formats:**

- JSON (default)
- CSV for data export
- HTML for presentation

**Features:**

- Automated insights and recommendations
- Performance trend analysis
- Geographic and demographic breakdowns
- Action items for optimization

### 5. Integration with Existing Systems

**Event Model Enhancements:**

- Added analytics fields (view_count, bookmark_count, registration_count, popularity_score)
- Real-time counter updates
- Trending events functionality

**Cache Integration:**

- Redis-based real-time counters
- Analytics data caching for performance
- Fallback mechanisms when cache is unavailable

**Database Integration:**

- PostgreSQL for persistent analytics storage
- ClickHouse for high-volume analytics data (optional)
- Graceful degradation when services are unavailable

## Analytics Data Flow

```
User Interaction → Middleware → Analytics Service → Storage (ClickHouse/Redis/PostgreSQL)
                                      ↓
                              Real-time Updates → Cache → API Responses
```

## Key Features

### 1. Multi-tier Storage Strategy

- **ClickHouse**: High-volume analytics data (primary)
- **Redis**: Real-time counters and caching
- **PostgreSQL**: Fallback and persistent storage

### 2. Real-time Analytics

- Live view counters
- Real-time ticket sales tracking
- Current viewer counts
- Instant metric updates

### 3. Comprehensive Reporting

- Event performance analysis
- Organizer dashboard metrics
- Platform-wide statistics
- Trending analysis
- Conversion funnel tracking

### 4. Intelligent Insights

- Automated recommendations
- Performance trend analysis
- Optimization suggestions
- Predictive analytics

### 5. High Availability Design

- Graceful degradation
- Multiple fallback mechanisms
- Non-blocking analytics tracking
- Error handling and recovery

## Usage Examples

### Track an Event

```javascript
await AnalyticsService.trackEvent({
  event_type: "event_view",
  event_name: "Event Detail View",
  properties: { event_id: "event123" },
  user_id: "user456",
  session_id: "session789",
});
```

### Get Event Analytics

```javascript
const analytics = await AnalyticsService.getEventAnalytics("event123", "week");
console.log(`Views: ${analytics.metrics.total_views}`);
console.log(`Conversion Rate: ${analytics.metrics.conversion_rate}%`);
```

### Generate Report

```javascript
const report = await ReportGenerator.generateEventPerformanceReport(
  "event123",
  "month",
  "json"
);
```

### API Usage

```bash
# Track event
curl -X POST /analytics/track \
  -H "Content-Type: application/json" \
  -d '{"event_type":"page_view","event_name":"Homepage Visit"}'

# Get event analytics
curl /analytics/events/event123?timeframe=week

# Generate report
curl /analytics/reports/event/event123?format=csv
```

## Performance Considerations

### 1. Caching Strategy

- 5-minute cache for analytics data
- 1-hour cache for real-time counters
- 15-minute cache for platform metrics

### 2. Batch Processing

- Events batched for ClickHouse insertion
- Configurable batch sizes and intervals
- Automatic retry mechanisms

### 3. Asynchronous Processing

- Non-blocking event tracking
- Background report generation
- Async cache updates

## Monitoring and Health

### Health Check Endpoint

`GET /analytics/health` provides:

- Service status
- ClickHouse connectivity
- Cache availability
- Error rates

### Metrics Tracked

- Event tracking success rate
- API response times
- Cache hit rates
- Database query performance

## Configuration

### Environment Variables

```bash
# ClickHouse Configuration
CLICKHOUSE_HOST=localhost
CLICKHOUSE_PORT=8123
CLICKHOUSE_USER=bilten_user
CLICKHOUSE_PASSWORD=bilten_password
CLICKHOUSE_DATABASE=bilten_analytics

# Redis Configuration
REDIS_REALTIME_URL=redis://localhost:6381

# Analytics Settings
ANALYTICS_BATCH_SIZE=1000
ANALYTICS_FLUSH_INTERVAL=5000
```

### Feature Flags

- `ENABLE_CLICKHOUSE` - Enable ClickHouse analytics
- `ENABLE_REAL_TIME_ANALYTICS` - Enable real-time tracking
- `ANALYTICS_DEBUG_MODE` - Enable debug logging

## Testing

### Test Coverage

- Unit tests for AnalyticsService
- Integration tests for API endpoints
- Middleware functionality tests
- Report generation tests

### Test Files

- `src/__tests__/analytics.test.js` - Comprehensive test suite
- `src/examples/analyticsExample.js` - Usage examples and demos

## Future Enhancements

### Planned Features

1. **Machine Learning Integration**

   - Predictive analytics
   - Anomaly detection
   - Recommendation engine

2. **Advanced Visualizations**

   - Interactive dashboards
   - Real-time charts
   - Geographic heat maps

3. **Enhanced Reporting**

   - Scheduled reports
   - Email notifications
   - Custom report builders

4. **Performance Optimizations**
   - Data partitioning
   - Query optimization
   - Caching improvements

## Deployment Notes

### Prerequisites

- PostgreSQL database
- Redis server (optional, for real-time features)
- ClickHouse server (optional, for high-volume analytics)

### Setup Steps

1. Install dependencies: `npm install`
2. Configure environment variables
3. Run database migrations
4. Initialize Redis infrastructure: `npm run redis:init`
5. Setup ClickHouse: `npm run clickhouse:setup`
6. Start analytics ingestion: `npm run analytics:start`

### Production Considerations

- Monitor ClickHouse disk usage
- Set up Redis clustering for high availability
- Configure log rotation
- Set up monitoring and alerting
- Regular backup of analytics data

## API Documentation

Complete API documentation is available through the `/analytics` endpoints. Each endpoint includes:

- Request/response schemas
- Error handling
- Rate limiting information
- Authentication requirements

## Support and Maintenance

### Logging

- Structured logging with Winston
- Error tracking and alerting
- Performance monitoring
- Debug mode for troubleshooting

### Maintenance Tasks

- Regular data cleanup
- Index optimization
- Cache warming
- Performance tuning

This analytics system provides a robust foundation for understanding user behavior, optimizing event performance, and making data-driven decisions for the Bilten platform.
