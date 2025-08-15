exports.up = function(knex) {
  return knex.schema.createTable('promo_code_usage', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('promo_code_id').references('id').inTable('promo_codes').onDelete('CASCADE');
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('order_id').references('id').inTable('orders').onDelete('CASCADE');
    table.decimal('discount_amount', 10, 2).notNullable();
    table.timestamp('used_at').defaultTo(knex.fn.now());
    
    // Ensure a user can only use a promo code once per order
    table.unique(['promo_code_id', 'user_id', 'order_id']);
    
    // Indexes
    table.index(['promo_code_id']);
    table.index(['user_id']);
    table.index(['order_id']);
    table.index(['promo_code_id', 'user_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('promo_code_usage');
};
