-- Fix Authentication Tables
-- Add missing tables and columns for user registration with email verification

-- Ensure authentication schema exists
CREATE SCHEMA IF NOT EXISTS authentication;

-- Create verification_tokens table if it doesn't exist
CREATE TABLE IF NOT EXISTS authentication.verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    token_type VARCHAR(50) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_activity table if it doesn't exist
CREATE TABLE IF NOT EXISTS authentication.user_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users.users(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    location JSONB DEFAULT '{}',
    success BOOLEAN DEFAULT TRUE,
    failure_reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS authentication.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE,
    session_type VARCHAR(50) DEFAULT 'web',
    device_id VARCHAR(255),
    device_name VARCHAR(255),
    device_type VARCHAR(50),
    browser VARCHAR(100),
    os VARCHAR(100),
    ip_address INET,
    location JSONB DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS authentication.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE,
    permissions JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS authentication.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES authentication.roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES users.users(id),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    context JSONB DEFAULT '{}',
    UNIQUE(user_id, role_id, context)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_verification_tokens_user_id ON authentication.verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON authentication.verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_type_expires ON authentication.verification_tokens(token_type, expires_at);

CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON authentication.user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON authentication.user_activity(activity_type, created_at);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON authentication.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON authentication.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_refresh_token ON authentication.user_sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON authentication.user_sessions(is_active, expires_at);

CREATE INDEX IF NOT EXISTS idx_roles_name ON authentication.roles(name);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON authentication.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON authentication.user_roles(role_id);

-- Insert default roles if they don't exist
INSERT INTO authentication.roles (name, display_name, description, is_system_role) 
VALUES 
    ('user', 'Regular User', 'Standard user with basic permissions', true),
    ('admin', 'Administrator', 'Administrative access to platform management', true),
    ('organizer', 'Event Organizer', 'Can create and manage events', true)
ON CONFLICT (name) DO NOTHING;

-- Grant permissions on new tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA authentication TO bilten_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA authentication TO bilten_user;