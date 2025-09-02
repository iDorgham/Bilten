const BaseRepository = require('../database/BaseRepository');
const { query } = require('../database/connection');

/**
 * Role Model
 * 
 * Manages roles in the RBAC system with permissions and hierarchical support
 */
class Role extends BaseRepository {
  constructor() {
    super('authentication.roles', 'role', 3600); // 1 hour cache
  }

  /**
   * Create a new role with permissions
   */
  async create(roleData) {
    const {
      name,
      description,
      permissions = [],
      is_system_role = false,
      parent_role_id = null
    } = roleData;

    // Validate required fields
    if (!name) {
      throw new Error('Role name is required');
    }

    // Check if role already exists
    const existingRole = await this.findByName(name, false);
    if (existingRole) {
      throw new Error('Role with this name already exists');
    }

    // Validate permissions format
    if (!Array.isArray(permissions)) {
      throw new Error('Permissions must be an array');
    }

    const newRoleData = {
      name: name.toLowerCase(),
      description,
      permissions: JSON.stringify(permissions),
      is_system_role,
      parent_role_id
    };

    const role = await super.create(newRoleData);

    // Cache by name as well
    await this.setCache(this.getCacheKey(role.name, 'name'), role);

    return role;
  }

  /**
   * Find role by name
   */
  async findByName(name, useCache = true, useReplica = true) {
    const normalizedName = name.toLowerCase();
    const cacheKey = this.getCacheKey(normalizedName, 'name');
    
    if (useCache) {
      const cached = await this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    const result = await query(
      'SELECT * FROM authentication.roles WHERE name = $1',
      [normalizedName],
      useReplica
    );

    const role = result.rows[0] || null;

    if (role && useCache) {
      // Parse permissions JSON
      if (role.permissions) {
        role.permissions = JSON.parse(role.permissions);
      }
      
      await this.setCache(cacheKey, role);
      await this.setCache(this.getCacheKey(role.id), role);
    }

    return role;
  }

  /**
   * Get role with inherited permissions from parent roles
   */
  async findWithInheritedPermissions(roleId, useCache = true, useReplica = true) {
    const cacheKey = this.getCacheKey(roleId, 'inherited');
    
    if (useCache) {
      const cached = await this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    const result = await query(
      `WITH RECURSIVE role_hierarchy AS (
        -- Base case: start with the requested role
        SELECT id, name, description, permissions, parent_role_id, 0 as level
        FROM authentication.roles 
        WHERE id = $1
        
        UNION ALL
        
        -- Recursive case: get parent roles
        SELECT r.id, r.name, r.description, r.permissions, r.parent_role_id, rh.level + 1
        FROM authentication.roles r
        INNER JOIN role_hierarchy rh ON r.id = rh.parent_role_id
        WHERE rh.level < 10 -- Prevent infinite recursion
      )
      SELECT 
        rh.id,
        rh.name,
        rh.description,
        rh.permissions,
        rh.parent_role_id,
        rh.level,
        array_agg(DISTINCT jsonb_array_elements_text(rh.permissions::jsonb)) as all_permissions
      FROM role_hierarchy rh
      GROUP BY rh.id, rh.name, rh.description, rh.permissions, rh.parent_role_id, rh.level
      ORDER BY rh.level`,
      [roleId],
      useReplica
    );

    if (result.rows.length === 0) {
      return null;
    }

    // Combine all permissions from role hierarchy
    const allPermissions = new Set();
    result.rows.forEach(row => {
      if (row.all_permissions) {
        row.all_permissions.forEach(permission => {
          if (permission) allPermissions.add(permission);
        });
      }
    });

    const role = {
      ...result.rows[0],
      permissions: Array.from(allPermissions),
      inherited_permissions: result.rows.slice(1).map(row => ({
        id: row.id,
        name: row.name,
        permissions: row.all_permissions || []
      }))
    };

    if (useCache) {
      await this.setCache(cacheKey, role);
    }

    return role;
  }

  /**
   * Get all roles with their permissions
   */
  async getAllRoles(useCache = true, useReplica = true) {
    const cacheKey = this.getCacheKey('all', 'list');
    
    if (useCache) {
      const cached = await this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    const result = await query(
      `SELECT id, name, description, permissions, is_system_role, parent_role_id, created_at, updated_at
       FROM authentication.roles 
       ORDER BY is_system_role DESC, name ASC`,
      [],
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
   * Update role with permissions validation
   */
  async update(id, roleData) {
    // Validate permissions format if provided
    if (roleData.permissions && !Array.isArray(roleData.permissions)) {
      throw new Error('Permissions must be an array');
    }

    // Convert permissions to JSON string
    if (roleData.permissions) {
      roleData.permissions = JSON.stringify(roleData.permissions);
    }

    // Normalize name if provided
    if (roleData.name) {
      roleData.name = roleData.name.toLowerCase();
    }

    const role = await super.update(id, roleData);

    if (role) {
      // Parse permissions back to array
      if (role.permissions) {
        role.permissions = JSON.parse(role.permissions);
      }

      // Update name cache if name changed
      if (roleData.name) {
        await this.setCache(this.getCacheKey(role.name, 'name'), role);
      }
      
      // Clear inherited permissions cache
      await this.invalidateCache(role.id, ['inherited']);
      await this.invalidateCache('all', ['list']);
    }

    return role;
  }

  /**
   * Delete role with validation
   */
  async delete(id, soft = true) {
    // Check if role is assigned to any users
    const userRoleResult = await query(
      'SELECT COUNT(*) as count FROM authentication.user_roles WHERE role_id = $1',
      [id]
    );

    if (parseInt(userRoleResult.rows[0].count) > 0) {
      throw new Error('Cannot delete role that is assigned to users');
    }

    // Get role first to clear caches
    const role = await this.findById(id, false);
    
    const deletedRole = await super.delete(id, soft);
    
    if (deletedRole && role) {
      // Clear all caches
      await this.invalidateCache(role.id);
      if (role.name) {
        await this.invalidateCache(role.name, ['name']);
      }
      await this.invalidateCache(role.id, ['inherited']);
      await this.invalidateCache('all', ['list']);
    }

    return deletedRole;
  }

  /**
   * Check if a role has a specific permission
   */
  async hasPermission(roleId, permission, useCache = true) {
    const role = await this.findWithInheritedPermissions(roleId, useCache);
    if (!role) {
      return false;
    }

    // Check for wildcard permission
    if (role.permissions.includes('*')) {
      return true;
    }

    // Check for exact permission match
    if (role.permissions.includes(permission)) {
      return true;
    }

    // Check for wildcard patterns (e.g., "events:*" matches "events:create")
    return role.permissions.some(perm => {
      if (perm.endsWith(':*')) {
        const prefix = perm.slice(0, -2);
        return permission.startsWith(prefix + ':');
      }
      return false;
    });
  }

  /**
   * Get roles by permission
   */
  async getRolesByPermission(permission, useReplica = true) {
    const result = await query(
      `SELECT id, name, description, permissions
       FROM authentication.roles 
       WHERE permissions::jsonb ? $1 OR permissions::jsonb ? '*'
       ORDER BY name`,
      [permission],
      useReplica
    );

    return result.rows.map(role => ({
      ...role,
      permissions: role.permissions ? JSON.parse(role.permissions) : []
    }));
  }

  /**
   * Create default system roles
   */
  async createDefaultRoles() {
    const defaultRoles = [
      {
        name: 'user',
        description: 'Standard user with basic permissions',
        permissions: [
          'profile:read',
          'profile:update',
          'events:read',
          'tickets:purchase'
        ],
        is_system_role: true
      },
      {
        name: 'organizer',
        description: 'Event organizer with event management permissions',
        permissions: [
          'profile:read',
          'profile:update',
          'events:read',
          'events:create',
          'events:update',
          'events:delete',
          'tickets:read',
          'tickets:create',
          'tickets:update',
          'analytics:read'
        ],
        is_system_role: true
      },
      {
        name: 'admin',
        description: 'System administrator with full permissions',
        permissions: ['*'],
        is_system_role: true
      }
    ];

    const createdRoles = [];
    for (const roleData of defaultRoles) {
      try {
        const existingRole = await this.findByName(roleData.name, false);
        if (!existingRole) {
          const role = await this.create(roleData);
          createdRoles.push(role);
        }
      } catch (error) {
        console.warn(`Failed to create default role ${roleData.name}:`, error.message);
      }
    }

    return createdRoles;
  }
}

module.exports = Role;