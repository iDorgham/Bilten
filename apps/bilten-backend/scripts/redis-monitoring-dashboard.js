#!/usr/bin/env node

/**
 * Redis Monitoring Dashboard
 * 
 * Real-time monitoring dashboard for Redis infrastructure
 * Provides comprehensive metrics, alerts, and health monitoring
 */

const readline = require('readline');
const { performance } = require('perf_hooks');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m'
};

class RedisMonitoringDashboard {
  constructor() {
    this.refreshInterval = 5000; // 5 seconds
    this.isRunning = false;
    this.intervalId = null;
    this.metrics = {};
    this.alerts = [];
    this.startTime = Date.now();
    
    // Initialize Redis connections (mock for demonstration)
    this.redisClients = {
      session: { connected: true, host: 'redis-session', port: 6379 },
      cache: { connected: true, host: 'redis-cache', port: 6379 },
      realtime: { connected: true, host: 'redis-realtime', port: 6379 }
    };
  }

  // Start the monitoring dashboard
  start() {
    console.clear();
    this.showHeader();
    this.isRunning = true;
    
    // Set up keyboard input handling
    this.setupKeyboardHandling();
    
    // Start periodic updates
    this.intervalId = setInterval(() => {
      this.updateDashboard();
    }, this.refreshInterval);
    
    // Initial update
    this.updateDashboard();
    
    console.log(`${colors.green}✅ Monitoring dashboard started${colors.reset}`);
    console.log(`${colors.cyan}Press 'q' to quit, 'r' to refresh, 'h' for help${colors.reset}\n`);
  }

  // Stop the monitoring dashboard
  stop() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    console.log(`\n${colors.yellow}📊 Monitoring dashboard stopped${colors.reset}`);
    process.exit(0);
  }

  // Set up keyboard input handling
  setupKeyboardHandling() {
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }

    process.stdin.on('keypress', (str, key) => {
      if (key.ctrl && key.name === 'c') {
        this.stop();
      }
      
      switch (key.name) {
        case 'q':
          this.stop();
          break;
        case 'r':
          this.updateDashboard();
          break;
        case 'h':
          this.showHelp();
          break;
        case 'c':
          this.clearAlerts();
          break;
        case 's':
          this.showDetailedStats();
          break;
        case 'a':
          this.showAlerts();
          break;
      }
    });
  }

  // Show dashboard header
  showHeader() {
    const title = 'REDIS MONITORING DASHBOARD';
    const border = '='.repeat(title.length + 4);
    
    console.log(`${colors.bright}${colors.cyan}${border}${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}  ${title}  ${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}${border}${colors.reset}`);
    console.log();
  }

  // Update the dashboard display
  async updateDashboard() {
    if (!this.isRunning) return;
    
    try {
      // Collect metrics (simulated for demonstration)
      await this.collectMetrics();
      
      // Clear screen and redraw
      console.clear();
      this.showHeader();
      this.showSystemInfo();
      this.showInstanceStatus();
      this.showPerformanceMetrics();
      this.showMemoryUsage();
      this.showConnectionInfo();
      this.showRecentAlerts();
      this.showControls();
      
    } catch (error) {
      console.error(`${colors.red}❌ Error updating dashboard: ${error.message}${colors.reset}`);
    }
  }

  // Collect metrics from Redis instances
  async collectMetrics() {
    const timestamp = Date.now();
    
    // Simulate metrics collection (in real implementation, this would connect to Redis)
    this.metrics = {
      timestamp,
      session: this.generateMockMetrics('session'),
      cache: this.generateMockMetrics('cache'),
      realtime: this.generateMockMetrics('realtime'),
      system: {
        uptime: timestamp - this.startTime,
        totalMemory: 8 * 1024 * 1024 * 1024, // 8GB
        freeMemory: 2 * 1024 * 1024 * 1024,  // 2GB
        cpuUsage: Math.random() * 100
      }
    };
    
    // Check for alerts
    this.checkAlerts();
  }

  // Generate mock metrics for demonstration
  generateMockMetrics(instanceType) {
    const baseMemory = instanceType === 'cache' ? 1024 : instanceType === 'session' ? 512 : 256;
    const usedMemory = baseMemory * (0.3 + Math.random() * 0.4); // 30-70% usage
    
    return {
      connected: true,
      memory: {
        used: usedMemory * 1024 * 1024, // Convert to bytes
        max: baseMemory * 1024 * 1024,
        usage_ratio: usedMemory / baseMemory,
        fragmentation_ratio: 1.1 + Math.random() * 0.3
      },
      performance: {
        hit_ratio: 0.85 + Math.random() * 0.14, // 85-99%
        ops_per_sec: Math.floor(Math.random() * 1000),
        keyspace_hits: Math.floor(Math.random() * 10000),
        keyspace_misses: Math.floor(Math.random() * 1000),
        expired_keys: Math.floor(Math.random() * 100),
        evicted_keys: Math.floor(Math.random() * 10)
      },
      connections: {
        connected_clients: Math.floor(Math.random() * 50),
        blocked_clients: Math.floor(Math.random() * 5),
        rejected_connections: Math.floor(Math.random() * 3)
      },
      keyspace: {
        db0: {
          keys: Math.floor(Math.random() * 10000),
          expires: Math.floor(Math.random() * 5000)
        }
      }
    };
  }

  // Show system information
  showSystemInfo() {
    const uptime = this.formatUptime(this.metrics.system.uptime);
    const memUsage = ((this.metrics.system.totalMemory - this.metrics.system.freeMemory) / this.metrics.system.totalMemory * 100).toFixed(1);
    
    console.log(`${colors.bright}📊 SYSTEM OVERVIEW${colors.reset}`);
    console.log(`${colors.cyan}Uptime:${colors.reset} ${uptime}`);
    console.log(`${colors.cyan}System Memory:${colors.reset} ${memUsage}% used`);
    console.log(`${colors.cyan}CPU Usage:${colors.reset} ${this.metrics.system.cpuUsage.toFixed(1)}%`);
    console.log(`${colors.cyan}Last Update:${colors.reset} ${new Date().toLocaleTimeString()}`);
    console.log();
  }

  // Show Redis instance status
  showInstanceStatus() {
    console.log(`${colors.bright}🔧 REDIS INSTANCES${colors.reset}`);
    
    const instances = ['session', 'cache', 'realtime'];
    
    instances.forEach(instance => {
      const metrics = this.metrics[instance];
      const status = metrics.connected ? 
        `${colors.green}●${colors.reset} ONLINE` : 
        `${colors.red}●${colors.reset} OFFLINE`;
      
      const memUsage = (metrics.memory.usage_ratio * 100).toFixed(1);
      const hitRatio = (metrics.performance.hit_ratio * 100).toFixed(1);
      
      console.log(`${colors.cyan}${instance.toUpperCase()}:${colors.reset} ${status} | Mem: ${memUsage}% | Hit Ratio: ${hitRatio}%`);
    });
    console.log();
  }

  // Show performance metrics
  showPerformanceMetrics() {
    console.log(`${colors.bright}⚡ PERFORMANCE METRICS${colors.reset}`);
    
    const instances = ['session', 'cache', 'realtime'];
    
    console.log(`${colors.cyan}Instance${colors.reset}   ${'Ops/sec'.padEnd(8)} ${'Hit Ratio'.padEnd(10)} ${'Connections'.padEnd(12)} ${'Keys'.padEnd(8)}`);
    console.log('─'.repeat(60));
    
    instances.forEach(instance => {
      const metrics = this.metrics[instance];
      const opsPerSec = metrics.performance.ops_per_sec.toString().padEnd(8);
      const hitRatio = `${(metrics.performance.hit_ratio * 100).toFixed(1)}%`.padEnd(10);
      const connections = metrics.connections.connected_clients.toString().padEnd(12);
      const keys = metrics.keyspace.db0.keys.toString().padEnd(8);
      
      console.log(`${instance.padEnd(9)} ${opsPerSec} ${hitRatio} ${connections} ${keys}`);
    });
    console.log();
  }

  // Show memory usage details
  showMemoryUsage() {
    console.log(`${colors.bright}💾 MEMORY USAGE${colors.reset}`);
    
    const instances = ['session', 'cache', 'realtime'];
    
    instances.forEach(instance => {
      const metrics = this.metrics[instance];
      const usedMB = (metrics.memory.used / (1024 * 1024)).toFixed(1);
      const maxMB = (metrics.memory.max / (1024 * 1024)).toFixed(1);
      const usage = (metrics.memory.usage_ratio * 100).toFixed(1);
      const fragmentation = metrics.memory.fragmentation_ratio.toFixed(2);
      
      const usageColor = usage > 80 ? colors.red : usage > 60 ? colors.yellow : colors.green;
      
      console.log(`${colors.cyan}${instance.toUpperCase()}:${colors.reset} ${usedMB}MB / ${maxMB}MB (${usageColor}${usage}%${colors.reset}) | Frag: ${fragmentation}`);
    });
    console.log();
  }

  // Show connection information
  showConnectionInfo() {
    console.log(`${colors.bright}🔗 CONNECTIONS${colors.reset}`);
    
    const instances = ['session', 'cache', 'realtime'];
    
    instances.forEach(instance => {
      const metrics = this.metrics[instance];
      const connected = metrics.connections.connected_clients;
      const blocked = metrics.connections.blocked_clients;
      const rejected = metrics.connections.rejected_connections;
      
      console.log(`${colors.cyan}${instance.toUpperCase()}:${colors.reset} ${connected} active | ${blocked} blocked | ${rejected} rejected`);
    });
    console.log();
  }

  // Show recent alerts
  showRecentAlerts() {
    console.log(`${colors.bright}🚨 RECENT ALERTS${colors.reset}`);
    
    if (this.alerts.length === 0) {
      console.log(`${colors.green}No active alerts${colors.reset}`);
    } else {
      const recentAlerts = this.alerts.slice(-5); // Show last 5 alerts
      
      recentAlerts.forEach(alert => {
        const levelColor = alert.level === 'error' ? colors.red : 
                          alert.level === 'warning' ? colors.yellow : colors.blue;
        const time = new Date(alert.timestamp).toLocaleTimeString();
        
        console.log(`${levelColor}${alert.level.toUpperCase()}${colors.reset} [${time}] ${alert.message}`);
      });
    }
    console.log();
  }

  // Show control instructions
  showControls() {
    console.log(`${colors.bright}⌨️  CONTROLS${colors.reset}`);
    console.log(`${colors.cyan}q${colors.reset} - Quit | ${colors.cyan}r${colors.reset} - Refresh | ${colors.cyan}h${colors.reset} - Help | ${colors.cyan}s${colors.reset} - Stats | ${colors.cyan}a${colors.reset} - Alerts | ${colors.cyan}c${colors.reset} - Clear Alerts`);
  }

  // Check for alert conditions
  checkAlerts() {
    const timestamp = Date.now();
    
    Object.entries(this.metrics).forEach(([instance, metrics]) => {
      if (instance === 'system' || instance === 'timestamp') return;
      
      // Memory usage alert
      if (metrics.memory.usage_ratio > 0.8) {
        this.addAlert('warning', instance, `High memory usage: ${(metrics.memory.usage_ratio * 100).toFixed(1)}%`, timestamp);
      }
      
      // Hit ratio alert
      if (metrics.performance.hit_ratio < 0.9) {
        this.addAlert('warning', instance, `Low hit ratio: ${(metrics.performance.hit_ratio * 100).toFixed(1)}%`, timestamp);
      }
      
      // Connection alert
      if (metrics.connections.connected_clients > 100) {
        this.addAlert('info', instance, `High connection count: ${metrics.connections.connected_clients}`, timestamp);
      }
      
      // Eviction alert
      if (metrics.performance.evicted_keys > 0) {
        this.addAlert('info', instance, `Keys being evicted: ${metrics.performance.evicted_keys}`, timestamp);
      }
    });
  }

  // Add alert
  addAlert(level, instance, message, timestamp) {
    // Avoid duplicate alerts
    const isDuplicate = this.alerts.some(alert => 
      alert.level === level && 
      alert.instance === instance && 
      alert.message === message &&
      timestamp - alert.timestamp < 60000 // Within 1 minute
    );
    
    if (!isDuplicate) {
      this.alerts.push({
        level,
        instance,
        message,
        timestamp
      });
      
      // Keep only last 50 alerts
      if (this.alerts.length > 50) {
        this.alerts = this.alerts.slice(-50);
      }
    }
  }

  // Show help
  showHelp() {
    console.clear();
    this.showHeader();
    
    console.log(`${colors.bright}📖 HELP${colors.reset}\n`);
    console.log(`${colors.cyan}Keyboard Controls:${colors.reset}`);
    console.log(`  q - Quit the dashboard`);
    console.log(`  r - Force refresh display`);
    console.log(`  h - Show this help screen`);
    console.log(`  s - Show detailed statistics`);
    console.log(`  a - Show all alerts`);
    console.log(`  c - Clear all alerts`);
    console.log(`  Ctrl+C - Emergency exit\n`);
    
    console.log(`${colors.cyan}Dashboard Sections:${colors.reset}`);
    console.log(`  📊 System Overview - System uptime, memory, and CPU usage`);
    console.log(`  🔧 Redis Instances - Status of each Redis instance`);
    console.log(`  ⚡ Performance Metrics - Operations per second, hit ratios`);
    console.log(`  💾 Memory Usage - Memory consumption and fragmentation`);
    console.log(`  🔗 Connections - Active, blocked, and rejected connections`);
    console.log(`  🚨 Recent Alerts - Latest alerts and warnings\n`);
    
    console.log(`${colors.cyan}Alert Levels:${colors.reset}`);
    console.log(`  ${colors.red}ERROR${colors.reset} - Critical issues requiring immediate attention`);
    console.log(`  ${colors.yellow}WARNING${colors.reset} - Issues that may impact performance`);
    console.log(`  ${colors.blue}INFO${colors.reset} - Informational messages\n`);
    
    console.log(`${colors.green}Press any key to return to dashboard...${colors.reset}`);
  }

  // Show detailed statistics
  showDetailedStats() {
    console.clear();
    this.showHeader();
    
    console.log(`${colors.bright}📈 DETAILED STATISTICS${colors.reset}\n`);
    
    Object.entries(this.metrics).forEach(([instance, metrics]) => {
      if (instance === 'system' || instance === 'timestamp') return;
      
      console.log(`${colors.bright}${colors.cyan}${instance.toUpperCase()} INSTANCE${colors.reset}`);
      console.log(`Memory Used: ${(metrics.memory.used / (1024 * 1024)).toFixed(2)} MB`);
      console.log(`Memory Max: ${(metrics.memory.max / (1024 * 1024)).toFixed(2)} MB`);
      console.log(`Memory Usage: ${(metrics.memory.usage_ratio * 100).toFixed(2)}%`);
      console.log(`Fragmentation: ${metrics.memory.fragmentation_ratio.toFixed(2)}`);
      console.log(`Hit Ratio: ${(metrics.performance.hit_ratio * 100).toFixed(2)}%`);
      console.log(`Operations/sec: ${metrics.performance.ops_per_sec}`);
      console.log(`Keyspace Hits: ${metrics.performance.keyspace_hits}`);
      console.log(`Keyspace Misses: ${metrics.performance.keyspace_misses}`);
      console.log(`Connected Clients: ${metrics.connections.connected_clients}`);
      console.log(`Blocked Clients: ${metrics.connections.blocked_clients}`);
      console.log(`Total Keys: ${metrics.keyspace.db0.keys}`);
      console.log(`Keys with TTL: ${metrics.keyspace.db0.expires}`);
      console.log();
    });
    
    console.log(`${colors.green}Press any key to return to dashboard...${colors.reset}`);
  }

  // Show all alerts
  showAlerts() {
    console.clear();
    this.showHeader();
    
    console.log(`${colors.bright}🚨 ALL ALERTS${colors.reset}\n`);
    
    if (this.alerts.length === 0) {
      console.log(`${colors.green}No alerts to display${colors.reset}`);
    } else {
      this.alerts.forEach((alert, index) => {
        const levelColor = alert.level === 'error' ? colors.red : 
                          alert.level === 'warning' ? colors.yellow : colors.blue;
        const time = new Date(alert.timestamp).toLocaleString();
        
        console.log(`${index + 1}. ${levelColor}${alert.level.toUpperCase()}${colors.reset} [${time}] ${alert.instance}: ${alert.message}`);
      });
    }
    
    console.log(`\n${colors.green}Press any key to return to dashboard...${colors.reset}`);
  }

  // Clear all alerts
  clearAlerts() {
    this.alerts = [];
    console.log(`${colors.green}✅ All alerts cleared${colors.reset}`);
  }

  // Format uptime
  formatUptime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

// Main execution
function main() {
  const dashboard = new RedisMonitoringDashboard();
  
  // Handle process termination
  process.on('SIGINT', () => dashboard.stop());
  process.on('SIGTERM', () => dashboard.stop());
  
  // Start the dashboard
  dashboard.start();
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = RedisMonitoringDashboard;