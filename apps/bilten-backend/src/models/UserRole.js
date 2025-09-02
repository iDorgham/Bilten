const BaseRepository = require('../database/BaseRepository');
const { query } = require('../database/connection');

/**
 * UserRole Model
 * 
 * Manages user role assignments with context support and expiration
 */
class UserRole extends BaseRepository {
  constructor() {
    super('authentication.user_roles', 'user_role', 1800); // 30 minutes cache
  }

  /**
   * Assign role to user
   */
  async assignRole(userData) {
    const {
      user_id,
      role_id,
      context = 'global',
      granted_by = null,
      expires_at = null
    } = userData;

    // Validate required fields
    if (!user_id || !role_id) {
      throw new Error('User ID and Role ID are required');
    }

    // Check if assignment already exists
    const existing = await this.findUserRole(user_id, role_id, context, false);
    if (existing) {
      throw new Error('User already has this role in the specified context');
    }

    const assignmentData = {
      user_id,
      role_id,
      context,
      granted_by,
      expires_at
    };

    const assignment = await super.create(assignmentData);

    // Clear user roles cache
    await this.invalidateCache(user_id, ['user']);
    await this.invalidateCache(`${user_id}:${context}`, ['user_context']);

    return assignment;
  }

  /**
   * Remove role from user
   */
  async removeRole(user_id, role_id, context = 'global') {
    const result = await query(
      `DELETE FROM authentication.user_roles 
       WHERE user_id = $1 AND role_id = $2 AND context = $3
       RETURNING *`,
      [user_id, role_id, context]
    );

    if (result.rows.length > 0) {
      // Clear user roles cache
      await this.invalidateCache(user_id, ['user']);
      await this.invalidateCache(`${user_id}:${context}`, ['user_context']);
    }

    return result.rows[0] || null;
  }

  /**
   * Find specific user role assignment
   */
  async findUserRole(user_id, role_id, context = 'global', useCache = true) {
    const cacheKey = this.getCacheKey(`${user_id}:${role_id}:${context}`, 'assignment');
    
    if (useCache) {
      const cached = await this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    const result = await query(
      `SELECT ur.*, r.name as role_name, r.permissions
       FROM authentication.user_roles ur
       JOIN authentication.roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1 AND ur.role_id = $2 AND ur.context = $3
       AND (ur.expires_at IS NULL OR ur.expires_at > NOW())`,
      [user_id, role_id, context]
    );

    const assignment = result.rows[0] || null;

    if (assignment && useCache) {
      // Parse permissions
      if (assignment.permissions) {
        assignment.permissions = JSON.parse(assignment.permissions);
      }
      await this.setCache(cacheKey, assignment);
    }

    return assignment;
  }

  /**
   * Get all roles for a user
   */
  async getUserRoles(user_id, context = null, useCache = true, useReplica = true) {
    const cacheKey = context 
      ? this.getCacheKey(`${user_id}:${context}`, 'user_context')
      : this.getCacheKey(user_id, 'user');
    
    if (useCache) {
      const cached = await this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    let whereClause = 'ur.user_id = $1 AND (ur.expires_at IS NULL OR ur.expires_at > NOW())';
    let params = [user_id];

    if (context) {
      whereClause += ' AND ur.context = $2';
      params.push(context);
    }

    const result = await query(
      `SELECT 
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
         r.is_system_role
       FROM authentication.user_roles ur
       JOIN authentication.roles r ON ur.role_id = r.id
       WHERE ${whereClause}
       ORDER BY ur.granted_at DESC`,
      params,
      useReplica
    );

    const roles = result.rows.map(role => ({
      ...role,
      permissions: role.permissions ? JSON.parse(role.permissions) : []
    }));

    if (useCache) {
      await this.setCache(cacheKey, roles);
    }

    return roles;
  }

  /**
   * Get all permissions for a user across all roles and contexts
   */
  async getUserPermissions(user_id, context = null, useCache = true, useReplica = true) {
    const cacheKey = context 
      ? this.getCacheKey(`${user_id}:${context}`, 'permissions_context')
      : this.getCacheKey(user_id, 'permissions');
    
    if (useCache) {
      const cached = await this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    const roles = await this.getUserRoles(user_id, context, useCache, useReplica);
    
    // Combine all permissions from all roles
    const allPermissions = new Set();
    const roleDetails = [];

    for (const role of roles) {
      roleDetails.push({
        role_id: role.role_id,
        role_name: role.role_name,
        context: role.context,
        permissions: role.permissions
      });

      // Add permissions to the set
      if (role.permissions) {
        role.permissions.forEach(permission => allPermissions.add(permission));
      }
    }

    const result = {
      user_id,
      context,
      permissions: Array.from(allPermissions),
      roles: roleDetails,
      has_admin: allPermissions.has('*')
    };

    if (useCache) {
      await this.setCache(cacheKey, result);
    }

    return result;
  }

  /**
   * Check if user has specific permission
   */
  async userHasPermission(user_id, permission, context = null, useCache = true) {
    const userPermissions = await this.getUserPermissions(user_id, context, useCache);
    
    // Check for admin wildcard
    if (userPermissions.has_admin) {
      return true;
    }

    // Check for exact permission match
    if (userPermissions.permissions.includes(permission)) {
      return true;
    }

    // Check for wildcard patterns (e.g., "events:*" matches "events:create")
    return userPermissions.permissions.some(perm => {
      if (perm.endsWith(':*')) {
        const prefix = perm.slice(0, -2);
        return permission.startsWith(prefix + ':');
      }
      return false;
    });
  }

  /**
   * Check if user has any of the specified roles
   */
  async userHasRole(user_id, roleNames, context = null, useCache = true) {
    if (!Array.isArray(roleNames)) {
      roleNames = [roleNames];
    }

    const userRoles = await this.getUserRoles(user_id, context, useCache);
    const userRoleNames = userRoles.map(role => role.role_name);

    return roleNames.some(roleName => userRoleNames.includes(roleName));
  }

  /**
   * Get users with specific role
   */
  async getUsersByRole(role_id, context = null, useReplica = true) {
    let whereClause = 'ur.role_id = $1 AND (ur.expires_at IS NULL OR ur.expires_at > NOW())';
    let params = [role_id];

    if (context) {
      whereClause += ' AND ur.context = $2';
      params.push(context);
    }

    const result = await query(
      `SELECT 
         u.id,
         u.email,
         u.first_name,
         u.last_name,
         u.display_name,
         ur.context,
         ur.granted_at,
         ur.expires_at
       FROM authentication.user_roles ur
       JOIN users.users u ON ur.user_id = u.id
       WHERE ${whereClause} AND u.deleted_at IS NULL
       ORDER BY ur.granted_at DESC`,
      params,
      useReplica
    );

    return result.rows;
  }

  /**
   * Clean up expired role assignments
   */
  async cleanupExpiredRoles() {
    const result = await query(
      `DELETE FROM authentication.user_roles 
       WHERE expires_at IS NOT NULL AND expires_at <= NOW()
       RETURNING user_id, role_id, context`
    );

    // Clear caches for affected users
    const affectedUsers = new Set();
    result.rows.forEach(row => {
      affectedUsers.add(row.user_id);
    });

    for (const user_id of affectedUsers) {
      await this.invalidateCache(user_id, ['user', 'permissions']);
      // Also clear context-specific caches
      const contexts = [...new Set(result.rows
        .filter(row => row.user_id === user_id)
        .map(row => row.context))];
      
      for (const context of contexts) {
        await this.invalidateCache(`${user_id}:${context}`, ['user_context', 'permissions_context']);
      }
    }

    return result.rows.length;
  }

  /**
   * Get role assignment statistics
   */
  async getRoleStats(useReplica = true) {
    const result = await query(
      `SELECT 
         r.name as role_name,
         r.description,
         COUNT(ur.id) as user_count,
         COUNT(CASE WHEN ur.context = 'global' THEN 1 END) as global_assignments,
         COUNT(CASE WHEN ur.context != 'global' THEN 1 END) as context_assignments,
         COUNT(CASE WHEN ur.expires_at IS NOT NULL THEN 1 END) as temporary_assignments
       FROM authentication.roles r
       LEFT JOIN authentication.user_roles ur ON r.id = ur.role_id 
         AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
       GROUP BY r.id, r.name, r.description
       ORDER BY user_count DESC, r.name`,
      [],
      useReplica
    );

    return result.rows;
  }

  /**
   * Bulk assign roles to multiple users
   */
  async bulkAssignRoles(assignments) {
    if (!Array.isArray(assignments) || assignments.length === 0) {
      throw new Error('Assignments must be a non-empty array');
    }

    const results = [];
    const affectedUsers = new Set();

    for (const assignment of assignments) {
      try {
        const result = await this.assignRole(assignment);
        results.push({ success: true, assignment: result });
        affectedUsers.add(assignment.user_id);
      } catch (error) {
        results.push({ 
          success: false, 
          error: error.message, 
          assignment: assignment 
        });
      }
    }

    // Clear caches for all affected users
    for (const user_id of affectedUsers) {
      await this.invalidateCache(user_id, ['user', 'permissions']);
    }

    return results;
  }

  /**
   * Update role assignment (extend expiration, change context, etc.)
   */
  async updateAssignment(id, updateData) {
    const assignment = await super.update(id, updateData);

    if (assignment) {
      // Clear user roles cache
      await this.invalidateCache(assignment.user_id, ['user', 'permissions']);
      if (assignment.context) {
        await this.invalidateCache(`${assignment.user_id}:${assignment.context}`, ['user_context', 'permissions_context']);
      }
    }

    return assignment;
  }
}

module.exports = UserRole;