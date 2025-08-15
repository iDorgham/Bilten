/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('events', (table) => {
    table.increments('id').primary();
    table.string('title', 255).notNullable();
    table.text('description');
    table.string('category', 100);
    table.string('venue_name', 255);
    table.text('venue_address');
    table.timestamp('start_date').notNullable();
    table.timestamp('end_date').notNullable();
    table.string('timezone', 50).defaultTo('UTC');
    table.integer('max_attendees');
    table.boolean('is_free').defaultTo(false);
    table.decimal('base_price', 10, 2);
    table.string('status', 50).defaultTo('draft');
    table.string('cover_image_url', 500);
    table.integer('organizer_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.timestamps(true, true); // created_at, updated_at
    
    // Indexes
    table.index('category');
    table.index('status');
    table.index('start_date');
    table.index('organizer_id');
    table.index(['status', 'start_date']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('events');
};
