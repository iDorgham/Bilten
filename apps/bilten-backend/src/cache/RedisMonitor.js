const redisManager = require('./RedisManager');

class RedisMonitor {
  constructor() {
    this.metrics = {
      session: {},
      cache: {},
      realtime: {}
    };
    this.alerts = [];
    this.thresholds = {
      memoryUsage: 0.8,        // 80% memory usage
      connectionCount: 100,     // Max connections
      slowLogThreshold: 1000,   // 1 second
      keyspaceHitRatio: 0.9    // 90% hit ratio
    };
    this.monitoringInterval = null;
  }

  // Start monitoring all Redis instances
  startMonitoring(intervalMs = 30000) { // 30 seconds default
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(async () => {
      await this.collectMetrics();
      await this.checkAlerts();
    }, intervalMs);

    console.log('✅ Redis monitoring started');
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('✅ Redis monitoring stopped');
    }
  }

  // Collect metrics from all Redis instances
  async collectMetrics() {
    const clientTypes = ['session', 'cache', 'realtime'];
    
    for (const clientType of clientTypes) {
      try {
        const client = redisManager.getClient(clientType);
        
        // Get Redis INFO
        const [memoryInfo, statsInfo, keyspaceInfo, clientsInfo] = await Promise.all([
          client.info('memory'),
          client.info('stats'),
          client.info('keyspace'),
          client.info('clients')
        ]);

        // Parse metrics
        const memoryMetrics = this.parseRedisInfo(memoryInfo);
        const statsMetrics = this.parseRedisInfo(statsInfo);
        const keyspaceMetrics = this.parseRedisInfo(keyspaceInfo);
        const clientsMetrics = this.parseRedisInfo(clientsInfo);

        // Calculate derived metrics
        const hitRatio = statsMetrics.keyspace_hits / 
          (statsMetrics.keyspace_hits + statsMetrics.keyspace_misses) || 0;

        this.metrics[clientType] = {
          timestamp: new Date(),
          memory: {
            used: memoryMetrics.used_memory,
            max: memoryMetrics.maxmemory || memoryMetrics.total_system_memory,
            usage_ratio: memoryMetrics.used_memory / (memoryMetrics.maxmemory || memoryMetrics.total_system_memory),
            fragmentation_ratio: memoryMetrics.mem_fragmentation_ratio
          },
          performance: {
            hit_ratio: hitRatio,
            ops_per_sec: statsMetrics.instantaneous_ops_per_sec,
            keyspace_hits: statsMetrics.keyspace_hits,
            keyspace_misses: statsMetrics.keyspace_misses,
            expired_keys: statsMetrics.expired_keys,
            evicted_keys: statsMetrics.evicted_keys
          },
          connections: {
            connected_clients: clientsMetrics.connected_clients,
            blocked_clients: clientsMetrics.blocked_clients,
            rejected_connections: statsMetrics.rejected_connections
          },
          keyspace: this.parseKeyspaceInfo(keyspaceInfo),
          health: 'healthy'
        };

      } catch (error) {
        console.error(`Failed to collect metrics for ${clientType}:`, error);
        this.metrics[clientType] = {
          timestamp: new Date(),
          health: 'unhealthy',
          error: error.message
        };
      }
    }
  }

  // Parse Redis INFO response
  parseRedisInfo(infoString) {
    const info = {};
    const lines = infoString.split('\r\n');
    
    for (const line of lines) {
      if (line.includes(':') && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        info[key] = isNaN(value) ? value : Number(value);
      }
    }
    
    return info;
  }

  // Parse keyspace information
  parseKeyspaceInfo(keyspaceInfo) {
    const keyspace = {};
    const lines = keyspaceInfo.split('\r\n');
    
    for (const line of lines) {
      if (line.startsWith('db')) {
        const [db, stats] = line.split(':');
        const statsParts = stats.split(',');
        
        keyspace[db] = {};
        for (const part of statsParts) {
          const [key, value] = part.split('=');
          keyspace[db][key] = Number(value);
        }
      }
    }
    
    return keyspace;
  }

  // Check for alert conditions
  async checkAlerts() {
    const currentTime = new Date();
    
    for (const [clientType, metrics] of Object.entries(this.metrics)) {
      if (metrics.health === 'unhealthy') {
        this.addAlert('error', clientType, 'Redis instance unhealthy', metrics.error);
        continue;
      }

      // Memory usage alert
      if (metrics.memory && metrics.memory.usage_ratio > this.thresholds.memoryUsage) {
        this.addAlert('warning', clientType, 'High memory usage', 
          `Memory usage: ${(metrics.memory.usage_ratio * 100).toFixed(1)}%`);
      }

      // Connection count alert
      if (metrics.connections && metrics.connections.connected_clients > this.thresholds.connectionCount) {
        this.addAlert('warning', clientType, 'High connection count', 
          `Connected clients: ${metrics.connections.connected_clients}`);
      }

      // Hit ratio alert
      if (metrics.performance && metrics.performance.hit_ratio < this.thresholds.keyspaceHitRatio) {
        this.addAlert('warning', clientType, 'Low cache hit ratio', 
          `Hit ratio: ${(metrics.performance.hit_ratio * 100).toFixed(1)}%`);
      }

      // Evicted keys alert
      if (metrics.performance && metrics.performance.evicted_keys > 0) {
        this.addAlert('info', clientType, 'Keys being evicted', 
          `Evicted keys: ${metrics.performance.evicted_keys}`);
      }
    }

    // Clean old alerts (keep last 100)
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
  }

  // Add alert
  addAlert(level, clientType, message, details = null) {
    const alert = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level,
      clientType,
      message,
      details,
      acknowledged: false
    };

    this.alerts.unshift(alert);
    
    // Log alert
    const logLevel = level === 'error' ? 'error' : level === 'warning' ? 'warn' : 'info';
    console[logLevel](`Redis Alert [${clientType}]: ${message}${details ? ` - ${details}` : ''}`);
    
    return alert.id;
  }

  // Get current metrics
  getMetrics(clientType = null) {
    if (clientType) {
      return this.metrics[clientType] || null;
    }
    return this.metrics;
  }

  // Get alerts
  getAlerts(level = null, clientType = null, limit = 50) {
    let filteredAlerts = this.alerts;
    
    if (level) {
      filteredAlerts = filteredAlerts.filter(alert => alert.level === level);
    }
    
    if (clientType) {
      filteredAlerts = filteredAlerts.filter(alert => alert.clientType === clientType);
    }
    
    return filteredAlerts.slice(0, limit);
  }

  // Acknowledge alert
  acknowledgeAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = new Date();
      return true;
    }
    return false;
  }

  // Get health summary
  getHealthSummary() {
    const summary = {
      overall: 'healthy',
      instances: {},
      alerts: {
        error: 0,
        warning: 0,
        info: 0
      }
    };

    // Check instance health
    for (const [clientType, metrics] of Object.entries(this.metrics)) {
      summary.instances[clientType] = {
        status: metrics.health || 'unknown',
        lastUpdate: metrics.timestamp
      };
      
      if (metrics.health === 'unhealthy') {
        summary.overall = 'unhealthy';
      }
    }

    // Count alerts by level
    for (const alert of this.alerts) {
      if (!alert.acknowledged) {
        summary.alerts[alert.level]++;
      }
    }

    // Determine overall health
    if (summary.alerts.error > 0) {
      summary.overall = 'critical';
    } else if (summary.alerts.warning > 0 && summary.overall === 'healthy') {
      summary.overall = 'warning';
    }

    return summary;
  }

  // Get performance report
  getPerformanceReport() {
    const report = {
      timestamp: new Date(),
      instances: {}
    };

    for (const [clientType, metrics] of Object.entries(this.metrics)) {
      if (metrics.health === 'healthy') {
        report.instances[clientType] = {
          memory_usage: metrics.memory ? `${(metrics.memory.usage_ratio * 100).toFixed(1)}%` : 'N/A',
          hit_ratio: metrics.performance ? `${(metrics.performance.hit_ratio * 100).toFixed(1)}%` : 'N/A',
          ops_per_sec: metrics.performance ? metrics.performance.ops_per_sec : 'N/A',
          connected_clients: metrics.connections ? metrics.connections.connected_clients : 'N/A',
          total_keys: this.getTotalKeys(metrics.keyspace)
        };
      } else {
        report.instances[clientType] = {
          status: 'unhealthy',
          error: metrics.error
        };
      }
    }

    return report;
  }

  // Calculate total keys across all databases
  getTotalKeys(keyspace) {
    if (!keyspace) return 0;
    
    return Object.values(keyspace).reduce((total, db) => {
      return total + (db.keys || 0);
    }, 0);
  }

  // Set custom thresholds
  setThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  // Get slow log entries
  async getSlowLog(clientType, count = 10) {
    try {
      const client = redisManager.getClient(clientType);
      return await client.slowLog('GET', count);
    } catch (error) {
      console.error(`Failed to get slow log for ${clientType}:`, error);
      return [];
    }
  }

  // Clear slow log
  async clearSlowLog(clientType) {
    try {
      const client = redisManager.getClient(clientType);
      return await client.slowLog('RESET');
    } catch (error) {
      console.error(`Failed to clear slow log for ${clientType}:`, error);
      return false;
    }
  }
}

// Export singleton instance
module.exports = new RedisMonitor();