/**
 * RBAC Usage Examples
 * 
 * This file demonstrates how to use the RBAC system in your routes
 */

const express = require('express');
const { 
  requirePermission, 
  requireRole, 
  requireAdmin, 
  requireOrganizerOrAdmin,
  requireAllPermissions,
  requireAnyPermission,
  attachUserPermissions,
  requireOwnership,
  protect
} = require('../middleware/rbacMiddleware');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Example 1: Require specific permission
router.get('/events', 
  authenticateToken,
  requirePermission('events:read'),
  async (req, res) => {
    // Only users with 'events:read' permission can access this
    res.json({ message: 'Events list' });
  }
);

// Example 2: Require specific role
router.post('/events',
  authenticateToken,
  requireRole('organizer'),
  async (req, res) => {
    // Only users with 'organizer' role can create events
    res.json({ message: 'Event created' });
  }
);

// Example 3: Require admin role
router.delete('/events/:id',
  authenticateToken,
  requireAdmin(),
  async (req, res) => {
    // Only admins can delete events
    res.json({ message: 'Event deleted' });
  }
);

// Example 4: Require organizer or admin role
router.put('/events/:id',
  authenticateToken,
  requireOrganizerOrAdmin(),
  async (req, res) => {
    // Organizers and admins can update events
    res.json({ message: 'Event updated' });
  }
);

// Example 5: Require multiple permissions (ALL)
router.get('/admin/dashboard',
  authenticateToken,
  requireAllPermissions(['analytics:read', 'users:read', 'events:read']),
  async (req, res) => {
    // User must have ALL specified permissions
    res.json({ message: 'Admin dashboard data' });
  }
);

// Example 6: Require any of multiple permissions
router.get('/moderation',
  authenticateToken,
  requireAnyPermission(['events:moderate', 'users:moderate', 'content:moderate']),
  async (req, res) => {
    // User must have at least ONE of the specified permissions
    res.json({ message: 'Moderation panel' });
  }
);

// Example 7: Allow self access or require permission
router.get('/users/:userId/profile',
  authenticateToken,
  requirePermission('users:read', { allowSelf: true, selfParam: 'userId' }),
  async (req, res) => {
    // Users can access their own profile, or need 'users:read' permission for others
    res.json({ message: 'User profile' });
  }
);

// Example 8: Attach user permissions to request
router.get('/my/permissions',
  authenticateToken,
  attachUserPermissions(),
  async (req, res) => {
    // req.userPermissions will contain user's permissions
    res.json({ 
      message: 'Your permissions',
      permissions: req.userPermissions 
    });
  }
);

// Example 9: Require resource ownership
const Event = require('../models/Event');
router.put('/my/events/:id',
  authenticateToken,
  requireOwnership(Event, 'id', 'organizer_id'),
  async (req, res) => {
    // Only the event owner (or admin) can update their events
    // req.resource will contain the event object
    res.json({ 
      message: 'Event updated',
      event: req.resource 
    });
  }
);

// Example 10: Using the protect helper with complex requirements
router.post('/events/:id/publish',
  authenticateToken,
  protect({
    permissions: ['events:publish', 'events:update'],
    context: 'events',
    allowSelf: true,
    selfParam: 'organizerId'
  }),
  async (req, res) => {
    // User needs both permissions in 'events' context, or is the organizer
    res.json({ message: 'Event published' });
  }
);

// Example 11: Using protect with role requirements
router.get('/admin/users',
  authenticateToken,
  protect({
    roles: ['admin', 'super_admin']
  }),
  async (req, res) => {
    // User must have admin or super_admin role
    res.json({ message: 'Users list for admin' });
  }
);

// Example 12: Using protect with "any" permission requirement
router.get('/content/moderate',
  authenticateToken,
  protect({
    permissions: ['events:moderate', 'users:moderate', 'comments:moderate'],
    any: true
  }),
  async (req, res) => {
    // User needs ANY of the specified permissions
    res.json({ message: 'Content moderation panel' });
  }
);

// Example 13: Context-specific permissions
router.get('/organizations/:orgId/events',
  authenticateToken,
  requirePermission('events:read', { context: 'organization' }),
  async (req, res) => {
    // Check permission in organization context
    res.json({ message: 'Organization events' });
  }
);

// Example 14: Conditional RBAC based on request data
router.post('/events/:id/tickets',
  authenticateToken,
  async (req, res, next) => {
    // Custom logic to determine required permission
    const eventType = req.body.eventType;
    const requiredPermission = eventType === 'premium' ? 'tickets:create_premium' : 'tickets:create';
    
    // Apply RBAC middleware dynamically
    const rbacMiddleware = requirePermission(requiredPermission);
    rbacMiddleware(req, res, next);
  },
  async (req, res) => {
    res.json({ message: 'Ticket created' });
  }
);

// Example 15: Multiple RBAC checks in sequence
router.post('/events/:id/featured',
  authenticateToken,
  requireRole(['admin', 'marketing']), // First check role
  requirePermission('events:feature'),  // Then check specific permission
  async (req, res) => {
    // User must pass both checks
    res.json({ message: 'Event featured' });
  }
);

module.exports = router;

/**
 * RBAC Best Practices:
 * 
 * 1. Always use authenticateToken before RBAC middleware
 * 2. Use specific permissions rather than broad roles when possible
 * 3. Consider using allowSelf for user-specific resources
 * 4. Use context-specific permissions for multi-tenant scenarios
 * 5. Combine multiple RBAC checks for complex authorization logic
 * 6. Use attachUserPermissions when you need to check permissions in route logic
 * 7. Use requireOwnership for resource-specific access control
 * 8. Use the protect helper for complex permission combinations
 * 9. Log authorization failures for security monitoring
 * 10. Test all RBAC scenarios thoroughly
 */