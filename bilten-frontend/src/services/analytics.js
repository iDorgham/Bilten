import axios from 'axios';
import { API_CONFIG } from '../config/api';

class AnalyticsService {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_CONFIG.BASE_URL}/analytics`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // Dashboard Analytics
  async getDashboard(period = '30d') {
    try {
      const response = await this.api.get(`/dashboard?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Dashboard analytics error:', error);
      throw error;
    }
  }

  // Event Analytics
  async getEventAnalytics(period = '30d', category = null, status = null) {
    try {
      let url = `/events?period=${period}`;
      if (category) url += `&category=${category}`;
      if (status) url += `&status=${status}`;
      
      const response = await this.api.get(url);
      return response.data;
    } catch (error) {
      console.error('Event analytics error:', error);
      throw error;
    }
  }

  // User Analytics (Admin only)
  async getUserAnalytics(period = '30d', role = null) {
    try {
      let url = `/users?period=${period}`;
      if (role) url += `&role=${role}`;
      
      const response = await this.api.get(url);
      return response.data;
    } catch (error) {
      console.error('User analytics error:', error);
      throw error;
    }
  }

  // Financial Analytics (Admin only)
  async getFinancialAnalytics(period = '30d') {
    try {
      const response = await this.api.get(`/financial?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Financial analytics error:', error);
      throw error;
    }
  }

  // Content Analytics
  async getContentAnalytics(period = '30d', category = null) {
    try {
      let url = `/content?period=${period}`;
      if (category) url += `&category=${category}`;
      
      const response = await this.api.get(url);
      return response.data;
    } catch (error) {
      console.error('Content analytics error:', error);
      throw error;
    }
  }

  // Performance Analytics (Admin only)
  async getPerformanceAnalytics(period = '7d') {
    try {
      const response = await this.api.get(`/performance?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Performance analytics error:', error);
      throw error;
    }
  }

  // Real-Time Analytics
  async getRealTimeAnalytics(timeRange = '1h') {
    try {
      const response = await this.api.get(`/real-time?timeRange=${timeRange}`);
      return response.data;
    } catch (error) {
      console.error('Real-time analytics error:', error);
      // Return mock data when backend is not available
      return this.getMockRealTimeData(timeRange);
    }
  }

  // Mock Real-Time Data for development
  getMockRealTimeData(timeRange = '1h') {
    const now = new Date();
    const dataPoints = timeRange === '1h' ? 60 : timeRange === '6h' ? 72 : timeRange === '24h' ? 96 : 168;
    
    const activityData = Array.from({ length: dataPoints }, (_, i) => {
      const time = new Date(now.getTime() - (dataPoints - i) * (timeRange === '1h' ? 60000 : timeRange === '6h' ? 300000 : timeRange === '24h' ? 900000 : 3600000));
      return {
        time: time.toISOString(),
        activity: Math.floor(Math.random() * 50) + 10
      };
    });

    const funnelData = [
      { stage: 'Page Views', value: 1250 },
      { stage: 'Event Views', value: 890 },
      { stage: 'Add to Cart', value: 234 },
      { stage: 'Checkout', value: 156 },
      { stage: 'Purchase', value: 98 }
    ];

    const performanceMetrics = [
      { endpoint: '/api/v1/events', avgResponseTime: 145, requestCount: 1250, errorCount: 2 },
      { endpoint: '/api/v1/tickets', avgResponseTime: 89, requestCount: 890, errorCount: 1 },
      { endpoint: '/api/v1/orders', avgResponseTime: 234, requestCount: 156, errorCount: 0 }
    ];

    return {
      success: true,
      data: {
        activeUsers: Math.floor(Math.random() * 150) + 50,
        userGrowth: Math.floor(Math.random() * 20) - 10,
        ticketsSold: Math.floor(Math.random() * 25) + 5,
        ticketGrowth: Math.floor(Math.random() * 30) - 5,
        revenue: Math.floor(Math.random() * 5000) + 1000,
        revenueGrowth: Math.floor(Math.random() * 25) - 5,
        pageViews: Math.floor(Math.random() * 300) + 100,
        viewGrowth: Math.floor(Math.random() * 15) - 5,
        activityData,
        funnelData,
        performanceMetrics,
        lastUpdated: now.toISOString()
      }
    };
  }

  // Export Analytics Data
  async exportAnalytics(type, period = '30d', format = 'json') {
    try {
      const response = await this.api.get(`/export?type=${type}&period=${period}&format=${format}`);
      return response.data;
    } catch (error) {
      console.error('Export analytics error:', error);
      throw error;
    }
  }

  // Track User Events (for real-time analytics)
  async trackEvent(eventName, eventData = {}) {
    try {
      // This would typically send to a real-time analytics service
      // For now, we'll just log it
      console.log('Analytics Event:', eventName, eventData);
      
      // In a real implementation, you might send to:
      // - Google Analytics
      // - Mixpanel
      // - Amplitude
      // - Custom analytics endpoint
      
      return { success: true };
    } catch (error) {
      console.error('Event tracking error:', error);
      throw error;
    }
  }

  // Track Page Views
  async trackPageView(pageName, pageData = {}) {
    return this.trackEvent('page_view', {
      page: pageName,
      timestamp: new Date().toISOString(),
      ...pageData
    });
  }

  // Track User Actions
  async trackUserAction(action, actionData = {}) {
    return this.trackEvent('user_action', {
      action,
      timestamp: new Date().toISOString(),
      ...actionData
    });
  }

  // Track E-commerce Events
  async trackPurchase(orderData) {
    return this.trackEvent('purchase', {
      timestamp: new Date().toISOString(),
      ...orderData
    });
  }

  async trackAddToCart(cartData) {
    return this.trackEvent('add_to_cart', {
      timestamp: new Date().toISOString(),
      ...cartData
    });
  }

  async trackViewEvent(eventData) {
    return this.trackEvent('view_event', {
      timestamp: new Date().toISOString(),
      ...eventData
    });
  }
}

export default new AnalyticsService();
