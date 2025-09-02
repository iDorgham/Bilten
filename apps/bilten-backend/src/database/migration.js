const fs = require('fs').promises;
const path = require('path');
const { query, transaction } = require('./connection');

class MigrationManager {
  constructor() {
    this.migrationsPath = path.join(__dirname, '../../database/migrations');
  }

  async ensureMigrationsTable() {
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
  }

  async getAppliedMigrations() {
    const result = await query(
      'SELECT name FROM system.migrations WHERE status = $1 ORDER BY completed_at',
      ['completed']
    );
    return result.rows.map(row => row.name);
  }

  async getPendingMigrations() {
    try {
      const files = await fs.readdir(this.migrationsPath);
      const migrationFiles = files
        .filter(file => file.endsWith('.js'))
        .sort();

      const appliedMigrations = await this.getAppliedMigrations();
      
      return migrationFiles.filter(file => 
        !appliedMigrations.includes(path.basename(file, '.js'))
      );
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('No migrations directory found');
        return [];
      }
      throw error;
    }
  }

  async runMigration(migrationFile) {
    const migrationName = path.basename(migrationFile, '.js');
    const migrationPath = path.join(this.migrationsPath, migrationFile);
    
    console.log(`Running migration: ${migrationName}`);

    return await transaction(async (client) => {
      // Record migration start
      await client.query(
        'INSERT INTO system.migrations (name, started_at, status) VALUES ($1, NOW(), $2)',
        [migrationName, 'running']
      );

      try {
        // Load and run migration
        const migration = require(migrationPath);
        
        if (typeof migration.up !== 'function') {
          throw new Error(`Migration ${migrationName} must export an 'up' function`);
        }

        await migration.up(client);
        
        // Record success
        await client.query(
          'UPDATE system.migrations SET completed_at = NOW(), status = $1 WHERE name = $2',
          ['completed', migrationName]
        );

        console.log(`✅ Migration completed: ${migrationName}`);
        
      } catch (error) {
        // Record failure
        await client.query(
          'UPDATE system.migrations SET failed_at = NOW(), status = $1, error = $2 WHERE name = $3',
          ['failed', error.message, migrationName]
        );
        
        console.error(`❌ Migration failed: ${migrationName}`, error);
        throw error;
      }
    });
  }

  async runPendingMigrations() {
    await this.ensureMigrationsTable();
    
    const pendingMigrations = await this.getPendingMigrations();
    
    if (pendingMigrations.length === 0) {
      console.log('✅ No pending migrations');
      return;
    }

    console.log(`Found ${pendingMigrations.length} pending migrations`);
    
    for (const migration of pendingMigrations) {
      await this.runMigration(migration);
    }
    
    console.log('✅ All migrations completed');
  }

  async rollbackMigration(migrationName) {
    const migrationPath = path.join(this.migrationsPath, `${migrationName}.js`);
    
    console.log(`Rolling back migration: ${migrationName}`);

    return await transaction(async (client) => {
      try {
        // Load and run rollback
        const migration = require(migrationPath);
        
        if (typeof migration.down !== 'function') {
          throw new Error(`Migration ${migrationName} must export a 'down' function for rollback`);
        }

        await migration.down(client);
        
        // Remove from migrations table
        await client.query(
          'DELETE FROM system.migrations WHERE name = $1',
          [migrationName]
        );

        console.log(`✅ Migration rolled back: ${migrationName}`);
        
      } catch (error) {
        console.error(`❌ Rollback failed: ${migrationName}`, error);
        throw error;
      }
    });
  }

  async getMigrationStatus() {
    await this.ensureMigrationsTable();
    
    const result = await query(`
      SELECT name, status, started_at, completed_at, failed_at, error
      FROM system.migrations 
      ORDER BY started_at DESC
    `);
    
    return result.rows;
  }
}

module.exports = MigrationManager;