const knex = require('../utils/database');
const config = require('../config');

class TrackingService {
  /**
   * Track user activity/behavior
   * @param {Object} trackingData - Tracking data object
   * @returns {Promise<Object>} Tracking result
   */
  static async trackUserActivity(trackingData) {
    const {
      userId,
      sessionId,
      eventType,
      eventData,
      pageUrl,
      userAgent,
      ipAddress,
      timestamp = new Date()
    } = trackingData;

    try {
      const [trackingRecord] = await knex('user_activity_tracking')
        .insert({
          user_id: userId,
          session_id: sessionId,
          event_type: eventType,
          event_data: JSON.stringify(eventData),
          page_url: pageUrl,
          user_agent: userAgent,
          ip_address: ipAddress,
          created_at: timestamp
        })
        .returning('*');

      // Update user engagement metrics
      await this.updateUserEngagementMetrics(userId, eventType, eventData);

      return {
        success: true,
        trackingId: trackingRecord.id,
        timestamp: trackingRecord.created_at
      };
    } catch (error) {
      console.error('Error tracking user activity:', error);
      throw error;
    }
  }

  /**
   * Track event-specific interactions
   * @param {Object} eventTrackingData - Event tracking data
   * @returns {Promise<Object>} Tracking result
   */
  static async trackEventInteraction(eventTrackingData) {
    const {
      userId,
      eventId,
      interactionType,
      interactionData,
      sessionId,
      timestamp = new Date()
    } = eventTrackingData;

    try {
      const [trackingRecord] = await knex('event_interaction_tracking')
        .insert({
          user_id: userId,
          event_id: eventId,
          interaction_type: interactionType,
          interaction_data: JSON.stringify(interactionData),
          session_id: sessionId,
          created_at: timestamp
        })
        .returning('*');

      // Update event engagement metrics
      await this.updateEventEngagementMetrics(eventId, interactionType, interactionData);

      return {
        success: true,
        trackingId: trackingRecord.id,
        timestamp: trackingRecord.created_at
      };
    } catch (error) {
      console.error('Error tracking event interaction:', error);
      throw error;
    }
  }

  /**
   * Track conversion events (purchases, registrations, etc.)
   * @param {Object} conversionData - Conversion tracking data
   * @returns {Promise<Object>} Tracking result
   */
  static async trackConversion(conversionData) {
    const {
      userId,
      conversionType,
      conversionValue,
      conversionData: data,
      sessionId,
      campaignId,
      timestamp = new Date()
    } = conversionData;

    try {
      const [trackingRecord] = await knex('conversion_tracking')
        .insert({
          user_id: userId,
          conversion_type: conversionType,
          conversion_value: conversionValue,
          conversion_data: JSON.stringify(data),
          session_id: sessionId,
          campaign_id: campaignId,
          created_at: timestamp
        })
        .returning('*');

      // Update conversion metrics
      await this.updateConversionMetrics(conversionType, conversionValue, data);

      return {
        success: true,
        trackingId: trackingRecord.id,
        timestamp: trackingRecord.created_at
      };
    } catch (error) {
      console.error('Error tracking conversion:', error);
      throw error;
    }
  }

  /**
   * Track performance metrics
   * @param {Object} performanceData - Performance tracking data
   * @returns {Promise<Object>} Tracking result
   */
  static async trackPerformance(performanceData) {
    const {
      endpoint,
      responseTime,
      statusCode,
      errorMessage,
      timestamp = new Date()
    } = performanceData;

    try {
      const [trackingRecord] = await knex('performance_tracking')
        .insert({
          endpoint,
          response_time: responseTime,
          status_code: statusCode,
          error_message: errorMessage,
          created_at: timestamp
        })
        .returning('*');

      return {
        success: true,
        trackingId: trackingRecord.id,
        timestamp: trackingRecord.created_at
      };
    } catch (error) {
      console.error('Error tracking performance:', error);
      throw error;
    }
  }

  /**
   * Get real-time analytics data
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Real-time analytics data
   */
  static async getRealTimeAnalytics(filters = {}) {
    const {
      timeRange = '1h',
      eventTypes = [],
      userId,
      eventId
    } = filters;

    const startTime = new Date(Date.now() - this.getTimeRangeInMs(timeRange));

    try {
      // Get real-time user activity
      const realTimeActivity = await knex('user_activity_tracking')
        .select(
          'event_type',
          knex.raw('COUNT(*) as count'),
          knex.raw('DATE_TRUNC(\'minute\', created_at) as time_bucket')
        )
        .where('created_at', '>=', startTime)
        .modify(queryBuilder => {
          if (eventTypes.length > 0) {
            queryBuilder.whereIn('event_type', eventTypes);
          }
          if (userId) {
            queryBuilder.where('user_id', userId);
          }
        })
        .groupBy('event_type', 'time_bucket')
        .orderBy('time_bucket', 'desc');

      // Get real-time conversions
      const realTimeConversions = await knex('conversion_tracking')
        .select(
          'conversion_type',
          knex.raw('COUNT(*) as count'),
          knex.raw('SUM(conversion_value) as total_value'),
          knex.raw('DATE_TRUNC(\'minute\', created_at) as time_bucket')
        )
        .where('created_at', '>=', startTime)
        .groupBy('conversion_type', 'time_bucket')
        .orderBy('time_bucket', 'desc');

      // Get active sessions
      const activeSessions = await knex('user_activity_tracking')
        .select('session_id')
        .where('created_at', '>=', startTime)
        .distinct();

      // Get performance metrics
      const performanceMetrics = await knex('performance_tracking')
        .select(
          'endpoint',
          knex.raw('AVG(response_time) as avg_response_time'),
          knex.raw('COUNT(*) as request_count'),
          knex.raw('COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count')
        )
        .where('created_at', '>=', startTime)
        .groupBy('endpoint');

      return {
        success: true,
        data: {
          timeRange,
          realTimeActivity,
          realTimeConversions,
          activeSessions: activeSessions.length,
          performanceMetrics,
          lastUpdated: new Date()
        }
      };
    } catch (error) {
      console.error('Error getting real-time analytics:', error);
      throw error;
    }
  }

  /**
   * Get user journey analysis
   * @param {string} userId - User ID
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} User journey data
   */
  static async getUserJourney(userId, options = {}) {
    const {
      startDate,
      endDate,
      includeEvents = true,
      includeInteractions = true
    } = options;

    try {
      const query = knex('user_activity_tracking')
        .where('user_id', userId);

      if (startDate) {
        query.where('created_at', '>=', startDate);
      }
      if (endDate) {
        query.where('created_at', '<=', endDate);
      }

      const userActivity = await query
        .select('*')
        .orderBy('created_at', 'asc');

      let eventInteractions = [];
      if (includeInteractions) {
        eventInteractions = await knex('event_interaction_tracking')
          .where('user_id', userId)
          .modify(queryBuilder => {
            if (startDate) {
              queryBuilder.where('created_at', '>=', startDate);
            }
            if (endDate) {
              queryBuilder.where('created_at', '<=', endDate);
            }
          })
          .select('*')
          .orderBy('created_at', 'asc');
      }

      // Analyze journey patterns
      const journeyAnalysis = this.analyzeJourneyPatterns(userActivity, eventInteractions);

      return {
        success: true,
        data: {
          userId,
          userActivity,
          eventInteractions,
          journeyAnalysis,
          totalSessions: this.countUniqueSessions(userActivity),
          totalEvents: userActivity.length,
          totalInteractions: eventInteractions.length
        }
      };
    } catch (error) {
      console.error('Error getting user journey:', error);
      throw error;
    }
  }

  /**
   * Get funnel analysis
   * @param {Object} funnelConfig - Funnel configuration
   * @returns {Promise<Object>} Funnel analysis data
   */
  static async getFunnelAnalysis(funnelConfig) {
    const {
      funnelSteps,
      timeRange = '30d',
      filters = {}
    } = funnelConfig;

    const startDate = new Date(Date.now() - this.getTimeRangeInMs(timeRange));

    try {
      const funnelData = [];

      for (let i = 0; i < funnelSteps.length; i++) {
        const step = funnelSteps[i];
        const stepQuery = knex('user_activity_tracking')
          .where('created_at', '>=', startDate)
          .where('event_type', step.eventType);

        // Apply filters
        if (filters.userId) {
          stepQuery.where('user_id', filters.userId);
        }
        if (filters.eventId) {
          stepQuery.whereRaw("event_data->>'eventId' = ?", [filters.eventId]);
        }

        const stepCount = await stepQuery.count('* as count').first();
        funnelData.push({
          step: step.name,
          eventType: step.eventType,
          count: parseInt(stepCount.count),
          conversionRate: i === 0 ? 100 : (parseInt(stepCount.count) / funnelData[i - 1].count * 100).toFixed(2)
        });
      }

      return {
        success: true,
        data: {
          funnelSteps: funnelData,
          timeRange,
          totalSteps: funnelSteps.length,
          overallConversionRate: funnelData.length > 1 ? 
            (funnelData[funnelData.length - 1].count / funnelData[0].count * 100).toFixed(2) : 0
        }
      };
    } catch (error) {
      console.error('Error getting funnel analysis:', error);
      throw error;
    }
  }

  /**
   * Export analytics data
   * @param {Object} exportConfig - Export configuration
   * @returns {Promise<Object>} Export data
   */
  static async exportAnalyticsData(exportConfig) {
    const {
      dataType,
      format = 'json',
      filters = {},
      dateRange
    } = exportConfig;

    try {
      let data;
      let fileName;

      switch (dataType) {
        case 'user_activity':
          data = await this.exportUserActivityData(filters, dateRange);
          fileName = `user_activity_${new Date().toISOString().split('T')[0]}.${format}`;
          break;
        case 'event_interactions':
          data = await this.exportEventInteractionData(filters, dateRange);
          fileName = `event_interactions_${new Date().toISOString().split('T')[0]}.${format}`;
          break;
        case 'conversions':
          data = await this.exportConversionData(filters, dateRange);
          fileName = `conversions_${new Date().toISOString().split('T')[0]}.${format}`;
          break;
        case 'performance':
          data = await this.exportPerformanceData(filters, dateRange);
          fileName = `performance_${new Date().toISOString().split('T')[0]}.${format}`;
          break;
        default:
          throw new Error(`Unsupported data type: ${dataType}`);
      }

      return {
        success: true,
        data: {
          fileName,
          dataType,
          format,
          recordCount: data.length,
          exportDate: new Date(),
          data: format === 'csv' ? this.convertToCSV(data) : data
        }
      };
    } catch (error) {
      console.error('Error exporting analytics data:', error);
      throw error;
    }
  }

  // Helper methods
  static getTimeRangeInMs(timeRange) {
    const ranges = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      '1y': 365 * 24 * 60 * 60 * 1000
    };
    return ranges[timeRange] || ranges['24h'];
  }

  static async updateUserEngagementMetrics(userId, eventType, eventData) {
    // Update user engagement metrics in real-time
    const engagementUpdate = {
      last_activity: new Date(),
      total_events: knex.raw('total_events + 1')
    };

    await knex('user_engagement_metrics')
      .where('user_id', userId)
      .update(engagementUpdate)
      .catch(() => {
        // Create new record if doesn't exist
        return knex('user_engagement_metrics').insert({
          user_id: userId,
          total_events: 1,
          last_activity: new Date()
        });
      });
  }

  static async updateEventEngagementMetrics(eventId, interactionType, interactionData) {
    // Update event engagement metrics
    const engagementUpdate = {
      last_interaction: new Date(),
      total_interactions: knex.raw('total_interactions + 1')
    };

    await knex('event_engagement_metrics')
      .where('event_id', eventId)
      .update(engagementUpdate)
      .catch(() => {
        // Create new record if doesn't exist
        return knex('event_engagement_metrics').insert({
          event_id: eventId,
          total_interactions: 1,
          last_interaction: new Date()
        });
      });
  }

  static async updateConversionMetrics(conversionType, conversionValue, data) {
    // Update conversion metrics
    const conversionUpdate = {
      total_conversions: knex.raw('total_conversions + 1'),
      total_value: knex.raw(`total_value + ${conversionValue || 0}`),
      last_conversion: new Date()
    };

    await knex('conversion_metrics')
      .where('conversion_type', conversionType)
      .update(conversionUpdate)
      .catch(() => {
        // Create new record if doesn't exist
        return knex('conversion_metrics').insert({
          conversion_type: conversionType,
          total_conversions: 1,
          total_value: conversionValue || 0,
          last_conversion: new Date()
        });
      });
  }

  static analyzeJourneyPatterns(userActivity, eventInteractions) {
    // Analyze user journey patterns
    const patterns = {
      mostVisitedPages: {},
      commonFlows: [],
      sessionDuration: 0,
      bounceRate: 0
    };

    // Analyze page visits
    userActivity.forEach(activity => {
      const page = activity.page_url;
      patterns.mostVisitedPages[page] = (patterns.mostVisitedPages[page] || 0) + 1;
    });

    // Calculate session duration and bounce rate
    const sessions = this.groupBySession(userActivity);
    patterns.sessionDuration = this.calculateAverageSessionDuration(sessions);
    patterns.bounceRate = this.calculateBounceRate(sessions);

    return patterns;
  }

  static countUniqueSessions(userActivity) {
    const sessions = new Set(userActivity.map(activity => activity.session_id));
    return sessions.size;
  }

  static groupBySession(userActivity) {
    const sessions = {};
    userActivity.forEach(activity => {
      if (!sessions[activity.session_id]) {
        sessions[activity.session_id] = [];
      }
      sessions[activity.session_id].push(activity);
    });
    return sessions;
  }

  static calculateAverageSessionDuration(sessions) {
    const durations = Object.values(sessions).map(session => {
      if (session.length < 2) return 0;
      const first = new Date(session[0].created_at);
      const last = new Date(session[session.length - 1].created_at);
      return last - first;
    });
    return durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
  }

  static calculateBounceRate(sessions) {
    const bounceSessions = Object.values(sessions).filter(session => session.length === 1).length;
    return (bounceSessions / Object.keys(sessions).length) * 100;
  }

  static convertToCSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      });
      csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
  }

  // Export helper methods
  static async exportUserActivityData(filters, dateRange) {
    return await knex('user_activity_tracking')
      .select('*')
      .modify(queryBuilder => {
        if (filters.userId) {
          queryBuilder.where('user_id', filters.userId);
        }
        if (filters.eventType) {
          queryBuilder.where('event_type', filters.eventType);
        }
        if (dateRange?.startDate) {
          queryBuilder.where('created_at', '>=', dateRange.startDate);
        }
        if (dateRange?.endDate) {
          queryBuilder.where('created_at', '<=', dateRange.endDate);
        }
      })
      .orderBy('created_at', 'desc');
  }

  static async exportEventInteractionData(filters, dateRange) {
    return await knex('event_interaction_tracking')
      .select('*')
      .modify(queryBuilder => {
        if (filters.eventId) {
          queryBuilder.where('event_id', filters.eventId);
        }
        if (filters.interactionType) {
          queryBuilder.where('interaction_type', filters.interactionType);
        }
        if (dateRange?.startDate) {
          queryBuilder.where('created_at', '>=', dateRange.startDate);
        }
        if (dateRange?.endDate) {
          queryBuilder.where('created_at', '<=', dateRange.endDate);
        }
      })
      .orderBy('created_at', 'desc');
  }

  static async exportConversionData(filters, dateRange) {
    return await knex('conversion_tracking')
      .select('*')
      .modify(queryBuilder => {
        if (filters.conversionType) {
          queryBuilder.where('conversion_type', filters.conversionType);
        }
        if (dateRange?.startDate) {
          queryBuilder.where('created_at', '>=', dateRange.startDate);
        }
        if (dateRange?.endDate) {
          queryBuilder.where('created_at', '<=', dateRange.endDate);
        }
      })
      .orderBy('created_at', 'desc');
  }

  static async exportPerformanceData(filters, dateRange) {
    return await knex('performance_tracking')
      .select('*')
      .modify(queryBuilder => {
        if (filters.endpoint) {
          queryBuilder.where('endpoint', filters.endpoint);
        }
        if (filters.statusCode) {
          queryBuilder.where('status_code', filters.statusCode);
        }
        if (dateRange?.startDate) {
          queryBuilder.where('created_at', '>=', dateRange.startDate);
        }
        if (dateRange?.endDate) {
          queryBuilder.where('created_at', '<=', dateRange.endDate);
        }
      })
      .orderBy('created_at', 'desc');
  }
}

module.exports = TrackingService;
