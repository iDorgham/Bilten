/**
 * Transformation Manager
 * Manages transformation rules and applies them to routes
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { Logger } from '../utils/Logger';
import { TransformationRule } from '../routing/types';
import { TransformationMiddleware } from '../middleware/TransformationMiddleware';

export interface TransformationConfig {
  routePattern: string;
  request?: {
    addHeaders?: Record<string, string>;
    removeHeaders?: string[];
    modifyPath?: {
      stripPrefix?: string;
      addPrefix?: string;
      rewrite?: string;
    };
  };
  response?: {
    addHeaders?: Record<string, string>;
    removeHeaders?: string[];
    fieldSelection?: string[];
  };
}

export interface TransformationConfigFile {
  transformations: Record<string, TransformationConfig>;
  globalTransformations?: Record<string, Omit<TransformationConfig, 'routePattern'>>;
}

export class TransformationManager {
  private logger = Logger.getInstance();
  private transformations: Map<string, TransformationRule> = new Map();
  private globalTransformations: TransformationRule[] = [];
  private routePatterns: Map<string, RegExp> = new Map();

  /**
   * Initialize transformation manager with configuration
   */
  async initialize(): Promise<void> {
    try {
      await this.loadTransformationConfig();
      this.logger.info('Transformation manager initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize transformation manager:', error);
      throw error;
    }
  }

  /**
   * Load transformation configuration from file
   */
  private async loadTransformationConfig(): Promise<void> {
    try {
      const configPath = join(__dirname, '../config/transformations.json');
      const configData = readFileSync(configPath, 'utf8');
      const config: TransformationConfigFile = JSON.parse(configData);

      // Load route-specific transformations
      Object.entries(config.transformations).forEach(([name, transformConfig]) => {
        const rule = this.createTransformationRule(transformConfig);
        const validationErrors = TransformationMiddleware.validateTransformationRule(rule);
        
        if (validationErrors.length > 0) {
          this.logger.warn(`Invalid transformation rule '${name}':`, validationErrors);
          return;
        }

        this.transformations.set(name, rule);
        this.routePatterns.set(name, this.createRoutePattern(transformConfig.routePattern));
        
        this.logger.debug(`Loaded transformation rule: ${name}`, {
          pattern: transformConfig.routePattern,
          hasRequestTransform: !!rule.requestTransform,
          hasResponseTransform: !!rule.responseTransform
        });
      });

      // Load global transformations
      if (config.globalTransformations) {
        Object.entries(config.globalTransformations).forEach(([name, transformConfig]) => {
          const rule = this.createTransformationRule(transformConfig);
          const validationErrors = TransformationMiddleware.validateTransformationRule(rule);
          
          if (validationErrors.length > 0) {
            this.logger.warn(`Invalid global transformation rule '${name}':`, validationErrors);
            return;
          }

          this.globalTransformations.push(rule);
          this.logger.debug(`Loaded global transformation rule: ${name}`);
        });
      }

      this.logger.info(`Loaded ${this.transformations.size} transformation rules and ${this.globalTransformations.length} global transformations`);
    } catch (error) {
      this.logger.error('Failed to load transformation configuration:', error);
      throw error;
    }
  }

  /**
   * Get transformation rule for a route
   */
  getTransformationForRoute(path: string): TransformationRule | null {
    this.logger.debug(`Looking for transformation for path: ${path}`);
    
    // Check route-specific transformations first
    for (const [name, pattern] of this.routePatterns.entries()) {
      this.logger.debug(`Testing pattern ${name}: ${pattern.source} against ${path}`);
      if (pattern.test(path)) {
        const transformation = this.transformations.get(name);
        if (transformation) {
          this.logger.debug(`Found transformation rule for path ${path}: ${name}`);
          return this.mergeWithGlobalTransformations(transformation);
        }
      }
    }

    this.logger.debug(`No specific transformation found for ${path}, checking global transformations`);
    
    // Return only global transformations if no specific rule found
    if (this.globalTransformations.length > 0) {
      return this.mergeGlobalTransformations();
    }

    return null;
  }

  /**
   * Create transformation rule from configuration
   */
  private createTransformationRule(config: Omit<TransformationConfig, 'routePattern'>): TransformationRule {
    const rule: TransformationRule = {};

    if (config.request) {
      const requestTransform: any = {};
      
      if (config.request.addHeaders) {
        requestTransform.addHeaders = config.request.addHeaders;
      }
      
      if (config.request.removeHeaders) {
        requestTransform.removeHeaders = config.request.removeHeaders;
      }
      
      if (config.request.modifyPath) {
        requestTransform.modifyPath = config.request.modifyPath;
      }
      
      if (Object.keys(requestTransform).length > 0) {
        rule.requestTransform = requestTransform;
      }
    }

    if (config.response) {
      const responseTransform: any = {};
      
      if (config.response.addHeaders) {
        responseTransform.addHeaders = config.response.addHeaders;
      }
      
      if (config.response.removeHeaders) {
        responseTransform.removeHeaders = config.response.removeHeaders;
      }
      
      if (config.response.fieldSelection) {
        responseTransform.fieldSelection = config.response.fieldSelection;
      }
      
      if (Object.keys(responseTransform).length > 0) {
        rule.responseTransform = responseTransform;
      }
    }

    return rule;
  }

  /**
   * Create regex pattern from route pattern string
   */
  private createRoutePattern(pattern: string): RegExp {
    // Convert route pattern to regex
    // First escape special regex characters except *
    let regexPattern = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    // Then replace * with .*
    regexPattern = regexPattern.replace(/\*/g, '.*');
    
    this.logger.debug(`Created pattern: ${pattern} -> ${regexPattern}`);
    return new RegExp(`^${regexPattern}$`);
  }

  /**
   * Merge transformation rule with global transformations
   */
  private mergeWithGlobalTransformations(rule: TransformationRule): TransformationRule {
    if (this.globalTransformations.length === 0) {
      return rule;
    }

    const merged: TransformationRule = JSON.parse(JSON.stringify(rule));

    this.globalTransformations.forEach(globalRule => {
      // Merge request transformations
      if (globalRule.requestTransform) {
        if (!merged.requestTransform) {
          merged.requestTransform = {};
        }

        // Merge headers (global headers are added first, then route-specific)
        if (globalRule.requestTransform.addHeaders) {
          merged.requestTransform.addHeaders = {
            ...globalRule.requestTransform.addHeaders,
            ...merged.requestTransform.addHeaders
          };
        }

        // Merge remove headers
        if (globalRule.requestTransform.removeHeaders) {
          merged.requestTransform.removeHeaders = [
            ...(merged.requestTransform.removeHeaders || []),
            ...globalRule.requestTransform.removeHeaders
          ];
        }
      }

      // Merge response transformations
      if (globalRule.responseTransform) {
        if (!merged.responseTransform) {
          merged.responseTransform = {};
        }

        // Merge headers (global headers are added first, then route-specific)
        if (globalRule.responseTransform.addHeaders) {
          merged.responseTransform.addHeaders = {
            ...globalRule.responseTransform.addHeaders,
            ...merged.responseTransform.addHeaders
          };
        }

        // Merge remove headers
        if (globalRule.responseTransform.removeHeaders) {
          merged.responseTransform.removeHeaders = [
            ...(merged.responseTransform.removeHeaders || []),
            ...globalRule.responseTransform.removeHeaders
          ];
        }
      }
    });

    return merged;
  }

  /**
   * Merge only global transformations
   */
  private mergeGlobalTransformations(): TransformationRule {
    const merged: TransformationRule = {};

    this.globalTransformations.forEach(globalRule => {
      // Merge request transformations
      if (globalRule.requestTransform) {
        if (!merged.requestTransform) {
          merged.requestTransform = {};
        }

        if (globalRule.requestTransform.addHeaders) {
          merged.requestTransform.addHeaders = {
            ...merged.requestTransform.addHeaders,
            ...globalRule.requestTransform.addHeaders
          };
        }

        if (globalRule.requestTransform.removeHeaders) {
          merged.requestTransform.removeHeaders = [
            ...(merged.requestTransform.removeHeaders || []),
            ...globalRule.requestTransform.removeHeaders
          ];
        }
      }

      // Merge response transformations
      if (globalRule.responseTransform) {
        if (!merged.responseTransform) {
          merged.responseTransform = {};
        }

        if (globalRule.responseTransform.addHeaders) {
          merged.responseTransform.addHeaders = {
            ...merged.responseTransform.addHeaders,
            ...globalRule.responseTransform.addHeaders
          };
        }

        if (globalRule.responseTransform.removeHeaders) {
          merged.responseTransform.removeHeaders = [
            ...(merged.responseTransform.removeHeaders || []),
            ...globalRule.responseTransform.removeHeaders
          ];
        }
      }
    });

    return merged;
  }

  /**
   * Add or update transformation rule
   */
  addTransformationRule(name: string, config: TransformationConfig): void {
    const rule = this.createTransformationRule(config);
    const validationErrors = TransformationMiddleware.validateTransformationRule(rule);
    
    if (validationErrors.length > 0) {
      throw new Error(`Invalid transformation rule: ${validationErrors.join(', ')}`);
    }

    this.transformations.set(name, rule);
    this.routePatterns.set(name, this.createRoutePattern(config.routePattern));
    
    this.logger.info(`Added transformation rule: ${name}`, {
      pattern: config.routePattern
    });
  }

  /**
   * Remove transformation rule
   */
  removeTransformationRule(name: string): boolean {
    const removed = this.transformations.delete(name) && this.routePatterns.delete(name);
    
    if (removed) {
      this.logger.info(`Removed transformation rule: ${name}`);
    }
    
    return removed;
  }

  /**
   * Get all transformation rules
   */
  getAllTransformationRules(): Record<string, TransformationRule> {
    const rules: Record<string, TransformationRule> = {};
    
    this.transformations.forEach((rule, name) => {
      rules[name] = rule;
    });
    
    return rules;
  }

  /**
   * Reload transformation configuration
   */
  async reloadConfiguration(): Promise<void> {
    this.transformations.clear();
    this.routePatterns.clear();
    this.globalTransformations.length = 0;
    
    await this.loadTransformationConfig();
    this.logger.info('Transformation configuration reloaded');
  }

  /**
   * Get transformation statistics
   */
  getStatistics(): {
    totalRules: number;
    globalRules: number;
    routePatterns: string[];
  } {
    return {
      totalRules: this.transformations.size,
      globalRules: this.globalTransformations.length,
      routePatterns: Array.from(this.routePatterns.keys())
    };
  }
}