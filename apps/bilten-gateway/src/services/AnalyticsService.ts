import { Logger } from '../utils/Logger';
import { MetricsMiddleware, RequestMetrics } from '../middleware/MetricsMiddleware';
import { HealthCheckService } from './HealthCheckService';
// import { RateLimitMiddleware } from '../middleware/RateLimitMiddleware';

export interface SystemMetrics {
  timestamp: Date;
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  uptime: number;
  activeConnections: number;
}

export interface PerformanceAnalytics {
  requestVolume: {
    total: number;
    perMinute: number;
    perHour: number;
  };
  responseTime: {
    average: number;
    p50: number;
    p95: number;
    p99: number;
  };
  errorRate: {
    percentage: number;
    total: number;
    by4xx: number;
    by5xx: number;
  };
  topEndpoints: Array<{
    endpoint: string;
    count: number;
    averageResponseTime: number;
  }>;
  slowestEndpoints: Array<{
    endpoint: string;
    averageResponseTime: number;
    requestCount: number;
  }>;
  statusCodeDistribution: { [key: string]: number };
}

export interface AlertRule {
  id: string;
  name: string;
  condition: {
    metric: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    threshold: number;
    duration: number; // in seconds
  };
  enabled: boolean;
  lastTriggered?: Date;
  actions: Array<{
    type: 'log' | 'webhook' | 'email';
    config: any;
  }>;
}

export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  metadata: any;
}

export class AnalyticsService {
  private logger = Logger.getInstance();
  private systemMetricsHistory: SystemMetrics[] = [];
  private alertRules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private readonly MAX_METRICS_HISTORY = 1440; // 24 hours of minute-by-minute data
  private metricsCollectionInterval: NodeJS.Timeout | null = null;

  constructor(
    private healthCheckService: HealthCheckService
  ) {
    this.initializeDefaultAlertRules();
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing Analytics Service...');
    
    // Start collecting system metrics every minute
    this.startSystemMetricsCollection();
    
    // Start alert monitoring
    this.startAlertMonitoring();
    
    this.logger.info('Analytics Service initialized successfully');
  }

  private initializeDefaultAlertRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'high-error-rate',
        name: 'High Error Rate',
        condition: {
          metric: 'errorRate',
          operator: 'gt',
          threshold: 5, // 5%
          duration: 300 // 5 minutes
        },
        enabled: true,
        actions: [
          { type: 'log', config: { level: 'error' } }
        ]
      },
      {
        id: 'high-response-time',
        name: 'High Response Time',
        condition: {
          metric: 'averageResponseTime',
          operator: 'gt',
          threshold: 2000, // 2 seconds
          duration: 300 // 5 minutes
        },
        enabled: true,
        actions: [
          { type: 'log', config: { level: 'warn' } }
        ]
      },
      {
        id: 'high-memory-usage',
        name: 'High Memory Usage',
        condition: {
          metric: 'memoryUsage',
          operator: 'gt',
          threshold: 85, // 85%
          duration: 600 // 10 minutes
        },
        enabled: true,
        actions: [
          { type: 'log', config: { level: 'warn' } }
        ]
      },
      {
        id: 'service-unhealthy',
        name: 'Service Unhealthy',
        condition: {
          metric: 'healthyServicePercentage',
          operator: 'lt',
          threshold: 80, // 80%
          duration: 60 // 1 minute
        },
        enabled: true,
        actions: [
          { type: 'log', config: { level: 'error' } }
        ]
      }
    ];

    defaultRules.forEach(rule => {
      this.alertRules.set(rule.id, rule);
    });
  }

  private startSystemMetricsCollection(): void {
    this.metricsCollectionInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, 60000); // Every minute
  }

  private collectSystemMetrics(): void {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    const systemMetrics: SystemMetrics = {
      timestamp: new Date(),
      cpu: {
        usage: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to seconds
        loadAverage: require('os').loadavg()
      },
      memory: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
      },
      uptime: process.uptime(),
      activeConnections: 0 // This would need to be tracked separately
    };

    this.systemMetricsHistory.push(systemMetrics);
    
    // Keep history manageable
    if (this.systemMetricsHistory.length > this.MAX_METRICS_HISTORY) {
      this.systemMetricsHistory = this.systemMetricsHistory.slice(-this.MAX_METRICS_HISTORY);
    }
  }

  private startAlertMonitoring(): void {
    setInterval(() => {
      this.checkAlertRules();
    }, 30000); // Check every 30 seconds
  }

  private async checkAlertRules(): Promise<void> {
    for (const [ruleId, rule] of Array.from(this.alertRules.entries())) {
      if (!rule.enabled) continue;

      try {
        const currentValue = await this.getMetricValue(rule.condition.metric);
        const shouldTrigger = this.evaluateCondition(currentValue, rule.condition);

        if (shouldTrigger && !this.activeAlerts.has(ruleId)) {
          await this.triggerAlert(rule, currentValue);
        } else if (!shouldTrigger && this.activeAlerts.has(ruleId)) {
          await this.resolveAlert(ruleId);
        }
      } catch (error) {
        this.logger.error(`Error checking alert rule ${ruleId}:`, error);
      }
    }
  }

  private async getMetricValue(metric: string): Promise<number> {
    switch (metric) {
      case 'errorRate':
        const summary = MetricsMiddleware.getMetricsSummary();
        return summary.errorRate;
      
      case 'averageResponseTime':
        const responseSummary = MetricsMiddleware.getMetricsSummary();
        return responseSummary.averageResponseTime;
      
      case 'memoryUsage':
        const latestSystemMetrics = this.systemMetricsHistory[this.systemMetricsHistory.length - 1];
        return latestSystemMetrics?.memory.percentage || 0;
      
      case 'healthyServicePercentage':
        const healthSummary = this.healthCheckService.getHealthySummary();
        return healthSummary.healthyPercentage;
      
      default:
        throw new Error(`Unknown metric: ${metric}`);
    }
  }

  private evaluateCondition(value: number, condition: AlertRule['condition']): boolean {
    switch (condition.operator) {
      case 'gt': return value > condition.threshold;
      case 'gte': return value >= condition.threshold;
      case 'lt': return value < condition.threshold;
      case 'lte': return value <= condition.threshold;
      case 'eq': return value === condition.threshold;
      default: return false;
    }
  }

  private async triggerAlert(rule: AlertRule, currentValue: number): Promise<void> {
    const alert: Alert = {
      id: `${rule.id}-${Date.now()}`,
      ruleId: rule.id,
      ruleName: rule.name,
      message: `${rule.name}: ${rule.condition.metric} is ${currentValue} (threshold: ${rule.condition.threshold})`,
      severity: this.determineSeverity(rule, currentValue),
      timestamp: new Date(),
      resolved: false,
      metadata: {
        metric: rule.condition.metric,
        value: currentValue,
        threshold: rule.condition.threshold
      }
    };

    this.activeAlerts.set(rule.id, alert);
    rule.lastTriggered = new Date();

    // Execute alert actions
    for (const action of rule.actions) {
      await this.executeAlertAction(action, alert);
    }

    this.logger.warn(`Alert triggered: ${alert.message}`, {
      alertId: alert.id,
      ruleId: rule.id,
      severity: alert.severity
    });
  }

  private async resolveAlert(ruleId: string): Promise<void> {
    const alert = this.activeAlerts.get(ruleId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      this.activeAlerts.delete(ruleId);

      this.logger.info(`Alert resolved: ${alert.message}`, {
        alertId: alert.id,
        ruleId: ruleId,
        duration: alert.resolvedAt.getTime() - alert.timestamp.getTime()
      });
    }
  }

  private determineSeverity(rule: AlertRule, currentValue: number): Alert['severity'] {
    const threshold = rule.condition.threshold;
    const deviation = Math.abs(currentValue - threshold) / threshold;

    if (deviation > 0.5) return 'critical';
    if (deviation > 0.3) return 'high';
    if (deviation > 0.1) return 'medium';
    return 'low';
  }

  private async executeAlertAction(action: any, alert: Alert): Promise<void> {
    switch (action.type) {
      case 'log':
        const level = action.config?.level || 'warn';
        const logMethod = this.logger[level as keyof typeof this.logger] as any;
        if (typeof logMethod === 'function') {
          logMethod(`Alert: ${alert.message}`, {
            alertId: alert.id,
            severity: alert.severity,
            metadata: alert.metadata
          });
        }
        break;
      
      case 'webhook':
        // Webhook implementation would go here
        this.logger.info(`Webhook alert action not implemented for alert ${alert.id}`);
        break;
      
      case 'email':
        // Email implementation would go here
        this.logger.info(`Email alert action not implemented for alert ${alert.id}`);
        break;
    }
  }

  getPerformanceAnalytics(timeRange?: { start: Date; end: Date }): PerformanceAnalytics {
    const metrics = MetricsMiddleware.getMetrics();
    const filteredMetrics = timeRange 
      ? metrics.filter(m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end)
      : metrics;

    if (filteredMetrics.length === 0) {
      return {
        requestVolume: { total: 0, perMinute: 0, perHour: 0 },
        responseTime: { average: 0, p50: 0, p95: 0, p99: 0 },
        errorRate: { percentage: 0, total: 0, by4xx: 0, by5xx: 0 },
        topEndpoints: [],
        slowestEndpoints: [],
        statusCodeDistribution: {}
      };
    }

    const responseTimes = filteredMetrics.map(m => m.responseTime).sort((a, b) => a - b);
    const errors = filteredMetrics.filter(m => m.statusCode >= 400);
    const errors4xx = filteredMetrics.filter(m => m.statusCode >= 400 && m.statusCode < 500);
    const errors5xx = filteredMetrics.filter(m => m.statusCode >= 500);

    // Calculate time range for rate calculations
    const timeRangeMs = timeRange 
      ? timeRange.end.getTime() - timeRange.start.getTime()
      : 60 * 60 * 1000; // Default to 1 hour

    return {
      requestVolume: {
        total: filteredMetrics.length,
        perMinute: (filteredMetrics.length / (timeRangeMs / 60000)),
        perHour: (filteredMetrics.length / (timeRangeMs / 3600000))
      },
      responseTime: {
        average: responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length,
        p50: this.percentile(responseTimes, 50),
        p95: this.percentile(responseTimes, 95),
        p99: this.percentile(responseTimes, 99)
      },
      errorRate: {
        percentage: (errors.length / filteredMetrics.length) * 100,
        total: errors.length,
        by4xx: errors4xx.length,
        by5xx: errors5xx.length
      },
      topEndpoints: this.getTopEndpoints(filteredMetrics),
      slowestEndpoints: this.getSlowestEndpoints(filteredMetrics),
      statusCodeDistribution: this.getStatusCodeDistribution(filteredMetrics)
    };
  }

  private percentile(sortedArray: number[], p: number): number {
    if (sortedArray.length === 0) return 0;
    const index = Math.ceil((p / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))];
  }

  private getTopEndpoints(metrics: RequestMetrics[], limit = 10) {
    const endpointStats: { [key: string]: { count: number; totalTime: number } } = {};
    
    metrics.forEach(m => {
      const endpoint = `${m.method} ${m.path}`;
      if (!endpointStats[endpoint]) {
        endpointStats[endpoint] = { count: 0, totalTime: 0 };
      }
      endpointStats[endpoint].count++;
      endpointStats[endpoint].totalTime += m.responseTime;
    });

    return Object.entries(endpointStats)
      .map(([endpoint, stats]) => ({
        endpoint,
        count: stats.count,
        averageResponseTime: stats.totalTime / stats.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  private getSlowestEndpoints(metrics: RequestMetrics[], limit = 10) {
    const endpointStats: { [key: string]: { count: number; totalTime: number } } = {};
    
    metrics.forEach(m => {
      const endpoint = `${m.method} ${m.path}`;
      if (!endpointStats[endpoint]) {
        endpointStats[endpoint] = { count: 0, totalTime: 0 };
      }
      endpointStats[endpoint].count++;
      endpointStats[endpoint].totalTime += m.responseTime;
    });

    return Object.entries(endpointStats)
      .map(([endpoint, stats]) => ({
        endpoint,
        averageResponseTime: stats.totalTime / stats.count,
        requestCount: stats.count
      }))
      .sort((a, b) => b.averageResponseTime - a.averageResponseTime)
      .slice(0, limit);
  }

  private getStatusCodeDistribution(metrics: RequestMetrics[]) {
    const distribution: { [key: string]: number } = {};
    
    metrics.forEach(m => {
      const statusRange = `${Math.floor(m.statusCode / 100)}xx`;
      distribution[statusRange] = (distribution[statusRange] || 0) + 1;
    });

    return distribution;
  }

  getSystemMetrics(timeRange?: { start: Date; end: Date }): SystemMetrics[] {
    if (!timeRange) {
      return [...this.systemMetricsHistory];
    }

    return this.systemMetricsHistory.filter(
      m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
    );
  }

  getRealtimeMetrics() {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    const fiveMinutesAgo = new Date(now.getTime() - 300000);

    const recentMetrics = MetricsMiddleware.getMetrics().filter(
      m => m.timestamp >= oneMinuteAgo
    );

    const last5MinMetrics = MetricsMiddleware.getMetrics().filter(
      m => m.timestamp >= fiveMinutesAgo
    );

    const latestSystemMetrics = this.systemMetricsHistory[this.systemMetricsHistory.length - 1];
    const healthSummary = this.healthCheckService.getHealthySummary();

    return {
      timestamp: now,
      requests: {
        lastMinute: recentMetrics.length,
        last5Minutes: last5MinMetrics.length,
        averageResponseTime: recentMetrics.length > 0 
          ? recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length 
          : 0
      },
      system: latestSystemMetrics || {
        timestamp: now,
        cpu: { usage: 0, loadAverage: [0, 0, 0] },
        memory: { used: 0, total: 0, percentage: 0 },
        uptime: process.uptime(),
        activeConnections: 0
      },
      services: healthSummary,
      alerts: {
        active: this.activeAlerts.size,
        critical: Array.from(this.activeAlerts.values()).filter(a => a.severity === 'critical').length
      }
    };
  }

  // Alert management methods
  getAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }

  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
    this.logger.info(`Alert rule added: ${rule.name}`, { ruleId: rule.id });
  }

  updateAlertRule(ruleId: string, updates: Partial<AlertRule>): boolean {
    const rule = this.alertRules.get(ruleId);
    if (!rule) return false;

    Object.assign(rule, updates);
    this.logger.info(`Alert rule updated: ${rule.name}`, { ruleId });
    return true;
  }

  deleteAlertRule(ruleId: string): boolean {
    const deleted = this.alertRules.delete(ruleId);
    if (deleted) {
      // Also resolve any active alert for this rule
      if (this.activeAlerts.has(ruleId)) {
        this.resolveAlert(ruleId);
      }
      this.logger.info(`Alert rule deleted`, { ruleId });
    }
    return deleted;
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down Analytics Service...');
    
    if (this.metricsCollectionInterval) {
      clearInterval(this.metricsCollectionInterval);
      this.metricsCollectionInterval = null;
    }
    
    this.systemMetricsHistory = [];
    this.alertRules.clear();
    this.activeAlerts.clear();
    
    this.logger.info('Analytics Service shutdown completed');
  }
}