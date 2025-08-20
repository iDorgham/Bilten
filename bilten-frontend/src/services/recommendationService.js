import api from './api';

class RecommendationService {
  /**
   * Get personalized recommendations for the current user
   */
  async getRecommendations(options = {}) {
    try {
      const params = new URLSearchParams();
      
      if (options.limit) params.append('limit', options.limit);
      if (options.includeTrending !== undefined) params.append('includeTrending', options.includeTrending);
      if (options.includeSimilar !== undefined) params.append('includeSimilar', options.includeSimilar);
      if (options.includePopular !== undefined) params.append('includePopular', options.includePopular);

      const response = await api.get(`/recommendations?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      throw error;
    }
  }

  /**
   * Get trending events
   */
  async getTrendingEvents(limit = 10) {
    try {
      const response = await api.get(`/recommendations/trending?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching trending events:', error);
      throw error;
    }
  }

  /**
   * Get similar events based on a specific event
   */
  async getSimilarEvents(eventId, limit = 6) {
    try {
      const response = await api.get(`/recommendations/similar/${eventId}?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching similar events:', error);
      throw error;
    }
  }

  /**
   * Get user preferences
   */
  async getUserPreferences() {
    try {
      const response = await api.get('/recommendations/preferences');
      return response.data;
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      throw error;
    }
  }

  /**
   * Track user interaction with recommendations
   */
  async trackInteraction(eventId, action, context = {}) {
    try {
      const response = await api.post('/recommendations/interaction', {
        eventId,
        action,
        context
      });
      return response.data;
    } catch (error) {
      console.error('Error tracking interaction:', error);
      // Don't throw error for tracking failures to avoid breaking user experience
    }
  }

  /**
   * Get recommendation insights
   */
  async getInsights() {
    try {
      const response = await api.get('/recommendations/insights');
      return response.data;
    } catch (error) {
      console.error('Error fetching insights:', error);
      throw error;
    }
  }

  /**
   * Get exploration recommendations
   */
  async getExplorationRecommendations(options = {}) {
    try {
      const params = new URLSearchParams();
      
      if (options.limit) params.append('limit', options.limit);
      if (options.category) params.append('category', options.category);
      if (options.location) params.append('location', options.location);

      const response = await api.get(`/recommendations/explore?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching exploration recommendations:', error);
      throw error;
    }
  }

  /**
   * Get recommended categories
   */
  async getRecommendedCategories() {
    try {
      const response = await api.get('/recommendations/categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching recommended categories:', error);
      throw error;
    }
  }

  /**
   * Get "For You" personalized recommendations
   */
  async getForYouRecommendations(limit = 8) {
    try {
      const response = await api.get(`/recommendations/for-you?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching for-you recommendations:', error);
      throw error;
    }
  }

  /**
   * Track event view for recommendations
   */
  async trackEventView(eventId, source = 'recommendation') {
    return this.trackInteraction(eventId, 'view', { source });
  }

  /**
   * Track event click for recommendations
   */
  async trackEventClick(eventId, source = 'recommendation') {
    return this.trackInteraction(eventId, 'click', { source });
  }

  /**
   * Track event purchase for recommendations
   */
  async trackEventPurchase(eventId, source = 'recommendation') {
    return this.trackInteraction(eventId, 'purchase', { source });
  }

  /**
   * Track event wishlist for recommendations
   */
  async trackEventWishlist(eventId, source = 'recommendation') {
    return this.trackInteraction(eventId, 'wishlist', { source });
  }

  /**
   * Track event share for recommendations
   */
  async trackEventShare(eventId, source = 'recommendation') {
    return this.trackInteraction(eventId, 'share', { source });
  }

  /**
   * Get recommendation confidence label
   */
  getConfidenceLabel(confidence) {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.6) return 'medium';
    if (confidence >= 0.4) return 'low';
    return 'very-low';
  }

  /**
   * Get recommendation type label
   */
  getRecommendationTypeLabel(type) {
    const labels = {
      'content_based': 'Based on your preferences',
      'collaborative': 'Similar users also like',
      'trending': 'Trending now',
      'popular': 'Popular in your area'
    };
    return labels[type] || 'Recommended for you';
  }

  /**
   * Format recommendation data for display
   */
  formatRecommendation(recommendation) {
    return {
      ...recommendation,
      confidenceLabel: this.getConfidenceLabel(recommendation.confidence),
      typeLabel: this.getRecommendationTypeLabel(recommendation.recommendationType),
      formattedPrice: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(recommendation.price),
      formattedDate: new Date(recommendation.start_date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      })
    };
  }

  /**
   * Format multiple recommendations
   */
  formatRecommendations(recommendations) {
    return recommendations.map(rec => this.formatRecommendation(rec));
  }
}

export default new RecommendationService();
