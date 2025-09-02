const crypto = require('crypto');
const qrcode = require('qrcode');
const { query } = require('../database/connection');
const { logger } = require('../utils/logger');
const EmailService = require('./EmailService');
const MFAMethod = require('../models/MFAMethod');

/**
 * Multi-Factor Authentication Service
 * Handles TOTP, SMS, and backup codes for enhanced security
 */
class MFAService {
  constructor() {
    this.totpWindow = 2; // Allow 2 time windows for clock skew
    this.backupCodeLength = 8;
    this.backupCodeCount = 10;
  }

  /**
   * Generate TOTP secret for a user
   * @param {string} userId - User ID
   * @param {string} email - User email for QR code
   * @returns {Promise<Object>} TOTP setup data
   */
  async generateTOTPSecret(userId, email) {
    try {
      // Generate a random secret using the MFAMethod model
      const secret = MFAMethod.generateTOTPSecret();
      
      // Create or update MFA settings
      await this.upsertMFASettings(userId, { totp_secret: secret });
      
      // Generate QR code URL and data URL
      const qrCodeUrl = this.generateQRCodeUrl(secret, email);
      const qrCodeDataUrl = await this.generateQRCodeDataUrl(qrCodeUrl);
      
      // Generate backup codes
      const backupCodes = this.generateBackupCodes();
      await this.updateBackupCodes(userId, backupCodes);
      
      logger.info('TOTP secret generated', { userId });
      
      return {
        secret,
        qrCodeUrl,
        qrCodeDataUrl,
        backupCodes,
        message: 'TOTP setup initiated. Scan QR code with authenticator app.'
      };
    } catch (error) {
      logger.error('Failed to generate TOTP secret', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Verify TOTP token
   * @param {string} userId - User ID
   * @param {string} token - TOTP token
   * @returns {Promise<boolean>} Verification result
   */
  async verifyTOTPToken(userId, token) {
    try {
      const mfaSettings = await this.getMFASettings(userId);
      
      if (!mfaSettings || !mfaSettings.totp_enabled) {
        throw new Error('TOTP not enabled for user');
      }

      const secret = mfaSettings.totp_secret;
      const currentTime = Math.floor(Date.now() / 30000); // 30-second window
      
      // Check current and adjacent time windows
      for (let i = -this.totpWindow; i <= this.totpWindow; i++) {
        const expectedToken = this.generateTOTPToken(secret, currentTime + i);
        if (expectedToken === token) {
          await this.updateLastUsed(userId);
          logger.info('TOTP token verified successfully', { userId });
          return true;
        }
      }
      
      logger.warn('Invalid TOTP token', { userId });
      return false;
    } catch (error) {
      logger.error('TOTP verification failed', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Enable TOTP for a user
   * @param {string} userId - User ID
   * @param {string} token - Verification token
   * @returns {Promise<Object>} Result
   */
  async enableTOTP(userId, token) {
    try {
      const isValid = await this.verifyTOTPToken(userId, token);
      
      if (!isValid) {
        throw new Error('Invalid TOTP token');
      }

      // Get the TOTP secret from MFA settings
      const mfaSettings = await this.getMFASettings(userId);
      if (!mfaSettings || !mfaSettings.totp_secret) {
        throw new Error('TOTP secret not found. Please setup TOTP first.');
      }

      // Create MFA method record
      try {
        await MFAMethod.prototype.create({
          user_id: userId,
          type: 'totp',
          secret: mfaSettings.totp_secret,
          is_active: true
        });
      } catch (methodError) {
        // If method already exists, just activate it
        if (methodError.message.includes('already exists')) {
          const existingMethod = await MFAMethod.prototype.findByUserAndType(userId, 'totp');
          if (existingMethod) {
            await MFAMethod.prototype.activate(existingMethod.id);
          }
        } else {
          throw methodError;
        }
      }

      // Enable TOTP in settings
      await this.upsertMFASettings(userId, { 
        totp_enabled: true,
        mfa_enforced: true
      });
      
      // Update user table
      await query(
        'UPDATE users.users SET mfa_enabled = true, mfa_method = $1 WHERE id = $2',
        ['totp', userId]
      );

      logger.info('TOTP enabled for user', { userId });
      
      return {
        success: true,
        message: 'TOTP enabled successfully'
      };
    } catch (error) {
      logger.error('Failed to enable TOTP', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Disable TOTP for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Result
   */
  async disableTOTP(userId) {
    try {
      // Deactivate MFA method record
      const existingMethod = await MFAMethod.prototype.findByUserAndType(userId, 'totp');
      if (existingMethod) {
        await MFAMethod.prototype.deactivate(existingMethod.id);
      }

      // Disable TOTP in settings
      await this.upsertMFASettings(userId, { 
        totp_enabled: false,
        totp_secret: null,
        mfa_enforced: false
      });
      
      // Check if user has other active MFA methods
      const hasOtherMFA = await MFAMethod.prototype.hasActiveMFA(userId);
      
      // Update user table only if no other MFA methods are active
      if (!hasOtherMFA) {
        await query(
          'UPDATE users.users SET mfa_enabled = false, mfa_method = $1 WHERE id = $2',
          ['none', userId]
        );
      }

      logger.info('TOTP disabled for user', { userId });
      
      return {
        success: true,
        message: 'TOTP disabled successfully'
      };
    } catch (error) {
      logger.error('Failed to disable TOTP', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Generate backup codes
   * @returns {Array<string>} Array of backup codes
   */
  generateBackupCodes() {
    const codes = [];
    for (let i = 0; i < this.backupCodeCount; i++) {
      const code = crypto.randomBytes(this.backupCodeLength).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Verify backup code
   * @param {string} userId - User ID
   * @param {string} code - Backup code
   * @returns {Promise<boolean>} Verification result
   */
  async verifyBackupCode(userId, code) {
    try {
      const mfaSettings = await this.getMFASettings(userId);
      
      if (!mfaSettings) {
        return false;
      }

      const backupCodes = mfaSettings.backup_codes || [];
      const usedCodes = mfaSettings.backup_codes_used || [];
      
      // Check if code exists and hasn't been used
      if (backupCodes.includes(code) && !usedCodes.includes(code)) {
        // Mark code as used
        usedCodes.push(code);
        await this.upsertMFASettings(userId, { 
          backup_codes_used: usedCodes,
          last_used_at: new Date().toISOString()
        });
        
        logger.info('Backup code verified successfully', { userId });
        return true;
      }
      
      logger.warn('Invalid or used backup code', { userId });
      return false;
    } catch (error) {
      logger.error('Backup code verification failed', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Generate new backup codes
   * @param {string} userId - User ID
   * @returns {Promise<Array<string>>} New backup codes
   */
  async generateNewBackupCodes(userId) {
    try {
      const newCodes = this.generateBackupCodes();
      await this.updateBackupCodes(userId, newCodes);
      
      logger.info('New backup codes generated', { userId });
      
      return newCodes;
    } catch (error) {
      logger.error('Failed to generate new backup codes', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Setup SMS MFA for a user
   * @param {string} userId - User ID
   * @param {string} phoneNumber - Phone number
   * @returns {Promise<Object>} Result
   */
  async setupSMSMFA(userId, phoneNumber) {
    try {
      // Validate phone number format
      if (!MFAMethod.validatePhoneNumber(phoneNumber)) {
        throw new Error('Invalid phone number format. Please use E.164 format (e.g., +1234567890)');
      }

      // Create MFA method record
      const mfaMethod = await MFAMethod.prototype.create({
        user_id: userId,
        type: 'sms',
        phone_number: phoneNumber,
        is_active: false // Will be activated after verification
      });

      // Send verification code
      const verificationResult = await this.sendSMSVerification(userId, phoneNumber);

      logger.info('SMS MFA setup initiated', { userId, phoneNumber });

      return {
        success: true,
        methodId: mfaMethod.id,
        message: 'SMS MFA setup initiated. Please verify your phone number.',
        ...verificationResult
      };
    } catch (error) {
      logger.error('Failed to setup SMS MFA', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Send SMS verification code
   * @param {string} userId - User ID
   * @param {string} phoneNumber - Phone number
   * @returns {Promise<Object>} Result
   */
  async sendSMSVerification(userId, phoneNumber) {
    try {
      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store code in database (in production, use Redis with TTL)
      await this.storeSMSCode(userId, code);
      
      // Send SMS (implement with Twilio or similar service)
      // await this.sendSMS(phoneNumber, `Your Bilten verification code is: ${code}`);
      
      // For now, log the code (remove in production)
      logger.info('SMS verification code generated', { userId, code });
      
      return {
        success: true,
        message: 'SMS verification code sent',
        code // Remove this in production
      };
    } catch (error) {
      logger.error('Failed to send SMS verification', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Enable SMS MFA after verification
   * @param {string} userId - User ID
   * @param {string} code - SMS verification code
   * @returns {Promise<Object>} Result
   */
  async enableSMSMFA(userId, code) {
    try {
      const isValid = await this.verifySMSCode(userId, code);
      
      if (!isValid) {
        throw new Error('Invalid SMS verification code');
      }

      // Activate the SMS MFA method
      const smsMethod = await MFAMethod.prototype.findByUserAndType(userId, 'sms');
      if (!smsMethod) {
        throw new Error('SMS MFA method not found. Please setup SMS MFA first.');
      }

      await MFAMethod.prototype.activate(smsMethod.id);

      // Update MFA settings
      await this.upsertMFASettings(userId, { 
        sms_enabled: true,
        sms_phone: smsMethod.phone_number,
        mfa_enforced: true
      });

      // Update user table
      await query(
        'UPDATE users.users SET mfa_enabled = true WHERE id = $1',
        [userId]
      );

      logger.info('SMS MFA enabled for user', { userId });

      return {
        success: true,
        message: 'SMS MFA enabled successfully'
      };
    } catch (error) {
      logger.error('Failed to enable SMS MFA', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Verify SMS code
   * @param {string} userId - User ID
   * @param {string} code - SMS code
   * @returns {Promise<boolean>} Verification result
   */
  async verifySMSCode(userId, code) {
    try {
      const storedCode = await this.getSMSCode(userId);
      
      if (storedCode && storedCode === code) {
        await this.clearSMSCode(userId);
        await this.updateLastUsed(userId);
        
        logger.info('SMS code verified successfully', { userId });
        return true;
      }
      
      logger.warn('Invalid SMS code', { userId });
      return false;
    } catch (error) {
      logger.error('SMS verification failed', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Disable SMS MFA for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Result
   */
  async disableSMSMFA(userId) {
    try {
      // Deactivate MFA method record
      const existingMethod = await MFAMethod.prototype.findByUserAndType(userId, 'sms');
      if (existingMethod) {
        await MFAMethod.prototype.deactivate(existingMethod.id);
      }

      // Disable SMS in settings
      await this.upsertMFASettings(userId, { 
        sms_enabled: false,
        sms_phone: null
      });

      // Check if user has other active MFA methods
      const hasOtherMFA = await MFAMethod.prototype.hasActiveMFA(userId);
      
      // Update user table only if no other MFA methods are active
      if (!hasOtherMFA) {
        await query(
          'UPDATE users.users SET mfa_enabled = false, mfa_method = $1 WHERE id = $2',
          ['none', userId]
        );
      }

      logger.info('SMS MFA disabled for user', { userId });

      return {
        success: true,
        message: 'SMS MFA disabled successfully'
      };
    } catch (error) {
      logger.error('Failed to disable SMS MFA', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Setup Email MFA for a user
   * @param {string} userId - User ID
   * @param {string} email - Email address
   * @returns {Promise<Object>} Result
   */
  async setupEmailMFA(userId, email) {
    try {
      // Create MFA method record
      const mfaMethod = await MFAMethod.prototype.create({
        user_id: userId,
        type: 'email',
        is_active: false // Will be activated after verification
      });

      // Send verification code
      const verificationResult = await this.sendEmailVerification(userId, email);

      logger.info('Email MFA setup initiated', { userId, email });

      return {
        success: true,
        methodId: mfaMethod.id,
        message: 'Email MFA setup initiated. Please verify your email address.',
        ...verificationResult
      };
    } catch (error) {
      logger.error('Failed to setup Email MFA', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Send Email verification code
   * @param {string} userId - User ID
   * @param {string} email - Email address
   * @returns {Promise<Object>} Result
   */
  async sendEmailVerification(userId, email) {
    try {
      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store code in database
      await this.storeEmailCode(userId, code);
      
      // Send email
      try {
        await EmailService.sendMFAVerificationEmail(email, code);
      } catch (emailError) {
        logger.warn('Email service not available, code logged for development', { userId, code });
      }
      
      logger.info('Email verification code sent', { userId, email });
      
      return {
        success: true,
        message: 'Email verification code sent'
      };
    } catch (error) {
      logger.error('Failed to send email verification', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Enable Email MFA after verification
   * @param {string} userId - User ID
   * @param {string} code - Email verification code
   * @returns {Promise<Object>} Result
   */
  async enableEmailMFA(userId, code) {
    try {
      const isValid = await this.verifyEmailCode(userId, code);
      
      if (!isValid) {
        throw new Error('Invalid email verification code');
      }

      // Activate the Email MFA method
      const emailMethod = await MFAMethod.prototype.findByUserAndType(userId, 'email');
      if (!emailMethod) {
        throw new Error('Email MFA method not found. Please setup Email MFA first.');
      }

      await MFAMethod.prototype.activate(emailMethod.id);

      // Update MFA settings
      await this.upsertMFASettings(userId, { 
        email_enabled: true,
        mfa_enforced: true
      });

      // Update user table
      await query(
        'UPDATE users.users SET mfa_enabled = true WHERE id = $1',
        [userId]
      );

      logger.info('Email MFA enabled for user', { userId });

      return {
        success: true,
        message: 'Email MFA enabled successfully'
      };
    } catch (error) {
      logger.error('Failed to enable Email MFA', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Verify Email code
   * @param {string} userId - User ID
   * @param {string} code - Email code
   * @returns {Promise<boolean>} Verification result
   */
  async verifyEmailCode(userId, code) {
    try {
      const storedCode = await this.getEmailCode(userId);
      
      if (storedCode && storedCode === code) {
        await this.clearEmailCode(userId);
        await this.updateLastUsed(userId);
        
        logger.info('Email code verified successfully', { userId });
        return true;
      }
      
      logger.warn('Invalid email code', { userId });
      return false;
    } catch (error) {
      logger.error('Email verification failed', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Disable Email MFA for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Result
   */
  async disableEmailMFA(userId) {
    try {
      // Deactivate MFA method record
      const existingMethod = await MFAMethod.prototype.findByUserAndType(userId, 'email');
      if (existingMethod) {
        await MFAMethod.prototype.deactivate(existingMethod.id);
      }

      // Disable Email in settings
      await this.upsertMFASettings(userId, { 
        email_enabled: false,
        email_address: null
      });

      // Check if user has other active MFA methods
      const hasOtherMFA = await MFAMethod.prototype.hasActiveMFA(userId);
      
      // Update user table only if no other MFA methods are active
      if (!hasOtherMFA) {
        await query(
          'UPDATE users.users SET mfa_enabled = false, mfa_method = $1 WHERE id = $2',
          ['none', userId]
        );
      }

      logger.info('Email MFA disabled for user', { userId });

      return {
        success: true,
        message: 'Email MFA disabled successfully'
      };
    } catch (error) {
      logger.error('Failed to disable Email MFA', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Validate MFA code for any supported method
   * @param {string} userId - User ID
   * @param {string} code - MFA code
   * @param {string} method - MFA method type ('totp', 'sms', 'email', 'backup')
   * @returns {Promise<Object>} Validation result
   */
  async validateMFACode(userId, code, method) {
    try {
      let isValid = false;
      let methodUsed = method;

      switch (method.toLowerCase()) {
        case 'totp':
          isValid = await this.verifyTOTPToken(userId, code);
          break;
        case 'sms':
          isValid = await this.verifySMSCode(userId, code);
          break;
        case 'email':
          isValid = await this.verifyEmailCode(userId, code);
          break;
        case 'backup':
          isValid = await this.verifyBackupCode(userId, code);
          methodUsed = 'backup_code';
          break;
        default:
          throw new Error(`Unsupported MFA method: ${method}`);
      }

      if (isValid) {
        // Log successful MFA validation
        logger.info('MFA validation successful', { userId, method: methodUsed });
        
        return {
          success: true,
          method: methodUsed,
          message: 'MFA validation successful'
        };
      } else {
        logger.warn('MFA validation failed', { userId, method: methodUsed });
        
        return {
          success: false,
          method: methodUsed,
          message: 'Invalid MFA code'
        };
      }
    } catch (error) {
      logger.error('MFA validation error', { userId, method, error: error.message });
      throw error;
    }
  }

  /**
   * Get available MFA methods for user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Available MFA methods
   */
  async getAvailableMFAMethods(userId) {
    try {
      const activeMethods = await MFAMethod.prototype.getActiveMFATypes(userId);
      const mfaSettings = await this.getMFASettings(userId);
      
      const availableMethods = {
        totp: activeMethods.includes('totp'),
        sms: activeMethods.includes('sms'),
        email: activeMethods.includes('email'),
        backup: !!(mfaSettings && mfaSettings.backup_codes && mfaSettings.backup_codes.length > 0)
      };

      return {
        methods: availableMethods,
        hasAnyMethod: Object.values(availableMethods).some(Boolean),
        activeMethodCount: activeMethods.length
      };
    } catch (error) {
      logger.error('Failed to get available MFA methods', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Check if user has MFA enabled
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} MFA status
   */
  async isMFAEnabled(userId) {
    try {
      // Check using the MFAMethod model for more accurate results
      const hasActiveMFA = await MFAMethod.prototype.hasActiveMFA(userId);
      if (hasActiveMFA) {
        return true;
      }

      // Fallback to checking MFA settings
      const mfaSettings = await this.getMFASettings(userId);
      return !!(mfaSettings && (mfaSettings.totp_enabled || mfaSettings.sms_enabled || mfaSettings.email_enabled));
    } catch (error) {
      logger.error('Failed to check MFA status', { userId, error: error.message });
      return false;
    }
  }

  /**
   * Get MFA settings for user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} MFA settings
   */
  async getMFASettings(userId) {
    try {
      const result = await query(
        'SELECT * FROM authentication.mfa_settings WHERE user_id = $1',
        [userId]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Failed to get MFA settings', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Upsert MFA settings
   * @param {string} userId - User ID
   * @param {Object} settings - Settings to update
   * @returns {Promise<void>}
   */
  async upsertMFASettings(userId, settings) {
    try {
      const existing = await this.getMFASettings(userId);
      
      if (existing) {
        const updateFields = Object.keys(settings).map((key, index) => `${key} = $${index + 2}`);
        const updateValues = Object.values(settings);
        
        await query(
          `UPDATE authentication.mfa_settings 
           SET ${updateFields.join(', ')}, updated_at = NOW() 
           WHERE user_id = $1`,
          [userId, ...updateValues]
        );
      } else {
        const fields = Object.keys(settings);
        const values = Object.values(settings);
        const placeholders = fields.map((_, index) => `$${index + 2}`);
        
        await query(
          `INSERT INTO authentication.mfa_settings (user_id, ${fields.join(', ')}) 
           VALUES ($1, ${placeholders.join(', ')})`,
          [userId, ...values]
        );
      }
    } catch (error) {
      logger.error('Failed to upsert MFA settings', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Update backup codes
   * @param {string} userId - User ID
   * @param {Array<string>} codes - Backup codes
   * @returns {Promise<void>}
   */
  async updateBackupCodes(userId, codes) {
    await this.upsertMFASettings(userId, { 
      backup_codes: codes,
      backup_codes_used: []
    });
  }

  /**
   * Update last used timestamp
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async updateLastUsed(userId) {
    await this.upsertMFASettings(userId, { 
      last_used_at: new Date().toISOString()
    });
  }

  /**
   * Generate TOTP token for given secret and time
   * @param {string} secret - TOTP secret
   * @param {number} time - Time counter
   * @returns {string} TOTP token
   */
  generateTOTPToken(secret, time) {
    const key = Buffer.from(secret, 'base32');
    const message = Buffer.alloc(8);
    message.writeBigUInt64BE(BigInt(time), 0);
    
    const hmac = crypto.createHmac('sha1', key);
    hmac.update(message);
    const hash = hmac.digest();
    
    const offset = hash[hash.length - 1] & 0xf;
    const code = ((hash[offset] & 0x7f) << 24) |
                 ((hash[offset + 1] & 0xff) << 16) |
                 ((hash[offset + 2] & 0xff) << 8) |
                 (hash[offset + 3] & 0xff);
    
    return (code % 1000000).toString().padStart(6, '0');
  }

  /**
   * Generate QR code URL for TOTP
   * @param {string} secret - TOTP secret
   * @param {string} email - User email
   * @returns {string} QR code URL
   */
  generateQRCodeUrl(secret, email) {
    const issuer = 'Bilten';
    const account = email;
    const url = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
    return url;
  }

  /**
   * Generate QR code data URL for TOTP
   * @param {string} qrCodeUrl - TOTP URL
   * @returns {Promise<string>} QR code data URL
   */
  async generateQRCodeDataUrl(qrCodeUrl) {
    try {
      const qrCodeDataUrl = await qrcode.toDataURL(qrCodeUrl, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      return qrCodeDataUrl;
    } catch (error) {
      logger.error('Failed to generate QR code data URL', { error: error.message });
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Store SMS code (in production, use Redis with TTL)
   * @param {string} userId - User ID
   * @param {string} code - SMS code
   * @returns {Promise<void>}
   */
  async storeSMSCode(userId, code) {
    // In production, use Redis with 5-minute TTL
    // For now, store in database
    await query(
      `INSERT INTO authentication.verification_tokens (user_id, token, token_type, expires_at)
       VALUES ($1, $2, 'sms_mfa', NOW() + INTERVAL '5 minutes')`,
      [userId, code]
    );
  }

  /**
   * Get SMS code
   * @param {string} userId - User ID
   * @returns {Promise<string>} SMS code
   */
  async getSMSCode(userId) {
    const result = await query(
      `SELECT token FROM authentication.verification_tokens 
       WHERE user_id = $1 AND token_type = 'sms_mfa' 
       AND expires_at > NOW() AND used_at IS NULL
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    
    return result.rows[0]?.token || null;
  }

  /**
   * Clear SMS code
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async clearSMSCode(userId) {
    await query(
      `UPDATE authentication.verification_tokens 
       SET used_at = NOW() 
       WHERE user_id = $1 AND token_type = 'sms_mfa' AND used_at IS NULL`,
      [userId]
    );
  }

  /**
   * Store Email code
   * @param {string} userId - User ID
   * @param {string} code - Email code
   * @returns {Promise<void>}
   */
  async storeEmailCode(userId, code) {
    await query(
      `INSERT INTO authentication.verification_tokens (user_id, token, token_type, expires_at)
       VALUES ($1, $2, 'email_mfa', NOW() + INTERVAL '10 minutes')`,
      [userId, code]
    );
  }

  /**
   * Get Email code
   * @param {string} userId - User ID
   * @returns {Promise<string>} Email code
   */
  async getEmailCode(userId) {
    const result = await query(
      `SELECT token FROM authentication.verification_tokens 
       WHERE user_id = $1 AND token_type = 'email_mfa' 
       AND expires_at > NOW() AND used_at IS NULL
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    
    return result.rows[0]?.token || null;
  }

  /**
   * Clear Email code
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async clearEmailCode(userId) {
    await query(
      `UPDATE authentication.verification_tokens 
       SET used_at = NOW() 
       WHERE user_id = $1 AND token_type = 'email_mfa' AND used_at IS NULL`,
      [userId]
    );
  }
}

module.exports = new MFAService();
