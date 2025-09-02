const jwt = require('jsonwebtoken');
const { query } = require('../database/connection');
const { logger } = require('../utils/logger');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Access token is required'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Enhanced JWT token validation
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', {
        issuer: 'bilten-api',
        audience: 'bilten-client'
      });
      
      // Validate token type
      if (decoded.type !== 'access') {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid token type'
        });
      }
      
    } catch (error) {
      let message = 'Invalid or expired token';
      if (error.name === 'TokenExpiredError') {
        message = 'Access token has expired';
      } else if (error.name === 'JsonWebTokenError') {
        message = 'Invalid token format';
      } else if (error.name === 'NotBeforeError') {
        message = 'Token not active yet';
      }
      
      return res.status(401).json({
        error: 'Unauthorized',
        message: message
      });
    }

    // Check if token is blacklisted
    if (decoded.jti) {
      const blacklistResult = await query(
        'SELECT EXISTS(SELECT 1 FROM authentication.blacklisted_tokens WHERE jti = $1 AND expires_at > NOW()) as is_blacklisted',
        [decoded.jti]
      );
      
      if (blacklistResult.rows[0].is_blacklisted) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Token has been revoked'
        });
      }
    }

    // Check if session exists and is active
    const sessionResult = await query(
      `SELECT us.*, u.email, u.role, u.email_verified, u.status, u.first_name, u.last_name
       FROM authentication.user_sessions us
       JOIN users.users u ON us.user_id = u.id
       WHERE us.session_token = $1 
       AND us.is_active = TRUE 
       AND us.expires_at > NOW()
       AND u.deleted_at IS NULL`,
      [token]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Session not found or expired'
      });
    }

    const session = sessionResult.rows[0];

    // Validate session matches token
    if (decoded.sessionId && decoded.sessionId !== session.id) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token session mismatch'
      });
    }

    // Check if user is verified and active
    if (!session.email_verified) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Email verification required'
      });
    }

    if (session.status !== 'active') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Account is not active'
      });
    }

    // Update last activity (async, don't wait)
    query(
      'UPDATE authentication.user_sessions SET last_activity = NOW() WHERE id = $1',
      [session.id]
    ).catch(error => {
      logger.warn('Failed to update session activity', {
        sessionId: session.id,
        error: error.message
      });
    });

    // Add user info to request
    req.user = {
      id: session.user_id,
      email: session.email,
      role: session.role,
      firstName: session.first_name,
      lastName: session.last_name,
      isVerified: session.email_verified,
      sessionId: session.id,
      tokenJti: decoded.jti
    };

    next();

  } catch (error) {
    logger.error('Authentication middleware error:', {
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed'
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    // Use the regular auth middleware
    return authMiddleware(req, res, next);

  } catch (error) {
    // Continue without authentication on error
    next();
  }
};

// Role-based authorization middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const userRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!userRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Permission-based authorization middleware
const requirePermission = (resource, action) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      // Check user permissions
      const permissionResult = await query(
        `SELECT EXISTS (
          SELECT 1
          FROM authentication.user_roles ur
          JOIN authentication.role_permissions rp ON ur.role_id = rp.role_id
          JOIN authentication.permissions p ON rp.permission_id = p.id
          WHERE ur.user_id = $1
          AND ur.is_active = TRUE
          AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
          AND p.resource = $2
          AND p.action = $3
        ) as has_permission`,
        [req.user.id, resource, action]
      );

      if (!permissionResult.rows[0].has_permission) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Insufficient permissions'
        });
      }

      next();

    } catch (error) {
      logger.error('Permission check error:', {
        userId: req.user?.id,
        resource,
        action,
        error: error.message
      });
      
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Permission check failed'
      });
    }
  };
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  requireRole,
  requirePermission
};