# Search Infrastructure Configuration

This directory contains the configuration files for the search and discovery system infrastructure.

## Components

### 1. Elasticsearch Configuration (`elasticsearch.js`)

Handles Elasticsearch connection and index management for event search functionality.

**Features:**
- Automatic connection management with retry logic
- Event index creation with proper mappings
- Health monitoring and connection status
- Graceful shutdown handling

**Environment Variables:**
```env
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_AUTH=false
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=your_password
```

**Index Mappings:**
- Events index with full-text search capabilities
- Geographic location support with geo_point mapping
- Autocomplete suggestions with completion field
- Popularity scoring and statistics tracking

### 2. Search Cache Configuration (`searchCache.js`)

Manages Redis caching for search results and related data to improve performance.

**Features:**
- Dedicated Redis database for search caching
- Configurable TTL for different data types
- Cache key generation and management
- Cache invalidation patterns
- Performance statistics

**Environment Variables:**
```env
REDIS_SEARCH_URL=redis://localhost:6379
REDIS_SEARCH_DB=2
```

**Cache Types:**
- Search results (5 minutes TTL)
- Autocomplete suggestions (10 minutes TTL)
- Trending events (15 minutes TTL)
- Popular events (30 minutes TTL)
- User recommendations (1 hour TTL)
- User preferences (2 hours TTL)

### 3. Search Configuration Manager (`searchConfig.js`)

Main configuration manager that initializes and coordinates all search infrastructure components.

**Features:**
- Unified initialization of Elasticsearch and Redis
- Health status monitoring for all components
- Graceful shutdown handling
- Component readiness checks

### 4. Search Types (`../types/search.js`)

Comprehensive type definitions and validation helpers for search functionality.

**Features:**
- JSDoc type definitions for all search-related data structures
- Validation helpers for request/response objects
- Default values and constants
- Type safety for JavaScript codebase

## Usage

### Basic Setup

```javascript
const searchConfig = require('./config/searchConfig');

// Initialize search infrastructure
await searchConfig.initialize();

// Check if ready
if (searchConfig.isReady()) {
  // Get clients
  const esClient = searchConfig.getElasticsearchClient();
  const cache = searchConfig.getSearchCache();
  
  // Use for search operations
}

// Graceful shutdown
await searchConfig.shutdown();
```

### Health Monitoring

```javascript
const healthStatus = await searchConfig.getHealthStatus();
console.log('Search Infrastructure Health:', healthStatus);
```

### Cache Usage

```javascript
const cache = searchConfig.getSearchCache();

// Cache search results
await cache.cacheSearchResults(searchParams, results);

// Get cached results
const cached = await cache.getCachedSearchResults(searchParams);
```

## Installation

1. Install required dependencies:
```bash
npm install @elastic/elasticsearch redis
```

2. Set up environment variables (see `search.env.example`)

3. Start Elasticsearch and Redis services

4. Initialize the search infrastructure:
```javascript
const searchConfig = require('./config/searchConfig');
await searchConfig.initialize();
```

## Testing

Run the search infrastructure tests:
```bash
npm test -- --testPathPattern=searchConfig.test.js
npm test -- --testPathPattern=searchTypes.test.js
```

## Requirements Mapping

This implementation addresses the following requirements:

- **Requirement 1.1**: Fast keyword search with Elasticsearch full-text search
- **Requirement 1.2**: Sub-2-second response times with Redis caching
- **Requirement 7.1**: Real-time event indexing (5-minute indexing window)

## Performance Considerations

- **Elasticsearch**: Optimized index settings for fast queries
- **Redis Caching**: Layered caching strategy with appropriate TTLs
- **Connection Management**: Robust connection handling with retry logic
- **Memory Usage**: Efficient cache key generation and cleanup

## Monitoring

The configuration includes built-in health monitoring:
- Connection status for both Elasticsearch and Redis
- Performance metrics and statistics
- Error logging and alerting capabilities

## Security

- Optional authentication for Elasticsearch
- Secure Redis connection handling
- Input validation and sanitization
- Error message sanitization to prevent information leakage