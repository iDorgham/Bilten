/**
 * Event Search Service
 * Handles event search and filtering functionality using Elasticsearch
 */

const { Client } = require('@elastic/elasticsearch');
const logger = require('../utils/logger');
const searchConfig = require('../config/searchConfig');
const { validateSearchQuery, validateSearchFilters, DEFAULT_PAGINATION, DEFAULT_SORT } = require('../types/search');

class EventSearchService {
  constructor() {
    this.client = null;
    this.indexName = 'events';
    this.isInitialized = false;
  }

  /**
   * Initialize the search service
   */
  async initialize() {
    try {
      if (!searchConfig.isReady()) {
        await searchConfig.initialize();
      }
      
      this.client = searchConfig.getElasticsearchClient();
      await this.createEventIndex();
      this.isInitialized = true;
      
      logger.info('EventSearchService initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize EventSearchService:', error);
      throw error;
    }
  }

  /**
   * Create the events index with proper mapping
   */
  async createEventIndex() {
    try {
      const indexExists = await this.client.indices.exists({ index: this.indexName });
      
      if (!indexExists) {
        await this.client.indices.create({
          index: this.indexName,
          body: {
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
            },
            mappings: {
              properties: {
                id: { type: 'keyword' },
                title: { 
                  type: 'text', 
                  analyzer: 'event_analyzer',
                  fields: {
                    keyword: { type: 'keyword' },
                    suggest: { type: 'completion' }
                  }
                },
                description: { 
                  type: 'text', 
                  analyzer: 'event_analyzer' 
                },
                category: { type: 'keyword' },
                tags: { type: 'keyword' },
                venue_name: { 
                  type: 'text',
                  fields: { keyword: { type: 'keyword' } }
                },
                venue_address: { type: 'text' },
                location: {
                  type: 'geo_point'
                },
                city: { type: 'keyword' },
                country: { type: 'keyword' },
                start_date: { type: 'date' },
                end_date: { type: 'date' },
                timezone: { type: 'keyword' },
                base_price: { type: 'float' },
                currency: { type: 'keyword' },
                is_free: { type: 'boolean' },
                is_featured: { type: 'boolean' },
                status: { type: 'keyword' },
                max_attendees: { type: 'integer' },
                available_tickets: { type: 'integer' },
                organizer_id: { type: 'keyword' },
                organizer_name: { 
                  type: 'text',
                  fields: { keyword: { type: 'keyword' } }
                },
                organizer_verified: { type: 'boolean' },
                popularity_score: { type: 'float' },
                view_count: { type: 'integer' },
                bookmark_count: { type: 'integer' },
                registration_count: { type: 'integer' },
                created_at: { type: 'date' },
                updated_at: { type: 'date' }
              }
            }
          }
        });
        
        logger.info(`Created Elasticsearch index: ${this.indexName}`);
      }
    } catch (error) {
      logger.error('Failed to create event index:', error);
      throw error;
    }
  }

  /**
   * Index an event document
   */
  async indexEvent(event) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const document = this.transformEventForIndex(event);
      
      await this.client.index({
        index: this.indexName,
        id: event.id,
        body: document
      });

      logger.debug(`Indexed event: ${event.id}`);
    } catch (error) {
      logger.error(`Failed to index event ${event.id}:`, error);
      throw error;
    }
  }

  /**
   * Search events with filters and pagination
   */
  async searchEvents(searchQuery) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!validateSearchQuery(searchQuery)) {
        throw new Error('Invalid search query format');
      }

      const { query, filters = {}, pagination = DEFAULT_PAGINATION, sort = DEFAULT_SORT } = searchQuery;
      
      const searchBody = this.buildSearchQuery(query, filters, sort);
      const { page, limit } = pagination;
      const from = (page - 1) * limit;

      const response = await this.client.search({
        index: this.indexName,
        body: searchBody,
        from,
        size: limit
      });

      return this.formatSearchResponse(response, pagination);
    } catch (error) {
      logger.error('Search failed:', error);
      throw error;
    }
  }

  /**
   * Get autocomplete suggestions
   */
  async getAutocompleteSuggestions(query, limit = 10) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const response = await this.client.search({
        index: this.indexName,
        body: {
          suggest: {
            event_suggest: {
              prefix: query,
              completion: {
                field: 'title.suggest',
                size: limit
              }
            }
          },
          _source: false
        }
      });

      return response.suggest.event_suggest[0].options.map(option => ({
        text: option.text,
        score: option._score
      }));
    } catch (error) {
      logger.error('Autocomplete failed:', error);
      throw error;
    }
  }

  /**
   * Get trending events
   */
  async getTrendingEvents(filters = {}, limit = 20) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const searchBody = {
        query: {
          bool: {
            must: [
              { term: { status: 'published' } },
              { range: { start_date: { gte: 'now' } } }
            ],
            filter: this.buildFilters(filters)
          }
        },
        sort: [
          { popularity_score: { order: 'desc' } },
          { view_count: { order: 'desc' } },
          { registration_count: { order: 'desc' } }
        ]
      };

      const response = await this.client.search({
        index: this.indexName,
        body: searchBody,
        size: limit
      });

      return this.formatSearchResponse(response, { page: 1, limit });
    } catch (error) {
      logger.error('Failed to get trending events:', error);
      throw error;
    }
  }

  /**
   * Get events by location with radius search
   */
  async searchByLocation(coordinates, radius = 10, filters = {}, pagination = { page: 1, limit: 20 }) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const searchBody = {
        query: {
          bool: {
            must: [
              { term: { status: 'published' } },
              { range: { start_date: { gte: 'now' } } }
            ],
            filter: [
              {
                geo_distance: {
                  distance: `${radius}km`,
                  location: coordinates
                }
              },
              ...this.buildFilters(filters)
            ]
          }
        },
        sort: [
          {
            _geo_distance: {
              location: coordinates,
              order: 'asc',
              unit: 'km'
            }
          }
        ]
      };

      const { page, limit } = pagination;
      const from = (page - 1) * limit;

      const response = await this.client.search({
        index: this.indexName,
        body: searchBody,
        from,
        size: limit
      });

      return this.formatSearchResponse(response, pagination);
    } catch (error) {
      logger.error('Location search failed:', error);
      throw error;
    }
  }

  /**
   * Get similar events based on an event
   */
  async getSimilarEvents(eventId, limit = 10) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // First get the source event
      const sourceEvent = await this.client.get({
        index: this.indexName,
        id: eventId
      });

      if (!sourceEvent.found) {
        throw new Error('Source event not found');
      }

      const source = sourceEvent._source;

      const searchBody = {
        query: {
          bool: {
            must: [
              { term: { status: 'published' } },
              { range: { start_date: { gte: 'now' } } }
            ],
            should: [
              { term: { category: { value: source.category, boost: 3 } } },
              { terms: { tags: { value: source.tags || [], boost: 2 } } },
              { term: { city: { value: source.city, boost: 1.5 } } },
              { term: { organizer_id: { value: source.organizer_id, boost: 1 } } }
            ],
            must_not: [
              { term: { id: eventId } }
            ],
            minimum_should_match: 1
          }
        },
        sort: [
          { _score: { order: 'desc' } },
          { popularity_score: { order: 'desc' } }
        ]
      };

      const response = await this.client.search({
        index: this.indexName,
        body: searchBody,
        size: limit
      });

      return this.formatSearchResponse(response, { page: 1, limit });
    } catch (error) {
      logger.error('Similar events search failed:', error);
      throw error;
    }
  }

  /**
   * Get search suggestions with categories
   */
  async getSearchSuggestions(query, limit = 10) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const searchBody = {
        suggest: {
          title_suggest: {
            prefix: query,
            completion: {
              field: 'title.suggest',
              size: limit
            }
          }
        },
        aggs: {
          matching_categories: {
            terms: {
              field: 'category',
              size: 5
            }
          },
          matching_cities: {
            terms: {
              field: 'city',
              size: 5
            }
          }
        },
        query: {
          bool: {
            should: [
              { match: { title: { query, boost: 3 } } },
              { match: { category: { query, boost: 2 } } },
              { match: { city: { query, boost: 1 } } }
            ]
          }
        },
        size: 0
      };

      const response = await this.client.search({
        index: this.indexName,
        body: searchBody
      });

      const suggestions = [];
      
      // Add title suggestions
      if (response.suggest?.title_suggest?.[0]?.options) {
        response.suggest.title_suggest[0].options.forEach(option => {
          suggestions.push({
            text: option.text,
            type: 'event',
            score: option._score || 1
          });
        });
      }

      // Add category suggestions
      if (response.aggregations?.matching_categories?.buckets) {
        response.aggregations.matching_categories.buckets.forEach(bucket => {
          if (bucket.key.toLowerCase().includes(query.toLowerCase())) {
            suggestions.push({
              text: bucket.key,
              type: 'category',
              score: bucket.doc_count / 10,
              count: bucket.doc_count
            });
          }
        });
      }

      // Add city suggestions
      if (response.aggregations?.matching_cities?.buckets) {
        response.aggregations.matching_cities.buckets.forEach(bucket => {
          if (bucket.key.toLowerCase().includes(query.toLowerCase())) {
            suggestions.push({
              text: bucket.key,
              type: 'location',
              score: bucket.doc_count / 10,
              count: bucket.doc_count
            });
          }
        });
      }

      return suggestions
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      logger.error('Search suggestions failed:', error);
      throw error;
    }
  }

  /**
   * Build Elasticsearch query
   */
  buildSearchQuery(query, filters, sort) {
    const searchBody = {
      query: {
        bool: {
          must: [],
          filter: [],
          should: []
        }
      }
    };

    // Add text search
    if (query && query.trim()) {
      searchBody.query.bool.must.push({
        multi_match: {
          query: query,
          fields: [
            'title^3',
            'description^2',
            'venue_name^2',
            'organizer_name',
            'category',
            'tags'
          ],
          type: 'best_fields',
          fuzziness: 'AUTO'
        }
      });
    } else {
      searchBody.query.bool.must.push({ match_all: {} });
    }

    // Add filters
    searchBody.query.bool.filter = this.buildFilters(filters);

    // Add sorting
    searchBody.sort = this.buildSort(sort);

    // Add aggregations for faceted search
    searchBody.aggs = {
      categories: {
        terms: { field: 'category', size: 20 }
      },
      cities: {
        terms: { field: 'city', size: 20 }
      },
      price_ranges: {
        range: {
          field: 'base_price',
          ranges: [
            { key: 'free', to: 0.01 },
            { key: 'under_50', from: 0.01, to: 50 },
            { key: '50_100', from: 50, to: 100 },
            { key: '100_200', from: 100, to: 200 },
            { key: 'over_200', from: 200 }
          ]
        }
      }
    };

    return searchBody;
  }

  /**
   * Build filters for Elasticsearch query
   */
  buildFilters(filters) {
    const esFilters = [];

    // Always filter for published events
    esFilters.push({ term: { status: 'published' } });

    // Category filter
    if (filters.categories && filters.categories.length > 0) {
      esFilters.push({ terms: { category: filters.categories } });
    }

    // Date filter
    if (filters.date) {
      const dateFilter = { range: { start_date: {} } };
      
      if (filters.date.start) {
        dateFilter.range.start_date.gte = filters.date.start;
      }
      
      if (filters.date.end) {
        dateFilter.range.start_date.lte = filters.date.end;
      }
      
      if (filters.date.period) {
        const now = new Date();
        switch (filters.date.period) {
          case 'today':
            dateFilter.range.start_date.gte = new Date(now.setHours(0, 0, 0, 0)).toISOString();
            dateFilter.range.start_date.lt = new Date(now.setHours(23, 59, 59, 999)).toISOString();
            break;
          case 'tomorrow':
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            dateFilter.range.start_date.gte = new Date(tomorrow.setHours(0, 0, 0, 0)).toISOString();
            dateFilter.range.start_date.lt = new Date(tomorrow.setHours(23, 59, 59, 999)).toISOString();
            break;
          case 'this_week':
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            dateFilter.range.start_date.gte = new Date(startOfWeek.setHours(0, 0, 0, 0)).toISOString();
            dateFilter.range.start_date.lte = new Date(endOfWeek.setHours(23, 59, 59, 999)).toISOString();
            break;
          case 'this_month':
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            dateFilter.range.start_date.gte = startOfMonth.toISOString();
            dateFilter.range.start_date.lte = new Date(endOfMonth.setHours(23, 59, 59, 999)).toISOString();
            break;
        }
      }
      
      esFilters.push(dateFilter);
    }

    // Price filter
    if (filters.price) {
      const priceFilter = { range: { base_price: {} } };
      
      if (filters.price.min !== undefined) {
        priceFilter.range.base_price.gte = filters.price.min;
      }
      
      if (filters.price.max !== undefined) {
        priceFilter.range.base_price.lte = filters.price.max;
      }
      
      esFilters.push(priceFilter);
    }

    // Free events filter
    if (filters.isFree === true) {
      esFilters.push({ term: { is_free: true } });
    }

    // Featured events filter
    if (filters.isFeatured === true) {
      esFilters.push({ term: { is_featured: true } });
    }

    // Location filter
    if (filters.location) {
      if (filters.location.city) {
        esFilters.push({ term: { city: filters.location.city } });
      }
      
      if (filters.location.country) {
        esFilters.push({ term: { country: filters.location.country } });
      }
      
      if (filters.location.coordinates && filters.location.radius) {
        esFilters.push({
          geo_distance: {
            distance: `${filters.location.radius}km`,
            location: filters.location.coordinates
          }
        });
      }
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      esFilters.push({ terms: { tags: filters.tags } });
    }

    // Organizer filter
    if (filters.organizer) {
      esFilters.push({ term: { organizer_id: filters.organizer } });
    }

    return esFilters;
  }

  /**
   * Build sort configuration
   */
  buildSort(sort) {
    const sortConfig = [];

    switch (sort.field) {
      case 'date':
        sortConfig.push({ start_date: { order: sort.order || 'asc' } });
        break;
      case 'price':
        sortConfig.push({ base_price: { order: sort.order || 'asc' } });
        break;
      case 'popularity':
        sortConfig.push({ popularity_score: { order: sort.order || 'desc' } });
        break;
      case 'relevance':
      default:
        sortConfig.push({ _score: { order: 'desc' } });
        break;
    }

    // Add secondary sort by date
    if (sort.field !== 'date') {
      sortConfig.push({ start_date: { order: 'asc' } });
    }

    return sortConfig;
  }

  /**
   * Transform event data for indexing
   */
  transformEventForIndex(event) {
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      category: event.category,
      tags: event.tags || [],
      venue_name: event.venue_name,
      venue_address: event.venue_address,
      location: event.location || null,
      city: event.city || this.extractCityFromAddress(event.venue_address),
      country: event.country || this.extractCountryFromAddress(event.venue_address),
      start_date: event.start_date,
      end_date: event.end_date,
      timezone: event.timezone,
      base_price: event.base_price || 0,
      currency: event.currency || 'USD',
      is_free: event.is_free || event.base_price === 0,
      is_featured: event.is_featured || false,
      status: event.status,
      max_attendees: event.max_attendees,
      available_tickets: event.available_tickets || event.max_attendees,
      organizer_id: event.organizer_id,
      organizer_name: `${event.organizer_first_name} ${event.organizer_last_name}`,
      organizer_verified: event.organizer_verified || false,
      popularity_score: event.popularity_score || 0,
      view_count: event.view_count || 0,
      bookmark_count: event.bookmark_count || 0,
      registration_count: event.registration_count || 0,
      created_at: event.created_at,
      updated_at: event.updated_at
    };
  }

  /**
   * Format search response
   */
  formatSearchResponse(response, pagination) {
    const { hits, aggregations, took } = response;
    
    return {
      results: hits.hits.map(hit => ({
        ...hit._source,
        relevanceScore: hit._score
      })),
      metadata: {
        total: hits.total.value,
        page: pagination.page,
        limit: pagination.limit,
        pages: Math.ceil(hits.total.value / pagination.limit),
        took,
        hasMore: hits.total.value > (pagination.page * pagination.limit)
      },
      aggregations: aggregations ? {
        categories: aggregations.categories.buckets.map(bucket => ({
          category: bucket.key,
          count: bucket.doc_count
        })),
        locations: aggregations.cities.buckets.map(bucket => ({
          city: bucket.key,
          count: bucket.doc_count
        })),
        priceRanges: aggregations.price_ranges.buckets.map(bucket => ({
          range: bucket.key,
          count: bucket.doc_count
        }))
      } : null
    };
  }

  /**
   * Extract city from address (simple implementation)
   */
  extractCityFromAddress(address) {
    if (!address) return null;
    const parts = address.split(',');
    return parts.length > 1 ? parts[parts.length - 2].trim() : null;
  }

  /**
   * Extract country from address (simple implementation)
   */
  extractCountryFromAddress(address) {
    if (!address) return null;
    const parts = address.split(',');
    return parts.length > 0 ? parts[parts.length - 1].trim() : null;
  }

  /**
   * Delete event from index
   */
  async deleteEvent(eventId) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      await this.client.delete({
        index: this.indexName,
        id: eventId
      });

      logger.debug(`Deleted event from index: ${eventId}`);
    } catch (error) {
      if (error.statusCode !== 404) {
        logger.error(`Failed to delete event ${eventId}:`, error);
        throw error;
      }
    }
  }

  /**
   * Bulk index events
   */
  async bulkIndexEvents(events) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const body = [];
      
      events.forEach(event => {
        body.push({ index: { _index: this.indexName, _id: event.id } });
        body.push(this.transformEventForIndex(event));
      });

      const response = await this.client.bulk({ body });
      
      if (response.errors) {
        logger.error('Bulk indexing had errors:', response.items);
      }

      logger.info(`Bulk indexed ${events.length} events`);
      return response;
    } catch (error) {
      logger.error('Bulk indexing failed:', error);
      throw error;
    }
  }
}

module.exports = new EventSearchService();