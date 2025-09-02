const BaseRepository = require('../database/BaseRepository');
const { query } = require('../database/connection');
const crypto = require('crypto');

/**
 * MFAMethod Model
 * 
 * Represents individual MFA methods for users including TOTP, SMS, and email-based authentication.
 * This model handles the storage and management of MFA method configurations.
 */
class MFAMethod extends BaseRepository {
  constructor() {
    super('authentication.mfa_methods', 'mfa_method', 1800); // 30 minute cache
  }

  /**
   * Create a new MFA method for a user
   * @param {Object} methodData - MFA method data
   * @returns {Promise<Object>} Created MFA method
   */
  async create(methodData) {
    const {
      user_id,
      type,
      secret,
      phone_number,
      is_active = true
    } = methodData;

    // Validate required fields
    if (!user_id || !type) {
      throw new Error('User ID and type are required');
    }

    // Validate type
    const validTypes = ['totp', 'sms', 'email'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid MFA type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Validate type-specific requirements
    if (type === 'totp' && !secret) {
      throw new Error('Secret is required for TOTP method');
    }

    if (type === 'sms' && !phone_number) {
      throw new Error('Phone number is required for SMS method');
    }

    // Check if method already exists for this user and type
    const existing = await this.findByUserAndType(user_id, type);
    if (existing) {
      throw new Error(`${type.toUpperCase()} method already exists for this user`);
    }

    const newMethodData = {
      user_id,
      type,
      secret: type === 'totp' ? secret : null,
      phone_number: type === 'sms' ? phone_number : null,
      is_active
    };

    const method = await super.create(newMethodData);

    // Cache by user_id and type combination
    await this.setCache(this.getCacheKey(`${user_id}:${type}`, 'user_type'), method);

    return method;
  }

  /**
   * Find MFA method by user ID and type
   * @param {string} userId - User ID
   * @param {string} type - MFA method type
   * @param {boolean} useCache - Whether to use cache
   * @returns {Promise<Object|null>} MFA method or null
   */
  async findByUserAndType(userId, type, useCache = true) {
    const cacheKey = this.getCacheKey(`${userId}:${type}`, 'user_type');
    
    if (useCache) {
      const cached = await this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    const result = await query(
      'SELECT * FROM authentication.mfa_methods WHERE user_id = $1 AND type = $2',
      [userId, type]
    );

    const method = result.rows[0] || null;

    if (method && useCache) {
      await this.setCache(cacheKey, method);
      await this.setCache(this.getCacheKey(method.id), method);
    }

    return method;
  }

  /**
   * Find all MFA methods for a user
   * @param {string} userId - User ID
   * @param {boolean} activeOnly - Whether to return only active methods
   * @param {boolean} useCache - Whether to use cache
   * @returns {Promise<Array>} Array of MFA methods
   */
  async findByUser(userId, activeOnly = true, useCache = true) {
    const cacheKey = this.getCacheKey(`${userId}:${activeOnly ? 'active' : 'all'}`, 'user_methods');
    
    if (useCache) {
      const cached = await this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    let queryText = 'SELECT * FROM authentication.mfa_methods WHERE user_id = $1';
    const params = [userId];

    if (activeOnly) {
      queryText += ' AND is_active = true';
    }

    queryText += ' ORDER BY created_at ASC';

    const result = await query(queryText, params);
    const methods = result.rows;

    if (useCache) {
      await this.setCache(cacheKey, methods);
      
      // Cache individual methods
      for (const method of methods) {
        await this.setCache(this.getCacheKey(method.id), method);
        await this.setCache(this.getCacheKey(`${userId}:${method.type}`, 'user_type'), method);
      }
    }

    return methods;
  }

  /**
   * Update MFA method
   * @param {string} id - Method ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated method
   */
  async update(id, updateData) {
    const method = await super.update(id, updateData);

    if (method) {
      // Update related caches
      await this.setCache(this.getCacheKey(`${method.user_id}:${method.type}`, 'user_type'), method);
      
      // Invalidate user methods cache
      await this.invalidateCache(`${method.user_id}:active`, ['user_methods']);
      await this.invalidateCache(`${method.user_id}:all`, ['user_methods']);
    }

    return method;
  }

  /**
   * Activate MFA method
   * @param {string} id - Method ID
   * @returns {Promise<Object>} Updated method
   */
  async activate(id) {
    return await this.update(id, { is_active: true });
  }

  /**
   * Deactivate MFA method
   * @param {string} id - Method ID
   * @returns {Promise<Object>} Updated method
   */
  async deactivate(id) {
    return await this.update(id, { is_active: false });
  }

  /**
   * Delete MFA method with proper cleanup
   * @param {string} id - Method ID
   * @param {boolean} soft - Whether to soft delete
   * @returns {Promise<Object>} Deleted method
   */
  async delete(id, soft = true) {
    // Get method first to clear caches
    const method = await this.findById(id, false);
    
    const deletedMethod = await super.delete(id, soft);
    
    if (deletedMethod && method) {
      // Clear all related caches
      await this.invalidateCache(method.id);
      await this.invalidateCache(`${method.user_id}:${method.type}`, ['user_type']);
      await this.invalidateCache(`${method.user_id}:active`, ['user_methods']);
      await this.invalidateCache(`${method.user_id}:all`, ['user_methods']);
    }

    return deletedMethod;
  }

  /**
   * Generate TOTP secret
   * @returns {string} Base32 encoded secret
   */
  static generateTOTPSecret() {
    // Generate 20 random bytes and encode as base32
    const buffer = crypto.randomBytes(20);
    
    // Convert to base32 manually since Node.js doesn't support base32 natively
    const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    let bits = 0;
    let value = 0;
    
    for (let i = 0; i < buffer.length; i++) {
      value = (value << 8) | buffer[i];
      bits += 8;
      
      while (bits >= 5) {
        result += base32chars[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }
    
    if (bits > 0) {
      result += base32chars[(value << (5 - bits)) & 31];
    }
    
    return result;
  }

  /**
   * Validate phone number format
   * @param {string} phoneNumber - Phone number to validate
   * @returns {boolean} Whether phone number is valid
   */
  static validatePhoneNumber(phoneNumber) {
    // Basic phone number validation (E.164 format)
    // Must start with +, followed by country code (1-3 digits), then 4-14 more digits
    const phoneRegex = /^\+[1-9]\d{4,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  /**
   * Get MFA method statistics for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} MFA statistics
   */
  async getUserMFAStats(userId) {
    const result = await query(
      `SELECT 
         type,
         COUNT(*) as count,
         COUNT(CASE WHEN is_active THEN 1 END) as active_count,
         MIN(created_at) as first_created,
         MAX(updated_at) as last_updated
       FROM authentication.mfa_methods 
       WHERE user_id = $1 
       GROUP BY type
       ORDER BY type`,
      [userId]
    );

    const stats = {
      total_methods: 0,
      active_methods: 0,
      methods_by_type: {},
      has_totp: false,
      has_sms: false,
      has_email: false
    };

    for (const row of result.rows) {
      stats.total_methods += parseInt(row.count);
      stats.active_methods += parseInt(row.active_count);
      
      stats.methods_by_type[row.type] = {
        total: parseInt(row.count),
        active: parseInt(row.active_count),
        first_created: row.first_created,
        last_updated: row.last_updated
      };

      if (parseInt(row.active_count) > 0) {
        stats[`has_${row.type}`] = true;
      }
    }

    return stats;
  }

  /**
   * Check if user has any active MFA methods
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Whether user has active MFA
   */
  async hasActiveMFA(userId) {
    const result = await query(
      'SELECT COUNT(*) as count FROM authentication.mfa_methods WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    return parseInt(result.rows[0].count) > 0;
  }

  /**
   * Get active MFA types for user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of active MFA types
   */
  async getActiveMFATypes(userId) {
    const result = await query(
      'SELECT DISTINCT type FROM authentication.mfa_methods WHERE user_id = $1 AND is_active = true ORDER BY type',
      [userId]
    );

    return result.rows.map(row => row.type);
  }
}

module.exports = MFAMethod;