-- Create blacklisted tokens table for JWT revocation
-- This table stores revoked JWT tokens to prevent their reuse

CREATE TABLE IF NOT EXISTS authentication.blacklisted_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jti VARCHAR(255) UNIQUE NOT NULL, -- JWT ID from token payload
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- When the original token expires
    reason VARCHAR(100) DEFAULT 'logout', -- Reason for blacklisting (logout, security, etc.)
    user_id UUID REFERENCES users.users(id) ON DELETE CASCADE, -- Optional: link to user
    session_id UUID REFERENCES authentication.user_sessions(id) ON DELETE CASCADE, -- Optional: link to session
    metadata JSONB DEFAULT '{}', -- Additional metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_blacklisted_tokens_jti ON authentication.blacklisted_tokens(jti);
CREATE INDEX IF NOT EXISTS idx_blacklisted_tokens_expires ON authentication.blacklisted_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_blacklisted_tokens_user_id ON authentication.blacklisted_tokens(user_id);

-- Create a function to clean up expired blacklisted tokens
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
GRANT ALL PRIVILEGES ON authentication.blacklisted_tokens TO bilten_user;
GRANT EXECUTE ON FUNCTION authentication.cleanup_expired_blacklisted_tokens() TO bilten_user;

-- Add comment
COMMENT ON TABLE authentication.blacklisted_tokens IS 'Stores revoked JWT tokens to prevent reuse until expiration';
COMMENT ON FUNCTION authentication.cleanup_expired_blacklisted_tokens() IS 'Removes expired blacklisted tokens to keep table size manageable';