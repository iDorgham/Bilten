const SessionManagementService = require('../services/SessionManagementService');
const { query } = require('../database/connection');

// Mock dependencies
jest.mock('../database/connection');
jest.mock('../models/AuthSession');
jest.mock('../services/SecurityService');

describe('SessionManagementService', () => {
  let mockAuthSession;
  let mockSecurityService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock AuthSession
    mockAuthSession = {
      findById: jest.fn(),
      update: jest.fn(),
      updateActivity: jest.fn(),
      invalidate: jest.fn(),
      cleanupExpiredSessions: jest.fn(),
      enforceConcurrentSessionLimit: jest.fn(),
      detectSuspiciousSessions: jest.fn()
    };
    
    const AuthSession = require('../models/AuthSession');
    AuthSession.mockImplementation(() => mockAuthSession);

    // Mock SecurityService - ensure it's properly mocked
    const SecurityService = require('../services/SecurityService');
    SecurityService.logSecurityEvent = jest.fn().mockResolvedValue({});

    query.mockResolvedValue({ rows: [] });
  });

  describe('isSessionExpired', () => {
    it('should return true for non-existent session', async () => {
      mockAuthSession.findById.mockResolvedValue(null);

      const result = await SessionManagementService.isSessionExpired('session_123');
      expect(result).toBe(true);
    });

    it('should return false for active, non-expired session', async () => {
      const futureTime = new Date(Date.now() + 60000); // 1 minute in future
      const recentActivity = new Date(Date.now() - 60000); // 1 minute ago

      mockAuthSession.findById.mockResolvedValue({
        id: 'session_123',
        expires_at: futureTime,
        refresh_expires_at: futureTime,
        last_activity: recentActivity,
        is_active: true
      });

      const result = await SessionManagementService.isSessionExpired('session_123');
      expect(result).toBe(false);
    });

    it('should return true for expired session', async () => {
      const pastTime = new Date(Date.now() - 60000); // 1 minute ago

      mockAuthSession.findById.mockResolvedValue({
        id: 'session_123',
        expires_at: pastTime,
        refresh_expires_at: pastTime,
        last_activity: pastTime,
        is_active: true
      });

      const result = await SessionManagementService.isSessionExpired('session_123');
      expect(result).toBe(true);
    });

    it('should return true for inactive session due to inactivity timeout', async () => {
      const futureTime = new Date(Date.now() + 60000); // 1 minute in future
      const oldActivity = new Date(Date.now() - (35 * 60 * 1000)); // 35 minutes ago (exceeds 30min timeout)

      mockAuthSession.findById.mockResolvedValue({
        id: 'session_123',
        expires_at: futureTime,
        refresh_expires_at: futureTime,
        last_activity: oldActivity,
        is_active: true
      });

      const result = await SessionManagementService.isSessionExpired('session_123');
      expect(result).toBe(true);
    });

    it('should return true for inactive session', async () => {
      const futureTime = new Date(Date.now() + 60000);
      const recentActivity = new Date(Date.now() - 60000);

      mockAuthSession.findById.mockResolvedValue({
        id: 'session_123',
        expires_at: futureTime,
        refresh_expires_at: futureTime,
        last_activity: recentActivity,
        is_active: false
      });

      const result = await SessionManagementService.isSessionExpired('session_123');
      expect(result).toBe(true);
    });

    it('should return true on error for security', async () => {
      mockAuthSession.findById.mockRejectedValue(new Error('Database error'));

      const result = await SessionManagementService.isSessionExpired('session_123');
      expect(result).toBe(true);
    });
  });

  describe('getSessionExpirationInfo', () => {
    it('should return null for non-existent session', async () => {
      mockAuthSession.findById.mockResolvedValue(null);

      const result = await SessionManagementService.getSessionExpirationInfo('session_123');
      expect(result).toBeNull();
    });

    it('should return correct expiration info for active session', async () => {
      const now = Date.now();
      const expiresAt = new Date(now + 10 * 60 * 1000); // 10 minutes from now
      const refreshExpiresAt = new Date(now + 24 * 60 * 60 * 1000); // 24 hours from now
      const lastActivity = new Date(now - 5 * 60 * 1000); // 5 minutes ago

      mockAuthSession.findById.mockResolvedValue({
        id: 'session_123',
        expires_at: expiresAt,
        refresh_expires_at: refreshExpiresAt,
        last_activity: lastActivity,
        is_active: true
      });

      // Mock isSessionExpired to return false
      jest.spyOn(SessionManagementService, 'isSessionExpired').mockResolvedValue(false);

      const result = await SessionManagementService.getSessionExpirationInfo('session_123');

      expect(result).toEqual({
        sessionId: 'session_123',
        isActive: true,
        expiresAt,
        refreshExpiresAt,
        lastActivity,
        timeUntilExpiration: expect.any(Number),
        timeUntilRefreshExpiration: expect.any(Number),
        timeUntilInactivityExpiration: expect.any(Number),
        shouldWarn: expect.any(Boolean),
        isExpired: false
      });

      expect(result.timeUntilExpiration).toBeGreaterThan(500); // Should be around 600 seconds
      expect(result.timeUntilExpiration).toBeLessThan(700);
    });

    it('should indicate warning when session is close to expiration', async () => {
      const now = Date.now();
      const expiresAt = new Date(now + 2 * 60 * 1000); // 2 minutes from now (less than 5 min warning)
      const refreshExpiresAt = new Date(now + 24 * 60 * 60 * 1000);
      const lastActivity = new Date(now - 60 * 1000);

      mockAuthSession.findById.mockResolvedValue({
        id: 'session_123',
        expires_at: expiresAt,
        refresh_expires_at: refreshExpiresAt,
        last_activity: lastActivity,
        is_active: true
      });

      jest.spyOn(SessionManagementService, 'isSessionExpired').mockResolvedValue(false);

      const result = await SessionManagementService.getSessionExpirationInfo('session_123');

      expect(result.shouldWarn).toBe(true);
    });

    it('should return null on error', async () => {
      mockAuthSession.findById.mockRejectedValue(new Error('Database error'));

      const result = await SessionManagementService.getSessionExpirationInfo('session_123');
      expect(result).toBeNull();
    });
  });

  describe('extendSession', () => {
    it('should extend session with default lifetime', async () => {
      const mockSession = { id: 'session_123', user_id: 1 };
      mockAuthSession.update.mockResolvedValue(mockSession);

      const result = await SessionManagementService.extendSession('session_123');

      expect(mockAuthSession.update).toHaveBeenCalledWith('session_123', {
        expires_at: expect.any(Date),
        refresh_expires_at: expect.any(Date),
        last_activity: expect.any(Date)
      });

      const SecurityService = require('../services/SecurityService');
      expect(SecurityService.logSecurityEvent).toHaveBeenCalledWith(
        1,
        'session_extended',
        'low',
        expect.objectContaining({
          session_id: 'session_123',
          extended_lifetime: expect.any(Number)
        })
      );

      expect(result).toEqual(mockSession);
    });

    it('should extend session with custom lifetime', async () => {
      const mockSession = { id: 'session_123', user_id: 1 };
      mockAuthSession.update.mockResolvedValue(mockSession);

      const customLifetime = 4 * 60 * 60; // 4 hours
      await SessionManagementService.extendSession('session_123', customLifetime);

      const SecurityService = require('../services/SecurityService');
      expect(SecurityService.logSecurityEvent).toHaveBeenCalledWith(
        1,
        'session_extended',
        'low',
        expect.objectContaining({
          extended_lifetime: customLifetime
        })
      );
    });
  });

  describe('updateSessionActivity', () => {
    it('should update session activity with metadata', async () => {
      const mockSession = { id: 'session_123' };
      mockAuthSession.updateActivity.mockResolvedValue(mockSession);

      const metadata = { action: 'api_call', endpoint: '/api/users' };
      const result = await SessionManagementService.updateSessionActivity('session_123', metadata);

      expect(mockAuthSession.updateActivity).toHaveBeenCalledWith('session_123', {
        ...metadata,
        activity_updated_at: expect.any(Date)
      });

      expect(result).toEqual(mockSession);
    });
  });

  describe('expireInactiveSessions', () => {
    it('should expire inactive sessions', async () => {
      const inactiveSessions = [
        { id: 'session_1', user_id: 1 },
        { id: 'session_2', user_id: 2 }
      ];

      query.mockResolvedValue({ rows: inactiveSessions });
      
      // Mock expireSession method
      jest.spyOn(SessionManagementService, 'expireSession').mockResolvedValue({});

      const result = await SessionManagementService.expireInactiveSessions();

      expect(result).toBe(2);
      expect(SessionManagementService.expireSession).toHaveBeenCalledTimes(2);
      expect(SessionManagementService.expireSession).toHaveBeenCalledWith('session_1', 'inactivity_timeout');
      expect(SessionManagementService.expireSession).toHaveBeenCalledWith('session_2', 'inactivity_timeout');
    });

    it('should return 0 when no inactive sessions found', async () => {
      query.mockResolvedValue({ rows: [] });

      const result = await SessionManagementService.expireInactiveSessions();

      expect(result).toBe(0);
    });
  });

  describe('expireSession', () => {
    it('should expire session and log security event', async () => {
      const mockSession = { id: 'session_123', user_id: 1 };
      
      // Set up the invalidate method to return the mock session
      mockAuthSession.invalidate.mockResolvedValue(mockSession);

      const result = await SessionManagementService.expireSession('session_123', 'manual_expiration');

      // Verify that SecurityService.logSecurityEvent was called with correct parameters
      const SecurityService = require('../services/SecurityService');
      expect(SecurityService.logSecurityEvent).toHaveBeenCalledWith(
        1,
        'session_expired',
        'low',
        expect.objectContaining({
          session_id: 'session_123',
          expiration_reason: 'manual_expiration'
        })
      );

      expect(result).toEqual(mockSession);
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should clean up expired sessions', async () => {
      mockAuthSession.cleanupExpiredSessions.mockResolvedValue(5);

      const result = await SessionManagementService.cleanupExpiredSessions();

      expect(result).toBe(5);
      expect(mockAuthSession.cleanupExpiredSessions).toHaveBeenCalled();
    });
  });

  describe('enforceConcurrentSessionLimits', () => {
    it('should enforce concurrent session limits', async () => {
      mockAuthSession.enforceConcurrentSessionLimit.mockResolvedValue(2);

      const result = await SessionManagementService.enforceConcurrentSessionLimits(1, 3);

      expect(result).toBe(2);
      expect(mockAuthSession.enforceConcurrentSessionLimit).toHaveBeenCalledWith(1, 3);
      
      const SecurityService = require('../services/SecurityService');
      expect(SecurityService.logSecurityEvent).toHaveBeenCalledWith(
        1,
        'concurrent_session_limit',
        'medium',
        expect.objectContaining({
          max_sessions: 3,
          invalidated_sessions: 2
        })
      );
    });

    it('should not log event when no sessions are invalidated', async () => {
      mockAuthSession.enforceConcurrentSessionLimit.mockResolvedValue(0);

      const result = await SessionManagementService.enforceConcurrentSessionLimits(1);

      expect(result).toBe(0);
      
      const SecurityService = require('../services/SecurityService');
      expect(SecurityService.logSecurityEvent).not.toHaveBeenCalled();
    });
  });

  describe('getSessionStatistics', () => {
    it('should return session statistics', async () => {
      const mockStats = {
        total_sessions: '100',
        active_sessions: '75',
        valid_sessions: '80',
        recent_activity: '50',
        unique_users: '25',
        avg_inactivity_seconds: '300'
      };

      query.mockResolvedValue({ rows: [mockStats] });

      const result = await SessionManagementService.getSessionStatistics();

      expect(result).toEqual(mockStats);
      expect(query).toHaveBeenCalledWith(expect.stringContaining('COUNT(*) as total_sessions'));
    });
  });

  describe('monitorSessionSecurity', () => {
    it('should monitor sessions and detect anomalies', async () => {
      const mockSessions = [
        { id: 'session_1', user_id: 1, ip_address: '192.168.1.1' },
        { id: 'session_2', user_id: 2, ip_address: '192.168.1.2' }
      ];

      query.mockResolvedValue({ rows: mockSessions });

      const mockSuspiciousSessions = [
        { id: 'session_1', suspicion_reason: 'rapid_location_change' }
      ];

      mockAuthSession.detectSuspiciousSessions.mockResolvedValue(mockSuspiciousSessions);

      const result = await SessionManagementService.monitorSessionSecurity();

      expect(result).toEqual({
        totalSessions: 2,
        anomaliesDetected: 2 // One for each user
      });

      const SecurityService = require('../services/SecurityService');
      expect(SecurityService.logSecurityEvent).toHaveBeenCalledTimes(2);
    });

    it('should handle sessions with no suspicious activity', async () => {
      const mockSessions = [
        { id: 'session_1', user_id: 1, ip_address: '192.168.1.1' }
      ];

      query.mockResolvedValue({ rows: mockSessions });
      mockAuthSession.detectSuspiciousSessions.mockResolvedValue([]);

      const result = await SessionManagementService.monitorSessionSecurity();

      expect(result).toEqual({
        totalSessions: 1,
        anomaliesDetected: 0
      });

      const SecurityService = require('../services/SecurityService');
      expect(SecurityService.logSecurityEvent).not.toHaveBeenCalled();
    });
  });

  describe('startSessionMaintenance', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should start session maintenance with correct interval', () => {
      // Mock the maintenance methods
      jest.spyOn(SessionManagementService, 'expireInactiveSessions').mockResolvedValue(2);
      jest.spyOn(SessionManagementService, 'cleanupExpiredSessions').mockResolvedValue(3);
      jest.spyOn(SessionManagementService, 'monitorSessionSecurity').mockResolvedValue({
        totalSessions: 10,
        anomaliesDetected: 1
      });

      const intervalId = SessionManagementService.startSessionMaintenance(10); // 10 minutes

      expect(intervalId).toBeDefined();

      // Fast-forward time to trigger the interval
      jest.advanceTimersByTime(10 * 60 * 1000); // 10 minutes

      // Clean up
      clearInterval(intervalId);
    });
  });
});