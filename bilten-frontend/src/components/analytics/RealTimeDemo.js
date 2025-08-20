import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BoltIcon, 
  ChartBarIcon, 
  EyeIcon, 
  UsersIcon,
  TicketIcon,
  CurrencyDollarIcon,
  ArrowRightIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline';

const RealTimeDemo = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [demoData, setDemoData] = useState({
    activeUsers: 127,
    ticketsSold: 23,
    revenue: 2847,
    pageViews: 456
  });

  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setDemoData(prev => ({
          activeUsers: prev.activeUsers + Math.floor(Math.random() * 5) - 2,
          ticketsSold: prev.ticketsSold + Math.floor(Math.random() * 3) - 1,
          revenue: prev.revenue + Math.floor(Math.random() * 100) - 50,
          pageViews: prev.pageViews + Math.floor(Math.random() * 10) - 5
        }));
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-blue-900 dark:to-blue-800">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <BoltIcon className="w-12 h-12 text-blue-600 dark:text-blue-300 mr-4 animate-pulse" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Real-Time Dashboard Demo
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-200 max-w-3xl mx-auto">
            Experience the power of real-time analytics with live data updates, interactive charts, 
            and immediate insights for data-driven decision making.
          </p>
        </div>

        {/* Demo Controls */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/70 dark:bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/20 p-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`flex items-center px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  isPlaying
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isPlaying ? (
                  <>
                    <PauseIcon className="w-5 h-5 mr-2" />
                    Pause Demo
                  </>
                ) : (
                  <>
                    <PlayIcon className="w-5 h-5 mr-2" />
                    Start Demo
                  </>
                )}
              </button>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {isPlaying ? 'Live data updates every 2 seconds' : 'Click to start live demo'}
              </div>
            </div>
          </div>
        </div>

        {/* Live Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Active Users */}
          <div className="bg-white/70 dark:bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/20 p-6 hover:shadow-2xl hover:bg-white/80 dark:hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <UsersIcon className="w-6 h-6 text-blue-600 dark:text-blue-300" />
              </div>
              <div className="text-sm text-green-500 font-medium">
                +12%
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {formatNumber(demoData.activeUsers)}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">Active Users</p>
            <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(demoData.activeUsers / 200 * 100, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Ticket Sales */}
          <div className="bg-white/70 dark:bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/20 p-6 hover:shadow-2xl hover:bg-white/80 dark:hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <TicketIcon className="w-6 h-6 text-green-600 dark:text-green-300" />
              </div>
              <div className="text-sm text-green-500 font-medium">
                +8%
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {formatNumber(demoData.ticketsSold)}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">Tickets Sold</p>
            <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-600 dark:bg-green-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(demoData.ticketsSold / 50 * 100, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Revenue */}
          <div className="bg-white/70 dark:bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/20 p-6 hover:shadow-2xl hover:bg-white/80 dark:hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                <CurrencyDollarIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-300" />
              </div>
              <div className="text-sm text-green-500 font-medium">
                +15%
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {formatCurrency(demoData.revenue)}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">Revenue</p>
            <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-yellow-600 dark:bg-yellow-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(demoData.revenue / 5000 * 100, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Page Views */}
          <div className="bg-white/70 dark:bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/20 p-6 hover:shadow-2xl hover:bg-white/80 dark:hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <EyeIcon className="w-6 h-6 text-purple-600 dark:text-purple-300" />
              </div>
              <div className="text-sm text-green-500 font-medium">
                +22%
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {formatNumber(demoData.pageViews)}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">Page Views</p>
            <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-purple-600 dark:bg-purple-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(demoData.pageViews / 600 * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {/* Real-Time Updates */}
          <div className="bg-white/70 dark:bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/20 p-6">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl w-fit mb-4">
              <BoltIcon className="w-8 h-8 text-blue-600 dark:text-blue-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              Real-Time Updates
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Live data updates every 30 seconds with automatic refresh and real-time notifications.
            </p>
            <div className="flex items-center text-blue-600 dark:text-blue-300 text-sm font-medium">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              Live Connection
            </div>
          </div>

          {/* Interactive Charts */}
          <div className="bg-white/70 dark:bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/20 p-6">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl w-fit mb-4">
              <ChartBarIcon className="w-8 h-8 text-green-600 dark:text-green-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              Interactive Charts
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Dynamic charts with hover effects, zoom capabilities, and customizable time ranges.
            </p>
            <div className="flex items-center text-green-600 dark:text-green-300 text-sm font-medium">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Responsive Design
            </div>
          </div>

          {/* Performance Monitoring */}
          <div className="bg-white/70 dark:bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/20 p-6">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl w-fit mb-4">
              <EyeIcon className="w-8 h-8 text-yellow-600 dark:text-yellow-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              Performance Monitoring
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Monitor API response times, error rates, and system performance in real-time.
            </p>
            <div className="flex items-center text-yellow-600 dark:text-yellow-300 text-sm font-medium">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              System Health
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="bg-white/70 dark:bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/20 p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to Experience Real-Time Analytics?
            </h2>
            <p className="text-gray-600 dark:text-gray-200 mb-6">
              Access the full real-time dashboard with comprehensive analytics, 
              user journey tracking, and advanced reporting features.
            </p>
            <Link
              to="/analytics/realtime"
              className="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <ChartBarIcon className="w-5 h-5 mr-2" />
              Launch Real-Time Dashboard
              <ArrowRightIcon className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeDemo;
