const knex = require('knex');
const config = require('../config');

// Initialize Knex with environment-specific configuration
const knexConfig = require('../../knexfile.js')[config.server.env];
const db = knex(knexConfig);

// Test database connection
db.raw('SELECT 1')
  .then(() => {
    console.log('✅ Database connected successfully');
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err.message);
  });

// Export models
module.exports = db;
module.exports.User = require('./User');
module.exports.Event = require('./Event');
module.exports.Ticket = require('./Ticket');
module.exports.Order = require('./Order');
module.exports.PromoCode = require('./PromoCode');