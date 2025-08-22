# Bilten Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Setup & Installation](#setup--installation)
5. [Development Guidelines](#development-guidelines)
6. [API Documentation](#api-documentation)
7. [Database Schema](#database-schema)
8. [Deployment](#deployment)
9. [Testing](#testing)
10. [Security](#security)
11. [Performance](#performance)
12. [Troubleshooting](#troubleshooting)
13. [Contributing](#contributing)

---

## Project Overview

### What is Bilten?
Bilten is a comprehensive event management platform that enables users to create, manage, and attend events. The platform provides tools for event organizers, attendees, and administrators with features including event creation, ticket sales, user management, and analytics.

### Key Features
- **Event Management:** Create, edit, and publish events
- **Ticketing System:** Sell and manage tickets with QR code validation
- **User Management:** Registration, authentication, and role-based access
- **Admin Panel:** Comprehensive administration tools
- **Analytics:** Real-time analytics and reporting
- **Payment Integration:** Secure payment processing
- **Mobile Responsive:** Optimized for all devices

### Target Users
- **Event Organizers:** Create and manage events
- **Attendees:** Discover and purchase tickets
- **Administrators:** Manage platform and users

---

## Architecture

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (React.js)    │◄──►│   (Node.js)     │◄──►│  (PostgreSQL)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CDN/Static    │    │   Redis Cache   │    │   File Storage  │
│   Assets        │    │                 │    │   (AWS S3)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Frontend Architecture
```
src/
├── components/          # Reusable UI components
│   ├── admin/          # Admin-specific components
│   ├── auth/           # Authentication components
│   ├── common/         # Shared components
│   └── forms/          # Form components
├── pages/              # Page components
│   ├── admin/          # Admin pages
│   ├── auth/           # Authentication pages
│   ├── events/         # Event-related pages
│   └── user/           # User pages
├── context/            # React context providers
├── hooks/              # Custom React hooks
├── services/           # API service functions
├── utils/              # Utility functions
└── styles/             # Global styles and themes
```

### Backend Architecture
```
src/
├── routes/             # API route handlers
├── middleware/         # Express middleware
├── services/           # Business logic services
├── models/             # Database models
├── utils/              # Utility functions
├── config/             # Configuration files
└── tests/              # Test files
```

---

## Technology Stack

### Frontend
- **Framework:** React.js 18.x
- **Language:** JavaScript/TypeScript
- **Styling:** Tailwind CSS
- **State Management:** React Context API
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **Build Tool:** Vite
- **Testing:** Jest + React Testing Library

### Backend
- **Runtime:** Node.js 18.x
- **Framework:** Express.js
- **Language:** JavaScript/TypeScript
- **Authentication:** JWT + bcrypt
- **Validation:** Joi/Yup
- **Testing:** Jest + Supertest

### Database
- **Primary Database:** PostgreSQL 15.x
- **Caching:** Redis
- **ORM:** Prisma/Sequelize
- **Migrations:** Database migration tools

### DevOps
- **Containerization:** Docker
- **Orchestration:** Docker Compose
- **CI/CD:** GitHub Actions
- **Cloud Platform:** AWS/Azure/GCP
- **Monitoring:** New Relic/DataDog

### Third-party Services
- **Payment Processing:** Stripe
- **Email Service:** SendGrid/AWS SES
- **File Storage:** AWS S3
- **Analytics:** Google Analytics
- **Maps:** Google Maps API

---

## Setup & Installation

### Prerequisites
- Node.js 18.x or higher
- PostgreSQL 15.x
- Redis 6.x
- Docker (optional)
- Git

### Development Setup

#### 1. Clone Repository
```bash
git clone https://github.com/your-org/bilten.git
cd bilten
```

#### 2. Frontend Setup
```bash
cd bilten-frontend
npm install
cp .env.example .env.local
npm start
```

#### 3. Backend Setup
```bash
cd bilten-backend
npm install
cp .env.example .env
npm run dev
```

#### 4. Database Setup
```bash
# Create database
createdb bilten_dev

# Run migrations
cd bilten-backend
npm run migrate

# Seed data (optional)
npm run seed
```

#### 5. Environment Configuration

**Frontend (.env.local)**
```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_STRIPE_PUBLIC_KEY=your_stripe_public_key
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

**Backend (.env)**
```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://username:password@localhost:5432/bilten_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
SENDGRID_API_KEY=your_sendgrid_key
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_S3_BUCKET=your_s3_bucket
```

### Docker Setup
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## Development Guidelines

### Code Style

#### JavaScript/TypeScript
```javascript
// Use functional components with hooks
const MyComponent = ({ prop1, prop2 }) => {
  const [state, setState] = useState(initialValue);
  
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  const handleClick = useCallback(() => {
    // Event handlers
  }, [dependencies]);
  
  return (
    <div className="container">
      {/* JSX content */}
    </div>
  );
};

// Use meaningful variable names
const userProfile = getUserProfile();
const eventDetails = getEventDetails();

// Use destructuring
const { name, email, role } = user;
```

#### CSS/Styling
```css
/* Use Tailwind CSS classes */
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  <h2 className="text-xl font-semibold text-gray-900">Title</h2>
  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
    Action
  </button>
</div>

/* Custom CSS when needed */
.custom-class {
  @apply bg-gray-100 p-4 rounded;
}
```

### File Organization
```
components/
├── Button/
│   ├── Button.jsx
│   ├── Button.test.js
│   └── index.js
├── Modal/
│   ├── Modal.jsx
│   ├── Modal.test.js
│   └── index.js
└── index.js
```

### Naming Conventions
- **Components:** PascalCase (e.g., `UserProfile`)
- **Files:** PascalCase for components, camelCase for utilities
- **Variables:** camelCase (e.g., `userProfile`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)
- **CSS Classes:** kebab-case (e.g., `user-profile`)

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/user-authentication

# Make changes and commit
git add .
git commit -m "feat: add user authentication system"

# Push to remote
git push origin feature/user-authentication

# Create pull request
# Merge after review
```

---

## API Documentation

### Authentication Endpoints

#### POST /api/auth/register
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe",
  "role": "attendee"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "attendee"
    },
    "token": "jwt_token_here"
  }
}
```

#### POST /api/auth/login
Authenticate user and return JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "attendee"
    },
    "token": "jwt_token_here"
  }
}
```

### Event Endpoints

#### GET /api/events
Get list of events with pagination.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search term
- `category`: Event category
- `date`: Event date filter

**Response:**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "123",
        "title": "Tech Conference 2024",
        "description": "Annual technology conference",
        "date": "2024-06-15T10:00:00Z",
        "location": "San Francisco, CA",
        "organizer": {
          "id": "456",
          "name": "Tech Events Inc"
        },
        "ticketTypes": [
          {
            "id": "789",
            "name": "General Admission",
            "price": 99.99,
            "available": 100
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
    }
  }
}
```

#### POST /api/events
Create a new event (requires authentication).

**Request Body:**
```json
{
  "title": "Tech Conference 2024",
  "description": "Annual technology conference",
  "date": "2024-06-15T10:00:00Z",
  "location": "San Francisco, CA",
  "capacity": 500,
  "ticketTypes": [
    {
      "name": "General Admission",
      "price": 99.99,
      "quantity": 400
    },
    {
      "name": "VIP",
      "price": 199.99,
      "quantity": 100
    }
  ]
}
```

### Ticket Endpoints

#### POST /api/tickets/purchase
Purchase tickets for an event.

**Request Body:**
```json
{
  "eventId": "123",
  "ticketTypeId": "789",
  "quantity": 2,
  "paymentMethod": "card",
  "paymentToken": "tok_visa"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tickets": [
      {
        "id": "ticket_123",
        "eventId": "123",
        "ticketType": "General Admission",
        "price": 99.99,
        "qrCode": "qr_code_data",
        "validUntil": "2024-06-15T18:00:00Z"
      }
    ],
    "transaction": {
      "id": "txn_456",
      "amount": 199.98,
      "status": "completed"
    }
  }
}
```

### Admin Endpoints

#### GET /api/admin/users
Get list of users (admin only).

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `role`: Filter by user role
- `search`: Search by name or email

#### PUT /api/admin/users/:id
Update user status (admin only).

**Request Body:**
```json
{
  "status": "active|suspended|deleted",
  "role": "attendee|organizer|admin"
}
```

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'attendee',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
```

### Events Table
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date TIMESTAMP NOT NULL,
  location VARCHAR(255) NOT NULL,
  capacity INTEGER NOT NULL,
  organizer_id UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_status ON events(status);
```

### Ticket Types Table
```sql
CREATE TABLE ticket_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL,
  available INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ticket_types_event ON ticket_types(event_id);
```

### Tickets Table
```sql
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id),
  ticket_type_id UUID REFERENCES ticket_types(id),
  user_id UUID REFERENCES users(id),
  qr_code VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'valid',
  purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  valid_until TIMESTAMP NOT NULL
);

CREATE INDEX idx_tickets_event ON tickets(event_id);
CREATE INDEX idx_tickets_user ON tickets(user_id);
CREATE INDEX idx_tickets_qr_code ON tickets(qr_code);
```

### Transactions Table
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  event_id UUID REFERENCES events(id),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  payment_method VARCHAR(50) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'pending',
  stripe_payment_intent_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_event ON transactions(event_id);
CREATE INDEX idx_transactions_status ON transactions(payment_status);
```

---

## Deployment

### Production Environment Setup

#### 1. Server Requirements
- **CPU:** 2+ cores
- **RAM:** 4GB+ 
- **Storage:** 50GB+ SSD
- **OS:** Ubuntu 20.04 LTS

#### 2. Environment Variables
```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:pass@host:5432/bilten_prod
REDIS_URL=redis://host:6379
JWT_SECRET=very_secure_jwt_secret
STRIPE_SECRET_KEY=sk_live_...
SENDGRID_API_KEY=SG...
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=bilten-prod-assets
```

#### 3. Database Setup
```bash
# Create production database
createdb bilten_prod

# Run migrations
npm run migrate:prod

# Seed initial data
npm run seed:prod
```

#### 4. SSL Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Docker Deployment
```bash
# Build production images
docker build -t bilten-frontend:prod ./bilten-frontend
docker build -t bilten-backend:prod ./bilten-backend

# Run with docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd bilten-frontend && npm install
          cd ../bilten-backend && npm install
      - name: Run tests
        run: |
          cd bilten-frontend && npm test
          cd ../bilten-backend && npm test
      - name: Build and deploy
        run: |
          # Build and deploy steps
```

---

## Testing

### Frontend Testing

#### Unit Tests
```javascript
// components/Button/Button.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

describe('Button Component', () => {
  test('renders button with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  test('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

#### Integration Tests
```javascript
// pages/Login.test.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from './Login';

describe('Login Page', () => {
  test('submits form with correct data', async () => {
    const mockLogin = jest.fn();
    
    render(
      <BrowserRouter>
        <Login onLogin={mockLogin} />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' }
    });
    
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' }
    });
    
    fireEvent.click(screen.getByText('Login'));
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });
});
```

### Backend Testing

#### API Tests
```javascript
// routes/auth.test.js
import request from 'supertest';
import app from '../app';
import { setupTestDB } from '../test/setup';

describe('Auth Routes', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  test('POST /api/auth/register - creates new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe('test@example.com');
  });
});
```

### E2E Testing
```javascript
// cypress/integration/auth.spec.js
describe('Authentication', () => {
  it('should register a new user', () => {
    cy.visit('/register');
    
    cy.get('[data-testid=email]').type('test@example.com');
    cy.get('[data-testid=password]').type('password123');
    cy.get('[data-testid=firstName]').type('John');
    cy.get('[data-testid=lastName]').type('Doe');
    
    cy.get('[data-testid=register-button]').click();
    
    cy.url().should('include', '/dashboard');
    cy.get('[data-testid=user-name]').should('contain', 'John Doe');
  });
});
```

---

## Security

### Authentication & Authorization
- **JWT Tokens:** Secure token-based authentication
- **Password Hashing:** bcrypt with salt rounds
- **Role-based Access:** Granular permissions
- **Session Management:** Secure session handling

### Data Protection
- **Input Validation:** Server-side validation
- **SQL Injection Prevention:** Parameterized queries
- **XSS Protection:** Content Security Policy
- **CSRF Protection:** CSRF tokens

### API Security
```javascript
// Middleware for API protection
app.use(helmet()); // Security headers
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

### Environment Security
```bash
# Secure environment variables
JWT_SECRET=very_long_random_string
DATABASE_URL=postgresql://user:pass@host:5432/db
STRIPE_SECRET_KEY=sk_live_...
```

---

## Performance

### Frontend Optimization
- **Code Splitting:** Lazy loading of components
- **Bundle Optimization:** Tree shaking and minification
- **Image Optimization:** WebP format and lazy loading
- **Caching:** Browser and CDN caching

### Backend Optimization
- **Database Indexing:** Proper database indexes
- **Query Optimization:** Efficient database queries
- **Caching:** Redis for session and data caching
- **Connection Pooling:** Database connection management

### Monitoring
```javascript
// Performance monitoring
const performanceMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${duration}ms`);
  });
  
  next();
};
```

---

## Troubleshooting

### Common Issues

#### Frontend Issues
1. **Build Errors**
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   npm start
   ```

2. **Hot Reload Not Working**
   ```bash
   # Check file watchers
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

#### Backend Issues
1. **Database Connection**
   ```bash
   # Check database status
   sudo systemctl status postgresql
   
   # Test connection
   psql -h localhost -U username -d database_name
   ```

2. **Port Conflicts**
   ```bash
   # Check port usage
   lsof -i :3001
   
   # Kill process
   kill -9 <PID>
   ```

### Debug Mode
```bash
# Frontend debug
DEBUG=* npm start

# Backend debug
NODE_ENV=development DEBUG=app:* npm run dev
```

### Logs
```bash
# View application logs
tail -f logs/app.log

# View error logs
tail -f logs/error.log

# View access logs
tail -f logs/access.log
```

---

## Contributing

### Development Workflow
1. **Fork Repository**
2. **Create Feature Branch**
3. **Make Changes**
4. **Write Tests**
5. **Submit Pull Request**

### Code Review Process
1. **Automated Checks**
   - Linting
   - Tests
   - Build verification

2. **Manual Review**
   - Code quality
   - Security review
   - Performance impact

3. **Approval**
   - At least 2 approvals required
   - All checks must pass

### Commit Guidelines
```
feat: add user authentication system
fix: resolve dark mode styling issues
docs: update API documentation
style: format code according to guidelines
refactor: improve component structure
test: add unit tests for user service
chore: update dependencies
```

### Pull Request Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes
```

---

## Support

### Getting Help
- **Documentation:** Check this documentation first
- **Issues:** Create GitHub issue with detailed description
- **Discussions:** Use GitHub Discussions for questions
- **Email:** Contact support@bilten.com

### Reporting Bugs
```markdown
**Bug Report Template**

**Description:**
Clear description of the bug

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Environment:**
- OS: [Operating system]
- Browser: [Browser version]
- Version: [Application version]

**Additional Information:**
Screenshots, logs, etc.
```

### Feature Requests
```markdown
**Feature Request Template**

**Description:**
Clear description of the feature

**Use Case:**
How this feature would be used

**Proposed Solution:**
Suggested implementation approach

**Alternatives Considered:**
Other solutions explored

**Additional Information:**
Mockups, examples, etc.
```

---

*Last Updated: December 2024*
*Version: 1.0*
*Maintained by: Application Engineering Team*
