const Role = require('../models/Role');
const UserRole = require('../models/UserRole');
const UserAccount = require('../models/UserAccount');
const logger = require('../utils/logger');

/**
 * RBAC Service
 * 
 * Provides high-level role-based access control functionality
 */
class RBACService {
  constructor() {
    this.roleModel = new Role();
    this.userRoleModel = new UserRole();
    this.userModel = new UserAccount();
  }

  /**
   * Initialize RBAC system with default roles
   */
  async initialize() {
    try {
      logger.info('Initializing RBAC system...');
      
      // Create default roles if they don't exist
      const defaultRoles = await this.roleModel.createDefaultRoles();
      
      if (defaultRoles.length > 0) {
        logger.info(`Created ${defaultRoles.length} default roles`, {
          roles: defaultRoles.map(r => r.name)
        });
      }

      // Clean up expired role assignments
      const expiredCount = await this.userRoleModel.cleanupExpiredRoles();
      if (expiredCount > 0) {
        logger.info(`Cleaned up ${expiredCount} expired role assignments`);
      }

      logger.info('RBAC system initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize RBAC system', { error: error.message });
      throw error;
    }
  }

  /**
   * Create a new role
   */
  async createRole(roleData, createdBy = null) {
    try {
      const role = await this.roleModel.create(roleData);
      
      logger.info('Role created', {
        roleId: role.id,
        roleName: role.name,
        createdBy,
        permissions: role.permissions
      });

      return role;
    } catch (error) {
      logger.error('Failed to create role', {
        roleName: roleData.name,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Update an existing role
   */
  async updateRole(roleId, updateData, updatedBy = null) {
    try {
      const role = await this.roleModel.update(roleId, updateData);
      
      if (!role) {
        throw new Error('Role not found');
      }

      logger.info('Role updated', {
        roleId: role.id,
        roleName: role.name,
        updatedBy,
        changes: Object.keys(updateData)
      });

      return role;
    } catch (error) {
      logger.error('Failed to update role', {
        roleId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Delete a role
   */
  async deleteRole(roleId, deletedBy = null) {
    try {
      const role = await this.roleModel.findById(roleId, false);
      if (!role) {
        throw new Error('Role not found');
      }

      if (role.is_system_role) {
        throw new Error('Cannot delete system roles');
      }

      const deletedRole = await this.roleModel.delete(roleId);
      
      logger.info('Role deleted', {
        roleId: deletedRole.id,
        roleName: deletedRole.name,
        deletedBy
      });

      return deletedRole;
    } catch (error) {
      logger.error('Failed to delete role', {
        roleId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Assign role to user
   */
  async assignUserRole(userId, roleName, options = {}) {
    try {
      const {
        context = 'global',
        grantedBy = null,
        expiresAt = null
      } = options;

      // Validate user exists
      const user = await this.userModel.findById(userId, false);
      if (!user) {
        throw new Error('User not found');
      }

      // Find role by name
      const role = await this.roleModel.findByName(roleName, false);
      if (!role) {
        throw new Error(`Role '${roleName}' not found`);
      }

      // Assign the role
      const assignment = await this.userRoleModel.assignRole({
        user_id: userId,
        role_id: role.id,
        context,
        granted_by: grantedBy,
        expires_at: expiresAt
      });

      logger.info('Role assigned to user', {
        userId,
        userEmail: user.email,
        roleId: role.id,
        roleName: role.name,
        context,
        grantedBy,
        expiresAt
      });

      return assignment;
    } catch (error) {
      logger.error('Failed to assign role to user', {
        userId,
        roleName,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Remove role from user
   */
  async removeUserRole(userId, roleName, context = 'global', removedBy = null) {
    try {
      // Find role by name
      const role = await this.roleModel.findByName(roleName, false);
      if (!role) {
        throw new Error(`Role '${roleName}' not found`);
      }

      const removed = await this.userRoleModel.removeRole(userId, role.id, context);
      
      if (removed) {
        const user = await this.userModel.findById(userId, false);
        
        logger.info('Role removed from user', {
          userId,
          userEmail: user?.email,
          roleId: role.id,
          roleName: role.name,
          context,
          removedBy
        });
      }

      return removed;
    } catch (error) {
      logger.error('Failed to remove role from user', {
        userId,
        roleName,
        context,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Check if user has permission
   */
  async checkPermission(userId, permission, context = null) {
    try {
      return await this.userRoleModel.userHasPermission(userId, permission, context);
    } catch (error) {
      logger.error('Failed to check user permission', {
        userId,
        permission,
        context,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Check if user has role
   */
  async checkRole(userId, roleNames, context = null) {
    try {
      return await this.userRoleModel.userHasRole(userId, roleNames, context);
    } catch (error) {
      logger.error('Failed to check user role', {
        userId,
        roleNames,
        context,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Get user permissions
   */
  async getUserPermissions(userId, context = null) {
    try {
      return await this.userRoleModel.getUserPermissions(userId, context);
    } catch (error) {
      logger.error('Failed to get user permissions', {
        userId,
        context,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get user roles
   */
  async getUserRoles(userId, context = null) {
    try {
      return await this.userRoleModel.getUserRoles(userId, context);
    } catch (error) {
      logger.error('Failed to get user roles', {
        userId,
        context,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get all available roles
   */
  async getAllRoles() {
    try {
      return await this.roleModel.getAllRoles();
    } catch (error) {
      logger.error('Failed to get all roles', { error: error.message });
      throw error;
    }
  }

  /**
   * Get role by name
   */
  async getRole(roleName) {
    try {
      return await this.roleModel.findByName(roleName);
    } catch (error) {
      logger.error('Failed to get role', { roleName, error: error.message });
      throw error;
    }
  }

  /**
   * Get role with inherited permissions
   */
  async getRoleWithPermissions(roleId) {
    try {
      return await this.roleModel.findWithInheritedPermissions(roleId);
    } catch (error) {
      logger.error('Failed to get role with permissions', { 
        roleId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Bulk assign roles to multiple users
   */
  async bulkAssignRoles(assignments, grantedBy = null) {
    try {
      // Add grantedBy to all assignments
      const enhancedAssignments = assignments.map(assignment => ({
        ...assignment,
        granted_by: grantedBy
      }));

      const results = await this.userRoleModel.bulkAssignRoles(enhancedAssignments);
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      logger.info('Bulk role assignment completed', {
        totalAssignments: assignments.length,
        successful: successCount,
        failed: failureCount,
        grantedBy
      });

      return results;
    } catch (error) {
      logger.error('Failed to bulk assign roles', {
        assignmentCount: assignments.length,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get role assignment statistics
   */
  async getRoleStatistics() {
    try {
      return await this.userRoleModel.getRoleStats();
    } catch (error) {
      logger.error('Failed to get role statistics', { error: error.message });
      throw error;
    }
  }

  /**
   * Validate permission format
   */
  validatePermission(permission) {
    if (typeof permission !== 'string') {
      return false;
    }

    // Allow wildcard
    if (permission === '*') {
      return true;
    }

    // Check format: resource:action or resource:*
    const permissionRegex = /^[a-z_]+:[a-z_*]+$/;
    return permissionRegex.test(permission);
  }

  /**
   * Validate permissions array
   */
  validatePermissions(permissions) {
    if (!Array.isArray(permissions)) {
      return { valid: false, error: 'Permissions must be an array' };
    }

    for (const permission of permissions) {
      if (!this.validatePermission(permission)) {
        return { 
          valid: false, 
          error: `Invalid permission format: ${permission}. Use format 'resource:action'` 
        };
      }
    }

    return { valid: true };
  }

  /**
   * Get permission hierarchy for a resource
   */
  getResourcePermissions(resource) {
    const commonActions = ['create', 'read', 'update', 'delete'];
    const resourceSpecificActions = {
      events: ['publish', 'unpublish', 'duplicate'],
      tickets: ['purchase', 'refund', 'transfer'],
      analytics: ['export'],
      users: ['suspend', 'activate'],
      payments: ['process', 'refund']
    };

    const actions = [
      ...commonActions,
      ...(resourceSpecificActions[resource] || [])
    ];

    return actions.map(action => `${resource}:${action}`);
  }

  /**
   * Check if user can perform action on resource
   */
  async canPerformAction(userId, resource, action, context = null) {
    const permission = `${resource}:${action}`;
    return await this.checkPermission(userId, permission, context);
  }

  /**
   * Get users with specific permission
   */
  async getUsersWithPermission(permission, context = null) {
    try {
      // First get all roles that have this permission
      const roles = await this.roleModel.getRolesByPermission(permission);
      
      if (roles.length === 0) {
        return [];
      }

      const users = [];
      for (const role of roles) {
        const roleUsers = await this.userRoleModel.getUsersByRole(role.id, context);
        users.push(...roleUsers);
      }

      // Remove duplicates
      const uniqueUsers = users.filter((user, index, self) => 
        index === self.findIndex(u => u.id === user.id)
      );

      return uniqueUsers;
    } catch (error) {
      logger.error('Failed to get users with permission', {
        permission,
        context,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Cleanup expired assignments (should be run periodically)
   */
  async cleanupExpiredAssignments() {
    try {
      const cleanedCount = await this.userRoleModel.cleanupExpiredRoles();
      
      if (cleanedCount > 0) {
        logger.info(`Cleaned up ${cleanedCount} expired role assignments`);
      }

      return cleanedCount;
    } catch (error) {
      logger.error('Failed to cleanup expired assignments', { error: error.message });
      throw error;
    }
  }
}

module.exports = RBACService;