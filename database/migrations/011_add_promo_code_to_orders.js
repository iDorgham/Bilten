exports.up = function(knex) {
  return knex.schema.alterTable('orders', function(table) {
    // Add promo code fields
    table.uuid('promo_code_id').references('id').inTable('promo_codes').onDelete('SET NULL');
    table.decimal('discount_amount', 10, 2).defaultTo(0);
    table.string('promo_code_used').nullable(); // Store the actual code used for reference
    
    // Add index for promo code lookups
    table.index(['promo_code_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('orders', function(table) {
    table.dropColumn('promo_code_id');
    table.dropColumn('discount_amount');
    table.dropColumn('promo_code_used');
  });
};
