import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAdminTheme } from '../../context/AdminThemeContext';
import AdminPageWrapper from '../../components/admin/AdminPageWrapper';
import StatCard from '../../components/admin/StatCard';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  FlagIcon
} from '@heroicons/react/24/outline';

const AdminModeration = () => {
  const { t } = useLanguage();
  const { currentTheme } = useAdminTheme();
  const [moderationData, setModerationData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModerationData();
  }, []);

  const fetchModerationData = async () => {
    try {
      setLoading(true);
      // Mock data
      const mockData = {
        pendingReviews: 0,
        approvedToday: 0,
        rejectedToday: 0,
        flaggedContent: 0,
      };
      setModerationData(mockData);
    } catch (error) {
      console.error('Error fetching moderation data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !moderationData) {
    return (
      <AdminPageWrapper>
        <div className="animate-pulse">
          <div className={`h-8 rounded-xl w-1/4 mb-8 ${currentTheme.colors.surface}`}></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => <div key={i} className={`h-32 rounded-xl ${currentTheme.colors.surface}`}></div>)}
          </div>
        </div>
      </AdminPageWrapper>
    );
  }

  return (
    <AdminPageWrapper>
      <div className="space-y-8">
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${currentTheme.colors.textPrimary} mb-2`}>Content Moderation</h1>
          <p className={`${currentTheme.colors.textMuted}`}>Review and approve pending content.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard title="Pending Reviews" value={moderationData.pendingReviews} icon={ClockIcon} color="text-yellow-500" bgColor="bg-yellow-500/10" />
          <StatCard title="Approved Today" value={moderationData.approvedToday} icon={CheckCircleIcon} color="text-green-500" bgColor="bg-green-500/10" />
          <StatCard title="Rejected Today" value={moderationData.rejectedToday} icon={XCircleIcon} color="text-red-500" bgColor="bg-red-500/10" />
          <StatCard title="Flagged Content" value={moderationData.flaggedContent} icon={FlagIcon} color="text-purple-500" bgColor="bg-purple-500/10" />
        </div>

        <div className={`${currentTheme.colors.surface} backdrop-blur-sm rounded-xl border ${currentTheme.colors.border}`}>
          <div className="p-6">
            <div className="text-center py-12">
              <DocumentTextIcon className={`h-16 w-16 ${currentTheme.colors.textMuted} mx-auto mb-4`} />
              <h3 className={`text-lg font-medium ${currentTheme.colors.textPrimary} mb-2`}>No Content to Review</h3>
              <p className={`${currentTheme.colors.textMuted}`}>The moderation queue is empty.</p>
            </div>
          </div>
        </div>
      </div>
    </AdminPageWrapper>
  );
};

export default AdminModeration;