const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const hpp = require('hpp');
const compression = require('compression');
require('dotenv').config();

// Database connections
const { initializeConnections, closeConnections } = require('./database/connection');
const MigrationManager = require('./database/migration');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3001;

// Security middleware
const isProd = (process.env.NODE_ENV === 'production');
const allowOriginEnv = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()) : [];
const defaultOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:4173'
];
const allowedOrigins = [...new Set([...allowOriginEnv, ...defaultOrigins])].filter(Boolean);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'same-site' },
  referrerPolicy: { policy: 'no-referrer' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: isProd ? ["'self'", 'https:'] : ["'self'", "'unsafe-inline'", 'https:'],
      scriptSrc: isProd ? ["'self'"] : ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", ...allowedOrigins],
      fontSrc: ["'self'", 'https:', 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: isProd ? undefined : false,
}));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow non-browser clients
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS not allowed from this origin'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Rate limiting (general) and auth-specific throttling
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many authentication attempts, please try again later.'
});
const authSpeedLimiter = slowDown({
  windowMs: 5 * 60 * 1000,
  delayAfter: 5,
  delayMs: () => 500,
  validate: { delayMs: false }
});

// Compression
app.use(compression());

// Prevent HTTP Parameter Pollution
app.use(hpp());

// Structured logging
const { logger, httpLoggerMiddleware, errorLoggerMiddleware } = require('./utils/logger');
app.use(httpLoggerMiddleware);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static('public'));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connectivity
    const { query } = require('./database/connection');
    await query('SELECT 1');
    
    res.status(200).json({
      status: 'OK',
      message: 'Bilten Backend API is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      message: 'Database connection failed',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: 'disconnected'
    });
  }
});

// Root endpoint - serve HTML page
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: './public' });
});

// API routes
app.use('/api/v1/auth', authSpeedLimiter, authLimiter, require('./routes/auth'));
app.use('/api/v1/logs', require('./routes/logs'));
app.use('/api/v1', require('./routes'));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handler with structured logging
app.use(errorLoggerMiddleware);
app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({
    error: status >= 500 ? 'Internal Server Error' : err.name || 'Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database connections
    await initializeConnections();
    
    // Run pending migrations
    const migrationManager = new MigrationManager();
    await migrationManager.runPendingMigrations();
    
    // Initialize RBAC system
    const RBACService = require('./services/RBACService');
    const rbacService = new RBACService();
    await rbacService.initialize();
    
    // Start server (skip when running under test)
    if (process.env.NODE_ENV !== 'test') {
      const server = app.listen(PORT, () => {
        logger.info('Bilten Backend API started', {
          port: PORT,
          environment: process.env.NODE_ENV || 'development',
          healthCheck: `http://localhost:${PORT}/health`,
          apiBaseUrl: `http://localhost:${PORT}/api/v1`
        });
      });

      // Graceful shutdown
      process.on('SIGTERM', async () => {
        logger.info('SIGTERM received, shutting down gracefully');
        server.close(async () => {
          await closeConnections();
          process.exit(0);
        });
      });

      process.on('SIGINT', async () => {
        logger.info('SIGINT received, shutting down gracefully');
        server.close(async () => {
          await closeConnections();
          process.exit(0);
        });
      });

      return server;
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

let server;
if (process.env.NODE_ENV !== 'test') {
  server = startServer();
}

module.exports = { app, server };
