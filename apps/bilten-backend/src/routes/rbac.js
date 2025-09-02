const express = require('express');
const RBACService = require('../services/RBACService');
const { requirePermission, requireAdmin, attachUserPermissions } = require('../middleware/rbacMiddleware');
const { authenticateToken } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

const router = express.Router();
const rbacService = new RBACService();

/**
 * @route GET /api/rbac/roles
 * @desc Get all roles
 * @access Admin only
 */
router.get('/roles', 
  authenticateToken,
  requirePermission('roles:read'),
  async (req, res) => {
    try {
      const roles = await rbacService.getAllRoles();
      
      res.json({
        success: true,
        data: roles,
        message: 'Roles retrieved successfully'
      });
    } catch (error) {
      logger.error('Failed to get roles', { error: error.message });
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve roles'
      });
    }
  }
);

/**
 * @route GET /api/rbac/roles/:id
 * @desc Get role by ID with inherited permissions
 * @access Admin only
 */
router.get('/roles/:id',
  authenticateToken,
  requirePermission('roles:read'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const role = await rbacService.getRoleWithPermissions(id);
      
      if (!role) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Role not found'
        });
      }

      res.json({
        success: true,
        data: role,
        message: 'Role retrieved successfully'
      });
    } catch (error) {
      logger.error('Failed to get role', { roleId: req.params.id, error: error.message });
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve role'
      });
    }
  }
);

/**
 * @route POST /api/rbac/roles
 * @desc Create a new role
 * @access Admin only
 */
router.post('/roles',
  authenticateToken,
  requirePermission('roles:create'),
  async (req, res) => {
    try {
      const { name, description, permissions, parent_role_id } = req.body;

      // Validate required fields
      if (!name) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Role name is required'
        });
      }

      // Validate permissions format
      if (permissions) {
        const validation = rbacService.validatePermissions(permissions);
        if (!validation.valid) {
          return res.status(400).json({
            error: 'Validation error',
            message: validation.error
          });
        }
      }

      const roleData = {
        name,
        description,
        permissions: permissions || [],
        parent_role_id
      };

      const role = await rbacService.createRole(roleData, req.user.userId);

      res.status(201).json({
        success: true,
        data: role,
        message: 'Role created successfully'
      });
    } catch (error) {
      logger.error('Failed to create role', { 
        roleName: req.body.name, 
        error: error.message 
      });

      if (error.message.includes('already exists')) {
        return res.status(409).json({
          error: 'Conflict',
          message: error.message
        });
      }

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create role'
      });
    }
  }
);

/**
 * @route PUT /api/rbac/roles/:id
 * @desc Update a role
 * @access Admin only
 */
router.put('/roles/:id',
  authenticateToken,
  requirePermission('roles:update'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, permissions, parent_role_id } = req.body;

      // Validate permissions format if provided
      if (permissions) {
        const validation = rbacService.validatePermissions(permissions);
        if (!validation.valid) {
          return res.status(400).json({
            error: 'Validation error',
            message: validation.error
          });
        }
      }

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (permissions !== undefined) updateData.permissions = permissions;
      if (parent_role_id !== undefined) updateData.parent_role_id = parent_role_id;

      const role = await rbacService.updateRole(id, updateData, req.user.userId);

      res.json({
        success: true,
        data: role,
        message: 'Role updated successfully'
      });
    } catch (error) {
      logger.error('Failed to update role', { 
        roleId: req.params.id, 
        error: error.message 
      });

      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Not found',
          message: error.message
        });
      }

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update role'
      });
    }
  }
);

/**
 * @route DELETE /api/rbac/roles/:id
 * @desc Delete a role
 * @access Admin only
 */
router.delete('/roles/:id',
  authenticateToken,
  requirePermission('roles:delete'),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      const deletedRole = await rbacService.deleteRole(id, req.user.userId);

      res.json({
        success: true,
        data: deletedRole,
        message: 'Role deleted successfully'
      });
    } catch (error) {
      logger.error('Failed to delete role', { 
        roleId: req.params.id, 
        error: error.message 
      });

      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Not found',
          message: error.message
        });
      }

      if (error.message.includes('Cannot delete')) {
        return res.status(400).json({
          error: 'Bad request',
          message: error.message
        });
      }

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to delete role'
      });
    }
  }
);

/**
 * @route POST /api/rbac/users/:userId/roles
 * @desc Assign role to user
 * @access Admin only
 */
router.post('/users/:userId/roles',
  authenticateToken,
  requirePermission('users:manage_roles'),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { roleName, context, expiresAt } = req.body;

      if (!roleName) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Role name is required'
        });
      }

      const assignment = await rbacService.assignUserRole(userId, roleName, {
        context,
        grantedBy: req.user.userId,
        expiresAt
      });

      res.status(201).json({
        success: true,
        data: assignment,
        message: 'Role assigned successfully'
      });
    } catch (error) {
      logger.error('Failed to assign role to user', { 
        userId: req.params.userId,
        roleName: req.body.roleName,
        error: error.message 
      });

      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Not found',
          message: error.message
        });
      }

      if (error.message.includes('already has')) {
        return res.status(409).json({
          error: 'Conflict',
          message: error.message
        });
      }

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to assign role'
      });
    }
  }
);

/**
 * @route DELETE /api/rbac/users/:userId/roles/:roleName
 * @desc Remove role from user
 * @access Admin only
 */
router.delete('/users/:userId/roles/:roleName',
  authenticateToken,
  requirePermission('users:manage_roles'),
  async (req, res) => {
    try {
      const { userId, roleName } = req.params;
      const { context } = req.query;

      const removed = await rbacService.removeUserRole(
        userId, 
        roleName, 
        context || 'global',
        req.user.userId
      );

      if (!removed) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Role assignment not found'
        });
      }

      res.json({
        success: true,
        data: removed,
        message: 'Role removed successfully'
      });
    } catch (error) {
      logger.error('Failed to remove role from user', { 
        userId: req.params.userId,
        roleName: req.params.roleName,
        error: error.message 
      });

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to remove role'
      });
    }
  }
);

/**
 * @route GET /api/rbac/users/:userId/roles
 * @desc Get user roles
 * @access Admin or self
 */
router.get('/users/:userId/roles',
  authenticateToken,
  requirePermission('users:read_roles', { allowSelf: true, selfParam: 'userId' }),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { context } = req.query;

      const roles = await rbacService.getUserRoles(userId, context);

      res.json({
        success: true,
        data: roles,
        message: 'User roles retrieved successfully'
      });
    } catch (error) {
      logger.error('Failed to get user roles', { 
        userId: req.params.userId,
        error: error.message 
      });

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve user roles'
      });
    }
  }
);

/**
 * @route GET /api/rbac/users/:userId/permissions
 * @desc Get user permissions
 * @access Admin or self
 */
router.get('/users/:userId/permissions',
  authenticateToken,
  requirePermission('users:read_permissions', { allowSelf: true, selfParam: 'userId' }),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { context } = req.query;

      const permissions = await rbacService.getUserPermissions(userId, context);

      res.json({
        success: true,
        data: permissions,
        message: 'User permissions retrieved successfully'
      });
    } catch (error) {
      logger.error('Failed to get user permissions', { 
        userId: req.params.userId,
        error: error.message 
      });

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve user permissions'
      });
    }
  }
);

/**
 * @route POST /api/rbac/users/:userId/permissions/check
 * @desc Check if user has specific permission
 * @access Admin or self
 */
router.post('/users/:userId/permissions/check',
  authenticateToken,
  requirePermission('users:check_permissions', { allowSelf: true, selfParam: 'userId' }),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { permission, context } = req.body;

      if (!permission) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Permission is required'
        });
      }

      const hasPermission = await rbacService.checkPermission(userId, permission, context);

      res.json({
        success: true,
        data: {
          userId,
          permission,
          context,
          hasPermission
        },
        message: 'Permission check completed'
      });
    } catch (error) {
      logger.error('Failed to check user permission', { 
        userId: req.params.userId,
        permission: req.body.permission,
        error: error.message 
      });

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to check permission'
      });
    }
  }
);

/**
 * @route POST /api/rbac/bulk-assign
 * @desc Bulk assign roles to multiple users
 * @access Admin only
 */
router.post('/bulk-assign',
  authenticateToken,
  requirePermission('users:bulk_manage_roles'),
  async (req, res) => {
    try {
      const { assignments } = req.body;

      if (!Array.isArray(assignments) || assignments.length === 0) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Assignments array is required and must not be empty'
        });
      }

      // Validate each assignment
      for (const assignment of assignments) {
        if (!assignment.user_id || !assignment.role_name) {
          return res.status(400).json({
            error: 'Validation error',
            message: 'Each assignment must have user_id and role_name'
          });
        }
      }

      const results = await rbacService.bulkAssignRoles(assignments, req.user.userId);

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      res.json({
        success: true,
        data: {
          results,
          summary: {
            total: assignments.length,
            successful: successCount,
            failed: failureCount
          }
        },
        message: `Bulk assignment completed: ${successCount} successful, ${failureCount} failed`
      });
    } catch (error) {
      logger.error('Failed to bulk assign roles', { 
        assignmentCount: req.body.assignments?.length,
        error: error.message 
      });

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to bulk assign roles'
      });
    }
  }
);

/**
 * @route GET /api/rbac/statistics
 * @desc Get role assignment statistics
 * @access Admin only
 */
router.get('/statistics',
  authenticateToken,
  requirePermission('roles:read_statistics'),
  async (req, res) => {
    try {
      const statistics = await rbacService.getRoleStatistics();

      res.json({
        success: true,
        data: statistics,
        message: 'Role statistics retrieved successfully'
      });
    } catch (error) {
      logger.error('Failed to get role statistics', { error: error.message });

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve role statistics'
      });
    }
  }
);

/**
 * @route GET /api/rbac/permissions/available
 * @desc Get available permissions for a resource
 * @access Admin only
 */
router.get('/permissions/available',
  authenticateToken,
  requirePermission('roles:read'),
  async (req, res) => {
    try {
      const { resource } = req.query;

      if (!resource) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Resource parameter is required'
        });
      }

      const permissions = rbacService.getResourcePermissions(resource);

      res.json({
        success: true,
        data: {
          resource,
          permissions
        },
        message: 'Available permissions retrieved successfully'
      });
    } catch (error) {
      logger.error('Failed to get available permissions', { 
        resource: req.query.resource,
        error: error.message 
      });

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve available permissions'
      });
    }
  }
);

/**
 * @route GET /api/rbac/my/permissions
 * @desc Get current user's permissions
 * @access Authenticated users
 */
router.get('/my/permissions',
  authenticateToken,
  attachUserPermissions(),
  async (req, res) => {
    try {
      const { context } = req.query;
      const userId = req.user.userId;

      const permissions = await rbacService.getUserPermissions(userId, context);

      res.json({
        success: true,
        data: permissions,
        message: 'Your permissions retrieved successfully'
      });
    } catch (error) {
      logger.error('Failed to get current user permissions', { 
        userId: req.user?.userId,
        error: error.message 
      });

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve your permissions'
      });
    }
  }
);

/**
 * @route GET /api/rbac/my/roles
 * @desc Get current user's roles
 * @access Authenticated users
 */
router.get('/my/roles',
  authenticateToken,
  async (req, res) => {
    try {
      const { context } = req.query;
      const userId = req.user.userId;

      const roles = await rbacService.getUserRoles(userId, context);

      res.json({
        success: true,
        data: roles,
        message: 'Your roles retrieved successfully'
      });
    } catch (error) {
      logger.error('Failed to get current user roles', { 
        userId: req.user?.userId,
        error: error.message 
      });

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve your roles'
      });
    }
  }
);

module.exports = router;