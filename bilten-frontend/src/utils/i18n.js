/**
 * Internationalization utilities for dynamic translation loading
 */

import performanceMonitor from './i18nPerformance';

// Translation cache to store loaded translations
const translationCache = new Map();

// Translation usage statistics for optimization
const translationUsageStats = new Map();

// Cache performance metrics
let cacheHits = 0;
let cacheMisses = 0;

// Available languages configuration
export const AVAILABLE_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇪🇬' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' }
];

/**
 * Validate translation structure and required keys
 * @param {Object} translations - The translations object to validate
 * @param {string} languageCode - The language code being validated
 * @returns {boolean} Whether the translation structure is valid
 */
const validateTranslationStructure = (translations, languageCode) => {
  if (!translations || typeof translations !== 'object') {
    return false;
  }

  // Check for required meta information
  if (!translations.meta || typeof translations.meta !== 'object') {
    console.warn(`Missing meta information for language: ${languageCode}`);
    return false;
  }

  const requiredMetaFields = ['language', 'name', 'nativeName', 'isRTL'];
  for (const field of requiredMetaFields) {
    if (!(field in translations.meta)) {
      console.warn(`Missing required meta field '${field}' for language: ${languageCode}`);
      return false;
    }
  }

  // Check for critical translation sections
  const criticalSections = ['common', 'nav', 'auth'];
  for (const section of criticalSections) {
    if (!translations[section] || typeof translations[section] !== 'object') {
      console.warn(`Missing critical translation section '${section}' for language: ${languageCode}`);
      return false;
    }
  }

  return true;
};

/**
 * Auto-detect user's preferred language from browser settings
 * @returns {string} The detected language code or 'en' as fallback
 */
export const detectUserLanguage = () => {
  // Check browser language preferences
  const browserLanguages = navigator.languages || [navigator.language];
  
  for (const browserLang of browserLanguages) {
    const langCode = browserLang.split('-')[0].toLowerCase();
    const availableLanguage = AVAILABLE_LANGUAGES.find(lang => lang.code === langCode);
    if (availableLanguage) {
      return availableLanguage.code;
    }
  }
  
  return 'en'; // Default fallback
};

/**
 * Load translations for a specific language with enhanced error handling
 * @param {string} languageCode - The language code to load
 * @returns {Promise<Object>} The translation object
 */
export const loadTranslations = async (languageCode) => {
  // Check cache first
  if (translationCache.has(languageCode)) {
    cacheHits++;
    performanceMonitor.recordCacheHit();
    return translationCache.get(languageCode);
  }

  cacheMisses++;
  performanceMonitor.recordCacheMiss();
  
  const endTiming = performanceMonitor.startLoadTiming(languageCode);

  try {
    // Dynamic import of translation file
    const translationModule = await import(`../locales/${languageCode}.json`);
    const translations = translationModule.default;
    
    // Validate translation structure
    if (!validateTranslationStructure(translations, languageCode)) {
      throw new Error(`Invalid translation structure for language: ${languageCode}`);
    }

    // Cache the translations
    translationCache.set(languageCode, translations);
    
    endTiming();
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Loaded translations for ${languageCode}:`, {
        language: translations.meta.name,
        completion: translations.meta.completionPercentage,
        keys: Object.keys(translations).length - 1, // Exclude meta
        cacheSize: translationCache.size
      });
    }

    return translations;
  } catch (error) {
    // Enhanced error handling with specific error types
    if (error.message?.includes('Cannot resolve module')) {
      console.error(`❌ Translation file not found for language: ${languageCode}`);
    } else if (error instanceof SyntaxError) {
      console.error(`❌ Invalid JSON syntax in translation file for: ${languageCode}`);
    } else {
      console.error(`❌ Failed to load translations for ${languageCode}:`, error.message);
    }
    
    // Fallback to English if not already trying English
    if (languageCode !== 'en') {
      console.log(`🔄 Falling back to English translations`);
      return loadTranslations('en');
    }
    
    // If English also fails, return minimal structure
    console.error('❌ Critical error: Could not load any translations');
    return {
      meta: {
        language: languageCode,
        name: 'Unknown',
        nativeName: 'Unknown',
        completionPercentage: 0,
        isRTL: false
      },
      common: {
        loading: 'Loading...',
        error: 'Error',
        ok: 'OK'
      }
    };
  }
};

/**
 * Get a nested translation value by key path
 * @param {Object} translations - The translations object
 * @param {string} keyPath - Dot-separated key path (e.g., 'nav.events')
 * @param {Object} params - Parameters for interpolation
 * @returns {string} The translated text or the key if not found
 */
export const getTranslation = (translations, keyPath, params = {}) => {
  if (!translations || !keyPath) {
    return keyPath || '';
  }

  // Track translation usage for analytics
  if (process.env.NODE_ENV === 'development') {
    const currentCount = translationUsageStats.get(keyPath) || 0;
    translationUsageStats.set(keyPath, currentCount + 1);
  }

  // Split the key path and traverse the object
  const keys = keyPath.split('.');
  let value = translations;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      // Key not found, log in development
      if (process.env.NODE_ENV === 'development') {
        console.warn(`🔍 Translation key not found: '${keyPath}'`);
      }
      return keyPath;
    }
  }

  // If we found a string value, handle parameter interpolation
  if (typeof value === 'string') {
    return interpolateParams(value, params);
  }

  // If we found an object, it might be a complex translation structure
  if (typeof value === 'object' && value !== null) {
    // For now, just return the key path if it's an object
    return keyPath;
  }

  return keyPath;
};

/**
 * Interpolate parameters in a translation string
 * @param {string} text - The text with parameter placeholders
 * @param {Object} params - The parameters to interpolate
 * @returns {string} The interpolated text
 */
const interpolateParams = (text, params) => {
  if (!params || Object.keys(params).length === 0) {
    return text;
  }

  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return params[key] !== undefined ? params[key] : match;
  });
};

/**
 * Format a number according to the language locale
 * @param {number} number - The number to format
 * @param {string} locale - The locale string (e.g., 'en-US', 'ar-EG')
 * @param {Object} options - Intl.NumberFormat options
 * @returns {string} The formatted number
 */
export const formatNumber = (number, locale = 'en-US', options = {}) => {
  try {
    return new Intl.NumberFormat(locale, options).format(number);
  } catch (error) {
    console.error(`Failed to format number for locale ${locale}:`, error);
    return number.toString();
  }
};

/**
 * Format a date according to the language locale
 * @param {Date|string} date - The date to format
 * @param {string} locale - The locale string
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} The formatted date
 */
export const formatDate = (date, locale = 'en-US', options = {}) => {
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    return new Intl.DateTimeFormat(locale, options).format(dateObj);
  } catch (error) {
    console.error(`Failed to format date for locale ${locale}:`, error);
    return date.toString();
  }
};

/**
 * Format currency according to the language locale
 * @param {number} amount - The amount to format
 * @param {string} locale - The locale string
 * @param {string} currency - The currency code
 * @returns {string} The formatted currency
 */
export const formatCurrency = (amount, locale = 'en-US', currency = 'USD') => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  } catch (error) {
    console.error(`Failed to format currency for locale ${locale}:`, error);
    return `${currency} ${amount}`;
  }
};

/**
 * Clear the translation cache
 */
export const clearTranslationCache = () => {
  translationCache.clear();
  console.log('Translation cache cleared');
};

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
export const getCacheStats = () => {
  return {
    size: translationCache.size,
    languages: Array.from(translationCache.keys()),
    hitRate: cacheHits / (cacheHits + cacheMisses) || 0,
    hits: cacheHits,
    misses: cacheMisses
  };
};

/**
 * Get translation usage statistics (development only)
 * @returns {Object} Usage statistics
 */
export const getTranslationUsageStats = () => {
  if (process.env.NODE_ENV !== 'development') {
    return { message: 'Usage stats only available in development mode' };
  }

  const sortedStats = Array.from(translationUsageStats.entries())
    .sort(([,a], [,b]) => b - a);

  return {
    totalKeys: translationUsageStats.size,
    mostUsed: sortedStats.slice(0, 10),
    leastUsed: sortedStats.slice(-10),
    totalUsage: Array.from(translationUsageStats.values()).reduce((sum, count) => sum + count, 0)
  };
};

/**
 * Validate translation keys exist in a translation object
 * @param {string[]} requiredKeys - Array of required translation keys
 * @param {Object} translations - The translations object to validate
 * @returns {string[]} Array of missing keys
 */
export const getMissingTranslations = (requiredKeys, translations) => {
  return requiredKeys.filter(key => {
    const value = getTranslation(translations, key);
    return value === key; // If translation returns the key, it's missing
  });
};

/**
 * Preload translations for multiple languages
 * @param {string[]} languageCodes - Array of language codes to preload
 * @returns {Promise<Object>} Object with loaded translations
 */
export const preloadTranslations = async (languageCodes) => {
  const results = {};
  
  for (const code of languageCodes) {
    try {
      results[code] = await loadTranslations(code);
    } catch (error) {
      console.error(`Failed to preload translations for ${code}:`, error);
      results[code] = null;
    }
  }
  
  return results;
};