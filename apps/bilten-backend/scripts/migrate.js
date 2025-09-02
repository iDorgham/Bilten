#!/usr/bin/env node

const MigrationManager = require('../src/database/migration');
const { initializeConnections, closeConnections } = require('../src/database/connection');

async function main() {
  const command = process.argv[2];
  const migrationName = process.argv[3];

  try {
    await initializeConnections();
    const migrationManager = new MigrationManager();

    switch (command) {
      case 'up':
        await migrationManager.runPendingMigrations();
        break;
        
      case 'down':
        if (!migrationName) {
          console.error('Migration name required for rollback');
          process.exit(1);
        }
        await migrationManager.rollbackMigration(migrationName);
        break;
        
      case 'status':
        const status = await migrationManager.getMigrationStatus();
        console.table(status);
        break;
        
      case 'create':
        if (!migrationName) {
          console.error('Migration name required');
          process.exit(1);
        }
        await createMigrationFile(migrationName);
        break;
        
      default:
        console.log(`
Usage: node scripts/migrate.js <command> [options]

Commands:
  up                    Run all pending migrations
  down <name>          Rollback a specific migration
  status               Show migration status
  create <name>        Create a new migration file

Examples:
  node scripts/migrate.js up
  node scripts/migrate.js down 001_initial_schema
  node scripts/migrate.js status
  node scripts/migrate.js create add_user_preferences
        `);
    }

  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    await closeConnections();
  }
}

async function createMigrationFile(name) {
  const fs = require('fs').promises;
  const path = require('path');
  
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
  const filename = `${timestamp}_${name}.js`;
  const migrationsDir = path.join(__dirname, '../database/migrations');
  const filepath = path.join(migrationsDir, filename);

  // Ensure migrations directory exists
  try {
    await fs.mkdir(migrationsDir, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }

  const template = `// Migration: ${name}
// Created: ${new Date().toISOString()}

module.exports = {
  async up(client) {
    // Add your migration code here
    // Example:
    // await client.query(\`
    //   CREATE TABLE example (
    //     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    //     name VARCHAR(255) NOT NULL,
    //     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    //   )
    // \`);
  },

  async down(client) {
    // Add your rollback code here
    // Example:
    // await client.query('DROP TABLE IF EXISTS example');
  }
};
`;

  await fs.writeFile(filepath, template);
  console.log(`✅ Created migration: ${filename}`);
}

if (require.main === module) {
  main();
}

module.exports = { main };