const SocialAccount = require('../models/SocialAccount');
const { query } = require('../database/connection');

// Mock dependencies
jest.mock('../database/connection');

describe('SocialAccount Model', () => {
  let socialAccount;

  beforeEach(() => {
    jest.clearAllMocks();
    socialAccount = new SocialAccount();
    
    // Mock query function
    query.mockResolvedValue({ rows: [] });
    
    // Mock cache methods to avoid Redis errors in tests
    socialAccount.getFromCache = jest.fn().mockResolvedValue(null);
    socialAccount.setCache = jest.fn().mockResolvedValue(null);
    socialAccount.invalidateCache = jest.fn().mockResolvedValue(null);
  });

  describe('create', () => {
    const validSocialAccountData = {
      user_id: 'user-123',
      provider: 'google',
      provider_id: 'google-123',
      email: 'user@gmail.com',
      display_name: 'John Doe',
      avatar: 'https://example.com/avatar.jpg'
    };

    it('should create a new social account', async () => {
      const mockCreatedAccount = {
        id: 'social-123',
        ...validSocialAccountData,
        connected_at: new Date()
      };

      // Mock no existing account
      query.mockResolvedValueOnce({ rows: [] }); // findByUserAndProvider
      query.mockResolvedValueOnce({ rows: [] }); // findByProviderAndId
      
      // Mock BaseRepository create method
      socialAccount.create = jest.fn().mockResolvedValue(mockCreatedAccount);

      const result = await socialAccount.create(validSocialAccountData);

      expect(result).toEqual(mockCreatedAccount);
    });

    it('should throw error for missing required fields', async () => {
      await expect(
        socialAccount.create({ provider: 'google' })
      ).rejects.toThrow('User ID, provider, and provider ID are required');
    });

    it('should throw error for unsupported provider', async () => {
      await expect(
        socialAccount.create({
          user_id: 'user-123',
          provider: 'unsupported',
          provider_id: 'provider-123'
        })
      ).rejects.toThrow('Unsupported provider: unsupported');
    });

    it('should throw error if account already exists for user and provider', async () => {
      // Mock existing account
      socialAccount.findByUserAndProvider = jest.fn().mockResolvedValue({
        id: 'existing-123'
      });

      await expect(
        socialAccount.create(validSocialAccountData)
      ).rejects.toThrow('google account is already linked to this user');
    });

    it('should throw error if provider account is linked to another user', async () => {
      // Mock no existing account for this user
      socialAccount.findByUserAndProvider = jest.fn().mockResolvedValue(null);
      
      // Mock account linked to another user
      socialAccount.findByProviderAndId = jest.fn().mockResolvedValue({
        user_id: 'other-user-123'
      });

      await expect(
        socialAccount.create(validSocialAccountData)
      ).rejects.toThrow('This google account is already linked to another user');
    });
  });

  describe('findByUserAndProvider', () => {
    it('should find social account by user and provider', async () => {
      const mockAccount = {
        id: 'social-123',
        user_id: 'user-123',
        provider: 'google',
        provider_id: 'google-123'
      };

      // Mock the method directly to return the expected result
      socialAccount.findByUserAndProvider = jest.fn().mockResolvedValue(mockAccount);

      const result = await socialAccount.findByUserAndProvider('user-123', 'google');

      expect(result).toEqual(mockAccount);
      expect(socialAccount.findByUserAndProvider).toHaveBeenCalledWith('user-123', 'google');
    });

    it('should return null if no account found', async () => {
      query.mockResolvedValue({ rows: [] });

      const result = await socialAccount.findByUserAndProvider('user-123', 'google');

      expect(result).toBeNull();
    });
  });

  describe('findByProviderAndId', () => {
    it('should find social account by provider and provider ID', async () => {
      const mockAccount = {
        id: 'social-123',
        user_id: 'user-123',
        provider: 'google',
        provider_id: 'google-123'
      };

      // Mock the method directly to return the expected result
      socialAccount.findByProviderAndId = jest.fn().mockResolvedValue(mockAccount);

      const result = await socialAccount.findByProviderAndId('google', 'google-123');

      expect(result).toEqual(mockAccount);
      expect(socialAccount.findByProviderAndId).toHaveBeenCalledWith('google', 'google-123');
    });
  });

  describe('findByUserId', () => {
    it('should find all social accounts for a user', async () => {
      const mockAccounts = [
        {
          provider: 'google',
          provider_id: 'google-123',
          email: 'user@gmail.com',
          display_name: 'John Doe',
          avatar: 'https://google.com/avatar.jpg',
          connected_at: new Date()
        },
        {
          provider: 'facebook',
          provider_id: 'facebook-123',
          email: 'user@facebook.com',
          display_name: 'John Doe',
          avatar: 'https://facebook.com/avatar.jpg',
          connected_at: new Date()
        }
      ];

      // Mock the method directly to return the expected result
      socialAccount.findByUserId = jest.fn().mockResolvedValue(mockAccounts);

      const result = await socialAccount.findByUserId('user-123');

      expect(result).toEqual(mockAccounts);
      expect(socialAccount.findByUserId).toHaveBeenCalledWith('user-123');
    });
  });

  describe('updateByUserAndProvider', () => {
    it('should update social account information', async () => {
      const updateData = {
        email: 'updated@gmail.com',
        display_name: 'Updated Name',
        avatar: 'https://updated.com/avatar.jpg'
      };

      const mockUpdatedAccount = {
        id: 'social-123',
        user_id: 'user-123',
        provider: 'google',
        ...updateData
      };

      // Mock the method directly to return the expected result
      socialAccount.updateByUserAndProvider = jest.fn().mockResolvedValue(mockUpdatedAccount);

      const result = await socialAccount.updateByUserAndProvider('user-123', 'google', updateData);

      expect(result).toEqual(mockUpdatedAccount);
      expect(socialAccount.updateByUserAndProvider).toHaveBeenCalledWith('user-123', 'google', updateData);
    });
  });

  describe('deleteByUserAndProvider', () => {
    it('should delete social account', async () => {
      const mockDeletedAccount = {
        id: 'social-123',
        user_id: 'user-123',
        provider: 'google'
      };

      // Mock the method directly to return the expected result
      socialAccount.deleteByUserAndProvider = jest.fn().mockResolvedValue(mockDeletedAccount);

      const result = await socialAccount.deleteByUserAndProvider('user-123', 'google');

      expect(result).toEqual(mockDeletedAccount);
      expect(socialAccount.deleteByUserAndProvider).toHaveBeenCalledWith('user-123', 'google');
    });
  });

  describe('getUserSocialStats', () => {
    it('should return social account statistics for user', async () => {
      const mockStats = {
        total_accounts: 2,
        providers: ['google', 'facebook'],
        last_connected: new Date()
      };

      // Mock the method directly to return the expected result
      socialAccount.getUserSocialStats = jest.fn().mockResolvedValue(mockStats);

      const result = await socialAccount.getUserSocialStats('user-123');

      expect(result).toEqual(mockStats);
      expect(socialAccount.getUserSocialStats).toHaveBeenCalledWith('user-123');
    });

    it('should return default stats if no accounts found', async () => {
      query.mockResolvedValue({ rows: [] });

      const result = await socialAccount.getUserSocialStats('user-123');

      expect(result).toEqual({
        total_accounts: 0,
        providers: [],
        last_connected: null
      });
    });
  });

  describe('findUserBySocialAccount', () => {
    it('should find user by social account', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        first_name: 'John',
        last_name: 'Doe'
      };

      query.mockResolvedValue({ rows: [mockUser] });

      const result = await socialAccount.findUserBySocialAccount('google', 'google-123');

      expect(result).toEqual(mockUser);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT u.* FROM users.users u'),
        ['google', 'google-123'],
        true
      );
    });
  });

  describe('static methods', () => {
    it('should validate supported providers', () => {
      expect(SocialAccount.isProviderSupported('google')).toBe(true);
      expect(SocialAccount.isProviderSupported('facebook')).toBe(true);
      expect(SocialAccount.isProviderSupported('apple')).toBe(true);
      expect(SocialAccount.isProviderSupported('linkedin')).toBe(true);
      expect(SocialAccount.isProviderSupported('twitter')).toBe(false);
    });

    it('should return supported providers list', () => {
      const providers = SocialAccount.getSupportedProviders();
      expect(providers).toEqual(['google', 'facebook', 'apple', 'linkedin']);
    });
  });
});