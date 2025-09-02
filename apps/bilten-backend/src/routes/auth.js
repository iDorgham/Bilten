const express = require('express');
const { body, validationResult } = require('express-validator');
const xss = require('xss');
const AuthService = require('../services/AuthService');
const MFAService = require('../services/MFAService');
const { logger } = require('../utils/logger');
const router = express.Router();

// Validation middleware
const validateLogin = [
  body('email').isString().trim().isEmail().normalizeEmail(),
  body('password').isString().isLength({ min: 8, max: 128 })
];

const validateRegister = [
  body('email').isString().trim().isEmail().normalizeEmail(),
  body('password').isString().isLength({ min: 8, max: 128 }),
  body('first_name').isString().trim().isLength({ min: 2, max: 50 }).escape(),
  body('last_name').isString().trim().isLength({ min: 2, max: 50 }).escape()
];

// Login endpoint
router.post('/login', validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid input data',
        details: errors.array()
      });
    }

    const email = xss(req.body.email);
    const password = req.body.password;

    // Extract device info from request
    const deviceInfo = {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      sessionType: 'web'
    };

    const result = await AuthService.loginUser(email, password, deviceInfo);

    // Check if MFA is required
    if (result.requiresMFA) {
      return res.status(200).json({
        data: {
          requiresMFA: true,
          userId: result.userId
        },
        message: result.message
      });
    }

    res.json({
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      },
      message: result.message
    });

  } catch (error) {
    logger.error('Login error:', error);
    
    if (error.message.includes('verify your email') || 
        error.message.includes('Invalid email or password') ||
        error.message.includes('not active')) {
      return res.status(401).json({
        error: 'Authentication Failed',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Login failed'
    });
  }
});

// MFA verification endpoint
router.post('/verify-mfa', [
  body('userId').isUUID().withMessage('Valid user ID required'),
  body('method').isIn(['totp', 'sms', 'backup']).withMessage('Valid MFA method required'),
  body('token').isString().notEmpty().withMessage('Token required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid input data',
        details: errors.array()
      });
    }

    const { userId, method, token } = req.body;

    // Extract device info from request
    const deviceInfo = {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      sessionType: 'web'
    };

    let isValid = false;

    // Verify based on method
    switch (method) {
      case 'totp':
        isValid = await MFAService.verifyTOTPToken(userId, token);
        break;
      case 'sms':
        isValid = await MFAService.verifySMSCode(userId, token);
        break;
      case 'backup':
        isValid = await MFAService.verifyBackupCode(userId, token);
        break;
      default:
        throw new Error('Invalid MFA method');
    }

    if (!isValid) {
      return res.status(401).json({
        error: 'MFA Verification Failed',
        message: 'Invalid verification token'
      });
    }

    // Complete login with MFA
    const result = await AuthService.completeLoginWithMFA(userId, deviceInfo);

    res.json({
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      },
      message: result.message
    });

  } catch (error) {
    logger.error('MFA verification error:', error);
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'MFA verification failed'
    });
  }
});

// Register endpoint
router.post('/register', validateRegister, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid input data',
        details: errors.array()
      });
    }

    const userData = {
      email: xss(req.body.email),
      password: req.body.password,
      first_name: xss(req.body.first_name),
      last_name: xss(req.body.last_name)
    };

    const result = await AuthService.registerUser(userData);

    res.status(201).json({
      data: result,
      message: result.message
    });

  } catch (error) {
    logger.error('Registration error:', error);
    
    if (error.message === 'User with this email already exists') {
      return res.status(409).json({
        error: 'User Exists',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Registration failed'
    });
  }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
  const { authMiddleware } = require('../middleware/authMiddleware');
  
  return authMiddleware(req, res, async () => {
  try {
    // Invalidate the current session (this will also blacklist tokens)
    await AuthService.invalidateSession(req.user.sessionId, 'logout');

    // Log logout activity
    await AuthService.logUserActivity(req.user.id, 'logout', {
      success: true,
      sessionId: req.user.sessionId,
      tokenJti: req.user.tokenJti
    });

    res.json({
      message: 'Logout successful'
    });

  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Logout failed'
    });
  }
  });
});

// Get current user
router.get('/me', async (req, res) => {
  const { authMiddleware } = require('../middleware/authMiddleware');
  
  // Apply middleware manually for this route
  return authMiddleware(req, res, async () => {
  try {
    const UserRepository = require('../models/UserRepository');
    const userRepository = new UserRepository();
    
    const user = await userRepository.findById(req.user.id, true, true);
    
    if (!user) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'User not found'
      });
    }

    // Remove sensitive information
    const { password, ...userWithoutPassword } = user;

    res.json({
      data: {
        user: userWithoutPassword
      },
      message: 'User profile retrieved successfully'
    });

  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve user profile'
    });
  }
  });
});

// Forgot password endpoint
router.post('/forgot-password', [
  body('email').isString().trim().isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid email address',
        details: errors.array()
      });
    }

    const email = xss(req.body.email);

    // Check if user exists
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'User with this email does not exist'
      });
    }

    // Generate reset token (in production, this would be a secure token with expiration)
    const resetToken = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        type: 'password_reset'
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    // In production, you would:
    // 1. Store the reset token in database with expiration
    // 2. Send email with reset link
    // 3. Use a proper email service (SendGrid, AWS SES, etc.)

    console.log(`Password reset requested for ${email}. Reset token: ${resetToken}`);

    res.json({
      message: 'Password reset email sent. Check your email for reset instructions.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process password reset request'
    });
  }
});

// Email verification endpoint
router.post('/verify-email', [
  body('token').isString().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid token',
        details: errors.array()
      });
    }

    const token = xss(req.body.token);
    const result = await AuthService.verifyEmail(token);

    res.json({
      data: result,
      message: result.message
    });

  } catch (error) {
    logger.error('Email verification error:', error);
    
    if (error.message.includes('Invalid or expired')) {
      return res.status(400).json({
        error: 'Invalid Token',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Email verification failed'
    });
  }
});

// Resend verification email endpoint
router.post('/resend-verification', [
  body('email').isString().trim().isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid email address',
        details: errors.array()
      });
    }

    const email = xss(req.body.email);
    const result = await AuthService.resendVerificationEmail(email);

    res.json({
      data: result,
      message: result.message
    });

  } catch (error) {
    logger.error('Resend verification error:', error);
    
    if (error.message === 'User not found') {
      return res.status(404).json({
        error: 'User Not Found',
        message: error.message
      });
    }

    if (error.message === 'Email is already verified') {
      return res.status(400).json({
        error: 'Already Verified',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to resend verification email'
    });
  }
});

// Refresh token endpoint
router.post('/refresh-token', [
  body('refreshToken').isString().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid refresh token',
        details: errors.array()
      });
    }

    const refreshToken = req.body.refreshToken;
    const result = await AuthService.refreshAccessToken(refreshToken);

    res.json({
      data: {
        accessToken: result.accessToken,
        user: result.user
      },
      message: 'Token refreshed successfully'
    });

  } catch (error) {
    logger.error('Token refresh error:', error);
    
    if (error.message.includes('Invalid') || error.message.includes('expired')) {
      return res.status(401).json({
        error: 'Invalid Token',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Token refresh failed'
    });
  }
});

// Reset password endpoint
router.post('/reset-password', [
  body('token').isString().notEmpty(),
  body('newPassword').isString().isLength({ min: 8, max: 128 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid input data',
        details: errors.array()
      });
    }

    const token = req.body.token;
    const newPassword = req.body.newPassword;

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      return res.status(400).json({
        error: 'Invalid Token',
        message: 'Invalid or expired reset token'
      });
    }

    // Check if token is for password reset
    if (decoded.type !== 'password_reset') {
      return res.status(400).json({
        error: 'Invalid Token',
        message: 'Invalid token type'
      });
    }

    // Find user
    const user = users.find(u => u.id === decoded.userId);
    if (!user) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'User not found'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password
    user.password = hashedPassword;
    user.updated_at = new Date().toISOString();

    // In production, you would:
    // 1. Update password in database
    // 2. Invalidate all existing sessions
    // 3. Send confirmation email

    console.log(`Password reset successful for user ${user.email}`);

    res.json({
      message: 'Password reset successful'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to reset password'
    });
  }
});

// Logout from all devices endpoint
router.post('/logout-all', async (req, res) => {
  const { authMiddleware } = require('../middleware/authMiddleware');
  
  return authMiddleware(req, res, async () => {
  try {
    // Invalidate all user sessions except current one
    const invalidatedCount = await AuthService.invalidateAllUserSessions(
      req.user.id, 
      req.user.sessionId, 
      'logout_all'
    );

    // Log logout all activity
    await AuthService.logUserActivity(req.user.id, 'logout_all', {
      success: true,
      current_session_id: req.user.sessionId,
      invalidated_sessions: invalidatedCount
    });

    res.json({
      message: 'Logged out from all other devices successfully',
      data: {
        invalidatedSessions: invalidatedCount
      }
    });

  } catch (error) {
    logger.error('Logout all error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to logout from all devices'
    });
  }
  });
});

// Get active sessions endpoint
router.get('/sessions', async (req, res) => {
  const { authMiddleware } = require('../middleware/authMiddleware');
  
  return authMiddleware(req, res, async () => {
  try {
    const { query } = require('../database/connection');
    
    const sessionsResult = await query(
      `SELECT id, session_type, device_name, device_type, browser, os, 
              ip_address, last_activity, created_at, 
              (id = $2) as is_current
       FROM authentication.user_sessions 
       WHERE user_id = $1 AND is_active = TRUE 
       ORDER BY last_activity DESC`,
      [req.user.id, req.user.sessionId]
    );

    const sessions = sessionsResult.rows.map(session => ({
      id: session.id,
      sessionType: session.session_type,
      deviceName: session.device_name,
      deviceType: session.device_type,
      browser: session.browser,
      os: session.os,
      ipAddress: session.ip_address,
      lastActivity: session.last_activity,
      createdAt: session.created_at,
      isCurrent: session.is_current
    }));

    res.json({
      data: {
        sessions: sessions,
        total: sessions.length
      },
      message: 'Active sessions retrieved successfully'
    });

  } catch (error) {
    logger.error('Get sessions error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve sessions'
    });
  }
  });
});

// Revoke specific session endpoint
router.delete('/sessions/:sessionId', async (req, res) => {
  const { authMiddleware } = require('../middleware/authMiddleware');
  
  return authMiddleware(req, res, async () => {
  try {
    const sessionId = req.params.sessionId;
    
    // Prevent users from revoking their current session
    if (sessionId === req.user.sessionId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Cannot revoke current session. Use logout endpoint instead.'
      });
    }

    // Verify session belongs to user
    const { query } = require('../database/connection');
    const sessionResult = await query(
      'SELECT id FROM authentication.user_sessions WHERE id = $1 AND user_id = $2 AND is_active = TRUE',
      [sessionId, req.user.id]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Session Not Found',
        message: 'Session not found or already inactive'
      });
    }

    // Invalidate the session
    await AuthService.invalidateSession(sessionId, 'revoked_by_user');

    // Log session revocation
    await AuthService.logUserActivity(req.user.id, 'session_revoked', {
      success: true,
      revoked_session_id: sessionId,
      current_session_id: req.user.sessionId
    });

    res.json({
      message: 'Session revoked successfully'
    });

  } catch (error) {
    logger.error('Revoke session error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to revoke session'
    });
  }
  });
});

// Validate token endpoint (for debugging/testing)
router.post('/validate-token', [
  body('token').isString().notEmpty(),
  body('tokenType').optional().isIn(['access', 'refresh']).default('access')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid input data',
        details: errors.array()
      });
    }

    const { token, tokenType } = req.body;
    
    const decoded = await AuthService.validateTokenSecurity(token, tokenType);
    
    res.json({
      data: {
        valid: true,
        payload: {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
          type: decoded.type,
          jti: decoded.jti,
          issuedAt: new Date(decoded.iat * 1000),
          expiresAt: new Date(decoded.exp * 1000)
        }
      },
      message: 'Token is valid'
    });

  } catch (error) {
    logger.error('Token validation error:', error);
    
    res.status(400).json({
      error: 'Invalid Token',
      message: error.message,
      data: {
        valid: false
      }
    });
  }
});

module.exports = router;
