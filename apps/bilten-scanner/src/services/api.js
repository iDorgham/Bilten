import axios from 'axios';

// API Configuration
const API_CONFIG = {
  BASE_URL: process.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1',
  TIMEOUT: 10000, // 10 seconds
};

// Create axios instance
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API service functions
export const apiService = {
  // Check for live events
  async getLiveEvents() {
    try {
      console.log('API: Fetching events from:', api.defaults.baseURL);
      const response = await api.get('/events', {
        params: {
          status: 'published',
          limit: 100 // Get more events to check
        }
      });
      
      console.log('API: Raw response:', response.data);
      const events = response.data.data.events || [];
      const now = new Date();
      
      console.log('API: Current time:', now.toISOString());
      console.log('API: Total events found:', events.length);
      
      // Filter for events that are currently live (started but not ended)
      const liveEvents = events.filter(event => {
        const startDate = new Date(event.start_date);
        const endDate = new Date(event.end_date);
        const isLive = now >= startDate && now <= endDate;
        console.log(`API: Event "${event.title}" - Start: ${startDate.toISOString()}, End: ${endDate.toISOString()}, IsLive: ${isLive}`);
        return isLive;
      });
      
      console.log('API: Live events found:', liveEvents.length);
      
      return {
        success: true,
        liveEvents,
        totalLive: liveEvents.length
      };
    } catch (error) {
      console.error('API: Error fetching live events:', error);
      return {
        success: false,
        liveEvents: [],
        totalLive: 0,
        error: error.message
      };
    }
  },

  // Validate ticket
  async validateTicket(ticketData) {
    try {
      const response = await api.post('/tickets/validate', ticketData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error validating ticket:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }
};

export default apiService;
