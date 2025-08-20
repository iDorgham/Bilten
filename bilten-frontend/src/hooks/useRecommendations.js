import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import recommendationService from '../services/recommendationService';

export const useRecommendations = (options = {}) => {
  const { user, isAuthenticated } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchRecommendations = useCallback(async (fetchOptions = {}) => {
    if (!isAuthenticated) {
      setError('Authentication required for recommendations');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const mergedOptions = { ...options, ...fetchOptions };
      const response = await recommendationService.getRecommendations(mergedOptions);
      
      if (response.success) {
        const formattedRecommendations = recommendationService.formatRecommendations(
          response.data.recommendations
        );
        setRecommendations(formattedRecommendations);
        setLastUpdated(new Date());
      } else {
        setError(response.message || 'Failed to fetch recommendations');
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError(err.message || 'Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, options]);

  const refreshRecommendations = useCallback(() => {
    return fetchRecommendations();
  }, [fetchRecommendations]);

  const trackInteraction = useCallback(async (eventId, action, context = {}) => {
    if (!isAuthenticated) return;

    try {
      await recommendationService.trackInteraction(eventId, action, {
        ...context,
        timestamp: new Date().toISOString(),
        userId: user?.id
      });
    } catch (err) {
      console.error('Error tracking interaction:', err);
    }
  }, [isAuthenticated, user]);

  // Auto-fetch recommendations when component mounts or user changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchRecommendations();
    }
  }, [isAuthenticated, fetchRecommendations]);

  return {
    recommendations,
    loading,
    error,
    lastUpdated,
    fetchRecommendations,
    refreshRecommendations,
    trackInteraction
  };
};

export const useTrendingEvents = (limit = 10) => {
  const [trendingEvents, setTrendingEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTrendingEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await recommendationService.getTrendingEvents(limit);
      
      if (response.success) {
        const formattedEvents = recommendationService.formatRecommendations(
          response.data.events
        );
        setTrendingEvents(formattedEvents);
      } else {
        setError(response.message || 'Failed to fetch trending events');
      }
    } catch (err) {
      console.error('Error fetching trending events:', err);
      setError(err.message || 'Failed to fetch trending events');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchTrendingEvents();
  }, [fetchTrendingEvents]);

  return {
    trendingEvents,
    loading,
    error,
    refresh: fetchTrendingEvents
  };
};

export const useSimilarEvents = (eventId, limit = 6) => {
  const [similarEvents, setSimilarEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSimilarEvents = useCallback(async () => {
    if (!eventId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await recommendationService.getSimilarEvents(eventId, limit);
      
      if (response.success) {
        const formattedEvents = recommendationService.formatRecommendations(
          response.data.similarEvents
        );
        setSimilarEvents(formattedEvents);
      } else {
        setError(response.message || 'Failed to fetch similar events');
      }
    } catch (err) {
      console.error('Error fetching similar events:', err);
      setError(err.message || 'Failed to fetch similar events');
    } finally {
      setLoading(false);
    }
  }, [eventId, limit]);

  useEffect(() => {
    fetchSimilarEvents();
  }, [fetchSimilarEvents]);

  return {
    similarEvents,
    loading,
    error,
    refresh: fetchSimilarEvents
  };
};

export const useForYouRecommendations = (limit = 8) => {
  const { isAuthenticated } = useAuth();
  const [forYouEvents, setForYouEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchForYouRecommendations = useCallback(async () => {
    if (!isAuthenticated) {
      setError('Authentication required for personalized recommendations');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await recommendationService.getForYouRecommendations(limit);
      
      if (response.success) {
        const formattedEvents = recommendationService.formatRecommendations(
          response.data.events
        );
        setForYouEvents(formattedEvents);
      } else {
        setError(response.message || 'Failed to fetch personalized recommendations');
      }
    } catch (err) {
      console.error('Error fetching for-you recommendations:', err);
      setError(err.message || 'Failed to fetch personalized recommendations');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, limit]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchForYouRecommendations();
    }
  }, [isAuthenticated, fetchForYouRecommendations]);

  return {
    forYouEvents,
    loading,
    error,
    refresh: fetchForYouRecommendations
  };
};

export const useUserPreferences = () => {
  const { isAuthenticated } = useAuth();
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPreferences = useCallback(async () => {
    if (!isAuthenticated) {
      setError('Authentication required for user preferences');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await recommendationService.getUserPreferences();
      
      if (response.success) {
        setPreferences(response.data);
      } else {
        setError(response.message || 'Failed to fetch user preferences');
      }
    } catch (err) {
      console.error('Error fetching user preferences:', err);
      setError(err.message || 'Failed to fetch user preferences');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPreferences();
    }
  }, [isAuthenticated, fetchPreferences]);

  return {
    preferences,
    loading,
    error,
    refresh: fetchPreferences
  };
};

export const useRecommendationTracking = () => {
  const { isAuthenticated } = useAuth();

  const trackEventView = useCallback((eventId, source = 'recommendation') => {
    if (!isAuthenticated) return;
    return recommendationService.trackEventView(eventId, source);
  }, [isAuthenticated]);

  const trackEventClick = useCallback((eventId, source = 'recommendation') => {
    if (!isAuthenticated) return;
    return recommendationService.trackEventClick(eventId, source);
  }, [isAuthenticated]);

  const trackEventPurchase = useCallback((eventId, source = 'recommendation') => {
    if (!isAuthenticated) return;
    return recommendationService.trackEventPurchase(eventId, source);
  }, [isAuthenticated]);

  const trackEventWishlist = useCallback((eventId, source = 'recommendation') => {
    if (!isAuthenticated) return;
    return recommendationService.trackEventWishlist(eventId, source);
  }, [isAuthenticated]);

  const trackEventShare = useCallback((eventId, source = 'recommendation') => {
    if (!isAuthenticated) return;
    return recommendationService.trackEventShare(eventId, source);
  }, [isAuthenticated]);

  return {
    trackEventView,
    trackEventClick,
    trackEventPurchase,
    trackEventWishlist,
    trackEventShare
  };
};
