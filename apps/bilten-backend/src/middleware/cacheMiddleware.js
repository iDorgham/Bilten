const cacheService = require('../cache/CacheService');
const CacheKeys = require('../cache/CacheKeys');

// Cache middleware for API responses
const cacheMiddleware = (options = {}) => {
  const {
    ttl = 300, // 5 minutes default
    keyGenerator = null,
    condition = null,
    clientType = 'cache',
    skipCache = false
  } = options;

  return async (req, res, next) => {
    // Skip caching if disabled or for non-GET requests
    if (skipCache || req.method !== 'GET') {
      return next();
    }

    // Check condition if provided
    if (condition && !condition(req)) {
      return next();
    }

    // Generate cache key
    const cacheKey = keyGenerator 
      ? keyGenerator(req) 
      : generateDefaultCacheKey(req);

    try {
      // Try to get from cache
      const cachedResponse = await cacheService.get(cacheKey, clientType);
      
      if (cachedResponse) {
        // Set cache headers
        res.set({
          'X-Cache': 'HIT',
          'X-Cache-Key': cacheKey,
          'Cache-Control': `public, max-age=${ttl}`
        });
        
        return res.json(cachedResponse);
      }

      // Cache miss - intercept response
      const originalJson = res.json;
      
      res.json = function(data) {
        // Cache the response data
        cacheService.set(cacheKey, data, ttl, clientType)
          .catch(error => console.warn('Cache set error:', error));
        
        // Set cache headers
        res.set({
          'X-Cache': 'MISS',
          'X-Cache-Key': cacheKey,
          'Cache-Control': `public, max-age=${ttl}`
        });
        
        // Call original json method
        return originalJson.call(this, data);
      };

      next();
      
    } catch (error) {
      console.warn('Cache middleware error:', error);
      next();
    }
  };
};

// Generate default cache key from request
function generateDefaultCacheKey(req) {
  const { path, query, user } = req;
  const userId = user?.id || 'anonymous';
  
  // Create a deterministic key from path, query params, and user
  const keyData = {
    path,
    query: Object.keys(query).sort().reduce((sorted, key) => {
      sorted[key] = query[key];
      return sorted;
    }, {}),
    userId
  };
  
  return CacheKeys.hashKey(keyData);
}

// Specific cache middleware for different endpoints
const eventsCacheMiddleware = cacheMiddleware({
  ttl: 600, // 10 minutes
  keyGenerator: (req) => {
    const { query } = req;
    return CacheKeys.event.search(query.search || '', query);
  },
  condition: (req) => !req.user || req.user.role !== 'admin' // Don't cache for admins
});

const userProfileCacheMiddleware = cacheMiddleware({
  ttl: 1800, // 30 minutes
  keyGenerator: (req) => {
    const userId = req.params.userId || req.user?.id;
    return CacheKeys.user.profile(userId);
  },
  condition: (req) => req.user && (req.params.userId === req.user.id || req.user.role === 'admin')
});

const eventDetailsCacheMiddleware = cacheMiddleware({
  ttl: 300, // 5 minutes
  keyGenerator: (req) => CacheKeys.event.details(req.params.eventId),
  condition: (req) => req.params.eventId
});

const ticketAvailabilityCacheMiddleware = cacheMiddleware({
  ttl: 60, // 1 minute for real-time data
  keyGenerator: (req) => CacheKeys.event.availability(req.params.eventId),
  clientType: 'realtime'
});

// Cache invalidation middleware
const cacheInvalidationMiddleware = (entityType, options = {}) => {
  const { 
    keyGenerator = null,
    patterns = [],
    onSuccess = true,
    onError = false 
  } = options;

  return async (req, res, next) => {
    const originalJson = res.json;
    
    res.json = function(data) {
      const statusCode = res.statusCode;
      
      // Invalidate cache on successful operations or errors if specified
      if ((onSuccess && statusCode >= 200 && statusCode < 300) || 
          (onError && statusCode >= 400)) {
        
        setImmediate(async () => {
          try {
            if (keyGenerator) {
              const key = keyGenerator(req, data);
              await cacheService.del(key);
            }
            
            // Invalidate entity-specific patterns
            const entityId = req.params.id || req.params.eventId || req.params.userId;
            if (entityId) {
              await cacheService.invalidateRelated(entityType, entityId, patterns);
            }
            
          } catch (error) {
            console.warn('Cache invalidation error:', error);
          }
        });
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

// Rate limiting with cache
const rateLimitMiddleware = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100,
    keyGenerator = null,
    message = 'Too many requests'
  } = options;

  return async (req, res, next) => {
    try {
      const key = keyGenerator 
        ? keyGenerator(req) 
        : CacheKeys.rateLimit.api(req.user?.id || req.ip, req.path);
      
      const current = await cacheService.incrementCounter(key, 1, Math.ceil(windowMs / 1000));
      
      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': max,
        'X-RateLimit-Remaining': Math.max(0, max - current),
        'X-RateLimit-Reset': new Date(Date.now() + windowMs).toISOString()
      });
      
      if (current > max) {
        return res.status(429).json({
          error: 'Too Many Requests',
          message,
          retryAfter: Math.ceil(windowMs / 1000)
        });
      }
      
      next();
      
    } catch (error) {
      console.warn('Rate limit middleware error:', error);
      next(); // Continue on cache errors
    }
  };
};

// Session cache middleware
const sessionCacheMiddleware = async (req, res, next) => {
  if (req.user && req.user.id) {
    try {
      // Cache user session data
      const sessionData = {
        userId: req.user.id,
        role: req.user.role,
        lastActivity: new Date(),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      };
      
      await cacheService.cacheUserSession(req.user.id, sessionData);
      
    } catch (error) {
      console.warn('Session cache error:', error);
    }
  }
  
  next();
};

// Cache warming middleware for critical data
const cacheWarmingMiddleware = async (req, res, next) => {
  // Warm cache for frequently accessed data
  if (req.path === '/api/v1/events' && req.method === 'GET') {
    setImmediate(async () => {
      try {
        // Warm popular events cache
        await cacheService.warmCache([
          {
            key: CacheKeys.event.featured(),
            fetchFunction: async () => {
              // This would typically call a service to get featured events
              return [];
            },
            ttl: 1800
          },
          {
            key: CacheKeys.event.popular('week'),
            fetchFunction: async () => {
              // This would typically call a service to get popular events
              return [];
            },
            ttl: 3600
          }
        ]);
      } catch (error) {
        console.warn('Cache warming error:', error);
      }
    });
  }
  
  next();
};

module.exports = {
  cacheMiddleware,
  eventsCacheMiddleware,
  userProfileCacheMiddleware,
  eventDetailsCacheMiddleware,
  ticketAvailabilityCacheMiddleware,
  cacheInvalidationMiddleware,
  rateLimitMiddleware,
  sessionCacheMiddleware,
  cacheWarmingMiddleware
};