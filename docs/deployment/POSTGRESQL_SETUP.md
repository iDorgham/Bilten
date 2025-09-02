# PostgreSQL Setup Guide for Bilten Project

## ✅ Current Status

**PostgreSQL is successfully running!**

- **Database**: bilten_dev
- **Host**: localhost
- **Port**: 5432
- **Username**: bilten_user
- **Password**: bilten_password
- **Admin Tool**: http://localhost:5050 (pgAdmin)

## 🚀 Quick Start

### 1. Start PostgreSQL Services
```bash
# Start PostgreSQL and pgAdmin
docker-compose up -d postgres pgadmin

# Check status
docker-compose ps
```

### 2. Access Database
```bash
# Connect via command line
docker exec bilten-postgres psql -U bilten_user -d bilten_dev

# Or use pgAdmin web interface
# Open http://localhost:5050
```

## 📊 Database Schema

Your database already contains the following tables:

### Core Tables
- **users** - User accounts and authentication
- **events** - Event information
- **tickets** - Ticket management
- **orders** - Order processing
- **order_items** - Order line items
- **articles** - Content management

### System Tables
- **knex_migrations** - Database migrations
- **knex_migrations_lock** - Migration locking

## 🔗 Connection Details

### Application Connection String
```
postgresql://bilten_user:bilten_password@localhost:5432/bilten_dev
```

### Environment Variables
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bilten_dev
DB_USER=bilten_user
DB_PASSWORD=bilten_password
```

## 🛠️ Admin Tools

### pgAdmin Web Interface
1. **Access**: http://localhost:5050
2. **Login Credentials**:
   - Email: admin@bilten.com
   - Password: admin_password

3. **Add Server Connection**:
   - Name: Bilten PostgreSQL
   - Host: bilten-postgres (or localhost)
   - Port: 5432
   - Database: bilten_dev
   - Username: bilten_user
   - Password: bilten_password

### Command Line Access
```bash
# Connect to database
docker exec -it bilten-postgres psql -U bilten_user -d bilten_dev

# List tables
\dt

# Describe table structure
\d users

# Run SQL queries
SELECT * FROM users LIMIT 5;
```

## 📋 Useful Commands

### Database Management
```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs postgres

# Backup database
docker exec bilten-postgres pg_dump -U bilten_user bilten_dev > backup.sql

# Restore database
docker exec -i bilten-postgres psql -U bilten_user bilten_dev < backup.sql

# Stop services
docker-compose down
```

### Data Operations
```sql
-- Check user count
SELECT COUNT(*) FROM users;

-- View recent events
SELECT title, event_date FROM events ORDER BY event_date DESC LIMIT 5;

-- Check ticket status
SELECT status, COUNT(*) FROM tickets GROUP BY status;
```

## 🔧 Development Workflow

### 1. Start Development Environment
```bash
# Start PostgreSQL and related services
docker-compose up -d postgres pgadmin redis
```

### 2. Run Migrations
```bash
# If using Knex.js migrations
npm run migrate

# Or manually run SQL files
docker exec -i bilten-postgres psql -U bilten_user bilten_dev < migrations/001_initial.sql
```

### 3. Seed Data
```bash
# Run seeders
npm run seed

# Or manually insert data
docker exec -i bilten-postgres psql -U bilten_user bilten_dev < seeds/initial_data.sql
```

### 4. Monitor Database
```bash
# Watch logs
docker-compose logs -f postgres

# Check performance
docker exec bilten-postgres psql -U bilten_user -d bilten_dev -c "SELECT * FROM pg_stat_activity;"
```

## 🚨 Troubleshooting

### Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps

# Check logs for errors
docker-compose logs postgres

# Test connection
docker exec bilten-postgres pg_isready -U bilten_user
```

### Port Conflicts
If port 5432 is already in use:
```yaml
# Modify docker-compose.yml
ports:
  - "5433:5432"  # Change to different port
```

### Data Persistence
```bash
# Check volume data
docker volume ls | grep postgres

# Reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d postgres
```

## 🔒 Security Best Practices

### Development
- Use strong passwords
- Limit database access
- Regular backups
- Monitor logs

### Production
- Use environment variables for credentials
- Enable SSL connections
- Implement connection pooling
- Set up automated backups
- Use read-only replicas for reporting

## 📈 Performance Optimization

### Indexes
```sql
-- Add indexes for common queries
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_users_email ON users(email);
```

### Connection Pooling
```javascript
// Example with pg (Node.js)
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'bilten_dev',
  user: 'bilten_user',
  password: 'bilten_password',
  max: 20, // Maximum number of connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

## 🔄 Migration Strategy

### Using Knex.js
```bash
# Create migration
npx knex migrate:make add_new_table

# Run migrations
npx knex migrate:latest

# Rollback
npx knex migrate:rollback
```

### Manual SQL Migrations
```bash
# Create migration file
echo "-- Migration: Add new column" > migrations/002_add_column.sql

# Run migration
docker exec -i bilten-postgres psql -U bilten_user bilten_dev < migrations/002_add_column.sql
```

## 📊 Monitoring

### Health Checks
```bash
# Database health
docker exec bilten-postgres pg_isready -U bilten_user

# Connection count
docker exec bilten-postgres psql -U bilten_user -d bilten_dev -c "SELECT count(*) FROM pg_stat_activity;"
```

### Performance Monitoring
```sql
-- Slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## 🎯 Next Steps

1. **Update Application Configuration**
   - Set database connection string
   - Configure environment variables
   - Test connection

2. **Run Application**
   - Start your Bilten application
   - Test database operations
   - Verify data persistence

3. **Set Up Monitoring**
   - Configure logging
   - Set up performance monitoring
   - Implement backup strategy

4. **Team Setup**
   - Share connection details
   - Document setup process
   - Set up development guidelines
