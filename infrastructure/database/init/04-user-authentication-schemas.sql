-- Enhanced User and Authentication Schemas
-- Task 2.1: Create user and authentication schemas
-- Requirements: 2.1, 2.2, 5.2, 6.1

-- Additional user-related types
CREATE TYPE auth_provider AS ENUM ('local', 'google', 'facebook', 'apple', 'microsoft');
CREATE TYPE permission_type AS ENUM ('read', 'write', 'delete', 'admin', 'owner');
CREATE TYPE session_type AS ENUM ('web', 'mobile', 'api', 'admin');
CREATE TYPE verification_type AS ENUM ('email', 'phone', 'identity', 'payment');

-- Enhanced user profiles table (extends basic users table)
CREATE TABLE users.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
    avatar_url TEXT,
    bio TEXT,
    website VARCHAR(255),
    company VARCHAR(255),
    job_title VARCHAR(255),
    location VARCHAR(255),
    timezone VARCHAR(50),
    language VARCHAR(10) DEFAULT 'en',
    social_links JSONB DEFAULT '{}',
    notification_preferences JSONB DEFAULT '{}',
    privacy_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- User preferences and settings
CREATE TABLE users.user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL, -- 'notifications', 'privacy', 'display', etc.
    preference_key VARCHAR(100) NOT NULL,
    preference_value JSONB NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, category, preference_key)
);

-- Role-Based Access Control (RBAC) - Roles
CREATE TABLE authentication.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE,
    permissions JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RBAC - Permissions
CREATE TABLE authentication.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    resource VARCHAR(100) NOT NULL, -- 'events', 'users', 'payments', etc.
    action VARCHAR(50) NOT NULL, -- 'create', 'read', 'update', 'delete'
    conditions JSONB DEFAULT '{}', -- Additional conditions for permission
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RBAC - Role-Permission mapping
CREATE TABLE authentication.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES authentication.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES authentication.permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    granted_by UUID REFERENCES users.users(id),
    UNIQUE(role_id, permission_id)
);

-- RBAC - User-Role assignments
CREATE TABLE authentication.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES authentication.roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES users.users(id),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    context JSONB DEFAULT '{}', -- Context-specific role assignments (e.g., event-specific)
    UNIQUE(user_id, role_id, context)
);

-- Enhanced authentication sessions with device tracking
CREATE TABLE authentication.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE,
    session_type session_type DEFAULT 'web',
    device_id VARCHAR(255),
    device_name VARCHAR(255),
    device_type VARCHAR(50), -- 'desktop', 'mobile', 'tablet'
    browser VARCHAR(100),
    os VARCHAR(100),
    ip_address INET,
    location JSONB DEFAULT '{}', -- Geolocation data
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OAuth and external authentication providers
CREATE TABLE authentication.external_auth (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
    provider auth_provider NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    provider_email VARCHAR(255),
    provider_data JSONB DEFAULT '{}',
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(provider, provider_user_id)
);

-- Password reset and verification tokens
CREATE TABLE authentication.verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    token_type verification_type NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Two-factor authentication
CREATE TABLE authentication.two_factor_auth (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
    method VARCHAR(50) NOT NULL, -- 'totp', 'sms', 'email'
    secret VARCHAR(255), -- For TOTP
    phone VARCHAR(20), -- For SMS
    backup_codes JSONB DEFAULT '[]',
    is_enabled BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, method)
);

-- User activity log for security monitoring
CREATE TABLE authentication.user_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL, -- 'login', 'logout', 'password_change', etc.
    ip_address INET,
    user_agent TEXT,
    location JSONB DEFAULT '{}',
    success BOOLEAN DEFAULT TRUE,
    failure_reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced audit logging for user actions
CREATE TABLE audit.user_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users.users(id),
    session_id UUID REFERENCES authentication.user_sessions(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    resource_name VARCHAR(255),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    location JSONB DEFAULT '{}',
    risk_score INTEGER DEFAULT 0, -- Security risk assessment
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data retention and privacy compliance
CREATE TABLE audit.data_retention_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users.users(id),
    data_type VARCHAR(100) NOT NULL,
    retention_period INTERVAL NOT NULL,
    scheduled_deletion TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deletion_reason VARCHAR(255),
    compliance_framework VARCHAR(100), -- 'GDPR', 'CCPA', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default system roles
INSERT INTO authentication.roles (name, display_name, description, is_system_role) VALUES
('super_admin', 'Super Administrator', 'Full system access with all permissions', true),
('admin', 'Administrator', 'Administrative access to platform management', true),
('organizer', 'Event Organizer', 'Can create and manage events', true),
('user', 'Regular User', 'Standard user with basic permissions', true),
('guest', 'Guest User', 'Limited access for non-registered users', true);

-- Insert default permissions
INSERT INTO authentication.permissions (name, display_name, description, resource, action) VALUES
-- User management permissions
('users.create', 'Create Users', 'Create new user accounts', 'users', 'create'),
('users.read', 'View Users', 'View user profiles and information', 'users', 'read'),
('users.update', 'Update Users', 'Modify user profiles and settings', 'users', 'update'),
('users.delete', 'Delete Users', 'Delete user accounts', 'users', 'delete'),
('users.admin', 'Administer Users', 'Full user management capabilities', 'users', 'admin'),

-- Event management permissions
('events.create', 'Create Events', 'Create new events', 'events', 'create'),
('events.read', 'View Events', 'View event details', 'events', 'read'),
('events.update', 'Update Events', 'Modify event information', 'events', 'update'),
('events.delete', 'Delete Events', 'Delete events', 'events', 'delete'),
('events.publish', 'Publish Events', 'Publish events to public', 'events', 'publish'),

-- Ticket management permissions
('tickets.create', 'Create Tickets', 'Create ticket types', 'tickets', 'create'),
('tickets.read', 'View Tickets', 'View ticket information', 'tickets', 'read'),
('tickets.update', 'Update Tickets', 'Modify ticket details', 'tickets', 'update'),
('tickets.delete', 'Delete Tickets', 'Delete tickets', 'tickets', 'delete'),
('tickets.sell', 'Sell Tickets', 'Process ticket sales', 'tickets', 'sell'),

-- Payment permissions
('payments.process', 'Process Payments', 'Handle payment transactions', 'payments', 'create'),
('payments.refund', 'Refund Payments', 'Process refunds', 'payments', 'refund'),
('payments.view', 'View Payments', 'View payment information', 'payments', 'read'),

-- System permissions
('system.admin', 'System Administration', 'Full system administration', 'system', 'admin'),
('system.monitor', 'System Monitoring', 'View system metrics and logs', 'system', 'read'),
('system.backup', 'System Backup', 'Manage system backups', 'system', 'backup');

-- Create indexes for performance
CREATE INDEX idx_user_profiles_user_id ON users.user_profiles(user_id);
CREATE INDEX idx_user_preferences_user_id ON users.user_preferences(user_id);
CREATE INDEX idx_user_preferences_category ON users.user_preferences(category);
CREATE INDEX idx_roles_name ON authentication.roles(name);
CREATE INDEX idx_permissions_resource_action ON authentication.permissions(resource, action);
CREATE INDEX idx_user_roles_user_id ON authentication.user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON authentication.user_roles(role_id);
CREATE INDEX idx_user_sessions_user_id ON authentication.user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON authentication.user_sessions(session_token);
CREATE INDEX idx_user_sessions_active ON authentication.user_sessions(is_active, expires_at);
CREATE INDEX idx_external_auth_user_id ON authentication.external_auth(user_id);
CREATE INDEX idx_external_auth_provider ON authentication.external_auth(provider, provider_user_id);
CREATE INDEX idx_verification_tokens_user_id ON authentication.verification_tokens(user_id);
CREATE INDEX idx_verification_tokens_token ON authentication.verification_tokens(token);
CREATE INDEX idx_two_factor_user_id ON authentication.two_factor_auth(user_id);
CREATE INDEX idx_user_activity_user_id ON authentication.user_activity(user_id);
CREATE INDEX idx_user_activity_type ON authentication.user_activity(activity_type, created_at);
CREATE INDEX idx_user_audit_log_user_id ON audit.user_audit_log(user_id);
CREATE INDEX idx_user_audit_log_resource ON audit.user_audit_log(resource_type, resource_id);
CREATE INDEX idx_user_audit_log_created ON audit.user_audit_log(created_at);
CREATE INDEX idx_data_retention_user_id ON audit.data_retention_log(user_id);
CREATE INDEX idx_data_retention_scheduled ON audit.data_retention_log(scheduled_deletion);

-- Grant permissions on new tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA users TO bilten_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA authentication TO bilten_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA audit TO bilten_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA users TO bilten_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA authentication TO bilten_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA audit TO bilten_user;