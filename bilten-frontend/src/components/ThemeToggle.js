import React, { useState, useEffect } from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../context/LanguageContext';

const ThemeToggle = ({ className = "" }) => {
  const { t } = useLanguage();
  const [isDark, setIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (_) {
      return false;
    }
  });

  // Apply theme on mount and when toggled
  useEffect(() => {
    try {
      if (isDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    } catch (_) {
      // ignore
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((v) => !v);

  return (
    <button
      onClick={toggleTheme}
      className={`p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/10 transition-colors ${className}`}
      title={isDark ? t('common.switchToLight') : t('common.switchToDark')}
    >
      {isDark ? (
        <SunIcon className="w-5 h-5" />
      ) : (
        <MoonIcon className="w-5 h-5" />
      )}
    </button>
  );
};

export default ThemeToggle;
