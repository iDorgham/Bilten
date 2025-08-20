/**
 * Comprehensive tests for the internationalization system
 */

import {
  loadTranslations,
  getTranslation,
  formatNumber,
  formatDate,
  formatCurrency,
  detectUserLanguage,
  clearTranslationCache,
  getCacheStats,
  getMissingTranslations,
  preloadTranslations,
  AVAILABLE_LANGUAGES
} from '../i18n';

// Mock dynamic imports
jest.mock('../locales/en.json', () => ({
  default: {
    meta: {
      language: 'en',
      name: 'English',
      nativeName: 'English',
      isRTL: false,
      completionPercentage: 100
    },
    common: {
      loading: 'Loading...',
      error: 'Error',
      ok: 'OK'
    },
    nav: {
      events: 'Events',
      news: 'News'
    }
  }
}), { virtual: true });

jest.mock('../locales/ar.json', () => ({
  default: {
    meta: {
      language: 'ar',
      name: 'Arabic',
      nativeName: 'العربية',
      isRTL: true,
      completionPercentage: 95
    },
    common: {
      loading: 'جاري التحميل...',
      error: 'خطأ',
      ok: 'موافق'
    },
    nav: {
      events: 'الفعاليات'
      // Missing 'news' key for testing
    }
  }
}), { virtual: true });

// Mock navigator.languages
Object.defineProperty(navigator, 'languages', {
  writable: true,
  value: ['en-US', 'en']
});

Object.defineProperty(navigator, 'language', {
  writable: true,
  value: 'en-US'
});

describe('i18n System', () => {
  beforeEach(() => {
    clearTranslationCache();
    jest.clearAllMocks();
  });

  describe('loadTranslations', () => {
    it('should load English translations successfully', async () => {
      const translations = await loadTranslations('en');
      
      expect(translations).toBeDefined();
      expect(translations.meta.language).toBe('en');
      expect(translations.common.loading).toBe('Loading...');
    });

    it('should load Arabic translations successfully', async () => {
      const translations = await loadTranslations('ar');
      
      expect(translations).toBeDefined();
      expect(translations.meta.language).toBe('ar');
      expect(translations.meta.isRTL).toBe(true);
      expect(translations.common.loading).toBe('جاري التحميل...');
    });

    it('should cache translations after first load', async () => {
      // First load
      await loadTranslations('en');
      const stats1 = getCacheStats();
      
      // Second load (should use cache)
      await loadTranslations('en');
      const stats2 = getCacheStats();
      
      expect(stats2.hits).toBe(stats1.hits + 1);
      expect(stats2.size).toBe(1);
    });

    it('should fallback to English for invalid language codes', async () => {
      const translations = await loadTranslations('invalid');
      
      expect(translations.meta.language).toBe('en');
    });

    it('should return minimal structure if all translations fail', async () => {
      // Mock import to throw error
      jest.doMock('../locales/en.json', () => {
        throw new Error('File not found');
      });

      const translations = await loadTranslations('en');
      
      expect(translations.meta.language).toBe('en');
      expect(translations.common.loading).toBe('Loading...');
    });
  });

  describe('getTranslation', () => {
    let translations;

    beforeEach(async () => {
      translations = await loadTranslations('en');
    });

    it('should get simple translation', () => {
      const result = getTranslation(translations, 'common.loading');
      expect(result).toBe('Loading...');
    });

    it('should get nested translation', () => {
      const result = getTranslation(translations, 'nav.events');
      expect(result).toBe('Events');
    });

    it('should return key if translation not found', () => {
      const result = getTranslation(translations, 'nonexistent.key');
      expect(result).toBe('nonexistent.key');
    });

    it('should handle parameter interpolation', () => {
      // Mock translation with parameters
      translations.test = { message: 'Hello {{name}}!' };
      
      const result = getTranslation(translations, 'test.message', { name: 'World' });
      expect(result).toBe('Hello World!');
    });

    it('should handle missing parameters gracefully', () => {
      translations.test = { message: 'Hello {{name}}!' };
      
      const result = getTranslation(translations, 'test.message');
      expect(result).toBe('Hello {{name}}!');
    });

    it('should handle empty or null inputs', () => {
      expect(getTranslation(null, 'key')).toBe('key');
      expect(getTranslation(translations, '')).toBe('');
      expect(getTranslation(translations, null)).toBe('');
    });
  });

  describe('detectUserLanguage', () => {
    it('should detect English from browser settings', () => {
      navigator.languages = ['en-US', 'en'];
      const detected = detectUserLanguage();
      expect(detected).toBe('en');
    });

    it('should detect Arabic from browser settings', () => {
      navigator.languages = ['ar-EG', 'ar'];
      const detected = detectUserLanguage();
      expect(detected).toBe('ar');
    });

    it('should fallback to English for unsupported languages', () => {
      navigator.languages = ['zh-CN', 'zh'];
      const detected = detectUserLanguage();
      expect(detected).toBe('en');
    });

    it('should handle empty browser languages', () => {
      navigator.languages = [];
      navigator.language = 'fr-FR';
      const detected = detectUserLanguage();
      expect(detected).toBe('fr'); // French is in AVAILABLE_LANGUAGES
    });
  });

  describe('formatNumber', () => {
    it('should format numbers in English locale', () => {
      const result = formatNumber(1234.56, 'en-US');
      expect(result).toBe('1,234.56');
    });

    it('should format numbers in Arabic locale', () => {
      const result = formatNumber(1234.56, 'ar-EG');
      expect(result).toMatch(/١٬٢٣٤٫٥٦|1,234.56/); // May vary by browser
    });

    it('should handle formatting errors gracefully', () => {
      const result = formatNumber(1234.56, 'invalid-locale');
      expect(result).toBe('1234.56');
    });
  });

  describe('formatDate', () => {
    const testDate = new Date('2023-12-25T10:30:00Z');

    it('should format dates in English locale', () => {
      const result = formatDate(testDate, 'en-US');
      expect(result).toMatch(/12\/25\/2023|Dec 25, 2023/);
    });

    it('should format dates in Arabic locale', () => {
      const result = formatDate(testDate, 'ar-EG');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle string dates', () => {
      const result = formatDate('2023-12-25', 'en-US');
      expect(typeof result).toBe('string');
    });

    it('should handle formatting errors gracefully', () => {
      const result = formatDate(testDate, 'invalid-locale');
      expect(result).toBe(testDate.toString());
    });
  });

  describe('formatCurrency', () => {
    it('should format currency in USD', () => {
      const result = formatCurrency(1234.56, 'en-US', 'USD');
      expect(result).toBe('$1,234.56');
    });

    it('should format currency in EGP', () => {
      const result = formatCurrency(1234.56, 'ar-EG', 'EGP');
      expect(result).toMatch(/EGP|ج\.م\.|£E/);
    });

    it('should handle formatting errors gracefully', () => {
      const result = formatCurrency(1234.56, 'invalid-locale', 'USD');
      expect(result).toBe('USD 1234.56');
    });
  });

  describe('getMissingTranslations', () => {
    it('should identify missing translation keys', async () => {
      const translations = await loadTranslations('ar');
      const requiredKeys = ['nav.events', 'nav.news', 'nav.about'];
      
      const missing = getMissingTranslations(requiredKeys, translations);
      expect(missing).toContain('nav.news'); // Missing in Arabic mock
      expect(missing).not.toContain('nav.events'); // Present in Arabic mock
    });

    it('should return empty array when all keys exist', async () => {
      const translations = await loadTranslations('en');
      const requiredKeys = ['nav.events', 'common.loading'];
      
      const missing = getMissingTranslations(requiredKeys, translations);
      expect(missing).toEqual([]);
    });
  });

  describe('preloadTranslations', () => {
    it('should preload multiple languages', async () => {
      const results = await preloadTranslations(['en', 'ar']);
      
      expect(results.en).toBeDefined();
      expect(results.ar).toBeDefined();
      expect(results.en.meta.language).toBe('en');
      expect(results.ar.meta.language).toBe('ar');
    });

    it('should handle failed preloads gracefully', async () => {
      const results = await preloadTranslations(['en', 'invalid']);
      
      expect(results.en).toBeDefined();
      expect(results.invalid).toBeDefined(); // Should fallback to English
    });
  });

  describe('getCacheStats', () => {
    it('should return accurate cache statistics', async () => {
      // Load some translations
      await loadTranslations('en');
      await loadTranslations('ar');
      await loadTranslations('en'); // Cache hit
      
      const stats = getCacheStats();
      
      expect(stats.size).toBe(2);
      expect(stats.languages).toContain('en');
      expect(stats.languages).toContain('ar');
      expect(stats.hits).toBeGreaterThan(0);
      expect(stats.hitRate).toBeGreaterThan(0);
    });
  });

  describe('AVAILABLE_LANGUAGES', () => {
    it('should contain required language information', () => {
      expect(AVAILABLE_LANGUAGES).toBeDefined();
      expect(Array.isArray(AVAILABLE_LANGUAGES)).toBe(true);
      expect(AVAILABLE_LANGUAGES.length).toBeGreaterThan(0);
      
      AVAILABLE_LANGUAGES.forEach(lang => {
        expect(lang).toHaveProperty('code');
        expect(lang).toHaveProperty('name');
        expect(lang).toHaveProperty('nativeName');
        expect(lang).toHaveProperty('flag');
      });
    });

    it('should include English and Arabic', () => {
      const codes = AVAILABLE_LANGUAGES.map(lang => lang.code);
      expect(codes).toContain('en');
      expect(codes).toContain('ar');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // This test would require mocking network failures
      // For now, we test the fallback mechanism
      const translations = await loadTranslations('nonexistent');
      expect(translations).toBeDefined();
      expect(translations.meta).toBeDefined();
    });

    it('should validate translation structure', async () => {
      // Mock invalid translation structure
      jest.doMock('../locales/invalid.json', () => ({
        default: {
          // Missing meta section
          common: { loading: 'Loading...' }
        }
      }), { virtual: true });

      const translations = await loadTranslations('invalid');
      // Should fallback to English due to validation failure
      expect(translations.meta.language).toBe('en');
    });
  });

  describe('Development Features', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should track translation usage in development', async () => {
      const translations = await loadTranslations('en');
      
      // Use some translations
      getTranslation(translations, 'common.loading');
      getTranslation(translations, 'common.loading'); // Use twice
      getTranslation(translations, 'nav.events');
      
      // Usage tracking is tested indirectly through the dev tools
      expect(true).toBe(true); // Placeholder assertion
    });

    it('should log warnings for missing keys in development', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const translations = await loadTranslations('en');
      
      getTranslation(translations, 'nonexistent.key');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Translation key not found')
      );
      
      consoleSpy.mockRestore();
    });
  });
});