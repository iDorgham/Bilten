import axios from 'axios';
import { API_CONFIG } from '../config/api';

class TrackingService {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_CONFIG.BASE_URL}/tracking`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Generate session ID for tracking
    this.sessionId = this.generateSessionId();
  }

  // Generate unique session ID
  generateSessionId() {
    const existingSessionId = sessionStorage.getItem('tracking_session_id');
    if (existingSessionId) {
      return existingSessionId;
    }
    
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('tracking_session_id', sessionId);
    return sessionId;
  }

  // Get current page URL
  getCurrentPageUrl() {
    return window.location.href;
  }

  // Get user agent
  getUserAgent() {
    return navigator.userAgent;
  }

  // Track user activity (page views, clicks, scrolls, etc.)
  async trackUserActivity(eventType, eventData = {}) {
    try {
      const trackingData = {
        eventType,
        sessionId: this.sessionId,
        pageUrl: this.getCurrentPageUrl(),
        eventData: {
          ...eventData,
          userAgent: this.getUserAgent(),
          timestamp: new Date().toISOString(),
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          }
        }
      };

      const response = await this.api.post('/activity', trackingData);
      return response.data;
    } catch (error) {
      console.error('Failed to track user activity:', error);
      // Don't throw error to avoid breaking user experience
      return { success: false, error: error.message };
    }
  }

  // Track event-specific interactions
  async trackEventInteraction(eventId, interactionType, interactionData = {}) {
    try {
      const trackingData = {
        eventId,
        interactionType,
        sessionId: this.sessionId,
        interactionData: {
          ...interactionData,
          pageUrl: this.getCurrentPageUrl(),
          timestamp: new Date().toISOString()
        }
      };

      const response = await this.api.post('/event-interaction', trackingData);
      return response.data;
    } catch (error) {
      console.error('Failed to track event interaction:', error);
      return { success: false, error: error.message };
    }
  }

  // Track conversion events
  async trackConversion(conversionType, conversionData = {}) {
    try {
      const trackingData = {
        conversionType,
        sessionId: this.sessionId,
        conversionData: {
          ...conversionData,
          pageUrl: this.getCurrentPageUrl(),
          timestamp: new Date().toISOString()
        }
      };

      const response = await this.api.post('/conversion', trackingData);
      return response.data;
    } catch (error) {
      console.error('Failed to track conversion:', error);
      return { success: false, error: error.message };
    }
  }

  // Track performance metrics
  async trackPerformance(metricName, value, additionalData = {}) {
    try {
      const trackingData = {
        metricName,
        value,
        sessionId: this.sessionId,
        additionalData: {
          ...additionalData,
          pageUrl: this.getCurrentPageUrl(),
          timestamp: new Date().toISOString()
        }
      };

      const response = await this.api.post('/performance', trackingData);
      return response.data;
    } catch (error) {
      console.error('Failed to track performance:', error);
      return { success: false, error: error.message };
    }
  }

  // Track heatmap data
  async trackHeatmap(pageUrl, elementSelector, interactionType, coordinates) {
    try {
      const trackingData = {
        pageUrl,
        elementSelector,
        interactionType,
        coordinates,
        sessionId: this.sessionId,
        timestamp: new Date().toISOString()
      };

      const response = await this.api.post('/heatmap', trackingData);
      return response.data;
    } catch (error) {
      console.error('Failed to track heatmap data:', error);
      return { success: false, error: error.message };
    }
  }

  // Get real-time analytics
  async getRealTimeAnalytics(timeRange = '1h') {
    try {
      const response = await this.api.get(`/real-time?timeRange=${timeRange}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get real-time analytics:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user journey data
  async getUserJourney(userId, options = {}) {
    try {
      const response = await this.api.get(`/user-journey/${userId}`, { params: options });
      return response.data;
    } catch (error) {
      console.error('Failed to get user journey:', error);
      return { success: false, error: error.message };
    }
  }

  // Get funnel analysis
  async getFunnelAnalysis(funnelConfig) {
    try {
      const response = await this.api.post('/funnel-analysis', funnelConfig);
      return response.data;
    } catch (error) {
      console.error('Failed to get funnel analysis:', error);
      return { success: false, error: error.message };
    }
  }

  // Export analytics data
  async exportAnalyticsData(exportConfig) {
    try {
      const response = await this.api.post('/export', exportConfig);
      return response.data;
    } catch (error) {
      console.error('Failed to export analytics data:', error);
      return { success: false, error: error.message };
    }
  }

  // Track page view with enhanced data
  async trackPageView(pageName, additionalData = {}) {
    return this.trackUserActivity('page_view', {
      page: pageName,
      title: document.title,
      referrer: document.referrer,
      ...additionalData
    });
  }

  // Track click events
  async trackClick(elementSelector, elementText, additionalData = {}) {
    return this.trackUserActivity('click', {
      element: elementSelector,
      text: elementText,
      ...additionalData
    });
  }

  // Track scroll events
  async trackScroll(scrollDepth, additionalData = {}) {
    return this.trackUserActivity('scroll', {
      depth: scrollDepth,
      ...additionalData
    });
  }

  // Track form interactions
  async trackFormInteraction(formName, action, formData = {}) {
    return this.trackUserActivity('form_interaction', {
      form: formName,
      action,
      ...formData
    });
  }

  // Track search queries
  async trackSearch(query, resultsCount = 0, filters = {}) {
    return this.trackUserActivity('search', {
      query,
      resultsCount,
      filters
    });
  }

  // Track purchase events
  async trackPurchase(orderData) {
    return this.trackConversion('purchase', {
      ...orderData,
      currency: orderData.currency || 'USD'
    });
  }

  // Track add to cart events
  async trackAddToCart(cartData) {
    return this.trackConversion('add_to_cart', {
      ...cartData,
      currency: cartData.currency || 'USD'
    });
  }

  // Track event views
  async trackEventView(eventData) {
    return this.trackEventInteraction(eventData.eventId, 'view', {
      eventTitle: eventData.eventTitle,
      eventCategory: eventData.eventCategory,
      ...eventData
    });
  }

  // Track event likes
  async trackEventLike(eventId, additionalData = {}) {
    return this.trackEventInteraction(eventId, 'like', additionalData);
  }

  // Track event shares
  async trackEventShare(eventId, sharePlatform, additionalData = {}) {
    return this.trackEventInteraction(eventId, 'share', {
      platform: sharePlatform,
      ...additionalData
    });
  }

  // Track event bookmarks
  async trackEventBookmark(eventId, additionalData = {}) {
    return this.trackEventInteraction(eventId, 'bookmark', additionalData);
  }

  // Track newsletter signup
  async trackNewsletterSignup(email, source = 'website') {
    return this.trackConversion('newsletter_signup', {
      email,
      source
    });
  }

  // Track registration
  async trackRegistration(userData) {
    return this.trackConversion('registration', {
      ...userData,
      source: userData.source || 'website'
    });
  }

  // Track login
  async trackLogin(loginMethod) {
    return this.trackConversion('login', {
      method: loginMethod
    });
  }

  // Track error events
  async trackError(error, errorContext = {}) {
    return this.trackUserActivity('error', {
      error: error.message || error,
      stack: error.stack,
      ...errorContext
    });
  }
}

export default new TrackingService();
