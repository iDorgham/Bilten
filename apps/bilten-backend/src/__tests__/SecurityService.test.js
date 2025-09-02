const SecurityService = require('../services/SecurityService');
const { query } = require('../database/connection');

// Mock dependencies
jest.mock('../database/connection');
jest.mock('../models/SecurityEvent');

describe('SecurityService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    query.mockResolvedValue({ rows: [] });
  });

  describe('calculateProgressiveDelay', () => {
    it('should return 0 for no failed attempts', () => {
      const delay = SecurityService.calculateProgressiveDelay(0);
      expect(delay).toBe(0);
    });

    it('should return correct delay for various attempt counts', () => {
      expect(SecurityService.calculateProgressiveDelay(1)).toBe(1);
      expect(SecurityService.calculateProgressiveDelay(3)).toBe(5);
      expect(SecurityService.calculateProgressiveDelay(5)).toBe(30);
      expect(SecurityService.calculateProgressiveDelay(10)).toBe(3600);
    });

    it('should cap delay at maximum configured value', () => {
      const delay = SecurityService.calculateProgressiveDelay(100);
      expect(delay).toBe(3600); // Should be capped at 1 hour
    });
  });

  describe('applyProgressiveDelay', () => {
    it('should apply delay and update database', async () => {
      const SecurityEvent = require('../models/SecurityEvent');
      const mockSecurityEvent = {
        create: jest.fn().mockResolvedValue({ id: 'event_123' })
      };
      SecurityEvent.mockImplementation(() => mockSecurityEvent);

      const userId = 1;
      const failedAttempts = 3;

      await SecurityService.applyProgressiveDelay(userId, failedAttempts);

      expect(query).toHaveBeenCalledWith(
        'UPDATE users.users SET login_delay_until = $1 WHERE id = $2',
        [expect.any(Date), userId]
      );
    });

    it('should return 0 for no failed attempts', async () => {
      const delay = await SecurityService.applyProgressiveDelay(1, 0);
      expect(delay).toBe(0);
      expect(query).not.toHaveBeenCalled();
    });

    it('should log security event', async () => {
      const SecurityEvent = require('../models/SecurityEvent');
      const mockSecurityEvent = {
        create: jest.fn().mockResolvedValue({ id: 'event_123' })
      };
      SecurityEvent.mockImplementation(() => mockSecurityEvent);

      await SecurityService.applyProgressiveDelay(1, 3);

      expect(mockSecurityEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 1,
          event_type: 'progressive_delay_applied',
          severity: 'medium'
        })
      );
    });
  });

  describe('isInDelayPeriod', () => {
    it('should return false when no delay is set', async () => {
      query.mockResolvedValue({ rows: [{ login_delay_until: null }] });

      const result = await SecurityService.isInDelayPeriod(1);
      expect(result).toBe(false);
    });

    it('should return true when delay is active', async () => {
      const futureTime = new Date(Date.now() + 60000); // 1 minute in future
      query.mockResolvedValue({ rows: [{ login_delay_until: futureTime }] });

      const result = await SecurityService.isInDelayPeriod(1);
      expect(result).toBe(true);
    });

    it('should return false and clear expired delay', async () => {
      const pastTime = new Date(Date.now() - 60000); // 1 minute in past
      query.mockResolvedValueOnce({ rows: [{ login_delay_until: pastTime }] })
           .mockResolvedValueOnce({ rows: [] }); // For the UPDATE query

      const result = await SecurityService.isInDelayPeriod(1);
      expect(result).toBe(false);
      
      // Should clear the expired delay
      expect(query).toHaveBeenCalledWith(
        'UPDATE users.users SET login_delay_until = NULL WHERE id = $1',
        [1]
      );
    });

    it('should return false on database error', async () => {
      query.mockRejectedValue(new Error('Database error'));

      const result = await SecurityService.isInDelayPeriod(1);
      expect(result).toBe(false);
    });
  });

  describe('getRemainingDelayTime', () => {
    it('should return 0 when no delay is set', async () => {
      query.mockResolvedValue({ rows: [{ login_delay_until: null }] });

      const result = await SecurityService.getRemainingDelayTime(1);
      expect(result).toBe(0);
    });

    it('should return correct remaining time', async () => {
      const futureTime = new Date(Date.now() + 30000); // 30 seconds in future
      query.mockResolvedValue({ rows: [{ login_delay_until: futureTime }] });

      const result = await SecurityService.getRemainingDelayTime(1);
      expect(result).toBeGreaterThan(25);
      expect(result).toBeLessThanOrEqual(30);
    });

    it('should return 0 for expired delay', async () => {
      const pastTime = new Date(Date.now() - 60000); // 1 minute in past
      query.mockResolvedValue({ rows: [{ login_delay_until: pastTime }] });

      const result = await SecurityService.getRemainingDelayTime(1);
      expect(result).toBe(0);
    });
  });

  describe('shouldLockAccount', () => {
    it('should return true when attempts exceed threshold', () => {
      const result = SecurityService.shouldLockAccount(5);
      expect(result).toBe(true);
    });

    it('should return false when attempts are below threshold', () => {
      const result = SecurityService.shouldLockAccount(3);
      expect(result).toBe(false);
    });
  });

  describe('shouldPermanentlyLockAccount', () => {
    it('should return true when attempts exceed permanent threshold', () => {
      const result = SecurityService.shouldPermanentlyLockAccount(10);
      expect(result).toBe(true);
    });

    it('should return false when attempts are below permanent threshold', () => {
      const result = SecurityService.shouldPermanentlyLockAccount(7);
      expect(result).toBe(false);
    });
  });

  describe('applyAccountLockout', () => {
    it('should apply temporary lockout for moderate attempts', async () => {
      const userId = 1;
      const failedAttempts = 6;

      const result = await SecurityService.applyAccountLockout(userId, failedAttempts);

      expect(result.isPermanent).toBe(false);
      expect(result.lockedUntil).toBeInstanceOf(Date);
      expect(result.lockoutDuration).toBe(1800); // 30 minutes

      expect(query).toHaveBeenCalledWith(
        'UPDATE users.users SET locked_until = $1, status = $2 WHERE id = $3',
        [expect.any(Date), 'active', userId]
      );
    });

    it('should apply permanent lockout for excessive attempts', async () => {
      const userId = 1;
      const failedAttempts = 12;

      const result = await SecurityService.applyAccountLockout(userId, failedAttempts);

      expect(result.isPermanent).toBe(true);
      expect(result.lockedUntil).toBeNull();
      expect(result.lockoutDuration).toBeNull();

      expect(query).toHaveBeenCalledWith(
        'UPDATE users.users SET locked_until = $1, status = $2 WHERE id = $3',
        [null, 'permanently_locked', userId]
      );
    });

    it('should log security event', async () => {
      const SecurityEvent = require('../models/SecurityEvent');
      const mockSecurityEvent = {
        create: jest.fn().mockResolvedValue({ id: 'event_123' })
      };
      SecurityEvent.mockImplementation(() => mockSecurityEvent);

      await SecurityService.applyAccountLockout(1, 6);

      expect(mockSecurityEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 1,
          event_type: 'account_locked',
          severity: 'high'
        })
      );
    });
  });

  describe('logSecurityEvent', () => {
    it('should create security event with correct data', async () => {
      const SecurityEvent = require('../models/SecurityEvent');
      const mockSecurityEvent = {
        create: jest.fn().mockResolvedValue({ id: 'event_123' })
      };
      SecurityEvent.mockImplementation(() => mockSecurityEvent);

      const userId = 1;
      const eventType = 'login_failure';
      const severity = 'medium';
      const metadata = { reason: 'invalid_password' };
      const ipAddress = '192.168.1.1';
      const userAgent = 'Mozilla/5.0';

      const result = await SecurityService.logSecurityEvent(
        userId, eventType, severity, metadata, ipAddress, userAgent
      );

      expect(mockSecurityEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userId,
          event_type: eventType,
          severity,
          ip_address: ipAddress,
          user_agent: userAgent,
          metadata: expect.objectContaining(metadata),
          resolved: false
        })
      );

      expect(result).toEqual({ id: 'event_123' });
    });
  });

  describe('getEventDescription', () => {
    it('should return correct descriptions for known events', () => {
      expect(SecurityService.getEventDescription('login_success')).toBe('User successfully logged in');
      expect(SecurityService.getEventDescription('login_failure', { failure_reason: 'invalid_password' }))
        .toBe('Login attempt failed: invalid_password');
      expect(SecurityService.getEventDescription('account_locked', { reason: 'excessive_attempts' }))
        .toBe('Account locked due to excessive_attempts');
    });

    it('should return generic description for unknown events', () => {
      expect(SecurityService.getEventDescription('unknown_event'))
        .toBe('Security event: unknown_event');
    });
  });

  describe('detectSuspiciousActivity', () => {
    it('should detect rapid location change', async () => {
      const SecurityEvent = require('../models/SecurityEvent');
      const mockSecurityEvent = {
        create: jest.fn().mockResolvedValue({ id: 'event_123' })
      };
      SecurityEvent.mockImplementation(() => mockSecurityEvent);

      const userId = 1;
      const activityData = {
        previousLocation: { country: 'US', city: 'New York' },
        currentLocation: { country: 'UK', city: 'London' },
        previousTime: Date.now() - (30 * 60 * 1000), // 30 minutes ago
        currentTime: Date.now(),
        riskScore: 50,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      };

      const result = await SecurityService.detectSuspiciousActivity(userId, activityData);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('rapid_location_change');
      expect(result[0].severity).toBe('high');
      expect(mockSecurityEvent.create).toHaveBeenCalled();
    });

    it('should detect unusual access time', async () => {
      const SecurityEvent = require('../models/SecurityEvent');
      const mockSecurityEvent = {
        create: jest.fn().mockResolvedValue({ id: 'event_123' })
      };
      SecurityEvent.mockImplementation(() => mockSecurityEvent);

      // Mock Date to return 3 AM
      const originalDate = global.Date;
      global.Date = class extends Date {
        constructor() { super(); }
        getHours() { return 3; }
        static now() { return originalDate.now(); }
      };

      const result = await SecurityService.detectSuspiciousActivity(1, {
        riskScore: 30,
        ipAddress: '192.168.1.1'
      });

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('unusual_access_time');
      expect(result[0].severity).toBe('medium');

      global.Date = originalDate;
    });

    it('should detect high risk score', async () => {
      const SecurityEvent = require('../models/SecurityEvent');
      const mockSecurityEvent = {
        create: jest.fn().mockResolvedValue({ id: 'event_123' })
      };
      SecurityEvent.mockImplementation(() => mockSecurityEvent);

      const result = await SecurityService.detectSuspiciousActivity(1, {
        riskScore: 85,
        riskFactors: ['new_device', 'new_location'],
        ipAddress: '192.168.1.1'
      });

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('high_risk_score');
      expect(result[0].severity).toBe('high');
    });
  });

  describe('cleanupExpiredEvents', () => {
    it('should clean up expired resolved events', async () => {
      const expiredEvents = [{ id: 'event1' }, { id: 'event2' }];
      query.mockResolvedValue({ rows: expiredEvents });

      const result = await SecurityService.cleanupExpiredEvents(90);

      expect(result).toBe(2);
      expect(query).toHaveBeenCalledWith(
        'DELETE FROM authentication.security_events WHERE timestamp < $1 AND resolved = true RETURNING id',
        [expect.any(Date)]
      );
    });
  });

  describe('getSecurityStatistics', () => {
    it('should return security statistics for different timeframes', async () => {
      const mockStats = [
        { event_type: 'login_failure', severity: 'medium', count: '10', unresolved_count: '2' },
        { event_type: 'account_locked', severity: 'high', count: '3', unresolved_count: '1' }
      ];
      query.mockResolvedValue({ rows: mockStats });

      const result = await SecurityService.getSecurityStatistics('24h');

      expect(result).toEqual(mockStats);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('timestamp > NOW() - INTERVAL \'24 hours\''),
        []
      );
    });

    it('should handle different timeframe options', async () => {
      query.mockResolvedValue({ rows: [] });

      await SecurityService.getSecurityStatistics('1h');
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('timestamp > NOW() - INTERVAL \'1 hour\''),
        []
      );

      await SecurityService.getSecurityStatistics('7d');
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('timestamp > NOW() - INTERVAL \'7 days\''),
        []
      );
    });
  });

  describe('resolveSecurityEvent', () => {
    it('should resolve security event successfully', async () => {
      const mockEvent = {
        id: 'event_123',
        event_type: 'login_failure',
        resolved: true
      };
      query.mockResolvedValue({ rows: [mockEvent] });

      const result = await SecurityService.resolveSecurityEvent('event_123', 'admin_user', 'False positive');

      expect(result).toEqual(mockEvent);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE authentication.security_events'),
        ['event_123', 'admin_user', JSON.stringify({ resolution_notes: 'False positive' })]
      );
    });

    it('should throw error when event not found', async () => {
      query.mockResolvedValue({ rows: [] });

      await expect(
        SecurityService.resolveSecurityEvent('nonexistent', 'admin_user')
      ).rejects.toThrow('Security event not found');
    });
  });
});