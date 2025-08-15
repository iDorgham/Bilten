# Frontend Tracking Integration Guide

This document provides a comprehensive guide for integrating the tracking system into the Bilten frontend application.

## Overview

The frontend tracking integration provides easy-to-use hooks and components for tracking user behavior, events, conversions, and performance metrics. It integrates seamlessly with the backend tracking API and provides both automatic and manual tracking capabilities.

## Architecture

```
Frontend Tracking System
├── Tracking Service (trackingService.js)
├── Tracking Hooks (useTracking.js)
├── Tracked Components (TrackedElement.js)
└── Example Implementation (TrackingExample.js)
```

## Quick Start

### 1. Basic Setup

Import the main tracking hook in your component:

```javascript
import { useTracking } from '../hooks/useTracking';

const MyComponent = () => {
  const { trackActivity, trackClick, trackConversion } = useTracking();
  
  // Your component logic
};
```

### 2. Automatic Page View Tracking

The `useTracking` hook automatically tracks page views when the component mounts:

```javascript
import { useTracking } from '../hooks/useTracking';

const MyPage = () => {
  // Page views are automatically tracked
  const { trackActivity } = useTracking();
  
  return <div>My Page Content</div>;
};
```

### 3. Manual Event Tracking

Track custom events and user interactions:

```javascript
const { trackActivity, trackClick, trackConversion } = useTracking();

// Track custom activity
trackActivity('button_click', { buttonId: 'cta-button' });

// Track click with element info
trackClick('.cta-button', 'Click here to register', { context: 'homepage' });

// Track conversion
trackConversion('purchase', { amount: 25.00, currency: 'USD' });
```

## Tracking Hooks

### Main Tracking Hook

```javascript
import { useTracking } from '../hooks/useTracking';

const { 
  trackActivity,
  trackClick,
  trackFormInteraction,
  trackSearch,
  trackConversion,
  trackPerformance,
  trackError
} = useTracking();
```

**Available Methods:**
- `trackActivity(eventType, eventData)` - Track general user activities
- `trackClick(elementSelector, elementText, additionalData)` - Track click events
- `trackFormInteraction(formName, action, formData)` - Track form interactions
- `trackSearch(query, resultsCount, filters)` - Track search queries
- `trackConversion(conversionType, conversionData)` - Track conversion events
- `trackPerformance(metricName, value, additionalData)` - Track performance metrics
- `trackError(error, errorContext)` - Track error events

### Event-Specific Tracking Hook

```javascript
import { useEventTracking } from '../hooks/useTracking';

const {
  trackEventView,
  trackEventInteraction,
  trackEventLike,
  trackEventShare,
  trackEventBookmark,
  trackTicketPurchase,
  trackAddToCart
} = useEventTracking();
```

**Available Methods:**
- `trackEventView(eventId, eventTitle, eventCategory, additionalData)` - Track event views
- `trackEventInteraction(eventId, interactionType, interactionData)` - Track event interactions
- `trackEventLike(eventId, additionalData)` - Track event likes
- `trackEventShare(eventId, sharePlatform, additionalData)` - Track event shares
- `trackEventBookmark(eventId, additionalData)` - Track event bookmarks
- `trackTicketPurchase(eventId, ticketId, quantity, totalAmount, additionalData)` - Track ticket purchases
- `trackAddToCart(eventId, ticketId, quantity, price, additionalData)` - Track add to cart events

### Form Tracking Hook

```javascript
import { useFormTracking } from '../hooks/useTracking';

const {
  trackFormStart,
  trackFormSubmit,
  trackFormField,
  trackFormValidation
} = useFormTracking('my_form');
```

**Available Methods:**
- `trackFormStart()` - Track when user starts filling a form
- `trackFormSubmit(success, errorMessage, formData)` - Track form submission
- `trackFormField(fieldName, fieldType)` - Track field focus
- `trackFormValidation(fieldName, errorType)` - Track validation errors

### Search Tracking Hook

```javascript
import { useSearchTracking } from '../hooks/useTracking';

const {
  trackSearchQuery,
  trackSearchFilter,
  trackSearchResultClick
} = useSearchTracking();
```

**Available Methods:**
- `trackSearchQuery(query, resultsCount, filters)` - Track search queries
- `trackSearchFilter(filterName, filterValue)` - Track filter usage
- `trackSearchResultClick(query, resultPosition, resultId)` - Track result clicks

### Engagement Tracking Hook

```javascript
import { useEngagementTracking } from '../hooks/useTracking';

const {
  trackNewsletterSignup,
  trackRegistration,
  trackLogin,
  trackProfileUpdate,
  trackPreferencesChange
} = useEngagementTracking();
```

**Available Methods:**
- `trackNewsletterSignup(email, source)` - Track newsletter signups
- `trackRegistration(userData)` - Track user registrations
- `trackLogin(loginMethod)` - Track user logins
- `trackProfileUpdate(updateType, additionalData)` - Track profile updates
- `trackPreferencesChange(preferenceType, newValue)` - Track preference changes

### Performance Tracking Hook

```javascript
import { usePerformanceTracking } from '../hooks/useTracking';

const {
  trackPageLoadTime,
  trackApiResponseTime,
  trackImageLoadTime,
  trackComponentRenderTime
} = usePerformanceTracking();
```

**Available Methods:**
- `trackPageLoadTime(loadTime)` - Track page load performance
- `trackApiResponseTime(endpoint, responseTime, statusCode)` - Track API performance
- `trackImageLoadTime(imageUrl, loadTime)` - Track image load performance
- `trackComponentRenderTime(componentName, renderTime)` - Track component render time

### Heatmap Tracking Hook

```javascript
import { useHeatmapTracking } from '../hooks/useTracking';

const {
  trackClickHeatmap,
  trackHoverHeatmap
} = useHeatmapTracking();
```

**Available Methods:**
- `trackClickHeatmap(elementSelector, coordinates)` - Track click heatmap data
- `trackHoverHeatmap(elementSelector, coordinates)` - Track hover heatmap data

### Analytics Data Hook

```javascript
import { useAnalyticsData } from '../hooks/useTracking';

const {
  getRealTimeAnalytics,
  getUserJourney,
  getFunnelAnalysis,
  exportAnalyticsData
} = useAnalyticsData();
```

**Available Methods:**
- `getRealTimeAnalytics(timeRange)` - Get real-time analytics data
- `getUserJourney(userId, options)` - Get user journey data
- `getFunnelAnalysis(funnelConfig)` - Get funnel analysis data
- `exportAnalyticsData(exportConfig)` - Export analytics data

## Tracked Components

### Pre-configured Components

```javascript
import {
  TrackedButton,
  TrackedLink,
  TrackedDiv,
  TrackedEventCard,
  TrackedTicketButton,
  TrackedSearchResult,
  TrackedFormField
} from '../components/tracking/TrackedElement';

// Use tracked components
<TrackedButton onClick={handleClick}>Click Me</TrackedButton>
<TrackedLink href="/events">Events</TrackedLink>
<TrackedEventCard onClick={handleEventClick}>Event Card</TrackedEventCard>
```

### Custom Tracked Components

```javascript
import { withTracking } from '../components/tracking/TrackedElement';

// Create custom tracked component
const TrackedCustomButton = withTracking('button', {
  trackHover: true,
  clickData: {
    component: 'CustomButton'
  }
});

// Use with custom tracking data
<TrackedCustomButton 
  trackingData={{ context: 'homepage', section: 'hero' }}
  onClick={handleClick}
>
  Custom Button
</TrackedCustomButton>
```

### Utility Hooks for Components

```javascript
import {
  useTrackedForm,
  useTrackedSearch,
  useTrackedEvent
} from '../components/tracking/TrackedElement';

// Form tracking utility
const { trackFormStart, trackFormSubmit } = useTrackedForm('contact_form');

// Search tracking utility
const { trackSearchQuery } = useTrackedSearch();

// Event tracking utility
const { trackEventView, trackEventLike } = useTrackedEvent();
```

## Implementation Examples

### 1. Event Card Component

```javascript
import React from 'react';
import { useEventTracking } from '../hooks/useTracking';
import { TrackedEventCard, TrackedButton } from '../components/tracking/TrackedElement';

const EventCard = ({ event }) => {
  const { trackEventView, trackEventLike, trackEventShare, trackAddToCart } = useEventTracking();

  const handleCardClick = () => {
    trackEventView(event.id, event.title, event.category);
  };

  const handleLike = (e) => {
    e.stopPropagation();
    trackEventLike(event.id);
  };

  const handleShare = (e) => {
    e.stopPropagation();
    trackEventShare(event.id, 'facebook');
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    trackAddToCart(event.id, event.ticketId, 1, event.price);
  };

  return (
    <TrackedEventCard
      onClick={handleCardClick}
      trackingData={{
        eventId: event.id,
        eventTitle: event.title,
        eventCategory: event.category
      }}
    >
      <h3>{event.title}</h3>
      <p>{event.description}</p>
      <div className="actions">
        <TrackedButton onClick={handleLike}>Like</TrackedButton>
        <TrackedButton onClick={handleShare}>Share</TrackedButton>
        <TrackedButton onClick={handleAddToCart}>Add to Cart</TrackedButton>
      </div>
    </TrackedEventCard>
  );
};
```

### 2. Search Component

```javascript
import React, { useState } from 'react';
import { useSearchTracking } from '../hooks/useTracking';
import { TrackedSearchResult } from '../components/tracking/TrackedElement';

const SearchComponent = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const { trackSearchQuery, trackSearchFilter, trackSearchResultClick } = useSearchTracking();

  const handleSearch = async (searchQuery) => {
    setQuery(searchQuery);
    const searchResults = await performSearch(searchQuery);
    trackSearchQuery(searchQuery, searchResults.length);
    setResults(searchResults);
  };

  const handleFilter = (filterName, filterValue) => {
    trackSearchFilter(filterName, filterValue);
    // Apply filter logic
  };

  const handleResultClick = (result, position) => {
    trackSearchResultClick(query, position, result.id);
    // Navigate to result
  };

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search events..."
      />
      
      <div className="filters">
        <button onClick={() => handleFilter('category', 'music')}>Music</button>
        <button onClick={() => handleFilter('category', 'sports')}>Sports</button>
      </div>

      <div className="results">
        {results.map((result, index) => (
          <TrackedSearchResult
            key={result.id}
            onClick={() => handleResultClick(result, index + 1)}
            trackingData={{
              resultId: result.id,
              position: index + 1
            }}
          >
            <h3>{result.title}</h3>
            <p>{result.description}</p>
          </TrackedSearchResult>
        ))}
      </div>
    </div>
  );
};
```

### 3. Form Component

```javascript
import React, { useState } from 'react';
import { useFormTracking } from '../hooks/useTracking';
import { TrackedFormField, TrackedButton } from '../components/tracking/TrackedElement';

const ContactForm = () => {
  const [formData, setFormData] = useState({});
  const { trackFormStart, trackFormSubmit, trackFormField, trackFormValidation } = useFormTracking('contact_form');

  const handleFormFocus = () => {
    trackFormStart();
  };

  const handleFieldFocus = (fieldName, fieldType) => {
    trackFormField(fieldName, fieldType);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await submitForm(formData);
      trackFormSubmit(true, null, formData);
      // Handle success
    } catch (error) {
      trackFormSubmit(false, error.message, formData);
      // Handle error
    }
  };

  const handleValidationError = (fieldName, errorType) => {
    trackFormValidation(fieldName, errorType);
  };

  return (
    <form onSubmit={handleSubmit} onFocus={handleFormFocus}>
      <TrackedFormField
        type="text"
        name="name"
        placeholder="Your Name"
        onFocus={() => handleFieldFocus('name', 'text')}
        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        onInvalid={() => handleValidationError('name', 'required')}
      />
      
      <TrackedFormField
        type="email"
        name="email"
        placeholder="Your Email"
        onFocus={() => handleFieldFocus('email', 'email')}
        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
        onInvalid={() => handleValidationError('email', 'format')}
      />
      
      <TrackedButton type="submit">Submit</TrackedButton>
    </form>
  );
};
```

### 4. Performance Monitoring

```javascript
import React, { useEffect } from 'react';
import { usePerformanceTracking } from '../hooks/useTracking';

const PerformanceMonitor = () => {
  const { trackPageLoadTime, trackApiResponseTime, trackComponentRenderTime } = usePerformanceTracking();

  useEffect(() => {
    // Track page load time
    const startTime = performance.now();
    
    const trackLoadTime = () => {
      const loadTime = performance.now() - startTime;
      trackPageLoadTime(loadTime);
    };

    if (document.readyState === 'complete') {
      trackLoadTime();
    } else {
      window.addEventListener('load', trackLoadTime);
      return () => window.removeEventListener('load', trackLoadTime);
    }
  }, [trackPageLoadTime]);

  // Track component render time
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const renderTime = performance.now() - startTime;
      trackComponentRenderTime('PerformanceMonitor', renderTime);
    };
  }, [trackComponentRenderTime]);

  // Track API calls
  const fetchData = async () => {
    const startTime = performance.now();
    
    try {
      const response = await fetch('/api/data');
      const responseTime = performance.now() - startTime;
      trackApiResponseTime('/api/data', responseTime, response.status);
      return response.json();
    } catch (error) {
      const responseTime = performance.now() - startTime;
      trackApiResponseTime('/api/data', responseTime, 0);
      throw error;
    }
  };

  return <div>Performance Monitor Component</div>;
};
```

## Configuration

### Environment Variables

Add the following environment variables to your `.env` file:

```env
REACT_APP_API_BASE_URL=http://localhost:3001/api/v1
REACT_APP_TRACKING_ENABLED=true
REACT_APP_TRACKING_DEBUG=false
```

### API Configuration

The tracking service automatically uses the API configuration from your app's config:

```javascript
// src/config/api.js
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api/v1',
  // ... other config
};
```

## Best Practices

### 1. Error Handling

Always wrap tracking calls in try-catch blocks to prevent tracking errors from breaking user experience:

```javascript
const handleClick = async () => {
  try {
    await trackClick('.my-button', 'Click me', { context: 'homepage' });
  } catch (error) {
    console.error('Failed to track click:', error);
    // Don't throw - tracking should not break functionality
  }
};
```

### 2. Performance Optimization

Use throttling for frequent events like scroll tracking:

```javascript
const { trackScroll } = useTracking();
const scrollTimeoutRef = useRef(null);

const handleScroll = () => {
  if (scrollTimeoutRef.current) {
    clearTimeout(scrollTimeoutRef.current);
  }
  
  scrollTimeoutRef.current = setTimeout(() => {
    const scrollDepth = calculateScrollDepth();
    trackScroll(scrollDepth);
  }, 100);
};
```

### 3. Data Consistency

Use consistent naming conventions for tracking data:

```javascript
// Good
trackActivity('button_click', { buttonId: 'cta-primary', page: 'homepage' });
trackConversion('purchase', { amount: 25.00, currency: 'USD', eventId: 'event123' });

// Avoid
trackActivity('click', { id: 'btn', page: 'home' });
trackConversion('buy', { price: 25, event: 'event123' });
```

### 4. Privacy Compliance

Ensure tracking respects user privacy preferences:

```javascript
const { trackActivity } = useTracking();

const handleTracking = (eventData) => {
  // Check user consent
  if (userConsent.tracking) {
    trackActivity('user_action', eventData);
  }
};
```

## Debugging

### Enable Debug Mode

Set the environment variable to enable debug logging:

```env
REACT_APP_TRACKING_DEBUG=true
```

### Manual Debug

You can manually inspect tracking data in the browser console:

```javascript
// Check if tracking service is working
console.log('Tracking service:', trackingService);

// Check session ID
console.log('Session ID:', trackingService.sessionId);

// Test tracking call
trackingService.trackUserActivity('test', { debug: true });
```

## Testing

### Unit Testing

```javascript
import { renderHook } from '@testing-library/react-hooks';
import { useTracking } from '../hooks/useTracking';

test('useTracking should provide tracking methods', () => {
  const { result } = renderHook(() => useTracking());
  
  expect(result.current.trackActivity).toBeDefined();
  expect(result.current.trackClick).toBeDefined();
  expect(result.current.trackConversion).toBeDefined();
});
```

### Integration Testing

```javascript
import { render, fireEvent } from '@testing-library/react';
import { TrackedButton } from '../components/tracking/TrackedElement';

test('TrackedButton should track clicks', () => {
  const mockTrackClick = jest.fn();
  
  const { getByText } = render(
    <TrackedButton onClick={() => {}} trackingData={{ test: true }}>
      Click Me
    </TrackedButton>
  );
  
  fireEvent.click(getByText('Click Me'));
  
  // Verify tracking was called
  expect(mockTrackClick).toHaveBeenCalled();
});
```

## Troubleshooting

### Common Issues

1. **Tracking not working**: Check if the backend tracking API is running and accessible
2. **Authentication errors**: Ensure the user is authenticated and the token is valid
3. **Performance issues**: Check if tracking calls are being throttled properly
4. **Data not appearing**: Verify the tracking data format matches backend expectations

### Debug Steps

1. Check browser console for errors
2. Verify API endpoints are accessible
3. Check authentication token
4. Validate tracking data format
5. Test with simple tracking calls

## Support

For issues or questions about the tracking integration:

1. Check this documentation
2. Review the example implementation
3. Check the browser console for errors
4. Verify backend tracking API is working
5. Contact the development team

## Changelog

### Version 1.0.0
- Initial release of tracking hooks and components
- Support for user activity, event, form, and search tracking
- Performance and heatmap tracking capabilities
- Pre-configured tracked components
- Comprehensive documentation and examples
