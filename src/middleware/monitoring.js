const monitoringService = require('../services/monitoringService');

/**
 * Monitoring middleware for automatic request tracking
 */
const monitoringMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const userId = req.user?.id || null;

  // Track request start
  monitoringService.log('info', 'Request Started', {
    method: req.method,
    path: req.path,
    userId,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    query: req.query
  });

  // Override res.end to track response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const responseTime = Date.now() - startTime;
    
    // Track request completion
    monitoringService.trackRequest(
      req.method,
      req.path,
      res.statusCode,
      responseTime,
      userId
    );

    // Add custom attributes to New Relic
    monitoringService.addCustomAttributes({
      'request.path': req.path,
      'request.method': req.method,
      'response.statusCode': res.statusCode,
      'response.time': responseTime,
      'user.id': userId
    });

    // Record custom metric for response time
    monitoringService.recordCustomMetric('Custom/ResponseTime', responseTime);

    // Track business metrics for specific endpoints
    if (req.path.includes('/events') && req.method === 'POST') {
      monitoringService.recordCustomEvent('EventCreated', {
        userId,
        responseTime,
        statusCode: res.statusCode
      });
    }

    if (req.path.includes('/orders') && req.method === 'POST') {
      monitoringService.recordCustomEvent('OrderCreated', {
        userId,
        responseTime,
        statusCode: res.statusCode
      });
    }

    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

/**
 * Error monitoring middleware
 */
const errorMonitoringMiddleware = (err, req, res, next) => {
  // Log error with context
  monitoringService.log('error', 'Unhandled Error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    userId: req.user?.id || null,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  // Record error in New Relic
  if (global.newrelic) {
    global.newrelic.noticeError(err, {
      'request.path': req.path,
      'request.method': req.method,
      'user.id': req.user?.id || null
    });
  }

  // Track error metric
  monitoringService.recordCustomMetric('Custom/Errors', 1);

  next(err);
};

/**
 * Database query monitoring middleware
 */
const databaseMonitoringMiddleware = (req, res, next) => {
  // Store original query method
  const originalQuery = req.app.locals.knex?.raw || (() => {});
  
  if (req.app.locals.knex) {
    req.app.locals.knex.raw = function(...args) {
      const startTime = Date.now();
      const query = args[0];
      
      return originalQuery.apply(this, args)
        .then(result => {
          const duration = Date.now() - startTime;
          monitoringService.trackDatabaseQuery(query, duration, true);
          return result;
        })
        .catch(error => {
          const duration = Date.now() - startTime;
          monitoringService.trackDatabaseQuery(query, duration, false);
          throw error;
        });
    };
  }

  next();
};

module.exports = {
  monitoringMiddleware,
  errorMonitoringMiddleware,
  databaseMonitoringMiddleware
};
