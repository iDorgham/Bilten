/**
 * Log Ingestion API Routes
 * 
 * Handles log ingestion from frontend and scanner applications
 * for centralized logging through the backend service
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { logger, createChildLogger } = require('../utils/logger');

const router = express.Router();
const logIngestionLogger = createChildLogger({ component: 'log-ingestion' });

// Validation middleware for log entries
const validateLogEntry = [
  body('logs').isArray().withMessage('Logs must be an array'),
  body('logs.*.level').isIn(['ERROR', 'WARN', 'INFO', 'DEBUG', 'HTTP']).withMessage('Invalid log level'),
  body('logs.*.message').isString().notEmpty().withMessage('Message is required'),
  body('logs.*.service').isString().notEmpty().withMessage('Service is required'),
  body('logs.*.*timestamp').isISO8601().withMessage('Invalid timestamp format')
];

/**
 * POST /api/v1/logs
 * Ingests logs from frontend applications
 */
router.post('/', validateLogEntry, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logIngestionLogger.warn('Invalid log submission', {
        errors: errors.array(),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      return res.status(400).json({
        success: false,
        error: 'Invalid log format',
        details: errors.array()
      });
    }

    const { logs } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Process each log entry
    for (const logEntry of logs) {
      try {
        // Enhance log entry with server-side information
        const enhancedLogEntry = {
          ...logEntry,
          receivedAt: new Date().toISOString(),
          clientIp,
          userAgent,
          ingestionSource: 'api'
        };

        // Forward to appropriate logger based on level
        const level = logEntry.level.toLowerCase();
        const message = logEntry.message;
        const meta = {
          ...enhancedLogEntry,
          message: undefined // Remove message from meta to avoid duplication
        };

        // Use the appropriate logger method
        switch (level) {
          case 'error':
            logger.error(message, meta);
            break;
          case 'warn':
            logger.warn(message, meta);
            break;
          case 'info':
            logger.info(message, meta);
            break;
          case 'debug':
            logger.debug(message, meta);
            break;
          case 'http':
            logger.http(message, meta);
            break;
          default:
            logger.info(message, meta);
        }

      } catch (entryError) {
        logIngestionLogger.error('Failed to process log entry', {
          error: entryError.message,
          logEntry: JSON.stringify(logEntry).substring(0, 500) // Truncate for safety
        });
      }
    }

    logIngestionLogger.debug('Processed log batch', {
      count: logs.length,
      services: [...new Set(logs.map(log => log.service))],
      levels: [...new Set(logs.map(log => log.level))],
      clientIp,
      userAgent
    });

    res.json({
      success: true,
      processed: logs.length,
      message: 'Logs ingested successfully'
    });

  } catch (error) {
    logIngestionLogger.error('Log ingestion failed', {
      error: error.message,
      stack: error.stack,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error during log ingestion'
    });
  }
});

/**
 * GET /api/v1/logs/health
 * Health check endpoint for log ingestion service
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'log-ingestion',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/v1/logs/batch
 * Batch log ingestion with compression support
 */
router.post('/batch', validateLogEntry, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid log format',
        details: errors.array()
      });
    }

    const { logs } = req.body;
    const batchId = require('crypto').randomUUID();
    const clientIp = req.ip || req.connection.remoteAddress;

    logIngestionLogger.info('Processing batch log ingestion', {
      batchId,
      count: logs.length,
      clientIp,
      userAgent: req.get('User-Agent')
    });

    // Process logs in chunks to avoid overwhelming the system
    const chunkSize = 50;
    let processed = 0;
    let failed = 0;

    for (let i = 0; i < logs.length; i += chunkSize) {
      const chunk = logs.slice(i, i + chunkSize);
      
      for (const logEntry of chunk) {
        try {
          const enhancedLogEntry = {
            ...logEntry,
            batchId,
            receivedAt: new Date().toISOString(),
            clientIp,
            ingestionSource: 'batch-api'
          };

          const level = logEntry.level.toLowerCase();
          const message = logEntry.message;
          const meta = {
            ...enhancedLogEntry,
            message: undefined
          };

          logger[level] ? logger[level](message, meta) : logger.info(message, meta);
          processed++;

        } catch (entryError) {
          failed++;
          logIngestionLogger.error('Failed to process batch log entry', {
            batchId,
            error: entryError.message,
            entryIndex: i + chunk.indexOf(logEntry)
          });
        }
      }

      // Small delay between chunks to prevent overwhelming
      if (i + chunkSize < logs.length) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    logIngestionLogger.info('Batch log ingestion completed', {
      batchId,
      processed,
      failed,
      total: logs.length
    });

    res.json({
      success: true,
      batchId,
      processed,
      failed,
      total: logs.length,
      message: 'Batch logs ingested successfully'
    });

  } catch (error) {
    logIngestionLogger.error('Batch log ingestion failed', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error during batch log ingestion'
    });
  }
});

module.exports = router;