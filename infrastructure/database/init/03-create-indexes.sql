-- Performance Indexes for Common Queries
-- Based on the database architecture design

-- Users indexes
CREATE INDEX idx_users_email ON users.users(email);
CREATE INDEX idx_users_role_status ON users.users(role, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_created_at ON users.users(created_at);
CREATE INDEX idx_users_profile_gin ON users.users USING GIN(profile_data);

-- Authentication indexes
CREATE INDEX idx_sessions_user_id ON authentication.sessions(user_id);
CREATE INDEX idx_sessions_token_hash ON authentication.sessions(token_hash);
CREATE INDEX idx_sessions_expires_at ON authentication.sessions(expires_at);
CREATE INDEX idx_sessions_active ON authentication.sessions(is_active, expires_at);

-- Events indexes
CREATE INDEX idx_events_organizer ON events.events(organizer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_status_start ON events.events(status, start_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_category ON events.events(category) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_location_gin ON events.events USING GIN(location);
CREATE INDEX idx_events_start_date ON events.events(start_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_visibility_status ON events.events(visibility, status) WHERE deleted_at IS NULL;

-- Full-text search index for events
CREATE INDEX idx_events_search ON events.events USING GIN(
    to_tsvector('english', title || ' ' || COALESCE(description, ''))
) WHERE deleted_at IS NULL;

-- Ticket types indexes
CREATE INDEX idx_ticket_types_event ON tickets.ticket_types(event_id);
CREATE INDEX idx_ticket_types_sales_period ON tickets.ticket_types(sales_start, sales_end);
CREATE INDEX idx_ticket_types_availability ON tickets.ticket_types(quantity, sold, reserved);

-- Tickets indexes
CREATE INDEX idx_tickets_event ON tickets.tickets(event_id);
CREATE INDEX idx_tickets_buyer ON tickets.tickets(buyer_id);
CREATE INDEX idx_tickets_status ON tickets.tickets(status);
CREATE INDEX idx_tickets_number ON tickets.tickets(ticket_number);
CREATE INDEX idx_tickets_type ON tickets.tickets(ticket_type_id);

-- Branding indexes
CREATE INDEX idx_branding_organizer ON branding.brand_settings(organizer_id);
CREATE INDEX idx_branding_domain ON branding.brand_settings(custom_domain) WHERE custom_domain IS NOT NULL;
CREATE INDEX idx_branding_verified ON branding.brand_settings(domain_verified);

-- Payment indexes
CREATE INDEX idx_payments_user ON payments.transactions(user_id);
CREATE INDEX idx_payments_event ON payments.transactions(event_id);
CREATE INDEX idx_payments_status ON payments.transactions(status);
CREATE INDEX idx_payments_created_at ON payments.transactions(created_at);
CREATE INDEX idx_payments_provider ON payments.transactions(payment_provider, provider_transaction_id);

-- Audit log indexes
CREATE INDEX idx_audit_user ON audit.audit_log(user_id);
CREATE INDEX idx_audit_resource ON audit.audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_action ON audit.audit_log(action);
CREATE INDEX idx_audit_created_at ON audit.audit_log(created_at);

-- Composite indexes for common query patterns
CREATE INDEX idx_events_organizer_status_date ON events.events(organizer_id, status, start_date) 
    WHERE deleted_at IS NULL;

CREATE INDEX idx_tickets_event_status ON tickets.tickets(event_id, status);

CREATE INDEX idx_sessions_user_active ON authentication.sessions(user_id, is_active, expires_at);

-- Partial indexes for better performance
CREATE INDEX idx_active_events ON events.events(start_date, status) 
    WHERE status IN ('published', 'live') AND deleted_at IS NULL;

CREATE INDEX idx_available_tickets ON tickets.tickets(event_id, ticket_type_id) 
    WHERE status = 'available';

CREATE INDEX idx_pending_payments ON payments.transactions(created_at, user_id) 
    WHERE status = 'pending';