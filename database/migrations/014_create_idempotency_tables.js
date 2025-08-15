/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('idempotency_keys', (table) => {
    table.increments('id').primary();
    table.string('key', 64).notNullable();
    table.string('user_id', 255).notNullable();
    table.text('response_data').notNullable();
    table.integer('response_status').notNullable().defaultTo(200);
    table.timestamp('expires_at').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index(['key', 'user_id']);
    table.index(['expires_at']);
    table.unique(['key', 'user_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('idempotency_keys');
};
