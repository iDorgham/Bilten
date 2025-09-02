const { query, initializeConnections, closeConnections } = require('./src/database/connection');

async function fix() {
  await initializeConnections();
  try {
    // Drop the existing migrations table and recreate with correct schema
    await query('DROP TABLE IF EXISTS system.migrations;');
    
    await query(`
      CREATE TABLE system.migrations (
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
    
    console.log('✅ Migrations table recreated with correct schema');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await closeConnections();
  }
}

fix();