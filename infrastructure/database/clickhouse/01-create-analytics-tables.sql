-- ClickHouse Analytics Database Schema
-- Optimized for high-performance analytics and reporting

-- Create database
CREATE DATABASE IF NOT EXISTS bilten_analytics;

-- Event tracking table for analytics
CREATE TABLE IF NOT EXISTS bilten_analytics.events (
    event_id UUID,
    session_id UUID,
    user_id Nullable(UUID),
    organizer_id Nullable(UUID),
    event_type String,
    event_name String,
    timestamp DateTime64(3),
    properties Map(String, String),
    user_agent String,
    ip_address String,
    referrer String,
    page_url String,
    created_date Date MATERIALIZED toDate(timestamp)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_date)
ORDER BY (created_date, organizer_id, event_type, timestamp);

-- Aggregated metrics table
CREATE TABLE IF NOT EXISTS bilten_analytics.metrics_daily (
    date Date,
    organizer_id UUID,
    event_id Nullable(UUID),
    metric_name String,
    metric_value Float64,
    dimensions Map(String, String)
) ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, organizer_id, metric_name);

-- Real-time metrics table
CREATE TABLE IF NOT EXISTS bilten_analytics.metrics_realtime (
    minute DateTime,
    organizer_id UUID,
    event_id Nullable(UUID),
    event_type String,
    event_count UInt64,
    unique_users UInt64,
    unique_sessions UInt64
) ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(minute)
ORDER BY (minute, organizer_id, event_type);

-- Page views tracking
CREATE TABLE IF NOT EXISTS bilten_analytics.page_views (
    timestamp DateTime64(3),
    session_id UUID,
    user_id Nullable(UUID),
    organizer_id Nullable(UUID),
    page_url String,
    referrer String,
    user_agent String,
    ip_address String,
    duration_seconds Nullable(UInt32),
    created_date Date MATERIALIZED toDate(timestamp)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_date)
ORDER BY (created_date, organizer_id, timestamp);

-- Ticket sales analytics
CREATE TABLE IF NOT EXISTS bilten_analytics.ticket_sales (
    timestamp DateTime64(3),
    event_id UUID,
    organizer_id UUID,
    ticket_type_id UUID,
    user_id UUID,
    quantity UInt32,
    price Float64,
    currency String,
    payment_method String,
    created_date Date MATERIALIZED toDate(timestamp)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_date)
ORDER BY (created_date, organizer_id, event_id, timestamp);

-- Real-time analytics materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS bilten_analytics.events_realtime_mv
TO bilten_analytics.metrics_realtime
AS SELECT
    toStartOfMinute(timestamp) as minute,
    organizer_id,
    event_id,
    event_type,
    count() as event_count,
    uniq(user_id) as unique_users,
    uniq(session_id) as unique_sessions
FROM bilten_analytics.events
GROUP BY minute, organizer_id, event_id, event_type;