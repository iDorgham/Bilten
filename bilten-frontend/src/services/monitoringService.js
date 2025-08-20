/**
 * Frontend monitoring service for Bilten
 * Integrates with New Relic browser monitoring and tracks frontend performance
 */
class FrontendMonitoringService {
  constructor() {
    this.metrics = {
      pageViews: 0,
      errors: 0,
      performanceMetrics: {},
      userInteractions: 0
    };
    this.startTime = Date.now();
    this.initNewRelic();
  }

  /**
   * Initialize New Relic browser monitoring
   */
  initNewRelic() {
    if (window.NREUM) {
      // New Relic is already loaded
      this.newrelic = window.NREUM;
    } else {
      // Load New Relic dynamically if not present
      this.loadNewRelic();
    }
  }

  /**
   * Load New Relic browser agent
   */
  loadNewRelic() {
    if (process.env.REACT_APP_NEW_RELIC_LICENSE_KEY) {
      const script = document.createElement('script');
      script.src = 'https://js-agent.newrelic.com/nr-spa-1234.min.js';
      script.async = true;
      script.onload = () => {
        this.newrelic = window.NREUM;
        this.log('info', 'New Relic browser agent loaded');
      };
      document.head.appendChild(script);
    }
  }

  /**
   * Track page view
   */
  trackPageView(pageName, additionalData = {}) {
    this.metrics.pageViews++;
    
    // Track in New Relic
    if (this.newrelic) {
      this.newrelic.setCustomAttribute('pageName', pageName);
      this.newrelic.addToTrace({
        name: `PageView/${pageName}`,
        attributes: additionalData
      });
    }

    // Send to backend
    this.sendMetric('page_view', {
      pageName,
      timestamp: Date.now(),
      ...additionalData
    });
  }

  /**
   * Track user interaction
   */
  trackInteraction(interactionType, elementId, additionalData = {}) {
    this.metrics.userInteractions++;
    
    // Track in New Relic
    if (this.newrelic) {
      this.newrelic.addToTrace({
        name: `Interaction/${interactionType}`,
        attributes: {
          elementId,
          ...additionalData
        }
      });
    }

    // Send to backend
    this.sendMetric('user_interaction', {
      interactionType,
      elementId,
      timestamp: Date.now(),
      ...additionalData
    });
  }

  /**
   * Track performance metric
   */
  trackPerformance(metricName, value, additionalData = {}) {
    this.metrics.performanceMetrics[metricName] = value;
    
    // Track in New Relic
    if (this.newrelic) {
      this.newrelic.addToTrace({
        name: `Performance/${metricName}`,
        attributes: {
          value,
          ...additionalData
        }
      });
    }

    // Send to backend
    this.sendMetric('performance', {
      metricName,
      value,
      timestamp: Date.now(),
      ...additionalData
    });
  }

  /**
   * Track error
   */
  trackError(error, context = {}) {
    this.metrics.errors++;
    
    // Track in New Relic
    if (this.newrelic) {
      this.newrelic.noticeError(error, {
        ...context,
        source: 'frontend'
      });
    }

    // Send to backend
    this.sendMetric('error', {
      error: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      ...context
    });
  }

  /**
   * Track business event
   */
  trackBusinessEvent(eventType, eventData = {}) {
    // Track in New Relic
    if (this.newrelic) {
      this.newrelic.addToTrace({
        name: `BusinessEvent/${eventType}`,
        attributes: {
          ...eventData,
          timestamp: Date.now()
        }
      });
    }

    // Send to backend
    this.sendMetric('business_event', {
      eventType,
      timestamp: Date.now(),
      ...eventData
    });
  }

  /**
   * Track API call
   */
  trackAPICall(endpoint, method, duration, success, statusCode) {
    // Track in New Relic
    if (this.newrelic) {
      this.newrelic.addToTrace({
        name: `API/${method}/${endpoint}`,
        attributes: {
          endpoint,
          method,
          duration,
          success,
          statusCode
        }
      });
    }

    // Send to backend
    this.sendMetric('api_call', {
      endpoint,
      method,
      duration,
      success,
      statusCode,
      timestamp: Date.now()
    });
  }

  /**
   * Send metric to backend
   */
  async sendMetric(metricType, data) {
    try {
      const response = await fetch('/monitoring/metric', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${metricType}_${Date.now()}`,
          value: 1,
          tags: data
        })
      });

      if (!response.ok) {
        console.warn('Failed to send metric to backend:', response.status);
      }
    } catch (error) {
      console.warn('Failed to send metric to backend:', error);
    }
  }

  /**
   * Get frontend metrics
   */
  getMetrics() {
    const uptime = Date.now() - this.startTime;
    
    return {
      uptime,
      pageViews: this.metrics.pageViews,
      errors: this.metrics.errors,
      userInteractions: this.metrics.userInteractions,
      performanceMetrics: this.metrics.performanceMetrics,
      errorRate: this.metrics.pageViews > 0 ? (this.metrics.errors / this.metrics.pageViews) * 100 : 0
    };
  }

  /**
   * Track Web Vitals
   */
  trackWebVitals(metric) {
    const { name, value, id } = metric;
    
    // Track in New Relic
    if (this.newrelic) {
      this.newrelic.addToTrace({
        name: `WebVital/${name}`,
        attributes: {
          value,
          id
        }
      });
    }

    // Store locally
    this.metrics.performanceMetrics[name] = value;

    // Send to backend
    this.sendMetric('web_vital', {
      name,
      value,
      id,
      timestamp: Date.now()
    });
  }

  /**
   * Track route change
   */
  trackRouteChange(from, to) {
    this.trackPageView(to, {
      fromRoute: from,
      toRoute: to
    });
  }

  /**
   * Track form submission
   */
  trackFormSubmission(formName, success, duration) {
    this.trackBusinessEvent('form_submission', {
      formName,
      success,
      duration
    });
  }

  /**
   * Track button click
   */
  trackButtonClick(buttonId, buttonText, pageName) {
    this.trackInteraction('button_click', buttonId, {
      buttonText,
      pageName
    });
  }

  /**
   * Track search
   */
  trackSearch(query, resultsCount, duration) {
    this.trackBusinessEvent('search', {
      query,
      resultsCount,
      duration
    });
  }

  /**
   * Track purchase/order
   */
  trackPurchase(orderId, amount, currency, items) {
    this.trackBusinessEvent('purchase', {
      orderId,
      amount,
      currency,
      itemsCount: items?.length || 0
    });
  }

  /**
   * Reset metrics (useful for testing)
   */
  resetMetrics() {
    this.metrics = {
      pageViews: 0,
      errors: 0,
      performanceMetrics: {},
      userInteractions: 0
    };
    this.startTime = Date.now();
  }
}

// Create singleton instance
const frontendMonitoringService = new FrontendMonitoringService();

export default frontendMonitoringService;
