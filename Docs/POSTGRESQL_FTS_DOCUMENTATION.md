# PostgreSQL Full-Text Search (FTS) Implementation

## Overview

PostgreSQL Full-Text Search implementation for Bilten platform with advanced search capabilities across events, articles, and users.

## 🏗️ Architecture

### Database Schema
- **Generated Columns**: `fts_title`, `fts_description`, `fts_venue` (events)
- **GIN Indexes**: Fast full-text search with relevance scoring
- **Search Service**: `FTSService` class with specialized methods

## 📊 Features

### Core Capabilities
1. **Full-Text Search** - Natural language search with relevance scoring
2. **Multi-Content Search** - Events, articles, users
3. **Advanced Filtering** - Category, date, status, role filters
4. **Sorting Options** - Relevance, date, title, popularity

### Enhanced Features
1. **Search Suggestions** - Real-time autocomplete
2. **Trending Searches** - Popular terms with time ranges
3. **Text Highlighting** - Highlight search terms in results
4. **Search Statistics** - Index coverage and performance metrics

## 🔧 API Endpoints

### Base URL: `/api/v1/fts`

#### Core Search
```http
GET /search?q=music festival&type=all&page=1&limit=10
GET /events?q=concert&category=music
GET /articles?q=technology&sortBy=popularity
GET /users?q=john&role=organizer
```

#### Enhanced Features
```http
GET /suggestions?q=mus&type=events&limit=5
GET /trending?timeRange=7d&limit=10
POST /highlight
GET /stats
POST /reindex
```

## 📝 Response Format

```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "uuid",
        "title": "Summer Music Festival",
        "relevance_score": 0.85
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 45,
      "pages": 5
    }
  }
}
```

## 🚀 Performance

### Database Indexes
```sql
CREATE INDEX events_fts_combined_idx ON events USING GIN (
  fts_title || fts_description || fts_venue
);
```

### Relevance Scoring
```sql
ts_rank_cd(
  events.fts_title || events.fts_description || events.fts_venue,
  to_tsquery('english', 'music & festival')
) as relevance_score
```

## 🔒 Security

- Input validation and sanitization
- Role-based access control
- Rate limiting
- Query escaping

## 🧪 Testing

```javascript
// Unit tests for search functionality
test('should search events with relevance scoring', async () => {
  const results = await FTSService.searchEvents('music festival');
  expect(results.events[0]).toHaveProperty('relevance_score');
});
```

## 📈 Monitoring

- Query response times
- Index hit rates
- Search usage analytics
- Index health monitoring

## 🔄 Deployment

1. **Run Migration**: `npm run migrate`
2. **Verify Indexes**: Check GIN indexes creation
3. **Test Search**: Validate API endpoints
4. **Monitor Performance**: Track search metrics

## 🛠️ Troubleshooting

### Common Issues
- **Slow Performance**: Check GIN index usage
- **Missing Results**: Verify tsvector columns
- **Index Issues**: Monitor generated columns

### Debug Queries
```sql
EXPLAIN ANALYZE SELECT * FROM events 
WHERE fts_title @@ to_tsquery('english', 'music');
```

## 📚 Resources

- [PostgreSQL FTS Documentation](https://www.postgresql.org/docs/current/textsearch.html)
- [GIN Indexes](https://www.postgresql.org/docs/current/gin.html)
- [ts_rank_cd Function](https://www.postgresql.org/docs/current/textsearch-controls.html)

---

This implementation provides robust, scalable search capabilities with advanced features for optimal user experience.
