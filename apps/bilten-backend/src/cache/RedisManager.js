const redis = require('redis');

class RedisManager {
  constructor() {
    this.clients = {};
    this.isConnected = false;
  }

  async initialize() {
    try {
      // Session Redis - for user sessions and authentication tokens
      this.clients.session = redis.createClient({
        url: process.env.REDIS_SESSION_URL || 'redis://localhost:6379',
        password: 'bilten_redis_session_password',
        retry_strategy: this.getRetryStrategy('session')
      });

      // Cache Redis - for application data and query results
      this.clients.cache = redis.createClient({
        url: process.env.REDIS_CACHE_URL || 'redis://localhost:6380',
        password: 'bilten_redis_cache_password',
        retry_strategy: this.getRetryStrategy('cache')
      });

      // Realtime Redis - for real-time analytics and counters
      this.clients.realtime = redis.createClient({
        url: process.env.REDIS_REALTIME_URL || 'redis://localhost:6381',
        password: 'bilten_redis_realtime_password',
        retry_strategy: this.getRetryStrategy('realtime')
      });

      // Connect all clients
      await Promise.all([
        this.clients.session.connect(),
        this.clients.cache.connect(),
        this.clients.realtime.connect()
      ]);

      // Set up error handlers
      Object.keys(this.clients).forEach(clientName => {
        this.clients[clientName].on('error', (err) => {
          console.error(`Redis ${clientName} error:`, err);
        });

        this.clients[clientName].on('connect', () => {
          console.log(`✅ Redis ${clientName} connected`);
        });

        this.clients[clientName].on('ready', () => {
          console.log(`✅ Redis ${clientName} ready`);
        });
      });

      this.isConnected = true;
      console.log('✅ All Redis clients initialized');

    } catch (error) {
      console.error('❌ Redis initialization failed:', error);
      throw error;
    }
  }

  getRetryStrategy(clientType) {
    return (options) => {
      if (options.error && options.error.code === 'ECONNREFUSED') {
        console.error(`Redis ${clientType} server refused connection`);
        return new Error(`Redis ${clientType} server refused connection`);
      }
      
      if (options.total_retry_time > 1000 * 60 * 60) {
        console.error(`Redis ${clientType} retry time exhausted`);
        return new Error(`Redis ${clientType} retry time exhausted`);
      }
      
      if (options.attempt > 10) {
        console.error(`Redis ${clientType} max attempts reached`);
        return undefined;
      }
      
      // Exponential backoff with jitter
      const delay = Math.min(options.attempt * 100, 3000);
      const jitter = Math.random() * 100;
      return delay + jitter;
    };
  }

  // Get specific Redis client
  getClient(type = 'cache') {
    if (!this.isConnected) {
      throw new Error('Redis clients not initialized');
    }
    
    if (!this.clients[type]) {
      throw new Error(`Redis client type '${type}' not found`);
    }
    
    return this.clients[type];
  }

  // Session management methods
  async setSession(sessionId, sessionData, ttl = 86400) { // 24 hours default
    const client = this.getClient('session');
    const key = `session:${sessionId}`;
    await client.setEx(key, ttl, JSON.stringify(sessionData));
  }

  async getSession(sessionId) {
    const client = this.getClient('session');
    const key = `session:${sessionId}`;
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async deleteSession(sessionId) {
    const client = this.getClient('session');
    const key = `session:${sessionId}`;
    await client.del(key);
  }

  async extendSession(sessionId, ttl = 86400) {
    const client = this.getClient('session');
    const key = `session:${sessionId}`;
    await client.expire(key, ttl);
  }

  // Cache management methods
  async set(key, value, ttl = 3600, clientType = 'cache') {
    const client = this.getClient(clientType);
    const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
    
    if (ttl > 0) {
      await client.setEx(key, ttl, serializedValue);
    } else {
      await client.set(key, serializedValue);
    }
  }

  async get(key, clientType = 'cache') {
    const client = this.getClient(clientType);
    const value = await client.get(key);
    
    if (!value) return null;
    
    try {
      return JSON.parse(value);
    } catch (error) {
      return value; // Return as string if not JSON
    }
  }

  async del(key, clientType = 'cache') {
    const client = this.getClient(clientType);
    return await client.del(key);
  }

  async exists(key, clientType = 'cache') {
    const client = this.getClient(clientType);
    return await client.exists(key);
  }

  async expire(key, ttl, clientType = 'cache') {
    const client = this.getClient(clientType);
    return await client.expire(key, ttl);
  }

  // Multi-key operations
  async mget(keys, clientType = 'cache') {
    const client = this.getClient(clientType);
    const values = await client.mGet(keys);
    
    return values.map(value => {
      if (!value) return null;
      try {
        return JSON.parse(value);
      } catch (error) {
        return value;
      }
    });
  }

  async mset(keyValuePairs, ttl = 3600, clientType = 'cache') {
    const client = this.getClient(clientType);
    const pipeline = client.multi();
    
    for (const [key, value] of keyValuePairs) {
      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
      if (ttl > 0) {
        pipeline.setEx(key, ttl, serializedValue);
      } else {
        pipeline.set(key, serializedValue);
      }
    }
    
    return await pipeline.exec();
  }

  // Pattern-based operations
  async keys(pattern, clientType = 'cache') {
    const client = this.getClient(clientType);
    return await client.keys(pattern);
  }

  async deletePattern(pattern, clientType = 'cache') {
    const client = this.getClient(clientType);
    const keys = await client.keys(pattern);
    
    if (keys.length > 0) {
      return await client.del(keys);
    }
    
    return 0;
  }

  // Hash operations for complex data structures
  async hset(key, field, value, clientType = 'cache') {
    const client = this.getClient(clientType);
    const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
    return await client.hSet(key, field, serializedValue);
  }

  async hget(key, field, clientType = 'cache') {
    const client = this.getClient(clientType);
    const value = await client.hGet(key, field);
    
    if (!value) return null;
    
    try {
      return JSON.parse(value);
    } catch (error) {
      return value;
    }
  }

  async hgetall(key, clientType = 'cache') {
    const client = this.getClient(clientType);
    const hash = await client.hGetAll(key);
    
    const result = {};
    for (const [field, value] of Object.entries(hash)) {
      try {
        result[field] = JSON.parse(value);
      } catch (error) {
        result[field] = value;
      }
    }
    
    return result;
  }

  async hdel(key, field, clientType = 'cache') {
    const client = this.getClient(clientType);
    return await client.hDel(key, field);
  }

  // Counter operations for analytics
  async incr(key, clientType = 'realtime') {
    const client = this.getClient(clientType);
    return await client.incr(key);
  }

  async incrby(key, increment, clientType = 'realtime') {
    const client = this.getClient(clientType);
    return await client.incrBy(key, increment);
  }

  async decr(key, clientType = 'realtime') {
    const client = this.getClient(clientType);
    return await client.decr(key);
  }

  // List operations for queues and logs
  async lpush(key, ...values) {
    const client = this.getClient('realtime');
    const serializedValues = values.map(v => typeof v === 'string' ? v : JSON.stringify(v));
    return await client.lPush(key, serializedValues);
  }

  async rpop(key) {
    const client = this.getClient('realtime');
    const value = await client.rPop(key);
    
    if (!value) return null;
    
    try {
      return JSON.parse(value);
    } catch (error) {
      return value;
    }
  }

  async llen(key) {
    const client = this.getClient('realtime');
    return await client.lLen(key);
  }

  // Set operations for unique collections
  async sadd(key, ...members) {
    const client = this.getClient('cache');
    const serializedMembers = members.map(m => typeof m === 'string' ? m : JSON.stringify(m));
    return await client.sAdd(key, serializedMembers);
  }

  async smembers(key) {
    const client = this.getClient('cache');
    const members = await client.sMembers(key);
    
    return members.map(member => {
      try {
        return JSON.parse(member);
      } catch (error) {
        return member;
      }
    });
  }

  async sismember(key, member) {
    const client = this.getClient('cache');
    const serializedMember = typeof member === 'string' ? member : JSON.stringify(member);
    return await client.sIsMember(key, serializedMember);
  }

  // Pub/Sub for real-time notifications
  async publish(channel, message) {
    const client = this.getClient('realtime');
    const serializedMessage = typeof message === 'string' ? message : JSON.stringify(message);
    return await client.publish(channel, serializedMessage);
  }

  // Health check
  async ping(clientType = 'cache') {
    const client = this.getClient(clientType);
    return await client.ping();
  }

  // Graceful shutdown
  async disconnect() {
    try {
      await Promise.all([
        this.clients.session?.quit(),
        this.clients.cache?.quit(),
        this.clients.realtime?.quit()
      ]);
      
      this.isConnected = false;
      console.log('✅ All Redis clients disconnected');
    } catch (error) {
      console.error('❌ Error disconnecting Redis clients:', error);
    }
  }

  // Get connection status
  getStatus() {
    return {
      connected: this.isConnected,
      clients: Object.keys(this.clients).reduce((status, clientName) => {
        status[clientName] = this.clients[clientName]?.isReady || false;
        return status;
      }, {})
    };
  }
}

// Export singleton instance
module.exports = new RedisManager();