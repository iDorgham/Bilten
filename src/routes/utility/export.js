const express = require('express');
const { authenticateToken, requireRole } = require('../../middleware/auth');
const { body, query, validationResult } = require('express-validator');
const exportService = require('../../services/exportService');
const path = require('path');
const fs = require('fs');

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

/**
 * @route   POST /export/data
 * @desc    Export data in various formats
 * @access  Private (Admin, Organizer)
 */
router.post('/data', [
  body('type').isIn(['events', 'users', 'orders', 'tickets', 'analytics', 'tracking', 'financial']),
  body('format').optional().isIn(['csv', 'json']),
  body('filters').optional().isObject(),
  body('dateRange.startDate').optional().isISO8601(),
  body('dateRange.endDate').optional().isISO8601(),
  body('includeRelations').optional().isBoolean(),
  body('limit').optional().isInt({ min: 1, max: 10000 }),
  handleValidationErrors
], authenticateToken, requireRole(['admin', 'organizer']), async (req, res) => {
  try {
    const exportConfig = {
      type: req.body.type,
      format: req.body.format || 'csv',
      filters: req.body.filters || {},
      dateRange: req.body.dateRange || {},
      includeRelations: req.body.includeRelations || false,
      limit: req.body.limit || null
    };

    // For organizers, restrict to their own data
    if (req.user.role === 'organizer') {
      if (exportConfig.type === 'events') {
        exportConfig.filters.organizerId = req.user.id;
      } else if (exportConfig.type === 'orders') {
        // Organizers can only export orders for their events
        const userEvents = await req.app.locals.knex('events')
          .where('organizer_id', req.user.id)
          .pluck('id');
        exportConfig.filters.eventIds = userEvents;
      }
    }

    const result = await exportService.exportData(exportConfig);

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${exportConfig.type}_export_${timestamp}.${exportConfig.format}`;

    // Set response headers for file download
    res.setHeader('Content-Type', exportConfig.format === 'csv' ? 'text/csv' : 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.json({
      success: true,
      data: result.data,
      metadata: {
        ...result.metadata,
        filename,
        downloadUrl: `/api/v1/export/download/${filename}`
      }
    });

  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export data',
      error: error.message
    });
  }
});

/**
 * @route   GET /export/types
 * @desc    Get available export types and their metadata
 * @access  Private (Admin, Organizer)
 */
router.get('/types', authenticateToken, requireRole(['admin', 'organizer']), async (req, res) => {
  try {
    const availableTypes = exportService.getAvailableTypes();
    const typeMetadata = exportService.getExportTypeMetadata();

    // Filter metadata based on user role
    const filteredMetadata = {};
    for (const type of availableTypes) {
      if (req.user.role === 'admin' || type === 'events' || type === 'orders') {
        filteredMetadata[type] = typeMetadata[type];
      }
    }

    res.json({
      success: true,
      data: {
        availableTypes,
        typeMetadata: filteredMetadata
      }
    });

  } catch (error) {
    console.error('Get export types error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get export types'
    });
  }
});

/**
 * @route   GET /export/preview/:type
 * @desc    Get preview of export data (first 10 records)
 * @access  Private (Admin, Organizer)
 */
router.get('/preview/:type', [
  query('filters').optional().isObject(),
  query('dateRange.startDate').optional().isISO8601(),
  query('dateRange.endDate').optional().isISO8601(),
  handleValidationErrors
], authenticateToken, requireRole(['admin', 'organizer']), async (req, res) => {
  try {
    const exportConfig = {
      type: req.params.type,
      format: 'json',
      filters: req.query.filters || {},
      dateRange: req.query.dateRange || {},
      includeRelations: false,
      limit: 10
    };

    // For organizers, restrict to their own data
    if (req.user.role === 'organizer') {
      if (exportConfig.type === 'events') {
        exportConfig.filters.organizerId = req.user.id;
      } else if (exportConfig.type === 'orders') {
        const userEvents = await req.app.locals.knex('events')
          .where('organizer_id', req.user.id)
          .pluck('id');
        exportConfig.filters.eventIds = userEvents;
      }
    }

    const result = await exportService.exportData(exportConfig);

    res.json({
      success: true,
      data: {
        preview: result.data,
        totalRecords: result.metadata.recordCount,
        sampleSize: 10
      }
    });

  } catch (error) {
    console.error('Export preview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get export preview',
      error: error.message
    });
  }
});

/**
 * @route   POST /export/schedule
 * @desc    Schedule a recurring export
 * @access  Private (Admin only)
 */
router.post('/schedule', [
  body('type').isIn(['events', 'users', 'orders', 'tickets', 'analytics', 'tracking', 'financial']),
  body('format').isIn(['csv', 'json']),
  body('schedule').isIn(['daily', 'weekly', 'monthly']),
  body('filters').optional().isObject(),
  body('dateRange.startDate').optional().isISO8601(),
  body('dateRange.endDate').optional().isISO8601(),
  body('includeRelations').optional().isBoolean(),
  body('emailRecipients').optional().isArray(),
  handleValidationErrors
], authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const scheduleConfig = {
      type: req.body.type,
      format: req.body.format,
      schedule: req.body.schedule,
      filters: req.body.filters || {},
      dateRange: req.body.dateRange || {},
      includeRelations: req.body.includeRelations || false,
      emailRecipients: req.body.emailRecipients || [],
      createdBy: req.user.id,
      status: 'active'
    };

    // Save scheduled export to database
    const [scheduledExport] = await req.app.locals.knex('scheduled_exports')
      .insert(scheduleConfig)
      .returning('*');

    res.json({
      success: true,
      data: {
        scheduledExport,
        message: `Export scheduled for ${scheduleConfig.schedule} execution`
      }
    });

  } catch (error) {
    console.error('Schedule export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule export',
      error: error.message
    });
  }
});

/**
 * @route   GET /export/scheduled
 * @desc    Get list of scheduled exports
 * @access  Private (Admin only)
 */
router.get('/scheduled', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const scheduledExports = await req.app.locals.knex('scheduled_exports')
      .select('*')
      .orderBy('created_at', 'desc');

    res.json({
      success: true,
      data: scheduledExports
    });

  } catch (error) {
    console.error('Get scheduled exports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get scheduled exports'
    });
  }
});

/**
 * @route   DELETE /export/scheduled/:id
 * @desc    Cancel a scheduled export
 * @access  Private (Admin only)
 */
router.delete('/scheduled/:id', [
  query('id').isUUID(),
  handleValidationErrors
], authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const deletedCount = await req.app.locals.knex('scheduled_exports')
      .where('id', req.params.id)
      .del();

    if (deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled export not found'
      });
    }

    res.json({
      success: true,
      message: 'Scheduled export cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel scheduled export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel scheduled export'
    });
  }
});

/**
 * @route   GET /export/history
 * @desc    Get export history
 * @access  Private (Admin, Organizer)
 */
router.get('/history', [
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  handleValidationErrors
], authenticateToken, requireRole(['admin', 'organizer']), async (req, res) => {
  try {
    const limit = req.query.limit || 20;
    const offset = req.query.offset || 0;

    let query = req.app.locals.knex('export_history')
      .select('*')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    // For organizers, only show their exports
    if (req.user.role === 'organizer') {
      query = query.where('created_by', req.user.id);
    }

    const exportHistory = await query;

    res.json({
      success: true,
      data: exportHistory
    });

  } catch (error) {
    console.error('Get export history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get export history'
    });
  }
});

/**
 * @route   GET /export/download/:filename
 * @desc    Download exported file
 * @access  Private (Admin, Organizer)
 */
router.get('/download/:filename', authenticateToken, requireRole(['admin', 'organizer']), async (req, res) => {
  try {
    const { filename } = req.params;
    const filepath = path.join(__dirname, '../exports', filename);

    // Check if file exists
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({
        success: false,
        message: 'Export file not found'
      });
    }

    // Determine content type
    const contentType = filename.endsWith('.csv') ? 'text/csv' : 'application/json';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Stream the file
    const fileStream = fs.createReadStream(filepath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Download export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download export file'
    });
  }
});

/**
 * @route   POST /export/bulk
 * @desc    Export multiple data types in a single request
 * @access  Private (Admin only)
 */
router.post('/bulk', [
  body('exports').isArray({ min: 1, max: 5 }),
  body('exports.*.type').isIn(['events', 'users', 'orders', 'tickets', 'analytics', 'tracking', 'financial']),
  body('exports.*.format').isIn(['csv', 'json']),
  body('exports.*.filters').optional().isObject(),
  body('exports.*.dateRange').optional().isObject(),
  handleValidationErrors
], authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { exports: exportConfigs } = req.body;
    const results = [];

    for (const config of exportConfigs) {
      try {
        const result = await exportService.exportData({
          ...config,
          includeRelations: false
        });

        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `${config.type}_export_${timestamp}.${config.format}`;

        results.push({
          type: config.type,
          format: config.format,
          success: true,
          filename,
          recordCount: result.metadata.recordCount
        });

      } catch (error) {
        results.push({
          type: config.type,
          format: config.format,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      data: {
        results,
        totalExports: exportConfigs.length,
        successfulExports: results.filter(r => r.success).length
      }
    });

  } catch (error) {
    console.error('Bulk export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform bulk export',
      error: error.message
    });
  }
});

module.exports = router;
