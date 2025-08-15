/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('scheduled_exports', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('type').notNullable();
      table.string('format').notNullable();
      table.string('schedule').notNullable(); // daily, weekly, monthly
      table.jsonb('filters').defaultTo('{}');
      table.jsonb('date_range').defaultTo('{}');
      table.boolean('include_relations').defaultTo(false);
      table.jsonb('email_recipients').defaultTo('[]');
      table.string('status').defaultTo('active'); // active, paused, cancelled
      table.uuid('created_by').references('id').inTable('users').onDelete('CASCADE');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.timestamp('last_run_at');
      table.timestamp('next_run_at');
      
      // Indexes
      table.index(['created_by']);
      table.index(['status']);
      table.index(['next_run_at']);
    })
    .createTable('export_history', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('type').notNullable();
      table.string('format').notNullable();
      table.jsonb('filters').defaultTo('{}');
      table.jsonb('date_range').defaultTo('{}');
      table.boolean('include_relations').defaultTo(false);
      table.integer('record_count').defaultTo(0);
      table.string('file_path');
      table.string('file_size');
      table.uuid('created_by').references('id').inTable('users').onDelete('CASCADE');
      table.uuid('scheduled_export_id').references('id').inTable('scheduled_exports').onDelete('SET NULL');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      
      // Indexes
      table.index(['created_by']);
      table.index(['type']);
      table.index(['created_at']);
      table.index(['scheduled_export_id']);
    })
    .createTable('export_logs', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('scheduled_export_id').references('id').inTable('scheduled_exports').onDelete('CASCADE');
      table.string('status').notNullable(); // success, failed, running
      table.text('error_message');
      table.integer('record_count').defaultTo(0);
      table.string('file_path');
      table.string('file_size');
      table.jsonb('metadata').defaultTo('{}');
      table.timestamp('started_at').defaultTo(knex.fn.now());
      table.timestamp('completed_at');
      table.integer('duration_seconds');
      
      // Indexes
      table.index(['scheduled_export_id']);
      table.index(['status']);
      table.index(['started_at']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('export_logs')
    .dropTableIfExists('export_history')
    .dropTableIfExists('scheduled_exports');
};
