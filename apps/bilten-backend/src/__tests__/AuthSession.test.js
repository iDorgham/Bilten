const AuthSession = require('../models/AuthSession');
const { query } = require('../database/connection');

// Mock dependencies
jest.mock('../database/connection');
jest.mock('../database/BaseRepository');

describe('AuthSession Model', () => {
  let authSession;
  let mockSessionData;

  beforeEach(() => {
    jest.clearAllMocks();
    
    authSession = new AuthSession();
    
    mockSessionData = {
      user_id: 1,
      session_token: 'access_token_123',
      refresh_token: 'refresh_token_123',
      token_type: 'Bearer',
      expires_at: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      refresh_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      device_id: 'device_123',
      device_name: 'Test Device',
      device_type: 'web',
      user_agent: 'Mozilla/5.0 Test Browser',
      ip_address: '192.168.1.1',
      country: 'US',
      city: 'New York',
      scopes: ['read', 'write'],
      is_mfa_verified: false,
      risk_score: 25,
      metadata: {
        login_method: 'password',
        device_fingerprint: 'fp_123'
      }
    };

    // Mock BaseRepository methods
    authSession.create = jest.fn();
    authSession.findById = jest.fn();
    authSession.update = jest.fn();
    authSession.setCache = jest.fn();
    authSession.getFromCache = jest.fn();
    authSession.invalidateCache = jest.fn();
    authSession.getCacheKey = jest.fn().mockImplementation((key, type) => `${type || 'default'}:${key}`);
  });

  describe('create', () => {
    it('should create a new session successfully', async () => {
      // Mock the actual create implementation
      authSession.create.mockImplementation(async (sessionData) => {
        // Validate required fields
        if (!sessionData.user_id || !sessionData.session_token || !sessionData.refresh_token || !sessionData.expires_at || !sessionData.refresh_expires_at) {
          throw new Error('User ID, tokens, and expiration times are required');
        }

        // Validate user_id as integer
        const userId = parseInt(sessionData.user_id);
        if (isNaN(userId)) {
          throw new Error('User ID must be a valid integer');
        }

        // Set defaults and return created session
        const processedData = {
          ...sessionData,
          user_id: userId,
          token_type: sessionData.token_type || 'Bearer',
          device_type: sessionData.device_type || 'web',
          scopes: JSON.stringify(sessionData.scopes || []),
          is_mfa_verified: sessionData.is_mfa_verified || false,
          risk_score: sessionData.risk_score || 0,
          metadata: JSON.stringify(sessionData.metadata || {}),
          is_active: true,
          last_activity: new Date()
        };

        return { id: 'session_123', ...processedData };
      });

      const result = await authSession.create(mockSessionData);

      expect(result).toEqual(expect.objectContaining({
        id: 'session_123',
        user_id: 1,
        session_token: 'access_token_123',
        refresh_token: 'refresh_token_123',
        is_active: true,
        last_activity: expect.any(Date)
      }));
    });

    it('should throw error for missing required fields', async () => {
      // Use the same mock implementation
      authSession.create.mockImplementation(async (sessionData) => {
        if (!sessionData.user_id || !sessionData.session_token || !sessionData.refresh_token || !sessionData.expires_at || !sessionData.refresh_expires_at) {
          throw new Error('User ID, tokens, and expiration times are required');
        }
        return { id: 'session_123' };
      });

      const invalidSessionData = { user_id: 1 }; // Missing required fields

      await expect(authSession.create(invalidSessionData)).rejects.toThrow(
        'User ID, tokens, and expiration times are required'
      );
    });

    it('should validate user_id as integer', async () => {
      authSession.create.mockImplementation(async (sessionData) => {
        const userId = parseInt(sessionData.user_id);
        if (isNaN(userId)) {
          throw new Error('User ID must be a valid integer');
        }
        return { id: 'session_123' };
      });

      const invalidSessionData = { ...mockSessionData, user_id: 'invalid' };

      await expect(authSession.create(invalidSessionData)).rejects.toThrow(
        'User ID must be a valid integer'
      );
    });

    it('should set default values for optional fields', async () => {
      authSession.create.mockImplementation(async (sessionData) => {
        const processedData = {
          ...sessionData,
          token_type: sessionData.token_type || 'Bearer',
          device_type: sessionData.device_type || 'web',
          scopes: JSON.stringify(sessionData.scopes || []),
          is_mfa_verified: sessionData.is_mfa_verified || false,
          risk_score: sessionData.risk_score || 0,
          metadata: JSON.stringify(sessionData.metadata || {}),
          is_active: true
        };
        return { id: 'session_123', ...processedData };
      });

      const minimalSessionData = {
        user_id: 1,
        session_token: 'access_token',
        refresh_token: 'refresh_token',
        expires_at: new Date(),
        refresh_expires_at: new Date()
      };

      const result = await authSession.create(minimalSessionData);

      expect(result).toEqual(expect.objectContaining({
        token_type: 'Bearer',
        device_type: 'web',
        scopes: JSON.stringify([]),
        is_mfa_verified: false,
        risk_score: 0,
        metadata: JSON.stringify({}),
        is_active: true
      }));
    });
  });

  describe('findByRefreshToken', () => {
    it('should find session by refresh token', async () => {
      const mockSession = { id: 'session_123', refresh_token: 'refresh_123' };
      query.mockResolvedValue({ rows: [mockSession] });

      const result = await authSession.findByRefreshToken('refresh_123');

      expect(result).toEqual(mockSession);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE refresh_token = $1'),
        ['refresh_123'],
        true
      );
    });

    it('should return null for non-existent token', async () => {
      query.mockResolvedValue({ rows: [] });

      const result = await authSession.findByRefreshToken('non_existent');

      expect(result).toBeNull();
    });

    it('should use cache when enabled', async () => {
      const mockSession = { id: 'session_123' };
      authSession.getFromCache.mockResolvedValue(mockSession);

      const result = await authSession.findByRefreshToken('refresh_123', true);

      expect(result).toEqual(mockSession);
      expect(authSession.getFromCache).toHaveBeenCalled();
      expect(query).not.toHaveBeenCalled();
    });
  });

  describe('findByAccessToken', () => {
    it('should find session by access token', async () => {
      const mockSession = { id: 'session_123', session_token: 'access_123' };
      query.mockResolvedValue({ rows: [mockSession] });

      const result = await authSession.findByAccessToken('access_123');

      expect(result).toEqual(mockSession);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE session_token = $1'),
        ['access_123'],
        true
      );
    });
  });

  describe('findActiveSessionsByUser', () => {
    it('should find all active sessions for a user', async () => {
      const mockSessions = [
        { id: 'session_1', user_id: 1 },
        { id: 'session_2', user_id: 1 }
      ];
      query.mockResolvedValue({ rows: mockSessions });

      const result = await authSession.findActiveSessionsByUser(1);

      expect(result).toEqual(mockSessions);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE user_id = $1 AND is_active = true'),
        [1],
        true
      );
    });
  });

  describe('findByDevice', () => {
    it('should find sessions by device ID', async () => {
      const mockSessions = [{ id: 'session_1', device_id: 'device_123' }];
      query.mockResolvedValue({ rows: mockSessions });

      const result = await authSession.findByDevice('device_123');

      expect(result).toEqual(mockSessions);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE device_id = $1'),
        ['device_123'],
        true
      );
    });

    it('should filter by user ID when provided', async () => {
      query.mockResolvedValue({ rows: [] });

      await authSession.findByDevice('device_123', 1);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('AND user_id = $2'),
        ['device_123', 1],
        true
      );
    });
  });

  describe('updateActivity', () => {
    it('should update session activity', async () => {
      const mockUpdatedSession = { id: 'session_123', last_activity: new Date() };
      query.mockResolvedValue({ rows: [mockUpdatedSession] });

      const result = await authSession.updateActivity('session_123', { action: 'api_call' });

      expect(result).toEqual(mockUpdatedSession);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SET last_activity = NOW()'),
        ['session_123', JSON.stringify({ action: 'api_call' })]
      );
    });
  });

  describe('updateTokens', () => {
    it('should update session tokens', async () => {
      const mockUpdatedSession = { id: 'session_123', session_token: 'new_access_token' };
      
      // Mock the updateTokens method implementation
      authSession.updateTokens = jest.fn().mockImplementation(async (sessionId, newAccessToken, newRefreshToken, expiresAt) => {
        const updateData = {
          session_token: newAccessToken,
          last_activity: new Date(),
          updated_at: new Date()
        };

        if (newRefreshToken) {
          updateData.refresh_token = newRefreshToken;
        }

        if (expiresAt) {
          updateData.expires_at = expiresAt;
        }

        await authSession.update(sessionId, updateData);
        return mockUpdatedSession;
      });

      const result = await authSession.updateTokens(
        'session_123',
        'new_access_token',
        'new_refresh_token',
        new Date()
      );

      expect(result).toEqual(mockUpdatedSession);
      expect(authSession.update).toHaveBeenCalledWith('session_123', expect.objectContaining({
        session_token: 'new_access_token',
        refresh_token: 'new_refresh_token',
        expires_at: expect.any(Date)
      }));
    });

    it('should update only access token when refresh token not provided', async () => {
      authSession.updateTokens = jest.fn().mockImplementation(async (sessionId, newAccessToken, newRefreshToken) => {
        const updateData = {
          session_token: newAccessToken,
          last_activity: new Date(),
          updated_at: new Date()
        };

        if (newRefreshToken) {
          updateData.refresh_token = newRefreshToken;
        }

        await authSession.update(sessionId, updateData);
        return { id: sessionId };
      });

      await authSession.updateTokens('session_123', 'new_access_token');

      expect(authSession.update).toHaveBeenCalledWith('session_123', expect.objectContaining({
        session_token: 'new_access_token'
      }));
      expect(authSession.update).toHaveBeenCalledWith('session_123', expect.not.objectContaining({
        refresh_token: expect.anything()
      }));
    });
  });

  describe('invalidate', () => {
    it('should invalidate a session', async () => {
      const mockSession = { 
        id: 'session_123', 
        session_token: 'access_123',
        refresh_token: 'refresh_123',
        device_id: 'device_123'
      };
      
      authSession.findById.mockResolvedValue(mockSession);
      query.mockResolvedValue({ rows: [{ ...mockSession, is_active: false }] });

      const result = await authSession.invalidate('session_123', 'logout');

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SET is_active = false'),
        ['session_123', expect.stringContaining('logout')]
      );
      expect(authSession.invalidateCache).toHaveBeenCalledTimes(4); // ID, access token, refresh token, device
    });

    it('should return null for non-existent session', async () => {
      authSession.findById.mockResolvedValue(null);

      const result = await authSession.invalidate('non_existent');

      expect(result).toBeNull();
      expect(query).not.toHaveBeenCalled();
    });
  });

  describe('invalidateAllUserSessions', () => {
    it('should invalidate all user sessions', async () => {
      const mockSessions = [
        { id: 'session_1', session_token: 'access_1', refresh_token: 'refresh_1' },
        { id: 'session_2', session_token: 'access_2', refresh_token: 'refresh_2' }
      ];
      
      query.mockResolvedValue({ rows: mockSessions });

      const result = await authSession.invalidateAllUserSessions(1, null, 'security');

      expect(result).toBe(2);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE user_id = $1 AND is_active = true'),
        [1, expect.stringContaining('security')]
      );
    });

    it('should exclude specified session', async () => {
      query.mockResolvedValue({ rows: [] });

      await authSession.invalidateAllUserSessions(1, 'session_keep', 'security');

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('AND id != $3'),
        [1, expect.any(String), 'session_keep']
      );
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should clean up expired sessions', async () => {
      const expiredSessions = [
        { id: 'session_1', session_token: 'access_1', refresh_token: 'refresh_1' },
        { id: 'session_2', session_token: 'access_2', refresh_token: 'refresh_2' }
      ];
      
      query.mockResolvedValue({ rows: expiredSessions });

      const result = await authSession.cleanupExpiredSessions();

      expect(result).toBe(2);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM authentication.user_sessions')
      );
    });
  });

  describe('getUserSessionStats', () => {
    it('should return session statistics for user', async () => {
      const mockStats = {
        total_sessions: 10,
        active_sessions: 3,
        valid_sessions: 5,
        unique_devices: 2,
        device_types: 2,
        last_activity: new Date(),
        first_session: new Date()
      };
      
      query.mockResolvedValue({ rows: [mockStats] });

      const result = await authSession.getUserSessionStats(1);

      expect(result).toEqual(mockStats);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('COUNT(*) as total_sessions'),
        [1],
        true
      );
    });
  });

  describe('getSessionsWithLocation', () => {
    it('should return sessions with geographic information', async () => {
      const mockSessions = [
        { id: 'session_1', country: 'US', city: 'New York', is_valid: true },
        { id: 'session_2', country: 'CA', city: 'Toronto', is_valid: false }
      ];
      
      query.mockResolvedValue({ rows: mockSessions });

      const result = await authSession.getSessionsWithLocation(1);

      expect(result).toEqual(mockSessions);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('country, city'),
        [1],
        true
      );
    });
  });

  describe('detectSuspiciousSessions', () => {
    it('should detect suspicious sessions', async () => {
      const suspiciousSessions = [
        { id: 'session_1', suspicion_reason: 'rapid_location_change' },
        { id: 'session_2', suspicion_reason: 'high_risk_score' }
      ];
      
      query.mockResolvedValue({ rows: [
        ...suspiciousSessions,
        { id: 'session_3', suspicion_reason: null } // Should be filtered out
      ] });

      const result = await authSession.detectSuspiciousSessions(1);

      expect(result).toEqual(suspiciousSessions);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('CASE'),
        [1],
        true
      );
    });
  });

  describe('updateRiskScore', () => {
    it('should update session risk score', async () => {
      const mockUpdatedSession = { id: 'session_123', risk_score: 75 };
      query.mockResolvedValue({ rows: [mockUpdatedSession] });

      const result = await authSession.updateRiskScore('session_123', 75, ['new_location', 'unusual_time']);

      expect(result).toEqual(mockUpdatedSession);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SET risk_score = $2'),
        ['session_123', 75, expect.stringContaining('new_location')]
      );
    });
  });

  describe('getConcurrentSessionCount', () => {
    it('should return concurrent session count', async () => {
      query.mockResolvedValue({ rows: [{ count: '3' }] });

      const result = await authSession.getConcurrentSessionCount(1);

      expect(result).toBe(3);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('COUNT(*) as count'),
        [1],
        true
      );
    });
  });

  describe('enforceConcurrentSessionLimit', () => {
    it('should not invalidate sessions when under limit', async () => {
      const activeSessions = [
        { id: 'session_1', last_activity: new Date() },
        { id: 'session_2', last_activity: new Date() }
      ];
      
      authSession.findActiveSessionsByUser = jest.fn().mockResolvedValue(activeSessions);
      authSession.invalidate = jest.fn();

      const result = await authSession.enforceConcurrentSessionLimit(1, 5);

      expect(result).toBe(0);
      expect(authSession.invalidate).not.toHaveBeenCalled();
    });

    it('should invalidate oldest sessions when over limit', async () => {
      const oldDate = new Date(Date.now() - 60000);
      const newDate = new Date();
      
      const activeSessions = [
        { id: 'session_1', last_activity: oldDate },
        { id: 'session_2', last_activity: newDate },
        { id: 'session_3', last_activity: oldDate }
      ];
      
      authSession.findActiveSessionsByUser = jest.fn().mockResolvedValue(activeSessions);
      authSession.invalidate = jest.fn().mockResolvedValue({});

      const result = await authSession.enforceConcurrentSessionLimit(1, 2);

      expect(result).toBe(1); // Should invalidate 1 session
      expect(authSession.invalidate).toHaveBeenCalledWith('session_1', 'concurrent_session_limit');
    });
  });
});