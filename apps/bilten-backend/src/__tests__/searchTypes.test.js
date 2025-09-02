/**
 * Search Types Tests
 * Tests for search type definitions and validation helpers
 */

const {
  validateSearchQuery,
  validateSearchFilters,
  validatePagination,
  DEFAULT_PAGINATION,
  DEFAULT_SORT,
  SEARCH_LIMITS,
  INTERACTION_WEIGHTS
} = require('../types/search');

describe('Search Types', () => {
  describe('validateSearchQuery', () => {
    it('should validate valid search query', () => {
      const validQuery = {
        query: 'test search',
        filters: {},
        pagination: { page: 1, limit: 20 }
      };

      expect(validateSearchQuery(validQuery)).toBe(true);
    });

    it('should reject invalid search query', () => {
      expect(validateSearchQuery(null)).toBe(false);
      expect(validateSearchQuery(undefined)).toBe(false);
      expect(validateSearchQuery('string')).toBe(false);
      expect(validateSearchQuery({})).toBe(false);
      expect(validateSearchQuery({ query: 123 })).toBe(false);
    });

    it('should validate minimal search query', () => {
      const minimalQuery = { query: 'test' };
      expect(validateSearchQuery(minimalQuery)).toBe(true);
    });
  });

  describe('validateSearchFilters', () => {
    it('should validate valid filters object', () => {
      const validFilters = {
        location: { city: 'New York' },
        categories: ['music', 'art'],
        price: { min: 0, max: 100 }
      };

      expect(validateSearchFilters(validFilters)).toBe(true);
    });

    it('should validate empty filters object', () => {
      expect(validateSearchFilters({})).toBe(true);
    });

    it('should reject invalid filters', () => {
      expect(validateSearchFilters(null)).toBe(false);
      expect(validateSearchFilters(undefined)).toBe(false);
      expect(validateSearchFilters('string')).toBe(false);
      expect(validateSearchFilters(123)).toBe(false);
    });
  });

  describe('validatePagination', () => {
    it('should validate valid pagination', () => {
      const validPagination = { page: 1, limit: 20 };
      expect(validatePagination(validPagination)).toBe(true);
    });

    it('should validate pagination with optional fields', () => {
      expect(validatePagination({ page: 1 })).toBe(true);
      expect(validatePagination({ limit: 20 })).toBe(true);
      expect(validatePagination({})).toBe(true);
    });

    it('should reject invalid pagination', () => {
      expect(validatePagination(null)).toBe(false);
      expect(validatePagination(undefined)).toBe(false);
      expect(validatePagination('string')).toBe(false);
      expect(validatePagination({ page: 'invalid' })).toBe(false);
      expect(validatePagination({ limit: 'invalid' })).toBe(false);
    });
  });

  describe('Default Values', () => {
    it('should have correct default pagination', () => {
      expect(DEFAULT_PAGINATION).toEqual({
        page: 1,
        limit: 20
      });
    });

    it('should have correct default sort', () => {
      expect(DEFAULT_SORT).toEqual({
        field: 'relevance',
        order: 'desc'
      });
    });

    it('should have correct search limits', () => {
      expect(SEARCH_LIMITS).toEqual({
        MAX_QUERY_LENGTH: 500,
        MAX_RESULTS_PER_PAGE: 100,
        MAX_AUTOCOMPLETE_SUGGESTIONS: 10
      });
    });

    it('should have correct interaction weights', () => {
      expect(INTERACTION_WEIGHTS).toEqual({
        view: 1,
        bookmark: 3,
        register: 5,
        share: 2
      });
    });
  });

  describe('Type Structure Validation', () => {
    it('should validate search query structure', () => {
      const searchQuery = {
        query: 'music events',
        filters: {
          location: {
            city: 'New York',
            coordinates: { lat: 40.7128, lon: -74.0060 },
            radius: 10
          },
          date: {
            start: new Date(),
            end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          },
          categories: ['music', 'concert'],
          price: { min: 0, max: 100 },
          isFree: false
        },
        pagination: { page: 1, limit: 20 },
        sort: { field: 'date', order: 'asc' }
      };

      expect(validateSearchQuery(searchQuery)).toBe(true);
      expect(validateSearchFilters(searchQuery.filters)).toBe(true);
      expect(validatePagination(searchQuery.pagination)).toBe(true);
    });

    it('should validate autocomplete request structure', () => {
      const autocompleteRequest = {
        query: 'mus',
        limit: 5,
        categories: ['music']
      };

      // Basic structure validation
      expect(typeof autocompleteRequest.query).toBe('string');
      expect(typeof autocompleteRequest.limit).toBe('number');
      expect(Array.isArray(autocompleteRequest.categories)).toBe(true);
    });

    it('should validate recommendation request structure', () => {
      const recommendationRequest = {
        userId: 'user123',
        limit: 10,
        excludeEventIds: ['event1', 'event2'],
        context: 'homepage'
      };

      expect(typeof recommendationRequest.userId).toBe('string');
      expect(typeof recommendationRequest.limit).toBe('number');
      expect(Array.isArray(recommendationRequest.excludeEventIds)).toBe(true);
      expect(typeof recommendationRequest.context).toBe('string');
    });

    it('should validate saved search structure', () => {
      const savedSearch = {
        id: 'search123',
        userId: 'user123',
        name: 'My Music Events',
        query: 'music',
        filters: {
          categories: ['music'],
          location: { city: 'New York' }
        },
        alertEnabled: true,
        createdAt: new Date(),
        lastExecuted: new Date()
      };

      expect(typeof savedSearch.id).toBe('string');
      expect(typeof savedSearch.userId).toBe('string');
      expect(typeof savedSearch.name).toBe('string');
      expect(typeof savedSearch.query).toBe('string');
      expect(validateSearchFilters(savedSearch.filters)).toBe(true);
      expect(typeof savedSearch.alertEnabled).toBe('boolean');
    });
  });
});