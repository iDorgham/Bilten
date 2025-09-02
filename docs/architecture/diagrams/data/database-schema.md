# Database Schema Diagram

This diagram shows the main database entities and their relationships in the Bilten platform.

## Entity Relationship Diagram

```mermaid
erDiagram
    %% User Management
    users {
        uuid id PK
        string email UK
        string password_hash
        string first_name
        string last_name
        string phone
        enum role
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    organizers {
        uuid id PK
        uuid user_id FK
        string organization_name
        string description
        string website
        string contact_email
        string contact_phone
        boolean is_verified
        timestamp created_at
        timestamp updated_at
    }
    
    %% Event Management
    events {
        uuid id PK
        uuid organizer_id FK
        string title
        text description
        string location
        string venue_name
        decimal latitude
        decimal longitude
        timestamp start_date
        timestamp end_date
        enum status
        string image_url
        decimal price
        integer max_capacity
        integer current_capacity
        boolean is_featured
        timestamp created_at
        timestamp updated_at
    }
    
    event_categories {
        uuid id PK
        string name
        string description
        string icon
        timestamp created_at
    }
    
    event_category_mapping {
        uuid event_id FK
        uuid category_id FK
    }
    
    %% Ticket Management
    tickets {
        uuid id PK
        uuid event_id FK
        uuid user_id FK
        string ticket_number UK
        enum status
        decimal price_paid
        string qr_code
        timestamp purchased_at
        timestamp expires_at
        timestamp created_at
        timestamp updated_at
    }
    
    ticket_types {
        uuid id PK
        uuid event_id FK
        string name
        text description
        decimal price
        integer quantity_available
        integer quantity_sold
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    %% Payment Management
    payments {
        uuid id PK
        uuid user_id FK
        uuid ticket_id FK
        string payment_intent_id
        decimal amount
        string currency
        enum status
        string payment_method
        json payment_details
        timestamp created_at
        timestamp updated_at
    }
    
    %% Media Management
    media_files {
        uuid id PK
        uuid user_id FK
        string file_name
        string original_name
        string mime_type
        bigint file_size
        string file_path
        string url
        enum file_type
        timestamp created_at
        timestamp updated_at
    }
    
    %% Analytics
    event_analytics {
        uuid id PK
        uuid event_id FK
        integer total_views
        integer unique_visitors
        integer tickets_sold
        decimal total_revenue
        json conversion_metrics
        timestamp date
        timestamp created_at
    }
    
    user_analytics {
        uuid id PK
        uuid user_id FK
        integer events_attended
        integer tickets_purchased
        decimal total_spent
        json preferences
        timestamp last_activity
        timestamp created_at
        timestamp updated_at
    }
    
    %% Notifications
    notifications {
        uuid id PK
        uuid user_id FK
        string title
        text message
        enum type
        enum status
        json metadata
        timestamp sent_at
        timestamp created_at
    }
    
    %% Branding
    branding_settings {
        uuid id PK
        uuid organizer_id FK
        string logo_url
        string primary_color
        string secondary_color
        string font_family
        json custom_css
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    %% Relationships
    users ||--o{ organizers : "has"
    users ||--o{ tickets : "purchases"
    users ||--o{ payments : "makes"
    users ||--o{ media_files : "uploads"
    users ||--o{ notifications : "receives"
    users ||--o{ user_analytics : "has"
    
    organizers ||--o{ events : "creates"
    organizers ||--o{ branding_settings : "configures"
    
    events ||--o{ tickets : "has"
    events ||--o{ ticket_types : "offers"
    events ||--o{ event_analytics : "tracks"
    events }o--o{ event_categories : "belongs_to"
    
    tickets ||--|| payments : "has"
    tickets }o--|| ticket_types : "is_of_type"
    
    event_categories }o--o{ events : "contains"
```

## Database Schema Details

### Core Tables

#### Users & Authentication
- **users**: Main user accounts with authentication details
- **organizers**: Extended profile for event organizers
- **branding_settings**: Custom branding configuration per organizer

#### Event Management
- **events**: Main event information and metadata
- **event_categories**: Event categorization system
- **event_category_mapping**: Many-to-many relationship between events and categories

#### Ticket System
- **tickets**: Individual ticket instances
- **ticket_types**: Different ticket categories (VIP, General, etc.)
- **payments**: Payment transaction records

#### Media & Files
- **media_files**: File upload management and metadata

#### Analytics & Tracking
- **event_analytics**: Event performance metrics
- **user_analytics**: User behavior and preferences

#### Communication
- **notifications**: User notification system

### Key Design Patterns

#### 1. **UUID Primary Keys**
- All tables use UUID primary keys for security and scalability
- Enables distributed ID generation
- Prevents enumeration attacks

#### 2. **Audit Trail**
- `created_at` and `updated_at` timestamps on all tables
- Tracks data lineage and changes
- Enables temporal queries

#### 3. **Soft Deletes**
- `is_active` flags for soft deletion
- Preserves data integrity
- Enables data recovery

#### 4. **JSON Fields**
- Flexible metadata storage
- Schema evolution without migrations
- Performance optimization for complex data

#### 5. **Enum Types**
- Status and type fields use enums
- Data consistency and validation
- Clear business logic representation

### Indexing Strategy

#### Primary Indexes
- UUID primary keys (automatically indexed)
- Unique constraints (email, ticket_number)

#### Performance Indexes
- `events(organizer_id, status)` - Organizer event queries
- `tickets(event_id, status)` - Event ticket queries
- `payments(user_id, status)` - User payment history
- `events(start_date, status)` - Upcoming events
- `tickets(user_id, purchased_at)` - User ticket history

#### Composite Indexes
- `events(latitude, longitude, start_date)` - Location-based queries
- `tickets(event_id, status, purchased_at)` - Event ticket analytics

### Data Relationships

#### One-to-Many
- User → Events (organizer relationship)
- Event → Tickets
- Event → Ticket Types
- User → Payments

#### Many-to-Many
- Events ↔ Categories (through mapping table)

#### One-to-One
- Ticket ↔ Payment (unique relationship)

### Data Integrity Constraints

#### Foreign Key Constraints
- All relationships properly constrained
- Cascade delete where appropriate
- Restrict delete for critical data

#### Check Constraints
- Price values must be positive
- Dates must be valid
- Status values must be valid enums

#### Unique Constraints
- User email addresses
- Ticket numbers
- Payment intent IDs

### Scalability Considerations

#### Partitioning Strategy
- Events table partitioned by date
- Analytics tables partitioned by date
- Logs partitioned by timestamp

#### Archival Strategy
- Old events moved to archive tables
- Analytics data aggregated over time
- Payment history retained for compliance

---

**Last Updated**: December 2024  
**Version**: 2.0  
**Maintained by**: Architecture Team
