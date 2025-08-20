import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const ProtectedRoute = ({ 
  children, 
  requireAuth = false, 
  requireGuest = false,
  requireOrganizer = false,
  requireAdmin = false,
  fallbackPath = '/login',
  guestFallbackPath = '/',
  showMessage = true 
}) => {
  const { user, isAuthenticated, loading } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  const isUserAuthenticated = isAuthenticated && user;
  const isGuest = !isUserAuthenticated;

  // Route requires authentication but user is not authenticated
  if (requireAuth && !isUserAuthenticated) {
    if (showMessage) {
      // Store the intended destination for redirect after login
      sessionStorage.setItem('redirectAfterLogin', location.pathname);
    }
    return <Navigate to={fallbackPath} replace />;
  }

  // Route requires guest access but user is authenticated
  if (requireGuest && isUserAuthenticated) {
    return <Navigate to={guestFallbackPath} replace />;
  }

  // Route requires organizer role but user is not an organizer
  if (requireOrganizer && (!isUserAuthenticated || !user.isOrganizer)) {
    if (showMessage) {
      // You could show a toast notification here
      console.log('Access denied: Organizer role required');
    }
    return <Navigate to="/" replace />;
  }

  // Route requires admin role but user is not an admin
  if (requireAdmin && (!isUserAuthenticated || user.role !== 'admin')) {
    if (showMessage) {
      console.log('Access denied: Admin role required');
    }
    return <Navigate to="/" replace />;
  }

  // All checks passed, render the protected content
  return children;
};

export default ProtectedRoute;
