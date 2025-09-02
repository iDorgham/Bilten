#!/usr/bin/env node

/**
 * ETL Pipeline for Data Warehouse
 * Extract, Transform, Load processes for business intelligence
 */

const { createClient } = require('@clickhouse/client');
const { Client } = require('pg');
const { EventEmitter } = require('events');

class ETLPipeline extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            clickhouse: {
                host: process.env.CLICKHOUSE_HOST || 'localhost',
                port: process.env.CLICKHOUSE_PORT || 8123,
                username: process.env.CLICKHOUSE_USER || 'bilten_user',
                password: process.env.CLICKHOUSE_PASSWORD || 'bilten_password',
                analytics_db: 'bilten_analytics',
                warehouse_db: 'bilten_warehouse'
            },
            postgresql: {
                host: process.env.POSTGRES_HOST || 'localhost',
                port: process.env.POSTGRES_PORT || 5432,
                username: process.env.POSTGRES_USER || 'bilten_user',
                password: process.env.POSTGRES_PASSWORD || 'bilten_password',
                database: process.env.POSTGRES_DATABASE || 'bilten_primary'
            },
            etl: {
                batchSize: 10000,
                maxRetries: 3,
                retryDelay: 5000,
                incrementalField: 'updated_at',
                fullRefreshTables: ['dim_date', 'dim_time', 'dim_geography']
            },
            ...config
        };

        this.clickhouseClient = createClient({
            host: `http://${this.config.clickhouse.host}:${this.config.clickhouse.port}`,
            username: this.config.clickhouse.username,
            password: this.config.clickhouse.password
        });

        this.postgresClient = new Client({
            host: this.config.postgresql.host,
            port: this.config.postgresql.port,
            user: this.config.postgresql.username,
            password: this.config.postgresql.password,
            database: this.config.postgresql.database
        });

        this.etlState = {
            lastRun: null,
            currentRun: null,
            tablesProcessed: [],
            errors: [],
            stats: {
                recordsExtracted: 0,
                recordsTransformed: 0,
                recordsLoaded: 0,
                recordsSkipped: 0,
                errors: 0
            }
        };
    }

    /**
     * Initialize ETL pipeline
     */
    async initialize() {
        console.log('🚀 Initializing ETL Pipeline...');
        
        try {
            await this.connectDatabases();
            await this.createETLTables();
            await this.loadETLState();
            
            console.log('✅ ETL Pipeline initialized successfully');
            this.emit('initialized');
        } catch (error) {
            console.error('❌ ETL Pipeline initialization failed:', error.message);
            throw error;
        }
    }

    /**
     * Connect to databases
     */
    async connectDatabases() {
        // Test ClickHouse connection
        await this.clickhouseClient.query({ query: 'SELECT 1' });
        console.log('📊 ClickHouse connection established');

        // Connect to PostgreSQL
        await this.postgresClient.connect();
        console.log('🐘 PostgreSQL connection established');
    }

    /**
     * Create ETL control tables
     */
    async createETLTables() {
        const etlControlSchema = `
            CREATE TABLE IF NOT EXISTS ${this.config.clickhouse.warehouse_db}.etl_job_log (
                job_id UUID DEFAULT generateUUIDv4(),
                job_name String,
                start_time DateTime,
                end_time Nullable(DateTime),
                status String, -- 'running', 'completed', 'failed'
                records_processed UInt64,
                records_loaded UInt64,
                error_message Nullable(String),
                execution_time_seconds Nullable(UInt32)
            ) ENGINE = MergeTree()
            ORDER BY start_time;

            CREATE TABLE IF NOT EXISTS ${this.config.clickhouse.warehouse_db}.etl_table_state (
                table_name String,
                last_extracted_timestamp DateTime,
                last_extracted_id Nullable(String),
                records_count UInt64,
                last_update DateTime DEFAULT now()
            ) ENGINE = ReplacingMergeTree(last_update)
            ORDER BY table_name;

            CREATE TABLE IF NOT EXISTS ${this.config.clickhouse.warehouse_db}.data_quality_checks (
                check_id UUID DEFAULT generateUUIDv4(),
                table_name String,
                check_type String,
                check_name String,
                check_result String, -- 'PASS', 'FAIL', 'WARNING'
                expected_value Nullable(String),
                actual_value Nullable(String),
                error_count UInt64,
                total_count UInt64,
                check_timestamp DateTime DEFAULT now()
            ) ENGINE = MergeTree()
            ORDER BY check_timestamp;

            CREATE TABLE IF NOT EXISTS ${this.config.clickhouse.warehouse_db}.data_lineage (
                lineage_id UUID DEFAULT generateUUIDv4(),
                source_system String,
                source_table String,
                target_table String,
                transformation_type String,
                transformation_logic String,
                created_at DateTime DEFAULT now()
            ) ENGINE = MergeTree()
            ORDER BY created_at;
        `;

        await this.clickhouseClient.exec({ query: etlControlSchema });
    }

    /**
     * Load ETL state from previous runs
     */
    async loadETLState() {
        try {
            const result = await this.clickhouseClient.query({
                query: `
                    SELECT 
                        table_name,
                        last_extracted_timestamp,
                        last_extracted_id,
                        records_count
                    FROM ${this.config.clickhouse.warehouse_db}.etl_table_state
                `
            });

            const data = await result.json();
            this.etlState.tableStates = {};
            
            data.data.forEach(row => {
                this.etlState.tableStates[row.table_name] = {
                    lastExtracted: new Date(row.last_extracted_timestamp),
                    lastId: row.last_extracted_id,
                    recordsCount: row.records_count
                };
            });

            console.log(`📋 Loaded state for ${data.data.length} tables`);
        } catch (error) {
            console.warn('⚠️  Could not load ETL state:', error.message);
            this.etlState.tableStates = {};
        }
    }

    /**
     * Run full ETL pipeline
     */
    async runPipeline(options = {}) {
        const jobId = this.generateUUID();
        this.etlState.currentRun = {
            jobId,
            startTime: new Date(),
            options
        };

        console.log(`🔄 Starting ETL Pipeline run: ${jobId}`);
        
        try {
            await this.logJobStart(jobId, 'full_pipeline');
            
            // Step 1: Extract and load dimension tables
            await this.processDimensionTables();
            
            // Step 2: Extract and load fact tables
            await this.processFactTables();
            
            // Step 3: Run data quality checks
            await this.runDataQualityChecks();
            
            // Step 4: Update aggregate tables
            await this.updateAggregateTables();
            
            // Step 5: Update ETL state
            await this.updateETLState();
            
            await this.logJobCompletion(jobId, 'completed');
            
            console.log('✅ ETL Pipeline completed successfully');
            this.emit('pipelineCompleted', this.etlState.stats);
            
        } catch (error) {
            await this.logJobCompletion(jobId, 'failed', error.message);
            console.error('❌ ETL Pipeline failed:', error.message);
            this.emit('pipelineError', error);
            throw error;
        }
    }

    /**
     * Process dimension tables
     */
    async processDimensionTables() {
        console.log('\n📊 Processing Dimension Tables...');
        
        const dimensionTables = [
            {
                name: 'dim_date',
                processor: () => this.processDimDate()
            },
            {
                name: 'dim_time',
                processor: () => this.processDimTime()
            },
            {
                name: 'dim_user',
                processor: () => this.processDimUser()
            },
            {
                name: 'dim_organizer',
                processor: () => this.processDimOrganizer()
            },
            {
                name: 'dim_event',
                processor: () => this.processDimEvent()
            },
            {
                name: 'dim_ticket_type',
                processor: () => this.processDimTicketType()
            },
            {
                name: 'dim_geography',
                processor: () => this.processDimGeography()
            },
            {
                name: 'dim_device',
                processor: () => this.processDimDevice()
            }
        ];

        for (const table of dimensionTables) {
            console.log(`  🔧 Processing ${table.name}...`);
            try {
                await table.processor();
                console.log(`  ✅ ${table.name} completed`);
            } catch (error) {
                console.error(`  ❌ ${table.name} failed:`, error.message);
                this.etlState.errors.push({ table: table.name, error: error.message });
            }
        }
    }

    /**
     * Process fact tables
     */
    async processFactTables() {
        console.log('\n📈 Processing Fact Tables...');
        
        const factTables = [
            {
                name: 'fact_event_interactions',
                processor: () => this.processFactEventInteractions()
            },
            {
                name: 'fact_ticket_sales',
                processor: () => this.processFactTicketSales()
            },
            {
                name: 'fact_event_performance',
                processor: () => this.processFactEventPerformance()
            },
            {
                name: 'fact_user_engagement',
                processor: () => this.processFactUserEngagement()
            },
            {
                name: 'fact_organizer_performance',
                processor: () => this.processFactOrganizerPerformance()
            }
        ];

        for (const table of factTables) {
            console.log(`  🔧 Processing ${table.name}...`);
            try {
                await table.processor();
                console.log(`  ✅ ${table.name} completed`);
            } catch (error) {
                console.error(`  ❌ ${table.name} failed:`, error.message);
                this.etlState.errors.push({ table: table.name, error: error.message });
            }
        }
    }

    /**
     * Process date dimension
     */
    async processDimDate() {
        // Generate date dimension for next 5 years
        const startDate = new Date('2020-01-01');
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 5);
        
        const dates = [];
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
                is_holiday: 0, // Would need holiday calendar integration
                fiscal_year: currentDate.getMonth() >= 9 ? currentDate.getFullYear() + 1 : currentDate.getFullYear(),
                fiscal_quarter: Math.floor(((currentDate.getMonth() + 3) % 12) / 3) + 1
            });
            
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Clear existing data and insert new
        await this.clickhouseClient.exec({
            query: `TRUNCATE TABLE ${this.config.clickhouse.warehouse_db}.dim_date`
        });

        await this.clickhouseClient.insert({
            table: `${this.config.clickhouse.warehouse_db}.dim_date`,
            values: dates
        });

        this.etlState.stats.recordsLoaded += dates.length;
    }

    /**
     * Process time dimension
     */
    async processDimTime() {
        const times = [];
        
        for (let hour = 0; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute += 15) { // 15-minute intervals
                const timeKey = hour * 100 + minute;
                const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                
                times.push({
                    time_key: timeKey,
                    hour: hour,
                    minute: minute,
                    second: 0,
                    time_of_day: this.getTimeOfDay(hour),
                    hour_name: `${hour}:00`,
                    is_business_hour: (hour >= 9 && hour < 17) ? 1 : 0
                });
            }
        }

        await this.clickhouseClient.exec({
            query: `TRUNCATE TABLE ${this.config.clickhouse.warehouse_db}.dim_time`
        });

        await this.clickhouseClient.insert({
            table: `${this.config.clickhouse.warehouse_db}.dim_time`,
            values: times
        });

        this.etlState.stats.recordsLoaded += times.length;
    }

    /**
     * Process user dimension with SCD Type 2
     */
    async processDimUser() {
        const lastExtracted = this.getLastExtracted('dim_user');
        
        const query = `
            SELECT 
                id as user_id,
                email,
                first_name,
                last_name,
                created_at as registration_date,
                role as user_type,
                status,
                profile_data->>'country' as country,
                profile_data->>'city' as city,
                CASE 
                    WHEN EXTRACT(YEAR FROM AGE(COALESCE((profile_data->>'date_of_birth')::date, CURRENT_DATE))) BETWEEN 18 AND 24 THEN '18-24'
                    WHEN EXTRACT(YEAR FROM AGE(COALESCE((profile_data->>'date_of_birth')::date, CURRENT_DATE))) BETWEEN 25 AND 34 THEN '25-34'
                    WHEN EXTRACT(YEAR FROM AGE(COALESCE((profile_data->>'date_of_birth')::date, CURRENT_DATE))) BETWEEN 35 AND 44 THEN '35-44'
                    WHEN EXTRACT(YEAR FROM AGE(COALESCE((profile_data->>'date_of_birth')::date, CURRENT_DATE))) BETWEEN 45 AND 54 THEN '45-54'
                    WHEN EXTRACT(YEAR FROM AGE(COALESCE((profile_data->>'date_of_birth')::date, CURRENT_DATE))) >= 55 THEN '55+'
                    ELSE 'Unknown'
                END as age_group,
                profile_data->>'gender' as gender,
                CASE WHEN status = 'active' THEN 1 ELSE 0 END as is_active,
                updated_at
            FROM users.users
            WHERE updated_at > $1
            ORDER BY updated_at
        `;

        const result = await this.postgresClient.query(query, [lastExtracted]);
        
        if (result.rows.length > 0) {
            // Process in batches
            const batches = this.chunkArray(result.rows, this.config.etl.batchSize);
            
            for (const batch of batches) {
                const transformedUsers = batch.map(user => ({
                    user_key: this.generateUserKey(user.user_id),
                    user_id: user.user_id,
                    email: user.email || '',
                    first_name: user.first_name || '',
                    last_name: user.last_name || '',
                    registration_date: user.registration_date,
                    user_type: user.user_type || 'user',
                    status: user.status || 'active',
                    country: user.country || '',
                    city: user.city || '',
                    age_group: user.age_group || 'Unknown',
                    gender: user.gender || 'Unknown',
                    is_active: user.is_active,
                    lifetime_value: 0, // Will be calculated later
                    total_events_attended: 0, // Will be calculated later
                    total_tickets_purchased: 0, // Will be calculated later
                    scd_start_date: new Date(),
                    scd_end_date: null,
                    scd_version: 1,
                    is_current: 1
                }));

                await this.clickhouseClient.insert({
                    table: `${this.config.clickhouse.warehouse_db}.dim_user`,
                    values: transformedUsers
                });

                this.etlState.stats.recordsLoaded += transformedUsers.length;
            }
        }
    }

    /**
     * Process event interactions fact table
     */
    async processFactEventInteractions() {
        const lastExtracted = this.getLastExtracted('fact_event_interactions');
        
        const query = `
            SELECT 
                event_id,
                session_id,
                user_id,
                organizer_id,
                event_type as interaction_type,
                event_name,
                timestamp,
                properties,
                user_agent,
                ip_address,
                referrer,
                page_url
            FROM ${this.config.clickhouse.analytics_db}.events
            WHERE timestamp > '${lastExtracted.toISOString()}'
            ORDER BY timestamp
        `;

        const result = await this.clickhouseClient.query({ query });
        const data = await result.json();
        
        if (data.data.length > 0) {
            const transformedInteractions = data.data.map(interaction => ({
                interaction_id: interaction.event_id,
                date_key: this.getDateKey(new Date(interaction.timestamp)),
                time_key: this.getTimeKey(new Date(interaction.timestamp)),
                user_key: interaction.user_id ? this.generateUserKey(interaction.user_id) : null,
                organizer_key: interaction.organizer_id ? this.generateOrganizerKey(interaction.organizer_id) : null,
                event_key: null, // Would need to lookup from dim_event
                device_key: this.generateDeviceKey(interaction.user_agent),
                geography_key: this.generateGeographyKey(interaction.ip_address),
                interaction_type: interaction.interaction_type,
                session_id: interaction.session_id,
                page_url: interaction.page_url || '',
                referrer_type: this.classifyReferrer(interaction.referrer),
                utm_source: this.extractUTMParam(interaction.page_url, 'utm_source'),
                utm_medium: this.extractUTMParam(interaction.page_url, 'utm_medium'),
                utm_campaign: this.extractUTMParam(interaction.page_url, 'utm_campaign'),
                duration_seconds: interaction.properties?.duration ? parseInt(interaction.properties.duration) : null,
                bounce: 0, // Would need session analysis
                conversion: interaction.interaction_type === 'ticket_purchase' ? 1 : 0,
                revenue: interaction.properties?.revenue ? parseFloat(interaction.properties.revenue) : 0
            }));

            await this.clickhouseClient.insert({
                table: `${this.config.clickhouse.warehouse_db}.fact_event_interactions`,
                values: transformedInteractions
            });

            this.etlState.stats.recordsLoaded += transformedInteractions.length;
        }
    }

    /**
     * Run data quality checks
     */
    async runDataQualityChecks() {
        console.log('\n🔍 Running Data Quality Checks...');
        
        const qualityChecks = [
            {
                name: 'Null Check - User Keys',
                table: 'fact_event_interactions',
                check: 'null_check',
                query: `
                    SELECT 
                        countIf(user_key IS NULL AND interaction_type != 'anonymous_view') as null_count,
                        count() as total_count
                    FROM ${this.config.clickhouse.warehouse_db}.fact_event_interactions
                    WHERE date_key >= ${this.getDateKey(new Date(Date.now() - 24 * 60 * 60 * 1000))}
                `
            },
            {
                name: 'Duplicate Check - Interactions',
                table: 'fact_event_interactions',
                check: 'duplicate_check',
                query: `
                    SELECT 
                        count() - uniq(interaction_id) as duplicate_count,
                        count() as total_count
                    FROM ${this.config.clickhouse.warehouse_db}.fact_event_interactions
                    WHERE date_key >= ${this.getDateKey(new Date(Date.now() - 24 * 60 * 60 * 1000))}
                `
            },
            {
                name: 'Range Check - Revenue',
                table: 'fact_ticket_sales',
                check: 'range_check',
                query: `
                    SELECT 
                        countIf(total_price < 0 OR total_price > 10000) as out_of_range_count,
                        count() as total_count
                    FROM ${this.config.clickhouse.warehouse_db}.fact_ticket_sales
                    WHERE date_key >= ${this.getDateKey(new Date(Date.now() - 24 * 60 * 60 * 1000))}
                `
            }
        ];

        for (const check of qualityChecks) {
            try {
                const result = await this.clickhouseClient.query({ query: check.query });
                const data = await result.json();
                const row = data.data[0];
                
                const errorCount = row.null_count || row.duplicate_count || row.out_of_range_count || 0;
                const totalCount = row.total_count || 0;
                const checkResult = errorCount === 0 ? 'PASS' : (errorCount / totalCount > 0.05 ? 'FAIL' : 'WARNING');
                
                await this.logDataQualityCheck(check.table, check.check, check.name, checkResult, errorCount, totalCount);
                
                console.log(`  ${checkResult === 'PASS' ? '✅' : checkResult === 'WARNING' ? '⚠️' : '❌'} ${check.name}: ${errorCount}/${totalCount} errors`);
                
            } catch (error) {
                console.error(`  ❌ ${check.name} failed:`, error.message);
                await this.logDataQualityCheck(check.table, check.check, check.name, 'FAIL', 0, 0, error.message);
            }
        }
    }

    /**
     * Update aggregate tables
     */
    async updateAggregateTables() {
        console.log('\n📊 Updating Aggregate Tables...');
        
        // Update monthly summary
        await this.clickhouseClient.exec({
            query: `
                INSERT INTO ${this.config.clickhouse.warehouse_db}.agg_monthly_summary
                SELECT 
                    formatDateTime(toDate(date_key), '%Y-%m') as year_month,
                    organizer_key,
                    NULL as event_category,
                    geography_key,
                    countIf(interaction_type = 'event_view') as total_events,
                    countIf(conversion = 1) as total_tickets_sold,
                    sum(revenue) as total_revenue,
                    uniq(user_key) as unique_users,
                    avgIf(revenue, revenue > 0) as avg_ticket_price,
                    avgIf(conversion, interaction_type = 'event_view') as conversion_rate
                FROM ${this.config.clickhouse.warehouse_db}.fact_event_interactions
                WHERE date_key >= ${this.getDateKey(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))}
                GROUP BY year_month, organizer_key, geography_key
            `
        });
    }

    /**
     * Helper methods
     */
    getLastExtracted(tableName) {
        const state = this.etlState.tableStates?.[tableName];
        return state?.lastExtracted || new Date('2020-01-01');
    }

    getDateKey(date) {
        return parseInt(date.toISOString().slice(0, 10).replace(/-/g, ''));
    }

    getTimeKey(date) {
        return date.getHours() * 100 + Math.floor(date.getMinutes() / 15) * 15;
    }

    getWeekOfYear(date) {
        const start = new Date(date.getFullYear(), 0, 1);
        return Math.ceil(((date - start) / 86400000 + start.getDay() + 1) / 7);
    }

    getTimeOfDay(hour) {
        if (hour < 6) return 'Night';
        if (hour < 12) return 'Morning';
        if (hour < 18) return 'Afternoon';
        return 'Evening';
    }

    generateUserKey(userId) {
        // Simple hash function for demo - use proper key generation in production
        return parseInt(userId.replace(/-/g, '').slice(0, 8), 16);
    }

    generateOrganizerKey(organizerId) {
        return parseInt(organizerId.replace(/-/g, '').slice(0, 8), 16);
    }

    generateDeviceKey(userAgent) {
        // Simplified device key generation
        return 1; // Would implement proper device parsing
    }

    generateGeographyKey(ipAddress) {
        // Simplified geography key generation
        return 1; // Would implement IP geolocation
    }

    classifyReferrer(referrer) {
        if (!referrer) return 'direct';
        if (referrer.includes('google')) return 'search';
        if (referrer.includes('facebook') || referrer.includes('twitter')) return 'social';
        return 'referral';
    }

    extractUTMParam(url, param) {
        if (!url) return '';
        const urlParams = new URLSearchParams(url.split('?')[1] || '');
        return urlParams.get(param) || '';
    }

    chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }

    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Logging methods
     */
    async logJobStart(jobId, jobName) {
        await this.clickhouseClient.insert({
            table: `${this.config.clickhouse.warehouse_db}.etl_job_log`,
            values: [{
                job_id: jobId,
                job_name: jobName,
                start_time: new Date(),
                status: 'running',
                records_processed: 0,
                records_loaded: 0
            }]
        });
    }

    async logJobCompletion(jobId, status, errorMessage = null) {
        const endTime = new Date();
        const startTime = this.etlState.currentRun.startTime;
        const executionTime = Math.floor((endTime - startTime) / 1000);

        await this.clickhouseClient.exec({
            query: `
                ALTER TABLE ${this.config.clickhouse.warehouse_db}.etl_job_log 
                UPDATE 
                    end_time = '${endTime.toISOString()}',
                    status = '${status}',
                    records_processed = ${this.etlState.stats.recordsExtracted},
                    records_loaded = ${this.etlState.stats.recordsLoaded},
                    error_message = ${errorMessage ? `'${errorMessage}'` : 'NULL'},
                    execution_time_seconds = ${executionTime}
                WHERE job_id = '${jobId}'
            `
        });
    }

    async logDataQualityCheck(tableName, checkType, checkName, result, errorCount, totalCount, errorMessage = null) {
        await this.clickhouseClient.insert({
            table: `${this.config.clickhouse.warehouse_db}.data_quality_checks`,
            values: [{
                table_name: tableName,
                check_type: checkType,
                check_name: checkName,
                check_result: result,
                expected_value: '0',
                actual_value: errorCount.toString(),
                error_count: errorCount,
                total_count: totalCount
            }]
        });
    }

    async updateETLState() {
        // Update table states with latest extraction timestamps
        for (const tableName of this.etlState.tablesProcessed) {
            await this.clickhouseClient.exec({
                query: `
                    INSERT INTO ${this.config.clickhouse.warehouse_db}.etl_table_state
                    (table_name, last_extracted_timestamp, records_count)
                    VALUES ('${tableName}', '${new Date().toISOString()}', ${this.etlState.stats.recordsLoaded})
                `
            });
        }
    }

    /**
     * Cleanup and close connections
     */
    async close() {
        await this.clickhouseClient.close();
        await this.postgresClient.end();
    }
}

// CLI Interface
async function main() {
    const etl = new ETLPipeline();
    
    try {
        await etl.initialize();
        
        const command = process.argv[2] || 'run';
        
        switch (command) {
            case 'run':
                await etl.runPipeline();
                break;
                
            case 'dimensions':
                await etl.processDimensionTables();
                break;
                
            case 'facts':
                await etl.processFactTables();
                break;
                
            case 'quality':
                await etl.runDataQualityChecks();
                break;
                
            default:
                console.log('Usage: node etl-pipeline.js [run|dimensions|facts|quality]');
                break;
        }
        
    } catch (error) {
        console.error('❌ ETL Pipeline failed:', error.message);
        process.exit(1);
    } finally {
        await etl.close();
    }
}

// Export for use as module
module.exports = ETLPipeline;

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}