/**
 * Development tools for translation management and debugging
 * Only available in development mode
 */

import { 
  getCacheStats, 
  getTranslationUsageStats, 
  getMissingTranslations,
  loadTranslations,
  AVAILABLE_LANGUAGES 
} from './i18n';

/**
 * Translation development tools class
 */
class TranslationDevTools {
  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'development';
    this.requiredKeys = new Set();
    this.missingKeys = new Map();
    
    if (this.isEnabled) {
      this.initializeDevTools();
    }
  }

  /**
   * Initialize development tools
   */
  initializeDevTools() {
    // Add global dev tools to window for console access
    if (typeof window !== 'undefined') {
      window.translationDevTools = {
        getCacheStats: () => getCacheStats(),
        getUsageStats: () => getTranslationUsageStats(),
        validateTranslations: (keys) => this.validateTranslations(keys),
        generateReport: () => this.generateReport(),
        exportMissingKeys: () => this.exportMissingKeys(),
        checkCompleteness: () => this.checkCompleteness()
      };
      
      console.log('🔧 Translation DevTools available at window.translationDevTools');
    }
  }

  /**
   * Register required translation keys for validation
   * @param {string[]} keys - Array of required translation keys
   */
  registerRequiredKeys(keys) {
    if (!this.isEnabled) return;
    
    keys.forEach(key => this.requiredKeys.add(key));
  }

  /**
   * Validate translations for all languages
   * @param {string[]} customKeys - Optional custom keys to validate
   * @returns {Object} Validation results
   */
  async validateTranslations(customKeys = []) {
    if (!this.isEnabled) return { message: 'Only available in development mode' };

    const keysToValidate = customKeys.length > 0 
      ? customKeys 
      : Array.from(this.requiredKeys);

    const results = {};

    for (const lang of AVAILABLE_LANGUAGES) {
      try {
        const translations = await loadTranslations(lang.code);
        const missing = getMissingTranslations(keysToValidate, translations);
        
        results[lang.code] = {
          language: lang.name,
          totalKeys: keysToValidate.length,
          missingKeys: missing,
          missingCount: missing.length,
          completeness: ((keysToValidate.length - missing.length) / keysToValidate.length * 100).toFixed(1)
        };

        if (missing.length > 0) {
          this.missingKeys.set(lang.code, missing);
        }
      } catch (error) {
        results[lang.code] = {
          language: lang.name,
          error: error.message
        };
      }
    }

    return results;
  }

  /**
   * Generate comprehensive translation report
   * @returns {Object} Complete translation report
   */
  async generateReport() {
    if (!this.isEnabled) return { message: 'Only available in development mode' };

    const cacheStats = getCacheStats();
    const usageStats = getTranslationUsageStats();
    const validationResults = await this.validateTranslations();

    return {
      timestamp: new Date().toISOString(),
      cache: cacheStats,
      usage: usageStats,
      validation: validationResults,
      recommendations: this.generateRecommendations(usageStats, validationResults)
    };
  }

  /**
   * Generate optimization recommendations
   * @param {Object} usageStats - Translation usage statistics
   * @param {Object} validationResults - Validation results
   * @returns {string[]} Array of recommendations
   */
  generateRecommendations(usageStats, validationResults) {
    const recommendations = [];

    // Cache recommendations
    if (usageStats.totalUsage > 0) {
      const hitRate = (usageStats.hits / (usageStats.hits + usageStats.misses)) * 100;
      if (hitRate < 80) {
        recommendations.push(`Cache hit rate is ${hitRate.toFixed(1)}%. Consider preloading frequently used languages.`);
      }
    }

    // Missing translations
    const languagesWithMissing = Object.values(validationResults)
      .filter(result => result.missingCount > 0);
    
    if (languagesWithMissing.length > 0) {
      recommendations.push(`${languagesWithMissing.length} languages have missing translations. Run exportMissingKeys() to get details.`);
    }

    // Unused translations
    if (usageStats.leastUsed && usageStats.leastUsed.length > 0) {
      const unusedKeys = usageStats.leastUsed.filter(([, count]) => count === 0);
      if (unusedKeys.length > 0) {
        recommendations.push(`${unusedKeys.length} translation keys are unused and could be removed.`);
      }
    }

    return recommendations;
  }

  /**
   * Export missing translation keys for translators
   * @returns {Object} Missing keys organized by language
   */
  exportMissingKeys() {
    if (!this.isEnabled) return { message: 'Only available in development mode' };

    const exportData = {};
    
    for (const [langCode, missingKeys] of this.missingKeys.entries()) {
      const language = AVAILABLE_LANGUAGES.find(lang => lang.code === langCode);
      exportData[langCode] = {
        language: language?.name || langCode,
        nativeName: language?.nativeName || langCode,
        missingKeys: missingKeys,
        count: missingKeys.length
      };
    }

    // Also log to console for easy copying
    console.table(exportData);
    
    return exportData;
  }

  /**
   * Check translation completeness across all languages
   * @returns {Object} Completeness statistics
   */
  async checkCompleteness() {
    if (!this.isEnabled) return { message: 'Only available in development mode' };

    const results = {};
    let totalKeys = 0;

    // Use English as the reference for total keys
    try {
      const englishTranslations = await loadTranslations('en');
      totalKeys = this.countTranslationKeys(englishTranslations);
    } catch (error) {
      console.error('Failed to load English translations for completeness check');
      return { error: 'Could not determine total keys from English translations' };
    }

    for (const lang of AVAILABLE_LANGUAGES) {
      try {
        const translations = await loadTranslations(lang.code);
        const keyCount = this.countTranslationKeys(translations);
        const completeness = (keyCount / totalKeys * 100).toFixed(1);

        results[lang.code] = {
          language: lang.name,
          nativeName: lang.nativeName,
          keyCount,
          totalKeys,
          completeness: `${completeness}%`,
          status: completeness >= 95 ? '✅ Complete' : 
                  completeness >= 80 ? '⚠️ Mostly Complete' : 
                  '❌ Incomplete'
        };
      } catch (error) {
        results[lang.code] = {
          language: lang.name,
          error: error.message,
          status: '❌ Error'
        };
      }
    }

    return results;
  }

  /**
   * Recursively count translation keys in an object
   * @param {Object} obj - Translation object
   * @param {string} prefix - Key prefix for nested objects
   * @returns {number} Total number of translation keys
   */
  countTranslationKeys(obj, prefix = '') {
    let count = 0;
    
    for (const [key, value] of Object.entries(obj)) {
      if (key === 'meta') continue; // Skip meta information
      
      if (typeof value === 'string') {
        count++;
      } else if (typeof value === 'object' && value !== null) {
        count += this.countTranslationKeys(value, prefix ? `${prefix}.${key}` : key);
      }
    }
    
    return count;
  }

  /**
   * Log translation statistics to console
   */
  logStats() {
    if (!this.isEnabled) return;

    console.group('🌐 Translation Statistics');
    console.log('Cache Stats:', getCacheStats());
    console.log('Usage Stats:', getTranslationUsageStats());
    console.groupEnd();
  }
}

// Create singleton instance
const translationDevTools = new TranslationDevTools();

export default translationDevTools;

// Export individual functions for direct use
export const {
  registerRequiredKeys,
  validateTranslations,
  generateReport,
  exportMissingKeys,
  checkCompleteness,
  logStats
} = translationDevTools;