/**
 * Search Cache Configuration
 * Handles Redis caching for search results and related data
 */

const redis = require('redis');
const logger = require('../utils/logger');

class SearchCacheConfig {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.defaultTTL = {
      searchResults: 300, // 5 minutes
      autocomplete: 600, // 10 minutes
      trending: 900, // 15 minutes
      popular: 1800, // 30 minutes
      recommendations: 3600, // 1 hour
      userPreferences: 7200 // 2 hours
    };
  }

  /**
   * Initialize Redis client for search caching
   */
  async initialize() {
    try {
      this.client = redis.createClient({
        url: process.env.REDIS_SEARCH_URL || process.env.REDIS_URL || 'redis://localhost:6379',
        database: process.env.REDIS_SEARCH_DB || 2, // Use separate DB for search cache
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            logger.error('Redis search cache server refused connection');
            return new Error('Redis search cache server refused connection');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('Redis search cache retry time exhausted');
          }
          if (options.attempt > 10) {
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      this.client.on('error', (err) => {
        logger.error('Redis search cache error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis search cache connected');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        logger.info('Redis search cache ready');
        this.isConnected = true;
      });

      await this.client.connect();
      
    } catch (error) {
      logger.error('Failed to connect to Redis search cache:', error);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Cache search results
   */
  async cacheSearchResults(key, results, ttl = null) {
    if (!this.isConnected) return false;
    
    try {
      const cacheKey = this.generateSearchKey(key);
      const serializedResults = JSON.stringify(results);
      const expiration = ttl || this.defaultTTL.searchResults;
      
      await this.client.setEx(cacheKey, expiration, serializedResults);
      return true;
    } catch (error) {
      logger.error('Failed to cache search results:', error);
      return false;
    }
  }

  /**
   * Get cached search results
   */
  async getCachedSearchResults(key) {
    if (!this.isConnected) return null;
    
    try {
      const cacheKey = this.generateSearchKey(key);
      const cached = await this.client.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      logger.error('Failed to get cached search results:', error);
      return null;
    }
  }

  /**
   * Cache autocomplete suggestions
   */
  async cacheAutocompleteSuggestions(query, suggestions) {
    if (!this.isConnected) return false;
    
    try {
      const cacheKey = this.generateAutocompleteKey(query);
      const serializedSuggestions = JSON.stringify(suggestions);
      
      await this.client.setEx(cacheKey, this.defaultTTL.autocomplete, serializedSuggestions);
      return true;
    } catch (error) {
      logger.error('Failed to cache autocomplete suggestions:', error);
      return false;
    }
  }

  /**
   * Get cached autocomplete suggestions
   */
  async getCachedAutocompleteSuggestions(query) {
    if (!this.isConnected) return null;
    
    try {
      const cacheKey = this.generateAutocompleteKey(query);
      const cached = await this.client.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      logger.error('Failed to get cached autocomplete suggestions:', error);
      return null;
    }
  }

  /**
   * Cache trending events
   */
  async cacheTrendingEvents(location, timeframe, events) {
    if (!this.isConnected) return false;
    
    try {
      const cacheKey = this.generateTrendingKey(location, timeframe);
      const serializedEvents = JSON.stringify(events);
      
      await this.client.setEx(cacheKey, this.defaultTTL.trending, serializedEvents);
      return true;
    } catch (error) {
      logger.error('Failed to cache trending events:', error);
      return false;
    }
  }

  /**
   * Get cached trending events
   */
  async getCachedTrendingEvents(location, timeframe) {
    if (!this.isConnected) return null;
    
    try {
      const cacheKey = this.generateTrendingKey(location, timeframe);
      const cached = await this.client.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      logger.error('Failed to get cached trending events:', error);
      return null;
    }
  }

  /**
   * Cache user recommendations
   */
  async cacheUserRecommendations(userId, recommendations) {
    if (!this.isConnected) return false;
    
    try {
      const cacheKey = this.generateRecommendationKey(userId);
      const serializedRecommendations = JSON.stringify(recommendations);
      
      await this.client.setEx(cacheKey, this.defaultTTL.recommendations, serializedRecommendations);
      return true;
    } catch (error) {
      logger.error('Failed to cache user recommendations:', error);
      return false;
    }
  }

  /**
   * Get cached user recommendations
   */
  async getCachedUserRecommendations(userId) {
    if (!this.isConnected) return null;
    
    try {
      const cacheKey = this.generateRecommendationKey(userId);
      const cached = await this.client.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      logger.error('Failed to get cached user recommendations:', error);
      return null;
    }
  }

  /**
   * Invalidate search cache for specific patterns
   */
  async invalidateSearchCache(pattern) {
    if (!this.isConnected) return false;
    
    try {
      const keys = await this.client.keys(`search:${pattern}*`);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      logger.error('Failed to invalidate search cache:', error);
      return false;
    }
  }

  /**
   * Generate cache key for search results
   */
  generateSearchKey(searchParams) {
    const hash = require('crypto')
      .createHash('md5')
      .update(JSON.stringify(searchParams))
      .digest('hex');
    return `search:results:${hash}`;
  }

  /**
   * Generate cache key for autocomplete
   */
  generateAutocompleteKey(query) {
    const normalizedQuery = query.toLowerCase().trim();
    return `search:autocomplete:${normalizedQuery}`;
  }

  /**
   * Generate cache key for trending events
   */
  generateTrendingKey(location, timeframe) {
    return `search:trending:${location || 'global'}:${timeframe || 'day'}`;
  }

  /**
   * Generate cache key for user recommendations
   */
  generateRecommendationKey(userId) {
    return `search:recommendations:${userId}`;
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    if (!this.isConnected) return null;
    
    try {
      const info = await this.client.info('memory');
      const keyspace = await this.client.info('keyspace');
      
      return {
        memory: info,
        keyspace: keyspace,
        connected: this.isConnected
      };
    } catch (error) {
      logger.error('Failed to get cache stats:', error);
      return null;
    }
  }

  /**
   * Check if cache is healthy
   */
  isHealthy() {
    return this.isConnected;
  }

  /**
   * Close Redis connection
   */
  async close() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      logger.info('Redis search cache connection closed');
    }
  }
}

module.exports = new SearchCacheConfig();