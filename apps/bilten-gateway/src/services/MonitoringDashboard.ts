import { Logger } from '../utils/Logger';
import { AnalyticsService } from './AnalyticsService';
import { HealthCheckService } from './HealthCheckService';
import { MetricsMiddleware } from '../middleware/MetricsMiddleware';
// import { RateLimitMiddleware } from '../middleware/RateLimitMiddleware';

export interface DashboardData {
  overview: {
    status: 'healthy' | 'warning' | 'critical';
    uptime: number;
    totalRequests: number;
    activeAlerts: number;
    servicesHealth: {
      healthy: number;
      total: number;
      percentage: number;
    };
  };
  performance: {
    requestsPerSecond: number;
    averageResponseTime: number;
    errorRate: number;
    p95ResponseTime: number;
  };
  system: {
    cpuUsage: number;
    memoryUsage: number;
    loadAverage: number[];
  };
  services: Array<{
    name: string;
    status: 'healthy' | 'unhealthy' | 'unknown';
    responseTime?: number | undefined;
    lastCheck: Date;
    error?: string | undefined;
  }>;
  alerts: Array<{
    id: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: Date;
  }>;
  trafficControl: {
    rateLimitHits: number;
    blockedRequests: number;
    systemLoad: number;
  };
}

export interface HistoricalData {
  timeRange: {
    start: Date;
    end: Date;
    interval: 'minute' | 'hour' | 'day';
  };
  metrics: Array<{
    timestamp: Date;
    requestCount: number;
    averageResponseTime: number;
    errorRate: number;
    cpuUsage: number;
    memoryUsage: number;
  }>;
}

export interface EndpointAnalytics {
  endpoint: string;
  method: string;
  path: string;
  metrics: {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    requestsPerHour: number;
  };
  recentActivity: Array<{
    timestamp: Date;
    responseTime: number;
    statusCode: number;
    userAgent?: string | undefined;
    clientIP: string;
  }>;
  errors: Array<{
    timestamp: Date;
    statusCode: number;
    error?: string | undefined;
    clientIP: string;
  }>;
}

export class MonitoringDashboard {
  private logger = Logger.getInstance();
  private wsConnections = new Set<any>(); // WebSocket connections for real-time updates

  constructor(
    private analyticsService: AnalyticsService,
    private healthCheckService: HealthCheckService
  ) {}

  async initialize(): Promise<void> {
    this.logger.info('Initializing Monitoring Dashboard...');
    
    // Start real-time data broadcasting
    this.startRealtimeBroadcast();
    
    this.logger.info('Monitoring Dashboard initialized successfully');
  }

  private startRealtimeBroadcast(): void {
    // Broadcast real-time updates every 5 seconds
    setInterval(() => {
      if (this.wsConnections.size > 0) {
        const realtimeData = this.getRealtimeDashboardData();
        this.broadcastToConnections('realtime-update', realtimeData);
      }
    }, 5000);
  }

  private broadcastToConnections(event: string, data: any): void {
    const message = JSON.stringify({ event, data, timestamp: new Date() });
    
    this.wsConnections.forEach(ws => {
      try {
        if (ws.readyState === 1) { // WebSocket.OPEN
          ws.send(message);
        }
      } catch (error) {
        this.logger.warn('Failed to send WebSocket message:', error);
        this.wsConnections.delete(ws);
      }
    });
  }

  addWebSocketConnection(ws: any): void {
    this.wsConnections.add(ws);
    
    // Send initial dashboard data
    const initialData = this.getDashboardData();
    ws.send(JSON.stringify({ 
      event: 'initial-data', 
      data: initialData, 
      timestamp: new Date() 
    }));

    ws.on('close', () => {
      this.wsConnections.delete(ws);
    });

    this.logger.debug('WebSocket connection added for monitoring dashboard');
  }

  getDashboardData(): DashboardData {
    const realtimeMetrics = this.analyticsService.getRealtimeMetrics();
    const performanceAnalytics = this.analyticsService.getPerformanceAnalytics();
    const healthSummary = this.healthCheckService.getHealthySummary();
    const allServiceHealth = this.healthCheckService.getAllServiceHealth();
    const activeAlerts = this.analyticsService.getActiveAlerts();

    // Determine overall system status
    let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (activeAlerts.some(a => a.severity === 'critical')) {
      overallStatus = 'critical';
    } else if (activeAlerts.some(a => a.severity === 'high') || healthSummary.healthyPercentage < 80) {
      overallStatus = 'warning';
    }

    return {
      overview: {
        status: overallStatus,
        uptime: process.uptime(),
        totalRequests: performanceAnalytics.requestVolume.total,
        activeAlerts: activeAlerts.length,
        servicesHealth: {
          healthy: healthSummary.healthy,
          total: healthSummary.total,
          percentage: healthSummary.healthyPercentage
        }
      },
      performance: {
        requestsPerSecond: realtimeMetrics.requests.lastMinute / 60,
        averageResponseTime: performanceAnalytics.responseTime.average,
        errorRate: performanceAnalytics.errorRate.percentage,
        p95ResponseTime: performanceAnalytics.responseTime.p95
      },
      system: {
        cpuUsage: realtimeMetrics.system.cpu.usage,
        memoryUsage: realtimeMetrics.system.memory.percentage,
        loadAverage: realtimeMetrics.system.cpu.loadAverage
      },
      services: allServiceHealth.map(service => ({
        name: service.name,
        status: service.status,
        responseTime: service.responseTime || undefined,
        lastCheck: service.lastCheck,
        error: service.error || undefined
      })),
      alerts: activeAlerts.map(alert => ({
        id: alert.id,
        severity: alert.severity,
        message: alert.message,
        timestamp: alert.timestamp
      })),
      trafficControl: {
        rateLimitHits: 0, // This would need to be tracked in RateLimitMiddleware
        blockedRequests: 0, // This would need to be tracked in RateLimitMiddleware
        systemLoad: 0 // This would need to be exposed from RateLimitMiddleware
      }
    };
  }

  getRealtimeDashboardData() {
    const realtimeMetrics = this.analyticsService.getRealtimeMetrics();
    const activeAlerts = this.analyticsService.getActiveAlerts();

    return {
      timestamp: new Date(),
      requests: realtimeMetrics.requests,
      system: realtimeMetrics.system,
      services: realtimeMetrics.services,
      alerts: {
        active: activeAlerts.length,
        critical: activeAlerts.filter(a => a.severity === 'critical').length,
        recent: activeAlerts.slice(-5) // Last 5 alerts
      }
    };
  }

  getHistoricalData(
    timeRange: { start: Date; end: Date },
    interval: 'minute' | 'hour' | 'day' = 'hour'
  ): HistoricalData {
    const systemMetrics = this.analyticsService.getSystemMetrics(timeRange);
    const requestMetrics = MetricsMiddleware.getMetrics().filter(
      m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
    );

    // Group metrics by interval
    const groupedMetrics = this.groupMetricsByInterval(
      requestMetrics,
      systemMetrics,
      interval
    );

    return {
      timeRange: {
        start: timeRange.start,
        end: timeRange.end,
        interval
      },
      metrics: groupedMetrics
    };
  }

  private groupMetricsByInterval(
    requestMetrics: any[],
    systemMetrics: any[],
    interval: 'minute' | 'hour' | 'day'
  ) {
    const intervalMs = {
      minute: 60 * 1000,
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000
    }[interval];

    const groups = new Map<number, {
      requests: any[];
      systemMetric?: any;
    }>();

    // Group request metrics
    requestMetrics.forEach(metric => {
      const intervalStart = Math.floor(metric.timestamp.getTime() / intervalMs) * intervalMs;
      if (!groups.has(intervalStart)) {
        groups.set(intervalStart, { requests: [] });
      }
      groups.get(intervalStart)!.requests.push(metric);
    });

    // Add system metrics
    systemMetrics.forEach(metric => {
      const intervalStart = Math.floor(metric.timestamp.getTime() / intervalMs) * intervalMs;
      if (groups.has(intervalStart)) {
        groups.get(intervalStart)!.systemMetric = metric;
      }
    });

    // Convert to array and calculate aggregated metrics
    return Array.from(groups.entries())
      .map(([timestamp, data]) => {
        const requests = data.requests;
        const systemMetric = data.systemMetric;

        const errorRequests = requests.filter(r => r.statusCode >= 400);
        const totalResponseTime = requests.reduce((sum, r) => sum + r.responseTime, 0);

        return {
          timestamp: new Date(timestamp),
          requestCount: requests.length,
          averageResponseTime: requests.length > 0 ? totalResponseTime / requests.length : 0,
          errorRate: requests.length > 0 ? (errorRequests.length / requests.length) * 100 : 0,
          cpuUsage: systemMetric?.cpu.usage || 0,
          memoryUsage: systemMetric?.memory.percentage || 0
        };
      })
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  getEndpointAnalytics(endpoint: string, method?: string): EndpointAnalytics | null {
    const allMetrics = MetricsMiddleware.getMetrics();
    const endpointMetrics = allMetrics.filter(m => {
      const matches = m.path === endpoint;
      return method ? matches && m.method === method : matches;
    });

    if (endpointMetrics.length === 0) {
      return null;
    }

    const errors = endpointMetrics.filter(m => m.statusCode >= 400);
    const responseTimes = endpointMetrics.map(m => m.responseTime).sort((a, b) => a - b);
    
    // Calculate time range for rate calculation
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const recentMetrics = endpointMetrics.filter(m => m.timestamp.getTime() > oneHourAgo);

    return {
      endpoint: `${method || 'ALL'} ${endpoint}`,
      method: method || 'ALL',
      path: endpoint,
      metrics: {
        totalRequests: endpointMetrics.length,
        averageResponseTime: responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length,
        errorRate: (errors.length / endpointMetrics.length) * 100,
        p95ResponseTime: this.percentile(responseTimes, 95),
        p99ResponseTime: this.percentile(responseTimes, 99),
        requestsPerHour: recentMetrics.length
      },
      recentActivity: endpointMetrics
        .slice(-50) // Last 50 requests
        .map(m => ({
          timestamp: m.timestamp,
          responseTime: m.responseTime,
          statusCode: m.statusCode,
          userAgent: m.userAgent || undefined,
          clientIP: m.clientIP
        })),
      errors: errors
        .slice(-20) // Last 20 errors
        .map(m => ({
          timestamp: m.timestamp,
          statusCode: m.statusCode,
          error: m.error || undefined,
          clientIP: m.clientIP
        }))
    };
  }

  private percentile(sortedArray: number[], p: number): number {
    if (sortedArray.length === 0) return 0;
    const index = Math.ceil((p / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))];
  }

  getTopEndpoints(limit = 10, timeRange?: { start: Date; end: Date }) {
    const performanceAnalytics = this.analyticsService.getPerformanceAnalytics(timeRange);
    return performanceAnalytics.topEndpoints.slice(0, limit);
  }

  getSlowestEndpoints(limit = 10, timeRange?: { start: Date; end: Date }) {
    const performanceAnalytics = this.analyticsService.getPerformanceAnalytics(timeRange);
    return performanceAnalytics.slowestEndpoints.slice(0, limit);
  }

  getSystemHealth() {
    const realtimeMetrics = this.analyticsService.getRealtimeMetrics();
    const healthSummary = this.healthCheckService.getHealthySummary();
    const activeAlerts = this.analyticsService.getActiveAlerts();

    return {
      overall: {
        status: this.determineOverallHealth(healthSummary, activeAlerts),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
      },
      system: realtimeMetrics.system,
      services: healthSummary,
      alerts: {
        active: activeAlerts.length,
        bySeverity: {
          critical: activeAlerts.filter(a => a.severity === 'critical').length,
          high: activeAlerts.filter(a => a.severity === 'high').length,
          medium: activeAlerts.filter(a => a.severity === 'medium').length,
          low: activeAlerts.filter(a => a.severity === 'low').length
        }
      }
    };
  }

  private determineOverallHealth(healthSummary: any, activeAlerts: any[]): 'healthy' | 'warning' | 'critical' {
    if (activeAlerts.some(a => a.severity === 'critical')) {
      return 'critical';
    }
    
    if (activeAlerts.some(a => a.severity === 'high') || healthSummary.healthyPercentage < 80) {
      return 'warning';
    }
    
    return 'healthy';
  }

  async exportMetrics(format: 'json' | 'csv' | 'prometheus', timeRange?: { start: Date; end: Date }) {
    const performanceAnalytics = this.analyticsService.getPerformanceAnalytics(timeRange);
    const systemMetrics = this.analyticsService.getSystemMetrics(timeRange);
    const requestMetrics = MetricsMiddleware.getMetrics();

    switch (format) {
      case 'json':
        return {
          performance: performanceAnalytics,
          system: systemMetrics,
          requests: timeRange 
            ? requestMetrics.filter(m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end)
            : requestMetrics
        };

      case 'csv':
        return this.exportToCsv(requestMetrics, timeRange);

      case 'prometheus':
        return this.exportToPrometheus(performanceAnalytics, systemMetrics);

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  private exportToCsv(metrics: any[], timeRange?: { start: Date; end: Date }): string {
    const filteredMetrics = timeRange 
      ? metrics.filter(m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end)
      : metrics;

    const headers = [
      'timestamp', 'method', 'path', 'statusCode', 'responseTime', 
      'requestSize', 'responseSize', 'clientIP', 'userId'
    ];

    const rows = filteredMetrics.map(m => [
      m.timestamp.toISOString(),
      m.method,
      m.path,
      m.statusCode,
      m.responseTime,
      m.requestSize,
      m.responseSize,
      m.clientIP,
      m.userId || ''
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  private exportToPrometheus(performanceAnalytics: any, systemMetrics: any[]): string {
    const latestSystemMetric = systemMetrics[systemMetrics.length - 1];
    
    const metrics = [
      `# HELP gateway_requests_total Total number of requests`,
      `# TYPE gateway_requests_total counter`,
      `gateway_requests_total ${performanceAnalytics.requestVolume.total}`,
      '',
      `# HELP gateway_request_duration_seconds Request duration in seconds`,
      `# TYPE gateway_request_duration_seconds histogram`,
      `gateway_request_duration_seconds_sum ${performanceAnalytics.responseTime.average / 1000}`,
      `gateway_request_duration_seconds_count ${performanceAnalytics.requestVolume.total}`,
      '',
      `# HELP gateway_error_rate Error rate percentage`,
      `# TYPE gateway_error_rate gauge`,
      `gateway_error_rate ${performanceAnalytics.errorRate.percentage}`,
      ''
    ];

    if (latestSystemMetric) {
      metrics.push(
        `# HELP gateway_cpu_usage CPU usage`,
        `# TYPE gateway_cpu_usage gauge`,
        `gateway_cpu_usage ${latestSystemMetric.cpu.usage}`,
        '',
        `# HELP gateway_memory_usage Memory usage percentage`,
        `# TYPE gateway_memory_usage gauge`,
        `gateway_memory_usage ${latestSystemMetric.memory.percentage}`,
        ''
      );
    }

    return metrics.join('\n');
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down Monitoring Dashboard...');
    
    // Close all WebSocket connections
    this.wsConnections.forEach(ws => {
      try {
        ws.close();
      } catch (error) {
        // Ignore errors during shutdown
      }
    });
    this.wsConnections.clear();
    
    this.logger.info('Monitoring Dashboard shutdown completed');
  }
}