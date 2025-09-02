const express = require('express');
const router = express.Router();
const cacheService = require('../cache/CacheService');
const redisManager = require('../cache/RedisManager');
const redisMonitor = require('../cache/RedisMonitor');
const redisClusterManager = require('../cache/RedisClusterManager');
const cacheInitializer = require('../cache/CacheInitializer');
const CacheKeys = require('../cache/CacheKeys');

// Cache health check endpoint
router.get('/health', async (req, res) => {
  try {
    const health = await cacheService.healthCheck();
    const status = health.status === 'healthy' ? 200 : 503;
    
    res.status(status).json({
      status: health.status,
      timestamp: new Date().toISOString(),
      clients: health.clients,
      pings: health.pings
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Cache statistics endpoint
router.get('/stats', async (req, res) => {
  try {
    const stats = await cacheService.getCacheStats();
    
    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      stats
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Cache key information endpoint
router.get('/keys/:pattern?', async (req, res) => {
  try {
    const pattern = req.params.pattern || '*';
    const clientType = req.query.client || 'cache';
    const limit = parseInt(req.query.limit) || 100;
    
    // Security check - only allow admins to view cache keys
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Admin access required'
      });
    }
    
    const keys = await redisManager.keys(pattern, clientType);
    const limitedKeys = keys.slice(0, limit);
    
    res.json({
      status: 'success',
      pattern,
      clientType,
      totalKeys: keys.length,
      returnedKeys: limitedKeys.length,
      keys: limitedKeys
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// Cache value inspection endpoint
router.get('/inspect/:key', async (req, res) => {
  try {
    const key = req.params.key;
    const clientType = req.query.client || 'cache';
    
    // Security check - only allow admins
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Admin access required'
      });
    }
    
    const value = await redisManager.get(key, clientType);
    const exists = await redisManager.exists(key, clientType);
    
    res.json({
      status: 'success',
      key,
      exists: !!exists,
      value,
      type: typeof value,
      clientType
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// Cache invalidation endpoint
router.delete('/invalidate/:pattern', async (req, res) => {
  try {
    const pattern = req.params.pattern;
    const clientType = req.query.client || 'cache';
    
    // Security check - only allow admins
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Admin access required'
      });
    }
    
    const deletedCount = await cacheService.invalidatePattern(pattern, clientType);
    
    res.json({
      status: 'success',
      message: `Invalidated ${deletedCount} keys matching pattern: ${pattern}`,
      pattern,
      deletedCount,
      clientType
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// Cache warming endpoint
router.post('/warm', async (req, res) => {
  try {
    const { keys } = req.body;
    
    // Security check - only allow admins
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Admin access required'
      });
    }
    
    if (!Array.isArray(keys)) {
      return res.status(400).json({
        status: 'error',
        message: 'Keys must be an array of warming functions'
      });
    }
    
    // Predefined warming functions for security
    const warmingFunctions = {
      'featured_events': {
        key: CacheKeys.event.featured(),
        fetchFunction: async () => {
          // This would call your event service
          return { message: 'Featured events cache warmed' };
        },
        ttl: 1800
      },
      'popular_events': {
        key: CacheKeys.event.popular('week'),
        fetchFunction: async () => {
          // This would call your event service
          return { message: 'Popular events cache warmed' };
        },
        ttl: 3600
      },
      'system_config': {
        key: CacheKeys.system.config('all'),
        fetchFunction: async () => {
          // This would call your config service
          return { message: 'System config cache warmed' };
        },
        ttl: 86400
      }
    };
    
    const validKeys = keys.filter(key => warmingFunctions[key]);
    const warmingTasks = validKeys.map(key => warmingFunctions[key]);
    
    const results = await cacheService.warmCache(warmingTasks);
    
    res.json({
      status: 'success',
      message: 'Cache warming completed',
      results,
      requestedKeys: keys,
      validKeys,
      invalidKeys: keys.filter(key => !warmingFunctions[key])
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// Cache flush endpoint (dangerous - admin only)
router.delete('/flush/:client?', async (req, res) => {
  try {
    const clientType = req.params.client || 'cache';
    
    // Security check - only allow super admins
    if (!req.user || req.user.role !== 'super_admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Super admin access required'
      });
    }
    
    // Additional confirmation required
    if (req.query.confirm !== 'yes-i-am-sure') {
      return res.status(400).json({
        status: 'error',
        message: 'Add ?confirm=yes-i-am-sure to confirm cache flush'
      });
    }
    
    const client = redisManager.getClient(clientType);
    await client.flushDb();
    
    res.json({
      status: 'success',
      message: `Flushed all keys from ${clientType} cache`,
      clientType,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// Cache metrics endpoint
router.get('/metrics', async (req, res) => {
  try {
    const timeframe = req.query.timeframe || 'hour';
    
    // Get cache hit/miss ratios and performance metrics
    const metrics = {
      timestamp: new Date().toISOString(),
      timeframe,
      clients: {}
    };
    
    const clientTypes = ['session', 'cache', 'realtime'];
    
    for (const clientType of clientTypes) {
      try {
        const client = redisManager.getClient(clientType);
        const info = await client.info('stats');
        
        metrics.clients[clientType] = {
          connected: client.isReady,
          info: cacheService.parseRedisInfo(info)
        };
      } catch (error) {
        metrics.clients[clientType] = {
          connected: false,
          error: error.message
        };
      }
    }
    
    res.json({
      status: 'success',
      metrics
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// Enhanced monitoring endpoints
router.get('/monitoring/alerts', (req, res) => {
  try {
    const { level, clientType, limit } = req.query;
    const alerts = redisMonitor.getAlerts(level, clientType, parseInt(limit) || 50);
    res.json({
      status: 'success',
      alerts,
      count: alerts.length
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

router.post('/monitoring/alerts/:alertId/acknowledge', (req, res) => {
  try {
    const { alertId } = req.params;
    
    // Security check - only allow admins
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Admin access required'
      });
    }
    
    const acknowledged = redisMonitor.acknowledgeAlert(alertId);
    
    if (acknowledged) {
      res.json({ 
        status: 'success',
        alertId,
        acknowledged: true
      });
    } else {
      res.status(404).json({ 
        status: 'error',
        message: 'Alert not found' 
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

router.get('/monitoring/summary', (req, res) => {
  try {
    const summary = redisMonitor.getHealthSummary();
    res.json({
      status: 'success',
      summary
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

router.get('/monitoring/performance', (req, res) => {
  try {
    const report = redisMonitor.getPerformanceReport();
    res.json({
      status: 'success',
      report
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// Cluster management endpoints
router.get('/cluster/status', async (req, res) => {
  try {
    if (process.env.NODE_ENV !== 'production' && process.env.REDIS_USE_SENTINEL !== 'true') {
      return res.json({
        status: 'info',
        message: 'Cluster mode not enabled',
        mode: 'standalone'
      });
    }

    const status = await redisClusterManager.getClusterStatus();
    res.json({
      status: 'success',
      cluster: status
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

router.post('/cluster/failover/:service', async (req, res) => {
  try {
    // Security check - only allow super admins
    if (!req.user || req.user.role !== 'super_admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Super admin access required'
      });
    }
    
    const { service } = req.params;
    
    if (!['session', 'cache', 'realtime'].includes(service)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid service name. Must be: session, cache, or realtime'
      });
    }

    const result = await redisClusterManager.forceFailover(service);
    res.json({
      status: 'success',
      service,
      result
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// Infrastructure management endpoints
router.get('/infrastructure/status', (req, res) => {
  try {
    const status = cacheInitializer.getStatus();
    res.json({
      status: 'success',
      infrastructure: status
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

router.get('/infrastructure/statistics', async (req, res) => {
  try {
    const stats = await cacheInitializer.getStatistics();
    res.json({
      status: 'success',
      statistics: stats
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

router.post('/infrastructure/restart', async (req, res) => {
  try {
    // Security check - only allow super admins
    if (!req.user || req.user.role !== 'super_admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Super admin access required'
      });
    }
    
    // Additional confirmation required
    if (req.body.confirm !== 'RESTART_CACHE_INFRASTRUCTURE') {
      return res.status(400).json({
        status: 'error',
        message: 'Send { "confirm": "RESTART_CACHE_INFRASTRUCTURE" } in request body'
      });
    }

    await cacheInitializer.restart();
    res.json({
      status: 'success',
      message: 'Cache infrastructure restarted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// Slow log endpoints
router.get('/slowlog/:clientType', async (req, res) => {
  try {
    const { clientType } = req.params;
    const { count = 10 } = req.query;
    
    if (!['session', 'cache', 'realtime'].includes(clientType)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid client type'
      });
    }

    const slowLog = await redisMonitor.getSlowLog(clientType, parseInt(count));
    res.json({
      status: 'success',
      clientType,
      entries: slowLog
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

router.delete('/slowlog/:clientType', async (req, res) => {
  try {
    // Security check - only allow admins
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Admin access required'
      });
    }
    
    const { clientType } = req.params;
    
    if (!['session', 'cache', 'realtime'].includes(clientType)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid client type'
      });
    }

    const cleared = await redisMonitor.clearSlowLog(clientType);
    res.json({
      status: 'success',
      clientType,
      cleared
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

module.exports = router;