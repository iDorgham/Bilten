# API Architecture

## 🎯 Overview

This document describes the API architecture of the Bilten platform, including RESTful API design, GraphQL integration, authentication patterns, and API versioning strategies.

## 🏗️ API Design Principles

### 1. **RESTful Design**
- Use HTTP methods appropriately (GET, POST, PUT, DELETE)
- Resource-based URLs
- Stateless operations
- Consistent response formats
- Proper HTTP status codes

### 2. **GraphQL Integration**
- Complex data queries
- Real-time subscriptions
- Flexible data fetching
- Type-safe operations

## 📡 API Endpoints

### Authentication Endpoints
```
POST   /api/v1/auth/login
POST   /api/v1/auth/register
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
```

### Event Management Endpoints
```
GET    /api/v1/events
POST   /api/v1/events
GET    /api/v1/events/:id
PUT    /api/v1/events/:id
DELETE /api/v1/events/:id
GET    /api/v1/events/:id/tickets
POST   /api/v1/events/:id/tickets
```

### User Management Endpoints
```
GET    /api/v1/users
POST   /api/v1/users
GET    /api/v1/users/:id
PUT    /api/v1/users/:id
DELETE /api/v1/users/:id
GET    /api/v1/users/:id/events
GET    /api/v1/users/:id/tickets
```

### Ticket Management Endpoints
```
GET    /api/v1/tickets
POST   /api/v1/tickets
GET    /api/v1/tickets/:id
PUT    /api/v1/tickets/:id
DELETE /api/v1/tickets/:id
POST   /api/v1/tickets/:id/validate
POST   /api/v1/tickets/:id/check-in
```

## 🔐 Authentication & Authorization

### JWT Token Strategy
```typescript
// JWT token structure
interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  permissions: string[];
  iat: number;
  exp: number;
}

// Token generation
const generateTokens = (user: User) => {
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
};
```

### Role-Based Access Control
```typescript
// Permission middleware
const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userPermissions = req.user?.permissions || [];
    
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: permission,
        granted: userPermissions
      });
    }
    
    next();
  };
};

// Usage
router.post('/events', 
  authenticate, 
  requirePermission('events:create'),
  createEvent
);
```

## 📊 Response Formats

### Standard Response Structure
```typescript
// Success response
interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
  requestId: string;
}

// Error response
interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  requestId: string;
}
```

### Pagination
```typescript
// Paginated response
interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

## 🔄 API Versioning

### URL Versioning Strategy
```
/api/v1/events
/api/v2/events
```

### Version Management
```typescript
// Version middleware
const apiVersion = (req: Request, res: Response, next: NextFunction) => {
  const version = req.path.split('/')[2] || 'v1';
  req.apiVersion = version;
  next();
};

// Route handlers by version
const eventRoutes = {
  v1: (router: Router) => {
    router.get('/events', getEventsV1);
    router.post('/events', createEventV1);
  },
  v2: (router: Router) => {
    router.get('/events', getEventsV2);
    router.post('/events', createEventV2);
  }
};
```

## 🚀 GraphQL Integration

### Schema Definition
```graphql
type Event {
  id: ID!
  title: String!
  description: String
  startDate: DateTime!
  endDate: DateTime!
  organizer: User!
  venue: Venue
  ticketTypes: [TicketType!]!
  tickets: [Ticket!]!
  analytics: EventAnalytics
}

type Query {
  events(filter: EventFilter): [Event!]!
  event(id: ID!): Event
  user(id: ID!): User
  tickets(filter: TicketFilter): [Ticket!]!
}

type Mutation {
  createEvent(input: CreateEventInput!): Event!
  updateEvent(id: ID!, input: UpdateEventInput!): Event!
  deleteEvent(id: ID!): Boolean!
  purchaseTicket(input: PurchaseTicketInput!): Ticket!
}
```

### Resolver Implementation
```typescript
const resolvers = {
  Query: {
    events: async (_, { filter }, { user }) => {
      return await eventService.getEvents(filter, user);
    },
    event: async (_, { id }, { user }) => {
      return await eventService.getEventById(id, user);
    }
  },
  
  Mutation: {
    createEvent: async (_, { input }, { user }) => {
      return await eventService.createEvent(input, user);
    }
  },
  
  Event: {
    organizer: async (parent) => {
      return await userService.getUserById(parent.organizerId);
    },
    analytics: async (parent) => {
      return await analyticsService.getEventAnalytics(parent.id);
    }
  }
};
```

## 🔍 API Documentation

### OpenAPI/Swagger Specification
```yaml
openapi: 3.0.0
info:
  title: Bilten API
  version: 1.0.0
  description: Event management platform API

paths:
  /api/v1/events:
    get:
      summary: Get all events
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 10
      responses:
        '200':
          description: List of events
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/EventList'
    
    post:
      summary: Create a new event
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateEventRequest'
      responses:
        '201':
          description: Event created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Event'

components:
  schemas:
    Event:
      type: object
      properties:
        id:
          type: string
          format: uuid
        title:
          type: string
        description:
          type: string
        startDate:
          type: string
          format: date-time
```

## 🛡️ Security Measures

### Rate Limiting
```typescript
// Rate limiting middleware
const rateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP',
    retryAfter: '15 minutes'
  }
});

// Apply to routes
app.use('/api/v1/', rateLimit);
```

### Input Validation
```typescript
// Validation middleware using Joi
const validateEvent = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    title: Joi.string().min(3).max(255).required(),
    description: Joi.string().max(1000),
    startDate: Joi.date().greater('now').required(),
    endDate: Joi.date().greater(Joi.ref('startDate')).required(),
    venueId: Joi.string().uuid(),
    capacity: Joi.number().integer().min(1)
  });
  
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.details[0].message
      }
    });
  }
  
  next();
};
```

## 📈 API Performance

### Caching Strategy
```typescript
// Redis caching middleware
const cacheMiddleware = (ttl: number = 300) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `api:${req.originalUrl}`;
    
    try {
      const cached = await redis.get(key);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
      
      // Store original send method
      const originalSend = res.json;
      
      // Override send method to cache response
      res.json = function(data) {
        redis.setex(key, ttl, JSON.stringify(data));
        return originalSend.call(this, data);
      };
      
      next();
    } catch (error) {
      next();
    }
  };
};
```

### Response Compression
```typescript
// Enable compression
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6
}));
```

## 🔄 API Monitoring

### Request Logging
```typescript
// Request logging middleware
const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('API Request', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  });
  
  next();
};
```

### Error Tracking
```typescript
// Error handling middleware
const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('API Error', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    userId: req.user?.id
  });
  
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred'
    }
  });
};
```

---

**Last Updated**: December 2024  
**Version**: 2.0  
**Maintained by**: Architecture Team
