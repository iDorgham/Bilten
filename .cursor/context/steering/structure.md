# Project Structure

## Root Directory
```
bilten-platform/
├── src/                 # Application source code
├── database/            # Database migrations and seeds
├── tests/               # Test files
├── docs/                # Documentation
├── .kiro/               # Kiro IDE configuration
├── node_modules/        # Dependencies (auto-generated)
├── package.json         # Project dependencies and scripts
├── knexfile.js         # Database configuration
├── docker-compose.yml   # Docker services configuration
├── Dockerfile          # Container build instructions
├── .env.example        # Environment variables template
└── README.md           # Project documentation
```

## Source Code Organization (`src/`)
```
src/
├── routes/             # API route handlers (Express routers)
├── models/             # Database models and schemas
├── middleware/         # Express middleware functions
├── services/           # Business logic and external integrations
├── utils/              # Utility functions and helpers
└── server.js           # Application entry point
```

## Database Structure (`database/`)
```
database/
├── migrations/         # Knex.js database migrations
├── seeds/             # Database seed files for development
└── init/              # Docker initialization scripts
```

## API Route Organization
- Routes are organized by resource (auth, users, events, etc.)
- Each route file exports an Express router
- Routes are mounted under versioned API prefix (`/v1/`)
- Main route index file combines all route modules

## File Naming Conventions
- Use kebab-case for directories and files
- Route files named after the resource (e.g., `users.js`, `events.js`)
- Model files should match database table names
- Service files named after their primary function
- Utility files should be descriptive of their purpose

## Configuration Files
- **knexfile.js** - Database configuration for all environments
- **docker-compose.yml** - Local development services
- **.env.example** - Template for environment variables
- **package.json** - Dependencies, scripts, and project metadata

## Development Patterns
- Environment-specific configuration through `.env` files
- Database migrations for schema changes
- Seed files for development data
- Modular route organization
- Separation of concerns (routes → services → models)
- Consistent error handling across all endpoints