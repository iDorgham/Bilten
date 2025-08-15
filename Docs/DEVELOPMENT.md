# Bilten Development Guide

## Quick Start

### Option 1: Docker Development (Recommended)
```bash
# Start all services in Docker
docker-compose up -d

# Run migrations and seeds
docker exec -it bilten-api npm run db:migrate
docker exec -it bilten-api npm run db:seed

# Start local development server
npm run dev
```

### Option 2: Local Development
```bash
# Start only database services
docker-compose up -d postgres redis

# Run migrations using Docker
docker exec -it bilten-api npm run db:migrate

# Start local development
npm run dev
```

## Database Connection

The database is configured to run in Docker for consistency. For local development:

1. **Docker Environment**: Uses `postgres` as host (internal Docker network)
2. **Local Environment**: Uses `localhost` as host (external connection)

### Database Credentials
- **Host**: localhost (local) or postgres (Docker)
- **Port**: 5432
- **Database**: bilten_dev
- **User**: bilten_user
- **Password**: bilten_password

## API Endpoints

- **Health Check**: http://localhost:3001/health
- **API Base**: http://localhost:3001/v1
- **Events**: http://localhost:3001/v1/events
- **Articles**: http://localhost:3001/v1/articles

## Troubleshooting

### Database Connection Issues
If you encounter database connection errors:

1. Ensure Docker containers are running:
   ```bash
   docker-compose ps
   ```

2. Check database health:
   ```bash
   docker exec -it bilten-postgres pg_isready -U bilten_user -d bilten_dev
   ```

3. Reset database if needed:
   ```bash
   docker-compose down postgres
   docker volume rm bilten_postgres_data
   docker-compose up -d postgres
   ```

### Port Conflicts
If port 3001 is already in use:
```bash
# Kill existing Node processes
taskkill /F /IM node.exe

# Or use a different port
PORT=3002 npm run dev
```

## Development Workflow

1. **Start Services**: `docker-compose up -d postgres redis`
2. **Run Migrations**: `docker exec -it bilten-api npm run db:migrate`
3. **Seed Data**: `docker exec -it bilten-api npm run db:seed`
4. **Start Development**: `npm run dev`
5. **Test API**: Visit http://localhost:3001/health

## Frontend Development

### Page Organization
The frontend pages are organized into logical folders for better maintainability:

```
src/pages/
├── auth/          # Authentication pages
├── admin/         # Admin dashboard
├── events/        # Event-related pages
├── user/          # User profile & settings
├── orders/        # Order management
├── analytics/     # Analytics & reporting
├── legal/         # Legal pages
├── company/       # Company information
├── help/          # Help & support
├── news/          # News & articles
├── recommendations/ # Recommendations
├── errors/        # Error pages
└── Home.js        # Main landing page
```

### Adding New Pages
1. **Choose the right folder** based on functionality
2. **Update the index.js** file in the folder
3. **Add to App.js imports** in the appropriate group
4. **Add the route** in App.js

Example:
```javascript
// 1. Create the page in the right folder
// src/pages/user/NewProfile.js

// 2. Update index.js
// src/pages/user/index.js
export { default as NewProfile } from './NewProfile';

// 3. Update App.js imports
import { Profile, Settings, NewProfile } from './pages/user';

// 4. Add route
<Route path="/new-profile" element={<NewProfile />} />
```

For detailed guidelines, see `FRONTEND_PAGE_ORGANIZATION.md`.

### Frontend Development Commands
```bash
# Start frontend development server
cd bilten-frontend
npm start

# Build for production
npm run build

# Run tests
npm test

# Check for linting issues
npm run lint
```

## Environment Variables

Create a `.env` file with:
```env
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bilten_dev
DB_USER=bilten_user
DB_PASSWORD=bilten_password
JWT_SECRET=your-secret-key
```
