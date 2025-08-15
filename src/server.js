// Load New Relic first for APM monitoring
// require('newrelic');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Import monitoring middleware
const { monitoringMiddleware, errorMonitoringMiddleware } = require('./middleware/monitoring');

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Monitoring middleware (must be early in the chain)
// app.use(monitoringMiddleware);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Bilten API is running',
    timestamp: new Date().toISOString(),
    version: process.env.API_VERSION || 'v1'
  });
});

// API routes
console.log('Loading API routes...');
const apiRoutes = require('./routes');
console.log('API routes loaded successfully');
console.log('API_VERSION:', process.env.API_VERSION || 'v1');
console.log('Mounting routes at:', `/${process.env.API_VERSION || 'v1'}`);
app.use(`/${process.env.API_VERSION || 'v1'}`, apiRoutes);
console.log('Routes mounted successfully');

// Add a test route directly in server.js
app.get('/v1/direct-test', (req, res) => {
  res.json({ message: 'Direct test route is working!' });
});

// Monitoring routes
// app.use('/monitoring', require('./routes/monitoring'));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Error monitoring middleware (must be before error handler)
// app.use(errorMonitoringMiddleware);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Bilten API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});