const express = require('express');
const knex = require('../../utils/database');
const { authenticateToken, requireRole } = require('../../middleware/auth');

const router = express.Router();

// GET /analytics/dashboard - Main dashboard metrics
router.get('/dashboard', authenticateToken, requireRole(['admin', 'organizer']), async (req, res) => {
  try {
    const { period = '30d' } = req.query; // 7d, 30d, 90d, 1y
    const startDate = getStartDate(period);

    // Get basic counts
    const [
      totalEvents,
      totalUsers,
      totalArticles,
      totalTickets,
      totalOrders
    ] = await Promise.all([
      knex('events').count('* as count').first(),
      knex('users').count('* as count').first(),
      knex('articles').count('* as count').first(),
      knex('tickets').count('* as count').first(),
      knex('orders').count('* as count').first()
    ]);

    // Get recent activity
    const recentEvents = await knex('events')
      .select('id', 'title', 'start_date', 'status', 'category')
      .where('created_at', '>=', startDate)
      .orderBy('created_at', 'desc')
      .limit(5);

    const recentUsers = await knex('users')
      .select('id', 'first_name', 'last_name', 'email', 'role', 'created_at')
      .where('created_at', '>=', startDate)
      .orderBy('created_at', 'desc')
      .limit(5);

    const recentOrders = await knex('orders')
      .select('id', 'total_amount', 'status', 'created_at')
      .where('created_at', '>=', startDate)
      .orderBy('created_at', 'desc')
      .limit(5);

    // Get revenue metrics
    const revenueData = await knex('orders')
      .select(
        knex.raw('DATE(created_at) as date'),
        knex.raw('SUM(total_amount) as daily_revenue'),
        knex.raw('COUNT(*) as order_count')
      )
      .where('created_at', '>=', startDate)
      .where('status', 'completed')
      .groupBy('date')
      .orderBy('date', 'asc');

    // Get event performance
    const eventPerformance = await knex('events')
      .select(
        'events.id',
        'events.title',
        'events.category',
        'events.start_date',
        knex.raw('COUNT(tickets.id) as total_tickets'),
        knex.raw('SUM(tickets.quantity_sold) as sold_tickets'),
        knex.raw('ROUND((SUM(tickets.quantity_sold) * 100.0 / COUNT(tickets.id)), 2) as sell_rate')
      )
      .leftJoin('tickets', 'events.id', 'tickets.event_id')
      .where('events.created_at', '>=', startDate)
      .groupBy('events.id', 'events.title', 'events.category', 'events.start_date')
      .orderBy('sold_tickets', 'desc')
      .limit(10);

    // Get user engagement
    const userEngagement = await knex('users')
      .select(
        'users.id',
        'users.first_name',
        'users.last_name',
        'users.role',
        knex.raw('COUNT(DISTINCT orders.id) as order_count'),
        knex.raw('SUM(orders.total_amount) as total_spent'),
        knex.raw('COUNT(DISTINCT user_tickets.id) as tickets_purchased')
      )
      .leftJoin('orders', 'users.id', 'orders.user_id')
      .leftJoin('user_tickets', 'users.id', 'user_tickets.user_id')
      .where('users.created_at', '>=', startDate)
      .groupBy('users.id', 'users.first_name', 'users.last_name', 'users.role')
      .orderBy('total_spent', 'desc')
      .limit(10);

    res.json({
      success: true,
      data: {
        period,
        summary: {
          totalEvents: parseInt(totalEvents.count),
          totalUsers: parseInt(totalUsers.count),
          totalArticles: parseInt(totalArticles.count),
          totalTickets: parseInt(totalTickets.count),
          totalOrders: parseInt(totalOrders.count)
        },
        recentActivity: {
          events: recentEvents,
          users: recentUsers,
          orders: recentOrders
        },
        revenue: {
          dailyData: revenueData,
          totalRevenue: revenueData.reduce((sum, day) => sum + parseFloat(day.daily_revenue || 0), 0),
          totalOrders: revenueData.reduce((sum, day) => sum + parseInt(day.order_count || 0), 0),
          averageOrderValue: revenueData.length > 0 ? 
            revenueData.reduce((sum, day) => sum + parseFloat(day.daily_revenue || 0), 0) / 
            revenueData.reduce((sum, day) => sum + parseInt(day.order_count || 0), 0) : 0
        },
        eventPerformance,
        userEngagement
      }
    });

  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /analytics/events - Event analytics
router.get('/events', authenticateToken, requireRole(['admin', 'organizer']), async (req, res) => {
  try {
    const { period = '30d', category, status } = req.query;
    const startDate = getStartDate(period);

    let query = knex('events')
      .select([
        'events.*',
        'users.first_name as organizer_first_name',
        'users.last_name as organizer_last_name',
        knex.raw('COUNT(DISTINCT tickets.id) as total_ticket_types'),
        knex.raw('SUM(tickets.quantity_total) as total_tickets_available'),
        knex.raw('SUM(tickets.quantity_sold) as total_tickets_sold'),
        knex.raw('ROUND((SUM(tickets.quantity_sold) * 100.0 / NULLIF(SUM(tickets.quantity_total), 0)), 2) as sell_rate'),
        knex.raw('SUM(tickets.quantity_sold * tickets.price) as total_revenue')
      ])
      .leftJoin('users', 'events.organizer_id', 'users.id')
      .leftJoin('tickets', 'events.id', 'tickets.event_id')
      .where('events.created_at', '>=', startDate)
      .groupBy('events.id', 'users.first_name', 'users.last_name');

    if (category) {
      query = query.where('events.category', category);
    }

    if (status) {
      query = query.where('events.status', status);
    }

    const events = await query.orderBy('events.start_date', 'desc');

    // Get event categories distribution
    const categoryDistribution = await knex('events')
      .select('category')
      .count('* as count')
      .where('created_at', '>=', startDate)
      .groupBy('category')
      .orderBy('count', 'desc');

    // Get event status distribution
    const statusDistribution = await knex('events')
      .select('status')
      .count('* as count')
      .where('created_at', '>=', startDate)
      .groupBy('status')
      .orderBy('count', 'desc');

    // Get monthly event creation trend
    const monthlyTrend = await knex('events')
      .select(
        knex.raw('DATE_TRUNC(\'month\', created_at) as month'),
        knex.raw('COUNT(*) as event_count')
      )
      .where('created_at', '>=', startDate)
      .groupBy('month')
      .orderBy('month', 'asc');

    res.json({
      success: true,
      data: {
        period,
        filters: { category, status },
        events,
        categoryDistribution,
        statusDistribution,
        monthlyTrend
      }
    });

  } catch (error) {
    console.error('Event analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /analytics/users - User analytics
router.get('/users', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { period = '30d', role } = req.query;
    const startDate = getStartDate(period);

    let query = knex('users')
      .select([
        'users.*',
        knex.raw('COUNT(DISTINCT orders.id) as order_count'),
        knex.raw('SUM(orders.total_amount) as total_spent'),
        knex.raw('COUNT(DISTINCT user_tickets.id) as tickets_purchased'),
        knex.raw('COUNT(DISTINCT events.id) as events_organized')
      ])
      .leftJoin('orders', 'users.id', 'orders.user_id')
      .leftJoin('user_tickets', 'users.id', 'user_tickets.user_id')
      .leftJoin('events', 'users.id', 'events.organizer_id')
      .where('users.created_at', '>=', startDate)
      .groupBy('users.id');

    if (role) {
      query = query.where('users.role', role);
    }

    const users = await query.orderBy('users.created_at', 'desc');

    // Get user role distribution
    const roleDistribution = await knex('users')
      .select('role')
      .count('* as count')
      .where('created_at', '>=', startDate)
      .groupBy('role')
      .orderBy('count', 'desc');

    // Get user registration trend
    const registrationTrend = await knex('users')
      .select(
        knex.raw('DATE_TRUNC(\'day\', created_at) as date'),
        knex.raw('COUNT(*) as user_count')
      )
      .where('created_at', '>=', startDate)
      .groupBy('date')
      .orderBy('date', 'asc');

    // Get top spenders
    const topSpenders = await knex('users')
      .select(
        'users.id',
        'users.first_name',
        'users.last_name',
        'users.email',
        'users.role',
        knex.raw('SUM(orders.total_amount) as total_spent'),
        knex.raw('COUNT(orders.id) as order_count')
      )
      .leftJoin('orders', 'users.id', 'orders.user_id')
      .where('users.created_at', '>=', startDate)
      .where('orders.status', 'completed')
      .groupBy('users.id', 'users.first_name', 'users.last_name', 'users.email', 'users.role')
      .orderBy('total_spent', 'desc')
      .limit(10);

    res.json({
      success: true,
      data: {
        period,
        filters: { role },
        users,
        roleDistribution,
        registrationTrend,
        topSpenders
      }
    });

  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /analytics/financial - Financial analytics
router.get('/financial', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const startDate = getStartDate(period);

    // Get revenue data
    const revenueData = await knex('orders')
      .select(
        knex.raw('DATE(created_at) as date'),
        knex.raw('SUM(total_amount) as daily_revenue'),
        knex.raw('COUNT(*) as order_count'),
        knex.raw('AVG(total_amount) as average_order_value')
      )
      .where('created_at', '>=', startDate)
      .where('status', 'completed')
      .groupBy('date')
      .orderBy('date', 'asc');

    // Get payment method distribution
    const paymentMethods = await knex('orders')
      .select('payment_method')
      .count('* as count')
      .sum('total_amount as total_amount')
      .where('created_at', '>=', startDate)
      .where('status', 'completed')
      .groupBy('payment_method')
      .orderBy('count', 'desc');

    // Get order status distribution
    const orderStatus = await knex('orders')
      .select('status')
      .count('* as count')
      .sum('total_amount as total_amount')
      .where('created_at', '>=', startDate)
      .groupBy('status')
      .orderBy('count', 'desc');

    // Get ticket sales by event
    const ticketSales = await knex('tickets')
      .select([
        'tickets.id',
        'tickets.name',
        'tickets.price',
        'tickets.quantity_total',
        'tickets.quantity_sold',
        'events.title as event_title',
        'events.category as event_category'
      ])
      .leftJoin('events', 'tickets.event_id', 'events.id')
      .where('tickets.created_at', '>=', startDate)
      .orderBy('tickets.quantity_sold', 'desc')
      .limit(20);

    // Calculate summary metrics
    const totalRevenue = revenueData.reduce((sum, day) => sum + parseFloat(day.daily_revenue || 0), 0);
    const totalOrders = revenueData.reduce((sum, day) => sum + parseInt(day.order_count || 0), 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    res.json({
      success: true,
      data: {
        period,
        summary: {
          totalRevenue,
          totalOrders,
          averageOrderValue,
          revenueGrowth: calculateGrowth(revenueData)
        },
        revenueData,
        paymentMethods,
        orderStatus,
        ticketSales
      }
    });

  } catch (error) {
    console.error('Financial analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /analytics/content - Content analytics (articles)
router.get('/content', authenticateToken, requireRole(['admin', 'organizer']), async (req, res) => {
  try {
    const { period = '30d', category } = req.query;
    const startDate = getStartDate(period);

    let query = knex('articles')
      .select([
        'articles.*',
        'users.first_name as author_first_name',
        'users.last_name as author_last_name'
      ])
      .leftJoin('users', 'articles.author_id', 'users.id')
      .where('articles.created_at', '>=', startDate);

    if (category) {
      query = query.where('articles.category', category);
    }

    const articles = await query.orderBy('articles.view_count', 'desc');

    // Get article categories distribution
    const categoryDistribution = await knex('articles')
      .select('category')
      .count('* as count')
      .sum('view_count as total_views')
      .where('created_at', '>=', startDate)
      .groupBy('category')
      .orderBy('count', 'desc');

    // Get top performing articles
    const topArticles = await knex('articles')
      .select('id', 'title', 'category', 'view_count', 'read_time', 'published_at')
      .where('created_at', '>=', startDate)
      .orderBy('view_count', 'desc')
      .limit(10);

    // Get article publishing trend
    const publishingTrend = await knex('articles')
      .select(
        knex.raw('DATE_TRUNC(\'week\', published_at) as week'),
        knex.raw('COUNT(*) as article_count'),
        knex.raw('SUM(view_count) as total_views')
      )
      .where('published_at', '>=', startDate)
      .groupBy('week')
      .orderBy('week', 'asc');

    res.json({
      success: true,
      data: {
        period,
        filters: { category },
        articles,
        categoryDistribution,
        topArticles,
        publishingTrend
      }
    });

  } catch (error) {
    console.error('Content analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /analytics/performance - System performance metrics
router.get('/performance', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    const startDate = getStartDate(period);

    // Get API response times (mock data for now)
    const apiPerformance = [
      { endpoint: '/v1/events', avgResponseTime: 45, requestsPerMinute: 120 },
      { endpoint: '/v1/search', avgResponseTime: 7, requestsPerMinute: 85 },
      { endpoint: '/v1/auth/login', avgResponseTime: 23, requestsPerMinute: 45 },
      { endpoint: '/v1/payments', avgResponseTime: 156, requestsPerMinute: 12 },
      { endpoint: '/v1/uploads', avgResponseTime: 234, requestsPerMinute: 8 }
    ];

    // Get database performance
    const dbPerformance = await knex.raw(`
      SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as live_rows
      FROM pg_stat_user_tables 
      WHERE schemaname = 'public'
      ORDER BY n_live_tup DESC
    `);

    // Get error rates (mock data for now)
    const errorRates = [
      { endpoint: '/v1/events', errorRate: 0.2, totalRequests: 1200 },
      { endpoint: '/v1/search', errorRate: 0.1, totalRequests: 850 },
      { endpoint: '/v1/auth/login', errorRate: 1.5, totalRequests: 450 },
      { endpoint: '/v1/payments', errorRate: 2.1, totalRequests: 120 },
      { endpoint: '/v1/uploads', errorRate: 0.8, totalRequests: 80 }
    ];

    // Get system health metrics
    const systemHealth = {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      activeConnections: Math.floor(Math.random() * 50) + 10, // Mock data
      databaseConnections: Math.floor(Math.random() * 20) + 5 // Mock data
    };

    res.json({
      success: true,
      data: {
        period,
        apiPerformance,
        dbPerformance: dbPerformance.rows,
        errorRates,
        systemHealth
      }
    });

  } catch (error) {
    console.error('Performance analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /analytics/export - Export analytics data
router.get('/export', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { type, period = '30d', format = 'json' } = req.query;
    const startDate = getStartDate(period);

    let data = {};

    switch (type) {
      case 'events':
        data = await knex('events')
          .select('*')
          .where('created_at', '>=', startDate)
          .orderBy('created_at', 'desc');
        break;

      case 'users':
        data = await knex('users')
          .select('*')
          .where('created_at', '>=', startDate)
          .orderBy('created_at', 'desc');
        break;

      case 'orders':
        data = await knex('orders')
          .select('*')
          .where('created_at', '>=', startDate)
          .orderBy('created_at', 'desc');
        break;

      case 'articles':
        data = await knex('articles')
          .select('*')
          .where('created_at', '>=', startDate)
          .orderBy('created_at', 'desc');
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid export type'
        });
    }

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}_${period}_${new Date().toISOString().split('T')[0]}.csv"`);
      return res.send(csv);
    }

    res.json({
      success: true,
      data: {
        type,
        period,
        format,
        records: data.length,
        data
      }
    });

  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Helper functions
function getStartDate(period) {
  const now = new Date();
  switch (period) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case '1y':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

function calculateGrowth(data) {
  if (data.length < 2) return 0;
  
  const recent = data.slice(-7).reduce((sum, day) => sum + parseFloat(day.daily_revenue || 0), 0);
  const previous = data.slice(-14, -7).reduce((sum, day) => sum + parseFloat(day.daily_revenue || 0), 0);
  
  if (previous === 0) return recent > 0 ? 100 : 0;
  return ((recent - previous) / previous) * 100;
}

function convertToCSV(data) {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

module.exports = router;
