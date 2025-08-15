const db = require('../utils/database');
const redis = require('../config/redis');
const logger = require('../utils/logger');

class RecommendationService {
  constructor() {
    this.cacheExpiry = 3600; // 1 hour
  }

  /**
   * Get personalized event recommendations for a user
   */
  async getRecommendations(userId, limit = 10, options = {}) {
    try {
      const cacheKey = `recommendations:${userId}:${JSON.stringify(options)}`;
      
      // Check cache first
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const recommendations = await this.generateRecommendations(userId, limit, options);
      
      // Cache results
      await redis.setex(cacheKey, this.cacheExpiry, JSON.stringify(recommendations));
      
      return recommendations;
    } catch (error) {
      logger.error('Error getting recommendations:', error);
      throw new Error('Failed to get recommendations');
    }
  }

  /**
   * Generate recommendations using multiple algorithms
   */
  async generateRecommendations(userId, limit, options) {
    const { includeTrending = true, includeSimilar = true, includePopular = true } = options;
    
    let recommendations = [];

    // Get user preferences
    const userPreferences = await this.getUserPreferences(userId);
    
    // Content-based filtering
    if (userPreferences.categories.length > 0 || userPreferences.organizers.length > 0) {
      const contentBased = await this.getContentBasedRecommendations(userId, userPreferences, limit);
      recommendations.push(...contentBased);
    }

    // Collaborative filtering
    const collaborative = await this.getCollaborativeRecommendations(userId, limit);
    recommendations.push(...collaborative);

    // Trending events
    if (includeTrending) {
      const trending = await this.getTrendingEvents(limit / 2);
      recommendations.push(...trending);
    }

    // Popular events in user's area
    if (includePopular) {
      const popular = await this.getPopularEvents(userId, limit / 2);
      recommendations.push(...popular);
    }

    // Remove duplicates and sort by relevance score
    recommendations = this.deduplicateAndSort(recommendations, limit);
    
    return recommendations;
  }

  /**
   * Get user preferences based on behavior
   */
  async getUserPreferences(userId) {
    try {
      // Get user's event history
      const eventHistory = await db('tickets')
        .join('events', 'tickets.event_id', 'events.id')
        .where('tickets.user_id', userId)
        .select('events.category', 'events.organizer_id', 'events.price', 'events.location')
        .whereNotNull('tickets.purchased_at');

      // Get user's wishlist
      const wishlist = await db('wishlist')
        .join('events', 'wishlist.event_id', 'events.id')
        .where('wishlist.user_id', userId)
        .select('events.category', 'events.organizer_id', 'events.price', 'events.location');

      // Get user's search history
      const searchHistory = await db('search_history')
        .where('user_id', userId)
        .orderBy('created_at', 'desc')
        .limit(50)
        .select('search_term', 'category', 'location');

      // Analyze preferences
      const preferences = {
        categories: this.analyzeCategories([...eventHistory, ...wishlist]),
        organizers: this.analyzeOrganizers([...eventHistory, ...wishlist]),
        priceRange: this.analyzePriceRange([...eventHistory, ...wishlist]),
        locations: this.analyzeLocations([...eventHistory, ...wishlist, ...searchHistory]),
        searchTerms: this.analyzeSearchTerms(searchHistory)
      };

      return preferences;
    } catch (error) {
      logger.error('Error getting user preferences:', error);
      return {
        categories: [],
        organizers: [],
        priceRange: { min: 0, max: 1000 },
        locations: [],
        searchTerms: []
      };
    }
  }

  /**
   * Content-based filtering based on user preferences
   */
  async getContentBasedRecommendations(userId, preferences, limit) {
    try {
      let query = db('events')
        .where('events.status', 'published')
        .where('events.start_date', '>', new Date())
        .whereNotIn('events.id', function() {
          this.select('event_id').from('tickets').where('user_id', userId);
        });

      // Filter by preferred categories
      if (preferences.categories.length > 0) {
        query = query.whereIn('events.category', preferences.categories);
      }

      // Filter by preferred organizers
      if (preferences.organizers.length > 0) {
        query = query.whereIn('events.organizer_id', preferences.organizers);
      }

      // Filter by price range
      if (preferences.priceRange) {
        query = query.whereBetween('events.price', [
          preferences.priceRange.min,
          preferences.priceRange.max
        ]);
      }

      const events = await query
        .select(
          'events.*',
          db.raw('CASE WHEN events.category IN (?) THEN 1.5 ELSE 1 END as relevance_score', [preferences.categories]),
          db.raw('CASE WHEN events.organizer_id IN (?) THEN 1.3 ELSE 1 END as organizer_score', [preferences.organizers])
        )
        .orderBy('relevance_score', 'desc')
        .orderBy('organizer_score', 'desc')
        .orderBy('events.start_date', 'asc')
        .limit(limit);

      return events.map(event => ({
        ...event,
        recommendationType: 'content_based',
        confidence: this.calculateConfidence(event, preferences)
      }));
    } catch (error) {
      logger.error('Error getting content-based recommendations:', error);
      return [];
    }
  }

  /**
   * Collaborative filtering based on similar users
   */
  async getCollaborativeRecommendations(userId, limit) {
    try {
      // Find users with similar preferences
      const similarUsers = await this.findSimilarUsers(userId);
      
      if (similarUsers.length === 0) {
        return [];
      }

      // Get events that similar users attended but current user hasn't
      const events = await db('tickets')
        .join('events', 'tickets.event_id', 'events.id')
        .whereIn('tickets.user_id', similarUsers.map(u => u.user_id))
        .where('events.status', 'published')
        .where('events.start_date', '>', new Date())
        .whereNotIn('events.id', function() {
          this.select('event_id').from('tickets').where('user_id', userId);
        })
        .select(
          'events.*',
          db.raw('COUNT(DISTINCT tickets.user_id) as similar_user_count')
        )
        .groupBy('events.id')
        .orderBy('similar_user_count', 'desc')
        .orderBy('events.start_date', 'asc')
        .limit(limit);

      return events.map(event => ({
        ...event,
        recommendationType: 'collaborative',
        confidence: Math.min(event.similar_user_count / similarUsers.length, 1)
      }));
    } catch (error) {
      logger.error('Error getting collaborative recommendations:', error);
      return [];
    }
  }

  /**
   * Find users with similar preferences
   */
  async findSimilarUsers(userId, limit = 10) {
    try {
      // Get current user's event history
      const userEvents = await db('tickets')
        .where('user_id', userId)
        .pluck('event_id');

      if (userEvents.length === 0) {
        return [];
      }

      // Find users who attended similar events
      const similarUsers = await db('tickets')
        .whereIn('event_id', userEvents)
        .where('user_id', '!=', userId)
        .select('user_id')
        .count('* as similarity_score')
        .groupBy('user_id')
        .orderBy('similarity_score', 'desc')
        .limit(limit);

      return similarUsers;
    } catch (error) {
      logger.error('Error finding similar users:', error);
      return [];
    }
  }

  /**
   * Get trending events based on recent activity
   */
  async getTrendingEvents(limit) {
    try {
      const events = await db('events')
        .join('tickets', 'events.id', 'tickets.event_id')
        .where('events.status', 'published')
        .where('events.start_date', '>', new Date())
        .where('tickets.created_at', '>', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // Last 7 days
        .select(
          'events.*',
          db.raw('COUNT(tickets.id) as recent_tickets'),
          db.raw('COUNT(DISTINCT tickets.user_id) as unique_buyers')
        )
        .groupBy('events.id')
        .orderBy('recent_tickets', 'desc')
        .orderBy('unique_buyers', 'desc')
        .limit(limit);

      return events.map(event => ({
        ...event,
        recommendationType: 'trending',
        confidence: Math.min(event.recent_tickets / 10, 1) // Normalize confidence
      }));
    } catch (error) {
      logger.error('Error getting trending events:', error);
      return [];
    }
  }

  /**
   * Get popular events in user's area
   */
  async getPopularEvents(userId, limit) {
    try {
      // Get user's preferred locations
      const userLocations = await this.getUserLocations(userId);
      
      let query = db('events')
        .join('tickets', 'events.id', 'tickets.event_id')
        .where('events.status', 'published')
        .where('events.start_date', '>', new Date())
        .whereNotIn('events.id', function() {
          this.select('event_id').from('tickets').where('user_id', userId);
        })
        .select(
          'events.*',
          db.raw('COUNT(tickets.id) as total_tickets'),
          db.raw('AVG(events.price) as avg_price')
        )
        .groupBy('events.id');

      // Filter by user's preferred locations if available
      if (userLocations.length > 0) {
        query = query.whereIn('events.location', userLocations);
      }

      const events = await query
        .orderBy('total_tickets', 'desc')
        .orderBy('events.start_date', 'asc')
        .limit(limit);

      return events.map(event => ({
        ...event,
        recommendationType: 'popular',
        confidence: Math.min(event.total_tickets / 100, 1) // Normalize confidence
      }));
    } catch (error) {
      logger.error('Error getting popular events:', error);
      return [];
    }
  }

  /**
   * Analyze user's preferred categories
   */
  analyzeCategories(events) {
    const categoryCount = {};
    events.forEach(event => {
      if (event.category) {
        categoryCount[event.category] = (categoryCount[event.category] || 0) + 1;
      }
    });

    return Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category]) => category);
  }

  /**
   * Analyze user's preferred organizers
   */
  analyzeOrganizers(events) {
    const organizerCount = {};
    events.forEach(event => {
      if (event.organizer_id) {
        organizerCount[event.organizer_id] = (organizerCount[event.organizer_id] || 0) + 1;
      }
    });

    return Object.entries(organizerCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([organizerId]) => organizerId);
  }

  /**
   * Analyze user's preferred price range
   */
  analyzePriceRange(events) {
    const prices = events.map(e => e.price).filter(p => p && p > 0);
    if (prices.length === 0) {
      return { min: 0, max: 1000 };
    }

    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const std = Math.sqrt(prices.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / prices.length);

    return {
      min: Math.max(0, avg - std),
      max: avg + std
    };
  }

  /**
   * Analyze user's preferred locations
   */
  analyzeLocations(events) {
    const locationCount = {};
    events.forEach(event => {
      if (event.location) {
        locationCount[event.location] = (locationCount[event.location] || 0) + 1;
      }
    });

    return Object.entries(locationCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([location]) => location);
  }

  /**
   * Analyze user's search terms
   */
  analyzeSearchTerms(searchHistory) {
    const termCount = {};
    searchHistory.forEach(search => {
      if (search.search_term) {
        const terms = search.search_term.toLowerCase().split(' ');
        terms.forEach(term => {
          if (term.length > 2) {
            termCount[term] = (termCount[term] || 0) + 1;
          }
        });
      }
    });

    return Object.entries(termCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([term]) => term);
  }

  /**
   * Get user's preferred locations
   */
  async getUserLocations(userId) {
    try {
      const locations = await db('tickets')
        .join('events', 'tickets.event_id', 'events.id')
        .where('tickets.user_id', userId)
        .whereNotNull('events.location')
        .pluck('events.location');

      return [...new Set(locations)];
    } catch (error) {
      logger.error('Error getting user locations:', error);
      return [];
    }
  }

  /**
   * Calculate confidence score for a recommendation
   */
  calculateConfidence(event, preferences) {
    let confidence = 0.5; // Base confidence

    // Category match
    if (preferences.categories.includes(event.category)) {
      confidence += 0.2;
    }

    // Organizer match
    if (preferences.organizers.includes(event.organizer_id)) {
      confidence += 0.15;
    }

    // Price range match
    if (event.price >= preferences.priceRange.min && event.price <= preferences.priceRange.max) {
      confidence += 0.1;
    }

    // Location match
    if (preferences.locations.includes(event.location)) {
      confidence += 0.05;
    }

    return Math.min(confidence, 1);
  }

  /**
   * Remove duplicates and sort by relevance
   */
  deduplicateAndSort(recommendations, limit) {
    const seen = new Set();
    const unique = [];

    recommendations.forEach(rec => {
      if (!seen.has(rec.id)) {
        seen.add(rec.id);
        unique.push(rec);
      }
    });

    return unique
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
      .slice(0, limit);
  }

  /**
   * Track user interaction with recommendations
   */
  async trackRecommendationInteraction(userId, eventId, action) {
    try {
      await db('recommendation_interactions').insert({
        user_id: userId,
        event_id: eventId,
        action: action, // 'view', 'click', 'purchase', 'wishlist'
        created_at: new Date()
      });
    } catch (error) {
      logger.error('Error tracking recommendation interaction:', error);
    }
  }

  /**
   * Get recommendation insights for analytics
   */
  async getRecommendationInsights(userId) {
    try {
      const insights = await db('recommendation_interactions')
        .join('events', 'recommendation_interactions.event_id', 'events.id')
        .where('recommendation_interactions.user_id', userId)
        .select(
          'events.category',
          'events.organizer_id',
          'recommendation_interactions.action',
          db.raw('COUNT(*) as interaction_count')
        )
        .groupBy('events.category', 'events.organizer_id', 'recommendation_interactions.action');

      return insights;
    } catch (error) {
      logger.error('Error getting recommendation insights:', error);
      return [];
    }
  }
}

module.exports = new RecommendationService();
