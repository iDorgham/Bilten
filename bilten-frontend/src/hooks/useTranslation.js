/**
 * Enhanced translation hook with additional features
 */

import { useCallback, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';

/**
 * Enhanced translation hook with pluralization and context support
 * @returns {Object} Translation utilities
 */
export const useTranslation = () => {
  const { t, currentLanguage, isRTL, ...languageContext } = useLanguage();

  /**
   * Translation function with pluralization support
   * @param {string} key - Translation key
   * @param {Object} options - Translation options
   * @param {number} options.count - Count for pluralization
   * @param {Object} options.params - Parameters for interpolation
   * @param {string} options.context - Context for contextual translations
   * @returns {string} Translated text
   */
  const translate = useCallback((key, options = {}) => {
    const { count, params = {}, context } = options;

    // Handle pluralization
    if (typeof count === 'number') {
      const pluralKey = count === 1 ? key : `${key}Plural`;
      const translatedText = t(pluralKey, { ...params, count });
      
      // If plural form doesn't exist, fall back to singular with count
      if (translatedText === pluralKey && pluralKey !== key) {
        return t(key, { ...params, count });
      }
      
      return translatedText;
    }

    // Handle contextual translations
    if (context) {
      const contextKey = `${key}_${context}`;
      const contextTranslation = t(contextKey, params);
      
      // If context-specific translation doesn't exist, fall back to base key
      if (contextTranslation === contextKey) {
        return t(key, params);
      }
      
      return contextTranslation;
    }

    return t(key, params);
  }, [t]);

  /**
   * Get translation with automatic pluralization based on count
   * @param {string} key - Base translation key
   * @param {number} count - Count for pluralization
   * @param {Object} params - Additional parameters
   * @returns {string} Pluralized translation
   */
  const plural = useCallback((key, count, params = {}) => {
    return translate(key, { count, params });
  }, [translate]);

  /**
   * Get contextual translation
   * @param {string} key - Base translation key
   * @param {string} context - Context identifier
   * @param {Object} params - Parameters for interpolation
   * @returns {string} Contextual translation
   */
  const contextual = useCallback((key, context, params = {}) => {
    return translate(key, { context, params });
  }, [translate]);

  /**
   * Check if a translation key exists
   * @param {string} key - Translation key to check
   * @returns {boolean} Whether the key exists
   */
  const exists = useCallback((key) => {
    const translation = t(key);
    return translation !== key;
  }, [t]);

  /**
   * Get multiple translations at once
   * @param {string[]} keys - Array of translation keys
   * @returns {Object} Object with keys and their translations
   */
  const getMultiple = useCallback((keys) => {
    return keys.reduce((acc, key) => {
      acc[key] = t(key);
      return acc;
    }, {});
  }, [t]);

  /**
   * Format a list with proper conjunctions based on language
   * @param {string[]} items - Array of items to format
   * @param {string} type - Type of conjunction ('and' or 'or')
   * @returns {string} Formatted list
   */
  const formatList = useCallback((items, type = 'and') => {
    if (!items || items.length === 0) return '';
    if (items.length === 1) return items[0];
    if (items.length === 2) {
      const conjunction = t(`common.${type}`, {}, type);
      return `${items[0]} ${conjunction} ${items[1]}`;
    }

    const conjunction = t(`common.${type}`, {}, type);
    const lastItem = items[items.length - 1];
    const otherItems = items.slice(0, -1).join(', ');
    
    return `${otherItems}, ${conjunction} ${lastItem}`;
  }, [t]);

  /**
   * Get direction-aware CSS classes
   * @param {string} baseClass - Base CSS class
   * @returns {string} Direction-aware CSS classes
   */
  const directionClass = useCallback((baseClass) => {
    const direction = isRTL ? 'rtl' : 'ltr';
    return `${baseClass} ${baseClass}--${direction}`;
  }, [isRTL]);

  /**
   * Memoized language information
   */
  const languageInfo = useMemo(() => ({
    code: currentLanguage,
    isRTL,
    direction: isRTL ? 'rtl' : 'ltr'
  }), [currentLanguage, isRTL]);

  return {
    // Basic translation
    t: translate,
    
    // Enhanced features
    plural,
    contextual,
    exists,
    getMultiple,
    formatList,
    directionClass,
    
    // Language info
    language: languageInfo,
    
    // Pass through all language context
    ...languageContext
  };
};

export default useTranslation;