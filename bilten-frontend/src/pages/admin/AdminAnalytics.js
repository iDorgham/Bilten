import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAdminTheme } from '../../context/AdminThemeContext';
import AdminPageWrapper from '../../components/admin/AdminPageWrapper';
import StatCard from '../../components/admin/StatCard';
import {
  ChartBarIcon,
  UsersIcon,
  TicketIcon,
  CurrencyDollarIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

const AdminAnalytics = () => {
  const { t } = useLanguage();
  const { currentTheme } = useAdminTheme();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      // Mock data for now
      const mockData = {
        overview: {
          totalUsers: 1247,
          totalEvents: 89,
          totalRevenue: 125000,
          activeEvents: 23,
        },
        topEvents: [
          { id: 1, title: 'Summer Music Festival', organizer: 'Music Events Co.', revenue: 45000, tickets_sold: 1250 },
          { id: 2, title: 'Tech Conference 2024', organizer: 'Tech Solutions Inc.', revenue: 35600, tickets_sold: 890 },
          { id: 3, title: 'Art Exhibition', organizer: 'Creative Arts', revenue: 19500, tickets_sold: 650 },
          { id: 4, title: 'Food Festival', organizer: 'Culinary Events', revenue: 12600, tickets_sold: 420 },
          { id: 5, title: 'Sports Championship', organizer: 'Sports Events Ltd.', revenue: 8900, tickets_sold: 320 },
        ],
      };
      setAnalytics(mockData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !analytics) {
    return (
      <AdminPageWrapper>
        <div className="animate-pulse">
          <div className="h-8 bg-white/10 rounded-xl w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-white/10 rounded-xl"></div>)}
          </div>
        </div>
      </AdminPageWrapper>
    );
  }

  return (
    <AdminPageWrapper>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${currentTheme.colors.textPrimary}`}>Platform Analytics</h1>
            <p className={`${currentTheme.colors.textMuted} mt-1`}>Comprehensive insights into platform performance.</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className={`${currentTheme.colors.input} rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button
              onClick={fetchAnalytics}
              className={`${currentTheme.colors.button} text-white px-4 py-2 rounded-xl text-sm transition-colors`}
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Users" value={analytics.overview.totalUsers.toLocaleString()} change={12} icon={UsersIcon} color="text-purple-500" bgColor="bg-purple-500/10" />
          <StatCard title="Total Events" value={analytics.overview.totalEvents.toLocaleString()} change={8} icon={TicketIcon} color="text-green-500" bgColor="bg-green-500/10" />
          <StatCard title="Total Revenue" value={`$${analytics.overview.totalRevenue.toLocaleString()}`} change={15} icon={CurrencyDollarIcon} color="text-yellow-500" bgColor="bg-yellow-500/10" />
          <StatCard title="Active Events" value={analytics.overview.activeEvents.toLocaleString()} change={-3} icon={CalendarIcon} color="text-blue-500" bgColor="bg-blue-500/10" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`${currentTheme.colors.surface} backdrop-blur-sm border ${currentTheme.colors.border} rounded-xl p-6`}>
            <h3 className={`text-xl font-bold ${currentTheme.colors.textPrimary} mb-6`}>User Growth</h3>
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <ChartBarIcon className={`h-12 w-12 ${currentTheme.colors.textMuted} mx-auto mb-4`} />
                <p className={`${currentTheme.colors.textMuted}`}>Chart coming soon</p>
              </div>
            </div>
          </div>
          <div className={`${currentTheme.colors.surface} backdrop-blur-sm border ${currentTheme.colors.border} rounded-xl p-6`}>
            <h3 className={`text-xl font-bold ${currentTheme.colors.textPrimary} mb-6`}>Revenue Trends</h3>
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <ChartBarIcon className={`h-12 w-12 ${currentTheme.colors.textMuted} mx-auto mb-4`} />
                <p className={`${currentTheme.colors.textMuted}`}>Chart coming soon</p>
              </div>
            </div>
          </div>
        </div>

        <div className={`${currentTheme.colors.surface} backdrop-blur-sm border ${currentTheme.colors.border} rounded-xl p-6`}>
          <h2 className={`text-xl font-bold ${currentTheme.colors.textPrimary} mb-6`}>Top Performing Events</h2>
          <div className="space-y-4">
            {analytics.topEvents.map((event, index) => (
              <div key={event.id} className={`flex items-center justify-between p-4 ${currentTheme.colors.surfaceHover} rounded-xl transition-colors`}>
                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 ${currentTheme.colors.glass} rounded-full flex items-center justify-center`}>
                    <span className={`text-sm font-medium ${currentTheme.colors.textPrimary}`}>{index + 1}</span>
                  </div>
                  <div>
                    <p className={`font-medium ${currentTheme.colors.textPrimary}`}>{event.title}</p>
                    <p className={`text-sm ${currentTheme.colors.textMuted}`}>{event.organizer}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${currentTheme.colors.textPrimary}`}>${event.revenue.toLocaleString()}</p>
                  <p className={`text-sm ${currentTheme.colors.textMuted}`}>{event.tickets_sold} tickets</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminPageWrapper>
  );
};

export default AdminAnalytics;