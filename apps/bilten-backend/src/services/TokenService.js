const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { query } = require("../database/connection");
const { logger } = require("../utils/logger");

/**
 * TokenService
 *
 * Comprehensive JWT token management service with enhanced security features
 * including token blacklisting, refresh rotation, and security monitoring.
 */
class TokenService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || "your-secret-key";
    this.jwtRefreshSecret =
      process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key";
    this.issuer = "bilten-api";
    this.audience = "bilten-client";
  }

  /**
   * Generate access and refresh tokens
   */
  async generateTokens(user, sessionId = null, deviceInfo = {}) {
    const now = Math.floor(Date.now() / 1000);
    const accessTokenJti = crypto.randomUUID();
    const refreshTokenJti = crypto.randomUUID();

    const accessTokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      isVerified: user.email_verified,
      sessionId: sessionId,
      jti: accessTokenJti,
      iat: now,
      type: "access",
    };

    const refreshTokenPayload = {
      userId: user.id,
      sessionId: sessionId,
      jti: refreshTokenJti,
      iat: now,
      type: "refresh",
    };

    // Access token expires in 15 minutes for security
    const accessToken = jwt.sign(accessTokenPayload, this.jwtSecret, {
      expiresIn: "15m",
      issuer: this.issuer,
      audience: this.audience,
    });

    // Refresh token expires in 30 days
    const refreshToken = jwt.sign(refreshTokenPayload, this.jwtRefreshSecret, {
      expiresIn: "30d",
      issuer: this.issuer,
      audience: this.audience,
    });

    // Calculate expiration times
    const accessExpiresAt = new Date((now + 15 * 60) * 1000); // 15 minutes
    const refreshExpiresAt = new Date((now + 30 * 24 * 60 * 60) * 1000); // 30 days

    return {
      accessToken,
      refreshToken,
      accessTokenJti,
      refreshTokenJti,
      accessExpiresAt,
      refreshExpiresAt,
    };
  }

  /**
   * Validate token with comprehensive security checks
   */
  async validateToken(token, tokenType = "access") {
    try {
      const secret =
        tokenType === "access" ? this.jwtSecret : this.jwtRefreshSecret;

      const decoded = jwt.verify(token, secret, {
        issuer: this.issuer,
        audience: this.audience,
      });

      // Check token type
      if (decoded.type !== tokenType) {
        throw new Error(
          `Invalid token type. Expected ${tokenType}, got ${decoded.type}`
        );
      }

      // Check if token is blacklisted
      if (decoded.jti) {
        const isBlacklisted = await this.isTokenBlacklisted(decoded.jti);
        if (isBlacklisted) {
          throw new Error("Token has been revoked");
        }
      }

      // Additional security checks
      const now = Math.floor(Date.now() / 1000);

      // Check if token is expired (additional check)
      if (decoded.exp && decoded.exp < now) {
        throw new Error("Token has expired");
      }

      // Check if token is issued in the future (clock skew protection)
      if (decoded.iat && decoded.iat > now + 60) {
        // Allow 60 seconds clock skew
        throw new Error("Token issued in the future");
      }

      return decoded;
    } catch (error) {
      logger.error("Token validation failed", {
        tokenType,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken) {
    try {
      // Validate refresh token
      const decoded = await this.validateToken(refreshToken, "refresh");

      // Find active session
      const sessionResult = await query(
        `SELECT us.*, u.email, u.role, u.email_verified, u.status
         FROM authentication.user_sessions us
         JOIN users.users u ON us.user_id = u.id
         WHERE us.refresh_token = $1 
         AND us.is_active = TRUE 
         AND us.expires_at > NOW()`,
        [refreshToken]
      );

      if (sessionResult.rows.length === 0) {
        throw new Error("Invalid or expired refresh token");
      }

      const session = sessionResult.rows[0];
      const user = {
        id: session.user_id,
        email: session.email,
        role: session.role,
        email_verified: session.email_verified,
        status: session.status,
      };

      // Check if user is still active and verified
      if (!user.email_verified || user.status !== "active") {
        // Invalidate session if user is no longer active
        await this.invalidateSession(session.id);
        throw new Error("User account is not active");
      }

      // Generate new access token
      const { accessToken, accessTokenJti, accessExpiresAt } =
        await this.generateTokens(user, session.id);

      // Update session with new access token
      await query(
        `UPDATE authentication.user_sessions 
         SET session_token = $1, last_activity = NOW(), 
             metadata = COALESCE(metadata, '{}') || $2
         WHERE id = $3`,
        [
          accessToken,
          JSON.stringify({ access_token_jti: accessTokenJti }),
          session.id,
        ]
      );

      logger.info("Access token refreshed successfully", {
        userId: user.id,
        sessionId: session.id,
        oldJti: decoded.jti,
        newJti: accessTokenJti,
      });

      return {
        accessToken,
        accessExpiresAt,
        sessionId: session.id,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          email_verified: user.email_verified,
        },
      };
    } catch (error) {
      logger.error("Token refresh failed", {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Check if token is blacklisted
   */
  async isTokenBlacklisted(jti) {
    try {
      const result = await query(
        "SELECT EXISTS(SELECT 1 FROM authentication.blacklisted_tokens WHERE jti = $1 AND expires_at > NOW()) as is_blacklisted",
        [jti]
      );
      return result.rows[0].is_blacklisted;
    } catch (error) {
      logger.error("Failed to check token blacklist", {
        jti,
        error: error.message,
      });
      // Return false on error to avoid blocking valid tokens
      return false;
    }
  }

  /**
   * Blacklist a token
   */
  async blacklistToken(jti, expiresAt, reason = "logout") {
    try {
      await query(
        `INSERT INTO authentication.blacklisted_tokens (jti, expires_at, reason, created_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (jti) DO NOTHING`,
        [jti, expiresAt, reason]
      );

      logger.info("Token blacklisted", {
        jti,
        reason,
        expiresAt,
      });
    } catch (error) {
      logger.error("Failed to blacklist token", {
        jti,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Blacklist tokens from a session
   */
  async blacklistSessionTokens(sessionToken, refreshToken, reason = "logout") {
    try {
      // Decode tokens to get JTIs and expiration times
      const accessDecoded = jwt.decode(sessionToken);
      const refreshDecoded = jwt.decode(refreshToken);

      if (accessDecoded?.jti && accessDecoded?.exp) {
        await this.blacklistToken(
          accessDecoded.jti,
          new Date(accessDecoded.exp * 1000),
          reason
        );
      }

      if (refreshDecoded?.jti && refreshDecoded?.exp) {
        await this.blacklistToken(
          refreshDecoded.jti,
          new Date(refreshDecoded.exp * 1000),
          reason
        );
      }
    } catch (error) {
      logger.warn("Failed to blacklist session tokens", {
        error: error.message,
        reason,
      });
      // Don't throw error as this is cleanup operation
    }
  }

  /**
   * Invalidate a session and blacklist its tokens
   */
  async invalidateSession(sessionId, reason = "manual") {
    try {
      // Get session details for blacklisting tokens
      const sessionResult = await query(
        "SELECT session_token, refresh_token FROM authentication.user_sessions WHERE id = $1",
        [sessionId]
      );

      if (sessionResult.rows.length > 0) {
        const session = sessionResult.rows[0];

        // Blacklist tokens
        await this.blacklistSessionTokens(
          session.session_token,
          session.refresh_token,
          reason
        );
      }

      // Invalidate session
      await query(
        "UPDATE authentication.user_sessions SET is_active = FALSE, updated_at = NOW() WHERE id = $1",
        [sessionId]
      );

      logger.info("Session invalidated", {
        sessionId,
        reason,
      });
    } catch (error) {
      logger.error("Failed to invalidate session", {
        sessionId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Invalidate all user sessions
   */
  async invalidateAllUserSessions(
    userId,
    excludeSessionId = null,
    reason = "security"
  ) {
    try {
      let whereClause = "user_id = $1 AND is_active = TRUE";
      let params = [userId];

      if (excludeSessionId) {
        whereClause += " AND id != $2";
        params.push(excludeSessionId);
      }

      // Get all active sessions for token blacklisting
      const sessionsResult = await query(
        `SELECT id, session_token, refresh_token FROM authentication.user_sessions WHERE ${whereClause}`,
        params
      );

      // Blacklist all tokens from these sessions
      for (const session of sessionsResult.rows) {
        await this.blacklistSessionTokens(
          session.session_token,
          session.refresh_token,
          reason
        );
      }

      // Invalidate all sessions
      const result = await query(
        `UPDATE authentication.user_sessions 
         SET is_active = FALSE, updated_at = NOW() 
         WHERE ${whereClause}
         RETURNING id`,
        params
      );

      const invalidatedCount = result.rows.length;

      logger.info("All user sessions invalidated", {
        userId,
        excludeSessionId,
        reason,
        invalidatedCount,
      });

      return invalidatedCount;
    } catch (error) {
      logger.error("Failed to invalidate all user sessions", {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Clean up expired blacklisted tokens
   */
  async cleanupExpiredTokens() {
    try {
      const result = await query(
        "DELETE FROM authentication.blacklisted_tokens WHERE expires_at < NOW() RETURNING jti"
      );

      const cleanedCount = result.rows.length;

      logger.info("Expired blacklisted tokens cleaned up", {
        cleanedCount,
      });

      return cleanedCount;
    } catch (error) {
      logger.error("Failed to cleanup expired tokens", {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get token statistics
   */
  async getTokenStatistics() {
    try {
      const result = await query(`
        SELECT 
          COUNT(*) as total_blacklisted,
          COUNT(*) FILTER (WHERE expires_at > NOW()) as active_blacklisted,
          COUNT(*) FILTER (WHERE expires_at <= NOW()) as expired_blacklisted,
          COUNT(DISTINCT reason) as unique_reasons
        FROM authentication.blacklisted_tokens
      `);

      return result.rows[0];
    } catch (error) {
      logger.error("Failed to get token statistics", {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  decodeToken(token) {
    try {
      return jwt.decode(token, { complete: true });
    } catch (error) {
      logger.error("Failed to decode token", {
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Generate secure verification token
   */
  generateVerificationToken() {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * Generate secure API key
   */
  generateApiKey() {
    return crypto.randomBytes(32).toString("base64url");
  }
}

module.exports = new TokenService();
