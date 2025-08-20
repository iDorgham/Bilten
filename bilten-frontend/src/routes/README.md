# Bilten Frontend Route Organization

This document describes the organized route structure for the Bilten frontend application.

## 📁 Route Structure

```
src/routes/
├── index.js              # Main route configuration
├── RouteGuard.js         # Authentication and authorization guards
├── ProtectedRoutes.js    # Protected route components
└── README.md            # This documentation
```

## 🗂️ Route Categories

### 1. Public Routes (`routeConfig.public`)
Routes accessible to all users without authentication:
- `/` - Home page
- `/events` - Events listing
- `/events/search` - Event search
- `/events/calendar` - Event calendar
- `/events/:slug` - Event details
- `/events/:id/reviews` - Event reviews
- `/news` - News listing
- `/news/:id` - Article details
- `/recommendations` - Event recommendations
- `/help` - Help center
- `/qa` - Q&A section
- `/about` - About us
- `/contact` - Contact page
- `/faq` - FAQ page
- `/careers` - Careers page
- `/press` - Press page
- `/privacy-policy` - Privacy policy
- `/terms-of-service` - Terms of service
- `/cookie-policy` - Cookie policy
- `/refund-policy` - Refund policy

### 2. Authentication Routes (`routeConfig.auth`)
Routes for user authentication:
- `/login` - Login page
- `/register` - Registration page
- `/forgot-password` - Forgot password
- `/reset-password` - Reset password
- `/verify-email` - Email verification

### 3. User Routes (`routeConfig.user`)
Routes requiring user authentication:
- `/profile` - User profile
- `/settings` - User settings
- `/notifications` - User notifications
- `/wishlist` - User wishlist
- `/my-tickets` - User tickets
- `/tickets/:id` - Ticket details
- `/pasket` - Shopping basket
- `/orders` - Order history
- `/orders/:id` - Order details
- `/checkout` - Checkout page
- `/analytics` - User analytics
- `/analytics/realtime` - Real-time analytics
- `/export` - Data export

### 4. Organizer Routes (`routeConfig.organizer`)
Routes requiring organizer role:
- `/create-event` - Create event
- `/organizer-dashboard` - Organizer dashboard
- `/organizer/dashboard` - Organizer dashboard (alternative)
- `/organizer/events/:eventId/tickets` - Ticket management

### 5. Admin Routes (`routeConfig.admin`)
Routes requiring admin role:
- `/admin/dashboard` - Admin dashboard
- `/admin/users` - User management
- `/admin/moderation` - Content moderation
- `/admin/analytics` - Admin analytics
- `/admin/financial` - Financial reports
- `/admin/config` - System configuration
- `/admin/security` - Security settings
- `/admin/team` - Team management

### 6. Redirect Routes (`routeConfig.redirects`)
Routes that redirect to other pages:
- `/favorites` → `/wishlist`
- `/favourite` → `/wishlist`
- `/favourites` → `/wishlist`

### 7. Error Routes (`routeConfig.errors`)
Error handling routes:
- `/maintenance` - Maintenance page
- `/500` - Server error
- `*` - 404 Not found

## 🔐 Route Guards

### RouteGuard Component
The `RouteGuard` component provides authentication and authorization:

```jsx
<RouteGuard 
  requireAuth={true} 
  requireRole="admin" 
  fallbackPath="/login"
>
  <ProtectedComponent />
</RouteGuard>
```

### Higher-Order Components
- `withAuth(Component, role)` - Basic authentication
- `withAdminAuth(Component)` - Admin-only access
- `withOrganizerAuth(Component)` - Organizer-only access
- `withUserAuth(Component)` - User-only access

## 🛠️ Usage Examples

### Adding a New Public Route
```javascript
// In routes/index.js
export const routeConfig = {
  public: [
    // ... existing routes
    { path: '/new-page', element: <NewPage /> },
  ],
  // ... other categories
};
```

### Adding a New Protected Route
```javascript
// In routes/ProtectedRoutes.js
const ProtectedUserRoutes = () => (
  <Routes>
    {/* ... existing routes */}
    <Route path="/new-protected-page" element={<NewProtectedPage />} />
  </Routes>
);
```

### Checking Route Access
```javascript
import { hasRouteAccess } from './routes/ProtectedRoutes';

const canAccess = hasRouteAccess(userRole, '/admin/dashboard');
```

## 🔄 Route Flow

1. **Public Routes** - Always accessible
2. **Auth Routes** - Always accessible
3. **Redirect Routes** - Always accessible
4. **Protected Routes** - Checked by route guards
5. **Error Routes** - Fallback for unmatched routes

## 📋 Best Practices

1. **Route Organization**: Keep routes organized by category
2. **Authentication**: Always use route guards for protected routes
3. **Authorization**: Check user roles before rendering admin/organizer routes
4. **Error Handling**: Provide proper error routes for unmatched paths
5. **Documentation**: Keep this README updated when adding new routes

## 🚀 Migration Guide

When migrating from the old route structure:

1. Move route definitions to `routes/index.js`
2. Apply appropriate route guards
3. Update imports in `App.js`
4. Test all routes with different user roles
5. Update navigation components if needed

## 🔍 Route Testing

Test routes with different user scenarios:
- Unauthenticated user
- Regular user
- Organizer user
- Admin user

Ensure proper redirects and access control for each scenario.
