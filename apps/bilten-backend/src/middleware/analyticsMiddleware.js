/**
 * Analytics Middleware
 * Automatically tracks page views and API interactions
 */

const AnalyticsService = require('../services/AnalyticsService');
const { logger } = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Analytics tracking middleware
 */
const analyticsMiddleware = (options = {}) => {
  const {
    trackPageViews = true,
    trackApiCalls = false,
    excludePaths = ['/health', '/analytics/health'],
    sessionCookieName = 'bilten_session'
  } = options;

  return async (req, res, next) => {
    try {
      // Skip excluded paths
      if (excludePaths.some(path => req.path.startsWith(path))) {
        return next();
      }

      // Extract session ID from cookie or generate new one
      let sessionId = req.cookies?.[sessionCookieName];
      if (!sessionId) {
        sessionId = uuidv4();
        res.cookie(sessionCookieName, sessionId, {
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production'
        });
      }

      // Extract user information
      const userId = req.user?.id || null;
      const organizerId = req.user?.organizer_id || null;

      // Track page views for GET requests
      if (trackPageViews && req.method === 'GET') {
        const eventData = {
          event_type: 'page_view',
          event_name: `Page View: ${req.path}`,
          properties: {
            path: req.path,
            method: req.method,
            query: req.query,
            user_agent: req.get('User-Agent'),
            referrer: req.get('Referer')
          },
          user_id: userId,
          organizer_id: organizerId,
          session_id: sessionId,
          user_agent: req.get('User-Agent'),
          ip_address: req.ip || req.connection.remoteAddress,
          referrer: req.get('Referer'),
          page_url: `${req.protocol}://${req.get('host')}${req.originalUrl}`
        };

        // Track asynchronously to avoid blocking the request
        AnalyticsService.trackEvent(eventData).catch(error => {
          logger.warn('Failed to track page view:', error.message);
        });
      }

      // Track API calls if enabled
      if (trackApiCalls && req.method !== 'GET') {
        const eventData = {
          event_type: 'api_call',
          event_name: `API Call: ${req.method} ${req.path}`,
          properties: {
            path: req.path,
            method: req.method,
            body_size: req.get('Content-Length') || 0,
            user_agent: req.get('User-Agent')
          },
          user_id: userId,
          organizer_id: organizerId,
          session_id: sessionId,
          user_agent: req.get('User-Agent'),
          ip_address: req.ip || req.connection.remoteAddress,
          page_url: `${req.protocol}://${req.get('host')}${req.originalUrl}`
        };

        // Track asynchronously
        AnalyticsService.trackEvent(eventData).catch(error => {
          logger.warn('Failed to track API call:', error.message);
        });
      }

      // Add session ID to request for use in other middleware/routes
      req.sessionId = sessionId;

      next();
    } catch (error) {
      logger.error('Analytics middleware error:', error);
      // Don't block the request if analytics fails
      next();
    }
  };
};

/**
 * Event-specific analytics middleware
 * Tracks event-related interactions
 */
const eventAnalyticsMiddleware = async (req, res, next) => {
  try {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Track successful event views
      if (req.method === 'GET' && req.path.match(/^\/events\/[^\/]+$/) && res.statusCode === 200) {
        const eventId = req.params.id;
        const eventData = {
          event_type: 'event_view',
          event_name: 'Event Detail View',
          properties: {
            event_id: eventId,
            user_agent: req.get('User-Agent'),
            referrer: req.get('Referer')
          },
          user_id: req.user?.id || null,
          organizer_id: req.user?.organizer_id || null,
          session_id: req.sessionId,
          user_agent: req.get('User-Agent'),
          ip_address: req.ip || req.connection.remoteAddress,
          referrer: req.get('Referer'),
          page_url: `${req.protocol}://${req.get('host')}${req.originalUrl}`
        };

        AnalyticsService.trackEvent(eventData).catch(error => {
          logger.warn('Failed to track event view:', error.message);
        });
      }

      // Track event searches
      if (req.method === 'GET' && req.path === '/events' && req.query.q) {
        const eventData = {
          event_type: 'event_search',
          event_name: 'Event Search',
          properties: {
            search_query: req.query.q,
            filters: {
              category: req.query.category,
              city: req.query.city,
              price_min: req.query.price_min,
              price_max: req.query.price_max
            },
            results_count: data ? JSON.parse(data).data?.pagination?.total || 0 : 0
          },
          user_id: req.user?.id || null,
          organizer_id: req.user?.organizer_id || null,
          session_id: req.sessionId,
          user_agent: req.get('User-Agent'),
          ip_address: req.ip || req.connection.remoteAddress,
          referrer: req.get('Referer'),
          page_url: `${req.protocol}://${req.get('host')}${req.originalUrl}`
        };

        AnalyticsService.trackEvent(eventData).catch(error => {
          logger.warn('Failed to track event search:', error.message);
        });
      }

      return originalSend.call(this, data);
    };

    next();
  } catch (error) {
    logger.error('Event analytics middleware error:', error);
    next();
  }
};

/**
 * Ticket purchase analytics middleware
 */
const ticketAnalyticsMiddleware = async (req, res, next) => {
  try {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Track successful ticket purchases
      if (req.method === 'POST' && req.path.includes('/tickets') && res.statusCode === 201) {
        const eventData = {
          event_type: 'ticket_purchase',
          event_name: 'Ticket Purchase',
          properties: {
            event_id: req.body.event_id,
            ticket_type: req.body.ticket_type,
            quantity: req.body.quantity || 1,
            price: req.body.price || 0,
            payment_method: req.body.payment_method || 'unknown'
          },
          user_id: req.user?.id || null,
          organizer_id: req.body.organizer_id || null,
          session_id: req.sessionId,
          user_agent: req.get('User-Agent'),
          ip_address: req.ip || req.connection.remoteAddress,
          page_url: `${req.protocol}://${req.get('host')}${req.originalUrl}`
        };

        AnalyticsService.trackEvent(eventData).catch(error => {
          logger.warn('Failed to track ticket purchase:', error.message);
        });
      }

      return originalSend.call(this, data);
    };

    next();
  } catch (error) {
    logger.error('Ticket analytics middleware error:', error);
    next();
  }
};

/**
 * User registration analytics middleware
 */
const userAnalyticsMiddleware = async (req, res, next) => {
  try {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Track successful user registrations
      if (req.method === 'POST' && req.path.includes('/auth/register') && res.statusCode === 201) {
        const eventData = {
          event_type: 'user_registration',
          event_name: 'User Registration',
          properties: {
            registration_method: 'email',
            user_type: req.body.user_type || 'attendee',
            referrer: req.get('Referer')
          },
          user_id: null, // User doesn't exist yet
          organizer_id: null,
          session_id: req.sessionId,
          user_agent: req.get('User-Agent'),
          ip_address: req.ip || req.connection.remoteAddress,
          referrer: req.get('Referer'),
          page_url: `${req.protocol}://${req.get('host')}${req.originalUrl}`
        };

        AnalyticsService.trackEvent(eventData).catch(error => {
          logger.warn('Failed to track user registration:', error.message);
        });
      }

      // Track successful logins
      if (req.method === 'POST' && req.path.includes('/auth/login') && res.statusCode === 200) {
        const eventData = {
          event_type: 'user_login',
          event_name: 'User Login',
          properties: {
            login_method: 'email',
            user_agent: req.get('User-Agent')
          },
          user_id: req.user?.id || null,
          organizer_id: req.user?.organizer_id || null,
          session_id: req.sessionId,
          user_agent: req.get('User-Agent'),
          ip_address: req.ip || req.connection.remoteAddress,
          page_url: `${req.protocol}://${req.get('host')}${req.originalUrl}`
        };

        AnalyticsService.trackEvent(eventData).catch(error => {
          logger.warn('Failed to track user login:', error.message);
        });
      }

      return originalSend.call(this, data);
    };

    next();
  } catch (error) {
    logger.error('User analytics middleware error:', error);
    next();
  }
};

module.exports = {
  analyticsMiddleware,
  eventAnalyticsMiddleware,
  ticketAnalyticsMiddleware,
  userAnalyticsMiddleware
};