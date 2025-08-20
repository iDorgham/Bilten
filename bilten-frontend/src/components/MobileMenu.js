import React from 'react';
import { Link } from 'react-router-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';

const MobileMenu = ({ isOpen, onClose, isAuthenticated, isOrganizer }) => {
  if (!isOpen) return null;

  const handleLinkClick = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50" 
        onClick={onClose}
      />
      
      {/* Menu Panel */}
      <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="py-4">
          {/* Main Navigation */}
          <div className="px-4 space-y-2">
            <Link
              to="/events"
              onClick={handleLinkClick}
              className="block py-3 px-3 text-gray-700 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium rounded-md transition-colors"
            >
              Events
            </Link>
            <Link
              to="/news"
              onClick={handleLinkClick}
              className="block py-3 px-3 text-gray-700 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium rounded-md transition-colors"
            >
              News
            </Link>

            <Link
              to="/help"
              onClick={handleLinkClick}
              className="block py-3 px-3 text-gray-700 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium rounded-md transition-colors"
            >
              Help
            </Link>
          </div>
          
          <div className="border-t border-gray-200 mt-4 pt-4">
            {isAuthenticated ? (
              <div className="px-4 space-y-2">
                {isOrganizer && (
                  <>
                    <Link
                      to="/organizer/dashboard"
                      onClick={handleLinkClick}
                      className="block py-2 text-gray-700 hover:text-primary-600 font-medium"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/create-event"
                      onClick={handleLinkClick}
                      className="block py-2 text-gray-700 hover:text-primary-600 font-medium"
                    >
                      Create Event
                    </Link>
                  </>
                )}
                <Link
                  to="/my-tickets"
                  onClick={handleLinkClick}
                  className="block py-2 text-gray-700 hover:text-primary-600 font-medium"
                >
                  My Tickets
                </Link>
                <Link
                  to="/profile"
                  onClick={handleLinkClick}
                  className="block py-2 text-gray-700 hover:text-primary-600 font-medium"
                >
                  Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={handleLinkClick}
                  className="block py-2 text-gray-700 hover:text-primary-600 font-medium"
                >
                  Settings
                </Link>
                <Link
                  to="/faq"
                  onClick={handleLinkClick}
                  className="block py-2 text-gray-700 hover:text-primary-600 font-medium"
                >
                  FAQ
                </Link>
                <Link
                  to="/help"
                  onClick={handleLinkClick}
                  className="block py-2 text-gray-700 hover:text-primary-600 font-medium"
                >
                  Help & Support
                </Link>
              </div>
            ) : (
              <div className="px-4 space-y-2">
                <Link
                  to="/login"
                  onClick={handleLinkClick}
                  className="block py-2 text-gray-700 hover:text-primary-600 font-medium"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={handleLinkClick}
                  className="block w-full bg-primary-600 text-white text-center py-3 px-4 rounded-md font-medium hover:bg-primary-700 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;