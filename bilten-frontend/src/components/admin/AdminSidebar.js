import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const AdminSidebar = ({ isOpen, onToggle }) => {
  const location = useLocation();
  const [expandedSection, setExpandedSection] = useState('dashboard');

  const menuItems = [
    {
      section: 'dashboard',
      title: 'Dashboard',
      icon: '📊',
      path: '/admin/dashboard',
      items: [
        { title: 'Overview', path: '/admin/dashboard' },
        { title: 'Analytics', path: '/admin/analytics' },
        { title: 'Real-time', path: '/admin/realtime' }
      ]
    },
    {
      section: 'events',
      title: 'Events',
      icon: '🎫',
      path: '/admin/events',
      items: [
        { title: 'All Events', path: '/admin/events' },
        { title: 'Create Event', path: '/admin/events/create' },
        { title: 'Event Reviews', path: '/admin/events/reviews' }
      ]
    },
    {
      section: 'users',
      title: 'Users',
      icon: '👥',
      path: '/admin/users',
      items: [
        { title: 'All Users', path: '/admin/users' },
        { title: 'User Management', path: '/admin/users/manage' },
        { title: 'Permissions', path: '/admin/users/permissions' }
      ]
    },
    {
      section: 'financial',
      title: 'Financial',
      icon: '💰',
      path: '/admin/financial',
      items: [
        { title: 'Revenue', path: '/admin/financial/revenue' },
        { title: 'Orders', path: '/admin/financial/orders' },
        { title: 'Refunds', path: '/admin/financial/refunds' }
      ]
    },
    {
      section: 'promo',
      title: 'Promo Codes',
      icon: '🎁',
      path: '/admin/promo-codes',
      items: [
        { title: 'All Codes', path: '/admin/promo-codes' },
        { title: 'Create Code', path: '/admin/promo-codes/create' },
        { title: 'Analytics', path: '/admin/promo-codes/analytics' }
      ]
    },
    {
      section: 'system',
      title: 'System',
      icon: '⚙️',
      path: '/admin/system',
      items: [
        { title: 'Configuration', path: '/admin/config' },
        { title: 'Security', path: '/admin/security' },
        { title: 'Moderation', path: '/admin/moderation' },
        { title: 'Team', path: '/admin/team' }
      ]
    }
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-64 bg-rgb(37 99 235)/90 backdrop-blur-md
        border-r border-white/10 z-50 transform transition-transform duration-300
        lg:translate-x-0 lg:static lg:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
              <span className="text-white text-xl">👑</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">Admin Panel</h1>
              <p className="text-white/60 text-xs">Bilten Management</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {menuItems.map((section) => (
            <div key={section.section} className="space-y-1">
              <button
                onClick={() => toggleSection(section.section)}
                className={`
                  w-full flex items-center justify-between p-3 rounded-lg
                  transition-all duration-200 text-left
                  ${expandedSection === section.section 
                    ? 'bg-white/10 border border-white/20' 
                    : 'hover:bg-white/5'
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-white text-lg">{section.icon}</span>
                  <span className="text-white font-medium">{section.title}</span>
                </div>
                <span className={`text-white/60 transition-transform duration-200 ${
                  expandedSection === section.section ? 'rotate-180' : ''
                }`}>
                  ▼
                </span>
              </button>

              {expandedSection === section.section && (
                <div className="ml-8 space-y-1">
                  {section.items.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`
                        block p-2 rounded-lg text-sm transition-all duration-200
                        ${isActive(item.path)
                          ? 'bg-white/15 text-white border border-white/20'
                          : 'text-white/70 hover:text-white hover:bg-white/5'
                        }
                      `}
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
              <span className="text-white text-sm">👤</span>
            </div>
            <div className="flex-1">
              <p className="text-white text-sm font-medium">Admin User</p>
              <p className="text-white/60 text-xs">admin@bilten.com</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
