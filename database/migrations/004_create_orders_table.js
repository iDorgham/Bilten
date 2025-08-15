exports.up = function(knex) {
  return knex.schema.createTable('orders', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('event_id').references('id').inTable('events').onDelete('CASCADE');
    table.string('order_number').unique().notNullable();
    table.enum('status', ['pending', 'completed', 'cancelled', 'refunded']).defaultTo('pending');
    table.decimal('subtotal', 10, 2).notNullable();
    table.decimal('fees', 10, 2).defaultTo(0);
    table.decimal('total', 10, 2).notNullable();
    table.string('stripe_payment_intent_id').nullable();
    table.string('stripe_charge_id').nullable();
    table.json('billing_details').nullable();
    table.timestamps(true, true);
    
    table.index(['user_id']);
    table.index(['event_id']);
    table.index(['status']);
    table.index(['order_number']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('orders');
};