const { Pool } = require('pg');
const redisManager = require('../cache/RedisManager');

// Load environment variables
require('dotenv').config();

console.log('Database connection config:', {
  DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
  url: process.env.DATABASE_URL
});

// PostgreSQL connection pools
const primaryPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  min: 5,
  acquireTimeoutMillis: 30000,
  createTimeoutMillis: 30000,
  destroyTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  reapIntervalMillis: 1000,
  createRetryIntervalMillis: 200,
});

const replicaPool = process.env.DATABASE_REPLICA_URL ? new Pool({
  connectionString: process.env.DATABASE_REPLICA_URL,
  max: 15,
  min: 3,
  acquireTimeoutMillis: 30000,
  createTimeoutMillis: 30000,
  destroyTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  reapIntervalMillis: 1000,
  createRetryIntervalMillis: 200,
}) : primaryPool;

// Connection initialization
const initializeConnections = async () => {
  try {
    // Test PostgreSQL connections
    await primaryPool.query('SELECT NOW()');
    console.log('✅ Primary PostgreSQL connected');
    
    if (replicaPool !== primaryPool) {
      await replicaPool.query('SELECT NOW()');
      console.log('✅ Replica PostgreSQL connected');
    }

    // Initialize Redis connections through RedisManager (optional for development)
    if (process.env.ENABLE_REDIS !== 'false') {
      try {
        await redisManager.initialize();
      } catch (error) {
        console.warn('⚠️ Redis initialization failed, continuing without Redis:', error.message);
      }
    } else {
      console.log('ℹ️ Redis disabled via ENABLE_REDIS=false');
    }

  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const closeConnections = async () => {
  try {
    await primaryPool.end();
    if (replicaPool !== primaryPool) {
      await replicaPool.end();
    }
    
    // Disconnect Redis through RedisManager
    await redisManager.disconnect();
    
    console.log('✅ All database connections closed');
  } catch (error) {
    console.error('❌ Error closing connections:', error);
  }
};

// Database query helpers
const query = async (text, params = [], useReplica = false) => {
  const pool = useReplica ? replicaPool : primaryPool;
  const start = Date.now();
  
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log slow queries
    if (duration > 1000) {
      console.warn(`Slow query (${duration}ms):`, text.substring(0, 100));
    }
    
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

const transaction = async (callback) => {
  const client = await primaryPool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  primaryPool,
  replicaPool,
  redisManager,
  initializeConnections,
  closeConnections,
  query,
  transaction
};