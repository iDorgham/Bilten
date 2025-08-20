import React, { useState, useEffect } from 'react';
import {
  useTracking,
  useEventTracking,
  useFormTracking,
  useSearchTracking,
  useEngagementTracking,
  usePerformanceTracking,
  useHeatmapTracking,
  useAnalyticsData
} from '../../hooks/useTracking';
import {
  TrackedButton,
  TrackedLink,
  TrackedEventCard,
  TrackedTicketButton,
  TrackedSearchResult,
  TrackedFormField,
  useTrackedForm,
  useTrackedSearch,
  useTrackedEvent
} from '../tracking/TrackedElement';

const TrackingExample = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [formData, setFormData] = useState({});
  const [analyticsData, setAnalyticsData] = useState(null);

  // Initialize all tracking hooks
  const { trackActivity, trackClick, trackPerformance } = useTracking();
  const { trackEventView, trackEventLike, trackEventShare, trackAddToCart } = useEventTracking();
  const { trackFormStart, trackFormSubmit, trackFormField, trackFormValidation } = useFormTracking('example_form');
  const { trackSearchQuery, trackSearchFilter } = useSearchTracking();
  const { trackNewsletterSignup, trackRegistration, trackLogin } = useEngagementTracking();
  const { trackPageLoadTime, trackApiResponseTime } = usePerformanceTracking();
  const { trackClickHeatmap, trackHoverHeatmap } = useHeatmapTracking();
  const { getRealTimeAnalytics, getUserJourney, getFunnelAnalysis } = useAnalyticsData();

  // Alternative hooks using the utility functions
  const { trackFormStart: altTrackFormStart, trackFormSubmit: altTrackFormSubmit } = useTrackedForm('alternative_form');
  const { trackSearchQuery: altTrackSearchQuery } = useTrackedSearch();
  const { trackEventView: altTrackEventView, trackEventLike: altTrackEventLike } = useTrackedEvent();

  // Track page load performance
  useEffect(() => {
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

  // Track form interactions
  const handleFormStart = () => {
    trackFormStart();
    altTrackFormStart();
  };

  const handleFormFieldFocus = (fieldName, fieldType) => {
    trackFormField(fieldName, fieldType);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Simulate form submission
      const startTime = performance.now();
      await new Promise(resolve => setTimeout(resolve, 1000));
      const responseTime = performance.now() - startTime;
      
      trackApiResponseTime('/api/submit-form', responseTime, 200);
      trackFormSubmit(true, null, formData);
      altTrackFormSubmit(true, null, formData);
      
      // Track successful form submission as conversion
      trackActivity('form_completion', {
        formName: 'example_form',
        fields: Object.keys(formData).length
      });
      
    } catch (error) {
      trackFormSubmit(false, error.message, formData);
      altTrackFormSubmit(false, error.message, formData);
    }
  };

  // Track search interactions
  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    try {
      // Simulate search API call
      const startTime = performance.now();
      const results = await simulateSearch(query);
      const responseTime = performance.now() - startTime;
      
      trackApiResponseTime('/api/search', responseTime, 200);
      trackSearchQuery(query, results.length);
      altTrackSearchQuery(query, results.length);
      
      setSearchResults(results);
      
    } catch (error) {
      trackSearchQuery(query, 0, { error: error.message });
    }
  };

  const handleSearchFilter = (filterName, filterValue) => {
    trackSearchFilter(filterName, filterValue);
  };

  // Track event interactions
  const handleEventView = (eventId, eventTitle, eventCategory) => {
    trackEventView(eventId, eventTitle, eventCategory);
    altTrackEventView(eventId, eventTitle, eventCategory);
  };

  const handleEventLike = (eventId) => {
    trackEventLike(eventId);
    altTrackEventLike(eventId);
  };

  const handleEventShare = (eventId, platform) => {
    trackEventShare(eventId, platform);
  };

  const handleAddToCart = (eventId, ticketId, quantity, price) => {
    trackAddToCart(eventId, ticketId, quantity, price);
  };

  // Track engagement events
  const handleNewsletterSignup = (email) => {
    trackNewsletterSignup(email, 'example_page');
  };

  const handleRegistration = (userData) => {
    trackRegistration(userData);
  };

  const handleLogin = (method) => {
    trackLogin(method);
  };

  // Track custom activities
  const handleCustomActivity = () => {
    trackActivity('custom_action', {
      action: 'button_click',
      context: 'example_page'
    });
  };

  // Get analytics data
  const fetchAnalyticsData = async () => {
    try {
      const realTimeData = await getRealTimeAnalytics('1h');
      const userJourney = await getUserJourney('user123', { limit: 10 });
      const funnelData = await getFunnelAnalysis({
        steps: ['page_view', 'event_view', 'add_to_cart', 'purchase']
      });
      
      setAnalyticsData({
        realTime: realTimeData,
        userJourney,
        funnel: funnelData
      });
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    }
  };

  // Simulate search API
  const simulateSearch = async (query) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
      { id: '1', title: `Event 1 - ${query}`, category: 'Music' },
      { id: '2', title: `Event 2 - ${query}`, category: 'Sports' },
      { id: '3', title: `Event 3 - ${query}`, category: 'Technology' }
    ];
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Tracking Integration Example</h1>
      
      {/* Form Tracking Example */}
      <section className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Form Tracking</h2>
        <form onSubmit={handleFormSubmit} onFocus={handleFormStart}>
          <div className="space-y-4">
            <TrackedFormField
              type="text"
              placeholder="Name"
              className="w-full p-2 border rounded"
              onFocus={() => handleFormFieldFocus('name', 'text')}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
            <TrackedFormField
              type="email"
              placeholder="Email"
              className="w-full p-2 border rounded"
              onFocus={() => handleFormFieldFocus('email', 'email')}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            />
            <TrackedButton
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Submit Form
            </TrackedButton>
          </div>
        </form>
      </section>

      {/* Search Tracking Example */}
      <section className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Search Tracking</h2>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Search events..."
            className="w-full p-2 border rounded"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
          <div className="flex space-x-2">
            <TrackedButton
              onClick={() => handleSearchFilter('category', 'music')}
              className="px-3 py-1 bg-gray-200 rounded"
            >
              Music
            </TrackedButton>
            <TrackedButton
              onClick={() => handleSearchFilter('category', 'sports')}
              className="px-3 py-1 bg-gray-200 rounded"
            >
              Sports
            </TrackedButton>
          </div>
          {searchResults.map((result, index) => (
            <TrackedSearchResult
              key={result.id}
              className="p-3 border rounded cursor-pointer hover:bg-gray-50"
              trackingData={{ resultId: result.id, position: index + 1 }}
              onClick={() => handleSearchFilter('result_click', result.id)}
            >
              <h3 className="font-semibold">{result.title}</h3>
              <p className="text-gray-600">{result.category}</p>
            </TrackedSearchResult>
          ))}
        </div>
      </section>

      {/* Event Tracking Example */}
      <section className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Event Tracking</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TrackedEventCard
            className="p-4 border rounded-lg cursor-pointer hover:shadow-md"
            trackingData={{ eventId: 'event1', eventTitle: 'Summer Music Festival', eventCategory: 'Music' }}
            onClick={() => handleEventView('event1', 'Summer Music Festival', 'Music')}
          >
            <h3 className="font-semibold">Summer Music Festival</h3>
            <p className="text-gray-600">Amazing music festival in the park</p>
            <div className="flex space-x-2 mt-3">
              <TrackedButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleEventLike('event1');
                }}
                className="px-3 py-1 bg-red-500 text-white rounded text-sm"
              >
                Like
              </TrackedButton>
              <TrackedButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleEventShare('event1', 'facebook');
                }}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
              >
                Share
              </TrackedButton>
              <TrackedTicketButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToCart('event1', 'ticket1', 1, 25.00);
                }}
                className="px-3 py-1 bg-green-500 text-white rounded text-sm"
              >
                Add to Cart
              </TrackedTicketButton>
            </div>
          </TrackedEventCard>
        </div>
      </section>

      {/* Engagement Tracking Example */}
      <section className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Engagement Tracking</h2>
        <div className="space-y-4">
          <TrackedButton
            onClick={() => handleNewsletterSignup('user@example.com')}
            className="px-4 py-2 bg-purple-500 text-white rounded"
          >
            Subscribe to Newsletter
          </TrackedButton>
          <TrackedButton
            onClick={() => handleRegistration({ email: 'user@example.com', source: 'example_page' })}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            Register Account
          </TrackedButton>
          <TrackedButton
            onClick={() => handleLogin('email')}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Login
          </TrackedButton>
        </div>
      </section>

      {/* Custom Activity Tracking */}
      <section className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Custom Activity Tracking</h2>
        <TrackedButton
          onClick={handleCustomActivity}
          className="px-4 py-2 bg-orange-500 text-white rounded"
        >
          Track Custom Activity
        </TrackedButton>
      </section>

      {/* Analytics Data Display */}
      <section className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Analytics Data</h2>
        <TrackedButton
          onClick={fetchAnalyticsData}
          className="px-4 py-2 bg-indigo-500 text-white rounded mb-4"
        >
          Fetch Analytics Data
        </TrackedButton>
        
        {analyticsData && (
          <div className="space-y-4">
            <div className="p-3 bg-gray-100 rounded">
              <h3 className="font-semibold">Real-time Analytics</h3>
              <pre className="text-sm">{JSON.stringify(analyticsData.realTime, null, 2)}</pre>
            </div>
            <div className="p-3 bg-gray-100 rounded">
              <h3 className="font-semibold">User Journey</h3>
              <pre className="text-sm">{JSON.stringify(analyticsData.userJourney, null, 2)}</pre>
            </div>
            <div className="p-3 bg-gray-100 rounded">
              <h3 className="font-semibold">Funnel Analysis</h3>
              <pre className="text-sm">{JSON.stringify(analyticsData.funnel, null, 2)}</pre>
            </div>
          </div>
        )}
      </section>

      {/* Performance Tracking Example */}
      <section className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Performance Tracking</h2>
        <TrackedButton
          onClick={async () => {
            const startTime = performance.now();
            await new Promise(resolve => setTimeout(resolve, 1000));
            const loadTime = performance.now() - startTime;
            trackPerformance('custom_operation', loadTime, { operation: 'simulated_task' });
          }}
          className="px-4 py-2 bg-yellow-500 text-white rounded"
        >
          Simulate Slow Operation
        </TrackedButton>
      </section>

      {/* Heatmap Tracking Example */}
      <section className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Heatmap Tracking</h2>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <TrackedDiv
              key={i}
              className="h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded cursor-pointer flex items-center justify-center text-white font-semibold"
              trackingData={{ heatmapZone: `zone_${i}` }}
            >
              Zone {i}
            </TrackedDiv>
          ))}
        </div>
      </section>
    </div>
  );
};

export default TrackingExample;
