const express = require('express');
const { authenticateToken, requireRole } = require('../../middleware/auth');
const TrackingService = require('../../services/trackingService');
const { body, query, param, validationResult } = require('express-validator');

const router = express.Router();

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// POST /tracking/activity - Track user activity
router.post('/activity', [
  body('eventType').isString().isLength({ min: 1, max: 50 }),
  body('sessionId').isString().isLength({ min: 1, max: 100 }),
  body('pageUrl').optional().isURL(),
  body('eventData').optional().isObject(),
  handleValidationErrors
], async (req, res) => {
  try {
    const trackingData = {
      userId: req.user?.id,
      sessionId: req.body.sessionId,
      eventType: req.body.eventType,
      eventData: req.body.eventData || {},
      pageUrl: req.body.pageUrl,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.connection.remoteAddress
    };

    const result = await TrackingService.trackUserActivity(trackingData);

    res.json({
      success: true,
      message: 'Activity tracked successfully',
      data: result
    });
  } catch (error) {
    console.error('Error tracking activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track activity'
    });
  }
});

// POST /tracking/event-interaction - Track event-specific interactions
router.post('/event-interaction', [
  body('eventId').isUUID(),
  body('interactionType').isString().isLength({ min: 1, max: 50 }),
  body('sessionId').isString().isLength({ min: 1, max: 100 }),
  body('interactionData').optional().isObject(),
  handleValidationErrors
], async (req, res) => {
  try {
    const trackingData = {
      userId: req.user?.id,
      eventId: req.body.eventId,
      interactionType: req.body.interactionType,
      interactionData: req.body.interactionData || {},
      sessionId: req.body.sessionId
    };

    const result = await TrackingService.trackEventInteraction(trackingData);

    res.json({
      success: true,
      message: 'Event interaction tracked successfully',
      data: result
    });
  } catch (error) {
    console.error('Error tracking event interaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track event interaction'
    });
  }
});

// POST /tracking/conversion - Track conversion events
router.post('/conversion', [
  body('conversionType').isString().isLength({ min: 1, max: 50 }),
  body('sessionId').isString().isLength({ min: 1, max: 100 }),
  body('conversionValue').optional().isFloat({ min: 0 }),
  body('conversionData').optional().isObject(),
  body('campaignId').optional().isString(),
  handleValidationErrors
], async (req, res) => {
  try {
    const trackingData = {
      userId: req.user?.id,
      conversionType: req.body.conversionType,
      conversionValue: req.body.conversionValue,
      conversionData: req.body.conversionData || {},
      sessionId: req.body.sessionId,
      campaignId: req.body.campaignId
    };

    const result = await TrackingService.trackConversion(trackingData);

    res.json({
      success: true,
      message: 'Conversion tracked successfully',
      data: result
    });
  } catch (error) {
    console.error('Error tracking conversion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track conversion'
    });
  }
});

// POST /tracking/performance - Track performance metrics
router.post('/performance', [
  body('endpoint').isString().isLength({ min: 1, max: 200 }),
  body('responseTime').isInt({ min: 0 }),
  body('statusCode').isInt({ min: 100, max: 599 }),
  body('errorMessage').optional().isString(),
  handleValidationErrors
], async (req, res) => {
  try {
    const trackingData = {
      endpoint: req.body.endpoint,
      responseTime: req.body.responseTime,
      statusCode: req.body.statusCode,
      errorMessage: req.body.errorMessage
    };

    const result = await TrackingService.trackPerformance(trackingData);

    res.json({
      success: true,
      message: 'Performance tracked successfully',
      data: result
    });
  } catch (error) {
    console.error('Error tracking performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track performance'
    });
  }
});

// GET /tracking/real-time - Get real-time analytics
router.get('/real-time', [
  query('timeRange').optional().isIn(['1h', '6h', '24h', '7d', '30d']),
  query('eventTypes').optional().isArray(),
  query('userId').optional().isUUID(),
  query('eventId').optional().isUUID(),
  handleValidationErrors
], authenticateToken, requireRole(['admin', 'organizer']), async (req, res) => {
  try {
    const filters = {
      timeRange: req.query.timeRange || '1h',
      eventTypes: req.query.eventTypes || [],
      userId: req.query.userId,
      eventId: req.query.eventId
    };

    const result = await TrackingService.getRealTimeAnalytics(filters);

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error getting real-time analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get real-time analytics'
    });
  }
});

// GET /tracking/user-journey/:userId - Get user journey analysis
router.get('/user-journey/:userId', [
  param('userId').isUUID(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('includeEvents').optional().isBoolean(),
  query('includeInteractions').optional().isBoolean(),
  handleValidationErrors
], authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const options = {
      startDate: req.query.startDate ? new Date(req.query.startDate) : null,
      endDate: req.query.endDate ? new Date(req.query.endDate) : null,
      includeEvents: req.query.includeEvents !== 'false',
      includeInteractions: req.query.includeInteractions !== 'false'
    };

    const result = await TrackingService.getUserJourney(req.params.userId, options);

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error getting user journey:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user journey'
    });
  }
});

// POST /tracking/funnel-analysis - Get funnel analysis
router.post('/funnel-analysis', [
  body('funnelSteps').isArray({ min: 2 }),
  body('funnelSteps.*.name').isString().isLength({ min: 1, max: 100 }),
  body('funnelSteps.*.eventType').isString().isLength({ min: 1, max: 50 }),
  body('timeRange').optional().isIn(['1h', '6h', '24h', '7d', '30d', '90d']),
  body('filters').optional().isObject(),
  handleValidationErrors
], authenticateToken, requireRole(['admin', 'organizer']), async (req, res) => {
  try {
    const funnelConfig = {
      funnelSteps: req.body.funnelSteps,
      timeRange: req.body.timeRange || '30d',
      filters: req.body.filters || {}
    };

    const result = await TrackingService.getFunnelAnalysis(funnelConfig);

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error getting funnel analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get funnel analysis'
    });
  }
});

// POST /tracking/export - Export analytics data
router.post('/export', [
  body('dataType').isIn(['user_activity', 'event_interactions', 'conversions', 'performance']),
  body('format').optional().isIn(['json', 'csv']),
  body('filters').optional().isObject(),
  body('dateRange.startDate').optional().isISO8601(),
  body('dateRange.endDate').optional().isISO8601(),
  handleValidationErrors
], authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const exportConfig = {
      dataType: req.body.dataType,
      format: req.body.format || 'json',
      filters: req.body.filters || {},
      dateRange: req.body.dateRange ? {
        startDate: req.body.dateRange.startDate ? new Date(req.body.dateRange.startDate) : null,
        endDate: req.body.dateRange.endDate ? new Date(req.body.dateRange.endDate) : null
      } : null
    };

    const result = await TrackingService.exportAnalyticsData(exportConfig);

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error exporting analytics data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export analytics data'
    });
  }
});

// GET /tracking/heatmap/:pageUrl - Get heatmap data for a page
router.get('/heatmap/:pageUrl', [
  param('pageUrl').isString(),
  query('timeRange').optional().isIn(['1h', '6h', '24h', '7d', '30d']),
  handleValidationErrors
], authenticateToken, requireRole(['admin', 'organizer']), async (req, res) => {
  try {
    const { pageUrl } = req.params;
    const timeRange = req.query.timeRange || '7d';
    const startDate = new Date(Date.now() - TrackingService.getTimeRangeInMs(timeRange));

    const heatmapData = await req.app.locals.knex('heatmap_data')
      .select('*')
      .where('page_url', pageUrl)
      .where('created_at', '>=', startDate)
      .orderBy('created_at', 'desc');

    // Aggregate heatmap data
    const aggregatedData = heatmapData.reduce((acc, record) => {
      const key = `${record.x_position},${record.y_position}`;
      if (!acc[key]) {
        acc[key] = {
          x: record.x_position,
          y: record.y_position,
          clicks: 0,
          hovers: 0
        };
      }
      acc[key].clicks += record.click_count;
      acc[key].hovers += record.hover_count;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        pageUrl,
        timeRange,
        heatmapData: Object.values(aggregatedData),
        totalRecords: heatmapData.length
      }
    });
  } catch (error) {
    console.error('Error getting heatmap data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get heatmap data'
    });
  }
});

// POST /tracking/heatmap - Track heatmap data
router.post('/heatmap', [
  body('pageUrl').isString(),
  body('xPosition').optional().isInt({ min: 0 }),
  body('yPosition').optional().isInt({ min: 0 }),
  body('elementSelector').optional().isString(),
  body('clickCount').optional().isInt({ min: 0 }),
  body('hoverCount').optional().isInt({ min: 0 }),
  body('scrollDepth').optional().isInt({ min: 0, max: 100 }),
  body('sessionId').isString(),
  handleValidationErrors
], async (req, res) => {
  try {
    const heatmapData = {
      pageUrl: req.body.pageUrl,
      xPosition: req.body.xPosition,
      yPosition: req.body.yPosition,
      elementSelector: req.body.elementSelector,
      clickCount: req.body.clickCount || 0,
      hoverCount: req.body.hoverCount || 0,
      scrollDepth: req.body.scrollDepth,
      sessionId: req.body.sessionId,
      userId: req.user?.id
    };

    const [record] = await req.app.locals.knex('heatmap_data')
      .insert(heatmapData)
      .returning('*');

    res.json({
      success: true,
      message: 'Heatmap data tracked successfully',
      data: { id: record.id }
    });
  } catch (error) {
    console.error('Error tracking heatmap data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track heatmap data'
    });
  }
});

// GET /tracking/campaign/:campaignId - Get campaign analytics
router.get('/campaign/:campaignId', [
  param('campaignId').isString(),
  query('timeRange').optional().isIn(['1h', '6h', '24h', '7d', '30d', '90d']),
  handleValidationErrors
], authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { campaignId } = req.params;
    const timeRange = req.query.timeRange || '30d';
    const startDate = new Date(Date.now() - TrackingService.getTimeRangeInMs(timeRange));

    // Get campaign details
    const campaign = await req.app.locals.knex('campaign_tracking')
      .where('campaign_id', campaignId)
      .first();

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Get campaign conversions
    const conversions = await req.app.locals.knex('conversion_tracking')
      .select('*')
      .where('campaign_id', campaignId)
      .where('created_at', '>=', startDate)
      .orderBy('created_at', 'desc');

    // Calculate campaign metrics
    const totalConversions = conversions.length;
    const totalValue = conversions.reduce((sum, conv) => sum + (conv.conversion_value || 0), 0);
    const avgValue = totalConversions > 0 ? totalValue / totalConversions : 0;

    res.json({
      success: true,
      data: {
        campaign,
        timeRange,
        metrics: {
          totalConversions,
          totalValue,
          avgValue,
          conversionRate: 0 // Would need total impressions to calculate
        },
        conversions
      }
    });
  } catch (error) {
    console.error('Error getting campaign analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get campaign analytics'
    });
  }
});

// GET /tracking/ab-test/:testName - Get A/B test results
router.get('/ab-test/:testName', [
  param('testName').isString(),
  handleValidationErrors
], authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { testName } = req.params;

    const abTest = await req.app.locals.knex('ab_testing')
      .where('test_name', testName)
      .first();

    if (!abTest) {
      return res.status(404).json({
        success: false,
        message: 'A/B test not found'
      });
    }

    res.json({
      success: true,
      data: abTest
    });
  } catch (error) {
    console.error('Error getting A/B test results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get A/B test results'
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Tracking service is healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
