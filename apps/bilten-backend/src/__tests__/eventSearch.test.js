/**
 * Event Search and Filtering Tests
 */

const request = require('supertest');
const express = require('express');
const eventsRouter = require('../routes/events');

// Create test app
const app = express();
app.use(express.json());
app.use('/events', eventsRouter);

describe('Event Search and Filtering', () => {
  describe('GET /events', () => {
    test('should return all events with default pagination', async () => {
      const response = await request(app)
        .get('/events')
        .expect(200);

      expect(response.body.data).toHaveProperty('events');
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('limit', 20);
      expect(Array.isArray(response.body.data.events)).toBe(true);
    });

    test('should filter events by category', async () => {
      const response = await request(app)
        .get('/events?category=electronic')
        .expect(200);

      expect(response.body.data.events).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            category: 'electronic'
          })
        ])
      );
    });

    test('should filter events by status', async () => {
      const response = await request(app)
        .get('/events?status=published')
        .expect(200);

      response.body.data.events.forEach(event => {
        expect(event.status).toBe('published');
      });
    });

    test('should search events by text query', async () => {
      const response = await request(app)
        .get('/events?q=techno')
        .expect(200);

      expect(response.body.data).toHaveProperty('search_metadata');
      expect(response.body.data.search_metadata.query).toBe('techno');
      expect(Array.isArray(response.body.data.events)).toBe(true);
    });

    test('should filter events by city', async () => {
      const response = await request(app)
        .get('/events?city=Cairo')
        .expect(200);

      response.body.data.events.forEach(event => {
        expect(event.city).toContain('Cairo');
      });
    });

    test('should filter free events', async () => {
      const response = await request(app)
        .get('/events?is_free=true')
        .expect(200);

      response.body.data.events.forEach(event => {
        expect(event.is_free).toBe(true);
      });
    });

    test('should filter events by price range', async () => {
      const response = await request(app)
        .get('/events?price_min=50&price_max=100')
        .expect(200);

      response.body.data.events.forEach(event => {
        expect(event.base_price).toBeGreaterThanOrEqual(50);
        expect(event.base_price).toBeLessThanOrEqual(100);
      });
    });

    test('should support pagination', async () => {
      const response = await request(app)
        .get('/events?page=1&limit=1')
        .expect(200);

      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(1);
      expect(response.body.data.events.length).toBeLessThanOrEqual(1);
    });

    test('should support sorting by different fields', async () => {
      const response = await request(app)
        .get('/events?sort_by=base_price&sort_order=desc')
        .expect(200);

      const prices = response.body.data.events.map(event => event.base_price);
      const sortedPrices = [...prices].sort((a, b) => b - a);
      expect(prices).toEqual(sortedPrices);
    });

    test('should combine multiple filters', async () => {
      const response = await request(app)
        .get('/events?category=electronic&status=published&is_free=false')
        .expect(200);

      response.body.data.events.forEach(event => {
        expect(event.category).toBe('electronic');
        expect(event.status).toBe('published');
        expect(event.is_free).toBe(false);
      });
    });
  });

  describe('GET /events/search/autocomplete', () => {
    test('should return autocomplete suggestions', async () => {
      const response = await request(app)
        .get('/events/search/autocomplete?q=test')
        .expect(200);

      expect(response.body.data).toHaveProperty('suggestions');
      expect(Array.isArray(response.body.data.suggestions)).toBe(true);
    });

    test('should return empty suggestions for short queries', async () => {
      const response = await request(app)
        .get('/events/search/autocomplete?q=a')
        .expect(200);

      expect(response.body.data.suggestions).toEqual([]);
    });

    test('should limit suggestions based on limit parameter', async () => {
      const response = await request(app)
        .get('/events/search/autocomplete?q=event&limit=2')
        .expect(200);

      expect(response.body.data.suggestions.length).toBeLessThanOrEqual(2);
    });
  });

  describe('GET /events/search/trending', () => {
    test('should return trending events', async () => {
      const response = await request(app)
        .get('/events/search/trending')
        .expect(200);

      expect(response.body.data).toHaveProperty('events');
      expect(response.body.data).toHaveProperty('metadata');
      expect(Array.isArray(response.body.data.events)).toBe(true);
    });

    test('should support limit parameter', async () => {
      const response = await request(app)
        .get('/events/search/trending?limit=5')
        .expect(200);

      expect(response.body.data.events.length).toBeLessThanOrEqual(5);
    });

    test('should support timeframe parameter', async () => {
      const response = await request(app)
        .get('/events/search/trending?timeframe=day')
        .expect(200);

      expect(response.body.data.metadata.timeframe).toBe('day');
    });
  });

  describe('GET /events/search/filters', () => {
    test('should return available search filters', async () => {
      const response = await request(app)
        .get('/events/search/filters')
        .expect(200);

      expect(response.body.data).toHaveProperty('categories');
      expect(response.body.data).toHaveProperty('locations');
      expect(response.body.data).toHaveProperty('price_ranges');
      expect(response.body.data).toHaveProperty('date_ranges');
      
      expect(Array.isArray(response.body.data.categories)).toBe(true);
      expect(Array.isArray(response.body.data.locations)).toBe(true);
      expect(Array.isArray(response.body.data.price_ranges)).toBe(true);
      expect(Array.isArray(response.body.data.date_ranges)).toBe(true);
    });

    test('should return categories with counts', async () => {
      const response = await request(app)
        .get('/events/search/filters')
        .expect(200);

      response.body.data.categories.forEach(category => {
        expect(category).toHaveProperty('category');
        expect(category).toHaveProperty('count');
        expect(typeof category.count).toBe('number');
      });
    });

    test('should return locations with counts', async () => {
      const response = await request(app)
        .get('/events/search/filters')
        .expect(200);

      response.body.data.locations.forEach(location => {
        expect(location).toHaveProperty('city');
        expect(location).toHaveProperty('country');
        expect(location).toHaveProperty('count');
        expect(typeof location.count).toBe('number');
      });
    });
  });

  describe('GET /events/:id', () => {
    test('should return event by ID', async () => {
      const response = await request(app)
        .get('/events/550e8400-e29b-41d4-a716-446655440101')
        .expect(200);

      expect(response.body.data).toHaveProperty('event');
      expect(response.body.data).toHaveProperty('tickets');
      expect(response.body.data.event.id).toBe('550e8400-e29b-41d4-a716-446655440101');
    });

    test('should return 404 for non-existent event', async () => {
      const response = await request(app)
        .get('/events/non-existent-id')
        .expect(404);

      expect(response.body.error).toBe('Not Found');
    });
  });

  describe('POST /events', () => {
    test('should create a new event', async () => {
      const eventData = {
        title: 'Test Event',
        description: 'A test event',
        category: 'test',
        venue_name: 'Test Venue',
        venue_address: 'Test Address',
        start_date: '2025-06-01T20:00:00Z',
        base_price: 25.00
      };

      const response = await request(app)
        .post('/events')
        .send(eventData)
        .expect(201);

      expect(response.body.data).toHaveProperty('event');
      expect(response.body.data.event.title).toBe(eventData.title);
      expect(response.body.data.event.status).toBe('draft');
    });
  });

  describe('PUT /events/:id', () => {
    test('should update an existing event', async () => {
      const updateData = {
        title: 'Updated Event Title',
        description: 'Updated description'
      };

      const response = await request(app)
        .put('/events/550e8400-e29b-41d4-a716-446655440101')
        .send(updateData)
        .expect(200);

      expect(response.body.data).toHaveProperty('event');
      expect(response.body.data.event.title).toBe(updateData.title);
    });

    test('should return 404 for non-existent event', async () => {
      const updateData = {
        title: 'Updated Title'
      };

      await request(app)
        .put('/events/non-existent-id')
        .send(updateData)
        .expect(404);
    });
  });

  describe('DELETE /events/:id', () => {
    test('should delete an existing event', async () => {
      await request(app)
        .delete('/events/live-event-test-001')
        .expect(204);
    });

    test('should return 404 for non-existent event', async () => {
      await request(app)
        .delete('/events/non-existent-id')
        .expect(404);
    });
  });

  describe('Error handling', () => {
    test('should handle invalid pagination parameters gracefully', async () => {
      const response = await request(app)
        .get('/events?page=invalid&limit=invalid')
        .expect(200);

      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(20);
    });

    test('should handle invalid sort parameters gracefully', async () => {
      const response = await request(app)
        .get('/events?sort_by=invalid_field&sort_order=invalid_order')
        .expect(200);

      expect(Array.isArray(response.body.data.events)).toBe(true);
    });

    test('should handle invalid price range parameters gracefully', async () => {
      const response = await request(app)
        .get('/events?price_min=invalid&price_max=invalid')
        .expect(200);

      expect(Array.isArray(response.body.data.events)).toBe(true);
    });
  });
});