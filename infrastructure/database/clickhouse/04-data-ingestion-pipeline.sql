-- ClickHouse Data Ingestion Pipeline Configuration
-- Real-time data ingestion setup with Kafka integration and buffer tables

-- Create Kafka engine tables for real-time ingestion
CREATE TABLE IF NOT EXISTS bilten_analytics.events_kafka (
    event_id UUID,
    session_id UUID,
    user_id Nullable(UUID),
    organizer_id Nullable(UUID),
    event_type String,
    event_name String,
    timestamp DateTime64(3),
    properties String, -- JSON string that will be parsed
    user_agent String,
    ip_address String,
    referrer String,
    page_url String
) ENGINE = Kafka()
SETTINGS 
    kafka_broker_list = 'localhost:9092',
    kafka_topic_list = 'bilten_events',
    kafka_group_name = 'bilten_analytics_group',
    kafka_format = 'JSONEachRow',
    kafka_num_consumers = 3,
    kafka_max_block_size = 1048576;

-- Buffer table for high-throughput ingestion
CREATE TABLE IF NOT EXISTS bilten_analytics.events_buffer AS bilten_analytics.events
ENGINE = Buffer(bilten_analytics, events, 16, 10, 100, 10000, 1000000, 10000000, 100000000);

-- Materialized view to transform and insert Kafka data
CREATE MATERIALIZED VIEW IF NOT EXISTS bilten_analytics.events_kafka_mv
TO bilten_analytics.events_buffer
AS SELECT
    event_id,
    session_id,
    user_id,
    organizer_id,
    event_type,
    event_name,
    timestamp,
    JSONExtract(properties, 'Map(String, String)') as properties,
    user_agent,
    ip_address,
    referrer,
    page_url,
    toDate(timestamp) as created_date
FROM bilten_analytics.events_kafka;

-- Create HTTP interface table for direct API ingestion
CREATE TABLE IF NOT EXISTS bilten_analytics.events_http (
    event_id UUID DEFAULT generateUUIDv4(),
    session_id UUID,
    user_id Nullable(UUID),
    organizer_id Nullable(UUID),
    event_type String,
    event_name String,
    timestamp DateTime64(3) DEFAULT now64(),
    properties Map(String, String),
    user_agent String,
    ip_address String,
    referrer String,
    page_url String
) ENGINE = URL('http://localhost:8123/bilten_analytics/events_http', 'JSONEachRow');

-- Create queue table for batch processing
CREATE TABLE IF NOT EXISTS bilten_analytics.events_queue (
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
    processed UInt8 DEFAULT 0,
    created_date Date MATERIALIZED toDate(timestamp)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_date)
ORDER BY (created_date, timestamp)
SETTINGS index_granularity = 8192;

-- Data validation and quality checks
CREATE TABLE IF NOT EXISTS bilten_analytics.data_quality_log (
    timestamp DateTime DEFAULT now(),
    table_name String,
    check_type String,
    check_result String,
    error_count UInt64,
    total_count UInt64,
    details String
) ENGINE = MergeTree()
ORDER BY timestamp;

-- Function to validate event data
CREATE OR REPLACE FUNCTION validateEventData AS (
    event_id,
    session_id,
    event_type,
    timestamp
) -> if(
    isNotNull(event_id) AND 
    isNotNull(session_id) AND 
    event_type != '' AND 
    timestamp > '2020-01-01' AND 
    timestamp <= now() + INTERVAL 1 HOUR,
    1, 0
);

-- Materialized view for data quality monitoring
CREATE MATERIALIZED VIEW IF NOT EXISTS bilten_analytics.data_quality_mv
TO bilten_analytics.data_quality_log
AS SELECT
    now() as timestamp,
    'events' as table_name,
    'validation' as check_type,
    if(validateEventData(event_id, session_id, event_type, timestamp) = 1, 'PASS', 'FAIL') as check_result,
    countIf(validateEventData(event_id, session_id, event_type, timestamp) = 0) as error_count,
    count() as total_count,
    'Automated validation check' as details
FROM bilten_analytics.events_buffer
GROUP BY check_result;

-- Create deduplication table
CREATE TABLE IF NOT EXISTS bilten_analytics.events_dedup (
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
) ENGINE = ReplacingMergeTree(timestamp)
PARTITION BY toYYYYMM(created_date)
ORDER BY (event_id, session_id, event_type);

-- Materialized view for deduplication
CREATE MATERIALIZED VIEW IF NOT EXISTS bilten_analytics.events_dedup_mv
TO bilten_analytics.events_dedup
AS SELECT DISTINCT
    event_id,
    session_id,
    user_id,
    organizer_id,
    event_type,
    event_name,
    timestamp,
    properties,
    user_agent,
    ip_address,
    referrer,
    page_url
FROM bilten_analytics.events_buffer;

-- Create sampling table for large dataset analysis
CREATE TABLE IF NOT EXISTS bilten_analytics.events_sample AS bilten_analytics.events
ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_date)
ORDER BY (created_date, organizer_id, event_type, timestamp)
SAMPLE BY intHash32(event_id);

-- Materialized view for sampling (10% sample)
CREATE MATERIALIZED VIEW IF NOT EXISTS bilten_analytics.events_sample_mv
TO bilten_analytics.events_sample
AS SELECT *
FROM bilten_analytics.events
WHERE rand() % 10 = 0;