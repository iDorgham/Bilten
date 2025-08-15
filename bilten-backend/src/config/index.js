const path = require('path');
require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = [
  'JWT_SECRET',
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(envVar => {
    console.error(`   - ${envVar}`);
  });
  console.error('Please check your .env file or environment configuration.');
  process.exit(1);
}

const config = {
  // Server configuration
  server: {
    port: parseInt(process.env.PORT) || 3001,
    env: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  },

  // Database configuration
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    testName: process.env.TEST_DB_NAME || 'bilten_test',
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // File storage configuration
  storage: {
    type: process.env.STORAGE_TYPE || 'local',
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1',
      bucket: process.env.AWS_S3_BUCKET,
    },
  },

  // Email configuration
  email: {
    service: process.env.EMAIL_SERVICE || 'sendgrid',
    sendgridApiKey: process.env.SENDGRID_API_KEY,
    fromEmail: process.env.EMAIL_FROM || 'noreply@bilten.com',
    fromName: process.env.EMAIL_FROM_NAME || 'Bilten Events',
    supportEmail: process.env.SUPPORT_EMAIL || 'support@bilten.com',
    testEmail: process.env.TEST_EMAIL || 'test@bilten.com',
    templates: {
      orderConfirmation: process.env.SENDGRID_TEMPLATE_ORDER_CONFIRMATION || 'd-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      passwordReset: process.env.SENDGRID_TEMPLATE_PASSWORD_RESET || 'd-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      emailVerification: process.env.SENDGRID_TEMPLATE_EMAIL_VERIFICATION || 'd-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      eventCancelled: process.env.SENDGRID_TEMPLATE_EVENT_CANCELLED || 'd-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      eventPostponed: process.env.SENDGRID_TEMPLATE_EVENT_POSTPONED || 'd-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      eventUpdated: process.env.SENDGRID_TEMPLATE_EVENT_UPDATED || 'd-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      ticketReminder: process.env.SENDGRID_TEMPLATE_TICKET_REMINDER || 'd-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      welcome: process.env.SENDGRID_TEMPLATE_WELCOME || 'd-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      paymentFailure: process.env.SENDGRID_TEMPLATE_PAYMENT_FAILURE || 'd-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
    }
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log',
  },

  // Security configuration
  security: {
    bcryptRounds: 12,
    rateLimitWindow: 15 * 60 * 1000, // 15 minutes
    rateLimitMax: 100, // requests per window
  },
};

// Validate configuration
const validateConfig = () => {
  const errors = [];

  // Validate port
  if (isNaN(config.server.port) || config.server.port < 1 || config.server.port > 65535) {
    errors.push('Invalid PORT: must be a number between 1 and 65535');
  }

  // Validate database port
  if (isNaN(config.database.port) || config.database.port < 1 || config.database.port > 65535) {
    errors.push('Invalid DB_PORT: must be a number between 1 and 65535');
  }

  // Validate JWT secret length
  if (config.jwt.secret.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters long');
  }

  // Validate storage type
  if (!['local', 's3'].includes(config.storage.type)) {
    errors.push('STORAGE_TYPE must be either "local" or "s3"');
  }

  // Validate AWS configuration if using S3
  if (config.storage.type === 's3') {
    if (!config.storage.aws.accessKeyId || !config.storage.aws.secretAccessKey || !config.storage.aws.bucket) {
      errors.push('AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET are required when using S3 storage');
    }
  }

  if (errors.length > 0) {
    console.error('❌ Configuration validation errors:');
    errors.forEach(error => {
      console.error(`   - ${error}`);
    });
    process.exit(1);
  }
};

// Run validation
validateConfig();

module.exports = config;