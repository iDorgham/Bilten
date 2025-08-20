import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const AdminHeader = ({ onMenuToggle, title = 'Dashboard' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, message: 'New event created', time: '2 min ago', type: 'info' },
    { id: 2, message: 'Payment received', time: '5 min ago', type: 'success' },
    { id: 3, message: 'User registration', time: '10 min ago', type: 'info' }
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    // Implement search functionality
    console.log('Searching for:', searchQuery);
  };

  return (
    <header className="bg-rgb(37 99 235)/90 backdrop-blur-md border-b border-white/10 sticky top-0 z-30">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="hidden lg:block">
            <h1 className="text-white text-xl font-bold">{title}</h1>
            <p className="text-white/60 text-sm">Admin Panel</p>
          </div>
        </div>

        {/* Center - Search */}
        <div className="flex-1 max-w-md mx-4">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search events, users, orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 rounded-lg bg-white/10 border border-white/20 
                       text-white placeholder-white/50 focus:outline-none focus:ring-2 
                       focus:ring-white/20 focus:border-white/30 transition-all"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </form>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.5 3.75a6 6 0 00-6 6v3.75l-2.25 2.25V19.5h12.5V15.75L15.75 13.5V9.75a6 6 0 00-6-6z" />
              </svg>
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>

            {/* Notifications dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-lg z-50">
                <div className="p-4 border-b border-white/10">
                  <h3 className="text-white font-semibold">Notifications</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="p-4 border-b border-white/5 hover:bg-white/5">
                      <div className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          notification.type === 'success' ? 'bg-green-400' : 'bg-blue-400'
                        }`}></div>
                        <div className="flex-1">
                          <p className="text-white text-sm">{notification.message}</p>
                          <p className="text-white/60 text-xs mt-1">{notification.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-white/10">
                  <Link to="/admin/notifications" className="text-white/80 hover:text-white text-sm">
                    View all notifications
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center">
                <span className="text-white text-sm font-medium">A</span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-white text-sm font-medium">Admin User</p>
                <p className="text-white/60 text-xs">admin@bilten.com</p>
              </div>
              <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* User dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-lg z-50">
                <div className="p-4 border-b border-white/10">
                  <p className="text-white font-medium">Admin User</p>
                  <p className="text-white/60 text-sm">admin@bilten.com</p>
                </div>
                <div className="p-2">
                  <Link
                    to="/admin/profile"
                    className="block px-3 py-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 text-sm transition-colors"
                  >
                    Profile Settings
                  </Link>
                  <Link
                    to="/admin/security"
                    className="block px-3 py-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 text-sm transition-colors"
                  >
                    Security
                  </Link>
                  <Link
                    to="/admin/preferences"
                    className="block px-3 py-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 text-sm transition-colors"
                  >
                    Preferences
                  </Link>
                </div>
                <div className="p-2 border-t border-white/10">
                  <button className="w-full text-left px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 text-sm transition-colors">
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(showUserMenu || showNotifications) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowUserMenu(false);
            setShowNotifications(false);
          }}
        />
      )}
    </header>
  );
};

export default AdminHeader;
