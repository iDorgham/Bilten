-- ClickHouse Cluster Configuration for Analytics
-- High-performance analytics cluster setup with sharding and replication

-- Create cluster configuration (this would typically be in config.xml, but we'll define tables for cluster awareness)
CREATE DATABASE IF NOT EXISTS bilten_analytics_cluster;

-- Distributed table for events across cluster
CREATE TABLE IF NOT EXISTS bilten_analytics.events_distributed AS bilten_analytics.events
ENGINE = Distributed('bilten_cluster', 'bilten_analytics', 'events', rand());

-- Distributed table for metrics
CREATE TABLE IF NOT EXISTS bilten_analytics.metrics_daily_distributed AS bilten_analytics.metrics_daily
ENGINE = Distributed('bilten_cluster', 'bilten_analytics', 'metrics_daily', rand());

-- Distributed table for page views
CREATE TABLE IF NOT EXISTS bilten_analytics.page_views_distributed AS bilten_analytics.page_views
ENGINE = Distributed('bilten_cluster', 'bilten_analytics', 'page_views', rand());

-- Distributed table for ticket sales
CREATE TABLE IF NOT EXISTS bilten_analytics.ticket_sales_distributed AS bilten_analytics.ticket_sales
ENGINE = Distributed('bilten_cluster', 'bilten_analytics', 'ticket_sales', rand());

-- Create replicated tables for high availability
CREATE TABLE IF NOT EXISTS bilten_analytics.events_replicated (
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
) ENGINE = ReplicatedMergeTree('/clickhouse/tables/{shard}/events', '{replica}')
PARTITION BY toYYYYMM(created_date)
ORDER BY (created_date, organizer_id, event_type, timestamp)
SETTINGS index_granularity = 8192;

-- Performance optimization settings
ALTER TABLE bilten_analytics.events MODIFY SETTING merge_with_ttl_timeout = 3600;
ALTER TABLE bilten_analytics.events MODIFY SETTING max_parts_in_total = 10000;
ALTER TABLE bilten_analytics.events MODIFY SETTING parts_to_delay_insert = 1000;
ALTER TABLE bilten_analytics.events MODIFY SETTING parts_to_throw_insert = 3000;

-- Create indexes for better query performance
ALTER TABLE bilten_analytics.events ADD INDEX idx_organizer_id organizer_id TYPE bloom_filter GRANULARITY 1;
ALTER TABLE bilten_analytics.events ADD INDEX idx_event_type event_type TYPE set(100) GRANULARITY 1;
ALTER TABLE bilten_analytics.events ADD INDEX idx_user_id user_id TYPE bloom_filter GRANULARITY 1;

-- TTL policies for data retention
ALTER TABLE bilten_analytics.events MODIFY TTL created_date + INTERVAL 2 YEAR;
ALTER TABLE bilten_analytics.page_views MODIFY TTL created_date + INTERVAL 1 YEAR;
ALTER TABLE bilten_analytics.metrics_daily MODIFY TTL date + INTERVAL 5 YEAR;