-- User and Authentication Functions and Triggers
-- Task 2.1: Supporting functions for user and authentication schemas

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to log user audit events
CREATE OR REPLACE FUNCTION log_user_audit()
RETURNS TRIGGER AS $$
DECLARE
    action_type VARCHAR(10);
    old_data JSONB;
    new_data JSONB;
BEGIN
    -- Determine action type
    IF TG_OP = 'DELETE' THEN
        action_type := 'DELETE';
        old_data := to_jsonb(OLD);
        new_data := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        action_type := 'UPDATE';
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);
    ELSIF TG_OP = 'INSERT' THEN
        action_type := 'INSERT';
        old_data := NULL;
        new_data := to_jsonb(NEW);
    END IF;

    -- Insert audit log entry
    INSERT INTO audit.user_audit_log (
        user_id,
        action,
        resource_type,
        resource_id,
        old_values,
        new_values,
        created_at
    ) VALUES (
        COALESCE(NEW.id, OLD.id),
        action_type,
        TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        old_data,
        new_data,
        NOW()
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to validate user permissions
CREATE OR REPLACE FUNCTION check_user_permission(
    p_user_id UUID,
    p_resource VARCHAR(100),
    p_action VARCHAR(50),
    p_context JSONB DEFAULT '{}'
)
RETURNS BOOLEAN AS $$
DECLARE
    has_permission BOOLEAN := FALSE;
BEGIN
    -- Check if user has direct permission through roles
    SELECT EXISTS (
        SELECT 1
        FROM authentication.user_roles ur
        JOIN authentication.role_permissions rp ON ur.role_id = rp.role_id
        JOIN authentication.permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = p_user_id
        AND ur.is_active = TRUE
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
        AND p.resource = p_resource
        AND p.action = p_action
    ) INTO has_permission;

    RETURN has_permission;
END;
$$ LANGUAGE plpgsql;

-- Function to create user session
CREATE OR REPLACE FUNCTION create_user_session(
    p_user_id UUID,
    p_session_token VARCHAR(255),
    p_refresh_token VARCHAR(255),
    p_session_type session_type DEFAULT 'web',
    p_device_info JSONB DEFAULT '{}',
    p_ip_address INET DEFAULT NULL,
    p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    session_id UUID;
    default_expiry TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Set default expiry if not provided
    IF p_expires_at IS NULL THEN
        default_expiry := NOW() + INTERVAL '30 days';
    ELSE
        default_expiry := p_expires_at;
    END IF;

    -- Insert new session
    INSERT INTO authentication.user_sessions (
        user_id,
        session_token,
        refresh_token,
        session_type,
        device_name,
        device_type,
        browser,
        os,
        ip_address,
        expires_at
    ) VALUES (
        p_user_id,
        p_session_token,
        p_refresh_token,
        p_session_type,
        p_device_info->>'device_name',
        p_device_info->>'device_type',
        p_device_info->>'browser',
        p_device_info->>'os',
        p_ip_address,
        default_expiry
    ) RETURNING id INTO session_id;

    -- Log session creation
    INSERT INTO authentication.user_activity (
        user_id,
        activity_type,
        ip_address,
        success,
        metadata
    ) VALUES (
        p_user_id,
        'session_created',
        p_ip_address,
        TRUE,
        jsonb_build_object('session_id', session_id, 'session_type', p_session_type)
    );

    RETURN session_id;
END;
$$ LANGUAGE plpgsql;

-- Function to invalidate user session
CREATE OR REPLACE FUNCTION invalidate_user_session(
    p_session_id UUID,
    p_reason VARCHAR(255) DEFAULT 'logout'
)
RETURNS BOOLEAN AS $$
DECLARE
    session_user_id UUID;
BEGIN
    -- Get user_id and update session
    UPDATE authentication.user_sessions 
    SET is_active = FALSE,
        last_activity = NOW()
    WHERE id = p_session_id
    RETURNING user_id INTO session_user_id;

    -- Log session invalidation
    IF session_user_id IS NOT NULL THEN
        INSERT INTO authentication.user_activity (
            user_id,
            activity_type,
            success,
            metadata
        ) VALUES (
            session_user_id,
            'session_invalidated',
            TRUE,
            jsonb_build_object('session_id', p_session_id, 'reason', p_reason)
        );
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to assign role to user
CREATE OR REPLACE FUNCTION assign_user_role(
    p_user_id UUID,
    p_role_name VARCHAR(100),
    p_assigned_by UUID DEFAULT NULL,
    p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_context JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    role_id UUID;
    assignment_id UUID;
BEGIN
    -- Get role ID
    SELECT id INTO role_id
    FROM authentication.roles
    WHERE name = p_role_name;

    IF role_id IS NULL THEN
        RAISE EXCEPTION 'Role % not found', p_role_name;
    END IF;

    -- Insert role assignment
    INSERT INTO authentication.user_roles (
        user_id,
        role_id,
        assigned_by,
        expires_at,
        context
    ) VALUES (
        p_user_id,
        role_id,
        p_assigned_by,
        p_expires_at,
        p_context
    ) RETURNING id INTO assignment_id;

    -- Log role assignment
    INSERT INTO audit.user_audit_log (
        user_id,
        action,
        resource_type,
        resource_id,
        new_values
    ) VALUES (
        p_user_id,
        'role_assigned',
        'authentication.user_roles',
        assignment_id,
        jsonb_build_object('role_name', p_role_name, 'assigned_by', p_assigned_by)
    );

    RETURN assignment_id;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete expired sessions
    DELETE FROM authentication.user_sessions
    WHERE expires_at < NOW() OR (last_activity < NOW() - INTERVAL '90 days');

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    -- Delete old verification tokens
    DELETE FROM authentication.verification_tokens
    WHERE expires_at < NOW() OR created_at < NOW() - INTERVAL '30 days';

    -- Delete old user activity logs (keep 1 year)
    DELETE FROM authentication.user_activity
    WHERE created_at < NOW() - INTERVAL '1 year';

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id UUID)
RETURNS TABLE (
    permission_name VARCHAR(100),
    resource VARCHAR(100),
    action VARCHAR(50),
    role_name VARCHAR(100)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.name as permission_name,
        p.resource,
        p.action,
        r.name as role_name
    FROM authentication.user_roles ur
    JOIN authentication.roles r ON ur.role_id = r.id
    JOIN authentication.role_permissions rp ON r.id = rp.role_id
    JOIN authentication.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = p_user_id
    AND ur.is_active = TRUE
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW());
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_user_profiles_updated_at
    BEFORE UPDATE ON users.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_user_preferences_updated_at
    BEFORE UPDATE ON users.user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_roles_updated_at
    BEFORE UPDATE ON authentication.roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_user_sessions_updated_at
    BEFORE UPDATE ON authentication.user_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_external_auth_updated_at
    BEFORE UPDATE ON authentication.external_auth
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_two_factor_auth_updated_at
    BEFORE UPDATE ON authentication.two_factor_auth
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create audit triggers for sensitive tables
CREATE TRIGGER trigger_users_audit
    AFTER INSERT OR UPDATE OR DELETE ON users.users
    FOR EACH ROW EXECUTE FUNCTION log_user_audit();

CREATE TRIGGER trigger_user_roles_audit
    AFTER INSERT OR UPDATE OR DELETE ON authentication.user_roles
    FOR EACH ROW EXECUTE FUNCTION log_user_audit();

CREATE TRIGGER trigger_permissions_audit
    AFTER INSERT OR UPDATE OR DELETE ON authentication.permissions
    FOR EACH ROW EXECUTE FUNCTION log_user_audit();

-- Create row-level security policies
ALTER TABLE users.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE authentication.user_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own data
CREATE POLICY user_own_data_policy ON users.users
    FOR ALL TO bilten_user
    USING (id = current_setting('app.current_user_id')::UUID);

CREATE POLICY user_profile_own_data_policy ON users.user_profiles
    FOR ALL TO bilten_user
    USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY user_preferences_own_data_policy ON users.user_preferences
    FOR ALL TO bilten_user
    USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY user_sessions_own_data_policy ON authentication.user_sessions
    FOR ALL TO bilten_user
    USING (user_id = current_setting('app.current_user_id')::UUID);

-- Admin bypass policy
CREATE POLICY admin_bypass_policy ON users.users
    FOR ALL TO bilten_user
    USING (
        EXISTS (
            SELECT 1 FROM authentication.user_roles ur
            JOIN authentication.roles r ON ur.role_id = r.id
            WHERE ur.user_id = current_setting('app.current_user_id')::UUID
            AND r.name IN ('admin', 'super_admin')
            AND ur.is_active = TRUE
        )
    );