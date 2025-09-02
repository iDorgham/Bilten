// Centralized cache key management for consistency and easy maintenance

class CacheKeys {
  // User-related cache keys
  static user = {
    profile: (userId) => `user:${userId}:profile`,
    preferences: (userId) => `user:${userId}:preferences`,
    sessions: (userId) => `user:${userId}:sessions`,
    stats: (userId) => `user:${userId}:stats`,
    events: (userId) => `user:${userId}:events`,
    tickets: (userId) => `user:${userId}:tickets`,
    search: (query) => `user:search:${this.hashKey(query)}`,
    byEmail: (email) => `user:email:${email}`,
    byRole: (role, page = 1) => `users:role:${role}:page:${page}`
  };

  // Event-related cache keys
  static event = {
    details: (eventId) => `event:${eventId}:details`,
    tickets: (eventId) => `event:${eventId}:tickets`,
    availability: (eventId) => `event:${eventId}:availability`,
    stats: (eventId) => `event:${eventId}:stats`,
    attendees: (eventId) => `event:${eventId}:attendees`,
    organizer: (organizerId) => `organizer:${organizerId}:events`,
    category: (category, page = 1) => `events:category:${category}:page:${page}`,
    search: (query, filters = {}) => `events:search:${this.hashKey({ query, ...filters })}`,
    featured: () => `events:featured`,
    upcoming: (limit = 10) => `events:upcoming:${limit}`,
    popular: (timeframe = 'week') => `events:popular:${timeframe}`
  };

  // Ticket-related cache keys
  static ticket = {
    details: (ticketId) => `ticket:${ticketId}:details`,
    type: (ticketTypeId) => `ticket:type:${ticketTypeId}`,
    qrCode: (ticketId) => `ticket:${ticketId}:qr`,
    validation: (ticketNumber) => `ticket:validation:${ticketNumber}`,
    sales: (eventId, date) => `tickets:sales:${eventId}:${date}`,
    availability: (ticketTypeId) => `ticket:type:${ticketTypeId}:availability`
  };

  // Session and authentication cache keys
  static auth = {
    session: (sessionId) => `session:${sessionId}`,
    userSessions: (userId) => `user:${userId}:active_sessions`,
    refreshToken: (tokenId) => `refresh:${tokenId}`,
    passwordReset: (userId) => `password_reset:${userId}`,
    emailVerification: (userId) => `email_verify:${userId}`,
    loginAttempts: (identifier) => `login_attempts:${identifier}`,
    twoFactor: (userId) => `2fa:${userId}`
  };

  // Branding and customization cache keys
  static branding = {
    settings: (organizerId) => `branding:${organizerId}:settings`,
    logo: (organizerId) => `branding:${organizerId}:logo`,
    theme: (organizerId) => `branding:${organizerId}:theme`,
    domain: (domain) => `branding:domain:${domain}`,
    consistency: (organizerId) => `branding:${organizerId}:consistency`,
    guidelines: (organizerId) => `branding:${organizerId}:guidelines`
  };

  // Payment and transaction cache keys
  static payment = {
    transaction: (transactionId) => `payment:${transactionId}`,
    userTransactions: (userId, page = 1) => `user:${userId}:transactions:page:${page}`,
    eventRevenue: (eventId) => `event:${eventId}:revenue`,
    organizerRevenue: (organizerId, period) => `organizer:${organizerId}:revenue:${period}`,
    paymentMethods: (userId) => `user:${userId}:payment_methods`,
    refund: (transactionId) => `payment:${transactionId}:refund`
  };

  // Analytics and metrics cache keys
  static analytics = {
    eventMetrics: (eventId, timeframe) => `analytics:event:${eventId}:${timeframe}`,
    organizerMetrics: (organizerId, timeframe) => `analytics:organizer:${organizerId}:${timeframe}`,
    platformMetrics: (timeframe) => `analytics:platform:${timeframe}`,
    realTimeViews: (eventId) => `analytics:realtime:views:${eventId}`,
    realTimeTicketSales: (eventId) => `analytics:realtime:sales:${eventId}`,
    userActivity: (userId, date) => `analytics:user:${userId}:${date}`,
    popularEvents: (timeframe) => `analytics:popular_events:${timeframe}`,
    conversionRates: (eventId) => `analytics:conversion:${eventId}`
  };

  // Search and discovery cache keys
  static search = {
    events: (query, filters, page) => `search:events:${this.hashKey({ query, filters, page })}`,
    suggestions: (query) => `search:suggestions:${this.hashKey(query)}`,
    trending: () => `search:trending`,
    categories: () => `search:categories`,
    locations: (query) => `search:locations:${this.hashKey(query)}`,
    autocomplete: (query) => `search:autocomplete:${this.hashKey(query)}`
  };

  // Notification cache keys
  static notification = {
    userNotifications: (userId) => `notifications:user:${userId}`,
    unreadCount: (userId) => `notifications:unread:${userId}`,
    preferences: (userId) => `notifications:preferences:${userId}`,
    template: (templateId) => `notification:template:${templateId}`,
    queue: (type) => `notifications:queue:${type}`,
    sent: (notificationId) => `notification:sent:${notificationId}`
  };

  // File and asset cache keys
  static assets = {
    image: (imageId) => `asset:image:${imageId}`,
    thumbnail: (imageId, size) => `asset:thumbnail:${imageId}:${size}`,
    upload: (uploadId) => `asset:upload:${uploadId}`,
    userAssets: (userId) => `user:${userId}:assets`,
    eventAssets: (eventId) => `event:${eventId}:assets`,
    cdn: (url) => `asset:cdn:${this.hashKey(url)}`
  };

  // System and configuration cache keys
  static system = {
    config: (key) => `system:config:${key}`,
    features: () => `system:features`,
    maintenance: () => `system:maintenance`,
    version: () => `system:version`,
    health: () => `system:health`,
    stats: () => `system:stats`
  };

  // Rate limiting cache keys
  static rateLimit = {
    api: (userId, endpoint) => `rate_limit:api:${userId}:${endpoint}`,
    login: (identifier) => `rate_limit:login:${identifier}`,
    registration: (ip) => `rate_limit:registration:${ip}`,
    email: (userId) => `rate_limit:email:${userId}`,
    sms: (userId) => `rate_limit:sms:${userId}`
  };

  // Temporary data cache keys
  static temp = {
    upload: (uploadId) => `temp:upload:${uploadId}`,
    export: (exportId) => `temp:export:${exportId}`,
    import: (importId) => `temp:import:${importId}`,
    processing: (jobId) => `temp:processing:${jobId}`,
    verification: (code) => `temp:verification:${code}`
  };

  // Lock keys for preventing race conditions
  static lock = {
    ticketPurchase: (ticketTypeId) => `lock:ticket_purchase:${ticketTypeId}`,
    userUpdate: (userId) => `lock:user_update:${userId}`,
    eventUpdate: (eventId) => `lock:event_update:${eventId}`,
    paymentProcess: (transactionId) => `lock:payment:${transactionId}`,
    cacheRefresh: (key) => `lock:cache_refresh:${this.hashKey(key)}`
  };

  // Utility methods
  static hashKey(data) {
    const crypto = require('crypto');
    const str = typeof data === 'string' ? data : JSON.stringify(data);
    return crypto.createHash('md5').update(str).digest('hex');
  }

  static withPrefix(prefix, key) {
    return `${prefix}:${key}`;
  }

  static withSuffix(key, suffix) {
    return `${key}:${suffix}`;
  }

  static timeBasedKey(baseKey, timeframe = 'hour') {
    const now = new Date();
    let timeSuffix;

    switch (timeframe) {
      case 'minute':
        timeSuffix = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;
        break;
      case 'hour':
        timeSuffix = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${now.getHours()}`;
        break;
      case 'day':
        timeSuffix = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
        break;
      case 'week':
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        timeSuffix = `${weekStart.getFullYear()}-W${Math.ceil(weekStart.getDate() / 7)}`;
        break;
      case 'month':
        timeSuffix = `${now.getFullYear()}-${now.getMonth() + 1}`;
        break;
      default:
        timeSuffix = now.toISOString().split('T')[0];
    }

    return `${baseKey}:${timeSuffix}`;
  }

  static patternKey(baseKey, wildcard = '*') {
    return `${baseKey}:${wildcard}`;
  }

  // Get all cache key patterns for a specific entity type
  static getEntityPatterns(entityType, entityId) {
    const patterns = [];

    switch (entityType) {
      case 'user':
        patterns.push(
          this.user.profile(entityId),
          this.user.preferences(entityId),
          this.user.sessions(entityId),
          this.user.stats(entityId),
          this.user.events(entityId),
          this.user.tickets(entityId),
          this.patternKey(this.user.profile(entityId)),
          this.patternKey(this.auth.userSessions(entityId))
        );
        break;

      case 'event':
        patterns.push(
          this.event.details(entityId),
          this.event.tickets(entityId),
          this.event.availability(entityId),
          this.event.stats(entityId),
          this.event.attendees(entityId),
          this.patternKey(this.analytics.eventMetrics(entityId, '*')),
          this.patternKey(this.ticket.sales(entityId, '*'))
        );
        break;

      case 'ticket':
        patterns.push(
          this.ticket.details(entityId),
          this.ticket.qrCode(entityId),
          this.patternKey(this.ticket.validation('*'))
        );
        break;

      default:
        patterns.push(`${entityType}:${entityId}:*`);
    }

    return patterns;
  }
}

module.exports = CacheKeys;