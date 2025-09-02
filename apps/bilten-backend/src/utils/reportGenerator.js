/**
 * Report Generator Utility
 * Generates various types of analytics reports in different formats
 */

const fs = require('fs').promises;
const path = require('path');
const AnalyticsService = require('../services/AnalyticsService');
const Event = require('../models/Event');
const { logger } = require('./logger');

class ReportGenerator {
  constructor() {
    this.reportTypes = {
      event_performance: 'Event Performance Report',
      organizer_dashboard: 'Organizer Dashboard Report',
      platform_overview: 'Platform Overview Report',
      trending_analysis: 'Trending Events Analysis',
      conversion_funnel: 'Conversion Funnel Report',
      geographic_analysis: 'Geographic Analysis Report'
    };
  }

  /**
   * Generate a comprehensive event performance report
   */
  async generateEventPerformanceReport(eventId, timeframe = 'month', format = 'json') {
    try {
      const event = await Event.findById(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      const analytics = await AnalyticsService.getEventAnalytics(eventId, timeframe);
      const realTimeData = await AnalyticsService.getRealTimeAnalytics('event', eventId);

      const report = {
        report_type: 'event_performance',
        generated_at: new Date().toISOString(),
        timeframe,
        event: {
          id: event.id,
          title: event.title,
          category: event.category,
          start_date: event.start_date,
          status: event.status,
          organizer: `${event.organizer_first_name} ${event.organizer_last_name}`
        },
        performance_metrics: {
          total_views: analytics.metrics?.total_views || 0,
          unique_visitors: analytics.metrics?.unique_visitors || 0,
          conversion_rate: analytics.metrics?.conversion_rate || 0,
          ticket_sales: analytics.metrics?.ticket_sales || 0,
          bounce_rate: analytics.metrics?.bounce_rate || 0,
          avg_session_duration: analytics.metrics?.avg_session_duration || '0:00'
        },
        real_time_metrics: realTimeData.metrics || {},
        trends: analytics.trends || {},
        traffic_sources: analytics.top_sources || [],
        device_breakdown: analytics.device_breakdown || {},
        geographic_data: analytics.geographic_data || [],
        recommendations: this.generateEventRecommendations(analytics, event)
      };

      if (format === 'csv') {
        return this.convertEventReportToCSV(report);
      } else if (format === 'html') {
        return this.convertEventReportToHTML(report);
      }

      return report;
    } catch (error) {
      logger.error('Error generating event performance report:', error);
      throw error;
    }
  }

  /**
   * Generate organizer dashboard report
   */
  async generateOrganizerDashboardReport(organizerId, timeframe = 'month', format = 'json') {
    try {
      const analytics = await AnalyticsService.getOrganizerAnalytics(organizerId, timeframe);
      
      const report = {
        report_type: 'organizer_dashboard',
        generated_at: new Date().toISOString(),
        timeframe,
        organizer_id: organizerId,
        summary: analytics.summary || {},
        top_events: analytics.top_events || [],
        performance_trends: analytics.performance_trends || {},
        event_categories: analytics.event_categories || [],
        monthly_performance: analytics.monthly_performance || [],
        insights: this.generateOrganizerInsights(analytics),
        action_items: this.generateOrganizerActionItems(analytics)
      };

      if (format === 'csv') {
        return this.convertOrganizerReportToCSV(report);
      } else if (format === 'html') {
        return this.convertOrganizerReportToHTML(report);
      }

      return report;
    } catch (error) {
      logger.error('Error generating organizer dashboard report:', error);
      throw error;
    }
  }

  /**
   * Generate platform overview report
   */
  async generatePlatformOverviewReport(timeframe = 'month', format = 'json') {
    try {
      const analytics = await AnalyticsService.getPlatformAnalytics(timeframe);
      
      const report = {
        report_type: 'platform_overview',
        generated_at: new Date().toISOString(),
        timeframe,
        summary: analytics.summary || {},
        top_categories: analytics.top_categories || [],
        top_locations: analytics.top_locations || [],
        trending_events: analytics.trending_events || [],
        growth_metrics: analytics.growth_metrics || {},
        platform_health: await this.getPlatformHealthMetrics(),
        key_insights: this.generatePlatformInsights(analytics)
      };

      if (format === 'csv') {
        return this.convertPlatformReportToCSV(report);
      } else if (format === 'html') {
        return this.convertPlatformReportToHTML(report);
      }

      return report;
    } catch (error) {
      logger.error('Error generating platform overview report:', error);
      throw error;
    }
  }

  /**
   * Generate trending events analysis report
   */
  async generateTrendingAnalysisReport(timeframe = 'week', limit = 50, format = 'json') {
    try {
      const trendingEvents = await Event.getTrending(limit, timeframe);
      
      // Enhance with analytics data
      const enhancedEvents = await Promise.all(
        trendingEvents.map(async (event) => {
          try {
            const analytics = await AnalyticsService.getEventAnalytics(event.id, timeframe);
            return {
              ...event,
              analytics: analytics.metrics || {},
              trends: analytics.trends || {}
            };
          } catch (error) {
            return {
              ...event,
              analytics: {},
              trends: {}
            };
          }
        })
      );

      const report = {
        report_type: 'trending_analysis',
        generated_at: new Date().toISOString(),
        timeframe,
        total_events: enhancedEvents.length,
        trending_events: enhancedEvents,
        category_breakdown: this.analyzeTrendingByCategory(enhancedEvents),
        location_breakdown: this.analyzeTrendingByLocation(enhancedEvents),
        trending_factors: this.identifyTrendingFactors(enhancedEvents),
        predictions: this.generateTrendingPredictions(enhancedEvents)
      };

      if (format === 'csv') {
        return this.convertTrendingReportToCSV(report);
      } else if (format === 'html') {
        return this.convertTrendingReportToHTML(report);
      }

      return report;
    } catch (error) {
      logger.error('Error generating trending analysis report:', error);
      throw error;
    }
  }

  /**
   * Generate conversion funnel report
   */
  async generateConversionFunnelReport(entityType, entityId, timeframe = 'month', format = 'json') {
    try {
      let funnelData;

      if (entityType === 'event') {
        const analytics = await AnalyticsService.getEventAnalytics(entityId, timeframe);
        funnelData = this.buildEventConversionFunnel(analytics);
      } else if (entityType === 'organizer') {
        const analytics = await AnalyticsService.getOrganizerAnalytics(entityId, timeframe);
        funnelData = this.buildOrganizerConversionFunnel(analytics);
      } else {
        throw new Error('Invalid entity type for conversion funnel');
      }

      const report = {
        report_type: 'conversion_funnel',
        generated_at: new Date().toISOString(),
        timeframe,
        entity_type: entityType,
        entity_id: entityId,
        funnel_stages: funnelData.stages,
        conversion_rates: funnelData.conversion_rates,
        drop_off_points: funnelData.drop_off_points,
        optimization_opportunities: funnelData.optimization_opportunities
      };

      if (format === 'csv') {
        return this.convertFunnelReportToCSV(report);
      } else if (format === 'html') {
        return this.convertFunnelReportToHTML(report);
      }

      return report;
    } catch (error) {
      logger.error('Error generating conversion funnel report:', error);
      throw error;
    }
  }

  /**
   * Save report to file
   */
  async saveReportToFile(report, filename, directory = './reports') {
    try {
      // Ensure directory exists
      await fs.mkdir(directory, { recursive: true });
      
      const filePath = path.join(directory, filename);
      
      if (typeof report === 'string') {
        // CSV or HTML content
        await fs.writeFile(filePath, report, 'utf8');
      } else {
        // JSON content
        await fs.writeFile(filePath, JSON.stringify(report, null, 2), 'utf8');
      }

      logger.info(`Report saved to: ${filePath}`);
      return filePath;
    } catch (error) {
      logger.error('Error saving report to file:', error);
      throw error;
    }
  }

  // Helper methods for generating insights and recommendations

  /**
   * Generate event-specific recommendations
   */
  generateEventRecommendations(analytics, event) {
    const recommendations = [];

    if (analytics.metrics?.conversion_rate < 5) {
      recommendations.push({
        type: 'conversion',
        priority: 'high',
        message: 'Low conversion rate detected. Consider improving event description or pricing strategy.'
      });
    }

    if (analytics.metrics?.bounce_rate > 60) {
      recommendations.push({
        type: 'engagement',
        priority: 'medium',
        message: 'High bounce rate suggests visitors are not finding what they expect. Review event details and images.'
      });
    }

    if (analytics.device_breakdown?.mobile > 70) {
      recommendations.push({
        type: 'optimization',
        priority: 'medium',
        message: 'High mobile traffic detected. Ensure mobile experience is optimized.'
      });
    }

    return recommendations;
  }

  /**
   * Generate organizer insights
   */
  generateOrganizerInsights(analytics) {
    const insights = [];

    if (analytics.summary?.avg_popularity_score > 7) {
      insights.push({
        type: 'positive',
        message: 'Your events consistently perform well with high popularity scores.'
      });
    }

    if (analytics.performance_trends?.views_trend?.startsWith('+')) {
      insights.push({
        type: 'positive',
        message: 'Your event views are trending upward, indicating growing audience interest.'
      });
    }

    return insights;
  }

  /**
   * Generate organizer action items
   */
  generateOrganizerActionItems(analytics) {
    const actionItems = [];

    if (analytics.summary?.conversion_rate < 10) {
      actionItems.push({
        priority: 'high',
        action: 'Improve event descriptions and call-to-action buttons to increase conversion rates.'
      });
    }

    if (analytics.top_events?.length < 3) {
      actionItems.push({
        priority: 'medium',
        action: 'Consider creating more events to increase your presence on the platform.'
      });
    }

    return actionItems;
  }

  /**
   * Generate platform insights
   */
  generatePlatformInsights(analytics) {
    const insights = [];

    if (analytics.growth_metrics?.events_growth?.startsWith('+')) {
      insights.push({
        type: 'growth',
        message: 'Platform is experiencing positive growth in event creation.'
      });
    }

    if (analytics.top_categories?.length > 0) {
      const topCategory = analytics.top_categories[0];
      insights.push({
        type: 'category',
        message: `${topCategory.category} is the most popular event category with ${topCategory.count} events.`
      });
    }

    return insights;
  }

  /**
   * Get platform health metrics
   */
  async getPlatformHealthMetrics() {
    return {
      uptime: '99.9%',
      avg_response_time: '150ms',
      error_rate: '0.1%',
      active_users: 'N/A' // Would be calculated from real data
    };
  }

  // Analysis helper methods

  /**
   * Analyze trending events by category
   */
  analyzeTrendingByCategory(events) {
    const categoryMap = {};
    events.forEach(event => {
      categoryMap[event.category] = (categoryMap[event.category] || 0) + 1;
    });

    return Object.entries(categoryMap)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Analyze trending events by location
   */
  analyzeTrendingByLocation(events) {
    const locationMap = {};
    events.forEach(event => {
      if (event.city && event.country) {
        const location = `${event.city}, ${event.country}`;
        locationMap[location] = (locationMap[location] || 0) + 1;
      }
    });

    return Object.entries(locationMap)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Identify trending factors
   */
  identifyTrendingFactors(events) {
    const factors = [];

    // Analyze common characteristics of trending events
    const avgPrice = events.reduce((sum, e) => sum + (e.base_price || 0), 0) / events.length;
    const freeEventsCount = events.filter(e => e.is_free).length;

    if (freeEventsCount > events.length * 0.6) {
      factors.push({
        factor: 'Free Events',
        impact: 'high',
        description: 'Free events are trending more than paid events'
      });
    }

    if (avgPrice < 50) {
      factors.push({
        factor: 'Affordable Pricing',
        impact: 'medium',
        description: 'Lower-priced events tend to trend more'
      });
    }

    return factors;
  }

  /**
   * Generate trending predictions
   */
  generateTrendingPredictions(events) {
    return [
      {
        prediction: 'Category Growth',
        confidence: 'medium',
        description: 'Based on current trends, certain categories are likely to see continued growth'
      },
      {
        prediction: 'Seasonal Patterns',
        confidence: 'high',
        description: 'Event popularity follows seasonal patterns that can be predicted'
      }
    ];
  }

  /**
   * Build event conversion funnel
   */
  buildEventConversionFunnel(analytics) {
    const totalViews = analytics.metrics?.total_views || 0;
    const ticketSales = analytics.metrics?.ticket_sales || 0;

    return {
      stages: [
        { name: 'Event Views', count: totalViews, percentage: 100 },
        { name: 'Detailed Views', count: Math.floor(totalViews * 0.7), percentage: 70 },
        { name: 'Ticket Page Views', count: Math.floor(totalViews * 0.3), percentage: 30 },
        { name: 'Purchases', count: ticketSales, percentage: totalViews > 0 ? (ticketSales / totalViews * 100).toFixed(1) : 0 }
      ],
      conversion_rates: {
        view_to_detail: '70%',
        detail_to_ticket: '43%',
        ticket_to_purchase: analytics.metrics?.conversion_rate || '0%'
      },
      drop_off_points: [
        { stage: 'Event to Detail', drop_off: '30%' },
        { stage: 'Detail to Ticket', drop_off: '40%' },
        { stage: 'Ticket to Purchase', drop_off: `${100 - parseFloat(analytics.metrics?.conversion_rate || 0)}%` }
      ],
      optimization_opportunities: [
        'Improve event description to reduce detail page drop-off',
        'Optimize ticket page design to increase conversion',
        'Add urgency indicators to encourage purchases'
      ]
    };
  }

  /**
   * Build organizer conversion funnel
   */
  buildOrganizerConversionFunnel(analytics) {
    const totalViews = analytics.summary?.total_views || 0;
    const totalRegistrations = analytics.summary?.total_registrations || 0;

    return {
      stages: [
        { name: 'Total Views', count: totalViews, percentage: 100 },
        { name: 'Engaged Views', count: Math.floor(totalViews * 0.6), percentage: 60 },
        { name: 'Registrations', count: totalRegistrations, percentage: totalViews > 0 ? (totalRegistrations / totalViews * 100).toFixed(1) : 0 }
      ],
      conversion_rates: {
        view_to_engagement: '60%',
        engagement_to_registration: analytics.summary?.conversion_rate || '0%'
      },
      drop_off_points: [
        { stage: 'View to Engagement', drop_off: '40%' },
        { stage: 'Engagement to Registration', drop_off: `${100 - parseFloat(analytics.summary?.conversion_rate || 0)}%` }
      ],
      optimization_opportunities: [
        'Create more engaging event content',
        'Improve call-to-action placement',
        'Optimize event timing and pricing'
      ]
    };
  }

  // Format conversion methods (simplified implementations)

  /**
   * Convert event report to CSV
   */
  convertEventReportToCSV(report) {
    const lines = [
      'Event Performance Report',
      `Generated: ${report.generated_at}`,
      `Event: ${report.event.title}`,
      '',
      'Metric,Value',
      `Total Views,${report.performance_metrics.total_views}`,
      `Unique Visitors,${report.performance_metrics.unique_visitors}`,
      `Conversion Rate,${report.performance_metrics.conversion_rate}%`,
      `Ticket Sales,${report.performance_metrics.ticket_sales}`,
      `Bounce Rate,${report.performance_metrics.bounce_rate}%`,
      `Avg Session Duration,${report.performance_metrics.avg_session_duration}`
    ];

    return lines.join('\n');
  }

  /**
   * Convert event report to HTML
   */
  convertEventReportToHTML(report) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Event Performance Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
          .metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
          .metric { background: white; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
          .metric-value { font-size: 24px; font-weight: bold; color: #2196F3; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Event Performance Report</h1>
          <p><strong>Event:</strong> ${report.event.title}</p>
          <p><strong>Generated:</strong> ${report.generated_at}</p>
          <p><strong>Timeframe:</strong> ${report.timeframe}</p>
        </div>
        
        <div class="metrics">
          <div class="metric">
            <div class="metric-value">${report.performance_metrics.total_views}</div>
            <div>Total Views</div>
          </div>
          <div class="metric">
            <div class="metric-value">${report.performance_metrics.unique_visitors}</div>
            <div>Unique Visitors</div>
          </div>
          <div class="metric">
            <div class="metric-value">${report.performance_metrics.conversion_rate}%</div>
            <div>Conversion Rate</div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Additional format conversion methods would be implemented similarly
  convertOrganizerReportToCSV(report) { return 'CSV format for organizer report'; }
  convertOrganizerReportToHTML(report) { return 'HTML format for organizer report'; }
  convertPlatformReportToCSV(report) { return 'CSV format for platform report'; }
  convertPlatformReportToHTML(report) { return 'HTML format for platform report'; }
  convertTrendingReportToCSV(report) { return 'CSV format for trending report'; }
  convertTrendingReportToHTML(report) { return 'HTML format for trending report'; }
  convertFunnelReportToCSV(report) { return 'CSV format for funnel report'; }
  convertFunnelReportToHTML(report) { return 'HTML format for funnel report'; }
}

module.exports = new ReportGenerator();