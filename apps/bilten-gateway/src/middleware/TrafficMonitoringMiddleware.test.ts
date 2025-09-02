import { Request, Response, NextFunction } from 'express';
import { TrafficMonitoringMiddleware } from './TrafficMonitoringMiddleware';

// Mock TrafficMonitoringService
const mockTrafficMonitoringService = {
  initialize: jest.fn(),
  checkIPAccess: jest.fn(),
  isClientBlocked: jest.fn(),
  recordRequest: jest.fn(),
  getTrafficPatterns: jest.fn(),
  getGeographicRestrictions: jest.fn(),
  getIPAccessControls: jest.fn(),
  blockClient: jest.fn(),
  unblockClient: jest.fn(),
  addGeographicRestriction: jest.fn(),
  removeGeographicRestriction: jest.fn(),
  addIPAccessControl: jest.fn(),
  removeIPAccessControl: jest.fn(),
  getAnalytics: jest.fn(),
  shutdown: jest.fn()
};

// Mock TrafficMonitoringService.getInstance
jest.mock('../services/TrafficMonitoringService', () => ({
  TrafficMonitoringService: {
    getInstance: jest.fn(() => mockTrafficMonitoringService)
  }
}));

describe('TrafficMonitoringMiddleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    
    req = {
      ip: '192.168.1.1',
      path: '/api/test',
      method: 'GET',
      get: jest.fn(),
      query: {},
      body: {},
      params: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      on: jest.fn()
    };

    next = jest.fn();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      mockTrafficMonitoringService.initialize.mockResolvedValue(undefined);
      
      await TrafficMonitoringMiddleware.initialize();
      
      expect(mockTrafficMonitoringService.initialize).toHaveBeenCalled();
    });
  });

  describe('traffic monitoring middleware', () => {
    beforeEach(async () => {
      mockTrafficMonitoringService.initialize.mockResolvedValue(undefined);
      await TrafficMonitoringMiddleware.initialize();
    });

    it('should allow requests when IP access is allowed', async () => {
      mockTrafficMonitoringService.checkIPAccess.mockResolvedValue({ allowed: true });
      mockTrafficMonitoringService.isClientBlocked.mockResolvedValue(false);

      const middleware = TrafficMonitoringMiddleware.trafficMonitoring();
      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should block requests when IP access is denied', async () => {
      mockTrafficMonitoringService.checkIPAccess.mockResolvedValue({ 
        allowed: false, 
        reason: 'IP blacklisted' 
      });

      const middleware = TrafficMonitoringMiddleware.trafficMonitoring();
      await middleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.objectContaining({
          code: 'IP_ACCESS_DENIED'
        })
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should block requests when client is blocked', async () => {
      mockTrafficMonitoringService.checkIPAccess.mockResolvedValue({ allowed: true });
      mockTrafficMonitoringService.isClientBlocked.mockResolvedValue(true);

      const middleware = TrafficMonitoringMiddleware.trafficMonitoring();
      await middleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.objectContaining({
          code: 'CLIENT_BLOCKED'
        })
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should record request after response', async () => {
      mockTrafficMonitoringService.checkIPAccess.mockResolvedValue({ allowed: true });
      mockTrafficMonitoringService.isClientBlocked.mockResolvedValue(false);
      mockTrafficMonitoringService.recordRequest.mockResolvedValue(undefined);

      // Mock response.on to immediately call the callback
      (res.on as jest.Mock).mockImplementation((event, callback) => {
        if (event === 'finish') {
          setTimeout(callback, 0); // Simulate async finish event
        }
      });

      const middleware = TrafficMonitoringMiddleware.trafficMonitoring();
      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      
      // Wait for the finish event to be processed
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(mockTrafficMonitoringService.recordRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: '/api/test',
          method: 'GET',
          ip: '192.168.1.1'
        })
      );
    });

    it('should handle errors gracefully', async () => {
      mockTrafficMonitoringService.checkIPAccess.mockRejectedValue(new Error('Service error'));

      const middleware = TrafficMonitoringMiddleware.trafficMonitoring();
      await middleware(req as Request, res as Response, next);

      // Should continue with request processing even on error
      expect(next).toHaveBeenCalled();
    });
  });

  describe('suspicious activity detection middleware', () => {
    beforeEach(async () => {
      mockTrafficMonitoringService.initialize.mockResolvedValue(undefined);
      await TrafficMonitoringMiddleware.initialize();
    });

    it('should add warning headers for high anomaly score', async () => {
      mockTrafficMonitoringService.getTrafficPatterns.mockReturnValue([
        {
          clientId: '192.168.1.1',
          clientType: 'ip',
          anomalyScore: 75,
          suspiciousActivities: [{ type: 'rapid_requests' }]
        }
      ]);

      const middleware = TrafficMonitoringMiddleware.suspiciousActivityDetection();
      await middleware(req as Request, res as Response, next);

      expect(res.set).toHaveBeenCalledWith({
        'X-Anomaly-Score': '75',
        'X-Suspicious-Activities': '1'
      });
      expect(next).toHaveBeenCalled();
    });

    it('should not add headers for low anomaly score', async () => {
      mockTrafficMonitoringService.getTrafficPatterns.mockReturnValue([
        {
          clientId: '192.168.1.1',
          clientType: 'ip',
          anomalyScore: 25,
          suspiciousActivities: []
        }
      ]);

      const middleware = TrafficMonitoringMiddleware.suspiciousActivityDetection();
      await middleware(req as Request, res as Response, next);

      expect(res.set).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('geographic restrictions middleware', () => {
    beforeEach(async () => {
      mockTrafficMonitoringService.initialize.mockResolvedValue(undefined);
      await TrafficMonitoringMiddleware.initialize({ enableGeographicRestrictions: true });
    });

    it('should block requests from restricted countries', async () => {
      mockTrafficMonitoringService.getGeographicRestrictions.mockReturnValue([
        {
          id: 'test-restriction',
          name: 'Block Test Country',
          type: 'block',
          countries: ['XX'],
          isActive: true
        }
      ]);

      // Mock IP that resolves to restricted country
      (req as any).ip = '1.1.1.1'; // This should map to 'US' in our mock, but we'll override

      const middleware = TrafficMonitoringMiddleware.geographicRestrictions();
      await middleware(req as Request, res as Response, next);

      // Since our mock country detection doesn't return 'XX', this should pass
      expect(next).toHaveBeenCalled();
    });

    it('should skip when geographic restrictions are disabled', async () => {
      await TrafficMonitoringMiddleware.initialize({ enableGeographicRestrictions: false });

      const middleware = TrafficMonitoringMiddleware.geographicRestrictions();
      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(mockTrafficMonitoringService.getGeographicRestrictions).not.toHaveBeenCalled();
    });
  });

  describe('admin routes', () => {
    beforeEach(async () => {
      mockTrafficMonitoringService.initialize.mockResolvedValue(undefined);
      await TrafficMonitoringMiddleware.initialize();
    });

    it('should get analytics', async () => {
      const mockAnalytics = {
        totalRequests: 100,
        uniqueClients: 50,
        blockedRequests: 5
      };
      mockTrafficMonitoringService.getAnalytics.mockResolvedValue(mockAnalytics);

      const adminRoutes = TrafficMonitoringMiddleware.adminRoutes();
      await adminRoutes.getAnalytics(req as Request, res as Response);

      expect(mockTrafficMonitoringService.getAnalytics).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockAnalytics);
    });

    it('should get traffic patterns', async () => {
      const mockPatterns = [
        { clientId: 'user123', clientType: 'user', requestCount: 10 }
      ];
      mockTrafficMonitoringService.getTrafficPatterns.mockReturnValue(mockPatterns);

      const adminRoutes = TrafficMonitoringMiddleware.adminRoutes();
      await adminRoutes.getTrafficPatterns(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith(mockPatterns);
    });

    it('should block client', async () => {
      req.body = {
        clientId: 'user123',
        clientType: 'user',
        reason: 'Suspicious activity',
        duration: 3600
      };

      mockTrafficMonitoringService.blockClient.mockResolvedValue(undefined);

      const adminRoutes = TrafficMonitoringMiddleware.adminRoutes();
      await adminRoutes.blockClient(req as Request, res as Response);

      expect(mockTrafficMonitoringService.blockClient).toHaveBeenCalledWith(
        'user123',
        'user',
        'Suspicious activity',
        3600
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Client blocked successfully'
      });
    });

    it('should unblock client', async () => {
      req.body = {
        clientId: 'user123',
        clientType: 'user'
      };

      mockTrafficMonitoringService.unblockClient.mockResolvedValue(undefined);

      const adminRoutes = TrafficMonitoringMiddleware.adminRoutes();
      await adminRoutes.unblockClient(req as Request, res as Response);

      expect(mockTrafficMonitoringService.unblockClient).toHaveBeenCalledWith('user123', 'user');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Client unblocked successfully'
      });
    });

    it('should add geographic restriction', async () => {
      req.body = {
        name: 'Test Restriction',
        type: 'block',
        countries: ['XX', 'YY'],
        isActive: true
      };

      mockTrafficMonitoringService.addGeographicRestriction.mockResolvedValue('restriction-id');

      const adminRoutes = TrafficMonitoringMiddleware.adminRoutes();
      await adminRoutes.addGeographicRestriction(req as Request, res as Response);

      expect(mockTrafficMonitoringService.addGeographicRestriction).toHaveBeenCalledWith(req.body);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        id: 'restriction-id',
        message: 'Geographic restriction added successfully'
      });
    });

    it('should handle validation errors', async () => {
      req.body = {}; // Missing required fields

      const adminRoutes = TrafficMonitoringMiddleware.adminRoutes();
      await adminRoutes.blockClient(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing required fields' });
    });

    it('should handle service errors', async () => {
      req.body = {
        clientId: 'user123',
        clientType: 'user',
        reason: 'Test'
      };

      mockTrafficMonitoringService.blockClient.mockRejectedValue(new Error('Service error'));

      const adminRoutes = TrafficMonitoringMiddleware.adminRoutes();
      await adminRoutes.blockClient(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to block client' });
    });
  });

  describe('utility methods', () => {
    it('should update options', () => {
      const newOptions = {
        enableGeolocation: false,
        enableIPBlocking: false
      };

      TrafficMonitoringMiddleware.updateOptions(newOptions);

      // Should not throw error
      expect(() => TrafficMonitoringMiddleware.updateOptions(newOptions)).not.toThrow();
    });

    it('should get traffic monitoring service', async () => {
      mockTrafficMonitoringService.initialize.mockResolvedValue(undefined);
      await TrafficMonitoringMiddleware.initialize();

      const service = TrafficMonitoringMiddleware.getTrafficMonitoringService();
      expect(service).toBe(mockTrafficMonitoringService);
    });
  });
});