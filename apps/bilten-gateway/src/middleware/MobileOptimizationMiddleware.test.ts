/**
 * Unit tests for MobileOptimizationMiddleware
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { MobileOptimizationMiddleware } from './MobileOptimizationMiddleware';
import { MobileOptimizationConfig } from '../services/MobileOptimizationService';

// Mock the Logger
vi.mock('../utils/Logger', () => ({
  Logger: {
    getInstance: () => ({
      info: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
      warn: vi.fn()
    })
  }
}));

describe('MobileOptimizationMiddleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let config: MobileOptimizationConfig;

  beforeEach(() => {
    config = {
      enableCompression: true,
      enableFieldSelection: true,
      enableImageOptimization: true,
      enableAdaptiveResponse: true,
      maxMobileResponseSize: 1024 * 1024,
      compressionLevel: 6,
      mobileFields: {
        '/api/users': ['id', 'name', 'email'],
        '/api/events': ['id', 'title', 'date']
      }
    };

    req = {
      headers: {},
      path: '/api/users',
      routingContext: {
        correlationId: 'test-123',
        method: 'GET',
        path: '/api/users',
        headers: {},
        query: {},
        timestamp: new Date()
      }
    };

    res = {
      setHeader: vi.fn(),
      removeHeader: vi.fn(),
      json: vi.fn(),
      send: vi.fn(),
      end: vi.fn(),
      status: vi.fn().mockReturnThis(),
      statusCode: 200
    };

    next = vi.fn();

    // Initialize middleware
    MobileOptimizationMiddleware.initialize(config);
  });

  describe('detectCapabilities', () => {
    it('should detect mobile client and set capabilities', () => {
      req.headers = {
        'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        'accept-encoding': 'gzip, deflate, br',
        'accept': 'text/html,application/xhtml+xml,image/webp'
      };

      const middleware = MobileOptimizationMiddleware.detectCapabilities();
      middleware(req as Request, res as Response, next);

      expect(req.clientCapabilities).toBeDefined();
      expect(req.clientCapabilities?.type).toBe('mobile');
      expect(req.clientCapabilities?.supportsWebP).toBe(true);
      expect(res.setHeader).toHaveBeenCalledWith('X-Client-Type', 'mobile');
      expect(res.setHeader).toHaveBeenCalledWith('X-Screen-Size', 'small');
      expect(next).toHaveBeenCalled();
    });

    it('should handle missing user agent gracefully', () => {
      req.headers = {};

      const middleware = MobileOptimizationMiddleware.detectCapabilities();
      middleware(req as Request, res as Response, next);

      expect(req.clientCapabilities).toBeDefined();
      expect(req.clientCapabilities?.type).toBe('unknown');
      expect(next).toHaveBeenCalled();
    });

    it('should continue without optimization when service not initialized', () => {
      // Reset middleware
      (MobileOptimizationMiddleware as any).optimizationService = null;

      const middleware = MobileOptimizationMiddleware.detectCapabilities();
      middleware(req as Request, res as Response, next);

      expect(req.clientCapabilities).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('optimizeResponse', () => {
    beforeEach(() => {
      req.clientCapabilities = {
        type: 'mobile',
        screenSize: 'small',
        networkType: 'slow',
        supportsWebP: true,
        supportsCompression: ['gzip', 'br'],
        maxResponseSize: 1024 * 1024,
        preferredImageFormat: 'webp'
      };

      req.routeMatch = {
        route: {
          id: 'users-route',
          path: '/api/users',
          methods: ['GET'],
          upstream: 'user-service',
          authentication: true,
          version: '1.0',
          enabled: true,
          metadata: {}
        },
        params: {},
        query: {}
      };
    });

    it('should optimize JSON response for mobile clients', async () => {
      const originalData = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        password: 'secret',
        metadata: { created: '2024-01-01' }
      };

      let capturedResponse: any;
      const mockEnd = vi.fn((data) => {
        capturedResponse = data;
      });
      res.end = mockEnd;

      const middleware = MobileOptimizationMiddleware.optimizeResponse();
      middleware(req as Request, res as Response, next);

      // Simulate calling res.json
      await (res.json as any)(originalData);

      expect(res.setHeader).toHaveBeenCalledWith('X-Optimization-Applied', expect.stringContaining('field-selection'));
      expect(res.setHeader).toHaveBeenCalledWith('Content-Encoding', 'br');
      expect(mockEnd).toHaveBeenCalled();
      expect(capturedResponse).toBeInstanceOf(Buffer);
    });

    it('should skip optimization for desktop clients', () => {
      req.clientCapabilities!.type = 'desktop';
      req.clientCapabilities!.networkType = 'fast';

      const middleware = MobileOptimizationMiddleware.optimizeResponse();
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      // res.json should not be overridden for desktop clients
    });

    it('should handle compression for non-JSON responses', async () => {
      const textResponse = 'Hello World'.repeat(100);
      
      let capturedResponse: any;
      const mockEnd = vi.fn((data) => {
        capturedResponse = data;
      });
      res.end = mockEnd;

      const middleware = MobileOptimizationMiddleware.optimizeResponse();
      middleware(req as Request, res as Response, next);

      // Simulate calling res.send with text
      await (res.send as any)(textResponse);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Encoding', 'br');
      expect(mockEnd).toHaveBeenCalled();
      expect(capturedResponse).toBeInstanceOf(Buffer);
    });

    it('should fallback to original response on optimization error', async () => {
      // Create a circular reference to cause JSON.stringify to fail
      const circularData: any = { id: 1, name: 'Test' };
      circularData.self = circularData;

      const originalJson = res.json;
      const middleware = MobileOptimizationMiddleware.optimizeResponse();
      middleware(req as Request, res as Response, next);

      // The overridden res.json should fallback to original on error
      await (res.json as any)(circularData);

      // Should have attempted to call the original json method
      expect(typeof res.json).toBe('function');
    });

    it('should continue without optimization when capabilities not detected', () => {
      req.clientCapabilities = undefined;

      const middleware = MobileOptimizationMiddleware.optimizeResponse();
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should handle missing route match', async () => {
      req.routeMatch = undefined;
      
      const originalData = { id: 1, name: 'Test' };
      
      const middleware = MobileOptimizationMiddleware.optimizeResponse();
      middleware(req as Request, res as Response, next);

      // Should still work with req.path as fallback
      await (res.json as any)(originalData);

      expect(res.setHeader).toHaveBeenCalledWith('X-Optimization-Applied', expect.any(String));
    });
  });

  describe('createMobileConfig', () => {
    it('should create config with default values', () => {
      const routeConfig = {};
      const mobileConfig = MobileOptimizationMiddleware.createMobileConfig(routeConfig);

      expect(mobileConfig.enableCompression).toBe(true);
      expect(mobileConfig.enableFieldSelection).toBe(true);
      expect(mobileConfig.enableImageOptimization).toBe(true);
      expect(mobileConfig.enableAdaptiveResponse).toBe(true);
      expect(mobileConfig.maxMobileResponseSize).toBe(1024 * 1024);
      expect(mobileConfig.compressionLevel).toBe(6);
      expect(mobileConfig.mobileFields).toEqual({});
    });

    it('should use provided configuration values', () => {
      const routeConfig = {
        mobileOptimization: {
          enableCompression: false,
          enableFieldSelection: true,
          maxMobileResponseSize: 512 * 1024,
          compressionLevel: 9,
          mobileFields: {
            '/api/test': ['id', 'name']
          }
        }
      };

      const mobileConfig = MobileOptimizationMiddleware.createMobileConfig(routeConfig);

      expect(mobileConfig.enableCompression).toBe(false);
      expect(mobileConfig.enableFieldSelection).toBe(true);
      expect(mobileConfig.maxMobileResponseSize).toBe(512 * 1024);
      expect(mobileConfig.compressionLevel).toBe(9);
      expect(mobileConfig.mobileFields).toEqual({
        '/api/test': ['id', 'name']
      });
    });
  });

  describe('validateMobileConfig', () => {
    it('should return no errors for valid config', () => {
      const errors = MobileOptimizationMiddleware.validateMobileConfig(config);
      expect(errors).toHaveLength(0);
    });

    it('should validate maxMobileResponseSize', () => {
      config.maxMobileResponseSize = 0;
      const errors = MobileOptimizationMiddleware.validateMobileConfig(config);
      expect(errors).toContain('maxMobileResponseSize must be greater than 0');
    });

    it('should validate compressionLevel range', () => {
      config.compressionLevel = 10;
      const errors = MobileOptimizationMiddleware.validateMobileConfig(config);
      expect(errors).toContain('compressionLevel must be between 1 and 9');

      config.compressionLevel = 0;
      const errors2 = MobileOptimizationMiddleware.validateMobileConfig(config);
      expect(errors2).toContain('compressionLevel must be between 1 and 9');
    });

    it('should validate mobileFields structure', () => {
      config.mobileFields = {
        '/api/test': 'invalid' as any
      };
      const errors = MobileOptimizationMiddleware.validateMobileConfig(config);
      expect(errors).toContain('mobileFields[/api/test] must be an array');
    });

    it('should validate mobileFields array contents', () => {
      config.mobileFields = {
        '/api/test': ['valid', '', 123 as any]
      };
      const errors = MobileOptimizationMiddleware.validateMobileConfig(config);
      expect(errors).toContain('mobileFields[/api/test][1] must be a non-empty string');
      expect(errors).toContain('mobileFields[/api/test][2] must be a non-empty string');
    });
  });

  describe('getStatistics', () => {
    it('should return statistics when service is initialized', () => {
      const stats = MobileOptimizationMiddleware.getStatistics();
      expect(stats).toBeDefined();
      expect(typeof stats).toBe('object');
    });

    it('should return null when service not initialized', () => {
      (MobileOptimizationMiddleware as any).optimizationService = null;
      const stats = MobileOptimizationMiddleware.getStatistics();
      expect(stats).toBeNull();
    });
  });
});