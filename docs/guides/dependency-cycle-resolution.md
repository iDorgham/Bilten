# Dependency Cycle Resolution Guide

## 🚨 Quick Fix

If you encounter the error: `dependency cycle detected: bilten-frontend -> bilten-gateway -> bilten-frontend`

**Immediate Solution:**
```bash
# Stop all services
npm run clean

# Install dependencies at root level
npm install

# Start services using workspace command
npm run dev
```

## 🔍 Understanding the Issue

### What is a Dependency Cycle?

A dependency cycle occurs when two or more services depend on each other in a circular manner, preventing them from starting properly.

### In Bilten's Case

The cycle was caused by:
1. **Startup Order**: Frontend starting before Gateway
2. **Workspace Issues**: Incomplete dependency installation
3. **TypeScript Errors**: Compilation failures in Gateway

## ✅ Correct Startup Order

```
Backend → Gateway → Frontend → Scanner
```

**Why this order matters:**
- **Backend** provides core API services
- **Gateway** routes API requests (depends on Backend)
- **Frontend** depends on Gateway for API routing
- **Scanner** is independent

## 🛠️ Solutions

### Solution 1: Use Workspace Commands (Recommended)

```bash
# Install all dependencies
npm install

# Start all services in correct order
npm run dev
```

### Solution 2: Individual Service Startup

```bash
# Start services in correct order
npm run dev:backend
npm run dev:gateway
npm run dev:frontend
npm run dev:scanner
```

### Solution 3: Fixed Launch Script

```bash
# Use the fixed launch script
.\launch-bilten-fixed.ps1
```

## 🔧 Prevention

### Best Practices

1. **Always use workspace commands**
   ```bash
   # ✅ Correct
   npm run dev
   
   # ❌ Avoid
   cd apps/bilten-frontend && npm start
   ```

2. **Install dependencies at root level**
   ```bash
   # ✅ Correct
   npm install
   
   # ❌ Avoid
   cd apps/bilten-frontend && npm install
   ```

3. **Follow the startup order**
   - Backend first
   - Gateway second
   - Frontend third
   - Scanner anytime

4. **Check for TypeScript errors**
   ```bash
   # Check for compilation errors
   npm run build:gateway
   ```

### Common Mistakes

1. **Starting Frontend before Gateway**
2. **Installing dependencies in individual apps**
3. **Ignoring TypeScript compilation errors**
4. **Using individual npm commands instead of workspace commands**

## 🚨 Emergency Procedures

### If Services Won't Start

1. **Clean everything**
   ```bash
   npm run clean
   docker-compose down -v
   ```

2. **Reinstall dependencies**
   ```bash
   npm install
   ```

3. **Start fresh**
   ```bash
   npm run dev
   ```

### If Database Issues Occur

1. **Check Docker containers**
   ```bash
   docker ps
   ```

2. **Restart database services**
   ```bash
   docker-compose up -d postgres redis-session redis-cache
   ```

3. **Wait for database to be ready**
   ```bash
   # Check database health
   docker exec bilten-postgres-primary pg_isready -U bilten_user -d bilten_primary
   ```

## 📋 Checklist

Before starting development:

- [ ] All dependencies installed (`npm install`)
- [ ] No TypeScript compilation errors
- [ ] Docker containers running
- [ ] Environment variables set
- [ ] Using workspace commands

## 🔍 Troubleshooting

### Error Messages and Solutions

| Error | Solution |
|-------|----------|
| `dependency cycle detected` | Use `npm run dev` from root |
| `MODULE_NOT_FOUND` | Run `npm install` at root |
| `TypeScript compilation failed` | Fix syntax errors in Gateway |
| `Database connection failed` | Start Docker containers first |
| `Service health check failed` | Check startup order |

### Debugging Steps

1. **Check service logs**
   ```bash
   npm run logs
   ```

2. **Check Docker status**
   ```bash
   docker ps
   ```

3. **Check network connectivity**
   ```bash
   docker network ls
   ```

4. **Verify environment**
   ```bash
   npm run health
   ```

## 📚 Related Documentation

- [Development Workflow Guide](./development-workflow.md)
- [Troubleshooting Guide](./troubleshooting.md)
- [Architecture Guide](../architecture/component-architecture.md)

## 🆘 Getting Help

If you still encounter issues:

1. **Check the logs** for detailed error messages
2. **Review this guide** for common solutions
3. **Search existing issues** in the repository
4. **Create a new issue** with:
   - Error message
   - Steps to reproduce
   - Environment information
   - Relevant logs

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Maintained by**: Development Team
