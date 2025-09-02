/**
 * Core routing engine for request processing and route matching
 */

import { Request, Response, NextFunction } from 'express';
import { RouteConfig, RouteMatch, RoutingContext, RouteValidation } from './types';
import { PathMatcher } from './PathMatcher';
import { RequestValidator } from './RequestValidator';
import { Logger } from '../utils/Logger';

export class RoutingEngine {
  private routes: RouteConfig[] = [];
  private pathMatcher: PathMatcher;
  private logger = Logger.getInstance();
  private routeValidations: Map<string, RouteValidation> = new Map();

  constructor() {
    this.pathMatcher = new PathMatcher();
  }

  /**
   * Register a route with the routing engine
   */
  registerRoute(route: RouteConfig, validation?: RouteValidation): void {
    // Validate route configuration
    this.validateRouteConfig(route);

    // Add route to the collection
    this.routes.push(route);

    // Store validation rules if provided
    if (validation) {
      this.routeValidations.set(route.id, validation);
    }

    // Sort routes by specificity to ensure correct matching order
    this.routes = this.pathMatcher.sortRoutesBySpecificity(this.routes);

    this.logger.info(`Registered route: ${route.methods.join(',')} ${route.path} -> ${route.upstream}`, {
      routeId: route.id,
      version: route.version,
      enabled: route.enabled
    });
  }

  /**
   * Unregister a route by ID
   */
  unregisterRoute(routeId: string): boolean {
    const initialLength = this.routes.length;
    this.routes = this.routes.filter(route => route.id !== routeId);
    this.routeValidations.delete(routeId);

    const removed = this.routes.length < initialLength;
    if (removed) {
      this.logger.info(`Unregistered route: ${routeId}`);
    }

    return removed;
  }

  /**
   * Find matching route for a request
   */
  findRoute(method: string, path: string): RouteMatch | null {
    const normalizedMethod = method.toUpperCase();

    for (const route of this.routes) {
      // Skip disabled routes
      if (!route.enabled) {
        continue;
      }

      // Check if method is supported
      if (!route.methods.includes(normalizedMethod)) {
        continue;
      }

      // Check path matching
      const pathMatch = this.pathMatcher.matchPath(route.path, path);
      if (!pathMatch.match) {
        continue;
      }

      // Parse query parameters (will be set by Express middleware)
      const query = {};

      return {
        route,
        params: pathMatch.params,
        query
      };
    }

    return null;
  }

  /**
   * Create routing context from Express request
   */
  createRoutingContext(req: Request): RoutingContext {
    return {
      method: req.method,
      path: req.path,
      headers: req.headers as Record<string, string>,
      query: req.query as Record<string, any>,
      body: req.body,
      correlationId: req.headers['x-correlation-id'] as string || this.generateCorrelationId(),
      timestamp: new Date()
    };
  }

  /**
   * Express middleware for route processing
   */
  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        // Create routing context
        const context = this.createRoutingContext(req);

        // Find matching route
        const routeMatch = this.findRoute(context.method, context.path);

        if (!routeMatch) {
          res.status(404).json({
            error: {
              code: 'ROUTE_NOT_FOUND',
              message: `No route found for ${context.method} ${context.path}`,
              timestamp: context.timestamp.toISOString(),
              correlationId: context.correlationId
            }
          });
          return;
        }

        // Validate request if validation rules exist
        const validation = this.routeValidations.get(routeMatch.route.id);
        if (validation) {
          const validationErrors = RequestValidator.validate(req, validation);
          if (validationErrors.length > 0) {
            res.status(400).json({
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Request validation failed',
                details: validationErrors,
                timestamp: context.timestamp.toISOString(),
                correlationId: context.correlationId
              }
            });
            return;
          }
        }

        // Sanitize request data
        RequestValidator.sanitizeRequest(req);

        // Add route information to request for downstream middleware
        req.routeMatch = routeMatch;
        req.routingContext = context;

        // Add correlation ID to response headers
        res.setHeader('x-correlation-id', context.correlationId);

        this.logger.http(`Route matched: ${context.method} ${context.path}`, {
          routeId: routeMatch.route.id,
          upstream: routeMatch.route.upstream,
          correlationId: context.correlationId,
          params: routeMatch.params
        });

        next();
      } catch (error) {
        this.logger.error('Routing engine error:', error);
        res.status(500).json({
          error: {
            code: 'ROUTING_ERROR',
            message: 'Internal routing error',
            timestamp: new Date().toISOString()
          }
        });
      }
    };
  }

  /**
   * Get all registered routes
   */
  getRoutes(): RouteConfig[] {
    return [...this.routes];
  }

  /**
   * Get route by ID
   */
  getRoute(routeId: string): RouteConfig | null {
    return this.routes.find(route => route.id === routeId) || null;
  }

  /**
   * Update route configuration
   */
  updateRoute(routeId: string, updates: Partial<RouteConfig>): boolean {
    const routeIndex = this.routes.findIndex(route => route.id === routeId);
    if (routeIndex === -1) {
      return false;
    }

    // Merge updates with existing route
    this.routes[routeIndex] = { ...this.routes[routeIndex], ...updates };

    // Re-sort routes if path or methods changed
    if (updates.path || updates.methods) {
      this.routes = this.pathMatcher.sortRoutesBySpecificity(this.routes);
    }

    this.logger.info(`Updated route: ${routeId}`, updates);
    return true;
  }

  /**
   * Clear all routes
   */
  clearRoutes(): void {
    this.routes = [];
    this.routeValidations.clear();
    this.pathMatcher.clearCache();
    this.logger.info('Cleared all routes');
  }

  /**
   * Validate route configuration
   */
  private validateRouteConfig(route: RouteConfig): void {
    if (!route.id) {
      throw new Error('Route ID is required');
    }

    if (!route.path) {
      throw new Error('Route path is required');
    }

    if (!route.methods || route.methods.length === 0) {
      throw new Error('Route methods are required');
    }

    if (!route.upstream) {
      throw new Error('Route upstream is required');
    }

    // Validate HTTP methods
    const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
    for (const method of route.methods) {
      if (!validMethods.includes(method.toUpperCase())) {
        throw new Error(`Invalid HTTP method: ${method}`);
      }
    }

    // Check for duplicate route IDs
    if (this.routes.some(existingRoute => existingRoute.id === route.id)) {
      throw new Error(`Route with ID ${route.id} already exists`);
    }
  }

  /**
   * Generate correlation ID for request tracing
   */
  private generateCorrelationId(): string {
    return `rt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}

// Extend Express Request interface to include routing information
declare global {
  namespace Express {
    interface Request {
      routeMatch?: RouteMatch;
      routingContext?: RoutingContext;
    }
  }
}