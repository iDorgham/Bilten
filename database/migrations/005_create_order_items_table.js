exports.up = function(knex) {
  return knex.schema.createTable('order_items', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('order_id').references('id').inTable('orders').onDelete('CASCADE');
    table.uuid('ticket_id').references('id').inTable('tickets').onDelete('CASCADE');
    table.integer('quantity').notNullable();
    table.decimal('unit_price', 10, 2).notNullable();
    table.decimal('total_price', 10, 2).notNullable();
    table.timestamps(true, true);
    
    table.index(['order_id']);
    table.index(['ticket_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('order_items');
};