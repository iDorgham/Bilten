# Data Architecture

## 🎯 Overview

This document describes the data architecture of the Bilten platform, including database design, data flow patterns, storage strategies, and data management principles.

## 🗄️ Database Design

### Core Database Schema

#### 1. **Users and Authentication**
```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL DEFAULT 'attendee',
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    website VARCHAR(255),
    logo_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. **Events and Venues**
```sql
-- Events table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    organizer_id UUID NOT NULL REFERENCES users(id),
    venue_id UUID REFERENCES venues(id),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    status event_status DEFAULT 'draft',
    capacity INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Venues table
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20),
    capacity INTEGER,
    amenities TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. **Tickets and Pricing**
```sql
-- Ticket types table
CREATE TABLE ticket_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL,
    sold_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tickets table
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_type_id UUID NOT NULL REFERENCES ticket_types(id),
    user_id UUID REFERENCES users(id),
    event_id UUID NOT NULL REFERENCES events(id),
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    status ticket_status DEFAULT 'active',
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checked_in_at TIMESTAMP,
    checked_in_by UUID REFERENCES users(id)
);
```

#### 4. **Payments and Transactions**
```sql
-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method payment_method NOT NULL,
    status payment_status DEFAULT 'pending',
    transaction_id VARCHAR(255),
    gateway_response JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment items table
CREATE TABLE payment_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id),
    ticket_id UUID REFERENCES tickets(id),
    item_type VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT
);
```

### Database Relationships

#### Entity Relationship Diagram
```
Users (1) ←→ (N) Events
Users (1) ←→ (N) Organizations
Events (1) ←→ (N) Ticket Types
Events (1) ←→ (N) Tickets
Ticket Types (1) ←→ (N) Tickets
Users (1) ←→ (N) Tickets
Users (1) ←→ (N) Payments
Payments (1) ←→ (N) Payment Items
Tickets (1) ←→ (1) Payment Items
```

## 🔄 Data Flow Patterns

### 1. **Event Creation Flow**
```
1. User Input → Validation → Event Service
2. Event Service → Database (Events table)
3. Event Service → Cache (Redis)
4. Event Service → Notification Service
5. Response → Frontend
```

### 2. **Ticket Purchase Flow**
```
1. User Selection → Validation → Ticket Service
2. Ticket Service → Payment Service
3. Payment Service → External Gateway
4. Payment Service → Database (Payments table)
5. Ticket Service → Database (Tickets table)
6. Ticket Service → Email Service
7. Response → Frontend
```

### 3. **Event Check-in Flow**
```
1. Scanner Input → Validation → Ticket Service
2. Ticket Service → Database (Tickets table)
3. Ticket Service → Analytics Service
4. Response → Mobile App
```

## 💾 Storage Strategies

### 1. **Primary Database (PostgreSQL)**
- **Purpose**: ACID-compliant transactional data
- **Data Types**: User data, events, tickets, payments
- **Features**: 
  - Full-text search
  - JSONB for flexible data
  - Foreign key constraints
  - Triggers for audit trails

### 2. **Cache Layer (Redis)**
- **Purpose**: High-speed data access
- **Data Types**: 
  - Session data
  - Frequently accessed events
  - Rate limiting counters
  - Real-time analytics
- **TTL**: Configurable expiration times

### 3. **File Storage**
- **Purpose**: Binary data storage
- **Data Types**: 
  - Event images
  - User avatars
  - Documents
  - QR codes
- **Strategy**: CDN with local backup

## 🔍 Data Access Patterns

### 1. **Repository Pattern**
```typescript
// Base repository interface
interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(filters?: any): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
}

// Event repository implementation
class EventRepository implements IRepository<Event> {
  async findById(id: string): Promise<Event | null> {
    return this.db.event.findUnique({
      where: { id },
      include: { organizer: true, venue: true }
    });
  }
  
  async findUpcomingEvents(): Promise<Event[]> {
    return this.db.event.findMany({
      where: {
        start_date: { gte: new Date() },
        status: 'published'
      },
      include: { organizer: true, venue: true },
      orderBy: { start_date: 'asc' }
    });
  }
}
```

### 2. **Query Optimization**
```sql
-- Indexes for performance
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_organizer_id ON events(organizer_id);
CREATE INDEX idx_tickets_event_id ON tickets(event_id);
CREATE INDEX idx_tickets_user_id ON tickets(user_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);

-- Composite indexes
CREATE INDEX idx_events_status_date ON events(status, start_date);
CREATE INDEX idx_tickets_event_status ON tickets(event_id, status);
```

## 🔒 Data Security

### 1. **Data Encryption**
```typescript
// Encryption utilities
class DataEncryption {
  static encryptSensitiveData(data: string): string {
    return crypto.encrypt(data, process.env.ENCRYPTION_KEY);
  }
  
  static decryptSensitiveData(encryptedData: string): string {
    return crypto.decrypt(encryptedData, process.env.ENCRYPTION_KEY);
  }
}

// Usage in models
class User {
  set creditCardNumber(value: string) {
    this._creditCardNumber = DataEncryption.encryptSensitiveData(value);
  }
  
  get creditCardNumber(): string {
    return DataEncryption.decryptSensitiveData(this._creditCardNumber);
  }
}
```

### 2. **Data Masking**
```sql
-- Mask sensitive data in logs
CREATE OR REPLACE FUNCTION mask_email(email TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN substring(email, 1, 2) || '***' || '@' || split_part(email, '@', 2);
END;
$$ LANGUAGE plpgsql;
```

## 📊 Data Analytics

### 1. **Analytics Data Model**
```sql
-- Event analytics table
CREATE TABLE event_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,2) NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User behavior table
CREATE TABLE user_behavior (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. **Real-time Analytics**
```typescript
// Real-time analytics service
class AnalyticsService {
  async trackEventView(eventId: string, userId?: string) {
    await this.db.eventAnalytics.create({
      data: {
        eventId,
        metricName: 'view',
        metricValue: 1,
        userId
      }
    });
    
    // Update cache for real-time dashboards
    await this.redis.incr(`event:${eventId}:views`);
  }
  
  async getEventMetrics(eventId: string) {
    const cached = await this.redis.get(`event:${eventId}:metrics`);
    if (cached) return JSON.parse(cached);
    
    const metrics = await this.calculateEventMetrics(eventId);
    await this.redis.setex(`event:${eventId}:metrics`, 300, JSON.stringify(metrics));
    return metrics;
  }
}
```

## 🔄 Data Migration Strategy

### 1. **Migration Tools**
```typescript
// Migration interface
interface Migration {
  version: string;
  up(): Promise<void>;
  down(): Promise<void>;
  description: string;
}

// Example migration
class AddUserPreferencesMigration implements Migration {
  version = '2024.01.001';
  description = 'Add user preferences table';
  
  async up() {
    await this.db.execute(`
      CREATE TABLE user_preferences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        preference_key VARCHAR(100) NOT NULL,
        preference_value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, preference_key)
      );
    `);
  }
  
  async down() {
    await this.db.execute('DROP TABLE user_preferences;');
  }
}
```

### 2. **Data Backup Strategy**
```bash
#!/bin/bash
# Backup script
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/postgresql"

# Create backup
pg_dump -h localhost -U postgres bilten > "$BACKUP_DIR/bilten_$DATE.sql"

# Compress backup
gzip "$BACKUP_DIR/bilten_$DATE.sql"

# Clean old backups (keep last 30 days)
find $BACKUP_DIR -name "bilten_*.sql.gz" -mtime +30 -delete
```

## 📈 Data Performance

### 1. **Query Optimization**
```sql
-- Optimized queries
-- Use CTEs for complex queries
WITH event_stats AS (
  SELECT 
    event_id,
    COUNT(*) as total_tickets,
    COUNT(CASE WHEN status = 'checked_in' THEN 1 END) as checked_in_tickets
  FROM tickets 
  GROUP BY event_id
)
SELECT 
  e.title,
  e.start_date,
  es.total_tickets,
  es.checked_in_tickets,
  ROUND((es.checked_in_tickets::DECIMAL / es.total_tickets) * 100, 2) as check_in_rate
FROM events e
JOIN event_stats es ON e.id = es.event_id
WHERE e.status = 'published'
ORDER BY e.start_date DESC;
```

### 2. **Connection Pooling**
```typescript
// Database connection pool configuration
const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum number of connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};
```

---

**Last Updated**: December 2024  
**Version**: 2.0  
**Maintained by**: Architecture Team
