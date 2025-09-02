const RBACService = require('../services/RBACService');
const logger = require('../utils/logger');

/**
 * RBAC Middleware
 * 
 * Provides middleware functions for role-based access control
 */
class RBACMiddleware {
  constructor() {
    this.rbacService = new RBACService();
  }

  /**
   * Middleware to check if user has required permission
   */
  requirePermission(permission, options = {}) {
    return async (req, res, next) => {
      try {
        const { context = null, allowSelf = false, selfParam = 'id' } = options;
        
        // Check if user is authenticated
        if (!req.user || !req.user.userId) {
          return res.status(401).json({
            error: 'Authentication required',
            message: 'You must be logged in to access this resource'
          });
        }

        const userId = req.user.userId;

        // Check if user is accessing their own resource (if allowSelf is true)
        if (allowSelf && req.params[selfParam]) {
          const resourceUserId = req.params[selfParam];
          if (userId.toString() === resourceUserId.toString()) {
            return next(); // Allow access to own resource
          }
        }

        // Check permission
        const hasPermission = await this.rbacService.checkPermission(userId, permission, context);
        
        if (!hasPermission) {
          logger.warn('Access denied - insufficient permissions', {
            userId,
            userEmail: req.user.email,
            requiredPermission: permission,
            context,
            route: req.route?.path,
            method: req.method
          });

          return res.status(403).json({
            error: 'Access denied',
            message: `You don't have permission to ${permission.replace(':', ' ')}`
          });
        }

        // Add permission info to request for potential use in route handlers
        req.rbac = {
          permission,
          context,
          hasPermission: true
        };

        next();
      } catch (error) {
        logger.error('RBAC permission check failed', {
          userId: req.user?.userId,
          permission,
          error: error.message
        });

        return res.status(500).json({
          error: 'Authorization check failed',
          message: 'Unable to verify permissions'
        });
      }
    };
  }

  /**
   * Middleware to check if user has required role
   */
  requireRole(roleNames, options = {}) {
    return async (req, res, next) => {
      try {
        const { context = null, allowSelf = false, selfParam = 'id' } = options;
        
        // Check if user is authenticated
        if (!req.user || !req.user.userId) {
          return res.status(401).json({
            error: 'Authentication required',
            message: 'You must be logged in to access this resource'
          });
        }

        const userId = req.user.userId;

        // Check if user is accessing their own resource (if allowSelf is true)
        if (allowSelf && req.params[selfParam]) {
          const resourceUserId = req.params[selfParam];
          if (userId.toString() === resourceUserId.toString()) {
            return next(); // Allow access to own resource
          }
        }

        // Normalize roleNames to array
        const requiredRoles = Array.isArray(roleNames) ? roleNames : [roleNames];

        // Check role
        const hasRole = await this.rbacService.checkRole(userId, requiredRoles, context);
        
        if (!hasRole) {
          logger.warn('Access denied - insufficient role', {
            userId,
            userEmail: req.user.email,
            requiredRoles,
            context,
            route: req.route?.path,
            method: req.method
          });

          return res.status(403).json({
            error: 'Access denied',
            message: `You must have one of these roles: ${requiredRoles.join(', ')}`
          });
        }

        // Add role info to request for potential use in route handlers
        req.rbac = {
          requiredRoles,
          context,
          hasRole: true
        };

        next();
      } catch (error) {
        logger.error('RBAC role check failed', {
          userId: req.user?.userId,
          roleNames,
          error: error.message
        });

        return res.status(500).json({
          error: 'Authorization check failed',
          message: 'Unable to verify role'
        });
      }
    };
  }

  /**
   * Middleware to check multiple permissions (user must have ALL)
   */
  requireAllPermissions(permissions, options = {}) {
    return async (req, res, next) => {
      try {
        const { context = null } = options;
        
        if (!req.user || !req.user.userId) {
          return res.status(401).json({
            error: 'Authentication required',
            message: 'You must be logged in to access this resource'
          });
        }

        const userId = req.user.userId;

        // Check all permissions
        const permissionChecks = await Promise.all(
          permissions.map(permission => 
            this.rbacService.checkPermission(userId, permission, context)
          )
        );

        const hasAllPermissions = permissionChecks.every(hasPermission => hasPermission);
        
        if (!hasAllPermissions) {
          logger.warn('Access denied - missing required permissions', {
            userId,
            userEmail: req.user.email,
            requiredPermissions: permissions,
            context,
            route: req.route?.path,
            method: req.method
          });

          return res.status(403).json({
            error: 'Access denied',
            message: 'You don\'t have all required permissions'
          });
        }

        req.rbac = {
          permissions,
          context,
          hasAllPermissions: true
        };

        next();
      } catch (error) {
        logger.error('RBAC multiple permissions check failed', {
          userId: req.user?.userId,
          permissions,
          error: error.message
        });

        return res.status(500).json({
          error: 'Authorization check failed',
          message: 'Unable to verify permissions'
        });
      }
    };
  }

  /**
   * Middleware to check multiple permissions (user must have ANY)
   */
  requireAnyPermission(permissions, options = {}) {
    return async (req, res, next) => {
      try {
        const { context = null } = options;
        
        if (!req.user || !req.user.userId) {
          return res.status(401).json({
            error: 'Authentication required',
            message: 'You must be logged in to access this resource'
          });
        }

        const userId = req.user.userId;

        // Check all permissions
        const permissionChecks = await Promise.all(
          permissions.map(permission => 
            this.rbacService.checkPermission(userId, permission, context)
          )
        );

        const hasAnyPermission = permissionChecks.some(hasPermission => hasPermission);
        
        if (!hasAnyPermission) {
          logger.warn('Access denied - no required permissions', {
            userId,
            userEmail: req.user.email,
            requiredPermissions: permissions,
            context,
            route: req.route?.path,
            method: req.method
          });

          return res.status(403).json({
            error: 'Access denied',
            message: 'You don\'t have any of the required permissions'
          });
        }

        req.rbac = {
          permissions,
          context,
          hasAnyPermission: true
        };

        next();
      } catch (error) {
        logger.error('RBAC any permission check failed', {
          userId: req.user?.userId,
          permissions,
          error: error.message
        });

        return res.status(500).json({
          error: 'Authorization check failed',
          message: 'Unable to verify permissions'
        });
      }
    };
  }

  /**
   * Middleware to check if user is admin
   */
  requireAdmin() {
    return this.requireRole('admin');
  }

  /**
   * Middleware to check if user is organizer or admin
   */
  requireOrganizerOrAdmin() {
    return this.requireRole(['organizer', 'admin']);
  }

  /**
   * Middleware to add user permissions to request object
   */
  attachUserPermissions(options = {}) {
    return async (req, res, next) => {
      try {
        const { context = null } = options;
        
        if (!req.user || !req.user.userId) {
          return next(); // Continue without permissions if not authenticated
        }

        const userId = req.user.userId;
        const userPermissions = await this.rbacService.getUserPermissions(userId, context);
        
        req.userPermissions = userPermissions;
        next();
      } catch (error) {
        logger.error('Failed to attach user permissions', {
          userId: req.user?.userId,
          error: error.message
        });
        
        // Continue without permissions rather than failing the request
        next();
      }
    };
  }

  /**
   * Middleware to check resource ownership
   */
  requireOwnership(resourceModel, resourceParam = 'id', ownerField = 'user_id') {
    return async (req, res, next) => {
      try {
        if (!req.user || !req.user.userId) {
          return res.status(401).json({
            error: 'Authentication required',
            message: 'You must be logged in to access this resource'
          });
        }

        const userId = req.user.userId;
        const resourceId = req.params[resourceParam];

        if (!resourceId) {
          return res.status(400).json({
            error: 'Bad request',
            message: 'Resource ID is required'
          });
        }

        // Check if user is admin (admins can access any resource)
        const isAdmin = await this.rbacService.checkRole(userId, 'admin');
        if (isAdmin) {
          return next();
        }

        // Check resource ownership
        const resource = await resourceModel.findById(resourceId, false);
        if (!resource) {
          return res.status(404).json({
            error: 'Not found',
            message: 'Resource not found'
          });
        }

        if (resource[ownerField] !== userId) {
          logger.warn('Access denied - not resource owner', {
            userId,
            userEmail: req.user.email,
            resourceId,
            resourceType: resourceModel.constructor.name,
            route: req.route?.path,
            method: req.method
          });

          return res.status(403).json({
            error: 'Access denied',
            message: 'You can only access your own resources'
          });
        }

        req.resource = resource;
        next();
      } catch (error) {
        logger.error('Resource ownership check failed', {
          userId: req.user?.userId,
          resourceParam,
          error: error.message
        });

        return res.status(500).json({
          error: 'Authorization check failed',
          message: 'Unable to verify resource ownership'
        });
      }
    };
  }

  /**
   * Helper method to create permission-based route protection
   */
  protect(requirements) {
    if (typeof requirements === 'string') {
      // Single permission
      return this.requirePermission(requirements);
    }

    if (Array.isArray(requirements)) {
      // Multiple permissions (require all by default)
      return this.requireAllPermissions(requirements);
    }

    if (typeof requirements === 'object') {
      const { 
        permissions, 
        roles, 
        any = false, 
        context = null, 
        allowSelf = false,
        selfParam = 'id'
      } = requirements;

      const options = { context, allowSelf, selfParam };

      if (permissions && roles) {
        throw new Error('Cannot specify both permissions and roles in protection requirements');
      }

      if (permissions) {
        if (any) {
          return this.requireAnyPermission(permissions, options);
        } else {
          return this.requireAllPermissions(permissions, options);
        }
      }

      if (roles) {
        return this.requireRole(roles, options);
      }
    }

    throw new Error('Invalid protection requirements');
  }
}

// Create singleton instance
const rbacMiddleware = new RBACMiddleware();

// Export both the class and common middleware functions
module.exports = {
  RBACMiddleware,
  rbacMiddleware,
  
  // Common middleware functions
  requirePermission: (permission, options) => rbacMiddleware.requirePermission(permission, options),
  requireRole: (roles, options) => rbacMiddleware.requireRole(roles, options),
  requireAdmin: () => rbacMiddleware.requireAdmin(),
  requireOrganizerOrAdmin: () => rbacMiddleware.requireOrganizerOrAdmin(),
  requireAllPermissions: (permissions, options) => rbacMiddleware.requireAllPermissions(permissions, options),
  requireAnyPermission: (permissions, options) => rbacMiddleware.requireAnyPermission(permissions, options),
  attachUserPermissions: (options) => rbacMiddleware.attachUserPermissions(options),
  requireOwnership: (model, param, field) => rbacMiddleware.requireOwnership(model, param, field),
  protect: (requirements) => rbacMiddleware.protect(requirements)
};