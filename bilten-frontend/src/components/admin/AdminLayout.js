import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

const AdminLayout = ({ children, title = 'Dashboard' }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-rgb(37 99 235) font-['Poppins']">
      {/* Animated background lines */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full">
          {/* Animated circles */}
          <div className="absolute top-20 left-20 w-32 h-32 border border-white/10 rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-32 w-24 h-24 border border-white/10 rounded-full animate-pulse delay-1000"></div>
          <div className="absolute bottom-32 left-32 w-40 h-40 border border-white/10 rounded-full animate-pulse delay-2000"></div>
          <div className="absolute bottom-20 right-20 w-28 h-28 border border-white/10 rounded-full animate-pulse delay-3000"></div>
          
          {/* Animated lines */}
          <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
          <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse delay-1000"></div>
          <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/15 to-transparent animate-pulse delay-2000"></div>
        </div>
      </div>

      {/* Sidebar */}
      <AdminSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

      {/* Main content */}
      <div className="lg:ml-64 min-h-screen">
        {/* Header */}
        <AdminHeader onMenuToggle={toggleSidebar} title={title} />

        {/* Content area */}
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile menu button overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
};

export default AdminLayout;
