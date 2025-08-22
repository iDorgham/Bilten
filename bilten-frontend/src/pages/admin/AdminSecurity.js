import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAdminTheme } from '../../context/AdminThemeContext';
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
  const { currentTheme, isDark } = useAdminTheme();
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
    <div className={`${currentTheme.colors.surface} backdrop-blur-sm rounded-xl p-6 border ${currentTheme.colors.border} shadow-lg`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${currentTheme.colors.textMuted}`}>{title}</p>
          <p className={`text-2xl font-bold ${currentTheme.colors.textPrimary} mt-1`}>{value}</p>
          <div className="flex items-center mt-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
              status === 'secure' 
                ? isDark ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-800'
                : isDark ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-800'
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
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className={`h-8 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-1/4 mb-8`}></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`h-32 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-xl`}></div>
            ))}
          </div>
          <div className={`h-96 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-xl`}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${currentTheme.colors.textPrimary} mb-2`}>
          Security & Compliance
        </h1>
        <p className={`${currentTheme.colors.textMuted}`}>
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
      <div className={`${currentTheme.colors.surface} backdrop-blur-sm rounded-xl border ${currentTheme.colors.border} shadow-lg`}>
          <div className={`border-b ${currentTheme.colors.border}`}>
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? `border-blue-500 ${currentTheme.colors.info}`
                      : `border-transparent ${currentTheme.colors.textMuted} ${currentTheme.colors.linkHover}`
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
                <h3 className={`text-lg font-semibold ${currentTheme.colors.textPrimary}`}>Security Overview</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Security Events */}
                  <div className={`${currentTheme.colors.surface} rounded-lg p-4`}>
                    <h4 className={`font-medium ${currentTheme.colors.textPrimary} mb-3`}>Recent Security Events</h4>
                    <div className="space-y-3">
                      {securityData.events && securityData.events.length > 0 ? (
                        securityData.events.slice(0, 5).map((event, index) => (
                          <div key={index} className={`flex items-center space-x-3 p-2 ${currentTheme.colors.secondary} rounded`}>
                            <div className={`p-1 rounded-full ${isDark ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
                              <ClockIcon className={`h-3 w-3 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                            </div>
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${currentTheme.colors.textPrimary}`}>{event.title}</p>
                              <p className={`text-xs ${currentTheme.colors.textMuted}`}>{event.time}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              event.severity === 'high' 
                                ? isDark ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-800'
                                : isDark ? 'bg-yellow-900/50 text-yellow-400' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {event.severity}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4">
                          <CheckCircleIcon className="h-8 w-8 text-green-500 mx-auto mb-2" />
                          <p className={`${currentTheme.colors.textMuted}`}>No recent security events</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Compliance Status */}
                  <div className={`${currentTheme.colors.surface} rounded-lg p-4`}>
                    <h4 className={`font-medium ${currentTheme.colors.textPrimary} mb-3`}>Compliance Status</h4>
                    <div className="space-y-3">
                      <div className={`flex items-center justify-between p-2 ${currentTheme.colors.secondary} rounded`}>
                        <span className={`text-sm ${currentTheme.colors.textPrimary}`}>GDPR Compliance</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${isDark ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-800'}`}>
                          Compliant
                        </span>
                      </div>
                      <div className={`flex items-center justify-between p-2 ${currentTheme.colors.secondary} rounded`}>
                        <span className={`text-sm ${currentTheme.colors.textPrimary}`}>PCI DSS</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${isDark ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-800'}`}>
                          Compliant
                        </span>
                      </div>
                      <div className={`flex items-center justify-between p-2 ${currentTheme.colors.secondary} rounded`}>
                        <span className={`text-sm ${currentTheme.colors.textPrimary}`}>SOC 2</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${isDark ? 'bg-yellow-900/50 text-yellow-400' : 'bg-yellow-100 text-yellow-800'}`}>
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
                <h3 className={`text-lg font-semibold ${currentTheme.colors.textPrimary}`}>Security Events</h3>
                
                <div className={`${currentTheme.colors.surface} rounded-lg p-4`}>
                  <div className="overflow-x-auto">
                    <table className={`min-w-full divide-y ${currentTheme.colors.border}`}>
                      <thead className={`${currentTheme.colors.secondary}`}>
                        <tr>
                          <th className={`px-4 py-3 text-left text-xs font-medium ${currentTheme.colors.textMuted} uppercase tracking-wider`}>
                            Event
                          </th>
                          <th className={`px-4 py-3 text-left text-xs font-medium ${currentTheme.colors.textMuted} uppercase tracking-wider`}>
                            User
                          </th>
                          <th className={`px-4 py-3 text-left text-xs font-medium ${currentTheme.colors.textMuted} uppercase tracking-wider`}>
                            Severity
                          </th>
                          <th className={`px-4 py-3 text-left text-xs font-medium ${currentTheme.colors.textMuted} uppercase tracking-wider`}>
                            Time
                          </th>
                        </tr>
                      </thead>
                      <tbody className={`${currentTheme.colors.secondary} divide-y ${currentTheme.colors.border}`}>
                        {securityData.events && securityData.events.length > 0 ? (
                          securityData.events.map((event, index) => (
                            <tr key={index} className={`${currentTheme.colors.surfaceHover}`}>
                              <td className={`px-4 py-3 text-sm ${currentTheme.colors.textPrimary}`}>
                                {event.title}
                              </td>
                              <td className={`px-4 py-3 text-sm ${currentTheme.colors.textPrimary}`}>
                                {event.user}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  event.severity === 'high' 
                                    ? isDark ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-800'
                                    : event.severity === 'medium'
                                    ? isDark ? 'bg-yellow-900/50 text-yellow-400' : 'bg-yellow-100 text-yellow-800'
                                    : isDark ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-800'
                                }`}>
                                  {event.severity}
                                </span>
                              </td>
                              <td className={`px-4 py-3 text-sm ${currentTheme.colors.textMuted}`}>
                                {event.time}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="px-4 py-8 text-center">
                              <div className={`${currentTheme.colors.textMuted}`}>
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
                <h3 className={`text-lg font-semibold ${currentTheme.colors.textPrimary}`}>Active Threats</h3>
                
                <div className="text-center py-12">
                  <ShieldCheckIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className={`text-lg font-medium ${currentTheme.colors.textPrimary} mb-2`}>No Active Threats</h3>
                  <p className={`${currentTheme.colors.textMuted}`}>
                    Your system is currently secure with no active threats detected.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'compliance' && (
              <div className="space-y-6">
                <h3 className={`text-lg font-semibold ${currentTheme.colors.textPrimary}`}>Compliance Dashboard</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className={`${currentTheme.colors.surface} rounded-lg p-6`}>
                    <h4 className={`font-medium ${currentTheme.colors.textPrimary} mb-4`}>GDPR Compliance</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${currentTheme.colors.textMuted}`}>Data Protection</span>
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${currentTheme.colors.textMuted}`}>User Consent</span>
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${currentTheme.colors.textMuted}`}>Data Portability</span>
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      </div>
                    </div>
                  </div>
                  
                  <div className={`${currentTheme.colors.surface} rounded-lg p-6`}>
                    <h4 className={`font-medium ${currentTheme.colors.textPrimary} mb-4`}>PCI DSS Compliance</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${currentTheme.colors.textMuted}`}>Card Data Security</span>
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${currentTheme.colors.textMuted}`}>Encryption</span>
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${currentTheme.colors.textMuted}`}>Access Control</span>
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'access' && (
              <div className="space-y-6">
                <h3 className={`text-lg font-semibold ${currentTheme.colors.textPrimary}`}>Access Logs</h3>
                
                <div className={`${currentTheme.colors.surface} rounded-lg p-4`}>
                  <div className="overflow-x-auto">
                    <table className={`min-w-full divide-y ${currentTheme.colors.border}`}>
                      <thead className={`${currentTheme.colors.secondary}`}>
                        <tr>
                          <th className={`px-4 py-3 text-left text-xs font-medium ${currentTheme.colors.textMuted} uppercase tracking-wider`}>
                            User
                          </th>
                          <th className={`px-4 py-3 text-left text-xs font-medium ${currentTheme.colors.textMuted} uppercase tracking-wider`}>
                            Action
                          </th>
                          <th className={`px-4 py-3 text-left text-xs font-medium ${currentTheme.colors.textMuted} uppercase tracking-wider`}>
                            IP Address
                          </th>
                          <th className={`px-4 py-3 text-left text-xs font-medium ${currentTheme.colors.textMuted} uppercase tracking-wider`}>
                            Time
                          </th>
                        </tr>
                      </thead>
                      <tbody className={`${currentTheme.colors.secondary} divide-y ${currentTheme.colors.border}`}>
                        {securityData.accessLogs && securityData.accessLogs.length > 0 ? (
                          securityData.accessLogs.slice(0, 10).map((log, index) => (
                            <tr key={index} className={`${currentTheme.colors.surfaceHover}`}>
                              <td className={`px-4 py-3 text-sm ${currentTheme.colors.textPrimary}`}>
                                {log.user}
                              </td>
                              <td className={`px-4 py-3 text-sm ${currentTheme.colors.textPrimary}`}>
                                {log.action}
                              </td>
                              <td className={`px-4 py-3 text-sm ${currentTheme.colors.textMuted}`}>
                                {log.ip}
                              </td>
                              <td className={`px-4 py-3 text-sm ${currentTheme.colors.textMuted}`}>
                                {log.time}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="px-4 py-8 text-center">
                              <div className={`${currentTheme.colors.textMuted}`}>
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
  );
};

export default AdminSecurity;
