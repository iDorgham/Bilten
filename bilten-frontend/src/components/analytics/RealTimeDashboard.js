import React, { useState, useEffect, useRef } from 'react';
import { 
  ChartBarIcon, 
  UsersIcon, 
  TicketIcon, 
  CurrencyDollarIcon,
  EyeIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  WifiIcon,
  SignalIcon,
  BoltIcon,
  ChartBarSquareIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import analyticsService from '../../services/analytics';

const RealTimeDashboard = () => {
  const [realTimeData, setRealTimeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('1h');
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isConnected, setIsConnected] = useState(true);
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchRealTimeData();
    
    // Set up real-time updates every 30 seconds
    intervalRef.current = setInterval(() => {
      fetchRealTimeData();
      setLastUpdate(new Date());
    }, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timeRange]);

  const fetchRealTimeData = async () => {
    try {
      setLoading(true);
      const response = await analyticsService.getRealTimeAnalytics(timeRange);
      setRealTimeData(response.data);
      setIsConnected(true);
      setError(null);
    } catch (err) {
      setError('Failed to load real-time data');
      setIsConnected(false);
      console.error('Real-time data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatTime = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(date);
  };

  const getGrowthColor = (growth) => {
    return growth >= 0 ? 'text-green-500' : 'text-red-500';
  };

  const getGrowthIcon = (growth) => {
    return growth >= 0 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;
  };

  const getMetricIcon = (type) => {
    const icons = {
      users: UsersIcon,
      tickets: TicketIcon,
      revenue: CurrencyDollarIcon,
      views: EyeIcon,
      performance: BoltIcon,
      activity: ChartBarSquareIcon
    };
    return icons[type] || ChartBarSquareIcon;
  };

  if (loading && !realTimeData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-blue-900 dark:to-blue-800">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-2xl h-32"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl h-80"></div>
              <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl h-80"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-blue-900 dark:to-blue-800">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
              <BoltIcon className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-300 animate-pulse" />
              Real-Time Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-200">
              Live insights and analytics for immediate decision making
            </p>
          </div>
          
          <div className="flex items-center space-x-4 mt-4 lg:mt-0">
            {/* Connection Status */}
            <div className={`flex items-center px-3 py-2 rounded-full text-sm font-medium ${
              isConnected 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' 
                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
            }`}>
              {isConnected ? (
                <WifiIcon className="w-4 h-4 mr-2" />
              ) : (
                <SignalIcon className="w-4 h-4 mr-2" />
              )}
              {isConnected ? 'Live' : 'Offline'}
            </div>

            {/* Last Update */}
            <div className="flex items-center px-3 py-2 bg-white/10 dark:bg-white/20 backdrop-blur-md rounded-full text-sm">
              <ClockIcon className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-300" />
              {formatTime(lastUpdate)}
            </div>

            {/* Time Range Selector */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 bg-white/10 dark:bg-white/20 backdrop-blur-md border border-white/20 dark:border-white/30 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1h">Last Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 mb-8">
            <p className="text-red-800 dark:text-red-200 mb-4">{error}</p>
            <button 
              onClick={fetchRealTimeData}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry Connection
            </button>
          </div>
        )}

        {realTimeData && (
          <>
            {/* Real-Time Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Active Users */}
              <div className="bg-white/70 dark:bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/20 p-6 hover:shadow-2xl hover:bg-white/80 dark:hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                    <UsersIcon className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div className={`flex items-center text-sm ${getGrowthColor(realTimeData.userGrowth || 0)}`}>
                    {React.createElement(getGrowthIcon(realTimeData.userGrowth || 0), { className: "w-4 h-4 mr-1" })}
                    {Math.abs(realTimeData.userGrowth || 0)}%
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {formatNumber(realTimeData.activeUsers || 0)}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Active Users</p>
                <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((realTimeData.activeUsers || 0) / 100 * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Ticket Sales */}
              <div className="bg-white/70 dark:bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/20 p-6 hover:shadow-2xl hover:bg-white/80 dark:hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                    <TicketIcon className="w-6 h-6 text-green-600 dark:text-green-300" />
                  </div>
                  <div className={`flex items-center text-sm ${getGrowthColor(realTimeData.ticketGrowth || 0)}`}>
                    {React.createElement(getGrowthIcon(realTimeData.ticketGrowth || 0), { className: "w-4 h-4 mr-1" })}
                    {Math.abs(realTimeData.ticketGrowth || 0)}%
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {formatNumber(realTimeData.ticketsSold || 0)}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Tickets Sold</p>
                <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-600 dark:bg-green-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((realTimeData.ticketsSold || 0) / 50 * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Revenue */}
              <div className="bg-white/70 dark:bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/20 p-6 hover:shadow-2xl hover:bg-white/80 dark:hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                    <CurrencyDollarIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-300" />
                  </div>
                  <div className={`flex items-center text-sm ${getGrowthColor(realTimeData.revenueGrowth || 0)}`}>
                    {React.createElement(getGrowthIcon(realTimeData.revenueGrowth || 0), { className: "w-4 h-4 mr-1" })}
                    {Math.abs(realTimeData.revenueGrowth || 0)}%
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {formatCurrency(realTimeData.revenue || 0)}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Revenue</p>
                <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-yellow-600 dark:bg-yellow-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((realTimeData.revenue || 0) / 1000 * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Page Views */}
              <div className="bg-white/70 dark:bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/20 p-6 hover:shadow-2xl hover:bg-white/80 dark:hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                    <EyeIcon className="w-6 h-6 text-purple-600 dark:text-purple-300" />
                  </div>
                  <div className={`flex items-center text-sm ${getGrowthColor(realTimeData.viewGrowth || 0)}`}>
                    {React.createElement(getGrowthIcon(realTimeData.viewGrowth || 0), { className: "w-4 h-4 mr-1" })}
                    {Math.abs(realTimeData.viewGrowth || 0)}%
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {formatNumber(realTimeData.pageViews || 0)}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Page Views</p>
                <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-purple-600 dark:bg-purple-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((realTimeData.pageViews || 0) / 200 * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Real-Time Activity Chart */}
              <div className="bg-white/70 dark:bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/20 p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <ChartBarSquareIcon className="w-6 h-6 mr-3 text-blue-600 dark:text-blue-300" />
                  Real-Time Activity
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={realTimeData.activityData || []}>
                    <defs>
                      <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis 
                      dataKey="time" 
                      stroke="#6B7280"
                      fontSize={12}
                      tickFormatter={(value) => new Date(value).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    />
                    <YAxis stroke="#6B7280" fontSize={12} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                      }}
                      labelFormatter={(value) => new Date(value).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="activity" 
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      fill="url(#activityGradient)"
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Conversion Funnel */}
              <div className="bg-white/70 dark:bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/20 p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <ChartBarIcon className="w-6 h-6 mr-3 text-green-600 dark:text-green-300" />
                  Conversion Funnel
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={realTimeData.funnelData || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis dataKey="stage" stroke="#6B7280" fontSize={12} />
                    <YAxis stroke="#6B7280" fontSize={12} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="#10B981"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white/70 dark:bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/20 p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <BoltIcon className="w-6 h-6 mr-3 text-yellow-600 dark:text-yellow-300" />
                Performance Metrics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {realTimeData.performanceMetrics?.map((metric, index) => (
                  <div key={index} className="text-center">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      {metric.avgResponseTime}ms
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                      {metric.endpoint}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {metric.requestCount} requests • {metric.errorCount} errors
                    </div>
                    <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                      <div 
                        className={`h-1 rounded-full transition-all duration-500 ${
                          metric.avgResponseTime < 200 ? 'bg-green-500' : 
                          metric.avgResponseTime < 500 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(metric.avgResponseTime / 1000 * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RealTimeDashboard;
