# Bilten Frontend Internationalization System

A comprehensive, production-ready internationalization (i18n) system for React applications with advanced features including performance monitoring, development tools, and comprehensive testing.

## 🌟 Features

### Core Features
- **Dynamic Translation Loading**: Lazy-load translations with intelligent caching
- **RTL Support**: Full right-to-left language support with automatic document direction
- **Parameter Interpolation**: Support for `{{param}}` placeholders in translations
- **Fallback System**: Graceful fallback to English when translations fail
- **Performance Monitoring**: Built-in performance tracking and optimization recommendations
- **Development Tools**: Comprehensive debugging and validation tools

### Advanced Features
- **Auto Language Detection**: Detect user's preferred language from browser settings
- **Translation Validation**: Validate translation completeness across languages
- **Usage Analytics**: Track translation key usage for optimization
- **Pluralization Support**: Handle plural forms with count-based selection
- **Contextual Translations**: Support for context-specific translations
- **Cache Management**: Intelligent caching with hit/miss tracking

## 🚀 Quick Start

### Basic Usage

```javascript
import { useLanguage } from '../context/LanguageContext';

function MyComponent() {
  const { t, currentLanguage, changeLanguage } = useLanguage();
  
  return (
    <div>
      <h1>{t('welcome.title')}</h1>
      <p>{t('welcome.message', { name: 'User' })}</p>
      <button onClick={() => changeLanguage('ar')}>
        Switch to Arabic
      </button>
    </div>
  );
}
```

### Enhanced Hook Usage

```javascript
import { useTranslation } from '../hooks/useTranslation';

function EnhancedComponent() {
  const { t, plural, contextual, exists } = useTranslation();
  
  return (
    <div>
      {/* Basic translation */}
      <h1>{t('title')}</h1>
      
      {/* Pluralization */}
      <p>{plural('items', itemCount)}</p>
      
      {/* Contextual translation */}
      <button>{contextual('save', 'form')}</button>
      
      {/* Conditional rendering */}
      {exists('optional.feature') && (
        <div>{t('optional.feature')}</div>
      )}
    </div>
  );
}
```

## 📁 File Structure

```
src/
├── utils/
│   ├── i18n.js                    # Core i18n utilities
│   ├── i18nPerformance.js         # Performance monitoring
│   ├── translationDevTools.js     # Development tools
│   └── __tests__/
│       └── i18n.test.js           # Comprehensive tests
├── context/
│   └── LanguageContext.js         # React context provider
├── hooks/
│   └── useTranslation.js          # Enhanced translation hook
├── components/
│   └── TranslationValidator.js    # Development validation UI
└── locales/
    ├── en.json                    # English translations
    ├── ar.json                    # Arabic translations
    └── [other-languages].json
```

## 🔧 API Reference

### Core Functions

#### `loadTranslations(languageCode)`
Loads translations for a specific language with caching and validation.

```javascript
const translations = await loadTranslations('en');
```

#### `getTranslation(translations, keyPath, params)`
Retrieves a translation with parameter interpolation.

```javascript
const text = getTranslation(translations, 'nav.events', { count: 5 });
```

#### `detectUserLanguage()`
Auto-detects user's preferred language from browser settings.

```javascript
const preferredLang = detectUserLanguage(); // Returns 'en', 'ar', etc.
```

### Formatting Functions

#### `formatNumber(number, locale, options)`
Formats numbers according to locale.

```javascript
formatNumber(1234.56, 'ar-EG'); // "١٬٢٣٤٫٥٦"
```

#### `formatDate(date, locale, options)`
Formats dates according to locale.

```javascript
formatDate(new Date(), 'ar-EG', { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
});
```

#### `formatCurrency(amount, locale, currency)`
Formats currency according to locale.

```javascript
formatCurrency(1234.56, 'ar-EG', 'EGP'); // "ج.م.‏ ١٬٢٣٤٫٥٦"
```

### Development Tools

#### `getMissingTranslations(requiredKeys, translations)`
Identifies missing translation keys.

```javascript
const missing = getMissingTranslations(['nav.home', 'nav.about'], translations);
```

#### `getCacheStats()`
Returns cache performance statistics.

```javascript
const stats = getCacheStats();
// { size: 2, languages: ['en', 'ar'], hitRate: 0.85, hits: 17, misses: 3 }
```

## 🎯 Translation File Format

```json
{
  "meta": {
    "language": "en",
    "name": "English",
    "nativeName": "English",
    "flag": "🇺🇸",
    "version": "1.0.0",
    "lastUpdated": "2025-01-11T00:00:00Z",
    "completionPercentage": 100,
    "isRTL": false,
    "dateFormat": "MM/DD/YYYY",
    "numberFormat": "en-US",
    "currencyCode": "USD"
  },
  "nav": {
    "home": "Home",
    "events": "Events",
    "about": "About"
  },
  "common": {
    "loading": "Loading...",
    "error": "Error",
    "save": "Save"
  }
}
```

## 🛠️ Development Tools

### Translation Validator Component
A visual development tool for validating translations:

```javascript
import TranslationValidator from '../components/TranslationValidator';

// Automatically included in development builds
// Provides UI for validation, cache stats, and recommendations
```

### Console Tools
Access development tools via browser console:

```javascript
// Translation validation
window.translationDevTools.validateTranslations();

// Performance monitoring
window.i18nPerformance.getStats();
window.i18nPerformance.logSummary();

// Cache management
window.translationDevTools.getCacheStats();
```

## 📊 Performance Monitoring

The system includes built-in performance monitoring:

- **Load Time Tracking**: Monitor translation file load times
- **Cache Performance**: Track cache hit/miss ratios
- **Translation Lookup Times**: Identify slow translation keys
- **Automatic Warnings**: Console warnings for performance issues
- **Optimization Recommendations**: Actionable performance suggestions

## 🧪 Testing

Comprehensive test suite covering:

- Translation loading and caching
- Parameter interpolation
- Error handling and fallbacks
- Language detection
- Formatting functions
- Development tools
- Performance monitoring

Run tests:
```bash
npm test -- --testPathPattern=i18n
```

## 🌍 Adding New Languages

1. Create translation file: `src/locales/[language-code].json`
2. Add language to `AVAILABLE_LANGUAGES` in `i18n.js`
3. Validate completeness using development tools
4. Test RTL support if applicable

Example:
```javascript
// Add to AVAILABLE_LANGUAGES array
{ 
  code: 'fr', 
  name: 'French', 
  nativeName: 'Français', 
  flag: '🇫🇷' 
}
```

## 🔍 Best Practices

### Translation Keys
- Use dot notation: `section.subsection.key`
- Keep keys descriptive: `auth.login.button` not `auth.btn1`
- Group related translations: `nav.*`, `auth.*`, `common.*`

### Performance
- Preload critical languages on app start
- Use the development tools to identify unused translations
- Monitor cache hit rates and optimize accordingly

### Accessibility
- Provide proper language attributes
- Test RTL layouts thoroughly
- Ensure proper text direction for mixed content

## 🐛 Troubleshooting

### Common Issues

**Translation not found**
- Check key spelling and nesting
- Verify translation exists in target language
- Use development tools to identify missing keys

**Performance issues**
- Check cache hit rate
- Consider preloading frequently used languages
- Use performance monitoring tools

**RTL layout issues**
- Verify `isRTL` flag in translation meta
- Test with actual RTL content
- Use direction-aware CSS classes

## 📈 Metrics & Analytics

The system tracks:
- Translation key usage frequency
- Cache performance metrics
- Load times per language
- Missing translation patterns
- Performance bottlenecks

Access via development tools or console APIs.

## 🤝 Contributing

When adding new features:
1. Add comprehensive tests
2. Update documentation
3. Ensure backward compatibility
4. Test with multiple languages
5. Validate performance impact

## 📄 License

This internationalization system is part of the Bilten platform and follows the project's licensing terms.