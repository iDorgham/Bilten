import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Route guard component for authentication and authorization
const RouteGuard = ({ children, requireAuth = false, requireRole = null, fallbackPath = '/login' }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Show loading state while authentication is being checked
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    // Save the intended destination for redirect after login
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // If specific role is required
  if (requireRole && isAuthenticated) {
    const hasRequiredRole = user?.role === requireRole;
    
    if (!hasRequiredRole) {
      // Redirect to appropriate page based on user's actual role
      switch (user?.role) {
        case 'admin':
          return <Navigate to="/admin/dashboard" replace />;
        case 'organizer':
          return <Navigate to="/organizer/dashboard" replace />;
        case 'user':
          return <Navigate to="/profile" replace />;
        default:
          return <Navigate to="/" replace />;
      }
    }
  }

  // If all checks pass, render the children
  return children;
};

// Higher-order component for creating protected routes
export const withAuth = (Component, requireRole = null) => {
  return (props) => (
    <RouteGuard requireAuth={true} requireRole={requireRole}>
      <Component {...props} />
    </RouteGuard>
  );
};

// Higher-order component for admin-only routes
export const withAdminAuth = (Component) => {
  return withAuth(Component, 'admin');
};

// Higher-order component for organizer-only routes
export const withOrganizerAuth = (Component) => {
  return withAuth(Component, 'organizer');
};

// Higher-order component for user-only routes
export const withUserAuth = (Component) => {
  return withAuth(Component, 'user');
};

export default RouteGuard;
