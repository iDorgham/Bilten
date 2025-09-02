const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('../database/connection');
const UserRepository = require('../models/UserRepository');
const EmailService = require('./EmailService');
const MFAService = require('./MFAService');
const { logger } = require('../utils/logger');

class AuthService {
  constructor() {
    this.userRepository = new UserRepository();
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
  }

  calculateRiskScore(deviceInfo, user) {
    let riskScore = 0;
    
    // New device increases risk
    if (!deviceInfo.deviceId || deviceInfo.isNewDevice) {
      riskScore += 20;
    }
    
    // Unknown location increases risk
    if (!deviceInfo.country || deviceInfo.isNewLocation) {
      riskScore += 30;
    }
    
    // Unusual time of access (outside normal hours)
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) {
      riskScore += 10;
    }
    
    // Multiple recent failed attempts
    if (user.failed_login_attempts > 0) {
      riskScore += user.failed_login_attempts * 5;
    }
    
    // Cap at 100
    return Math.min(riskScore, 100);
  }

  getRiskFactors(deviceInfo, user) {
    const factors = [];
    
    if (!deviceInfo.deviceId || deviceInfo.isNewDevice) {
      factors.push('new_device');
    }
    
    if (!deviceInfo.country || deviceInfo.isNewLocation) {
      factors.push('new_location');
    }
    
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) {
      factors.push('unusual_time');
    }
    
    if (user.failed_login_attempts > 0) {
      factors.push('recent_failed_attempts');
    }
    
    return factors;
  }

  async registerUser(userData) {
    const { email, password, first_name, last_name } = userData;

    try {
      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(email, false);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user in database
      const newUser = await this.userRepository.create({
        email: email.toLowerCase(),
        password_hash: hashedPassword,
        first_name,
        last_name,
        role: 'user',
        status: 'pending_verification',
        email_verified: false
      });

      // Generate email verification token
      const verificationToken = await this.generateVerificationToken(newUser.id, 'email');

      // Send verification email (skip in test environment)
      let emailSent = false;
      if (process.env.NODE_ENV !== 'test') {
        try {
          await EmailService.sendVerificationEmail(email, first_name, verificationToken);
          emailSent = true;
        } catch (emailError) {
          logger.warn('Failed to send verification email', {
            userId: newUser.id,
            email: newUser.email,
            error: emailError.message
          });
        }
      }

      // Log registration activity
      await this.logUserActivity(newUser.id, 'registration', {
        success: true,
        email_sent: emailSent
      });

      logger.info('User registered successfully', {
        userId: newUser.id,
        email: newUser.email
      });

      // Return user without password
      const { password: _, ...userWithoutPassword } = newUser;
      return {
        user: userWithoutPassword,
        message: 'Registration successful. Please check your email to verify your account.'
      };

    } catch (error) {
      logger.error('User registration failed', {
        email,
        error: error.message
      });
      throw error;
    }
  }

  async verifyEmail(token) {
    try {
      // Find and validate verification token
      const tokenResult = await query(
        `SELECT vt.*, u.email, u.first_name 
         FROM authentication.verification_tokens vt
         JOIN users.users u ON vt.user_id = u.id
         WHERE vt.token = $1 
         AND vt.token_type = 'email' 
         AND vt.expires_at > NOW() 
         AND vt.used_at IS NULL`,
        [token]
      );

      if (tokenResult.rows.length === 0) {
        throw new Error('Invalid or expired verification token');
      }

      const tokenData = tokenResult.rows[0];

      // Mark token as used
      await query(
        'UPDATE authentication.verification_tokens SET used_at = NOW() WHERE id = $1',
        [tokenData.id]
      );

      // Update user verification status
      const updatedUser = await this.userRepository.update(tokenData.user_id, {
        email_verified: true,
        status: 'active'
      });

      // Assign default user role
      await this.assignUserRole(tokenData.user_id, 'user');

      // Log verification activity
      await this.logUserActivity(tokenData.user_id, 'email_verified', {
        success: true,
        token_id: tokenData.id
      });

      logger.info('Email verified successfully', {
        userId: tokenData.user_id,
        email: tokenData.email
      });

      return {
        user: updatedUser,
        message: 'Email verified successfully. Your account is now active.'
      };

    } catch (error) {
      logger.error('Email verification failed', {
        token,
        error: error.message
      });
      throw error;
    }
  }

  async resendVerificationEmail(email) {
    try {
      const user = await this.userRepository.findByEmail(email, false);
      
      if (!user) {
        throw new Error('User not found');
      }

      if (user.email_verified) {
        throw new Error('Email is already verified');
      }

      // Invalidate existing verification tokens
      await query(
        'UPDATE authentication.verification_tokens SET used_at = NOW() WHERE user_id = $1 AND token_type = $2 AND used_at IS NULL',
        [user.id, 'email']
      );

      // Generate new verification token
      const verificationToken = await this.generateVerificationToken(user.id, 'email');

      // Send verification email
      await EmailService.sendVerificationEmail(user.email, user.first_name, verificationToken);

      // Log resend activity
      await this.logUserActivity(user.id, 'verification_email_resent', {
        success: true
      });

      logger.info('Verification email resent', {
        userId: user.id,
        email: user.email
      });

      return {
        message: 'Verification email sent. Please check your email.'
      };

    } catch (error) {
      logger.error('Failed to resend verification email', {
        email,
        error: error.message
      });
      throw error;
    }
  }

  async loginUser(email, password, deviceInfo = {}) {
    try {
      const UserAccount = require('../models/UserAccount');
      const SecurityService = require('./SecurityService');
      const userAccount = new UserAccount();
      
      const user = await userAccount.findByEmail(email, false);
      
      if (!user) {
        await SecurityService.logSecurityEvent(null, 'login_failure', 'medium', {
          failure_reason: 'user_not_found',
          email,
          attempted_at: new Date()
        }, deviceInfo.ipAddress, deviceInfo.userAgent);
        
        throw new Error('Invalid email or password');
      }

      // Check if user is in progressive delay period
      const isInDelay = await SecurityService.isInDelayPeriod(user.id);
      if (isInDelay) {
        const remainingTime = await SecurityService.getRemainingDelayTime(user.id);
        
        await SecurityService.logSecurityEvent(user.id, 'login_failure', 'medium', {
          failure_reason: 'progressive_delay_active',
          remaining_delay_seconds: remainingTime
        }, deviceInfo.ipAddress, deviceInfo.userAgent);
        
        throw new Error(`Too many failed attempts. Please wait ${remainingTime} seconds before trying again.`);
      }

      // Check if account is locked
      const isLocked = await userAccount.isAccountLocked(user.id);
      if (isLocked) {
        await SecurityService.logSecurityEvent(user.id, 'login_failure', 'high', {
          failure_reason: 'account_locked'
        }, deviceInfo.ipAddress, deviceInfo.userAgent);
        
        throw new Error('Account is temporarily locked due to multiple failed login attempts');
      }

      // Check if user is verified
      if (!user.email_verified) {
        await SecurityService.logSecurityEvent(user.id, 'login_failure', 'low', {
          failure_reason: 'email_not_verified'
        }, deviceInfo.ipAddress, deviceInfo.userAgent);
        
        throw new Error('Please verify your email address before logging in');
      }

      // Check if user is active
      if (user.status !== 'active') {
        await SecurityService.logSecurityEvent(user.id, 'login_failure', 'medium', {
          failure_reason: 'account_inactive',
          account_status: user.status
        }, deviceInfo.ipAddress, deviceInfo.userAgent);
        
        throw new Error('Account is not active');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        // Increment failed login attempts
        const updatedUser = await userAccount.incrementFailedLogins(user.id);
        
        // Apply progressive delay
        await SecurityService.applyProgressiveDelay(user.id, updatedUser.failed_login_attempts);
        
        // Check if account should be locked
        if (SecurityService.shouldLockAccount(updatedUser.failed_login_attempts)) {
          await SecurityService.applyAccountLockout(user.id, updatedUser.failed_login_attempts);
        }
        
        await SecurityService.logSecurityEvent(user.id, 'login_failure', 'medium', {
          failure_reason: 'invalid_password',
          failed_attempts: updatedUser.failed_login_attempts
        }, deviceInfo.ipAddress, deviceInfo.userAgent);
        
        throw new Error('Invalid email or password');
      }

      // Reset failed login attempts on successful password verification
      await userAccount.resetFailedLogins(user.id);

      // Check if MFA is enabled
      const mfaEnabled = await MFAService.isMFAEnabled(user.id);
      
      if (mfaEnabled) {
        // Return MFA challenge instead of tokens
        await this.logUserActivity(user.id, 'login_mfa_required', {
          success: false,
          reason: 'mfa_required',
          ip_address: deviceInfo.ipAddress
        });
        
        return {
          requiresMFA: true,
          userId: user.id,
          message: 'MFA verification required'
        };
      }

      // Generate tokens using TokenService
      const TokenService = require('./TokenService');
      const { accessToken, refreshToken, accessTokenJti, refreshTokenJti, accessExpiresAt, refreshExpiresAt } = 
        await TokenService.generateTokens(user, null, deviceInfo);

      // Create session using AuthSession model
      const AuthSession = require('../models/AuthSession');
      const authSession = new AuthSession();
      
      const sessionData = {
        user_id: user.id,
        session_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'Bearer',
        expires_at: accessExpiresAt,
        refresh_expires_at: refreshExpiresAt,
        device_id: deviceInfo.deviceId || crypto.randomUUID(),
        device_name: deviceInfo.deviceName,
        device_type: deviceInfo.deviceType || 'web',
        user_agent: deviceInfo.userAgent,
        ip_address: deviceInfo.ipAddress,
        country: deviceInfo.country,
        city: deviceInfo.city,
        scopes: ['read', 'write'],
        is_mfa_verified: false,
        risk_score: this.calculateRiskScore(deviceInfo, user),
        metadata: {
          login_method: 'password',
          device_fingerprint: deviceInfo.fingerprint
        }
      };

      const session = await authSession.create(sessionData);

      // Update last login information
      await userAccount.updateLastLogin(user.id, deviceInfo.ipAddress);

      // Log successful login security event
      await SecurityService.logSecurityEvent(user.id, 'login_success', 'low', {
        session_id: session.id,
        device_type: deviceInfo.deviceType,
        risk_score: this.calculateRiskScore(deviceInfo, user)
      }, deviceInfo.ipAddress, deviceInfo.userAgent);

      // Detect suspicious activity
      const suspiciousEvents = await SecurityService.detectSuspiciousActivity(user.id, {
        currentLocation: { country: deviceInfo.country, city: deviceInfo.city },
        currentTime: new Date(),
        riskScore: this.calculateRiskScore(deviceInfo, user),
        riskFactors: this.getRiskFactors(deviceInfo, user),
        ipAddress: deviceInfo.ipAddress,
        userAgent: deviceInfo.userAgent
      });

      logger.info('User logged in successfully', {
        userId: user.id,
        email: user.email,
        sessionId: session.id,
        deviceType: deviceInfo.deviceType,
        ipAddress: deviceInfo.ipAddress,
        suspiciousEventsCount: suspiciousEvents.length
      });

      // Return user without password
      const { password_hash, password_salt, ...userWithoutPassword } = user;
      return {
        user: userWithoutPassword,
        accessToken,
        refreshToken,
        sessionId: session.id,
        expiresAt: accessExpiresAt,
        message: 'Login successful'
      };

    } catch (error) {
      logger.error('Login failed', {
        email,
        error: error.message,
        ipAddress: deviceInfo.ipAddress
      });
      throw error;
    }
  }

  async generateVerificationToken(userId, tokenType, expiresInHours = 24) {
    try {
      // Generate secure random token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + (expiresInHours * 60 * 60 * 1000));

      // Store token in database
      await query(
        `INSERT INTO authentication.verification_tokens (user_id, token, token_type, expires_at)
         VALUES ($1, $2, $3, $4)`,
        [userId, token, tokenType, expiresAt]
      );

      return token;
    } catch (error) {
      logger.error('Failed to generate verification token', {
        userId,
        tokenType,
        error: error.message
      });
      throw error;
    }
  }

  async completeLoginWithMFA(userId, deviceInfo = {}) {
    try {
      const UserAccount = require('../models/UserAccount');
      const userAccount = new UserAccount();
      const user = await userAccount.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      // Generate tokens using TokenService
      const TokenService = require('./TokenService');
      const { accessToken, refreshToken, accessTokenJti, refreshTokenJti, accessExpiresAt, refreshExpiresAt } = 
        await TokenService.generateTokens(user, null, deviceInfo);

      // Create session using AuthSession model
      const AuthSession = require('../models/AuthSession');
      const authSession = new AuthSession();
      
      const sessionData = {
        user_id: user.id,
        session_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'Bearer',
        expires_at: accessExpiresAt,
        refresh_expires_at: refreshExpiresAt,
        device_id: deviceInfo.deviceId || crypto.randomUUID(),
        device_name: deviceInfo.deviceName,
        device_type: deviceInfo.deviceType || 'web',
        user_agent: deviceInfo.userAgent,
        ip_address: deviceInfo.ipAddress,
        country: deviceInfo.country,
        city: deviceInfo.city,
        scopes: ['read', 'write'],
        is_mfa_verified: true, // MFA was verified
        risk_score: this.calculateRiskScore(deviceInfo, user),
        metadata: {
          login_method: 'password_mfa',
          device_fingerprint: deviceInfo.fingerprint
        }
      };

      const session = await authSession.create(sessionData);

      // Update last login information
      await userAccount.updateLastLogin(user.id, deviceInfo.ipAddress);

      // Log successful login security event
      const SecurityService = require('./SecurityService');
      await SecurityService.logSecurityEvent(user.id, 'login_success', 'low', {
        session_id: session.id,
        device_type: deviceInfo.deviceType,
        mfa_verified: true,
        risk_score: this.calculateRiskScore(deviceInfo, user)
      }, deviceInfo.ipAddress, deviceInfo.userAgent);

      // Detect suspicious activity
      const suspiciousEvents = await SecurityService.detectSuspiciousActivity(user.id, {
        currentLocation: { country: deviceInfo.country, city: deviceInfo.city },
        currentTime: new Date(),
        riskScore: this.calculateRiskScore(deviceInfo, user),
        riskFactors: this.getRiskFactors(deviceInfo, user),
        ipAddress: deviceInfo.ipAddress,
        userAgent: deviceInfo.userAgent
      });

      logger.info('User logged in successfully with MFA', {
        userId: user.id,
        email: user.email,
        sessionId: session.id,
        deviceType: deviceInfo.deviceType,
        ipAddress: deviceInfo.ipAddress,
        suspiciousEventsCount: suspiciousEvents.length
      });

      // Return user without password
      const { password_hash, password_salt, ...userWithoutPassword } = user;
      return {
        user: userWithoutPassword,
        accessToken,
        refreshToken,
        sessionId: session.id,
        expiresAt: accessExpiresAt,
        message: 'Login successful'
      };

    } catch (error) {
      logger.error('MFA login completion failed', {
        userId,
        error: error.message,
        ipAddress: deviceInfo.ipAddress
      });
      throw error;
    }
  }

  calculateRiskScore(deviceInfo, user) {
    let riskScore = 0;
    
    // New device increases risk
    if (!deviceInfo.deviceId || deviceInfo.isNewDevice) {
      riskScore += 20;
    }
    
    // Unknown location increases risk
    if (!deviceInfo.country || deviceInfo.isNewLocation) {
      riskScore += 30;
    }
    
    // Unusual time of access (outside normal hours)
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) {
      riskScore += 10;
    }
    
    // Multiple recent failed attempts
    if (user.failed_login_attempts > 0) {
      riskScore += user.failed_login_attempts * 5;
    }
    
    // Cap at 100
    return Math.min(riskScore, 100);
  }

  async generateTokens(user, sessionId = null) {
    // Delegate to TokenService for consistency
    const TokenService = require('./TokenService');
    return await TokenService.generateTokens(user, sessionId);
  }

  async createUserSession(userId, accessToken, refreshToken, deviceInfo = {}, tokenJtis = {}) {
    try {
      const AuthSession = require('../models/AuthSession');
      const authSession = new AuthSession();
      
      const sessionData = {
        user_id: userId,
        session_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'Bearer',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        refresh_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        device_id: deviceInfo.deviceId || crypto.randomUUID(),
        device_name: deviceInfo.deviceName,
        device_type: deviceInfo.deviceType || 'web',
        user_agent: deviceInfo.userAgent,
        ip_address: deviceInfo.ipAddress,
        country: deviceInfo.country,
        city: deviceInfo.city,
        scopes: ['read', 'write'],
        is_mfa_verified: false,
        risk_score: 0,
        metadata: {
          access_token_jti: tokenJtis.accessTokenJti,
          refresh_token_jti: tokenJtis.refreshTokenJti,
          created_at: new Date().toISOString(),
          device_fingerprint: deviceInfo.fingerprint || null
        }
      };

      const session = await authSession.create(sessionData);
      return session.id;
    } catch (error) {
      logger.error('Failed to create user session', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  async assignUserRole(userId, roleName) {
    try {
      await query(
        `INSERT INTO authentication.user_roles (user_id, role_id)
         SELECT $1, id FROM authentication.roles WHERE name = $2
         ON CONFLICT (user_id, role_id, context) DO NOTHING`,
        [userId, roleName]
      );
    } catch (error) {
      logger.error('Failed to assign user role', {
        userId,
        roleName,
        error: error.message
      });
      throw error;
    }
  }

  async logUserActivity(userId, activityType, metadata = {}) {
    try {
      await query(
        `INSERT INTO authentication.user_activity 
         (user_id, activity_type, success, metadata, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          userId,
          activityType,
          metadata.success || false,
          JSON.stringify(metadata),
          metadata.ipAddress || null,
          metadata.userAgent || null
        ]
      );
    } catch (error) {
      logger.error('Failed to log user activity', {
        userId,
        activityType,
        error: error.message
      });
      // Don't throw error for logging failures
    }
  }

  async isTokenBlacklisted(jti) {
    try {
      const result = await query(
        'SELECT EXISTS(SELECT 1 FROM authentication.blacklisted_tokens WHERE jti = $1 AND expires_at > NOW()) as is_blacklisted',
        [jti]
      );
      return result.rows[0].is_blacklisted;
    } catch (error) {
      logger.error('Failed to check token blacklist', {
        jti,
        error: error.message
      });
      // Return false on error to avoid blocking valid tokens
      return false;
    }
  }

  async blacklistToken(jti, expiresAt, reason = 'logout') {
    try {
      await query(
        `INSERT INTO authentication.blacklisted_tokens (jti, expires_at, reason, created_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (jti) DO NOTHING`,
        [jti, expiresAt, reason]
      );
      
      logger.info('Token blacklisted', {
        jti,
        reason,
        expiresAt
      });
    } catch (error) {
      logger.error('Failed to blacklist token', {
        jti,
        error: error.message
      });
      throw error;
    }
  }

  async invalidateSession(sessionId, reason = 'manual') {
    try {
      const AuthSession = require('../models/AuthSession');
      const authSession = new AuthSession();
      
      // Get session details for blacklisting tokens
      const session = await authSession.findById(sessionId, false);
      
      if (session) {
        // Blacklist tokens using TokenService
        const TokenService = require('./TokenService');
        await TokenService.blacklistSessionTokens(
          session.session_token,
          session.refresh_token,
          reason
        );
      }

      // Invalidate session using AuthSession model
      await authSession.invalidate(sessionId, reason);

      logger.info('Session invalidated', {
        sessionId,
        reason
      });
    } catch (error) {
      logger.error('Failed to invalidate session', {
        sessionId,
        error: error.message
      });
      throw error;
    }
  }

  async invalidateAllUserSessions(userId, excludeSessionId = null, reason = 'security') {
    try {
      const AuthSession = require('../models/AuthSession');
      const authSession = new AuthSession();
      
      // Get all active sessions for token blacklisting
      const activeSessions = await authSession.findActiveSessionsByUser(userId);
      
      // Filter out excluded session if specified
      const sessionsToInvalidate = excludeSessionId 
        ? activeSessions.filter(session => session.id !== excludeSessionId)
        : activeSessions;

      // Blacklist all tokens from these sessions
      const TokenService = require('./TokenService');
      for (const session of sessionsToInvalidate) {
        await TokenService.blacklistSessionTokens(
          session.session_token,
          session.refresh_token,
          reason
        );
      }

      // Invalidate all sessions using AuthSession model
      const invalidatedCount = await authSession.invalidateAllUserSessions(userId, excludeSessionId, reason);

      logger.info('All user sessions invalidated', {
        userId,
        excludeSessionId,
        reason,
        invalidatedCount
      });

      return invalidatedCount;
    } catch (error) {
      logger.error('Failed to invalidate all user sessions', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  async validateTokenSecurity(token, tokenType = 'access') {
    try {
      const secret = tokenType === 'access' ? this.jwtSecret : this.jwtRefreshSecret;
      
      const decoded = jwt.verify(token, secret, {
        issuer: 'bilten-api',
        audience: 'bilten-client'
      });

      // Check token type
      if (decoded.type !== tokenType) {
        throw new Error(`Invalid token type. Expected ${tokenType}, got ${decoded.type}`);
      }

      // Check if token is blacklisted
      if (decoded.jti) {
        const isBlacklisted = await this.isTokenBlacklisted(decoded.jti);
        if (isBlacklisted) {
          throw new Error('Token has been revoked');
        }
      }

      // Additional security checks
      const now = Math.floor(Date.now() / 1000);
      
      // Check if token is expired (additional check)
      if (decoded.exp && decoded.exp < now) {
        throw new Error('Token has expired');
      }

      // Check if token is issued in the future (clock skew protection)
      if (decoded.iat && decoded.iat > now + 60) { // Allow 60 seconds clock skew
        throw new Error('Token issued in the future');
      }

      return decoded;
    } catch (error) {
      logger.error('Token validation failed', {
        tokenType,
        error: error.message
      });
      throw error;
    }
  }

  async refreshAccessToken(refreshToken) {
    try {
      // Delegate to TokenService for token refresh
      const TokenService = require('./TokenService');
      const result = await TokenService.refreshAccessToken(refreshToken);

      // Log token refresh activity
      await this.logUserActivity(result.user.id, 'token_refresh', {
        success: true,
        session_id: result.sessionId
      });

      logger.info('Access token refreshed successfully', {
        userId: result.user.id,
        sessionId: result.sessionId
      });

      return result;

    } catch (error) {
      logger.error('Token refresh failed', {
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = new AuthService();