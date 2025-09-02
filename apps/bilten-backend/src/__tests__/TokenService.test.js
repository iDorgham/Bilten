const TokenService = require('../services/TokenService');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('../database/connection');

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('crypto');
jest.mock('../database/connection');

describe('TokenService', () => {
  let mockUser;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUser = {
      id: 1,
      email: 'test@example.com',
      role: 'user',
      email_verified: true,
      status: 'active'
    };

    // Mock crypto.randomUUID
    crypto.randomUUID.mockReturnValue('mock-uuid-123');

    // Mock jwt.sign
    jwt.sign.mockImplementation((payload, secret, options) => {
      if (payload.type === 'access') {
        return 'mock_access_token';
      } else if (payload.type === 'refresh') {
        return 'mock_refresh_token';
      }
      return 'mock_token';
    });

    // Mock jwt.verify
    jwt.verify.mockReturnValue({
      userId: 1,
      type: 'refresh',
      jti: 'refresh_jti',
      exp: Math.floor(Date.now() / 1000) + 3600
    });

    // Mock jwt.decode
    jwt.decode.mockReturnValue({
      jti: 'mock_jti',
      exp: Math.floor(Date.now() / 1000) + 3600
    });

    // Mock query
    query.mockResolvedValue({ rows: [] });
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', async () => {
      const result = await TokenService.generateTokens(mockUser);

      expect(result).toEqual({
        accessToken: 'mock_access_token',
        refreshToken: 'mock_refresh_token',
        accessTokenJti: 'mock-uuid-123',
        refreshTokenJti: 'mock-uuid-123',
        accessExpiresAt: expect.any(Date),
        refreshExpiresAt: expect.any(Date)
      });

      // Verify JWT signing calls
      expect(jwt.sign).toHaveBeenCalledTimes(2);
      
      // Check access token payload
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          email: 'test@example.com',
          role: 'user',
          isVerified: true,
          type: 'access',
          jti: 'mock-uuid-123'
        }),
        expect.any(String),
        expect.objectContaining({
          expiresIn: '15m',
          issuer: 'bilten-api',
          audience: 'bilten-client'
        })
      );

      // Check refresh token payload
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          type: 'refresh',
          jti: 'mock-uuid-123'
        }),
        expect.any(String),
        expect.objectContaining({
          expiresIn: '30d',
          issuer: 'bilten-api',
          audience: 'bilten-client'
        })
      );
    });

    it('should include sessionId when provided', async () => {
      await TokenService.generateTokens(mockUser, 'session_123');

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'session_123'
        }),
        expect.any(String),
        expect.any(Object)
      );
    });

    it('should generate unique JTIs for each token', async () => {
      crypto.randomUUID
        .mockReturnValueOnce('access_jti')
        .mockReturnValueOnce('refresh_jti');

      const result = await TokenService.generateTokens(mockUser);

      expect(result.accessTokenJti).toBe('access_jti');
      expect(result.refreshTokenJti).toBe('refresh_jti');
    });
  });

  describe('validateToken', () => {
    it('should validate access token successfully', async () => {
      const mockDecoded = {
        userId: 1,
        type: 'access',
        jti: 'access_jti',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000)
      };

      jwt.verify.mockReturnValue(mockDecoded);
      query.mockResolvedValue({ rows: [{ is_blacklisted: false }] });

      const result = await TokenService.validateToken('mock_access_token', 'access');

      expect(result).toEqual(mockDecoded);
      expect(jwt.verify).toHaveBeenCalledWith(
        'mock_access_token',
        expect.any(String),
        expect.objectContaining({
          issuer: 'bilten-api',
          audience: 'bilten-client'
        })
      );
    });

    it('should throw error for wrong token type', async () => {
      jwt.verify.mockReturnValue({
        type: 'refresh',
        jti: 'jti'
      });

      await expect(
        TokenService.validateToken('mock_token', 'access')
      ).rejects.toThrow('Invalid token type. Expected access, got refresh');
    });

    it('should throw error for blacklisted token', async () => {
      jwt.verify.mockReturnValue({
        type: 'access',
        jti: 'blacklisted_jti'
      });
      query.mockResolvedValue({ rows: [{ is_blacklisted: true }] });

      await expect(
        TokenService.validateToken('mock_token', 'access')
      ).rejects.toThrow('Token has been revoked');
    });

    it('should throw error for expired token', async () => {
      jwt.verify.mockReturnValue({
        type: 'access',
        jti: 'jti',
        exp: Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
      });
      query.mockResolvedValue({ rows: [{ is_blacklisted: false }] });

      await expect(
        TokenService.validateToken('mock_token', 'access')
      ).rejects.toThrow('Token has expired');
    });

    it('should throw error for future token', async () => {
      jwt.verify.mockReturnValue({
        type: 'access',
        jti: 'jti',
        iat: Math.floor(Date.now() / 1000) + 120 // Issued 2 minutes in future
      });
      query.mockResolvedValue({ rows: [{ is_blacklisted: false }] });

      await expect(
        TokenService.validateToken('mock_token', 'access')
      ).rejects.toThrow('Token issued in the future');
    });

    it('should handle JWT verification errors', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await expect(
        TokenService.validateToken('invalid_token', 'access')
      ).rejects.toThrow('Invalid signature');
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token successfully', async () => {
      // Reset and setup fresh mocks
      query.mockReset();
      
      // Mock session query result - return session data for SELECT, empty for UPDATE
      let callCount = 0;
      query.mockImplementation((sql, params) => {
        callCount++;
        if (sql.includes('SELECT us.*, u.email')) {
          return Promise.resolve({
            rows: [{
              id: 'session_123',
              user_id: 1,
              email: 'test@example.com',
              role: 'user',
              email_verified: true,
              status: 'active'
            }]
          });
        } else if (sql.includes('UPDATE authentication.user_sessions')) {
          return Promise.resolve({ rows: [] });
        } else if (sql.includes('SELECT EXISTS')) {
          // For blacklist check
          return Promise.resolve({ rows: [{ is_blacklisted: false }] });
        }
        return Promise.resolve({ rows: [] });
      });

      const result = await TokenService.refreshAccessToken('mock_refresh_token');

      expect(result).toEqual({
        accessToken: 'mock_access_token',
        accessExpiresAt: expect.any(Date),
        sessionId: 'session_123',
        user: {
          id: 1,
          email: 'test@example.com',
          role: 'user',
          email_verified: true
        }
      });

      // Verify refresh token validation
      expect(jwt.verify).toHaveBeenCalledWith(
        'mock_refresh_token',
        expect.any(String),
        expect.objectContaining({
          issuer: 'bilten-api',
          audience: 'bilten-client'
        })
      );

      // Verify session lookup
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT us.*, u.email'),
        ['mock_refresh_token']
      );

      // Verify session update
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE authentication.user_sessions'),
        expect.arrayContaining(['mock_access_token'])
      );
    });

    it('should throw error for invalid refresh token', async () => {
      query.mockReset();
      query.mockResolvedValue({ rows: [] }); // No session found

      await expect(
        TokenService.refreshAccessToken('invalid_refresh_token')
      ).rejects.toThrow('Invalid or expired refresh token');
    });

    it('should throw error for inactive user', async () => {
      query.mockReset();
      query.mockResolvedValue({
        rows: [{
          id: 'session_123',
          user_id: 1,
          email: 'test@example.com',
          role: 'user',
          email_verified: false, // Not verified
          status: 'active'
        }]
      });

      await expect(
        TokenService.refreshAccessToken('mock_refresh_token')
      ).rejects.toThrow('User account is not active');
    });

    it('should invalidate session for suspended user', async () => {
      query.mockReset();
      query.mockResolvedValue({
        rows: [{
          id: 'session_123',
          user_id: 1,
          email: 'test@example.com',
          role: 'user',
          email_verified: true,
          status: 'suspended' // Suspended account
        }]
      });

      await expect(
        TokenService.refreshAccessToken('mock_refresh_token')
      ).rejects.toThrow('User account is not active');
    });
  });

  describe('blacklistToken', () => {
    it('should blacklist token successfully', async () => {
      const expiresAt = new Date();
      
      await TokenService.blacklistToken('test_jti', expiresAt, 'logout');

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO authentication.blacklisted_tokens'),
        ['test_jti', expiresAt, 'logout']
      );
    });

    it('should handle duplicate blacklist entries', async () => {
      query.mockResolvedValue({ rows: [] }); // ON CONFLICT DO NOTHING

      const expiresAt = new Date();
      await expect(
        TokenService.blacklistToken('test_jti', expiresAt, 'logout')
      ).resolves.not.toThrow();
    });
  });

  describe('isTokenBlacklisted', () => {
    it('should return true for blacklisted token', async () => {
      query.mockResolvedValue({ rows: [{ is_blacklisted: true }] });

      const result = await TokenService.isTokenBlacklisted('blacklisted_jti');

      expect(result).toBe(true);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT EXISTS'),
        ['blacklisted_jti']
      );
    });

    it('should return false for non-blacklisted token', async () => {
      query.mockResolvedValue({ rows: [{ is_blacklisted: false }] });

      const result = await TokenService.isTokenBlacklisted('valid_jti');

      expect(result).toBe(false);
    });

    it('should return false on database error', async () => {
      query.mockRejectedValue(new Error('Database error'));

      const result = await TokenService.isTokenBlacklisted('test_jti');

      expect(result).toBe(false); // Should not block valid tokens on error
    });
  });

  describe('blacklistSessionTokens', () => {
    it('should blacklist both access and refresh tokens', async () => {
      jwt.decode
        .mockReturnValueOnce({ jti: 'access_jti', exp: 1234567890 })
        .mockReturnValueOnce({ jti: 'refresh_jti', exp: 1234567890 });

      await TokenService.blacklistSessionTokens('access_token', 'refresh_token', 'logout');

      expect(jwt.decode).toHaveBeenCalledTimes(2);
      expect(query).toHaveBeenCalledTimes(2);
    });

    it('should handle token decode errors gracefully', async () => {
      jwt.decode.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(
        TokenService.blacklistSessionTokens('invalid_token', 'invalid_token', 'logout')
      ).resolves.not.toThrow();
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should clean up expired blacklisted tokens', async () => {
      query.mockResolvedValue({ rows: [{ jti: 'expired1' }, { jti: 'expired2' }] });

      const result = await TokenService.cleanupExpiredTokens();

      expect(result).toBe(2);
      expect(query).toHaveBeenCalledWith(
        'DELETE FROM authentication.blacklisted_tokens WHERE expires_at < NOW() RETURNING jti'
      );
    });
  });

  describe('getTokenStatistics', () => {
    it('should return token statistics', async () => {
      const mockStats = {
        total_blacklisted: 100,
        active_blacklisted: 80,
        expired_blacklisted: 20,
        unique_reasons: 5
      };

      query.mockResolvedValue({ rows: [mockStats] });

      const result = await TokenService.getTokenStatistics();

      expect(result).toEqual(mockStats);
    });
  });

  describe('Utility Methods', () => {
    it('should decode token without verification', () => {
      const mockDecoded = { userId: 1, type: 'access' };
      jwt.decode.mockReturnValue(mockDecoded);

      const result = TokenService.decodeToken('mock_token');

      expect(result).toEqual(mockDecoded);
      expect(jwt.decode).toHaveBeenCalledWith('mock_token', { complete: true });
    });

    it('should handle decode errors', () => {
      jwt.decode.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = TokenService.decodeToken('invalid_token');

      expect(result).toBeNull();
    });

    it('should generate verification token', () => {
      crypto.randomBytes.mockReturnValue({
        toString: jest.fn().mockReturnValue('verification_token_123')
      });

      const result = TokenService.generateVerificationToken();

      expect(result).toBe('verification_token_123');
      expect(crypto.randomBytes).toHaveBeenCalledWith(32);
    });

    it('should generate API key', () => {
      crypto.randomBytes.mockReturnValue({
        toString: jest.fn().mockReturnValue('api_key_123')
      });

      const result = TokenService.generateApiKey();

      expect(result).toBe('api_key_123');
      expect(crypto.randomBytes).toHaveBeenCalledWith(32);
    });
  });
});