const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { query } = require('../database/connection');
const UserAccount = require('../models/UserAccount');
const EmailService = require('./EmailService');
const { logger } = require('../utils/logger');

/**
 * Registration Service
 * 
 * Handles user registration with email verification workflow
 * Implements secure password hashing and token generation
 * Supports comprehensive validation and error handling
 */
class RegistrationService {
  constructor() {
    this.userAccount = new UserAccount();
  }

  /**
   * Register a new user with email verification
   * @param {Object} userData - User registration data
   * @param {string} userData.email - User email address
   * @param {string} userData.password - User password
   * @param {string} userData.first_name - User first name
   * @param {string} userData.last_name - User last name
   * @param {string} [userData.timezone] - User timezone (default: UTC)
   * @param {string} [userData.locale] - User locale (default: en)
   * @returns {Promise<Object>} Registration result
   */
  async registerUser(userData) {
    const { email, password, first_name, last_name, timezone = 'UTC', locale = 'en' } = userData;

    try {
      // Validate input data
      this.validateRegistrationData(userData);

      // Check if user already exists
      const existingUser = await this.userAccount.findByEmail(email, false);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Validate password strength
      this.validatePasswordStrength(password);

      // Hash password with bcrypt
      const passwordSalt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(password, passwordSalt);

      // Create user account
      const newUser = await this.userAccount.create({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        password_salt: passwordSalt,
        password_updated_at: new Date(),
        first_name,
        last_name,
        display_name: `${first_name} ${last_name}`,
        timezone,
        locale,
        status: 'pending_verification',
        email_verified: false,
        role: 'user',
        privacy_settings: {
          profile_visibility: 'private',
          email_notifications: true,
          marketing_emails: false
        },
        notification_preferences: {
          email: true,
          push: true,
          sms: false
        }
      });

      // Generate email verification token
      const verificationToken = await this.generateEmailVerificationToken(newUser.id);

      // Send verification email
      let emailSent = false;
      if (process.env.NODE_ENV !== 'test') {
        try {
          await EmailService.sendVerificationEmail(email, first_name, verificationToken);
          emailSent = true;
          logger.info('Verification email sent successfully', {
            userId: newUser.id,
            email: newUser.email
          });
        } catch (emailError) {
          logger.warn('Failed to send verification email', {
            userId: newUser.id,
            email: newUser.email,
            error: emailError.message
          });
        }
      }

      // Log registration activity
      await this.logRegistrationActivity(newUser.id, 'user_registered', {
        success: true,
        email_sent: emailSent,
        registration_method: 'email'
      });

      logger.info('User registered successfully', {
        userId: newUser.id,
        email: newUser.email,
        emailSent
      });

      // Return user without sensitive data
      const { password_hash, password_salt, ...userWithoutPassword } = newUser;
      
      return {
        user: userWithoutPassword,
        emailSent,
        message: 'Registration successful. Please check your email to verify your account.'
      };

    } catch (error) {
      logger.error('User registration failed', {
        email,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Verify user email with token
   * @param {string} token - Email verification token
   * @returns {Promise<Object>} Verification result
   */
  async verifyEmail(token) {
    try {
      // Find and validate verification token
      const tokenResult = await query(
        `SELECT vt.*, u.email, u.first_name, u.id as user_id
         FROM authentication.verification_tokens vt
         JOIN users.users u ON vt.user_id = u.id
         WHERE vt.token = $1 
         AND vt.token_type = 'email' 
         AND vt.expires_at > NOW() 
         AND vt.used_at IS NULL
         AND u.deleted_at IS NULL`,
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
      const updatedUser = await this.userAccount.update(tokenData.user_id, {
        email_verified: true,
        status: 'active'
      });

      // Log verification activity
      await this.logRegistrationActivity(tokenData.user_id, 'email_verified', {
        success: true,
        token_id: tokenData.id,
        verification_method: 'email'
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
        token: token.substring(0, 8) + '...', // Log partial token for security
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Resend verification email
   * @param {string} email - User email address
   * @returns {Promise<Object>} Resend result
   */
  async resendVerificationEmail(email) {
    try {
      const user = await this.userAccount.findByEmail(email, false);
      
      if (!user) {
        throw new Error('User not found');
      }

      if (user.email_verified) {
        throw new Error('Email is already verified');
      }

      if (user.status === 'suspended') {
        throw new Error('Account is suspended');
      }

      // Check rate limiting (max 3 resends per hour)
      const recentTokens = await query(
        `SELECT COUNT(*) as count 
         FROM authentication.verification_tokens 
         WHERE user_id = $1 
         AND token_type = 'email' 
         AND created_at > NOW() - INTERVAL '1 hour'`,
        [user.id]
      );

      if (recentTokens.rows[0].count >= 3) {
        throw new Error('Too many verification emails sent. Please wait before requesting another.');
      }

      // Invalidate existing verification tokens
      await query(
        'UPDATE authentication.verification_tokens SET used_at = NOW() WHERE user_id = $1 AND token_type = $2 AND used_at IS NULL',
        [user.id, 'email']
      );

      // Generate new verification token
      const verificationToken = await this.generateEmailVerificationToken(user.id);

      // Send verification email
      await EmailService.sendVerificationEmail(user.email, user.first_name, verificationToken);

      // Log resend activity
      await this.logRegistrationActivity(user.id, 'verification_email_resent', {
        success: true,
        resend_count: parseInt(recentTokens.rows[0].count) + 1
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

  /**
   * Check if email is available for registration
   * @param {string} email - Email to check
   * @returns {Promise<Object>} Availability result
   */
  async checkEmailAvailability(email) {
    try {
      const normalizedEmail = email.toLowerCase();
      const existingUser = await this.userAccount.findByEmail(normalizedEmail, true, true);
      
      return {
        available: !existingUser,
        email: normalizedEmail
      };
    } catch (error) {
      logger.error('Failed to check email availability', {
        email,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Generate secure email verification token
   * @param {string} userId - User ID
   * @param {number} expiresInHours - Token expiration in hours (default: 24)
   * @returns {Promise<string>} Verification token
   */
  async generateEmailVerificationToken(userId, expiresInHours = 24) {
    try {
      // Generate secure random token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + (expiresInHours * 60 * 60 * 1000));

      // Store token in database
      await query(
        `INSERT INTO authentication.verification_tokens (user_id, token, token_type, expires_at)
         VALUES ($1, $2, $3, $4)`,
        [userId, token, 'email', expiresAt]
      );

      return token;
    } catch (error) {
      logger.error('Failed to generate verification token', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Validate registration data
   * @param {Object} userData - User data to validate
   */
  validateRegistrationData(userData) {
    const { email, password, first_name, last_name } = userData;

    if (!email || !password || !first_name || !last_name) {
      throw new Error('Email, password, first name, and last name are required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    // Validate name lengths
    if (first_name.length < 2 || first_name.length > 50) {
      throw new Error('First name must be between 2 and 50 characters');
    }

    if (last_name.length < 2 || last_name.length > 50) {
      throw new Error('Last name must be between 2 and 50 characters');
    }

    // Check for potentially malicious content
    const nameRegex = /^[a-zA-Z\s\-'\.]+$/;
    if (!nameRegex.test(first_name) || !nameRegex.test(last_name)) {
      throw new Error('Names can only contain letters, spaces, hyphens, apostrophes, and periods');
    }
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   */
  validatePasswordStrength(password) {
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    if (password.length > 128) {
      throw new Error('Password must be less than 128 characters');
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter');
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      throw new Error('Password must contain at least one lowercase letter');
    }

    // Check for at least one number
    if (!/\d/.test(password)) {
      throw new Error('Password must contain at least one number');
    }

    // Check for at least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      throw new Error('Password must contain at least one special character');
    }

    // Check for common weak passwords
    const commonPasswords = [
      'password', '12345678', 'qwerty123', 'abc123456', 
      'password123', '123456789', 'welcome123', 'password123!'
    ];
    
    if (commonPasswords.includes(password.toLowerCase())) {
      throw new Error('Password is too common. Please choose a stronger password');
    }
  }

  /**
   * Log registration-related activity
   * @param {string} userId - User ID
   * @param {string} activityType - Type of activity
   * @param {Object} metadata - Additional metadata
   */
  async logRegistrationActivity(userId, activityType, metadata = {}) {
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
      logger.error('Failed to log registration activity', {
        userId,
        activityType,
        error: error.message
      });
      // Don't throw error for logging failures
    }
  }

  /**
   * Get registration statistics
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Registration statistics
   */
  async getRegistrationStats(options = {}) {
    try {
      const {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        endDate = new Date(),
        useReplica = true
      } = options;

      const result = await query(
        `SELECT 
           COUNT(*) as total_registrations,
           COUNT(CASE WHEN email_verified = true THEN 1 END) as verified_users,
           COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
           COUNT(CASE WHEN status = 'pending_verification' THEN 1 END) as pending_users,
           ROUND(
             COUNT(CASE WHEN email_verified = true THEN 1 END) * 100.0 / COUNT(*), 2
           ) as verification_rate
         FROM users.users 
         WHERE created_at BETWEEN $1 AND $2 
         AND deleted_at IS NULL`,
        [startDate, endDate],
        useReplica
      );

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to get registration statistics', {
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = RegistrationService;