# Database Setup Guide for Bilten Project

## Overview
This guide will help you set up and run database services using Docker on Windows 11.

## Prerequisites
- Docker Desktop installed and running
- Windows 11 with WSL2 enabled

## Quick Start

### 1. Start All Database Services
```bash
docker-compose up -d
```

### 2. Start Specific Database Only
```bash
# PostgreSQL only
docker-compose up -d postgres

# MySQL only
docker-compose up -d mysql

# MongoDB only
docker-compose up -d mongodb

# Redis only
docker-compose up -d redis
```

## Database Connection Details

### PostgreSQL
- **Host**: localhost
- **Port**: 5432
- **Database**: bilten_db
- **Username**: bilten_user
- **Password**: bilten_password
- **Admin Tool**: http://localhost:5050 (pgAdmin)

### MySQL
- **Host**: localhost
- **Port**: 3306
- **Database**: bilten_db
- **Username**: bilten_user
- **Password**: bilten_password
- **Admin Tool**: http://localhost:8080 (phpMyAdmin)

### MongoDB
- **Host**: localhost
- **Port**: 27017
- **Database**: bilten_db
- **Username**: bilten_user
- **Password**: bilten_password

### Redis
- **Host**: localhost
- **Port**: 6379
- **No authentication required** (development setup)

## Admin Tools Access

### pgAdmin (PostgreSQL)
1. Open http://localhost:5050
2. Login with:
   - Email: admin@bilten.com
   - Password: admin_password
3. Add server connection:
   - Host: postgres (container name)
   - Port: 5432
   - Database: bilten_db
   - Username: bilten_user
   - Password: bilten_password

### phpMyAdmin (MySQL)
1. Open http://localhost:8080
2. Login with:
   - Username: bilten_user
   - Password: bilten_password

## Useful Commands

### Check Container Status
```bash
docker-compose ps
```

### View Logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs postgres
docker-compose logs mysql
```

### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: This will delete all data)
docker-compose down -v
```

### Backup Database
```bash
# PostgreSQL backup
docker exec bilten-postgres pg_dump -U bilten_user bilten_db > backup.sql

# MySQL backup
docker exec bilten-mysql mysqldump -u bilten_user -pbilten_password bilten_db > backup.sql
```

### Restore Database
```bash
# PostgreSQL restore
docker exec -i bilten-postgres psql -U bilten_user bilten_db < backup.sql

# MySQL restore
docker exec -i bilten-mysql mysql -u bilten_user -pbilten_password bilten_db < backup.sql
```

## Development Workflow

### 1. Start Development Environment
```bash
# Start all services
docker-compose up -d

# Start only what you need
docker-compose up -d postgres redis
```

### 2. Connect Your Application
Update your application's database configuration to use the connection details above.

### 3. Database Migrations
Place your migration files in the `database/init/` directory. They will be executed automatically when the container starts.

### 4. Stop Development Environment
```bash
docker-compose down
```

## Troubleshooting

### Port Already in Use
If you get port conflicts, you can modify the ports in `docker-compose.yml`:
```yaml
ports:
  - "5433:5432"  # Change 5432 to 5433
```

### Container Won't Start
1. Check if Docker Desktop is running
2. Check available disk space
3. View logs: `docker-compose logs [service-name]`

### Data Persistence
All data is stored in Docker volumes. To completely reset:
```bash
docker-compose down -v
docker-compose up -d
```

## Security Notes
- This setup is for development only
- Passwords are stored in plain text in docker-compose.yml
- For production, use environment variables and secrets management
- Consider using Docker secrets or external configuration management

## Next Steps
1. Start the services: `docker-compose up -d`
2. Access admin tools to verify connections
3. Update your application configuration
4. Run your application and test database connectivity
