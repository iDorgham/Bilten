/**
 * Search Configuration Tests
 * Tests for search infrastructure setup and configuration
 */

const searchConfig = require('../config/searchConfig');
const elasticsearchConfig = require('../config/elasticsearch');
const searchCacheConfig = require('../config/searchCache');

// Mock the dependencies
jest.mock('../config/elasticsearch');
jest.mock('../config/searchCache');
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

describe('Search Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    searchConfig.isInitialized = false;
  });

  describe('initialize', () => {
    it('should initialize elasticsearch and cache successfully', async () => {
      // Mock successful initialization
      elasticsearchConfig.initialize.mockResolvedValue();
      elasticsearchConfig.isHealthy.mockReturnValue(true);
      searchCacheConfig.initialize.mockResolvedValue();
      searchCacheConfig.isHealthy.mockReturnValue(true);

      await searchConfig.initialize();

      expect(elasticsearchConfig.initialize).toHaveBeenCalled();
      expect(searchCacheConfig.initialize).toHaveBeenCalled();
      expect(searchConfig.isInitialized).toBe(true);
    });

    it('should handle elasticsearch initialization failure', async () => {
      const error = new Error('Elasticsearch connection failed');
      elasticsearchConfig.initialize.mockRejectedValue(error);

      await expect(searchConfig.initialize()).rejects.toThrow('Elasticsearch connection failed');
      expect(searchConfig.isInitialized).toBe(false);
    });

    it('should handle cache initialization failure', async () => {
      elasticsearchConfig.initialize.mockResolvedValue();
      const error = new Error('Redis connection failed');
      searchCacheConfig.initialize.mockRejectedValue(error);

      await expect(searchConfig.initialize()).rejects.toThrow('Redis connection failed');
      expect(searchConfig.isInitialized).toBe(false);
    });
  });

  describe('getHealthStatus', () => {
    it('should return health status for all components', async () => {
      elasticsearchConfig.isHealthy.mockReturnValue(true);
      elasticsearchConfig.isConnected = true;
      searchCacheConfig.isHealthy.mockReturnValue(true);
      searchCacheConfig.isConnected = true;
      searchConfig.isInitialized = true;

      const status = await searchConfig.getHealthStatus();

      expect(status).toEqual({
        elasticsearch: {
          healthy: true,
          connected: true
        },
        cache: {
          healthy: true,
          connected: true
        },
        overall: true
      });
    });

    it('should return unhealthy status when components are down', async () => {
      elasticsearchConfig.isHealthy.mockReturnValue(false);
      elasticsearchConfig.isConnected = false;
      searchCacheConfig.isHealthy.mockReturnValue(false);
      searchCacheConfig.isConnected = false;
      searchConfig.isInitialized = false;

      const status = await searchConfig.getHealthStatus();

      expect(status.overall).toBe(false);
      expect(status.elasticsearch.healthy).toBe(false);
      expect(status.cache.healthy).toBe(false);
    });
  });

  describe('getElasticsearchClient', () => {
    it('should return elasticsearch client', () => {
      const mockClient = { search: jest.fn() };
      elasticsearchConfig.getClient.mockReturnValue(mockClient);

      const client = searchConfig.getElasticsearchClient();

      expect(client).toBe(mockClient);
      expect(elasticsearchConfig.getClient).toHaveBeenCalled();
    });
  });

  describe('getSearchCache', () => {
    it('should return search cache instance', () => {
      const cache = searchConfig.getSearchCache();

      expect(cache).toBe(searchCacheConfig);
    });
  });

  describe('isReady', () => {
    it('should return true when all components are healthy', () => {
      searchConfig.isInitialized = true;
      elasticsearchConfig.isHealthy.mockReturnValue(true);
      searchCacheConfig.isHealthy.mockReturnValue(true);

      expect(searchConfig.isReady()).toBe(true);
    });

    it('should return false when not initialized', () => {
      searchConfig.isInitialized = false;
      elasticsearchConfig.isHealthy.mockReturnValue(true);
      searchCacheConfig.isHealthy.mockReturnValue(true);

      expect(searchConfig.isReady()).toBe(false);
    });

    it('should return false when elasticsearch is unhealthy', () => {
      searchConfig.isInitialized = true;
      elasticsearchConfig.isHealthy.mockReturnValue(false);
      searchCacheConfig.isHealthy.mockReturnValue(true);

      expect(searchConfig.isReady()).toBe(false);
    });

    it('should return false when cache is unhealthy', () => {
      searchConfig.isInitialized = true;
      elasticsearchConfig.isHealthy.mockReturnValue(true);
      searchCacheConfig.isHealthy.mockReturnValue(false);

      expect(searchConfig.isReady()).toBe(false);
    });
  });

  describe('shutdown', () => {
    it('should shutdown all components gracefully', async () => {
      elasticsearchConfig.close.mockResolvedValue();
      searchCacheConfig.close.mockResolvedValue();
      searchConfig.isInitialized = true;

      await searchConfig.shutdown();

      expect(elasticsearchConfig.close).toHaveBeenCalled();
      expect(searchCacheConfig.close).toHaveBeenCalled();
      expect(searchConfig.isInitialized).toBe(false);
    });

    it('should handle shutdown errors gracefully', async () => {
      const error = new Error('Shutdown failed');
      elasticsearchConfig.close.mockRejectedValue(error);
      searchCacheConfig.close.mockResolvedValue();

      await expect(searchConfig.shutdown()).rejects.toThrow('Shutdown failed');
    });
  });
});