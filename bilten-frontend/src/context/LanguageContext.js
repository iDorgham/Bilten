import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  loadTranslations, 
  getTranslation, 
  formatNumber, 
  formatDate, 
  formatCurrency,
  detectUserLanguage,
  AVAILABLE_LANGUAGES 
} from '../utils/i18n';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    const saved = localStorage.getItem('language');
    return saved || detectUserLanguage();
  });
  
  const [translations, setTranslations] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const languages = AVAILABLE_LANGUAGES;

  // Load translations when language changes
  useEffect(() => {
    const loadLanguageTranslations = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const translationData = await loadTranslations(currentLanguage);
        setTranslations(translationData);
      } catch (err) {
        console.error('Failed to load translations:', err);
        setError(err);
        
        // Try to load English as fallback
        if (currentLanguage !== 'en') {
          try {
            const fallbackData = await loadTranslations('en');
            setTranslations(fallbackData);
          } catch (fallbackErr) {
            console.error('Failed to load fallback translations:', fallbackErr);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    loadLanguageTranslations();
  }, [currentLanguage]);

  // Set document direction for RTL languages
  useEffect(() => {
    const isRTL = translations.meta?.isRTL || false;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage, translations]);

  /**
   * Translation function
   * @param {string} key - Translation key (e.g., 'nav.events')
   * @param {Object} params - Parameters for interpolation
   * @returns {string} Translated text
   */
  const t = (key, params = {}) => {
    if (loading) {
      return key; // Return key while loading
    }
    
    return getTranslation(translations, key, params);
  };

  /**
   * Change the current language
   * @param {string} languageCode - The new language code
   */
  const changeLanguage = (languageCode) => {
    if (languages.find(lang => lang.code === languageCode)) {
      setCurrentLanguage(languageCode);
      localStorage.setItem('language', languageCode);
    } else {
      console.warn(`Language ${languageCode} is not available`);
    }
  };

  /**
   * Format number according to current language
   * @param {number} number - Number to format
   * @param {Object} options - Formatting options
   * @returns {string} Formatted number
   */
  const formatNumberLocalized = (number, options = {}) => {
    const locale = translations.meta?.numberFormat || 'en-US';
    return formatNumber(number, locale, options);
  };

  /**
   * Format date according to current language
   * @param {Date|string} date - Date to format
   * @param {Object} options - Formatting options
   * @returns {string} Formatted date
   */
  const formatDateLocalized = (date, options = {}) => {
    const locale = translations.meta?.numberFormat || 'en-US';
    return formatDate(date, locale, options);
  };

  /**
   * Format currency according to current language
   * @param {number} amount - Amount to format
   * @param {string} currency - Currency code (optional, uses meta.currencyCode)
   * @returns {string} Formatted currency
   */
  const formatCurrencyLocalized = (amount, currency) => {
    const locale = translations.meta?.numberFormat || 'en-US';
    const currencyCode = currency || translations.meta?.currencyCode || 'USD';
    return formatCurrency(amount, locale, currencyCode);
  };

  /**
   * Get language metadata
   * @returns {Object} Language metadata
   */
  const getLanguageInfo = () => {
    return {
      code: currentLanguage,
      name: translations.meta?.name || 'Unknown',
      nativeName: translations.meta?.nativeName || 'Unknown',
      flag: translations.meta?.flag || '🏳️',
      isRTL: translations.meta?.isRTL || false,
      completionPercentage: translations.meta?.completionPercentage || 0
    };
  };

  const value = {
    // State
    currentLanguage,
    languages,
    translations,
    loading,
    error,
    
    // Functions
    t,
    changeLanguage,
    formatNumber: formatNumberLocalized,
    formatDate: formatDateLocalized,
    formatCurrency: formatCurrencyLocalized,
    getLanguageInfo,
    
    // Utilities
    isRTL: translations.meta?.isRTL || false,
    languageDirection: translations.meta?.isRTL ? 'rtl' : 'ltr'
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};