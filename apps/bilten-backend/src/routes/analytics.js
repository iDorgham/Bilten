/**
 * Analytics Routes
 * API endpoints for event analytics and reporting
 */

const express = require('express');
const router = express.Router();
const AnalyticsService = require('../services/AnalyticsService');
const { logger } = require('../utils/logger');

// Track analytics event
router.post('/track', async (req, res) => {
  try {
    const {
      event_type,
      event_name,
      properties = {},
      user_id,
      organizer_id,
      session_id
    } = req.body;

    // Validate required fields
    if (!event_type || !event_name) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'event_type and event_name are required'
      });
    }

    // Extract additional data from request
    const eventData = {
      event_type,
      event_name,
      properties,
      user_id,
      organizer_id,
      session_id,
      user_agent: req.get('User-Agent'),
      ip_address: req.ip || req.connection.remoteAddress,
      referrer: req.get('Referer'),
      page_url: properties.page_url || req.get('Referer'),
      timestamp: new Date().toISOString()
    };

    const success = await AnalyticsService.trackEvent(eventData);

    if (success) {
      res.status(201).json({
        data: {
          tracked: true,
          event_id: eventData.event_id,
          timestamp: eventData.timestamp
        }
      });
    } else {
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to track analytics event'
      });
    }
  } catch (error) {
    logger.error('Error tracking analytics event:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to track analytics event'
    });
  }
});

// Get event analytics
router.get('/events/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { timeframe = 'week' } = req.query;

    // Validate timeframe
    const validTimeframes = ['hour', 'day', 'week', 'month', 'year'];
    if (!validTimeframes.includes(timeframe)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Invalid timeframe. Must be one of: ${validTimeframes.join(', ')}`
      });
    }

    const analytics = await AnalyticsService.getEventAnalytics(eventId, timeframe);

    res.json({
      data: analytics
    });
  } catch (error) {
    logger.error('Error getting event analytics:', error);
    
    if (error.message === 'Event not found') {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Event not found'
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get event analytics'
    });
  }
});

// Get organizer analytics dashboard
router.get('/organizers/:organizerId', async (req, res) => {
  try {
    const { organizerId } = req.params;
    const { timeframe = 'month' } = req.query;

    // Validate timeframe
    const validTimeframes = ['week', 'month', 'quarter', 'year'];
    if (!validTimeframes.includes(timeframe)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Invalid timeframe. Must be one of: ${validTimeframes.join(', ')}`
      });
    }

    const analytics = await AnalyticsService.getOrganizerAnalytics(organizerId, timeframe);

    res.json({
      data: analytics
    });
  } catch (error) {
    logger.error('Error getting organizer analytics:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get organizer analytics'
    });
  }
});

// Get platform analytics (admin only)
router.get('/platform', async (req, res) => {
  try {
    const { timeframe = 'month' } = req.query;

    // Validate timeframe
    const validTimeframes = ['week', 'month', 'quarter', 'year'];
    if (!validTimeframes.includes(timeframe)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Invalid timeframe. Must be one of: ${validTimeframes.join(', ')}`
      });
    }

    const analytics = await AnalyticsService.getPlatformAnalytics(timeframe);

    res.json({
      data: analytics
    });
  } catch (error) {
    logger.error('Error getting platform analytics:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get platform analytics'
    });
  }
});

// Get real-time analytics
router.get('/realtime/:entityType/:entityId', async (req, res) => {
  try {
    const { entityType, entityId } = req.params;

    // Validate entity type
    const validEntityTypes = ['event', 'organizer', 'platform'];
    if (!validEntityTypes.includes(entityType)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Invalid entity type. Must be one of: ${validEntityTypes.join(', ')}`
      });
    }

    const realTimeData = await AnalyticsService.getRealTimeAnalytics(entityType, entityId);

    res.json({
      data: realTimeData
    });
  } catch (error) {
    logger.error('Error getting real-time analytics:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get real-time analytics'
    });
  }
});

// Generate analytics report
router.get('/reports/:type/:entityId', async (req, res) => {
  try {
    const { type, entityId } = req.params;
    const { 
      timeframe = 'month',
      format = 'json'
    } = req.query;

    // Validate report type
    const validTypes = ['event', 'organizer', 'platform'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Invalid report type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // Validate format
    const validFormats = ['json', 'csv'];
    if (!validFormats.includes(format)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Invalid format. Must be one of: ${validFormats.join(', ')}`
      });
    }

    const report = await AnalyticsService.generateReport(type, entityId, {
      timeframe,
      format
    });

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-${entityId}-${timeframe}-report.csv"`);
      res.send(report);
    } else {
      res.json({
        data: report
      });
    }
  } catch (error) {
    logger.error('Error generating analytics report:', error);
    
    if (error.message.startsWith('Unknown report type')) {
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to generate analytics report'
    });
  }
});

// Get analytics summary for multiple events
router.post('/events/summary', async (req, res) => {
  try {
    const { event_ids, timeframe = 'week' } = req.body;

    if (!event_ids || !Array.isArray(event_ids) || event_ids.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'event_ids array is required'
      });
    }

    if (event_ids.length > 50) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Maximum 50 events allowed per request'
      });
    }

    const summaries = await Promise.all(
      event_ids.map(async (eventId) => {
        try {
          const analytics = await AnalyticsService.getEventAnalytics(eventId, timeframe);
          return {
            event_id: eventId,
            success: true,
            analytics
          };
        } catch (error) {
          return {
            event_id: eventId,
            success: false,
            error: error.message
          };
        }
      })
    );

    res.json({
      data: {
        summaries,
        timeframe,
        total_requested: event_ids.length,
        successful: summaries.filter(s => s.success).length,
        failed: summaries.filter(s => !s.success).length
      }
    });
  } catch (error) {
    logger.error('Error getting events analytics summary:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get events analytics summary'
    });
  }
});

// Get popular events based on analytics
router.get('/popular/events', async (req, res) => {
  try {
    const { 
      timeframe = 'week',
      limit = 20,
      category,
      location
    } = req.query;

    // Validate limit
    const maxLimit = 100;
    const parsedLimit = Math.min(parseInt(limit) || 20, maxLimit);

    // This would typically query ClickHouse for popular events
    // For now, we'll use the existing trending events functionality
    const Event = require('../models/Event');
    
    let filters = {};
    if (category && category !== 'all') {
      filters.category = category;
    }
    if (location) {
      filters.city = location;
    }

    const trendingEvents = await Event.getTrending(parsedLimit, timeframe);

    // Enhance with analytics data
    const popularEvents = await Promise.all(
      trendingEvents.map(async (event) => {
        try {
          const analytics = await AnalyticsService.getEventAnalytics(event.id, timeframe);
          return {
            ...event,
            analytics_summary: {
              views: analytics.metrics?.total_views || event.view_count || 0,
              registrations: analytics.metrics?.ticket_sales || event.registration_count || 0,
              popularity_score: event.popularity_score || 0
            }
          };
        } catch (error) {
          return {
            ...event,
            analytics_summary: {
              views: event.view_count || 0,
              registrations: event.registration_count || 0,
              popularity_score: event.popularity_score || 0
            }
          };
        }
      })
    );

    res.json({
      data: {
        events: popularEvents,
        metadata: {
          timeframe,
          limit: parsedLimit,
          total: popularEvents.length,
          filters: { category, location },
          generated_at: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    logger.error('Error getting popular events:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get popular events'
    });
  }
});

// Analytics health check
router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        analytics_service: 'operational',
        cache: 'operational',
        clickhouse: 'unknown'
      }
    };

    // Test ClickHouse connection if available
    try {
      if (AnalyticsService.clickhouseClient) {
        await AnalyticsService.clickhouseClient.query({ query: 'SELECT 1' });
        health.services.clickhouse = 'operational';
      }
    } catch (error) {
      health.services.clickhouse = 'degraded';
      health.warnings = ['ClickHouse connection failed, using fallback analytics'];
    }

    res.json({
      data: health
    });
  } catch (error) {
    logger.error('Error checking analytics health:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to check analytics health'
    });
  }
});

module.exports = router;