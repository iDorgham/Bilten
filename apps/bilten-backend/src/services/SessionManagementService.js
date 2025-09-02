const { query } = require('../database/connection');
const { logger } = require('../utils/logger');

/**
 * SessionManagementService
 * 
 * Handles session expiration, automatic logout, and session monitoring.
 */
class SessionManagementService {
  constructor() {
    // Session configuration
    this.config = {
      accessTokenLifetime: 15 * 60,        // 15 minutes
      refreshTokenLifetime: 30 * 24 * 60 * 60, // 30 days
      inactivityTimeout: 30 * 60,          // 30 minutes of inactivity
      maxConcurrentSessions: 5,            // Maximum concurrent sessions per user
      sessionWarningTime: 5 * 60,          // Warn 5 minutes before expiration
      extendedSessionLifetime: 8 * 60 * 60 // 8 hours for "remember me"
    };
  }

  /**
   * Check if session is expired
   */
  async isSessionExpired(sessionId) {
    try {
      const AuthSession = require('../models/AuthSession');
      const authSession = new AuthSession();
      
      const session = await authSession.findById(sessionId, true, true);
      
      if (!session) {
        return true; // Session doesn't exist, consider it expired
      }

      const now = new Date();
      const expiresAt = new Date(session.expires_at);
      const refreshExpiresAt = new Date(session.refresh_expires_at);

      // Check if both access and refresh tokens are expired
      const isExpired = expiresAt < now && refreshExpiresAt < now;
      
      // Check inactivity timeout
      const lastActivity = new Date(session.last_activity);
      const inactivityExpired = (now - lastActivity) > (this.config.inactivityTimeout * 1000);

      return isExpired || inactivityExpired || !session.is_active;
    } catch (error) {
      logger.error('Failed to check session expiration', {
        sessionId,
        error: error.message
      });
      return true; // Assume expired on error for security
    }
  }

  /**
   * Get session expiration info
   */
  async getSessionExpirationInfo(sessionId) {
    try {
      const AuthSession = require('../models/AuthSession');
      const authSession = new AuthSession();
      
      const session = await authSession.findById(sessionId, true, true);
      
      if (!session) {
        return null;
      }

      const now = new Date();
      const expiresAt = new Date(session.expires_at);
      const refreshExpiresAt = new Date(session.refresh_expires_at);
      const lastActivity = new Date(session.last_activity);

      const timeUntilExpiration = Math.max(0, expiresAt - now);
      const timeUntilRefreshExpiration = Math.max(0, refreshExpiresAt - now);
      const timeSinceLastActivity = now - lastActivity;
      const timeUntilInactivityExpiration = Math.max(0, (this.config.inactivityTimeout * 1000) - timeSinceLastActivity);

      return {
        sessionId,
        isActive: session.is_active,
        expiresAt,
        refreshExpiresAt,
        lastActivity,
        timeUntilExpiration: Math.floor(timeUntilExpiration / 1000),
        timeUntilRefreshExpiration: Math.floor(timeUntilRefreshExpiration / 1000),
        timeUntilInactivityExpiration: Math.floor(timeUntilInactivityExpiration / 1000),
        shouldWarn: timeUntilExpiration <= (this.config.sessionWarningTime * 1000),
        isExpired: await this.isSessionExpired(sessionId)
      };
    } catch (error) {
      logger.error('Failed to get session expiration info', {
        sessionId,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Extend session lifetime (for "remember me" functionality)
   */
  async extendSession(sessionId, extendedLifetime = null) {
    try {
      const AuthSession = require('../models/AuthSession');
      const authSession = new AuthSession();
      
      const lifetime = extendedLifetime || this.config.extendedSessionLifetime;
      const newExpiresAt = new Date(Date.now() + (lifetime * 1000));
      const newRefreshExpiresAt = new Date(Date.now() + (this.config.refreshTokenLifetime * 1000));

      const session = await authSession.update(sessionId, {
        expires_at: newExpiresAt,
        refresh_expires_at: newRefreshExpiresAt,
        last_activity: new Date()
      });

      if (session) {
        // Log session extension
        const SecurityService = require('./SecurityService');
        await SecurityService.logSecurityEvent(session.user_id, 'session_extended', 'low', {
          session_id: sessionId,
          extended_lifetime: lifetime,
          new_expires_at: newExpiresAt
        });

        logger.info('Session extended', {
          sessionId,
          userId: session.user_id,
          newExpiresAt,
          extendedLifetime: lifetime
        });
      }

      return session;
    } catch (error) {
      logger.error('Failed to extend session', {
        sessionId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Update session activity
   */
  async updateSessionActivity(sessionId, metadata = {}) {
    try {
      const AuthSession = require('../models/AuthSession');
      const authSession = new AuthSession();
      
      const session = await authSession.updateActivity(sessionId, {
        ...metadata,
        activity_updated_at: new Date()
      });

      return session;
    } catch (error) {
      logger.error('Failed to update session activity', {
        sessionId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Automatically expire inactive sessions
   */
  async expireInactiveSessions() {
    try {
      const cutoffTime = new Date(Date.now() - (this.config.inactivityTimeout * 1000));
      
      // Find inactive sessions
      const result = await query(
        `SELECT id, user_id FROM authentication.user_sessions 
         WHERE is_active = true 
         AND last_activity < $1 
         AND expires_at > NOW()`,
        [cutoffTime]
      );

      const inactiveSessions = result.rows;
      let expiredCount = 0;

      // Expire each inactive session
      for (const session of inactiveSessions) {
        await this.expireSession(session.id, 'inactivity_timeout');
        expiredCount++;
      }

      if (expiredCount > 0) {
        logger.info('Expired inactive sessions', {
          expiredCount,
          cutoffTime
        });
      }

      return expiredCount;
    } catch (error) {
      logger.error('Failed to expire inactive sessions', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Expire a specific session
   */
  async expireSession(sessionId, reason = 'expired') {
    try {
      const AuthSession = require('../models/AuthSession');
      const authSession = new AuthSession();
      
      const session = await authSession.invalidate(sessionId, reason);
      
      if (session) {
        // Log session expiration
        const SecurityService = require('./SecurityService');
        await SecurityService.logSecurityEvent(session.user_id, 'session_expired', 'low', {
          session_id: sessionId,
          expiration_reason: reason,
          expired_at: new Date()
        });

        logger.info('Session expired', {
          sessionId,
          userId: session.user_id,
          reason
        });
      }

      return session;
    } catch (error) {
      logger.error('Failed to expire session', {
        sessionId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions() {
    try {
      const AuthSession = require('../models/AuthSession');
      const authSession = new AuthSession();
      
      const cleanedCount = await authSession.cleanupExpiredSessions();

      logger.info('Cleaned up expired sessions', {
        cleanedCount
      });

      return cleanedCount;
    } catch (error) {
      logger.error('Failed to cleanup expired sessions', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Enforce concurrent session limits
   */
  async enforceConcurrentSessionLimits(userId, maxSessions = null) {
    try {
      const AuthSession = require('../models/AuthSession');
      const authSession = new AuthSession();
      
      const limit = maxSessions || this.config.maxConcurrentSessions;
      const invalidatedCount = await authSession.enforceConcurrentSessionLimit(userId, limit);

      if (invalidatedCount > 0) {
        // Log concurrent session limit enforcement
        const SecurityService = require('./SecurityService');
        await SecurityService.logSecurityEvent(userId, 'concurrent_session_limit', 'medium', {
          max_sessions: limit,
          invalidated_sessions: invalidatedCount
        });

        logger.info('Enforced concurrent session limit', {
          userId,
          maxSessions: limit,
          invalidatedCount
        });
      }

      return invalidatedCount;
    } catch (error) {
      logger.error('Failed to enforce concurrent session limits', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get session statistics for monitoring
   */
  async getSessionStatistics() {
    try {
      const result = await query(`
        SELECT 
          COUNT(*) as total_sessions,
          COUNT(*) FILTER (WHERE is_active = true) as active_sessions,
          COUNT(*) FILTER (WHERE expires_at > NOW()) as valid_sessions,
          COUNT(*) FILTER (WHERE last_activity > NOW() - INTERVAL '1 hour') as recent_activity,
          COUNT(DISTINCT user_id) as unique_users,
          AVG(EXTRACT(EPOCH FROM (NOW() - last_activity))) as avg_inactivity_seconds
        FROM authentication.user_sessions
      `);

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to get session statistics', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Monitor sessions for security anomalies
   */
  async monitorSessionSecurity() {
    try {
      const AuthSession = require('../models/AuthSession');
      const authSession = new AuthSession();
      
      // Get all active sessions
      const activeSessions = await query(
        `SELECT id, user_id, ip_address, country, city, risk_score, created_at, last_activity
         FROM authentication.user_sessions 
         WHERE is_active = true AND expires_at > NOW()`
      );

      const SecurityService = require('./SecurityService');
      let anomaliesDetected = 0;

      for (const session of activeSessions.rows) {
        // Check for suspicious sessions
        const suspiciousSessions = await authSession.detectSuspiciousSessions(session.user_id);
        
        for (const suspiciousSession of suspiciousSessions) {
          if (suspiciousSession.suspicion_reason) {
            await SecurityService.logSecurityEvent(
              session.user_id,
              'suspicious_activity',
              'high',
              {
                session_id: session.id,
                suspicion_reason: suspiciousSession.suspicion_reason,
                detected_at: new Date()
              },
              session.ip_address
            );
            anomaliesDetected++;
          }
        }
      }

      logger.info('Session security monitoring completed', {
        totalSessions: activeSessions.rows.length,
        anomaliesDetected
      });

      return {
        totalSessions: activeSessions.rows.length,
        anomaliesDetected
      };
    } catch (error) {
      logger.error('Failed to monitor session security', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Schedule automatic session maintenance
   */
  startSessionMaintenance(intervalMinutes = 15) {
    const interval = intervalMinutes * 60 * 1000;
    
    const maintenanceTask = async () => {
      try {
        logger.info('Starting session maintenance');
        
        // Expire inactive sessions
        const expiredCount = await this.expireInactiveSessions();
        
        // Clean up expired sessions
        const cleanedCount = await this.cleanupExpiredSessions();
        
        // Monitor session security
        const securityReport = await this.monitorSessionSecurity();
        
        logger.info('Session maintenance completed', {
          expiredSessions: expiredCount,
          cleanedSessions: cleanedCount,
          securityAnomalies: securityReport.anomaliesDetected
        });
      } catch (error) {
        logger.error('Session maintenance failed', {
          error: error.message
        });
      }
    };

    // Run immediately and then on interval
    maintenanceTask();
    const intervalId = setInterval(maintenanceTask, interval);

    logger.info('Session maintenance scheduled', {
      intervalMinutes
    });

    return intervalId;
  }
}

module.exports = new SessionManagementService();