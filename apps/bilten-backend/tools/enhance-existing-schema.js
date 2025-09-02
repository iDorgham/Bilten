const { query, initializeConnections, closeConnections } = require('./src/database/connection');

async function enhanceSchema() {
  await initializeConnections();
  try {
    console.log('Enhancing existing authentication schema...');

    // First, let's add missing columns to the existing users table
    console.log('Adding missing columns to users table...');
    
    // Add UUID column and make it the new primary key
    await query(`
      DO $$ 
      BEGIN
        -- Add UUID column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'users' AND table_name = 'users' AND column_name = 'uuid_id') THEN
          ALTER TABLE users.users ADD COLUMN uuid_id UUID DEFAULT gen_random_uuid();
          UPDATE users.users SET uuid_id = gen_random_uuid() WHERE uuid_id IS NULL;
          ALTER TABLE users.users ALTER COLUMN uuid_id SET NOT NULL;
        END IF;

        -- Add other missing columns
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'users' AND table_name = 'users' AND column_name = 'email_verification_token') THEN
          ALTER TABLE users.users ADD COLUMN email_verification_token VARCHAR(64);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'users' AND table_name = 'users' AND column_name = 'email_verification_expires') THEN
          ALTER TABLE users.users ADD COLUMN email_verification_expires TIMESTAMP WITH TIME ZONE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'users' AND table_name = 'users' AND column_name = 'password_salt') THEN
          ALTER TABLE users.users ADD COLUMN password_salt VARCHAR(255);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'users' AND table_name = 'users' AND column_name = 'password_updated_at') THEN
          ALTER TABLE users.users ADD COLUMN password_updated_at TIMESTAMP WITH TIME ZONE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'users' AND table_name = 'users' AND column_name = 'password_history') THEN
          ALTER TABLE users.users ADD COLUMN password_history JSONB DEFAULT '[]';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'users' AND table_name = 'users' AND column_name = 'display_name') THEN
          ALTER TABLE users.users ADD COLUMN display_name VARCHAR(200);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'users' AND table_name = 'users' AND column_name = 'avatar') THEN
          ALTER TABLE users.users ADD COLUMN avatar VARCHAR(500);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'users' AND table_name = 'users' AND column_name = 'timezone') THEN
          ALTER TABLE users.users ADD COLUMN timezone VARCHAR(50) DEFAULT 'UTC';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'users' AND table_name = 'users' AND column_name = 'locale') THEN
          ALTER TABLE users.users ADD COLUMN locale VARCHAR(10) DEFAULT 'en';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'users' AND table_name = 'users' AND column_name = 'mfa_enabled') THEN
          ALTER TABLE users.users ADD COLUMN mfa_enabled BOOLEAN DEFAULT false;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'users' AND table_name = 'users' AND column_name = 'backup_codes') THEN
          ALTER TABLE users.users ADD COLUMN backup_codes JSONB DEFAULT '[]';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'users' AND table_name = 'users' AND column_name = 'backup_codes_used') THEN
          ALTER TABLE users.users ADD COLUMN backup_codes_used JSONB DEFAULT '[]';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'users' AND table_name = 'users' AND column_name = 'sso_provider') THEN
          ALTER TABLE users.users ADD COLUMN sso_provider VARCHAR(100);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'users' AND table_name = 'users' AND column_name = 'sso_subject') THEN
          ALTER TABLE users.users ADD COLUMN sso_subject VARCHAR(255);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'users' AND table_name = 'users' AND column_name = 'organization_id') THEN
          ALTER TABLE users.users ADD COLUMN organization_id UUID;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'users' AND table_name = 'users' AND column_name = 'last_login_at') THEN
          ALTER TABLE users.users ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'users' AND table_name = 'users' AND column_name = 'last_login_ip') THEN
          ALTER TABLE users.users ADD COLUMN last_login_ip INET;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'users' AND table_name = 'users' AND column_name = 'failed_login_attempts') THEN
          ALTER TABLE users.users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'users' AND table_name = 'users' AND column_name = 'locked_until') THEN
          ALTER TABLE users.users ADD COLUMN locked_until TIMESTAMP WITH TIME ZONE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'users' AND table_name = 'users' AND column_name = 'privacy_settings') THEN
          ALTER TABLE users.users ADD COLUMN privacy_settings JSONB DEFAULT '{}';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'users' AND table_name = 'users' AND column_name = 'notification_preferences') THEN
          ALTER TABLE users.users ADD COLUMN notification_preferences JSONB DEFAULT '{}';
        END IF;

        -- Update timestamp columns to use timezone
        ALTER TABLE users.users ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE;
        ALTER TABLE users.users ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE;
        ALTER TABLE users.users ALTER COLUMN deleted_at TYPE TIMESTAMP WITH TIME ZONE;

        -- Set defaults for existing columns
        ALTER TABLE users.users ALTER COLUMN created_at SET DEFAULT NOW();
        ALTER TABLE users.users ALTER COLUMN updated_at SET DEFAULT NOW();

        -- Update display names for existing users
        UPDATE users.users SET display_name = CONCAT(first_name, ' ', last_name) 
        WHERE display_name IS NULL AND first_name IS NOT NULL AND last_name IS NOT NULL;
      END $$;
    `);
    console.log('✅ Users table enhanced');

    // Create indexes for new columns
    console.log('Creating indexes...');
    await query(`
      CREATE INDEX IF NOT EXISTS idx_users_uuid_id ON users.users(uuid_id);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users.users(email);
      CREATE INDEX IF NOT EXISTS idx_users_status ON users.users(status);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users.users(role);
      CREATE INDEX IF NOT EXISTS idx_users_organization ON users.users(organization_id);
      CREATE INDEX IF NOT EXISTS idx_users_sso_provider ON users.users(sso_provider);
      CREATE INDEX IF NOT EXISTS idx_users_created_at ON users.users(created_at);
      CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users.users(deleted_at);
    `);
    console.log('✅ Indexes created');

    // Create MFA methods table
    console.log('Creating MFA methods table...');
    await query(`
      CREATE TABLE IF NOT EXISTS authentication.mfa_methods (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id INTEGER NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
        type VARCHAR(20) NOT NULL CHECK (type IN ('totp', 'sms', 'email')),
        secret VARCHAR(255),
        phone_number VARCHAR(20),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        
        UNIQUE(user_id, type)
      );
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_mfa_methods_user_id ON authentication.mfa_methods(user_id);
      CREATE INDEX IF NOT EXISTS idx_mfa_methods_type ON authentication.mfa_methods(type);
      CREATE INDEX IF NOT EXISTS idx_mfa_methods_active ON authentication.mfa_methods(is_active);
    `);
    console.log('✅ MFA methods table created');

    // Create social accounts table
    console.log('Creating social accounts table...');
    await query(`
      CREATE TABLE IF NOT EXISTS authentication.social_accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id INTEGER NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
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

    await query(`
      CREATE INDEX IF NOT EXISTS idx_social_accounts_user_id ON authentication.social_accounts(user_id);
      CREATE INDEX IF NOT EXISTS idx_social_accounts_provider ON authentication.social_accounts(provider);
      CREATE INDEX IF NOT EXISTS idx_social_accounts_provider_id ON authentication.social_accounts(provider_id);
    `);
    console.log('✅ Social accounts table created');

    // Update existing user_sessions table if needed
    console.log('Updating user sessions table...');
    await query(`
      DO $$ 
      BEGIN
        -- Add missing columns to user_sessions if they don't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'authentication' AND table_name = 'user_sessions' AND column_name = 'token_type') THEN
          ALTER TABLE authentication.user_sessions ADD COLUMN token_type VARCHAR(20) DEFAULT 'Bearer';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'authentication' AND table_name = 'user_sessions' AND column_name = 'refresh_expires_at') THEN
          ALTER TABLE authentication.user_sessions ADD COLUMN refresh_expires_at TIMESTAMP WITH TIME ZONE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'authentication' AND table_name = 'user_sessions' AND column_name = 'device_name') THEN
          ALTER TABLE authentication.user_sessions ADD COLUMN device_name VARCHAR(200);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'authentication' AND table_name = 'user_sessions' AND column_name = 'country') THEN
          ALTER TABLE authentication.user_sessions ADD COLUMN country VARCHAR(2);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'authentication' AND table_name = 'user_sessions' AND column_name = 'city') THEN
          ALTER TABLE authentication.user_sessions ADD COLUMN city VARCHAR(100);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'authentication' AND table_name = 'user_sessions' AND column_name = 'scopes') THEN
          ALTER TABLE authentication.user_sessions ADD COLUMN scopes JSONB DEFAULT '[]';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'authentication' AND table_name = 'user_sessions' AND column_name = 'is_mfa_verified') THEN
          ALTER TABLE authentication.user_sessions ADD COLUMN is_mfa_verified BOOLEAN DEFAULT false;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'authentication' AND table_name = 'user_sessions' AND column_name = 'risk_score') THEN
          ALTER TABLE authentication.user_sessions ADD COLUMN risk_score INTEGER DEFAULT 0;
        END IF;
      END $$;
    `);
    console.log('✅ User sessions table updated');

    // Create security events table
    console.log('Creating security events table...');
    await query(`
      CREATE TABLE IF NOT EXISTS authentication.security_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id INTEGER REFERENCES users.users(id) ON DELETE SET NULL,
        
        event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
          'login_success', 'login_failure', 'password_reset', 'mfa_setup', 
          'account_locked', 'suspicious_activity', 'token_refresh', 
          'session_created', 'session_terminated', 'password_changed'
        )),
        description TEXT NOT NULL,
        severity VARCHAR(20) DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        
        ip_address INET,
        user_agent TEXT,
        device_id VARCHAR(255),
        
        country VARCHAR(2),
        city VARCHAR(100),
        
        metadata JSONB DEFAULT '{}',
        
        resolved BOOLEAN DEFAULT false,
        resolved_by INTEGER REFERENCES users.users(id) ON DELETE SET NULL,
        resolved_at TIMESTAMP WITH TIME ZONE,
        
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON authentication.security_events(user_id);
      CREATE INDEX IF NOT EXISTS idx_security_events_type ON authentication.security_events(event_type);
      CREATE INDEX IF NOT EXISTS idx_security_events_severity ON authentication.security_events(severity);
      CREATE INDEX IF NOT EXISTS idx_security_events_timestamp ON authentication.security_events(timestamp);
      CREATE INDEX IF NOT EXISTS idx_security_events_resolved ON authentication.security_events(resolved);
    `);
    console.log('✅ Security events table created');

    // Create verification tokens table
    console.log('Creating verification tokens table...');
    await query(`
      CREATE TABLE IF NOT EXISTS authentication.verification_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id INTEGER NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL UNIQUE,
        token_type VARCHAR(50) NOT NULL CHECK (token_type IN ('email', 'password_reset', 'mfa_setup')),
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        used_at TIMESTAMP WITH TIME ZONE,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_verification_tokens_user_id ON authentication.verification_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON authentication.verification_tokens(token);
      CREATE INDEX IF NOT EXISTS idx_verification_tokens_type ON authentication.verification_tokens(token_type);
      CREATE INDEX IF NOT EXISTS idx_verification_tokens_expires_at ON authentication.verification_tokens(expires_at);
    `);
    console.log('✅ Verification tokens table created');

    // Create roles table
    console.log('Creating roles table...');
    await query(`
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

    await query(`
      CREATE TABLE IF NOT EXISTS authentication.user_roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id INTEGER NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
        role_id UUID NOT NULL REFERENCES authentication.roles(id) ON DELETE CASCADE,
        context VARCHAR(100) DEFAULT 'global',
        granted_by INTEGER REFERENCES users.users(id) ON DELETE SET NULL,
        granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE,
        
        UNIQUE(user_id, role_id, context)
      );
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON authentication.user_roles(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON authentication.user_roles(role_id);
      CREATE INDEX IF NOT EXISTS idx_user_roles_context ON authentication.user_roles(context);
    `);
    console.log('✅ Roles tables created');

    // Insert default roles
    console.log('Inserting default roles...');
    await query(`
      INSERT INTO authentication.roles (name, description, permissions, is_system_role)
      VALUES 
        ('user', 'Standard user role', '["read:profile", "update:profile"]', true),
        ('organizer', 'Event organizer role', '["read:profile", "update:profile", "create:events", "manage:events"]', true),
        ('admin', 'Administrator role', '["*"]', true)
      ON CONFLICT (name) DO NOTHING;
    `);
    console.log('✅ Default roles inserted');

    // Create updated_at trigger function
    console.log('Creating trigger function...');
    await query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);
    console.log('✅ Trigger function created');

    // Create triggers for updated_at columns
    console.log('Creating triggers...');
    const tablesWithUpdatedAt = [
      'users.users',
      'authentication.mfa_methods',
      'authentication.user_sessions',
      'authentication.roles'
    ];

    for (const table of tablesWithUpdatedAt) {
      const triggerName = `update_${table.replace('.', '_')}_updated_at`;
      await query(`
        DROP TRIGGER IF EXISTS ${triggerName} ON ${table};
        CREATE TRIGGER ${triggerName}
          BEFORE UPDATE ON ${table}
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
      `);
    }
    console.log('✅ Triggers created');

    // Mark migration as completed
    await query(
      'INSERT INTO system.migrations (name, completed_at, status) VALUES ($1, NOW(), $2) ON CONFLICT (name) DO NOTHING',
      ['20241202_create_comprehensive_auth_schema', 'completed']
    );

    console.log('✅ Authentication schema enhancement completed successfully!');
    
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await closeConnections();
  }
}

enhanceSchema();