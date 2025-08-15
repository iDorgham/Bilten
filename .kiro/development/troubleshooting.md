# Troubleshooting Guide

Common issues and solutions for EventChain development.

## Environment Setup Issues

### Docker Issues

**Problem**: Docker containers won't start
```bash
Error: Cannot connect to the Docker daemon
```

**Solutions**:
1. Ensure Docker Desktop is running
2. Check Docker daemon status: `docker info`
3. Restart Docker service
4. On Windows: Ensure WSL2 is properly configured

**Problem**: Port conflicts
```bash
Error: Port 3000 is already in use
```

**Solutions**:
1. Find process using port: `netstat -ano | findstr :3000`
2. Kill process: `taskkill /PID <process_id> /F`
3. Change port in docker-compose.yml
4. Use different port mapping

### Database Connection Issues

**Problem**: Cannot connect to PostgreSQL
```bash
Error: Connection refused on port 5432
```

**Solutions**:
1. Verify database container is running: `docker ps`
2. Check database logs: `docker logs eventchain-db`
3. Verify connection string in .env file
4. Ensure database is initialized: `docker-compose exec db psql -U postgres -l`

**Problem**: Database schema not found
```bash
Error: relation "events" does not exist
```

**Solutions**:
1. Run migrations: `npm run db:migrate`
2. Seed database: `npm run db:seed`
3. Check migration files in database/ directory
4. Verify database connection and permissions

## Frontend Issues

### Next.js Development Issues

**Problem**: Module not found errors
```bash
Error: Cannot resolve module '@/components/EventCard'
```

**Solutions**:
1. Check file path and casing
2. Verify tsconfig.json path mapping
3. Restart development server
4. Clear Next.js cache: `rm -rf .next`

**Problem**: Hydration mismatches
```bash
Warning: Text content did not match
```

**Solutions**:
1. Ensure server and client render same content
2. Use useEffect for client-only code
3. Check for date/time formatting differences
4. Verify conditional rendering logic

### API Integration Issues

**Problem**: CORS errors in browser
```bash
Error: Access to fetch blocked by CORS policy
```

**Solutions**:
1. Configure CORS in api-gateway
2. Check API_URL in frontend environment
3. Ensure proper headers in requests
4. Use proxy configuration in next.config.js

**Problem**: API requests failing
```bash
Error: Failed to fetch
```

**Solutions**:
1. Verify API gateway is running
2. Check network connectivity
3. Validate request format and headers
4. Check browser developer tools for details

## Backend Service Issues

### API Gateway Issues

**Problem**: Service discovery failures
```bash
Error: Service 'event-service' not found
```

**Solutions**:
1. Verify all services are running
2. Check service registration
3. Validate service URLs in configuration
4. Check Docker network connectivity

**Problem**: Authentication errors
```bash
Error: Invalid JWT token
```

**Solutions**:
1. Check JWT_SECRET in environment
2. Verify token expiration
3. Validate token format
4. Check authentication middleware

### Microservice Issues

**Problem**: Service won't start
```bash
Error: EADDRINUSE: address already in use
```

**Solutions**:
1. Check for port conflicts
2. Kill existing processes
3. Use different port configuration
4. Restart Docker containers

**Problem**: Database connection in services
```bash
Error: Connection pool exhausted
```

**Solutions**:
1. Check database connection limits
2. Verify connection pool configuration
3. Look for connection leaks
4. Monitor database performance

## Testing Issues

### Test Failures

**Problem**: Tests timing out
```bash
Error: Timeout - Async callback was not invoked
```

**Solutions**:
1. Increase timeout in test configuration
2. Check for unresolved promises
3. Verify async/await usage
4. Mock external dependencies

**Problem**: Database tests failing
```bash
Error: Database connection refused
```

**Solutions**:
1. Start test database: `docker-compose -f docker-compose.test.yml up -d`
2. Run test migrations
3. Check test environment variables
4. Verify test database isolation

### Mock Issues

**Problem**: Mocks not working
```bash
Error: Mock function not called
```

**Solutions**:
1. Verify mock setup before test execution
2. Check mock import paths
3. Clear mocks between tests
4. Use proper Jest mock syntax

## Performance Issues

### Slow Development Server

**Problem**: Hot reload taking too long

**Solutions**:
1. Exclude node_modules from file watching
2. Optimize webpack configuration
3. Use faster file system (SSD)
4. Reduce bundle size

### Database Performance

**Problem**: Slow queries

**Solutions**:
1. Add database indexes
2. Optimize query structure
3. Use connection pooling
4. Monitor query execution plans

## Deployment Issues

### Build Failures

**Problem**: TypeScript compilation errors
```bash
Error: Type 'string' is not assignable to type 'number'
```

**Solutions**:
1. Fix type definitions
2. Update TypeScript configuration
3. Check for missing dependencies
4. Verify import statements

**Problem**: Missing environment variables
```bash
Error: Environment variable API_URL is not defined
```

**Solutions**:
1. Copy .env.example to .env
2. Set all required variables
3. Check environment-specific configurations
4. Verify variable names and values

## Debugging Tools

### Logging
- Use structured logging with Winston
- Check Docker container logs
- Enable debug mode for detailed output
- Use log levels appropriately

### Monitoring
- Check application metrics
- Monitor database performance
- Use browser developer tools
- Review error tracking systems

### Development Tools
- Use debugger breakpoints
- Enable verbose logging
- Use network inspection tools
- Check memory usage

## Getting Help

### Internal Resources
1. Check existing documentation
2. Review similar issues in Git history
3. Ask team members
4. Check project README files

### External Resources
1. Framework documentation
2. Stack Overflow
3. GitHub issues for dependencies
4. Community forums

### Escalation Process
1. Document the issue thoroughly
2. Include reproduction steps
3. Provide environment details
4. Contact team leads or maintainers