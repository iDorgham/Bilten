const express = require('express');
const router = express.Router();

// Mock export types for now
const exportTypes = {
  events: {
    name: 'Events',
    description: 'Export event data including details, dates, and statistics',
    icon: 'CalendarIcon',
    fields: [
      { key: 'id', label: 'Event ID', type: 'string' },
      { key: 'title', label: 'Title', type: 'string' },
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'date', label: 'Event Date', type: 'date' },
      { key: 'venue', label: 'Venue', type: 'string' },
      { key: 'organizer', label: 'Organizer', type: 'string' },
      { key: 'category', label: 'Category', type: 'string' },
      { key: 'price', label: 'Price', type: 'number' },
      { key: 'attendees', label: 'Attendees', type: 'number' },
      { key: 'status', label: 'Status', type: 'string' }
    ],
    formats: ['csv', 'json', 'xlsx'],
    relations: ['tickets', 'attendees', 'reviews']
  },
  users: {
    name: 'Users',
    description: 'Export user data and profiles',
    icon: 'UsersIcon',
    fields: [
      { key: 'id', label: 'User ID', type: 'string' },
      { key: 'name', label: 'Name', type: 'string' },
      { key: 'email', label: 'Email', type: 'string' },
      { key: 'role', label: 'Role', type: 'string' },
      { key: 'createdAt', label: 'Registration Date', type: 'date' },
      { key: 'lastLogin', label: 'Last Login', type: 'date' },
      { key: 'status', label: 'Status', type: 'string' }
    ],
    formats: ['csv', 'json', 'xlsx'],
    relations: ['tickets', 'events', 'reviews']
  },
  tickets: {
    name: 'Tickets',
    description: 'Export ticket sales and usage data',
    icon: 'TicketIcon',
    fields: [
      { key: 'id', label: 'Ticket ID', type: 'string' },
      { key: 'eventId', label: 'Event ID', type: 'string' },
      { key: 'eventTitle', label: 'Event Title', type: 'string' },
      { key: 'userId', label: 'User ID', type: 'string' },
      { key: 'userName', label: 'User Name', type: 'string' },
      { key: 'type', label: 'Ticket Type', type: 'string' },
      { key: 'price', label: 'Price', type: 'number' },
      { key: 'purchaseDate', label: 'Purchase Date', type: 'date' },
      { key: 'status', label: 'Status', type: 'string' },
      { key: 'scanned', label: 'Scanned', type: 'boolean' }
    ],
    formats: ['csv', 'json', 'xlsx'],
    relations: ['event', 'user']
  },
  financial: {
    name: 'Financial',
    description: 'Export revenue and financial reports',
    icon: 'CurrencyDollarIcon',
    fields: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'eventId', label: 'Event ID', type: 'string' },
      { key: 'eventTitle', label: 'Event Title', type: 'string' },
      { key: 'ticketsSold', label: 'Tickets Sold', type: 'number' },
      { key: 'grossRevenue', label: 'Gross Revenue', type: 'number' },
      { key: 'fees', label: 'Platform Fees', type: 'number' },
      { key: 'netRevenue', label: 'Net Revenue', type: 'number' },
      { key: 'refunds', label: 'Refunds', type: 'number' }
    ],
    formats: ['csv', 'json', 'xlsx'],
    relations: ['events', 'tickets']
  },
  analytics: {
    name: 'Analytics',
    description: 'Export analytics and performance data',
    icon: 'ChartBarIcon',
    fields: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'metric', label: 'Metric', type: 'string' },
      { key: 'value', label: 'Value', type: 'number' },
      { key: 'category', label: 'Category', type: 'string' },
      { key: 'eventId', label: 'Event ID', type: 'string' },
      { key: 'source', label: 'Source', type: 'string' }
    ],
    formats: ['csv', 'json', 'xlsx'],
    relations: ['events', 'users']
  }
};

// Mock scheduled exports
const scheduledExports = [
  {
    id: 'sched_001',
    name: 'Weekly Event Report',
    type: 'events',
    format: 'xlsx',
    schedule: 'weekly',
    lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    nextRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    recipients: ['admin@bilten.com', 'reports@bilten.com']
  },
  {
    id: 'sched_002',
    name: 'Monthly Financial Summary',
    type: 'financial',
    format: 'csv',
    schedule: 'monthly',
    lastRun: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    nextRun: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    recipients: ['finance@bilten.com']
  }
];

// Mock export history
const exportHistory = [
  {
    id: 'exp_001',
    type: 'events',
    format: 'csv',
    status: 'completed',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 30000).toISOString(),
    fileSize: '2.5 MB',
    recordCount: 1250,
    downloadUrl: '/api/v1/export/download/exp_001'
  },
  {
    id: 'exp_002',
    type: 'users',
    format: 'xlsx',
    status: 'completed',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 45000).toISOString(),
    fileSize: '1.8 MB',
    recordCount: 890,
    downloadUrl: '/api/v1/export/download/exp_002'
  },
  {
    id: 'exp_003',
    type: 'tickets',
    format: 'json',
    status: 'failed',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    error: 'Database connection timeout',
    recordCount: 0
  }
];

// GET /api/v1/export/types - Get available export types
router.get('/types', (req, res) => {
  res.json({
    success: true,
    data: exportTypes
  });
});

// GET /api/v1/export/preview - Get preview of export data
router.get('/preview', (req, res) => {
  const { type = 'events', limit = 10 } = req.query;
  
  // Mock preview data based on type
  let previewData = [];
  
  switch (type) {
    case 'events':
      previewData = Array.from({ length: Math.min(limit, 5) }, (_, i) => ({
        id: `event_${i + 1}`,
        title: `Sample Event ${i + 1}`,
        description: `Description for event ${i + 1}`,
        date: new Date(Date.now() + (i * 7 * 24 * 60 * 60 * 1000)).toISOString(),
        venue: `Venue ${i + 1}`,
        organizer: `Organizer ${i + 1}`,
        category: ['Music', 'Sports', 'Tech', 'Art'][i % 4],
        price: (50 + i * 25).toFixed(2),
        attendees: 100 + i * 50,
        status: ['upcoming', 'active', 'completed'][i % 3]
      }));
      break;
    
    case 'users':
      previewData = Array.from({ length: Math.min(limit, 5) }, (_, i) => ({
        id: `user_${i + 1}`,
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        role: ['user', 'organizer', 'admin'][i % 3],
        createdAt: new Date(Date.now() - (i * 30 * 24 * 60 * 60 * 1000)).toISOString(),
        lastLogin: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString(),
        status: ['active', 'inactive'][i % 2]
      }));
      break;
    
    case 'tickets':
      previewData = Array.from({ length: Math.min(limit, 5) }, (_, i) => ({
        id: `ticket_${i + 1}`,
        eventId: `event_${Math.floor(i / 2) + 1}`,
        eventTitle: `Sample Event ${Math.floor(i / 2) + 1}`,
        userId: `user_${i + 1}`,
        userName: `User ${i + 1}`,
        type: ['general', 'vip', 'early-bird'][i % 3],
        price: (25 + i * 15).toFixed(2),
        purchaseDate: new Date(Date.now() - (i * 5 * 24 * 60 * 60 * 1000)).toISOString(),
        status: ['active', 'used', 'refunded'][i % 3],
        scanned: i % 2 === 0
      }));
      break;
    
    default:
      previewData = [];
  }
  
  res.json({
    success: true,
    data: {
      type,
      records: previewData,
      totalCount: previewData.length,
      previewNote: 'This is a preview of the first few records. The actual export may contain more data.'
    }
  });
});

// GET /api/v1/export/scheduled - Get scheduled exports
router.get('/scheduled', (req, res) => {
  res.json({
    success: true,
    data: scheduledExports
  });
});

// GET /api/v1/export/history - Get export history
router.get('/history', (req, res) => {
  res.json({
    success: true,
    data: exportHistory
  });
});

// POST /api/v1/export - Create new export
router.post('/', (req, res) => {
  const { type, format, filters, dateRange, includeRelations } = req.body;
  
  // Validate required fields
  if (!type || !format) {
    return res.status(400).json({
      success: false,
      error: 'Type and format are required'
    });
  }
  
  // Validate export type exists
  if (!exportTypes[type]) {
    return res.status(400).json({
      success: false,
      error: `Invalid export type: ${type}`
    });
  }
  
  // Validate format is supported
  if (!exportTypes[type].formats.includes(format)) {
    return res.status(400).json({
      success: false,
      error: `Format ${format} not supported for type ${type}`
    });
  }
  
  // Create mock export job
  const exportJob = {
    id: `exp_${Date.now()}`,
    type,
    format,
    filters: filters || {},
    dateRange: dateRange || {},
    includeRelations: includeRelations || false,
    status: 'processing',
    createdAt: new Date().toISOString(),
    progress: 0
  };
  
  // Simulate processing
  setTimeout(() => {
    exportJob.status = 'completed';
    exportJob.completedAt = new Date().toISOString();
    exportJob.fileSize = '1.2 MB';
    exportJob.recordCount = Math.floor(Math.random() * 1000) + 100;
    exportJob.downloadUrl = `/api/v1/export/download/${exportJob.id}`;
  }, 2000);
  
  res.json({
    success: true,
    data: exportJob
  });
});

// POST /api/v1/export/schedule - Schedule recurring export
router.post('/schedule', (req, res) => {
  const { name, type, format, schedule, recipients, filters } = req.body;
  
  // Validate required fields
  if (!name || !type || !format || !schedule) {
    return res.status(400).json({
      success: false,
      error: 'Name, type, format, and schedule are required'
    });
  }
  
  const scheduledExport = {
    id: `sched_${Date.now()}`,
    name,
    type,
    format,
    schedule,
    recipients: recipients || [],
    filters: filters || {},
    status: 'active',
    createdAt: new Date().toISOString(),
    lastRun: null,
    nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow
  };
  
  res.json({
    success: true,
    data: scheduledExport
  });
});

// GET /api/v1/export/download/:id - Download export file
router.get('/download/:id', (req, res) => {
  const { id } = req.params;
  
  // In a real implementation, this would serve the actual file
  // For now, return a mock response
  res.json({
    success: false,
    error: 'File download not implemented in demo mode',
    message: 'In a real implementation, this would download the exported file'
  });
});

// DELETE /api/v1/export/scheduled/:id - Delete scheduled export
router.delete('/scheduled/:id', (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    message: `Scheduled export ${id} deleted successfully`
  });
});

module.exports = router;
