-- ClickHouse Materialized Views for Common Analytics Queries
-- Pre-aggregated views for fast analytics and reporting

-- Hourly event aggregations
CREATE MATERIALIZED VIEW IF NOT EXISTS bilten_analytics.events_hourly_mv
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(hour)
ORDER BY (hour, organizer_id, event_type)
AS SELECT
    toStartOfHour(timestamp) as hour,
    organizer_id,
    event_id,
    event_type,
    event_name,
    count() as event_count,
    uniq(user_id) as unique_users,
    uniq(session_id) as unique_sessions,
    uniq(ip_address) as unique_ips
FROM bilten_analytics.events
GROUP BY hour, organizer_id, event_id, event_type, event_name;

-- Daily organizer metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS bilten_analytics.organizer_daily_metrics_mv
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, organizer_id)
AS SELECT
    toDate(timestamp) as date,
    organizer_id,
    count() as total_events,
    uniq(user_id) as unique_visitors,
    uniq(session_id) as unique_sessions,
    countIf(event_type = 'page_view') as page_views,
    countIf(event_type = 'ticket_purchase') as ticket_purchases,
    countIf(event_type = 'event_view') as event_views,
    countIf(event_type = 'registration') as registrations
FROM bilten_analytics.events
WHERE organizer_id IS NOT NULL
GROUP BY date, organizer_id;

-- Event performance metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS bilten_analytics.event_performance_mv
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, event_id)
AS SELECT
    toDate(timestamp) as date,
    event_id,
    organizer_id,
    count() as total_interactions,
    uniq(user_id) as unique_visitors,
    uniq(session_id) as unique_sessions,
    countIf(event_type = 'event_view') as views,
    countIf(event_type = 'ticket_purchase') as purchases,
    countIf(event_type = 'share') as shares,
    countIf(event_type = 'favorite') as favorites,
    avg(if(event_type = 'page_duration', toFloat64(properties['duration']), NULL)) as avg_duration
FROM bilten_analytics.events
WHERE event_id IS NOT NULL
GROUP BY date, event_id, organizer_id;

-- User behavior funnel analysis
CREATE MATERIALIZED VIEW IF NOT EXISTS bilten_analytics.user_funnel_mv
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, organizer_id, event_id)
AS SELECT
    toDate(timestamp) as date,
    organizer_id,
    event_id,
    countIf(event_type = 'event_view') as step1_views,
    countIf(event_type = 'ticket_view') as step2_ticket_views,
    countIf(event_type = 'checkout_start') as step3_checkout_starts,
    countIf(event_type = 'payment_info') as step4_payment_info,
    countIf(event_type = 'ticket_purchase') as step5_purchases,
    uniq(user_id) as unique_users_in_funnel
FROM bilten_analytics.events
WHERE event_id IS NOT NULL
GROUP BY date, organizer_id, event_id;

-- Real-time dashboard metrics (5-minute intervals)
CREATE MATERIALIZED VIEW IF NOT EXISTS bilten_analytics.realtime_dashboard_mv
ENGINE = ReplacingMergeTree()
PARTITION BY toYYYYMM(interval_start)
ORDER BY (interval_start, organizer_id)
AS SELECT
    toStartOfFiveMinute(timestamp) as interval_start,
    organizer_id,
    count() as total_events,
    uniq(user_id) as active_users,
    uniq(session_id) as active_sessions,
    countIf(event_type = 'page_view') as page_views,
    countIf(event_type = 'ticket_purchase') as purchases,
    countIf(event_type = 'error') as errors,
    avg(if(event_type = 'page_load', toFloat64(properties['load_time']), NULL)) as avg_load_time
FROM bilten_analytics.events
WHERE timestamp >= now() - INTERVAL 1 DAY
GROUP BY interval_start, organizer_id;

-- Geographic analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS bilten_analytics.geographic_metrics_mv
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, country, city)
AS SELECT
    toDate(timestamp) as date,
    properties['country'] as country,
    properties['city'] as city,
    properties['region'] as region,
    count() as total_events,
    uniq(user_id) as unique_users,
    uniq(organizer_id) as unique_organizers,
    countIf(event_type = 'ticket_purchase') as purchases
FROM bilten_analytics.events
WHERE properties['country'] != ''
GROUP BY date, country, city, region;

-- Device and browser analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS bilten_analytics.device_analytics_mv
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, device_type, browser)
AS SELECT
    toDate(timestamp) as date,
    properties['device_type'] as device_type,
    properties['browser'] as browser,
    properties['os'] as operating_system,
    count() as total_events,
    uniq(user_id) as unique_users,
    uniq(session_id) as unique_sessions,
    avg(if(event_type = 'page_load', toFloat64(properties['load_time']), NULL)) as avg_load_time
FROM bilten_analytics.events
WHERE properties['device_type'] != ''
GROUP BY date, device_type, browser, operating_system;

-- Revenue analytics from ticket sales
CREATE MATERIALIZED VIEW IF NOT EXISTS bilten_analytics.revenue_analytics_mv
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, organizer_id, currency)
AS SELECT
    toDate(timestamp) as date,
    organizer_id,
    currency,
    sum(price * quantity) as total_revenue,
    sum(quantity) as total_tickets_sold,
    count() as total_transactions,
    avg(price) as avg_ticket_price,
    uniq(user_id) as unique_buyers
FROM bilten_analytics.ticket_sales
GROUP BY date, organizer_id, currency;