import { createClient, RedisClientType } from 'redis';
import { Logger } from '../utils/Logger';
import { ConfigManager } from '../config/ConfigManager';

export interface RateLimitRule {
  id: string;
  name: string;
  
  // Targeting
  clientType: 'user' | 'organization' | 'api_key' | 'ip';
  endpoints: string[];
  methods: string[];
  
  // Limits
  requestsPerSecond?: number;
  requestsPerMinute?: number;
  requestsPerHour?: number;
  requestsPerDay?: number;
  
  // Burst handling
  burstSize?: number;
  
  // Actions
  action: 'throttle' | 'block' | 'queue';
  blockDuration?: number;
  
  // Conditions
  conditions: LimitCondition[];
  
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LimitCondition {
  type: 'header' | 'query' | 'body' | 'ip_range' | 'time_window';
  field?: string;
  operator: 'equals' | 'contains' | 'regex' | 'in_range';
  value: any;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
  rule?: RateLimitRule;
}

export interface RateLimitContext {
  clientId: string;
  clientType: 'user' | 'organization' | 'api_key' | 'ip';
  endpoint: string;
  method: string;
  headers: Record<string, string>;
  query: Record<string, any>;
  body?: any;
  ip: string;
  timestamp: Date;
}

export class RateLimitService {
  private static instance: RateLimitService;
  private logger = Logger.getInstance();
  private redisClient: RedisClientType | null = null;
  private rules: Map<string, RateLimitRule> = new Map();
  private configManager: ConfigManager;

  constructor(configManager?: ConfigManager) {
    this.configManager = configManager || new ConfigManager();
  }

  static getInstance(configManager?: ConfigManager): RateLimitService {
    if (!RateLimitService.instance) {
      RateLimitService.instance = new RateLimitService(configManager);
    }
    return RateLimitService.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Initialize Redis connection
      await this.initializeRedis();
      
      // Load default rate limit rules
      await this.loadDefaultRules();
      
      this.logger.info('RateLimitService initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize RateLimitService:', error);
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
        this.logger.error('Redis client error:', error);
      });

      this.redisClient.on('connect', () => {
        this.logger.info('Redis client connected for rate limiting');
      });

      await this.redisClient.connect();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        this.logger.warn('Redis connection failed in development mode, continuing without Redis');
        this.redisClient = null;
      } else {
        throw error;
      }
    }
  }

  private async loadDefaultRules(): Promise<void> {
    const defaultRules: RateLimitRule[] = [
      {
        id: 'global-rate-limit',
        name: 'Global Rate Limit',
        clientType: 'ip',
        endpoints: ['*'],
        methods: ['*'],
        requestsPerMinute: 1000,
        action: 'throttle',
        conditions: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'user-rate-limit',
        name: 'User Rate Limit',
        clientType: 'user',
        endpoints: ['*'],
        methods: ['*'],
        requestsPerMinute: 100,
        action: 'throttle',
        conditions: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'auth-rate-limit',
        name: 'Authentication Rate Limit',
        clientType: 'ip',
        endpoints: ['/api/auth/login', '/api/auth/register'],
        methods: ['POST'],
        requestsPerMinute: 5,
        blockDuration: 15 * 60 * 1000, // 15 minutes
        action: 'block',
        conditions: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'upload-rate-limit',
        name: 'File Upload Rate Limit',
        clientType: 'user',
        endpoints: ['/api/files/upload'],
        methods: ['POST'],
        requestsPerMinute: 10,
        burstSize: 3,
        action: 'throttle',
        conditions: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'payment-rate-limit',
        name: 'Payment Rate Limit',
        clientType: 'user',
        endpoints: ['/api/payments'],
        methods: ['POST'],
        requestsPerMinute: 5,
        requestsPerHour: 20,
        action: 'block',
        blockDuration: 60 * 60 * 1000, // 1 hour
        conditions: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const rule of defaultRules) {
      this.rules.set(rule.id, rule);
    }

    this.logger.info(`Loaded ${defaultRules.length} default rate limit rules`);
  }

  async checkRateLimit(context: RateLimitContext): Promise<RateLimitResult> {
    try {
      // Find applicable rules for this request
      const applicableRules = this.findApplicableRules(context);
      
      if (applicableRules.length === 0) {
        return {
          allowed: true,
          remaining: Infinity,
          resetTime: new Date(Date.now() + 60000) // Default 1 minute window
        };
      }

      // Check each applicable rule
      for (const rule of applicableRules) {
        const result = await this.checkRule(rule, context);
        if (!result.allowed) {
          return result;
        }
      }

      // If all rules pass, return the most restrictive remaining count
      const remainingCounts = await Promise.all(
        applicableRules.map(rule => this.getRemainingCount(rule, context))
      );
      
      const minRemaining = Math.min(...remainingCounts);
      
      return {
        allowed: true,
        remaining: minRemaining,
        resetTime: new Date(Date.now() + 60000) // Default 1 minute window
      };
    } catch (error) {
      this.logger.error('Rate limit check error:', error);
      // Allow request on error to avoid blocking legitimate traffic
      return {
        allowed: true,
        remaining: Infinity,
        resetTime: new Date(Date.now() + 60000)
      };
    }
  }

  private findApplicableRules(context: RateLimitContext): RateLimitRule[] {
    const applicableRules: RateLimitRule[] = [];

    for (const rule of this.rules.values()) {
      if (!rule.isActive) continue;

      // Check client type
      if (rule.clientType !== context.clientType && rule.clientType !== 'ip') continue;

      // Check endpoints
      if (!this.matchesEndpoint(rule.endpoints, context.endpoint)) continue;

      // Check methods
      if (!this.matchesMethod(rule.methods, context.method)) continue;

      // Check conditions
      if (!this.matchesConditions(rule.conditions, context)) continue;

      applicableRules.push(rule);
    }

    return applicableRules.sort((a, b) => {
      // Sort by most restrictive first
      const aLimit = this.getMinuteLimit(a);
      const bLimit = this.getMinuteLimit(b);
      return aLimit - bLimit;
    });
  }

  private matchesEndpoint(ruleEndpoints: string[], requestEndpoint: string): boolean {
    return ruleEndpoints.some(endpoint => {
      if (endpoint === '*') return true;
      if (endpoint === requestEndpoint) return true;
      
      // Support wildcard matching
      const pattern = endpoint.replace(/\*/g, '.*');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(requestEndpoint);
    });
  }

  private matchesMethod(ruleMethods: string[], requestMethod: string): boolean {
    return ruleMethods.includes('*') || ruleMethods.includes(requestMethod.toUpperCase());
  }

  private matchesConditions(conditions: LimitCondition[], context: RateLimitContext): boolean {
    return conditions.every(condition => this.evaluateCondition(condition, context));
  }

  private evaluateCondition(condition: LimitCondition, context: RateLimitContext): boolean {
    let value: any;

    switch (condition.type) {
      case 'header':
        value = context.headers[condition.field || ''];
        break;
      case 'query':
        value = context.query[condition.field || ''];
        break;
      case 'body':
        value = context.body?.[condition.field || ''];
        break;
      case 'ip_range':
        value = context.ip;
        break;
      case 'time_window':
        value = context.timestamp;
        break;
      default:
        return false;
    }

    return this.evaluateOperator(condition.operator, value, condition.value);
  }

  private evaluateOperator(operator: string, actual: any, expected: any): boolean {
    switch (operator) {
      case 'equals':
        return actual === expected;
      case 'contains':
        return String(actual).includes(String(expected));
      case 'regex':
        return new RegExp(expected).test(String(actual));
      case 'in_range':
        if (Array.isArray(expected) && expected.length === 2) {
          const numValue = typeof actual === 'number' ? actual : parseFloat(actual);
          return numValue >= expected[0] && numValue <= expected[1];
        }
        return false;
      default:
        return false;
    }
  }

  private async checkRule(rule: RateLimitRule, context: RateLimitContext): Promise<RateLimitResult> {
    const key = this.generateKey(rule, context);
    
    // Check different time windows
    const checks = [];
    
    if (rule.requestsPerSecond) {
      checks.push(this.checkTimeWindow(key + ':second', rule.requestsPerSecond, 1));
    }
    if (rule.requestsPerMinute) {
      checks.push(this.checkTimeWindow(key + ':minute', rule.requestsPerMinute, 60));
    }
    if (rule.requestsPerHour) {
      checks.push(this.checkTimeWindow(key + ':hour', rule.requestsPerHour, 3600));
    }
    if (rule.requestsPerDay) {
      checks.push(this.checkTimeWindow(key + ':day', rule.requestsPerDay, 86400));
    }

    const results = await Promise.all(checks);
    
    // If any time window is exceeded, deny the request
    for (const result of results) {
      if (!result.allowed) {
        const rateLimitResult: RateLimitResult = {
          allowed: false,
          remaining: result.remaining,
          resetTime: result.resetTime,
          rule
        };
        if (result.retryAfter !== undefined) {
          rateLimitResult.retryAfter = result.retryAfter;
        }
        return rateLimitResult;
      }
    }

    // Check burst protection if configured
    if (rule.burstSize) {
      const burstResult = await this.checkBurstLimit(key + ':burst', rule.burstSize, 10); // 10 second window
      if (!burstResult.allowed) {
        const rateLimitResult: RateLimitResult = {
          allowed: false,
          remaining: burstResult.remaining,
          resetTime: burstResult.resetTime,
          rule
        };
        if (burstResult.retryAfter !== undefined) {
          rateLimitResult.retryAfter = burstResult.retryAfter;
        }
        return rateLimitResult;
      }
    }

    return {
      allowed: true,
      remaining: Math.min(...results.map(r => r.remaining)),
      resetTime: new Date(Math.min(...results.map(r => r.resetTime.getTime()))),
      rule
    };
  }

  private async checkTimeWindow(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
    if (!this.redisClient) {
      return {
        allowed: true,
        remaining: limit,
        resetTime: new Date(Date.now() + windowSeconds * 1000)
      };
    }

    try {
      const current = await this.redisClient.incr(key);
      
      if (current === 1) {
        await this.redisClient.expire(key, windowSeconds);
      }

      const ttl = await this.redisClient.ttl(key);
      const resetTime = new Date(Date.now() + ttl * 1000);

      const result: RateLimitResult = {
        allowed: current <= limit,
        remaining: Math.max(0, limit - current),
        resetTime
      };
      if (current > limit) {
        result.retryAfter = ttl;
      }
      return result;
    } catch (error) {
      this.logger.error('Time window check error:', error);
      return {
        allowed: true,
        remaining: limit,
        resetTime: new Date(Date.now() + windowSeconds * 1000)
      };
    }
  }

  private async checkBurstLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
    if (!this.redisClient) {
      return {
        allowed: true,
        remaining: limit,
        resetTime: new Date(Date.now() + windowSeconds * 1000)
      };
    }

    try {
      const now = Date.now();
      const windowStart = now - (windowSeconds * 1000);

      // Add current request timestamp
      await this.redisClient.zAdd(key, { score: now, value: now.toString() });

      // Remove old entries
      await this.redisClient.zRemRangeByScore(key, 0, windowStart);

      // Count current requests in window
      const count = await this.redisClient.zCard(key);

      // Set expiration
      await this.redisClient.expire(key, windowSeconds);

      const result: RateLimitResult = {
        allowed: count <= limit,
        remaining: Math.max(0, limit - count),
        resetTime: new Date(now + windowSeconds * 1000)
      };
      if (count > limit) {
        result.retryAfter = windowSeconds;
      }
      return result;
    } catch (error) {
      this.logger.error('Burst limit check error:', error);
      return {
        allowed: true,
        remaining: limit,
        resetTime: new Date(Date.now() + windowSeconds * 1000)
      };
    }
  }

  private generateKey(rule: RateLimitRule, context: RateLimitContext): string {
    const parts = ['rate_limit', rule.id];
    
    switch (rule.clientType) {
      case 'user':
        parts.push('user', context.clientId);
        break;
      case 'organization':
        parts.push('org', context.clientId);
        break;
      case 'api_key':
        parts.push('key', context.clientId);
        break;
      case 'ip':
        parts.push('ip', context.ip);
        break;
    }

    return parts.join(':');
  }

  private getMinuteLimit(rule: RateLimitRule): number {
    if (rule.requestsPerMinute) return rule.requestsPerMinute;
    if (rule.requestsPerSecond) return rule.requestsPerSecond * 60;
    if (rule.requestsPerHour) return rule.requestsPerHour / 60;
    if (rule.requestsPerDay) return rule.requestsPerDay / (24 * 60);
    return Infinity;
  }

  private async getRemainingCount(rule: RateLimitRule, context: RateLimitContext): Promise<number> {
    const key = this.generateKey(rule, context);
    
    if (rule.requestsPerMinute) {
      const result = await this.checkTimeWindow(key + ':minute', rule.requestsPerMinute, 60);
      return result.remaining;
    }
    
    return Infinity;
  }

  // Rule management methods
  async addRule(rule: RateLimitRule): Promise<void> {
    this.validateRule(rule);
    this.rules.set(rule.id, rule);
    this.logger.info('Rate limit rule added:', { ruleId: rule.id, ruleName: rule.name });
  }

  async updateRule(ruleId: string, updates: Partial<RateLimitRule>): Promise<void> {
    const existingRule = this.rules.get(ruleId);
    if (!existingRule) {
      throw new Error(`Rate limit rule not found: ${ruleId}`);
    }

    const updatedRule = { ...existingRule, ...updates, updatedAt: new Date() };
    this.validateRule(updatedRule);
    this.rules.set(ruleId, updatedRule);
    this.logger.info('Rate limit rule updated:', { ruleId, updates });
  }

  async deleteRule(ruleId: string): Promise<void> {
    if (!this.rules.has(ruleId)) {
      throw new Error(`Rate limit rule not found: ${ruleId}`);
    }

    this.rules.delete(ruleId);
    this.logger.info('Rate limit rule deleted:', { ruleId });
  }

  getRules(): RateLimitRule[] {
    return Array.from(this.rules.values());
  }

  getRule(ruleId: string): RateLimitRule | undefined {
    return this.rules.get(ruleId);
  }

  private validateRule(rule: RateLimitRule): void {
    if (!rule.id || !rule.name) {
      throw new Error('Rule must have id and name');
    }

    if (!['user', 'organization', 'api_key', 'ip'].includes(rule.clientType)) {
      throw new Error('Invalid client type');
    }

    if (!rule.endpoints || rule.endpoints.length === 0) {
      throw new Error('Rule must specify at least one endpoint');
    }

    if (!rule.methods || rule.methods.length === 0) {
      throw new Error('Rule must specify at least one method');
    }

    if (!['throttle', 'block', 'queue'].includes(rule.action)) {
      throw new Error('Invalid action type');
    }

    const hasLimit = rule.requestsPerSecond || rule.requestsPerMinute || 
                    rule.requestsPerHour || rule.requestsPerDay;
    if (!hasLimit) {
      throw new Error('Rule must specify at least one rate limit');
    }
  }

  // Statistics and monitoring
  async getStatistics(): Promise<any> {
    if (!this.redisClient) {
      return { error: 'Redis not available' };
    }

    try {
      const keys = await this.redisClient.keys('rate_limit:*');
      const stats = {
        totalKeys: keys.length,
        activeRules: this.rules.size,
        rulesByType: this.getRulesByType(),
        keysByRule: this.groupKeysByRule(keys)
      };

      return stats;
    } catch (error) {
      this.logger.error('Get statistics error:', error);
      return { error: 'Failed to get statistics' };
    }
  }

  private getRulesByType(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const rule of this.rules.values()) {
      counts[rule.clientType] = (counts[rule.clientType] || 0) + 1;
    }
    return counts;
  }

  private groupKeysByRule(keys: string[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const key of keys) {
      const parts = key.split(':');
      if (parts.length >= 3) {
        const ruleId = parts[1];
        counts[ruleId] = (counts[ruleId] || 0) + 1;
      }
    }
    return counts;
  }

  async shutdown(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
      this.logger.info('RateLimitService Redis client disconnected');
    }
  }
}