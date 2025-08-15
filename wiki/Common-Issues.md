# 🚨 Common Issues & Troubleshooting

This guide helps you resolve common issues you might encounter while working with Bilten.

## 📋 Table of Contents

- [Installation Issues](#installation-issues)
- [Database Issues](#database-issues)
- [API Issues](#api-issues)
- [Frontend Issues](#frontend-issues)
- [Docker Issues](#docker-issues)
- [Performance Issues](#performance-issues)
- [Security Issues](#security-issues)

## 🔧 Installation Issues

### Node.js Version Issues

**Problem**: `Error: Node.js version 18+ is required`

**Solution**:
```bash
# Check current version
node --version

# Update Node.js using nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Or download from nodejs.org
# https://nodejs.org/en/download/
```

### Permission Issues

**Problem**: `EACCES: permission denied`

**Solution**:
```bash
# Fix npm permissions (Linux/macOS)
sudo chown -R $USER:$GROUP ~/.npm
sudo chown -R $USER:$GROUP ~/.config

# Or use nvm to avoid permission issues
nvm install 18
nvm use 18
```

### Port Already in Use

**Problem**: `Error: listen EADDRINUSE: address already in use :::3000`

**Solution**:
```bash
# Find process using the port
lsof -i :3000
lsof -i :3001
lsof -i :3002

# Kill the process
kill -9 <PID>

# Or use different ports
PORT=3003 npm start
```

## 🗄️ Database Issues

### PostgreSQL Connection Issues

**Problem**: `Connection to database failed`

**Solution**:
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Check connection
psql -h localhost -U bilten_user -d bilten_db

# Create database if it doesn't exist
createdb bilten_db
```

### Migration Errors

**Problem**: `Migration failed: table already exists`

**Solution**:
```bash
# Check migration status
npm run migrate:status

# Rollback migrations
npm run migrate:rollback

# Run migrations again
npm run migrate

# Or reset database
npm run migrate:reset
```

### Database Performance Issues

**Problem**: Slow queries or timeouts

**Solution**:
```sql
-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Add indexes for common queries
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_orders_user_id ON orders(user_id);
```

## 🔌 API Issues

### Authentication Errors

**Problem**: `401 Unauthorized` or `Token expired`

**Solution**:
```bash
# Check JWT secret in .env
echo $JWT_SECRET

# Regenerate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Update .env file
JWT_SECRET=your_new_secret_here
```

### CORS Issues

**Problem**: `CORS error: No 'Access-Control-Allow-Origin' header`

**Solution**:
```javascript
// Check CORS configuration in server.js
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

### Rate Limiting

**Problem**: `429 Too Many Requests`

**Solution**:
```bash
# Check rate limit configuration
# Increase limits in development
RATE_LIMIT_WINDOW=900000  # 15 minutes
RATE_LIMIT_MAX=10000      # 10,000 requests
```

## 🎨 Frontend Issues

### Build Errors

**Problem**: `Module not found` or build failures

**Solution**:
```bash
# Clear cache and reinstall
cd bilten-frontend
rm -rf node_modules package-lock.json
npm install

# Clear build cache
npm run build -- --force

# Check for missing dependencies
npm ls
```

### React Hooks Issues

**Problem**: `React Hook useEffect has a missing dependency`

**Solution**:
```javascript
// Add missing dependencies
useEffect(() => {
  fetchData();
}, [dependency1, dependency2]); // Add all dependencies

// Or use useCallback for functions
const fetchData = useCallback(() => {
  // fetch logic
}, [dependency1]);
```

### Styling Issues

**Problem**: Tailwind CSS not working

**Solution**:
```bash
# Rebuild CSS
cd bilten-frontend
npm run build:css

# Check Tailwind config
cat tailwind.config.js

# Clear browser cache
# Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
```

## 🐳 Docker Issues

### Container Won't Start

**Problem**: `Docker container exited with code 1`

**Solution**:
```bash
# Check container logs
docker-compose logs backend
docker-compose logs postgres
docker-compose logs redis

# Restart containers
docker-compose down
docker-compose up -d

# Check container status
docker-compose ps
```

### Volume Mount Issues

**Problem**: `Permission denied` on mounted volumes

**Solution**:
```bash
# Fix volume permissions
sudo chown -R $USER:$USER ./uploads
sudo chmod -R 755 ./uploads

# Or use Docker volumes instead of bind mounts
volumes:
  - postgres_data:/var/lib/postgresql/data
```

### Network Issues

**Problem**: Containers can't communicate

**Solution**:
```bash
# Check Docker network
docker network ls
docker network inspect bilten_default

# Recreate network
docker-compose down
docker network prune
docker-compose up -d
```

## ⚡ Performance Issues

### Slow API Responses

**Problem**: API endpoints taking too long to respond

**Solution**:
```javascript
// Add database indexes
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_location ON events(location);

// Implement caching
const cache = require('redis');
const cachedData = await cache.get('events');

// Optimize queries
// Use pagination
// Limit result sets
```

### Memory Leaks

**Problem**: Application memory usage increasing over time

**Solution**:
```javascript
// Check for memory leaks
const used = process.memoryUsage();
console.log(`Memory usage: ${Math.round(used.heapUsed / 1024 / 1024)} MB`);

// Clear intervals and timeouts
clearInterval(intervalId);
clearTimeout(timeoutId);

// Remove event listeners
element.removeEventListener('click', handler);
```

### Frontend Performance

**Problem**: Slow page loads or UI lag

**Solution**:
```javascript
// Implement code splitting
const LazyComponent = React.lazy(() => import('./LazyComponent'));

// Optimize images
<img src="image.jpg" loading="lazy" alt="description" />

// Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  // component logic
});
```

## 🔒 Security Issues

### Environment Variables

**Problem**: Sensitive data exposed in logs or errors

**Solution**:
```bash
# Check for exposed secrets
grep -r "password\|secret\|key" . --exclude-dir=node_modules

# Use environment variables
DATABASE_PASSWORD=process.env.DB_PASSWORD

# Validate environment variables
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required');
}
```

### SQL Injection Prevention

**Problem**: Potential SQL injection vulnerabilities

**Solution**:
```javascript
// Use parameterized queries
const user = await db('users')
  .where('email', email)
  .first();

// Never use string concatenation
// ❌ Bad
const query = `SELECT * FROM users WHERE email = '${email}'`;

// ✅ Good
const query = 'SELECT * FROM users WHERE email = ?';
```

### XSS Prevention

**Problem**: Cross-site scripting vulnerabilities

**Solution**:
```javascript
// Sanitize user input
const sanitizeHtml = require('sanitize-html');
const clean = sanitizeHtml(userInput);

// Use React's built-in XSS protection
// React automatically escapes content
<div>{userContent}</div>
```

## 🔍 Debugging Techniques

### Backend Debugging

```javascript
// Add debug logging
const debug = require('debug')('bilten:api');
debug('Processing request:', req.body);

// Use Node.js inspector
node --inspect server.js

// Add error boundaries
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
```

### Frontend Debugging

```javascript
// Use React DevTools
// Install browser extension

// Add error boundaries
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error('Error caught:', error, errorInfo);
  }
}

// Use browser dev tools
console.log('Debug info:', data);
debugger; // Breakpoint
```

### Database Debugging

```sql
-- Enable query logging
SET log_statement = 'all';
SET log_min_duration_statement = 1000;

-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
WHERE mean_time > 1000;
```

## 📞 Getting Help

### Before Asking for Help

1. **Check this guide** for your specific issue
2. **Search existing issues** on GitHub
3. **Check the logs** for error messages
4. **Try the solutions** listed above

### When Creating an Issue

Include the following information:

```markdown
## Environment
- OS: [e.g. Ubuntu 20.04]
- Node.js: [e.g. 18.15.0]
- Database: [e.g. PostgreSQL 15]
- Docker: [e.g. 20.10.0]

## Error Message
```
Exact error message here
```

## Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Logs
```
Relevant log output here
```
```

### Useful Commands

```bash
# Check system resources
htop
df -h
free -h

# Check network connectivity
ping localhost
curl http://localhost:3001/health

# Check process status
ps aux | grep node
ps aux | grep postgres

# Monitor logs in real-time
tail -f logs/app.log
docker-compose logs -f
```

## 🛠️ Maintenance

### Regular Maintenance Tasks

```bash
# Update dependencies
npm update
npm audit fix

# Clean up Docker
docker system prune
docker volume prune

# Database maintenance
npm run migrate
npm run seed

# Clear caches
npm cache clean --force
docker builder prune
```

### Backup and Recovery

```bash
# Database backup
pg_dump bilten_db > backup.sql

# Restore database
psql bilten_db < backup.sql

# File backup
tar -czf uploads-backup.tar.gz uploads/

# Restore files
tar -xzf uploads-backup.tar.gz
```

---

**Still having issues?** Create a detailed issue on GitHub with all the information above, and our community will help you resolve it!
