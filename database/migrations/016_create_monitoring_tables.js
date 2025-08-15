/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('business_metrics', function(table) {
      table.increments('id').primary();
      table.string('metric_name', 255).notNullable();
      table.decimal('value', 15, 4).notNullable();
      table.jsonb('tags').defaultTo('{}');
      table.timestamp('recorded_at').defaultTo(knex.fn.now());
      table.index(['metric_name', 'recorded_at']);
      table.index('recorded_at');
    })
    .createTable('error_logs', function(table) {
      table.increments('id').primary();
      table.string('error_type', 100).notNullable();
      table.text('message').notNullable();
      table.text('stack_trace');
      table.jsonb('context').defaultTo('{}');
      table.string('user_id', 36);
      table.string('request_path', 500);
      table.string('request_method', 10);
      table.string('user_agent', 500);
      table.string('ip_address', 45);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.index(['error_type', 'created_at']);
      table.index('created_at');
      table.index('user_id');
    })
    .createTable('performance_metrics', function(table) {
      table.increments('id').primary();
      table.string('metric_name', 255).notNullable();
      table.decimal('value', 15, 4).notNullable();
      table.string('unit', 20).defaultTo('ms');
      table.jsonb('metadata').defaultTo('{}');
      table.timestamp('recorded_at').defaultTo(knex.fn.now());
      table.index(['metric_name', 'recorded_at']);
      table.index('recorded_at');
    })
    .createTable('system_health_checks', function(table) {
      table.increments('id').primary();
      table.string('check_name', 100).notNullable();
      table.string('status', 20).notNullable(); // healthy, warning, unhealthy
      table.decimal('response_time', 10, 2);
      table.text('details');
      table.timestamp('checked_at').defaultTo(knex.fn.now());
      table.index(['check_name', 'checked_at']);
      table.index('status');
      table.index('checked_at');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('system_health_checks')
    .dropTableIfExists('performance_metrics')
    .dropTableIfExists('error_logs')
    .dropTableIfExists('business_metrics');
};
