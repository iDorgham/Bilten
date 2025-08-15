require('dotenv').config();

const config = {
  // Server configuration
  server: {
    port: parseInt(process.env.PORT) || 3001,
    env: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  },

  // Email configuration
  email: {
    service: process.env.EMAIL_SERVICE || 'sendgrid',
    sendgridApiKey: process.env.SENDGRID_API_KEY || 'dummy_key',
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
};

module.exports = config;
