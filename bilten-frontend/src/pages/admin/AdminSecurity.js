import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  ShieldCheckIcon,
  LockClosedIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const AdminSecurity = () => {
  const { t } = useLanguage();
  const [securityData, setSecurityData] = useState({
    events: [],
    threats: [],
    compliance: {},
    accessLogs: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      const response = await fetch('/api/v1/admin/security', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSecurityData(data);
      }
    } catch (error) {
      console.error('Error fetching security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const SecurityCard = ({ title, value, status, icon: Icon, color }) => (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          <div className="flex items-center mt-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
              status === 'secure' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400'
                : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400'
            }`}>
              {status === 'secure' ? (
                <CheckCircleIcon className="h-3 w-3 mr-1" />
              ) : (
                <XCircleIcon className="h-3 w-3 mr-1" />
              )}
              {status}
            </span>
          </div>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'events', name: 'Security Events' },
    { id: 'threats', name: 'Threats' },
    { id: 'compliance', name: 'Compliance' },
    { id: 'access', name: 'Access Logs' }
  ];

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
            Security & Compliance
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor security events, manage access controls, and ensure compliance.
          </p>
        </div>

        {/* Security Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <SecurityCard
            title="Active Threats"
            value="0"
            status="secure"
            icon={ShieldCheckIcon}
            color="bg-green-500"
          />
          <SecurityCard
            title="Failed Logins"
            value="12"
            status="secure"
            icon={LockClosedIcon}
            color="bg-blue-500"
          />
          <SecurityCard
            title="Security Events"
            value="3"
            status="secure"
            icon={ExclamationTriangleIcon}
            color="bg-yellow-500"
          />
          <SecurityCard
            title="Compliance Score"
            value="98%"
            status="secure"
            icon={CheckCircleIcon}
            color="bg-purple-500"
          />
        </div>

        {/* Security Tabs */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Security Overview</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Security Events */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Recent Security Events</h4>
                    <div className="space-y-3">
                      {securityData.events && securityData.events.length > 0 ? (
                        securityData.events.slice(0, 5).map((event, index) => (
                          <div key={index} className="flex items-center space-x-3 p-2 bg-white dark:bg-gray-800 rounded">
                            <div className="p-1 rounded-full bg-blue-100 dark:bg-blue-900/50">
                              <ClockIcon className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{event.title}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">{event.time}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              event.severity === 'high' 
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400'
                            }`}>
                              {event.severity}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4">
                          <CheckCircleIcon className="h-8 w-8 text-green-500 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">No recent security events</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Compliance Status */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Compliance Status</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                        <span className="text-sm text-gray-900 dark:text-white">GDPR Compliance</span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400 rounded-full text-xs font-semibold">
                          Compliant
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                        <span className="text-sm text-gray-900 dark:text-white">PCI DSS</span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400 rounded-full text-xs font-semibold">
                          Compliant
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                        <span className="text-sm text-gray-900 dark:text-white">SOC 2</span>
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400 rounded-full text-xs font-semibold">
                          In Progress
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'events' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Security Events</h3>
                
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-white dark:bg-gray-800">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Event
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Severity
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Time
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {securityData.events && securityData.events.length > 0 ? (
                          securityData.events.map((event, index) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                {event.title}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                {event.user}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  event.severity === 'high' 
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400'
                                    : event.severity === 'medium'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400'
                                    : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400'
                                }`}>
                                  {event.severity}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                {event.time}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="px-4 py-8 text-center">
                              <div className="text-gray-400 dark:text-gray-500">
                                <CheckCircleIcon className="h-8 w-8 mx-auto mb-2" />
                                <p className="text-sm">No security events found</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'threats' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Active Threats</h3>
                
                <div className="text-center py-12">
                  <ShieldCheckIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Active Threats</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Your system is currently secure with no active threats detected.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'compliance' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Compliance Dashboard</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-4">GDPR Compliance</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Data Protection</span>
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">User Consent</span>
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Data Portability</span>
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-4">PCI DSS Compliance</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Card Data Security</span>
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Encryption</span>
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Access Control</span>
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'access' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Access Logs</h3>
                
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-white dark:bg-gray-800">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Action
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            IP Address
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Time
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {securityData.accessLogs && securityData.accessLogs.length > 0 ? (
                          securityData.accessLogs.slice(0, 10).map((log, index) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                {log.user}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                {log.action}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                {log.ip}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                {log.time}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="px-4 py-8 text-center">
                              <div className="text-gray-400 dark:text-gray-500">
                                <EyeIcon className="h-8 w-8 mx-auto mb-2" />
                                <p className="text-sm">No access logs available</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSecurity;
