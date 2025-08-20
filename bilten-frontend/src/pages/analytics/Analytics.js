import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  ChartBarIcon, 
  CalendarDaysIcon, 
  UsersIcon, 
  CurrencyDollarIcon,
  DocumentTextIcon,
  CogIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import AnalyticsDashboard from '../../components/analytics/AnalyticsDashboard';
import EventAnalytics from '../../components/analytics/EventAnalytics';

const Analytics = () => {
  const { user, isAdmin, isOrganizer } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Check if user has access to analytics
  if (!isAdmin && !isOrganizer) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Access denied. Admin or Organizer permissions required.</p>
        </div>
      </div>
    );
  }

  const analyticsTabs = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: ChartBarIcon,
      description: 'Overview of key metrics and performance indicators',
      access: ['admin', 'organizer']
    },
    {
      id: 'events',
      name: 'Event Analytics',
      icon: CalendarDaysIcon,
      description: 'Detailed event performance and trends',
      access: ['admin', 'organizer']
    },
    {
      id: 'users',
      name: 'User Analytics',
      icon: UsersIcon,
      description: 'User behavior and engagement metrics',
      access: ['admin']
    },
    {
      id: 'financial',
      name: 'Financial Analytics',
      icon: CurrencyDollarIcon,
      description: 'Revenue, payments, and financial insights',
      access: ['admin']
    },
    {
      id: 'content',
      name: 'Content Analytics',
      icon: DocumentTextIcon,
      description: 'Article and content performance',
      access: ['admin', 'organizer']
    },
    {
      id: 'performance',
      name: 'System Performance',
      icon: CogIcon,
      description: 'Platform performance and technical metrics',
      access: ['admin']
    }
  ];

  const filteredTabs = analyticsTabs.filter(tab => 
    tab.access.includes(isAdmin ? 'admin' : 'organizer')
  );

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AnalyticsDashboard />;
      case 'events':
        return <EventAnalytics />;
      case 'users':
        return (
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-yellow-800">User Analytics component coming soon...</p>
            </div>
          </div>
        );
      case 'financial':
        return (
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-yellow-800">Financial Analytics component coming soon...</p>
            </div>
          </div>
        );
      case 'content':
        return (
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-yellow-800">Content Analytics component coming soon...</p>
            </div>
          </div>
        );
      case 'performance':
        return (
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-yellow-800">System Performance component coming soon...</p>
            </div>
          </div>
        );
      default:
        return <AnalyticsDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Analytics
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Comprehensive insights and performance metrics
              </p>
            </div>
            
            {/* Quick Actions */}
            <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
              <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                <DocumentTextIcon className="h-4 w-4 mr-2" />
                Export Report
              </button>
              <button className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
                <CogIcon className="h-4 w-4 mr-2" />
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-8 overflow-x-auto">
            {filteredTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Analytics Grid Overview */}
      {activeTab === 'dashboard' && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredTabs.slice(1).map((tab) => {
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.id}
                  to={`/analytics/${tab.id}`}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Icon className="h-8 w-8 text-blue-600 group-hover:text-blue-700" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600">
                          {tab.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {tab.description}
                        </p>
                      </div>
                    </div>
                    <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main>
        {renderActiveComponent()}
      </main>

      {/* Footer */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>Analytics data is updated in real-time</p>
              <p className="mt-1">Last updated: {new Date().toLocaleString()}</p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <button className="hover:text-blue-600 transition-colors">Help</button>
              <button className="hover:text-blue-600 transition-colors">Documentation</button>
              <button className="hover:text-blue-600 transition-colors">Support</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
