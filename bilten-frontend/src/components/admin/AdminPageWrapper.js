import React from 'react';
import { useAdminTheme } from '../../context/AdminThemeContext';

const AdminPageWrapper = ({ children }) => {
  const { currentTheme } = useAdminTheme();

  return (
    <div className={`w-full h-full p-4 md:p-6 lg:p-8 ${currentTheme.colors.background} text-sm ${currentTheme.colors.textPrimary}`}>
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </div>
  );
};

export default AdminPageWrapper;
