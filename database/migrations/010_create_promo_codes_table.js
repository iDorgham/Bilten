exports.up = function(knex) {
  return knex.schema.createTable('promo_codes', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('code').unique().notNullable();
    table.string('name').notNullable();
    table.text('description').nullable();
    
    // Discount configuration
    table.enum('discount_type', ['percentage', 'fixed_amount']).notNullable();
    table.decimal('discount_value', 10, 2).notNullable();
    table.decimal('minimum_order_amount', 10, 2).defaultTo(0);
    table.decimal('maximum_discount_amount', 10, 2).nullable();
    
    // Usage limits
    table.integer('max_uses').nullable(); // null = unlimited
    table.integer('used_count').defaultTo(0);
    table.integer('max_uses_per_user').defaultTo(1);
    
    // Validity period
    table.timestamp('valid_from').notNullable();
    table.timestamp('valid_until').nullable(); // null = no expiration
    
    // Applicability
    table.json('applicable_events').nullable(); // array of event IDs, null = all events
    table.json('applicable_ticket_types').nullable(); // array of ticket types, null = all types
    table.boolean('is_active').defaultTo(true);
    
    // Created by
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    
    table.timestamps(true, true);
    
    // Indexes
    table.index(['code']);
    table.index(['is_active']);
    table.index(['valid_from', 'valid_until']);
    table.index(['created_by']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('promo_codes');
};
