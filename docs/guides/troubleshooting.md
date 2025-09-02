# Troubleshooting Guide

## Common Issues and Solutions

### Dependency Cycle Issues

#### Issue: `dependency cycle detected: bilten-frontend -> bilten-gateway -> bilten-frontend`

**Symptoms:**
- npm workspace installation fails
- Services fail to start in correct order
- Frontend cannot connect to Gateway
- TypeScript compilation errors in Gateway

**Root Causes:**
1. **Startup Order Problem**: Frontend starting before Gateway
2. **Missing Dependencies**: Incomplete workspace installation
3. **TypeScript Errors**: Syntax errors preventing compilation

**Solutions:**

##### 1. Use Correct Startup Order
```bash
# ❌ Wrong order (causes dependency cycle)
npm run dev:frontend
npm run dev:gateway

# ✅ Correct order
npm run dev:backend
npm run dev:gateway
npm run dev:frontend
npm run dev:scanner
```

##### 2. Use Workspace Commands
```bash
# Install all dependencies at root level
npm install

# Start all services using workspace (recommended)
npm run dev
```

##### 3. Fix TypeScript Errors
Check for syntax errors in Gateway files, particularly:
- `apps/bilten-gateway/src/middleware/RateLimitMiddleware.ts`
- Ensure proper indentation and brace matching

**Prevention:**
- Always use `npm run dev` from root directory
- Follow the established startup order: Backend → Gateway → Frontend → Scanner
- Run TypeScript compilation checks before starting services
- Use workspace-level dependency management

---

## Database Connection Issues

### PostgreSQL Configuration Errors

**Symptoms:**
- `FATAL: configuration file contains errors`
- Database container fails to start
- Connection refused errors

**Solutions:**
1. Check PostgreSQL configuration file syntax
2. Verify Docker volume mounts
3. Use default configuration for development

---

## Service Health Check Failures

### Backend API Unavailable

**Symptoms:**
- Health check endpoint returns 404 or connection refused
- Frontend cannot connect to backend
- Gateway routing fails

**Solutions:**
1. Ensure backend starts before other services
2. Check backend logs for startup errors
3. Verify environment variables are set correctly
4. Wait for backend to fully initialize before starting dependent services

---

## Performance Issues

### Slow Service Startup

**Symptoms:**
- Services take too long to start
- Timeout errors during health checks
- Resource contention

**Solutions:**
1. Increase health check timeouts
2. Start services sequentially with proper delays
3. Monitor system resources
4. Use development mode for faster startup

---

## Development Environment Issues

### Missing Dependencies

**Symptoms:**
- `MODULE_NOT_FOUND` errors
- Missing `node_modules` directories
- Package installation failures

**Solutions:**
1. Run `npm install` at root level
2. Clear and reinstall dependencies: `npm run clean && npm install`
3. Check for workspace configuration issues
4. Verify package.json files are valid

---

## Monitoring and Logging Issues

### Service Logs Not Available

**Symptoms:**
- No log output from services
- Cannot access monitoring dashboards
- Health check endpoints unavailable

**Solutions:**
1. Check Docker container logs: `docker logs <container-name>`
2. Verify monitoring stack is running
3. Check log file permissions
4. Ensure logging configuration is correct

---

## Network and Connectivity Issues

### Inter-Service Communication Failures

**Symptoms:**
- Services cannot communicate with each other
- API calls fail between services
- Gateway routing errors

**Solutions:**
1. Verify Docker network configuration
2. Check service URLs and ports
3. Ensure CORS configuration is correct
4. Verify firewall settings

---

## Security Issues

### Authentication Failures

**Symptoms:**
- JWT token validation errors
- User authentication fails
- API access denied

**Solutions:**
1. Check JWT secret configuration
2. Verify token expiration settings
3. Check authentication middleware configuration
4. Ensure proper CORS settings

---

## File Upload Issues

### Media Upload Failures

**Symptoms:**
- File uploads fail
- Storage quota exceeded
- File type validation errors

**Solutions:**
1. Check upload directory permissions
2. Verify file size limits
3. Check supported file types
4. Ensure storage service is running

---

## Payment Integration Issues

### Stripe Integration Failures

**Symptoms:**
- Payment processing fails
- Webhook delivery errors
- Payment status not updated

**Solutions:**
1. Verify Stripe API keys
2. Check webhook endpoint configuration
3. Ensure proper error handling
4. Verify payment flow implementation

---

## Getting Help

### When to Escalate

If you encounter issues not covered in this guide:

1. **Check the logs** for detailed error messages
2. **Search existing issues** in the project repository
3. **Create a new issue** with:
   - Detailed error description
   - Steps to reproduce
   - Environment information
   - Relevant logs

### Useful Commands

```bash
# Check service status
docker ps

# View service logs
docker logs <container-name>

# Check network connectivity
docker network ls

# Restart services
docker-compose restart

# Clean environment
npm run clean
docker-compose down -v
```

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Maintained by**: Development Team
