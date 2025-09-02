const redisManager = require('./RedisManager');
const redisMonitor = require('./RedisMonitor');
const redisClusterManager = require('./RedisClusterManager');
const cacheAbstraction = require('./CacheAbstraction');

class CacheInitializer {
  constructor() {
    this.initialized = false;
    this.initializationPromise = null;
  }

  // Initialize all cache components
  async initialize() {
    if (this.initialized) {
      return true;
    }

    if (this.initializationPromise) {
      return await this.initializationPromise;
    }

    this.initializationPromise = this._performInitialization();
    return await this.initializationPromise;
  }

  async _performInitialization() {
    try {
      console.log('🚀 Initializing Redis caching infrastructure...');

      // Step 1: Initialize Redis connections
      console.log('📡 Connecting to Redis instances...');
      await redisManager.initialize();

      // Step 2: Initialize Sentinel cluster management (if in production)
      if (process.env.NODE_ENV === 'production' || process.env.REDIS_USE_SENTINEL === 'true') {
        console.log('🛡️ Initializing Redis Sentinel cluster...');
        try {
          await redisClusterManager.initializeSentinels();
          redisClusterManager.startEventMonitoring();
        } catch (error) {
          console.warn('⚠️ Sentinel initialization failed, continuing with direct connections:', error.message);
        }
      }

      // Step 3: Start monitoring
      console.log('📊 Starting Redis monitoring...');
      redisMonitor.startMonitoring(30000); // Monitor every 30 seconds

      // Step 4: Perform health checks
      console.log('🏥 Performing initial health checks...');
      const healthCheck = await this.performHealthCheck();
      
      if (!healthCheck.healthy) {
        throw new Error(`Cache health check failed: ${healthCheck.error}`);
      }

      // Step 5: Warm critical caches (if configured)
      if (process.env.CACHE_WARM_ON_STARTUP === 'true') {
        console.log('🔥 Warming critical caches...');
        await this.warmCriticalCaches();
      }

      // Step 6: Set up graceful shutdown handlers
      this.setupShutdownHandlers();

      this.initialized = true;
      console.log('✅ Redis caching infrastructure initialized successfully');
      
      return true;

    } catch (error) {
      console.error('❌ Failed to initialize Redis caching infrastructure:', error);
      this.initialized = false;
      throw error;
    }
  }

  // Perform comprehensive health check
  async performHealthCheck() {
    try {
      // Check Redis connections
      const redisHealth = await cacheAbstraction.getCacheHealth();
      if (redisHealth.status !== 'healthy') {
        return {
          healthy: false,
          error: 'Redis connections unhealthy',
          details: redisHealth
        };
      }

      // Check cluster status (if using sentinel)
      if (process.env.NODE_ENV === 'production' || process.env.REDIS_USE_SENTINEL === 'true') {
        try {
          const clusterStatus = await redisClusterManager.getClusterStatus();
          if (clusterStatus.overall !== 'healthy') {
            console.warn('⚠️ Cluster status warning:', clusterStatus);
          }
        } catch (error) {
          console.warn('⚠️ Could not check cluster status:', error.message);
        }
      }

      // Test basic operations
      const testKey = 'health_check_test';
      const testValue = { timestamp: new Date(), test: true };
      
      await redisManager.set(testKey, testValue, 60);
      const retrieved = await redisManager.get(testKey);
      await redisManager.del(testKey);

      if (!retrieved || retrieved.test !== true) {
        return {
          healthy: false,
          error: 'Basic cache operations failed'
        };
      }

      return {
        healthy: true,
        redis: redisHealth,
        timestamp: new Date()
      };

    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }

  // Warm critical caches on startup
  async warmCriticalCaches() {
    try {
      const warmingTasks = [];

      // Warm system configuration cache
      warmingTasks.push(this.warmSystemConfig());

      // Warm frequently accessed branding settings
      warmingTasks.push(this.warmBrandingSettings());

      // Warm active event data
      warmingTasks.push(this.warmActiveEvents());

      const results = await Promise.allSettled(warmingTasks);
      
      let successCount = 0;
      let failureCount = 0;

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successCount++;
        } else {
          failureCount++;
          console.warn(`Cache warming task ${index} failed:`, result.reason);
        }
      });

      console.log(`🔥 Cache warming completed: ${successCount} successful, ${failureCount} failed`);

    } catch (error) {
      console.error('❌ Cache warming failed:', error);
    }
  }

  async warmSystemConfig() {
    // This would typically load system configuration from database
    // For now, we'll just set some default values
    const systemConfig = {
      maintenance_mode: false,
      max_events_per_organizer: 100,
      default_ticket_limit: 1000,
      cache_version: '1.0.0'
    };

    await redisManager.set('system:config', systemConfig, 3600);
    console.log('✅ System configuration cache warmed');
  }

  async warmBrandingSettings() {
    // This would typically load popular branding settings
    // For demonstration, we'll just log the intent
    console.log('✅ Branding settings cache warming prepared');
  }

  async warmActiveEvents() {
    // This would typically load active/upcoming events
    // For demonstration, we'll just log the intent
    console.log('✅ Active events cache warming prepared');
  }

  // Get initialization status
  getStatus() {
    return {
      initialized: this.initialized,
      redis: redisManager.getStatus(),
      monitoring: redisMonitor ? 'active' : 'inactive',
      timestamp: new Date()
    };
  }

  // Get comprehensive cache statistics
  async getStatistics() {
    try {
      const [cacheStats, healthStatus, monitorMetrics] = await Promise.all([
        cacheAbstraction.getCacheStats(),
        this.performHealthCheck(),
        redisMonitor.getMetrics()
      ]);

      return {
        timestamp: new Date(),
        health: healthStatus,
        statistics: cacheStats,
        monitoring: monitorMetrics,
        cluster: process.env.NODE_ENV === 'production' ? 
          await redisClusterManager.getClusterStatus() : null
      };

    } catch (error) {
      return {
        timestamp: new Date(),
        error: error.message,
        health: { healthy: false, error: error.message }
      };
    }
  }

  // Clear all caches (use with caution)
  async clearAllCaches() {
    try {
      const clientTypes = ['session', 'cache', 'realtime'];
      const results = {};

      for (const clientType of clientTypes) {
        try {
          const client = redisManager.getClient(clientType);
          await client.flushDb();
          results[clientType] = 'cleared';
        } catch (error) {
          results[clientType] = `error: ${error.message}`;
        }
      }

      console.log('🧹 All caches cleared:', results);
      return results;

    } catch (error) {
      console.error('❌ Failed to clear caches:', error);
      throw error;
    }
  }

  // Restart cache infrastructure
  async restart() {
    try {
      console.log('🔄 Restarting cache infrastructure...');

      // Stop monitoring
      redisMonitor.stopMonitoring();

      // Disconnect Redis
      await redisManager.disconnect();

      // Shutdown cluster manager
      if (redisClusterManager) {
        await redisClusterManager.shutdown();
      }

      // Reset initialization state
      this.initialized = false;
      this.initializationPromise = null;

      // Reinitialize
      await this.initialize();

      console.log('✅ Cache infrastructure restarted successfully');
      return true;

    } catch (error) {
      console.error('❌ Failed to restart cache infrastructure:', error);
      throw error;
    }
  }

  // Setup graceful shutdown handlers
  setupShutdownHandlers() {
    const gracefulShutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}, shutting down cache infrastructure gracefully...`);
      
      try {
        // Stop monitoring
        redisMonitor.stopMonitoring();
        
        // Disconnect Redis
        await redisManager.disconnect();
        
        // Shutdown cluster manager
        if (redisClusterManager) {
          await redisClusterManager.shutdown();
        }
        
        console.log('✅ Cache infrastructure shutdown complete');
        process.exit(0);
        
      } catch (error) {
        console.error('❌ Error during cache shutdown:', error);
        process.exit(1);
      }
    };

    // Handle different shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // nodemon restart

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught exception:', error);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });
  }

  // Configuration validation
  validateConfiguration() {
    const requiredEnvVars = [
      'REDIS_SESSION_URL',
      'REDIS_CACHE_URL', 
      'REDIS_REALTIME_URL'
    ];

    const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    return true;
  }
}

// Export singleton instance
module.exports = new CacheInitializer();