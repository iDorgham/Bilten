const MFAService = require('../services/MFAService');
const MFAMethod = require('../models/MFAMethod');
const EmailService = require('../services/EmailService');
const { query } = require('../database/connection');
const qrcode = require('qrcode');

// Mock dependencies
jest.mock('../models/MFAMethod');
jest.mock('../services/EmailService');
jest.mock('../database/connection');
jest.mock('qrcode');
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

describe('MFAService', () => {
  const mockUserId = 'user-123';
  const mockEmail = 'test@example.com';
  const mockPhoneNumber = '+1234567890';
  const mockSecret = 'JBSWY3DPEHPK3PXP';
  const mockToken = '123456';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset MFAService methods
    MFAService.upsertMFASettings = jest.fn();
    MFAService.getMFASettings = jest.fn();
    MFAService.updateBackupCodes = jest.fn();
    MFAService.updateLastUsed = jest.fn();
    MFAService.generateBackupCodes = jest.fn();
    MFAService.generateQRCodeUrl = jest.fn();
    MFAService.generateQRCodeDataUrl = jest.fn();
    MFAService.storeSMSCode = jest.fn();
    MFAService.getSMSCode = jest.fn();
    MFAService.clearSMSCode = jest.fn();
    MFAService.storeEmailCode = jest.fn();
    MFAService.getEmailCode = jest.fn();
    MFAService.clearEmailCode = jest.fn();
    MFAService.generateTOTPToken = jest.fn();
  });

  describe('generateTOTPSecret', () => {
    it('should generate TOTP secret with QR code successfully', async () => {
      const mockBackupCodes = ['CODE1234', 'CODE5678'];
      const mockQRCodeUrl = 'otpauth://totp/Bilten:test@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Bilten';
      const mockQRCodeDataUrl = 'data:image/png;base64,mockdata';

      // Mock MFAMethod.generateTOTPSecret
      MFAMethod.generateTOTPSecret = jest.fn().mockReturnValue(mockSecret);
      
      // Mock service methods
      MFAService.upsertMFASettings = jest.fn().mockResolvedValue();
      MFAService.generateBackupCodes = jest.fn().mockReturnValue(mockBackupCodes);
      MFAService.updateBackupCodes = jest.fn().mockResolvedValue();
      MFAService.generateQRCodeUrl = jest.fn().mockReturnValue(mockQRCodeUrl);
      
      // Mock qrcode
      qrcode.toDataURL = jest.fn().mockResolvedValue(mockQRCodeDataUrl);

      const result = await MFAService.generateTOTPSecret(mockUserId, mockEmail);

      expect(result).toEqual({
        secret: mockSecret,
        qrCodeUrl: mockQRCodeUrl,
        qrCodeDataUrl: mockQRCodeDataUrl,
        backupCodes: mockBackupCodes,
        message: 'TOTP setup initiated. Scan QR code with authenticator app.'
      });

      expect(MFAMethod.generateTOTPSecret).toHaveBeenCalled();
      expect(MFAService.upsertMFASettings).toHaveBeenCalledWith(mockUserId, { totp_secret: mockSecret });
      expect(MFAService.updateBackupCodes).toHaveBeenCalledWith(mockUserId, mockBackupCodes);
    });

    it('should handle QR code generation failure', async () => {
      MFAMethod.generateTOTPSecret = jest.fn().mockReturnValue(mockSecret);
      MFAService.upsertMFASettings = jest.fn().mockResolvedValue();
      MFAService.generateBackupCodes = jest.fn().mockReturnValue([]);
      MFAService.updateBackupCodes = jest.fn().mockResolvedValue();
      MFAService.generateQRCodeUrl = jest.fn().mockReturnValue('mock-url');
      
      qrcode.toDataURL = jest.fn().mockRejectedValue(new Error('QR code generation failed'));

      await expect(MFAService.generateTOTPSecret(mockUserId, mockEmail)).rejects.toThrow('Failed to generate TOTP secret');
    });
  });

  describe('enableTOTP', () => {
    it('should enable TOTP successfully after verification', async () => {
      const mockMFASettings = { totp_secret: mockSecret };
      const mockMFAMethod = { id: 'method-123' };

      MFAService.verifyTOTPToken = jest.fn().mockResolvedValue(true);
      MFAService.getMFASettings = jest.fn().mockResolvedValue(mockMFASettings);
      MFAMethod.prototype.create = jest.fn().mockResolvedValue(mockMFAMethod);
      MFAService.upsertMFASettings = jest.fn().mockResolvedValue();
      query.mockResolvedValue();

      const result = await MFAService.enableTOTP(mockUserId, mockToken);

      expect(result).toEqual({
        success: true,
        message: 'TOTP enabled successfully'
      });

      expect(MFAService.verifyTOTPToken).toHaveBeenCalledWith(mockUserId, mockToken);
      expect(MFAMethod.prototype.create).toHaveBeenCalledWith({
        user_id: mockUserId,
        type: 'totp',
        secret: mockSecret,
        is_active: true
      });
      expect(query).toHaveBeenCalledWith(
        'UPDATE users.users SET mfa_enabled = true, mfa_method = $1 WHERE id = $2',
        ['totp', mockUserId]
      );
    });

    it('should handle existing method by activating it', async () => {
      const mockMFASettings = { totp_secret: mockSecret };
      const mockExistingMethod = { id: 'existing-method' };

      MFAService.verifyTOTPToken = jest.fn().mockResolvedValue(true);
      MFAService.getMFASettings = jest.fn().mockResolvedValue(mockMFASettings);
      MFAMethod.prototype.create = jest.fn().mockRejectedValue(new Error('TOTP method already exists for this user'));
      MFAMethod.prototype.findByUserAndType = jest.fn().mockResolvedValue(mockExistingMethod);
      MFAMethod.prototype.activate = jest.fn().mockResolvedValue();
      MFAService.upsertMFASettings = jest.fn().mockResolvedValue();
      query.mockResolvedValue();

      const result = await MFAService.enableTOTP(mockUserId, mockToken);

      expect(result.success).toBe(true);
      expect(MFAMethod.prototype.activate).toHaveBeenCalledWith(mockExistingMethod.id);
    });

    it('should throw error for invalid token', async () => {
      MFAService.verifyTOTPToken = jest.fn().mockResolvedValue(false);

      await expect(MFAService.enableTOTP(mockUserId, 'invalid-token')).rejects.toThrow('Invalid TOTP token');
    });

    it('should throw error if TOTP secret not found', async () => {
      MFAService.verifyTOTPToken = jest.fn().mockResolvedValue(true);
      MFAService.getMFASettings = jest.fn().mockResolvedValue(null);

      await expect(MFAService.enableTOTP(mockUserId, mockToken)).rejects.toThrow('TOTP secret not found. Please setup TOTP first.');
    });
  });

  describe('disableTOTP', () => {
    it('should disable TOTP successfully', async () => {
      const mockExistingMethod = { id: 'method-123' };

      MFAMethod.prototype.findByUserAndType = jest.fn().mockResolvedValue(mockExistingMethod);
      MFAMethod.prototype.deactivate = jest.fn().mockResolvedValue();
      MFAService.upsertMFASettings = jest.fn().mockResolvedValue();
      MFAMethod.prototype.hasActiveMFA = jest.fn().mockResolvedValue(false);
      query.mockResolvedValue();

      const result = await MFAService.disableTOTP(mockUserId);

      expect(result).toEqual({
        success: true,
        message: 'TOTP disabled successfully'
      });

      expect(MFAMethod.prototype.deactivate).toHaveBeenCalledWith(mockExistingMethod.id);
      expect(query).toHaveBeenCalledWith(
        'UPDATE users.users SET mfa_enabled = false, mfa_method = $1 WHERE id = $2',
        ['none', mockUserId]
      );
    });

    it('should not disable user MFA if other methods are active', async () => {
      const mockExistingMethod = { id: 'method-123' };

      MFAMethod.prototype.findByUserAndType = jest.fn().mockResolvedValue(mockExistingMethod);
      MFAMethod.prototype.deactivate = jest.fn().mockResolvedValue();
      MFAService.upsertMFASettings = jest.fn().mockResolvedValue();
      MFAMethod.prototype.hasActiveMFA = jest.fn().mockResolvedValue(true); // Other MFA methods active

      const result = await MFAService.disableTOTP(mockUserId);

      expect(result.success).toBe(true);
      expect(query).not.toHaveBeenCalled(); // Should not update user table
    });
  });

  describe('setupSMSMFA', () => {
    it('should setup SMS MFA successfully', async () => {
      const mockMFAMethod = { id: 'sms-method-123' };
      const mockVerificationResult = { success: true, code: '123456' };

      MFAMethod.validatePhoneNumber = jest.fn().mockReturnValue(true);
      MFAMethod.prototype.create = jest.fn().mockResolvedValue(mockMFAMethod);
      MFAService.sendSMSVerification = jest.fn().mockResolvedValue(mockVerificationResult);

      const result = await MFAService.setupSMSMFA(mockUserId, mockPhoneNumber);

      expect(result).toEqual({
        success: true,
        methodId: mockMFAMethod.id,
        message: 'SMS MFA setup initiated. Please verify your phone number.',
        ...mockVerificationResult
      });

      expect(MFAMethod.validatePhoneNumber).toHaveBeenCalledWith(mockPhoneNumber);
      expect(MFAMethod.prototype.create).toHaveBeenCalledWith({
        user_id: mockUserId,
        type: 'sms',
        phone_number: mockPhoneNumber,
        is_active: false
      });
    });

    it('should throw error for invalid phone number', async () => {
      MFAMethod.validatePhoneNumber = jest.fn().mockReturnValue(false);

      await expect(MFAService.setupSMSMFA(mockUserId, 'invalid-phone')).rejects.toThrow('Invalid phone number format');
    });
  });

  describe('enableSMSMFA', () => {
    it('should enable SMS MFA after successful verification', async () => {
      const mockSMSMethod = { id: 'sms-method-123', phone_number: mockPhoneNumber };

      MFAService.verifySMSCode = jest.fn().mockResolvedValue(true);
      MFAMethod.prototype.findByUserAndType = jest.fn().mockResolvedValue(mockSMSMethod);
      MFAMethod.prototype.activate = jest.fn().mockResolvedValue();
      MFAService.upsertMFASettings = jest.fn().mockResolvedValue();
      query.mockResolvedValue();

      const result = await MFAService.enableSMSMFA(mockUserId, mockToken);

      expect(result).toEqual({
        success: true,
        message: 'SMS MFA enabled successfully'
      });

      expect(MFAMethod.prototype.activate).toHaveBeenCalledWith(mockSMSMethod.id);
      expect(MFAService.upsertMFASettings).toHaveBeenCalledWith(mockUserId, {
        sms_enabled: true,
        sms_phone: mockPhoneNumber,
        mfa_enforced: true
      });
    });

    it('should throw error for invalid SMS code', async () => {
      MFAService.verifySMSCode = jest.fn().mockResolvedValue(false);

      await expect(MFAService.enableSMSMFA(mockUserId, 'invalid-code')).rejects.toThrow('Invalid SMS verification code');
    });
  });

  describe('setupEmailMFA', () => {
    it('should setup Email MFA successfully', async () => {
      const mockMFAMethod = { id: 'email-method-123' };
      const mockVerificationResult = { success: true };

      MFAMethod.prototype.create = jest.fn().mockResolvedValue(mockMFAMethod);
      MFAService.sendEmailVerification = jest.fn().mockResolvedValue(mockVerificationResult);

      const result = await MFAService.setupEmailMFA(mockUserId, mockEmail);

      expect(result).toEqual({
        success: true,
        methodId: mockMFAMethod.id,
        message: 'Email MFA setup initiated. Please verify your email address.',
        ...mockVerificationResult
      });

      expect(MFAMethod.prototype.create).toHaveBeenCalledWith({
        user_id: mockUserId,
        type: 'email',
        is_active: false
      });
    });
  });

  describe('sendEmailVerification', () => {
    it('should send email verification code successfully', async () => {
      MFAService.storeEmailCode = jest.fn().mockResolvedValue();
      EmailService.sendMFAVerificationEmail = jest.fn().mockResolvedValue();

      const result = await MFAService.sendEmailVerification(mockUserId, mockEmail);

      expect(result).toEqual({
        success: true,
        message: 'Email verification code sent'
      });

      expect(MFAService.storeEmailCode).toHaveBeenCalledWith(mockUserId, expect.any(String));
      expect(EmailService.sendMFAVerificationEmail).toHaveBeenCalledWith(mockEmail, expect.any(String));
    });
  });

  describe('verifyTOTPToken', () => {
    it('should verify valid TOTP token', async () => {
      const mockMFASettings = {
        totp_enabled: true,
        totp_secret: mockSecret
      };

      MFAService.getMFASettings = jest.fn().mockResolvedValue(mockMFASettings);
      MFAService.generateTOTPToken = jest.fn().mockReturnValue(mockToken);
      MFAService.updateLastUsed = jest.fn().mockResolvedValue();

      const result = await MFAService.verifyTOTPToken(mockUserId, mockToken);

      expect(result).toBe(true);
      expect(MFAService.updateLastUsed).toHaveBeenCalledWith(mockUserId);
    });

    it('should reject invalid TOTP token', async () => {
      const mockMFASettings = {
        totp_enabled: true,
        totp_secret: mockSecret
      };

      MFAService.getMFASettings = jest.fn().mockResolvedValue(mockMFASettings);
      MFAService.generateTOTPToken = jest.fn().mockReturnValue('different-token');

      const result = await MFAService.verifyTOTPToken(mockUserId, mockToken);

      expect(result).toBe(false);
    });

    it('should throw error if TOTP not enabled', async () => {
      const mockMFASettings = {
        totp_enabled: false
      };

      MFAService.getMFASettings = jest.fn().mockResolvedValue(mockMFASettings);

      await expect(MFAService.verifyTOTPToken(mockUserId, mockToken)).rejects.toThrow('TOTP not enabled for user');
    });
  });

  describe('generateBackupCodes', () => {
    it('should generate 10 backup codes', () => {
      const codes = MFAService.generateBackupCodes();

      expect(codes).toHaveLength(10);
      expect(codes[0]).toHaveLength(16); // 8 bytes * 2 (hex) = 16 characters
      expect(codes.every(code => /^[A-F0-9]+$/.test(code))).toBe(true);
    });

    it('should generate unique codes', () => {
      const codes = MFAService.generateBackupCodes();
      const uniqueCodes = [...new Set(codes)];

      expect(uniqueCodes).toHaveLength(codes.length);
    });
  });

  describe('verifyBackupCode', () => {
    it('should verify valid unused backup code', async () => {
      const mockMFASettings = {
        backup_codes: ['CODE1234', 'CODE5678'],
        backup_codes_used: []
      };

      MFAService.getMFASettings = jest.fn().mockResolvedValue(mockMFASettings);
      MFAService.upsertMFASettings = jest.fn().mockResolvedValue();

      const result = await MFAService.verifyBackupCode(mockUserId, 'CODE1234');

      expect(result).toBe(true);
      expect(MFAService.upsertMFASettings).toHaveBeenCalledWith(mockUserId, {
        backup_codes_used: ['CODE1234'],
        last_used_at: expect.any(String)
      });
    });

    it('should reject already used backup code', async () => {
      const mockMFASettings = {
        backup_codes: ['CODE1234', 'CODE5678'],
        backup_codes_used: ['CODE1234']
      };

      MFAService.getMFASettings = jest.fn().mockResolvedValue(mockMFASettings);

      const result = await MFAService.verifyBackupCode(mockUserId, 'CODE1234');

      expect(result).toBe(false);
    });

    it('should reject invalid backup code', async () => {
      const mockMFASettings = {
        backup_codes: ['CODE1234', 'CODE5678'],
        backup_codes_used: []
      };

      MFAService.getMFASettings = jest.fn().mockResolvedValue(mockMFASettings);

      const result = await MFAService.verifyBackupCode(mockUserId, 'INVALID');

      expect(result).toBe(false);
    });
  });

  describe('generateQRCodeDataUrl', () => {
    it('should generate QR code data URL successfully', async () => {
      const mockDataUrl = 'data:image/png;base64,mockdata';
      const mockUrl = 'otpauth://totp/test';

      qrcode.toDataURL = jest.fn().mockResolvedValue(mockDataUrl);

      const result = await MFAService.generateQRCodeDataUrl(mockUrl);

      expect(result).toBe(mockDataUrl);
      expect(qrcode.toDataURL).toHaveBeenCalledWith(mockUrl, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    });

    it('should handle QR code generation failure', async () => {
      qrcode.toDataURL = jest.fn().mockRejectedValue(new Error('QR generation failed'));

      await expect(MFAService.generateQRCodeDataUrl('test-url')).rejects.toThrow('Failed to generate QR code');
    });
  });

  describe('isMFAEnabled', () => {
    it('should return true when user has active MFA methods', async () => {
      MFAMethod.prototype.hasActiveMFA = jest.fn().mockResolvedValue(true);

      const result = await MFAService.isMFAEnabled(mockUserId);

      expect(result).toBe(true);
      expect(MFAMethod.prototype.hasActiveMFA).toHaveBeenCalledWith(mockUserId);
    });

    it('should fallback to MFA settings check', async () => {
      const mockMFASettings = { totp_enabled: true };

      MFAMethod.prototype.hasActiveMFA = jest.fn().mockResolvedValue(false);
      MFAService.getMFASettings = jest.fn().mockResolvedValue(mockMFASettings);

      const result = await MFAService.isMFAEnabled(mockUserId);

      expect(result).toBe(true);
    });

    it('should return false when no MFA is enabled', async () => {
      MFAMethod.prototype.hasActiveMFA = jest.fn().mockResolvedValue(false);
      MFAService.getMFASettings = jest.fn().mockResolvedValue(null);

      const result = await MFAService.isMFAEnabled(mockUserId);

      expect(result).toBe(false);
    });
  });

  describe('generateTOTPToken', () => {
    it('should generate valid TOTP token', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const time = Math.floor(Date.now() / 30000);

      const token = MFAService.generateTOTPToken(secret, time);

      expect(token).toHaveLength(6);
      expect(/^\d{6}$/.test(token)).toBe(true);
    });

    it('should generate consistent tokens for same time and secret', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const time = 12345;

      const token1 = MFAService.generateTOTPToken(secret, time);
      const token2 = MFAService.generateTOTPToken(secret, time);

      expect(token1).toBe(token2);
    });

    it('should generate different tokens for different times', () => {
      const secret = 'JBSWY3DPEHPK3PXP';

      const token1 = MFAService.generateTOTPToken(secret, 12345);
      const token2 = MFAService.generateTOTPToken(secret, 12346);

      expect(token1).not.toBe(token2);
    });
  });
});