import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import trackingService from '../services/trackingService';

// Main tracking hook
export const useTracking = () => {
  const location = useLocation();
  const scrollTimeoutRef = useRef(null);
  const lastScrollDepthRef = useRef(0);

  // Auto-track page views
  useEffect(() => {
    const trackPageView = async () => {
      try {
        await trackingService.trackPageView(location.pathname, {
          title: document.title,
          referrer: document.referrer
        });
      } catch (error) {
        console.error('Failed to track page view:', error);
      }
    };

    trackPageView();
  }, [location.pathname]);

  // Track scroll depth with throttling
  useEffect(() => {
    const handleScroll = () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        const scrollDepth = Math.round(
          (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
        );

        // Only track if scroll depth changed significantly (more than 10%)
        if (Math.abs(scrollDepth - lastScrollDepthRef.current) > 10) {
          trackingService.trackScroll(scrollDepth);
          lastScrollDepthRef.current = scrollDepth;
        }
      }, 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Track user activity
  const trackActivity = useCallback(async (eventType, eventData = {}) => {
    try {
      await trackingService.trackUserActivity(eventType, eventData);
    } catch (error) {
      console.error('Failed to track activity:', error);
    }
  }, []);

  // Track clicks
  const trackClick = useCallback(async (elementSelector, elementText, additionalData = {}) => {
    try {
      await trackingService.trackClick(elementSelector, elementText, additionalData);
    } catch (error) {
      console.error('Failed to track click:', error);
    }
  }, []);

  // Track form interactions
  const trackFormInteraction = useCallback(async (formName, action, formData = {}) => {
    try {
      await trackingService.trackFormInteraction(formName, action, formData);
    } catch (error) {
      console.error('Failed to track form interaction:', error);
    }
  }, []);

  // Track search queries
  const trackSearch = useCallback(async (query, resultsCount = 0, filters = {}) => {
    try {
      await trackingService.trackSearch(query, resultsCount, filters);
    } catch (error) {
      console.error('Failed to track search:', error);
    }
  }, []);

  // Track conversions
  const trackConversion = useCallback(async (conversionType, conversionData = {}) => {
    try {
      await trackingService.trackConversion(conversionType, conversionData);
    } catch (error) {
      console.error('Failed to track conversion:', error);
    }
  }, []);

  // Track performance metrics
  const trackPerformance = useCallback(async (metricName, value, additionalData = {}) => {
    try {
      await trackingService.trackPerformance(metricName, value, additionalData);
    } catch (error) {
      console.error('Failed to track performance:', error);
    }
  }, []);

  // Track errors
  const trackError = useCallback(async (error, errorContext = {}) => {
    try {
      await trackingService.trackError(error, errorContext);
    } catch (trackingError) {
      console.error('Failed to track error:', trackingError);
    }
  }, []);

  return {
    trackActivity,
    trackClick,
    trackFormInteraction,
    trackSearch,
    trackConversion,
    trackPerformance,
    trackError
  };
};

// Event-specific tracking hook
export const useEventTracking = () => {
  const { trackConversion } = useTracking();

  // Track event views
  const trackEventView = useCallback(async (eventId, eventTitle, eventCategory, additionalData = {}) => {
    try {
      await trackingService.trackEventView({
        eventId,
        eventTitle,
        eventCategory,
        ...additionalData
      });
    } catch (error) {
      console.error('Failed to track event view:', error);
    }
  }, []);

  // Track event interactions
  const trackEventInteraction = useCallback(async (eventId, interactionType, interactionData = {}) => {
    try {
      await trackingService.trackEventInteraction(eventId, interactionType, interactionData);
    } catch (error) {
      console.error('Failed to track event interaction:', error);
    }
  }, []);

  // Track event likes
  const trackEventLike = useCallback(async (eventId, additionalData = {}) => {
    try {
      await trackingService.trackEventLike(eventId, additionalData);
    } catch (error) {
      console.error('Failed to track event like:', error);
    }
  }, []);

  // Track event shares
  const trackEventShare = useCallback(async (eventId, sharePlatform, additionalData = {}) => {
    try {
      await trackingService.trackEventShare(eventId, sharePlatform, additionalData);
    } catch (error) {
      console.error('Failed to track event share:', error);
    }
  }, []);

  // Track event bookmarks
  const trackEventBookmark = useCallback(async (eventId, additionalData = {}) => {
    try {
      await trackingService.trackEventBookmark(eventId, additionalData);
    } catch (error) {
      console.error('Failed to track event bookmark:', error);
    }
  }, []);

  // Track ticket purchases
  const trackTicketPurchase = useCallback(async (eventId, ticketId, quantity, totalAmount, additionalData = {}) => {
    try {
      await trackConversion('purchase', {
        eventId,
        ticketId,
        quantity,
        totalAmount,
        currency: 'USD',
        ...additionalData
      });
    } catch (error) {
      console.error('Failed to track ticket purchase:', error);
    }
  }, [trackConversion]);

  // Track add to cart
  const trackAddToCart = useCallback(async (eventId, ticketId, quantity, price, additionalData = {}) => {
    try {
      await trackConversion('add_to_cart', {
        eventId,
        ticketId,
        quantity,
        price,
        currency: 'USD',
        ...additionalData
      });
    } catch (error) {
      console.error('Failed to track add to cart:', error);
    }
  }, [trackConversion]);

  return {
    trackEventView,
    trackEventInteraction,
    trackEventLike,
    trackEventShare,
    trackEventBookmark,
    trackTicketPurchase,
    trackAddToCart
  };
};

// Form tracking hook
export const useFormTracking = () => {
  const { trackFormInteraction } = useTracking();

  // Track form start
  const trackFormStart = useCallback(async (formName) => {
    try {
      await trackFormInteraction(formName, 'start');
    } catch (error) {
      console.error('Failed to track form start:', error);
    }
  }, [trackFormInteraction]);

  // Track form submit
  const trackFormSubmit = useCallback(async (formName, success = true, errorMessage = null, formData = {}) => {
    try {
      await trackFormInteraction(formName, 'submit', {
        success,
        errorMessage,
        ...formData
      });
    } catch (error) {
      console.error('Failed to track form submit:', error);
    }
  }, [trackFormInteraction]);

  // Track form field focus
  const trackFormField = useCallback(async (formName, fieldName, fieldType) => {
    try {
      await trackFormInteraction(formName, 'field_focus', {
        field: fieldName,
        type: fieldType
      });
    } catch (error) {
      console.error('Failed to track form field:', error);
    }
  }, [trackFormInteraction]);

  // Track form validation errors
  const trackFormValidation = useCallback(async (formName, fieldName, errorType) => {
    try {
      await trackFormInteraction(formName, 'validation_error', {
        field: fieldName,
        errorType
      });
    } catch (error) {
      console.error('Failed to track form validation:', error);
    }
  }, [trackFormInteraction]);

  return {
    trackFormStart,
    trackFormSubmit,
    trackFormField,
    trackFormValidation
  };
};

// Search tracking hook
export const useSearchTracking = () => {
  const { trackSearch } = useTracking();

  // Track search query
  const trackSearchQuery = useCallback(async (query, resultsCount = 0, filters = {}) => {
    try {
      await trackSearch(query, resultsCount, filters);
    } catch (error) {
      console.error('Failed to track search query:', error);
    }
  }, [trackSearch]);

  // Track search filter usage
  const trackSearchFilter = useCallback(async (filterName, filterValue) => {
    try {
      await trackSearch('', 0, { [filterName]: filterValue });
    } catch (error) {
      console.error('Failed to track search filter:', error);
    }
  }, [trackSearch]);

  // Track search result click
  const trackSearchResultClick = useCallback(async (query, resultPosition, resultId) => {
    try {
      await trackSearch(query, 0, {
        resultClick: {
          position: resultPosition,
          resultId
        }
      });
    } catch (error) {
      console.error('Failed to track search result click:', error);
    }
  }, [trackSearch]);

  return {
    trackSearchQuery,
    trackSearchFilter,
    trackSearchResultClick
  };
};

// User engagement tracking hook
export const useEngagementTracking = () => {
  const { trackConversion } = useTracking();

  // Track newsletter signup
  const trackNewsletterSignup = useCallback(async (email, source = 'website') => {
    try {
      await trackingService.trackNewsletterSignup(email, source);
    } catch (error) {
      console.error('Failed to track newsletter signup:', error);
    }
  }, []);

  // Track registration
  const trackRegistration = useCallback(async (userData) => {
    try {
      await trackingService.trackRegistration(userData);
    } catch (error) {
      console.error('Failed to track registration:', error);
    }
  }, []);

  // Track login
  const trackLogin = useCallback(async (loginMethod) => {
    try {
      await trackingService.trackLogin(loginMethod);
    } catch (error) {
      console.error('Failed to track login:', error);
    }
  }, []);

  // Track profile update
  const trackProfileUpdate = useCallback(async (updateType, additionalData = {}) => {
    try {
      await trackConversion('profile_update', {
        updateType,
        ...additionalData
      });
    } catch (error) {
      console.error('Failed to track profile update:', error);
    }
  }, [trackConversion]);

  // Track preferences change
  const trackPreferencesChange = useCallback(async (preferenceType, newValue) => {
    try {
      await trackConversion('preferences_change', {
        preferenceType,
        newValue
      });
    } catch (error) {
      console.error('Failed to track preferences change:', error);
    }
  }, [trackConversion]);

  return {
    trackNewsletterSignup,
    trackRegistration,
    trackLogin,
    trackProfileUpdate,
    trackPreferencesChange
  };
};

// Performance tracking hook
export const usePerformanceTracking = () => {
  const { trackPerformance } = useTracking();

  // Track page load time
  const trackPageLoadTime = useCallback(async (loadTime) => {
    try {
      await trackPerformance('page_load_time', loadTime);
    } catch (error) {
      console.error('Failed to track page load time:', error);
    }
  }, [trackPerformance]);

  // Track API response time
  const trackApiResponseTime = useCallback(async (endpoint, responseTime, statusCode) => {
    try {
      await trackPerformance('api_response_time', responseTime, {
        endpoint,
        statusCode
      });
    } catch (error) {
      console.error('Failed to track API response time:', error);
    }
  }, [trackPerformance]);

  // Track image load time
  const trackImageLoadTime = useCallback(async (imageUrl, loadTime) => {
    try {
      await trackPerformance('image_load_time', loadTime, {
        imageUrl
      });
    } catch (error) {
      console.error('Failed to track image load time:', error);
    }
  }, [trackPerformance]);

  // Track component render time
  const trackComponentRenderTime = useCallback(async (componentName, renderTime) => {
    try {
      await trackPerformance('component_render_time', renderTime, {
        component: componentName
      });
    } catch (error) {
      console.error('Failed to track component render time:', error);
    }
  }, [trackPerformance]);

  return {
    trackPageLoadTime,
    trackApiResponseTime,
    trackImageLoadTime,
    trackComponentRenderTime
  };
};

// Heatmap tracking hook
export const useHeatmapTracking = () => {
  // Track click heatmap
  const trackClickHeatmap = useCallback(async (elementSelector, coordinates) => {
    try {
      await trackingService.trackHeatmap(
        window.location.href,
        elementSelector,
        'click',
        coordinates
      );
    } catch (error) {
      console.error('Failed to track click heatmap:', error);
    }
  }, []);

  // Track hover heatmap
  const trackHoverHeatmap = useCallback(async (elementSelector, coordinates) => {
    try {
      await trackingService.trackHeatmap(
        window.location.href,
        elementSelector,
        'hover',
        coordinates
      );
    } catch (error) {
      console.error('Failed to track hover heatmap:', error);
    }
  }, []);

  return {
    trackClickHeatmap,
    trackHoverHeatmap
  };
};

// Analytics data retrieval hook
export const useAnalyticsData = () => {
  // Get real-time analytics
  const getRealTimeAnalytics = useCallback(async (timeRange = '1h') => {
    try {
      return await trackingService.getRealTimeAnalytics(timeRange);
    } catch (error) {
      console.error('Failed to get real-time analytics:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Get user journey
  const getUserJourney = useCallback(async (userId, options = {}) => {
    try {
      return await trackingService.getUserJourney(userId, options);
    } catch (error) {
      console.error('Failed to get user journey:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Get funnel analysis
  const getFunnelAnalysis = useCallback(async (funnelConfig) => {
    try {
      return await trackingService.getFunnelAnalysis(funnelConfig);
    } catch (error) {
      console.error('Failed to get funnel analysis:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Export analytics data
  const exportAnalyticsData = useCallback(async (exportConfig) => {
    try {
      return await trackingService.exportAnalyticsData(exportConfig);
    } catch (error) {
      console.error('Failed to export analytics data:', error);
      return { success: false, error: error.message };
    }
  }, []);

  return {
    getRealTimeAnalytics,
    getUserJourney,
    getFunnelAnalysis,
    exportAnalyticsData
  };
};
