import React, { forwardRef, useCallback } from 'react';
import { useTracking, useHeatmapTracking } from '../../hooks/useTracking';

// Higher-order component for tracking element interactions
export const withTracking = (WrappedComponent, trackingConfig = {}) => {
  const TrackedComponent = forwardRef((props, ref) => {
    const { trackClick } = useTracking();
    const { trackClickHeatmap, trackHoverHeatmap } = useHeatmapTracking();

    const handleClick = useCallback((event) => {
      const element = event.currentTarget;
      const elementSelector = element.tagName.toLowerCase() + 
        (element.id ? `#${element.id}` : '') + 
        (element.className ? `.${element.className.split(' ').join('.')}` : '');
      
      const elementText = element.textContent?.trim().substring(0, 100) || '';
      
      // Track click with element info
      trackClick(elementSelector, elementText, {
        ...trackingConfig.clickData,
        ...props.trackingData
      });

      // Track heatmap data
      const rect = element.getBoundingClientRect();
      trackClickHeatmap(elementSelector, {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        pageX: event.clientX,
        pageY: event.clientY
      });

      // Call original onClick if it exists
      if (props.onClick) {
        props.onClick(event);
      }
    }, [trackClick, trackClickHeatmap, trackingConfig.clickData, props.trackingData, props.onClick]);

    const handleMouseEnter = useCallback((event) => {
      if (trackingConfig.trackHover) {
        const element = event.currentTarget;
        const elementSelector = element.tagName.toLowerCase() + 
          (element.id ? `#${element.id}` : '') + 
          (element.className ? `.${element.className.split(' ').join('.')}` : '');
        
        const rect = element.getBoundingClientRect();
        trackHoverHeatmap(elementSelector, {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
          pageX: event.clientX,
          pageY: event.clientY
        });
      }

      // Call original onMouseEnter if it exists
      if (props.onMouseEnter) {
        props.onMouseEnter(event);
      }
    }, [trackingConfig.trackHover, trackHoverHeatmap, props.onMouseEnter]);

    return (
      <WrappedComponent
        {...props}
        ref={ref}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
      />
    );
  });

  TrackedComponent.displayName = `withTracking(${WrappedComponent.displayName || WrappedComponent.name})`;
  return TrackedComponent;
};

// Pre-configured tracked components
export const TrackedButton = withTracking('button', {
  trackHover: true
});

export const TrackedLink = withTracking('a', {
  trackHover: true
});

export const TrackedDiv = withTracking('div', {
  trackHover: false
});

// Custom tracked components for specific use cases
export const TrackedEventCard = withTracking('div', {
  trackHover: true,
  clickData: {
    component: 'EventCard'
  }
});

export const TrackedTicketButton = withTracking('button', {
  trackHover: true,
  clickData: {
    component: 'TicketButton'
  }
});

export const TrackedSearchResult = withTracking('div', {
  trackHover: true,
  clickData: {
    component: 'SearchResult'
  }
});

export const TrackedFormField = withTracking('input', {
  trackHover: false,
  clickData: {
    component: 'FormField'
  }
});

// Hook for creating tracked elements with custom tracking data
export const useTrackedElement = (elementType, trackingConfig = {}) => {
  const TrackedElement = withTracking(elementType, trackingConfig);
  
  return (props) => (
    <TrackedElement {...props} />
  );
};

// Utility for tracking form submissions
export const useTrackedForm = (formName) => {
  const { trackFormInteraction } = useTracking();

  const trackFormStart = useCallback(() => {
    trackFormInteraction(formName, 'start');
  }, [formName, trackFormInteraction]);

  const trackFormSubmit = useCallback((success = true, errorMessage = null, formData = {}) => {
    trackFormInteraction(formName, 'submit', {
      success,
      errorMessage,
      ...formData
    });
  }, [formName, trackFormInteraction]);

  const trackFormField = useCallback((fieldName, fieldType) => {
    trackFormInteraction(formName, 'field_focus', {
      field: fieldName,
      type: fieldType
    });
  }, [formName, trackFormInteraction]);

  const trackFormValidation = useCallback((fieldName, errorType) => {
    trackFormInteraction(formName, 'validation_error', {
      field: fieldName,
      errorType
    });
  }, [formName, trackFormInteraction]);

  return {
    trackFormStart,
    trackFormSubmit,
    trackFormField,
    trackFormValidation
  };
};

// Utility for tracking search interactions
export const useTrackedSearch = () => {
  const { trackSearch } = useTracking();

  const trackSearchQuery = useCallback((query, resultsCount = 0, filters = {}) => {
    trackSearch(query, resultsCount, filters);
  }, [trackSearch]);

  const trackSearchResultClick = useCallback((query, resultPosition, resultId) => {
    trackSearch(query, 0, {
      resultClick: {
        position: resultPosition,
        resultId
      }
    });
  }, [trackSearch]);

  return {
    trackSearchQuery,
    trackSearchResultClick
  };
};

// Utility for tracking event interactions
export const useTrackedEvent = () => {
  const { trackEventInteraction } = useEventTracking();

  const trackEventView = useCallback((eventId, eventTitle, eventCategory) => {
    trackEventInteraction(eventId, 'view', {
      eventTitle,
      eventCategory
    });
  }, [trackEventInteraction]);

  const trackEventLike = useCallback((eventId) => {
    trackEventInteraction(eventId, 'like');
  }, [trackEventInteraction]);

  const trackEventShare = useCallback((eventId, sharePlatform) => {
    trackEventInteraction(eventId, 'share', {
      platform: sharePlatform
    });
  }, [trackEventInteraction]);

  const trackEventBookmark = useCallback((eventId) => {
    trackEventInteraction(eventId, 'bookmark');
  }, [trackEventInteraction]);

  return {
    trackEventView,
    trackEventLike,
    trackEventShare,
    trackEventBookmark
  };
};

// Import the event tracking hook
import { useEventTracking } from '../../hooks/useTracking';
