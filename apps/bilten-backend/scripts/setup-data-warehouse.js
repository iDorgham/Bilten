#!/usr/bin/env node

/**
 * Data Warehouse Setup Script
 * Complete setup for ClickHouse data warehouse and ETL pipeline
 */

const { createClient } = require('@clickhouse/client');
const fs = require('fs').promises;
const path = require('path');

class DataWarehouseSetup {
    constructor(config = {}) {
        this.config = {
            clickhouse: {
                host: process.env.CLICKHOUSE_HOST || 'localhost',
                port: process.env.CLICKHOUSE_PORT || 8123,
                username: process.env.CLICKHOUSE_USER || 'bilten_user',
                password: process.env.CLICKHOUSE_PASSWORD || 'bilten_password'
            },
            ...config
        };

        this.client = createClient({
            host: `http://${this.config.clickhouse.host}:${this.config.clickhouse.port}`,
            username: this.config.clickhouse.username,
            password: this.config.clickhouse.password
        });

        this.setupSteps = [];
    }

    /**
     * Initialize complete data warehouse setup
     */
    async initialize() {
        console.log('🏗️  Starting Data Warehouse Setup...');
        console.log('=' .repeat(60));
        
        try {
            await this.testConnection();
            await this.runSetupSteps();
            await this.verifySetup();
            await this.generateSetupReport();
            
            console.log('\n🎉 Data Warehouse setup completed successfully!');
            console.log('=' .repeat(60));
            
        } catch (error) {
            console.error('❌ Data Warehouse setup failed:', error.message);
            throw error;
        }
    }

    /**
     * Test ClickHouse connection
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
                action: () => this.createAnalyticsDatabase()
            },
            {
                name: 'Create Data Warehouse Database',
                action: () => this.createWarehouseDatabase()
            },
            {
                name: 'Setup Analytics Tables',
                action: () => this.setupAnalyticsTables()
            },
            {
                name: 'Setup Data Warehouse Schema',
                action: () => this.setupWarehouseSchema()
            },
            {
                name: 'Create ETL Control Tables',
                action: () => this.createETLTables()
            },
            {
                name: 'Setup Data Lineage Tracking',
                action: () => this.setupDataLineage()
            },
            {
                name: 'Create Materialized Views',
                action: () => this.createMaterializedViews()
            },
            {
                name: 'Setup Data Retention Policies',
                action: () => this.setupDataRetention()
            },
            {
                name: 'Initialize Sample Data',
                action: () => this.initializeSampleData()
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
    async createAnalyticsDatabase() {
        await this.client.exec({
            query: `
                CREATE DATABASE IF NOT EXISTS bilten_analytics
                COMMENT 'Real-time analytics and event tracking database';
            `
        });
    }

    /**
     * Create data warehouse database
     */
    async createWarehouseDatabase() {
        await this.client.exec({
            query: `
                CREATE DATABASE IF NOT EXISTS bilten_warehouse
                COMMENT 'Data warehouse for business intelligence and reporting';
            `
        });
    }

    /**
     * Setup analytics tables
     */
    async setupAnalyticsTables() {
        const sqlFiles = [
            '01-create-analytics-tables.sql',
            '02-analytics-cluster-config.sql',
            '03-materialized-views.sql',
            '04-data-ingestion-pipeline.sql',
            '05-data-retention-archival.sql'
        ];

        for (const sqlFile of sqlFiles) {
            const filePath = path.join(__dirname, '../../../infrastructure/database/clickhouse', sqlFile);
            try {
                const sql = await fs.readFile(filePath, 'utf8');
                await this.client.exec({ query: sql });
                console.log(`     📄 Executed ${sqlFile}`);
            } catch (error) {
                if (error.code === 'ENOENT') {
                    console.warn(`     ⚠️  SQL file not found: ${sqlFile}`);
                } else {
                    throw error;
                }
            }
        }
    }

    /**
     * Setup data warehouse schema
     */
    async setupWarehouseSchema() {
        const filePath = path.join(__dirname, '../../../infrastructure/database/clickhouse/06-data-warehouse-schema.sql');
        try {
            const sql = await fs.readFile(filePath, 'utf8');
            await this.client.exec({ query: sql });
            console.log('     📊 Data warehouse star schema created');
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.warn('     ⚠️  Data warehouse schema file not found');
            } else {
                throw error;
            }
        }
    }

    /**
     * Create ETL control tables
     */
    async createETLTables() {
        const etlSchema = `
            CREATE TABLE IF NOT EXISTS bilten_warehouse.etl_job_log (
                job_id UUID DEFAULT generateUUIDv4(),
                job_name String,
                start_time DateTime,
                end_time Nullable(DateTime),
                status String,
                records_processed UInt64,
                records_loaded UInt64,
                error_message Nullable(String),
                execution_time_seconds Nullable(UInt32)
            ) ENGINE = MergeTree()
            ORDER BY start_time;

            CREATE TABLE IF NOT EXISTS bilten_warehouse.etl_table_state (
                table_name String,
                last_extracted_timestamp DateTime,
                last_extracted_id Nullable(String),
                records_count UInt64,
                last_update DateTime DEFAULT now()
            ) ENGINE = ReplacingMergeTree(last_update)
            ORDER BY table_name;

            CREATE TABLE IF NOT EXISTS bilten_warehouse.data_quality_checks (
                check_id UUID DEFAULT generateUUIDv4(),
                table_name String,
                check_type String,
                check_name String,
                check_result String,
                expected_value Nullable(String),
                actual_value Nullable(String),
                error_count UInt64,
                total_count UInt64,
                check_timestamp DateTime DEFAULT now()
            ) ENGINE = MergeTree()
            ORDER BY check_timestamp;
        `;

        await this.client.exec({ query: etlSchema });
        console.log('     🔄 ETL control tables created');
    }

    /**
     * Setup data lineage tracking
     */
    async setupDataLineage() {
        const lineageSchema = `
            CREATE TABLE IF NOT EXISTS bilten_warehouse.data_lineage_nodes (
                node_id String,
                node_type String,
                node_name String,
                database_name String,
                schema_name String,
                description String,
                owner String,
                tags Array(String),
                metadata Map(String, String),
                created_at DateTime DEFAULT now(),
                updated_at DateTime DEFAULT now()
            ) ENGINE = ReplacingMergeTree(updated_at)
            ORDER BY node_id;

            CREATE TABLE IF NOT EXISTS bilten_warehouse.data_lineage_edges (
                edge_id String,
                source_node_id String,
                target_node_id String,
                transformation_type String,
                transformation_logic String,
                column_mappings Array(Tuple(String, String)),
                business_rules String,
                data_quality_rules String,
                created_at DateTime DEFAULT now(),
                updated_at DateTime DEFAULT now()
            ) ENGINE = ReplacingMergeTree(updated_at)
            ORDER BY edge_id;

            CREATE TABLE IF NOT EXISTS bilten_warehouse.data_lineage_runs (
                run_id String,
                source_node_id String,
                target_node_id String,
                run_timestamp DateTime,
                records_processed UInt64,
                records_loaded UInt64,
                execution_time_ms UInt64,
                status String,
                error_message Nullable(String)
            ) ENGINE = MergeTree()
            ORDER BY (run_timestamp, source_node_id, target_node_id);
        `;

        await this.client.exec({ query: lineageSchema });
        console.log('     🔍 Data lineage tracking tables created');
    }

    /**
     * Create materialized views for warehouse
     */
    async createMaterializedViews() {
        const warehouseViews = `
            -- Daily summary materialized view
            CREATE MATERIALIZED VIEW IF NOT EXISTS bilten_warehouse.mv_daily_summary
            ENGINE = SummingMergeTree()
            ORDER BY (date, organizer_key)
            AS SELECT
                toDate(date_key) as date,
                organizer_key,
                count() as total_interactions,
                uniq(user_key) as unique_users,
                sum(revenue) as total_revenue,
                countIf(conversion = 1) as conversions
            FROM bilten_warehouse.fact_event_interactions
            GROUP BY date, organizer_key;

            -- Monthly cohort analysis view
            CREATE MATERIALIZED VIEW IF NOT EXISTS bilten_warehouse.mv_user_cohorts
            ENGINE = ReplacingMergeTree()
            ORDER BY (cohort_month, months_since_registration)
            AS SELECT
                formatDateTime(registration_date, '%Y-%m') as cohort_month,
                dateDiff('month', registration_date, toDate(date_key)) as months_since_registration,
                uniq(user_key) as active_users
            FROM bilten_warehouse.fact_user_engagement e
            JOIN bilten_warehouse.dim_user u ON e.user_key = u.user_key
            WHERE u.is_current = 1
            GROUP BY cohort_month, months_since_registration;
        `;

        await this.client.exec({ query: warehouseViews });
        console.log('     📊 Warehouse materialized views created');
    }

    /**
     * Setup data retention policies
     */
    async setupDataRetention() {
        const retentionPolicies = `
            -- Set TTL for fact tables
            ALTER TABLE bilten_warehouse.fact_event_interactions 
            MODIFY TTL toDate(date_key) + INTERVAL 3 YEAR;

            ALTER TABLE bilten_warehouse.fact_ticket_sales 
            MODIFY TTL toDate(date_key) + INTERVAL 7 YEAR;

            ALTER TABLE bilten_warehouse.fact_event_performance 
            MODIFY TTL toDate(date_key) + INTERVAL 5 YEAR;

            -- Set TTL for ETL logs
            ALTER TABLE bilten_warehouse.etl_job_log 
            MODIFY TTL start_time + INTERVAL 1 YEAR;

            ALTER TABLE bilten_warehouse.data_quality_checks 
            MODIFY TTL check_timestamp + INTERVAL 2 YEAR;
        `;

        await this.client.exec({ query: retentionPolicies });
        console.log('     ⏰ Data retention policies configured');
    }

    /**
     * Initialize sample data
     */
    async initializeSampleData() {
        // Create sample date dimension data
        const dates = [];
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2025-12-31');
        const currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
            const dateKey = parseInt(currentDate.toISOString().slice(0, 10).replace(/-/g, ''));
            
            dates.push({
                date_key: dateKey,
                date: currentDate.toISOString().slice(0, 10),
                year: currentDate.getFullYear(),
                quarter: Math.floor((currentDate.getMonth() + 3) / 3),
                month: currentDate.getMonth() + 1,
                month_name: currentDate.toLocaleString('default', { month: 'long' }),
                day: currentDate.getDate(),
                day_of_week: currentDate.getDay() + 1,
                day_name: currentDate.toLocaleString('default', { weekday: 'long' }),
                week_of_year: this.getWeekOfYear(currentDate),
                is_weekend: [0, 6].includes(currentDate.getDay()) ? 1 : 0,
                is_holiday: 0,
                fiscal_year: currentDate.getMonth() >= 9 ? currentDate.getFullYear() + 1 : currentDate.getFullYear(),
                fiscal_quarter: Math.floor(((currentDate.getMonth() + 3) % 12) / 3) + 1
            });
            
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Insert date dimension data
        if (dates.length > 0) {
            await this.client.insert({
                table: 'bilten_warehouse.dim_date',
                values: dates
            });
            console.log(`     📅 Inserted ${dates.length} date dimension records`);
        }

        // Create sample geography data
        const geographies = [
            { geography_key: 1, country_code: 'US', country_name: 'United States', region: 'North America', city: 'New York', timezone: 'America/New_York', currency: 'USD', population: 8000000, gdp_per_capita: 65000 },
            { geography_key: 2, country_code: 'UK', country_name: 'United Kingdom', region: 'Europe', city: 'London', timezone: 'Europe/London', currency: 'GBP', population: 9000000, gdp_per_capita: 45000 },
            { geography_key: 3, country_code: 'CA', country_name: 'Canada', region: 'North America', city: 'Toronto', timezone: 'America/Toronto', currency: 'CAD', population: 3000000, gdp_per_capita: 50000 },
            { geography_key: 4, country_code: 'AU', country_name: 'Australia', region: 'Oceania', city: 'Sydney', timezone: 'Australia/Sydney', currency: 'AUD', population: 5000000, gdp_per_capita: 55000 },
            { geography_key: 5, country_code: 'DE', country_name: 'Germany', region: 'Europe', city: 'Berlin', timezone: 'Europe/Berlin', currency: 'EUR', population: 3700000, gdp_per_capita: 48000 }
        ];

        await this.client.insert({
            table: 'bilten_warehouse.dim_geography',
            values: geographies
        });
        console.log(`     🌍 Inserted ${geographies.length} geography dimension records`);

        // Create sample device data
        const devices = [
            { device_key: 1, device_type: 'desktop', browser: 'Chrome', browser_version: '120.0', operating_system: 'Windows', os_version: '11', screen_resolution: '1920x1080', is_mobile: 0, is_tablet: 0, is_desktop: 1 },
            { device_key: 2, device_type: 'mobile', browser: 'Safari', browser_version: '17.0', operating_system: 'iOS', os_version: '17.0', screen_resolution: '390x844', is_mobile: 1, is_tablet: 0, is_desktop: 0 },
            { device_key: 3, device_type: 'tablet', browser: 'Chrome', browser_version: '120.0', operating_system: 'Android', os_version: '13', screen_resolution: '1024x768', is_mobile: 0, is_tablet: 1, is_desktop: 0 },
            { device_key: 4, device_type: 'desktop', browser: 'Firefox', browser_version: '121.0', operating_system: 'macOS', os_version: '14.0', screen_resolution: '2560x1440', is_mobile: 0, is_tablet: 0, is_desktop: 1 },
            { device_key: 5, device_type: 'mobile', browser: 'Chrome', browser_version: '120.0', operating_system: 'Android', os_version: '13', screen_resolution: '412x915', is_mobile: 1, is_tablet: 0, is_desktop: 0 }
        ];

        await this.client.insert({
            table: 'bilten_warehouse.dim_device',
            values: devices
        });
        console.log(`     📱 Inserted ${devices.length} device dimension records`);
    }

    /**
     * Verify setup completion
     */
    async verifySetup() {
        console.log('\n🔍 Verifying setup...');
        
        const verifications = [
            {
                name: 'Analytics database exists',
                query: `SELECT count() FROM system.databases WHERE name = 'bilten_analytics'`,
                expected: 1
            },
            {
                name: 'Warehouse database exists',
                query: `SELECT count() FROM system.databases WHERE name = 'bilten_warehouse'`,
                expected: 1
            },
            {
                name: 'Analytics tables exist',
                query: `SELECT count() FROM system.tables WHERE database = 'bilten_analytics' AND name IN ('events', 'page_views', 'ticket_sales')`,
                expected: 3
            },
            {
                name: 'Warehouse dimension tables exist',
                query: `SELECT count() FROM system.tables WHERE database = 'bilten_warehouse' AND name LIKE 'dim_%'`,
                expectedMin: 5
            },
            {
                name: 'Warehouse fact tables exist',
                query: `SELECT count() FROM system.tables WHERE database = 'bilten_warehouse' AND name LIKE 'fact_%'`,
                expectedMin: 3
            },
            {
                name: 'ETL control tables exist',
                query: `SELECT count() FROM system.tables WHERE database = 'bilten_warehouse' AND name IN ('etl_job_log', 'etl_table_state', 'data_quality_checks')`,
                expected: 3
            },
            {
                name: 'Data lineage tables exist',
                query: `SELECT count() FROM system.tables WHERE database = 'bilten_warehouse' AND name LIKE 'data_lineage_%'`,
                expectedMin: 2
            },
            {
                name: 'Sample data exists',
                query: `SELECT count() FROM bilten_warehouse.dim_date`,
                expectedMin: 365
            }
        ];

        let allPassed = true;
        
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
                    allPassed = false;
                }
            } catch (error) {
                console.error(`   ❌ ${verification.name}: ${error.message}`);
                allPassed = false;
            }
        }

        if (!allPassed) {
            throw new Error('Setup verification failed');
        }
    }

    /**
     * Generate setup report
     */
    async generateSetupReport() {
        console.log('\n📊 Data Warehouse Setup Report');
        console.log('=' .repeat(60));
        
        try {
            // Database sizes
            const dbSizes = await this.client.query({
                query: `
                    SELECT 
                        database,
                        count() as table_count,
                        sum(total_rows) as total_rows,
                        sum(total_bytes) / 1024 / 1024 as total_mb
                    FROM system.tables 
                    WHERE database IN ('bilten_analytics', 'bilten_warehouse')
                    GROUP BY database
                    ORDER BY database
                `
            });
            
            const dbData = await dbSizes.json();
            
            console.log('\n📊 Database Summary:');
            dbData.data.forEach(db => {
                console.log(`   ${db.database}:`);
                console.log(`     Tables: ${db.table_count}`);
                console.log(`     Rows: ${db.total_rows.toLocaleString()}`);
                console.log(`     Size: ${db.total_mb.toFixed(2)} MB`);
            });

            // Table details
            const tableDetails = await this.client.query({
                query: `
                    SELECT 
                        database,
                        name as table_name,
                        engine,
                        total_rows,
                        total_bytes / 1024 / 1024 as size_mb
                    FROM system.tables 
                    WHERE database IN ('bilten_analytics', 'bilten_warehouse')
                    AND engine != 'View'
                    ORDER BY database, total_bytes DESC
                `
            });
            
            const tableData = await tableDetails.json();
            
            console.log('\n📋 Table Details:');
            let currentDb = '';
            tableData.data.forEach(table => {
                if (table.database !== currentDb) {
                    currentDb = table.database;
                    console.log(`\n   ${currentDb}:`);
                }
                console.log(`     ${table.table_name} (${table.engine}): ${table.total_rows.toLocaleString()} rows, ${table.size_mb.toFixed(2)} MB`);
            });

            // Next steps
            console.log('\n🚀 Next Steps:');
            console.log('   1. Start analytics ingestion: npm run analytics:start');
            console.log('   2. Run ETL pipeline: npm run etl:run');
            console.log('   3. Setup data lineage: npm run lineage:setup');
            console.log('   4. Monitor health: npm run clickhouse:monitor');
            console.log('   5. Generate test data: npm run analytics:test 10');
            
        } catch (error) {
            console.warn('⚠️  Could not generate complete setup report:', error.message);
        }
    }

    /**
     * Helper methods
     */
    getWeekOfYear(date) {
        const start = new Date(date.getFullYear(), 0, 1);
        return Math.ceil(((date - start) / 86400000 + start.getDay() + 1) / 7);
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
    const setup = new DataWarehouseSetup();
    
    try {
        await setup.initialize();
        
        console.log('\n🎉 Data Warehouse is ready for use!');
        console.log('\nDocumentation: database/clickhouse/README.md');
        console.log('Monitoring: npm run clickhouse:monitor');
        console.log('ETL Pipeline: npm run etl:run');
        
    } catch (error) {
        console.error('❌ Data Warehouse setup failed:', error.message);
        process.exit(1);
    } finally {
        await setup.close();
    }
}

// Export for use as module
module.exports = DataWarehouseSetup;

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}