const { query, initializeConnections, closeConnections } = require('./src/database/connection');

async function setup() {
  await initializeConnections();
  try {
    await query('CREATE SCHEMA IF NOT EXISTS system;');
    await query(`
      CREATE TABLE IF NOT EXISTS system.migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        started_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        failed_at TIMESTAMP WITH TIME ZONE,
        status VARCHAR(20) DEFAULT 'pending',
        error TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('✅ System schema and migrations table created');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await closeConnections();
  }
}

setup();