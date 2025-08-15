exports.up = function(knex) {
  return knex.schema.createTable('order_items', function(table) {
    table.increments('id').primary();
    table.integer('order_id').unsigned().references('id').inTable('orders').onDelete('CASCADE');
    table.integer('ticket_id').unsigned().references('id').inTable('tickets').onDelete('CASCADE');
    table.string('ticket_type').notNullable();
    table.integer('quantity').notNullable();
    table.decimal('price', 10, 2).notNullable();
    table.timestamps(true, true);
    
    table.index(['order_id']);
    table.index(['ticket_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('order_items');
};