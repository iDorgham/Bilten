#!/usr/bin/env node

/**
 * Data Lineage Tracker
 * Track data flow and transformations across the data pipeline
 */

const { createClient } = require('@clickhouse/client');
const fs = require('fs').promises;
const path = require('path');

class DataLineageTracker {
    constructor(config = {}) {
        this.config = {
            clickhouse: {
                host: process.env.CLICKHOUSE_HOST || 'localhost',
                port: process.env.CLICKHOUSE_PORT || 8123,
                username: process.env.CLICKHOUSE_USER || 'bilten_user',
                password: process.env.CLICKHOUSE_PASSWORD || 'bilten_password',
                warehouse_db: 'bilten_warehouse'
            },
            ...config
        };

        this.client = createClient({
            host: `http://${this.config.clickhouse.host}:${this.config.clickhouse.port}`,
            username: this.config.clickhouse.username,
            password: this.config.clickhouse.password,
            database: this.config.clickhouse.warehouse_db
        });

        this.lineageGraph = {
            nodes: new Map(),
            edges: new Map()
        };
    }

    /**
     * Initialize lineage tracker
     */
    async initialize() {
        console.log('🔍 Initializing Data Lineage Tracker...');
        
        try {
            await this.createLineageTables();
            await this.loadExistingLineage();
            
            console.log('✅ Data Lineage Tracker initialized');
        } catch (error) {
            console.error('❌ Failed to initialize lineage tracker:', error.message);
            throw error;
        }
    }

    /**
     * Create lineage tracking tables
     */
    async createLineageTables() {
        const schema = `
            CREATE TABLE IF NOT EXISTS ${this.config.clickhouse.warehouse_db}.data_lineage_nodes (
                node_id String,
                node_type String, -- 'table', 'view', 'transformation', 'source_system'
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

            CREATE TABLE IF NOT EXISTS ${this.config.clickhouse.warehouse_db}.data_lineage_edges (
                edge_id String,
                source_node_id String,
                target_node_id String,
                transformation_type String, -- 'direct_copy', 'aggregation', 'join', 'filter', 'calculation'
                transformation_logic String,
                column_mappings Array(Tuple(String, String)), -- (source_column, target_column)
                business_rules String,
                data_quality_rules String,
                created_at DateTime DEFAULT now(),
                updated_at DateTime DEFAULT now()
            ) ENGINE = ReplacingMergeTree(updated_at)
            ORDER BY edge_id;

            CREATE TABLE IF NOT EXISTS ${this.config.clickhouse.warehouse_db}.data_lineage_runs (
                run_id String,
                source_node_id String,
                target_node_id String,
                run_timestamp DateTime,
                records_processed UInt64,
                records_loaded UInt64,
                execution_time_ms UInt64,
                status String, -- 'success', 'failed', 'partial'
                error_message Nullable(String)
            ) ENGINE = MergeTree()
            ORDER BY (run_timestamp, source_node_id, target_node_id);

            CREATE TABLE IF NOT EXISTS ${this.config.clickhouse.warehouse_db}.data_impact_analysis (
                analysis_id String DEFAULT generateUUIDv4(),
                source_node_id String,
                impacted_nodes Array(String),
                impact_type String, -- 'schema_change', 'data_quality', 'business_rule'
                impact_description String,
                severity String, -- 'low', 'medium', 'high', 'critical'
                created_at DateTime DEFAULT now()
            ) ENGINE = MergeTree()
            ORDER BY created_at;
        `;

        await this.client.exec({ query: schema });
    }

    /**
     * Load existing lineage from database
     */
    async loadExistingLineage() {
        // Load nodes
        const nodesResult = await this.client.query({
            query: `SELECT * FROM ${this.config.clickhouse.warehouse_db}.data_lineage_nodes`
        });
        const nodesData = await nodesResult.json();
        
        nodesData.data.forEach(node => {
            this.lineageGraph.nodes.set(node.node_id, node);
        });

        // Load edges
        const edgesResult = await this.client.query({
            query: `SELECT * FROM ${this.config.clickhouse.warehouse_db}.data_lineage_edges`
        });
        const edgesData = await edgesResult.json();
        
        edgesData.data.forEach(edge => {
            this.lineageGraph.edges.set(edge.edge_id, edge);
        });

        console.log(`📊 Loaded ${nodesData.data.length} nodes and ${edgesData.data.length} edges`);
    }

    /**
     * Register a data source or target
     */
    async registerNode(nodeConfig) {
        const node = {
            node_id: nodeConfig.id,
            node_type: nodeConfig.type,
            node_name: nodeConfig.name,
            database_name: nodeConfig.database || '',
            schema_name: nodeConfig.schema || '',
            description: nodeConfig.description || '',
            owner: nodeConfig.owner || '',
            tags: nodeConfig.tags || [],
            metadata: nodeConfig.metadata || {}
        };

        this.lineageGraph.nodes.set(node.node_id, node);

        await this.client.insert({
            table: `${this.config.clickhouse.warehouse_db}.data_lineage_nodes`,
            values: [node]
        });

        console.log(`📝 Registered node: ${node.node_name} (${node.node_type})`);
        return node.node_id;
    }

    /**
     * Register a data transformation
     */
    async registerTransformation(transformationConfig) {
        const edge = {
            edge_id: transformationConfig.id || this.generateUUID(),
            source_node_id: transformationConfig.sourceId,
            target_node_id: transformationConfig.targetId,
            transformation_type: transformationConfig.type,
            transformation_logic: transformationConfig.logic || '',
            column_mappings: transformationConfig.columnMappings || [],
            business_rules: transformationConfig.businessRules || '',
            data_quality_rules: transformationConfig.dataQualityRules || ''
        };

        this.lineageGraph.edges.set(edge.edge_id, edge);

        await this.client.insert({
            table: `${this.config.clickhouse.warehouse_db}.data_lineage_edges`,
            values: [edge]
        });

        console.log(`🔄 Registered transformation: ${edge.source_node_id} → ${edge.target_node_id}`);
        return edge.edge_id;
    }

    /**
     * Track a data pipeline run
     */
    async trackRun(runConfig) {
        const run = {
            run_id: runConfig.runId || this.generateUUID(),
            source_node_id: runConfig.sourceId,
            target_node_id: runConfig.targetId,
            run_timestamp: runConfig.timestamp || new Date(),
            records_processed: runConfig.recordsProcessed || 0,
            records_loaded: runConfig.recordsLoaded || 0,
            execution_time_ms: runConfig.executionTimeMs || 0,
            status: runConfig.status || 'success',
            error_message: runConfig.errorMessage || null
        };

        await this.client.insert({
            table: `${this.config.clickhouse.warehouse_db}.data_lineage_runs`,
            values: [run]
        });

        console.log(`📈 Tracked run: ${run.source_node_id} → ${run.target_node_id} (${run.status})`);
    }

    /**
     * Get upstream dependencies for a node
     */
    async getUpstreamDependencies(nodeId, maxDepth = 10) {
        const dependencies = new Set();
        const visited = new Set();
        
        const traverse = (currentNodeId, depth) => {
            if (depth > maxDepth || visited.has(currentNodeId)) {
                return;
            }
            
            visited.add(currentNodeId);
            
            for (const [edgeId, edge] of this.lineageGraph.edges) {
                if (edge.target_node_id === currentNodeId) {
                    dependencies.add(edge.source_node_id);
                    traverse(edge.source_node_id, depth + 1);
                }
            }
        };

        traverse(nodeId, 0);
        
        return Array.from(dependencies).map(id => this.lineageGraph.nodes.get(id)).filter(Boolean);
    }

    /**
     * Get downstream dependencies for a node
     */
    async getDownstreamDependencies(nodeId, maxDepth = 10) {
        const dependencies = new Set();
        const visited = new Set();
        
        const traverse = (currentNodeId, depth) => {
            if (depth > maxDepth || visited.has(currentNodeId)) {
                return;
            }
            
            visited.add(currentNodeId);
            
            for (const [edgeId, edge] of this.lineageGraph.edges) {
                if (edge.source_node_id === currentNodeId) {
                    dependencies.add(edge.target_node_id);
                    traverse(edge.target_node_id, depth + 1);
                }
            }
        };

        traverse(nodeId, 0);
        
        return Array.from(dependencies).map(id => this.lineageGraph.nodes.get(id)).filter(Boolean);
    }

    /**
     * Analyze impact of changes to a node
     */
    async analyzeImpact(nodeId, changeType, changeDescription) {
        const downstreamNodes = await this.getDownstreamDependencies(nodeId);
        const impactedNodeIds = downstreamNodes.map(node => node.node_id);
        
        // Determine severity based on number of impacted nodes and change type
        let severity = 'low';
        if (impactedNodeIds.length > 10) severity = 'high';
        else if (impactedNodeIds.length > 5) severity = 'medium';
        
        if (changeType === 'schema_change') {
            severity = impactedNodeIds.length > 0 ? 'high' : 'medium';
        }

        const impact = {
            source_node_id: nodeId,
            impacted_nodes: impactedNodeIds,
            impact_type: changeType,
            impact_description: changeDescription,
            severity: severity
        };

        await this.client.insert({
            table: `${this.config.clickhouse.warehouse_db}.data_impact_analysis`,
            values: [impact]
        });

        console.log(`⚠️  Impact Analysis: ${impactedNodeIds.length} nodes affected (${severity} severity)`);
        
        return {
            ...impact,
            impacted_nodes_details: downstreamNodes
        };
    }

    /**
     * Generate lineage visualization data
     */
    async generateVisualizationData() {
        const nodes = Array.from(this.lineageGraph.nodes.values()).map(node => ({
            id: node.node_id,
            label: node.node_name,
            type: node.node_type,
            database: node.database_name,
            schema: node.schema_name,
            description: node.description,
            owner: node.owner,
            tags: node.tags
        }));

        const edges = Array.from(this.lineageGraph.edges.values()).map(edge => ({
            id: edge.edge_id,
            source: edge.source_node_id,
            target: edge.target_node_id,
            type: edge.transformation_type,
            logic: edge.transformation_logic,
            columnMappings: edge.column_mappings
        }));

        return {
            nodes,
            edges,
            metadata: {
                totalNodes: nodes.length,
                totalEdges: edges.length,
                nodeTypes: [...new Set(nodes.map(n => n.type))],
                transformationTypes: [...new Set(edges.map(e => e.type))]
            }
        };
    }

    /**
     * Export lineage to various formats
     */
    async exportLineage(format = 'json', outputPath = null) {
        const data = await this.generateVisualizationData();
        
        switch (format.toLowerCase()) {
            case 'json':
                const jsonOutput = JSON.stringify(data, null, 2);
                if (outputPath) {
                    await fs.writeFile(outputPath, jsonOutput);
                    console.log(`📄 Lineage exported to ${outputPath}`);
                }
                return jsonOutput;
                
            case 'mermaid':
                const mermaidOutput = this.generateMermaidDiagram(data);
                if (outputPath) {
                    await fs.writeFile(outputPath, mermaidOutput);
                    console.log(`📊 Mermaid diagram exported to ${outputPath}`);
                }
                return mermaidOutput;
                
            case 'dot':
                const dotOutput = this.generateDotGraph(data);
                if (outputPath) {
                    await fs.writeFile(outputPath, dotOutput);
                    console.log(`🔗 DOT graph exported to ${outputPath}`);
                }
                return dotOutput;
                
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    /**
     * Generate Mermaid diagram
     */
    generateMermaidDiagram(data) {
        let mermaid = 'graph TD\n';
        
        // Add nodes
        data.nodes.forEach(node => {
            const shape = this.getMermaidShape(node.type);
            mermaid += `    ${node.id}${shape[0]}"${node.label}"${shape[1]}\n`;
        });
        
        mermaid += '\n';
        
        // Add edges
        data.edges.forEach(edge => {
            mermaid += `    ${edge.source} -->|${edge.type}| ${edge.target}\n`;
        });
        
        // Add styling
        mermaid += '\n';
        mermaid += '    classDef table fill:#e1f5fe\n';
        mermaid += '    classDef view fill:#f3e5f5\n';
        mermaid += '    classDef source fill:#e8f5e8\n';
        
        return mermaid;
    }

    /**
     * Generate DOT graph
     */
    generateDotGraph(data) {
        let dot = 'digraph DataLineage {\n';
        dot += '    rankdir=LR;\n';
        dot += '    node [shape=box, style=rounded];\n\n';
        
        // Add nodes
        data.nodes.forEach(node => {
            const color = this.getDotColor(node.type);
            dot += `    "${node.id}" [label="${node.label}\\n(${node.type})", fillcolor="${color}", style=filled];\n`;
        });
        
        dot += '\n';
        
        // Add edges
        data.edges.forEach(edge => {
            dot += `    "${edge.source}" -> "${edge.target}" [label="${edge.type}"];\n`;
        });
        
        dot += '}\n';
        
        return dot;
    }

    /**
     * Get performance metrics for lineage
     */
    async getPerformanceMetrics(nodeId = null, days = 7) {
        const whereClause = nodeId ? `WHERE source_node_id = '${nodeId}' OR target_node_id = '${nodeId}'` : '';
        
        const query = `
            SELECT 
                source_node_id,
                target_node_id,
                count() as total_runs,
                countIf(status = 'success') as successful_runs,
                countIf(status = 'failed') as failed_runs,
                avg(records_processed) as avg_records_processed,
                avg(execution_time_ms) as avg_execution_time_ms,
                max(execution_time_ms) as max_execution_time_ms,
                min(run_timestamp) as first_run,
                max(run_timestamp) as last_run
            FROM ${this.config.clickhouse.warehouse_db}.data_lineage_runs
            ${whereClause}
            ${whereClause ? 'AND' : 'WHERE'} run_timestamp >= now() - INTERVAL ${days} DAY
            GROUP BY source_node_id, target_node_id
            ORDER BY total_runs DESC
        `;

        const result = await this.client.query({ query });
        return await result.json();
    }

    /**
     * Helper methods
     */
    getMermaidShape(nodeType) {
        switch (nodeType) {
            case 'table': return ['[', ']'];
            case 'view': return ['((', '))'];
            case 'source_system': return ['(', ')'];
            case 'transformation': return ['{', '}'];
            default: return ['[', ']'];
        }
    }

    getDotColor(nodeType) {
        switch (nodeType) {
            case 'table': return 'lightblue';
            case 'view': return 'lightgreen';
            case 'source_system': return 'lightyellow';
            case 'transformation': return 'lightcoral';
            default: return 'lightgray';
        }
    }

    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Setup default lineage for Bilten platform
     */
    async setupBiltenLineage() {
        console.log('🏗️  Setting up Bilten platform lineage...');
        
        // Register source systems
        await this.registerNode({
            id: 'postgres_bilten_primary',
            type: 'source_system',
            name: 'PostgreSQL Primary Database',
            database: 'bilten_primary',
            description: 'Main transactional database for Bilten platform',
            owner: 'platform_team',
            tags: ['production', 'transactional']
        });

        await this.registerNode({
            id: 'clickhouse_analytics',
            type: 'source_system',
            name: 'ClickHouse Analytics Database',
            database: 'bilten_analytics',
            description: 'Real-time analytics and event tracking',
            owner: 'analytics_team',
            tags: ['analytics', 'real-time']
        });

        // Register dimension tables
        const dimensionTables = [
            'dim_date', 'dim_time', 'dim_user', 'dim_organizer', 
            'dim_event', 'dim_ticket_type', 'dim_geography', 'dim_device'
        ];

        for (const table of dimensionTables) {
            await this.registerNode({
                id: `warehouse_${table}`,
                type: 'table',
                name: table,
                database: 'bilten_warehouse',
                schema: 'dimensions',
                description: `Dimension table: ${table}`,
                owner: 'data_team',
                tags: ['warehouse', 'dimension']
            });
        }

        // Register fact tables
        const factTables = [
            'fact_event_interactions', 'fact_ticket_sales', 
            'fact_event_performance', 'fact_user_engagement', 
            'fact_organizer_performance'
        ];

        for (const table of factTables) {
            await this.registerNode({
                id: `warehouse_${table}`,
                type: 'table',
                name: table,
                database: 'bilten_warehouse',
                schema: 'facts',
                description: `Fact table: ${table}`,
                owner: 'data_team',
                tags: ['warehouse', 'fact']
            });
        }

        // Register transformations
        await this.registerTransformation({
            sourceId: 'postgres_bilten_primary',
            targetId: 'warehouse_dim_user',
            type: 'direct_copy',
            logic: 'Extract user data from PostgreSQL users table with SCD Type 2',
            columnMappings: [
                ['id', 'user_id'],
                ['email', 'email'],
                ['first_name', 'first_name'],
                ['last_name', 'last_name']
            ],
            businessRules: 'Apply SCD Type 2 for tracking user changes over time',
            dataQualityRules: 'Validate email format, check for duplicates'
        });

        await this.registerTransformation({
            sourceId: 'clickhouse_analytics',
            targetId: 'warehouse_fact_event_interactions',
            type: 'aggregation',
            logic: 'Transform raw events into fact table with dimension keys',
            columnMappings: [
                ['event_id', 'interaction_id'],
                ['timestamp', 'date_key'],
                ['user_id', 'user_key']
            ],
            businessRules: 'Convert timestamps to date/time keys, lookup dimension keys',
            dataQualityRules: 'Validate required fields, check referential integrity'
        });

        console.log('✅ Bilten platform lineage setup completed');
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
    const tracker = new DataLineageTracker();
    
    try {
        await tracker.initialize();
        
        const command = process.argv[2] || 'setup';
        
        switch (command) {
            case 'setup':
                await tracker.setupBiltenLineage();
                break;
                
            case 'export':
                const format = process.argv[3] || 'json';
                const outputPath = process.argv[4] || `lineage.${format}`;
                await tracker.exportLineage(format, outputPath);
                break;
                
            case 'analyze':
                const nodeId = process.argv[3];
                if (!nodeId) {
                    console.error('Please provide a node ID for impact analysis');
                    process.exit(1);
                }
                const impact = await tracker.analyzeImpact(nodeId, 'schema_change', 'Test impact analysis');
                console.log('Impact Analysis:', impact);
                break;
                
            case 'metrics':
                const metrics = await tracker.getPerformanceMetrics();
                console.log('Performance Metrics:', metrics);
                break;
                
            case 'visualize':
                const vizData = await tracker.generateVisualizationData();
                console.log(JSON.stringify(vizData, null, 2));
                break;
                
            default:
                console.log('Usage: node data-lineage-tracker.js [setup|export|analyze|metrics|visualize]');
                break;
        }
        
    } catch (error) {
        console.error('❌ Data lineage tracker failed:', error.message);
        process.exit(1);
    } finally {
        await tracker.close();
    }
}

// Export for use as module
module.exports = DataLineageTracker;

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}