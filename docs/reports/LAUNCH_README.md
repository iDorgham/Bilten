# 🚀 Bilten Launch Guide

## Quick Start

### Option 1: Quick Launch (Recommended)
```bash
# Windows PowerShell
.\quick-launch.ps1

# Windows Command Prompt
launch-bilten.bat

# Linux/Mac
./quick-launch.sh
```

### Option 2: Comprehensive Launch
```bash
# Windows PowerShell
.\launch-bilten.ps1

# With options
.\launch-bilten.ps1 -SkipHealthChecks
.\launch-bilten.ps1 -SkipMonitoring
.\launch-bilten.ps1 -SkipDatabase
```

## 📋 Prerequisites

Before launching, ensure you have:

- ✅ **Docker Desktop** installed and running
- ✅ **Docker Compose** available
- ✅ **Node.js** (v18 or higher) installed
- ✅ **Git** installed
- ✅ **PowerShell** (Windows) or **Bash** (Linux/Mac)

## 🏗️ What Gets Launched

### Database Infrastructure
- **PostgreSQL** (Primary & Replica)
- **Redis** (Session, Cache, Real-time)
- **ClickHouse** (Analytics)
- **Elasticsearch** (Search)
- **Zookeeper** (Coordination)

### Applications
- **Backend API** (Port 3001)
- **Frontend** (Port 3000)
- **API Gateway** (Port 3003)
- **Scanner App** (Port 3002)

### Monitoring & Tools
- **Prometheus** (Metrics)
- **Grafana** (Dashboards)
- **pgAdmin** (Database Admin)
- **phpMyAdmin** (MySQL Admin)

## 🌐 Access URLs

### Applications
| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Main web application |
| Backend API | http://localhost:3001 | REST API endpoints |
| API Gateway | http://localhost:3003 | API routing & auth |
| Scanner | http://localhost:3002 | QR code scanner app |

### Database Tools
| Tool | URL | Credentials |
|------|-----|-------------|
| pgAdmin | http://localhost:5050 | admin@bilten.com / admin_password |
| phpMyAdmin | http://localhost:8080 | bilten_user / bilten_password |

### Monitoring
| Service | URL | Description |
|---------|-----|-------------|
| Grafana | http://localhost:3000/grafana | Monitoring dashboards |
| Prometheus | http://localhost:9090 | Metrics collection |

## 🔧 Manual Launch Steps

If you prefer to launch manually:

### 1. Setup Environment
```bash
# Run environment setup
.\config\env\setup-env.ps1
```

### 2. Start Database Services
```bash
# Start all database services
docker-compose -f infrastructure/docker/docker-compose.yml up -d

# Or start specific services
docker-compose -f infrastructure/docker/docker-compose.yml up -d postgres redis-session redis-cache clickhouse elasticsearch
```

### 3. Start Applications
```bash
# Backend
cd apps/bilten-backend
npm install
npm run dev

# Frontend (new terminal)
cd apps/bilten-frontend
npm install
npm start

# Gateway (new terminal)
cd apps/bilten-gateway
npm install
npm run dev

# Scanner (new terminal)
cd apps/bilten-scanner
npm install
npm run dev
```

## 🧪 Health Checks

Verify all services are running:

```bash
# Check Docker containers
docker ps

# Check backend health
curl http://localhost:3001/health

# Check frontend
curl http://localhost:3000

# Check database
docker exec bilten-postgres-primary pg_isready -U bilten_user -d bilten_primary

# Check Redis
docker exec bilten-redis-session redis-cli ping
```

## 🚨 Troubleshooting

### Common Issues

#### Docker Not Running
```bash
# Start Docker Desktop
# On Windows: Start Docker Desktop application
# On Linux: sudo systemctl start docker
# On Mac: Start Docker Desktop application
```

#### Port Already in Use
```bash
# Check what's using the port
netstat -an | findstr :3001

# Kill process using port (Windows)
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Kill process using port (Linux/Mac)
lsof -i :3001
kill -9 <PID>
```

#### Database Connection Issues
```bash
# Check PostgreSQL logs
docker logs bilten-postgres-primary

# Restart database
docker-compose restart postgres

# Check database connection
docker exec bilten-postgres-primary psql -U bilten_user -d bilten_primary -c "SELECT 1;"
```

#### Application Startup Issues
```bash
# Check application logs
docker logs bilten-backend
docker logs bilten-frontend

# Check Node.js version
node --version

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Performance Issues

#### High Memory Usage
```bash
# Check container resource usage
docker stats

# Increase memory limits in docker-compose.yml
```

#### Slow Response Times
```bash
# Check database performance
docker exec bilten-postgres-primary psql -U bilten_user -d bilten_primary -c "SELECT * FROM pg_stat_activity;"

# Check Redis cache hit rates
docker exec bilten-redis-cache redis-cli info stats
```

## 📊 Monitoring & Logs

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f bilten-backend
docker-compose logs -f postgres

# Application logs
tail -f apps/bilten-backend/logs/app.log
```

### Monitor Performance
```bash
# Container stats
docker stats

# System resources
htop  # Linux/Mac
taskmgr  # Windows
```

## 🔄 Maintenance

### Daily Operations
```bash
# Check service status
docker ps

# Review logs
docker-compose logs --tail=100

# Monitor resource usage
docker stats
```

### Weekly Maintenance
```bash
# Update dependencies
npm update

# Clean up Docker
docker system prune -f

# Backup database
docker exec bilten-postgres-primary pg_dump -U bilten_user bilten_primary > backup.sql
```

## 🛑 Stopping Services

### Graceful Shutdown
```bash
# Stop all services
docker-compose down

# Stop specific services
docker-compose stop bilten-backend bilten-frontend

# Stop and remove volumes
docker-compose down -v
```

### Emergency Stop
```bash
# Force stop all containers
docker stop $(docker ps -q)

# Remove all containers
docker rm $(docker ps -aq)
```

## 📚 Additional Resources

### Documentation
- [API Documentation](docs/api/)
- [Architecture Guide](docs/architecture/)
- [Deployment Guide](docs/deployment/)
- [User Guide](docs/guides/)

### Launch Status
- [Launch Readiness Checklist](docs/deployment/LAUNCH_READINESS_CHECKLIST.md)
- [Launch Status Report](docs/deployment/LAUNCH_STATUS_REPORT.md)

### Support
- [Troubleshooting Guide](docs/troubleshooting/)
- [GitHub Issues](https://github.com/your-repo/issues)

## 🎯 Next Steps

After successful launch:

1. **Verify all services** are running and accessible
2. **Test core functionality** (user registration, event creation)
3. **Monitor performance** and resource usage
4. **Review logs** for any errors or warnings
5. **Configure monitoring alerts** if needed
6. **Set up backups** for production use

## 📞 Support

If you encounter issues:

1. Check the [troubleshooting section](#-troubleshooting) above
2. Review the [documentation](docs/)
3. Check [GitHub issues](https://github.com/your-repo/issues)
4. Contact the development team

---

**Happy Launching! 🚀**

*The Bilten team wishes you a successful deployment!*
