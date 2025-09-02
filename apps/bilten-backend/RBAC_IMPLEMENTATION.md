# Role-Based Access Control (RBAC) System

This document describes the comprehensive RBAC system implemented for the Bilten platform.

## Overview

The RBAC system provides fine-grained access control through roles and permissions, supporting:

- **Hierarchical roles** with permission inheritance
- **Context-specific permissions** for multi-tenant scenarios
- **Temporary role assignments** with expiration dates
- **Resource ownership** validation
- **Flexible middleware** for route protection
- **Comprehensive auditing** and logging

## Architecture

### Core Components

1. **Role Model** (`src/models/Role.js`)
   - Manages roles and their permissions
   - Supports role hierarchy with parent-child relationships
   - Handles permission inheritance

2. **UserRole Model** (`src/models/UserRole.js`)
   - Manages user-role assignments
   - Supports context-specific assignments
   - Handles temporary assignments with expiration

3. **RBAC Service** (`src/services/RBACService.js`)
   - High-level business logic for RBAC operations
   - Provides validation and helper methods
   - Handles bulk operations

4. **RBAC Middleware** (`src/middleware/rbacMiddleware.js`)
   - Express middleware for route protection
   - Multiple protection strategies
   - Flexible configuration options

5. **RBAC Routes** (`src/routes/rbac.js`)
   - REST API for managing roles and permissions
   - Admin interface for role management
   - User permission queries

## Database Schema

### Tables

#### `authentication.roles`
```sql
- id (UUID, Primary Key)
- name (VARCHAR, Unique)
- description (TEXT)
- permissions (JSONB) - Array of permission strings
- is_system_role (BOOLEAN) - Cannot be deleted if true
- parent_role_id (UUID) - For role hierarchy
- created_at, updated_at (TIMESTAMP)
```

#### `authentication.user_roles`
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key to users.users)
- role_id (UUID, Foreign Key to authentication.roles)
- context (VARCHAR) - Default 'global'
- granted_by (UUID, Foreign Key to users.users)
- granted_at (TIMESTAMP)
- expires_at (TIMESTAMP, Nullable) - For temporary assignments
```

### Views

#### `authentication.active_user_roles`
Shows all active (non-expired) user role assignments with role details.

#### `authentication.role_statistics`
Provides statistics about role usage and assignments.

### Functions

#### `user_has_permission(user_uuid, permission_name, context_name)`
Database function to check if a user has a specific permission.

#### `get_user_permissions(user_uuid, context_name)`
Database function to get all permissions for a user.

## Permission System

### Permission Format

Permissions follow the format: `resource:action`

Examples:
- `events:create` - Create events
- `events:read` - Read events
- `events:*` - All event permissions
- `*` - All permissions (admin)

### Default Roles

#### User
- `profile:read`
- `profile:update`
- `events:read`
- `tickets:purchase`

#### Organizer
- All user permissions plus:
- `events:create`
- `events:update`
- `events:delete`
- `tickets:read`
- `tickets:create`
- `tickets:update`
- `analytics:read`

#### Admin
- `*` (all permissions)

## Usage Examples

### Basic Route Protection

```javascript
const { requirePermission, requireRole } = require('../middleware/rbacMiddleware');
const { authenticateToken } = require('../middleware/authMiddleware');

// Require specific permission
router.get('/events', 
  authenticateToken,
  requirePermission('events:read'),
  async (req, res) => {
    // Route handler
  }
);

// Require specific role
router.post('/events',
  authenticateToken,
  requireRole('organizer'),
  async (req, res) => {
    // Route handler
  }
);
```

### Advanced Protection

```javascript
const { protect } = require('../middleware/rbacMiddleware');

// Multiple permissions (all required)
router.get('/admin/dashboard',
  authenticateToken,
  protect(['analytics:read', 'users:read']),
  async (req, res) => {
    // Route handler
  }
);

// Any of multiple permissions
router.get('/moderation',
  authenticateToken,
  protect({
    permissions: ['events:moderate', 'users:moderate'],
    any: true
  }),
  async (req, res) => {
    // Route handler
  }
);

// Allow self access
router.get('/users/:userId/profile',
  authenticateToken,
  protect({
    permissions: ['users:read'],
    allowSelf: true,
    selfParam: 'userId'
  }),
  async (req, res) => {
    // Route handler
  }
);
```

### Resource Ownership

```javascript
const { requireOwnership } = require('../middleware/rbacMiddleware');
const Event = require('../models/Event');

router.put('/events/:id',
  authenticateToken,
  requireOwnership(Event, 'id', 'organizer_id'),
  async (req, res) => {
    // Only event owner or admin can update
    // req.resource contains the event object
  }
);
```

### Context-Specific Permissions

```javascript
// Check permission in specific context
router.get('/organizations/:orgId/events',
  authenticateToken,
  requirePermission('events:read', { context: 'organization' }),
  async (req, res) => {
    // Route handler
  }
);
```

## API Endpoints

### Role Management

- `GET /api/v1/rbac/roles` - List all roles
- `GET /api/v1/rbac/roles/:id` - Get role details
- `POST /api/v1/rbac/roles` - Create new role
- `PUT /api/v1/rbac/roles/:id` - Update role
- `DELETE /api/v1/rbac/roles/:id` - Delete role

### User Role Management

- `POST /api/v1/rbac/users/:userId/roles` - Assign role to user
- `DELETE /api/v1/rbac/users/:userId/roles/:roleName` - Remove role from user
- `GET /api/v1/rbac/users/:userId/roles` - Get user roles
- `GET /api/v1/rbac/users/:userId/permissions` - Get user permissions

### Permission Checking

- `POST /api/v1/rbac/users/:userId/permissions/check` - Check specific permission
- `GET /api/v1/rbac/my/permissions` - Get current user permissions
- `GET /api/v1/rbac/my/roles` - Get current user roles

### Bulk Operations

- `POST /api/v1/rbac/bulk-assign` - Bulk assign roles to users

### Statistics

- `GET /api/v1/rbac/statistics` - Get role assignment statistics

## Service Usage

### RBAC Service

```javascript
const RBACService = require('../services/RBACService');
const rbacService = new RBACService();

// Initialize system (creates default roles)
await rbacService.initialize();

// Create role
const role = await rbacService.createRole({
  name: 'moderator',
  description: 'Content moderator',
  permissions: ['events:moderate', 'users:warn']
});

// Assign role to user
await rbacService.assignUserRole('user-id', 'moderator', {
  context: 'global',
  grantedBy: 'admin-id',
  expiresAt: new Date('2024-12-31')
});

// Check permission
const hasPermission = await rbacService.checkPermission('user-id', 'events:create');

// Get user permissions
const permissions = await rbacService.getUserPermissions('user-id');
```

## Testing

### Unit Tests

Run the RBAC tests:

```bash
npm test -- --testPathPattern=RBAC
```

### Test Coverage

- Role model operations
- User role assignments
- Permission checking
- Middleware functionality
- Service methods
- API endpoints

## Security Considerations

### Best Practices

1. **Principle of Least Privilege**: Grant minimum necessary permissions
2. **Regular Audits**: Monitor role assignments and permissions
3. **Temporary Assignments**: Use expiration dates for temporary access
4. **Context Isolation**: Use contexts to isolate permissions by domain
5. **Logging**: All RBAC operations are logged for audit trails

### Security Features

- **Permission Validation**: All permissions are validated against format rules
- **Role Hierarchy**: Prevents circular dependencies
- **Audit Logging**: All role changes are logged with user attribution
- **Automatic Cleanup**: Expired role assignments are automatically removed
- **Cache Invalidation**: Proper cache management for permission changes

## Performance Optimization

### Caching Strategy

- **Role Permissions**: Cached for 1 hour
- **User Roles**: Cached for 30 minutes
- **Permission Checks**: Cached results for faster subsequent checks

### Database Optimization

- **Indexes**: Comprehensive indexing on frequently queried columns
- **Views**: Pre-computed views for common queries
- **Functions**: Database functions for complex permission logic

### Monitoring

- **Performance Metrics**: Track permission check latency
- **Cache Hit Rates**: Monitor cache effectiveness
- **Query Performance**: Optimize slow RBAC queries

## Migration and Deployment

### Database Migrations

The RBAC system includes migrations for:
- Initial schema creation
- Default role setup
- Performance optimizations
- Schema enhancements

### Initialization

The system automatically initializes on server startup:
- Creates default roles if they don't exist
- Cleans up expired role assignments
- Validates schema integrity

## Troubleshooting

### Common Issues

1. **Permission Denied**: Check user role assignments and permission definitions
2. **Cache Issues**: Clear RBAC cache if permissions seem stale
3. **Performance**: Check database indexes and query performance
4. **Expired Roles**: Verify role assignment expiration dates

### Debugging

Enable debug logging:
```javascript
process.env.LOG_LEVEL = 'debug';
```

### Health Checks

The system includes health check endpoints to verify RBAC functionality.

## Future Enhancements

### Planned Features

1. **Dynamic Permissions**: Runtime permission creation
2. **Role Templates**: Pre-defined role templates for common use cases
3. **Permission Groups**: Logical grouping of related permissions
4. **Advanced Auditing**: Enhanced audit trails with change history
5. **Integration APIs**: External system integration for role synchronization

### Extensibility

The RBAC system is designed to be extensible:
- Custom permission validators
- Additional context types
- External role providers
- Custom middleware strategies

## Support

For questions or issues with the RBAC system:
1. Check the test files for usage examples
2. Review the API documentation
3. Check the logs for error details
4. Consult the troubleshooting section

The RBAC system is a critical security component - always test thoroughly before deploying changes to production.