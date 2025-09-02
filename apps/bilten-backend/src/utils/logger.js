/**
 * Backend Service Logger
 * 
 * Simple logging implementation for the Bilten Backend API
 */

// Simple logger implementation
const createLogger = (service, options = {}) => {
  const logLevel = options.logLevel || 'info';
  const levels = { error: 0, warn: 1, info: 2, debug: 3 };
  const currentLevel = levels[logLevel] || 1;

  const formatMessage = (level, message, meta = {}) => {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level.toUpperCase()} [${service}]: ${message}${metaStr}`;
  };

  return {
    error: (message, meta) => {
      if (currentLevel >= 0) {
        console.error(formatMessage('error', message, meta));
      }
    },
    warn: (message, meta) => {
      if (currentLevel >= 1) {
        console.warn(formatMessage('warn', message, meta));
      }
    },
    info: (message, meta) => {
      if (currentLevel >= 2) {
        console.info(formatMessage('info', message, meta));
      }
    },
    debug: (message, meta) => {
      if (currentLevel >= 3) {
        console.debug(formatMessage('debug', message, meta));
      }
    }
  };
};

const createChildLogger = (parentLogger, context = {}) => {
  return {
    error: (message, meta) => parentLogger.error(message, { ...context, ...meta }),
    warn: (message, meta) => parentLogger.warn(message, { ...context, ...meta }),
    info: (message, meta) => parentLogger.info(message, { ...context, ...meta }),
    debug: (message, meta) => parentLogger.debug(message, { ...context, ...meta })
  };
};

const createHttpLoggerMiddleware = (logger) => {
  return (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    });
    next();
  };
};

const createErrorLoggerMiddleware = (logger) => {
  return (err, req, res, next) => {
    logger.error('Request error', { 
      error: err.message, 
      stack: err.stack,
      method: req.method,
      path: req.path
    });
    next(err);
  };
};

const setupGracefulShutdown = (logger) => {
  process.on('SIGTERM', () => {
    logger.info('Received SIGTERM, shutting down gracefully');
    process.exit(0);
  });
  
  process.on('SIGINT', () => {
    logger.info('Received SIGINT, shutting down gracefully');
    process.exit(0);
  });
};

// Create main logger for backend service
const logger = createLogger('backend', {
  logLevel: process.env.LOG_LEVEL || 'info',
  logDir: process.env.LOG_DIR || 'logs',
  enableConsole: process.env.NODE_ENV !== 'production',
  enableFile: true,
  enableLogstash: process.env.ENABLE_LOGSTASH === 'true'
});

// Create specialized loggers for different components
const dbLogger = createChildLogger(logger, { component: 'database' });
const cacheLogger = createChildLogger(logger, { component: 'cache' });
const authLogger = createChildLogger(logger, { component: 'auth' });
const apiLogger = createChildLogger(logger, { component: 'api' });
const migrationLogger = createChildLogger(logger, { component: 'migration' });

// Setup graceful shutdown
setupGracefulShutdown(logger);

// Export logger instances and middleware
module.exports = logger;

// Also export specialized loggers as properties
module.exports.logger = logger;
module.exports.dbLogger = dbLogger;
module.exports.cacheLogger = cacheLogger;
module.exports.authLogger = authLogger;
module.exports.apiLogger = apiLogger;
module.exports.migrationLogger = migrationLogger;
module.exports.httpLoggerMiddleware = createHttpLoggerMiddleware(logger);
module.exports.errorLoggerMiddleware = createErrorLoggerMiddleware(logger);
module.exports.createChildLogger = (context) => createChildLogger(logger, context);