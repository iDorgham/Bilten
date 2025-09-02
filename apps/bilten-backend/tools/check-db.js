const { query, initializeConnections, closeConnections } = require('./src/database/connection');

async function check() {
  await initializeConnections();
  try {
    // Check if migrations table exists and its structure
    const result = await query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_schema = 'system' AND table_name = 'migrations'
      ORDER BY ordinal_position;
    `);
    console.log('Migrations table columns:', result.rows);
    
    // Check existing data
    const data = await query('SELECT * FROM system.migrations;');
    console.log('Existing migrations:', data.rows);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await closeConnections();
  }
}

check();