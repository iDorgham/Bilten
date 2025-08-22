import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAdminTheme } from '../../context/AdminThemeContext';
import {
  Squares2X2Icon,
  CalendarIcon,
  UsersIcon,
  CurrencyDollarIcon,
  GiftIcon,
  CogIcon,
  ChartBarIcon,
  EyeIcon,
  ClockIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  BanknotesIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon
} from '@heroicons/react/24/outline';

const AdminSidebar = ({ isOpen, onToggle, isCollapsed = false, onCollapseToggle }) => {
  const location = useLocation();
  const [expandedSection, setExpandedSection] = useState('dashboard');
  const { currentTheme, isDark } = useAdminTheme();

  const menuItems = [
    {
      section: 'dashboard',
      title: 'Dashboard',
      icon: Squares2X2Icon,
      path: '/admin/dashboard',
      items: [
        { title: 'Overview', path: '/admin/dashboard', icon: ChartBarIcon },
        { title: 'Analytics', path: '/admin/analytics', icon: ChartBarIcon },
        { title: 'Real-time', path: '/admin/realtime', icon: EyeIcon }
      ]
    },
    {
      section: 'events',
      title: 'Events',
      icon: CalendarIcon,
      path: '/admin/events',
      items: [
        { title: 'All Events', path: '/admin/events', icon: CalendarIcon },
        { title: 'Create Event', path: '/admin/events/create', icon: CogIcon },
        { title: 'Event Reviews', path: '/admin/events/reviews', icon: DocumentTextIcon }
      ]
    },
    {
      section: 'users',
      title: 'Users',
      icon: UsersIcon,
      path: '/admin/users',
      items: [
        { title: 'All Users', path: '/admin/users', icon: UsersIcon },
        { title: 'User Management', path: '/admin/users/manage', icon: UserGroupIcon },
        { title: 'Permissions', path: '/admin/users/permissions', icon: ShieldCheckIcon }
      ]
    },
    {
      section: 'financial',
      title: 'Financial',
      icon: CurrencyDollarIcon,
      path: '/admin/financial',
      items: [
        { title: 'Revenue', path: '/admin/financial/revenue', icon: BanknotesIcon },
        { title: 'Orders', path: '/admin/financial/orders', icon: DocumentTextIcon },
        { title: 'Refunds', path: '/admin/financial/refunds', icon: CurrencyDollarIcon }
      ]
    },
    {
      section: 'promo',
      title: 'Promo Codes',
      icon: GiftIcon,
      path: '/admin/promo-codes',
      items: [
        { title: 'All Codes', path: '/admin/promo-codes', icon: GiftIcon },
        { title: 'Create Code', path: '/admin/promo-codes/create', icon: CogIcon },
        { title: 'Analytics', path: '/admin/promo-codes/analytics', icon: ChartBarIcon }
      ]
    },
    {
      section: 'system',
      title: 'System',
      icon: CogIcon,
      path: '/admin/system',
      items: [
        { title: 'Configuration', path: '/admin/config', icon: CogIcon },
        { title: 'Security', path: '/admin/security', icon: ShieldCheckIcon },
        { title: 'Moderation', path: '/admin/moderation', icon: EyeIcon },
        { title: 'Team', path: '/admin/team', icon: UserGroupIcon }
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
        min-h-screen ${isCollapsed ? 'w-16' : 'w-64'} ${currentTheme.colors.sidebarBg} backdrop-blur-md
        border-r ${currentTheme.colors.border} relative flex flex-col transition-all duration-300
        ${isOpen ? 'block' : 'hidden lg:flex'}
      `}>
        {/* Header */}
        <div className={`${isCollapsed ? 'p-4' : 'p-6'} border-b ${currentTheme.colors.border}`}>
          {!isCollapsed && (
            <div className="text-center">
              <h1 className={`${currentTheme.colors.textPrimary} font-bold text-2xl`}>Bilten</h1>
              <p className={`${currentTheme.colors.textMuted} text-sm`}>Admin Panel</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {menuItems.map((section) => (
            <div key={section.section} className="space-y-1">
              <button
                onClick={() => isCollapsed ? null : toggleSection(section.section)}
                className={`
                  w-full flex items-center ${isCollapsed ? 'justify-center p-2' : 'justify-between p-3'} rounded-lg
                  transition-all duration-200 text-left
                  ${expandedSection === section.section && !isCollapsed
                    ? `${currentTheme.colors.glass} border ${currentTheme.colors.borderLight}` 
                    : currentTheme.colors.glassHover
                  }
                `}
                title={isCollapsed ? section.title : ''}
              >
                <div className={`flex items-center ${isCollapsed ? '' : 'space-x-3'}`}>
                  <section.icon className={`w-5 h-5 ${currentTheme.colors.textPrimary}`} />
                  {!isCollapsed && (
                    <span className={`${currentTheme.colors.textPrimary} font-medium`}>{section.title}</span>
                  )}
                </div>
                {!isCollapsed && (
                  <span className={`${currentTheme.colors.textMuted} transition-transform duration-200 ${
                    expandedSection === section.section ? 'rotate-180' : ''
                  }`}>
                    ▼
                  </span>
                )}
              </button>

              {expandedSection === section.section && !isCollapsed && (
                <div className="ml-8 space-y-1">
                  {section.items.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`
                        flex items-center space-x-2 p-2 rounded-lg text-sm transition-all duration-200
                        ${isActive(item.path)
                          ? `${currentTheme.colors.sidebarActive} border ${currentTheme.colors.borderAccent}`
                          : currentTheme.colors.sidebarItem
                        }
                      `}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="mt-auto">
          {/* Collapse Button */}
          <div className={`p-4 border-t ${currentTheme.colors.border}`}>
            <button
              onClick={onCollapseToggle}
              className={`w-full p-2 rounded-lg ${currentTheme.colors.glass} border ${currentTheme.colors.borderLight} ${currentTheme.colors.textMuted} ${currentTheme.colors.glassHover} transition-colors flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {!isCollapsed && (
                <span className={`${currentTheme.colors.textSecondary} text-sm font-medium`}>
                  {isCollapsed ? 'Expand' : 'Collapse Menu'}
                </span>
              )}
              {isCollapsed ? (
                <ChevronDoubleRightIcon className="w-4 h-4" />
              ) : (
                <ChevronDoubleLeftIcon className="w-4 h-4" />
              )}
            </button>
          </div>
          
          {/* Admin User */}
          <div className={`p-4 border-t ${currentTheme.colors.border}`}>
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
              <div className={`w-8 h-8 rounded-full ${currentTheme.colors.glass} border ${currentTheme.colors.borderLight} flex items-center justify-center`}>
                <span className={`${currentTheme.colors.textPrimary} text-sm`}>👤</span>
              </div>
              {!isCollapsed && (
                <div className="flex-1">
                  <p className={`${currentTheme.colors.textPrimary} text-sm font-medium`}>Admin User</p>
                  <p className={`${currentTheme.colors.textMuted} text-xs`}>admin@bilten.com</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
