#!/usr/bin/env node

/**
 * ClickHouse Analytics Infrastructure Setup Script
 * Comprehensive setup and initialization for analytics database
 */

const { createClient } = require('@clickhouse/client');
const fs = require('fs').promises;
const path = require('path');

class ClickHouseSetup {
    constructor(config = {}) {
        this.config = {
            host: process.env.CLICKHOUSE_HOST || 'localhost',
            port: process.env.CLICKHOUSE_PORT || 8123,
            username: process.env.CLICKHOUSE_USER || 'bilten_user',
            password: process.env.CLICKHOUSE_PASSWORD || 'bilten_password',
            database: process.env.CLICKHOUSE_DATABASE || 'bilten_analytics',
            ...config
        };

        this.client = createClient({
            host: `http://${this.config.host}:${this.config.port}`,
            username: this.config.username,
            password: this.config.password
        });

        this.setupSteps = [];
    }

    /**
     * Initialize the setup process
     */
    async initialize() {
        console.log('🚀 Starting ClickHouse Analytics Infrastructure Setup...');
        console.log(`📊 Target: ${this.config.host}:${this.config.port}`);
        
        try {
            await this.testConnection();
            await this.runSetupSteps();
            await this.verifySetup();
            
            console.log('✅ ClickHouse Analytics Infrastructure setup completed successfully!');
        } catch (error) {
            console.error('❌ Setup failed:', error.message);
            throw error;
        }
    }

    /**
     * Test connection to ClickHouse
     */
    async testConnection() {
        try {
            const result = await this.client.query({
                query: 'SELECT version() as version, uptime() as uptime'
            });
            
            const data = await result.json();
            console.log('✅ ClickHouse connection established');
            console.log(`   Version: ${data.data[0].version}`);
            console.log(`   Uptime: ${Math.floor(data.data[0].uptime / 3600)}h ${Math.floor((data.data[0].uptime % 3600) / 60)}m`);
        } catch (error) {
            throw new Error(`Failed to connect to ClickHouse: ${error.message}`);
        }
    }

    /**
     * Run all setup steps
     */
    async runSetupSteps() {
        this.setupSteps = [
            {
                name: 'Create Analytics Database',
                action: () => this.createDatabase()
            },
            {
                name: 'Create Core Tables',
                action: () => this.createCoreTables()
            },
            {
                name: 'Setup Cluster Configuration',
                action: () => this.setupClusterConfiguration()
            },
            {
                name: 'Create Materialized Views',
                action: () => this.createMaterializedViews()
            },
            {
                name: 'Setup Data Ingestion Pipeline',
                action: () => this.setupDataIngestionPipeline()
            },
            {
                name: 'Configure Data Retention Policies',
                action: () => this.configureDataRetention()
            },
            {
                name: 'Create Monitoring Tables',
                action: () => this.createMonitoringTables()
            },
            {
                name: 'Setup Sample Data',
                action: () => this.setupSampleData()
            }
        ];

        for (const step of this.setupSteps) {
            console.log(`\n🔧 ${step.name}...`);
            try {
                await step.action();
                console.log(`   ✅ ${step.name} completed`);
            } catch (error) {
                console.error(`   ❌ ${step.name} failed:`, error.message);
                throw error;
            }
        }
    }

    /**
     * Create analytics database
     */
    async createDatabase() {
        await this.client.exec({
            query: `
                CREATE DATABASE IF NOT EXISTS ${this.config.database}
                COMMENT 'Bilten Analytics Database for event tracking and reporting';
            `
        });
    }

    /**
     * Create core analytics tables
     */
    async createCoreTables() {
        const sqlFiles = [
            '01-create-analytics-tables.sql',
            '02-analytics-cluster-config.sql'
        ];

        for (const sqlFile of sqlFiles) {
            const filePath = path.join(__dirname, '../../../infrastructure/database/clickhouse', sqlFile);
            try {
                const sql = await fs.readFile(filePath, 'utf8');
                await this.client.exec({ query: sql });
            } catch (error) {
                if (error.code === 'ENOENT') {
                    console.warn(`   ⚠️  SQL file not found: ${sqlFile}`);
                } else {
                    throw error;
                }
            }
        }
    }

    /**
     * Setup cluster configuration
     */
    async setupClusterConfiguration() {
        // Create distributed tables for cluster setup
        const distributedTables = [
            {
                name: 'events_distributed',
                source: 'events'
            },
            {
                name: 'page_views_distributed',
                source: 'page_views'
            },
            {
                name: 'ticket_sales_distributed',
                source: 'ticket_sales'
            }
        ];

        for (const table of distributedTables) {
            await this.client.exec({
                query: `
                    CREATE TABLE IF NOT EXISTS ${this.config.database}.${table.name} AS ${this.config.database}.${table.source}
                    ENGINE = Distributed('bilten_cluster', '${this.config.database}', '${table.source}', rand());
                `
            });
        }
    }

    /**
     * Create materialized views
     */
    async createMaterializedViews() {
        const filePath = path.join(__dirname, '../../../infrastructure/database/clickhouse/03-materialized-views.sql');
        try {
            const sql = await fs.readFile(filePath, 'utf8');
            await this.client.exec({ query: sql });
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.warn('   ⚠️  Materialized views SQL file not found');
            } else {
                throw error;
            }
        }
    }

    /**
     * Setup data ingestion pipeline
     */
    async setupDataIngestionPipeline() {
        const filePath = path.join(__dirname, '../../../infrastructure/database/clickhouse/04-data-ingestion-pipeline.sql');
        try {
            const sql = await fs.readFile(filePath, 'utf8');
            await this.client.exec({ query: sql });
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.warn('   ⚠️  Data ingestion pipeline SQL file not found');
            } else {
                throw error;
            }
        }
    }

    /**
     * Configure data retention policies
     */
    async configureDataRetention() {
        const filePath = path.join(__dirname, '../../../infrastructure/database/clickhouse/05-data-retention-archival.sql');
        try {
            const sql = await fs.readFile(filePath, 'utf8');
            await this.client.exec({ query: sql });
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.warn('   ⚠️  Data retention SQL file not found');
            } else {
                throw error;
            }
        }
    }

    /**
     * Create monitoring tables
     */
    async createMonitoringTables() {
        await this.client.exec({
            query: `
                CREATE TABLE IF NOT EXISTS ${this.config.database}.monitoring_health_checks (
                    timestamp DateTime DEFAULT now(),
                    check_name String,
                    status String,
                    response_time_ms UInt32,
                    details String,
                    is_critical UInt8
                ) ENGINE = MergeTree()
                ORDER BY timestamp;

                CREATE TABLE IF NOT EXISTS ${this.config.database}.monitoring_metrics (
                    timestamp DateTime DEFAULT now(),
                    metric_name String,
                    metric_value Float64,
                    metric_unit String,
                    tags Map(String, String)
                ) ENGINE = MergeTree()
                ORDER BY (timestamp, metric_name);

                CREATE TABLE IF NOT EXISTS ${this.config.database}.monitoring_alerts (
                    timestamp DateTime DEFAULT now(),
                    alert_id UUID DEFAULT generateUUIDv4(),
                    severity String,
                    title String,
                    description String,
                    resolved UInt8 DEFAULT 0,
                    resolved_at Nullable(DateTime)
                ) ENGINE = MergeTree()
                ORDER BY timestamp;
            `
        });
    }

    /**
     * Setup sample data for testing
     */
    async setupSampleData() {
        const sampleEvents = [];
        const organizerIds = ['org1', 'org2', 'org3'].map(() => this.generateUUID());
        const eventTypes = ['page_view', 'event_view', 'ticket_purchase', 'registration', 'share'];
        
        // Generate 100 sample events
        for (let i = 0; i < 100; i++) {
            const timestamp = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Last 7 days
            
            sampleEvents.push({
                event_id: this.generateUUID(),
                session_id: this.generateUUID(),
                user_id: Math.random() > 0.3 ? this.generateUUID() : null,
                organizer_id: organizerIds[Math.floor(Math.random() * organizerIds.length)],
                event_type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
                event_name: `Sample Event ${i + 1}`,
                timestamp: timestamp.toISOString(),
                properties: {
                    browser: ['Chrome', 'Firefox', 'Safari'][Math.floor(Math.random() * 3)],
                    device_type: ['desktop', 'mobile', 'tablet'][Math.floor(Math.random() * 3)],
                    country: ['US', 'UK', 'CA'][Math.floor(Math.random() * 3)]
                },
                user_agent: 'Mozilla/5.0 (Sample Agent)',
                ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
                referrer: 'https://google.com',
                page_url: `https://bilten.com/events/${this.generateUUID()}`
            });
        }

        try {
            await this.client.insert({
                table: `${this.config.database}.events`,
                values: sampleEvents
            });
            
            console.log(`   📊 Inserted ${sampleEvents.length} sample events`);
        } catch (error) {
            console.warn('   ⚠️  Could not insert sample data:', error.message);
        }
    }

    /**
     * Verify setup completion
     */
    async verifySetup() {
        console.log('\n🔍 Verifying setup...');
        
        const verifications = [
            {
                name: 'Database exists',
                query: `SELECT count() FROM system.databases WHERE name = '${this.config.database}'`,
                expected: 1
            },
            {
                name: 'Core tables exist',
                query: `SELECT count() FROM system.tables WHERE database = '${this.config.database}' AND name IN ('events', 'page_views', 'ticket_sales')`,
                expected: 3
            },
            {
                name: 'Sample data exists',
                query: `SELECT count() FROM ${this.config.database}.events`,
                expectedMin: 1
            }
        ];

        for (const verification of verifications) {
            try {
                const result = await this.client.query({ query: verification.query });
                const data = await result.json();
                const count = parseInt(data.data[0]['count()'] || data.data[0]['count']);
                
                const success = verification.expected ? 
                    count === verification.expected : 
                    count >= (verification.expectedMin || 0);
                
                console.log(`   ${success ? '✅' : '❌'} ${verification.name}: ${count}`);
                
                if (!success) {
                    throw new Error(`Verification failed: ${verification.name}`);
                }
            } catch (error) {
                console.error(`   ❌ ${verification.name}: ${error.message}`);
                throw error;
            }
        }
    }

    /**
     * Generate UUID
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Get setup summary
     */
    async getSetupSummary() {
        console.log('\n📊 Setup Summary:');
        console.log('=' .repeat(50));
        
        try {
            // Database info
            const dbResult = await this.client.query({
                query: `SELECT engine, total_rows, total_bytes FROM system.databases WHERE name = '${this.config.database}'`
            });
            
            // Tables info
            const tablesResult = await this.client.query({
                query: `
                    SELECT 
                        table,
                        sum(rows) as rows,
                        sum(bytes_on_disk) / 1024 / 1024 as size_mb
                    FROM system.parts 
                    WHERE database = '${this.config.database}' AND active = 1
                    GROUP BY table
                    ORDER BY size_mb DESC
                `
            });
            
            const tablesData = await tablesResult.json();
            
            console.log(`📊 Database: ${this.config.database}`);
            console.log(`📋 Tables: ${tablesData.data.length}`);
            
            tablesData.data.forEach(table => {
                console.log(`   ${table.table}: ${table.rows.toLocaleString()} rows (${table.size_mb.toFixed(2)} MB)`);
            });
            
            // Recent activity
            const activityResult = await this.client.query({
                query: `
                    SELECT 
                        count() as total_events,
                        uniq(user_id) as unique_users,
                        uniq(session_id) as unique_sessions
                    FROM ${this.config.database}.events 
                    WHERE timestamp >= today() - INTERVAL 7 DAY
                `
            });
            
            const activityData = await activityResult.json();
            const activity = activityData.data[0];
            
            console.log('\n📈 Recent Activity (Last 7 days):');
            console.log(`   Events: ${activity.total_events.toLocaleString()}`);
            console.log(`   Users: ${activity.unique_users.toLocaleString()}`);
            console.log(`   Sessions: ${activity.unique_sessions.toLocaleString()}`);
            
        } catch (error) {
            console.warn('⚠️  Could not generate setup summary:', error.message);
        }
    }

    /**
     * Close connection
     */
    async close() {
        await this.client.close();
    }
}

// CLI Interface
async function main() {
    const setup = new ClickHouseSetup();
    
    try {
        await setup.initialize();
        await setup.getSetupSummary();
        
        console.log('\n🎉 ClickHouse Analytics Infrastructure is ready!');
        console.log('\nNext steps:');
        console.log('1. Start the analytics ingestion service: node scripts/analytics-ingestion-service.js');
        console.log('2. Run monitoring: node scripts/clickhouse-monitoring.js');
        console.log('3. Generate test data: node scripts/analytics-ingestion-service.js test 10');
        
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        process.exit(1);
    } finally {
        await setup.close();
    }
}

// Export for use as module
module.exports = ClickHouseSetup;

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}