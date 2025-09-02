import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/Logger';

export interface RequestMetrics {
  timestamp: Date;
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  requestSize: number;
  responseSize: number;
  userAgent?: string | undefined;
  clientIP: string;
  userId?: string | undefined;
  route?: string; // Matched route pattern
  service?: string; // Target service name
  error?: string; // Error message if any
  headers?: { [key: string]: string }; // Selected headers
}

export class MetricsMiddleware {
  private static logger = Logger.getInstance();
  private static metrics: RequestMetrics[] = [];
  private static readonly MAX_METRICS_BUFFER = 1000;

  static collectMetrics() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startHrTime = process.hrtime();

      // Capture request size
      const requestSize = parseInt(req.get('content-length') || '0', 10);

      // Override res.end to capture response metrics
      const originalEnd = res.end;
      res.end = function(chunk?: any, encoding?: any): Response {
        const diff = process.hrtime(startHrTime);
        const responseTime = diff[0] * 1000 + diff[1] * 1e-6; // Convert to milliseconds

        // Capture response size
        const responseSize = parseInt(res.get('content-length') || '0', 10) || 
                           (chunk ? Buffer.byteLength(chunk, encoding) : 0);

        const user = (req as any).user;
        const route = (req as any).route;
        const targetService = (req as any).targetService;
        const error = (res as any).error;
        
        const metrics: RequestMetrics = {
          timestamp: new Date(),
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          responseTime,
          requestSize,
          responseSize,
          userAgent: req.get('User-Agent') || undefined,
          clientIP: req.ip || req.connection.remoteAddress || 'unknown',
          userId: user?.id || undefined,
          route: route?.path || undefined,
          service: targetService || undefined,
          error: error || undefined,
          headers: {
            'content-type': req.get('Content-Type') || '',
            'accept': req.get('Accept') || '',
            'x-forwarded-for': req.get('X-Forwarded-For') || ''
          }
        };

        MetricsMiddleware.addMetric(metrics);
        MetricsMiddleware.logRequest(metrics);

        // Call original end method
        return originalEnd.call(this, chunk, encoding) as Response;
      };

      next();
    };
  }

  private static addMetric(metric: RequestMetrics): void {
    this.metrics.push(metric);
    
    // Keep buffer size manageable
    if (this.metrics.length > this.MAX_METRICS_BUFFER) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS_BUFFER);
    }
  }

  private static logRequest(metrics: RequestMetrics): void {
    const logLevel = metrics.statusCode >= 400 ? 'warn' : 'http';
    
    this.logger[logLevel]('Request processed', {
      method: metrics.method,
      path: metrics.path,
      statusCode: metrics.statusCode,
      responseTime: `${metrics.responseTime.toFixed(2)}ms`,
      requestSize: `${metrics.requestSize}b`,
      responseSize: `${metrics.responseSize}b`,
      clientIP: metrics.clientIP,
      userId: metrics.userId,
      userAgent: metrics.userAgent
    });
  }

  static getMetrics(): RequestMetrics[] {
    return [...this.metrics];
  }

  static getMetricsSummary() {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => m.timestamp.getTime() > oneHourAgo);

    if (recentMetrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        errorRate: 0,
        requestsPerMinute: 0
      };
    }

    const totalRequests = recentMetrics.length;
    const errorRequests = recentMetrics.filter(m => m.statusCode >= 400).length;
    const totalResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0);
    
    return {
      totalRequests,
      averageResponseTime: totalResponseTime / totalRequests,
      errorRate: (errorRequests / totalRequests) * 100,
      requestsPerMinute: totalRequests / 60,
      statusCodeDistribution: this.getStatusCodeDistribution(recentMetrics),
      topEndpoints: this.getTopEndpoints(recentMetrics),
      slowestEndpoints: this.getSlowestEndpoints(recentMetrics)
    };
  }

  private static getStatusCodeDistribution(metrics: RequestMetrics[]) {
    const distribution: { [key: string]: number } = {};
    
    metrics.forEach(m => {
      const statusRange = `${Math.floor(m.statusCode / 100)}xx`;
      distribution[statusRange] = (distribution[statusRange] || 0) + 1;
    });

    return distribution;
  }

  private static getTopEndpoints(metrics: RequestMetrics[], limit = 10) {
    const endpointCounts: { [key: string]: number } = {};
    
    metrics.forEach(m => {
      const endpoint = `${m.method} ${m.path}`;
      endpointCounts[endpoint] = (endpointCounts[endpoint] || 0) + 1;
    });

    return Object.entries(endpointCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([endpoint, count]) => ({ endpoint, count }));
  }

  private static getSlowestEndpoints(metrics: RequestMetrics[], limit = 10) {
    const endpointTimes: { [key: string]: { total: number; count: number } } = {};
    
    metrics.forEach(m => {
      const endpoint = `${m.method} ${m.path}`;
      if (!endpointTimes[endpoint]) {
        endpointTimes[endpoint] = { total: 0, count: 0 };
      }
      endpointTimes[endpoint].total += m.responseTime;
      endpointTimes[endpoint].count += 1;
    });

    return Object.entries(endpointTimes)
      .map(([endpoint, { total, count }]) => ({
        endpoint,
        averageResponseTime: total / count,
        requestCount: count
      }))
      .sort((a, b) => b.averageResponseTime - a.averageResponseTime)
      .slice(0, limit);
  }

  static clearMetrics(): void {
    this.metrics = [];
    this.logger.info('Metrics buffer cleared');
  }
}