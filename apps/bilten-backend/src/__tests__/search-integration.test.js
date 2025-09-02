/**
 * Search Integration Test
 * Tests the basic search functionality without external dependencies
 */

const request = require('supertest');
const express = require('express');
const eventsRouter = require('../routes/events');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/events', eventsRouter);

describe('Search Integration Tests', () => {
  describe('Basic Event Search', () => {
    test('should return events with mock data fallback', async () => {
      const response = await request(app)
        .get('/api/events')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('events');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.events)).toBe(true);
    }, 10000);

    test('should handle search query parameter', async () => {
      const response = await request(app)
        .get('/api/events?q=techno')
        .expect(200);

      expect(response.body.data).toHaveProperty('search_metadata');
      expect(response.body.data.search_metadata.query).toBe('techno');
    }, 10000);

    test('should handle category filter', async () => {
      const response = await request(app)
        .get('/api/events?category=electronic')
        .expect(200);

      expect(response.body.data).toHaveProperty('events');
      expect(Array.isArray(response.body.data.events)).toBe(true);
    }, 10000);

    test('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/events?page=1&limit=5')
        .expect(200);

      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(5);
    }, 10000);
  });

  describe('Search Endpoints', () => {
    test('should return autocomplete suggestions', async () => {
      const response = await request(app)
        .get('/api/events/search/autocomplete?q=test')
        .expect(200);

      expect(response.body.data).toHaveProperty('suggestions');
      expect(Array.isArray(response.body.data.suggestions)).toBe(true);
    }, 10000);

    test('should return empty suggestions for short queries', async () => {
      const response = await request(app)
        .get('/api/events/search/autocomplete?q=a')
        .expect(200);

      expect(response.body.data.suggestions).toEqual([]);
    }, 10000);

    test('should return trending events', async () => {
      const response = await request(app)
        .get('/api/events/search/trending')
        .expect(200);

      expect(response.body.data).toHaveProperty('events');
      expect(response.body.data).toHaveProperty('metadata');
      expect(Array.isArray(response.body.data.events)).toBe(true);
    }, 10000);

    test('should return search filters', async () => {
      const response = await request(app)
        .get('/api/events/search/filters')
        .expect(200);

      expect(response.body.data).toHaveProperty('categories');
      expect(response.body.data).toHaveProperty('locations');
      expect(response.body.data).toHaveProperty('price_ranges');
      expect(response.body.data).toHaveProperty('date_ranges');
    }, 10000);
  });

  describe('Location Search', () => {
    test('should handle location search with coordinates', async () => {
      const response = await request(app)
        .get('/api/events/search/location?lat=30.0444&lon=31.2357&radius=10')
        .expect(200);

      expect(response.body.data).toHaveProperty('events');
      expect(response.body.data).toHaveProperty('search_metadata');
      expect(response.body.data.search_metadata).toHaveProperty('coordinates');
    }, 10000);

    test('should require lat and lon parameters', async () => {
      const response = await request(app)
        .get('/api/events/search/location')
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
    }, 10000);
  });

  describe('Similar Events', () => {
    test('should return similar events for existing event', async () => {
      const response = await request(app)
        .get('/api/events/search/similar/550e8400-e29b-41d4-a716-446655440101')
        .expect(200);

      expect(response.body.data).toHaveProperty('events');
      expect(response.body.data).toHaveProperty('metadata');
      expect(response.body.data.metadata.source_event_id).toBe('550e8400-e29b-41d4-a716-446655440101');
    }, 10000);

    test('should return 404 for non-existent event', async () => {
      const response = await request(app)
        .get('/api/events/search/similar/non-existent-id')
        .expect(404);

      expect(response.body.error).toBe('Not Found');
    }, 10000);
  });

  describe('Error Handling', () => {
    test('should handle invalid parameters gracefully', async () => {
      const response = await request(app)
        .get('/api/events?page=invalid&limit=invalid&price_min=invalid')
        .expect(200);

      // Should still return results with default pagination
      expect(response.body.data).toHaveProperty('events');
      expect(response.body.data).toHaveProperty('pagination');
    }, 10000);
  });
});