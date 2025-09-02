const { RBACMiddleware } = require('../middleware/rbacMiddleware');
const RBACService = require('../services/RBACService');

// Mock the RBACService
jest.mock('../services/RBACService');
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

describe('RBACMiddleware', () => {
  let rbacMiddleware;
  let mockRBACService;
  let req, res, next;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create middleware instance
    rbacMiddleware = new RBACMiddleware();
    mockRBACService = rbacMiddleware.rbacService;

    // Mock request, response, and next
    req = {
      user: {
        userId: 'user-123',
        email: 'user@example.com'
      },
      params: {},
      route: { path: '/test' },
      method: 'GET'
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    next = jest.fn();
  });

  describe('requirePermission', () => {
    it('should allow access when user has required permission', async () => {
      mockRBACService.checkPermission.mockResolvedValue(true);

      const middleware = rbacMiddleware.requirePermission('events:read');
      await middleware(req, res, next);

      expect(mockRBACService.checkPermission).toHaveBeenCalledWith('user-123', 'events:read', null);
      expect(next).toHaveBeenCalled();
      expect(req.rbac).toEqual({
        permission: 'events:read',
        context: null,
        hasPermission: true
      });
    });

    it('should deny access when user lacks required permission', async () => {
      mockRBACService.checkPermission.mockResolvedValue(false);

      const middleware = rbacMiddleware.requirePermission('events:create');
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied',
        message: "You don't have permission to events create"
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should deny access when user is not authenticated', async () => {
      req.user = null;

      const middleware = rbacMiddleware.requirePermission('events:read');
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        message: 'You must be logged in to access this resource'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow self access when allowSelf is true', async () => {
      req.params.id = 'user-123'; // Same as req.user.userId

      const middleware = rbacMiddleware.requirePermission('profile:read', { 
        allowSelf: true, 
        selfParam: 'id' 
      });
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(mockRBACService.checkPermission).not.toHaveBeenCalled();
    });

    it('should check permission when allowSelf is true but accessing different user', async () => {
      req.params.id = 'other-user-123';
      mockRBACService.checkPermission.mockResolvedValue(true);

      const middleware = rbacMiddleware.requirePermission('profile:read', { 
        allowSelf: true, 
        selfParam: 'id' 
      });
      await middleware(req, res, next);

      expect(mockRBACService.checkPermission).toHaveBeenCalledWith('user-123', 'profile:read', null);
      expect(next).toHaveBeenCalled();
    });

    it('should handle permission check errors', async () => {
      mockRBACService.checkPermission.mockRejectedValue(new Error('Database error'));

      const middleware = rbacMiddleware.requirePermission('events:read');
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authorization check failed',
        message: 'Unable to verify permissions'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    it('should allow access when user has required role', async () => {
      mockRBACService.checkRole.mockResolvedValue(true);

      const middleware = rbacMiddleware.requireRole('admin');
      await middleware(req, res, next);

      expect(mockRBACService.checkRole).toHaveBeenCalledWith('user-123', ['admin'], null);
      expect(next).toHaveBeenCalled();
      expect(req.rbac).toEqual({
        requiredRoles: ['admin'],
        context: null,
        hasRole: true
      });
    });

    it('should allow access when user has one of multiple required roles', async () => {
      mockRBACService.checkRole.mockResolvedValue(true);

      const middleware = rbacMiddleware.requireRole(['organizer', 'admin']);
      await middleware(req, res, next);

      expect(mockRBACService.checkRole).toHaveBeenCalledWith('user-123', ['organizer', 'admin'], null);
      expect(next).toHaveBeenCalled();
    });

    it('should deny access when user lacks required role', async () => {
      mockRBACService.checkRole.mockResolvedValue(false);

      const middleware = rbacMiddleware.requireRole('admin');
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied',
        message: 'You must have one of these roles: admin'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireAllPermissions', () => {
    it('should allow access when user has all required permissions', async () => {
      mockRBACService.checkPermission
        .mockResolvedValueOnce(true)  // events:read
        .mockResolvedValueOnce(true); // events:create

      const middleware = rbacMiddleware.requireAllPermissions(['events:read', 'events:create']);
      await middleware(req, res, next);

      expect(mockRBACService.checkPermission).toHaveBeenCalledTimes(2);
      expect(next).toHaveBeenCalled();
    });

    it('should deny access when user lacks some required permissions', async () => {
      mockRBACService.checkPermission
        .mockResolvedValueOnce(true)   // events:read
        .mockResolvedValueOnce(false); // events:create

      const middleware = rbacMiddleware.requireAllPermissions(['events:read', 'events:create']);
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied',
        message: "You don't have all required permissions"
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireAnyPermission', () => {
    it('should allow access when user has at least one required permission', async () => {
      mockRBACService.checkPermission
        .mockResolvedValueOnce(false) // events:read
        .mockResolvedValueOnce(true); // events:create

      const middleware = rbacMiddleware.requireAnyPermission(['events:read', 'events:create']);
      await middleware(req, res, next);

      expect(mockRBACService.checkPermission).toHaveBeenCalledTimes(2);
      expect(next).toHaveBeenCalled();
    });

    it('should deny access when user lacks all required permissions', async () => {
      mockRBACService.checkPermission
        .mockResolvedValueOnce(false) // events:read
        .mockResolvedValueOnce(false); // events:create

      const middleware = rbacMiddleware.requireAnyPermission(['events:read', 'events:create']);
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied',
        message: "You don't have any of the required permissions"
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireAdmin', () => {
    it('should check for admin role', async () => {
      mockRBACService.checkRole.mockResolvedValue(true);

      const middleware = rbacMiddleware.requireAdmin();
      await middleware(req, res, next);

      expect(mockRBACService.checkRole).toHaveBeenCalledWith('user-123', ['admin'], null);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('requireOrganizerOrAdmin', () => {
    it('should check for organizer or admin role', async () => {
      mockRBACService.checkRole.mockResolvedValue(true);

      const middleware = rbacMiddleware.requireOrganizerOrAdmin();
      await middleware(req, res, next);

      expect(mockRBACService.checkRole).toHaveBeenCalledWith('user-123', ['organizer', 'admin'], null);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('attachUserPermissions', () => {
    it('should attach user permissions to request', async () => {
      const mockPermissions = {
        user_id: 'user-123',
        permissions: ['events:read', 'events:create'],
        roles: [{ role_name: 'organizer' }]
      };

      mockRBACService.getUserPermissions.mockResolvedValue(mockPermissions);

      const middleware = rbacMiddleware.attachUserPermissions();
      await middleware(req, res, next);

      expect(mockRBACService.getUserPermissions).toHaveBeenCalledWith('user-123', null);
      expect(req.userPermissions).toEqual(mockPermissions);
      expect(next).toHaveBeenCalled();
    });

    it('should continue without permissions if not authenticated', async () => {
      req.user = null;

      const middleware = rbacMiddleware.attachUserPermissions();
      await middleware(req, res, next);

      expect(mockRBACService.getUserPermissions).not.toHaveBeenCalled();
      expect(req.userPermissions).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    it('should continue on error rather than failing', async () => {
      mockRBACService.getUserPermissions.mockRejectedValue(new Error('Database error'));

      const middleware = rbacMiddleware.attachUserPermissions();
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.userPermissions).toBeUndefined();
    });
  });

  describe('requireOwnership', () => {
    let mockResourceModel;

    beforeEach(() => {
      mockResourceModel = {
        findById: jest.fn()
      };
      req.params.id = 'resource-123';
    });

    it('should allow access for resource owner', async () => {
      const mockResource = {
        id: 'resource-123',
        user_id: 'user-123' // Same as req.user.userId
      };

      mockRBACService.checkRole.mockResolvedValue(false); // Not admin
      mockResourceModel.findById.mockResolvedValue(mockResource);

      const middleware = rbacMiddleware.requireOwnership(mockResourceModel);
      await middleware(req, res, next);

      expect(mockResourceModel.findById).toHaveBeenCalledWith('resource-123', false);
      expect(req.resource).toEqual(mockResource);
      expect(next).toHaveBeenCalled();
    });

    it('should allow access for admin even if not owner', async () => {
      const mockResource = {
        id: 'resource-123',
        user_id: 'other-user-123' // Different from req.user.userId
      };

      mockRBACService.checkRole.mockResolvedValue(true); // Is admin
      mockResourceModel.findById.mockResolvedValue(mockResource);

      const middleware = rbacMiddleware.requireOwnership(mockResourceModel);
      await middleware(req, res, next);

      expect(mockRBACService.checkRole).toHaveBeenCalledWith('user-123', 'admin');
      expect(next).toHaveBeenCalled();
    });

    it('should deny access for non-owner non-admin', async () => {
      const mockResource = {
        id: 'resource-123',
        user_id: 'other-user-123' // Different from req.user.userId
      };

      mockRBACService.checkRole.mockResolvedValue(false); // Not admin
      mockResourceModel.findById.mockResolvedValue(mockResource);

      const middleware = rbacMiddleware.requireOwnership(mockResourceModel);
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied',
        message: 'You can only access your own resources'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 404 when resource not found', async () => {
      mockRBACService.checkRole.mockResolvedValue(false);
      mockResourceModel.findById.mockResolvedValue(null);

      const middleware = rbacMiddleware.requireOwnership(mockResourceModel);
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Not found',
        message: 'Resource not found'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('protect', () => {
    it('should handle single permission string', async () => {
      mockRBACService.checkPermission.mockResolvedValue(true);

      const middleware = rbacMiddleware.protect('events:read');
      await middleware(req, res, next);

      expect(mockRBACService.checkPermission).toHaveBeenCalledWith('user-123', 'events:read', null);
      expect(next).toHaveBeenCalled();
    });

    it('should handle permissions array (require all)', async () => {
      mockRBACService.checkPermission
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true);

      const middleware = rbacMiddleware.protect(['events:read', 'events:create']);
      await middleware(req, res, next);

      expect(mockRBACService.checkPermission).toHaveBeenCalledTimes(2);
      expect(next).toHaveBeenCalled();
    });

    it('should handle permissions object with any=true', async () => {
      mockRBACService.checkPermission
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const middleware = rbacMiddleware.protect({
        permissions: ['events:read', 'events:create'],
        any: true
      });
      await middleware(req, res, next);

      expect(mockRBACService.checkPermission).toHaveBeenCalledTimes(2);
      expect(next).toHaveBeenCalled();
    });

    it('should handle roles object', async () => {
      mockRBACService.checkRole.mockResolvedValue(true);

      const middleware = rbacMiddleware.protect({
        roles: ['admin', 'organizer']
      });
      await middleware(req, res, next);

      expect(mockRBACService.checkRole).toHaveBeenCalledWith('user-123', ['admin', 'organizer'], null);
      expect(next).toHaveBeenCalled();
    });

    it('should throw error for invalid requirements', () => {
      expect(() => {
        rbacMiddleware.protect({ permissions: ['events:read'], roles: ['admin'] });
      }).toThrow('Cannot specify both permissions and roles');

      expect(() => {
        rbacMiddleware.protect({ invalid: true });
      }).toThrow('Invalid protection requirements');

      expect(() => {
        rbacMiddleware.protect(123);
      }).toThrow('Invalid protection requirements');
    });
  });
});