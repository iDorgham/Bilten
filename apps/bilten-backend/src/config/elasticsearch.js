/**
 * Elasticsearch Configuration
 * Handles connection setup and index management for search functionality
 */

const { Client } = require('@elastic/elasticsearch');
const logger = require('../utils/logger');

class ElasticsearchConfig {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  /**
   * Initialize Elasticsearch client
   */
  async initialize() {
    try {
      this.client = new Client({
        node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
        auth: process.env.ELASTICSEARCH_AUTH ? {
          username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
          password: process.env.ELASTICSEARCH_PASSWORD
        } : undefined,
        requestTimeout: 30000,
        pingTimeout: 3000,
        maxRetries: 3
      });

      // Test connection
      await this.client.ping();
      this.isConnected = true;
      logger.info('Elasticsearch connection established');

      // Create indices if they don't exist
      await this.createIndices();
      
    } catch (error) {
      logger.error('Failed to connect to Elasticsearch:', error);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Create search indices with proper mappings
   */
  async createIndices() {
    try {
      // Check if events index exists
      const eventsIndexExists = await this.client.indices.exists({
        index: 'events'
      });

      if (!eventsIndexExists) {
        await this.createEventsIndex();
        logger.info('Events index created successfully');
      }

    } catch (error) {
      logger.error('Failed to create indices:', error);
      throw error;
    }
  }

  /**
   * Create events index with mapping
   */
  async createEventsIndex() {
    const mapping = {
      mappings: {
        properties: {
          id: { type: 'keyword' },
          title: { 
            type: 'text', 
            analyzer: 'standard',
            fields: {
              keyword: { type: 'keyword' },
              suggest: { type: 'completion' }
            }
          },
          description: { 
            type: 'text', 
            analyzer: 'standard' 
          },
          category: { type: 'keyword' },
          tags: { type: 'keyword' },
          location: {
            properties: {
              name: { type: 'text' },
              coordinates: { type: 'geo_point' },
              city: { type: 'keyword' },
              country: { type: 'keyword' },
              address: { type: 'text' }
            }
          },
          date: { type: 'date' },
          end_date: { type: 'date' },
          price: { type: 'float' },
          currency: { type: 'keyword' },
          organizer_id: { type: 'keyword' },
          organizer_name: { 
            type: 'text',
            fields: {
              keyword: { type: 'keyword' }
            }
          },
          popularity_score: { type: 'float' },
          view_count: { type: 'integer' },
          bookmark_count: { type: 'integer' },
          registration_count: { type: 'integer' },
          status: { type: 'keyword' },
          is_featured: { type: 'boolean' },
          is_free: { type: 'boolean' },
          capacity: { type: 'integer' },
          available_tickets: { type: 'integer' },
          created_at: { type: 'date' },
          updated_at: { type: 'date' }
        }
      },
      settings: {
        number_of_shards: 1,
        number_of_replicas: 0,
        analysis: {
          analyzer: {
            event_analyzer: {
              type: 'custom',
              tokenizer: 'standard',
              filter: ['lowercase', 'stop', 'snowball']
            }
          }
        }
      }
    };

    await this.client.indices.create({
      index: 'events',
      body: mapping
    });
  }

  /**
   * Get Elasticsearch client instance
   */
  getClient() {
    if (!this.isConnected || !this.client) {
      throw new Error('Elasticsearch client not initialized');
    }
    return this.client;
  }

  /**
   * Check if Elasticsearch is connected
   */
  isHealthy() {
    return this.isConnected;
  }

  /**
   * Close Elasticsearch connection
   */
  async close() {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      logger.info('Elasticsearch connection closed');
    }
  }
}

module.exports = new ElasticsearchConfig();