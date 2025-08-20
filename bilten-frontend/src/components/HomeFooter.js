import React from 'react';
import { Link } from 'react-router-dom';
import LanguageDropdown from './LanguageDropdown';
import ThemeToggle from './ThemeToggle';
import { useLanguage } from '../context/LanguageContext';

const HomeFooter = () => {
  const currentYear = new Date().getFullYear();
  const { t } = useLanguage();

  return (
    <div className="fixed bottom-4 left-0 right-0 py-2 px-6 z-50">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-1 md:space-y-0">
        {/* Left side - Bilten Logo and Copyright */}
        <div className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-4">
          <Link to="/" className="text-lg brand-bilten text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
            Bilten
          </Link>
          <span className="text-gray-600 dark:text-gray-400 text-xs">
            © {currentYear} Bilten. {t('footer.allRightsReserved')}
          </span>
        </div>
        
        {/* Right side - Theme Toggle and Language Selector */}
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <ThemeToggle />
          <LanguageDropdown />
        </div>
      </div>
    </div>
  );
};

export default HomeFooter;
