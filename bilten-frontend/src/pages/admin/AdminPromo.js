import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAdminTheme } from '../../context/AdminThemeContext';
import AdminPageWrapper from '../../components/admin/AdminPageWrapper';
import {
  GiftIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

const AdminPromo = () => {
  const { t } = useLanguage();
  const { currentTheme } = useAdminTheme();
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchPromoCodes();
  }, [statusFilter, typeFilter]);

  const fetchPromoCodes = async () => {
    try {
      setLoading(true);
      const mockPromoCodes = [
        { id: 1, code: 'SUMMER2024', description: 'Summer festival discount', type: 'percentage', value: 25, status: 'active', usageCount: 156, usageLimit: 500, expiryDate: '2024-08-31' },
        { id: 2, code: 'NEWUSER10', description: 'New user welcome discount', type: 'percentage', value: 10, status: 'active', usageCount: 89, usageLimit: 1000, expiryDate: '2024-12-31' },
        { id: 3, code: 'EARLYBIRD', description: 'Early bird special offer', type: 'fixed', value: 50, status: 'expired', usageCount: 234, usageLimit: 300, expiryDate: '2024-07-15' },
      ];
      
      let filtered = mockPromoCodes;
      if (statusFilter !== 'all') filtered = filtered.filter(c => c.status === statusFilter);
      if (typeFilter !== 'all') filtered = filtered.filter(c => c.type === typeFilter);

      setPromoCodes(filtered);
    } catch (error) {
      console.error('Error fetching promo codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBySearch = promoCodes.filter(p =>
    p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <AdminPageWrapper>
        <div className="animate-pulse">
          <div className={`h-8 ${currentTheme.colors.surface} rounded-xl w-1/4 mb-8`}></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => <div key={i} className={`h-48 ${currentTheme.colors.surface} rounded-xl`}></div>)}
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
            <h1 className={`text-3xl font-bold ${currentTheme.colors.textPrimary}`}>Promo Codes</h1>
            <p className={`${currentTheme.colors.textMuted} mt-1`}>Manage and track promotional codes.</p>
          </div>
          <Link to="/admin/promo/create" className={`${currentTheme.colors.button} text-white px-4 py-2 rounded-xl text-sm flex items-center space-x-2`}>
            <PlusIcon className="w-4 h-4" />
            <span>Create Code</span>
          </Link>
        </div>

        <div className={`${currentTheme.colors.surface} backdrop-blur-sm border ${currentTheme.colors.border} rounded-xl p-6`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="relative flex-1 lg:max-w-md">
              <MagnifyingGlassIcon className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${currentTheme.colors.textMuted}`} />
              <input
                type="text"
                placeholder="Search codes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-xl ${currentTheme.colors.input} focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
              />
            </div>
            <div className="flex items-center space-x-4">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${currentTheme.colors.input} rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50`}>
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="draft">Draft</option>
              </select>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={`${currentTheme.colors.input} rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50`}>
                <option value="all">All Types</option>
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredBySearch.map(code => <PromoCodeCard key={code.id} code={code} />)}
        </div>

        {filteredBySearch.length === 0 && !loading && (
          <div className={`${currentTheme.colors.surface} backdrop-blur-sm border ${currentTheme.colors.border} rounded-xl p-12 text-center`}>
            <GiftIcon className={`w-16 h-16 ${currentTheme.colors.textMuted} mx-auto mb-4`} />
            <h3 className={`${currentTheme.colors.textPrimary} text-lg font-semibold mb-2`}>No Promo Codes</h3>
            <p className={`${currentTheme.colors.textMuted}`}>No promo codes match your current filters.</p>
          </div>
        )}
      </div>
    </AdminPageWrapper>
  );
};

const PromoCodeCard = ({ code }) => {
  const { currentTheme } = useAdminTheme();
  const StatusIcon = { active: CheckCircleIcon, expired: XCircleIcon, draft: PencilIcon }[code.status] || ClockIcon;
  const statusStyle = {
    active: 'bg-green-500/10 text-green-500 border-green-500/20',
    expired: 'bg-red-500/10 text-red-500 border-red-500/20',
    draft: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  }[code.status] || 'bg-gray-500/10 text-gray-500 border-gray-500/20';

  return (
    <div className={`${currentTheme.colors.surface} backdrop-blur-sm border ${currentTheme.colors.border} rounded-xl p-6 group`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className={`font-mono text-lg ${currentTheme.colors.textPrimary}`}>{code.code}</h3>
          <p className={`text-sm ${currentTheme.colors.textMuted}`}>{code.description}</p>
        </div>
        <div className={`px-2 py-1 text-xs rounded-full border ${statusStyle} flex items-center space-x-1`}>
          <StatusIcon className="w-3 h-3" />
          <span className="capitalize">{code.status}</span>
        </div>
      </div>
      <div className="space-y-2">
        <p className={`${currentTheme.colors.textSecondary}`}>Type: {code.type}</p>
        <p className={`${currentTheme.colors.textSecondary}`}>Value: {code.type === 'percentage' ? `${code.value}%` : `$${code.value}`}</p>
        <p className={`${currentTheme.colors.textSecondary}`}>Usage: {code.usageCount} / {code.usageLimit}</p>
        <p className={`${currentTheme.colors.textSecondary}`}>Expires: {new Date(code.expiryDate).toLocaleDateString()}</p>
      </div>
      <div className="flex items-center justify-end space-x-2 mt-4 pt-4 border-t ${currentTheme.colors.borderLight}">
        <button className={`p-2 rounded-lg ${currentTheme.colors.glass} hover:${currentTheme.colors.surfaceHover}`}><EyeIcon className="w-4 h-4" /></button>
        <button className={`p-2 rounded-lg ${currentTheme.colors.glass} hover:${currentTheme.colors.surfaceHover}`}><PencilIcon className="w-4 h-4" /></button>
        <button className={`p-2 rounded-lg ${currentTheme.colors.glass} hover:${currentTheme.colors.surfaceHover} text-red-500`}><TrashIcon className="w-4 h-4" /></button>
      </div>
    </div>
  );
};

export default AdminPromo;