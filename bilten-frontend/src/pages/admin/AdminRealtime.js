import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAdminTheme } from '../../context/AdminThemeContext';
import AdminPageWrapper from '../../components/admin/AdminPageWrapper';
import StatCard from '../../components/admin/StatCard';
import {
  EyeIcon,
  UsersIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ClockIcon,
  SignalIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

const AdminRealtime = () => {
  const { t } = useLanguage();
  const { currentTheme } = useAdminTheme();
  const [realtimeData, setRealtimeData] = useState(null);

  useEffect(() => {
    const fetchData = () => {
      const mockData = {
        activeUsers: Math.floor(Math.random() * 500) + 100,
        currentSessions: Math.floor(Math.random() * 200) + 50,
        liveEvents: Math.floor(Math.random() * 10) + 3,
        recentActivity: [
          { id: Date.now() + 1, type: 'user_login', message: 'User logged in from New York', timestamp: new Date().toLocaleTimeString(), icon: UsersIcon, color: 'text-green-500' },
          { id: Date.now() + 2, type: 'ticket_purchase', message: 'Ticket purchased for Summer Festival', timestamp: new Date(Date.now() - 30000).toLocaleTimeString(), icon: CurrencyDollarIcon, color: 'text-blue-500' },
        ],
        systemMetrics: {
          cpuUsage: Math.floor(Math.random() * 30) + 20,
          memoryUsage: Math.floor(Math.random() * 40) + 30,
          responseTime: Math.floor(Math.random() * 100) + 50,
          uptime: '12h 34m'
        }
      };
      setRealtimeData(mockData);
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!realtimeData) {
    return (
      <AdminPageWrapper>
        <div className="animate-pulse">
          <div className={`h-8 ${currentTheme.colors.surface} rounded-xl w-1/4 mb-8`}></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => <div key={i} className={`h-24 ${currentTheme.colors.surface} rounded-xl`}></div>)}
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
            <h1 className={`text-3xl font-bold ${currentTheme.colors.textPrimary}`}>Real-time Analytics</h1>
            <p className={`${currentTheme.colors.textMuted} mt-1`}>Live platform activity and performance.</p>
          </div>
          <div className="flex items-center space-x-2 text-green-500">
            <SignalIcon className="w-5 h-5" />
            <span className="font-semibold">Live</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Active Users" value={realtimeData.activeUsers} icon={UsersIcon} color="text-green-500" bgColor="bg-green-500/10" />
          <StatCard title="Current Sessions" value={realtimeData.currentSessions} icon={EyeIcon} color="text-blue-500" bgColor="bg-blue-500/10" />
          <StatCard title="Live Events" value={realtimeData.liveEvents} icon={CalendarIcon} color="text-purple-500" bgColor="bg-purple-500/10" />
          <StatCard title="Response Time" value={`${realtimeData.systemMetrics.responseTime}ms`} icon={BoltIcon} color="text-yellow-500" bgColor="bg-yellow-500/10" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`lg:col-span-2 ${currentTheme.colors.surface} backdrop-blur-sm border ${currentTheme.colors.border} rounded-xl p-6`}>
            <h2 className={`text-xl font-bold ${currentTheme.colors.textPrimary} mb-6`}>Live Activity Feed</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {realtimeData.recentActivity.map(activity => <ActivityItem key={activity.id} activity={activity} />)}
            </div>
          </div>
          <div className="space-y-6">
            <div className={`${currentTheme.colors.surface} backdrop-blur-sm border ${currentTheme.colors.border} rounded-xl p-6`}>
              <h2 className={`text-xl font-bold ${currentTheme.colors.textPrimary} mb-4`}>System Performance</h2>
              <div className="space-y-4">
                <ProgressBar title="CPU Usage" value={realtimeData.systemMetrics.cpuUsage} color="bg-blue-500" />
                <ProgressBar title="Memory Usage" value={realtimeData.systemMetrics.memoryUsage} color="bg-green-500" />
                <div className="pt-4 border-t ${currentTheme.colors.borderLight}">
                  <div className="flex justify-between"><span className={`${currentTheme.colors.textSecondary}`}>Uptime</span><span>{realtimeData.systemMetrics.uptime}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminPageWrapper>
  );
};

const ActivityItem = ({ activity }) => {
  const { currentTheme } = useAdminTheme();
  return (
    <div className={`flex items-start space-x-3 p-4 ${currentTheme.colors.surfaceHover} rounded-xl`}>
      <div className={`p-2 rounded-lg ${activity.color} ${currentTheme.colors.glass}`}><activity.icon className="w-4 h-4" /></div>
      <div className="flex-1">
        <p className={`${currentTheme.colors.textPrimary} text-sm`}>{activity.message}</p>
        <p className={`${currentTheme.colors.textMuted} text-xs mt-1`}>{activity.timestamp}</p>
      </div>
    </div>
  );
};

const ProgressBar = ({ title, value, color }) => {
  const { currentTheme } = useAdminTheme();
  return (
    <div>
      <div className="flex justify-between mb-2"><span className={`${currentTheme.colors.textSecondary}`}>{title}</span><span>{value}%</span></div>
      <div className={`w-full ${currentTheme.colors.glass} rounded-full h-2`}><div className={`${color} h-2 rounded-full`} style={{ width: `${value}%` }}></div></div>
    </div>
  );
};

export default AdminRealtime;