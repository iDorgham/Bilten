const RBACService = require('../services/RBACService');
const Role = require('../models/Role');
const UserRole = require('../models/UserRole');
const UserAccount = require('../models/UserAccount');

// Mock the models
jest.mock('../models/Role');
jest.mock('../models/UserRole');
jest.mock('../models/UserAccount');
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

describe('RBACService', () => {
  let rbacService;
  let mockRoleModel;
  let mockUserRoleModel;
  let mockUserModel;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create service instance
    rbacService = new RBACService();

    // Get mock instances
    mockRoleModel = rbacService.roleModel;
    mockUserRoleModel = rbacService.userRoleModel;
    mockUserModel = rbacService.userModel;
  });

  describe('initialize', () => {
    it('should initialize RBAC system successfully', async () => {
      const mockDefaultRoles = [
        { id: '1', name: 'user' },
        { id: '2', name: 'admin' }
      ];

      mockRoleModel.createDefaultRoles.mockResolvedValue(mockDefaultRoles);
      mockUserRoleModel.cleanupExpiredRoles.mockResolvedValue(5);

      const result = await rbacService.initialize();

      expect(result).toBe(true);
      expect(mockRoleModel.createDefaultRoles).toHaveBeenCalled();
      expect(mockUserRoleModel.cleanupExpiredRoles).toHaveBeenCalled();
    });

    it('should handle initialization errors', async () => {
      mockRoleModel.createDefaultRoles.mockRejectedValue(new Error('Database error'));

      await expect(rbacService.initialize()).rejects.toThrow('Database error');
    });
  });

  describe('createRole', () => {
    it('should create a new role successfully', async () => {
      const roleData = {
        name: 'moderator',
        description: 'Moderator role',
        permissions: ['posts:moderate', 'users:warn']
      };

      const mockCreatedRole = {
        id: '123',
        ...roleData
      };

      mockRoleModel.create.mockResolvedValue(mockCreatedRole);

      const result = await rbacService.createRole(roleData, 'admin-user-id');

      expect(result).toEqual(mockCreatedRole);
      expect(mockRoleModel.create).toHaveBeenCalledWith(roleData);
    });

    it('should handle role creation errors', async () => {
      const roleData = { name: 'duplicate-role' };
      mockRoleModel.create.mockRejectedValue(new Error('Role already exists'));

      await expect(rbacService.createRole(roleData)).rejects.toThrow('Role already exists');
    });
  });

  describe('assignUserRole', () => {
    it('should assign role to user successfully', async () => {
      const userId = 'user-123';
      const roleName = 'organizer';
      const mockUser = { id: userId, email: 'user@example.com' };
      const mockRole = { id: 'role-123', name: roleName };
      const mockAssignment = {
        id: 'assignment-123',
        user_id: userId,
        role_id: 'role-123'
      };

      mockUserModel.findById.mockResolvedValue(mockUser);
      mockRoleModel.findByName.mockResolvedValue(mockRole);
      mockUserRoleModel.assignRole.mockResolvedValue(mockAssignment);

      const result = await rbacService.assignUserRole(userId, roleName);

      expect(result).toEqual(mockAssignment);
      expect(mockUserModel.findById).toHaveBeenCalledWith(userId, false);
      expect(mockRoleModel.findByName).toHaveBeenCalledWith(roleName, false);
      expect(mockUserRoleModel.assignRole).toHaveBeenCalledWith({
        user_id: userId,
        role_id: 'role-123',
        context: 'global',
        granted_by: null,
        expires_at: null
      });
    });

    it('should handle user not found', async () => {
      mockUserModel.findById.mockResolvedValue(null);

      await expect(rbacService.assignUserRole('invalid-user', 'user'))
        .rejects.toThrow('User not found');
    });

    it('should handle role not found', async () => {
      const mockUser = { id: 'user-123', email: 'user@example.com' };
      mockUserModel.findById.mockResolvedValue(mockUser);
      mockRoleModel.findByName.mockResolvedValue(null);

      await expect(rbacService.assignUserRole('user-123', 'invalid-role'))
        .rejects.toThrow("Role 'invalid-role' not found");
    });
  });

  describe('checkPermission', () => {
    it('should check user permission successfully', async () => {
      const userId = 'user-123';
      const permission = 'events:create';

      mockUserRoleModel.userHasPermission.mockResolvedValue(true);

      const result = await rbacService.checkPermission(userId, permission);

      expect(result).toBe(true);
      expect(mockUserRoleModel.userHasPermission).toHaveBeenCalledWith(userId, permission, null);
    });

    it('should return false when permission check fails', async () => {
      const userId = 'user-123';
      const permission = 'events:create';

      mockUserRoleModel.userHasPermission.mockRejectedValue(new Error('Database error'));

      const result = await rbacService.checkPermission(userId, permission);

      expect(result).toBe(false);
    });
  });

  describe('checkRole', () => {
    it('should check user role successfully', async () => {
      const userId = 'user-123';
      const roleNames = ['organizer', 'admin'];

      mockUserRoleModel.userHasRole.mockResolvedValue(true);

      const result = await rbacService.checkRole(userId, roleNames);

      expect(result).toBe(true);
      expect(mockUserRoleModel.userHasRole).toHaveBeenCalledWith(userId, roleNames, null);
    });

    it('should return false when role check fails', async () => {
      const userId = 'user-123';
      const roleNames = 'admin';

      mockUserRoleModel.userHasRole.mockRejectedValue(new Error('Database error'));

      const result = await rbacService.checkRole(userId, roleNames);

      expect(result).toBe(false);
    });
  });

  describe('getUserPermissions', () => {
    it('should get user permissions successfully', async () => {
      const userId = 'user-123';
      const mockPermissions = {
        user_id: userId,
        permissions: ['events:read', 'events:create'],
        roles: [{ role_name: 'organizer' }]
      };

      mockUserRoleModel.getUserPermissions.mockResolvedValue(mockPermissions);

      const result = await rbacService.getUserPermissions(userId);

      expect(result).toEqual(mockPermissions);
      expect(mockUserRoleModel.getUserPermissions).toHaveBeenCalledWith(userId, null);
    });
  });

  describe('removeUserRole', () => {
    it('should remove user role successfully', async () => {
      const userId = 'user-123';
      const roleName = 'organizer';
      const mockRole = { id: 'role-123', name: roleName };
      const mockRemoved = { id: 'assignment-123' };

      mockRoleModel.findByName.mockResolvedValue(mockRole);
      mockUserRoleModel.removeRole.mockResolvedValue(mockRemoved);

      const result = await rbacService.removeUserRole(userId, roleName);

      expect(result).toEqual(mockRemoved);
      expect(mockRoleModel.findByName).toHaveBeenCalledWith(roleName, false);
      expect(mockUserRoleModel.removeRole).toHaveBeenCalledWith(userId, 'role-123', 'global');
    });

    it('should handle role not found when removing', async () => {
      mockRoleModel.findByName.mockResolvedValue(null);

      await expect(rbacService.removeUserRole('user-123', 'invalid-role'))
        .rejects.toThrow("Role 'invalid-role' not found");
    });
  });

  describe('validatePermission', () => {
    it('should validate correct permission formats', () => {
      expect(rbacService.validatePermission('*')).toBe(true);
      expect(rbacService.validatePermission('events:create')).toBe(true);
      expect(rbacService.validatePermission('users:read')).toBe(true);
      expect(rbacService.validatePermission('analytics:*')).toBe(true);
    });

    it('should reject invalid permission formats', () => {
      expect(rbacService.validatePermission('invalid')).toBe(false);
      expect(rbacService.validatePermission('EVENTS:CREATE')).toBe(false);
      expect(rbacService.validatePermission('events:')).toBe(false);
      expect(rbacService.validatePermission(':create')).toBe(false);
      expect(rbacService.validatePermission(123)).toBe(false);
      expect(rbacService.validatePermission(null)).toBe(false);
    });
  });

  describe('validatePermissions', () => {
    it('should validate correct permissions array', () => {
      const permissions = ['events:create', 'events:read', 'users:*'];
      const result = rbacService.validatePermissions(permissions);

      expect(result.valid).toBe(true);
    });

    it('should reject invalid permissions array', () => {
      const permissions = ['events:create', 'invalid-permission'];
      const result = rbacService.validatePermissions(permissions);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid permission format');
    });

    it('should reject non-array input', () => {
      const result = rbacService.validatePermissions('not-an-array');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Permissions must be an array');
    });
  });

  describe('getResourcePermissions', () => {
    it('should return common permissions for unknown resource', () => {
      const permissions = rbacService.getResourcePermissions('unknown');

      expect(permissions).toEqual([
        'unknown:create',
        'unknown:read',
        'unknown:update',
        'unknown:delete'
      ]);
    });

    it('should return extended permissions for known resources', () => {
      const eventPermissions = rbacService.getResourcePermissions('events');

      expect(eventPermissions).toContain('events:create');
      expect(eventPermissions).toContain('events:read');
      expect(eventPermissions).toContain('events:update');
      expect(eventPermissions).toContain('events:delete');
      expect(eventPermissions).toContain('events:publish');
      expect(eventPermissions).toContain('events:unpublish');
    });
  });

  describe('bulkAssignRoles', () => {
    it('should bulk assign roles successfully', async () => {
      const assignments = [
        { user_id: 'user1', role_name: 'organizer' },
        { user_id: 'user2', role_name: 'user' }
      ];

      const mockResults = [
        { success: true, assignment: { id: '1' } },
        { success: true, assignment: { id: '2' } }
      ];

      mockUserRoleModel.bulkAssignRoles.mockResolvedValue(mockResults);

      const result = await rbacService.bulkAssignRoles(assignments, 'admin-id');

      expect(result).toEqual(mockResults);
      expect(mockUserRoleModel.bulkAssignRoles).toHaveBeenCalledWith(
        assignments.map(a => ({ ...a, granted_by: 'admin-id' }))
      );
    });
  });

  describe('canPerformAction', () => {
    it('should check if user can perform action on resource', async () => {
      const userId = 'user-123';
      const resource = 'events';
      const action = 'create';

      mockUserRoleModel.userHasPermission.mockResolvedValue(true);

      const result = await rbacService.canPerformAction(userId, resource, action);

      expect(result).toBe(true);
      expect(mockUserRoleModel.userHasPermission).toHaveBeenCalledWith(
        userId, 
        'events:create', 
        null
      );
    });
  });

  describe('cleanupExpiredAssignments', () => {
    it('should cleanup expired assignments', async () => {
      mockUserRoleModel.cleanupExpiredRoles.mockResolvedValue(3);

      const result = await rbacService.cleanupExpiredAssignments();

      expect(result).toBe(3);
      expect(mockUserRoleModel.cleanupExpiredRoles).toHaveBeenCalled();
    });
  });
});