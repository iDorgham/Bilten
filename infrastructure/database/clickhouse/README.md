# ClickHouse Analytics Database

This directory contains the ClickHouse analytics database configuration and setup for the Bilten platform. The analytics infrastructure provides high-performance data ingestion, storage, and querying capabilities for event tracking, user analytics, and business intelligence.

## Overview

The ClickHouse analytics system includes:

- **Real-time event tracking** - High-throughput ingestion of user interactions
- **Materialized views** - Pre-aggregated data for fast analytics queries
- **Data retention policies** - Automated data lifecycle management
- **Cluster configuration** - Scalable distributed setup
- **Monitoring and alerting** - Comprehensive health monitoring

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Application   │───▶│  Ingestion API   │───▶│   ClickHouse    │
│     Events      │    │   (Buffered)     │    │   Analytics     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   Data Quality   │    │  Materialized   │
                       │   Validation     │    │     Views       │
                       └──────────────────┘    └─────────────────┘
```

## Database Schema

### Core Tables

1. **events** - Main event tracking table
   - User interactions, page views, clicks
   - Partitioned by month for performance
   - Indexed for fast queries by organizer, event type

2. **page_views** - Detailed page view analytics
   - Page URLs, referrers, session data
   - Duration tracking for engagement metrics

3. **ticket_sales** - Financial transaction tracking
   - Revenue analytics and sales metrics
   - Longer retention for compliance

4. **metrics_daily** - Pre-aggregated daily metrics
   - Fast dashboard queries
   - Reduced storage for historical data

### Materialized Views

- **events_hourly_mv** - Hourly event aggregations
- **organizer_daily_metrics_mv** - Daily organizer performance
- **event_performance_mv** - Event-specific analytics
- **user_funnel_mv** - Conversion funnel analysis
- **realtime_dashboard_mv** - 5-minute real-time metrics

## Setup Instructions

### 1. Prerequisites

Ensure you have:
- Docker and Docker Compose installed
- Node.js 18+ for management scripts
- ClickHouse client dependencies

```bash
cd bilten-backend
npm install
```

### 2. Start ClickHouse Services

```bash
# Start ClickHouse and Zookeeper
docker-compose up -d clickhouse zookeeper

# Wait for services to be ready
docker-compose logs -f clickhouse
```

### 3. Initialize Analytics Database

```bash
# Run the setup script
npm run clickhouse:setup

# Verify setup
npm run clickhouse:health
```

### 4. Start Analytics Ingestion

```bash
# Start the ingestion service
npm run analytics:start

# Or generate test data
npm run analytics:test 10  # 10 events per second
```

## Configuration Files

### SQL Schema Files

- `01-create-analytics-tables.sql` - Core table definitions
- `02-analytics-cluster-config.sql` - Cluster and replication setup
- `03-materialized-views.sql` - Pre-aggregated view definitions
- `04-data-ingestion-pipeline.sql` - Real-time ingestion setup
- `05-data-retention-archival.sql` - Data lifecycle policies

### Configuration

- `config.xml` - ClickHouse server configuration
- Storage policies for hot/cold/archive tiers
- Memory and performance optimization
- User access controls

## Data Ingestion

### Event Tracking API

```javascript
const analytics = new AnalyticsIngestionService();

// Track user events
await analytics.trackEvent({
    event_type: 'page_view',
    event_name: 'Event Details Page',
    organizer_id: 'org-123',
    user_id: 'user-456',
    properties: {
        event_id: 'evt-789',
        browser: 'Chrome',
        device_type: 'desktop'
    }
});

// Track ticket sales
await analytics.trackTicketSale({
    event_id: 'evt-789',
    organizer_id: 'org-123',
    user_id: 'user-456',
    quantity: 2,
    price: 50.00,
    currency: 'USD'
});
```

### Batch Processing

The ingestion service automatically batches events for optimal performance:
- Buffer size: 1000 events
- Flush interval: 5 seconds
- Automatic retry on failures

## Monitoring and Maintenance

### Health Monitoring

```bash
# Run comprehensive health checks
npm run clickhouse:monitor

# Check specific metrics
npm run clickhouse:health

# Generate monitoring report
node scripts/clickhouse-monitoring.js report
```

### Performance Monitoring

The system tracks:
- Query performance and slow queries
- Storage usage and growth
- Ingestion rates and throughput
- Memory and CPU utilization
- Replication lag (if configured)

### Data Retention

Automatic data lifecycle management:
- **Hot storage**: 30 days (SSD)
- **Cold storage**: 90 days (HDD)
- **Archive**: 2 years (compressed)
- **Deletion**: After retention period

## Querying Analytics Data

### Common Queries

```sql
-- Daily event counts by organizer
SELECT 
    toDate(timestamp) as date,
    organizer_id,
    count() as events,
    uniq(user_id) as unique_users
FROM bilten_analytics.events 
WHERE timestamp >= today() - INTERVAL 30 DAY
GROUP BY date, organizer_id
ORDER BY date DESC;

-- Event funnel analysis
SELECT 
    event_type,
    count() as events,
    uniq(user_id) as unique_users,
    count() / (SELECT count() FROM bilten_analytics.events WHERE event_type = 'page_view') * 100 as conversion_rate
FROM bilten_analytics.events 
WHERE timestamp >= today() - INTERVAL 7 DAY
GROUP BY event_type
ORDER BY events DESC;

-- Revenue analytics
SELECT 
    toDate(timestamp) as date,
    organizer_id,
    sum(price * quantity) as revenue,
    count() as transactions,
    avg(price) as avg_ticket_price
FROM bilten_analytics.ticket_sales 
WHERE timestamp >= today() - INTERVAL 30 DAY
GROUP BY date, organizer_id
ORDER BY date DESC, revenue DESC;
```

### Using Materialized Views

```sql
-- Fast dashboard metrics (pre-aggregated)
SELECT * FROM bilten_analytics.organizer_daily_metrics_mv 
WHERE date >= today() - INTERVAL 7 DAY
ORDER BY date DESC;

-- Real-time metrics (5-minute intervals)
SELECT * FROM bilten_analytics.realtime_dashboard_mv 
WHERE interval_start >= now() - INTERVAL 1 HOUR
ORDER BY interval_start DESC;
```

## Troubleshooting

### Common Issues

1. **Connection Errors**
   ```bash
   # Check ClickHouse status
   docker-compose ps clickhouse
   docker-compose logs clickhouse
   ```

2. **Slow Queries**
   ```sql
   -- Check query performance
   SELECT query, query_duration_ms, read_rows 
   FROM system.query_log 
   WHERE query_duration_ms > 1000 
   ORDER BY query_duration_ms DESC;
   ```

3. **Storage Issues**
   ```sql
   -- Check storage usage
   SELECT 
       table,
       sum(bytes_on_disk) / 1024 / 1024 / 1024 as size_gb,
       sum(rows) as total_rows
   FROM system.parts 
   WHERE database = 'bilten_analytics' AND active = 1
   GROUP BY table;
   ```

### Performance Optimization

1. **Indexing**: Ensure proper indexes for query patterns
2. **Partitioning**: Use monthly partitions for large tables
3. **Compression**: Enable ZSTD compression for storage efficiency
4. **Memory**: Adjust memory settings based on workload

## Security

- User authentication and access controls
- Network security with proper firewall rules
- Data encryption at rest and in transit
- Audit logging for compliance

## Backup and Recovery

- Automated daily backups
- Point-in-time recovery capabilities
- Cross-region replication for disaster recovery
- Backup verification and testing

## Scaling

The ClickHouse setup supports horizontal scaling:
- Add more shards for increased write throughput
- Add replicas for read scaling and high availability
- Use distributed tables for cluster-wide queries
- Implement proper load balancing

For production deployments, consider:
- Multiple ClickHouse nodes
- Dedicated Zookeeper cluster
- Load balancers for high availability
- Monitoring and alerting systems