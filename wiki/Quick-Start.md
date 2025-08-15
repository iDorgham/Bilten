# ⚡ Quick Start Guide

Get up and running with Bilten in under 10 minutes! This guide will help you set up the development environment and run your first event.

## 🎯 What You'll Learn

- Set up the development environment
- Start all services
- Create your first event
- Test the complete flow

## 🚀 Prerequisites

Make sure you have the following installed:
- Node.js 18+ and npm
- Git
- Docker and Docker Compose (optional but recommended)

## 📦 Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/iDorgham/Bilten.git
cd Bilten

# Install dependencies
npm install
cd bilten-frontend && npm install && cd ..
cd bilten-scanner && npm install && cd ..
```

## ⚙️ Step 2: Environment Setup

```bash
# Copy environment files
cp .env.example .env
cp bilten-frontend/.env.example bilten-frontend/.env
cp bilten-scanner/.env.example bilten-scanner/.env
```

Edit `.env` with minimal configuration:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bilten_db
DB_USER=bilten_user
DB_PASSWORD=password123

# JWT
JWT_SECRET=your_secret_key_here

# Frontend URL
FRONTEND_URL=http://localhost:3000

# API Base URL
API_BASE_URL=http://localhost:3001/v1
```

## 🐳 Step 3: Start Services

### Option A: Using Docker (Recommended)

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Run database setup
npm run migrate
npm run seed
```

### Option B: Manual Setup

If you have PostgreSQL and Redis installed locally:
```bash
# Create database
createdb bilten_db

# Run migrations and seed
npm run migrate
npm run seed
```

## 🚀 Step 4: Start Applications

```bash
# Terminal 1: Start backend API
npm run dev

# Terminal 2: Start frontend
cd bilten-frontend && npm start

# Terminal 3: Start scanner app (optional)
cd bilten-scanner && npm run dev
```

## ✅ Step 5: Verify Installation

1. **Backend API**: http://localhost:3001/health
2. **Frontend**: http://localhost:3000
3. **Scanner**: http://localhost:3002

You should see the Bilten homepage with a welcome message.

## 🎪 Step 6: Create Your First Event

### 1. Register as an Organizer

1. Go to http://localhost:3000
2. Click "Sign Up"
3. Fill in your details and select "Organizer" role
4. Verify your email (check console logs for verification link)

### 2. Create an Event

1. Login with your organizer account
2. Navigate to "Create Event"
3. Fill in event details:
   - **Title**: "My First Event"
   - **Description**: "A test event to learn Bilten"
   - **Category**: "Technology"
   - **Location**: "Cairo, Egypt"
   - **Date**: Tomorrow's date
   - **Ticket Price**: $25
   - **Available Tickets**: 50

4. Click "Create Event"

### 3. Test the Complete Flow

1. **Register as Attendee**: Create a new account with "Attendee" role
2. **Browse Events**: Find your created event
3. **Purchase Ticket**: Add to cart and complete checkout
4. **View Ticket**: Check your ticket in "My Tickets"
5. **Test Scanner**: Use the scanner app to validate the ticket

## 🧪 Step 7: Test Key Features

### Authentication
```bash
# Test API health
curl http://localhost:3001/health

# Test user registration
curl -X POST http://localhost:3001/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User",
    "role": "attendee"
  }'
```

### Event Management
```bash
# List events
curl http://localhost:3001/v1/events

# Get specific event
curl http://localhost:3001/v1/events/1
```

## 📱 Step 8: Test Mobile Features

### QR Scanner App
1. Open http://localhost:3002 on your mobile device
2. Allow camera permissions
3. Scan a ticket QR code
4. Verify ticket validation

### Responsive Design
1. Open http://localhost:3000 on mobile
2. Test navigation and event browsing
3. Verify checkout flow works on mobile

## 🔧 Step 9: Development Workflow

### Making Changes
```bash
# Backend changes auto-reload
# Frontend changes auto-reload
# Database changes require migration
npm run migrate:make create_new_table
```

### Running Tests
```bash
# Backend tests
npm test

# Frontend tests
cd bilten-frontend && npm test

# E2E tests
npm run test:e2e
```

### Database Management
```bash
# Create new migration
npm run migrate:make add_user_profile

# Run migrations
npm run migrate

# Rollback migration
npm run migrate:rollback

# Seed database
npm run seed
```

## 🚨 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Check what's using the port
lsof -i :3000
lsof -i :3001
lsof -i :3002

# Kill the process
kill -9 <PID>
```

#### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps

# Restart services
docker-compose restart postgres redis
```

#### Frontend Build Issues
```bash
# Clear cache
cd bilten-frontend
rm -rf node_modules package-lock.json
npm install
```

### Getting Help

1. Check the [Common Issues](Common-Issues) page
2. Search [GitHub Issues](https://github.com/iDorgham/Bilten/issues)
3. Join [Discussions](https://github.com/iDorgham/Bilten/discussions)

## 📚 Next Steps

Now that you have Bilten running, explore these areas:

1. **API Documentation**: Learn about all available endpoints
2. **Frontend Development**: Customize the UI and add features
3. **Database Schema**: Understand the data structure
4. **Testing**: Write tests for your features
5. **Deployment**: Deploy to production

## 🎉 Congratulations!

You've successfully set up Bilten and created your first event! You now have a fully functional event management platform running locally.

### What's Next?

- [Installation Guide](Installation-Guide) - Detailed setup instructions
- [API Documentation](API-Documentation) - Complete API reference
- [Development Guide](Development-Guide) - Development workflows
- [Testing Guide](Testing-Guide) - Writing and running tests

---

**Need help?** Don't hesitate to reach out to our community or create an issue on GitHub!
