import React from 'react';
import DashboardCard from './DashboardCard';

const StatsGrid = ({ stats = [] }) => {
  const defaultStats = [
    {
      title: 'Total Events',
      value: '1,234',
      icon: '🎫',
      trend: 'vs last month',
      trendValue: '+12.5%',
      trendDirection: 'up'
    },
    {
      title: 'Active Users',
      value: '5,678',
      icon: '👥',
      trend: 'vs last month',
      trendValue: '+8.3%',
      trendDirection: 'up'
    },
    {
      title: 'Revenue',
      value: '$45,678',
      icon: '💰',
      trend: 'vs last month',
      trendValue: '+15.2%',
      trendDirection: 'up'
    },
    {
      title: 'Orders',
      value: '2,345',
      icon: '📦',
      trend: 'vs last month',
      trendValue: '+5.7%',
      trendDirection: 'up'
    },
    {
      title: 'Promo Codes',
      value: '89',
      icon: '🎁',
      trend: 'vs last month',
      trendValue: '+23.1%',
      trendDirection: 'up'
    },
    {
      title: 'Refunds',
      value: '12',
      icon: '↩️',
      trend: 'vs last month',
      trendValue: '-8.5%',
      trendDirection: 'down'
    }
  ];

  const displayStats = stats.length > 0 ? stats : defaultStats;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {displayStats.map((stat, index) => (
        <DashboardCard
          key={index}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          trend={stat.trend}
          trendValue={stat.trendValue}
          trendDirection={stat.trendDirection}
          onClick={stat.onClick}
          className={stat.className}
        />
      ))}
    </div>
  );
};

export default StatsGrid;
