const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./config');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.server.frontendUrl,
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.security.rateLimitWindow,
  max: config.security.rateLimitMax,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
});
app.use(limiter);

// Parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
if (config.server.env !== 'test') {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Bilten API Server is running',
    timestamp: new Date().toISOString(),
    environment: config.server.env,
  });
});

// Import routes
const authRoutes = require('./routes/auth');
const eventsRoutes = require('./routes/events');
const usersRoutes = require('./routes/users');
// const promoCodesRoutes = require('./routes/promoCodes');
// const ordersRoutes = require('./routes/orders');

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/events', eventsRoutes);
app.use('/api/v1/users', usersRoutes);
// app.use('/api/v1/promo-codes', promoCodesRoutes);
// app.use('/api/v1/orders', ordersRoutes);

// API info endpoint
app.get('/api/v1', (req, res) => {
  res.json({
    success: true,
    message: 'Bilten API v1.0',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/v1/auth',
      events: '/api/v1/events',
      users: '/api/v1/users',
      'promo-codes': '/api/v1/promo-codes',
      orders: '/api/v1/orders',
      files: '/api/v1/files',
    },
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(config.server.env === 'development' && { stack: err.stack }),
  });
});

// Start server
if (require.main === module) {
  app.listen(config.server.port, () => {
    console.log(`🚀 Bilten API Server running on port ${config.server.port}`);
    console.log(`📍 Environment: ${config.server.env}`);
    console.log(`🔗 Health check: http://localhost:${config.server.port}/health`);
    console.log(`🎯 Frontend URL: ${config.server.frontendUrl}`);
  });
}

module.exports = app;