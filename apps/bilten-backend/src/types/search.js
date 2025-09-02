/**
 * Search Types and Interfaces
 * Defines data structures for search functionality
 * Note: Using JSDoc for type definitions since this is a JavaScript project
 */

/**
 * @typedef {Object} SearchQuery
 * @property {string} query - The search query string
 * @property {SearchFilters} [filters] - Optional filters to apply
 * @property {SearchPagination} [pagination] - Pagination parameters
 * @property {SearchSort} [sort] - Sorting parameters
 */

/**
 * @typedef {Object} SearchFilters
 * @property {LocationFilter} [location] - Location-based filtering
 * @property {DateFilter} [date] - Date range filtering
 * @property {string[]} [categories] - Event categories to filter by
 * @property {PriceFilter} [price] - Price range filtering
 * @property {string[]} [tags] - Tags to filter by
 * @property {string} [organizer] - Organizer ID to filter by
 * @property {boolean} [isFree] - Filter for free events only
 * @property {boolean} [isFeatured] - Filter for featured events only
 */

/**
 * @typedef {Object} LocationFilter
 * @property {string} [city] - City name
 * @property {string} [country] - Country name
 * @property {GeoPoint} [coordinates] - Geographic coordinates
 * @property {number} [radius] - Search radius in kilometers
 * @property {string} [address] - Specific address
 */

/**
 * @typedef {Object} GeoPoint
 * @property {number} lat - Latitude
 * @property {number} lon - Longitude
 */

/**
 * @typedef {Object} DateFilter
 * @property {Date|string} [start] - Start date
 * @property {Date|string} [end] - End date
 * @property {string} [period] - Predefined period (today, tomorrow, this_week, this_month)
 */

/**
 * @typedef {Object} PriceFilter
 * @property {number} [min] - Minimum price
 * @property {number} [max] - Maximum price
 * @property {string} [currency] - Currency code
 */

/**
 * @typedef {Object} SearchPagination
 * @property {number} [page] - Page number (1-based)
 * @property {number} [limit] - Number of results per page
 * @property {number} [offset] - Offset for results
 */

/**
 * @typedef {Object} SearchSort
 * @property {string} field - Field to sort by (relevance, date, price, popularity)
 * @property {string} order - Sort order (asc, desc)
 */

/**
 * @typedef {Object} SearchResponse
 * @property {SearchResult[]} results - Array of search results
 * @property {SearchMetadata} metadata - Search metadata
 * @property {SearchAggregations} [aggregations] - Search aggregations
 */

/**
 * @typedef {Object} SearchResult
 * @property {string} id - Event ID
 * @property {string} title - Event title
 * @property {string} description - Event description
 * @property {string} category - Event category
 * @property {string[]} tags - Event tags
 * @property {EventLocation} location - Event location
 * @property {Date|string} date - Event date
 * @property {Date|string} [endDate] - Event end date
 * @property {number} [price] - Event price
 * @property {string} [currency] - Price currency
 * @property {EventOrganizer} organizer - Event organizer
 * @property {number} popularityScore - Popularity score
 * @property {EventStats} stats - Event statistics
 * @property {string} status - Event status
 * @property {boolean} isFeatured - Whether event is featured
 * @property {boolean} isFree - Whether event is free
 * @property {number} [capacity] - Event capacity
 * @property {number} [availableTickets] - Available tickets
 * @property {Date|string} createdAt - Creation timestamp
 * @property {Date|string} updatedAt - Last update timestamp
 * @property {number} [relevanceScore] - Search relevance score
 */

/**
 * @typedef {Object} EventLocation
 * @property {string} name - Location name
 * @property {GeoPoint} [coordinates] - Geographic coordinates
 * @property {string} city - City name
 * @property {string} country - Country name
 * @property {string} [address] - Full address
 */

/**
 * @typedef {Object} EventOrganizer
 * @property {string} id - Organizer ID
 * @property {string} name - Organizer name
 * @property {string} [avatar] - Organizer avatar URL
 * @property {boolean} [isVerified] - Whether organizer is verified
 */

/**
 * @typedef {Object} EventStats
 * @property {number} viewCount - Number of views
 * @property {number} bookmarkCount - Number of bookmarks
 * @property {number} registrationCount - Number of registrations
 */

/**
 * @typedef {Object} SearchMetadata
 * @property {number} total - Total number of results
 * @property {number} page - Current page
 * @property {number} limit - Results per page
 * @property {number} pages - Total number of pages
 * @property {number} took - Search execution time in milliseconds
 * @property {boolean} hasMore - Whether there are more results
 */

/**
 * @typedef {Object} SearchAggregations
 * @property {CategoryAggregation[]} [categories] - Category aggregations
 * @property {LocationAggregation[]} [locations] - Location aggregations
 * @property {PriceRangeAggregation} [priceRanges] - Price range aggregations
 * @property {TagAggregation[]} [tags] - Tag aggregations
 */

/**
 * @typedef {Object} CategoryAggregation
 * @property {string} category - Category name
 * @property {number} count - Number of events in category
 */

/**
 * @typedef {Object} LocationAggregation
 * @property {string} city - City name
 * @property {string} country - Country name
 * @property {number} count - Number of events in location
 */

/**
 * @typedef {Object} PriceRangeAggregation
 * @property {PriceRange[]} ranges - Price ranges
 */

/**
 * @typedef {Object} PriceRange
 * @property {number} min - Minimum price
 * @property {number} max - Maximum price
 * @property {number} count - Number of events in range
 */

/**
 * @typedef {Object} TagAggregation
 * @property {string} tag - Tag name
 * @property {number} count - Number of events with tag
 */

/**
 * @typedef {Object} AutocompleteRequest
 * @property {string} query - Partial query string
 * @property {number} [limit] - Maximum number of suggestions
 * @property {string[]} [categories] - Categories to limit suggestions to
 */

/**
 * @typedef {Object} AutocompleteResponse
 * @property {AutocompleteSuggestion[]} suggestions - Array of suggestions
 * @property {number} took - Response time in milliseconds
 */

/**
 * @typedef {Object} AutocompleteSuggestion
 * @property {string} text - Suggestion text
 * @property {string} type - Suggestion type (event, category, location, organizer)
 * @property {number} score - Relevance score
 * @property {Object} [metadata] - Additional metadata
 */

/**
 * @typedef {Object} SavedSearch
 * @property {string} id - Saved search ID
 * @property {string} userId - User ID
 * @property {string} name - Search name
 * @property {string} query - Search query
 * @property {SearchFilters} filters - Search filters
 * @property {boolean} alertEnabled - Whether alerts are enabled
 * @property {Date|string} createdAt - Creation timestamp
 * @property {Date|string} lastExecuted - Last execution timestamp
 */

/**
 * @typedef {Object} UserPreferences
 * @property {string} userId - User ID
 * @property {string[]} categories - Preferred categories
 * @property {string[]} locations - Preferred locations
 * @property {PriceFilter} priceRange - Preferred price range
 * @property {string[]} eventTypes - Preferred event types
 * @property {EventInteraction[]} interactionHistory - User interaction history
 * @property {Date|string} updatedAt - Last update timestamp
 */

/**
 * @typedef {Object} EventInteraction
 * @property {string} eventId - Event ID
 * @property {string} type - Interaction type (view, bookmark, register, share)
 * @property {Date|string} timestamp - Interaction timestamp
 * @property {number} weight - Interaction weight for recommendations
 */

/**
 * @typedef {Object} RecommendationRequest
 * @property {string} userId - User ID
 * @property {number} [limit] - Maximum number of recommendations
 * @property {string[]} [excludeEventIds] - Event IDs to exclude
 * @property {string} [context] - Recommendation context (homepage, search, event_detail)
 */

/**
 * @typedef {Object} RecommendationResponse
 * @property {RecommendationResult[]} recommendations - Array of recommendations
 * @property {RecommendationMetadata} metadata - Recommendation metadata
 */

/**
 * @typedef {Object} RecommendationResult
 * @property {SearchResult} event - Event details
 * @property {number} score - Recommendation score
 * @property {string} reason - Reason for recommendation
 * @property {string[]} [tags] - Recommendation tags
 */

/**
 * @typedef {Object} RecommendationMetadata
 * @property {string} algorithm - Algorithm used
 * @property {number} took - Generation time in milliseconds
 * @property {boolean} hasPersonalization - Whether personalization was used
 */

/**
 * @typedef {Object} TrendingEventsRequest
 * @property {string} [location] - Location filter
 * @property {string} [timeframe] - Timeframe (day, week, month)
 * @property {number} [limit] - Maximum number of events
 * @property {string[]} [categories] - Categories to include
 */

/**
 * @typedef {Object} TrendingEventsResponse
 * @property {TrendingEvent[]} events - Array of trending events
 * @property {TrendingMetadata} metadata - Trending metadata
 */

/**
 * @typedef {Object} TrendingEvent
 * @property {SearchResult} event - Event details
 * @property {number} trendingScore - Trending score
 * @property {TrendingStats} stats - Trending statistics
 */

/**
 * @typedef {Object} TrendingStats
 * @property {number} viewGrowth - View growth percentage
 * @property {number} bookmarkGrowth - Bookmark growth percentage
 * @property {number} registrationGrowth - Registration growth percentage
 * @property {string} period - Period for growth calculation
 */

/**
 * @typedef {Object} TrendingMetadata
 * @property {string} timeframe - Timeframe used
 * @property {Date|string} calculatedAt - Calculation timestamp
 * @property {number} totalEvents - Total events considered
 */

/**
 * @typedef {Object} SearchError
 * @property {string} code - Error code
 * @property {string} message - Error message
 * @property {string} [details] - Additional error details
 * @property {Date|string} timestamp - Error timestamp
 */

// Export types for use in other modules
module.exports = {
  // Type validation helpers
  validateSearchQuery: (query) => {
    return query !== null && typeof query === 'object' && typeof query.query === 'string';
  },
  
  validateSearchFilters: (filters) => {
    return filters !== null && typeof filters === 'object';
  },
  
  validatePagination: (pagination) => {
    return pagination !== null && typeof pagination === 'object' && 
           (!pagination.page || typeof pagination.page === 'number') &&
           (!pagination.limit || typeof pagination.limit === 'number');
  },

  // Default values
  DEFAULT_PAGINATION: {
    page: 1,
    limit: 20
  },
  
  DEFAULT_SORT: {
    field: 'relevance',
    order: 'desc'
  },
  
  SEARCH_LIMITS: {
    MAX_QUERY_LENGTH: 500,
    MAX_RESULTS_PER_PAGE: 100,
    MAX_AUTOCOMPLETE_SUGGESTIONS: 10
  },
  
  INTERACTION_WEIGHTS: {
    view: 1,
    bookmark: 3,
    register: 5,
    share: 2
  }
};