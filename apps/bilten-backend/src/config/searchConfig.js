/**
 * Search Configuration Manager
 * Initializes and manages search infrastructure components
 */

const elasticsearchConfig = require('./elasticsearch');
const searchCacheConfig = require('./searchCache');
const logger = require('../utils/logger');

class SearchConfig {
  constructor() {
    this.isInitialized = false;
    this.elasticsearch = elasticsearchConfig;
    this.cache = searchCacheConfig;
  }

  /**
   * Initialize all search infrastructure components
   */
  async initialize() {
    try {
      logger.info('Initializing search infrastructure...');

      // Initialize Elasticsearch
      await this.elasticsearch.initialize();
      logger.info('Elasticsearch initialized successfully');

      // Initialize Redis cache
      await this.cache.initialize();
      logger.info('Search cache initialized successfully');

      this.isInitialized = true;
      logger.info('Search infrastructure initialization complete');

    } catch (error) {
      logger.error('Failed to initialize search infrastructure:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * Get health status of all search components
   */
  async getHealthStatus() {
    return {
      elasticsearch: {
        healthy: this.elasticsearch.isHealthy(),
        connected: this.elasticsearch.isConnected
      },
      cache: {
        healthy: this.cache.isHealthy(),
        connected: this.cache.isConnected
      },
      overall: this.isInitialized && this.elasticsearch.isHealthy() && this.cache.isHealthy()
    };
  }

  /**
   * Get Elasticsearch client
   */
  getElasticsearchClient() {
    return this.elasticsearch.getClient();
  }

  /**
   * Get search cache client
   */
  getSearchCache() {
    return this.cache;
  }

  /**
   * Check if search infrastructure is ready
   */
  isReady() {
    return this.isInitialized && 
           this.elasticsearch.isHealthy() && 
           this.cache.isHealthy();
  }

  /**
   * Gracefully shutdown search infrastructure
   */
  async shutdown() {
    try {
      logger.info('Shutting down search infrastructure...');

      if (this.elasticsearch) {
        await this.elasticsearch.close();
      }

      if (this.cache) {
        await this.cache.close();
      }

      this.isInitialized = false;
      logger.info('Search infrastructure shutdown complete');

    } catch (error) {
      logger.error('Error during search infrastructure shutdown:', error);
      throw error;
    }
  }
}

module.exports = new SearchConfig();