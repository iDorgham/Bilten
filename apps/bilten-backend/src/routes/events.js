const express = require('express');
const router = express.Router();

// Services
const MediaService = require('../services/MediaService');
const EventSearchService = require('../services/EventSearchService');

// Models
const Event = require('../models/Event');

// Utils
const logger = require('../utils/logger');

// Mock events data (fallback for when database is not available)
const mockEvents = [
  {
    id: "550e8400-e29b-41d4-a716-446655440101",
    title: "Artbat - Deep Techno Journey",
    description: "Experience the hypnotic deep techno sounds of Artbat in an immersive night of electronic music at Cairo's premier venue.",
    category: "deep-techno",
    venue_name: "Cairo Opera House",
    venue_address: "Gezira Island, Cairo, Egypt",
    city: "Cairo",
    country: "Egypt",
    start_date: "2025-03-15T21:00:00Z",
    end_date: "2025-03-16T03:00:00Z",
    timezone: "Africa/Cairo",
    max_attendees: 2500,
    is_free: false,
    base_price: 1500.00,
    status: "published",
    cover_image_url: "https://images.unsplash.com/photo-1571266028243-d220c9c3b2d2?w=800&h=400&fit=crop",
    organizer_first_name: "Ahmed",
    organizer_last_name: "Hassan",
    view_count: 1250,
    bookmark_count: 89,
    registration_count: 234,
    popularity_score: 8.5,
    created_at: "2024-12-01T10:00:00Z",
    updated_at: "2024-12-02T15:30:00Z"
  },
  {
    id: "live-event-test-001",
    title: "Live Test Event - Electronic Music Night",
    description: "A test event that is currently live for testing the scanner functionality.",
    category: "electronic",
    venue_name: "Test Venue",
    venue_address: "Test Address, Test City",
    city: "Test City",
    country: "Test Country",
    start_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    timezone: "UTC",
    max_attendees: 500,
    is_free: false,
    base_price: 50.00,
    status: "published",
    cover_image_url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop",
    organizer_first_name: "Test",
    organizer_last_name: "Organizer",
    view_count: 45,
    bookmark_count: 12,
    registration_count: 23,
    popularity_score: 6.2,
    created_at: "2024-12-02T08:00:00Z",
    updated_at: "2024-12-02T12:00:00Z"
  }
];

// Get all events with search and filtering
router.get('/', async (req, res) => {
  try {
    const {
      // Search parameters
      q: query,
      search,
      
      // Filter parameters
      category,
      status = 'published',
      city,
      country,
      is_free,
      is_featured,
      organizer_id,
      price_min,
      price_max,
      start_date,
      end_date,
      tags,
      
      // Pagination
      page = 1,
      limit = 20,
      
      // Sorting
      sort_by = 'start_date',
      sort_order = 'asc',
      
      // Search mode
      use_elasticsearch = 'false'
    } = req.query;

    const searchText = query || search;
    const pagination = {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100) // Cap at 100 results per page
    };

    const sort = {
      field: sort_by,
      order: sort_order
    };

    let result;

    // Use Elasticsearch for advanced search if available and requested
    if (use_elasticsearch === 'true' && searchText) {
      try {
        const searchQuery = {
          query: searchText,
          filters: {
            categories: category && category !== 'all' ? [category] : undefined,
            location: {
              city: city || undefined,
              country: country || undefined
            },
            price: {
              min: price_min ? parseFloat(price_min) : undefined,
              max: price_max ? parseFloat(price_max) : undefined
            },
            isFree: is_free === 'true' ? true : undefined,
            isFeatured: is_featured === 'true' ? true : undefined,
            organizer: organizer_id || undefined,
            date: {
              start: start_date || undefined,
              end: end_date || undefined
            },
            tags: tags ? tags.split(',') : undefined
          },
          pagination,
          sort
        };

        const searchResult = await EventSearchService.searchEvents(searchQuery);
        
        return res.json({
          data: {
            events: searchResult.results,
            pagination: searchResult.metadata,
            aggregations: searchResult.aggregations,
            search_metadata: {
              query: searchText,
              took: searchResult.metadata.took,
              search_engine: 'elasticsearch'
            }
          }
        });
      } catch (searchError) {
        logger.warn('Elasticsearch search failed, falling back to database:', searchError.message);
      }
    }

    // Use database search (fallback or default)
    try {
      const filters = {
        category: category && category !== 'all' ? category : undefined,
        status,
        city,
        country,
        is_free: is_free === 'true' ? true : is_free === 'false' ? false : undefined,
        is_featured: is_featured === 'true' ? true : is_featured === 'false' ? false : undefined,
        organizer_id,
        price_min: price_min ? parseFloat(price_min) : undefined,
        price_max: price_max ? parseFloat(price_max) : undefined,
        start_date,
        end_date,
        search: searchText
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      result = await Event.findWithFilters(filters, pagination, sort);
      
      return res.json({
        data: {
          events: result.events,
          pagination: result.pagination,
          search_metadata: {
            query: searchText || null,
            search_engine: 'database'
          }
        }
      });
    } catch (dbError) {
      logger.warn('Database search failed, using mock data:', dbError.message);
      
      // Fallback to mock data
      let filteredEvents = [...mockEvents];
      
      if (category && category !== 'all') {
        filteredEvents = filteredEvents.filter(event => event.category === category);
      }
      
      if (status) {
        filteredEvents = filteredEvents.filter(event => event.status === status);
      }

      if (searchText) {
        const searchLower = searchText.toLowerCase();
        filteredEvents = filteredEvents.filter(event => 
          event.title.toLowerCase().includes(searchLower) ||
          event.description.toLowerCase().includes(searchLower) ||
          event.venue_name.toLowerCase().includes(searchLower) ||
          event.category.toLowerCase().includes(searchLower)
        );
      }

      if (city) {
        filteredEvents = filteredEvents.filter(event => 
          event.city && event.city.toLowerCase().includes(city.toLowerCase())
        );
      }

      if (is_free === 'true') {
        filteredEvents = filteredEvents.filter(event => event.is_free);
      }

      if (price_min) {
        filteredEvents = filteredEvents.filter(event => event.base_price >= parseFloat(price_min));
      }

      if (price_max) {
        filteredEvents = filteredEvents.filter(event => event.base_price <= parseFloat(price_max));
      }
      
      const offset = (pagination.page - 1) * pagination.limit;
      const paginatedEvents = filteredEvents.slice(offset, offset + pagination.limit);
      
      return res.json({
        data: {
          events: paginatedEvents,
          pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total: filteredEvents.length,
            pages: Math.ceil(filteredEvents.length / pagination.limit),
            hasMore: filteredEvents.length > (pagination.page * pagination.limit)
          },
          search_metadata: {
            query: searchText || null,
            search_engine: 'mock'
          }
        }
      });
    }
  } catch (error) {
    logger.error('Error in events search:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to search events'
    });
  }
});

// Search autocomplete suggestions
router.get('/search/autocomplete', async (req, res) => {
  try {
    const { q: query, limit = 10 } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.json({
        data: {
          suggestions: []
        }
      });
    }

    try {
      const suggestions = await EventSearchService.getSearchSuggestions(query.trim(), parseInt(limit));
      
      res.json({
        data: {
          suggestions: suggestions.map(suggestion => ({
            text: suggestion.text,
            type: suggestion.type,
            score: suggestion.score,
            count: suggestion.count
          }))
        }
      });
    } catch (searchError) {
      logger.warn('Autocomplete search failed:', searchError.message);
      
      // Fallback to simple text matching on mock data
      const queryLower = query.toLowerCase();
      const suggestions = [];
      
      // Add event title suggestions
      mockEvents
        .filter(event => 
          event.title.toLowerCase().includes(queryLower) ||
          event.venue_name.toLowerCase().includes(queryLower)
        )
        .slice(0, parseInt(limit) / 2)
        .forEach(event => {
          suggestions.push({
            text: event.title,
            type: 'event',
            score: 1.0
          });
        });

      // Add category suggestions
      const categories = [...new Set(mockEvents.map(e => e.category))]
        .filter(cat => cat.toLowerCase().includes(queryLower))
        .slice(0, 3);
      
      categories.forEach(category => {
        suggestions.push({
          text: category,
          type: 'category',
          score: 0.8
        });
      });

      // Add location suggestions
      const cities = [...new Set(mockEvents.map(e => e.city).filter(Boolean))]
        .filter(city => city.toLowerCase().includes(queryLower))
        .slice(0, 3);
      
      cities.forEach(city => {
        suggestions.push({
          text: city,
          type: 'location',
          score: 0.6
        });
      });

      res.json({
        data: { suggestions: suggestions.slice(0, parseInt(limit)) }
      });
    }
  } catch (error) {
    logger.error('Error in autocomplete:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get autocomplete suggestions'
    });
  }
});

// Get trending events
router.get('/search/trending', async (req, res) => {
  try {
    const { limit = 20, timeframe = 'week' } = req.query;

    try {
      const trendingEvents = await EventSearchService.getTrendingEvents({}, parseInt(limit));
      
      res.json({
        data: {
          events: trendingEvents.results,
          metadata: {
            timeframe,
            total: trendingEvents.results.length,
            generated_at: new Date().toISOString()
          }
        }
      });
    } catch (searchError) {
      logger.warn('Trending events search failed, using database:', searchError.message);
      
      try {
        const trendingEvents = await Event.getTrending(parseInt(limit), timeframe);
        
        res.json({
          data: {
            events: trendingEvents,
            metadata: {
              timeframe,
              total: trendingEvents.length,
              generated_at: new Date().toISOString(),
              source: 'database'
            }
          }
        });
      } catch (dbError) {
        logger.warn('Database trending failed, using mock data:', dbError.message);
        
        // Fallback to mock data sorted by popularity
        const trending = [...mockEvents]
          .sort((a, b) => (b.popularity_score || 0) - (a.popularity_score || 0))
          .slice(0, parseInt(limit));

        res.json({
          data: {
            events: trending,
            metadata: {
              timeframe,
              total: trending.length,
              generated_at: new Date().toISOString(),
              source: 'mock'
            }
          }
        });
      }
    }
  } catch (error) {
    logger.error('Error getting trending events:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get trending events'
    });
  }
});

// Search events by location
router.get('/search/location', async (req, res) => {
  try {
    const { 
      lat, 
      lon, 
      radius = 10, 
      page = 1, 
      limit = 20,
      category,
      price_min,
      price_max,
      is_free
    } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Latitude and longitude are required'
      });
    }

    const coordinates = {
      lat: parseFloat(lat),
      lon: parseFloat(lon)
    };

    const filters = {
      categories: category && category !== 'all' ? [category] : undefined,
      price: {
        min: price_min ? parseFloat(price_min) : undefined,
        max: price_max ? parseFloat(price_max) : undefined
      },
      isFree: is_free === 'true' ? true : undefined
    };

    const pagination = {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100)
    };

    try {
      const searchResult = await EventSearchService.searchByLocation(
        coordinates, 
        parseFloat(radius), 
        filters, 
        pagination
      );
      
      res.json({
        data: {
          events: searchResult.results,
          pagination: searchResult.metadata,
          search_metadata: {
            coordinates,
            radius: parseFloat(radius),
            search_engine: 'elasticsearch'
          }
        }
      });
    } catch (searchError) {
      logger.warn('Location search failed, using database fallback:', searchError.message);
      
      // Fallback to mock data (in real implementation, would use PostGIS)
      const filteredEvents = mockEvents.filter(event => {
        if (category && category !== 'all' && event.category !== category) return false;
        if (is_free === 'true' && !event.is_free) return false;
        if (price_min && event.base_price < parseFloat(price_min)) return false;
        if (price_max && event.base_price > parseFloat(price_max)) return false;
        return true;
      });

      const offset = (pagination.page - 1) * pagination.limit;
      const paginatedEvents = filteredEvents.slice(offset, offset + pagination.limit);
      
      res.json({
        data: {
          events: paginatedEvents,
          pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total: filteredEvents.length,
            pages: Math.ceil(filteredEvents.length / pagination.limit),
            hasMore: filteredEvents.length > (pagination.page * pagination.limit)
          },
          search_metadata: {
            coordinates,
            radius: parseFloat(radius),
            search_engine: 'mock'
          }
        }
      });
    }
  } catch (error) {
    logger.error('Error in location search:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to search events by location'
    });
  }
});

// Get similar events
router.get('/search/similar/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { limit = 10 } = req.query;

    try {
      const similarEvents = await EventSearchService.getSimilarEvents(eventId, parseInt(limit));
      
      res.json({
        data: {
          events: similarEvents.results,
          metadata: {
            source_event_id: eventId,
            total: similarEvents.results.length,
            search_engine: 'elasticsearch'
          }
        }
      });
    } catch (searchError) {
      logger.warn('Similar events search failed, using database fallback:', searchError.message);
      
      // Fallback to mock data
      const sourceEvent = mockEvents.find(e => e.id === eventId);
      if (!sourceEvent) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Source event not found'
        });
      }

      const similarEvents = mockEvents
        .filter(event => 
          event.id !== eventId && 
          (event.category === sourceEvent.category || 
           event.city === sourceEvent.city ||
           event.organizer_first_name === sourceEvent.organizer_first_name)
        )
        .slice(0, parseInt(limit));

      res.json({
        data: {
          events: similarEvents,
          metadata: {
            source_event_id: eventId,
            total: similarEvents.length,
            search_engine: 'mock'
          }
        }
      });
    }
  } catch (error) {
    logger.error('Error getting similar events:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get similar events'
    });
  }
});

// Get search filters/facets
router.get('/search/filters', async (req, res) => {
  try {
    let categories = [];
    let locations = [];

    try {
      categories = await Event.getCategories();
      locations = await Event.getLocations();
    } catch (dbError) {
      logger.warn('Database filters failed, using mock data:', dbError.message);
      
      // Generate categories from mock data
      const categoryMap = {};
      mockEvents.forEach(event => {
        categoryMap[event.category] = (categoryMap[event.category] || 0) + 1;
      });
      
      categories = Object.entries(categoryMap).map(([category, count]) => ({
        category,
        count
      }));

      // Generate locations from mock data
      const locationMap = {};
      mockEvents.forEach(event => {
        if (event.city && event.country) {
          const key = `${event.city}, ${event.country}`;
          locationMap[key] = (locationMap[key] || 0) + 1;
        }
      });
      
      locations = Object.entries(locationMap).map(([location, count]) => {
        const [city, country] = location.split(', ');
        return { city, country, count };
      });
    }

    res.json({
      data: {
        categories,
        locations,
        price_ranges: [
          { range: 'free', min: 0, max: 0, label: 'Free' },
          { range: 'under_50', min: 0.01, max: 50, label: 'Under $50' },
          { range: '50_100', min: 50, max: 100, label: '$50 - $100' },
          { range: '100_200', min: 100, max: 200, label: '$100 - $200' },
          { range: 'over_200', min: 200, max: null, label: 'Over $200' }
        ],
        date_ranges: [
          { range: 'today', label: 'Today' },
          { range: 'tomorrow', label: 'Tomorrow' },
          { range: 'this_week', label: 'This Week' },
          { range: 'this_month', label: 'This Month' }
        ]
      }
    });
  } catch (error) {
    logger.error('Error getting search filters:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get search filters'
    });
  }
});

// Get event by ID
router.get('/:id', async (req, res) => {
  try {
    let event = null;

    // Try to get from database first
    try {
      event = await Event.findById(req.params.id);
      
      // Increment view count
      if (event) {
        await Event.incrementViewCount(req.params.id);
        event.view_count = (event.view_count || 0) + 1;
      }
    } catch (dbError) {
      logger.warn('Database event fetch failed, using mock data:', dbError.message);
      event = mockEvents.find(e => e.id === req.params.id);
    }
    
    if (!event) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Event not found'
      });
    }

    // Get event media
    let media = [];
    try {
      media = await MediaService.getEventMedia(req.params.id);
    } catch (mediaError) {
      logger.warn('Could not fetch event media:', mediaError.message);
    }

    // Get primary image
    const primaryImage = media.find(m => m.is_primary && m.media_type === 'image');
    if (primaryImage) {
      event.cover_image_url = primaryImage.file_path;
    }
    
    res.json({
      data: {
        event: {
          ...event,
          media: media
        },
        tickets: [
          {
            id: 1,
            event_id: event.id,
            name: "General Admission",
            price: event.base_price,
            quantity_available: 100,
            is_active: true
          }
        ]
      }
    });
  } catch (error) {
    logger.error('Error fetching event:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch event'
    });
  }
});

// Create event
router.post('/', async (req, res) => {
  try {
    const eventData = {
      ...req.body,
      status: 'draft',
      organizer_first_name: req.body.organizer_first_name || 'Current',
      organizer_last_name: req.body.organizer_last_name || 'User',
      organizer_id: req.body.organizer_id || 'default-organizer-id',
      view_count: 0,
      bookmark_count: 0,
      registration_count: 0,
      popularity_score: 0
    };

    let newEvent;

    try {
      // Try to create in database
      newEvent = await Event.create(eventData);
      
      // Index in Elasticsearch if available
      try {
        await EventSearchService.indexEvent(newEvent);
      } catch (indexError) {
        logger.warn('Failed to index event in Elasticsearch:', indexError.message);
      }
    } catch (dbError) {
      logger.warn('Database event creation failed:', dbError.message);
      
      // Fallback to mock creation
      newEvent = {
        id: `event_${Date.now()}`,
        ...eventData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      mockEvents.push(newEvent);
    }
    
    res.status(201).json({
      data: { event: newEvent }
    });
  } catch (error) {
    logger.error('Error creating event:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create event'
    });
  }
});

// Update event
router.put('/:id', async (req, res) => {
  try {
    const eventId = req.params.id;
    const updateData = {
      ...req.body,
      updated_at: new Date().toISOString()
    };

    let updatedEvent;

    try {
      // Try to update in database
      updatedEvent = await Event.update(eventId, updateData);
      
      if (!updatedEvent) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Event not found'
        });
      }
      
      // Update in Elasticsearch if available
      try {
        await EventSearchService.indexEvent(updatedEvent);
      } catch (indexError) {
        logger.warn('Failed to update event in Elasticsearch:', indexError.message);
      }
    } catch (dbError) {
      logger.warn('Database event update failed:', dbError.message);
      
      // Fallback to mock update
      const eventIndex = mockEvents.findIndex(e => e.id === eventId);
      if (eventIndex === -1) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Event not found'
        });
      }
      
      mockEvents[eventIndex] = {
        ...mockEvents[eventIndex],
        ...updateData
      };
      
      updatedEvent = mockEvents[eventIndex];
    }
    
    res.json({
      data: { event: updatedEvent }
    });
  } catch (error) {
    logger.error('Error updating event:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update event'
    });
  }
});

// Delete event
router.delete('/:id', async (req, res) => {
  try {
    const eventId = req.params.id;

    try {
      // Try to delete from database (soft delete)
      const deletedEvent = await Event.delete(eventId);
      
      if (!deletedEvent) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Event not found'
        });
      }
      
      // Remove from Elasticsearch if available
      try {
        await EventSearchService.deleteEvent(eventId);
      } catch (indexError) {
        logger.warn('Failed to delete event from Elasticsearch:', indexError.message);
      }
    } catch (dbError) {
      logger.warn('Database event deletion failed:', dbError.message);
      
      // Fallback to mock deletion
      const eventIndex = mockEvents.findIndex(e => e.id === eventId);
      if (eventIndex === -1) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Event not found'
        });
      }
      
      mockEvents.splice(eventIndex, 1);
    }
    
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting event:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete event'
    });
  }
});

module.exports = router;
