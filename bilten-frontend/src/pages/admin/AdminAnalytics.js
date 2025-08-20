import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  ChartBarIcon,
  UsersIcon,
  TicketIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

const AdminAnalytics = () => {
  const { t } = useLanguage();
  const [analytics, setAnalytics] = useState({
    overview: {},
    trends: [],
    topEvents: [],
    userGrowth: [],
    revenueData: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/v1/admin/analytics?period=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, change, icon: Icon, color }) => (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {change && (
            <div className="flex items-center mt-2">
              {change > 0 ? (
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                                  <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(change)}% from last period
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Platform Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive insights into platform performance and user behavior.
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="mb-6">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Time Range:</span>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={analytics.overview?.totalUsers?.toLocaleString() || '0'}
            change={12}
            icon={UsersIcon}
            color="bg-blue-500"
          />
          <StatCard
            title="Total Events"
            value={analytics.overview?.totalEvents?.toLocaleString() || '0'}
            change={8}
            icon={TicketIcon}
            color="bg-green-500"
          />
          <StatCard
            title="Total Revenue"
            value={`$${analytics.overview?.totalRevenue?.toLocaleString() || '0'}`}
            change={15}
            icon={CurrencyDollarIcon}
            color="bg-purple-500"
          />
          <StatCard
            title="Active Events"
            value={analytics.overview?.activeEvents?.toLocaleString() || '0'}
            change={-3}
            icon={CalendarIcon}
            color="bg-orange-500"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* User Growth Chart */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Growth</h3>
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Chart coming soon</p>
              </div>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue Trends</h3>
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Chart coming soon</p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Events */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Performing Events</h3>
          </div>
          <div className="p-6">
            {analytics.topEvents && analytics.topEvents.length > 0 ? (
              <div className="space-y-4">
                {analytics.topEvents.slice(0, 5).map((event, index) => (
                  <div key={event.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{event.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{event.organizer}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-white">${event.revenue?.toLocaleString()}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{event.tickets_sold} tickets</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <TicketIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No event data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
