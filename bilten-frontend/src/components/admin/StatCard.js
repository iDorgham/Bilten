import React from 'react';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import { useAdminTheme } from '../../context/AdminThemeContext';

const StatCard = ({ title, value, change, icon: Icon, color = 'text-blue-500', bgColor = 'bg-blue-500/10' }) => {
  const { currentTheme } = useAdminTheme();

  return (
    <div className={`relative overflow-hidden ${currentTheme.colors.surface} backdrop-blur-sm border ${currentTheme.colors.border} rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] group`}>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${bgColor} ${color}`}>
            <Icon className="w-6 h-6" />
          </div>
          {change && (
            <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              change > 0 
                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                : 'bg-red-500/10 text-red-500 border border-red-500/20'
            }`}>
              {change > 0 ? (
                <ArrowTrendingUpIcon className="w-3 h-3 mr-1" />
              ) : (
                <ArrowTrendingDownIcon className="w-3 h-3 mr-1" />
              )}
              {Math.abs(change)}%
            </div>
          )}
        </div>
        
        <div>
          <p className={`${currentTheme.colors.textMuted} text-sm font-medium mb-1`}>{title}</p>
          <p className={`${currentTheme.colors.textPrimary} text-3xl font-bold mb-2`}>{value}</p>
          {change && (
            <p className={`text-sm ${change > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {change > 0 ? '+' : ''}{change}% from last month
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
