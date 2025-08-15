exports.up = function(knex) {
  return knex.schema.createTable('orders', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.integer('event_id').unsigned().references('id').inTable('events').onDelete('CASCADE');
    table.decimal('total_amount', 10, 2).notNullable();
    table.string('status').defaultTo('pending');
    table.string('payment_intent_id');
    table.text('cancellation_reason');
    table.timestamps(true, true);
    
    table.index(['user_id']);
    table.index(['event_id']);
    table.index(['status']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('orders');
};