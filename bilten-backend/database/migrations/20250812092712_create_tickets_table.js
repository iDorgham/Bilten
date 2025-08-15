exports.up = function(knex) {
  return knex.schema.createTable('tickets', function(table) {
    table.increments('id').primary();
    table.integer('event_id').unsigned().references('id').inTable('events').onDelete('CASCADE');
    table.string('type').notNullable();
    table.decimal('price', 10, 2).notNullable();
    table.integer('quantity_available').notNullable();
    table.text('description');
    table.timestamps(true, true);
    
    table.index(['event_id']);
    table.index(['type']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('tickets');
};
