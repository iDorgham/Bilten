# Redis Caching Infrastructure Documentation

## Overview

The Bilten platform uses a comprehensive Redis caching infrastructure designed for high availability, performance, and scalability. The infrastructure consists of multiple Redis instances, each optimized for specific use cases, along with monitoring, alerting, and cluster management capabilities.

## Architecture

### Redis Instances

The infrastructure includes three specialized Redis instances:

1. **Session Redis** (`redis-session:6379`)
   - **Purpose:** User sessions and authentication tokens
   - **Memory:** 512MB
   - **Eviction Policy:** allkeys-lru
   - **Persistence:** Enabled with regular snapshots
   - **TTL:** 24 hours default

2. **Cache Redis** (`redis-cache:6380`)
   - **Purpose:** Application data and query results
   - **Memory:** 1GB
   - **Eviction Policy:** allkeys-lru
   - **Persistence:** Enabled with regular snapshots
   - **TTL:** 1-6 hours depending on data type

3. **Realtime Redis** (`redis-realtime:6381`)
   - **Purpose:** Real-time analytics and counters
   - **Memory:** 256MB
   - **Eviction Policy:** volatile-ttl
   - **Persistence:** Disabled for performance
   - **TTL:** 5-15 minutes

### High Availability

Redis Sentinel is configured for automatic failover:

- **3 Sentinel instances** monitoring all Redis masters
- **Automatic failover** with 2-sentinel quorum
- **Service discovery** for dynamic master detection
- **Event monitoring** for real-time cluster status

## Components

### Core Components

1. **RedisManager** (`src/cache/RedisManager.js`)
   - Manages connections to all Redis instances
   - Provides unified interface for Redis operations
   - Handles connection pooling and retry logic

2. **CacheService** (`src/cache/CacheService.js`)
   - Implements caching patterns (cache-aside, write-through, etc.)
   - Provides multi-layer caching strategies
   - Handles cache invalidation and warming

3. **CacheAbstraction** (`src/cache/CacheAbstraction.js`)
   - High-level caching interface for applications
   - Entity-specific caching methods
   - Standardized key generation and TTL management

4. **RedisMonitor** (`src/cache/RedisMonitor.js`)
   - Real-time monitoring of Redis instances
   - Performance metrics collection
   - Alerting system for threshold violations

5. **RedisClusterManager** (`src/cache/RedisClusterManager.js`)
   - Sentinel integration and cluster management
   - Automatic failover handling
   - Master discovery and health checking

6. **CacheInitializer** (`src/cache/CacheInitializer.js`)
   - Infrastructure initialization and startup
   - Health checks and cache warming
   - Graceful shutdown handling

## Usage Examples

### Basic Caching Operations

```javascript
const cacheAbstraction = require('./src/cache/CacheAbstraction');

// Cache a user
await cacheAbstraction.cacheUser(userId, userData);

// Get cached user
const user = await cacheAbstraction.getUser(userId);

// Invalidate user cache
await cacheAbstraction.invalidateUser(userId);
```

### Session Management

```javascript
// Create session
await cacheAbstraction.createSession(sessionId, userId, sessionData);

// Get session
const session = await cacheAbstraction.getSession(sessionId);

// Update session activity
await cacheAbstraction.updateSessionActivity(sessionId);

// Invalidate session
await cacheAbstraction.invalidateSession(sessionId);
```

### Analytics Counters

```javascript
// Increment event view counter
await cacheAbstraction.incrementAnalyticsCounter('event', eventId, 'views');

// Cache analytics data
await cacheAbstraction.cacheAnalytics('event', eventId, 'daily_stats', data);
```

### Batch Operations

```javascript
// Batch cache users
await cacheAbstraction.batchCacheUsers(users);

// Batch get users
const cachedUsers = await cacheAbstraction.batchGetUsers(userIds);
```

## Monitoring and Alerting

### Monitoring Endpoints

- `GET /api/v1/cache/health` - Overall health status
- `GET /api/v1/cache/stats` - Detailed statistics
- `GET /api/v1/cache/monitoring/performance` - Performance metrics
- `GET /api/v1/cache/monitoring/alerts` - Active alerts
- `GET /api/v1/cache/cluster/status` - Cluster status

### Alert Thresholds

- **Memory Usage:** Alert at 80% capacity
- **Hit Ratio:** Alert below 90%
- **Connection Count:** Alert above 100 connections
- **Slow Queries:** Alert for queries > 1 second

### Metrics Collected

- Memory usage and fragmentation
- Cache hit/miss ratios
- Operations per second
- Connection counts
- Key expiration and eviction rates
- Slow query logs

## Configuration

### Environment Variables

```bash
# Redis Connection URLs
REDIS_SESSION_URL=redis://redis-session:6379
REDIS_CACHE_URL=redis://redis-cache:6379
REDIS_REALTIME_URL=redis://redis-realtime:6379

# Sentinel Configuration (Production)
REDIS_USE_SENTINEL=true
REDIS_SENTINEL_HOSTS=sentinel1:26379,sentinel2:26380,sentinel3:26381

# Cache Behavior
CACHE_WARM_ON_STARTUP=true
CACHE_DEFAULT_TTL=3600

# Monitoring and Alerting
REDIS_MONITORING_ENABLED=true
REDIS_ALERT_MEMORY_THRESHOLD=0.8
REDIS_ALERT_HIT_RATIO_THRESHOLD=0.9
REDIS_MONITORING_INTERVAL=30000
```

### Configuration Files

- `database/redis-session.conf` - Session Redis configuration
- `database/redis-cache.conf` - Cache Redis configuration
- `database/redis-realtime.conf` - Realtime Redis configuration
- `database/redis-sentinel.conf` - Sentinel configuration

## Deployment

### Quick Start

1. **Initialize Infrastructure**
   ```bash
   cd bilten-backend
   npm run redis:init
   ```

2. **Start Redis Services**
   ```bash
   docker-compose up -d redis-session redis-cache redis-realtime
   ```

3. **Run Health Check**
   ```bash
   npm run redis:health
   ```

4. **Start Monitoring Dashboard**
   ```bash
   npm run redis:monitor
   ```

### Docker Compose

The infrastructure is deployed using Docker Compose with the following services:

```yaml
services:
  redis-session:
    image: redis:7-alpine
    ports: ["6379:6379"]
    volumes:
      - redis_session_data:/data
      - ./database/redis-session.conf:/usr/local/etc/redis/redis.conf
    command: redis-server /usr/local/etc/redis/redis.conf
    
  redis-cache:
    image: redis:7-alpine
    ports: ["6380:6379"]
    volumes:
      - redis_cache_data:/data
      - ./database/redis-cache.conf:/usr/local/etc/redis/redis.conf
    command: redis-server /usr/local/etc/redis/redis.conf
    
  redis-realtime:
    image: redis:7-alpine
    ports: ["6381:6379"]
    volumes:
      - redis_realtime_data:/data
      - ./database/redis-realtime.conf:/usr/local/etc/redis/redis.conf
    command: redis-server /usr/local/etc/redis/redis.conf
    
  redis-sentinel-1:
    image: redis:7-alpine
    ports: ["26379:26379"]
    volumes:
      - ./database/redis-sentinel.conf:/usr/local/etc/redis/sentinel.conf
    command: redis-sentinel /usr/local/etc/redis/sentinel.conf
```

### Initialization

```javascript
const cacheInitializer = require('./src/cache/CacheInitializer');

// Initialize cache infrastructure
await cacheInitializer.initialize();
```

### Management Scripts

The Redis infrastructure includes several management scripts:

- `npm run redis:init` - Initialize complete infrastructure
- `npm run redis:optimize` - Optimize configurations based on system resources
- `npm run redis:monitor` - Start real-time monitoring dashboard
- `npm run redis:health` - Run comprehensive health check
- `npm run redis:health:json` - Export health check as JSON
- `npm run redis:health:export` - Export detailed health report

## Performance Optimization

### Memory Optimization

- **Data Structure Tuning:** Optimized ziplist and intset limits
- **Lazy Freeing:** Enabled for better performance
- **Compression:** Automatic compression for large values

### Network Optimization

- **Connection Pooling:** Managed connection pools
- **Pipelining:** Batch operations where possible
- **Keep-Alive:** TCP keep-alive for persistent connections

### Caching Strategies

- **Cache-Aside:** For read-heavy workloads
- **Write-Through:** For critical data consistency
- **Write-Behind:** For high-write performance
- **Multi-Layer:** For different TTL requirements

## Troubleshooting

### Common Issues

1. **High Memory Usage**
   - Check eviction policy configuration
   - Monitor key expiration patterns
   - Review data structure efficiency

2. **Low Hit Ratio**
   - Analyze cache key patterns
   - Review TTL settings
   - Check for cache invalidation issues

3. **Connection Issues**
   - Verify network connectivity
   - Check authentication credentials
   - Monitor connection pool limits

4. **Performance Degradation**
   - Review slow query logs
   - Check memory fragmentation
   - Monitor CPU usage patterns

### Diagnostic Commands

```bash
# Check Redis info
docker exec bilten-redis-cache redis-cli info

# Monitor Redis operations
docker exec bilten-redis-cache redis-cli monitor

# Check slow queries
docker exec bilten-redis-cache redis-cli slowlog get 10

# Test connectivity
docker exec bilten-redis-cache redis-cli ping
```

## Maintenance

### Regular Tasks

1. **Monitor Performance Metrics**
   - Review daily performance reports
   - Check alert notifications
   - Analyze usage patterns

2. **Configuration Optimization**
   - Run optimization script monthly
   - Review and update configurations
   - Test performance improvements

3. **Backup and Recovery**
   - Verify backup procedures
   - Test recovery processes
   - Update disaster recovery plans

### Optimization Script

```bash
# Run Redis configuration optimization
node bilten-backend/scripts/optimize-redis-config.js
```

## Security

### Access Control

- **Password Protection:** All instances require authentication
- **Network Isolation:** Redis instances in private network
- **Admin Endpoints:** Protected by role-based access control

### Data Protection

- **Encryption in Transit:** TLS for production deployments
- **Sensitive Data:** Automatic masking and tokenization
- **Audit Logging:** All administrative actions logged

## Scaling

### Horizontal Scaling

- **Read Replicas:** Additional read-only instances
- **Sharding:** Data distribution across multiple instances
- **Load Balancing:** Intelligent request routing

### Vertical Scaling

- **Memory Expansion:** Increase instance memory limits
- **CPU Optimization:** Tune Redis configuration parameters
- **Network Bandwidth:** Optimize connection settings

## Best Practices

### Development

1. **Use Appropriate TTLs:** Set reasonable expiration times
2. **Batch Operations:** Use multi-key operations when possible
3. **Monitor Usage:** Track cache hit ratios and performance
4. **Handle Failures:** Implement fallback mechanisms

### Operations

1. **Regular Monitoring:** Check health and performance daily
2. **Capacity Planning:** Monitor growth trends
3. **Configuration Management:** Version control configurations
4. **Documentation:** Keep deployment docs updated

### Security

1. **Access Control:** Limit administrative access
2. **Network Security:** Use private networks
3. **Data Classification:** Classify cached data sensitivity
4. **Audit Trails:** Log all administrative actions

## Support

### Monitoring Dashboards

Access real-time monitoring through:
- Cache health endpoints
- Performance metrics API
- Alert management interface
- Cluster status dashboard

### Log Analysis

Monitor application logs for:
- Cache operation errors
- Performance warnings
- Connection issues
- Configuration problems

### Performance Tuning

Regular performance reviews should include:
- Memory usage analysis
- Hit ratio optimization
- Query performance review
- Configuration parameter tuning