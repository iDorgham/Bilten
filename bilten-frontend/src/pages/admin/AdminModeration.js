import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ClockIcon,
  DocumentTextIcon,
  PhotoIcon,
  FlagIcon
} from '@heroicons/react/24/outline';

const AdminModeration = () => {
  const { t } = useLanguage();
  const [pendingItems, setPendingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('events');
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    fetchPendingItems();
  }, [activeTab]);

  const fetchPendingItems = async () => {
    try {
      const response = await fetch(`/api/v1/admin/moderation/${activeTab}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPendingItems(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching pending items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModerationAction = async (itemId, action) => {
    try {
      const response = await fetch(`/api/v1/admin/moderation/${activeTab}/${itemId}/${action}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        fetchPendingItems();
        setSelectedItem(null);
      }
    } catch (error) {
      console.error(`Error ${action} item:`, error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-8"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Content Moderation
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review and approve pending content across the platform.
          </p>
        </div>
        
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
          <p className="text-center text-gray-600 dark:text-gray-400">
            Content moderation interface coming soon...
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminModeration;
