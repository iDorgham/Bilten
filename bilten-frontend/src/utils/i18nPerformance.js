/**
 * Performance monitoring utilities for the i18n system
 */

class I18nPerformanceMonitor {
  constructor() {
    this.metrics = {
      loadTimes: new Map(),
      translationTimes: new Map(),
      cachePerformance: {
        hits: 0,
        misses: 0,
        totalTime: 0
      }
    };
    
    this.isEnabled = process.env.NODE_ENV === 'development';
  }

  /**
   * Start timing a translation load operation
   * @param {string} languageCode - Language being loaded
   * @returns {Function} End timing function
   */
  startLoadTiming(languageCode) {
    if (!this.isEnabled) return () => {};
    
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (!this.metrics.loadTimes.has(languageCode)) {
        this.metrics.loadTimes.set(languageCode, []);
      }
      
      this.metrics.loadTimes.get(languageCode).push(duration);
      
      if (duration > 100) { // Warn if load takes more than 100ms
        console.warn(`🐌 Slow translation load for ${languageCode}: ${duration.toFixed(2)}ms`);
      }
    };
  }

  /**
   * Start timing a translation lookup operation
   * @param {string} key - Translation key being looked up
   * @returns {Function} End timing function
   */
  startTranslationTiming(key) {
    if (!this.isEnabled) return () => {};
    
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (!this.metrics.translationTimes.has(key)) {
        this.metrics.translationTimes.set(key, []);
      }
      
      this.metrics.translationTimes.get(key).push(duration);
      
      if (duration > 5) { // Warn if translation lookup takes more than 5ms
        console.warn(`🐌 Slow translation lookup for ${key}: ${duration.toFixed(2)}ms`);
      }
    };
  }

  /**
   * Record cache hit
   */
  recordCacheHit() {
    if (!this.isEnabled) return;
    this.metrics.cachePerformance.hits++;
  }

  /**
   * Record cache miss
   */
  recordCacheMiss() {
    if (!this.isEnabled) return;
    this.metrics.cachePerformance.misses++;
  }

  /**
   * Get performance statistics
   * @returns {Object} Performance metrics
   */
  getStats() {
    if (!this.isEnabled) {
      return { message: 'Performance monitoring only available in development mode' };
    }

    const loadStats = {};
    for (const [lang, times] of this.metrics.loadTimes.entries()) {
      loadStats[lang] = {
        count: times.length,
        average: times.reduce((a, b) => a + b, 0) / times.length,
        min: Math.min(...times),
        max: Math.max(...times),
        total: times.reduce((a, b) => a + b, 0)
      };
    }

    const translationStats = {};
    const sortedTranslations = Array.from(this.metrics.translationTimes.entries())
      .sort(([,a], [,b]) => {
        const avgA = a.reduce((sum, time) => sum + time, 0) / a.length;
        const avgB = b.reduce((sum, time) => sum + time, 0) / b.length;
        return avgB - avgA;
      });

    for (const [key, times] of sortedTranslations.slice(0, 10)) {
      translationStats[key] = {
        count: times.length,
        average: times.reduce((a, b) => a + b, 0) / times.length,
        min: Math.min(...times),
        max: Math.max(...times)
      };
    }

    const { hits, misses } = this.metrics.cachePerformance;
    const total = hits + misses;
    
    return {
      loadPerformance: loadStats,
      translationPerformance: translationStats,
      cachePerformance: {
        hits,
        misses,
        total,
        hitRate: total > 0 ? (hits / total * 100).toFixed(2) + '%' : '0%'
      },
      recommendations: this.generatePerformanceRecommendations()
    };
  }

  /**
   * Generate performance recommendations
   * @returns {string[]} Array of recommendations
   */
  generatePerformanceRecommendations() {
    const recommendations = [];
    
    // Check load times
    for (const [lang, times] of this.metrics.loadTimes.entries()) {
      const average = times.reduce((a, b) => a + b, 0) / times.length;
      if (average > 50) {
        recommendations.push(`Consider preloading ${lang} translations (avg load time: ${average.toFixed(2)}ms)`);
      }
    }

    // Check cache performance
    const { hits, misses } = this.metrics.cachePerformance;
    const total = hits + misses;
    if (total > 0) {
      const hitRate = hits / total;
      if (hitRate < 0.8) {
        recommendations.push(`Cache hit rate is ${(hitRate * 100).toFixed(1)}%. Consider preloading frequently used languages.`);
      }
    }

    // Check for slow translations
    const slowTranslations = Array.from(this.metrics.translationTimes.entries())
      .filter(([, times]) => {
        const average = times.reduce((a, b) => a + b, 0) / times.length;
        return average > 2;
      });

    if (slowTranslations.length > 0) {
      recommendations.push(`${slowTranslations.length} translation keys have slow lookup times. Consider optimizing translation structure.`);
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance looks good! 🚀');
    }

    return recommendations;
  }

  /**
   * Reset all metrics
   */
  reset() {
    if (!this.isEnabled) return;
    
    this.metrics.loadTimes.clear();
    this.metrics.translationTimes.clear();
    this.metrics.cachePerformance = {
      hits: 0,
      misses: 0,
      totalTime: 0
    };
  }

  /**
   * Log performance summary to console
   */
  logSummary() {
    if (!this.isEnabled) return;
    
    const stats = this.getStats();
    
    console.group('🚀 i18n Performance Summary');
    
    if (Object.keys(stats.loadPerformance).length > 0) {
      console.group('📥 Load Performance');
      Object.entries(stats.loadPerformance).forEach(([lang, metrics]) => {
        console.log(`${lang}: ${metrics.average.toFixed(2)}ms avg (${metrics.count} loads)`);
      });
      console.groupEnd();
    }
    
    if (Object.keys(stats.translationPerformance).length > 0) {
      console.group('🔍 Translation Performance (Top 10 slowest)');
      Object.entries(stats.translationPerformance).forEach(([key, metrics]) => {
        console.log(`${key}: ${metrics.average.toFixed(2)}ms avg (${metrics.count} lookups)`);
      });
      console.groupEnd();
    }
    
    console.log('💾 Cache Performance:', stats.cachePerformance);
    
    if (stats.recommendations.length > 0) {
      console.group('💡 Recommendations');
      stats.recommendations.forEach(rec => console.log(`• ${rec}`));
      console.groupEnd();
    }
    
    console.groupEnd();
  }
}

// Create singleton instance
const performanceMonitor = new I18nPerformanceMonitor();

// Add to window for console access in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.i18nPerformance = {
    getStats: () => performanceMonitor.getStats(),
    logSummary: () => performanceMonitor.logSummary(),
    reset: () => performanceMonitor.reset()
  };
}

export default performanceMonitor;