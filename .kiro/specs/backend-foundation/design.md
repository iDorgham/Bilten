# Backend Foundation Design

## Overview

The backend foundation provides the core infrastructure for the Bilten platform, including database architecture, API services, and file storage. This design ensures scalability, security, and maintainability while integrating seamlessly with the existing frontend.

## Architecture

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │  File Storage   │
                       │  (AWS S3/Local) │
                       └─────────────────┘
```

### Technology Stack

- **Backend Framework**: Node.js with Express.js
- **Database**: PostgreSQL with Knex.js query builder
- **Authentication**: JWT tokens with bcrypt password hashing
- **File Storage**: AWS S3 (production) / Local storage (development)
- **Validation**: Joi schema validation
- **Testing**: Jest with Supertest
- **Documentation**: Swagger/OpenAPI

## Components and Interfaces

### 1. Database Architecture

#### Core Entities

```sql
-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'user',
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events table
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    venue_name VARCHAR(255),
    venue_address TEXT,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    max_attendees INTEGER,
    is_free BOOLEAN DEFAULT FALSE,
    base_price DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'draft',
    cover_image_url VARCHAR(500),
    organizer_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tickets table
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id),
    type VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    quantity_available INTEGER,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    event_id INTEGER REFERENCES events(id),
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    payment_intent_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Database Configuration

```javascript
// knexfile.js
module.exports = {
  development: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'bilten_dev',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password'
    },
    migrations: {
      directory: './database/migrations'
    },
    seeds: {
      directory: './database/seeds'
    }
  }
};
```

### 2. Backend Services Foundation

#### API Structure

```
src/
├── controllers/        # Request handlers
├── middleware/         # Express middleware
├── models/            # Database models
├── routes/            # API routes
├── services/          # Business logic
├── utils/             # Utility functions
├── config/            # Configuration files
└── server.js          # Application entry point
```

#### Core Middleware Stack

```javascript
// server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined'));
```

#### Authentication System

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }
    req.user = user;
    next();
  });
};
```

### 3. File Storage Service

#### Storage Architecture

```javascript
// services/fileStorage.js
class FileStorageService {
  constructor() {
    this.storage = process.env.NODE_ENV === 'production' 
      ? new S3Storage() 
      : new LocalStorage();
  }

  async uploadFile(file, options = {}) {
    // Validate file
    this.validateFile(file);
    
    // Generate unique filename
    const filename = this.generateFilename(file);
    
    // Upload to storage
    const url = await this.storage.upload(file, filename, options);
    
    // Save metadata to database
    await this.saveFileMetadata({
      filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url
    });
    
    return { url, filename };
  }
}
```

#### File Validation

```javascript
// utils/fileValidation.js
const ALLOWED_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/webp'],
  documents: ['application/pdf', 'text/plain']
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const validateFile = (file) => {
  if (!file) {
    throw new Error('No file provided');
  }
  
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds limit');
  }
  
  const allowedTypes = [...ALLOWED_TYPES.images, ...ALLOWED_TYPES.documents];
  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error('File type not allowed');
  }
};
```

## Data Models

### User Model

```javascript
// models/User.js
class User {
  static async create(userData) {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    const [user] = await knex('users')
      .insert({
        ...userData,
        password_hash: hashedPassword
      })
      .returning('*');
      
    delete user.password_hash;
    return user;
  }
  
  static async authenticate(email, password) {
    const user = await knex('users')
      .where({ email })
      .first();
      
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return null;
    
    delete user.password_hash;
    return user;
  }
}
```

### Event Model

```javascript
// models/Event.js
class Event {
  static async findAll(filters = {}) {
    let query = knex('events')
      .select('events.*', 'users.first_name as organizer_first_name', 'users.last_name as organizer_last_name')
      .leftJoin('users', 'events.organizer_id', 'users.id')
      .where('events.status', 'published');
      
    if (filters.category) {
      query = query.where('events.category', filters.category);
    }
    
    if (filters.search) {
      query = query.where(function() {
        this.where('events.title', 'ilike', `%${filters.search}%`)
            .orWhere('events.description', 'ilike', `%${filters.search}%`);
      });
    }
    
    return query;
  }
}
```

## Error Handling

### Global Error Handler

```javascript
// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.details
    });
  }
  
  // Database errors
  if (err.code === '23505') { // Unique constraint violation
    return res.status(409).json({
      success: false,
      message: 'Resource already exists'
    });
  }
  
  // Default error
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
};
```

## Testing Strategy

### Test Structure

```
tests/
├── unit/              # Unit tests for models and services
├── integration/       # API endpoint tests
├── fixtures/          # Test data
└── helpers/           # Test utilities
```

### Example Test

```javascript
// tests/integration/auth.test.js
describe('Authentication API', () => {
  beforeEach(async () => {
    await knex.migrate.rollback();
    await knex.migrate.latest();
    await knex.seed.run();
  });
  
  describe('POST /auth/login', () => {
    it('should authenticate valid user', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
        
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });
  });
});
```