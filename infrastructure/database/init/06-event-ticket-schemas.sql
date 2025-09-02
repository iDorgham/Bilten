-- Enhanced Event and Ticket Management Schemas
-- Task 2.2: Design event and ticket management schemas
-- Requirements: 2.1, 2.4, 8.1, 8.2

-- Additional event and ticket related types
CREATE TYPE event_type AS ENUM ('conference', 'workshop', 'concert', 'festival', 'sports', 'exhibition', 'networking', 'webinar', 'other');
CREATE TYPE event_format AS ENUM ('in_person', 'virtual', 'hybrid');
CREATE TYPE ticket_delivery_method AS ENUM ('email', 'sms', 'app', 'physical');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'cancelled', 'refunded', 'partially_refunded');
CREATE TYPE refund_status AS ENUM ('none', 'requested', 'approved', 'denied', 'processed');
CREATE TYPE media_type AS ENUM ('image', 'video', 'audio', 'document', 'logo', 'banner');
CREATE TYPE asset_status AS ENUM ('uploading', 'processing', 'active', 'archived', 'deleted');

-- Enhanced events table with comprehensive lifecycle support
CREATE TABLE events.event_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events.events(id) ON DELETE CASCADE,
    event_type event_type,
    event_format event_format DEFAULT 'in_person',
    tags TEXT[] DEFAULT '{}',
    age_restriction INTEGER, -- Minimum age
    dress_code VARCHAR(255),
    accessibility_info TEXT,
    parking_info TEXT,
    public_transport_info TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    website_url VARCHAR(500),
    social_media JSONB DEFAULT '{}',
    terms_and_conditions TEXT,
    cancellation_policy TEXT,
    refund_policy TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id)
);

-- Event media and assets management
CREATE TABLE events.event_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events.events(id) ON DELETE CASCADE,
    media_type media_type NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    alt_text VARCHAR(255),
    caption TEXT,
    display_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    status asset_status DEFAULT 'uploading',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event schedules and agenda
CREATE TABLE events.event_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events.events(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    location VARCHAR(255),
    speaker_info JSONB DEFAULT '{}',
    is_break BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event speakers and organizers
CREATE TABLE events.event_speakers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events.events(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    company VARCHAR(255),
    bio TEXT,
    photo_url TEXT,
    social_links JSONB DEFAULT '{}',
    contact_info JSONB DEFAULT '{}',
    is_keynote BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced ticket types with advanced configuration
CREATE TABLE tickets.ticket_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_type_id UUID NOT NULL REFERENCES tickets.ticket_types(id) ON DELETE CASCADE,
    is_transferable BOOLEAN DEFAULT TRUE,
    is_refundable BOOLEAN DEFAULT FALSE,
    refund_deadline TIMESTAMP WITH TIME ZONE,
    max_per_order INTEGER DEFAULT 10,
    min_per_order INTEGER DEFAULT 1,
    requires_approval BOOLEAN DEFAULT FALSE,
    delivery_methods ticket_delivery_method[] DEFAULT '{email}',
    custom_fields JSONB DEFAULT '{}', -- Additional fields to collect
    terms_and_conditions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ticket_type_id)
);

-- Ticket pricing tiers and discounts
CREATE TABLE tickets.pricing_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_type_id UUID NOT NULL REFERENCES tickets.ticket_types(id) ON DELETE CASCADE,
    tier_name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_until TIMESTAMP WITH TIME ZONE,
    quantity_limit INTEGER,
    conditions JSONB DEFAULT '{}', -- Early bird, group discount, etc.
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Discount codes and promotions
CREATE TABLE tickets.discount_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events.events(id) ON DELETE CASCADE,
    code VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255),
    discount_type VARCHAR(20) NOT NULL, -- 'percentage', 'fixed_amount'
    discount_value DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0,
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_until TIMESTAMP WITH TIME ZONE,
    applicable_ticket_types UUID[] DEFAULT '{}',
    minimum_order_amount DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders and transaction management
CREATE TABLE tickets.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    event_id UUID NOT NULL REFERENCES events.events(id),
    buyer_id UUID NOT NULL REFERENCES users.users(id),
    buyer_email VARCHAR(255) NOT NULL,
    buyer_name VARCHAR(255) NOT NULL,
    buyer_phone VARCHAR(20),
    total_amount DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    fee_amount DECIMAL(10,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    status order_status DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    billing_address JSONB DEFAULT '{}',
    special_requests TEXT,
    metadata JSONB DEFAULT '{}',
    confirmed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items (individual tickets in an order)
CREATE TABLE tickets.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES tickets.orders(id) ON DELETE CASCADE,
    ticket_type_id UUID NOT NULL REFERENCES tickets.ticket_types(id),
    ticket_id UUID REFERENCES tickets.tickets(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    attendee_info JSONB DEFAULT '{}', -- Name, email, etc. for each ticket
    custom_field_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ticket transfers and ownership changes
CREATE TABLE tickets.ticket_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets.tickets(id),
    from_user_id UUID REFERENCES users.users(id),
    to_user_id UUID REFERENCES users.users(id),
    to_email VARCHAR(255),
    transfer_code VARCHAR(100) UNIQUE,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'cancelled'
    initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Refund requests and processing
CREATE TABLE tickets.refund_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES tickets.orders(id),
    ticket_ids UUID[] DEFAULT '{}',
    requested_by UUID NOT NULL REFERENCES users.users(id),
    reason VARCHAR(500),
    refund_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status refund_status DEFAULT 'requested',
    processed_by UUID REFERENCES users.users(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    refund_reference VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event analytics and metrics tables
CREATE TABLE events.event_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events.events(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,2) NOT NULL,
    metric_type VARCHAR(50) NOT NULL, -- 'counter', 'gauge', 'histogram'
    dimensions JSONB DEFAULT '{}',
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Real-time event metrics (for live events)
CREATE TABLE events.live_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events.events(id) ON DELETE CASCADE,
    attendee_count INTEGER DEFAULT 0,
    check_in_count INTEGER DEFAULT 0,
    no_show_count INTEGER DEFAULT 0,
    revenue_total DECIMAL(10,2) DEFAULT 0,
    tickets_sold INTEGER DEFAULT 0,
    tickets_available INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id)
);

-- Event check-ins and attendance tracking
CREATE TABLE events.check_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events.events(id),
    ticket_id UUID NOT NULL REFERENCES tickets.tickets(id),
    attendee_name VARCHAR(255),
    attendee_email VARCHAR(255),
    check_in_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    check_in_method VARCHAR(50) DEFAULT 'qr_code', -- 'qr_code', 'manual', 'nfc'
    check_in_location VARCHAR(255),
    checked_in_by UUID REFERENCES users.users(id),
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ticket_id) -- Prevent duplicate check-ins
);

-- Event feedback and reviews
CREATE TABLE events.event_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events.events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users.users(id),
    ticket_id UUID REFERENCES tickets.tickets(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_title VARCHAR(255),
    review_text TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    is_verified_attendee BOOLEAN DEFAULT FALSE,
    helpful_votes INTEGER DEFAULT 0,
    reported_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'hidden', 'removed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_event_details_event_id ON events.event_details(event_id);
CREATE INDEX idx_event_details_type_format ON events.event_details(event_type, event_format);
CREATE INDEX idx_event_media_event_id ON events.event_media(event_id);
CREATE INDEX idx_event_media_type ON events.event_media(media_type, is_primary);
CREATE INDEX idx_event_schedule_event_id ON events.event_schedule(event_id);
CREATE INDEX idx_event_schedule_time ON events.event_schedule(start_time, end_time);
CREATE INDEX idx_event_speakers_event_id ON events.event_speakers(event_id);
CREATE INDEX idx_ticket_configurations_ticket_type ON tickets.ticket_configurations(ticket_type_id);
CREATE INDEX idx_pricing_tiers_ticket_type ON tickets.pricing_tiers(ticket_type_id);
CREATE INDEX idx_pricing_tiers_validity ON tickets.pricing_tiers(valid_from, valid_until, is_active);
CREATE INDEX idx_discount_codes_event ON tickets.discount_codes(event_id);
CREATE INDEX idx_discount_codes_code ON tickets.discount_codes(code, is_active);
CREATE INDEX idx_orders_event_id ON tickets.orders(event_id);
CREATE INDEX idx_orders_buyer_id ON tickets.orders(buyer_id);
CREATE INDEX idx_orders_status ON tickets.orders(status, created_at);
CREATE INDEX idx_orders_number ON tickets.orders(order_number);
CREATE INDEX idx_order_items_order_id ON tickets.order_items(order_id);
CREATE INDEX idx_order_items_ticket_type ON tickets.order_items(ticket_type_id);
CREATE INDEX idx_ticket_transfers_ticket_id ON tickets.ticket_transfers(ticket_id);
CREATE INDEX idx_ticket_transfers_users ON tickets.ticket_transfers(from_user_id, to_user_id);
CREATE INDEX idx_ticket_transfers_code ON tickets.ticket_transfers(transfer_code);
CREATE INDEX idx_refund_requests_order_id ON tickets.refund_requests(order_id);
CREATE INDEX idx_refund_requests_status ON tickets.refund_requests(status, created_at);
CREATE INDEX idx_event_analytics_event_id ON events.event_analytics(event_id);
CREATE INDEX idx_event_analytics_metric ON events.event_analytics(metric_name, recorded_at);
CREATE INDEX idx_live_metrics_event_id ON events.live_metrics(event_id);
CREATE INDEX idx_check_ins_event_id ON events.check_ins(event_id);
CREATE INDEX idx_check_ins_ticket_id ON events.check_ins(ticket_id);
CREATE INDEX idx_check_ins_time ON events.check_ins(check_in_time);
CREATE INDEX idx_event_feedback_event_id ON events.event_feedback(event_id);
CREATE INDEX idx_event_feedback_user_id ON events.event_feedback(user_id);
CREATE INDEX idx_event_feedback_rating ON events.event_feedback(rating, status);

-- Full-text search indexes
CREATE INDEX idx_event_details_search ON events.event_details USING GIN(
    to_tsvector('english', COALESCE(tags::text, ''))
);

CREATE INDEX idx_event_schedule_search ON events.event_schedule USING GIN(
    to_tsvector('english', title || ' ' || COALESCE(description, ''))
);

CREATE INDEX idx_event_speakers_search ON events.event_speakers USING GIN(
    to_tsvector('english', name || ' ' || COALESCE(title, '') || ' ' || COALESCE(company, ''))
);

-- Grant permissions on new tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA events TO bilten_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA tickets TO bilten_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA events TO bilten_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA tickets TO bilten_user;