/**
 * Mobile Optimization Service
 * Handles response optimization for mobile clients including compression,
 * field selection, and adaptive response sizing
 */

import { Request, Response } from 'express';
import { Logger } from '../utils/Logger';
import * as zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);
const deflate = promisify(zlib.deflate);
const brotliCompress = promisify(zlib.brotliCompress);

export interface ClientCapabilities {
  type: 'mobile' | 'desktop' | 'tablet' | 'unknown';
  screenSize: 'small' | 'medium' | 'large';
  networkType: 'slow' | 'fast' | 'unknown';
  supportsWebP: boolean;
  supportsCompression: string[]; // ['gzip', 'deflate', 'br']
  maxResponseSize: number; // in bytes
  preferredImageFormat: 'webp' | 'jpeg' | 'png';
}

export interface MobileOptimizationConfig {
  enableCompression: boolean;
  enableFieldSelection: boolean;
  enableImageOptimization: boolean;
  enableAdaptiveResponse: boolean;
  maxMobileResponseSize: number;
  compressionLevel: number;
  mobileFields: Record<string, string[]>; // endpoint -> fields mapping
}

export interface OptimizationResult {
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  fieldsRemoved: number;
  optimizationApplied: string[];
}

export class MobileOptimizationService {
  private logger = Logger.getInstance();
  private config: MobileOptimizationConfig;

  constructor(config: MobileOptimizationConfig) {
    this.config = config;
  }

  /**
   * Detect client capabilities from request headers
   */
  detectClientCapabilities(req: Request): ClientCapabilities {
    const userAgent = req.headers['user-agent'] || '';
    const acceptEncoding = req.headers['accept-encoding'] || '';
    const accept = req.headers['accept'] || '';
    const connection = req.headers['connection'] || '';
    const viewport = req.headers['viewport'] || '';

    // Detect device type
    const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent);
    
    let deviceType: ClientCapabilities['type'] = 'unknown';
    if (isMobile && !isTablet) {
      deviceType = 'mobile';
    } else if (isTablet) {
      deviceType = 'tablet';
    } else if (userAgent) {
      deviceType = 'desktop';
    }

    // Detect screen size
    let screenSize: ClientCapabilities['screenSize'] = 'medium';
    if (viewport) {
      const width = parseInt(viewport.split('width=')[1]?.split(',')[0] || '0');
      if (width > 0) {
        screenSize = width < 768 ? 'small' : width < 1024 ? 'medium' : 'large';
      }
    } else if (deviceType === 'mobile') {
      screenSize = 'small';
    } else if (deviceType === 'tablet') {
      screenSize = 'medium';
    } else {
      screenSize = 'large';
    }

    // Detect network type
    let networkType: ClientCapabilities['networkType'] = 'unknown';
    const connectionHeader = req.headers['connection-type'] as string;
    if (connectionHeader) {
      networkType = ['2g', '3g', 'slow-2g'].includes(connectionHeader) ? 'slow' : 'fast';
    } else if (deviceType === 'mobile') {
      // Assume mobile connections might be slower
      networkType = 'slow';
    } else {
      networkType = 'fast';
    }

    // Detect compression support
    const supportsCompression: string[] = [];
    if (acceptEncoding.includes('gzip')) supportsCompression.push('gzip');
    if (acceptEncoding.includes('deflate')) supportsCompression.push('deflate');
    if (acceptEncoding.includes('br')) supportsCompression.push('br');

    // Detect WebP support
    const supportsWebP = accept.includes('image/webp');

    // Determine max response size based on device and network
    let maxResponseSize = 10 * 1024 * 1024; // 10MB default
    if (deviceType === 'mobile' && networkType === 'slow') {
      maxResponseSize = 1 * 1024 * 1024; // 1MB for slow mobile
    } else if (deviceType === 'mobile') {
      maxResponseSize = 5 * 1024 * 1024; // 5MB for mobile
    }

    // Determine preferred image format
    let preferredImageFormat: ClientCapabilities['preferredImageFormat'] = 'jpeg';
    if (supportsWebP) {
      preferredImageFormat = 'webp';
    }

    return {
      type: deviceType,
      screenSize,
      networkType,
      supportsWebP,
      supportsCompression,
      maxResponseSize,
      preferredImageFormat
    };
  }

  /**
   * Optimize response for mobile client
   */
  async optimizeResponse(
    data: any,
    capabilities: ClientCapabilities,
    endpoint: string
  ): Promise<{ data: any; result: OptimizationResult }> {
    const originalData = JSON.stringify(data);
    const originalSize = Buffer.byteLength(originalData, 'utf8');
    
    let optimizedData = data;
    const optimizationApplied: string[] = [];
    let fieldsRemoved = 0;

    // Apply field selection for mobile clients
    if (this.config.enableFieldSelection && capabilities.type === 'mobile') {
      const mobileFields = this.config.mobileFields[endpoint];
      if (mobileFields) {
        const beforeFields = this.countFields(optimizedData);
        optimizedData = this.selectFields(optimizedData, mobileFields);
        const afterFields = this.countFields(optimizedData);
        fieldsRemoved = beforeFields - afterFields;
        optimizationApplied.push('field-selection');
      }
    }

    // Apply adaptive response sizing
    if (this.config.enableAdaptiveResponse) {
      optimizedData = this.adaptResponseSize(optimizedData, capabilities);
      optimizationApplied.push('adaptive-sizing');
    }

    // Apply image optimization
    if (this.config.enableImageOptimization) {
      optimizedData = this.optimizeImages(optimizedData, capabilities);
      optimizationApplied.push('image-optimization');
    }

    const optimizedSize = Buffer.byteLength(JSON.stringify(optimizedData), 'utf8');
    const compressionRatio = originalSize > 0 ? (originalSize - optimizedSize) / originalSize : 0;

    const result: OptimizationResult = {
      originalSize,
      optimizedSize,
      compressionRatio,
      fieldsRemoved,
      optimizationApplied
    };

    this.logger.debug('Mobile optimization applied', {
      endpoint,
      clientType: capabilities.type,
      originalSize,
      optimizedSize,
      compressionRatio: Math.round(compressionRatio * 100) + '%',
      optimizationApplied
    });

    return { data: optimizedData, result };
  }

  /**
   * Compress response data
   */
  async compressResponse(
    data: string,
    capabilities: ClientCapabilities
  ): Promise<{ compressed: Buffer; encoding: string }> {
    if (!this.config.enableCompression || capabilities.supportsCompression.length === 0) {
      return { compressed: Buffer.from(data), encoding: 'identity' };
    }

    const dataBuffer = Buffer.from(data, 'utf8');
    
    // Choose best compression method
    if (capabilities.supportsCompression.includes('br')) {
      const compressed = await brotliCompress(dataBuffer, {
        params: {
          [zlib.constants.BROTLI_PARAM_QUALITY]: this.config.compressionLevel
        }
      });
      return { compressed, encoding: 'br' };
    } else if (capabilities.supportsCompression.includes('gzip')) {
      const compressed = await gzip(dataBuffer, { level: this.config.compressionLevel });
      return { compressed, encoding: 'gzip' };
    } else if (capabilities.supportsCompression.includes('deflate')) {
      const compressed = await deflate(dataBuffer, { level: this.config.compressionLevel });
      return { compressed, encoding: 'deflate' };
    }

    return { compressed: dataBuffer, encoding: 'identity' };
  }

  /**
   * Select specific fields from response data
   */
  private selectFields(data: any, fields: string[]): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.selectFields(item, fields));
    }

    const result: any = {};
    
    fields.forEach(field => {
      if (field.includes('.')) {
        // Handle nested field selection
        const [parentField, ...childPath] = field.split('.');
        if (data[parentField] !== undefined) {
          if (!result[parentField]) {
            result[parentField] = {};
          }
          const childValue = this.getNestedValue(data[parentField], childPath.join('.'));
          if (childValue !== undefined) {
            this.setNestedValue(result[parentField], childPath.join('.'), childValue);
          }
        }
      } else {
        // Handle direct field selection
        if (data[field] !== undefined) {
          result[field] = data[field];
        }
      }
    });

    return result;
  }

  /**
   * Adapt response size based on client capabilities
   */
  private adaptResponseSize(data: any, capabilities: ClientCapabilities): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    // For mobile clients with slow networks, limit array sizes
    if (capabilities.type === 'mobile' && capabilities.networkType === 'slow') {
      return this.limitArraySizes(data, 10); // Limit arrays to 10 items
    } else if (capabilities.type === 'mobile') {
      return this.limitArraySizes(data, 25); // Limit arrays to 25 items
    }

    return data;
  }

  /**
   * Optimize images in response data
   */
  private optimizeImages(data: any, capabilities: ClientCapabilities): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.optimizeImages(item, capabilities));
    }

    const result = { ...data };

    // Look for image URLs and optimize them
    Object.keys(result).forEach(key => {
      const value = result[key];
      
      if (typeof value === 'string' && this.isImageUrl(value)) {
        result[key] = this.optimizeImageUrl(value, capabilities);
      } else if (typeof value === 'object') {
        result[key] = this.optimizeImages(value, capabilities);
      }
    });

    return result;
  }

  /**
   * Check if a string is an image URL
   */
  private isImageUrl(url: string): boolean {
    return /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url);
  }

  /**
   * Optimize image URL based on client capabilities
   */
  private optimizeImageUrl(url: string, capabilities: ClientCapabilities): string {
    // Add query parameters for image optimization
    const urlObj = new URL(url, 'http://localhost'); // Use dummy base for relative URLs
    
    // Set format based on client support
    if (capabilities.supportsWebP && !url.includes('.webp')) {
      urlObj.searchParams.set('format', 'webp');
    }

    // Set quality based on device and network
    let quality = 85; // Default quality
    if (capabilities.type === 'mobile' && capabilities.networkType === 'slow') {
      quality = 60;
    } else if (capabilities.type === 'mobile') {
      quality = 75;
    }
    urlObj.searchParams.set('quality', quality.toString());

    // Set size based on screen size
    if (capabilities.screenSize === 'small') {
      urlObj.searchParams.set('width', '400');
    } else if (capabilities.screenSize === 'medium') {
      urlObj.searchParams.set('width', '800');
    }

    return urlObj.pathname + urlObj.search;
  }

  /**
   * Limit array sizes in response data
   */
  private limitArraySizes(data: any, maxSize: number): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      const limited = data.slice(0, maxSize);
      return limited.map(item => this.limitArraySizes(item, maxSize));
    }

    const result: any = {};
    Object.keys(data).forEach(key => {
      const value = data[key];
      if (Array.isArray(value)) {
        result[key] = value.slice(0, maxSize).map(item => this.limitArraySizes(item, maxSize));
      } else if (typeof value === 'object') {
        result[key] = this.limitArraySizes(value, maxSize);
      } else {
        result[key] = value;
      }
    });

    return result;
  }

  /**
   * Count total fields in an object
   */
  private countFields(obj: any): number {
    if (!obj || typeof obj !== 'object') {
      return 0;
    }

    if (Array.isArray(obj)) {
      return obj.reduce((count, item) => count + this.countFields(item), 0);
    }

    let count = Object.keys(obj).length;
    Object.values(obj).forEach(value => {
      if (typeof value === 'object') {
        count += this.countFields(value);
      }
    });

    return count;
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Set nested value in object using dot notation
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    
    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      return current[key];
    }, obj);

    target[lastKey] = value;
  }

  /**
   * Get optimization statistics
   */
  getStatistics(): {
    totalOptimizations: number;
    averageCompressionRatio: number;
    averageFieldsRemoved: number;
  } {
    // This would be implemented with actual metrics collection
    return {
      totalOptimizations: 0,
      averageCompressionRatio: 0,
      averageFieldsRemoved: 0
    };
  }
}