import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import analyticsService from '../services/analytics';

export const useAnalytics = () => {
  const location = useLocation();

  // Track page views automatically
  useEffect(() => {
    const trackPageView = async () => {
      try {
        await analyticsService.trackPageView(location.pathname, {
          title: document.title,
          referrer: document.referrer,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Failed to track page view:', error);
      }
    };

    trackPageView();
  }, [location.pathname]);

  // Track user actions
  const trackAction = useCallback(async (action, actionData = {}) => {
    try {
      await analyticsService.trackUserAction(action, {
        ...actionData,
        path: location.pathname,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to track user action:', error);
    }
  }, [location.pathname]);

  // Track e-commerce events
  const trackPurchase = useCallback(async (orderData) => {
    try {
      await analyticsService.trackPurchase({
        ...orderData,
        path: location.pathname,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to track purchase:', error);
    }
  }, [location.pathname]);

  const trackAddToCart = useCallback(async (cartData) => {
    try {
      await analyticsService.trackAddToCart({
        ...cartData,
        path: location.pathname,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to track add to cart:', error);
    }
  }, [location.pathname]);

  const trackViewEvent = useCallback(async (eventData) => {
    try {
      await analyticsService.trackViewEvent({
        ...eventData,
        path: location.pathname,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to track view event:', error);
    }
  }, [location.pathname]);

  // Track form interactions
  const trackFormInteraction = useCallback(async (formName, action, formData = {}) => {
    try {
      await analyticsService.trackUserAction('form_interaction', {
        form: formName,
        action,
        ...formData,
        path: location.pathname,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to track form interaction:', error);
    }
  }, [location.pathname]);

  // Track search queries
  const trackSearch = useCallback(async (query, resultsCount = 0, filters = {}) => {
    try {
      await analyticsService.trackUserAction('search', {
        query,
        resultsCount,
        filters,
        path: location.pathname,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to track search:', error);
    }
  }, [location.pathname]);

  // Track error events
  const trackError = useCallback(async (error, errorContext = {}) => {
    try {
      await analyticsService.trackUserAction('error', {
        error: error.message || error,
        stack: error.stack,
        ...errorContext,
        path: location.pathname,
        timestamp: new Date().toISOString()
      });
    } catch (trackingError) {
      console.error('Failed to track error:', trackingError);
    }
  }, [location.pathname]);

  // Track performance metrics
  const trackPerformance = useCallback(async (metricName, value, additionalData = {}) => {
    try {
      await analyticsService.trackUserAction('performance', {
        metric: metricName,
        value,
        ...additionalData,
        path: location.pathname,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to track performance:', error);
    }
  }, [location.pathname]);

  return {
    trackAction,
    trackPurchase,
    trackAddToCart,
    trackViewEvent,
    trackFormInteraction,
    trackSearch,
    trackError,
    trackPerformance
  };
};

// Hook for tracking specific user interactions
export const useEventTracking = () => {
  const { trackAction, trackViewEvent, trackAddToCart, trackPurchase } = useAnalytics();

  const trackEventView = useCallback((eventId, eventTitle, eventCategory) => {
    trackViewEvent({
      eventId,
      eventTitle,
      eventCategory
    });
  }, [trackViewEvent]);

  const trackEventInteraction = useCallback((eventId, action, additionalData = {}) => {
    trackAction('event_interaction', {
      eventId,
      action,
      ...additionalData
    });
  }, [trackAction]);

  const trackTicketPurchase = useCallback((eventId, ticketId, quantity, totalAmount) => {
    trackPurchase({
      eventId,
      ticketId,
      quantity,
      totalAmount,
      currency: 'USD'
    });
  }, [trackPurchase]);

  const trackTicketAddToCart = useCallback((eventId, ticketId, quantity, price) => {
    trackAddToCart({
      eventId,
      ticketId,
      quantity,
      price,
      currency: 'USD'
    });
  }, [trackAddToCart]);

  return {
    trackEventView,
    trackEventInteraction,
    trackTicketPurchase,
    trackTicketAddToCart
  };
};

// Hook for tracking form interactions
export const useFormTracking = () => {
  const { trackFormInteraction } = useAnalytics();

  const trackFormStart = useCallback((formName) => {
    trackFormInteraction(formName, 'start');
  }, [trackFormInteraction]);

  const trackFormSubmit = useCallback((formName, success = true, errorMessage = null) => {
    trackFormInteraction(formName, 'submit', {
      success,
      errorMessage
    });
  }, [trackFormInteraction]);

  const trackFormField = useCallback((formName, fieldName, fieldType) => {
    trackFormInteraction(formName, 'field_focus', {
      field: fieldName,
      type: fieldType
    });
  }, [trackFormInteraction]);

  return {
    trackFormStart,
    trackFormSubmit,
    trackFormField
  };
};

// Hook for tracking search behavior
export const useSearchTracking = () => {
  const { trackSearch } = useAnalytics();

  const trackSearchQuery = useCallback((query, resultsCount = 0, filters = {}) => {
    trackSearch(query, resultsCount, filters);
  }, [trackSearch]);

  const trackSearchFilter = useCallback((filterName, filterValue) => {
    trackSearch('', 0, { [filterName]: filterValue });
  }, [trackSearch]);

  return {
    trackSearchQuery,
    trackSearchFilter
  };
};
