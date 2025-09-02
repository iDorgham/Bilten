/**
 * Tests for TransformationManager
 */

import { TransformationManager, TransformationConfig } from './TransformationManager';
import { readFileSync } from 'fs';

// Mock Logger
jest.mock('../utils/Logger', () => ({
  Logger: {
    getInstance: () => ({
      debug: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn()
    })
  }
}));

// Mock fs
jest.mock('fs', () => ({
  readFileSync: jest.fn()
}));

const mockReadFileSync = readFileSync as jest.MockedFunction<typeof readFileSync>;

describe('TransformationManager', () => {
  let transformationManager: TransformationManager;

  beforeEach(() => {
    transformationManager = new TransformationManager();
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize successfully with valid configuration', async () => {
      const mockConfig = {
        transformations: {
          'test-rule': {
            routePattern: '/api/users/*',
            request: {
              addHeaders: { 'X-Test': 'value' }
            }
          }
        },
        globalTransformations: {
          'security': {
            response: {
              addHeaders: { 'X-Security': 'enabled' }
            }
          }
        }
      };

      mockReadFileSync.mockReturnValue(JSON.stringify(mockConfig));

      await transformationManager.initialize();

      expect(mockReadFileSync).toHaveBeenCalled();
    });

    it('should handle invalid JSON configuration', async () => {
      mockReadFileSync.mockReturnValue('invalid json');

      await expect(transformationManager.initialize()).rejects.toThrow();
    });

    it('should skip invalid transformation rules', async () => {
      const mockConfig = {
        transformations: {
          'valid-rule': {
            routePattern: '/api/users/*',
            request: {
              addHeaders: { 'X-Valid': 'value' }
            }
          },
          'invalid-rule': {
            routePattern: '/api/invalid/*',
            request: {
              addHeaders: { 'Invalid Header!': 'value' }
            }
          }
        }
      };

      mockReadFileSync.mockReturnValue(JSON.stringify(mockConfig));

      await transformationManager.initialize();

      // Should only have the valid rule
      const stats = transformationManager.getStatistics();
      expect(stats.totalRules).toBe(1);
    });
  });

  describe('getTransformationForRoute', () => {
    beforeEach(async () => {
      const mockConfig = {
        transformations: {
          'user-service': {
            routePattern: '/api/users/*',
            request: {
              addHeaders: { 'X-Service': 'user' }
            }
          },
          'event-service': {
            routePattern: '/api/events/*',
            request: {
              addHeaders: { 'X-Service': 'event' }
            }
          }
        },
        globalTransformations: {
          'security': {
            response: {
              addHeaders: { 'X-Security': 'enabled' }
            }
          }
        }
      };

      mockReadFileSync.mockReturnValue(JSON.stringify(mockConfig));
      await transformationManager.initialize();
    });

    it('should return transformation rule for matching route', () => {
      const transformation = transformationManager.getTransformationForRoute('/api/users/123');

      expect(transformation).toBeDefined();
      expect(transformation?.requestTransform?.addHeaders?.['X-Service']).toBe('user');
      expect(transformation?.responseTransform?.addHeaders?.['X-Security']).toBe('enabled');
    });

    it('should return null for non-matching route', () => {
      const transformation = transformationManager.getTransformationForRoute('/api/unknown/path');

      expect(transformation).toBeDefined(); // Should have global transformations
      expect(transformation?.requestTransform).toBeUndefined();
      expect(transformation?.responseTransform?.addHeaders?.['X-Security']).toBe('enabled');
    });

    it('should return only global transformations when no specific rule matches', () => {
      const transformation = transformationManager.getTransformationForRoute('/api/other/path');

      expect(transformation).toBeDefined();
      expect(transformation?.responseTransform?.addHeaders?.['X-Security']).toBe('enabled');
    });
  });

  describe('addTransformationRule', () => {
    beforeEach(async () => {
      mockReadFileSync.mockReturnValue(JSON.stringify({ transformations: {} }));
      await transformationManager.initialize();
    });

    it('should add valid transformation rule', () => {
      const config: TransformationConfig = {
        routePattern: '/api/test/*',
        request: {
          addHeaders: { 'X-Test': 'value' }
        }
      };

      transformationManager.addTransformationRule('test-rule', config);

      const transformation = transformationManager.getTransformationForRoute('/api/test/123');
      expect(transformation?.requestTransform?.addHeaders?.['X-Test']).toBe('value');
    });

    it('should reject invalid transformation rule', () => {
      const config: TransformationConfig = {
        routePattern: '/api/test/*',
        request: {
          addHeaders: { 'Invalid Header!': 'value' }
        }
      };

      expect(() => {
        transformationManager.addTransformationRule('invalid-rule', config);
      }).toThrow();
    });
  });

  describe('removeTransformationRule', () => {
    beforeEach(async () => {
      const mockConfig = {
        transformations: {
          'test-rule': {
            routePattern: '/api/test/*',
            request: {
              addHeaders: { 'X-Test': 'value' }
            }
          }
        }
      };

      mockReadFileSync.mockReturnValue(JSON.stringify(mockConfig));
      await transformationManager.initialize();
    });

    it('should remove existing transformation rule', () => {
      const removed = transformationManager.removeTransformationRule('test-rule');

      expect(removed).toBe(true);
      
      const transformation = transformationManager.getTransformationForRoute('/api/test/123');
      expect(transformation?.requestTransform?.addHeaders?.['X-Test']).toBeUndefined();
    });

    it('should return false for non-existing rule', () => {
      const removed = transformationManager.removeTransformationRule('non-existing');

      expect(removed).toBe(false);
    });
  });

  describe('getAllTransformationRules', () => {
    beforeEach(async () => {
      const mockConfig = {
        transformations: {
          'rule1': {
            routePattern: '/api/test1/*',
            request: { addHeaders: { 'X-Test1': 'value1' } }
          },
          'rule2': {
            routePattern: '/api/test2/*',
            request: { addHeaders: { 'X-Test2': 'value2' } }
          }
        }
      };

      mockReadFileSync.mockReturnValue(JSON.stringify(mockConfig));
      await transformationManager.initialize();
    });

    it('should return all transformation rules', () => {
      const rules = transformationManager.getAllTransformationRules();

      expect(Object.keys(rules)).toHaveLength(2);
      expect(rules['rule1']).toBeDefined();
      expect(rules['rule2']).toBeDefined();
    });
  });

  describe('getStatistics', () => {
    beforeEach(async () => {
      const mockConfig = {
        transformations: {
          'rule1': {
            routePattern: '/api/test1/*',
            request: { addHeaders: { 'X-Test1': 'value1' } }
          },
          'rule2': {
            routePattern: '/api/test2/*',
            request: { addHeaders: { 'X-Test2': 'value2' } }
          }
        },
        globalTransformations: {
          'global1': {
            response: { addHeaders: { 'X-Global': 'value' } }
          }
        }
      };

      mockReadFileSync.mockReturnValue(JSON.stringify(mockConfig));
      await transformationManager.initialize();
    });

    it('should return correct statistics', () => {
      const stats = transformationManager.getStatistics();

      expect(stats.totalRules).toBe(2);
      expect(stats.globalRules).toBe(1);
      expect(stats.routePatterns).toEqual(['rule1', 'rule2']);
    });
  });

  describe('reloadConfiguration', () => {
    it('should reload configuration successfully', async () => {
      const initialConfig = {
        transformations: {
          'initial-rule': {
            routePattern: '/api/initial/*',
            request: { addHeaders: { 'X-Initial': 'value' } }
          }
        }
      };

      const newConfig = {
        transformations: {
          'new-rule': {
            routePattern: '/api/new/*',
            request: { addHeaders: { 'X-New': 'value' } }
          }
        }
      };

      mockReadFileSync
        .mockReturnValueOnce(JSON.stringify(initialConfig))
        .mockReturnValueOnce(JSON.stringify(newConfig));

      await transformationManager.initialize();
      
      let stats = transformationManager.getStatistics();
      expect(stats.totalRules).toBe(1);
      expect(stats.routePatterns).toEqual(['initial-rule']);

      await transformationManager.reloadConfiguration();
      
      stats = transformationManager.getStatistics();
      expect(stats.totalRules).toBe(1);
      expect(stats.routePatterns).toEqual(['new-rule']);
    });
  });

  describe('route pattern matching', () => {
    beforeEach(async () => {
      const mockConfig = {
        transformations: {
          'exact-match': {
            routePattern: '/api/users/profile',
            request: { addHeaders: { 'X-Type': 'exact' } }
          },
          'wildcard-match': {
            routePattern: '/api/users/*',
            request: { addHeaders: { 'X-Type': 'wildcard' } }
          },
          'complex-pattern': {
            routePattern: '/api/events/*/tickets/*',
            request: { addHeaders: { 'X-Type': 'complex' } }
          }
        }
      };

      mockReadFileSync.mockReturnValue(JSON.stringify(mockConfig));
      await transformationManager.initialize();
    });

    it('should match exact patterns', () => {
      const transformation = transformationManager.getTransformationForRoute('/api/users/profile');
      expect(transformation?.requestTransform?.addHeaders?.['X-Type']).toBe('exact');
    });

    it('should match wildcard patterns', () => {
      const transformation = transformationManager.getTransformationForRoute('/api/users/123');
      expect(transformation?.requestTransform?.addHeaders?.['X-Type']).toBe('wildcard');
    });

    it('should match complex patterns', () => {
      const transformation = transformationManager.getTransformationForRoute('/api/events/123/tickets/456');
      expect(transformation?.requestTransform?.addHeaders?.['X-Type']).toBe('complex');
    });

    it('should not match non-matching patterns', () => {
      const transformation = transformationManager.getTransformationForRoute('/api/other/path');
      expect(transformation?.requestTransform?.addHeaders?.['X-Type']).toBeUndefined();
    });
  });
});