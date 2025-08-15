exports.up = function(knex) {
  return knex.schema.createTable('user_wishlists', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.uuid('event_id').references('id').inTable('events').onDelete('CASCADE').notNullable();
    table.timestamps(true, true);
    
    // Ensure a user can only wishlist an event once
    table.unique(['user_id', 'event_id']);
    
    // Indexes for performance
    table.index(['user_id']);
    table.index(['event_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('user_wishlists');
};