import express, { Application } from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer, Server } from 'http';
import { Logger } from '../utils/Logger';
import { ConfigManager } from '../config/ConfigManager';
import { RouteManager } from '../routing/RouteManager';
import { AuthenticationMiddleware } from '../middleware/AuthenticationMiddleware';
import { RateLimitMiddleware } from '../middleware/RateLimitMiddleware';
import { MetricsMiddleware } from '../middleware/MetricsMiddleware';
import { TransformationMiddleware } from '../middleware/TransformationMiddleware';
import { ErrorHandler } from '../middleware/ErrorHandler';
import { HealthCheckService } from '../services/HealthCheckService';
import { ServiceRegistry } from '../services/ServiceRegistry';
import { AnalyticsService } from '../services/AnalyticsService';
import { MonitoringDashboard } from '../services/MonitoringDashboard';

export class GatewayServer {
  private app: Application;
  private server: Server | null = null;
  private logger = Logger.getInstance();
  private configManager: ConfigManager;
  private routeManager: RouteManager;
  private healthCheckService: HealthCheckService;
  private serviceRegistry: ServiceRegistry;
  private analyticsService: AnalyticsService;
  private monitoringDashboard: MonitoringDashboard;

  constructor() {
    this.app = express();
    this.configManager = new ConfigManager();
    this.routeManager = new RouteManager();
    this.healthCheckService = new HealthCheckService();
    this.serviceRegistry = new ServiceRegistry();
    this.analyticsService = new AnalyticsService(this.healthCheckService);
    this.monitoringDashboard = new MonitoringDashboard(this.analyticsService, this.healthCheckService);
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing API Gateway...');
      
      // Load configuration
      await this.configManager.loadConfig();
      
      // Initialize rate limiting with Redis
      await RateLimitMiddleware.initialize(this.configManager);
      
      // Initialize services
      await this.serviceRegistry.initialize();
      await this.healthCheckService.initialize();
      await this.analyticsService.initialize();
      await this.monitoringDashboard.initialize();
      
      // Setup middleware
      this.setupMiddleware();
      
      // Setup routes
      await this.setupRoutes();
      
      // Setup error handling
      this.setupErrorHandling();
      
      this.logger.info('API Gateway initialization completed');
    } catch (error) {
      this.logger.error('Failed to initialize API Gateway:', error);
      throw error;
    }
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }));

    // CORS configuration
    this.app.use(cors({
      origin: this.configManager.getAllowedOrigins(),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Client-Version']
    }));

    // Compression
    this.app.use(compression());

    // Request parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Custom middleware
    this.app.use(MetricsMiddleware.collectMetrics());
    
    // Advanced traffic control (includes rate limiting, burst protection, etc.)
    this.app.use(RateLimitMiddleware.trafficControl());
    
    // Fallback basic rate limiter for additional protection
    this.app.use(RateLimitMiddleware.createRateLimiter());
    
    this.app.use(AuthenticationMiddleware.authenticate());
    
    // Request transformation middleware (applied before proxying)
    this.app.use(TransformationMiddleware.transformRequest());
    
    // Response transformation middleware (applied after proxying)
    this.app.use(TransformationMiddleware.transformResponse());
  }

  private async setupRoutes(): Promise<void> {
    // Health check endpoint
    this.app.get('/health', (_req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime()
      });
    });

    // Serve monitoring dashboard
    this.app.get('/dashboard', (_req, res) => {
      res.sendFile(path.join(process.cwd(), 'public', 'dashboard.html'));
    });

    // Serve static files
    this.app.use('/public', express.static(path.join(process.cwd(), 'public')));

    // Comprehensive monitoring and analytics endpoints
    this.setupMonitoringEndpoints();

    // Traffic control management endpoints
    this.app.get('/api/gateway/traffic-control/config', (_req, res) => {
      const config = RateLimitMiddleware.getTrafficControlConfig();
      res.json({ config });
    });

    this.app.put('/api/gateway/traffic-control/config', (req, res) => {
      try {
        RateLimitMiddleware.updateTrafficControlConfig(req.body);
        res.json({ message: 'Traffic control configuration updated successfully' });
      } catch (error) {
        res.status(400).json({ error: 'Invalid configuration' });
      }
    });

    this.app.get('/api/gateway/traffic-control/stats', async (_req, res) => {
      try {
        const stats = await RateLimitMiddleware.getRateLimitStats();
        res.json({ stats });
      } catch (error) {
        res.status(500).json({ error: 'Failed to get traffic control stats' });
      }
    });

    this.app.post('/api/gateway/traffic-control/system-load', (req, res) => {
      try {
        const { load } = req.body;
        if (typeof load !== 'number' || load < 0 || load > 1) {
          return res.status(400).json({ error: 'Load must be a number between 0 and 1' });
        }
        RateLimitMiddleware.updateSystemLoad(load);
        return res.json({ message: 'System load updated successfully' });
      } catch (error) {
        return res.status(500).json({ error: 'Failed to update system load' });
      }
    });

    // Transformation management endpoints
    this.app.get('/api/gateway/transformations', (_req, res) => {
      try {
        const transformations = this.routeManager.getTransformationManager().getAllTransformationRules();
        const stats = this.routeManager.getTransformationManager().getStatistics();
        res.json({ transformations, statistics: stats });
      } catch (error) {
        res.status(500).json({ error: 'Failed to get transformations' });
      }
    });

    this.app.post('/api/gateway/transformations/reload', async (_req, res) => {
      try {
        await this.routeManager.getTransformationManager().reloadConfiguration();
        res.json({ message: 'Transformation configuration reloaded successfully' });
      } catch (error) {
        res.status(500).json({ error: 'Failed to reload transformation configuration' });
      }
    });

    this.app.post('/api/gateway/transformations/:name', (req, res) => {
      try {
        const { name } = req.params;
        const config = req.body;
        this.routeManager.getTransformationManager().addTransformationRule(name, config);
        res.json({ message: `Transformation rule '${name}' added successfully` });
      } catch (error) {
        res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid transformation rule' });
      }
    });

    this.app.delete('/api/gateway/transformations/:name', (req, res) => {
      try {
        const { name } = req.params;
        const removed = this.routeManager.getTransformationManager().removeTransformationRule(name);
        if (removed) {
          res.json({ message: `Transformation rule '${name}' removed successfully` });
        } else {
          res.status(404).json({ error: `Transformation rule '${name}' not found` });
        }
      } catch (error) {
        res.status(500).json({ error: 'Failed to remove transformation rule' });
      }
    });

    // Setup dynamic routing
    await this.routeManager.setupRoutes(this.app);
  }

  private setupMonitoringEndpoints(): void {
    // Dashboard data endpoint
    this.app.get('/api/gateway/dashboard', (_req, res) => {
      try {
        const dashboardData = this.monitoringDashboard.getDashboardData();
        res.json(dashboardData);
      } catch (error) {
        res.status(500).json({ error: 'Failed to get dashboard data' });
      }
    });

    // Real-time metrics endpoint
    this.app.get('/api/gateway/metrics/realtime', (_req, res) => {
      try {
        const realtimeData = this.monitoringDashboard.getRealtimeDashboardData();
        res.json(realtimeData);
      } catch (error) {
        res.status(500).json({ error: 'Failed to get real-time metrics' });
      }
    });

    // Performance analytics endpoint
    this.app.get('/api/gateway/analytics/performance', (req, res) => {
      try {
        const { start, end } = req.query;
        const timeRange = start && end ? {
          start: new Date(start as string),
          end: new Date(end as string)
        } : undefined;

        const analytics = this.analyticsService.getPerformanceAnalytics(timeRange);
        res.json(analytics);
      } catch (error) {
        res.status(500).json({ error: 'Failed to get performance analytics' });
      }
    });

    // Historical data endpoint
    this.app.get('/api/gateway/analytics/historical', (req, res) => {
      try {
        const { start, end, interval = 'hour' } = req.query;
        
        if (!start || !end) {
          return res.status(400).json({ error: 'Start and end dates are required' });
        }

        const timeRange = {
          start: new Date(start as string),
          end: new Date(end as string)
        };

        const historicalData = this.monitoringDashboard.getHistoricalData(
          timeRange, 
          interval as 'minute' | 'hour' | 'day'
        );
        return res.json(historicalData);
      } catch (error) {
        return res.status(500).json({ error: 'Failed to get historical data' });
      }
    });

    // Endpoint analytics
    this.app.get('/api/gateway/analytics/endpoints/:endpoint', (req, res) => {
      try {
        const { endpoint } = req.params;
        const { method } = req.query;
        
        const decodedEndpoint = decodeURIComponent(endpoint);
        const analytics = this.monitoringDashboard.getEndpointAnalytics(
          decodedEndpoint, 
          method as string
        );
        
        if (!analytics) {
          return res.status(404).json({ error: 'Endpoint not found' });
        }
        
        return res.json(analytics);
      } catch (error) {
        return res.status(500).json({ error: 'Failed to get endpoint analytics' });
      }
    });

    // Top endpoints
    this.app.get('/api/gateway/analytics/top-endpoints', (req, res) => {
      try {
        const { limit = 10, start, end } = req.query;
        const timeRange = start && end ? {
          start: new Date(start as string),
          end: new Date(end as string)
        } : undefined;

        const topEndpoints = this.monitoringDashboard.getTopEndpoints(
          parseInt(limit as string), 
          timeRange
        );
        res.json(topEndpoints);
      } catch (error) {
        res.status(500).json({ error: 'Failed to get top endpoints' });
      }
    });

    // Slowest endpoints
    this.app.get('/api/gateway/analytics/slowest-endpoints', (req, res) => {
      try {
        const { limit = 10, start, end } = req.query;
        const timeRange = start && end ? {
          start: new Date(start as string),
          end: new Date(end as string)
        } : undefined;

        const slowestEndpoints = this.monitoringDashboard.getSlowestEndpoints(
          parseInt(limit as string), 
          timeRange
        );
        res.json(slowestEndpoints);
      } catch (error) {
        res.status(500).json({ error: 'Failed to get slowest endpoints' });
      }
    });

    // System health
    this.app.get('/api/gateway/health/system', (_req, res) => {
      try {
        const systemHealth = this.monitoringDashboard.getSystemHealth();
        res.json(systemHealth);
      } catch (error) {
        res.status(500).json({ error: 'Failed to get system health' });
      }
    });

    // Service health details
    this.app.get('/api/gateway/health/services', (_req, res) => {
      try {
        const services = this.healthCheckService.getAllServiceHealth();
        res.json(services);
      } catch (error) {
        res.status(500).json({ error: 'Failed to get service health' });
      }
    });

    // Force health check
    this.app.post('/api/gateway/health/check/:service?', async (req, res) => {
      try {
        const { service } = req.params;
        await this.healthCheckService.forceHealthCheck(service);
        res.json({ message: service ? `Health check triggered for ${service}` : 'Health check triggered for all services' });
      } catch (error) {
        res.status(500).json({ error: 'Failed to trigger health check' });
      }
    });

    // Alert management endpoints
    this.app.get('/api/gateway/alerts', (_req, res) => {
      try {
        const alerts = this.analyticsService.getActiveAlerts();
        res.json(alerts);
      } catch (error) {
        res.status(500).json({ error: 'Failed to get alerts' });
      }
    });

    this.app.get('/api/gateway/alerts/rules', (_req, res) => {
      try {
        const rules = this.analyticsService.getAlertRules();
        res.json(rules);
      } catch (error) {
        res.status(500).json({ error: 'Failed to get alert rules' });
      }
    });

    this.app.post('/api/gateway/alerts/rules', (req, res) => {
      try {
        const rule = req.body;
        this.analyticsService.addAlertRule(rule);
        res.json({ message: 'Alert rule added successfully' });
      } catch (error) {
        res.status(400).json({ error: 'Failed to add alert rule' });
      }
    });

    this.app.put('/api/gateway/alerts/rules/:ruleId', (req, res) => {
      try {
        const { ruleId } = req.params;
        const updates = req.body;
        const success = this.analyticsService.updateAlertRule(ruleId, updates);
        
        if (success) {
          res.json({ message: 'Alert rule updated successfully' });
        } else {
          res.status(404).json({ error: 'Alert rule not found' });
        }
      } catch (error) {
        res.status(400).json({ error: 'Failed to update alert rule' });
      }
    });

    this.app.delete('/api/gateway/alerts/rules/:ruleId', (req, res) => {
      try {
        const { ruleId } = req.params;
        const success = this.analyticsService.deleteAlertRule(ruleId);
        
        if (success) {
          res.json({ message: 'Alert rule deleted successfully' });
        } else {
          res.status(404).json({ error: 'Alert rule not found' });
        }
      } catch (error) {
        res.status(500).json({ error: 'Failed to delete alert rule' });
      }
    });

    // Metrics export endpoints
    this.app.get('/api/gateway/export/metrics', async (req, res) => {
      try {
        const { format = 'json', start, end } = req.query;
        const timeRange = start && end ? {
          start: new Date(start as string),
          end: new Date(end as string)
        } : undefined;

        const exportedData = await this.monitoringDashboard.exportMetrics(
          format as 'json' | 'csv' | 'prometheus',
          timeRange
        );

        if (format === 'csv') {
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', 'attachment; filename=metrics.csv');
          res.send(exportedData);
        } else if (format === 'prometheus') {
          res.setHeader('Content-Type', 'text/plain');
          res.send(exportedData);
        } else {
          res.json(exportedData);
        }
      } catch (error) {
        res.status(500).json({ error: 'Failed to export metrics' });
      }
    });

    // Raw metrics endpoint (for debugging)
    this.app.get('/api/gateway/metrics/raw', (req, res) => {
      try {
        const { limit = 100 } = req.query;
        const metrics = MetricsMiddleware.getMetrics().slice(-parseInt(limit as string));
        res.json(metrics);
      } catch (error) {
        res.status(500).json({ error: 'Failed to get raw metrics' });
      }
    });

    // Clear metrics (for testing/debugging)
    this.app.delete('/api/gateway/metrics', (_req, res) => {
      try {
        MetricsMiddleware.clearMetrics();
        res.json({ message: 'Metrics cleared successfully' });
      } catch (error) {
        res.status(500).json({ error: 'Failed to clear metrics' });
      }
    });

    // Gateway configuration endpoint
    this.app.get('/api/gateway/config', (_req, res) => {
      try {
        const config = {
          version: process.env.npm_package_version || '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          uptime: process.uptime(),
          services: this.configManager.getConfig().services,
          features: {
            analytics: true,
            monitoring: true,
            alerting: true,
            trafficControl: true,
            transformation: true
          }
        };
        res.json(config);
      } catch (error) {
        res.status(500).json({ error: 'Failed to get gateway configuration' });
      }
    });
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: {
          code: 'ROUTE_NOT_FOUND',
          message: 'The requested endpoint was not found',
          path: req.originalUrl,
          timestamp: new Date().toISOString()
        }
      });
    });

    // Global error handler
    this.app.use(ErrorHandler.handleError());
  }

  async start(port: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = createServer(this.app);
      
      this.server.listen(port, () => {
        this.logger.info(`API Gateway listening on port ${port}`);
        resolve();
      });

      this.server.on('error', (error) => {
        this.logger.error('Server error:', error);
        reject(error);
      });

      // Graceful shutdown
      process.on('SIGTERM', () => this.shutdown());
      process.on('SIGINT', () => this.shutdown());
    });
  }

  private async shutdown(): Promise<void> {
    this.logger.info('Shutting down API Gateway...');
    
    if (this.server) {
      this.server.close(() => {
        this.logger.info('HTTP server closed');
      });
    }

    // Cleanup services
    await this.serviceRegistry.shutdown();
    await this.healthCheckService.shutdown();
    await this.analyticsService.shutdown();
    await this.monitoringDashboard.shutdown();
    await RateLimitMiddleware.shutdown();
    
    this.logger.info('API Gateway shutdown completed');
    process.exit(0);
  }
}