import React from 'react';
import { useAuth } from '../../context/AuthContext';
import RealTimeDashboard from '../../components/analytics/RealTimeDashboard';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';

const RealTimeAnalytics = () => {
  const { isAuthenticated, user } = useAuth();

  // Check if user has admin or organizer role
  const hasAccess = isAuthenticated && user && (user.role === 'admin' || user.role === 'organizer');

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-6 animate-bounce">📊</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Sign in to access analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-200 mb-8 text-lg">
            Real-time analytics dashboard is available for authenticated users with appropriate permissions.
          </p>
          <a
            href="/login"
            className="inline-flex items-center px-8 py-4 bg-white/10 dark:bg-white/20 backdrop-blur-md border border-white/20 dark:border-white/30 text-white font-semibold rounded-xl hover:bg-white/20 dark:hover:bg-white/30 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8">
            <ShieldExclamationIcon className="w-16 h-16 text-red-500 dark:text-red-400 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-4">
              Access Denied
            </h1>
            <p className="text-red-600 dark:text-red-300 mb-6">
              You don't have permission to access the real-time analytics dashboard. 
              This feature is only available for administrators and organizers.
            </p>
            <a
              href="/"
              className="inline-flex items-center px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
            >
              Return to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <RealTimeDashboard />;
};

export default RealTimeAnalytics;
