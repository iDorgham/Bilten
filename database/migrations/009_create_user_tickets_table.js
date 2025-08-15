exports.up = function(knex) {
  return knex.schema.createTable('user_tickets', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('order_id').references('id').inTable('orders').onDelete('CASCADE');
    table.uuid('order_item_id').references('id').inTable('order_items').onDelete('CASCADE');
    table.uuid('event_id').references('id').inTable('events').onDelete('CASCADE');
    table.uuid('ticket_type_id').references('id').inTable('tickets').onDelete('CASCADE');
    table.string('ticket_number').unique().notNullable();
    table.string('qr_code').unique().notNullable();
    table.enum('status', ['active', 'used', 'cancelled', 'refunded']).defaultTo('active');
    table.timestamp('used_at').nullable();
    table.json('ticket_data').nullable(); // Store ticket type details at time of purchase
    table.timestamps(true, true);
    
    table.index(['user_id']);
    table.index(['order_id']);
    table.index(['event_id']);
    table.index(['ticket_number']);
    table.index(['qr_code']);
    table.index(['status']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('user_tickets');
};
