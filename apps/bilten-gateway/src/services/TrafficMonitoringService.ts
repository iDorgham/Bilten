import { createClient, RedisClientType } from 'redis';
import { Logger } from '../utils/Logger';
import { ConfigManager } from '../config/ConfigManager';

export interface TrafficPattern {
  id: string;
  clientId: string;
  clientType: 'user' | 'organization' | 'api_key' | 'ip';
  
  // Request patterns
  requestCount: number;
  requestsPerSecond: number;
  requestsPerMinute: number;
  requestsPerHour: number;
  
  // Geographic information
  countries: string[];
  regions: string[];
  ipAddresses: string[];
  
  // Behavioral patterns
  endpoints: string[];
  methods: string[];
  userAgents: string[];
  
  // Timing patterns
  firstSeen: Date;
  lastSeen: Date;
  timeWindows: TimeWindow[];
  
  // Anomaly indicators
  anomalyScore: number;
  suspiciousActivities: SuspiciousActivity[];
  
  // Status
  isBlocked: boolean;
  blockReason?: string;
  blockExpiry?: Date;
}

export interface TimeWindow {
  start: Date;
  end: Date;
  requestCount: number;
  averageInterval: number; // milliseconds between requests
}

export interface SuspiciousActivity {
  type: 'rapid_requests' | 'geographic_anomaly' | 'user_agent_rotation' | 'endpoint_scanning' | 'error_rate_spike' | 'unusual_timing';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

export interface GeographicRestriction {
  id: string;
  name: string;
  type: 'allow' | 'block';
  countries: string[];
  regions?: string[];
  ipRanges?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPAccessControl {
  id: string;
  ipAddress: string;
  type: 'whitelist' | 'blacklist';
  reason: string;
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrafficAnalytics {
  totalRequests: number;
  uniqueClients: number;
  blockedRequests: number;
  suspiciousActivities: number;
  topCountries: Array<{ country: string; count: number }>;
  topEndpoints: Array<{ endpoint: string; count: number }>;
  topUserAgents: Array<{ userAgent: string; count: number }>;
  anomalyTrends: Array<{ timestamp: Date; score: number }>;
}

export interface MonitoringConfig {
  enabled: boolean;
  
  // Detection thresholds
  rapidRequestThreshold: number; // requests per second
  geographicAnomalyThreshold: number; // max countries per hour
  userAgentRotationThreshold: number; // max user agents per hour
  errorRateThreshold: number; // percentage
  
  // Time windows
  analysisWindow: number; // seconds
  retentionPeriod: number; // seconds
  
  // Auto-blocking
  autoBlockEnabled: boolean;
  autoBlockThreshold: number; // anomaly score
  autoBlockDuration: number; // seconds
  
  // Geographic restrictions
  geographicRestrictionsEnabled: boolean;
  defaultCountryPolicy: 'allow' | 'block';
}

export class TrafficMonitoringService {
  private static instance: TrafficMonitoringService;
  private logger = Logger.getInstance();
  private redisClient: RedisClientType | null = null;
  private configManager: ConfigManager;
  private config: MonitoringConfig;
  private patterns: Map<string, TrafficPattern> = new Map();
  private geographicRestrictions: Map<string, GeographicRestriction> = new Map();
  private ipAccessControls: Map<string, IPAccessControl> = new Map();

  constructor(configManager?: ConfigManager) {
    this.configManager = configManager || new ConfigManager();
    this.config = this.getDefaultConfig();
  }

  static getInstance(configManager?: ConfigManager): TrafficMonitoringService {
    if (!TrafficMonitoringService.instance) {
      TrafficMonitoringService.instance = new TrafficMonitoringService(configManager);
    }
    return TrafficMonitoringService.instance;
  }

  async initialize(): Promise<void> {
    try {
      await this.initializeRedis();
      await this.loadGeographicRestrictions();
      await this.loadIPAccessControls();
      
      // Start background monitoring tasks
      this.startMonitoringTasks();
      
      this.logger.info('TrafficMonitoringService initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize TrafficMonitoringService:', error);
      throw error;
    }
  }

  private async initializeRedis(): Promise<void> {
    try {
      const redisConfig = this.configManager.getRedisConfig();
      const clientConfig: any = {
        socket: {
          host: redisConfig.host,
          port: redisConfig.port,
          connectTimeout: 5000
        },
        database: redisConfig.db
      };

      if (redisConfig.password) {
        clientConfig.password = redisConfig.password;
      }

      this.redisClient = createClient(clientConfig);
      
      this.redisClient.on('error', (error) => {
        this.logger.error('Redis client error in TrafficMonitoringService:', error);
      });

      await this.redisClient.connect();
      this.logger.info('Redis connected for traffic monitoring');
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        this.logger.warn('Redis connection failed in development mode, continuing without Redis');
        this.redisClient = null;
      } else {
        throw error;
      }
    }
  }

  async recordRequest(request: {
    clientId: string;
    clientType: 'user' | 'organization' | 'api_key' | 'ip';
    endpoint: string;
    method: string;
    ip: string;
    country?: string;
    region?: string;
    userAgent?: string;
    statusCode: number;
    responseTime: number;
    timestamp: Date;
  }): Promise<void> {
    if (!this.config.enabled) return;

    try {
      // Update traffic pattern
      await this.updateTrafficPattern(request);
      
      // Check for suspicious activities
      await this.detectSuspiciousActivity(request);
      
      // Record analytics data
      await this.recordAnalytics(request);
      
      // Check geographic restrictions
      if (this.config.geographicRestrictionsEnabled && request.country) {
        await this.checkGeographicRestrictions(request.ip, request.country);
      }
      
    } catch (error) {
      this.logger.error('Error recording request:', error);
    }
  }

  private async updateTrafficPattern(request: any): Promise<void> {
    const patternKey = `${request.clientType}:${request.clientId}`;
    let pattern = this.patterns.get(patternKey);

    if (!pattern) {
      pattern = {
        id: patternKey,
        clientId: request.clientId,
        clientType: request.clientType,
        requestCount: 0,
        requestsPerSecond: 0,
        requestsPerMinute: 0,
        requestsPerHour: 0,
        countries: [],
        regions: [],
        ipAddresses: [],
        endpoints: [],
        methods: [],
        userAgents: [],
        firstSeen: request.timestamp,
        lastSeen: request.timestamp,
        timeWindows: [],
        anomalyScore: 0,
        suspiciousActivities: [],
        isBlocked: false
      };
    }

    // Update basic counters
    pattern.requestCount++;
    pattern.lastSeen = request.timestamp;

    // Update arrays (keep unique values)
    if (request.country && !pattern.countries.includes(request.country)) {
      pattern.countries.push(request.country);
    }
    if (request.region && !pattern.regions.includes(request.region)) {
      pattern.regions.push(request.region);
    }
    if (!pattern.ipAddresses.includes(request.ip)) {
      pattern.ipAddresses.push(request.ip);
    }
    if (!pattern.endpoints.includes(request.endpoint)) {
      pattern.endpoints.push(request.endpoint);
    }
    if (!pattern.methods.includes(request.method)) {
      pattern.methods.push(request.method);
    }
    if (request.userAgent && !pattern.userAgents.includes(request.userAgent)) {
      pattern.userAgents.push(request.userAgent);
    }

    // Calculate rates
    const now = Date.now();
    const timeDiff = (now - pattern.firstSeen.getTime()) / 1000; // seconds
    
    if (timeDiff > 0) {
      pattern.requestsPerSecond = pattern.requestCount / timeDiff;
      pattern.requestsPerMinute = pattern.requestCount / (timeDiff / 60);
      pattern.requestsPerHour = pattern.requestCount / (timeDiff / 3600);
    }

    // Update time windows (keep last 24 hours)
    const windowSize = 300; // 5 minutes
    const currentWindow = Math.floor(now / (windowSize * 1000)) * windowSize * 1000;
    
    let timeWindow = pattern.timeWindows.find(w => w.start.getTime() === currentWindow);
    if (!timeWindow) {
      timeWindow = {
        start: new Date(currentWindow),
        end: new Date(currentWindow + windowSize * 1000),
        requestCount: 0,
        averageInterval: 0
      };
      pattern.timeWindows.push(timeWindow);
    }
    timeWindow.requestCount++;

    // Keep only recent time windows
    const dayAgo = now - (24 * 60 * 60 * 1000);
    pattern.timeWindows = pattern.timeWindows.filter(w => w.start.getTime() > dayAgo);

    this.patterns.set(patternKey, pattern);

    // Store in Redis for persistence
    if (this.redisClient) {
      await this.redisClient.setEx(
        `traffic_pattern:${patternKey}`,
        this.config.retentionPeriod,
        JSON.stringify(pattern)
      );
    }
  }

  private async detectSuspiciousActivity(request: any): Promise<void> {
    const patternKey = `${request.clientType}:${request.clientId}`;
    const pattern = this.patterns.get(patternKey);
    
    if (!pattern) return;

    const suspiciousActivities: SuspiciousActivity[] = [];

    // Detect rapid requests
    if (pattern.requestsPerSecond > this.config.rapidRequestThreshold) {
      suspiciousActivities.push({
        type: 'rapid_requests',
        severity: pattern.requestsPerSecond > this.config.rapidRequestThreshold * 2 ? 'high' : 'medium',
        description: `Rapid requests detected: ${pattern.requestsPerSecond.toFixed(2)} requests/second`,
        timestamp: request.timestamp,
        metadata: { requestsPerSecond: pattern.requestsPerSecond }
      });
    }

    // Detect geographic anomalies
    const recentCountries = this.getRecentCountries(pattern, 3600); // last hour
    if (recentCountries.length > this.config.geographicAnomalyThreshold) {
      suspiciousActivities.push({
        type: 'geographic_anomaly',
        severity: 'medium',
        description: `Requests from ${recentCountries.length} different countries in the last hour`,
        timestamp: request.timestamp,
        metadata: { countries: recentCountries }
      });
    }

    // Detect user agent rotation
    const recentUserAgents = this.getRecentUserAgents(pattern, 3600); // last hour
    if (recentUserAgents.length > this.config.userAgentRotationThreshold) {
      suspiciousActivities.push({
        type: 'user_agent_rotation',
        severity: 'medium',
        description: `${recentUserAgents.length} different user agents in the last hour`,
        timestamp: request.timestamp,
        metadata: { userAgents: recentUserAgents }
      });
    }

    // Detect endpoint scanning
    if (pattern.endpoints.length > 50 && pattern.requestCount < 200) {
      suspiciousActivities.push({
        type: 'endpoint_scanning',
        severity: 'high',
        description: `Potential endpoint scanning: ${pattern.endpoints.length} different endpoints`,
        timestamp: request.timestamp,
        metadata: { endpointCount: pattern.endpoints.length }
      });
    }

    // Add suspicious activities to pattern
    pattern.suspiciousActivities.push(...suspiciousActivities);
    
    // Calculate anomaly score
    pattern.anomalyScore = this.calculateAnomalyScore(pattern);

    // Auto-block if threshold exceeded
    if (this.config.autoBlockEnabled && pattern.anomalyScore > this.config.autoBlockThreshold) {
      await this.blockClient(request.clientId, request.clientType, 'Automatic block due to suspicious activity', this.config.autoBlockDuration);
    }
  }

  private getRecentCountries(pattern: TrafficPattern, _seconds: number): string[] {
    // This is a simplified implementation
    // In a real system, you'd track country changes over time
    return pattern.countries;
  }

  private getRecentUserAgents(pattern: TrafficPattern, _seconds: number): string[] {
    // This is a simplified implementation
    // In a real system, you'd track user agent changes over time
    return pattern.userAgents;
  }

  private calculateAnomalyScore(pattern: TrafficPattern): number {
    let score = 0;

    // Score based on request rate
    if (pattern.requestsPerSecond > this.config.rapidRequestThreshold) {
      score += Math.min(50, pattern.requestsPerSecond * 2);
    }

    // Score based on geographic diversity
    if (pattern.countries.length > this.config.geographicAnomalyThreshold) {
      score += pattern.countries.length * 5;
    }

    // Score based on user agent rotation
    if (pattern.userAgents.length > this.config.userAgentRotationThreshold) {
      score += pattern.userAgents.length * 3;
    }

    // Score based on endpoint diversity
    if (pattern.endpoints.length > 20) {
      score += Math.min(30, pattern.endpoints.length);
    }

    // Score based on suspicious activities
    for (const activity of pattern.suspiciousActivities) {
      switch (activity.severity) {
        case 'low': score += 5; break;
        case 'medium': score += 15; break;
        case 'high': score += 30; break;
        case 'critical': score += 50; break;
      }
    }

    return Math.min(100, score);
  }

  async blockClient(clientId: string, clientType: string, reason: string, duration: number): Promise<void> {
    try {
      const blockKey = `blocked:${clientType}:${clientId}`;
      const blockData = {
        clientId,
        clientType,
        reason,
        blockedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + duration * 1000).toISOString()
      };

      if (this.redisClient) {
        await this.redisClient.setEx(blockKey, Math.ceil(duration / 1000), JSON.stringify(blockData));
      }

      // Update pattern
      const patternKey = `${clientType}:${clientId}`;
      const pattern = this.patterns.get(patternKey);
      if (pattern) {
        pattern.isBlocked = true;
        pattern.blockReason = reason;
        pattern.blockExpiry = new Date(Date.now() + duration * 1000);
      }

      this.logger.warn('Client blocked', { clientId, clientType, reason, duration });
    } catch (error) {
      this.logger.error('Error blocking client:', error);
    }
  }

  async isClientBlocked(clientId: string, clientType: string): Promise<boolean> {
    try {
      const blockKey = `blocked:${clientType}:${clientId}`;
      
      if (this.redisClient) {
        const blockData = await this.redisClient.get(blockKey);
        return blockData !== null;
      }

      // Fallback to in-memory check
      const patternKey = `${clientType}:${clientId}`;
      const pattern = this.patterns.get(patternKey);
      return pattern?.isBlocked && pattern.blockExpiry && pattern.blockExpiry > new Date() || false;
    } catch (error) {
      this.logger.error('Error checking if client is blocked:', error);
      return false;
    }
  }

  async unblockClient(clientId: string, clientType: string): Promise<void> {
    try {
      const blockKey = `blocked:${clientType}:${clientId}`;
      
      if (this.redisClient) {
        await this.redisClient.del(blockKey);
      }

      // Update pattern
      const patternKey = `${clientType}:${clientId}`;
      const pattern = this.patterns.get(patternKey);
      if (pattern) {
        pattern.isBlocked = false;
        delete pattern.blockReason;
        delete pattern.blockExpiry;
      }

      this.logger.info('Client unblocked', { clientId, clientType });
    } catch (error) {
      this.logger.error('Error unblocking client:', error);
    }
  }

  // Geographic restrictions management
  async addGeographicRestriction(restriction: Omit<GeographicRestriction, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = `geo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullRestriction: GeographicRestriction = {
      ...restriction,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.geographicRestrictions.set(id, fullRestriction);
    this.logger.info('Geographic restriction added', { id, restriction: fullRestriction });
    return id;
  }

  async removeGeographicRestriction(id: string): Promise<void> {
    this.geographicRestrictions.delete(id);
    this.logger.info('Geographic restriction removed', { id });
  }

  // IP access control management
  async addIPAccessControl(control: Omit<IPAccessControl, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = `ip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullControl: IPAccessControl = {
      ...control,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.ipAccessControls.set(id, fullControl);
    this.logger.info('IP access control added', { id, control: fullControl });
    return id;
  }

  async removeIPAccessControl(id: string): Promise<void> {
    this.ipAccessControls.delete(id);
    this.logger.info('IP access control removed', { id });
  }

  async checkIPAccess(ip: string): Promise<{ allowed: boolean; reason?: string }> {
    // Check blacklist first
    for (const control of this.ipAccessControls.values()) {
      if (!control.isActive) continue;
      if (control.expiresAt && control.expiresAt < new Date()) continue;

      if (control.ipAddress === ip) {
        if (control.type === 'blacklist') {
          return { allowed: false, reason: control.reason };
        }
        if (control.type === 'whitelist') {
          return { allowed: true };
        }
      }
    }

    // If no specific rule found, allow by default
    return { allowed: true };
  }

  private async checkGeographicRestrictions(ip: string, country: string): Promise<void> {
    for (const restriction of this.geographicRestrictions.values()) {
      if (!restriction.isActive) continue;

      if (restriction.countries.includes(country)) {
        if (restriction.type === 'block') {
          await this.blockClient(ip, 'ip', `Geographic restriction: ${restriction.name}`, 24 * 60 * 60); // 24 hours
        }
      }
    }
  }

  private async recordAnalytics(request: any): Promise<void> {
    if (!this.redisClient) return;

    try {
      const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Increment counters
      await this.redisClient.incr(`analytics:${date}:total_requests`);
      await this.redisClient.sAdd(`analytics:${date}:unique_clients`, `${request.clientType}:${request.clientId}`);
      
      if (request.country) {
        await this.redisClient.zIncrBy(`analytics:${date}:countries`, 1, request.country);
      }
      
      await this.redisClient.zIncrBy(`analytics:${date}:endpoints`, 1, request.endpoint);
      
      if (request.userAgent) {
        await this.redisClient.zIncrBy(`analytics:${date}:user_agents`, 1, request.userAgent);
      }

      // Set expiration for analytics data (30 days)
      await this.redisClient.expire(`analytics:${date}:total_requests`, 30 * 24 * 60 * 60);
      await this.redisClient.expire(`analytics:${date}:unique_clients`, 30 * 24 * 60 * 60);
      await this.redisClient.expire(`analytics:${date}:countries`, 30 * 24 * 60 * 60);
      await this.redisClient.expire(`analytics:${date}:endpoints`, 30 * 24 * 60 * 60);
      await this.redisClient.expire(`analytics:${date}:user_agents`, 30 * 24 * 60 * 60);
    } catch (error) {
      this.logger.error('Error recording analytics:', error);
    }
  }

  async getAnalytics(date?: string): Promise<TrafficAnalytics> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    try {
      if (!this.redisClient) {
        return this.getEmptyAnalytics();
      }

      const [
        totalRequests,
        uniqueClients,
        topCountries,
        topEndpoints,
        topUserAgents
      ] = await Promise.all([
        this.redisClient.get(`analytics:${targetDate}:total_requests`),
        this.redisClient.sCard(`analytics:${targetDate}:unique_clients`),
        this.redisClient.zRangeWithScores(`analytics:${targetDate}:countries`, 0, 9, { REV: true }),
        this.redisClient.zRangeWithScores(`analytics:${targetDate}:endpoints`, 0, 9, { REV: true }),
        this.redisClient.zRangeWithScores(`analytics:${targetDate}:user_agents`, 0, 9, { REV: true })
      ]);

      return {
        totalRequests: parseInt(totalRequests || '0'),
        uniqueClients,
        blockedRequests: 0, // TODO: Implement blocked request tracking
        suspiciousActivities: Array.from(this.patterns.values()).reduce((sum, p) => sum + p.suspiciousActivities.length, 0),
        topCountries: topCountries.map((item: any) => ({ country: item.value, count: item.score })),
        topEndpoints: topEndpoints.map((item: any) => ({ endpoint: item.value, count: item.score })),
        topUserAgents: topUserAgents.map((item: any) => ({ userAgent: item.value, count: item.score })),
        anomalyTrends: [] // TODO: Implement anomaly trend tracking
      };
    } catch (error) {
      this.logger.error('Error getting analytics:', error);
      return this.getEmptyAnalytics();
    }
  }

  private getEmptyAnalytics(): TrafficAnalytics {
    return {
      totalRequests: 0,
      uniqueClients: 0,
      blockedRequests: 0,
      suspiciousActivities: 0,
      topCountries: [],
      topEndpoints: [],
      topUserAgents: [],
      anomalyTrends: []
    };
  }

  private async loadGeographicRestrictions(): Promise<void> {
    // Load default geographic restrictions
    const defaultRestrictions: Omit<GeographicRestriction, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'High Risk Countries',
        type: 'block',
        countries: [], // Add countries as needed
        isActive: false // Disabled by default
      }
    ];

    for (const restriction of defaultRestrictions) {
      await this.addGeographicRestriction(restriction);
    }
  }

  private async loadIPAccessControls(): Promise<void> {
    // Load default IP access controls if needed
    // This could be loaded from configuration or database
  }

  private startMonitoringTasks(): void {
    // Clean up old patterns every hour
    setInterval(() => {
      this.cleanupOldPatterns();
    }, 60 * 60 * 1000);

    // Update anomaly scores every 5 minutes
    setInterval(() => {
      this.updateAnomalyScores();
    }, 5 * 60 * 1000);
  }

  private cleanupOldPatterns(): void {
    const cutoff = new Date(Date.now() - this.config.retentionPeriod * 1000);
    
    for (const [key, pattern] of this.patterns.entries()) {
      if (pattern.lastSeen < cutoff) {
        this.patterns.delete(key);
      }
    }
  }

  private updateAnomalyScores(): void {
    for (const pattern of this.patterns.values()) {
      pattern.anomalyScore = this.calculateAnomalyScore(pattern);
    }
  }

  private getDefaultConfig(): MonitoringConfig {
    return {
      enabled: process.env.TRAFFIC_MONITORING_ENABLED !== 'false',
      rapidRequestThreshold: parseInt(process.env.RAPID_REQUEST_THRESHOLD || '10'),
      geographicAnomalyThreshold: parseInt(process.env.GEOGRAPHIC_ANOMALY_THRESHOLD || '5'),
      userAgentRotationThreshold: parseInt(process.env.USER_AGENT_ROTATION_THRESHOLD || '10'),
      errorRateThreshold: parseFloat(process.env.ERROR_RATE_THRESHOLD || '0.5'),
      analysisWindow: parseInt(process.env.ANALYSIS_WINDOW || '300'),
      retentionPeriod: parseInt(process.env.RETENTION_PERIOD || '604800'), // 7 days
      autoBlockEnabled: process.env.AUTO_BLOCK_ENABLED === 'true',
      autoBlockThreshold: parseInt(process.env.AUTO_BLOCK_THRESHOLD || '80'),
      autoBlockDuration: parseInt(process.env.AUTO_BLOCK_DURATION || '3600'), // 1 hour
      geographicRestrictionsEnabled: process.env.GEOGRAPHIC_RESTRICTIONS_ENABLED === 'true',
      defaultCountryPolicy: (process.env.DEFAULT_COUNTRY_POLICY as 'allow' | 'block') || 'allow'
    };
  }

  getTrafficPatterns(): TrafficPattern[] {
    return Array.from(this.patterns.values());
  }

  getGeographicRestrictions(): GeographicRestriction[] {
    return Array.from(this.geographicRestrictions.values());
  }

  getIPAccessControls(): IPAccessControl[] {
    return Array.from(this.ipAccessControls.values());
  }

  updateConfig(config: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...config };
    this.logger.info('Traffic monitoring configuration updated', config);
  }

  async shutdown(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
      this.logger.info('TrafficMonitoringService Redis client disconnected');
    }
  }
}