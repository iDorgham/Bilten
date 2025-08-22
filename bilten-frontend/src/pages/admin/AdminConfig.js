import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAdminTheme } from '../../context/AdminThemeContext';
import AdminPageWrapper from '../../components/admin/AdminPageWrapper';
import {
  Cog6ToothIcon,
  WrenchScrewdriverIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  BellIcon
} from '@heroicons/react/24/outline';

const AdminConfig = () => {
  const { t } = useLanguage();
  const { currentTheme } = useAdminTheme();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      // Mock data for now
      const mockData = {
        general: { platformName: 'Bilten', defaultLanguage: 'en', timeZone: 'UTC', currency: 'USD' },
        security: { twoFactorAuth: true, sessionTimeout: 30, passwordPolicy: 12 },
        features: { realtimeAnalytics: true, emailNotifications: true, contentModeration: false },
        notifications: { systemAlerts: true, securityNotifications: true },
        integrations: { stripe: true, emailService: true, googleAnalytics: false },
      };
      setConfig(mockData);
    } catch (error) {
      console.error('Error fetching config:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (section, data) => {
    setSaving(true);
    console.log(`Saving ${section}`, data);
    // Mock saving
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
  };

  const tabs = [
    { id: 'general', name: 'General', icon: Cog6ToothIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'features', name: 'Features', icon: WrenchScrewdriverIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'integrations', name: 'Integrations', icon: GlobeAltIcon }
  ];

  const SystemStatusCard = ({ title, status, description, icon: Icon }) => (
    <div className={`${currentTheme.colors.surface} backdrop-blur-sm rounded-xl p-6 ${currentTheme.colors.border} border`}>
      <div className="flex items-center space-x-4">
        <div className={`p-3 rounded-lg ${status === 'healthy' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h3 className={`text-lg font-semibold ${currentTheme.colors.textPrimary}`}>{title}</h3>
          <p className={`text-sm ${currentTheme.colors.textMuted}`}>{description}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
          status === 'healthy' 
            ? 'bg-green-500/10 text-green-500'
            : 'bg-red-500/10 text-red-500'
        }`}>
          {status}
        </div>
      </div>
    </div>
  );

  if (loading || !config) {
    return (
      <AdminPageWrapper>
        <div className="animate-pulse">
          <div className="h-8 bg-white/10 rounded-xl w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-white/10 rounded-xl"></div>)}
          </div>
          <div className="h-96 bg-white/10 rounded-xl"></div>
        </div>
      </AdminPageWrapper>
    );
  }

  return (
    <AdminPageWrapper>
      <div className="space-y-8">
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${currentTheme.colors.textPrimary} mb-2`}>System Configuration</h1>
          <p className={`${currentTheme.colors.textMuted}`}>Manage platform settings, features, and system parameters.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <SystemStatusCard title="Database" status="healthy" description="All connections operational" icon={CheckCircleIcon} />
          <SystemStatusCard title="API Services" status="healthy" description="Endpoints responding normally" icon={CheckCircleIcon} />
          <SystemStatusCard title="File Storage" status="healthy" description="Storage systems working" icon={CheckCircleIcon} />
        </div>

        <div className={`${currentTheme.colors.surface} backdrop-blur-sm rounded-xl border ${currentTheme.colors.border}`}>
          <div className={`border-b ${currentTheme.colors.border}`}>
            <nav className="flex space-x-8 px-6">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? `border-blue-500 ${currentTheme.colors.info}`
                      : `border-transparent ${currentTheme.colors.textMuted} hover:${currentTheme.colors.textPrimary}`
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Render tab content based on activeTab */}
          </div>

          <div className={`mt-8 pt-6 border-t ${currentTheme.colors.border} p-6`}>
            <button
              onClick={() => saveConfig(activeTab, {})}
              disabled={saving}
              className={`px-6 py-2 text-white rounded-xl transition-colors disabled:opacity-50 ${currentTheme.colors.button}`}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </AdminPageWrapper>
  );
};

export default AdminConfig;