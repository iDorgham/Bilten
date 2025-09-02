/**
 * Request/Response Transformation Middleware
 * Handles request and response transformations based on route configuration
 */

import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/Logger';
import { TransformationRule, RequestTransform, ResponseTransform } from '../routing/types';

export class TransformationMiddleware {
  private static logger = Logger.getInstance();

  /**
   * Apply request transformations
   */
  static transformRequest() {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const routeMatch = req.routeMatch;
        
        if (!routeMatch?.route.transformation?.requestTransform) {
          return next();
        }

        const transform = routeMatch.route.transformation.requestTransform;
        
        // Apply header transformations
        TransformationMiddleware.applyRequestHeaderTransforms(req, transform);
        
        // Apply path transformations
        TransformationMiddleware.applyPathTransforms(req, transform);
        
        TransformationMiddleware.logger.debug('Request transformation applied', {
          routeId: routeMatch.route.id,
          originalPath: req.originalUrl,
          transformedPath: req.url,
          correlationId: req.routingContext?.correlationId
        });

        next();
      } catch (error) {
        TransformationMiddleware.logger.error('Request transformation error:', error);
        res.status(500).json({
          error: {
            code: 'TRANSFORMATION_ERROR',
            message: 'Request transformation failed',
            timestamp: new Date().toISOString()
          }
        });
      }
    };
  }

  /**
   * Apply response transformations
   */
  static transformResponse() {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const routeMatch = req.routeMatch;
        
        if (!routeMatch?.route.transformation?.responseTransform) {
          return next();
        }

        const transform = routeMatch.route.transformation.responseTransform;
        
        // Override res.json to intercept response
        const originalJson = res.json.bind(res);
        const originalSend = res.send.bind(res);
        
        res.json = function(body: any) {
          const transformedBody = TransformationMiddleware.applyResponseBodyTransforms(body, transform);
          TransformationMiddleware.applyResponseHeaderTransforms(res, transform);
          
          TransformationMiddleware.logger.debug('Response transformation applied', {
            routeId: routeMatch.route.id,
            correlationId: req.routingContext?.correlationId,
            hasFieldSelection: !!transform.fieldSelection
          });
          
          return originalJson(transformedBody);
        };

        res.send = function(body: any) {
          // For non-JSON responses, only apply header transformations
          TransformationMiddleware.applyResponseHeaderTransforms(res, transform);
          return originalSend(body);
        };

        next();
      } catch (error) {
        TransformationMiddleware.logger.error('Response transformation setup error:', error);
        next();
      }
    };
  }

  /**
   * Apply request header transformations
   */
  private static applyRequestHeaderTransforms(req: Request, transform: RequestTransform): void {
    // Add headers
    if (transform.addHeaders) {
      Object.entries(transform.addHeaders).forEach(([key, value]) => {
        // Support dynamic values using template variables
        const processedValue = TransformationMiddleware.processTemplateValue(value, req);
        req.headers[key.toLowerCase()] = processedValue;
      });
    }

    // Remove headers
    if (transform.removeHeaders) {
      transform.removeHeaders.forEach(header => {
        delete req.headers[header.toLowerCase()];
      });
    }
  }

  /**
   * Apply path transformations
   */
  private static applyPathTransforms(req: Request, transform: RequestTransform): void {
    if (!transform.modifyPath) {
      return;
    }

    let transformedPath = req.url;

    // Strip prefix
    if (transform.modifyPath.stripPrefix) {
      const prefix = transform.modifyPath.stripPrefix;
      if (transformedPath.startsWith(prefix)) {
        transformedPath = transformedPath.substring(prefix.length);
        if (!transformedPath.startsWith('/')) {
          transformedPath = '/' + transformedPath;
        }
      }
    }

    // Add prefix
    if (transform.modifyPath.addPrefix) {
      const prefix = transform.modifyPath.addPrefix;
      transformedPath = prefix + transformedPath;
    }

    // Rewrite using regex
    if (transform.modifyPath.rewrite) {
      try {
        const [pattern, replacement] = transform.modifyPath.rewrite.split('->').map(s => s.trim());
        const regex = new RegExp(pattern);
        transformedPath = transformedPath.replace(regex, replacement);
      } catch (error) {
        TransformationMiddleware.logger.warn('Invalid rewrite pattern:', transform.modifyPath.rewrite);
      }
    }

    // Update request URL
    req.url = transformedPath;
  }

  /**
   * Apply response header transformations
   */
  private static applyResponseHeaderTransforms(res: Response, transform: ResponseTransform): void {
    // Add headers
    if (transform.addHeaders) {
      Object.entries(transform.addHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
    }

    // Remove headers
    if (transform.removeHeaders) {
      transform.removeHeaders.forEach(header => {
        res.removeHeader(header);
      });
    }
  }

  /**
   * Apply response body transformations
   */
  private static applyResponseBodyTransforms(body: any, transform: ResponseTransform): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    let transformedBody = body;

    // Apply field selection (projection)
    if (transform.fieldSelection && Array.isArray(transform.fieldSelection)) {
      transformedBody = TransformationMiddleware.selectFields(body, transform.fieldSelection);
    }

    return transformedBody;
  }

  /**
   * Select specific fields from response body
   */
  private static selectFields(obj: any, fields: string[]): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => TransformationMiddleware.selectFields(item, fields));
    }

    const result: any = {};

    fields.forEach(field => {
      if (field.includes('.')) {
        // Handle nested field selection (e.g., "user.name")
        const [parentField, ...childPath] = field.split('.');
        if (obj[parentField] !== undefined) {
          if (!result[parentField]) {
            result[parentField] = {};
          }
          const childValue = TransformationMiddleware.getNestedValue(obj[parentField], childPath.join('.'));
          if (childValue !== undefined) {
            TransformationMiddleware.setNestedValue(result[parentField], childPath.join('.'), childValue);
          }
        }
      } else {
        // Handle direct field selection
        if (obj[field] !== undefined) {
          result[field] = obj[field];
        }
      }
    });

    return result;
  }

  /**
   * Get nested value from object using dot notation
   */
  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Set nested value in object using dot notation
   */
  private static setNestedValue(obj: any, path: string, value: any): void {
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
   * Process template values in transformation rules
   * Supports variables like {{request.headers.user-id}}, {{request.path}}, etc.
   */
  private static processTemplateValue(template: string, req: Request): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
      const parts = variable.trim().split('.');
      
      try {
        switch (parts[0]) {
          case 'request':
            return TransformationMiddleware.getRequestValue(req, parts.slice(1));
          case 'route':
            return TransformationMiddleware.getRouteValue(req, parts.slice(1));
          case 'timestamp':
            return new Date().toISOString();
          case 'correlationId':
            return req.routingContext?.correlationId || '';
          default:
            return match; // Return original if not recognized
        }
      } catch (error) {
        TransformationMiddleware.logger.warn(`Failed to process template variable: ${variable}`);
        return match;
      }
    });
  }

  /**
   * Get value from request object
   */
  private static getRequestValue(req: Request, path: string[]): string {
    let current: any = req;
    
    for (const part of path) {
      if (current && typeof current === 'object') {
        current = current[part];
      } else {
        return '';
      }
    }
    
    return String(current || '');
  }

  /**
   * Get value from route match object
   */
  private static getRouteValue(req: Request, path: string[]): string {
    if (!req.routeMatch) {
      return '';
    }

    let current: any = req.routeMatch;
    
    for (const part of path) {
      if (current && typeof current === 'object') {
        current = current[part];
      } else {
        return '';
      }
    }
    
    return String(current || '');
  }

  /**
   * Create transformation rule from configuration
   */
  static createTransformationRule(config: any): TransformationRule {
    const rule: TransformationRule = {};

    if (config.request) {
      rule.requestTransform = {
        addHeaders: config.request.addHeaders,
        removeHeaders: config.request.removeHeaders,
        modifyPath: config.request.modifyPath
      };
    }

    if (config.response) {
      rule.responseTransform = {
        addHeaders: config.response.addHeaders,
        removeHeaders: config.response.removeHeaders,
        fieldSelection: config.response.fieldSelection
      };
    }

    return rule;
  }

  /**
   * Validate transformation rule configuration
   */
  static validateTransformationRule(rule: TransformationRule): string[] {
    const errors: string[] = [];

    if (rule.requestTransform) {
      const reqTransform = rule.requestTransform;
      
      // Validate header names
      if (reqTransform.addHeaders) {
        Object.keys(reqTransform.addHeaders).forEach(header => {
          if (!/^[a-zA-Z0-9\-_]+$/.test(header)) {
            errors.push(`Invalid header name: ${header}`);
          }
        });
      }

      // Validate path modification
      if (reqTransform.modifyPath?.rewrite) {
        try {
          const [pattern] = reqTransform.modifyPath.rewrite.split('->');
          new RegExp(pattern.trim());
        } catch (error) {
          errors.push(`Invalid rewrite regex pattern: ${reqTransform.modifyPath.rewrite}`);
        }
      }
    }

    if (rule.responseTransform) {
      const resTransform = rule.responseTransform;
      
      // Validate field selection
      if (resTransform.fieldSelection) {
        resTransform.fieldSelection.forEach(field => {
          if (typeof field !== 'string' || field.trim() === '') {
            errors.push(`Invalid field selection: ${field}`);
          }
        });
      }
    }

    return errors;
  }
}