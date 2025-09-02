/**
 * Analytics System Usage Examples
 * Demonstrates how to use the analytics service and reporting features
 */

const AnalyticsService = require('../services/AnalyticsService');
const ReportGenerator = require('../utils/reportGenerator');
const { logger } = require('../utils/logger');

class AnalyticsExample {
  /**
   * Example: Track various analytics events
   */
  async trackingExample() {
    console.log('📊 Analytics Tracking Examples\n');

    // Example 1: Track a page view
    const pageViewEvent = {
      event_type: 'page_view',
      event_name: 'Homepage Visit',
      properties: {
        page: 'home',
        section: 'hero'
      },
      user_id: 'user123',
      session_id: 'session456'
    };

    console.log('1. Tracking page view...');
    const pageViewResult = await AnalyticsService.trackEvent(pageViewEvent);
    console.log(`   Result: ${pageViewResult ? 'Success' : 'Failed'}\n`);

    // Example 2: Track an event view
    const eventViewEvent = {
      event_type: 'event_view',
      event_name: 'Event Detail View',
      properties: {
        event_id: 'event789',
        event_title: 'Summer Music Festival',
        category: 'music'
      },
      user_id: 'user123',
      organizer_id: 'org456',
      session_id: 'session456'
    };

    console.log('2. Tracking event view...');
    const eventViewResult = await AnalyticsService.trackEvent(eventViewEvent);
    console.log(`   Result: ${eventViewResult ? 'Success' : 'Failed'}\n`);

    // Example 3: Track a ticket purchase
    const ticketPurchaseEvent = {
      event_type: 'ticket_purchase',
      event_name: 'Ticket Purchase',
      properties: {
        event_id: 'event789',
        ticket_type: 'general_admission',
        quantity: 2,
        price: 50.00,
        payment_method: 'credit_card'
      },
      user_id: 'user123',
      organizer_id: 'org456',
      session_id: 'session456'
    };

    console.log('3. Tracking ticket purchase...');
    const purchaseResult = await AnalyticsService.trackEvent(ticketPurchaseEvent);
    console.log(`   Result: ${purchaseResult ? 'Success' : 'Failed'}\n`);
  }

  /**
   * Example: Get analytics data
   */
  async analyticsRetrievalExample() {
    console.log('📈 Analytics Retrieval Examples\n');

    try {
      // Example 1: Get event analytics
      console.log('1. Getting event analytics...');
      const eventAnalytics = await AnalyticsService.getEventAnalytics('event789', 'week');
      console.log('   Event Analytics:');
      console.log(`   - Total Views: ${eventAnalytics.metrics?.total_views || 0}`);
      console.log(`   - Unique Visitors: ${eventAnalytics.metrics?.unique_visitors || 0}`);
      console.log(`   - Conversion Rate: ${eventAnalytics.metrics?.conversion_rate || 0}%\n`);

      // Example 2: Get organizer analytics
      console.log('2. Getting organizer analytics...');
      const organizerAnalytics = await AnalyticsService.getOrganizerAnalytics('org456', 'month');
      console.log('   Organizer Analytics:');
      console.log(`   - Total Events: ${organizerAnalytics.summary?.total_events || 0}`);
      console.log(`   - Total Views: ${organizerAnalytics.summary?.total_views || 0}`);
      console.log(`   - Avg Popularity: ${organizerAnalytics.summary?.avg_popularity_score || 0}\n`);

      // Example 3: Get real-time analytics
      console.log('3. Getting real-time analytics...');
      const realTimeData = await AnalyticsService.getRealTimeAnalytics('event', 'event789');
      console.log('   Real-time Data:');
      console.log(`   - Current Viewers: ${realTimeData.metrics?.current_viewers || 0}`);
      console.log(`   - Views Last Hour: ${realTimeData.metrics?.views_last_hour || 0}\n`);

    } catch (error) {
      console.error('   Error getting analytics:', error.message);
    }
  }

  /**
   * Example: Generate reports
   */
  async reportGenerationExample() {
    console.log('📋 Report Generation Examples\n');

    try {
      // Example 1: Generate event performance report
      console.log('1. Generating event performance report...');
      const eventReport = await ReportGenerator.generateEventPerformanceReport('event789', 'month', 'json');
      console.log('   Event Report Generated:');
      console.log(`   - Report Type: ${eventReport.report_type}`);
      console.log(`   - Event: ${eventReport.event?.title || 'N/A'}`);
      console.log(`   - Total Views: ${eventReport.performance_metrics?.total_views || 0}`);
      console.log(`   - Recommendations: ${eventReport.recommendations?.length || 0} items\n`);

      // Example 2: Generate organizer dashboard report
      console.log('2. Generating organizer dashboard report...');
      const organizerReport = await ReportGenerator.generateOrganizerDashboardReport('org456', 'month', 'json');
      console.log('   Organizer Report Generated:');
      console.log(`   - Report Type: ${organizerReport.report_type}`);
      console.log(`   - Total Events: ${organizerReport.summary?.total_events || 0}`);
      console.log(`   - Insights: ${organizerReport.insights?.length || 0} items`);
      console.log(`   - Action Items: ${organizerReport.action_items?.length || 0} items\n`);

      // Example 3: Generate trending analysis report
      console.log('3. Generating trending analysis report...');
      const trendingReport = await ReportGenerator.generateTrendingAnalysisReport('week', 10, 'json');
      console.log('   Trending Report Generated:');
      console.log(`   - Report Type: ${trendingReport.report_type}`);
      console.log(`   - Total Events: ${trendingReport.total_events || 0}`);
      console.log(`   - Category Breakdown: ${trendingReport.category_breakdown?.length || 0} categories`);
      console.log(`   - Trending Factors: ${trendingReport.trending_factors?.length || 0} factors\n`);

    } catch (error) {
      console.error('   Error generating reports:', error.message);
    }
  }

  /**
   * Example: API usage simulation
   */
  async apiUsageExample() {
    console.log('🌐 API Usage Examples\n');

    // Simulate API calls that would be made from frontend
    const apiExamples = [
      {
        method: 'POST',
        endpoint: '/analytics/track',
        description: 'Track analytics event',
        payload: {
          event_type: 'page_view',
          event_name: 'Event Search',
          properties: { search_query: 'music festivals' }
        }
      },
      {
        method: 'GET',
        endpoint: '/analytics/events/event789?timeframe=week',
        description: 'Get event analytics'
      },
      {
        method: 'GET',
        endpoint: '/analytics/organizers/org456?timeframe=month',
        description: 'Get organizer analytics'
      },
      {
        method: 'GET',
        endpoint: '/analytics/realtime/event/event789',
        description: 'Get real-time analytics'
      },
      {
        method: 'GET',
        endpoint: '/analytics/reports/event/event789?format=json',
        description: 'Generate event report'
      },
      {
        method: 'POST',
        endpoint: '/analytics/events/summary',
        description: 'Get multiple events summary',
        payload: {
          event_ids: ['event789', 'event456', 'event123'],
          timeframe: 'week'
        }
      }
    ];

    console.log('API Endpoints Available:');
    apiExamples.forEach((example, index) => {
      console.log(`${index + 1}. ${example.method} ${example.endpoint}`);
      console.log(`   Description: ${example.description}`);
      if (example.payload) {
        console.log(`   Payload: ${JSON.stringify(example.payload, null, 2)}`);
      }
      console.log('');
    });
  }

  /**
   * Example: Integration with existing event routes
   */
  async integrationExample() {
    console.log('🔗 Integration Examples\n');

    console.log('Integration Points:');
    console.log('1. Event Routes Integration:');
    console.log('   - GET /events/:id → Automatically tracks event_view');
    console.log('   - GET /events?q=search → Tracks event_search');
    console.log('   - POST /events → Can track event_creation');
    console.log('');

    console.log('2. Ticket Routes Integration:');
    console.log('   - POST /tickets → Tracks ticket_purchase');
    console.log('   - GET /tickets/:id → Tracks ticket_view');
    console.log('');

    console.log('3. User Routes Integration:');
    console.log('   - POST /auth/register → Tracks user_registration');
    console.log('   - POST /auth/login → Tracks user_login');
    console.log('');

    console.log('4. Middleware Integration:');
    console.log('   - analyticsMiddleware → Tracks page views automatically');
    console.log('   - eventAnalyticsMiddleware → Tracks event-specific interactions');
    console.log('   - ticketAnalyticsMiddleware → Tracks ticket-related actions');
    console.log('');

    console.log('5. Real-time Updates:');
    console.log('   - View counts updated in real-time');
    console.log('   - Popularity scores calculated automatically');
    console.log('   - Cache-based counters for performance');
    console.log('');
  }

  /**
   * Run all examples
   */
  async runAllExamples() {
    console.log('🚀 Bilten Analytics System Examples\n');
    console.log('=' .repeat(50));

    try {
      await this.trackingExample();
      console.log('=' .repeat(50));
      
      await this.analyticsRetrievalExample();
      console.log('=' .repeat(50));
      
      await this.reportGenerationExample();
      console.log('=' .repeat(50));
      
      await this.apiUsageExample();
      console.log('=' .repeat(50));
      
      await this.integrationExample();
      console.log('=' .repeat(50));

      console.log('✅ All examples completed successfully!');
      
    } catch (error) {
      console.error('❌ Example execution failed:', error.message);
    }
  }
}

// Export for use as module
module.exports = AnalyticsExample;

// Run examples if called directly
if (require.main === module) {
  const example = new AnalyticsExample();
  example.runAllExamples().catch(console.error);
}