const express = require('express');
const router = express.Router();
const MFAService = require('../services/MFAService');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { logger } = require('../utils/logger');

/**
 * @route POST /api/v1/mfa/setup/totp
 * @desc Generate TOTP secret and QR code for setup
 * @access Private
 */
router.post('/setup/totp', authenticateToken, async (req, res) => {
  try {
    const { userId, email } = req.user;
    
    const totpData = await MFAService.generateTOTPSecret(userId, email);
    
    res.status(200).json({
      success: true,
      data: totpData,
      message: 'TOTP setup initiated successfully'
    });
  } catch (error) {
    logger.error('TOTP setup failed', { error: error.message });
    res.status(500).json({ 
      error: 'Failed to setup TOTP',
      message: error.message 
    });
  }
});

/**
 * @route POST /api/v1/mfa/enable/totp
 * @desc Enable TOTP with verification token
 * @access Private
 */
router.post('/enable/totp', [
  authenticateToken,
  body('token').isLength({ min: 6, max: 6 }).withMessage('Token must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array() 
      });
    }

    const { userId } = req.user;
    const { token } = req.body;
    
    const result = await MFAService.enableTOTP(userId, token);
    
    res.status(200).json(result);
  } catch (error) {
    logger.error('TOTP enable failed', { error: error.message });
    res.status(400).json({ 
      error: 'Failed to enable TOTP',
      message: error.message 
    });
  }
});

/**
 * @route POST /api/v1/mfa/disable/totp
 * @desc Disable TOTP for user
 * @access Private
 */
router.post('/disable/totp', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    
    const result = await MFAService.disableTOTP(userId);
    
    res.status(200).json(result);
  } catch (error) {
    logger.error('TOTP disable failed', { error: error.message });
    res.status(500).json({ 
      error: 'Failed to disable TOTP',
      message: error.message 
    });
  }
});

/**
 * @route POST /api/v1/mfa/verify/totp
 * @desc Verify TOTP token during login
 * @access Public (for login flow)
 */
router.post('/verify/totp', [
  body('userId').isUUID().withMessage('Valid user ID required'),
  body('token').isLength({ min: 6, max: 6 }).withMessage('Token must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array() 
      });
    }

    const { userId, token } = req.body;
    
    const isValid = await MFAService.verifyTOTPToken(userId, token);
    
    if (isValid) {
      res.status(200).json({
        success: true,
        message: 'TOTP verification successful'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid TOTP token'
      });
    }
  } catch (error) {
    logger.error('TOTP verification failed', { error: error.message });
    res.status(500).json({ 
      error: 'TOTP verification failed',
      message: error.message 
    });
  }
});

/**
 * @route POST /api/v1/mfa/verify/backup
 * @desc Verify backup code during login
 * @access Public (for login flow)
 */
router.post('/verify/backup', [
  body('userId').isUUID().withMessage('Valid user ID required'),
  body('code').isLength({ min: 8, max: 8 }).withMessage('Backup code must be 8 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array() 
      });
    }

    const { userId, code } = req.body;
    
    const isValid = await MFAService.verifyBackupCode(userId, code);
    
    if (isValid) {
      res.status(200).json({
        success: true,
        message: 'Backup code verification successful'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid or used backup code'
      });
    }
  } catch (error) {
    logger.error('Backup code verification failed', { error: error.message });
    res.status(500).json({ 
      error: 'Backup code verification failed',
      message: error.message 
    });
  }
});

/**
 * @route POST /api/v1/mfa/backup-codes/generate
 * @desc Generate new backup codes
 * @access Private
 */
router.post('/backup-codes/generate', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    
    const backupCodes = await MFAService.generateNewBackupCodes(userId);
    
    res.status(200).json({
      success: true,
      data: { backupCodes },
      message: 'New backup codes generated successfully'
    });
  } catch (error) {
    logger.error('Backup codes generation failed', { error: error.message });
    res.status(500).json({ 
      error: 'Failed to generate backup codes',
      message: error.message 
    });
  }
});

/**
 * @route GET /api/v1/mfa/backup-codes
 * @desc Get current backup codes (masked)
 * @access Private
 */
router.get('/backup-codes', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    
    const mfaSettings = await MFAService.getMFASettings(userId);
    
    if (!mfaSettings) {
      return res.status(404).json({
        error: 'MFA settings not found',
        message: 'Please setup MFA first'
      });
    }

    const backupCodes = mfaSettings.backup_codes || [];
    const usedCodes = mfaSettings.backup_codes_used || [];
    
    // Return masked codes (show only first 4 characters)
    const maskedCodes = backupCodes.map(code => {
      const isUsed = usedCodes.includes(code);
      return {
        code: isUsed ? '********' : code.substring(0, 4) + '****',
        used: isUsed
      };
    });
    
    res.status(200).json({
      success: true,
      data: { backupCodes: maskedCodes },
      message: 'Backup codes retrieved successfully'
    });
  } catch (error) {
    logger.error('Backup codes retrieval failed', { error: error.message });
    res.status(500).json({ 
      error: 'Failed to retrieve backup codes',
      message: error.message 
    });
  }
});

/**
 * @route POST /api/v1/mfa/sms/send
 * @desc Send SMS verification code
 * @access Private
 */
router.post('/sms/send', [
  authenticateToken,
  body('phoneNumber').isMobilePhone().withMessage('Valid phone number required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array() 
      });
    }

    const { userId } = req.user;
    const { phoneNumber } = req.body;
    
    const result = await MFAService.sendSMSVerification(userId, phoneNumber);
    
    res.status(200).json(result);
  } catch (error) {
    logger.error('SMS send failed', { error: error.message });
    res.status(500).json({ 
      error: 'Failed to send SMS',
      message: error.message 
    });
  }
});

/**
 * @route POST /api/v1/mfa/sms/verify
 * @desc Verify SMS code
 * @access Public (for login flow)
 */
router.post('/sms/verify', [
  body('userId').isUUID().withMessage('Valid user ID required'),
  body('code').isLength({ min: 6, max: 6 }).withMessage('SMS code must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array() 
      });
    }

    const { userId, code } = req.body;
    
    const isValid = await MFAService.verifySMSCode(userId, code);
    
    if (isValid) {
      res.status(200).json({
        success: true,
        message: 'SMS verification successful'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid SMS code'
      });
    }
  } catch (error) {
    logger.error('SMS verification failed', { error: error.message });
    res.status(500).json({ 
      error: 'SMS verification failed',
      message: error.message 
    });
  }
});

/**
 * @route POST /api/v1/mfa/setup/sms
 * @desc Setup SMS MFA for user
 * @access Private
 */
router.post('/setup/sms', [
  authenticateToken,
  body('phoneNumber').isMobilePhone().withMessage('Valid phone number required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array() 
      });
    }

    const { userId } = req.user;
    const { phoneNumber } = req.body;
    
    const result = await MFAService.setupSMSMFA(userId, phoneNumber);
    
    res.status(200).json(result);
  } catch (error) {
    logger.error('SMS MFA setup failed', { error: error.message });
    res.status(500).json({ 
      error: 'Failed to setup SMS MFA',
      message: error.message 
    });
  }
});

/**
 * @route POST /api/v1/mfa/enable/sms
 * @desc Enable SMS MFA with verification code
 * @access Private
 */
router.post('/enable/sms', [
  authenticateToken,
  body('code').isLength({ min: 6, max: 6 }).withMessage('Code must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array() 
      });
    }

    const { userId } = req.user;
    const { code } = req.body;
    
    const result = await MFAService.enableSMSMFA(userId, code);
    
    res.status(200).json(result);
  } catch (error) {
    logger.error('SMS MFA enable failed', { error: error.message });
    res.status(400).json({ 
      error: 'Failed to enable SMS MFA',
      message: error.message 
    });
  }
});

/**
 * @route POST /api/v1/mfa/disable/sms
 * @desc Disable SMS MFA for user
 * @access Private
 */
router.post('/disable/sms', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    
    const result = await MFAService.disableSMSMFA(userId);
    
    res.status(200).json(result);
  } catch (error) {
    logger.error('SMS MFA disable failed', { error: error.message });
    res.status(500).json({ 
      error: 'Failed to disable SMS MFA',
      message: error.message 
    });
  }
});

/**
 * @route POST /api/v1/mfa/setup/email
 * @desc Setup Email MFA for user
 * @access Private
 */
router.post('/setup/email', [
  authenticateToken,
  body('email').isEmail().withMessage('Valid email address required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array() 
      });
    }

    const { userId } = req.user;
    const { email } = req.body;
    
    const result = await MFAService.setupEmailMFA(userId, email);
    
    res.status(200).json(result);
  } catch (error) {
    logger.error('Email MFA setup failed', { error: error.message });
    res.status(500).json({ 
      error: 'Failed to setup Email MFA',
      message: error.message 
    });
  }
});

/**
 * @route POST /api/v1/mfa/enable/email
 * @desc Enable Email MFA with verification code
 * @access Private
 */
router.post('/enable/email', [
  authenticateToken,
  body('code').isLength({ min: 6, max: 6 }).withMessage('Code must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array() 
      });
    }

    const { userId } = req.user;
    const { code } = req.body;
    
    const result = await MFAService.enableEmailMFA(userId, code);
    
    res.status(200).json(result);
  } catch (error) {
    logger.error('Email MFA enable failed', { error: error.message });
    res.status(400).json({ 
      error: 'Failed to enable Email MFA',
      message: error.message 
    });
  }
});

/**
 * @route POST /api/v1/mfa/disable/email
 * @desc Disable Email MFA for user
 * @access Private
 */
router.post('/disable/email', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    
    const result = await MFAService.disableEmailMFA(userId);
    
    res.status(200).json(result);
  } catch (error) {
    logger.error('Email MFA disable failed', { error: error.message });
    res.status(500).json({ 
      error: 'Failed to disable Email MFA',
      message: error.message 
    });
  }
});

/**
 * @route POST /api/v1/mfa/verify/email
 * @desc Verify Email code during login
 * @access Public (for login flow)
 */
router.post('/verify/email', [
  body('userId').isUUID().withMessage('Valid user ID required'),
  body('code').isLength({ min: 6, max: 6 }).withMessage('Email code must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array() 
      });
    }

    const { userId, code } = req.body;
    
    const isValid = await MFAService.verifyEmailCode(userId, code);
    
    if (isValid) {
      res.status(200).json({
        success: true,
        message: 'Email verification successful'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid email code'
      });
    }
  } catch (error) {
    logger.error('Email verification failed', { error: error.message });
    res.status(500).json({ 
      error: 'Email verification failed',
      message: error.message 
    });
  }
});

/**
 * @route POST /api/v1/mfa/validate
 * @desc Universal MFA code validation endpoint
 * @access Public (for login flow)
 */
router.post('/validate', [
  body('userId').isUUID().withMessage('Valid user ID required'),
  body('code').isLength({ min: 6, max: 16 }).withMessage('Code must be between 6 and 16 characters'),
  body('method').isIn(['totp', 'sms', 'email', 'backup']).withMessage('Invalid MFA method')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array() 
      });
    }

    const { userId, code, method } = req.body;
    
    const result = await MFAService.validateMFACode(userId, code, method);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    logger.error('MFA validation failed', { error: error.message });
    res.status(500).json({ 
      error: 'MFA validation failed',
      message: error.message 
    });
  }
});

/**
 * @route GET /api/v1/mfa/available-methods/:userId
 * @desc Get available MFA methods for a user (for login flow)
 * @access Public (for login flow)
 */
router.get('/available-methods/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return res.status(400).json({
        error: 'Invalid user ID format',
        message: 'User ID must be a valid UUID'
      });
    }
    
    const availableMethods = await MFAService.getAvailableMFAMethods(userId);
    
    res.status(200).json({
      success: true,
      data: availableMethods,
      message: 'Available MFA methods retrieved successfully'
    });
  } catch (error) {
    logger.error('Failed to get available MFA methods', { error: error.message });
    res.status(500).json({ 
      error: 'Failed to get available MFA methods',
      message: error.message 
    });
  }
});

/**
 * @route GET /api/v1/mfa/methods
 * @desc Get all MFA methods for user with management options
 * @access Private
 */
router.get('/methods', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    
    const MFAMethod = require('../models/MFAMethod');
    const allMethods = await MFAMethod.prototype.findByUser(userId, false); // Get all methods, not just active
    const mfaStats = await MFAMethod.prototype.getUserMFAStats(userId);
    const mfaSettings = await MFAService.getMFASettings(userId);
    
    // Format methods with management information
    const methodsWithDetails = allMethods.map(method => ({
      id: method.id,
      type: method.type,
      isActive: method.is_active,
      phoneNumber: method.type === 'sms' ? method.phone_number : undefined,
      createdAt: method.created_at,
      updatedAt: method.updated_at,
      canDisable: true, // All methods can be disabled
      canDelete: !method.is_active // Only inactive methods can be deleted
    }));
    
    res.status(200).json({
      success: true,
      data: {
        methods: methodsWithDetails,
        stats: mfaStats,
        backupCodes: {
          total: mfaSettings?.backup_codes?.length || 0,
          used: mfaSettings?.backup_codes_used?.length || 0,
          remaining: (mfaSettings?.backup_codes?.length || 0) - (mfaSettings?.backup_codes_used?.length || 0)
        },
        lastUsed: mfaSettings?.last_used_at
      },
      message: 'MFA methods retrieved successfully'
    });
  } catch (error) {
    logger.error('MFA methods retrieval failed', { error: error.message });
    res.status(500).json({ 
      error: 'Failed to retrieve MFA methods',
      message: error.message 
    });
  }
});

/**
 * @route DELETE /api/v1/mfa/methods/:methodId
 * @desc Delete an inactive MFA method
 * @access Private
 */
router.delete('/methods/:methodId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { methodId } = req.params;
    
    const MFAMethod = require('../models/MFAMethod');
    
    // Get the method to verify ownership and status
    const method = await MFAMethod.prototype.findById(methodId);
    
    if (!method) {
      return res.status(404).json({
        error: 'MFA method not found',
        message: 'The specified MFA method does not exist'
      });
    }
    
    if (method.user_id !== userId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only delete your own MFA methods'
      });
    }
    
    if (method.is_active) {
      return res.status(400).json({
        error: 'Cannot delete active method',
        message: 'Please disable the MFA method before deleting it'
      });
    }
    
    await MFAMethod.prototype.delete(methodId);
    
    logger.info('MFA method deleted', { userId, methodId, type: method.type });
    
    res.status(200).json({
      success: true,
      message: 'MFA method deleted successfully'
    });
  } catch (error) {
    logger.error('MFA method deletion failed', { error: error.message });
    res.status(500).json({ 
      error: 'Failed to delete MFA method',
      message: error.message 
    });
  }
});

/**
 * @route GET /api/v1/mfa/status
 * @desc Get MFA status for user
 * @access Private
 */
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    
    const mfaSettings = await MFAService.getMFASettings(userId);
    const isEnabled = await MFAService.isMFAEnabled(userId);
    
    // Get active MFA methods using the new model
    const MFAMethod = require('../models/MFAMethod');
    const activeMethods = await MFAMethod.prototype.findByUser(userId, true);
    const mfaStats = await MFAMethod.prototype.getUserMFAStats(userId);
    
    res.status(200).json({
      success: true,
      data: {
        enabled: isEnabled,
        totpEnabled: mfaSettings?.totp_enabled || false,
        smsEnabled: mfaSettings?.sms_enabled || false,
        emailEnabled: mfaSettings?.email_enabled || false,
        backupCodesCount: mfaSettings?.backup_codes?.length || 0,
        usedBackupCodesCount: mfaSettings?.backup_codes_used?.length || 0,
        lastUsed: mfaSettings?.last_used_at,
        activeMethods: activeMethods.map(method => ({
          id: method.id,
          type: method.type,
          phoneNumber: method.type === 'sms' ? method.phone_number : undefined,
          createdAt: method.created_at
        })),
        stats: mfaStats
      },
      message: 'MFA status retrieved successfully'
    });
  } catch (error) {
    logger.error('MFA status retrieval failed', { error: error.message });
    res.status(500).json({ 
      error: 'Failed to retrieve MFA status',
      message: error.message 
    });
  }
});

module.exports = router;
