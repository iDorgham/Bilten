const { query, initializeConnections, closeConnections } = require('./src/database/connection');

async function checkSchema() {
  await initializeConnections();
  try {
    // Check existing schemas
    const schemas = await query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name IN ('users', 'authentication', 'system')
    `);
    console.log('Existing schemas:', schemas.rows);

    // Check existing tables
    const tables = await query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema IN ('users', 'authentication', 'system')
      ORDER BY table_schema, table_name
    `);
    console.log('Existing tables:', tables.rows);

    // Check users table structure if it exists
    const userColumns = await query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_schema = 'users' AND table_name = 'users'
      ORDER BY ordinal_position
    `);
    console.log('Users table columns:', userColumns.rows);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await closeConnections();
  }
}

checkSchema();