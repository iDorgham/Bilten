/**
 * Mobile Optimization Middleware
 * Integrates mobile optimization with the transformation pipeline
 */

import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/Logger';
import { MobileOptimizationService, ClientCapabilities, MobileOptimizationConfig } from '../services/MobileOptimizationService';

export class MobileOptimizationMiddleware {
  private static logger = Logger.getInstance();
  private static optimizationService: MobileOptimizationService;

  /**
   * Initialize mobile optimization middleware
   */
  static initialize(config: MobileOptimizationConfig): void {
    MobileOptimizationMiddleware.optimizationService = new MobileOptimizationService(config);
    MobileOptimizationMiddleware.logger.info('Mobile optimization middleware initialized');
  }

  /**
   * Detect client capabilities and store in request context
   */
  static detectCapabilities() {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!MobileOptimizationMiddleware.optimizationService) {
          return next();
        }

        const capabilities = MobileOptimizationMiddleware.optimizationService.detectClientCapabilities(req);
        
        // Store capabilities in request context
        req.clientCapabilities = capabilities;
        
        // Add client info to response headers for debugging
        res.setHeader('X-Client-Type', capabilities.type);
        res.setHeader('X-Screen-Size', capabilities.screenSize);
        res.setHeader('X-Network-Type', capabilities.networkType);
        
        MobileOptimizationMiddleware.logger.debug('Client capabilities detected', {
          correlationId: req.routingContext?.correlationId,
          clientType: capabilities.type,
          screenSize: capabilities.screenSize,
          networkType: capabilities.networkType,
          supportsWebP: capabilities.supportsWebP,
          compressionSupport: capabilities.supportsCompression
        });

        next();
      } catch (error) {
        MobileOptimizationMiddleware.logger.error('Error detecting client capabilities:', error);
        next(); // Continue without optimization
      }
    };
  }

  /**
   * Apply mobile optimization to responses
   */
  static optimizeResponse() {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!MobileOptimizationMiddleware.optimizationService || !req.clientCapabilities) {
          return next();
        }

        const capabilities = req.clientCapabilities;
        const routeMatch = req.routeMatch;
        
        // Only optimize for mobile clients or when explicitly configured
        if (capabilities.type !== 'mobile' && capabilities.networkType !== 'slow') {
          return next();
        }

        // Override res.json to intercept and optimize response
        const originalJson = res.json.bind(res);
        const originalSend = res.send.bind(res);
        
        res.json = async function(body: any) {
          try {
            const endpoint = routeMatch?.route.path || req.path;
            
            // Apply mobile optimization
            const { data: optimizedData, result } = await MobileOptimizationMiddleware.optimizationService.optimizeResponse(
              body,
              capabilities,
              endpoint
            );

            // Apply compression if supported
            const responseString = JSON.stringify(optimizedData);
            const { compressed, encoding } = await MobileOptimizationMiddleware.optimizationService.compressResponse(
              responseString,
              capabilities
            );

            // Set optimization headers
            res.setHeader('X-Optimization-Applied', result.optimizationApplied.join(','));
            res.setHeader('X-Original-Size', result.originalSize.toString());
            res.setHeader('X-Optimized-Size', result.optimizedSize.toString());
            res.setHeader('X-Compression-Ratio', Math.round(result.compressionRatio * 100) + '%');
            
            if (result.fieldsRemoved > 0) {
              res.setHeader('X-Fields-Removed', result.fieldsRemoved.toString());
            }

            // Set compression headers
            if (encoding !== 'identity') {
              res.setHeader('Content-Encoding', encoding);
              res.setHeader('Vary', 'Accept-Encoding');
            }

            // Set content length
            res.setHeader('Content-Length', compressed.length.toString());

            MobileOptimizationMiddleware.logger.debug('Mobile optimization applied', {
              correlationId: req.routingContext?.correlationId,
              endpoint,
              clientType: capabilities.type,
              originalSize: result.originalSize,
              optimizedSize: result.optimizedSize,
              compressionRatio: result.compressionRatio,
              encoding,
              optimizationApplied: result.optimizationApplied
            });

            // Send optimized and compressed response
            res.status(res.statusCode || 200);
            return res.end(compressed);
            
          } catch (optimizationError) {
            MobileOptimizationMiddleware.logger.error('Mobile optimization error:', optimizationError);
            // Fallback to original response
            return originalJson(body);
          }
        };

        res.send = async function(body: any) {
          try {
            // For non-JSON responses, only apply compression
            if (typeof body === 'string' && capabilities.supportsCompression.length > 0) {
              const { compressed, encoding } = await MobileOptimizationMiddleware.optimizationService.compressResponse(
                body,
                capabilities
              );

              if (encoding !== 'identity') {
                res.setHeader('Content-Encoding', encoding);
                res.setHeader('Vary', 'Accept-Encoding');
                res.setHeader('Content-Length', compressed.length.toString());
                return res.end(compressed);
              }
            }
            
            return originalSend(body);
          } catch (compressionError) {
            MobileOptimizationMiddleware.logger.error('Response compression error:', compressionError);
            return originalSend(body);
          }
        };

        next();
      } catch (error) {
        MobileOptimizationMiddleware.logger.error('Mobile optimization middleware error:', error);
        next(); // Continue without optimization
      }
    };
  }

  /**
   * Create mobile optimization configuration from route config
   */
  static createMobileConfig(routeConfig: any): MobileOptimizationConfig {
    return {
      enableCompression: routeConfig.mobileOptimization?.enableCompression ?? true,
      enableFieldSelection: routeConfig.mobileOptimization?.enableFieldSelection ?? true,
      enableImageOptimization: routeConfig.mobileOptimization?.enableImageOptimization ?? true,
      enableAdaptiveResponse: routeConfig.mobileOptimization?.enableAdaptiveResponse ?? true,
      maxMobileResponseSize: routeConfig.mobileOptimization?.maxMobileResponseSize ?? 1024 * 1024, // 1MB
      compressionLevel: routeConfig.mobileOptimization?.compressionLevel ?? 6,
      mobileFields: routeConfig.mobileOptimization?.mobileFields ?? {}
    };
  }

  /**
   * Validate mobile optimization configuration
   */
  static validateMobileConfig(config: MobileOptimizationConfig): string[] {
    const errors: string[] = [];

    if (config.maxMobileResponseSize <= 0) {
      errors.push('maxMobileResponseSize must be greater than 0');
    }

    if (config.compressionLevel < 1 || config.compressionLevel > 9) {
      errors.push('compressionLevel must be between 1 and 9');
    }

    if (config.mobileFields) {
      Object.entries(config.mobileFields).forEach(([endpoint, fields]) => {
        if (!Array.isArray(fields)) {
          errors.push(`mobileFields[${endpoint}] must be an array`);
        } else {
          fields.forEach((field, index) => {
            if (typeof field !== 'string' || field.trim() === '') {
              errors.push(`mobileFields[${endpoint}][${index}] must be a non-empty string`);
            }
          });
        }
      });
    }

    return errors;
  }

  /**
   * Get mobile optimization statistics
   */
  static getStatistics(): any {
    if (!MobileOptimizationMiddleware.optimizationService) {
      return null;
    }
    
    return MobileOptimizationMiddleware.optimizationService.getStatistics();
  }
}

// Extend Express Request interface to include client capabilities
declare global {
  namespace Express {
    interface Request {
      clientCapabilities?: ClientCapabilities;
    }
  }
}