#!/usr/bin/env node

/**
 * Redis Health Check Script
 * 
 * Comprehensive health checking for Redis infrastructure
 * Can be used for monitoring, alerting, and automated health checks
 */

const fs = require('fs');
const path = require('path');

class RedisHealthChecker {
  constructor(options = {}) {
    this.options = {
      timeout: options.timeout || 5000,
      retries: options.retries || 3,
      alertThresholds: {
        memoryUsage: options.memoryThreshold || 0.8,
        hitRatio: options.hitRatioThreshold || 0.9,
        connectionCount: options.connectionThreshold || 100,
        responseTime: options.responseTimeThreshold || 100
      },
      ...options
    };
    
    this.results = {
      timestamp: new Date(),
      overall: 'unknown',
      instances: {},
      alerts: [],
      summary: {}
    };
  }

  // Run comprehensive health check
  async runHealthCheck() {
    console.log('🏥 Starting Redis health check...');
    
    try {
      // Check each Redis instance
      await this.checkInstance('session');
      await this.checkInstance('cache');
      await this.checkInstance('realtime');
      
      // Check cluster status if applicable
      if (process.env.REDIS_USE_SENTINEL === 'true') {
        await this.checkClusterHealth();
      }
      
      // Analyze results and generate summary
      this.analyzeResults();
      
      // Generate report
      this.generateReport();
      
      return this.results;
      
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      this.results.overall = 'critical';
      this.results.error = error.message;
      return this.results;
    }
  }

  // Check individual Redis instance
  async checkInstance(instanceType) {
    console.log(`🔍 Checking ${instanceType} instance...`);
    
    const instanceResult = {
      type: instanceType,
      status: 'unknown',
      checks: {},
      metrics: {},
      alerts: []
    };

    try {
      // Connection check
      instanceResult.checks.connection = await this.checkConnection(instanceType);
      
      // Performance check
      instanceResult.checks.performance = await this.checkPerformance(instanceType);
      
      // Memory check
      instanceResult.checks.memory = await this.checkMemory(instanceType);
      
      // Configuration check
      instanceResult.checks.configuration = await this.checkConfiguration(instanceType);
      
      // Determine overall instance status
      instanceResult.status = this.determineInstanceStatus(instanceResult.checks);
      
      // Collect metrics
      instanceResult.metrics = await this.collectInstanceMetrics(instanceType);
      
      // Check for alerts
      instanceResult.alerts = this.checkInstanceAlerts(instanceResult.metrics);
      
      this.results.instances[instanceType] = instanceResult;
      
      console.log(`✅ ${instanceType} instance check completed: ${instanceResult.status}`);
      
    } catch (error) {
      console.error(`❌ Failed to check ${instanceType} instance:`, error.message);
      instanceResult.status = 'critical';
      instanceResult.error = error.message;
      this.results.instances[instanceType] = instanceResult;
    }
  }

  // Check Redis connection
  async checkConnection(instanceType) {
    const startTime = Date.now();
    
    try {
      // Simulate connection check (in real implementation, use Redis client)
      await this.simulateRedisOperation(instanceType, 'PING');
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        responseTime,
        message: `Connection successful (${responseTime}ms)`
      };
      
    } catch (error) {
      return {
        status: 'critical',
        error: error.message,
        message: 'Connection failed'
      };
    }
  }

  // Check Redis performance
  async checkPerformance(instanceType) {
    try {
      // Simulate performance metrics collection
      const metrics = await this.simulatePerformanceMetrics(instanceType);
      
      const issues = [];
      
      // Check hit ratio
      if (metrics.hitRatio < this.options.alertThresholds.hitRatio) {
        issues.push(`Low hit ratio: ${(metrics.hitRatio * 100).toFixed(1)}%`);
      }
      
      // Check operations per second
      if (metrics.opsPerSecond < 10) {
        issues.push(`Low operations per second: ${metrics.opsPerSecond}`);
      }
      
      // Check slow queries
      if (metrics.slowQueries > 10) {
        issues.push(`High slow query count: ${metrics.slowQueries}`);
      }
      
      return {
        status: issues.length === 0 ? 'healthy' : 'warning',
        metrics,
        issues,
        message: issues.length === 0 ? 'Performance is good' : `Performance issues: ${issues.join(', ')}`
      };
      
    } catch (error) {
      return {
        status: 'critical',
        error: error.message,
        message: 'Performance check failed'
      };
    }
  }

  // Check Redis memory usage
  async checkMemory(instanceType) {
    try {
      // Simulate memory metrics collection
      const memoryMetrics = await this.simulateMemoryMetrics(instanceType);
      
      const issues = [];
      
      // Check memory usage
      if (memoryMetrics.usageRatio > this.options.alertThresholds.memoryUsage) {
        issues.push(`High memory usage: ${(memoryMetrics.usageRatio * 100).toFixed(1)}%`);
      }
      
      // Check fragmentation
      if (memoryMetrics.fragmentationRatio > 1.5) {
        issues.push(`High memory fragmentation: ${memoryMetrics.fragmentationRatio.toFixed(2)}`);
      }
      
      // Check evicted keys
      if (memoryMetrics.evictedKeys > 0) {
        issues.push(`Keys being evicted: ${memoryMetrics.evictedKeys}`);
      }
      
      return {
        status: issues.length === 0 ? 'healthy' : 'warning',
        metrics: memoryMetrics,
        issues,
        message: issues.length === 0 ? 'Memory usage is normal' : `Memory issues: ${issues.join(', ')}`
      };
      
    } catch (error) {
      return {
        status: 'critical',
        error: error.message,
        message: 'Memory check failed'
      };
    }
  }

  // Check Redis configuration
  async checkConfiguration(instanceType) {
    try {
      const configPath = path.join(__dirname, `../../../infrastructure/database/redis-${instanceType}.conf`);
      
      if (!fs.existsSync(configPath)) {
        return {
          status: 'warning',
          message: 'Configuration file not found',
          issues: ['Missing configuration file']
        };
      }
      
      const config = fs.readFileSync(configPath, 'utf8');
      const issues = this.validateConfiguration(config, instanceType);
      
      return {
        status: issues.length === 0 ? 'healthy' : 'warning',
        issues,
        message: issues.length === 0 ? 'Configuration is valid' : `Configuration issues: ${issues.length}`
      };
      
    } catch (error) {
      return {
        status: 'critical',
        error: error.message,
        message: 'Configuration check failed'
      };
    }
  }

  // Validate Redis configuration
  validateConfiguration(configContent, instanceType) {
    const issues = [];
    const lines = configContent.split('\n');
    
    // Check for required settings
    const requiredSettings = [
      'maxmemory',
      'maxmemory-policy',
      'requirepass',
      'maxclients'
    ];
    
    for (const setting of requiredSettings) {
      const hasSettings = lines.some(line => line.trim().startsWith(setting));
      if (!hasSettings) {
        issues.push(`Missing ${setting} configuration`);
      }
    }
    
    // Check memory policy
    const memoryPolicyLine = lines.find(line => line.trim().startsWith('maxmemory-policy'));
    if (memoryPolicyLine) {
      const policy = memoryPolicyLine.split(' ')[1];
      const recommendedPolicies = {
        session: ['allkeys-lru', 'volatile-lru'],
        cache: ['allkeys-lru', 'volatile-lru'],
        realtime: ['volatile-ttl', 'allkeys-lru']
      };
      
      if (!recommendedPolicies[instanceType].includes(policy)) {
        issues.push(`Suboptimal memory policy: ${policy}`);
      }
    }
    
    // Check for performance optimizations
    const performanceSettings = [
      'lazyfree-lazy-eviction',
      'lazyfree-lazy-expire',
      'slowlog-log-slower-than'
    ];
    
    for (const setting of performanceSettings) {
      const hasSetting = lines.some(line => line.trim().startsWith(setting));
      if (!hasSetting) {
        issues.push(`Missing performance optimization: ${setting}`);
      }
    }
    
    return issues;
  }

  // Check cluster health (if using Sentinel)
  async checkClusterHealth() {
    console.log('🛡️ Checking Redis Sentinel cluster...');
    
    try {
      // Simulate cluster health check
      const clusterStatus = await this.simulateClusterStatus();
      
      this.results.cluster = {
        status: clusterStatus.healthy ? 'healthy' : 'warning',
        sentinels: clusterStatus.sentinels,
        masters: clusterStatus.masters,
        message: clusterStatus.healthy ? 'Cluster is healthy' : 'Cluster has issues'
      };
      
    } catch (error) {
      this.results.cluster = {
        status: 'critical',
        error: error.message,
        message: 'Cluster check failed'
      };
    }
  }

  // Collect instance metrics
  async collectInstanceMetrics(instanceType) {
    // Simulate metrics collection
    return {
      uptime: Math.floor(Math.random() * 86400), // Random uptime in seconds
      connectedClients: Math.floor(Math.random() * 50),
      usedMemory: Math.floor(Math.random() * 500) * 1024 * 1024, // Random memory usage
      totalCommands: Math.floor(Math.random() * 100000),
      keyspaceHits: Math.floor(Math.random() * 10000),
      keyspaceMisses: Math.floor(Math.random() * 1000),
      evictedKeys: Math.floor(Math.random() * 10),
      expiredKeys: Math.floor(Math.random() * 100)
    };
  }

  // Check for instance-specific alerts
  checkInstanceAlerts(metrics) {
    const alerts = [];
    
    // Memory usage alert
    const memoryUsageMB = metrics.usedMemory / (1024 * 1024);
    if (memoryUsageMB > 400) { // Assuming 512MB limit
      alerts.push({
        level: 'warning',
        message: `High memory usage: ${memoryUsageMB.toFixed(1)}MB`
      });
    }
    
    // Connection count alert
    if (metrics.connectedClients > this.options.alertThresholds.connectionCount) {
      alerts.push({
        level: 'warning',
        message: `High connection count: ${metrics.connectedClients}`
      });
    }
    
    // Hit ratio alert
    const hitRatio = metrics.keyspaceHits / (metrics.keyspaceHits + metrics.keyspaceMisses);
    if (hitRatio < this.options.alertThresholds.hitRatio) {
      alerts.push({
        level: 'warning',
        message: `Low hit ratio: ${(hitRatio * 100).toFixed(1)}%`
      });
    }
    
    // Evicted keys alert
    if (metrics.evictedKeys > 0) {
      alerts.push({
        level: 'info',
        message: `Keys being evicted: ${metrics.evictedKeys}`
      });
    }
    
    return alerts;
  }

  // Determine overall instance status
  determineInstanceStatus(checks) {
    const statuses = Object.values(checks).map(check => check.status);
    
    if (statuses.includes('critical')) {
      return 'critical';
    } else if (statuses.includes('warning')) {
      return 'warning';
    } else if (statuses.every(status => status === 'healthy')) {
      return 'healthy';
    } else {
      return 'unknown';
    }
  }

  // Analyze overall results
  analyzeResults() {
    const instanceStatuses = Object.values(this.results.instances).map(instance => instance.status);
    
    // Determine overall health
    if (instanceStatuses.includes('critical')) {
      this.results.overall = 'critical';
    } else if (instanceStatuses.includes('warning')) {
      this.results.overall = 'warning';
    } else if (instanceStatuses.every(status => status === 'healthy')) {
      this.results.overall = 'healthy';
    } else {
      this.results.overall = 'unknown';
    }
    
    // Collect all alerts
    this.results.alerts = [];
    Object.values(this.results.instances).forEach(instance => {
      this.results.alerts.push(...instance.alerts);
    });
    
    // Generate summary
    this.results.summary = {
      totalInstances: Object.keys(this.results.instances).length,
      healthyInstances: instanceStatuses.filter(s => s === 'healthy').length,
      warningInstances: instanceStatuses.filter(s => s === 'warning').length,
      criticalInstances: instanceStatuses.filter(s => s === 'critical').length,
      totalAlerts: this.results.alerts.length,
      criticalAlerts: this.results.alerts.filter(a => a.level === 'critical').length,
      warningAlerts: this.results.alerts.filter(a => a.level === 'warning').length
    };
  }

  // Generate health check report
  generateReport() {
    console.log('\n📋 REDIS HEALTH CHECK REPORT');
    console.log('================================');
    
    // Overall status
    const statusEmoji = {
      healthy: '✅',
      warning: '⚠️',
      critical: '❌',
      unknown: '❓'
    };
    
    console.log(`\n🏥 Overall Status: ${statusEmoji[this.results.overall]} ${this.results.overall.toUpperCase()}`);
    console.log(`📊 Summary: ${this.results.summary.healthyInstances}/${this.results.summary.totalInstances} instances healthy`);
    console.log(`🚨 Alerts: ${this.results.summary.totalAlerts} total (${this.results.summary.criticalAlerts} critical, ${this.results.summary.warningAlerts} warnings)`);
    
    // Instance details
    console.log('\n🔧 Instance Status:');
    Object.entries(this.results.instances).forEach(([name, instance]) => {
      console.log(`  ${statusEmoji[instance.status]} ${name.toUpperCase()}: ${instance.status}`);
      
      if (instance.alerts.length > 0) {
        instance.alerts.forEach(alert => {
          const alertEmoji = alert.level === 'critical' ? '🔴' : alert.level === 'warning' ? '🟡' : '🔵';
          console.log(`    ${alertEmoji} ${alert.message}`);
        });
      }
    });
    
    // Cluster status (if applicable)
    if (this.results.cluster) {
      console.log(`\n🛡️ Cluster Status: ${statusEmoji[this.results.cluster.status]} ${this.results.cluster.status.toUpperCase()}`);
    }
    
    // Recommendations
    this.generateRecommendations();
    
    console.log(`\n⏰ Check completed at: ${this.results.timestamp.toLocaleString()}`);
  }

  // Generate recommendations based on results
  generateRecommendations() {
    const recommendations = [];
    
    // Check for critical issues
    if (this.results.overall === 'critical') {
      recommendations.push('🚨 IMMEDIATE ACTION REQUIRED: Critical issues detected');
    }
    
    // Memory recommendations
    const highMemoryInstances = Object.entries(this.results.instances)
      .filter(([name, instance]) => 
        instance.checks.memory && instance.checks.memory.issues.some(issue => issue.includes('memory'))
      );
    
    if (highMemoryInstances.length > 0) {
      recommendations.push('💾 Consider increasing memory limits or optimizing data structures');
    }
    
    // Performance recommendations
    const lowPerformanceInstances = Object.entries(this.results.instances)
      .filter(([name, instance]) => 
        instance.checks.performance && instance.checks.performance.status !== 'healthy'
      );
    
    if (lowPerformanceInstances.length > 0) {
      recommendations.push('⚡ Review performance metrics and consider optimization');
    }
    
    // Configuration recommendations
    const configIssues = Object.values(this.results.instances)
      .filter(instance => instance.checks.configuration && instance.checks.configuration.issues.length > 0);
    
    if (configIssues.length > 0) {
      recommendations.push('⚙️ Update Redis configurations to follow best practices');
    }
    
    if (recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      recommendations.forEach(rec => console.log(`  ${rec}`));
    } else {
      console.log('\n✨ No recommendations - everything looks good!');
    }
  }

  // Simulate Redis operations (replace with actual Redis calls)
  async simulateRedisOperation(instanceType, operation) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.95) { // 5% chance of failure
          reject(new Error(`${operation} failed for ${instanceType}`));
        } else {
          resolve(`${operation} successful`);
        }
      }, Math.random() * 100); // Random delay 0-100ms
    });
  }

  // Simulate performance metrics
  async simulatePerformanceMetrics(instanceType) {
    return {
      hitRatio: 0.85 + Math.random() * 0.14, // 85-99%
      opsPerSecond: Math.floor(Math.random() * 1000),
      slowQueries: Math.floor(Math.random() * 20),
      avgResponseTime: Math.random() * 50 // 0-50ms
    };
  }

  // Simulate memory metrics
  async simulateMemoryMetrics(instanceType) {
    const maxMemory = instanceType === 'cache' ? 1024 : instanceType === 'session' ? 512 : 256;
    const usedMemory = maxMemory * (0.3 + Math.random() * 0.4); // 30-70% usage
    
    return {
      usedMemory: usedMemory * 1024 * 1024, // Convert to bytes
      maxMemory: maxMemory * 1024 * 1024,
      usageRatio: usedMemory / maxMemory,
      fragmentationRatio: 1.1 + Math.random() * 0.3,
      evictedKeys: Math.floor(Math.random() * 10)
    };
  }

  // Simulate cluster status
  async simulateClusterStatus() {
    return {
      healthy: Math.random() > 0.1, // 90% chance of healthy
      sentinels: 3,
      masters: 3
    };
  }

  // Export results to JSON
  exportResults(filename) {
    const filepath = filename || `redis-health-check-${Date.now()}.json`;
    fs.writeFileSync(filepath, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Results exported to: ${filepath}`);
    return filepath;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    
    switch (key) {
      case 'timeout':
        options.timeout = parseInt(value);
        break;
      case 'memory-threshold':
        options.memoryThreshold = parseFloat(value);
        break;
      case 'hit-ratio-threshold':
        options.hitRatioThreshold = parseFloat(value);
        break;
      case 'export':
        options.export = value;
        break;
      case 'json':
        options.jsonOutput = true;
        break;
    }
  }
  
  const healthChecker = new RedisHealthChecker(options);
  const results = await healthChecker.runHealthCheck();
  
  // Export results if requested
  if (options.export) {
    healthChecker.exportResults(options.export);
  }
  
  // JSON output for programmatic use
  if (options.jsonOutput) {
    console.log(JSON.stringify(results, null, 2));
  }
  
  // Exit with appropriate code
  const exitCode = results.overall === 'critical' ? 2 : 
                   results.overall === 'warning' ? 1 : 0;
  
  process.exit(exitCode);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Health check script failed:', error.message);
    process.exit(3);
  });
}

module.exports = RedisHealthChecker;