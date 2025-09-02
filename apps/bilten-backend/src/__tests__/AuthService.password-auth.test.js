const AuthService = require('../services/AuthService');
const UserAccount = require('../models/UserAccount');
const AuthSession = require('../models/AuthSession');
const TokenService = require('../services/TokenService');
const MFAService = require('../services/MFAService');
const bcrypt = require('bcryptjs');
const { query } = require('../database/connection');

// Mock dependencies
jest.mock('../models/UserAccount');
jest.mock('../models/AuthSession');
jest.mock('../services/TokenService');
jest.mock('../services/MFAService');
jest.mock('../database/connection');
jest.mock('bcryptjs');

describe('AuthService - Password-based Authentication', () => {
  let mockUserAccount;
  let mockAuthSession;
  let mockUser;
  let mockDeviceInfo;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock user data
    mockUser = {
      id: 1,
      email: 'test@example.com',
      password_hash: 'hashed_password',
      password_salt: 'salt',
      first_name: 'Test',
      last_name: 'User',
      email_verified: true,
      status: 'active',
      failed_login_attempts: 0,
      locked_until: null
    };

    // Mock device info
    mockDeviceInfo = {
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 Test Browser',
      deviceType: 'web',
      deviceName: 'Test Device',
      country: 'US',
      city: 'New York'
    };

    // Mock UserAccount instance
    mockUserAccount = {
      findByEmail: jest.fn(),
      isAccountLocked: jest.fn(),
      incrementFailedLogins: jest.fn(),
      resetFailedLogins: jest.fn(),
      updateLastLogin: jest.fn()
    };
    UserAccount.mockImplementation(() => mockUserAccount);

    // Mock AuthSession instance
    mockAuthSession = {
      create: jest.fn()
    };
    AuthSession.mockImplementation(() => mockAuthSession);

    // Mock TokenService
    TokenService.generateTokens.mockResolvedValue({
      accessToken: 'mock_access_token',
      refreshToken: 'mock_refresh_token',
      accessTokenJti: 'access_jti',
      refreshTokenJti: 'refresh_jti',
      accessExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
      refreshExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    // Mock MFAService
    MFAService.isMFAEnabled.mockResolvedValue(false);

    // Mock bcrypt
    bcrypt.compare.mockResolvedValue(true);

    // Mock query for logging
    query.mockResolvedValue({ rows: [] });
  });

  describe('loginUser', () => {
    it('should successfully login user with valid credentials', async () => {
      // Setup mocks
      mockUserAccount.findByEmail.mockResolvedValue(mockUser);
      mockUserAccount.isAccountLocked.mockResolvedValue(false);
      mockAuthSession.create.mockResolvedValue({ id: 'session_123' });

      const result = await AuthService.loginUser('test@example.com', 'password123', mockDeviceInfo);

      expect(result).toEqual({
        user: expect.objectContaining({
          id: 1,
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User'
        }),
        accessToken: 'mock_access_token',
        refreshToken: 'mock_refresh_token',
        sessionId: 'session_123',
        expiresAt: expect.any(Date),
        message: 'Login successful'
      });

      // Verify user lookup
      expect(mockUserAccount.findByEmail).toHaveBeenCalledWith('test@example.com', false);
      
      // Verify account lock check
      expect(mockUserAccount.isAccountLocked).toHaveBeenCalledWith(1);
      
      // Verify password comparison
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed_password');
      
      // Verify failed login attempts reset
      expect(mockUserAccount.resetFailedLogins).toHaveBeenCalledWith(1);
      
      // Verify token generation
      expect(TokenService.generateTokens).toHaveBeenCalledWith(mockUser, null, mockDeviceInfo);
      
      // Verify session creation
      expect(mockAuthSession.create).toHaveBeenCalledWith(expect.objectContaining({
        user_id: 1,
        session_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token',
        device_type: 'web',
        ip_address: '192.168.1.1',
        is_mfa_verified: false
      }));
      
      // Verify last login update
      expect(mockUserAccount.updateLastLogin).toHaveBeenCalledWith(1, '192.168.1.1');
    });

    it('should throw error for non-existent user', async () => {
      mockUserAccount.findByEmail.mockResolvedValue(null);

      await expect(
        AuthService.loginUser('nonexistent@example.com', 'password123', mockDeviceInfo)
      ).rejects.toThrow('Invalid email or password');

      expect(mockUserAccount.findByEmail).toHaveBeenCalledWith('nonexistent@example.com', false);
    });

    it('should throw error for locked account', async () => {
      mockUserAccount.findByEmail.mockResolvedValue(mockUser);
      mockUserAccount.isAccountLocked.mockResolvedValue(true);

      await expect(
        AuthService.loginUser('test@example.com', 'password123', mockDeviceInfo)
      ).rejects.toThrow('Account is temporarily locked due to multiple failed login attempts');

      expect(mockUserAccount.isAccountLocked).toHaveBeenCalledWith(1);
    });

    it('should throw error for unverified email', async () => {
      const unverifiedUser = { ...mockUser, email_verified: false };
      mockUserAccount.findByEmail.mockResolvedValue(unverifiedUser);
      mockUserAccount.isAccountLocked.mockResolvedValue(false);

      await expect(
        AuthService.loginUser('test@example.com', 'password123', mockDeviceInfo)
      ).rejects.toThrow('Please verify your email address before logging in');
    });

    it('should throw error for inactive account', async () => {
      const inactiveUser = { ...mockUser, status: 'suspended' };
      mockUserAccount.findByEmail.mockResolvedValue(inactiveUser);
      mockUserAccount.isAccountLocked.mockResolvedValue(false);

      await expect(
        AuthService.loginUser('test@example.com', 'password123', mockDeviceInfo)
      ).rejects.toThrow('Account is not active');
    });

    it('should increment failed attempts and throw error for invalid password', async () => {
      mockUserAccount.findByEmail.mockResolvedValue(mockUser);
      mockUserAccount.isAccountLocked.mockResolvedValue(false);
      bcrypt.compare.mockResolvedValue(false);

      await expect(
        AuthService.loginUser('test@example.com', 'wrongpassword', mockDeviceInfo)
      ).rejects.toThrow('Invalid email or password');

      expect(mockUserAccount.incrementFailedLogins).toHaveBeenCalledWith(1);
      expect(mockUserAccount.resetFailedLogins).not.toHaveBeenCalled();
    });

    it('should return MFA challenge when MFA is enabled', async () => {
      mockUserAccount.findByEmail.mockResolvedValue(mockUser);
      mockUserAccount.isAccountLocked.mockResolvedValue(false);
      MFAService.isMFAEnabled.mockResolvedValue(true);

      const result = await AuthService.loginUser('test@example.com', 'password123', mockDeviceInfo);

      expect(result).toEqual({
        requiresMFA: true,
        userId: 1,
        message: 'MFA verification required'
      });

      expect(mockUserAccount.resetFailedLogins).toHaveBeenCalledWith(1);
      expect(TokenService.generateTokens).not.toHaveBeenCalled();
      expect(mockAuthSession.create).not.toHaveBeenCalled();
    });

    it('should calculate risk score based on device info', async () => {
      const riskyDeviceInfo = {
        ...mockDeviceInfo,
        isNewDevice: true,
        isNewLocation: true
      };

      mockUserAccount.findByEmail.mockResolvedValue(mockUser);
      mockUserAccount.isAccountLocked.mockResolvedValue(false);
      mockAuthSession.create.mockResolvedValue({ id: 'session_123' });

      await AuthService.loginUser('test@example.com', 'password123', riskyDeviceInfo);

      expect(mockAuthSession.create).toHaveBeenCalledWith(expect.objectContaining({
        risk_score: expect.any(Number)
      }));
    });
  });

  describe('completeLoginWithMFA', () => {
    beforeEach(() => {
      mockUserAccount.findById = jest.fn().mockResolvedValue(mockUser);
    });

    it('should complete login after MFA verification', async () => {
      mockAuthSession.create.mockResolvedValue({ id: 'session_456' });

      const result = await AuthService.completeLoginWithMFA(1, mockDeviceInfo);

      expect(result).toEqual({
        user: expect.objectContaining({
          id: 1,
          email: 'test@example.com'
        }),
        accessToken: 'mock_access_token',
        refreshToken: 'mock_refresh_token',
        sessionId: 'session_456',
        expiresAt: expect.any(Date),
        message: 'Login successful'
      });

      expect(mockAuthSession.create).toHaveBeenCalledWith(expect.objectContaining({
        user_id: 1,
        is_mfa_verified: true,
        metadata: expect.objectContaining({
          login_method: 'password_mfa'
        })
      }));
    });

    it('should throw error for non-existent user', async () => {
      mockUserAccount.findById.mockResolvedValue(null);

      await expect(
        AuthService.completeLoginWithMFA(999, mockDeviceInfo)
      ).rejects.toThrow('User not found');
    });
  });

  describe('calculateRiskScore', () => {
    it('should calculate risk score for new device and location', () => {
      const riskyDeviceInfo = {
        isNewDevice: true,
        isNewLocation: true
      };

      const riskScore = AuthService.calculateRiskScore(riskyDeviceInfo, mockUser);
      expect(riskScore).toBe(50); // 20 (new device) + 30 (new location)
    });

    it('should add risk for unusual access time', () => {
      // Mock Date constructor to return object with getHours method
      const originalDate = global.Date;
      global.Date = class extends Date {
        constructor() {
          super();
        }
        getHours() {
          return 3; // 3 AM (unusual hour)
        }
        static now() {
          return originalDate.now();
        }
      };

      // Provide deviceId and country to avoid default risk
      const deviceInfo = { deviceId: 'test', country: 'US' };
      const riskScore = AuthService.calculateRiskScore(deviceInfo, mockUser);
      expect(riskScore).toBe(10); // 10 for unusual hour

      global.Date = originalDate;
    });

    it('should add risk for failed login attempts', () => {
      const userWithFailedAttempts = { ...mockUser, failed_login_attempts: 3 };
      
      // Provide deviceId and country to avoid default risk
      const deviceInfo = { deviceId: 'test', country: 'US' };
      const riskScore = AuthService.calculateRiskScore(deviceInfo, userWithFailedAttempts);
      expect(riskScore).toBe(15); // 3 * 5 for failed attempts
    });

    it('should cap risk score at 100', () => {
      const veryRiskyDeviceInfo = {
        isNewDevice: true,
        isNewLocation: true
      };
      const userWithManyFailedAttempts = { ...mockUser, failed_login_attempts: 20 };

      // Mock unusual hour
      const originalDate = global.Date;
      global.Date = class extends Date {
        constructor() {
          super();
        }
        getHours() {
          return 3; // 3 AM (unusual hour)
        }
        static now() {
          return originalDate.now();
        }
      };

      const riskScore = AuthService.calculateRiskScore(veryRiskyDeviceInfo, userWithManyFailedAttempts);
      expect(riskScore).toBe(100); // Should be capped at 100

      global.Date = originalDate;
    });
  });

  describe('Session Management', () => {
    it('should create session with proper metadata', async () => {
      mockUserAccount.findByEmail.mockResolvedValue(mockUser);
      mockUserAccount.isAccountLocked.mockResolvedValue(false);
      mockAuthSession.create.mockResolvedValue({ id: 'session_123' });

      await AuthService.loginUser('test@example.com', 'password123', mockDeviceInfo);

      expect(mockAuthSession.create).toHaveBeenCalledWith(expect.objectContaining({
        user_id: 1,
        session_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token',
        token_type: 'Bearer',
        expires_at: expect.any(Date),
        refresh_expires_at: expect.any(Date),
        device_id: expect.any(String),
        device_name: 'Test Device',
        device_type: 'web',
        user_agent: 'Mozilla/5.0 Test Browser',
        ip_address: '192.168.1.1',
        country: 'US',
        city: 'New York',
        scopes: ['read', 'write'],
        is_mfa_verified: false,
        risk_score: expect.any(Number),
        metadata: expect.objectContaining({
          login_method: 'password',
          device_fingerprint: undefined
        })
      }));
    });

    it('should generate unique device ID if not provided', async () => {
      const deviceInfoWithoutId = { ...mockDeviceInfo };
      delete deviceInfoWithoutId.deviceId;

      mockUserAccount.findByEmail.mockResolvedValue(mockUser);
      mockUserAccount.isAccountLocked.mockResolvedValue(false);
      mockAuthSession.create.mockResolvedValue({ id: 'session_123' });

      await AuthService.loginUser('test@example.com', 'password123', deviceInfoWithoutId);

      expect(mockAuthSession.create).toHaveBeenCalledWith(expect.objectContaining({
        device_id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
      }));
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockUserAccount.findByEmail.mockRejectedValue(new Error('Database connection failed'));

      await expect(
        AuthService.loginUser('test@example.com', 'password123', mockDeviceInfo)
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle token generation errors', async () => {
      mockUserAccount.findByEmail.mockResolvedValue(mockUser);
      mockUserAccount.isAccountLocked.mockResolvedValue(false);
      TokenService.generateTokens.mockRejectedValue(new Error('Token generation failed'));

      await expect(
        AuthService.loginUser('test@example.com', 'password123', mockDeviceInfo)
      ).rejects.toThrow('Token generation failed');
    });

    it('should handle session creation errors', async () => {
      mockUserAccount.findByEmail.mockResolvedValue(mockUser);
      mockUserAccount.isAccountLocked.mockResolvedValue(false);
      mockAuthSession.create.mockRejectedValue(new Error('Session creation failed'));

      await expect(
        AuthService.loginUser('test@example.com', 'password123', mockDeviceInfo)
      ).rejects.toThrow('Session creation failed');
    });
  });
});