# Alternative Database Setup Guide for Windows 11

## Overview
Since Docker Desktop is experiencing quota issues, here are alternative ways to set up databases on Windows 11.

## Option 1: Standalone Database Installations

### MySQL (Already Installed)
MySQL 8.4.6 has been installed via winget.

**Next Steps:**
1. **Start MySQL Service:**
   ```powershell
   # Start MySQL service
   net start mysql80
   
   # Or use Services app (services.msc) and start "MySQL80"
   ```

2. **Set Root Password:**
   ```powershell
   # Connect to MySQL as root
   mysql -u root
   
   # Set password (run in MySQL prompt)
   ALTER USER 'root'@'localhost' IDENTIFIED BY 'your_password';
   FLUSH PRIVILEGES;
   EXIT;
   ```

3. **Create Database and User:**
   ```sql
   CREATE DATABASE bilten_db;
   CREATE USER 'bilten_user'@'localhost' IDENTIFIED BY 'bilten_password';
   GRANT ALL PRIVILEGES ON bilten_db.* TO 'bilten_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

### PostgreSQL Installation
```powershell
# Download PostgreSQL installer
winget install PostgreSQL.PostgreSQL

# Or download from: https://www.postgresql.org/download/windows/
```

### MongoDB Installation
```powershell
# Install MongoDB Community Edition
winget install MongoDB.Server

# Or download from: https://www.mongodb.com/try/download/community
```

## Option 2: Fix Docker Desktop Issues

### Check Docker Desktop Status
1. Open Docker Desktop application
2. Check if it's running properly
3. Look for any error messages

### Reset Docker Desktop
```powershell
# Stop Docker Desktop
# Go to Docker Desktop settings
# Reset to factory defaults
# Restart Docker Desktop
```

### Alternative Docker Installation
If Docker Desktop continues to have issues:

1. **Install Docker Engine directly:**
   ```powershell
   # Install Docker Engine for Windows
   # Download from: https://docs.docker.com/engine/install/
   ```

2. **Use WSL2 with Docker Engine:**
   ```powershell
   # Enable WSL2
   wsl --install
   
   # Install Docker Engine in WSL2
   # Follow Linux installation instructions
   ```

## Option 3: Cloud Database Services

### Free Tier Options:
1. **MongoDB Atlas** - Free 512MB cluster
2. **PlanetScale** - Free MySQL database
3. **Supabase** - Free PostgreSQL database
4. **Railway** - Free database hosting

### Setup Steps:
1. Create account on chosen platform
2. Create new database
3. Get connection string
4. Update application configuration

## Option 4: SQLite (Lightweight Option)

For development, SQLite is a great lightweight option:

```powershell
# SQLite is usually pre-installed on Windows
# Or install via winget
winget install SQLite.SQLite
```

**Usage:**
```sql
-- Create database file
sqlite3 bilten.db

-- Create tables
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Recommended Setup for Bilten Project

### For Development:
1. **Use MySQL** (already installed)
2. **Add SQLite** for lightweight development
3. **Consider cloud database** for team collaboration

### For Production:
1. **Use cloud database service**
2. **Set up proper backup and monitoring**
3. **Implement connection pooling**

## Connection Details

### MySQL (Local Installation)
- **Host**: localhost
- **Port**: 3306
- **Database**: bilten_db
- **Username**: bilten_user
- **Password**: bilten_password

### SQLite (Local File)
- **File**: bilten.db
- **No server required**
- **Perfect for development**

## Next Steps

1. **Start MySQL service**
2. **Set up database and user**
3. **Test connection**
4. **Update application configuration**
5. **Run database migrations**

## Troubleshooting

### MySQL Issues:
```powershell
# Check if MySQL service is running
sc query mysql80

# Start MySQL service
net start mysql80

# Check MySQL logs
# Usually in: C:\ProgramData\MySQL\MySQL Server 8.0\Data\
```

### Connection Issues:
1. Check if service is running
2. Verify port is not blocked by firewall
3. Check credentials
4. Ensure database exists

### Performance Issues:
1. Monitor resource usage
2. Optimize queries
3. Consider indexing
4. Use connection pooling

## Security Best Practices

1. **Use strong passwords**
2. **Limit database access**
3. **Regular backups**
4. **Keep software updated**
5. **Use environment variables for credentials**
6. **Enable SSL connections in production**
