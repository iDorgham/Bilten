# Development Utilities

This directory contains various development and debugging utilities used during the development of the Bilten platform.

## Files

### Password Utilities
- **`simple-password.js`** - Simple password hashing utility for testing
- **`fix-password.js`** - Password fixing utility for development
- **`fix-passwords.sql`** - SQL script for password-related database fixes

### Development Notes
- **`CLAUDE.md`** - Development notes and AI assistant interactions

## Usage

These utilities are for development purposes only and should not be used in production environments.

### Running Password Utilities
```bash
# From the root directory
node tools/dev-utilities/simple-password.js
node tools/dev-utilities/fix-password.js
```

### SQL Scripts
```bash
# Execute SQL scripts using psql or your preferred database client
psql -d bilten_dev -f tools/dev-utilities/fix-passwords.sql
```

## Security Note

⚠️ **Warning**: These utilities may contain sensitive information or debugging code. They should never be deployed to production environments.

---

*These utilities are maintained for development purposes and may be removed or updated as needed.*