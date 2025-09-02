const redis = require('redis');

class RedisClusterManager {
  constructor() {
    this.sentinels = [
      { host: 'localhost', port: 26379 },
      { host: 'localhost', port: 26380 },
      { host: 'localhost', port: 26381 }
    ];
    
    this.masterNames = {
      session: 'bilten-session-master',
      cache: 'bilten-cache-master',
      realtime: 'bilten-realtime-master'
    };
    
    this.sentinelClients = [];
    this.masterInfo = {};
  }

  // Initialize sentinel connections
  async initializeSentinels() {
    try {
      for (const sentinel of this.sentinels) {
        const client = redis.createClient({
          host: sentinel.host,
          port: sentinel.port,
          password: 'bilten_sentinel_password',
          retry_strategy: this.getSentinelRetryStrategy()
        });

        await client.connect();
        this.sentinelClients.push(client);
        
        client.on('error', (err) => {
          console.error(`Sentinel ${sentinel.host}:${sentinel.port} error:`, err);
        });
      }

      console.log('✅ Redis Sentinels initialized');
      await this.discoverMasters();
      
    } catch (error) {
      console.error('❌ Failed to initialize sentinels:', error);
      throw error;
    }
  }

  // Discover master instances through sentinels
  async discoverMasters() {
    for (const [serviceName, masterName] of Object.entries(this.masterNames)) {
      try {
        const masterInfo = await this.getMasterInfo(masterName);
        if (masterInfo) {
          this.masterInfo[serviceName] = masterInfo;
          console.log(`✅ Discovered ${serviceName} master: ${masterInfo.ip}:${masterInfo.port}`);
        }
      } catch (error) {
        console.error(`❌ Failed to discover ${serviceName} master:`, error);
      }
    }
  }

  // Get master information from sentinel
  async getMasterInfo(masterName) {
    for (const sentinel of this.sentinelClients) {
      try {
        const result = await sentinel.sendCommand(['SENTINEL', 'get-master-addr-by-name', masterName]);
        if (result && result.length === 2) {
          return {
            ip: result[0],
            port: parseInt(result[1]),
            name: masterName
          };
        }
      } catch (error) {
        console.warn(`Failed to get master info from sentinel:`, error);
        continue;
      }
    }
    return null;
  }

  // Get current master for a service
  getCurrentMaster(serviceName) {
    return this.masterInfo[serviceName] || null;
  }

  // Check if master is available
  async checkMasterHealth(serviceName) {
    const masterInfo = this.getCurrentMaster(serviceName);
    if (!masterInfo) {
      return { healthy: false, error: 'Master not discovered' };
    }

    try {
      const client = redis.createClient({
        host: masterInfo.ip,
        port: masterInfo.port,
        password: this.getPasswordForService(serviceName),
        connect_timeout: 5000
      });

      await client.connect();
      const pong = await client.ping();
      await client.quit();

      return { 
        healthy: pong === 'PONG',
        master: masterInfo
      };
    } catch (error) {
      return { 
        healthy: false, 
        error: error.message,
        master: masterInfo
      };
    }
  }

  // Get password for service
  getPasswordForService(serviceName) {
    const passwords = {
      session: 'bilten_redis_session_password',
      cache: 'bilten_redis_cache_password',
      realtime: 'bilten_redis_realtime_password'
    };
    return passwords[serviceName];
  }

  // Get all sentinel information
  async getSentinelInfo() {
    const sentinelInfo = [];
    
    for (let i = 0; i < this.sentinelClients.length; i++) {
      const sentinel = this.sentinelClients[i];
      const sentinelConfig = this.sentinels[i];
      
      try {
        const info = await sentinel.info();
        const masters = await sentinel.sendCommand(['SENTINEL', 'masters']);
        
        sentinelInfo.push({
          host: sentinelConfig.host,
          port: sentinelConfig.port,
          connected: sentinel.isReady,
          info: this.parseRedisInfo(info),
          masters: this.parseSentinelMasters(masters)
        });
      } catch (error) {
        sentinelInfo.push({
          host: sentinelConfig.host,
          port: sentinelConfig.port,
          connected: false,
          error: error.message
        });
      }
    }
    
    return sentinelInfo;
  }

  // Parse sentinel masters response
  parseSentinelMasters(mastersArray) {
    const masters = [];
    
    for (let i = 0; i < mastersArray.length; i += 2) {
      const masterData = mastersArray[i + 1];
      const master = {};
      
      for (let j = 0; j < masterData.length; j += 2) {
        master[masterData[j]] = masterData[j + 1];
      }
      
      masters.push(master);
    }
    
    return masters;
  }

  // Parse Redis info response
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

  // Force failover for a master
  async forceFailover(serviceName) {
    const masterName = this.masterNames[serviceName];
    if (!masterName) {
      throw new Error(`Unknown service: ${serviceName}`);
    }

    for (const sentinel of this.sentinelClients) {
      try {
        const result = await sentinel.sendCommand(['SENTINEL', 'failover', masterName]);
        console.log(`✅ Initiated failover for ${serviceName}: ${result}`);
        
        // Wait a bit and rediscover masters
        setTimeout(() => this.discoverMasters(), 5000);
        
        return { success: true, message: result };
      } catch (error) {
        console.warn(`Failed to initiate failover via sentinel:`, error);
        continue;
      }
    }
    
    throw new Error('Failed to initiate failover via any sentinel');
  }

  // Get replica information for a master
  async getReplicaInfo(serviceName) {
    const masterName = this.masterNames[serviceName];
    if (!masterName) {
      throw new Error(`Unknown service: ${serviceName}`);
    }

    for (const sentinel of this.sentinelClients) {
      try {
        const replicas = await sentinel.sendCommand(['SENTINEL', 'replicas', masterName]);
        return this.parseSentinelMasters(replicas);
      } catch (error) {
        console.warn(`Failed to get replica info:`, error);
        continue;
      }
    }
    
    return [];
  }

  // Monitor sentinel events
  startEventMonitoring() {
    for (let i = 0; i < this.sentinelClients.length; i++) {
      const sentinel = this.sentinelClients[i];
      const sentinelConfig = this.sentinels[i];
      
      // Subscribe to sentinel events
      const subscriber = sentinel.duplicate();
      
      subscriber.pSubscribe('*', (message, channel) => {
        console.log(`Sentinel event from ${sentinelConfig.host}:${sentinelConfig.port} - ${channel}: ${message}`);
        
        // Handle specific events
        if (channel.includes('switch-master')) {
          console.log('🔄 Master switch detected, rediscovering masters...');
          setTimeout(() => this.discoverMasters(), 1000);
        }
      });
    }
    
    console.log('✅ Sentinel event monitoring started');
  }

  // Get cluster status
  async getClusterStatus() {
    const status = {
      timestamp: new Date(),
      sentinels: await this.getSentinelInfo(),
      masters: {},
      overall: 'healthy'
    };

    // Check each master
    for (const serviceName of Object.keys(this.masterNames)) {
      const health = await this.checkMasterHealth(serviceName);
      status.masters[serviceName] = health;
      
      if (!health.healthy) {
        status.overall = 'unhealthy';
      }
    }

    return status;
  }

  // Retry strategy for sentinel connections
  getSentinelRetryStrategy() {
    return (options) => {
      if (options.error && options.error.code === 'ECONNREFUSED') {
        console.error('Sentinel connection refused');
        return new Error('Sentinel connection refused');
      }
      
      if (options.total_retry_time > 1000 * 60 * 60) {
        console.error('Sentinel retry time exhausted');
        return new Error('Sentinel retry time exhausted');
      }
      
      if (options.attempt > 10) {
        console.error('Sentinel max attempts reached');
        return undefined;
      }
      
      return Math.min(options.attempt * 100, 3000);
    };
  }

  // Graceful shutdown
  async shutdown() {
    try {
      await Promise.all(this.sentinelClients.map(client => client.quit()));
      console.log('✅ Redis Sentinel connections closed');
    } catch (error) {
      console.error('❌ Error closing sentinel connections:', error);
    }
  }
}

// Export singleton instance
module.exports = new RedisClusterManager();