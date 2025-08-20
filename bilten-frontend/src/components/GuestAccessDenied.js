import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LockClosedIcon, 
  UserPlusIcon, 
  ArrowRightIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useLanguage } from '../context/LanguageContext';

const GuestAccessDenied = ({ 
  title, 
  message, 
  showLoginButton = true, 
  showRegisterButton = true,
  customActions = null,
  onClose = null
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleLogin = () => {
    navigate('/login');
  };

  const handleRegister = () => {
    navigate('/register');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4 relative">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center relative">
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
        {/* Icon */}
        <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
          <LockClosedIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {title || t('guest.accessDenied')}
        </h2>

        {/* Message */}
        <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
          {message || t('guest.accessDeniedMessage')}
        </p>

        {/* Custom Actions */}
        {customActions && (
          <div className="mb-6">
            {customActions}
          </div>
        )}

        {/* Default Action Buttons */}
        {(showLoginButton || showRegisterButton) && (
          <div className="space-y-4">
            {showLoginButton && (
              <button
                onClick={handleLogin}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <UserPlusIcon className="w-5 h-5" />
                <span>{t('guest.loginToAccess')}</span>
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            )}

            {showRegisterButton && (
              <button
                onClick={handleRegister}
                className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-lg font-medium transition-colors"
              >
                {t('guest.createAccount')}
              </button>
            )}
          </div>
        )}

        {/* Back to Home */}
        <button
          onClick={() => {
            if (onClose) {
              onClose();
            } else {
              navigate('/');
            }
          }}
          className="mt-6 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
        >
          {t('guest.backToHome')}
        </button>
      </div>
    </div>
  );
};

export default GuestAccessDenied;
