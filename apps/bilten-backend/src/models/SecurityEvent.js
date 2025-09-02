const BaseRepository = require('../database/BaseRepository');
const { query } = require('../database/connection');

/**
 * SecurityEvent Model
 * 
 * Manages security events and audit logging for comprehensive
 * security monitoring and compliance reporting.
 */
class SecurityEvent extends BaseRepository {
  constructor() {
    super('authentication.security_events', 'security_event', 0); // No caching for security events
  }

  /**
   * Create a new security event
   */
  async create(eventData) {
    const {
      user_id,
      event_type,
      description,
      severity = 'low',
      ip_address,
      user_agent,
      device_id,
      country,
      city,
      metadata = {}
    } = eventData;

    // Validate required fields
    if (!event_type || !description) {
      throw new Error('Event type and description are required');
    }

    // Validate event type
    const validEventTypes = [
      'login_success', 'login_failure', 'password_reset', 'mfa_setup',
      'account_locked', 'suspicious_activity', 'token_refresh',
      'session_created', 'session_terminated', 'password_changed',
      'email_verified', 'mfa_enabled', 'mfa_disabled', 'social_account_linked',
      'social_account_unlinked', 'profile_updated', 'account_deleted'
    ];

    if (!validEventTypes.includes(event_type)) {
      throw new Error(`Invalid event type: ${event_type}`);
    }

    // Validate severity
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (!validSeverities.includes(severity)) {
      throw new Error(`Invalid severity: ${severity}`);
    }

    // Ensure user_id is an integer if provided (for compatibility with existing schema)
    let userId = user_id;
    if (userId !== null && userId !== undefined) {
      userId = parseInt(user_id);
      if (isNaN(userId)) {
        throw new Error('User ID must be a valid integer');
      }
    }

    const newEventData = {
      user_id: userId,
      event_type,
      description,
      severity,
      ip_address,
      user_agent,
      device_id,
      country,
      city,
      metadata: JSON.stringify(metadata),
      resolved: false,
      timestamp: new Date()
    };

    return await super.create(newEventData);
  }

  /**
   * Log a login attempt
   */
  async logLoginAttempt(userId, success, metadata = {}) {
    const eventType = success ? 'login_success' : 'login_failure';
    const severity = success ? 'low' : (metadata.reason === 'account_locked' ? 'high' : 'medium');
    
    const description = success 
      ? 'User logged in successfully'
      : `Login failed: ${metadata.reason || 'invalid credentials'}`;

    return await this.create({
      user_id: userId,
      event_type: eventType,
      description,
      severity,
      ip_address: metadata.ip_address,
      user_agent: metadata.user_agent,
      device_id: metadata.device_id,
      country: metadata.country,
      city: metadata.city,
      metadata: {
        ...metadata,
        session_id: metadata.session_id,
        mfa_required: metadata.mfa_required,
        login_method: metadata.login_method || 'password'
      }
    });
  }

  /**
   * Log a password change event
   */
  async logPasswordChange(userId, metadata = {}) {
    return await this.create({
      user_id: userId,
      event_type: 'password_changed',
      description: 'User password was changed',
      severity: 'medium',
      ip_address: metadata.ip_address,
      user_agent: metadata.user_agent,
      device_id: metadata.device_id,
      country: metadata.country,
      city: metadata.city,
      metadata: {
        ...metadata,
        change_method: metadata.change_method || 'manual',
        forced_change: metadata.forced_change || false
      }
    });
  }

  /**
   * Log MFA events
   */
  async logMFAEvent(userId, action, method, metadata = {}) {
    const eventType = action === 'setup' ? 'mfa_setup' : 
                     action === 'enabled' ? 'mfa_enabled' : 'mfa_disabled';
    
    const description = `MFA ${action} for method: ${method}`;
    const severity = action === 'disabled' ? 'medium' : 'low';

    return await this.create({
      user_id: userId,
      event_type: eventType,
      description,
      severity,
      ip_address: metadata.ip_address,
      user_agent: metadata.user_agent,
      device_id: metadata.device_id,
      country: metadata.country,
      city: metadata.city,
      metadata: {
        ...metadata,
        mfa_method: method,
        action: action
      }
    });
  }

  /**
   * Log suspicious activity
   */
  async logSuspiciousActivity(userId, reason, metadata = {}) {
    return await this.create({
      user_id: userId,
      event_type: 'suspicious_activity',
      description: `Suspicious activity detected: ${reason}`,
      severity: 'high',
      ip_address: metadata.ip_address,
      user_agent: metadata.user_agent,
      device_id: metadata.device_id,
      country: metadata.country,
      city: metadata.city,
      metadata: {
        ...metadata,
        suspicion_reason: reason,
        risk_score: metadata.risk_score,
        automated_detection: metadata.automated_detection || true
      }
    });
  }

  /**
   * Log account lockout
   */
  async logAccountLockout(userId, reason, metadata = {}) {
    return await this.create({
      user_id: userId,
      event_type: 'account_locked',
      description: `Account locked: ${reason}`,
      severity: 'high',
      ip_address: metadata.ip_address,
      user_agent: metadata.user_agent,
      device_id: metadata.device_id,
      country: metadata.country,
      city: metadata.city,
      metadata: {
        ...metadata,
        lock_reason: reason,
        failed_attempts: metadata.failed_attempts,
        lock_duration: metadata.lock_duration
      }
    });
  }

  /**
   * Get security events for a user
   */
  async getEventsByUser(userId, options = {}) {
    const {
      event_type,
      severity,
      resolved,
      limit = 50,
      offset = 0,
      startDate,
      endDate,
      useReplica = true
    } = options;

    let whereConditions = ['user_id = $1'];
    let params = [userId];
    let paramIndex = 2;

    if (event_type) {
      whereConditions.push(`event_type = $${paramIndex}`);
      params.push(event_type);
      paramIndex++;
    }

    if (severity) {
      whereConditions.push(`severity = $${paramIndex}`);
      params.push(severity);
      paramIndex++;
    }

    if (typeof resolved === 'boolean') {
      whereConditions.push(`resolved = $${paramIndex}`);
      params.push(resolved);
      paramIndex++;
    }

    if (startDate) {
      whereConditions.push(`timestamp >= $${paramIndex}`);
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereConditions.push(`timestamp <= $${paramIndex}`);
      params.push(endDate);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    const result = await query(
      `SELECT * FROM authentication.security_events 
       WHERE ${whereClause}
       ORDER BY timestamp DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset],
      useReplica
    );

    return result.rows;
  }

  /**
   * Get security events by severity
   */
  async getEventsBySeverity(severity, options = {}) {
    const {
      resolved,
      limit = 100,
      offset = 0,
      startDate,
      endDate,
      useReplica = true
    } = options;

    let whereConditions = ['severity = $1'];
    let params = [severity];
    let paramIndex = 2;

    if (typeof resolved === 'boolean') {
      whereConditions.push(`resolved = $${paramIndex}`);
      params.push(resolved);
      paramIndex++;
    }

    if (startDate) {
      whereConditions.push(`timestamp >= $${paramIndex}`);
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereConditions.push(`timestamp <= $${paramIndex}`);
      params.push(endDate);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    const result = await query(
      `SELECT se.*, u.email, u.first_name, u.last_name
       FROM authentication.security_events se
       LEFT JOIN users.users u ON se.user_id = u.id
       WHERE ${whereClause}
       ORDER BY se.timestamp DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset],
      useReplica
    );

    return result.rows;
  }

  /**
   * Get security event statistics
   */
  async getEventStatistics(options = {}) {
    const {
      userId,
      startDate,
      endDate,
      useReplica = true
    } = options;

    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    if (userId) {
      whereConditions.push(`user_id = $${paramIndex}`);
      params.push(userId);
      paramIndex++;
    }

    if (startDate) {
      whereConditions.push(`timestamp >= $${paramIndex}`);
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereConditions.push(`timestamp <= $${paramIndex}`);
      params.push(endDate);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const result = await query(
      `SELECT 
         COUNT(*) as total_events,
         COUNT(*) FILTER (WHERE severity = 'low') as low_severity,
         COUNT(*) FILTER (WHERE severity = 'medium') as medium_severity,
         COUNT(*) FILTER (WHERE severity = 'high') as high_severity,
         COUNT(*) FILTER (WHERE severity = 'critical') as critical_severity,
         COUNT(*) FILTER (WHERE resolved = true) as resolved_events,
         COUNT(*) FILTER (WHERE resolved = false) as unresolved_events,
         COUNT(DISTINCT user_id) as affected_users,
         COUNT(*) FILTER (WHERE event_type = 'login_failure') as failed_logins,
         COUNT(*) FILTER (WHERE event_type = 'suspicious_activity') as suspicious_activities
       FROM authentication.security_events 
       ${whereClause}`,
      params,
      useReplica
    );

    return result.rows[0];
  }

  /**
   * Get recent security events
   */
  async getRecentEvents(limit = 20, useReplica = true) {
    const result = await query(
      `SELECT se.*, u.email, u.first_name, u.last_name
       FROM authentication.security_events se
       LEFT JOIN users.users u ON se.user_id = u.id
       ORDER BY se.timestamp DESC
       LIMIT $1`,
      [limit],
      useReplica
    );

    return result.rows;
  }

  /**
   * Resolve a security event
   */
  async resolveEvent(eventId, resolvedBy, resolution = {}) {
    const result = await query(
      `UPDATE authentication.security_events 
       SET resolved = true,
           resolved_by = $2,
           resolved_at = NOW(),
           metadata = COALESCE(metadata, '{}') || $3
       WHERE id = $1
       RETURNING *`,
      [eventId, resolvedBy, JSON.stringify({ resolution, resolved_at: new Date() })]
    );

    return result.rows[0];
  }

  /**
   * Get unresolved high-severity events
   */
  async getUnresolvedHighSeverityEvents(useReplica = true) {
    const result = await query(
      `SELECT se.*, u.email, u.first_name, u.last_name
       FROM authentication.security_events se
       LEFT JOIN users.users u ON se.user_id = u.id
       WHERE se.severity IN ('high', 'critical') 
       AND se.resolved = false
       ORDER BY se.timestamp DESC`,
      [],
      useReplica
    );

    return result.rows;
  }

  /**
   * Get security events by IP address
   */
  async getEventsByIP(ipAddress, options = {}) {
    const {
      limit = 50,
      offset = 0,
      startDate,
      endDate,
      useReplica = true
    } = options;

    let whereConditions = ['ip_address = $1'];
    let params = [ipAddress];
    let paramIndex = 2;

    if (startDate) {
      whereConditions.push(`timestamp >= $${paramIndex}`);
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereConditions.push(`timestamp <= $${paramIndex}`);
      params.push(endDate);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    const result = await query(
      `SELECT se.*, u.email, u.first_name, u.last_name
       FROM authentication.security_events se
       LEFT JOIN users.users u ON se.user_id = u.id
       WHERE ${whereClause}
       ORDER BY se.timestamp DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset],
      useReplica
    );

    return result.rows;
  }

  /**
   * Detect patterns in security events
   */
  async detectPatterns(options = {}) {
    const {
      timeWindow = '1 hour',
      minOccurrences = 5,
      useReplica = true
    } = options;

    // Detect repeated failed logins from same IP
    const failedLoginPatterns = await query(
      `SELECT 
         ip_address,
         COUNT(*) as occurrences,
         COUNT(DISTINCT user_id) as affected_users,
         MIN(timestamp) as first_occurrence,
         MAX(timestamp) as last_occurrence,
         array_agg(DISTINCT user_id) as user_ids
       FROM authentication.security_events
       WHERE event_type = 'login_failure'
       AND timestamp > NOW() - INTERVAL '${timeWindow}'
       GROUP BY ip_address
       HAVING COUNT(*) >= $1
       ORDER BY occurrences DESC`,
      [minOccurrences],
      useReplica
    );

    // Detect suspicious activity patterns
    const suspiciousPatterns = await query(
      `SELECT 
         event_type,
         ip_address,
         COUNT(*) as occurrences,
         COUNT(DISTINCT user_id) as affected_users,
         MIN(timestamp) as first_occurrence,
         MAX(timestamp) as last_occurrence
       FROM authentication.security_events
       WHERE severity IN ('high', 'critical')
       AND timestamp > NOW() - INTERVAL '${timeWindow}'
       GROUP BY event_type, ip_address
       HAVING COUNT(*) >= $1
       ORDER BY occurrences DESC`,
      [Math.max(2, Math.floor(minOccurrences / 2))],
      useReplica
    );

    return {
      failed_login_patterns: failedLoginPatterns.rows,
      suspicious_patterns: suspiciousPatterns.rows
    };
  }

  /**
   * Clean up old security events
   */
  async cleanupOldEvents(retentionDays = 365) {
    const result = await query(
      `DELETE FROM authentication.security_events 
       WHERE timestamp < NOW() - INTERVAL '${retentionDays} days'
       AND resolved = true
       RETURNING id`
    );

    return result.rows.length;
  }

  /**
   * Export security events for compliance
   */
  async exportEvents(options = {}) {
    const {
      userId,
      startDate,
      endDate,
      format = 'json',
      useReplica = true
    } = options;

    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    if (userId) {
      whereConditions.push(`se.user_id = $${paramIndex}`);
      params.push(userId);
      paramIndex++;
    }

    if (startDate) {
      whereConditions.push(`se.timestamp >= $${paramIndex}`);
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereConditions.push(`se.timestamp <= $${paramIndex}`);
      params.push(endDate);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const result = await query(
      `SELECT 
         se.id,
         se.user_id,
         u.email,
         se.event_type,
         se.description,
         se.severity,
         se.ip_address,
         se.user_agent,
         se.device_id,
         se.country,
         se.city,
         se.metadata,
         se.resolved,
         se.resolved_by,
         se.resolved_at,
         se.timestamp
       FROM authentication.security_events se
       LEFT JOIN users.users u ON se.user_id = u.id
       ${whereClause}
       ORDER BY se.timestamp DESC`,
      params,
      useReplica
    );

    return result.rows;
  }
}

module.exports = SecurityEvent;