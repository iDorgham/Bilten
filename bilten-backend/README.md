# 🚀 Bilten Backend API

## Overview
This is the backend API for the Bilten Event Management Platform. It provides authentication, event management, ticket handling, and user management functionality.

## 🛠️ Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bilten_dev
DB_USER=bilten_user
DB_PASSWORD=bilten_password
DATABASE_URL=postgresql://bilten_user:bilten_password@localhost:5432/bilten_dev

# JWT Configuration
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging Configuration
LOG_LEVEL=debug
```

### 3. Start the Server

#### Development Mode
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

## 📡 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/me` - Get current user

### Events
- `GET /api/v1/events` - Get all events
- `GET /api/v1/events/:id` - Get event by ID
- `POST /api/v1/events` - Create new event

### Tickets
- `GET /api/v1/tickets/event/:eventId` - Get tickets for an event
- `GET /api/v1/tickets/my-tickets` - Get user's tickets
- `GET /api/v1/tickets/:id` - Get ticket details

### Users
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile

## 🔐 Test Accounts

The backend includes pre-configured test accounts:

- **Admin:** `admin@bilten.com` / `admin123`
- **User:** `user@bilten.com` / `user123`
- **Organizer:** `organizer@bilten.com` / `organizer123`

## 🏗️ Project Structure

```
src/
├── server.js          # Main server file
├── routes/            # API routes
│   ├── index.js       # Route index
│   ├── auth.js        # Authentication routes
│   ├── events.js      # Event routes
│   ├── tickets.js     # Ticket routes
│   └── users.js       # User routes
├── services/          # Business logic
├── utils/             # Utility functions
└── middleware/        # Custom middleware
```

## 🔧 Development

### Available Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests

### Health Check
Visit `http://localhost:3001/health` to check if the server is running.

## 🔒 Security Features

- **Helmet.js** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - Request throttling
- **Input Validation** - Request validation
- **JWT Authentication** - Token-based auth
- **Password Hashing** - Bcrypt encryption

## 📊 Database

Currently using in-memory mock data. To connect to PostgreSQL:

1. Ensure PostgreSQL is running
2. Update database configuration in `.env`
3. Run database migrations (to be implemented)

## 🚀 Deployment

### Prerequisites
- Node.js 18+
- PostgreSQL (for production)
- Environment variables configured

### Production Setup
1. Set `NODE_ENV=production`
2. Configure production database
3. Set secure JWT secret
4. Configure CORS for production domain
5. Set up reverse proxy (nginx recommended)

## 📝 API Documentation

### Authentication Response Format
```json
{
  "data": {
    "user": {
      "id": 1,
      "email": "user@bilten.com",
      "first_name": "Regular",
      "last_name": "User",
      "role": "user",
      "is_verified": true
    },
    "token": "jwt-token-here"
  },
  "message": "Login successful"
}
```

### Error Response Format
```json
{
  "error": "Error Type",
  "message": "Human readable error message"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details
