const redisManager = require('./RedisManager');

class CacheService {
  constructor() {
    this.defaultTTL = {
      short: 300,      // 5 minutes
      medium: 3600,    // 1 hour
      long: 86400,     // 24 hours
      week: 604800     // 7 days
    };
  }

  // Cache-aside pattern (lazy loading)
  async cacheAside(key, fetchFunction, ttl = this.defaultTTL.medium, clientType = 'cache') {
    try {
      // Try to get from cache first
      let data = await redisManager.get(key, clientType);
      
      if (data !== null) {
        return data;
      }

      // Cache miss - fetch from source
      data = await fetchFunction();
      
      if (data !== null && data !== undefined) {
        // Store in cache for future requests
        await redisManager.set(key, data, ttl, clientType);
      }
      
      return data;
    } catch (error) {
      console.error(`Cache-aside error for key ${key}:`, error);
      // Fallback to direct fetch if cache fails
      return await fetchFunction();
    }
  }

  // Write-through pattern (write to cache and database simultaneously)
  async writeThrough(key, data, writeFunction, ttl = this.defaultTTL.medium, clientType = 'cache') {
    try {
      // Write to database first
      const result = await writeFunction(data);
      
      // Then write to cache (optional - don't fail if cache is unavailable)
      try {
        await redisManager.set(key, result, ttl, clientType);
      } catch (cacheError) {
        console.warn(`Cache write failed for key ${key}:`, cacheError.message);
      }
      
      return result;
    } catch (error) {
      console.error(`Write-through error for key ${key}:`, error);
      throw error;
    }
  }

  // Write-behind pattern (write to cache immediately, database asynchronously)
  async writeBehind(key, data, writeFunction, ttl = this.defaultTTL.medium, clientType = 'cache') {
    try {
      // Write to cache immediately
      await redisManager.set(key, data, ttl, clientType);
      
      // Schedule database write asynchronously
      setImmediate(async () => {
        try {
          await writeFunction(data);
        } catch (error) {
          console.error(`Write-behind database write failed for key ${key}:`, error);
          // Could implement retry logic here
        }
      });
      
      return data;
    } catch (error) {
      console.error(`Write-behind error for key ${key}:`, error);
      throw error;
    }
  }

  // Write-around pattern (write only to database, cache on read)
  async writeAround(key, data, writeFunction) {
    try {
      // Write only to database
      const result = await writeFunction(data);
      
      // Invalidate cache if it exists
      await redisManager.del(key);
      
      return result;
    } catch (error) {
      console.error(`Write-around error for key ${key}:`, error);
      throw error;
    }
  }

  // Multi-layer caching with different TTLs
  async multiLayerCache(key, fetchFunction, layers = []) {
    const defaultLayers = [
      { type: 'cache', ttl: this.defaultTTL.short, prefix: 'l1' },
      { type: 'cache', ttl: this.defaultTTL.medium, prefix: 'l2' },
      { type: 'cache', ttl: this.defaultTTL.long, prefix: 'l3' }
    ];
    
    const cacheLayers = layers.length > 0 ? layers : defaultLayers;
    
    // Try each cache layer in order
    for (const layer of cacheLayers) {
      const layerKey = `${layer.prefix}:${key}`;
      
      try {
        const data = await redisManager.get(layerKey, layer.type);
        
        if (data !== null) {
          // Populate higher-priority layers with found data
          const higherLayers = cacheLayers.slice(0, cacheLayers.indexOf(layer));
          for (const higherLayer of higherLayers) {
            const higherKey = `${higherLayer.prefix}:${key}`;
            await redisManager.set(higherKey, data, higherLayer.ttl, higherLayer.type);
          }
          
          return data;
        }
      } catch (error) {
        console.warn(`Layer ${layer.prefix} cache error:`, error);
        continue;
      }
    }
    
    // Cache miss on all layers - fetch from source
    try {
      const data = await fetchFunction();
      
      if (data !== null && data !== undefined) {
        // Populate all cache layers
        for (const layer of cacheLayers) {
          const layerKey = `${layer.prefix}:${key}`;
          try {
            await redisManager.set(layerKey, data, layer.ttl, layer.type);
          } catch (error) {
            console.warn(`Failed to populate layer ${layer.prefix}:`, error);
          }
        }
      }
      
      return data;
    } catch (error) {
      console.error(`Multi-layer cache fetch error for key ${key}:`, error);
      throw error;
    }
  }

  // Intelligent cache invalidation
  async invalidatePattern(pattern, clientType = 'cache') {
    try {
      return await redisManager.deletePattern(pattern, clientType);
    } catch (error) {
      console.error(`Pattern invalidation error for ${pattern}:`, error);
      return 0;
    }
  }

  async invalidateRelated(entityType, entityId, relationships = []) {
    const patterns = [
      `${entityType}:${entityId}`,
      `${entityType}:${entityId}:*`,
      ...relationships.map(rel => `${rel}:*:${entityType}:${entityId}`),
      ...relationships.map(rel => `${entityType}:${entityId}:${rel}:*`)
    ];
    
    let totalInvalidated = 0;
    
    for (const pattern of patterns) {
      try {
        const count = await this.invalidatePattern(pattern);
        totalInvalidated += count;
      } catch (error) {
        console.warn(`Failed to invalidate pattern ${pattern}:`, error);
      }
    }
    
    return totalInvalidated;
  }

  // Cache warming strategies
  async warmCache(warmingFunctions) {
    const results = [];
    
    for (const { key, fetchFunction, ttl, clientType } of warmingFunctions) {
      try {
        const data = await fetchFunction();
        await redisManager.set(key, data, ttl || this.defaultTTL.medium, clientType || 'cache');
        results.push({ key, status: 'success' });
      } catch (error) {
        console.error(`Cache warming failed for key ${key}:`, error);
        results.push({ key, status: 'failed', error: error.message });
      }
    }
    
    return results;
  }

  // Batch operations for efficiency
  async batchGet(keys, clientType = 'cache') {
    try {
      return await redisManager.mget(keys, clientType);
    } catch (error) {
      console.error('Batch get error:', error);
      return new Array(keys.length).fill(null);
    }
  }

  async batchSet(keyValuePairs, ttl = this.defaultTTL.medium, clientType = 'cache') {
    try {
      return await redisManager.mset(keyValuePairs, ttl, clientType);
    } catch (error) {
      console.error('Batch set error:', error);
      throw error;
    }
  }

  // Session-specific caching methods
  async cacheUserSession(userId, sessionData, ttl = 86400) {
    const key = `user:${userId}:session`;
    return await redisManager.setSession(key, sessionData, ttl);
  }

  async getUserSession(userId) {
    const key = `user:${userId}:session`;
    return await redisManager.getSession(key);
  }

  async invalidateUserSession(userId) {
    const key = `user:${userId}:session`;
    return await redisManager.deleteSession(key);
  }

  // Analytics and counters
  async incrementCounter(key, increment = 1, ttl = null) {
    try {
      const result = await redisManager.incrby(key, increment, 'realtime');
      
      if (ttl && result === increment) {
        // Set TTL only on first increment
        await redisManager.expire(key, ttl, 'realtime');
      }
      
      return result;
    } catch (error) {
      console.error(`Counter increment error for key ${key}:`, error);
      return 0;
    }
  }

  async getCounter(key) {
    try {
      const value = await redisManager.get(key, 'realtime');
      return parseInt(value) || 0;
    } catch (error) {
      console.error(`Counter get error for key ${key}:`, error);
      return 0;
    }
  }

  // Real-time data caching
  async cacheRealTimeData(key, data, ttl = 60) {
    return await redisManager.set(key, data, ttl, 'realtime');
  }

  async getRealTimeData(key) {
    return await redisManager.get(key, 'realtime');
  }

  // Event-based cache invalidation
  async onEntityUpdate(entityType, entityId, updateData) {
    // Invalidate direct cache
    await this.invalidatePattern(`${entityType}:${entityId}*`);
    
    // Invalidate related caches based on entity type
    switch (entityType) {
      case 'user':
        await this.invalidatePattern(`user:${entityId}:*`);
        await this.invalidatePattern(`session:*:${entityId}`);
        break;
        
      case 'event':
        await this.invalidatePattern(`event:${entityId}:*`);
        await this.invalidatePattern(`organizer:*:events`);
        await this.invalidatePattern(`tickets:event:${entityId}:*`);
        break;
        
      case 'ticket':
        if (updateData.eventId) {
          await this.invalidatePattern(`event:${updateData.eventId}:tickets:*`);
          await this.invalidatePattern(`event:${updateData.eventId}:availability`);
        }
        break;
        
      default:
        // Generic invalidation
        await this.invalidatePattern(`${entityType}:${entityId}:*`);
    }
  }

  // Cache statistics and monitoring
  async getCacheStats() {
    const stats = {};
    
    try {
      const clients = ['session', 'cache', 'realtime'];
      
      for (const clientType of clients) {
        const client = redisManager.getClient(clientType);
        const info = await client.info('memory');
        const keyspace = await client.info('keyspace');
        
        stats[clientType] = {
          memory: this.parseRedisInfo(info),
          keyspace: this.parseRedisInfo(keyspace),
          connected: client.isReady
        };
      }
      
      return stats;
    } catch (error) {
      console.error('Cache stats error:', error);
      return { error: error.message };
    }
  }

  parseRedisInfo(infoString) {
    const info = {};
    const lines = infoString.split('\r\n');
    
    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        info[key] = isNaN(value) ? value : Number(value);
      }
    }
    
    return info;
  }

  // Health check
  async healthCheck() {
    try {
      const status = redisManager.getStatus();
      const pings = {};
      
      for (const clientType of Object.keys(status.clients)) {
        try {
          await redisManager.ping(clientType);
          pings[clientType] = 'OK';
        } catch (error) {
          pings[clientType] = 'FAILED';
        }
      }
      
      return {
        status: status.connected ? 'healthy' : 'unhealthy',
        clients: status.clients,
        pings
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

module.exports = new CacheService();