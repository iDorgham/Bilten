import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAdminTheme } from '../../context/AdminThemeContext';
import AdminPageWrapper from '../../components/admin/AdminPageWrapper';
import StatCard from '../../components/admin/StatCard';
import {
  UsersIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  CogIcon,
  ShieldCheckIcon,
  TicketIcon,
  EyeIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  BellIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
  FireIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { currentTheme } = useAdminTheme();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const mockData = {
        stats: {
          totalUsers: 1247,
          totalEvents: 89,
          totalTickets: 15420,
          totalRevenue: 125000,
          activeEvents: 23,
          pendingEvents: 7,
          todaySales: 8500,
          monthlyGrowth: 12.5
        },
        recentActivity: [
          { id: 1, type: 'event_created', message: 'New event "Summer Music Festival" created', time: '2m ago', icon: CalendarIcon, color: 'text-blue-500', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20' },
          { id: 2, type: 'ticket_sold', message: '50 tickets sold for "Tech Conference 2024"', time: '5m ago', icon: TicketIcon, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20' },
          { id: 3, type: 'user_registered', message: 'New user: john.doe@example.com', time: '8m ago', icon: UsersIcon, color: 'text-purple-500', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/20' },
          { id: 4, type: 'payment_received', message: 'Payment of $2,500 received', time: '12m ago', icon: CurrencyDollarIcon, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20' },
          { id: 5, type: 'event_approved', message: 'Event "Food Festival" approved', time: '15m ago', icon: CheckCircleIcon, color: 'text-blue-500', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20' },
        ],
        topEvents: [
          { id: 1, title: 'Summer Music Festival', organizer: 'Music Events Co.', ticketsSold: 1250, revenue: 45000, status: 'active', image: '🎵', growth: '+15%', category: 'Music' },
          { id: 2, title: 'Tech Conference 2024', organizer: 'Tech Solutions Inc.', ticketsSold: 890, revenue: 35600, status: 'active', image: '💻', growth: '+8%', category: 'Technology' },
          { id: 3, title: 'Art Exhibition', organizer: 'Creative Arts', ticketsSold: 650, revenue: 19500, status: 'active', image: '🎨', growth: '+22%', category: 'Arts' },
          { id: 4, title: 'Food Festival', organizer: 'Culinary Events', ticketsSold: 420, revenue: 12600, status: 'pending', image: '🍕', growth: '+5%', category: 'Food' },
        ],
        systemHealth: {
          status: 'healthy',
          uptime: '99.9%',
          lastBackup: '2 hours ago',
          activeUsers: 156
        }
      };
      setDashboardData(mockData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const ActivityItem = ({ activity }) => (
    <div className={`flex items-start space-x-4 p-4 ${currentTheme.colors.surfaceHover} rounded-xl transition-all duration-200 hover:scale-[1.01] group`}>
      <div className={`p-3 rounded-xl ${activity.bgColor} ${activity.color} border ${activity.borderColor} group-hover:scale-110 transition-transform duration-200`}>
        <activity.icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`${currentTheme.colors.textPrimary} text-sm font-medium`}>{activity.message}</p>
        <p className={`${currentTheme.colors.textMuted} text-xs mt-1`}>{activity.time}</p>
      </div>
      <ChevronRightIcon className={`w-4 h-4 ${currentTheme.colors.textMuted} opacity-0 group-hover:opacity-100 transition-opacity duration-200`} />
    </div>
  );

  const EventCard = ({ event }) => (
    <div className={`${currentTheme.colors.surface} backdrop-blur-sm border ${currentTheme.colors.border} rounded-xl p-5 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] group`}>
      <div className="flex items-start space-x-4">
        <div className="text-3xl group-hover:scale-110 transition-transform duration-200">{event.image}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className={`${currentTheme.colors.textPrimary} font-semibold truncate`}>{event.title}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              event.status === 'active' 
                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
            }`}>
              {event.status}
            </span>
          </div>
          <p className={`${currentTheme.colors.textMuted} text-sm mb-3`}>{event.organizer}</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <p className={`${currentTheme.colors.textSecondary} text-xs font-medium`}>Tickets Sold</p>
              <p className={`${currentTheme.colors.textPrimary} text-sm font-semibold`}>{event.ticketsSold.toLocaleString()}</p>
            </div>
            <div>
              <p className={`${currentTheme.colors.textSecondary} text-xs font-medium`}>Revenue</p>
              <p className={`${currentTheme.colors.textPrimary} text-sm font-semibold`}>${event.revenue.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-xs px-2 py-1 rounded-full ${currentTheme.colors.glass}`}>{event.category}</span>
            <span className={`text-xs font-medium ${event.growth.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>{event.growth}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const QuickActionCard = ({ title, description, icon: Icon, color, href }) => (
    <Link
      to={href}
      className={`block ${currentTheme.colors.surface} backdrop-blur-sm border ${currentTheme.colors.border} rounded-xl p-5 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] group`}
    >
      <div className={`p-3 rounded-xl ${color.bg} ${color.text} w-fit mb-4 group-hover:scale-110 transition-transform duration-200`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className={`${currentTheme.colors.textPrimary} font-semibold mb-2`}>{title}</h3>
      <p className={`${currentTheme.colors.textMuted} text-sm`}>{description}</p>
    </Link>
  );

  if (loading || !dashboardData) {
    return (
      <AdminPageWrapper>
        <div className="animate-pulse">
          <div className="h-10 bg-white/10 rounded-xl w-1/3 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-white/10 rounded-xl"></div>)}
          </div>
        </div>
      </AdminPageWrapper>
    );
  }

  const quickActions = [
    { title: 'Manage Users', description: 'View and manage user accounts, permissions, and roles', icon: UsersIcon, color: { bg: 'bg-purple-500/10', text: 'text-purple-500' }, href: '/admin/users' },
    { title: 'Review Events', description: 'Approve, reject, or modify pending event submissions', icon: CalendarIcon, color: { bg: 'bg-blue-500/10', text: 'text-blue-500' }, href: '/admin/events' },
    { title: 'Financial Reports', description: 'Generate detailed financial reports and analytics', icon: CurrencyDollarIcon, color: { bg: 'bg-emerald-500/10', text: 'text-emerald-500' }, href: '/admin/financial' },
    { title: 'Security Settings', description: 'Configure security policies and access controls', icon: ShieldCheckIcon, color: { bg: 'bg-red-500/10', text: 'text-red-500' }, href: '/admin/security' },
  ];

  return (
    <AdminPageWrapper>
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className={`p-2 rounded-xl ${currentTheme.colors.glass}`}><SparklesIcon className={`w-6 h-6 ${currentTheme.colors.textPrimary}`} /></div>
              <h1 className={`text-4xl font-bold ${currentTheme.colors.textPrimary}`}>Dashboard</h1>
            </div>
            <p className={`${currentTheme.colors.textMuted} text-lg`}>Welcome back, {user?.first_name || 'Admin'}! Here's what's happening.</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <MagnifyingGlassIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${currentTheme.colors.textMuted}`} />
              <input type="text" placeholder="Search..." className={`${currentTheme.colors.input} pl-10 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-64`} />
            </div>
            <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className={`${currentTheme.colors.input} rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50`}>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <button onClick={fetchDashboardData} className={`${currentTheme.colors.button} text-white px-6 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105`}>Refresh</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Users" value={dashboardData.stats.totalUsers.toLocaleString()} change={8.2} icon={UsersIcon} color="text-purple-500" bgColor="bg-purple-500/10" />
          <StatCard title="Total Events" value={dashboardData.stats.totalEvents} change={15.3} icon={CalendarIcon} color="text-blue-500" bgColor="bg-blue-500/10" />
          <StatCard title="Tickets Sold" value={dashboardData.stats.totalTickets.toLocaleString()} change={12.7} icon={TicketIcon} color="text-emerald-500" bgColor="bg-emerald-500/10" />
          <StatCard title="Total Revenue" value={`$${dashboardData.stats.totalRevenue.toLocaleString()}`} change={dashboardData.stats.monthlyGrowth} icon={CurrencyDollarIcon} color="text-yellow-500" bgColor="bg-yellow-500/10" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Active Events" value={dashboardData.stats.activeEvents} icon={EyeIcon} color="text-emerald-500" bgColor="bg-emerald-500/10" />
          <StatCard title="Pending Events" value={dashboardData.stats.pendingEvents} icon={ClockIcon} color="text-yellow-500" bgColor="bg-yellow-500/10" />
          <StatCard title="Today's Sales" value={`$${dashboardData.stats.todaySales.toLocaleString()}`} icon={ArrowTrendingUpIcon} color="text-blue-500" bgColor="bg-blue-500/10" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className={`${currentTheme.colors.surface} backdrop-blur-sm border ${currentTheme.colors.border} rounded-xl p-6`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-xl ${currentTheme.colors.glass}`}><BellIcon className={`w-5 h-5 ${currentTheme.colors.textPrimary}`} /></div>
                  <h2 className={`text-xl font-bold ${currentTheme.colors.textPrimary}`}>Recent Activity</h2>
                </div>
                <Link to="/admin/activity" className={`${currentTheme.colors.info} hover:opacity-80 text-sm font-medium transition-opacity flex items-center space-x-1`}><span>View all</span><ChevronRightIcon className="w-4 h-4" /></Link>
              </div>
              <div className="space-y-3">{dashboardData.recentActivity.map((activity) => <ActivityItem key={activity.id} activity={activity} />)}</div>
            </div>
          </div>

          <div className="space-y-6">
            <div className={`${currentTheme.colors.surface} backdrop-blur-sm border ${currentTheme.colors.border} rounded-xl p-6`}>
              <div className="flex items-center space-x-3 mb-6">
                <div className={`p-2 rounded-xl ${currentTheme.colors.glass}`}><ShieldCheckIcon className={`w-5 h-5 ${currentTheme.colors.textPrimary}`} /></div>
                <h2 className={`text-xl font-bold ${currentTheme.colors.textPrimary}`}>System Health</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <span className={`${currentTheme.colors.textSecondary} text-sm font-medium`}>Status</span>
                  <span className="text-emerald-500 font-semibold flex items-center"><CheckCircleIcon className="w-4 h-4 mr-1" /> Healthy</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <span className={`${currentTheme.colors.textSecondary} text-sm font-medium`}>Uptime</span>
                  <span className={`${currentTheme.colors.textPrimary} font-semibold`}>{dashboardData.systemHealth.uptime}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <span className={`${currentTheme.colors.textSecondary} text-sm font-medium`}>Active Users</span>
                  <span className={`${currentTheme.colors.textPrimary} font-semibold`}>{dashboardData.systemHealth.activeUsers}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                  <span className={`${currentTheme.colors.textSecondary} text-sm font-medium`}>Last Backup</span>
                  <span className={`${currentTheme.colors.textPrimary} font-semibold`}>{dashboardData.systemHealth.lastBackup}</span>
                </div>
              </div>
            </div>

            <div className={`${currentTheme.colors.surface} backdrop-blur-sm border ${currentTheme.colors.border} rounded-xl p-6`}>
              <div className="flex items-center space-x-3 mb-6">
                <div className={`p-2 rounded-xl ${currentTheme.colors.glass}`}><CogIcon className={`w-5 h-5 ${currentTheme.colors.textPrimary}`} /></div>
                <h2 className={`text-xl font-bold ${currentTheme.colors.textPrimary}`}>Quick Actions</h2>
              </div>
              <div className="grid grid-cols-1 gap-4">{quickActions.map((action, index) => <QuickActionCard key={index} {...action} />)}</div>
            </div>
          </div>
        </div>

        <div className={`${currentTheme.colors.surface} backdrop-blur-sm border ${currentTheme.colors.border} rounded-xl p-6`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-xl ${currentTheme.colors.glass}`}><FireIcon className={`w-5 h-5 ${currentTheme.colors.textPrimary}`} /></div>
              <h2 className={`text-xl font-bold ${currentTheme.colors.textPrimary}`}>Top Performing Events</h2>
            </div>
            <Link to="/admin/events" className={`${currentTheme.colors.info} hover:opacity-80 text-sm font-medium transition-opacity flex items-center space-x-1`}><span>View all events</span><ChevronRightIcon className="w-4 h-4" /></Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">{dashboardData.topEvents.map((event) => <EventCard key={event.id} event={event} />)}</div>
        </div>
      </div>
    </AdminPageWrapper>
  );
};

export default AdminDashboard;