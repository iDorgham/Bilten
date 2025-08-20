import axios from 'axios';
import { API_CONFIG } from '../config/api';
import { mockAPI } from './mockApi';

const API_BASE_URL = API_CONFIG.BASE_URL;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: API_CONFIG.TIMEOUT,
});

// Track if backend is available
let backendAvailable = true;

// Function to check if we should use mock API
const shouldUseMock = () => {
  return API_CONFIG.USE_MOCK || !backendAvailable;
};

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle network errors
api.interceptors.response.use(
  (response) => {
    backendAvailable = true;
    return response;
  },
  (error) => {
    // Check if it's a network error (backend not available)
    if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || !error.response) {
      console.warn('🔄 Backend not available, falling back to mock API');
      backendAvailable = false;
    }
    return Promise.reject(error);
  }
);

// Auth API with automatic fallback to mock
export const authAPI = {
  login: async (credentials) => {
    if (shouldUseMock()) {
      return mockAPI.auth.login(credentials);
    }
    try {
      return await api.post('/auth/login', credentials);
    } catch (error) {
      if (!backendAvailable) {
        console.log('🔄 Using mock auth API');
        return mockAPI.auth.login(credentials);
      }
      throw error;
    }
  },
  
  register: async (userData) => {
    if (shouldUseMock()) {
      return mockAPI.auth.register(userData);
    }
    try {
      return await api.post('/auth/register', userData);
    } catch (error) {
      if (!backendAvailable) {
        console.log('🔄 Using mock auth API');
        return mockAPI.auth.register(userData);
      }
      throw error;
    }
  },
  
  logout: async () => {
    if (shouldUseMock()) {
      return mockAPI.auth.logout();
    }
    try {
      return await api.post('/auth/logout');
    } catch (error) {
      if (!backendAvailable) {
        console.log('🔄 Using mock auth API');
        return mockAPI.auth.logout();
      }
      throw error;
    }
  },
  
  changePassword: async (passwordData) => {
    if (shouldUseMock()) {
      return mockAPI.auth.changePassword(passwordData);
    }
    try {
      return await api.put('/auth/change-password', passwordData);
    } catch (error) {
      if (!backendAvailable) {
        console.log('🔄 Using mock auth API');
        return mockAPI.auth.changePassword(passwordData);
      }
      throw error;
    }
  },
  
  forgotPassword: async (email) => {
    if (shouldUseMock()) {
      return mockAPI.auth.forgotPassword({ email });
    }
    try {
      return await api.post('/auth/forgot-password', { email });
    } catch (error) {
      if (!backendAvailable) {
        console.log('🔄 Using mock auth API');
        return mockAPI.auth.forgotPassword({ email });
      }
      throw error;
    }
  },
  
  resetPassword: async (token, newPassword) => {
    if (shouldUseMock()) {
      return mockAPI.auth.resetPassword({ token, newPassword });
    }
    try {
      return await api.post('/auth/reset-password', { token, newPassword });
    } catch (error) {
      if (!backendAvailable) {
        console.log('🔄 Using mock auth API');
        return mockAPI.auth.resetPassword({ token, newPassword });
      }
      throw error;
    }
  },
  
  verifyEmail: async (token) => {
    if (shouldUseMock()) {
      return mockAPI.auth.verifyEmail({ token });
    }
    try {
      return await api.post('/auth/verify-email', { token });
    } catch (error) {
      if (!backendAvailable) {
        console.log('🔄 Using mock auth API');
        return mockAPI.auth.verifyEmail({ token });
      }
      throw error;
    }
  },
  
  resendVerification: async (email) => {
    if (shouldUseMock()) {
      return mockAPI.auth.resendVerification({ email });
    }
    try {
      return await api.post('/auth/resend-verification', { email });
    } catch (error) {
      if (!backendAvailable) {
        console.log('🔄 Using mock auth API');
        return mockAPI.auth.resendVerification({ email });
      }
      throw error;
    }
  },
};

// Events API with automatic fallback to mock
export const eventsAPI = {
  getAll: async (params) => {
    if (shouldUseMock()) {
      return mockAPI.events.getAll(params);
    }
    try {
      return await api.get('/events', { params });
    } catch (error) {
      if (!backendAvailable) {
        console.log('🔄 Using mock events API');
        return mockAPI.events.getAll(params);
      }
      throw error;
    }
  },
  
  getById: async (id) => {
    if (shouldUseMock()) {
      return mockAPI.events.getById(id);
    }
    try {
      return await api.get(`/events/${id}`);
    } catch (error) {
      if (!backendAvailable) {
        console.log('🔄 Using mock events API');
        return mockAPI.events.getById(id);
      }
      throw error;
    }
  },
  
  create: async (eventData) => {
    if (shouldUseMock()) {
      return mockAPI.events.create(eventData);
    }
    try {
      return await api.post('/events', eventData);
    } catch (error) {
      if (!backendAvailable) {
        console.log('🔄 Using mock events API');
        return mockAPI.events.create(eventData);
      }
      throw error;
    }
  },
  
  update: (id, eventData) => api.put(`/events/${id}`, eventData),
  delete: (id) => api.delete(`/events/${id}`),
};

// Tickets API
export const ticketsAPI = {
  getByEvent: (eventId) => api.get(`/tickets/event/${eventId}`),
  create: (ticketData) => api.post('/tickets', ticketData),
  update: (id, ticketData) => api.put(`/tickets/${id}`, ticketData),
  delete: (id) => api.delete(`/tickets/${id}`),
  // User tickets
  getMyTickets: (params) => api.get('/tickets/my-tickets', { params }),
  getTicketDetails: (id) => api.get(`/tickets/${id}`),
  generateTickets: (orderId) => api.post('/tickets/generate-tickets', { orderId }),
  validateTicket: (qrCode) => api.post('/tickets/validate', { qrCode }),
  
  // Organizer Ticket Management APIs
  getEventTickets: (eventId, params) => api.get(`/tickets/event/${eventId}`, { params }),
  getEventTicketStats: (eventId) => api.get(`/tickets/event/${eventId}/stats`),
  validateTicketById: (ticketId) => api.post(`/tickets/${ticketId}/validate`),
  cancelTicket: (ticketId) => api.post(`/tickets/${ticketId}/cancel`),
};

// QR Code API
export const qrAPI = {
  // Generate QR code for a specific ticket
  generateTicketQR: (ticketId) => api.get(`/qr/tickets/${ticketId}`),
  
  // Validate QR code for event entry
  validateQRCode: (qrData) => api.post('/qr/validate', { qrData }),
  
  // Generate QR codes for multiple tickets
  generateBulkQRCodes: (ticketIds) => api.post('/qr/bulk', { ticketIds }),
  
  // Get QR code statistics for an event (organizer only)
  getQRStats: (eventId) => api.get(`/qr/stats/${eventId}`),
  
  // Scanner endpoint for QR validation (organizer/admin only)
  scannerValidate: (qrData) => api.post('/qr/scanner/validate', { qrData }),
  
  // Legacy ticket QR endpoints (for backward compatibility)
  getTicketQR: (ticketId) => api.get(`/tickets/${ticketId}/qr`),
};

// Promo Codes API
export const promoCodeAPI = {
  // Create a new promo code (organizer/admin only)
  create: (promoCodeData) => api.post('/promo-codes', promoCodeData),
  
  // Get all promo codes with filters (organizer/admin only)
  getAll: (params) => api.get('/promo-codes', { params }),
  
  // Get promo code by ID (organizer/admin only)
  getById: (id) => api.get(`/promo-codes/${id}`),
  
  // Update promo code (organizer/admin only)
  update: (id, updateData) => api.put(`/promo-codes/${id}`, updateData),
  
  // Delete promo code (organizer/admin only)
  delete: (id) => api.delete(`/promo-codes/${id}`),
  
  // Validate a promo code
  validate: (code, validationData) => api.post(`/promo-codes/${code}/validate`, validationData),
  
  // Validate promo code for checkout
  validateCheckout: (validationData) => api.post('/promo-codes/validate-checkout', validationData),
  
  // Get active promo codes for an event (public)
  getActiveForEvent: (eventId) => api.get(`/promo-codes/event/${eventId}/active`),
  
  // Get user's promo code usage history
  getUserHistory: (params) => api.get('/promo-codes/user/history', { params }),
};

// Payments API
export const paymentsAPI = {
  createPaymentIntent: (data) => api.post('/payments/create-payment-intent', data),
  confirmPayment: (data) => api.post('/payments/confirm', data),
  getOrders: (params) => api.get('/payments/orders', { params }),
  getOrder: (id) => api.get(`/payments/orders/${id}`),
};

// Wishlist API with automatic fallback to mock
export const wishlistAPI = {
  addToWishlist: async (eventId) => {
    if (shouldUseMock()) {
      return mockAPI.wishlist.addToWishlist(eventId);
    }
    try {
      return await api.post('/wishlist', { eventId });
    } catch (error) {
      if (!backendAvailable) {
        return mockAPI.wishlist.addToWishlist(eventId);
      }
      throw error;
    }
  },
  
  removeFromWishlist: async (eventId) => {
    if (shouldUseMock()) {
      return mockAPI.wishlist.removeFromWishlist(eventId);
    }
    try {
      return await api.delete(`/wishlist/${eventId}`);
    } catch (error) {
      if (!backendAvailable) {
        return mockAPI.wishlist.removeFromWishlist(eventId);
      }
      throw error;
    }
  },
  
  getWishlist: async (params) => {
    if (shouldUseMock()) {
      return mockAPI.wishlist.getWishlist(params);
    }
    try {
      return await api.get('/wishlist', { params });
    } catch (error) {
      if (!backendAvailable) {
        return mockAPI.wishlist.getWishlist(params);
      }
      throw error;
    }
  },
  
  checkWishlistStatus: async (eventIds) => {
    if (shouldUseMock()) {
      return mockAPI.wishlist.checkWishlistStatus(eventIds);
    }
    try {
      return await api.get('/wishlist/check', { 
        params: { eventIds: Array.isArray(eventIds) ? eventIds.join(',') : eventIds } 
      });
    } catch (error) {
      if (!backendAvailable) {
        return mockAPI.wishlist.checkWishlistStatus(eventIds);
      }
      throw error;
    }
  },
};

// Articles API with automatic fallback to mock
export const articlesAPI = {
  getAll: async (params) => {
    if (shouldUseMock()) {
      return mockAPI.articles.getAll(params);
    }
    try {
      return await api.get('/articles', { params });
    } catch (error) {
      if (!backendAvailable) {
        return mockAPI.articles.getAll(params);
      }
      throw error;
    }
  },
  
  getById: async (id) => {
    if (shouldUseMock()) {
      return mockAPI.articles.getById(id);
    }
    try {
      return await api.get(`/articles/${id}`);
    } catch (error) {
      if (!backendAvailable) {
        return mockAPI.articles.getById(id);
      }
      throw error;
    }
  },
  
  create: (articleData) => api.post('/articles', articleData),
  update: (id, articleData) => api.put(`/articles/${id}`, articleData),
  delete: (id) => api.delete(`/articles/${id}`),
  getCategories: () => api.get('/articles/categories'),
  search: (query, params) => api.get('/articles/search', { 
    params: { q: query, ...params } 
  }),
};

// Search API
export const searchAPI = {
  // Global search across all content types
  globalSearch: (params) => api.get('/search', { params }),
  
  // Get search suggestions/autocomplete
  getSuggestions: (params) => api.get('/search/suggestions', { params }),
  
  // Get trending search terms
  getTrending: (params) => api.get('/search/trending', { params }),
  
  // Full-text search endpoints
  ftsSearch: (params) => api.get('/fts/search', { params }),
  ftsSuggestions: (params) => api.get('/fts/suggestions', { params }),
  ftsTrending: (params) => api.get('/fts/trending', { params }),
};

export default api;