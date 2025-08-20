import React from 'react';
import { Link } from 'react-router-dom';

const QuickActions = ({ actions = [] }) => {
  const defaultActions = [
    {
      title: 'Create Event',
      description: 'Add a new event to the platform',
      icon: '➕',
      path: '/admin/events/create',
      color: 'bg-green-500/20 border-green-500/30 hover:bg-green-500/30'
    },
    {
      title: 'Manage Users',
      description: 'View and manage user accounts',
      icon: '👥',
      path: '/admin/users',
      color: 'bg-blue-500/20 border-blue-500/30 hover:bg-blue-500/30'
    },
    {
      title: 'View Orders',
      description: 'Check recent orders and payments',
      icon: '📦',
      path: '/admin/financial/orders',
      color: 'bg-purple-500/20 border-purple-500/30 hover:bg-purple-500/30'
    },
    {
      title: 'Create Promo Code',
      description: 'Generate new promotional codes',
      icon: '🎁',
      path: '/admin/promo-codes/create',
      color: 'bg-orange-500/20 border-orange-500/30 hover:bg-orange-500/30'
    },
    {
      title: 'Analytics',
      description: 'View detailed analytics and reports',
      icon: '📊',
      path: '/admin/analytics',
      color: 'bg-indigo-500/20 border-indigo-500/30 hover:bg-indigo-500/30'
    },
    {
      title: 'System Settings',
      description: 'Configure platform settings',
      icon: '⚙️',
      path: '/admin/config',
      color: 'bg-gray-500/20 border-gray-500/30 hover:bg-gray-500/30'
    }
  ];

  const displayActions = actions.length > 0 ? actions : defaultActions;

  return (
    <div className="mb-8">
      <h2 className="text-white text-xl font-bold mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayActions.map((action, index) => (
          <Link
            key={index}
            to={action.path}
            className={`
              group relative overflow-hidden rounded-xl border backdrop-blur-sm p-6
              transition-all duration-300 hover:scale-105 hover:shadow-lg
              ${action.color}
            `}
          >
            {/* Animated background */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute top-2 left-2 w-16 h-16 border border-white/20 rounded-full animate-pulse"></div>
                <div className="absolute bottom-2 right-2 w-12 h-12 border border-white/20 rounded-full animate-pulse delay-1000"></div>
              </div>
            </div>

            <div className="relative z-10">
              <div className="flex items-start space-x-4">
                <div className="text-3xl">{action.icon}</div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-lg mb-2">
                    {action.title}
                  </h3>
                  <p className="text-white/70 text-sm">
                    {action.description}
                  </p>
                </div>
              </div>
              
              <div className="mt-4 flex items-center text-white/60 text-sm group-hover:text-white/80 transition-colors">
                <span>Get started</span>
                <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
