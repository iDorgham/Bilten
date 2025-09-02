# Backend Development Tools

This directory contains development and maintenance tools for the Bilten backend service.

## Database Tools

### Schema Management
- **`check-existing-schema.js`** - Checks the current database schema
- **`enhance-existing-schema.js`** - Enhances existing database schema
- **`fix-migrations-table.js`** - Fixes migration table issues
- **`run-auth-migration.js`** - Runs authentication-related migrations

### Database Testing
- **`check-db.js`** - Database connection and health check
- **`test-db-connection.js`** - Tests database connectivity
- **`test-migration.js`** - Tests database migrations

## System Tools

### Setup and Configuration
- **`setup-system.js`** - System setup and initialization
- **`generate-hash.js`** - Password hash generation utility

### Media and Upload Testing
- **`demo-media-upload.js`** - Demonstrates media upload functionality

## Usage

### Running Database Tools
```bash
# From the backend directory (apps/bilten-backend)
node tools/check-db.js
node tools/test-db-connection.js
node tools/setup-system.js
```

### Running Schema Tools
```bash
# Check current schema
node tools/check-existing-schema.js

# Run migrations
node tools/run-auth-migration.js
node tools/test-migration.js
```

### Utility Tools
```bash
# Generate password hash
node tools/generate-hash.js

# Test media upload
node tools/demo-media-upload.js
```

## Environment Requirements

These tools require the following environment variables to be set:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT secret key

## Security Note

⚠️ **Warning**: These tools are for development and maintenance purposes only. They should not be used in production environments without proper review and testing.

---

*These tools are maintained by the backend development team and are updated as needed for development and maintenance tasks.*