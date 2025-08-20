import React from 'react';
import { Link } from 'react-router-dom';

const RecentActivity = ({ activities = [] }) => {
  const defaultActivities = [
    {
      id: 1,
      type: 'event_created',
      title: 'New event created',
      description: 'Summer Music Festival 2024 was created by admin',
      time: '2 minutes ago',
      icon: '🎫',
      color: 'bg-green-500/20 border-green-500/30'
    },
    {
      id: 2,
      type: 'payment_received',
      title: 'Payment received',
      description: 'Order #12345 - $299.99 payment processed',
      time: '5 minutes ago',
      icon: '💰',
      color: 'bg-blue-500/20 border-blue-500/30'
    },
    {
      id: 3,
      type: 'user_registered',
      title: 'New user registered',
      description: 'john.doe@example.com joined the platform',
      time: '10 minutes ago',
      icon: '👤',
      color: 'bg-purple-500/20 border-purple-500/30'
    },
    {
      id: 4,
      type: 'promo_code_created',
      title: 'Promo code created',
      description: 'SUMMER20 discount code generated',
      time: '15 minutes ago',
      icon: '🎁',
      color: 'bg-orange-500/20 border-orange-500/30'
    },
    {
      id: 5,
      type: 'refund_processed',
      title: 'Refund processed',
      description: 'Order #12340 refunded - $149.99',
      time: '1 hour ago',
      icon: '↩️',
      color: 'bg-red-500/20 border-red-500/30'
    },
    {
      id: 6,
      type: 'system_update',
      title: 'System update',
      description: 'Platform maintenance completed successfully',
      time: '2 hours ago',
      icon: '⚙️',
      color: 'bg-gray-500/20 border-gray-500/30'
    }
  ];

  const displayActivities = activities.length > 0 ? activities : defaultActivities;

  const getActivityIcon = (type) => {
    const activity = displayActivities.find(a => a.id === type);
    return activity?.icon || '📋';
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white text-xl font-bold">Recent Activity</h2>
        <Link 
          to="/admin/activity" 
          className="text-white/60 hover:text-white text-sm transition-colors"
        >
          View all
        </Link>
      </div>

      <div className="space-y-4">
        {displayActivities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start space-x-4 p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            {/* Activity icon */}
            <div className={`w-10 h-10 rounded-lg border flex items-center justify-center flex-shrink-0 ${activity.color}`}>
              <span className="text-lg">{activity.icon}</span>
            </div>

            {/* Activity content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-white font-medium text-sm">
                    {activity.title}
                  </h3>
                  <p className="text-white/60 text-sm mt-1">
                    {activity.description}
                  </p>
                </div>
                <span className="text-white/40 text-xs ml-4 flex-shrink-0">
                  {activity.time}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Activity summary */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-white text-2xl font-bold">24</div>
            <div className="text-white/60 text-xs">Today</div>
          </div>
          <div className="text-center">
            <div className="text-white text-2xl font-bold">156</div>
            <div className="text-white/60 text-xs">This Week</div>
          </div>
          <div className="text-center">
            <div className="text-white text-2xl font-bold">1,234</div>
            <div className="text-white/60 text-xs">This Month</div>
          </div>
          <div className="text-center">
            <div className="text-white text-2xl font-bold">12,345</div>
            <div className="text-white/60 text-xs">Total</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecentActivity;
