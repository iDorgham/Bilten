/**
 * API Configuration
 * Allows switching between real API and mock API for development
 */

// Use real backend API
const USE_MOCK_API = false; // Use real backend API

export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api/v1',
  USE_MOCK: USE_MOCK_API,
  TIMEOUT: 10000, // 10 seconds
};

export default API_CONFIG;