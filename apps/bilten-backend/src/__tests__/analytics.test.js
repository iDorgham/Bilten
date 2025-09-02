/**
 * Analytics Service and Routes Tests
 */

const request = require('supertest');
const express = require('express');
const AnalyticsService = require('../services/AnalyticsService');
const analyticsRoutes = require('../routes/analytics');
const { analyticsMiddleware } = require('../middleware/analyticsMiddleware');

// Mock dependencies
jest.mock('../services/AnalyticsService');
jest.mock('../models/Event');
jest.mock('../cache/CacheService');
jest.mock('../utils/logger');

describe('Analytics Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('trackEvent', () => {
    it('should track an analytics event successfully', async () => {
      const eventData = {
        event_type: 'page_view',
        event_name: 'Homepage Visit',
        user_id: 'user123',
        properties: { page: 'home' }
      };

      AnalyticsService.trackEvent.mockResolvedValue(true);

      const result = await AnalyticsService.trackEvent(eventData);
      
      expect(result).toBe(true);
      expect(AnalyticsService.trackEvent).toHaveBeenCalledWith(eventData);
    });

    it('should handle tracking failures gracefully', async () => {
      const eventData = {
        event_type: 'page_view',
        event_name: 'Homepage Visit'
      };

      AnalyticsService.trackEvent.mockResolvedValue(false);

      const result = await AnalyticsService.trackEvent(eventData);
      
      expect(result).toBe(false);
    });
  });

  describe('getEventAnalytics', () => {
    it('should return event analytics data', async () => {
      const eventId = 'event123';
      const timeframe = 'week';
      const mockAnalytics = {
        event_id: eventId,
        timeframe,
        metrics: {
          total_views: 150,
          unique_visitors: 120,
          conversion_rate: '8.5'
        }
      };

      AnalyticsService.getEventAnalytics.mockResolvedValue(mockAnalytics);

      const result = await AnalyticsService.getEventAnalytics(eventId, timeframe);
      
      expect(result).toEqual(mockAnalytics);
      expect(AnalyticsService.getEventAnalytics).toHaveBeenCalledWith(eventId, timeframe);
    });

    it('should handle event not found error', async () => {
      const eventId = 'nonexistent';
      const error = new Error('Event not found');

      AnalyticsService.getEventAnalytics.mockRejectedValue(error);

      await expect(AnalyticsService.getEventAnalytics(eventId, 'week'))
        .rejects.toThrow('Event not found');
    });
  });

  describe('getOrganizerAnalytics', () => {
    it('should return organizer analytics data', async () => {
      const organizerId = 'org123';
      const timeframe = 'month';
      const mockAnalytics = {
        organizer_id: organizerId,
        timeframe,
        summary: {
          total_events: 5,
          total_views: 1250,
          conversion_rate: '12.3'
        }
      };

      AnalyticsService.getOrganizerAnalytics.mockResolvedValue(mockAnalytics);

      const result = await AnalyticsService.getOrganizerAnalytics(organizerId, timeframe);
      
      expect(result).toEqual(mockAnalytics);
      expect(AnalyticsService.getOrganizerAnalytics).toHaveBeenCalledWith(organizerId, timeframe);
    });
  });

  describe('getRealTimeAnalytics', () => {
    it('should return real-time analytics data', async () => {
      const entityType = 'event';
      const entityId = 'event123';
      const mockRealTime = {
        timestamp: '2024-01-01T12:00:00Z',
        entity_type: entityType,
        entity_id: entityId,
        metrics: {
          current_viewers: 5,
          views_last_hour: 25
        }
      };

      AnalyticsService.getRealTimeAnalytics.mockResolvedValue(mockRealTime);

      const result = await AnalyticsService.getRealTimeAnalytics(entityType, entityId);
      
      expect(result).toEqual(mockRealTime);
      expect(AnalyticsService.getRealTimeAnalytics).toHaveBeenCalledWith(entityType, entityId);
    });
  });
});

describe('Analytics Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/analytics', analyticsRoutes);
    jest.clearAllMocks();
  });

  describe('POST /analytics/track', () => {
    it('should track an analytics event', async () => {
      const eventData = {
        event_type: 'page_view',
        event_name: 'Homepage Visit',
        properties: { page: 'home' }
      };

      AnalyticsService.trackEvent.mockResolvedValue(true);

      const response = await request(app)
        .post('/analytics/track')
        .send(eventData)
        .expect(201);

      expect(response.body.data.tracked).toBe(true);
      expect(AnalyticsService.trackEvent).toHaveBeenCalled();
    });

    it('should return 400 for missing required fields', async () => {
      const eventData = {
        properties: { page: 'home' }
      };

      const response = await request(app)
        .post('/analytics/track')
        .send(eventData)
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('event_type and event_name are required');
    });

    it('should return 500 when tracking fails', async () => {
      const eventData = {
        event_type: 'page_view',
        event_name: 'Homepage Visit'
      };

      AnalyticsService.trackEvent.mockResolvedValue(false);

      const response = await request(app)
        .post('/analytics/track')
        .send(eventData)
        .expect(500);

      expect(response.body.error).toBe('Internal Server Error');
    });
  });

  describe('GET /analytics/events/:eventId', () => {
    it('should return event analytics', async () => {
      const eventId = 'event123';
      const mockAnalytics = {
        event_id: eventId,
        metrics: { total_views: 150 }
      };

      AnalyticsService.getEventAnalytics.mockResolvedValue(mockAnalytics);

      const response = await request(app)
        .get(`/analytics/events/${eventId}`)
        .expect(200);

      expect(response.body.data).toEqual(mockAnalytics);
      expect(AnalyticsService.getEventAnalytics).toHaveBeenCalledWith(eventId, 'week');
    });

    it('should return 400 for invalid timeframe', async () => {
      const eventId = 'event123';

      const response = await request(app)
        .get(`/analytics/events/${eventId}?timeframe=invalid`)
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('Invalid timeframe');
    });

    it('should return 404 when event not found', async () => {
      const eventId = 'nonexistent';
      const error = new Error('Event not found');

      AnalyticsService.getEventAnalytics.mockRejectedValue(error);

      const response = await request(app)
        .get(`/analytics/events/${eventId}`)
        .expect(404);

      expect(response.body.error).toBe('Not Found');
    });
  });

  describe('GET /analytics/organizers/:organizerId', () => {
    it('should return organizer analytics', async () => {
      const organizerId = 'org123';
      const mockAnalytics = {
        organizer_id: organizerId,
        summary: { total_events: 5 }
      };

      AnalyticsService.getOrganizerAnalytics.mockResolvedValue(mockAnalytics);

      const response = await request(app)
        .get(`/analytics/organizers/${organizerId}`)
        .expect(200);

      expect(response.body.data).toEqual(mockAnalytics);
      expect(AnalyticsService.getOrganizerAnalytics).toHaveBeenCalledWith(organizerId, 'month');
    });

    it('should accept custom timeframe', async () => {
      const organizerId = 'org123';
      const timeframe = 'year';

      AnalyticsService.getOrganizerAnalytics.mockResolvedValue({});

      await request(app)
        .get(`/analytics/organizers/${organizerId}?timeframe=${timeframe}`)
        .expect(200);

      expect(AnalyticsService.getOrganizerAnalytics).toHaveBeenCalledWith(organizerId, timeframe);
    });
  });

  describe('GET /analytics/platform', () => {
    it('should return platform analytics', async () => {
      const mockAnalytics = {
        summary: { total_events: 100 }
      };

      AnalyticsService.getPlatformAnalytics.mockResolvedValue(mockAnalytics);

      const response = await request(app)
        .get('/analytics/platform')
        .expect(200);

      expect(response.body.data).toEqual(mockAnalytics);
      expect(AnalyticsService.getPlatformAnalytics).toHaveBeenCalledWith('month');
    });
  });

  describe('GET /analytics/realtime/:entityType/:entityId', () => {
    it('should return real-time analytics', async () => {
      const entityType = 'event';
      const entityId = 'event123';
      const mockRealTime = {
        metrics: { current_viewers: 5 }
      };

      AnalyticsService.getRealTimeAnalytics.mockResolvedValue(mockRealTime);

      const response = await request(app)
        .get(`/analytics/realtime/${entityType}/${entityId}`)
        .expect(200);

      expect(response.body.data).toEqual(mockRealTime);
      expect(AnalyticsService.getRealTimeAnalytics).toHaveBeenCalledWith(entityType, entityId);
    });

    it('should return 400 for invalid entity type', async () => {
      const response = await request(app)
        .get('/analytics/realtime/invalid/entity123')
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('Invalid entity type');
    });
  });

  describe('GET /analytics/reports/:type/:entityId', () => {
    it('should generate JSON report', async () => {
      const type = 'event';
      const entityId = 'event123';
      const mockReport = { data: 'report' };

      AnalyticsService.generateReport.mockResolvedValue(mockReport);

      const response = await request(app)
        .get(`/analytics/reports/${type}/${entityId}`)
        .expect(200);

      expect(response.body.data).toEqual(mockReport);
      expect(AnalyticsService.generateReport).toHaveBeenCalledWith(type, entityId, {
        timeframe: 'month',
        format: 'json'
      });
    });

    it('should generate CSV report', async () => {
      const type = 'event';
      const entityId = 'event123';
      const mockCSV = 'col1,col2\nval1,val2';

      AnalyticsService.generateReport.mockResolvedValue(mockCSV);

      const response = await request(app)
        .get(`/analytics/reports/${type}/${entityId}?format=csv`)
        .expect(200);

      expect(response.text).toBe(mockCSV);
      expect(response.headers['content-type']).toBe('text/csv; charset=utf-8');
    });

    it('should return 400 for invalid report type', async () => {
      const response = await request(app)
        .get('/analytics/reports/invalid/entity123')
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('Invalid report type');
    });
  });

  describe('POST /analytics/events/summary', () => {
    it('should return analytics summary for multiple events', async () => {
      const eventIds = ['event1', 'event2'];
      const mockAnalytics = { metrics: { views: 100 } };

      AnalyticsService.getEventAnalytics.mockResolvedValue(mockAnalytics);

      const response = await request(app)
        .post('/analytics/events/summary')
        .send({ event_ids: eventIds })
        .expect(200);

      expect(response.body.data.summaries).toHaveLength(2);
      expect(response.body.data.total_requested).toBe(2);
      expect(AnalyticsService.getEventAnalytics).toHaveBeenCalledTimes(2);
    });

    it('should return 400 for missing event_ids', async () => {
      const response = await request(app)
        .post('/analytics/events/summary')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('event_ids array is required');
    });

    it('should return 400 for too many events', async () => {
      const eventIds = Array.from({ length: 51 }, (_, i) => `event${i}`);

      const response = await request(app)
        .post('/analytics/events/summary')
        .send({ event_ids: eventIds })
        .expect(400);

      expect(response.body.message).toContain('Maximum 50 events allowed');
    });
  });

  describe('GET /analytics/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/analytics/health')
        .expect(200);

      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.services).toBeDefined();
    });
  });
});

describe('Analytics Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(analyticsMiddleware());
    
    // Mock route
    app.get('/test', (req, res) => {
      res.json({ message: 'test', sessionId: req.sessionId });
    });

    jest.clearAllMocks();
  });

  it('should add session ID to request', async () => {
    const response = await request(app)
      .get('/test')
      .expect(200);

    expect(response.body.sessionId).toBeDefined();
    expect(typeof response.body.sessionId).toBe('string');
  });

  it('should skip excluded paths', async () => {
    app.use('/health', analyticsMiddleware({ excludePaths: ['/health'] }));
    app.get('/health', (req, res) => res.json({ status: 'ok' }));

    await request(app)
      .get('/health')
      .expect(200);

    // Should not track analytics for excluded paths
    expect(AnalyticsService.trackEvent).not.toHaveBeenCalled();
  });
});