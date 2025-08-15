/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('webhook_events', (table) => {
      table.increments('id').primary();
      table.string('event_type', 100).notNullable();
      table.string('source', 50).notNullable().defaultTo('stripe');
      table.text('event_data').notNullable();
      table.enum('status', ['pending', 'processing', 'completed', 'failed']).defaultTo('pending');
      table.text('result').nullable();
      table.text('error_message').nullable();
      table.timestamp('processed_at').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      
      // Indexes
      table.index(['event_type']);
      table.index(['source']);
      table.index(['status']);
      table.index(['created_at']);
    })
    .createTable('webhook_deliveries', (table) => {
      table.increments('id').primary();
      table.string('webhook_id', 36).notNullable(); // UUID
      table.string('endpoint', 500).notNullable();
      table.text('payload').notNullable();
      table.text('headers').notNullable();
      table.enum('status', ['pending', 'delivered', 'failed']).defaultTo('pending');
      table.integer('response_status').nullable();
      table.text('response_data').nullable();
      table.text('error_message').nullable();
      table.integer('retry_count').defaultTo(0);
      table.timestamp('delivered_at').nullable();
      table.timestamp('last_retry_at').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      
      // Indexes
      table.index(['webhook_id']);
      table.index(['status']);
      table.index(['retry_count']);
      table.index(['created_at']);
    })
    .createTable('webhook_endpoints', (table) => {
      table.increments('id').primary();
      table.string('name', 100).notNullable();
      table.string('url', 500).notNullable();
      table.string('secret_key', 255).notNullable();
      table.text('event_types').notNullable(); // JSON array of event types
      table.boolean('is_active').defaultTo(true);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      
      // Indexes
      table.index(['is_active']);
      table.unique(['url']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTable('webhook_endpoints')
    .dropTable('webhook_deliveries')
    .dropTable('webhook_events');
};
