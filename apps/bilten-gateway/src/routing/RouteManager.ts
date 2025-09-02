import { Application } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { Logger } from '../utils/Logger';
import { ConfigManager } from '../config/ConfigManager';
import { TransformationManager } from '../services/TransformationManager';
import { RoutingEngine } from './RoutingEngine';
import { RouteConfig as RoutingRouteConfig } from './types';

export interface RouteConfig {
  path: string;
  target: string;
  methods: string[];
  authentication: boolean;
  rateLimit?: {
    windowMs: number;
    max: number;
  };
  trafficControl?: {
    burstProtection: boolean;
    adaptiveLimit: boolean;
  };
}

export class RouteManager {
  private logger = Logger.getInstance();
  private configManager = new ConfigManager();
  private transformationManager = new TransformationManager();
  private routingEngine = new RoutingEngine();
  private routes: RouteConfig[] = [];

  async setupRoutes(app: Application): Promise<void> {
    try {
      // Initialize transformation manager
      await this.transformationManager.initialize();
      
      // Load route configurations
      await this.loadRouteConfigurations();
      
      // Setup routing engine middleware
      app.use(this.routingEngine.middleware());
      
      // Setup proxy routes for each service
      this.setupServiceRoutes(app);
      
      this.logger.info(`Configured ${this.routes.length} routes with transformation support`);
    } catch (error) {
      this.logger.error('Failed to setup routes:', error);
      throw error;
    }
  }

  private async loadRouteConfigurations(): Promise<void> {
    // Default route configurations for Bilten services with traffic control settings
    this.routes = [
      {
        path: '/api/users',
        target: this.configManager.getServiceConfig('user').url,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        authentication: true,
        rateLimit: { windowMs: 60000, max: 100 },
        trafficControl: { burstProtection: true, adaptiveLimit: true }
      },
      {
        path: '/api/auth',
        target: this.configManager.getServiceConfig('user').url,
        methods: ['POST'],
        authentication: false,
        rateLimit: { windowMs: 900000, max: 5 }, // 15 minutes, 5 attempts
        trafficControl: { burstProtection: true, adaptiveLimit: false }
      },
      {
        path: '/api/events',
        target: this.configManager.getServiceConfig('event').url,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        authentication: true,
        rateLimit: { windowMs: 60000, max: 200 },
        trafficControl: { burstProtection: true, adaptiveLimit: true }
      },
      {
        path: '/api/payments',
        target: this.configManager.getServiceConfig('payment').url,
        methods: ['GET', 'POST'],
        authentication: true,
        rateLimit: { windowMs: 60000, max: 10 }, // Strict limit for payments
        trafficControl: { burstProtection: true, adaptiveLimit: false }
      },
      {
        path: '/api/notifications',
        target: this.configManager.getServiceConfig('notification').url,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        authentication: true,
        rateLimit: { windowMs: 60000, max: 50 },
        trafficControl: { burstProtection: true, adaptiveLimit: true }
      },
      {
        path: '/api/files',
        target: this.configManager.getServiceConfig('file').url,
        methods: ['GET', 'POST', 'DELETE'],
        authentication: true,
        rateLimit: { windowMs: 60000, max: 20 }, // Lower limit for file operations
        trafficControl: { burstProtection: true, adaptiveLimit: false }
      },
      {
        path: '/api/analytics',
        target: this.configManager.getServiceConfig('analytics').url,
        methods: ['GET', 'POST'],
        authentication: true,
        rateLimit: { windowMs: 60000, max: 150 },
        trafficControl: { burstProtection: true, adaptiveLimit: true }
      }
    ];

    // Register routes with routing engine and apply transformations
    this.routes.forEach(route => {
      const transformation = this.transformationManager.getTransformationForRoute(route.path);
      
      const routingConfig: RoutingRouteConfig = {
        id: `${route.path.replace(/\//g, '-')}-route`,
        path: route.path,
        methods: route.methods,
        upstream: route.target,
        authentication: route.authentication,
        version: '1.0',
        enabled: true,
        metadata: {
          rateLimit: route.rateLimit,
          trafficControl: route.trafficControl
        }
      };

      if (transformation) {
        routingConfig.transformation = transformation;
      }

      this.routingEngine.registerRoute(routingConfig);
    });
  }

  private setupServiceRoutes(app: Application): void {
    this.routes.forEach(route => {
      const proxyOptions = {
        target: route.target,
        changeOrigin: true,
        timeout: 30000,
        proxyTimeout: 30000,
        onError: (err: any, _req: any, res: any) => {
          this.logger.error(`Proxy error for ${route.path}:`, err);
          res.status(502).json({
            error: {
              code: 'SERVICE_UNAVAILABLE',
              message: 'The requested service is temporarily unavailable',
              timestamp: new Date().toISOString()
            }
          });
        },
        onProxyReq: (proxyReq: any, req: any) => {
          // Add correlation ID for tracing
          const correlationId = req.headers['x-correlation-id'] || this.generateCorrelationId();
          proxyReq.setHeader('x-correlation-id', correlationId);
          
          // Add gateway metadata
          proxyReq.setHeader('x-gateway-timestamp', new Date().toISOString());
          proxyReq.setHeader('x-gateway-version', '1.0.0');
          
          this.logger.http(`Proxying ${req.method} ${req.path} to ${route.target}`, {
            correlationId,
            method: req.method,
            path: req.path,
            target: route.target
          });
        },
        onProxyRes: (proxyRes: any, req: any) => {
          // Add CORS headers
          proxyRes.headers['Access-Control-Allow-Origin'] = '*';
          proxyRes.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS';
          proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Content-Length, X-Requested-With';
          
          this.logger.http(`Response from ${route.target}`, {
            statusCode: proxyRes.statusCode,
            method: req.method,
            path: req.path
          });
        }
      };

      // Create proxy middleware
      const proxy = createProxyMiddleware(route.path, proxyOptions);
      
      // Apply proxy to the specified methods
      route.methods.forEach(method => {
        switch (method.toUpperCase()) {
          case 'GET':
            app.get(`${route.path}/*`, proxy);
            break;
          case 'POST':
            app.post(`${route.path}/*`, proxy);
            break;
          case 'PUT':
            app.put(`${route.path}/*`, proxy);
            break;
          case 'DELETE':
            app.delete(`${route.path}/*`, proxy);
            break;
          case 'PATCH':
            app.patch(`${route.path}/*`, proxy);
            break;
        }
      });

      this.logger.info(`Configured route: ${route.methods.join(',')} ${route.path} -> ${route.target}`);
    });
  }

  private generateCorrelationId(): string {
    return `gw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getRoutes(): RouteConfig[] {
    return [...this.routes];
  }

  getTransformationManager(): TransformationManager {
    return this.transformationManager;
  }

  getRoutingEngine(): RoutingEngine {
    return this.routingEngine;
  }
}