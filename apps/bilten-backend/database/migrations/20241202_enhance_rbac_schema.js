/**
 * Migration: Enhance RBAC Schema
 * 
 * This migration enhances the existing RBAC schema with additional features
 * like role hierarchy, better indexing, and default permissions.
 */

const up = async (client) => {
  // Add parent_role_id column to roles table for role hierarchy
  await client.query(`
    ALTER TABLE authentication.roles 
    ADD COLUMN IF NOT EXISTS parent_role_id UUID REFERENCES authentication.roles(id) ON DELETE SET NULL;
  `);

  // Add index for parent_role_id
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_roles_parent_role_id ON authentication.roles(parent_role_id);
  `);

  // Update default roles with enhanced permissions
  await client.query(`
    INSERT INTO authentication.roles (name, description, permissions, is_system_role)
    VALUES 
      ('user', 'Standard user with basic permissions', 
       '["profile:read", "profile:update", "events:read", "tickets:purchase"]', true),
      ('organizer', 'Event organizer with event management permissions', 
       '["profile:read", "profile:update", "events:read", "events:create", "events:update", "events:delete", "tickets:read", "tickets:create", "tickets:update", "analytics:read"]', true),
      ('admin', 'System administrator with full permissions', 
       '["*"]', true)
    ON CONFLICT (name) DO UPDATE SET
      description = EXCLUDED.description,
      permissions = EXCLUDED.permissions,
      updated_at = NOW();
  `);

  // Add indexes for better performance
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_user_roles_expires_at ON authentication.user_roles(expires_at);
    CREATE INDEX IF NOT EXISTS idx_user_roles_granted_at ON authentication.user_roles(granted_at);
    CREATE INDEX IF NOT EXISTS idx_user_roles_granted_by ON authentication.user_roles(granted_by);
  `);

  // Create a function to check if a user has a specific permission
  await client.query(`
    CREATE OR REPLACE FUNCTION user_has_permission(user_uuid UUID, permission_name TEXT, context_name TEXT DEFAULT 'global')
    RETURNS BOOLEAN AS $$
    DECLARE
        has_permission BOOLEAN := FALSE;
        role_permissions JSONB;
    BEGIN
        -- Check if user has any role with the required permission
        SELECT EXISTS(
            SELECT 1
            FROM authentication.user_roles ur
            JOIN authentication.roles r ON ur.role_id = r.id
            WHERE ur.user_id = user_uuid
            AND (ur.context = context_name OR context_name IS NULL)
            AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
            AND (
                r.permissions::jsonb ? permission_name
                OR r.permissions::jsonb ? '*'
                OR EXISTS(
                    SELECT 1
                    FROM jsonb_array_elements_text(r.permissions::jsonb) AS perm
                    WHERE perm LIKE SPLIT_PART(permission_name, ':', 1) || ':*'
                )
            )
        ) INTO has_permission;
        
        RETURN has_permission;
    END;
    $$ LANGUAGE plpgsql STABLE;
  `);

  // Create a function to get all user permissions
  await client.query(`
    CREATE OR REPLACE FUNCTION get_user_permissions(user_uuid UUID, context_name TEXT DEFAULT NULL)
    RETURNS TABLE(permission TEXT) AS $$
    BEGIN
        RETURN QUERY
        SELECT DISTINCT jsonb_array_elements_text(r.permissions::jsonb) AS permission
        FROM authentication.user_roles ur
        JOIN authentication.roles r ON ur.role_id = r.id
        WHERE ur.user_id = user_uuid
        AND (context_name IS NULL OR ur.context = context_name)
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW());
    END;
    $$ LANGUAGE plpgsql STABLE;
  `);

  // Create a view for active user roles with role details
  await client.query(`
    CREATE OR REPLACE VIEW authentication.active_user_roles AS
    SELECT 
        ur.id,
        ur.user_id,
        ur.role_id,
        ur.context,
        ur.granted_by,
        ur.granted_at,
        ur.expires_at,
        r.name as role_name,
        r.description as role_description,
        r.permissions,
        r.is_system_role,
        u.email as user_email,
        u.first_name,
        u.last_name
    FROM authentication.user_roles ur
    JOIN authentication.roles r ON ur.role_id = r.id
    JOIN users.users u ON ur.user_id = u.id
    WHERE (ur.expires_at IS NULL OR ur.expires_at > NOW())
    AND u.deleted_at IS NULL;
  `);

  // Create a view for role statistics
  await client.query(`
    CREATE OR REPLACE VIEW authentication.role_statistics AS
    SELECT 
        r.id,
        r.name,
        r.description,
        r.is_system_role,
        COUNT(ur.id) as total_assignments,
        COUNT(CASE WHEN ur.context = 'global' THEN 1 END) as global_assignments,
        COUNT(CASE WHEN ur.context != 'global' THEN 1 END) as context_assignments,
        COUNT(CASE WHEN ur.expires_at IS NOT NULL THEN 1 END) as temporary_assignments,
        COUNT(CASE WHEN ur.expires_at IS NULL THEN 1 END) as permanent_assignments
    FROM authentication.roles r
    LEFT JOIN authentication.user_roles ur ON r.id = ur.role_id 
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    GROUP BY r.id, r.name, r.description, r.is_system_role
    ORDER BY total_assignments DESC, r.name;
  `);

  // Add a trigger to automatically clean up expired role assignments
  await client.query(`
    CREATE OR REPLACE FUNCTION cleanup_expired_user_roles()
    RETURNS TRIGGER AS $$
    BEGIN
        DELETE FROM authentication.user_roles 
        WHERE expires_at IS NOT NULL AND expires_at <= NOW();
        RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Create a trigger that runs daily to clean up expired roles
  await client.query(`
    DROP TRIGGER IF EXISTS trigger_cleanup_expired_roles ON authentication.user_roles;
    CREATE TRIGGER trigger_cleanup_expired_roles
        AFTER INSERT OR UPDATE ON authentication.user_roles
        FOR EACH STATEMENT
        EXECUTE FUNCTION cleanup_expired_user_roles();
  `);
};

const down = async (client) => {
  // Drop triggers and functions
  await client.query(`DROP TRIGGER IF EXISTS trigger_cleanup_expired_roles ON authentication.user_roles;`);
  await client.query(`DROP FUNCTION IF EXISTS cleanup_expired_user_roles();`);
  await client.query(`DROP FUNCTION IF EXISTS get_user_permissions(UUID, TEXT);`);
  await client.query(`DROP FUNCTION IF EXISTS user_has_permission(UUID, TEXT, TEXT);`);
  
  // Drop views
  await client.query(`DROP VIEW IF EXISTS authentication.role_statistics;`);
  await client.query(`DROP VIEW IF EXISTS authentication.active_user_roles;`);
  
  // Drop indexes
  await client.query(`DROP INDEX IF EXISTS idx_user_roles_expires_at;`);
  await client.query(`DROP INDEX IF EXISTS idx_user_roles_granted_at;`);
  await client.query(`DROP INDEX IF EXISTS idx_user_roles_granted_by;`);
  await client.query(`DROP INDEX IF EXISTS idx_roles_parent_role_id;`);
  
  // Remove parent_role_id column
  await client.query(`ALTER TABLE authentication.roles DROP COLUMN IF EXISTS parent_role_id;`);
};

module.exports = {
  up,
  down,
};