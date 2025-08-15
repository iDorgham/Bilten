const knex = require('knex');
const config = require('./index');

// Get the appropriate knex configuration
const environment = config.server.env;
const knexConfig = require('../../knexfile')[environment];

if (!knexConfig) {
  throw new Error(`No database configuration found for environment: ${environment}`);
}

// Create knex instance
const db = knex(knexConfig);

// Test database connection
const testConnection = async () => {
  try {
    await db.raw('SELECT 1');
    console.log('✅ Database connection established successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// Graceful shutdown
const closeConnection = async () => {
  try {
    await db.destroy();
    console.log('📴 Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error.message);
  }
};

module.exports = {
  db,
  testConnection,
  closeConnection,
};