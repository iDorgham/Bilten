-- ClickHouse Data Retention and Archival Policies
-- Automated data lifecycle management with tiered storage

-- Create archive database for cold storage
CREATE DATABASE IF NOT EXISTS bilten_analytics_archive;

-- Archive table for old events (cold storage)
CREATE TABLE IF NOT EXISTS bilten_analytics_archive.events_archive (
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
    created_date Date MATERIALIZED toDate(timestamp),
    archived_date Date DEFAULT today()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_date)
ORDER BY (created_date, organizer_id, event_type, timestamp)
SETTINGS storage_policy = 'cold_storage';

-- TTL policies for automatic data movement and deletion
ALTER TABLE bilten_analytics.events MODIFY TTL 
    created_date + INTERVAL 90 DAY TO DISK 'cold',
    created_date + INTERVAL 2 YEAR DELETE;

ALTER TABLE bilten_analytics.page_views MODIFY TTL 
    created_date + INTERVAL 60 DAY TO DISK 'cold',
    created_date + INTERVAL 1 YEAR DELETE;

ALTER TABLE bilten_analytics.ticket_sales MODIFY TTL 
    created_date + INTERVAL 180 DAY TO DISK 'cold',
    created_date + INTERVAL 7 YEAR DELETE; -- Keep financial data longer for compliance

-- Compressed archive table for long-term storage
CREATE TABLE IF NOT EXISTS bilten_analytics_archive.events_compressed (
    year UInt16,
    month UInt8,
    organizer_id UUID,
    event_counts Map(String, UInt64),
    user_metrics Map(String, UInt64),
    revenue_data Map(String, Float64),
    compressed_data String CODEC(ZSTD(3))
) ENGINE = MergeTree()
ORDER BY (year, month, organizer_id);

-- Materialized view for automatic archival
CREATE MATERIALIZED VIEW IF NOT EXISTS bilten_analytics.events_archival_mv
TO bilten_analytics_archive.events_archive
AS SELECT *
FROM bilten_analytics.events
WHERE created_date < today() - INTERVAL 90 DAY;

-- Data retention monitoring table
CREATE TABLE IF NOT EXISTS bilten_analytics.retention_log (
    timestamp DateTime DEFAULT now(),
    table_name String,
    action String,
    records_affected UInt64,
    disk_space_freed_mb Float64,
    retention_policy String,
    status String
) ENGINE = MergeTree()
ORDER BY timestamp;

-- Function to calculate data age and size
CREATE OR REPLACE FUNCTION getDataAge AS (created_date) -> 
    dateDiff('day', created_date, today());

CREATE OR REPLACE FUNCTION getTableSize AS (database, table) -> 
    (SELECT sum(bytes_on_disk) FROM system.parts 
     WHERE database = database AND table = table AND active = 1);

-- Automated cleanup procedures
-- This would typically be run as a scheduled job

-- Procedure to archive old data
CREATE OR REPLACE FUNCTION archiveOldData AS () -> (
    INSERT INTO bilten_analytics_archive.events_archive
    SELECT * FROM bilten_analytics.events
    WHERE created_date < today() - INTERVAL 90 DAY
);

-- Procedure to compress very old data
CREATE OR REPLACE FUNCTION compressArchiveData AS () -> (
    INSERT INTO bilten_analytics_archive.events_compressed
    SELECT 
        toYear(created_date) as year,
        toMonth(created_date) as month,
        organizer_id,
        map(
            'total_events', count(),
            'unique_users', uniq(user_id),
            'unique_sessions', uniq(session_id)
        ) as event_counts,
        map(
            'page_views', countIf(event_type = 'page_view'),
            'purchases', countIf(event_type = 'ticket_purchase'),
            'registrations', countIf(event_type = 'registration')
        ) as user_metrics,
        map(
            'total_revenue', sum(toFloat64OrZero(properties['revenue'])),
            'avg_order_value', avg(toFloat64OrZero(properties['order_value']))
        ) as revenue_data,
        compress(toString(groupArray(*))) as compressed_data
    FROM bilten_analytics_archive.events_archive
    WHERE created_date < today() - INTERVAL 1 YEAR
    GROUP BY year, month, organizer_id
);

-- Data lifecycle policies
CREATE TABLE IF NOT EXISTS bilten_analytics.data_lifecycle_policies (
    policy_name String,
    table_pattern String,
    hot_storage_days UInt16,
    cold_storage_days UInt16,
    archive_days UInt16,
    delete_days UInt16,
    compression_codec String,
    created_at DateTime DEFAULT now(),
    updated_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY policy_name;

-- Insert default policies
INSERT INTO bilten_analytics.data_lifecycle_policies VALUES
('events_standard', 'bilten_analytics.events*', 30, 90, 365, 730, 'ZSTD(3)', now(), now()),
('pageviews_standard', 'bilten_analytics.page_views*', 14, 60, 180, 365, 'ZSTD(3)', now(), now()),
('sales_financial', 'bilten_analytics.ticket_sales*', 90, 180, 1095, 2555, 'ZSTD(1)', now(), now()),
('metrics_aggregated', 'bilten_analytics.metrics_*', 180, 365, 1095, 1825, 'ZSTD(3)', now(), now());

-- Storage policy configuration (this would be in config.xml in production)
-- Creating reference table for storage policies
CREATE TABLE IF NOT EXISTS bilten_analytics.storage_policies (
    policy_name String,
    volume_name String,
    disk_type String,
    path String,
    max_data_part_size_bytes UInt64,
    move_factor Float32
) ENGINE = MergeTree()
ORDER BY policy_name;

INSERT INTO bilten_analytics.storage_policies VALUES
('default', 'hot', 'ssd', '/var/lib/clickhouse/hot/', 10737418240, 0.1),
('default', 'cold', 'hdd', '/var/lib/clickhouse/cold/', 107374182400, 0.01),
('archive', 'archive', 'hdd', '/var/lib/clickhouse/archive/', 1073741824000, 0.001);

-- Monitoring queries for data retention
CREATE VIEW bilten_analytics.data_retention_status AS
SELECT 
    table AS table_name,
    sum(rows) AS total_rows,
    sum(bytes_on_disk) / 1024 / 1024 / 1024 AS size_gb,
    min(min_date) AS oldest_data,
    max(max_date) AS newest_data,
    dateDiff('day', min(min_date), today()) AS data_age_days
FROM system.parts 
WHERE database = 'bilten_analytics' AND active = 1
GROUP BY table
ORDER BY size_gb DESC;

-- Automated retention job status
CREATE TABLE IF NOT EXISTS bilten_analytics.retention_job_status (
    job_id UUID DEFAULT generateUUIDv4(),
    job_name String,
    start_time DateTime,
    end_time Nullable(DateTime),
    status String, -- 'running', 'completed', 'failed'
    records_processed UInt64,
    error_message Nullable(String)
) ENGINE = MergeTree()
ORDER BY start_time;