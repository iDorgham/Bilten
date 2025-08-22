import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';

export const useLiveEvents = () => {
  const [liveEvents, setLiveEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  // Check for live events
  const checkLiveEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Checking for live events...');
      const result = await apiService.getLiveEvents();
      console.log('Live events result:', result);
      
      if (result.success) {
        setLiveEvents(result.liveEvents);
        setLastChecked(new Date());
        console.log('Live events found:', result.liveEvents.length);
      } else {
        setError(result.error || 'Failed to fetch live events');
        setLiveEvents([]);
        console.log('Failed to fetch live events:', result.error);
      }
    } catch (err) {
      setError(err.message);
      setLiveEvents([]);
      console.error('Error checking live events:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial check on mount
  useEffect(() => {
    checkLiveEvents();
  }, [checkLiveEvents]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      checkLiveEvents();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [checkLiveEvents]);

  // Check if there are any live events
  const hasLiveEvents = liveEvents.length > 0;

  // Get live events count
  const liveEventsCount = liveEvents.length;

  // Get live events info for display
  const getLiveEventsInfo = () => {
    if (liveEvents.length === 0) {
      return {
        message: 'No live events currently running',
        events: []
      };
    }

    return {
      message: `${liveEvents.length} live event${liveEvents.length > 1 ? 's' : ''} currently running`,
      events: liveEvents.map(event => ({
        id: event.id,
        title: event.title,
        venue: event.venue_name,
        startTime: new Date(event.start_date).toLocaleTimeString(),
        endTime: new Date(event.end_date).toLocaleTimeString()
      }))
    };
  };

  return {
    liveEvents,
    isLoading,
    error,
    lastChecked,
    hasLiveEvents,
    liveEventsCount,
    getLiveEventsInfo,
    checkLiveEvents,
    refresh: checkLiveEvents
  };
};
