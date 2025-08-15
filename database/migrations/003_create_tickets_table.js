exports.up = function(knex) {
  return knex.schema.createTable('tickets', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('event_id').references('id').inTable('events').onDelete('CASCADE');
    table.string('type').notNullable(); // 'general', 'vip', 'early_bird', etc.
    table.string('name').notNullable();
    table.text('description').nullable();
    table.decimal('price', 10, 2).notNullable();
    table.integer('quantity_total').notNullable();
    table.integer('quantity_sold').defaultTo(0);
    table.timestamp('sale_start').nullable();
    table.timestamp('sale_end').nullable();
    table.integer('max_per_order').defaultTo(10);
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    table.index(['event_id']);
    table.index(['is_active']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('tickets');
};