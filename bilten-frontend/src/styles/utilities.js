/**
 * Style Utilities for Bilten
 * Helper functions and utility classes for consistent styling
 */

import { components } from './theme';

// Class name utility function (similar to clsx/classnames)
export const cn = (...classes) => {
  return classes
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
};

// Theme-aware class builder
export const themeClass = (baseClasses, lightClasses = '', darkClasses = '') => {
  if (!lightClasses && !darkClasses) return baseClasses;
  
  const light = lightClasses ? ` ${lightClasses}` : '';
  const dark = darkClasses ? ` dark:${darkClasses}` : '';
  
  return `${baseClasses}${light}${dark}`;
};

// Common component class builders
export const pageClasses = () => components.page.combined;

export const cardClasses = (withHover = true) => {
  return cn(
    components.card.combined,
    withHover && components.card.hover
  );
};

export const buttonClasses = (variant = 'primary', size = 'md') => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-200';
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  };
  
  const variantClasses = {
    primary: cn(components.button.primary.combined, components.button.primary.focus),
    secondary: components.button.secondary.combined,
    outline: components.button.outline.combined,
    ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
  };
  
  return cn(
    baseClasses,
    sizeClasses[size],
    variantClasses[variant]
  );
};

export const inputClasses = (hasError = false) => {
  const baseClasses = 'block w-full rounded-lg px-3 py-2 text-sm transition-colors duration-200';
  const normalClasses = cn(components.input.combined, components.input.focus);
  const errorClasses = 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500';
  
  return cn(
    baseClasses,
    hasError ? errorClasses : normalClasses
  );
};

export const textClasses = (variant = 'primary') => {
  return components.text[variant]?.combined || components.text.primary.combined;
};

export const loadingSpinnerClasses = (size = 'md') => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };
  
  return cn(
    components.loading.spinner,
    sizeClasses[size]
  );
};

export const errorClasses = () => {
  return cn(
    components.error.background,
    'rounded-lg p-4'
  );
};

export const errorTextClasses = () => components.error.text;

export const successClasses = () => {
  return cn(
    components.success.background,
    'rounded-lg p-4'
  );
};

export const successTextClasses = () => components.success.text;

// Icon color utilities
export const iconClasses = (variant = 'accent') => {
  const variants = {
    accent: 'text-primary-600 dark:text-primary-400',
    muted: 'text-gray-500 dark:text-gray-400',
    primary: 'text-gray-900 dark:text-white',
    secondary: 'text-gray-600 dark:text-gray-300'
  };
  
  return variants[variant] || variants.accent;
};

// Layout utilities
export const containerClasses = (size = 'default') => {
  const sizes = {
    sm: 'max-w-2xl',
    default: 'max-w-7xl',
    lg: 'max-w-screen-xl',
    full: 'max-w-full'
  };
  
  return cn(
    sizes[size],
    'mx-auto px-4 sm:px-6 lg:px-8'
  );
};

export const sectionClasses = (spacing = 'default') => {
  const spacings = {
    sm: 'py-8',
    default: 'py-12',
    lg: 'py-16',
    xl: 'py-24'
  };
  
  return spacings[spacing];
};

// Form validation utilities
export const getValidationClasses = (field, errors, touched) => {
  const hasError = errors[field] && touched[field];
  return {
    input: inputClasses(hasError),
    error: hasError ? 'text-red-600 dark:text-red-400 text-sm mt-1' : 'hidden'
  };
};

// Responsive utilities
export const responsiveClasses = (mobile, tablet, desktop) => {
  return cn(
    mobile,
    tablet && `md:${tablet}`,
    desktop && `lg:${desktop}`
  );
};

// Animation utilities
export const fadeInClasses = 'animate-fade-in';
export const slideUpClasses = 'animate-slide-up';

// Common patterns
export const modalOverlayClasses = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
export const modalContentClasses = cn(
  cardClasses(false),
  'w-full max-w-md p-6'
);

export const dropdownClasses = cn(
  'absolute right-0 mt-2 w-48 rounded-lg shadow-lg z-10',
  components.card.combined
);

export const badgeClasses = (variant = 'default') => {
  const variants = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-400',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
  };
  
  return cn(
    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
    variants[variant]
  );
};

// Export all utilities
export default {
  cn,
  themeClass,
  pageClasses,
  cardClasses,
  buttonClasses,
  inputClasses,
  textClasses,
  loadingSpinnerClasses,
  errorClasses,
  errorTextClasses,
  successClasses,
  successTextClasses,
  iconClasses,
  containerClasses,
  sectionClasses,
  getValidationClasses,
  responsiveClasses,
  fadeInClasses,
  slideUpClasses,
  modalOverlayClasses,
  modalContentClasses,
  dropdownClasses,
  badgeClasses
};