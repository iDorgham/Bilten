#!/usr/bin/env node

/**
 * ClickHouse Analytics Data Ingestion Service
 * Real-time data pipeline for analytics events
 */

const { createClient } = require('@clickhouse/client');
const { EventEmitter } = require('events');
const { v4: uuidv4 } = require('uuid');

class AnalyticsIngestionService extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            clickhouse: {
                host: process.env.CLICKHOUSE_HOST || 'localhost',
                port: process.env.CLICKHOUSE_PORT || 8123,
                username: process.env.CLICKHOUSE_USER || 'bilten_user',
                password: process.env.CLICKHOUSE_PASSWORD || 'bilten_password',
                database: process.env.CLICKHOUSE_DATABASE || 'bilten_analytics'
            },
            batch: {
                size: 1000,
                flushInterval: 5000, // 5 seconds
                maxRetries: 3
            },
            validation: {
                enabled: true,
                strictMode: false
            },
            ...config
        };

        this.client = createClient({
            host: `http://${this.config.clickhouse.host}:${this.config.clickhouse.port}`,
            username: this.config.clickhouse.username,
            password: this.config.clickhouse.password,
            database: this.config.clickhouse.database
        });

        this.eventBuffer = [];
        this.pageViewBuffer = [];
        this.ticketSalesBuffer = [];
        this.flushTimer = null;
        this.isProcessing = false;
        this.stats = {
            eventsProcessed: 0,
            eventsDropped: 0,
            batchesProcessed: 0,
            errors: 0,
            lastFlush: null
        };
    }

    /**
     * Initialize the ingestion service
     */
    async initialize() {
        console.log('🚀 Initializing Analytics Ingestion Service...');
        
        try {
            await this.testConnection();
            await this.setupTables();
            this.startFlushTimer();
            
            console.log('✅ Analytics Ingestion Service initialized');
            this.emit('initialized');
        } catch (error) {
            console.error('❌ Failed to initialize ingestion service:', error.message);
            throw error;
        }
    }

    /**
     * Test ClickHouse connection
     */
    async testConnection() {
        try {
            await this.client.query({ query: 'SELECT 1' });
            console.log('📊 ClickHouse connection established');
        } catch (error) {
            throw new Error(`ClickHouse connection failed: ${error.message}`);
        }
    }

    /**
     * Ensure required tables exist
     */
    async setupTables() {
        const tables = [
            'bilten_analytics.events',
            'bilten_analytics.page_views',
            'bilten_analytics.ticket_sales'
        ];

        for (const table of tables) {
            try {
                await this.client.query({
                    query: `SELECT count() FROM ${table} LIMIT 1`
                });
            } catch (error) {
                console.warn(`⚠️  Table ${table} not accessible:`, error.message);
            }
        }
    }

    /**
     * Start the flush timer
     */
    startFlushTimer() {
        this.flushTimer = setInterval(() => {
            this.flushBuffers();
        }, this.config.batch.flushInterval);
    }

    /**
     * Stop the flush timer
     */
    stopFlushTimer() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }
    }

    /**
     * Track an analytics event
     */
    async trackEvent(eventData) {
        try {
            const event = this.validateAndNormalizeEvent(eventData);
            this.eventBuffer.push(event);
            
            // Flush if buffer is full
            if (this.eventBuffer.length >= this.config.batch.size) {
                await this.flushBuffers();
            }
            
            this.emit('eventTracked', event);
            return true;
        } catch (error) {
            this.stats.eventsDropped++;
            this.emit('eventDropped', { eventData, error: error.message });
            
            if (this.config.validation.strictMode) {
                throw error;
            }
            
            console.warn('⚠️  Event dropped:', error.message);
            return false;
        }
    }

    /**
     * Track a page view
     */
    async trackPageView(pageViewData) {
        try {
            const pageView = this.validateAndNormalizePageView(pageViewData);
            this.pageViewBuffer.push(pageView);
            
            if (this.pageViewBuffer.length >= this.config.batch.size) {
                await this.flushBuffers();
            }
            
            this.emit('pageViewTracked', pageView);
            return true;
        } catch (error) {
            this.stats.eventsDropped++;
            this.emit('pageViewDropped', { pageViewData, error: error.message });
            
            if (this.config.validation.strictMode) {
                throw error;
            }
            
            return false;
        }
    }

    /**
     * Track a ticket sale
     */
    async trackTicketSale(saleData) {
        try {
            const sale = this.validateAndNormalizeTicketSale(saleData);
            this.ticketSalesBuffer.push(sale);
            
            if (this.ticketSalesBuffer.length >= this.config.batch.size) {
                await this.flushBuffers();
            }
            
            this.emit('ticketSaleTracked', sale);
            return true;
        } catch (error) {
            this.stats.eventsDropped++;
            this.emit('ticketSaleDropped', { saleData, error: error.message });
            
            if (this.config.validation.strictMode) {
                throw error;
            }
            
            return false;
        }
    }

    /**
     * Validate and normalize event data
     */
    validateAndNormalizeEvent(eventData) {
        const required = ['event_type', 'event_name'];
        const missing = required.filter(field => !eventData[field]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required fields: ${missing.join(', ')}`);
        }

        return {
            event_id: eventData.event_id || uuidv4(),
            session_id: eventData.session_id || uuidv4(),
            user_id: eventData.user_id || null,
            organizer_id: eventData.organizer_id || null,
            event_type: eventData.event_type,
            event_name: eventData.event_name,
            timestamp: eventData.timestamp || new Date().toISOString(),
            properties: eventData.properties || {},
            user_agent: eventData.user_agent || '',
            ip_address: eventData.ip_address || '',
            referrer: eventData.referrer || '',
            page_url: eventData.page_url || ''
        };
    }

    /**
     * Validate and normalize page view data
     */
    validateAndNormalizePageView(pageViewData) {
        return {
            timestamp: pageViewData.timestamp || new Date().toISOString(),
            session_id: pageViewData.session_id || uuidv4(),
            user_id: pageViewData.user_id || null,
            organizer_id: pageViewData.organizer_id || null,
            page_url: pageViewData.page_url || '',
            referrer: pageViewData.referrer || '',
            user_agent: pageViewData.user_agent || '',
            ip_address: pageViewData.ip_address || '',
            duration_seconds: pageViewData.duration_seconds || null
        };
    }

    /**
     * Validate and normalize ticket sale data
     */
    validateAndNormalizeTicketSale(saleData) {
        const required = ['event_id', 'organizer_id', 'ticket_type_id', 'user_id', 'quantity', 'price'];
        const missing = required.filter(field => !saleData[field]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required fields: ${missing.join(', ')}`);
        }

        return {
            timestamp: saleData.timestamp || new Date().toISOString(),
            event_id: saleData.event_id,
            organizer_id: saleData.organizer_id,
            ticket_type_id: saleData.ticket_type_id,
            user_id: saleData.user_id,
            quantity: parseInt(saleData.quantity),
            price: parseFloat(saleData.price),
            currency: saleData.currency || 'USD',
            payment_method: saleData.payment_method || 'unknown'
        };
    }

    /**
     * Flush all buffers to ClickHouse
     */
    async flushBuffers() {
        if (this.isProcessing) {
            return;
        }

        this.isProcessing = true;
        
        try {
            const promises = [];
            
            if (this.eventBuffer.length > 0) {
                promises.push(this.flushEventBuffer());
            }
            
            if (this.pageViewBuffer.length > 0) {
                promises.push(this.flushPageViewBuffer());
            }
            
            if (this.ticketSalesBuffer.length > 0) {
                promises.push(this.flushTicketSalesBuffer());
            }
            
            if (promises.length > 0) {
                await Promise.all(promises);
                this.stats.batchesProcessed++;
                this.stats.lastFlush = new Date();
                this.emit('buffersFlushed', this.getStats());
            }
            
        } catch (error) {
            this.stats.errors++;
            console.error('❌ Error flushing buffers:', error.message);
            this.emit('flushError', error);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Flush event buffer
     */
    async flushEventBuffer() {
        if (this.eventBuffer.length === 0) return;
        
        const events = [...this.eventBuffer];
        this.eventBuffer = [];
        
        try {
            await this.client.insert({
                table: 'bilten_analytics.events',
                values: events
            });
            
            this.stats.eventsProcessed += events.length;
            console.log(`📊 Flushed ${events.length} events to ClickHouse`);
        } catch (error) {
            // Put events back in buffer for retry
            this.eventBuffer.unshift(...events);
            throw error;
        }
    }

    /**
     * Flush page view buffer
     */
    async flushPageViewBuffer() {
        if (this.pageViewBuffer.length === 0) return;
        
        const pageViews = [...this.pageViewBuffer];
        this.pageViewBuffer = [];
        
        try {
            await this.client.insert({
                table: 'bilten_analytics.page_views',
                values: pageViews
            });
            
            console.log(`📄 Flushed ${pageViews.length} page views to ClickHouse`);
        } catch (error) {
            this.pageViewBuffer.unshift(...pageViews);
            throw error;
        }
    }

    /**
     * Flush ticket sales buffer
     */
    async flushTicketSalesBuffer() {
        if (this.ticketSalesBuffer.length === 0) return;
        
        const sales = [...this.ticketSalesBuffer];
        this.ticketSalesBuffer = [];
        
        try {
            await this.client.insert({
                table: 'bilten_analytics.ticket_sales',
                values: sales
            });
            
            console.log(`🎫 Flushed ${sales.length} ticket sales to ClickHouse`);
        } catch (error) {
            this.ticketSalesBuffer.unshift(...sales);
            throw error;
        }
    }

    /**
     * Get service statistics
     */
    getStats() {
        return {
            ...this.stats,
            bufferSizes: {
                events: this.eventBuffer.length,
                pageViews: this.pageViewBuffer.length,
                ticketSales: this.ticketSalesBuffer.length
            },
            isProcessing: this.isProcessing
        };
    }

    /**
     * Bulk track multiple events
     */
    async bulkTrackEvents(events) {
        const results = [];
        
        for (const event of events) {
            const result = await this.trackEvent(event);
            results.push(result);
        }
        
        return results;
    }

    /**
     * Generate test data for development
     */
    generateTestEvent(organizer_id = null) {
        const eventTypes = ['page_view', 'event_view', 'ticket_purchase', 'registration', 'share', 'favorite'];
        const eventNames = ['Homepage Visit', 'Event Details', 'Ticket Checkout', 'User Registration', 'Social Share', 'Add to Favorites'];
        
        const randomIndex = Math.floor(Math.random() * eventTypes.length);
        
        return {
            event_type: eventTypes[randomIndex],
            event_name: eventNames[randomIndex],
            organizer_id: organizer_id || uuidv4(),
            user_id: Math.random() > 0.3 ? uuidv4() : null, // 70% logged in users
            properties: {
                browser: ['Chrome', 'Firefox', 'Safari', 'Edge'][Math.floor(Math.random() * 4)],
                device_type: ['desktop', 'mobile', 'tablet'][Math.floor(Math.random() * 3)],
                country: ['US', 'UK', 'CA', 'AU', 'DE'][Math.floor(Math.random() * 5)],
                revenue: eventTypes[randomIndex] === 'ticket_purchase' ? (Math.random() * 100 + 10).toFixed(2) : null
            },
            user_agent: 'Mozilla/5.0 (Test Agent)',
            ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
            page_url: `https://bilten.com/events/${uuidv4()}`
        };
    }

    /**
     * Start test data generation
     */
    startTestDataGeneration(eventsPerSecond = 10) {
        console.log(`🧪 Starting test data generation: ${eventsPerSecond} events/second`);
        
        const interval = 1000 / eventsPerSecond;
        
        this.testDataTimer = setInterval(() => {
            const testEvent = this.generateTestEvent();
            this.trackEvent(testEvent);
        }, interval);
    }

    /**
     * Stop test data generation
     */
    stopTestDataGeneration() {
        if (this.testDataTimer) {
            clearInterval(this.testDataTimer);
            this.testDataTimer = null;
            console.log('🛑 Test data generation stopped');
        }
    }

    /**
     * Graceful shutdown
     */
    async shutdown() {
        console.log('🛑 Shutting down Analytics Ingestion Service...');
        
        this.stopFlushTimer();
        this.stopTestDataGeneration();
        
        // Flush remaining data
        await this.flushBuffers();
        
        await this.client.close();
        console.log('✅ Analytics Ingestion Service shut down gracefully');
    }
}

// CLI Interface
async function main() {
    const service = new AnalyticsIngestionService();
    
    // Event listeners
    service.on('initialized', () => {
        console.log('✅ Service ready for analytics ingestion');
    });
    
    service.on('eventTracked', (event) => {
        // console.log('📊 Event tracked:', event.event_type);
    });
    
    service.on('buffersFlushed', (stats) => {
        console.log('💾 Buffers flushed. Stats:', stats);
    });
    
    service.on('flushError', (error) => {
        console.error('❌ Flush error:', error.message);
    });
    
    try {
        await service.initialize();
        
        const command = process.argv[2] || 'monitor';
        
        switch (command) {
            case 'test':
                const eventsPerSecond = parseInt(process.argv[3]) || 10;
                service.startTestDataGeneration(eventsPerSecond);
                console.log('Press Ctrl+C to stop test data generation');
                break;
                
            case 'monitor':
            default:
                console.log('📊 Analytics Ingestion Service running...');
                console.log('Use "test <events_per_second>" to generate test data');
                break;
        }
        
        // Graceful shutdown
        process.on('SIGINT', async () => {
            await service.shutdown();
            process.exit(0);
        });
        
        process.on('SIGTERM', async () => {
            await service.shutdown();
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ Service failed:', error.message);
        process.exit(1);
    }
}

// Export for use as module
module.exports = AnalyticsIngestionService;

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}