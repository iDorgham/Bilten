# Data Flow Diagram

This diagram shows how data flows through the Bilten platform, from user input to storage and analytics.

## Data Flow Architecture

```mermaid
flowchart TD
    %% User Input Sources
    User[👥 User Input]
    Organizer[🎪 Organizer Input]
    Scanner[📱 Scanner Input]
    External[🌍 External Systems]
    
    %% Frontend Applications
    subgraph "Frontend Layer"
        PublicApp[🌐 Public Frontend]
        AdminPanel[🛠️ Admin Panel]
        OrganizerPanel[🎯 Organizer Panel]
        ScannerApp[📱 Scanner App]
    end
    
    %% API Gateway
    subgraph "API Gateway"
        Gateway[🚪 API Gateway]
        Validation[✅ Input Validation]
        RateLimit[⏱️ Rate Limiting]
    end
    
    %% Backend Services
    subgraph "Service Layer"
        UserService[👤 User Service]
        EventService[🎪 Event Service]
        TicketService[🎫 Ticket Service]
        PaymentService[💳 Payment Service]
        NotificationService[📧 Notification Service]
        AnalyticsService[📊 Analytics Service]
        MediaService[🖼️ Media Service]
    end
    
    %% Data Processing
    subgraph "Data Processing"
        ETL[🔄 ETL Pipeline]
        Stream[📡 Stream Processing]
        Batch[📦 Batch Processing]
    end
    
    %% Storage Layer
    subgraph "Storage Layer"
        PostgreSQL[(🗄️ PostgreSQL)]
        Redis[(⚡ Redis Cache)]
        ClickHouse[(📈 ClickHouse)]
        S3[📁 S3 Storage]
        Archive[(📚 Archive DB)]
    end
    
    %% Analytics & Reporting
    subgraph "Analytics Layer"
        DataWarehouse[(🏢 Data Warehouse)]
        BI[📊 Business Intelligence]
        Reports[📋 Reports]
        Dashboards[📈 Dashboards]
    end
    
    %% External Systems
    subgraph "External Systems"
        PaymentGateway[💳 Payment Gateway]
        EmailService[📧 Email Service]
        SMSService[📱 SMS Service]
        CDN[🌍 CDN]
    end
    
    %% Data Flow Connections
    User --> PublicApp
    Organizer --> OrganizerPanel
    Scanner --> ScannerApp
    External --> Gateway
    
    PublicApp --> Gateway
    AdminPanel --> Gateway
    OrganizerPanel --> Gateway
    ScannerApp --> Gateway
    
    Gateway --> Validation
    Validation --> RateLimit
    RateLimit --> UserService
    RateLimit --> EventService
    RateLimit --> TicketService
    RateLimit --> PaymentService
    RateLimit --> NotificationService
    RateLimit --> AnalyticsService
    RateLimit --> MediaService
    
    %% Service to Database Flow
    UserService --> PostgreSQL
    EventService --> PostgreSQL
    TicketService --> PostgreSQL
    PaymentService --> PostgreSQL
    NotificationService --> PostgreSQL
    
    %% Caching Flow
    UserService --> Redis
    EventService --> Redis
    TicketService --> Redis
    PaymentService --> Redis
    
    %% Media Flow
    MediaService --> S3
    MediaService --> CDN
    
    %% Analytics Flow
    AnalyticsService --> ClickHouse
    AnalyticsService --> DataWarehouse
    
    %% ETL Processing
    PostgreSQL --> ETL
    ClickHouse --> ETL
    ETL --> DataWarehouse
    
    %% Stream Processing
    UserService --> Stream
    EventService --> Stream
    TicketService --> Stream
    PaymentService --> Stream
    Stream --> ClickHouse
    
    %% Batch Processing
    PostgreSQL --> Batch
    Batch --> Archive
    Batch --> DataWarehouse
    
    %% External Integrations
    PaymentService --> PaymentGateway
    NotificationService --> EmailService
    NotificationService --> SMSService
    
    %% Analytics Output
    DataWarehouse --> BI
    DataWarehouse --> Reports
    DataWarehouse --> Dashboards
    
    %% Styling
    classDef inputClass fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef frontendClass fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef gatewayClass fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef serviceClass fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef processingClass fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    classDef storageClass fill:#fff8e1,stroke:#f57f17,stroke-width:2px
    classDef analyticsClass fill:#e0f2f1,stroke:#00695c,stroke-width:2px
    classDef externalClass fill:#f1f8e9,stroke:#33691e,stroke-width:2px
    
    class User,Organizer,Scanner,External inputClass
    class PublicApp,AdminPanel,OrganizerPanel,ScannerApp frontendClass
    class Gateway,Validation,RateLimit gatewayClass
    class UserService,EventService,TicketService,PaymentService,NotificationService,AnalyticsService,MediaService serviceClass
    class ETL,Stream,Batch processingClass
    class PostgreSQL,Redis,ClickHouse,S3,Archive storageClass
    class DataWarehouse,BI,Reports,Dashboards analyticsClass
    class PaymentGateway,EmailService,SMSService,CDN externalClass
```

## Data Flow Patterns

### 1. **Real-time Data Flow**
- **User Interactions**: Immediate processing of user actions
- **Event Streaming**: Real-time event processing
- **Live Updates**: Instant data synchronization

### 2. **Batch Data Flow**
- **Scheduled Processing**: Regular data aggregation
- **ETL Pipelines**: Data transformation and loading
- **Archival**: Long-term data storage

### 3. **Caching Strategy**
- **Hot Data**: Frequently accessed data in Redis
- **Warm Data**: Less frequent data in PostgreSQL
- **Cold Data**: Historical data in archive storage

## Data Categories

### Transactional Data
- **User Accounts**: Authentication and profiles
- **Events**: Event information and metadata
- **Tickets**: Ticket purchases and validation
- **Payments**: Financial transactions

### Analytical Data
- **User Behavior**: User interaction patterns
- **Event Analytics**: Event performance metrics
- **Business Intelligence**: Revenue and growth data
- **Operational Metrics**: System performance data

### Media Data
- **Images**: Event photos and graphics
- **Documents**: Event descriptions and files
- **Videos**: Event recordings and promotional content

## Data Processing Patterns

### ETL (Extract, Transform, Load)
```mermaid
graph LR
    A[Extract] --> B[Transform]
    B --> C[Load]
    C --> D[Data Warehouse]
    
    style A fill:#ff9999
    style B fill:#ffff99
    style C fill:#99ff99
    style D fill:#9999ff
```

### Stream Processing
```mermaid
graph LR
    A[Event Stream] --> B[Stream Processor]
    B --> C[Real-time Analytics]
    B --> D[Alert System]
    
    style B fill:#ffcc99
    style C fill:#99ccff
    style D fill:#ff99cc
```

### Batch Processing
```mermaid
graph LR
    A[Source Data] --> B[Batch Processor]
    B --> C[Aggregated Data]
    B --> D[Reports]
    
    style B fill:#cc99ff
    style C fill:#99ffcc
    style D fill:#ffcc99
```

## Data Security and Privacy

### Data Encryption
- **At Rest**: Database and storage encryption
- **In Transit**: TLS/SSL for data transmission
- **In Use**: Application-level encryption

### Data Privacy
- **GDPR Compliance**: User data protection
- **Data Anonymization**: Privacy-preserving analytics
- **Access Control**: Role-based data access

### Data Retention
- **Active Data**: Current operational data
- **Archive Data**: Historical data storage
- **Compliance Data**: Regulatory data retention

## Performance Optimization

### Data Partitioning
- **Time-based**: Partition by date/time
- **Geographic**: Partition by location
- **Functional**: Partition by business domain

### Indexing Strategy
- **Primary Indexes**: Unique identifiers
- **Secondary Indexes**: Query optimization
- **Composite Indexes**: Multi-column queries

### Caching Layers
- **Application Cache**: In-memory caching
- **Distributed Cache**: Redis cluster
- **CDN Cache**: Static content delivery

---

**Last Updated**: December 2024  
**Version**: 2.0  
**Maintained by**: Architecture Team
