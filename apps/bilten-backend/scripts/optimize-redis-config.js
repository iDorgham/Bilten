#!/usr/bin/env node

/**
 * Redis Configuration Optimization Script
 * 
 * This script analyzes current Redis usage patterns and system resources
 * to provide optimized configuration recommendations.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

class RedisOptimizer {
  constructor() {
    this.systemInfo = this.getSystemInfo();
    this.recommendations = {};
  }

  getSystemInfo() {
    return {
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      cpuCount: os.cpus().length,
      platform: os.platform(),
      arch: os.arch(),
      loadAverage: os.loadavg()
    };
  }

  // Analyze system resources and generate recommendations
  generateRecommendations() {
    const totalMemoryGB = this.systemInfo.totalMemory / (1024 * 1024 * 1024);
    const freeMemoryGB = this.systemInfo.freeMemory / (1024 * 1024 * 1024);
    
    console.log('🔍 Analyzing system resources...');
    console.log(`Total Memory: ${totalMemoryGB.toFixed(2)} GB`);
    console.log(`Free Memory: ${freeMemoryGB.toFixed(2)} GB`);
    console.log(`CPU Cores: ${this.systemInfo.cpuCount}`);
    console.log(`Load Average: ${this.systemInfo.loadAverage.map(l => l.toFixed(2)).join(', ')}`);

    // Memory allocation recommendations
    this.recommendations.memory = this.calculateMemoryAllocation(totalMemoryGB);
    
    // Connection limits based on CPU cores
    this.recommendations.connections = this.calculateConnectionLimits();
    
    // Performance tuning based on system specs
    this.recommendations.performance = this.calculatePerformanceSettings();
    
    return this.recommendations;
  }

  calculateMemoryAllocation(totalMemoryGB) {
    // Allocate 25% of total memory to Redis, distributed across instances
    const redisMemoryGB = Math.max(1, totalMemoryGB * 0.25);
    
    return {
      total: `${redisMemoryGB.toFixed(1)}GB`,
      cache: `${Math.max(0.5, redisMemoryGB * 0.6).toFixed(1)}GB`,      // 60% for cache
      session: `${Math.max(0.3, redisMemoryGB * 0.3).toFixed(1)}GB`,    // 30% for sessions
      realtime: `${Math.max(0.1, redisMemoryGB * 0.1).toFixed(1)}GB`    // 10% for real-time
    };
  }

  calculateConnectionLimits() {
    const baseConcurrency = this.systemInfo.cpuCount * 100;
    
    return {
      cache: Math.max(1000, baseConcurrency * 2),
      session: Math.max(500, baseConcurrency),
      realtime: Math.max(300, baseConcurrency * 0.5)
    };
  }

  calculatePerformanceSettings() {
    const cpuCount = this.systemInfo.cpuCount;
    
    return {
      hz: cpuCount >= 4 ? 10 : 5,
      tcpBacklog: Math.max(511, cpuCount * 128),
      maxmemorysamples: cpuCount >= 8 ? 10 : 5,
      slowlogThreshold: cpuCount >= 4 ? 5000 : 10000
    };
  }

  // Generate optimized configuration files
  generateConfigFiles() {
    console.log('\n📝 Generating optimized configuration files...');
    
    const configs = {
      cache: this.generateCacheConfig(),
      session: this.generateSessionConfig(),
      realtime: this.generateRealtimeConfig()
    };

    // Write configuration files
    const configDir = path.join(__dirname, '../../../infrastructure/database');
    
    for (const [type, config] of Object.entries(configs)) {
      const filename = `redis-${type}-optimized.conf`;
      const filepath = path.join(configDir, filename);
      
      fs.writeFileSync(filepath, config);
      console.log(`✅ Generated ${filename}`);
    }

    return configs;
  }

  generateCacheConfig() {
    const mem = this.recommendations.memory;
    const conn = this.recommendations.connections;
    const perf = this.recommendations.performance;

    return `# Redis Configuration for Application Cache (Optimized)
# Generated on ${new Date().toISOString()}
# System: ${this.systemInfo.cpuCount} cores, ${(this.systemInfo.totalMemory / (1024**3)).toFixed(1)}GB RAM

# Memory and Persistence
maxmemory ${mem.cache.toLowerCase()}
maxmemory-policy allkeys-lru
maxmemory-samples ${perf.maxmemorysamples}
save 3600 1
save 300 100
save 60 10000

# Network
bind 0.0.0.0
port 6379
timeout 300
tcp-keepalive 300
tcp-backlog ${perf.tcpBacklog}

# Security
requirepass bilten_redis_cache_password

# Logging
loglevel notice
logfile ""
syslog-enabled no

# Performance Optimization
databases 16
hz ${perf.hz}
client-output-buffer-limit normal 0 0 0
client-output-buffer-limit replica 256mb 64mb 60
client-output-buffer-limit pubsub 32mb 8mb 60

# Memory Optimization
hash-max-ziplist-entries 512
hash-max-ziplist-value 64
list-max-ziplist-size -2
list-compress-depth 0
set-max-intset-entries 512
zset-max-ziplist-entries 128
zset-max-ziplist-value 64
hll-sparse-max-bytes 3000

# Lazy Freeing (non-blocking deletion)
lazyfree-lazy-eviction yes
lazyfree-lazy-expire yes
lazyfree-lazy-server-del yes
replica-lazy-flush yes

# Cache-specific settings
notify-keyspace-events AKE

# Slow Log Configuration
slowlog-log-slower-than ${perf.slowlogThreshold}
slowlog-max-len 128

# Client Connection Limits
maxclients ${conn.cache}

# Advanced Performance Tuning
rdbcompression yes
rdbchecksum yes
stop-writes-on-bgsave-error yes
`;
  }

  generateSessionConfig() {
    const mem = this.recommendations.memory;
    const conn = this.recommendations.connections;
    const perf = this.recommendations.performance;

    return `# Redis Configuration for Session Management (Optimized)
# Generated on ${new Date().toISOString()}
# System: ${this.systemInfo.cpuCount} cores, ${(this.systemInfo.totalMemory / (1024**3)).toFixed(1)}GB RAM

# Memory and Persistence
maxmemory ${mem.session.toLowerCase()}
maxmemory-policy allkeys-lru
maxmemory-samples ${perf.maxMemorysamples}
save 900 1
save 300 10
save 60 10000

# Network
bind 0.0.0.0
port 6379
timeout 0
tcp-keepalive 300
tcp-backlog ${perf.tcpBacklog}

# Security
requirepass bilten_redis_session_password

# Logging
loglevel notice
logfile ""
syslog-enabled no

# Performance Optimization
databases 16
hz ${perf.hz}
client-output-buffer-limit normal 0 0 0
client-output-buffer-limit replica 256mb 64mb 60
client-output-buffer-limit pubsub 32mb 8mb 60

# Memory Optimization for Sessions
hash-max-ziplist-entries 512
hash-max-ziplist-value 64
list-max-ziplist-size -2
set-max-intset-entries 512
zset-max-ziplist-entries 128
zset-max-ziplist-value 64

# Lazy Freeing
lazyfree-lazy-eviction yes
lazyfree-lazy-expire yes
lazyfree-lazy-server-del yes
replica-lazy-flush yes

# Session-specific settings
notify-keyspace-events Ex

# Slow Log Configuration
slowlog-log-slower-than ${perf.slowlogThreshold}
slowlog-max-len 128

# Client Connection Limits
maxclients ${conn.session}

# Session Optimization
timeout 0
rdbcompression yes
rdbchecksum yes
`;
  }

  generateRealtimeConfig() {
    const mem = this.recommendations.memory;
    const conn = this.recommendations.connections;
    const perf = this.recommendations.performance;

    return `# Redis Configuration for Real-time Analytics (Optimized)
# Generated on ${new Date().toISOString()}
# System: ${this.systemInfo.cpuCount} cores, ${(this.systemInfo.totalMemory / (1024**3)).toFixed(1)}GB RAM

# Memory and Persistence
maxmemory ${mem.realtime.toLowerCase()}
maxmemory-policy volatile-ttl
maxmemory-samples ${perf.maxmemorysamples}
save ""

# Network
bind 0.0.0.0
port 6379
timeout 30
tcp-keepalive 60
tcp-backlog ${perf.tcpBacklog}

# Security
requirepass bilten_redis_realtime_password

# Logging
loglevel notice
logfile ""
syslog-enabled no

# Performance Optimization for Real-time
databases 16
hz ${perf.hz}
client-output-buffer-limit normal 0 0 0
client-output-buffer-limit replica 256mb 64mb 60
client-output-buffer-limit pubsub 32mb 8mb 60

# Memory Optimization for Counters
hash-max-ziplist-entries 512
hash-max-ziplist-value 64
list-max-ziplist-size -2
set-max-intset-entries 512
zset-max-ziplist-entries 128
zset-max-ziplist-value 64

# Lazy Freeing for Performance
lazyfree-lazy-eviction yes
lazyfree-lazy-expire yes
lazyfree-lazy-server-del yes
replica-lazy-flush yes

# Real-time specific settings
notify-keyspace-events AKE

# Slow Log Configuration
slowlog-log-slower-than ${Math.floor(perf.slowlogThreshold / 2)}
slowlog-max-len 64

# Client Connection Limits
maxclients ${conn.realtime}

# Real-time Optimization
timeout 30
rdbcompression no
rdbchecksum no
`;
  }

  // Generate performance report
  generatePerformanceReport() {
    console.log('\n📊 Performance Optimization Report');
    console.log('=====================================');
    
    console.log('\n🧠 Memory Allocation:');
    console.log(`  Cache Instance:    ${this.recommendations.memory.cache}`);
    console.log(`  Session Instance:  ${this.recommendations.memory.session}`);
    console.log(`  Real-time Instance: ${this.recommendations.memory.realtime}`);
    console.log(`  Total Redis Memory: ${this.recommendations.memory.total}`);
    
    console.log('\n🔗 Connection Limits:');
    console.log(`  Cache Connections:    ${this.recommendations.connections.cache}`);
    console.log(`  Session Connections:  ${this.recommendations.connections.session}`);
    console.log(`  Real-time Connections: ${this.recommendations.connections.realtime}`);
    
    console.log('\n⚡ Performance Settings:');
    console.log(`  Hz Frequency:         ${this.recommendations.performance.hz}`);
    console.log(`  TCP Backlog:          ${this.recommendations.performance.tcpBacklog}`);
    console.log(`  Memory Samples:       ${this.recommendations.performance.maxmemorysamples}`);
    console.log(`  Slow Log Threshold:   ${this.recommendations.performance.slowlogThreshold}μs`);
    
    console.log('\n💡 Optimization Tips:');
    console.log('  • Use pipelining for batch operations');
    console.log('  • Implement connection pooling in applications');
    console.log('  • Monitor memory fragmentation regularly');
    console.log('  • Use appropriate data structures for your use case');
    console.log('  • Set reasonable TTLs to prevent memory bloat');
    console.log('  • Consider Redis Cluster for horizontal scaling');
    
    return this.recommendations;
  }

  // Validate current configuration
  async validateCurrentConfig() {
    console.log('\n🔍 Validating current Redis configuration...');
    
    const configFiles = [
      'redis-cache.conf',
      'redis-session.conf', 
      'redis-realtime.conf'
    ];
    
    const configDir = path.join(__dirname, '../../../infrastructure/database');
    const issues = [];
    
    for (const configFile of configFiles) {
      const filepath = path.join(configDir, configFile);
      
      if (!fs.existsSync(filepath)) {
        issues.push(`❌ Missing configuration file: ${configFile}`);
        continue;
      }
      
      const config = fs.readFileSync(filepath, 'utf8');
      const configIssues = this.analyzeConfig(config, configFile);
      issues.push(...configIssues);
    }
    
    if (issues.length === 0) {
      console.log('✅ All configurations look good!');
    } else {
      console.log('\n⚠️  Configuration Issues Found:');
      issues.forEach(issue => console.log(`  ${issue}`));
    }
    
    return issues;
  }

  analyzeConfig(configContent, filename) {
    const issues = [];
    const lines = configContent.split('\n');
    
    // Check for common configuration issues
    const hasMaxMemory = lines.some(line => line.startsWith('maxmemory '));
    const hasMaxClients = lines.some(line => line.startsWith('maxclients '));
    const hasSlowLog = lines.some(line => line.startsWith('slowlog-log-slower-than '));
    
    if (!hasMaxMemory) {
      issues.push(`❌ ${filename}: Missing maxmemory setting`);
    }
    
    if (!hasMaxClients) {
      issues.push(`⚠️  ${filename}: Missing maxclients setting`);
    }
    
    if (!hasSlowLog) {
      issues.push(`⚠️  ${filename}: Missing slow log configuration`);
    }
    
    return issues;
  }
}

// Main execution
async function main() {
  console.log('🚀 Redis Configuration Optimizer');
  console.log('================================\n');
  
  const optimizer = new RedisOptimizer();
  
  try {
    // Validate current configuration
    await optimizer.validateCurrentConfig();
    
    // Generate recommendations
    optimizer.generateRecommendations();
    
    // Generate optimized config files
    optimizer.generateConfigFiles();
    
    // Show performance report
    optimizer.generatePerformanceReport();
    
    console.log('\n✅ Optimization complete!');
    console.log('\n📋 Next Steps:');
    console.log('  1. Review the generated *-optimized.conf files');
    console.log('  2. Test the new configurations in a staging environment');
    console.log('  3. Replace the current config files when ready');
    console.log('  4. Restart Redis instances to apply changes');
    console.log('  5. Monitor performance after applying changes');
    
  } catch (error) {
    console.error('❌ Optimization failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = RedisOptimizer;