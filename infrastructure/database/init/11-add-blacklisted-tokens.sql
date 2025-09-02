-- Add blacklisted tokens table for JWT token revocation
-- This table stores revoked JWT tokens to prevent their reuse

-- Create blacklisted_tokens table
CREATE TABLE IF NOT EXISTS authentication.blacklisted_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jti VARCHAR(255) UNIQUE NOT NULL, -- JWT ID claim
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    reason VARCHAR(100) DEFAULT 'logout',
    user_id UUID REFERENCES users.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing metadata column to user_sessions if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'authentication' 
        AND table_name = 'user_sessions' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE authentication.user_sessions 
        ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
END $$;

-- Add missing updated_at column to user_sessions if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'authentication' 
        AND table_name = 'user_sessions' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE authentication.user_sessions 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_blacklisted_tokens_jti ON authentication.blacklisted_tokens(jti);
CREATE INDEX IF NOT EXISTS idx_blacklisted_tokens_expires ON authentication.blacklisted_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_blacklisted_tokens_user_id ON authentication.blacklisted_tokens(user_id);

-- Create cleanup function to remove expired blacklisted tokens
CREATE OR REPLACE FUNCTION authentication.cleanup_expired_blacklisted_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM authentication.blacklisted_tokens 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL PRIVILEGES ON TABLE authentication.blacklisted_tokens TO bilten_user;
GRANT EXECUTE ON FUNCTION authentication.cleanup_expired_blacklisted_tokens() TO bilten_user;

-- Add comment for documentation
COMMENT ON TABLE authentication.blacklisted_tokens IS 'Stores revoked JWT tokens to prevent reuse until expiration';
COMMENT ON COLUMN authentication.blacklisted_tokens.jti IS 'JWT ID claim - unique identifier for each token';
COMMENT ON COLUMN authentication.blacklisted_tokens.expires_at IS 'When the token naturally expires and can be removed from blacklist';
COMMENT ON COLUMN authentication.blacklisted_tokens.reason IS 'Reason for token revocation (logout, security, etc.)';