import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAdminTheme } from '../../context/AdminThemeContext';
import AdminPageWrapper from '../../components/admin/AdminPageWrapper';
import StatCard from '../../components/admin/StatCard';
import {
  CurrencyDollarIcon,
  BanknotesIcon,
  CreditCardIcon,
  ArrowTrendingUpIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

const AdminFinancial = () => {
  const { t } = useLanguage();
  const { currentTheme } = useAdminTheme();
  const [financialData, setFinancialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchFinancialData();
  }, [timeRange]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      // Mock data
      const mockData = {
        overview: { totalRevenue: 250000, platformFees: 25000, totalTransactions: 3450, averageOrderValue: 72.46 },
        transactions: [
          { id: 'txn_1', event_title: 'Summer Music Festival', amount: 75.00, status: 'completed', created_at: '2024-08-22' },
          { id: 'txn_2', event_title: 'Tech Conference 2024', amount: 199.00, status: 'completed', created_at: '2024-08-21' },
          { id: 'txn_3', event_title: 'Art Exhibition', amount: 30.00, status: 'pending', created_at: '2024-08-21' },
        ],
        topRevenueSources: [
          { id: 1, event_title: 'Summer Music Festival', organizer: 'Music Events Co.', revenue: 45000, ticket_count: 1250 },
          { id: 2, event_title: 'Tech Conference 2024', organizer: 'Tech Solutions Inc.', revenue: 35600, ticket_count: 890 },
        ],
      };
      setFinancialData(mockData);
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !financialData) {
    return (
      <AdminPageWrapper>
        <div className="animate-pulse">
          <div className={`h-8 ${currentTheme.colors.surface} rounded-xl w-1/4 mb-8`}></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => <div key={i} className={`h-32 ${currentTheme.colors.surface} rounded-xl`}></div>)}
          </div>
        </div>
      </AdminPageWrapper>
    );
  }

  return (
    <AdminPageWrapper>
      <div className="space-y-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${currentTheme.colors.textPrimary} mb-2`}>Financial Reports</h1>
            <p className={`${currentTheme.colors.textMuted}`}>Financial analytics and revenue insights.</p>
          </div>
          <div className="flex items-center space-x-4">
            <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className={`${currentTheme.colors.input} rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50`}>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button className={`flex items-center space-x-2 px-4 py-2 ${currentTheme.colors.button} text-white rounded-xl transition-colors`}>
              <ArrowDownTrayIcon className="h-4 w-4" />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Revenue" value={`$${financialData.overview.totalRevenue.toLocaleString()}`} change={15} icon={CurrencyDollarIcon} color="text-green-500" bgColor="bg-green-500/10" />
          <StatCard title="Platform Fees" value={`$${financialData.overview.platformFees.toLocaleString()}`} change={12} icon={BanknotesIcon} color="text-blue-500" bgColor="bg-blue-500/10" />
          <StatCard title="Total Transactions" value={financialData.overview.totalTransactions.toLocaleString()} change={8} icon={CreditCardIcon} color="text-purple-500" bgColor="bg-purple-500/10" />
          <StatCard title="Avg. Order Value" value={`$${financialData.overview.averageOrderValue.toFixed(2)}`} change={-2} icon={ArrowTrendingUpIcon} color="text-yellow-500" bgColor="bg-yellow-500/10" />
        </div>

        <div className={`${currentTheme.colors.surface} backdrop-blur-sm rounded-xl border ${currentTheme.colors.border} mb-8`}>
          <div className={`p-6 border-b ${currentTheme.colors.border}`}><h3 className={`text-lg font-semibold ${currentTheme.colors.textPrimary}`}>Recent Transactions</h3></div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className={`${currentTheme.colors.surface}`}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme.colors.textMuted} uppercase`}>Transaction ID</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme.colors.textMuted} uppercase`}>Event</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme.colors.textMuted} uppercase`}>Amount</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme.colors.textMuted} uppercase`}>Status</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme.colors.textMuted} uppercase`}>Date</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${currentTheme.colors.border}`}>
                {financialData.transactions.map(t => (
                  <tr key={t.id} className={`hover:${currentTheme.colors.surfaceHover}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{t.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{t.event_title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">${t.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 py-1 text-xs rounded-full ${t.status === 'completed' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>{t.status}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(t.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminPageWrapper>
  );
};

export default AdminFinancial;