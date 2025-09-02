const { query } = require('../database/connection');
const { logger } = require('../utils/logger');

/**
 * SecurityService
 * 
 * Handles security-related functionality including progressive delays,
 * account lockouts, security event logging, and monitoring.
 */
class SecurityService {
  constructor() {
    // Progressive delay configuration (in seconds)
    this.delayConfig = {
      1: 1,    // 1 second after 1st failed attempt
      2: 2,    // 2 seconds after 2nd failed attempt
      3: 5,    // 5 seconds after 3rd failed attempt
      4: 10,   // 10 seconds after 4th failed attempt
      5: 30,   // 30 seconds after 5th failed attempt
      6: 60,   // 1 minute after 6th failed attempt
      7: 300,  // 5 minutes after 7th failed attempt
      8: 900,  // 15 minutes after 8th failed attempt
      9: 1800, // 30 minutes after 9th failed attempt
      10: 3600 // 1 hour after 10th failed attempt
    };

    // Account lockout thresholds
    this.lockoutConfig = {
      maxAttempts: 5,           // Lock after 5 failed attempts
      lockoutDuration: 30 * 60, // 30 minutes lockout
      permanentLockThreshold: 10 // Permanent lock after 10 attempts
    };
  }

  /**
   * Calculate progressive delay based on failed attempts
   */
  calculateProgressiveDelay(failedAttempts) {
    if (failedAttempts <= 0) return 0;
    
    // Cap at maximum configured delay
    const maxConfiguredAttempts = Math.max(...Object.keys(this.delayConfig).map(Number));
    const attempts = Math.min(failedAttempts, maxConfiguredAttempts);
    
    return this.delayConfig[attempts] || this.delayConfig[maxConfiguredAttempts];
  }

  /**
   * Apply progressive delay before allowing next login attempt
   */
  async applyProgressiveDelay(userId, failedAttempts) {
    const delaySeconds = this.calculateProgressiveDelay(failedAttempts);
    
    if (delaySeconds > 0) {
      logger.info('Applying progressive login delay', {
        userId,
        failedAttempts,
        delaySeconds
      });

      // Store delay end time in database
      const delayUntil = new Date(Date.now() + (delaySeconds * 1000));
      
      await query(
        'UPDATE users.users SET login_delay_until = $1 WHERE id = $2',
        [delayUntil, userId]
      );

      // Log security event
      await this.logSecurityEvent(userId, 'progressive_delay_applied', 'medium', {
        failed_attempts: failedAttempts,
        delay_seconds: delaySeconds,
        delay_until: delayUntil
      });

      return delaySeconds;
    }

    return 0;
  }

  /**
   * Check if user is currently in a delay period
   */
  async isInDelayPeriod(userId) {
    try {
      const result = await query(
        'SELECT login_delay_until FROM users.users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) return false;

      const delayUntil = result.rows[0].login_delay_until;
      if (!delayUntil) return false;

      const now = new Date();
      const isDelayed = new Date(delayUntil) > now;

      if (!isDelayed) {
        // Clear expired delay
        await query(
          'UPDATE users.users SET login_delay_until = NULL WHERE id = $1',
          [userId]
        );
      }

      return isDelayed;
    } catch (error) {
      logger.error('Failed to check delay period', {
        userId,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Get remaining delay time in seconds
   */
  async getRemainingDelayTime(userId) {
    try {
      const result = await query(
        'SELECT login_delay_until FROM users.users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) return 0;

      const delayUntil = result.rows[0].login_delay_until;
      if (!delayUntil) return 0;

      const now = new Date();
      const remainingMs = new Date(delayUntil) - now;

      return Math.max(0, Math.ceil(remainingMs / 1000));
    } catch (error) {
      logger.error('Failed to get remaining delay time', {
        userId,
        error: error.message
      });
      return 0;
    }
  }

  /**
   * Determine if account should be locked based on failed attempts
   */
  shouldLockAccount(failedAttempts) {
    return failedAttempts >= this.lockoutConfig.maxAttempts;
  }

  /**
   * Determine if account should be permanently locked
   */
  shouldPermanentlyLockAccount(failedAttempts) {
    return failedAttempts >= this.lockoutConfig.permanentLockThreshold;
  }

  /**
   * Apply account lockout
   */
  async applyAccountLockout(userId, failedAttempts, reason = 'excessive_failed_attempts') {
    const isPermanent = this.shouldPermanentlyLockAccount(failedAttempts);
    const lockoutDuration = isPermanent ? null : this.lockoutConfig.lockoutDuration;
    const lockedUntil = isPermanent ? null : new Date(Date.now() + (lockoutDuration * 1000));

    await query(
      'UPDATE users.users SET locked_until = $1, status = $2 WHERE id = $3',
      [lockedUntil, isPermanent ? 'permanently_locked' : 'active', userId]
    );

    // Log security event
    await this.logSecurityEvent(userId, 'account_locked', 'high', {
      failed_attempts: failedAttempts,
      lockout_duration: lockoutDuration,
      locked_until: lockedUntil,
      is_permanent: isPermanent,
      reason
    });

    logger.warn('Account locked due to excessive failed attempts', {
      userId,
      failedAttempts,
      isPermanent,
      lockedUntil,
      reason
    });

    return {
      isPermanent,
      lockedUntil,
      lockoutDuration
    };
  }

  /**
   * Log security event
   */
  async logSecurityEvent(userId, eventType, severity, metadata = {}, ipAddress = null, userAgent = null) {
    try {
      const SecurityEvent = require('../models/SecurityEvent');
      const securityEvent = new SecurityEvent();

      const eventData = {
        user_id: userId,
        event_type: eventType,
        description: this.getEventDescription(eventType, metadata),
        severity,
        ip_address: ipAddress,
        user_agent: userAgent,
        country: metadata.country,
        city: metadata.city,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString()
        },
        resolved: false
      };

      const event = await securityEvent.create(eventData);

      logger.info('Security event logged', {
        eventId: event.id,
        userId,
        eventType,
        severity
      });

      return event;
    } catch (error) {
      logger.error('Failed to log security event', {
        userId,
        eventType,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get human-readable description for security events
   */
  getEventDescription(eventType, metadata = {}) {
    const descriptions = {
      login_success: 'User successfully logged in',
      login_failure: `Login attempt failed: ${metadata.failure_reason || 'Invalid credentials'}`,
      password_reset: 'Password reset requested',
      mfa_setup: `MFA setup completed using ${metadata.mfa_method || 'unknown method'}`,
      account_locked: `Account locked due to ${metadata.reason || 'security policy violation'}`,
      suspicious_activity: `Suspicious activity detected: ${metadata.activity_type || 'unknown'}`,
      progressive_delay_applied: `Progressive delay applied: ${metadata.delay_seconds || 0} seconds`,
      session_expired: 'User session expired',
      concurrent_session_limit: 'Concurrent session limit exceeded',
      unusual_location: `Login from unusual location: ${metadata.country || 'unknown'}, ${metadata.city || 'unknown'}`,
      rapid_location_change: 'Rapid location change detected',
      high_risk_score: `High risk score detected: ${metadata.risk_score || 0}`,
      token_blacklisted: 'Authentication token blacklisted',
      mfa_bypass_attempt: 'Attempt to bypass MFA detected'
    };

    return descriptions[eventType] || `Security event: ${eventType}`;
  }

  /**
   * Monitor and detect suspicious activities
   */
  async detectSuspiciousActivity(userId, activityData) {
    const suspiciousEvents = [];

    // Check for rapid location changes
    if (activityData.previousLocation && activityData.currentLocation) {
      const timeDiff = activityData.currentTime - activityData.previousTime;
      if (timeDiff < 60 * 60 * 1000 && // Less than 1 hour
          activityData.previousLocation.country !== activityData.currentLocation.country) {
        suspiciousEvents.push({
          type: 'rapid_location_change',
          severity: 'high',
          metadata: {
            previous_location: activityData.previousLocation,
            current_location: activityData.currentLocation,
            time_diff_minutes: Math.round(timeDiff / (60 * 1000))
          }
        });
      }
    }

    // Check for unusual access times
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) {
      suspiciousEvents.push({
        type: 'unusual_access_time',
        severity: 'medium',
        metadata: {
          access_hour: hour,
          access_time: new Date().toISOString()
        }
      });
    }

    // Check for high risk score
    if (activityData.riskScore > 70) {
      suspiciousEvents.push({
        type: 'high_risk_score',
        severity: 'high',
        metadata: {
          risk_score: activityData.riskScore,
          risk_factors: activityData.riskFactors || []
        }
      });
    }

    // Log all suspicious events
    for (const event of suspiciousEvents) {
      await this.logSecurityEvent(
        userId,
        event.type,
        event.severity,
        event.metadata,
        activityData.ipAddress,
        activityData.userAgent
      );
    }

    return suspiciousEvents;
  }

  /**
   * Clean up expired security events
   */
  async cleanupExpiredEvents(retentionDays = 90) {
    try {
      const cutoffDate = new Date(Date.now() - (retentionDays * 24 * 60 * 60 * 1000));
      
      const result = await query(
        'DELETE FROM authentication.security_events WHERE timestamp < $1 AND resolved = true RETURNING id',
        [cutoffDate]
      );

      const cleanedCount = result.rows.length;

      logger.info('Expired security events cleaned up', {
        cleanedCount,
        retentionDays,
        cutoffDate
      });

      return cleanedCount;
    } catch (error) {
      logger.error('Failed to cleanup expired security events', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get security statistics for monitoring
   */
  async getSecurityStatistics(timeframe = '24h') {
    try {
      let timeCondition = '';
      const params = [];

      switch (timeframe) {
        case '1h':
          timeCondition = 'timestamp > NOW() - INTERVAL \'1 hour\'';
          break;
        case '24h':
          timeCondition = 'timestamp > NOW() - INTERVAL \'24 hours\'';
          break;
        case '7d':
          timeCondition = 'timestamp > NOW() - INTERVAL \'7 days\'';
          break;
        case '30d':
          timeCondition = 'timestamp > NOW() - INTERVAL \'30 days\'';
          break;
        default:
          timeCondition = 'timestamp > NOW() - INTERVAL \'24 hours\'';
      }

      const result = await query(`
        SELECT 
          event_type,
          severity,
          COUNT(*) as count,
          COUNT(*) FILTER (WHERE resolved = false) as unresolved_count
        FROM authentication.security_events 
        WHERE ${timeCondition}
        GROUP BY event_type, severity
        ORDER BY count DESC
      `, params);

      return result.rows;
    } catch (error) {
      logger.error('Failed to get security statistics', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Resolve security event
   */
  async resolveSecurityEvent(eventId, resolvedBy, notes = null) {
    try {
      const result = await query(
        `UPDATE authentication.security_events 
         SET resolved = true, resolved_by = $2, resolved_at = NOW(),
             metadata = COALESCE(metadata, '{}') || $3
         WHERE id = $1
         RETURNING *`,
        [eventId, resolvedBy, JSON.stringify({ resolution_notes: notes })]
      );

      if (result.rows.length === 0) {
        throw new Error('Security event not found');
      }

      const event = result.rows[0];

      logger.info('Security event resolved', {
        eventId,
        resolvedBy,
        eventType: event.event_type
      });

      return event;
    } catch (error) {
      logger.error('Failed to resolve security event', {
        eventId,
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = new SecurityService();