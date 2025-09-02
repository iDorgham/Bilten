const request = require('supertest');
const express = require('express');
const mfaRoutes = require('../routes/mfa');
const MFAService = require('../services/MFAService');
const { authenticateToken } = require('../middleware/auth');

// Mock dependencies
jest.mock('../services/MFAService');
jest.mock('../middleware/auth');
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

describe('MFA Routes', () => {
  let app;
  const mockUserId = '550e8400-e29b-41d4-a716-446655440000'; // Valid UUID
  const mockEmail = 'test@example.com';

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Mock authentication middleware
    authenticateToken.mockImplementation((req, res, next) => {
      req.user = { userId: mockUserId, email: mockEmail };
      next();
    });
    
    app.use('/api/v1/mfa', mfaRoutes);
    
    jest.clearAllMocks();
  });

  describe('POST /api/v1/mfa/setup/totp', () => {
    it('should setup TOTP successfully', async () => {
      const mockTOTPData = {
        secret: 'JBSWY3DPEHPK3PXP',
        qrCodeUrl: 'otpauth://totp/test',
        qrCodeDataUrl: 'data:image/png;base64,mock',
        backupCodes: ['CODE1234', 'CODE5678'],
        message: 'TOTP setup initiated'
      };

      MFAService.generateTOTPSecret.mockResolvedValue(mockTOTPData);

      const response = await request(app)
        .post('/api/v1/mfa/setup/totp')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockTOTPData,
        message: 'TOTP setup initiated successfully'
      });

      expect(MFAService.generateTOTPSecret).toHaveBeenCalledWith(mockUserId, mockEmail);
    });

    it('should handle TOTP setup failure', async () => {
      MFAService.generateTOTPSecret.mockRejectedValue(new Error('Setup failed'));

      const response = await request(app)
        .post('/api/v1/mfa/setup/totp')
        .expect(500);

      expect(response.body.error).toBe('Failed to setup TOTP');
    });
  });

  describe('POST /api/v1/mfa/enable/totp', () => {
    it('should enable TOTP with valid token', async () => {
      const mockResult = { success: true, message: 'TOTP enabled successfully' };
      MFAService.enableTOTP.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/v1/mfa/enable/totp')
        .send({ token: '123456' })
        .expect(200);

      expect(response.body).toEqual(mockResult);
      expect(MFAService.enableTOTP).toHaveBeenCalledWith(mockUserId, '123456');
    });

    it('should reject invalid token format', async () => {
      const response = await request(app)
        .post('/api/v1/mfa/enable/totp')
        .send({ token: '12345' }) // Too short
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details[0].msg).toBe('Token must be 6 digits');
    });

    it('should handle enable TOTP failure', async () => {
      MFAService.enableTOTP.mockRejectedValue(new Error('Invalid TOTP token'));

      const response = await request(app)
        .post('/api/v1/mfa/enable/totp')
        .send({ token: '123456' })
        .expect(400);

      expect(response.body.error).toBe('Failed to enable TOTP');
    });
  });

  describe('POST /api/v1/mfa/disable/totp', () => {
    it('should disable TOTP successfully', async () => {
      const mockResult = { success: true, message: 'TOTP disabled successfully' };
      MFAService.disableTOTP.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/v1/mfa/disable/totp')
        .expect(200);

      expect(response.body).toEqual(mockResult);
      expect(MFAService.disableTOTP).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('POST /api/v1/mfa/setup/sms', () => {
    it('should setup SMS MFA successfully', async () => {
      const mockResult = {
        success: true,
        methodId: 'method-123',
        message: 'SMS MFA setup initiated',
        code: '123456'
      };

      MFAService.setupSMSMFA.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/v1/mfa/setup/sms')
        .send({ phoneNumber: '+1234567890' })
        .expect(200);

      expect(response.body).toEqual(mockResult);
      expect(MFAService.setupSMSMFA).toHaveBeenCalledWith(mockUserId, '+1234567890');
    });

    it('should reject invalid phone number', async () => {
      const response = await request(app)
        .post('/api/v1/mfa/setup/sms')
        .send({ phoneNumber: 'invalid-phone' })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('POST /api/v1/mfa/enable/sms', () => {
    it('should enable SMS MFA with valid code', async () => {
      const mockResult = { success: true, message: 'SMS MFA enabled successfully' };
      MFAService.enableSMSMFA.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/v1/mfa/enable/sms')
        .send({ code: '123456' })
        .expect(200);

      expect(response.body).toEqual(mockResult);
      expect(MFAService.enableSMSMFA).toHaveBeenCalledWith(mockUserId, '123456');
    });

    it('should reject invalid code format', async () => {
      const response = await request(app)
        .post('/api/v1/mfa/enable/sms')
        .send({ code: '12345' })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('POST /api/v1/mfa/setup/email', () => {
    it('should setup Email MFA successfully', async () => {
      const mockResult = {
        success: true,
        methodId: 'method-123',
        message: 'Email MFA setup initiated'
      };

      MFAService.setupEmailMFA.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/v1/mfa/setup/email')
        .send({ email: 'test@example.com' })
        .expect(200);

      expect(response.body).toEqual(mockResult);
      expect(MFAService.setupEmailMFA).toHaveBeenCalledWith(mockUserId, 'test@example.com');
    });

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/mfa/setup/email')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('POST /api/v1/mfa/verify/totp', () => {
    it('should verify TOTP token successfully', async () => {
      MFAService.verifyTOTPToken.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/v1/mfa/verify/totp')
        .send({ userId: mockUserId, token: '123456' })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'TOTP verification successful'
      });

      expect(MFAService.verifyTOTPToken).toHaveBeenCalledWith(mockUserId, '123456');
    });

    it('should reject invalid TOTP token', async () => {
      MFAService.verifyTOTPToken.mockResolvedValue(false);

      const response = await request(app)
        .post('/api/v1/mfa/verify/totp')
        .send({ userId: mockUserId, token: '123456' })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Invalid TOTP token'
      });
    });

    it('should validate request parameters', async () => {
      const response = await request(app)
        .post('/api/v1/mfa/verify/totp')
        .send({ userId: 'invalid-uuid', token: '12345' })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toHaveLength(2);
    });
  });

  describe('POST /api/v1/mfa/verify/backup', () => {
    it('should verify backup code successfully', async () => {
      MFAService.verifyBackupCode.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/v1/mfa/verify/backup')
        .send({ userId: mockUserId, code: 'CODE1234' })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Backup code verification successful'
      });

      expect(MFAService.verifyBackupCode).toHaveBeenCalledWith(mockUserId, 'CODE1234');
    });

    it('should reject invalid backup code', async () => {
      MFAService.verifyBackupCode.mockResolvedValue(false);

      const response = await request(app)
        .post('/api/v1/mfa/verify/backup')
        .send({ userId: mockUserId, code: 'CODE1234' })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Invalid or used backup code'
      });
    });

    it('should validate backup code length', async () => {
      const response = await request(app)
        .post('/api/v1/mfa/verify/backup')
        .send({ userId: mockUserId, code: 'SHORT' })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('POST /api/v1/mfa/backup-codes/generate', () => {
    it('should generate new backup codes', async () => {
      const mockBackupCodes = ['CODE1234', 'CODE5678'];
      MFAService.generateNewBackupCodes.mockResolvedValue(mockBackupCodes);

      const response = await request(app)
        .post('/api/v1/mfa/backup-codes/generate')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: { backupCodes: mockBackupCodes },
        message: 'New backup codes generated successfully'
      });

      expect(MFAService.generateNewBackupCodes).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('GET /api/v1/mfa/backup-codes', () => {
    it('should retrieve masked backup codes', async () => {
      const mockMFASettings = {
        backup_codes: ['CODE1234', 'CODE5678', 'CODE9012'],
        backup_codes_used: ['CODE1234']
      };

      MFAService.getMFASettings.mockResolvedValue(mockMFASettings);

      const response = await request(app)
        .get('/api/v1/mfa/backup-codes')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.backupCodes).toHaveLength(3);
      expect(response.body.data.backupCodes[0]).toEqual({
        code: '********',
        used: true
      });
      expect(response.body.data.backupCodes[1]).toEqual({
        code: 'CODE****',
        used: false
      });
    });

    it('should handle missing MFA settings', async () => {
      MFAService.getMFASettings.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/mfa/backup-codes')
        .expect(404);

      expect(response.body.error).toBe('MFA settings not found');
    });
  });

  describe('GET /api/v1/mfa/status', () => {
    it('should return comprehensive MFA status', async () => {
      const mockMFASettings = {
        totp_enabled: true,
        sms_enabled: false,
        email_enabled: true,
        backup_codes: ['CODE1', 'CODE2'],
        backup_codes_used: ['CODE1'],
        last_used_at: '2024-01-01T00:00:00Z'
      };

      const mockActiveMethods = [
        { id: 'method-1', type: 'totp', created_at: '2024-01-01T00:00:00Z' },
        { id: 'method-2', type: 'email', created_at: '2024-01-02T00:00:00Z' }
      ];

      const mockStats = {
        total_methods: 2,
        active_methods: 2,
        has_totp: true,
        has_sms: false,
        has_email: true
      };

      MFAService.getMFASettings.mockResolvedValue(mockMFASettings);
      MFAService.isMFAEnabled.mockResolvedValue(true);

      // Mock the MFAMethod require
      const MFAMethod = require('../models/MFAMethod');
      MFAMethod.prototype.findByUser = jest.fn().mockResolvedValue(mockActiveMethods);
      MFAMethod.prototype.getUserMFAStats = jest.fn().mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/api/v1/mfa/status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({
        enabled: true,
        totpEnabled: true,
        smsEnabled: false,
        emailEnabled: true,
        backupCodesCount: 2,
        usedBackupCodesCount: 1,
        lastUsed: '2024-01-01T00:00:00Z',
        activeMethods: [
          { id: 'method-1', type: 'totp', createdAt: '2024-01-01T00:00:00Z' },
          { id: 'method-2', type: 'email', createdAt: '2024-01-02T00:00:00Z' }
        ],
        stats: mockStats
      });
    });
  });

  describe('POST /api/v1/mfa/sms/send', () => {
    it('should send SMS verification code', async () => {
      const mockResult = { success: true, message: 'SMS verification code sent' };
      MFAService.sendSMSVerification.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/v1/mfa/sms/send')
        .send({ phoneNumber: '+1234567890' })
        .expect(200);

      expect(response.body).toEqual(mockResult);
      expect(MFAService.sendSMSVerification).toHaveBeenCalledWith(mockUserId, '+1234567890');
    });

    it('should validate phone number format', async () => {
      const response = await request(app)
        .post('/api/v1/mfa/sms/send')
        .send({ phoneNumber: 'invalid' })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('POST /api/v1/mfa/sms/verify', () => {
    it('should verify SMS code successfully', async () => {
      MFAService.verifySMSCode.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/v1/mfa/sms/verify')
        .send({ userId: mockUserId, code: '123456' })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'SMS verification successful'
      });
    });

    it('should reject invalid SMS code', async () => {
      MFAService.verifySMSCode.mockResolvedValue(false);

      const response = await request(app)
        .post('/api/v1/mfa/sms/verify')
        .send({ userId: mockUserId, code: '123456' })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Invalid SMS code'
      });
    });
  });

  describe('POST /api/v1/mfa/verify/email', () => {
    it('should verify email code successfully', async () => {
      MFAService.verifyEmailCode.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/v1/mfa/verify/email')
        .send({ userId: mockUserId, code: '123456' })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Email verification successful'
      });
    });

    it('should reject invalid email code', async () => {
      MFAService.verifyEmailCode.mockResolvedValue(false);

      const response = await request(app)
        .post('/api/v1/mfa/verify/email')
        .send({ userId: mockUserId, code: '123456' })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Invalid email code'
      });
    });
  });
});