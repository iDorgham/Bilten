const cacheService = require('./CacheService');
const redisManager = require('./RedisManager');

class CacheAbstraction {
  constructor() {
    this.keyPrefixes = {
      user: 'user',
      event: 'event',
      ticket: 'ticket',
      session: 'session',
      branding: 'branding',
      analytics: 'analytics',
      search: 'search'
    };
    
    this.defaultTTLs = {
      user: 3600,        // 1 hour
      event: 1800,       // 30 minutes
      ticket: 900,       // 15 minutes
      session: 86400,    // 24 hours
      branding: 7200,    // 2 hours
      analytics: 300,    // 5 minutes
      search: 600        // 10 minutes
    };
  }

  // Generate standardized cache keys
  generateKey(entityType, identifier, subKey = null) {
    const prefix = this.keyPrefixes[entityType] || entityType;
    let key = `${prefix}:${identifier}`;
    
    if (subKey) {
      key += `:${subKey}`;
    }
    
    return key;
  }

  // User-related caching
  async cacheUser(userId, userData, ttl = null) {
    const key = this.generateKey('user', userId);
    const cacheTTL = ttl || this.defaultTTLs.user;
    
    return await cacheService.writeThrough(
      key,
      userData,
      async (data) => data, // Already have the data
      cacheTTL
    );
  }

  async getUser(userId) {
    const key = this.generateKey('user', userId);
    return await redisManager.get(key);
  }

  async invalidateUser(userId) {
    const patterns = [
      this.generateKey('user', userId),
      this.generateKey('user', userId, '*'),
      this.generateKey('session', '*', userId)
    ];
    
    let totalInvalidated = 0;
    for (const pattern of patterns) {
      totalInvalidated += await cacheService.invalidatePattern(pattern);
    }
    
    return totalInvalidated;
  }

  // Event-related caching
  async cacheEvent(eventId, eventData, ttl = null) {
    const key = this.generateKey('event', eventId);
    const cacheTTL = ttl || this.defaultTTLs.event;
    
    // Cache main event data
    await redisManager.set(key, eventData, cacheTTL);
    
    // Cache searchable fields separately for quick access
    const searchKey = this.generateKey('event', eventId, 'search');
    const searchData = {
      id: eventData.id,
      title: eventData.title,
      category: eventData.category,
      startDate: eventData.startDate,
      location: eventData.location
    };
    
    await redisManager.set(searchKey, searchData, cacheTTL);
    
    return eventData;
  }

  async getEvent(eventId, includeDetails = true) {
    if (includeDetails) {
      const key = this.generateKey('event', eventId);
      return await redisManager.get(key);
    } else {
      const searchKey = this.generateKey('event', eventId, 'search');
      return await redisManager.get(searchKey);
    }
  }

  async cacheEventsByOrganizer(organizerId, events, ttl = null) {
    const key = this.generateKey('event', 'organizer', organizerId);
    const cacheTTL = ttl || this.defaultTTLs.event;
    
    return await redisManager.set(key, events, cacheTTL);
  }

  async getEventsByOrganizer(organizerId) {
    const key = this.generateKey('event', 'organizer', organizerId);
    return await redisManager.get(key);
  }

  async invalidateEvent(eventId, organizerId = null) {
    const patterns = [
      this.generateKey('event', eventId),
      this.generateKey('event', eventId, '*'),
      this.generateKey('ticket', 'event', eventId),
      this.generateKey('analytics', 'event', eventId)
    ];
    
    if (organizerId) {
      patterns.push(this.generateKey('event', 'organizer', organizerId));
    }
    
    let totalInvalidated = 0;
    for (const pattern of patterns) {
      totalInvalidated += await cacheService.invalidatePattern(pattern);
    }
    
    return totalInvalidated;
  }

  // Ticket-related caching
  async cacheTicketAvailability(eventId, ticketData, ttl = null) {
    const key = this.generateKey('ticket', 'availability', eventId);
    const cacheTTL = ttl || this.defaultTTLs.ticket;
    
    return await redisManager.set(key, ticketData, cacheTTL);
  }

  async getTicketAvailability(eventId) {
    const key = this.generateKey('ticket', 'availability', eventId);
    return await redisManager.get(key);
  }

  async updateTicketCount(eventId, ticketTypeId, change) {
    const key = this.generateKey('ticket', 'count', `${eventId}:${ticketTypeId}`);
    
    // Use atomic increment/decrement
    const newCount = await redisManager.incrby(key, change, 'realtime');
    
    // Set expiration if this is a new key
    if (Math.abs(newCount) === Math.abs(change)) {
      await redisManager.expire(key, this.defaultTTLs.ticket, 'realtime');
    }
    
    // Invalidate availability cache
    await this.invalidateTicketAvailability(eventId);
    
    return newCount;
  }

  async invalidateTicketAvailability(eventId) {
    const patterns = [
      this.generateKey('ticket', 'availability', eventId),
      this.generateKey('ticket', 'count', `${eventId}:*`)
    ];
    
    let totalInvalidated = 0;
    for (const pattern of patterns) {
      totalInvalidated += await cacheService.invalidatePattern(pattern);
    }
    
    return totalInvalidated;
  }

  // Session management
  async createSession(sessionId, userId, sessionData, ttl = null) {
    const cacheTTL = ttl || this.defaultTTLs.session;
    
    // Store session data
    await redisManager.setSession(sessionId, {
      userId,
      ...sessionData,
      createdAt: new Date(),
      lastAccess: new Date()
    }, cacheTTL);
    
    // Store user-to-session mapping
    const userSessionKey = this.generateKey('session', 'user', userId);
    await redisManager.sadd(userSessionKey, sessionId);
    await redisManager.expire(userSessionKey, cacheTTL);
    
    return sessionId;
  }

  async getSession(sessionId) {
    return await redisManager.getSession(sessionId);
  }

  async updateSessionActivity(sessionId, ttl = null) {
    const session = await this.getSession(sessionId);
    if (session) {
      session.lastAccess = new Date();
      const cacheTTL = ttl || this.defaultTTLs.session;
      await redisManager.setSession(sessionId, session, cacheTTL);
    }
    return session;
  }

  async invalidateSession(sessionId) {
    const session = await this.getSession(sessionId);
    if (session && session.userId) {
      // Remove from user sessions set
      const userSessionKey = this.generateKey('session', 'user', session.userId);
      await redisManager.srem(userSessionKey, sessionId);
    }
    
    return await redisManager.deleteSession(sessionId);
  }

  async invalidateAllUserSessions(userId) {
    const userSessionKey = this.generateKey('session', 'user', userId);
    const sessionIds = await redisManager.smembers(userSessionKey);
    
    let invalidatedCount = 0;
    for (const sessionId of sessionIds) {
      await redisManager.deleteSession(sessionId);
      invalidatedCount++;
    }
    
    // Clear the user sessions set
    await redisManager.del(userSessionKey);
    
    return invalidatedCount;
  }

  // Branding-related caching
  async cacheBrandingSettings(organizerId, brandingData, ttl = null) {
    const key = this.generateKey('branding', organizerId);
    const cacheTTL = ttl || this.defaultTTLs.branding;
    
    return await redisManager.set(key, brandingData, cacheTTL);
  }

  async getBrandingSettings(organizerId) {
    const key = this.generateKey('branding', organizerId);
    return await redisManager.get(key);
  }

  async invalidateBrandingSettings(organizerId) {
    const patterns = [
      this.generateKey('branding', organizerId),
      this.generateKey('branding', organizerId, '*')
    ];
    
    let totalInvalidated = 0;
    for (const pattern of patterns) {
      totalInvalidated += await cacheService.invalidatePattern(pattern);
    }
    
    return totalInvalidated;
  }

  // Analytics caching
  async cacheAnalytics(entityType, entityId, metric, data, ttl = null) {
    const key = this.generateKey('analytics', `${entityType}:${entityId}`, metric);
    const cacheTTL = ttl || this.defaultTTLs.analytics;
    
    return await redisManager.set(key, data, cacheTTL, 'realtime');
  }

  async getAnalytics(entityType, entityId, metric) {
    const key = this.generateKey('analytics', `${entityType}:${entityId}`, metric);
    return await redisManager.get(key, 'realtime');
  }

  async incrementAnalyticsCounter(entityType, entityId, metric, increment = 1) {
    const key = this.generateKey('analytics', `${entityType}:${entityId}`, metric);
    return await redisManager.incrby(key, increment, 'realtime');
  }

  // Search result caching
  async cacheSearchResults(query, filters, results, ttl = null) {
    const queryHash = this.hashSearchQuery(query, filters);
    const key = this.generateKey('search', 'results', queryHash);
    const cacheTTL = ttl || this.defaultTTLs.search;
    
    return await redisManager.set(key, {
      query,
      filters,
      results,
      timestamp: new Date()
    }, cacheTTL);
  }

  async getSearchResults(query, filters) {
    const queryHash = this.hashSearchQuery(query, filters);
    const key = this.generateKey('search', 'results', queryHash);
    return await redisManager.get(key);
  }

  hashSearchQuery(query, filters) {
    const crypto = require('crypto');
    const searchString = JSON.stringify({ query, filters });
    return crypto.createHash('md5').update(searchString).digest('hex');
  }

  // Batch operations
  async batchCacheUsers(users, ttl = null) {
    const keyValuePairs = users.map(user => [
      this.generateKey('user', user.id),
      user
    ]);
    
    const cacheTTL = ttl || this.defaultTTLs.user;
    return await cacheService.batchSet(keyValuePairs, cacheTTL);
  }

  async batchGetUsers(userIds) {
    const keys = userIds.map(id => this.generateKey('user', id));
    return await cacheService.batchGet(keys);
  }

  async batchCacheEvents(events, ttl = null) {
    const keyValuePairs = events.map(event => [
      this.generateKey('event', event.id),
      event
    ]);
    
    const cacheTTL = ttl || this.defaultTTLs.event;
    return await cacheService.batchSet(keyValuePairs, cacheTTL);
  }

  // Cache warming
  async warmUserCache(userIds, fetchFunction) {
    const warmingFunctions = userIds.map(userId => ({
      key: this.generateKey('user', userId),
      fetchFunction: () => fetchFunction(userId),
      ttl: this.defaultTTLs.user,
      clientType: 'cache'
    }));
    
    return await cacheService.warmCache(warmingFunctions);
  }

  async warmEventCache(eventIds, fetchFunction) {
    const warmingFunctions = eventIds.map(eventId => ({
      key: this.generateKey('event', eventId),
      fetchFunction: () => fetchFunction(eventId),
      ttl: this.defaultTTLs.event,
      clientType: 'cache'
    }));
    
    return await cacheService.warmCache(warmingFunctions);
  }

  // Health and diagnostics
  async getCacheHealth() {
    return await cacheService.healthCheck();
  }

  async getCacheStats() {
    return await cacheService.getCacheStats();
  }

  // Configuration
  setDefaultTTL(entityType, ttl) {
    if (this.defaultTTLs.hasOwnProperty(entityType)) {
      this.defaultTTLs[entityType] = ttl;
    }
  }

  setKeyPrefix(entityType, prefix) {
    if (this.keyPrefixes.hasOwnProperty(entityType)) {
      this.keyPrefixes[entityType] = prefix;
    }
  }
}

// Export singleton instance
module.exports = new CacheAbstraction();