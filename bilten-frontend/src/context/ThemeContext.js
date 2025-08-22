import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || 'light'; // Default to light theme for the main app
  });

  const themes = {
    dark: {
      name: 'Dark',
      colors: {
        primary: 'bg-gray-900',
        secondary: 'bg-gray-800',
        surface: 'bg-gray-800/50',
        surfaceHover: 'hover:bg-gray-700/50',
        glass: 'bg-white/5',
        glassHover: 'hover:bg-white/10',
        textPrimary: 'text-white',
        textSecondary: 'text-gray-300',
        textMuted: 'text-gray-400',
        border: 'border-gray-700',
        borderLight: 'border-gray-600',
        borderAccent: 'border-blue-500',
        success: 'text-green-400',
        warning: 'text-yellow-400',
        error: 'text-red-400',
        info: 'text-blue-400',
        button: 'bg-blue-600 hover:bg-blue-700',
        buttonSecondary: 'bg-gray-700 hover:bg-gray-600',
        input: 'bg-gray-800 border-gray-600 text-white placeholder-gray-400',
        linkHover: 'hover:text-white hover:bg-gray-700/30'
      }
    },
    light: {
      name: 'Light',
      colors: {
        primary: 'bg-white',
        secondary: 'bg-gray-50',
        surface: 'bg-white/80',
        surfaceHover: 'hover:bg-white/90',
        glass: 'bg-white/60',
        glassHover: 'hover:bg-white/80',
        textPrimary: 'text-gray-900',
        textSecondary: 'text-gray-700',
        textMuted: 'text-gray-500',
        border: 'border-gray-200',
        borderLight: 'border-gray-100',
        borderAccent: 'border-blue-500',
        success: 'text-green-600',
        warning: 'text-yellow-600',
        error: 'text-red-600',
        info: 'text-blue-600',
        button: 'bg-blue-600 hover:bg-blue-700',
        buttonSecondary: 'bg-gray-200 hover:bg-gray-300',
        input: 'bg-white border-gray-300 text-gray-900 placeholder-gray-500',
        linkHover: 'hover:text-gray-900 hover:bg-gray-100'
      }
    }
  };

  const currentTheme = themes[theme];

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const setThemeMode = (mode) => {
    if (themes[mode]) {
      setTheme(mode);
      localStorage.setItem('theme', mode);
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const value = {
    theme,
    currentTheme,
    themes,
    toggleTheme,
    setThemeMode,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    getColor: (colorKey) => currentTheme.colors[colorKey] || '',
    getBg: (variant = 'primary') => currentTheme.colors[variant] || currentTheme.colors.primary,
    getText: (variant = 'textPrimary') => currentTheme.colors[variant] || currentTheme.colors.textPrimary,
    getBorder: (variant = 'border') => currentTheme.colors[variant] || currentTheme.colors.border,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
