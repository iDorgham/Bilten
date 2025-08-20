import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_CONFIG } from '../config/api';

/**
 * PromoCodeAnalytics Component
 * Provides detailed analytics and usage statistics for promo codes
 */
const PromoCodeAnalytics = ({ eventId, promoCodeId }) => {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [usageHistory, setUsageHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30d'); // 7d, 30d, 90d, 1y

  // Fetch analytics on component mount
  useEffect(() => {
    fetchAnalytics();
  }, [eventId, promoCodeId, timeRange]);

  /**
   * Fetch promo code analytics
   */
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch promo code details with usage stats
      const response = await fetch(`${API_CONFIG.BASE_URL}/promo-codes/${promoCodeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success) {
        setAnalytics(result.data);
      } else {
        setError(result.message || 'Failed to fetch analytics');
      }

      // Fetch usage history
      await fetchUsageHistory();
    } catch (err) {
      setError('Failed to fetch analytics');
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch usage history
   */
  const fetchUsageHistory = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/promo-codes/${promoCodeId}/usage-history?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success) {
        setUsageHistory(result.data.usageHistory || []);
      }
    } catch (err) {
      console.error('Error fetching usage history:', err);
    }
  };

  /**
   * Calculate conversion rate
   */
  const calculateConversionRate = () => {
    if (!analytics) return 0;
    const { promoCode, usageStats } = analytics;
    if (!promoCode.max_uses) return 0;
    return ((usageStats.total_uses / promoCode.max_uses) * 100).toFixed(1);
  };

  /**
   * Calculate average discount per use
   */
  const calculateAverageDiscount = () => {
    if (!analytics) return 0;
    const { usageStats } = analytics;
    if (usageStats.total_uses === 0) return 0;
    return (usageStats.total_discount_given / usageStats.total_uses).toFixed(2);
  };

  /**
   * Format currency
   */
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  /**
   * Format date
   */
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Get status color
   */
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
      case 'expired':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20';
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
        <div className="text-center py-8">
          <div className="text-red-600 dark:text-red-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">No analytics data available.</p>
        </div>
      </div>
    );
  }

  const { promoCode, usageStats } = analytics;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Promo Code Analytics
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Detailed insights for {promoCode.code}
          </p>
        </div>
        <div className="flex space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Promo Code Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Uses</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {usageStats.total_uses}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Unique Users</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {usageStats.unique_users}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Total Discount</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {formatCurrency(usageStats.total_discount_given)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-800 rounded-lg">
              <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Avg. Discount</p>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                {formatCurrency(calculateAverageDiscount())}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Promo Code Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Code Information */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Code Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Code:</span>
              <span className="font-medium text-gray-900 dark:text-white">{promoCode.code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Name:</span>
              <span className="font-medium text-gray-900 dark:text-white">{promoCode.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Type:</span>
              <span className="font-medium text-gray-900 dark:text-white capitalize">
                {promoCode.discount_type.replace('_', ' ')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Value:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {promoCode.discount_type === 'percentage' ? `${promoCode.discount_value}%` : formatCurrency(promoCode.discount_value)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Status:</span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(promoCode.is_active ? 'active' : 'inactive')}`}>
                {promoCode.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Usage Statistics */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Usage Statistics
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Usage Limit:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {promoCode.max_uses ? `${usageStats.total_uses}/${promoCode.max_uses}` : 'Unlimited'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Per User Limit:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {promoCode.max_uses_per_user} use{promoCode.max_uses_per_user > 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Conversion Rate:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {calculateConversionRate()}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Valid From:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatDate(promoCode.valid_from)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Valid Until:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {promoCode.valid_until ? formatDate(promoCode.valid_until) : 'No expiration'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Usage History */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Usage History
        </h3>
        
        {usageHistory.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">No usage history available for this time period.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Discount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {usageHistory.map((usage) => (
                  <tr key={usage.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatDate(usage.used_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {usage.user_email || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      #{usage.order_id?.slice(0, 8) || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatCurrency(usage.discount_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromoCodeAnalytics;
