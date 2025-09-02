/**
 * Migration: Create Comprehensive Authentication Schema
 * 
 * This migration creates all the necessary tables for the comprehensive
 * authentication service including enhanced user models, sessions, security events,
 * SSO configuration, and compliance features.
 */

const up = async (client) => {
  // Create authentication schema if it doesn't exist
  await client.query(`CREATE SCHEMA IF NOT EXISTS authentication;`);
  
  // Create users schema if it doesn't exist
  await client.query(`CREATE SCHEMA IF NOT EXISTS users;`);

  // Enhanced users table with comprehensive authentication fields
  await client.query(`
    CREATE TABLE IF NOT EXISTS users.users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      email_verified BOOLEAN DEFAULT false,
      email_verification_token VARCHAR(64),
      email_verification_expires TIMESTAMP WITH TIME ZONE,
      
      -- Authentication
      password_hash VARCHAR(255),
      password_salt VARCHAR(255),
      password_updated_at TIMESTAMP WITH TIME ZONE,
      password_history JSONB DEFAULT '[]',
      
      -- Profile information
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      display_name VARCHAR(200),
      avatar VARCHAR(500),
      timezone VARCHAR(50) DEFAULT 'UTC',
      locale VARCHAR(10) DEFAULT 'en',
      
      -- Account status
      status VARCHAR(50) DEFAULT 'pending_verification' CHECK (status IN ('active', 'suspended', 'pending_verification', 'deleted')),
      role VARCHAR(50) DEFAULT 'user',
      
      -- Security settings
      mfa_enabled BOOLEAN DEFAULT false,
      backup_codes JSONB DEFAULT '[]',
      backup_codes_used JSONB DEFAULT '[]',
      
      -- Enterprise SSO
      sso_provider VARCHAR(100),
      sso_subject VARCHAR(255),
      organization_id UUID,
      
      -- Security tracking
      last_login_at TIMESTAMP WITH TIME ZONE,
      last_login_ip INET,
      failed_login_attempts INTEGER DEFAULT 0,
      locked_until TIMESTAMP WITH TIME ZONE,
      
      -- Privacy and preferences
      privacy_settings JSONB DEFAULT '{}',
      notification_preferences JSONB DEFAULT '{}',
      
      -- Audit fields
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMP WITH TIME ZONE
    );
  `);

  // Create indexes for users table
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users.users(email);
    CREATE INDEX IF NOT EXISTS idx_users_status ON users.users(status);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users.users(role);
    CREATE INDEX IF NOT EXISTS idx_users_organization ON users.users(organization_id);
    CREATE INDEX IF NOT EXISTS idx_users_sso_provider ON users.users(sso_provider);
    CREATE INDEX IF NOT EXISTS idx_users_created_at ON users.users(created_at);
    CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users.users(deleted_at);
  `);

  // MFA Methods table
  await client.query(`
    CREATE TABLE IF NOT EXISTS authentication.mfa_methods (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
      type VARCHAR(20) NOT NULL CHECK (type IN ('totp', 'sms', 'email')),
      secret VARCHAR(255), -- for TOTP
      phone_number VARCHAR(20), -- for SMS
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      
      UNIQUE(user_id, type)
    );
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_mfa_methods_user_id ON authentication.mfa_methods(user_id);
    CREATE INDEX IF NOT EXISTS idx_mfa_methods_type ON authentication.mfa_methods(type);
    CREATE INDEX IF NOT EXISTS idx_mfa_methods_active ON authentication.mfa_methods(is_active);
  `);

  -- Social Accounts table
  await client.query(`
    CREATE TABLE IF NOT EXISTS authentication.social_accounts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
      provider VARCHAR(50) NOT NULL CHECK (provider IN ('google', 'facebook', 'apple', 'linkedin')),
      provider_id VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      display_name VARCHAR(200),
      avatar VARCHAR(500),
      connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      
      UNIQUE(provider, provider_id),
      UNIQUE(user_id, provider)
    );
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_social_accounts_user_id ON authentication.social_accounts(user_id);
    CREATE INDEX IF NOT EXISTS idx_social_accounts_provider ON authentication.social_accounts(provider);
    CREATE INDEX IF NOT EXISTS idx_social_accounts_provider_id ON authentication.social_accounts(provider_id);
  `);

  -- Enhanced Authentication Sessions table
  await client.query(`
    CREATE TABLE IF NOT EXISTS authentication.user_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
      
      -- Token information
      session_token TEXT NOT NULL,
      refresh_token TEXT NOT NULL,
      token_type VARCHAR(20) DEFAULT 'Bearer',
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      refresh_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      
      -- Device and client information
      device_id VARCHAR(255),
      device_name VARCHAR(200),
      device_type VARCHAR(20) CHECK (device_type IN ('web', 'mobile', 'tablet', 'desktop')),
      user_agent TEXT,
      ip_address INET,
      
      -- Geographic information
      country VARCHAR(2),
      city VARCHAR(100),
      
      -- Session metadata
      scopes JSONB DEFAULT '[]',
      last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      is_active BOOLEAN DEFAULT true,
      
      -- Security flags
      is_mfa_verified BOOLEAN DEFAULT false,
      risk_score INTEGER DEFAULT 0,
      
      -- Additional metadata
      metadata JSONB DEFAULT '{}',
      
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON authentication.user_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_sessions_device_id ON authentication.user_sessions(device_id);
    CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON authentication.user_sessions(is_active);
    CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON authentication.user_sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON authentication.user_sessions(last_activity);
  `);

  -- Security Events table
  await client.query(`
    CREATE TABLE IF NOT EXISTS authentication.security_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users.users(id) ON DELETE SET NULL,
      
      -- Event information
      event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'login_success', 'login_failure', 'password_reset', 'mfa_setup', 
        'account_locked', 'suspicious_activity', 'token_refresh', 
        'session_created', 'session_terminated', 'password_changed'
      )),
      description TEXT NOT NULL,
      severity VARCHAR(20) DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
      
      -- Context information
      ip_address INET,
      user_agent TEXT,
      device_id VARCHAR(255),
      
      -- Geographic information
      country VARCHAR(2),
      city VARCHAR(100),
      
      -- Additional metadata
      metadata JSONB DEFAULT '{}',
      
      -- Resolution
      resolved BOOLEAN DEFAULT false,
      resolved_by UUID REFERENCES users.users(id) ON DELETE SET NULL,
      resolved_at TIMESTAMP WITH TIME ZONE,
      
      timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON authentication.security_events(user_id);
    CREATE INDEX IF NOT EXISTS idx_security_events_type ON authentication.security_events(event_type);
    CREATE INDEX IF NOT EXISTS idx_security_events_severity ON authentication.security_events(severity);
    CREATE INDEX IF NOT EXISTS idx_security_events_timestamp ON authentication.security_events(timestamp);
    CREATE INDEX IF NOT EXISTS idx_security_events_resolved ON authentication.security_events(resolved);
  `);

  -- SSO Configuration table
  await client.query(`
    CREATE TABLE IF NOT EXISTS authentication.sso_configurations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      
      -- Provider information
      provider VARCHAR(20) NOT NULL CHECK (provider IN ('saml', 'oidc')),
      name VARCHAR(200) NOT NULL,
      
      -- SAML configuration
      saml_metadata TEXT,
      saml_entity_id VARCHAR(500),
      saml_sso_url VARCHAR(500),
      saml_certificate TEXT,
      
      -- OIDC configuration
      oidc_issuer VARCHAR(500),
      oidc_client_id VARCHAR(255),
      oidc_client_secret VARCHAR(255),
      oidc_scopes JSONB DEFAULT '["openid", "profile", "email"]',
      
      -- User provisioning
      jit_provisioning BOOLEAN DEFAULT false,
      attribute_mapping JSONB DEFAULT '{}',
      default_role VARCHAR(50) DEFAULT 'user',
      
      -- Status
      is_active BOOLEAN DEFAULT true,
      
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      
      UNIQUE(organization_id, provider)
    );
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_sso_configurations_org_id ON authentication.sso_configurations(organization_id);
    CREATE INDEX IF NOT EXISTS idx_sso_configurations_provider ON authentication.sso_configurations(provider);
    CREATE INDEX IF NOT EXISTS idx_sso_configurations_active ON authentication.sso_configurations(is_active);
  `);

  -- Verification Tokens table
  await client.query(`
    CREATE TABLE IF NOT EXISTS authentication.verification_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
      token VARCHAR(255) NOT NULL UNIQUE,
      token_type VARCHAR(50) NOT NULL CHECK (token_type IN ('email', 'password_reset', 'mfa_setup')),
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      used_at TIMESTAMP WITH TIME ZONE,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_verification_tokens_user_id ON authentication.verification_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON authentication.verification_tokens(token);
    CREATE INDEX IF NOT EXISTS idx_verification_tokens_type ON authentication.verification_tokens(token_type);
    CREATE INDEX IF NOT EXISTS idx_verification_tokens_expires_at ON authentication.verification_tokens(expires_at);
  `);

  -- Blacklisted Tokens table
  await client.query(`
    CREATE TABLE IF NOT EXISTS authentication.blacklisted_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      jti VARCHAR(255) NOT NULL UNIQUE,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      reason VARCHAR(100) DEFAULT 'logout',
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_blacklisted_tokens_jti ON authentication.blacklisted_tokens(jti);
    CREATE INDEX IF NOT EXISTS idx_blacklisted_tokens_expires_at ON authentication.blacklisted_tokens(expires_at);
  `);

  -- User Activity table for audit logging
  await client.query(`
    CREATE TABLE IF NOT EXISTS authentication.user_activity (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users.users(id) ON DELETE SET NULL,
      activity_type VARCHAR(50) NOT NULL,
      success BOOLEAN DEFAULT false,
      metadata JSONB DEFAULT '{}',
      ip_address INET,
      user_agent TEXT,
      timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON authentication.user_activity(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_activity_type ON authentication.user_activity(activity_type);
    CREATE INDEX IF NOT EXISTS idx_user_activity_timestamp ON authentication.user_activity(timestamp);
    CREATE INDEX IF NOT EXISTS idx_user_activity_success ON authentication.user_activity(success);
  `);

  -- Roles and Permissions tables
  await client.query(`
    CREATE TABLE IF NOT EXISTS authentication.roles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(50) UNIQUE NOT NULL,
      description TEXT,
      permissions JSONB DEFAULT '[]',
      is_system_role BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS authentication.user_roles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
      role_id UUID NOT NULL REFERENCES authentication.roles(id) ON DELETE CASCADE,
      context VARCHAR(100) DEFAULT 'global',
      granted_by UUID REFERENCES users.users(id) ON DELETE SET NULL,
      granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMP WITH TIME ZONE,
      
      UNIQUE(user_id, role_id, context)
    );
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON authentication.user_roles(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON authentication.user_roles(role_id);
    CREATE INDEX IF NOT EXISTS idx_user_roles_context ON authentication.user_roles(context);
  `);

  -- Insert default roles
  await client.query(`
    INSERT INTO authentication.roles (name, description, permissions, is_system_role)
    VALUES 
      ('user', 'Standard user role', '["read:profile", "update:profile"]', true),
      ('organizer', 'Event organizer role', '["read:profile", "update:profile", "create:events", "manage:events"]', true),
      ('admin', 'Administrator role', '["*"]', true)
    ON CONFLICT (name) DO NOTHING;
  `);

  -- Create updated_at trigger function if it doesn't exist
  await client.query(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);

  -- Create triggers for updated_at columns
  const tablesWithUpdatedAt = [
    'users.users',
    'authentication.mfa_methods',
    'authentication.user_sessions',
    'authentication.sso_configurations',
    'authentication.roles'
  ];

  for (const table of tablesWithUpdatedAt) {
    const triggerName = `update_${table.replace('.', '_')}_updated_at`;
    await client.query(`
      DROP TRIGGER IF EXISTS ${triggerName} ON ${table};
      CREATE TRIGGER ${triggerName}
        BEFORE UPDATE ON ${table}
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
  }
};

const down = async (client) => {
  // Drop tables in reverse order to handle foreign key constraints
  const tables = [
    'authentication.user_roles',
    'authentication.roles',
    'authentication.user_activity',
    'authentication.blacklisted_tokens',
    'authentication.verification_tokens',
    'authentication.sso_configurations',
    'authentication.security_events',
    'authentication.user_sessions',
    'authentication.social_accounts',
    'authentication.mfa_methods'
  ];

  for (const table of tables) {
    await client.query(`DROP TABLE IF EXISTS ${table} CASCADE;`);
  }

  // Drop function
  await client.query(`DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;`);
};

module.exports = {
  up,
  down,
};