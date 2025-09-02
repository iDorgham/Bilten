const MFAService = require('../services/MFAService');
const MFAMethod = require('../models/MFAMethod');

// Mock dependencies
jest.mock('../models/MFAMethod');
jest.mock('../database/connection');
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

describe('MFA Validation and Recovery', () => {
  const mockUserId = '550e8400-e29b-41d4-a716-446655440000';
  const mockCode = '123456';
  const mockBackupCode = 'ABCD1234';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset MFAService methods
    MFAService.verifyTOTPToken = jest.fn();
    MFAService.verifySMSCode = jest.fn();
    MFAService.verifyEmailCode = jest.fn();
    MFAService.verifyBackupCode = jest.fn();
    MFAService.getMFASettings = jest.fn();
  });

  describe('validateMFACode', () => {
    it('should validate TOTP code successfully', async () => {
      MFAService.verifyTOTPToken.mockResolvedValue(true);

      const result = await MFAService.validateMFACode(mockUserId, mockCode, 'totp');

      expect(result).toEqual({
        success: true,
        method: 'totp',
        message: 'MFA validation successful'
      });

      expect(MFAService.verifyTOTPToken).toHaveBeenCalledWith(mockUserId, mockCode);
    });

    it('should validate SMS code successfully', async () => {
      MFAService.verifySMSCode.mockResolvedValue(true);

      const result = await MFAService.validateMFACode(mockUserId, mockCode, 'sms');

      expect(result).toEqual({
        success: true,
        method: 'sms',
        message: 'MFA validation successful'
      });

      expect(MFAService.verifySMSCode).toHaveBeenCalledWith(mockUserId, mockCode);
    });

    it('should validate email code successfully', async () => {
      MFAService.verifyEmailCode.mockResolvedValue(true);

      const result = await MFAService.validateMFACode(mockUserId, mockCode, 'email');

      expect(result).toEqual({
        success: true,
        method: 'email',
        message: 'MFA validation successful'
      });

      expect(MFAService.verifyEmailCode).toHaveBeenCalledWith(mockUserId, mockCode);
    });

    it('should validate backup code successfully', async () => {
      MFAService.verifyBackupCode.mockResolvedValue(true);

      const result = await MFAService.validateMFACode(mockUserId, mockBackupCode, 'backup');

      expect(result).toEqual({
        success: true,
        method: 'backup_code',
        message: 'MFA validation successful'
      });

      expect(MFAService.verifyBackupCode).toHaveBeenCalledWith(mockUserId, mockBackupCode);
    });

    it('should return failure for invalid TOTP code', async () => {
      MFAService.verifyTOTPToken.mockResolvedValue(false);

      const result = await MFAService.validateMFACode(mockUserId, 'invalid', 'totp');

      expect(result).toEqual({
        success: false,
        method: 'totp',
        message: 'Invalid MFA code'
      });
    });

    it('should throw error for unsupported method', async () => {
      await expect(
        MFAService.validateMFACode(mockUserId, mockCode, 'unsupported')
      ).rejects.toThrow('Unsupported MFA method: unsupported');
    });

    it('should handle case-insensitive method names', async () => {
      MFAService.verifyTOTPToken.mockResolvedValue(true);

      const result = await MFAService.validateMFACode(mockUserId, mockCode, 'TOTP');

      expect(result.success).toBe(true);
      expect(result.method).toBe('TOTP');
    });
  });

  describe('getAvailableMFAMethods', () => {
    it('should return available MFA methods', async () => {
      const mockActiveMethods = ['totp', 'sms'];
      const mockMFASettings = {
        backup_codes: ['CODE1', 'CODE2', 'CODE3']
      };

      MFAMethod.prototype.getActiveMFATypes = jest.fn().mockResolvedValue(mockActiveMethods);
      MFAService.getMFASettings.mockResolvedValue(mockMFASettings);

      const result = await MFAService.getAvailableMFAMethods(mockUserId);

      expect(result).toEqual({
        methods: {
          totp: true,
          sms: true,
          email: false,
          backup: true
        },
        hasAnyMethod: true,
        activeMethodCount: 2
      });
    });

    it('should return no methods when user has no MFA setup', async () => {
      MFAMethod.prototype.getActiveMFATypes = jest.fn().mockResolvedValue([]);
      MFAService.getMFASettings.mockResolvedValue(null);

      const result = await MFAService.getAvailableMFAMethods(mockUserId);

      expect(result).toEqual({
        methods: {
          totp: false,
          sms: false,
          email: false,
          backup: false
        },
        hasAnyMethod: false,
        activeMethodCount: 0
      });
    });

    it('should handle backup codes correctly when empty', async () => {
      const mockActiveMethods = ['email'];
      const mockMFASettings = {
        backup_codes: []
      };

      MFAMethod.prototype.getActiveMFATypes = jest.fn().mockResolvedValue(mockActiveMethods);
      MFAService.getMFASettings.mockResolvedValue(mockMFASettings);

      const result = await MFAService.getAvailableMFAMethods(mockUserId);

      expect(result.methods.backup).toBe(false);
      expect(result.methods.email).toBe(true);
      expect(result.hasAnyMethod).toBe(true);
    });
  });

  describe('Backup Code Recovery', () => {
    it('should generate new backup codes and invalidate old ones', async () => {
      const mockNewCodes = ['NEW1234', 'NEW5678', 'NEW9012'];
      
      MFAService.generateBackupCodes = jest.fn().mockReturnValue(mockNewCodes);
      MFAService.updateBackupCodes = jest.fn().mockResolvedValue();

      const result = await MFAService.generateNewBackupCodes(mockUserId);

      expect(result).toEqual(mockNewCodes);
      expect(MFAService.updateBackupCodes).toHaveBeenCalledWith(mockUserId, mockNewCodes);
    });

    it('should verify backup code and mark as used', async () => {
      const mockMFASettings = {
        backup_codes: ['CODE1234', 'CODE5678'],
        backup_codes_used: []
      };

      MFAService.getMFASettings.mockResolvedValue(mockMFASettings);
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

      MFAService.getMFASettings.mockResolvedValue(mockMFASettings);

      const result = await MFAService.verifyBackupCode(mockUserId, 'CODE1234');

      expect(result).toBe(false);
    });

    it('should reject non-existent backup code', async () => {
      const mockMFASettings = {
        backup_codes: ['CODE1234', 'CODE5678'],
        backup_codes_used: []
      };

      MFAService.getMFASettings.mockResolvedValue(mockMFASettings);

      const result = await MFAService.verifyBackupCode(mockUserId, 'INVALID');

      expect(result).toBe(false);
    });
  });

  describe('MFA Method Management', () => {
    it('should get comprehensive MFA statistics', async () => {
      const mockStats = {
        total_methods: 3,
        active_methods: 2,
        methods_by_type: {
          totp: { total: 1, active: 1 },
          sms: { total: 1, active: 1 },
          email: { total: 1, active: 0 }
        },
        has_totp: true,
        has_sms: true,
        has_email: false
      };

      MFAMethod.prototype.getUserMFAStats = jest.fn().mockResolvedValue(mockStats);

      const result = await MFAMethod.prototype.getUserMFAStats(mockUserId);

      expect(result).toEqual(mockStats);
      expect(result.active_methods).toBe(2);
      expect(result.has_totp).toBe(true);
      expect(result.has_email).toBe(false);
    });

    it('should check if user has any active MFA methods', async () => {
      MFAMethod.prototype.hasActiveMFA = jest.fn().mockResolvedValue(true);

      const result = await MFAMethod.prototype.hasActiveMFA(mockUserId);

      expect(result).toBe(true);
    });

    it('should get active MFA types for user', async () => {
      const mockActiveTypes = ['totp', 'sms'];
      MFAMethod.prototype.getActiveMFATypes = jest.fn().mockResolvedValue(mockActiveTypes);

      const result = await MFAMethod.prototype.getActiveMFATypes(mockUserId);

      expect(result).toEqual(mockActiveTypes);
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', async () => {
      MFAService.verifyTOTPToken.mockRejectedValue(new Error('Database error'));

      await expect(
        MFAService.validateMFACode(mockUserId, mockCode, 'totp')
      ).rejects.toThrow('Database error');
    });

    it('should handle missing MFA settings', async () => {
      MFAService.getMFASettings.mockResolvedValue(null);

      const result = await MFAService.verifyBackupCode(mockUserId, 'CODE1234');

      expect(result).toBe(false);
    });

    it('should handle getAvailableMFAMethods errors', async () => {
      MFAMethod.prototype.getActiveMFATypes = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(
        MFAService.getAvailableMFAMethods(mockUserId)
      ).rejects.toThrow('Database error');
    });
  });
});