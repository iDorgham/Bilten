const crypto = require('crypto');
const knex = require('../utils/database');

/**
 * Idempotency middleware for ensuring operations are only executed once
 * Uses database storage for idempotency keys with configurable TTL
 */
class IdempotencyMiddleware {
  constructor(options = {}) {
    this.ttl = options.ttl || 24 * 60 * 60 * 1000; // 24 hours default
    this.keyHeader = options.keyHeader || 'Idempotency-Key';
    this.required = options.required !== false; // Default to required
  }

  /**
   * Generate idempotency key from request
   */
  generateKey(req) {
    const { method, url, body, user } = req;
    const userId = user?.id || 'anonymous';
    
    // Create a hash of the request
    const requestHash = crypto
      .createHash('sha256')
      .update(`${method}:${url}:${JSON.stringify(body)}:${userId}`)
      .digest('hex');

    return requestHash;
  }

  /**
   * Get idempotency key from request
   */
  getKey(req) {
    // First try to get from header
    let key = req.headers[this.keyHeader.toLowerCase()];
    
    if (!key) {
      // Generate from request if not provided
      key = this.generateKey(req);
    }

    return key;
  }

  /**
   * Check if idempotency key exists and is valid
   */
  async checkKey(key, userId) {
    const result = await knex('idempotency_keys')
      .where('key', key)
      .where('user_id', userId)
      .where('expires_at', '>', new Date())
      .first();

    return result;
  }

  /**
   * Store idempotency key with response
   */
  async storeKey(key, userId, response, ttl = this.ttl) {
    const expiresAt = new Date(Date.now() + ttl);

    await knex('idempotency_keys').insert({
      key,
      user_id: userId,
      response_data: JSON.stringify(response),
      response_status: response.status || 200,
      expires_at: expiresAt,
      created_at: new Date()
    });
  }

  /**
   * Main middleware function
   */
  middleware() {
    return async (req, res, next) => {
      // Only apply to non-GET requests
      if (req.method === 'GET') {
        return next();
      }

      const userId = req.user?.id || 'anonymous';
      const key = this.getKey(req);

      try {
        // Check if we've seen this request before
        const existing = await this.checkKey(key, userId);

        if (existing) {
          // Return cached response
          const cachedResponse = JSON.parse(existing.response_data);
          
          // Set response status
          res.status(existing.response_status);
          
          // Return cached response
          return res.json({
            success: true,
            message: 'Idempotent response from cache',
            data: cachedResponse,
            idempotency_key: key,
            cached: true
          });
        }

        // Store original send method
        const originalSend = res.send;
        const originalJson = res.json;
        const responseData = {};

        // Override send method to capture response
        res.send = function(data) {
          responseData.body = data;
          responseData.status = res.statusCode;
          return originalSend.call(this, data);
        };

        // Override json method to capture response
        res.json = function(data) {
          responseData.body = data;
          responseData.status = res.statusCode;
          return originalJson.call(this, data);
        };

        // Continue to next middleware
        next();

        // Store the response after it's sent
        res.on('finish', async () => {
          try {
            await this.storeKey(key, userId, responseData);
          } catch (error) {
            console.error('Failed to store idempotency key:', error);
          }
        });

      } catch (error) {
        console.error('Idempotency middleware error:', error);
        
        if (this.required) {
          return res.status(500).json({
            success: false,
            message: 'Idempotency check failed',
            error: 'Internal server error'
          });
        }
        
        // Continue without idempotency if not required
        next();
      }
    };
  }

  /**
   * Cleanup expired idempotency keys
   */
  static async cleanup() {
    try {
      const deleted = await knex('idempotency_keys')
        .where('expires_at', '<', new Date())
        .del();

      console.log(`Cleaned up ${deleted} expired idempotency keys`);
      return deleted;
    } catch (error) {
      console.error('Failed to cleanup idempotency keys:', error);
      throw error;
    }
  }

  /**
   * Get idempotency key info
   */
  static async getKeyInfo(key, userId) {
    return await knex('idempotency_keys')
      .where('key', key)
      .where('user_id', userId)
      .first();
  }

  /**
   * Delete specific idempotency key
   */
  static async deleteKey(key, userId) {
    return await knex('idempotency_keys')
      .where('key', key)
      .where('user_id', userId)
      .del();
  }
}

/**
 * Create idempotency middleware instance
 */
function createIdempotencyMiddleware(options = {}) {
  const middleware = new IdempotencyMiddleware(options);
  return middleware.middleware();
}

/**
 * Idempotency key validation middleware
 */
function validateIdempotencyKey(req, res, next) {
  const keyHeader = 'Idempotency-Key';
  const key = req.headers[keyHeader.toLowerCase()];

  if (!key) {
    return res.status(400).json({
      success: false,
      message: 'Idempotency-Key header is required',
      error: 'MISSING_IDEMPOTENCY_KEY'
    });
  }

  // Validate key format (should be a valid UUID or hash)
  if (!/^[a-f0-9]{32,64}$/i.test(key)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid idempotency key format',
      error: 'INVALID_IDEMPOTENCY_KEY'
    });
  }

  next();
}

/**
 * Idempotency key generation utility
 */
function generateIdempotencyKey() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = {
  IdempotencyMiddleware,
  createIdempotencyMiddleware,
  validateIdempotencyKey,
  generateIdempotencyKey
};
