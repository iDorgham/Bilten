const MFAMethod = require('../models/MFAMethod');
const { query } = require('../database/connection');

// Mock dependencies
jest.mock('../database/connection');
jest.mock('../database/BaseRepository');

describe('MFAMethod Model', () => {
  let mfaMethod;
  const mockUserId = 'user-123';
  const mockMethodId = 'method-456';

  beforeEach(() => {
    mfaMethod = new MFAMethod();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a TOTP MFA method successfully', async () => {
      const methodData = {
        user_id: mockUserId,
        type: 'totp',
        secret: 'JBSWY3DPEHPK3PXP',
        is_active: true
      };

      const mockCreatedMethod = {
        id: mockMethodId,
        ...methodData,
        created_at: new Date(),
        updated_at: new Date()
      };

      // Mock findByUserAndType to return null (no existing method)
      mfaMethod.findByUserAndType = jest.fn().mockResolvedValue(null);
      
      // Mock the parent create method
      const mockParentCreate = jest.fn().mockResolvedValue(mockCreatedMethod);
      Object.setPrototypeOf(mfaMethod, { create: mockParentCreate });

      // Mock cache methods
      mfaMethod.setCache = jest.fn().mockResolvedValue(true);

      const result = await mfaMethod.create(methodData);

      expect(result).toEqual(mockCreatedMethod);
      expect(mfaMethod.findByUserAndType).toHaveBeenCalledWith(mockUserId, 'totp');
      expect(mockParentCreate).toHaveBeenCalledWith({
        user_id: mockUserId,
        type: 'totp',
        secret: 'JBSWY3DPEHPK3PXP',
        phone_number: null,
        is_active: true
      });
    });

    it('should create an SMS MFA method successfully', async () => {
      const methodData = {
        user_id: mockUserId,
        type: 'sms',
        phone_number: '+1234567890',
        is_active: false
      };

      const mockCreatedMethod = {
        id: mockMethodId,
        ...methodData,
        secret: null,
        created_at: new Date(),
        updated_at: new Date()
      };

      mfaMethod.findByUserAndType = jest.fn().mockResolvedValue(null);
      const mockParentCreate = jest.fn().mockResolvedValue(mockCreatedMethod);
      Object.setPrototypeOf(mfaMethod, { create: mockParentCreate });
      mfaMethod.setCache = jest.fn().mockResolvedValue(true);

      const result = await mfaMethod.create(methodData);

      expect(result).toEqual(mockCreatedMethod);
      expect(mockParentCreate).toHaveBeenCalledWith({
        user_id: mockUserId,
        type: 'sms',
        secret: null,
        phone_number: '+1234567890',
        is_active: false
      });
    });

    it('should throw error if required fields are missing', async () => {
      const methodData = {
        type: 'totp'
        // missing user_id
      };

      await expect(mfaMethod.create(methodData)).rejects.toThrow('User ID and type are required');
    });

    it('should throw error for invalid MFA type', async () => {
      const methodData = {
        user_id: mockUserId,
        type: 'invalid_type'
      };

      await expect(mfaMethod.create(methodData)).rejects.toThrow('Invalid MFA type. Must be one of: totp, sms, email');
    });

    it('should throw error if TOTP method missing secret', async () => {
      const methodData = {
        user_id: mockUserId,
        type: 'totp'
        // missing secret
      };

      await expect(mfaMethod.create(methodData)).rejects.toThrow('Secret is required for TOTP method');
    });

    it('should throw error if SMS method missing phone number', async () => {
      const methodData = {
        user_id: mockUserId,
        type: 'sms'
        // missing phone_number
      };

      await expect(mfaMethod.create(methodData)).rejects.toThrow('Phone number is required for SMS method');
    });

    it('should throw error if method already exists', async () => {
      const methodData = {
        user_id: mockUserId,
        type: 'totp',
        secret: 'JBSWY3DPEHPK3PXP'
      };

      // Mock existing method
      mfaMethod.findByUserAndType = jest.fn().mockResolvedValue({ id: 'existing-method' });

      await expect(mfaMethod.create(methodData)).rejects.toThrow('TOTP method already exists for this user');
    });
  });

  describe('findByUserAndType', () => {
    it('should find MFA method by user and type', async () => {
      const mockMethod = {
        id: mockMethodId,
        user_id: mockUserId,
        type: 'totp',
        secret: 'JBSWY3DPEHPK3PXP',
        is_active: true
      };

      query.mockResolvedValue({ rows: [mockMethod] });
      mfaMethod.getFromCache = jest.fn().mockResolvedValue(null);
      mfaMethod.setCache = jest.fn().mockResolvedValue(true);

      const result = await mfaMethod.findByUserAndType(mockUserId, 'totp');

      expect(result).toEqual(mockMethod);
      expect(query).toHaveBeenCalledWith(
        'SELECT * FROM authentication.mfa_methods WHERE user_id = $1 AND type = $2',
        [mockUserId, 'totp']
      );
    });

    it('should return null if method not found', async () => {
      query.mockResolvedValue({ rows: [] });
      mfaMethod.getFromCache = jest.fn().mockResolvedValue(null);

      const result = await mfaMethod.findByUserAndType(mockUserId, 'totp');

      expect(result).toBeNull();
    });

    it('should return cached result if available', async () => {
      const mockMethod = { id: mockMethodId, type: 'totp' };
      mfaMethod.getFromCache = jest.fn().mockResolvedValue(mockMethod);

      const result = await mfaMethod.findByUserAndType(mockUserId, 'totp', true);

      expect(result).toEqual(mockMethod);
      expect(query).not.toHaveBeenCalled();
    });
  });

  describe('findByUser', () => {
    it('should find all active MFA methods for user', async () => {
      const mockMethods = [
        { id: 'method-1', user_id: mockUserId, type: 'totp', is_active: true },
        { id: 'method-2', user_id: mockUserId, type: 'sms', is_active: true }
      ];

      query.mockResolvedValue({ rows: mockMethods });
      mfaMethod.getFromCache = jest.fn().mockResolvedValue(null);
      mfaMethod.setCache = jest.fn().mockResolvedValue(true);

      const result = await mfaMethod.findByUser(mockUserId, true);

      expect(result).toEqual(mockMethods);
      expect(query).toHaveBeenCalledWith(
        'SELECT * FROM authentication.mfa_methods WHERE user_id = $1 AND is_active = true ORDER BY created_at ASC',
        [mockUserId]
      );
    });

    it('should find all MFA methods for user when activeOnly is false', async () => {
      const mockMethods = [
        { id: 'method-1', user_id: mockUserId, type: 'totp', is_active: true },
        { id: 'method-2', user_id: mockUserId, type: 'sms', is_active: false }
      ];

      query.mockResolvedValue({ rows: mockMethods });
      mfaMethod.getFromCache = jest.fn().mockResolvedValue(null);
      mfaMethod.setCache = jest.fn().mockResolvedValue(true);

      const result = await mfaMethod.findByUser(mockUserId, false);

      expect(result).toEqual(mockMethods);
      expect(query).toHaveBeenCalledWith(
        'SELECT * FROM authentication.mfa_methods WHERE user_id = $1 ORDER BY created_at ASC',
        [mockUserId]
      );
    });
  });

  describe('hasActiveMFA', () => {
    it('should return true if user has active MFA methods', async () => {
      query.mockResolvedValue({ rows: [{ count: '2' }] });

      const result = await mfaMethod.hasActiveMFA(mockUserId);

      expect(result).toBe(true);
      expect(query).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM authentication.mfa_methods WHERE user_id = $1 AND is_active = true',
        [mockUserId]
      );
    });

    it('should return false if user has no active MFA methods', async () => {
      query.mockResolvedValue({ rows: [{ count: '0' }] });

      const result = await mfaMethod.hasActiveMFA(mockUserId);

      expect(result).toBe(false);
    });
  });

  describe('getActiveMFATypes', () => {
    it('should return array of active MFA types', async () => {
      query.mockResolvedValue({ 
        rows: [
          { type: 'email' },
          { type: 'sms' },
          { type: 'totp' }
        ] 
      });

      const result = await mfaMethod.getActiveMFATypes(mockUserId);

      expect(result).toEqual(['email', 'sms', 'totp']);
      expect(query).toHaveBeenCalledWith(
        'SELECT DISTINCT type FROM authentication.mfa_methods WHERE user_id = $1 AND is_active = true ORDER BY type',
        [mockUserId]
      );
    });

    it('should return empty array if no active MFA methods', async () => {
      query.mockResolvedValue({ rows: [] });

      const result = await mfaMethod.getActiveMFATypes(mockUserId);

      expect(result).toEqual([]);
    });
  });

  describe('getUserMFAStats', () => {
    it('should return comprehensive MFA statistics', async () => {
      query.mockResolvedValue({
        rows: [
          {
            type: 'totp',
            count: '1',
            active_count: '1',
            first_created: '2024-01-01T00:00:00Z',
            last_updated: '2024-01-02T00:00:00Z'
          },
          {
            type: 'sms',
            count: '1',
            active_count: '0',
            first_created: '2024-01-03T00:00:00Z',
            last_updated: '2024-01-04T00:00:00Z'
          }
        ]
      });

      const result = await mfaMethod.getUserMFAStats(mockUserId);

      expect(result).toEqual({
        total_methods: 2,
        active_methods: 1,
        methods_by_type: {
          totp: {
            total: 1,
            active: 1,
            first_created: '2024-01-01T00:00:00Z',
            last_updated: '2024-01-02T00:00:00Z'
          },
          sms: {
            total: 1,
            active: 0,
            first_created: '2024-01-03T00:00:00Z',
            last_updated: '2024-01-04T00:00:00Z'
          }
        },
        has_totp: true,
        has_sms: false,
        has_email: false
      });
    });
  });

  describe('Static methods', () => {
    describe('generateTOTPSecret', () => {
      it('should generate a base32 encoded secret', () => {
        const secret = MFAMethod.generateTOTPSecret();
        
        expect(typeof secret).toBe('string');
        expect(secret.length).toBeGreaterThan(0);
        // Base32 characters
        expect(secret).toMatch(/^[A-Z2-7]+$/);
      });

      it('should generate different secrets on multiple calls', () => {
        const secret1 = MFAMethod.generateTOTPSecret();
        const secret2 = MFAMethod.generateTOTPSecret();
        
        expect(secret1).not.toBe(secret2);
      });
    });

    describe('validatePhoneNumber', () => {
      it('should validate correct E.164 phone numbers', () => {
        expect(MFAMethod.validatePhoneNumber('+1234567890')).toBe(true);
        expect(MFAMethod.validatePhoneNumber('+447911123456')).toBe(true);
        expect(MFAMethod.validatePhoneNumber('+33123456789')).toBe(true);
      });

      it('should reject invalid phone numbers', () => {
        expect(MFAMethod.validatePhoneNumber('1234567890')).toBe(false); // Missing +
        expect(MFAMethod.validatePhoneNumber('+0123456789')).toBe(false); // Starts with 0
        expect(MFAMethod.validatePhoneNumber('+123')).toBe(false); // Too short
        expect(MFAMethod.validatePhoneNumber('invalid')).toBe(false); // Not numeric
        expect(MFAMethod.validatePhoneNumber('')).toBe(false); // Empty
      });
    });
  });

  describe('activate and deactivate', () => {
    it('should activate MFA method', async () => {
      const mockUpdatedMethod = { id: mockMethodId, is_active: true };
      mfaMethod.update = jest.fn().mockResolvedValue(mockUpdatedMethod);

      const result = await mfaMethod.activate(mockMethodId);

      expect(result).toEqual(mockUpdatedMethod);
      expect(mfaMethod.update).toHaveBeenCalledWith(mockMethodId, { is_active: true });
    });

    it('should deactivate MFA method', async () => {
      const mockUpdatedMethod = { id: mockMethodId, is_active: false };
      mfaMethod.update = jest.fn().mockResolvedValue(mockUpdatedMethod);

      const result = await mfaMethod.deactivate(mockMethodId);

      expect(result).toEqual(mockUpdatedMethod);
      expect(mfaMethod.update).toHaveBeenCalledWith(mockMethodId, { is_active: false });
    });
  });
});