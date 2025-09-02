/**
 * Migration: Create MFA Table
 * 
 * This migration creates the mfa_settings table for storing user MFA configurations
 * including TOTP secrets, backup codes, and MFA status.
 */

const up = async (client) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS authentication.mfa_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      totp_secret VARCHAR(32) NOT NULL,
      totp_enabled BOOLEAN DEFAULT false,
      backup_codes JSONB DEFAULT '[]',
      backup_codes_used JSONB DEFAULT '[]',
      sms_enabled BOOLEAN DEFAULT false,
      sms_phone VARCHAR(20),
      email_enabled BOOLEAN DEFAULT false,
      email_address VARCHAR(255),
      mfa_enforced BOOLEAN DEFAULT false,
      last_used_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      FOREIGN KEY (user_id) REFERENCES users.users(id) ON DELETE CASCADE
    );
    
    CREATE INDEX idx_mfa_settings_user_id ON authentication.mfa_settings(user_id);
    CREATE INDEX idx_mfa_settings_totp_enabled ON authentication.mfa_settings(totp_enabled);
    CREATE INDEX idx_mfa_settings_sms_enabled ON authentication.mfa_settings(sms_enabled);
    CREATE INDEX idx_mfa_settings_email_enabled ON authentication.mfa_settings(email_enabled);
    
    -- Add MFA columns to users table if they don't exist
    DO $$ 
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_schema = 'users' 
                     AND table_name = 'users' 
                     AND column_name = 'mfa_enabled') THEN
        ALTER TABLE users.users ADD COLUMN mfa_enabled BOOLEAN DEFAULT false;
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_schema = 'users' 
                     AND table_name = 'users' 
                     AND column_name = 'mfa_method') THEN
        ALTER TABLE users.users ADD COLUMN mfa_method VARCHAR(20) DEFAULT 'none';
      END IF;
    END $$;
  `);
};

const down = async (client) => {
  await client.query(`
    DROP TABLE IF EXISTS authentication.mfa_settings;
    
    -- Remove MFA columns from users table
    ALTER TABLE users.users DROP COLUMN IF EXISTS mfa_enabled;
    ALTER TABLE users.users DROP COLUMN IF EXISTS mfa_method;
  `);
};

module.exports = {
  up,
  down,
};
