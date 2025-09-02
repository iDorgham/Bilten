import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './AuthenticationMiddleware';
import { Logger } from '../utils/Logger';

export interface Permission {
  resource: string;
  action: string;
  conditions?: PermissionCondition[];
}

export interface PermissionCondition {
  type: 'organization' | 'user_id' | 'role' | 'custom';
  field?: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  inherits?: string[]; // Role inheritance
  isSystemRole: boolean;
  organizationId?: string;
  metadata?: Record<string, any>;
}

export interface AuthorizationPolicy {
  id: string;
  name: string;
  description: string;
  rules: PolicyRule[];
  effect: 'allow' | 'deny';
  priority: number;
  conditions?: PolicyCondition[];
  isActive: boolean;
}

export interface PolicyRule {
  resource: string;
  actions: string[];
  effect: 'allow' | 'deny';
  conditions?: PolicyCondition[];
}

export interface PolicyCondition {
  type: 'user' | 'role' | 'organization' | 'time' | 'ip' | 'custom';
  field?: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'contains' | 'matches' | 'between';
  value: any;
}

export interface AuthorizationContext {
  user: NonNullable<AuthenticatedRequest['user']>;
  resource: string;
  action: string;
  organizationId?: string | undefined;
  requestContext?: {
    ip: string;
    userAgent: string;
    timestamp: Date;
    path: string;
    method: string;
  };
  additionalContext?: Record<string, any>;
}

export interface AuthorizationResult {
  allowed: boolean;
  reason?: string;
  appliedPolicies?: string[];
  requiredPermissions?: Permission[];
  missingPermissions?: Permission[];
}

export class AuthorizationMiddleware {
  private static roleCache = new Map<string, Role>();
  private static policyCache = new Map<string, AuthorizationPolicy>();
  private static permissionCache = new Map<string, Permission[]>();

  // Default system roles
  private static readonly SYSTEM_ROLES: Role[] = [
    {
      id: 'super_admin',
      name: 'Super Administrator',
      description: 'Full system access',
      permissions: [
        { resource: '*', action: '*' }
      ],
      isSystemRole: true
    },
    {
      id: 'admin',
      name: 'Administrator',
      description: 'Organization administrator',
      permissions: [
        { resource: 'users', action: '*', conditions: [{ type: 'organization', operator: 'equals', value: '${user.organizationId}' }] },
        { resource: 'events', action: '*', conditions: [{ type: 'organization', operator: 'equals', value: '${user.organizationId}' }] },
        { resource: 'analytics', action: 'read', conditions: [{ type: 'organization', operator: 'equals', value: '${user.organizationId}' }] },
        { resource: 'settings', action: '*', conditions: [{ type: 'organization', operator: 'equals', value: '${user.organizationId}' }] }
      ],
      isSystemRole: true
    },
    {
      id: 'moderator',
      name: 'Moderator',
      description: 'Content moderation and user management',
      permissions: [
        { resource: 'users', action: 'read', conditions: [{ type: 'organization', operator: 'equals', value: '${user.organizationId}' }] },
        { resource: 'users', action: 'update', conditions: [{ type: 'organization', operator: 'equals', value: '${user.organizationId}' }] },
        { resource: 'events', action: 'read', conditions: [{ type: 'organization', operator: 'equals', value: '${user.organizationId}' }] },
        { resource: 'events', action: 'update', conditions: [{ type: 'organization', operator: 'equals', value: '${user.organizationId}' }] },
        { resource: 'events', action: 'delete', conditions: [{ type: 'organization', operator: 'equals', value: '${user.organizationId}' }] }
      ],
      isSystemRole: true
    },
    {
      id: 'user',
      name: 'User',
      description: 'Standard user access',
      permissions: [
        { resource: 'events', action: 'read', conditions: [{ type: 'organization', operator: 'equals', value: '${user.organizationId}' }] },
        { resource: 'events', action: 'create', conditions: [{ type: 'organization', operator: 'equals', value: '${user.organizationId}' }] },
        { resource: 'profile', action: '*', conditions: [{ type: 'user_id', operator: 'equals', value: '${user.id}' }] }
      ],
      isSystemRole: true
    },
    {
      id: 'api_client',
      name: 'API Client',
      description: 'Third-party API access',
      permissions: [
        { resource: 'events', action: 'read' },
        { resource: 'users', action: 'read' }
      ],
      isSystemRole: true
    },
    {
      id: 'oauth_client',
      name: 'OAuth Client',
      description: 'OAuth application access',
      permissions: [
        { resource: 'events', action: 'read' },
        { resource: 'profile', action: 'read' }
      ],
      isSystemRole: true
    }
  ];

  static requirePermission(resource: string, action: string, conditions?: PermissionCondition[]) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication is required',
            timestamp: new Date().toISOString(),
            traceId: req.headers['x-trace-id'] || 'unknown'
          }
        });
      }

      const context: AuthorizationContext = {
        user: req.user,
        resource,
        action,
        organizationId: req.user.organizationId,
        requestContext: {
          ip: req.ip || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown',
          timestamp: new Date(),
          path: req.path,
          method: req.method
        }
      };

      try {
        const result = await AuthorizationMiddleware.checkPermission(context, conditions);
        
        if (!result.allowed) {
          const logger = Logger.getInstance();
          logger.warn('Authorization denied', {
            userId: req.user.id,
            resource,
            action,
            reason: result.reason,
            path: req.path,
            method: req.method
          });

          return res.status(403).json({
            error: {
              code: 'AUTHORIZATION_DENIED',
              message: result.reason || 'Access denied',
              timestamp: new Date().toISOString(),
              traceId: req.headers['x-trace-id'] || 'unknown',
              requiredPermissions: result.requiredPermissions
            }
          });
        }

        // Add authorization context to request for downstream use
        (req as any).authorizationContext = {
          appliedPolicies: result.appliedPolicies,
          grantedPermissions: result.requiredPermissions
        };

        next();
      } catch (error) {
        const logger = Logger.getInstance();
        logger.error('Authorization error', {
          error: error instanceof Error ? error.message : 'Unknown error',
          userId: req.user.id,
          resource,
          action,
          path: req.path
        });

        return res.status(500).json({
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Internal authorization error',
            timestamp: new Date().toISOString(),
            traceId: req.headers['x-trace-id'] || 'unknown'
          }
        });
      }
    };
  }

  static requireAnyPermission(permissions: { resource: string; action: string; conditions?: PermissionCondition[] }[]) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication is required',
            timestamp: new Date().toISOString(),
            traceId: req.headers['x-trace-id'] || 'unknown'
          }
        });
      }

      const context: AuthorizationContext = {
        user: req.user,
        resource: 'multiple',
        action: 'any',
        organizationId: req.user.organizationId,
        requestContext: {
          ip: req.ip || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown',
          timestamp: new Date(),
          path: req.path,
          method: req.method
        }
      };

      try {
        let allowed = false;
        let lastResult: AuthorizationResult | null = null;

        for (const permission of permissions) {
          const result = await AuthorizationMiddleware.checkPermission(
            { ...context, resource: permission.resource, action: permission.action },
            permission.conditions
          );
          
          if (result.allowed) {
            allowed = true;
            lastResult = result;
            break;
          }
          lastResult = result;
        }

        if (!allowed) {
          const logger = Logger.getInstance();
          logger.warn('Authorization denied - no matching permissions', {
            userId: req.user.id,
            permissions: permissions.map(p => `${p.resource}:${p.action}`),
            reason: lastResult?.reason,
            path: req.path,
            method: req.method
          });

          return res.status(403).json({
            error: {
              code: 'AUTHORIZATION_DENIED',
              message: 'Access denied - insufficient permissions',
              timestamp: new Date().toISOString(),
              traceId: req.headers['x-trace-id'] || 'unknown',
              requiredPermissions: permissions
            }
          });
        }

        next();
      } catch (error) {
        const logger = Logger.getInstance();
        logger.error('Authorization error', {
          error: error instanceof Error ? error.message : 'Unknown error',
          userId: req.user.id,
          permissions: permissions.map(p => `${p.resource}:${p.action}`),
          path: req.path
        });

        return res.status(500).json({
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Internal authorization error',
            timestamp: new Date().toISOString(),
            traceId: req.headers['x-trace-id'] || 'unknown'
          }
        });
      }
    };
  }

  private static async checkPermission(
    context: AuthorizationContext,
    additionalConditions?: PermissionCondition[]
  ): Promise<AuthorizationResult> {
    const { user, resource, action } = context;

    // Super admin has access to everything
    if (user.role === 'super_admin') {
      return {
        allowed: true,
        reason: 'Super administrator access',
        appliedPolicies: ['system:super_admin']
      };
    }

    // Get user role and permissions
    const role = await AuthorizationMiddleware.getRole(user.role, user.organizationId);
    if (!role) {
      return {
        allowed: false,
        reason: `Role '${user.role}' not found`,
        requiredPermissions: [{ resource, action, conditions: additionalConditions || [] }]
      };
    }

    // Check role permissions
    const rolePermissions = await AuthorizationMiddleware.getRolePermissions(role);
    const matchingPermissions = AuthorizationMiddleware.findMatchingPermissions(
      rolePermissions,
      resource,
      action
    );

    if (matchingPermissions.length === 0) {
      return {
        allowed: false,
        reason: `No permissions found for ${resource}:${action}`,
        requiredPermissions: [{ resource, action, conditions: additionalConditions || [] }],
        missingPermissions: [{ resource, action }]
      };
    }

    // Check permission conditions
    for (const permission of matchingPermissions) {
      const conditionsToCheck = [
        ...(permission.conditions || []),
        ...(additionalConditions || [])
      ];

      if (await AuthorizationMiddleware.evaluateConditions(conditionsToCheck, context)) {
        return {
          allowed: true,
          reason: 'Permission granted',
          appliedPolicies: [`role:${role.id}`],
          requiredPermissions: [permission]
        };
      }
    }

    return {
      allowed: false,
      reason: 'Permission conditions not met',
      requiredPermissions: matchingPermissions,
      missingPermissions: matchingPermissions
    };
  }

  private static async getRole(roleId: string, organizationId?: string): Promise<Role | null> {
    const cacheKey = `${roleId}:${organizationId || 'system'}`;
    
    // Check cache first
    let role = AuthorizationMiddleware.roleCache.get(cacheKey);
    if (role) {
      return role;
    }

    // Check system roles
    role = AuthorizationMiddleware.SYSTEM_ROLES.find(r => r.id === roleId);
    if (role) {
      AuthorizationMiddleware.roleCache.set(cacheKey, role);
      return role;
    }

    // In a real implementation, this would fetch from database
    // For now, return null for custom roles
    return null;
  }

  private static async getRolePermissions(role: Role): Promise<Permission[]> {
    const cacheKey = `permissions:${role.id}`;
    
    // Check cache first
    let permissions = AuthorizationMiddleware.permissionCache.get(cacheKey);
    if (permissions) {
      return permissions;
    }

    permissions = [...role.permissions];

    // Handle role inheritance
    if (role.inherits) {
      for (const inheritedRoleId of role.inherits) {
        const inheritedRole = await AuthorizationMiddleware.getRole(inheritedRoleId, role.organizationId);
        if (inheritedRole) {
          const inheritedPermissions = await AuthorizationMiddleware.getRolePermissions(inheritedRole);
          permissions.push(...inheritedPermissions);
        }
      }
    }

    // Cache permissions for 5 minutes
    AuthorizationMiddleware.permissionCache.set(cacheKey, permissions);
    setTimeout(() => {
      AuthorizationMiddleware.permissionCache.delete(cacheKey);
    }, 5 * 60 * 1000);

    return permissions;
  }

  private static findMatchingPermissions(
    permissions: Permission[],
    resource: string,
    action: string
  ): Permission[] {
    return permissions.filter(permission => {
      // Check wildcard permissions
      if (permission.resource === '*' && permission.action === '*') {
        return true;
      }
      
      // Check resource wildcard
      if (permission.resource === '*' && permission.action === action) {
        return true;
      }
      
      // Check action wildcard
      if (permission.resource === resource && permission.action === '*') {
        return true;
      }
      
      // Check exact match
      if (permission.resource === resource && permission.action === action) {
        return true;
      }
      
      return false;
    });
  }

  private static async evaluateConditions(
    conditions: PermissionCondition[],
    context: AuthorizationContext
  ): Promise<boolean> {
    if (!conditions || conditions.length === 0) {
      return true;
    }

    for (const condition of conditions) {
      if (!await AuthorizationMiddleware.evaluateCondition(condition, context)) {
        return false;
      }
    }

    return true;
  }

  private static async evaluateCondition(
    condition: PermissionCondition,
    context: AuthorizationContext
  ): Promise<boolean> {
    const { user } = context;
    let actualValue: any;
    let expectedValue = condition.value;

    // Resolve template variables in expected value
    if (typeof expectedValue === 'string' && expectedValue.includes('${')) {
      expectedValue = AuthorizationMiddleware.resolveTemplate(expectedValue, context);
    }

    // Get actual value based on condition type
    switch (condition.type) {
      case 'organization':
        actualValue = user.organizationId;
        break;
      case 'user_id':
        actualValue = user.id;
        break;
      case 'role':
        actualValue = user.role;
        break;
      case 'custom':
        if (condition.field) {
          actualValue = (context.additionalContext || {})[condition.field];
        }
        break;
      default:
        return false;
    }

    // Evaluate condition based on operator
    switch (condition.operator) {
      case 'equals':
        return actualValue === expectedValue;
      case 'not_equals':
        return actualValue !== expectedValue;
      case 'in':
        return Array.isArray(expectedValue) && expectedValue.includes(actualValue);
      case 'not_in':
        return Array.isArray(expectedValue) && !expectedValue.includes(actualValue);
      case 'contains':
        return typeof actualValue === 'string' && actualValue.includes(expectedValue);
      case 'greater_than':
        return actualValue > expectedValue;
      case 'less_than':
        return actualValue < expectedValue;
      default:
        return false;
    }
  }

  private static resolveTemplate(template: string, context: AuthorizationContext): any {
    return template.replace(/\$\{([^}]+)\}/g, (match, path) => {
      const parts = path.split('.');
      let value: any = context;
      
      for (const part of parts) {
        value = value?.[part];
      }
      
      return value !== undefined ? value : match;
    });
  }

  static clearCaches() {
    AuthorizationMiddleware.roleCache.clear();
    AuthorizationMiddleware.policyCache.clear();
    AuthorizationMiddleware.permissionCache.clear();
    const logger = Logger.getInstance();
    logger.info('Authorization caches cleared');
  }

  // Utility methods for checking permissions programmatically
  static async hasPermission(
    user: NonNullable<AuthenticatedRequest['user']>,
    resource: string,
    action: string,
    additionalContext?: Record<string, any>
  ): Promise<boolean> {
    const context: AuthorizationContext = {
      user,
      resource,
      action,
      organizationId: user.organizationId,
      additionalContext
    };

    const result = await AuthorizationMiddleware.checkPermission(context);
    return result.allowed;
  }

  static async getUserPermissions(
    user: NonNullable<AuthenticatedRequest['user']>
  ): Promise<Permission[]> {
    const role = await AuthorizationMiddleware.getRole(user.role, user.organizationId);
    if (!role) {
      return [];
    }

    return AuthorizationMiddleware.getRolePermissions(role);
  }
}