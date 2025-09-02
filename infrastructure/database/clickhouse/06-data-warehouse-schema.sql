-- Data Warehouse Star Schema for Business Intelligence
-- Optimized dimensional model for analytics and reporting

-- Create data warehouse database
CREATE DATABASE IF NOT EXISTS bilten_warehouse;

-- ============================================================================
-- DIMENSION TABLES
-- ============================================================================

-- Date dimension table
CREATE TABLE IF NOT EXISTS bilten_warehouse.dim_date (
    date_key UInt32,
    date Date,
    year UInt16,
    quarter UInt8,
    month UInt8,
    month_name String,
    day UInt8,
    day_of_week UInt8,
    day_name String,
    week_of_year UInt8,
    is_weekend UInt8,
    is_holiday UInt8,
    fiscal_year UInt16,
    fiscal_quarter UInt8,
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY date_key;

-- Time dimension table (for intraday analysis)
CREATE TABLE IF NOT EXISTS bilten_warehouse.dim_time (
    time_key UInt32,
    hour UInt8,
    minute UInt8,
    second UInt8,
    time_of_day String,
    hour_name String,
    is_business_hour UInt8,
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY time_key;

-- User dimension table
CREATE TABLE IF NOT EXISTS bilten_warehouse.dim_user (
    user_key UInt64,
    user_id UUID,
    email String,
    first_name String,
    last_name String,
    registration_date Date,
    user_type String,
    status String,
    country String,
    city String,
    age_group String,
    gender String,
    is_active UInt8,
    lifetime_value Float64,
    total_events_attended UInt32,
    total_tickets_purchased UInt32,
    scd_start_date DateTime,
    scd_end_date Nullable(DateTime),
    scd_version UInt32,
    is_current UInt8 DEFAULT 1,
    created_at DateTime DEFAULT now(),
    updated_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (user_key, scd_version);

-- Organizer dimension table
CREATE TABLE IF NOT EXISTS bilten_warehouse.dim_organizer (
    organizer_key UInt64,
    organizer_id UUID,
    organization_name String,
    contact_email String,
    phone String,
    website String,
    industry String,
    organization_size String,
    registration_date Date,
    subscription_tier String,
    status String,
    country String,
    city String,
    total_events_created UInt32,
    total_revenue Float64,
    avg_event_rating Float32,
    scd_start_date DateTime,
    scd_end_date Nullable(DateTime),
    scd_version UInt32,
    is_current UInt8 DEFAULT 1,
    created_at DateTime DEFAULT now(),
    updated_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (organizer_key, scd_version);

-- Event dimension table
CREATE TABLE IF NOT EXISTS bilten_warehouse.dim_event (
    event_key UInt64,
    event_id UUID,
    organizer_key UInt64,
    title String,
    category String,
    subcategory String,
    event_type String,
    format String, -- online, offline, hybrid
    status String,
    capacity UInt32,
    start_date Date,
    end_date Date,
    duration_hours Float32,
    venue_name String,
    venue_city String,
    venue_country String,
    price_tier String, -- free, low, medium, high, premium
    min_price Float64,
    max_price Float64,
    avg_price Float64,
    total_tickets_available UInt32,
    is_recurring UInt8,
    scd_start_date DateTime,
    scd_end_date Nullable(DateTime),
    scd_version UInt32,
    is_current UInt8 DEFAULT 1,
    created_at DateTime DEFAULT now(),
    updated_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (event_key, scd_version);

-- Ticket type dimension table
CREATE TABLE IF NOT EXISTS bilten_warehouse.dim_ticket_type (
    ticket_type_key UInt64,
    ticket_type_id UUID,
    event_key UInt64,
    name String,
    description String,
    price Float64,
    currency String,
    quantity_available UInt32,
    is_transferable UInt8,
    is_refundable UInt8,
    sales_start_date Date,
    sales_end_date Date,
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY ticket_type_key;

-- Geography dimension table
CREATE TABLE IF NOT EXISTS bilten_warehouse.dim_geography (
    geography_key UInt64,
    country_code String,
    country_name String,
    region String,
    city String,
    timezone String,
    currency String,
    population UInt64,
    gdp_per_capita Float64,
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY geography_key;

-- Device dimension table
CREATE TABLE IF NOT EXISTS bilten_warehouse.dim_device (
    device_key UInt64,
    device_type String,
    browser String,
    browser_version String,
    operating_system String,
    os_version String,
    screen_resolution String,
    is_mobile UInt8,
    is_tablet UInt8,
    is_desktop UInt8,
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY device_key;

-- ============================================================================
-- FACT TABLES
-- ============================================================================

-- Event interactions fact table
CREATE TABLE IF NOT EXISTS bilten_warehouse.fact_event_interactions (
    interaction_id UUID,
    date_key UInt32,
    time_key UInt32,
    user_key Nullable(UInt64),
    organizer_key UInt64,
    event_key Nullable(UInt64),
    device_key UInt64,
    geography_key UInt64,
    interaction_type String,
    session_id UUID,
    page_url String,
    referrer_type String,
    utm_source String,
    utm_medium String,
    utm_campaign String,
    duration_seconds Nullable(UInt32),
    bounce UInt8,
    conversion UInt8,
    revenue Float64 DEFAULT 0,
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(toDate(date_key))
ORDER BY (date_key, organizer_key, interaction_type);

-- Ticket sales fact table
CREATE TABLE IF NOT EXISTS bilten_warehouse.fact_ticket_sales (
    sale_id UUID,
    date_key UInt32,
    time_key UInt32,
    user_key UInt64,
    organizer_key UInt64,
    event_key UInt64,
    ticket_type_key UInt64,
    geography_key UInt64,
    device_key UInt64,
    quantity UInt32,
    unit_price Float64,
    total_price Float64,
    discount_amount Float64 DEFAULT 0,
    tax_amount Float64 DEFAULT 0,
    fee_amount Float64 DEFAULT 0,
    net_revenue Float64,
    currency String,
    payment_method String,
    payment_status String,
    refund_amount Float64 DEFAULT 0,
    is_refunded UInt8 DEFAULT 0,
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(toDate(date_key))
ORDER BY (date_key, organizer_key, event_key);

-- Event performance fact table
CREATE TABLE IF NOT EXISTS bilten_warehouse.fact_event_performance (
    performance_id UUID DEFAULT generateUUIDv4(),
    date_key UInt32,
    event_key UInt64,
    organizer_key UInt64,
    views UInt64,
    unique_views UInt64,
    tickets_sold UInt32,
    revenue Float64,
    refunds Float64,
    net_revenue Float64,
    conversion_rate Float32,
    avg_time_on_page Float32,
    bounce_rate Float32,
    social_shares UInt32,
    favorites UInt32,
    reviews_count UInt32,
    avg_rating Float32,
    created_at DateTime DEFAULT now()
) ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(toDate(date_key))
ORDER BY (date_key, event_key, organizer_key);

-- User engagement fact table
CREATE TABLE IF NOT EXISTS bilten_warehouse.fact_user_engagement (
    engagement_id UUID DEFAULT generateUUIDv4(),
    date_key UInt32,
    user_key UInt64,
    organizer_key Nullable(UInt64),
    sessions UInt32,
    page_views UInt32,
    time_spent_seconds UInt64,
    events_viewed UInt32,
    tickets_purchased UInt32,
    revenue_generated Float64,
    last_activity_date Date,
    engagement_score Float32,
    created_at DateTime DEFAULT now()
) ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(toDate(date_key))
ORDER BY (date_key, user_key);

-- Organizer performance fact table
CREATE TABLE IF NOT EXISTS bilten_warehouse.fact_organizer_performance (
    performance_id UUID DEFAULT generateUUIDv4(),
    date_key UInt32,
    organizer_key UInt64,
    events_created UInt32,
    events_published UInt32,
    events_completed UInt32,
    total_capacity UInt64,
    tickets_sold UInt64,
    tickets_available UInt64,
    gross_revenue Float64,
    net_revenue Float64,
    refunds Float64,
    avg_ticket_price Float64,
    unique_attendees UInt64,
    repeat_customers UInt32,
    customer_satisfaction Float32,
    created_at DateTime DEFAULT now()
) ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(toDate(date_key))
ORDER BY (date_key, organizer_key);

-- ============================================================================
-- BRIDGE TABLES (for many-to-many relationships)
-- ============================================================================

-- Event categories bridge table
CREATE TABLE IF NOT EXISTS bilten_warehouse.bridge_event_categories (
    event_key UInt64,
    category String,
    subcategory String,
    is_primary UInt8,
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (event_key, category);

-- User interests bridge table
CREATE TABLE IF NOT EXISTS bilten_warehouse.bridge_user_interests (
    user_key UInt64,
    interest_category String,
    interest_score Float32,
    last_interaction_date Date,
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (user_key, interest_category);

-- ============================================================================
-- AGGREGATE TABLES (for fast reporting)
-- ============================================================================

-- Monthly summary table
CREATE TABLE IF NOT EXISTS bilten_warehouse.agg_monthly_summary (
    year_month String,
    organizer_key Nullable(UInt64),
    event_category Nullable(String),
    geography_key Nullable(UInt64),
    total_events UInt64,
    total_tickets_sold UInt64,
    total_revenue Float64,
    unique_users UInt64,
    avg_ticket_price Float64,
    conversion_rate Float32,
    created_at DateTime DEFAULT now()
) ENGINE = SummingMergeTree()
ORDER BY (year_month, organizer_key, event_category, geography_key);

-- Weekly cohort analysis table
CREATE TABLE IF NOT EXISTS bilten_warehouse.agg_user_cohorts (
    cohort_week String,
    weeks_since_registration UInt16,
    cohort_size UInt64,
    active_users UInt64,
    retention_rate Float32,
    revenue_per_user Float64,
    tickets_per_user Float32,
    created_at DateTime DEFAULT now()
) ENGINE = ReplacingMergeTree()
ORDER BY (cohort_week, weeks_since_registration);

-- ============================================================================
-- INDEXES AND OPTIMIZATIONS
-- ============================================================================

-- Add indexes for better query performance
ALTER TABLE bilten_warehouse.fact_event_interactions ADD INDEX idx_user_key user_key TYPE bloom_filter GRANULARITY 1;
ALTER TABLE bilten_warehouse.fact_event_interactions ADD INDEX idx_event_key event_key TYPE bloom_filter GRANULARITY 1;
ALTER TABLE bilten_warehouse.fact_event_interactions ADD INDEX idx_interaction_type interaction_type TYPE set(100) GRANULARITY 1;

ALTER TABLE bilten_warehouse.fact_ticket_sales ADD INDEX idx_user_key user_key TYPE bloom_filter GRANULARITY 1;
ALTER TABLE bilten_warehouse.fact_ticket_sales ADD INDEX idx_event_key event_key TYPE bloom_filter GRANULARITY 1;
ALTER TABLE bilten_warehouse.fact_ticket_sales ADD INDEX idx_payment_status payment_status TYPE set(10) GRANULARITY 1;

-- Set TTL for fact tables (keep detailed data for 3 years)
ALTER TABLE bilten_warehouse.fact_event_interactions MODIFY TTL toDate(date_key) + INTERVAL 3 YEAR;
ALTER TABLE bilten_warehouse.fact_ticket_sales MODIFY TTL toDate(date_key) + INTERVAL 7 YEAR; -- Financial data kept longer
ALTER TABLE bilten_warehouse.fact_event_performance MODIFY TTL toDate(date_key) + INTERVAL 5 YEAR;
ALTER TABLE bilten_warehouse.fact_user_engagement MODIFY TTL toDate(date_key) + INTERVAL 3 YEAR;
ALTER TABLE bilten_warehouse.fact_organizer_performance MODIFY TTL toDate(date_key) + INTERVAL 5 YEAR;