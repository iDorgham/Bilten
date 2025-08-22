import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { AdminThemeProvider, useAdminTheme } from '../../context/AdminThemeContext';

const AdminLayoutContent = ({ children, title = 'Dashboard' }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { currentTheme, isDark } = useAdminTheme();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div 
      className={`min-h-screen ${currentTheme.colors.primary} flex transition-colors duration-300`} 
      style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
    >
      {/* Enhanced animated background with modern patterns */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full">
          {/* Modern gradient overlays */}
          <div className={`absolute inset-0 bg-gradient-to-br ${
            isDark 
              ? 'from-slate-900/50 via-slate-800/30 to-slate-900/50' 
              : 'from-slate-50/50 via-white/30 to-slate-50/50'
          }`}></div>
          
          {/* Animated geometric shapes */}
          <div className={`absolute top-20 left-20 w-32 h-32 border ${
            isDark ? 'border-slate-600/20' : 'border-slate-300/20'
          } rounded-full animate-pulse`}></div>
          <div className={`absolute top-40 right-32 w-24 h-24 border ${
            isDark ? 'border-slate-600/20' : 'border-slate-300/20'
          } rounded-full animate-pulse delay-1000`}></div>
          <div className={`absolute bottom-32 left-32 w-40 h-40 border ${
            isDark ? 'border-slate-600/20' : 'border-slate-300/20'
          } rounded-full animate-pulse delay-2000`}></div>
          <div className={`absolute bottom-20 right-20 w-28 h-28 border ${
            isDark ? 'border-slate-600/20' : 'border-slate-300/20'
          } rounded-full animate-pulse delay-3000`}></div>
          
          {/* Subtle grid pattern */}
          <div className={`absolute inset-0 bg-[linear-gradient(${
            isDark ? 'rgba(148,163,184,0.03)' : 'rgba(148,163,184,0.05)'
          }_1px,transparent_1px),linear-gradient(90deg,${
            isDark ? 'rgba(148,163,184,0.03)' : 'rgba(148,163,184,0.05)'
          }_1px,transparent_1px)] bg-[size:20px_20px]`}></div>
          
          {/* Animated lines with modern styling */}
          <div className={`absolute top-1/4 left-0 w-full h-px ${
            isDark 
              ? 'bg-gradient-to-r from-transparent via-slate-600/20 to-transparent' 
              : 'bg-gradient-to-r from-transparent via-slate-300/30 to-transparent'
          } animate-pulse`}></div>
          <div className={`absolute top-1/2 left-0 w-full h-px ${
            isDark 
              ? 'bg-gradient-to-r from-transparent via-slate-600/10 to-transparent' 
              : 'bg-gradient-to-r from-transparent via-slate-300/20 to-transparent'
          } animate-pulse delay-1000`}></div>
          <div className={`absolute top-3/4 left-0 w-full h-px ${
            isDark 
              ? 'bg-gradient-to-r from-transparent via-slate-600/15 to-transparent' 
              : 'bg-gradient-to-r from-transparent via-slate-300/25 to-transparent'
          } animate-pulse delay-2000`}></div>
        </div>
      </div>

      {/* Sidebar with enhanced styling */}
      <div className={`hidden lg:block ${sidebarCollapsed ? 'w-16' : 'w-64'} flex-shrink-0 transition-all duration-300 ease-in-out`}>
        <AdminSidebar 
          isOpen={sidebarOpen} 
          onToggle={toggleSidebar}
          isCollapsed={sidebarCollapsed}
          onCollapseToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        <AdminSidebar 
          isOpen={sidebarOpen} 
          onToggle={toggleSidebar}
          isCollapsed={false}
          onCollapseToggle={() => {}}
        />
      </div>

      {/* Main content with enhanced styling */}
      <div className="flex-1 min-h-screen relative">
        {/* Header with modern styling */}
        <AdminHeader onMenuToggle={toggleSidebar} title={title} />

        {/* Content area with enhanced background */}
        <main className={`relative p-6 ${currentTheme.colors.secondary} min-h-screen transition-colors duration-300`}>
          {/* Content wrapper with max width and enhanced styling */}
          <div className="max-w-7xl mx-auto">
            {/* Subtle content background */}
            <div className={`relative ${currentTheme.colors.surface} rounded-2xl p-8 ${currentTheme.colors.shadow} transition-all duration-300`}>
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Enhanced mobile menu overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
};

// Wrapper component that provides theme context
const AdminLayout = ({ children, title = 'Dashboard' }) => {
  return (
    <AdminThemeProvider>
      <AdminLayoutContent title={title}>
        {children}
      </AdminLayoutContent>
    </AdminThemeProvider>
  );
};

export default AdminLayout;
