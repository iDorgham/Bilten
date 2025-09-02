#!/usr/bin/env node

/**
 * ClickHouse Analytics Database Monitoring and Health Check
 * Comprehensive monitoring for the analytics infrastructure
 */

const { createClient } = require('@clickhouse/client');
const fs = require('fs').promises;
const path = require('path');

class ClickHouseMonitor {
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
            password: this.config.password,
            database: this.config.database
        });

        this.healthChecks = [];
        this.metrics = {};
    }

    /**
     * Initialize monitoring system
     */
    async initialize() {
        console.log('🚀 Initializing ClickHouse Analytics Monitoring...');
        
        try {
            await this.testConnection();
            await this.setupHealthChecks();
            await this.createMonitoringTables();
            console.log('✅ ClickHouse monitoring initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize ClickHouse monitoring:', error.message);
            throw error;
        }
    }

    /**
     * Test database connection
     */
    async testConnection() {
        try {
            const result = await this.client.query({
                query: 'SELECT version() as version, uptime() as uptime'
            });
            
            const data = await result.json();
            console.log('📊 ClickHouse Connection:', {
                version: data.data[0].version,
                uptime: `${Math.floor(data.data[0].uptime / 3600)}h ${Math.floor((data.data[0].uptime % 3600) / 60)}m`
            });
            
            return true;
        } catch (error) {
            console.error('❌ ClickHouse connection failed:', error.message);
            throw error;
        }
    }

    /**
     * Setup health check procedures
     */
    async setupHealthChecks() {
        this.healthChecks = [
            {
                name: 'Database Connectivity',
                check: () => this.checkConnectivity(),
                critical: true
            },
            {
                name: 'Table Integrity',
                check: () => this.checkTableIntegrity(),
                critical: true
            },
            {
                name: 'Data Ingestion Rate',
                check: () => this.checkIngestionRate(),
                critical: false
            },
            {
                name: 'Query Performance',
                check: () => this.checkQueryPerformance(),
                critical: false
            },
            {
                name: 'Storage Usage',
                check: () => this.checkStorageUsage(),
                critical: false
            },
            {
                name: 'Replication Status',
                check: () => this.checkReplicationStatus(),
                critical: true
            },
            {
                name: 'Memory Usage',
                check: () => this.checkMemoryUsage(),
                critical: false
            }
        ];
    }

    /**
     * Create monitoring tables if they don't exist
     */
    async createMonitoringTables() {
        const monitoringSchema = `
            CREATE TABLE IF NOT EXISTS bilten_analytics.monitoring_health_checks (
                timestamp DateTime DEFAULT now(),
                check_name String,
                status String,
                response_time_ms UInt32,
                details String,
                is_critical UInt8
            ) ENGINE = MergeTree()
            ORDER BY timestamp;

            CREATE TABLE IF NOT EXISTS bilten_analytics.monitoring_metrics (
                timestamp DateTime DEFAULT now(),
                metric_name String,
                metric_value Float64,
                metric_unit String,
                tags Map(String, String)
            ) ENGINE = MergeTree()
            ORDER BY (timestamp, metric_name);

            CREATE TABLE IF NOT EXISTS bilten_analytics.monitoring_alerts (
                timestamp DateTime DEFAULT now(),
                alert_id UUID DEFAULT generateUUIDv4(),
                severity String,
                title String,
                description String,
                resolved UInt8 DEFAULT 0,
                resolved_at Nullable(DateTime)
            ) ENGINE = MergeTree()
            ORDER BY timestamp;
        `;

        await this.client.exec({ query: monitoringSchema });
    }

    /**
     * Run all health checks
     */
    async runHealthChecks() {
        console.log('🔍 Running ClickHouse health checks...');
        const results = [];

        for (const healthCheck of this.healthChecks) {
            const startTime = Date.now();
            let status = 'PASS';
            let details = '';

            try {
                const result = await healthCheck.check();
                details = JSON.stringify(result);
            } catch (error) {
                status = 'FAIL';
                details = error.message;
                
                if (healthCheck.critical) {
                    await this.createAlert('CRITICAL', `${healthCheck.name} Failed`, error.message);
                }
            }

            const responseTime = Date.now() - startTime;
            const checkResult = {
                name: healthCheck.name,
                status,
                responseTime,
                details,
                critical: healthCheck.critical
            };

            results.push(checkResult);

            // Log to monitoring table
            await this.logHealthCheck(checkResult);

            console.log(`${status === 'PASS' ? '✅' : '❌'} ${healthCheck.name}: ${status} (${responseTime}ms)`);
        }

        return results;
    }

    /**
     * Check database connectivity
     */
    async checkConnectivity() {
        const result = await this.client.query({
            query: 'SELECT 1 as test'
        });
        return { connected: true };
    }

    /**
     * Check table integrity
     */
    async checkTableIntegrity() {
        const result = await this.client.query({
            query: `
                SELECT 
                    table,
                    sum(rows) as total_rows,
                    sum(bytes_on_disk) as total_bytes,
                    count() as parts_count
                FROM system.parts 
                WHERE database = 'bilten_analytics' AND active = 1
                GROUP BY table
            `
        });

        const data = await result.json();
        return {
            tables: data.data.length,
            totalRows: data.data.reduce((sum, table) => sum + parseInt(table.total_rows), 0),
            totalBytes: data.data.reduce((sum, table) => sum + parseInt(table.total_bytes), 0)
        };
    }

    /**
     * Check data ingestion rate
     */
    async checkIngestionRate() {
        const result = await this.client.query({
            query: `
                SELECT 
                    count() as events_last_hour,
                    uniq(session_id) as unique_sessions,
                    uniq(user_id) as unique_users
                FROM bilten_analytics.events 
                WHERE timestamp >= now() - INTERVAL 1 HOUR
            `
        });

        const data = await result.json();
        const rate = data.data[0];
        
        // Log metrics
        await this.logMetric('ingestion_rate_events_per_hour', rate.events_last_hour, 'events/hour');
        await this.logMetric('unique_sessions_per_hour', rate.unique_sessions, 'sessions/hour');
        await this.logMetric('unique_users_per_hour', rate.unique_users, 'users/hour');

        return rate;
    }

    /**
     * Check query performance
     */
    async checkQueryPerformance() {
        const testQueries = [
            {
                name: 'simple_count',
                query: 'SELECT count() FROM bilten_analytics.events WHERE timestamp >= today()'
            },
            {
                name: 'aggregation',
                query: `
                    SELECT 
                        organizer_id, 
                        count() as events,
                        uniq(user_id) as users
                    FROM bilten_analytics.events 
                    WHERE timestamp >= today() - INTERVAL 7 DAY
                    GROUP BY organizer_id 
                    LIMIT 10
                `
            }
        ];

        const performance = {};
        
        for (const testQuery of testQueries) {
            const startTime = Date.now();
            await this.client.query({ query: testQuery.query });
            const duration = Date.now() - startTime;
            
            performance[testQuery.name] = duration;
            await this.logMetric(`query_performance_${testQuery.name}`, duration, 'ms');
        }

        return performance;
    }

    /**
     * Check storage usage
     */
    async checkStorageUsage() {
        const result = await this.client.query({
            query: `
                SELECT 
                    sum(bytes_on_disk) / 1024 / 1024 / 1024 as total_gb,
                    sum(rows) as total_rows,
                    count() as total_parts
                FROM system.parts 
                WHERE database = 'bilten_analytics' AND active = 1
            `
        });

        const data = await result.json();
        const storage = data.data[0];
        
        await this.logMetric('storage_usage_gb', storage.total_gb, 'GB');
        await this.logMetric('total_rows', storage.total_rows, 'rows');
        await this.logMetric('total_parts', storage.total_parts, 'parts');

        return storage;
    }

    /**
     * Check replication status
     */
    async checkReplicationStatus() {
        try {
            const result = await this.client.query({
                query: `
                    SELECT 
                        table,
                        is_leader,
                        is_readonly,
                        absolute_delay,
                        queue_size
                    FROM system.replicas 
                    WHERE database = 'bilten_analytics'
                `
            });

            const data = await result.json();
            return {
                replicated_tables: data.data.length,
                replication_lag: Math.max(...data.data.map(r => r.absolute_delay || 0)),
                queue_size: data.data.reduce((sum, r) => sum + (r.queue_size || 0), 0)
            };
        } catch (error) {
            // Replication might not be set up in single-node setup
            return { status: 'not_configured' };
        }
    }

    /**
     * Check memory usage
     */
    async checkMemoryUsage() {
        const result = await this.client.query({
            query: `
                SELECT 
                    formatReadableSize(memory_usage) as memory_usage,
                    formatReadableSize(peak_memory_usage) as peak_memory_usage
                FROM system.processes 
                WHERE query != ''
            `
        });

        const data = await result.json();
        return {
            active_queries: data.data.length,
            processes: data.data
        };
    }

    /**
     * Log health check result
     */
    async logHealthCheck(result) {
        await this.client.insert({
            table: 'bilten_analytics.monitoring_health_checks',
            values: [{
                check_name: result.name,
                status: result.status,
                response_time_ms: result.responseTime,
                details: result.details,
                is_critical: result.critical ? 1 : 0
            }]
        });
    }

    /**
     * Log metric
     */
    async logMetric(name, value, unit, tags = {}) {
        await this.client.insert({
            table: 'bilten_analytics.monitoring_metrics',
            values: [{
                metric_name: name,
                metric_value: parseFloat(value) || 0,
                metric_unit: unit,
                tags: tags
            }]
        });
    }

    /**
     * Create alert
     */
    async createAlert(severity, title, description) {
        await this.client.insert({
            table: 'bilten_analytics.monitoring_alerts',
            values: [{
                severity,
                title,
                description
            }]
        });

        console.log(`🚨 ALERT [${severity}]: ${title} - ${description}`);
    }

    /**
     * Get system metrics dashboard
     */
    async getDashboardMetrics() {
        const queries = {
            overview: `
                SELECT 
                    count() as total_events,
                    uniq(user_id) as unique_users,
                    uniq(session_id) as unique_sessions,
                    uniq(organizer_id) as unique_organizers
                FROM bilten_analytics.events 
                WHERE timestamp >= today()
            `,
            
            hourly_trend: `
                SELECT 
                    toStartOfHour(timestamp) as hour,
                    count() as events,
                    uniq(user_id) as users
                FROM bilten_analytics.events 
                WHERE timestamp >= today() - INTERVAL 24 HOUR
                GROUP BY hour 
                ORDER BY hour
            `,
            
            top_events: `
                SELECT 
                    event_type,
                    count() as count
                FROM bilten_analytics.events 
                WHERE timestamp >= today()
                GROUP BY event_type 
                ORDER BY count DESC 
                LIMIT 10
            `,

            storage_by_table: `
                SELECT 
                    table,
                    sum(bytes_on_disk) / 1024 / 1024 as size_mb,
                    sum(rows) as rows
                FROM system.parts 
                WHERE database = 'bilten_analytics' AND active = 1
                GROUP BY table 
                ORDER BY size_mb DESC
            `
        };

        const dashboard = {};
        
        for (const [key, query] of Object.entries(queries)) {
            try {
                const result = await this.client.query({ query });
                dashboard[key] = await result.json();
            } catch (error) {
                dashboard[key] = { error: error.message };
            }
        }

        return dashboard;
    }

    /**
     * Generate monitoring report
     */
    async generateReport() {
        console.log('\n📊 ClickHouse Analytics Monitoring Report');
        console.log('=' .repeat(50));

        const healthResults = await this.runHealthChecks();
        const dashboard = await this.getDashboardMetrics();

        // Health Summary
        const passedChecks = healthResults.filter(r => r.status === 'PASS').length;
        const totalChecks = healthResults.length;
        const criticalFailed = healthResults.filter(r => r.status === 'FAIL' && r.critical).length;

        console.log(`\n🏥 Health Status: ${passedChecks}/${totalChecks} checks passed`);
        if (criticalFailed > 0) {
            console.log(`⚠️  Critical issues: ${criticalFailed}`);
        }

        // System Overview
        if (dashboard.overview && dashboard.overview.data) {
            const overview = dashboard.overview.data[0];
            console.log('\n📈 Today\'s Activity:');
            console.log(`   Events: ${overview.total_events.toLocaleString()}`);
            console.log(`   Users: ${overview.unique_users.toLocaleString()}`);
            console.log(`   Sessions: ${overview.unique_sessions.toLocaleString()}`);
            console.log(`   Organizers: ${overview.unique_organizers.toLocaleString()}`);
        }

        // Storage Overview
        if (dashboard.storage_by_table && dashboard.storage_by_table.data) {
            console.log('\n💾 Storage Usage:');
            dashboard.storage_by_table.data.forEach(table => {
                console.log(`   ${table.table}: ${table.size_mb.toFixed(2)} MB (${table.rows.toLocaleString()} rows)`);
            });
        }

        return {
            health: healthResults,
            dashboard,
            summary: {
                healthy: criticalFailed === 0,
                passedChecks,
                totalChecks,
                criticalFailed
            }
        };
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
    const monitor = new ClickHouseMonitor();
    
    try {
        await monitor.initialize();
        
        const command = process.argv[2] || 'report';
        
        switch (command) {
            case 'health':
                await monitor.runHealthChecks();
                break;
                
            case 'dashboard':
                const dashboard = await monitor.getDashboardMetrics();
                console.log(JSON.stringify(dashboard, null, 2));
                break;
                
            case 'report':
            default:
                await monitor.generateReport();
                break;
        }
        
    } catch (error) {
        console.error('❌ Monitoring failed:', error.message);
        process.exit(1);
    } finally {
        await monitor.close();
    }
}

// Export for use as module
module.exports = ClickHouseMonitor;

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}