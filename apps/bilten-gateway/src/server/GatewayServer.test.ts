import { GatewayServer } from './GatewayServer';
import { Logger } from '../utils/Logger';

// Mock dependencies
jest.mock('../utils/Logger');
jest.mock('../config/ConfigManager');
jest.mock('../routing/RouteManager');
jest.mock('../services/HealthCheckService');
jest.mock('../services/ServiceRegistry');

// Mock middleware
jest.mock('../middleware/AuthenticationMiddleware', () => ({
  AuthenticationMiddleware: {
    authenticate: jest.fn(() => (_req: any, _res: any, next: any) => next())
  }
}));

jest.mock('../middleware/RateLimitMiddleware', () => ({
  RateLimitMiddleware: {
    createRateLimiter: jest.fn(() => (_req: any, _res: any, next: any) => next())
  }
}));

jest.mock('../middleware/MetricsMiddleware', () => ({
  MetricsMiddleware: {
    collectMetrics: jest.fn(() => (_req: any, _res: any, next: any) => next())
  }
}));

jest.mock('../middleware/ErrorHandler', () => ({
  ErrorHandler: {
    handleError: jest.fn(() => (_err: any, _req: any, _res: any, next: any) => next())
  }
}));

describe('GatewayServer', () => {
  let gatewayServer: GatewayServer;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock logger
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      http: jest.fn()
    } as any;

    (Logger.getInstance as jest.Mock).mockReturnValue(mockLogger);
    
    gatewayServer = new GatewayServer();
  });

  describe('initialization', () => {
    it('should create a new GatewayServer instance', () => {
      expect(gatewayServer).toBeInstanceOf(GatewayServer);
    });

    it('should initialize successfully', async () => {
      // Mock the initialize method dependencies
      const mockConfigManager = {
        loadConfig: jest.fn().mockResolvedValue(undefined),
        getAllowedOrigins: jest.fn().mockReturnValue(['http://localhost:3000']),
        getRateLimitConfig: jest.fn().mockReturnValue({
          windowMs: 60000,
          max: 100
        })
      };
      
      const mockServiceRegistry = {
        initialize: jest.fn().mockResolvedValue(undefined)
      };
      
      const mockHealthCheckService = {
        initialize: jest.fn().mockResolvedValue(undefined)
      };

      const mockRouteManager = {
        setupRoutes: jest.fn().mockResolvedValue(undefined)
      };

      // Replace the instances with mocks
      (gatewayServer as any).configManager = mockConfigManager;
      (gatewayServer as any).serviceRegistry = mockServiceRegistry;
      (gatewayServer as any).healthCheckService = mockHealthCheckService;
      (gatewayServer as any).routeManager = mockRouteManager;

      await gatewayServer.initialize();

      expect(mockConfigManager.loadConfig).toHaveBeenCalled();
      expect(mockServiceRegistry.initialize).toHaveBeenCalled();
      expect(mockHealthCheckService.initialize).toHaveBeenCalled();
      expect(mockRouteManager.setupRoutes).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Initializing API Gateway...');
      expect(mockLogger.info).toHaveBeenCalledWith('API Gateway initialization completed');
    });

    it('should handle initialization errors', async () => {
      const mockError = new Error('Initialization failed');
      
      const mockConfigManager = {
        loadConfig: jest.fn().mockRejectedValue(mockError)
      };

      (gatewayServer as any).configManager = mockConfigManager;

      await expect(gatewayServer.initialize()).rejects.toThrow('Initialization failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to initialize API Gateway:', mockError);
    });
  });
});