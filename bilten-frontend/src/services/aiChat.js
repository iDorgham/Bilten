import axios from 'axios';
import { API_CONFIG } from '../config/api';

// Create axios instance for AI chat
const aiChatAPI = axios.create({
  baseURL: `${API_CONFIG.BASE_URL}/ai-chat`,
  timeout: 30000, // 30 seconds timeout for AI responses
});

// Add request interceptor to include auth token
aiChatAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
aiChatAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('AI Chat API Error:', error);
    return Promise.reject(error);
  }
);

export const aiChatService = {
  // Send message to AI assistant
  sendMessage: async (message, context = {}) => {
    try {
      const response = await aiChatAPI.post('/chat', {
        message,
        context: {
          userPreferences: context.userPreferences || {},
          location: context.location || null,
          interests: context.interests || [],
          ...context
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error sending message to AI:', error);
      throw error;
    }
  },

  // Get event recommendations based on AI chat
  getEventRecommendations: async (chatHistory, userPreferences = {}) => {
    try {
      const response = await aiChatAPI.post('/recommendations', {
        chatHistory,
        userPreferences
      });
      return response.data;
    } catch (error) {
      console.error('Error getting AI recommendations:', error);
      throw error;
    }
  },

  // Get AI chat history for user
  getChatHistory: async (limit = 50) => {
    try {
      const response = await aiChatAPI.get(`/history?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error getting chat history:', error);
      throw error;
    }
  },

  // Clear chat history
  clearChatHistory: async () => {
    try {
      const response = await aiChatAPI.delete('/history');
      return response.data;
    } catch (error) {
      console.error('Error clearing chat history:', error);
      throw error;
    }
  },

  // Mock AI response for development (remove when backend is ready)
  mockAIResponse: async (message) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockResponses = {
      'hello': 'Hello! I\'m your AI assistant. I can help you find amazing events based on your interests, location, and preferences. What kind of events are you looking for?',
      'events': 'I can help you discover events! Tell me more about what you\'re interested in. Are you looking for music concerts, business networking, art exhibitions, sports events, or something else?',
      'music': 'Great! I love music events too. I can recommend concerts, festivals, and live performances. What genre do you prefer? Rock, pop, jazz, classical, or electronic?',
      'business': 'Perfect! I can help you find networking events, conferences, workshops, and business meetups. Are you interested in startup events, industry conferences, or networking opportunities?',
      'art': 'Excellent choice! I can recommend art exhibitions, gallery openings, cultural festivals, and creative workshops. Do you prefer contemporary art, classical exhibitions, or interactive art experiences?',
      'sports': 'Awesome! I can help you find sports events, tournaments, fitness classes, and outdoor activities. What sports are you interested in? Football, basketball, tennis, or something else?',
      'free': 'I can help you find free events! There are many great free events including community gatherings, free concerts, art exhibitions, and educational workshops. What interests you?',
      'weekend': 'Perfect! I can recommend events happening this weekend. Let me know what type of events you\'re interested in and I\'ll find the best options for you.',
      'near me': 'I can help you find events near your location! To provide better recommendations, could you tell me your city or area? I can then suggest local events that match your interests.',
      'recommend': 'I\'d be happy to recommend events for you! To give you the best suggestions, tell me about your interests, preferred dates, and any specific requirements you have.'
    };

    // Find the best matching response
    const lowerMessage = message.toLowerCase();
    let bestMatch = 'recommend';
    
    for (const [key, response] of Object.entries(mockResponses)) {
      if (lowerMessage.includes(key)) {
        bestMatch = key;
        break;
      }
    }

    return {
      success: true,
      data: {
        message: mockResponses[bestMatch],
        recommendations: [
          {
            id: 1,
            title: "Startup Networking Event",
            description: "Connect with entrepreneurs and investors",
            date: "2024-11-20",
            category: "business",
            price: "Free"
          },
          {
            id: 2,
            title: "Jazz Night at Downtown",
            description: "Live jazz music in a cozy atmosphere",
            date: "2024-11-22",
            category: "music",
            price: "$25"
          },
          {
            id: 3,
            title: "Contemporary Art Exhibition",
            description: "Modern art showcase featuring local artists",
            date: "2024-11-25",
            category: "art",
            price: "Free"
          }
        ],
        suggestedActions: [
          "View all events",
          "Set preferences",
          "Get notifications"
        ]
      }
    };
  }
};
