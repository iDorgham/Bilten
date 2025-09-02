const BaseRepository = require('../database/BaseRepository');
const { query } = require('../database/connection');
const jwt = require('jsonwebtoken');

/**
 * AuthSession Model
 * 
 * Manages user authentication sessions with comprehensive tracking
 * including device information, security monitoring, and token management.
 */
class AuthSession extends BaseRepository {
  constructor() {
    super('authentication.user_sessions', 'session', 1800); // 30 minutes cache
  }

  /**
   * Create a new authentication session
   */
  async create(sessionData) {
    const {
      user_id,
      session_token,
      refresh_token,
      token_type = 'Bearer',
      expires_at,
      refresh_expires_at,
      device_id,
      device_name,
      device_type = 'web',
      user_agent,
      ip_address,
      country,
      city,
      scopes = [],
      is_mfa_verified = false,
      risk_score = 0,
      metadata = {}
    } = sessionData;

    // Validate required fields
    if (!user_id || !session_token || !refresh_token || !expires_at || !refresh_expires_at) {
      throw new Error('User ID, tokens, and expiration times are required');
    }

    // Ensure user_id is an integer (for compatibility with existing schema)
    const userId = parseInt(user_id);
    if (isNaN(userId)) {
      throw new Error('User ID must be a valid integer');
    }

    const newSessionData = {
      user_id: userId,
      session_token,
      refresh_token,
      token_type,
      expires_at,
      refresh_expires_at,
      device_id,
      device_name,
      device_type,
      user_agent,
      ip_address,
      country,
      city,
      scopes: JSON.stringify(scopes),
      is_mfa_verified,
      risk_score,
      metadata: JSON.stringify(metadata),
      is_active: true,
      last_activity: new Date()
    };

    const session = await super.create(newSessionData);

    // Cache by device_id as well if provided
    if (device_id) {
      await this.setCache(this.getCacheKey(device_id, 'device'), session);
    }

    return session;
  }

  /**
   * Find session by refresh token
   */
  async findByRefreshToken(refreshToken, useCache = true, useReplica = true) {
    const cacheKey = this.getCacheKey(refreshToken, 'refresh_token');
    
    if (useCache) {
      const cached = await this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    const result = await query(
      `SELECT * FROM authentication.user_sessions 
       WHERE refresh_token = $1 AND is_active = true AND expires_at > NOW()`,
      [refreshToken],
      useReplica
    );

    const session = result.rows[0] || null;

    if (session && useCache) {
      await this.setCache(cacheKey, session);
      await this.setCache(this.getCacheKey(session.id), session);
    }

    return session;
  }

  /**
   * Find session by access token
   */
  async findByAccessToken(accessToken, useCache = true, useReplica = true) {
    const cacheKey = this.getCacheKey(accessToken, 'access_token');
    
    if (useCache) {
      const cached = await this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    const result = await query(
      `SELECT * FROM authentication.user_sessions 
       WHERE session_token = $1 AND is_active = true AND expires_at > NOW()`,
      [accessToken],
      useReplica
    );

    const session = result.rows[0] || null;

    if (session && useCache) {
      await this.setCache(cacheKey, session);
      await this.setCache(this.getCacheKey(session.id), session);
    }

    return session;
  }

  /**
   * Find active sessions for a user
   */
  async findActiveSessionsByUser(userId, useReplica = true) {
    const result = await query(
      `SELECT * FROM authentication.user_sessions 
       WHERE user_id = $1 AND is_active = true AND expires_at > NOW()
       ORDER BY last_activity DESC`,
      [userId],
      useReplica
    );

    return result.rows;
  }

  /**
   * Find sessions by device
   */
  async findByDevice(deviceId, userId = null, useReplica = true) {
    let queryText = `
      SELECT * FROM authentication.user_sessions 
      WHERE device_id = $1 AND is_active = true AND expires_at > NOW()
    `;
    let params = [deviceId];

    if (userId) {
      queryText += ' AND user_id = $2';
      params.push(userId);
    }

    queryText += ' ORDER BY last_activity DESC';

    const result = await query(queryText, params, useReplica);
    return result.rows;
  }

  /**
   * Update session activity
   */
  async updateActivity(sessionId, metadata = {}) {
    const result = await query(
      `UPDATE authentication.user_sessions 
       SET last_activity = NOW(), 
           metadata = COALESCE(metadata, '{}') || $2,
           updated_at = NOW()
       WHERE id = $1 AND is_active = true
       RETURNING *`,
      [sessionId, JSON.stringify(metadata)]
    );

    const session = result.rows[0];
    
    if (session) {
      // Update cache
      await this.setCache(this.getCacheKey(session.id), session);
    }

    return session;
  }

  /**
   * Update session tokens
   */
  async updateTokens(sessionId, newAccessToken, newRefreshToken = null, expiresAt = null) {
    const updateData = {
      session_token: newAccessToken,
      last_activity: new Date(),
      updated_at: new Date()
    };

    if (newRefreshToken) {
      updateData.refresh_token = newRefreshToken;
    }

    if (expiresAt) {
      updateData.expires_at = expiresAt;
    }

    const session = await super.update(sessionId, updateData);

    if (session) {
      // Update token caches
      await this.setCache(this.getCacheKey(newAccessToken, 'access_token'), session);
      if (newRefreshToken) {
        await this.setCache(this.getCacheKey(newRefreshToken, 'refresh_token'), session);
      }
    }

    return session;
  }

  /**
   * Invalidate a session
   */
  async invalidate(sessionId, reason = 'manual') {
    const session = await this.findById(sessionId, false);
    if (!session) {
      return null;
    }

    const result = await query(
      `UPDATE authentication.user_sessions 
       SET is_active = false, 
           metadata = COALESCE(metadata, '{}') || $2,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [sessionId, JSON.stringify({ invalidation_reason: reason, invalidated_at: new Date() })]
    );

    const invalidatedSession = result.rows[0];

    if (invalidatedSession) {
      // Clear caches
      await this.invalidateCache(sessionId);
      await this.invalidateCache(session.session_token, ['access_token']);
      await this.invalidateCache(session.refresh_token, ['refresh_token']);
      if (session.device_id) {
        await this.invalidateCache(session.device_id, ['device']);
      }
    }

    return invalidatedSession;
  }

  /**
   * Invalidate all sessions for a user
   */
  async invalidateAllUserSessions(userId, excludeSessionId = null, reason = 'security') {
    let queryText = `
      UPDATE authentication.user_sessions 
      SET is_active = false, 
          metadata = COALESCE(metadata, '{}') || $2,
          updated_at = NOW()
      WHERE user_id = $1 AND is_active = true
    `;
    let params = [userId, JSON.stringify({ invalidation_reason: reason, invalidated_at: new Date() })];

    if (excludeSessionId) {
      queryText += ' AND id != $3';
      params.push(excludeSessionId);
    }

    queryText += ' RETURNING *';

    const result = await query(queryText, params);
    const invalidatedSessions = result.rows;

    // Clear caches for all invalidated sessions
    for (const session of invalidatedSessions) {
      await this.invalidateCache(session.id);
      await this.invalidateCache(session.session_token, ['access_token']);
      await this.invalidateCache(session.refresh_token, ['refresh_token']);
      if (session.device_id) {
        await this.invalidateCache(session.device_id, ['device']);
      }
    }

    return invalidatedSessions.length;
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions() {
    const result = await query(
      `DELETE FROM authentication.user_sessions 
       WHERE expires_at < NOW() OR refresh_expires_at < NOW()
       RETURNING id, session_token, refresh_token, device_id`
    );

    const deletedSessions = result.rows;

    // Clear caches for deleted sessions
    for (const session of deletedSessions) {
      await this.invalidateCache(session.id);
      await this.invalidateCache(session.session_token, ['access_token']);
      await this.invalidateCache(session.refresh_token, ['refresh_token']);
      if (session.device_id) {
        await this.invalidateCache(session.device_id, ['device']);
      }
    }

    return deletedSessions.length;
  }

  /**
   * Get session statistics for a user
   */
  async getUserSessionStats(userId, useReplica = true) {
    const result = await query(
      `SELECT 
         COUNT(*) as total_sessions,
         COUNT(*) FILTER (WHERE is_active = true) as active_sessions,
         COUNT(*) FILTER (WHERE expires_at > NOW()) as valid_sessions,
         COUNT(DISTINCT device_id) as unique_devices,
         COUNT(DISTINCT device_type) as device_types,
         MAX(last_activity) as last_activity,
         MIN(created_at) as first_session
       FROM authentication.user_sessions 
       WHERE user_id = $1`,
      [userId],
      useReplica
    );

    return result.rows[0] || null;
  }

  /**
   * Get sessions with geographic information
   */
  async getSessionsWithLocation(userId, useReplica = true) {
    const result = await query(
      `SELECT 
         id, device_name, device_type, ip_address, country, city,
         last_activity, created_at, is_active,
         CASE 
           WHEN expires_at > NOW() THEN true 
           ELSE false 
         END as is_valid
       FROM authentication.user_sessions 
       WHERE user_id = $1 
       ORDER BY last_activity DESC
       LIMIT 50`,
      [userId],
      useReplica
    );

    return result.rows;
  }

  /**
   * Detect suspicious sessions
   */
  async detectSuspiciousSessions(userId, useReplica = true) {
    const result = await query(
      `SELECT 
         s.*,
         CASE 
           WHEN s.country != prev.country AND s.created_at - prev.created_at < INTERVAL '1 hour' THEN 'rapid_location_change'
           WHEN s.risk_score > 70 THEN 'high_risk_score'
           WHEN s.user_agent != prev.user_agent AND s.created_at - prev.created_at < INTERVAL '5 minutes' THEN 'rapid_device_change'
           ELSE null
         END as suspicion_reason
       FROM authentication.user_sessions s
       LEFT JOIN authentication.user_sessions prev ON prev.user_id = s.user_id 
         AND prev.created_at < s.created_at
         AND prev.id != s.id
       WHERE s.user_id = $1 AND s.is_active = true
       ORDER BY s.created_at DESC`,
      [userId],
      useReplica
    );

    return result.rows.filter(session => session.suspicion_reason);
  }

  /**
   * Update session risk score
   */
  async updateRiskScore(sessionId, riskScore, riskFactors = []) {
    const result = await query(
      `UPDATE authentication.user_sessions 
       SET risk_score = $2,
           metadata = COALESCE(metadata, '{}') || $3,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [sessionId, riskScore, JSON.stringify({ risk_factors: riskFactors, risk_updated_at: new Date() })]
    );

    const session = result.rows[0];
    
    if (session) {
      await this.setCache(this.getCacheKey(session.id), session);
    }

    return session;
  }

  /**
   * Get concurrent session count for user
   */
  async getConcurrentSessionCount(userId, useReplica = true) {
    const result = await query(
      `SELECT COUNT(*) as count
       FROM authentication.user_sessions 
       WHERE user_id = $1 AND is_active = true AND expires_at > NOW()`,
      [userId],
      useReplica
    );

    return parseInt(result.rows[0].count);
  }

  /**
   * Enforce concurrent session limits
   */
  async enforceConcurrentSessionLimit(userId, maxSessions = 5) {
    const activeSessions = await this.findActiveSessionsByUser(userId);
    
    if (activeSessions.length <= maxSessions) {
      return 0;
    }

    // Sort by last activity (oldest first) and invalidate excess sessions
    const sessionsToInvalidate = activeSessions
      .sort((a, b) => new Date(a.last_activity) - new Date(b.last_activity))
      .slice(0, activeSessions.length - maxSessions);

    let invalidatedCount = 0;
    for (const session of sessionsToInvalidate) {
      await this.invalidate(session.id, 'concurrent_session_limit');
      invalidatedCount++;
    }

    return invalidatedCount;
  }
}

module.exports = AuthSession;