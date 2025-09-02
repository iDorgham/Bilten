import { Request, Response, NextFunction } from 'express';
import { TrafficMonitoringService } from '../services/TrafficMonitoringService';
import { Logger } from '../utils/Logger';

export interface TrafficMonitoringMiddlewareOptions {
  enableGeolocation?: boolean;
  enableUserAgentAnalysis?: boolean;
  enableIPBlocking?: boolean;
  enableGeographicRestrictions?: boolean;
}

export class TrafficMonitoringMiddleware {
  private static logger = Logger.getInstance();
  private static trafficMonitoringService: TrafficMonitoringService;
  private static options: TrafficMonitoringMiddlewareOptions = {
    enableGeolocation: true,
    enableUserAgentAnalysis: true,
    enableIPBlocking: true,
    enableGeographicRestrictions: false
  };

  static async initialize(options?: TrafficMonitoringMiddlewareOptions): Promise<void> {
    try {
      if (options) {
        TrafficMonitoringMiddleware.options = { ...TrafficMonitoringMiddleware.options, ...options };
      }

      TrafficMonitoringMiddleware.trafficMonitoringService = TrafficMonitoringService.getInstance();
      await TrafficMonitoringMiddleware.trafficMonitoringService.initialize();
      
      TrafficMonitoringMiddleware.logger.info('TrafficMonitoringMiddleware initialized successfully');
    } catch (error) {
      TrafficMonitoringMiddleware.logger.error('Failed to initialize TrafficMonitoringMiddleware:', error);
      throw error;
    }
  }

  static trafficMonitoring() {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const startTime = Date.now();

      try {
        const user = (req as any).user;
        const clientId = user ? user.id : req.ip || 'unknown';
        const clientType = user ? 'user' : 'ip';

        // Check IP access control first
        if (TrafficMonitoringMiddleware.options.enableIPBlocking) {
          const ipAccess = await TrafficMonitoringMiddleware.trafficMonitoringService.checkIPAccess(req.ip || '');
          if (!ipAccess.allowed) {
            TrafficMonitoringMiddleware.logger.warn('IP access denied', {
              ip: req.ip,
              reason: ipAccess.reason,
              path: req.path,
              method: req.method
            });

            res.status(403).json({
              error: {
                code: 'IP_ACCESS_DENIED',
                message: 'Access denied from this IP address',
                details: ipAccess.reason,
                timestamp: new Date().toISOString()
              }
            });
            return;
          }
        }

        // Check if client is blocked
        const isBlocked = await TrafficMonitoringMiddleware.trafficMonitoringService.isClientBlocked(clientId, clientType);
        if (isBlocked) {
          TrafficMonitoringMiddleware.logger.warn('Blocked client attempted access', {
            clientId,
            clientType,
            ip: req.ip,
            path: req.path,
            method: req.method
          });

          res.status(429).json({
            error: {
              code: 'CLIENT_BLOCKED',
              message: 'Client temporarily blocked due to suspicious activity',
              details: 'Your access has been temporarily restricted. Please contact support if you believe this is an error.',
              timestamp: new Date().toISOString(),
              retryAfter: 3600 // 1 hour default
            }
          });
          return;
        }

        // Continue with request processing
        next();

        // Record request after response (in the finish event)
        res.on('finish', async () => {
          try {
            const responseTime = Date.now() - startTime;
            
            // Extract geographic information (simplified - in production use a proper GeoIP service)
            const country = TrafficMonitoringMiddleware.extractCountryFromIP(req.ip || '');
            const region = TrafficMonitoringMiddleware.extractRegionFromIP(req.ip || '');

            const requestData: any = {
              clientId,
              clientType,
              endpoint: req.path,
              method: req.method,
              ip: req.ip || 'unknown',
              statusCode: res.statusCode,
              responseTime,
              timestamp: new Date(startTime)
            };

            if (TrafficMonitoringMiddleware.options.enableGeolocation && country) {
              requestData.country = country;
            }
            if (TrafficMonitoringMiddleware.options.enableGeolocation && region) {
              requestData.region = region;
            }
            if (TrafficMonitoringMiddleware.options.enableUserAgentAnalysis) {
              const userAgent = req.get('User-Agent');
              if (userAgent) {
                requestData.userAgent = userAgent;
              }
            }

            await TrafficMonitoringMiddleware.trafficMonitoringService.recordRequest(requestData);
          } catch (error) {
            TrafficMonitoringMiddleware.logger.error('Error recording request in traffic monitoring:', error);
          }
        });

      } catch (error) {
        TrafficMonitoringMiddleware.logger.error('Traffic monitoring middleware error:', error);
        // Continue with request processing even if monitoring fails
        next();
      }
    };
  }

  // Middleware for suspicious activity detection
  static suspiciousActivityDetection() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = (req as any).user;
        const clientId = user ? user.id : req.ip || 'unknown';
        const clientType = user ? 'user' : 'ip';

        // Get current traffic pattern
        const patterns = TrafficMonitoringMiddleware.trafficMonitoringService.getTrafficPatterns();
        const pattern = patterns.find(p => p.clientId === clientId && p.clientType === clientType);

        if (pattern && pattern.anomalyScore > 50) {
          // Add warning headers for suspicious activity
          res.set({
            'X-Anomaly-Score': pattern.anomalyScore.toString(),
            'X-Suspicious-Activities': pattern.suspiciousActivities.length.toString()
          });

          TrafficMonitoringMiddleware.logger.warn('High anomaly score detected', {
            clientId,
            clientType,
            anomalyScore: pattern.anomalyScore,
            suspiciousActivities: pattern.suspiciousActivities.length,
            path: req.path,
            method: req.method
          });
        }

        next();
      } catch (error) {
        TrafficMonitoringMiddleware.logger.error('Suspicious activity detection error:', error);
        next();
      }
    };
  }

  // Middleware for geographic restrictions
  static geographicRestrictions() {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (!TrafficMonitoringMiddleware.options.enableGeographicRestrictions) {
        return next();
      }

      try {
        const country = TrafficMonitoringMiddleware.extractCountryFromIP(req.ip || '');
        
        if (country) {
          const restrictions = TrafficMonitoringMiddleware.trafficMonitoringService.getGeographicRestrictions();
          
          for (const restriction of restrictions) {
            if (!restriction.isActive) continue;

            if (restriction.countries.includes(country)) {
              if (restriction.type === 'block') {
                TrafficMonitoringMiddleware.logger.warn('Geographic restriction triggered', {
                  ip: req.ip,
                  country,
                  restriction: restriction.name,
                  path: req.path,
                  method: req.method
                });

                res.status(403).json({
                  error: {
                    code: 'GEOGRAPHIC_RESTRICTION',
                    message: 'Access denied from this geographic location',
                    details: `Access from ${country} is not permitted`,
                    timestamp: new Date().toISOString()
                  }
                });
                return;
              }
            }
          }
        }

        next();
      } catch (error) {
        TrafficMonitoringMiddleware.logger.error('Geographic restrictions error:', error);
        next();
      }
    };
  }

  // Admin endpoints for traffic monitoring management
  static adminRoutes() {
    return {
      // Get traffic analytics
      getAnalytics: async (req: Request, res: Response) => {
        try {
          const date = req.query.date as string;
          const analytics = await TrafficMonitoringMiddleware.trafficMonitoringService.getAnalytics(date);
          res.json(analytics);
        } catch (error) {
          TrafficMonitoringMiddleware.logger.error('Error getting analytics:', error);
          res.status(500).json({ error: 'Failed to get analytics' });
        }
      },

      // Get traffic patterns
      getTrafficPatterns: async (_req: Request, res: Response) => {
        try {
          const patterns = TrafficMonitoringMiddleware.trafficMonitoringService.getTrafficPatterns();
          res.json(patterns);
        } catch (error) {
          TrafficMonitoringMiddleware.logger.error('Error getting traffic patterns:', error);
          res.status(500).json({ error: 'Failed to get traffic patterns' });
        }
      },

      // Block a client
      blockClient: async (req: Request, res: Response) => {
        try {
          const { clientId, clientType, reason, duration } = req.body;
          
          if (!clientId || !clientType || !reason) {
            return res.status(400).json({ error: 'Missing required fields' });
          }

          await TrafficMonitoringMiddleware.trafficMonitoringService.blockClient(
            clientId,
            clientType,
            reason,
            duration || 3600
          );

          return res.json({ success: true, message: 'Client blocked successfully' });
        } catch (error) {
          TrafficMonitoringMiddleware.logger.error('Error blocking client:', error);
          return res.status(500).json({ error: 'Failed to block client' });
        }
      },

      // Unblock a client
      unblockClient: async (req: Request, res: Response) => {
        try {
          const { clientId, clientType } = req.body;
          
          if (!clientId || !clientType) {
            return res.status(400).json({ error: 'Missing required fields' });
          }

          await TrafficMonitoringMiddleware.trafficMonitoringService.unblockClient(clientId, clientType);

          return res.json({ success: true, message: 'Client unblocked successfully' });
        } catch (error) {
          TrafficMonitoringMiddleware.logger.error('Error unblocking client:', error);
          return res.status(500).json({ error: 'Failed to unblock client' });
        }
      },

      // Add geographic restriction
      addGeographicRestriction: async (req: Request, res: Response) => {
        try {
          const restriction = req.body;
          
          if (!restriction.name || !restriction.type || !restriction.countries) {
            return res.status(400).json({ error: 'Missing required fields' });
          }

          const id = await TrafficMonitoringMiddleware.trafficMonitoringService.addGeographicRestriction(restriction);

          return res.json({ success: true, id, message: 'Geographic restriction added successfully' });
        } catch (error) {
          TrafficMonitoringMiddleware.logger.error('Error adding geographic restriction:', error);
          return res.status(500).json({ error: 'Failed to add geographic restriction' });
        }
      },

      // Remove geographic restriction
      removeGeographicRestriction: async (req: Request, res: Response) => {
        try {
          const { id } = req.params;
          
          await TrafficMonitoringMiddleware.trafficMonitoringService.removeGeographicRestriction(id);

          res.json({ success: true, message: 'Geographic restriction removed successfully' });
        } catch (error) {
          TrafficMonitoringMiddleware.logger.error('Error removing geographic restriction:', error);
          res.status(500).json({ error: 'Failed to remove geographic restriction' });
        }
      },

      // Add IP access control
      addIPAccessControl: async (req: Request, res: Response) => {
        try {
          const control = req.body;
          
          if (!control.ipAddress || !control.type || !control.reason) {
            return res.status(400).json({ error: 'Missing required fields' });
          }

          const id = await TrafficMonitoringMiddleware.trafficMonitoringService.addIPAccessControl(control);

          return res.json({ success: true, id, message: 'IP access control added successfully' });
        } catch (error) {
          TrafficMonitoringMiddleware.logger.error('Error adding IP access control:', error);
          return res.status(500).json({ error: 'Failed to add IP access control' });
        }
      },

      // Remove IP access control
      removeIPAccessControl: async (req: Request, res: Response) => {
        try {
          const { id } = req.params;
          
          await TrafficMonitoringMiddleware.trafficMonitoringService.removeIPAccessControl(id);

          res.json({ success: true, message: 'IP access control removed successfully' });
        } catch (error) {
          TrafficMonitoringMiddleware.logger.error('Error removing IP access control:', error);
          res.status(500).json({ error: 'Failed to remove IP access control' });
        }
      },

      // Get geographic restrictions
      getGeographicRestrictions: async (_req: Request, res: Response) => {
        try {
          const restrictions = TrafficMonitoringMiddleware.trafficMonitoringService.getGeographicRestrictions();
          res.json(restrictions);
        } catch (error) {
          TrafficMonitoringMiddleware.logger.error('Error getting geographic restrictions:', error);
          res.status(500).json({ error: 'Failed to get geographic restrictions' });
        }
      },

      // Get IP access controls
      getIPAccessControls: async (_req: Request, res: Response) => {
        try {
          const controls = TrafficMonitoringMiddleware.trafficMonitoringService.getIPAccessControls();
          res.json(controls);
        } catch (error) {
          TrafficMonitoringMiddleware.logger.error('Error getting IP access controls:', error);
          res.status(500).json({ error: 'Failed to get IP access controls' });
        }
      }
    };
  }

  // Utility methods
  private static extractCountryFromIP(ip: string): string | undefined {
    // Simplified country extraction - in production, use a proper GeoIP service
    // This is just for demonstration purposes
    if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
      return 'LOCAL'; // Private IP ranges
    }
    
    // Mock country detection based on IP ranges (not accurate, just for testing)
    const ipNum = TrafficMonitoringMiddleware.ipToNumber(ip);
    if (ipNum >= TrafficMonitoringMiddleware.ipToNumber('1.0.0.0') && ipNum <= TrafficMonitoringMiddleware.ipToNumber('50.255.255.255')) {
      return 'US';
    } else if (ipNum >= TrafficMonitoringMiddleware.ipToNumber('51.0.0.0') && ipNum <= TrafficMonitoringMiddleware.ipToNumber('100.255.255.255')) {
      return 'UK';
    } else if (ipNum >= TrafficMonitoringMiddleware.ipToNumber('101.0.0.0') && ipNum <= TrafficMonitoringMiddleware.ipToNumber('150.255.255.255')) {
      return 'DE';
    }
    
    return 'UNKNOWN';
  }

  private static extractRegionFromIP(ip: string): string | undefined {
    // Simplified region extraction - in production, use a proper GeoIP service
    const country = TrafficMonitoringMiddleware.extractCountryFromIP(ip);
    
    switch (country) {
      case 'US': return 'North America';
      case 'UK': return 'Europe';
      case 'DE': return 'Europe';
      default: return undefined;
    }
  }

  private static ipToNumber(ip: string): number {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
  }

  static getTrafficMonitoringService(): TrafficMonitoringService {
    return TrafficMonitoringMiddleware.trafficMonitoringService;
  }

  static updateOptions(options: Partial<TrafficMonitoringMiddlewareOptions>): void {
    TrafficMonitoringMiddleware.options = { ...TrafficMonitoringMiddleware.options, ...options };
    TrafficMonitoringMiddleware.logger.info('Traffic monitoring middleware options updated', options);
  }

  static async shutdown(): Promise<void> {
    if (TrafficMonitoringMiddleware.trafficMonitoringService) {
      await TrafficMonitoringMiddleware.trafficMonitoringService.shutdown();
    }
  }
}