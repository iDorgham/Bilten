// Google Analytics 4 (GA4) Integration Service
class GoogleAnalyticsService {
  constructor() {
    this.measurementId = process.env.REACT_APP_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX';
    this.isInitialized = false;
    this.debug = process.env.NODE_ENV === 'development';
  }

  // Initialize Google Analytics
  init() {
    if (this.isInitialized || typeof window === 'undefined') {
      return;
    }

    // Load Google Analytics script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };

    window.gtag('js', new Date());
    window.gtag('config', this.measurementId, {
      page_title: document.title,
      page_location: window.location.href,
      debug_mode: this.debug
    });

    this.isInitialized = true;
    
    if (this.debug) {
      console.log('Google Analytics initialized with ID:', this.measurementId);
    }
  }

  // Track page views
  trackPageView(pageTitle, pageLocation = window.location.href) {
    if (!this.isInitialized) {
      this.init();
    }

    window.gtag('config', this.measurementId, {
      page_title: pageTitle,
      page_location: pageLocation,
      page_referrer: document.referrer
    });

    if (this.debug) {
      console.log('GA Page View:', { pageTitle, pageLocation });
    }
  }

  // Track custom events
  trackEvent(eventName, parameters = {}) {
    if (!this.isInitialized) {
      this.init();
    }

    window.gtag('event', eventName, {
      ...parameters,
      event_time: new Date().toISOString()
    });

    if (this.debug) {
      console.log('GA Event:', { eventName, parameters });
    }
  }

  // Track user engagement
  trackUserEngagement(engagementTimeMs) {
    this.trackEvent('user_engagement', {
      engagement_time_msec: engagementTimeMs
    });
  }

  // Track e-commerce events
  trackPurchase(transactionId, value, currency = 'USD', items = []) {
    this.trackEvent('purchase', {
      transaction_id: transactionId,
      value: value,
      currency: currency,
      items: items
    });
  }

  trackAddToCart(value, currency = 'USD', items = []) {
    this.trackEvent('add_to_cart', {
      value: value,
      currency: currency,
      items: items
    });
  }

  trackViewItem(itemId, itemName, itemCategory, price, currency = 'USD') {
    this.trackEvent('view_item', {
      items: [{
        item_id: itemId,
        item_name: itemName,
        item_category: itemCategory,
        price: price,
        currency: currency
      }]
    });
  }

  // Track form interactions
  trackFormStart(formName) {
    this.trackEvent('form_start', {
      form_name: formName
    });
  }

  trackFormSubmit(formName, success = true) {
    this.trackEvent('form_submit', {
      form_name: formName,
      success: success
    });
  }

  // Track search
  trackSearch(searchTerm, resultsCount = 0) {
    this.trackEvent('search', {
      search_term: searchTerm,
      results_count: resultsCount
    });
  }

  // Track user actions
  trackUserAction(action, category, label = null, value = null) {
    this.trackEvent('user_action', {
      action: action,
      category: category,
      label: label,
      value: value
    });
  }

  // Track errors
  trackError(error, errorContext = {}) {
    this.trackEvent('exception', {
      description: error.message || error,
      fatal: false,
      ...errorContext
    });
  }

  // Track performance metrics
  trackPerformance(metricName, value, additionalData = {}) {
    this.trackEvent('performance', {
      metric_name: metricName,
      value: value,
      ...additionalData
    });
  }

  // Set user properties
  setUserProperties(properties) {
    if (!this.isInitialized) {
      this.init();
    }

    window.gtag('config', this.measurementId, {
      custom_map: properties
    });

    if (this.debug) {
      console.log('GA User Properties:', properties);
    }
  }

  // Set user ID
  setUserId(userId) {
    if (!this.isInitialized) {
      this.init();
    }

    window.gtag('config', this.measurementId, {
      user_id: userId
    });

    if (this.debug) {
      console.log('GA User ID set:', userId);
    }
  }

  // Track conversion goals
  trackConversion(goalId, value = null) {
    this.trackEvent('conversion', {
      goal_id: goalId,
      value: value
    });
  }

  // Track social interactions
  trackSocial(network, action, target) {
    this.trackEvent('social', {
      social_network: network,
      social_action: action,
      social_target: target
    });
  }

  // Track timing
  trackTiming(category, variable, time, label = null) {
    this.trackEvent('timing_complete', {
      timing_category: category,
      timing_var: variable,
      timing_value: time,
      timing_label: label
    });
  }

  // Enhanced e-commerce tracking for events
  trackEventView(eventId, eventName, eventCategory, ticketPrice = null) {
    const items = [{
      item_id: eventId,
      item_name: eventName,
      item_category: eventCategory,
      price: ticketPrice
    }];

    this.trackEvent('view_item_list', {
      item_list_name: 'Events',
      items: items
    });
  }

  trackTicketPurchase(eventId, eventName, ticketType, quantity, price, totalValue) {
    const items = [{
      item_id: `${eventId}_${ticketType}`,
      item_name: `${eventName} - ${ticketType}`,
      item_category: 'Event Tickets',
      quantity: quantity,
      price: price
    }];

    this.trackPurchase(
      `order_${Date.now()}`,
      totalValue,
      'USD',
      items
    );
  }

  trackTicketAddToCart(eventId, eventName, ticketType, quantity, price) {
    const items = [{
      item_id: `${eventId}_${ticketType}`,
      item_name: `${eventName} - ${ticketType}`,
      item_category: 'Event Tickets',
      quantity: quantity,
      price: price
    }];

    this.trackAddToCart(
      quantity * price,
      'USD',
      items
    );
  }

  // Track user journey
  trackUserJourney(step, stepNumber, totalSteps) {
    this.trackEvent('user_journey', {
      journey_step: step,
      step_number: stepNumber,
      total_steps: totalSteps
    });
  }

  // Track feature usage
  trackFeatureUsage(featureName, action = 'used') {
    this.trackEvent('feature_usage', {
      feature_name: featureName,
      action: action
    });
  }

  // Track app performance
  trackAppPerformance(metric, value) {
    this.trackPerformance(metric, value, {
      app_version: process.env.REACT_APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV
    });
  }

  // Get analytics data (for debugging)
  getAnalyticsData() {
    if (typeof window !== 'undefined' && window.dataLayer) {
      return window.dataLayer;
    }
    return [];
  }

  // Clear analytics data (for testing)
  clearAnalyticsData() {
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer = [];
    }
  }
}

// Create singleton instance
const googleAnalytics = new GoogleAnalyticsService();

// Auto-initialize in browser environment
if (typeof window !== 'undefined') {
  googleAnalytics.init();
}

export default googleAnalytics;
