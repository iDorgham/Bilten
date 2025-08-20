import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const MonitoringDashboard = () => {
  const [healthData, setHealthData] = useState(null);
  const [metricsData, setMetricsData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHealthData = async () => {
    try {
      const response = await fetch('/monitoring/health');
      const data = await response.json();
      setHealthData(data);
    } catch (err) {
      setError('Failed to fetch health data');
    }
  };

  const fetchMetricsData = async () => {
    try {
      const response = await fetch('/monitoring/metrics');
      const data = await response.json();
      setMetricsData(data);
    } catch (err) {
      setError('Failed to fetch metrics data');
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/monitoring/alerts');
      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (err) {
      setError('Failed to fetch alerts');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([
        fetchHealthData(),
        fetchMetricsData(),
        fetchAlerts()
      ]);
      setLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'text-green-500';
      case 'warning':
        return 'text-yellow-500';
      case 'unhealthy':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 border-green-300';
      case 'warning':
        return 'bg-yellow-100 border-yellow-300';
      case 'unhealthy':
        return 'bg-red-100 border-red-300';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  const formatUptime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-900 border border-red-700 rounded-lg p-4">
            <h2 className="text-xl font-bold mb-2">Error</h2>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">System Monitoring Dashboard</h1>

        {/* Health Status */}
        {healthData && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">System Health</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className={`border rounded-lg p-6 ${getStatusBgColor(healthData.status)}`}>
                <h3 className="text-lg font-semibold mb-2">Overall Status</h3>
                <p className={`text-2xl font-bold ${getStatusColor(healthData.status)}`}>
                  {healthData.status.toUpperCase()}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Uptime: {formatUptime(healthData.uptime)}
                </p>
              </div>

              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">Database</h3>
                <p className={`text-2xl font-bold ${getStatusColor(healthData.checks?.database)}`}>
                  {healthData.checks?.database?.toUpperCase() || 'UNKNOWN'}
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Queries: {healthData.metrics?.databaseQueries || 0}
                </p>
              </div>

              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">Memory</h3>
                <p className={`text-2xl font-bold ${getStatusColor(healthData.checks?.memory)}`}>
                  {healthData.checks?.memory?.toUpperCase() || 'UNKNOWN'}
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Usage: {formatBytes(healthData.metrics?.memoryUsage?.heapUsed || 0)}
                </p>
              </div>

              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">Error Rate</h3>
                <p className={`text-2xl font-bold ${getStatusColor(healthData.checks?.errorRate)}`}>
                  {(healthData.metrics?.errorRate || 0).toFixed(2)}%
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Errors: {healthData.metrics?.errors || 0}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Performance Metrics */}
        {metricsData && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Performance Metrics</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Response Time</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={[
                    { time: '1m ago', value: metricsData.system?.avgResponseTime || 0 },
                    { time: '30s ago', value: (metricsData.system?.avgResponseTime || 0) * 0.9 },
                    { time: 'Now', value: metricsData.system?.avgResponseTime || 0 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="time" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
                    <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Request Volume</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[
                    { metric: 'Requests', value: metricsData.system?.requests || 0 },
                    { metric: 'Errors', value: metricsData.system?.errors || 0 },
                    { metric: 'DB Queries', value: metricsData.system?.databaseQueries || 0 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="metric" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
                    <Bar dataKey="value" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Alerts */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Active Alerts</h2>
          {alerts.length === 0 ? (
            <div className="bg-green-900 border border-green-700 rounded-lg p-6">
              <p className="text-green-200">No active alerts. System is running smoothly.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert, index) => (
                <div key={index} className={`border rounded-lg p-4 ${
                  alert.severity === 'high' ? 'bg-red-900 border-red-700' :
                  alert.severity === 'medium' ? 'bg-yellow-900 border-yellow-700' :
                  'bg-blue-900 border-blue-700'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{alert.type.replace(/_/g, ' ').toUpperCase()}</h3>
                      <p className="text-sm opacity-90">{alert.message}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      alert.severity === 'high' ? 'bg-red-700 text-red-100' :
                      alert.severity === 'medium' ? 'bg-yellow-700 text-yellow-100' :
                      'bg-blue-700 text-blue-100'
                    }`}>
                      {alert.severity.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System Information */}
        {healthData && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">System Information</h2>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Environment</h3>
                  <p className="text-gray-400">{healthData.environment || 'development'}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Version</h3>
                  <p className="text-gray-400">{healthData.version || '1.0.0'}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Last Updated</h3>
                  <p className="text-gray-400">{new Date(healthData.timestamp).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonitoringDashboard;
