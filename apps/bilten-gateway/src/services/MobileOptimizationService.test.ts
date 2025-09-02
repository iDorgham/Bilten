/**
 * Unit tests for MobileOptimizationService
 */

import { Request } from 'express';
import { MobileOptimizationService, MobileOptimizationConfig, ClientCapabilities } from './MobileOptimizationService';

describe('MobileOptimizationService', () => {
  let service: MobileOptimizationService;
  let config: MobileOptimizationConfig;

  beforeEach(() => {
    config = {
      enableCompression: true,
      enableFieldSelection: true,
      enableImageOptimization: true,
      enableAdaptiveResponse: true,
      maxMobileResponseSize: 1024 * 1024, // 1MB
      compressionLevel: 6,
      mobileFields: {
        '/api/users': ['id', 'name', 'email'],
        '/api/events': ['id', 'title', 'date', 'location.name']
      }
    };
    service = new MobileOptimizationService(config);
  });

  describe('detectClientCapabilities', () => {
    it('should detect mobile client from user agent', () => {
      const req = {
        headers: {
          'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
          'accept-encoding': 'gzip, deflate, br',
          'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        }
      } as Partial<Request> as Request;

      const capabilities = service.detectClientCapabilities(req);

      expect(capabilities.type).toBe('mobile');
      expect(capabilities.screenSize).toBe('small');
      expect(capabilities.supportsWebP).toBe(true);
      expect(capabilities.supportsCompression).toContain('gzip');
      expect(capabilities.supportsCompression).toContain('br');
      expect(capabilities.maxResponseSize).toBeLessThan(10 * 1024 * 1024);
    });

    it('should detect tablet client', () => {
      const req = {
        headers: {
          'user-agent': 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
          'accept-encoding': 'gzip, deflate',
          'accept': 'text/html,application/xhtml+xml'
        }
      } as Partial<Request> as Request;

      const capabilities = service.detectClientCapabilities(req);

      expect(capabilities.type).toBe('tablet');
      expect(capabilities.screenSize).toBe('medium');
      expect(capabilities.supportsWebP).toBe(false);
      expect(capabilities.supportsCompression).toContain('gzip');
      expect(capabilities.supportsCompression).not.toContain('br');
    });

    it('should detect desktop client', () => {
      const req = {
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'accept-encoding': 'gzip, deflate, br',
          'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8'
        }
      } as Partial<Request> as Request;

      const capabilities = service.detectClientCapabilities(req);

      expect(capabilities.type).toBe('desktop');
      expect(capabilities.screenSize).toBe('large');
      expect(capabilities.supportsWebP).toBe(true);
      expect(capabilities.networkType).toBe('fast');
    });

    it('should handle missing headers gracefully', () => {
      const req = { headers: {} } as Request;

      const capabilities = service.detectClientCapabilities(req);

      expect(capabilities.type).toBe('unknown');
      expect(capabilities.supportsCompression).toHaveLength(0);
      expect(capabilities.supportsWebP).toBe(false);
    });

    it('should detect slow network for mobile', () => {
      const req = {
        headers: {
          'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
          'connection-type': '3g'
        }
      } as Partial<Request> as Request;

      const capabilities = service.detectClientCapabilities(req);

      expect(capabilities.networkType).toBe('slow');
      expect(capabilities.maxResponseSize).toBe(1 * 1024 * 1024); // 1MB for slow mobile
    });
  });

  describe('optimizeResponse', () => {
    let mobileCapabilities: ClientCapabilities;

    beforeEach(() => {
      mobileCapabilities = {
        type: 'mobile',
        screenSize: 'small',
        networkType: 'slow',
        supportsWebP: true,
        supportsCompression: ['gzip', 'br'],
        maxResponseSize: 1024 * 1024,
        preferredImageFormat: 'webp'
      };
    });

    it('should apply field selection for mobile clients', async () => {
      const originalData = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        password: 'secret',
        internalId: 'internal123',
        metadata: { created: '2024-01-01' }
      };

      const { data: optimizedData, result } = await service.optimizeResponse(
        originalData,
        mobileCapabilities,
        '/api/users'
      );

      expect(optimizedData).toEqual({
        id: 1,
        name: 'John Doe',
        email: 'john@example.com'
      });
      expect(result.optimizationApplied).toContain('field-selection');
      expect(result.fieldsRemoved).toBeGreaterThan(0);
      expect(result.optimizedSize).toBeLessThan(result.originalSize);
    });

    it('should handle nested field selection', async () => {
      const originalData = {
        id: 1,
        title: 'Event Title',
        date: '2024-01-01',
        location: {
          name: 'Venue Name',
          address: '123 Main St',
          coordinates: { lat: 40.7128, lng: -74.0060 }
        },
        organizer: {
          name: 'Organizer',
          email: 'org@example.com'
        }
      };

      const { data: optimizedData } = await service.optimizeResponse(
        originalData,
        mobileCapabilities,
        '/api/events'
      );

      expect(optimizedData).toEqual({
        id: 1,
        title: 'Event Title',
        date: '2024-01-01',
        location: {
          name: 'Venue Name'
        }
      });
    });

    it('should handle arrays in response data', async () => {
      const originalData = [
        { id: 1, name: 'User 1', email: 'user1@example.com', password: 'secret1' },
        { id: 2, name: 'User 2', email: 'user2@example.com', password: 'secret2' }
      ];

      const { data: optimizedData } = await service.optimizeResponse(
        originalData,
        mobileCapabilities,
        '/api/users'
      );

      expect(optimizedData).toHaveLength(2);
      expect(optimizedData[0]).toEqual({
        id: 1,
        name: 'User 1',
        email: 'user1@example.com'
      });
      expect(optimizedData[1]).toEqual({
        id: 2,
        name: 'User 2',
        email: 'user2@example.com'
      });
    });

    it('should apply adaptive response sizing for slow mobile', async () => {
      const originalData = {
        items: Array.from({ length: 50 }, (_, i) => ({ id: i, name: `Item ${i}` }))
      };

      const { data: optimizedData, result } = await service.optimizeResponse(
        originalData,
        mobileCapabilities,
        '/api/items'
      );

      expect(optimizedData.items).toHaveLength(10); // Limited to 10 for slow mobile
      expect(result.optimizationApplied).toContain('adaptive-sizing');
    });

    it('should optimize image URLs', async () => {
      const originalData = {
        id: 1,
        name: 'Product',
        image: '/images/product.jpg',
        gallery: [
          '/images/gallery1.png',
          '/images/gallery2.jpeg'
        ]
      };

      const { data: optimizedData, result } = await service.optimizeResponse(
        originalData,
        mobileCapabilities,
        '/api/products'
      );

      expect(optimizedData.image).toContain('format=webp');
      expect(optimizedData.image).toContain('quality=60');
      expect(optimizedData.image).toContain('width=400');
      expect(optimizedData.gallery[0]).toContain('format=webp');
      expect(result.optimizationApplied).toContain('image-optimization');
    });

    it('should not optimize for desktop clients', async () => {
      const desktopCapabilities: ClientCapabilities = {
        type: 'desktop',
        screenSize: 'large',
        networkType: 'fast',
        supportsWebP: true,
        supportsCompression: ['gzip', 'br'],
        maxResponseSize: 10 * 1024 * 1024,
        preferredImageFormat: 'webp'
      };

      const originalData = { id: 1, name: 'Test', extra: 'data' };

      const { data: optimizedData, result } = await service.optimizeResponse(
        originalData,
        desktopCapabilities,
        '/api/test'
      );

      expect(optimizedData).toEqual(originalData);
      expect(result.optimizationApplied).not.toContain('field-selection');
    });
  });

  describe('compressResponse', () => {
    it('should compress with brotli when supported', async () => {
      const capabilities: ClientCapabilities = {
        type: 'mobile',
        screenSize: 'small',
        networkType: 'fast',
        supportsWebP: false,
        supportsCompression: ['gzip', 'deflate', 'br'],
        maxResponseSize: 1024 * 1024,
        preferredImageFormat: 'jpeg'
      };

      const data = JSON.stringify({ message: 'Hello World'.repeat(100) });
      const { compressed, encoding } = await service.compressResponse(data, capabilities);

      expect(encoding).toBe('br');
      expect(compressed.length).toBeLessThan(Buffer.byteLength(data));
    });

    it('should fallback to gzip when brotli not supported', async () => {
      const capabilities: ClientCapabilities = {
        type: 'mobile',
        screenSize: 'small',
        networkType: 'fast',
        supportsWebP: false,
        supportsCompression: ['gzip', 'deflate'],
        maxResponseSize: 1024 * 1024,
        preferredImageFormat: 'jpeg'
      };

      const data = JSON.stringify({ message: 'Hello World'.repeat(100) });
      const { compressed, encoding } = await service.compressResponse(data, capabilities);

      expect(encoding).toBe('gzip');
      expect(compressed.length).toBeLessThan(Buffer.byteLength(data));
    });

    it('should return identity when no compression supported', async () => {
      const capabilities: ClientCapabilities = {
        type: 'mobile',
        screenSize: 'small',
        networkType: 'fast',
        supportsWebP: false,
        supportsCompression: [],
        maxResponseSize: 1024 * 1024,
        preferredImageFormat: 'jpeg'
      };

      const data = 'Hello World';
      const { compressed, encoding } = await service.compressResponse(data, capabilities);

      expect(encoding).toBe('identity');
      expect(compressed.toString()).toBe(data);
    });
  });

  describe('field selection edge cases', () => {
    it('should handle null and undefined values', async () => {
      const originalData = {
        id: 1,
        name: null,
        email: undefined,
        active: true
      };

      const { data: optimizedData } = await service.optimizeResponse(
        originalData,
        {
          type: 'mobile',
          screenSize: 'small',
          networkType: 'slow',
          supportsWebP: false,
          supportsCompression: [],
          maxResponseSize: 1024 * 1024,
          preferredImageFormat: 'jpeg'
        },
        '/api/users'
      );

      expect(optimizedData).toEqual({
        id: 1,
        name: null
        // email should be excluded as it's undefined
      });
    });

    it('should handle deeply nested objects', async () => {
      const originalData = {
        user: {
          profile: {
            personal: {
              name: 'John',
              age: 30
            },
            settings: {
              theme: 'dark'
            }
          }
        }
      };

      // Configure nested field selection
      config.mobileFields['/api/nested'] = ['user.profile.personal.name'];
      service = new MobileOptimizationService(config);

      const { data: optimizedData } = await service.optimizeResponse(
        originalData,
        {
          type: 'mobile',
          screenSize: 'small',
          networkType: 'slow',
          supportsWebP: false,
          supportsCompression: [],
          maxResponseSize: 1024 * 1024,
          preferredImageFormat: 'jpeg'
        },
        '/api/nested'
      );

      expect(optimizedData).toEqual({
        user: {
          profile: {
            personal: {
              name: 'John'
            }
          }
        }
      });
    });
  });

  describe('image optimization', () => {
    it('should not modify non-image URLs', async () => {
      const originalData = {
        id: 1,
        apiUrl: '/api/users/1',
        documentUrl: '/documents/file.pdf'
      };

      const { data: optimizedData } = await service.optimizeResponse(
        originalData,
        {
          type: 'mobile',
          screenSize: 'small',
          networkType: 'slow',
          supportsWebP: true,
          supportsCompression: [],
          maxResponseSize: 1024 * 1024,
          preferredImageFormat: 'webp'
        },
        '/api/test'
      );

      expect(optimizedData.apiUrl).toBe('/api/users/1');
      expect(optimizedData.documentUrl).toBe('/documents/file.pdf');
    });

    it('should handle image URLs with existing query parameters', async () => {
      const originalData = {
        image: '/images/photo.jpg?version=1&cache=false'
      };

      const { data: optimizedData } = await service.optimizeResponse(
        originalData,
        {
          type: 'mobile',
          screenSize: 'small',
          networkType: 'slow',
          supportsWebP: true,
          supportsCompression: [],
          maxResponseSize: 1024 * 1024,
          preferredImageFormat: 'webp'
        },
        '/api/test'
      );

      expect(optimizedData.image).toContain('version=1');
      expect(optimizedData.image).toContain('cache=false');
      expect(optimizedData.image).toContain('format=webp');
      expect(optimizedData.image).toContain('quality=60');
    });
  });
});