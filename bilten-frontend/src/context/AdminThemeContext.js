import React, { createContext, useContext, useState, useEffect } from 'react';

const AdminThemeContext = createContext();

export const useAdminTheme = () => {
  const context = useContext(AdminThemeContext);
  if (!context) {
    throw new Error('useAdminTheme must be used within an AdminThemeProvider');
  }
  return context;
};

export const AdminThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Check localStorage for saved admin theme preference
    const saved = localStorage.getItem('admin-theme');
    return saved || 'dark'; // Default to dark theme for admin
  });

  // Admin color schemes - Enhanced with Untitled UI inspired colors
  const themes = {
    dark: {
      name: 'Dark',
      colors: {
        // Background colors - Sophisticated dark palette
        primary: 'bg-slate-900',
        secondary: 'bg-slate-800', 
        accent: 'bg-blue-600',
        
        // Card/Surface colors - Modern glass morphism
        surface: 'bg-slate-800/60 backdrop-blur-xl',
        surfaceHover: 'hover:bg-slate-700/60',
        glass: 'bg-white/5 backdrop-blur-sm',
        glassHover: 'hover:bg-white/10',
        
        // Text colors - High contrast for readability
        textPrimary: 'text-slate-100',
        textSecondary: 'text-slate-300',
        textMuted: 'text-slate-400',
        
        // Border colors - Subtle borders
        border: 'border-slate-700/50',
        borderLight: 'border-slate-600/50',
        borderAccent: 'border-blue-500/50',
        
        // State colors - Vibrant but not overwhelming
        success: 'text-emerald-400',
        warning: 'text-amber-400',
        error: 'text-red-400',
        info: 'text-blue-400',
        
        // Interactive elements - Modern styling
        button: 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/25',
        buttonSecondary: 'bg-slate-700 hover:bg-slate-600',
        input: 'bg-slate-800/80 border-slate-600/50 text-slate-100 placeholder-slate-400 backdrop-blur-sm',
        
        // Sidebar specific - Enhanced navigation
        sidebarBg: 'bg-slate-900/95 backdrop-blur-xl',
        sidebarItem: 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/60',
        sidebarActive: 'text-slate-100 bg-slate-800/80 border-blue-500/50',
        
        // Header specific - Professional header
        headerBg: 'bg-slate-900/90 backdrop-blur-xl',
        headerText: 'text-slate-100',
        headerBorder: 'border-slate-700/50',
        
        // Dropdown specific - Modern dropdowns
        dropdown: 'bg-slate-800/95 backdrop-blur-xl border border-slate-700/50',
        
        // Avatar specific - Subtle avatars
        avatar: 'bg-slate-700/50',
        
        // Danger/Error actions - Clear error states
        danger: 'text-red-400',
        
        // Link hover states - Smooth interactions
        linkHover: 'hover:text-slate-100 hover:bg-slate-700/30',
        
        // Enhanced colors for modern UI
        cardGradient: 'bg-gradient-to-br from-slate-800/60 to-slate-900/60',
        cardHover: 'hover:bg-gradient-to-br hover:from-slate-700/60 hover:to-slate-800/60',
        accentGradient: 'bg-gradient-to-r from-blue-600 to-purple-600',
        successGradient: 'bg-gradient-to-r from-emerald-500 to-teal-500',
        warningGradient: 'bg-gradient-to-r from-amber-500 to-orange-500',
        errorGradient: 'bg-gradient-to-r from-red-500 to-pink-500',
        
        // Shadow effects
        shadow: 'shadow-xl shadow-black/20',
        shadowHover: 'hover:shadow-2xl hover:shadow-black/30',
        glow: 'shadow-lg shadow-blue-500/25',
        glowHover: 'hover:shadow-xl hover:shadow-blue-500/30'
      }
    },
    light: {
      name: 'Light',
      colors: {
        // Background colors - Clean light palette
        primary: 'bg-slate-50',
        secondary: 'bg-white',
        accent: 'bg-blue-600',
        
        // Card/Surface colors - Subtle shadows
        surface: 'bg-white/80 backdrop-blur-sm shadow-sm',
        surfaceHover: 'hover:bg-white/90',
        glass: 'bg-white/60 backdrop-blur-sm',
        glassHover: 'hover:bg-white/80',
        
        // Text colors - High contrast
        textPrimary: 'text-slate-900',
        textSecondary: 'text-slate-700',
        textMuted: 'text-slate-500',
        
        // Border colors - Subtle borders
        border: 'border-slate-200',
        borderLight: 'border-slate-100',
        borderAccent: 'border-blue-500',
        
        // State colors - Vibrant but accessible
        success: 'text-emerald-600',
        warning: 'text-amber-600',
        error: 'text-red-600',
        info: 'text-blue-600',
        
        // Interactive elements - Clean styling
        button: 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/25',
        buttonSecondary: 'bg-slate-200 hover:bg-slate-300',
        input: 'bg-white border-slate-300 text-slate-900 placeholder-slate-500',
        
        // Sidebar specific - Clean navigation
        sidebarBg: 'bg-white/95 backdrop-blur-sm',
        sidebarItem: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
        sidebarActive: 'text-blue-600 bg-blue-50 border-blue-500',
        
        // Header specific - Clean header
        headerBg: 'bg-white/90 backdrop-blur-sm',
        headerText: 'text-slate-900',
        headerBorder: 'border-slate-200',
        
        // Dropdown specific - Clean dropdowns
        dropdown: 'bg-white/95 backdrop-blur-sm border border-slate-200',
        
        // Avatar specific - Clean avatars
        avatar: 'bg-slate-100',
        
        // Danger/Error actions - Clear error states
        danger: 'text-red-600',
        
        // Link hover states - Smooth interactions
        linkHover: 'hover:text-slate-900 hover:bg-slate-100',
        
        // Enhanced colors for modern UI
        cardGradient: 'bg-gradient-to-br from-white/80 to-slate-50/80',
        cardHover: 'hover:bg-gradient-to-br hover:from-white/90 hover:to-slate-100/90',
        accentGradient: 'bg-gradient-to-r from-blue-600 to-purple-600',
        successGradient: 'bg-gradient-to-r from-emerald-500 to-teal-500',
        warningGradient: 'bg-gradient-to-r from-amber-500 to-orange-500',
        errorGradient: 'bg-gradient-to-r from-red-500 to-pink-500',
        
        // Shadow effects
        shadow: 'shadow-lg shadow-slate-200/50',
        shadowHover: 'hover:shadow-xl hover:shadow-slate-300/50',
        glow: 'shadow-lg shadow-blue-500/25',
        glowHover: 'hover:shadow-xl hover:shadow-blue-500/30'
      }
    }
  };

  const currentTheme = themes[theme];

  // Toggle between themes
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('admin-theme', newTheme);
  };

  // Set specific theme
  const setThemeMode = (mode) => {
    if (themes[mode]) {
      setTheme(mode);
      localStorage.setItem('admin-theme', mode);
    }
  };

  // Apply theme to document for CSS variables and dark class
  useEffect(() => {
    const root = document.documentElement;
    
    // Set CSS custom properties for admin theme
    if (theme === 'dark') {
      root.style.setProperty('--admin-bg-primary', '#0f172a'); // slate-900
      root.style.setProperty('--admin-bg-secondary', '#1e293b'); // slate-800
      root.style.setProperty('--admin-text-primary', '#f1f5f9'); // slate-100
      root.style.setProperty('--admin-text-secondary', '#cbd5e1'); // slate-300
      root.style.setProperty('--admin-border', '#334155'); // slate-700
      root.style.setProperty('--admin-accent', '#3b82f6'); // blue-500
      root.style.setProperty('--admin-success', '#34d399'); // emerald-400
      root.style.setProperty('--admin-warning', '#fbbf24'); // amber-400
      root.style.setProperty('--admin-error', '#f87171'); // red-400
      root.classList.add('dark');
    } else {
      root.style.setProperty('--admin-bg-primary', '#f8fafc'); // slate-50
      root.style.setProperty('--admin-bg-secondary', '#ffffff'); // white
      root.style.setProperty('--admin-text-primary', '#0f172a'); // slate-900
      root.style.setProperty('--admin-text-secondary', '#334155'); // slate-700
      root.style.setProperty('--admin-border', '#e2e8f0'); // slate-200
      root.style.setProperty('--admin-accent', '#3b82f6'); // blue-500
      root.style.setProperty('--admin-success', '#059669'); // emerald-600
      root.style.setProperty('--admin-warning', '#d97706'); // amber-600
      root.style.setProperty('--admin-error', '#dc2626'); // red-600
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
    
    // Utility functions for easy access to colors
    getColor: (colorKey) => currentTheme.colors[colorKey] || '',
    getBg: (variant = 'primary') => currentTheme.colors[variant] || currentTheme.colors.primary,
    getText: (variant = 'textPrimary') => currentTheme.colors[variant] || currentTheme.colors.textPrimary,
    getBorder: (variant = 'border') => currentTheme.colors[variant] || currentTheme.colors.border,
    
    // Enhanced utility functions
    getGradient: (type = 'accent') => currentTheme.colors[`${type}Gradient`] || currentTheme.colors.accentGradient,
    getShadow: (type = 'shadow') => currentTheme.colors[type] || currentTheme.colors.shadow,
    getGlow: (type = 'glow') => currentTheme.colors[type] || currentTheme.colors.glow,
  };

  return (
    <AdminThemeContext.Provider value={value}>
      {children}
    </AdminThemeContext.Provider>
  );
};

export default AdminThemeContext;
