/**
 * Centralized Theme System for Bilten
 * This file contains all design tokens and utility functions for consistent styling
 */

// Color Palette
export const colors = {
  // Primary Brand Colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe', 
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  
  // Semantic Colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
  },
  
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
  },
  
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
  },
  
  // Neutral Colors
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  }
};

// Typography Scale
export const typography = {
  fontSizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
  },
  
  fontWeights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  
  lineHeights: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  }
};

// Spacing Scale
export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
};

// Border Radius
export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  full: '9999px',
};

// Shadows
export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
};

// Component Styles
export const components = {
  // Page Layouts
  page: {
    light: 'min-h-screen bg-gradient-to-br from-gray-50 to-gray-100',
    dark: 'min-h-screen bg-gradient-to-br from-gray-900 to-gray-800',
    combined: 'min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800'
  },
  
  // Cards
  card: {
    light: 'bg-white rounded-xl shadow-lg border border-gray-200',
    dark: 'bg-gray-700 rounded-xl shadow-lg border border-gray-600',
    combined: 'bg-white dark:bg-gray-700 rounded-xl shadow-lg border border-gray-200 dark:border-gray-600',
    hover: 'hover:shadow-xl transition-shadow'
  },
  
  // Buttons
  button: {
    primary: {
      light: 'bg-blue-600 hover:bg-blue-700 text-white',
      dark: 'bg-blue-600 hover:bg-blue-700 text-white',
      combined: 'bg-primary-600 hover:bg-primary-700 text-white',
      focus: 'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
    },
    secondary: {
      light: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
      dark: 'bg-gray-700 hover:bg-gray-600 text-gray-300',
      combined: 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
    },
    outline: {
      light: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700',
      dark: 'border border-gray-600 bg-gray-800 hover:bg-gray-700 text-gray-300',
      combined: 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  },
  
  // Form Elements
  input: {
    light: 'border border-gray-300 bg-white text-gray-900 placeholder-gray-500',
    dark: 'border border-gray-600 bg-gray-800 text-white placeholder-gray-400',
    combined: 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400',
    focus: 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
  },
  
  // Text Colors
  text: {
    primary: {
      light: 'text-gray-900',
      dark: 'text-white',
      combined: 'text-gray-900 dark:text-white'
    },
    secondary: {
      light: 'text-gray-600',
      dark: 'text-gray-300',
      combined: 'text-gray-600 dark:text-gray-300'
    },
    muted: {
      light: 'text-gray-500',
      dark: 'text-gray-400',
      combined: 'text-gray-500 dark:text-gray-400'
    },
    accent: {
      light: 'text-blue-600',
      dark: 'text-blue-400',
      combined: 'text-primary-600 dark:text-primary-400'
    }
  },
  
  // Loading States
  loading: {
    spinner: 'animate-spin rounded-full border-b-2 border-primary-600',
    skeleton: 'animate-pulse bg-gray-200 dark:bg-gray-700 rounded'
  },
  
  // Error States
  error: {
    background: 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-200'
  },
  
  // Success States
  success: {
    background: 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800',
    text: 'text-green-800 dark:text-green-200'
  }
};

// Utility Functions
export const getThemeClasses = (component, variant = 'combined') => {
  const componentStyles = components[component];
  if (!componentStyles) return '';
  
  if (typeof componentStyles === 'string') return componentStyles;
  if (typeof componentStyles === 'object' && componentStyles[variant]) {
    return componentStyles[variant];
  }
  
  return componentStyles.combined || '';
};

// Responsive Breakpoints
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// Animation Durations
export const animations = {
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
};

// Z-Index Scale
export const zIndex = {
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modal: 40,
  popover: 50,
  tooltip: 60,
};

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  components,
  getThemeClasses,
  breakpoints,
  animations,
  zIndex
};