# Traffic Control and Rate Limiting

The Bilten API Gateway implements a comprehensive traffic control system that provides multiple layers of protection against abuse, DDoS attacks, and ensures fair resource usage across all clients.

## Features

### 1. Multi-Layer Rate Limiting
- **Global Rate Limiting**: Controls overall system load
- **User-Specific Rate Limiting**: Per-user request limits
- **Endpoint-Specific Rate Limiting**: Different limits for different API endpoints
- **IP-Based Rate Limiting**: Fallback protection for unauthenticated requests

### 2. Burst Protection
- Detects and blocks clients making too many requests in a short time period
- Configurable threshold and block duration
- Automatic cleanup of expired blocks

### 3. Adaptive Rate Limiting
- Dynamically adjusts rate limits based on system load
- Helps maintain system performance during high traffic periods
- Configurable adjustment factors and limits

### 4. Traffic Control Management
- Real-time configuration updates without restart
- Comprehensive statistics and monitoring
- System load reporting for adaptive adjustments

## Configuration

### Environment Variables

```bash
# Traffic Control
TRAFFIC_CONTROL_ENABLED=true

# Global Limits
GLOBAL_RATE_LIMIT_WINDOW=60000    # 1 minute
GLOBAL_RATE_LIMIT_MAX=1000        # 1000 requests per minute

# User Limits
USER_RATE_LIMIT_WINDOW=60000      # 1 minute
USER_RATE_LIMIT_MAX=100           # 100 requests per minute per user

# Authentication Limits
AUTH_RATE_LIMIT_WINDOW=900000     # 15 minutes
AUTH_RATE_LIMIT_MAX=5             # 5 login attempts per 15 minutes

# Registration Limits
REGISTER_RATE_LIMIT_WINDOW=3600000 # 1 hour
REGISTER_RATE_LIMIT_MAX=3         # 3 registration attempts per hour

# Payment Limits
PAYMENT_RATE_LIMIT_WINDOW=60000   # 1 minute
PAYMENT_RATE_LIMIT_MAX=10         # 10 payment requests per minute

# File Upload Limits
UPLOAD_RATE_LIMIT_WINDOW=60000    # 1 minute
UPLOAD_RATE_LIMIT_MAX=5           # 5 uploads per minute

# Burst Protection
BURST_PROTECTION_ENABLED=true
BURST_PROTECTION_THRESHOLD=50     # Block after 50 requests in 10 seconds
BURST_PROTECTION_BLOCK_DURATION=300000 # Block for 5 minutes

# Adaptive Rate Limiting
ADAPTIVE_RATE_LIMIT_ENABLED=false
ADAPTIVE_BASE_LIMIT=100
ADAPTIVE_MAX_LIMIT=500
ADAPTIVE_ADJUSTMENT_FACTOR=0.1
```

### Runtime Configuration

The traffic control system can be configured at runtime through API endpoints:

#### Get Current Configuration
```bash
GET /api/gateway/traffic-control/config
```

#### Update Configuration
```bash
PUT /api/gateway/traffic-control/config
Content-Type: application/json

{
  "enabled": true,
  "globalLimits": {
    "windowMs": 60000,
    "max": 1000
  },
  "userLimits": {
    "windowMs": 60000,
    "max": 100
  },
  "endpointLimits": {
    "/api/auth/login": {
      "windowMs": 900000,
      "max": 5
    }
  },
  "burstProtection": {
    "enabled": true,
    "threshold": 50,
    "blockDuration": 300000
  },
  "adaptiveRateLimit": {
    "enabled": false,
    "baseLimit": 100,
    "maxLimit": 500,
    "adjustmentFactor": 0.1
  }
}
```

## Monitoring and Statistics

### Get Traffic Control Statistics
```bash
GET /api/gateway/traffic-control/stats
```

Response:
```json
{
  "stats": {
    "totalKeys": 156,
    "blockedClients": 3,
    "activeRateLimits": 45,
    "burstProtectionActive": 2
  }
}
```

### Update System Load (for Adaptive Rate Limiting)
```bash
POST /api/gateway/traffic-control/system-load
Content-Type: application/json

{
  "load": 0.75
}
```

## Rate Limit Response Format

When a rate limit is exceeded, the API returns a 429 status code with the following format:

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded for this endpoint",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "retryAfter": 60
  }
}
```

### Error Codes

- `RATE_LIMIT_EXCEEDED`: Basic rate limit exceeded
- `CLIENT_BLOCKED`: Client temporarily blocked due to burst protection
- `BURST_PROTECTION_TRIGGERED`: Too many requests in short time period
- `ENDPOINT_RATE_LIMIT_EXCEEDED`: Endpoint-specific rate limit exceeded
- `USER_RATE_LIMIT_EXCEEDED`: User-specific rate limit exceeded
- `GLOBAL_RATE_LIMIT_EXCEEDED`: Global system rate limit exceeded

## Implementation Details

### Redis Keys

The system uses Redis for distributed rate limiting with the following key patterns:

- `user:{clientId}`: User-specific rate limits
- `endpoint:{endpoint}:{clientId}`: Endpoint-specific rate limits
- `global:requests`: Global rate limit counter
- `burst:{clientId}`: Burst protection request tracking
- `blocked:{clientId}`: Blocked client tracking
- `system:load`: Current system load for adaptive limiting

### Key Generation

- **Authenticated Users**: `user:{userId}`
- **Unauthenticated Users**: `ip:{ipAddress}`
- **Endpoint-Specific**: `endpoint:{path}:{clientId}`

### Burst Protection Algorithm

1. Track requests in a sliding window (10 seconds)
2. If requests exceed threshold, block client
3. Clean up expired request records automatically
4. Unblock clients after block duration expires

### Adaptive Rate Limiting Algorithm

1. Monitor system load (CPU, memory, response times)
2. Calculate adjustment factor based on load
3. Dynamically adjust rate limits within configured bounds
4. Higher load = lower limits, lower load = higher limits

## Best Practices

### For Clients

1. **Implement Exponential Backoff**: When receiving 429 responses, implement exponential backoff
2. **Respect Retry-After Headers**: Use the `retryAfter` value in error responses
3. **Cache Responses**: Reduce API calls by caching responses when appropriate
4. **Batch Requests**: Combine multiple operations into single requests when possible

### For Administrators

1. **Monitor Statistics**: Regularly check traffic control statistics
2. **Adjust Limits**: Fine-tune limits based on usage patterns
3. **Set Alerts**: Monitor for unusual traffic patterns or blocked clients
4. **Load Testing**: Test rate limits under various load conditions

## Troubleshooting

### Common Issues

1. **Legitimate Users Blocked**
   - Check burst protection threshold
   - Review endpoint-specific limits
   - Consider user behavior patterns

2. **System Performance Issues**
   - Enable adaptive rate limiting
   - Lower global rate limits
   - Monitor system resources

3. **Redis Connection Issues**
   - System falls back to allowing requests
   - Check Redis connectivity and configuration
   - Monitor Redis performance

### Debug Endpoints

```bash
# Check if a specific client is blocked
GET /api/gateway/traffic-control/client/{clientId}/status

# Get rate limit status for a client
GET /api/gateway/traffic-control/client/{clientId}/limits

# Clear blocks for a specific client (admin only)
DELETE /api/gateway/traffic-control/client/{clientId}/blocks
```

## Security Considerations

1. **DDoS Protection**: Multiple layers provide comprehensive DDoS protection
2. **Brute Force Prevention**: Authentication endpoints have strict limits
3. **Resource Protection**: Prevents abuse of expensive operations (uploads, payments)
4. **Fair Usage**: Ensures fair resource allocation among users

## Performance Impact

- **Redis Overhead**: Each request requires 1-3 Redis operations
- **Memory Usage**: Minimal Redis memory usage with automatic cleanup
- **Latency**: Adds ~1-2ms per request for rate limit checks
- **Scalability**: Horizontally scalable with Redis clustering

## Future Enhancements

1. **Machine Learning**: AI-based anomaly detection
2. **Geolocation**: Location-based rate limiting
3. **User Reputation**: Dynamic limits based on user behavior
4. **Advanced Analytics**: Detailed traffic analysis and reporting