exports.up = function(knex) {
  return knex.schema.createTable('events', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organizer_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('title').notNullable();
    table.text('description').notNullable();
    table.string('slug').unique().notNullable();
    table.string('category').notNullable();
    table.string('venue_name').notNullable();
    table.string('venue_address').notNullable();
    table.decimal('venue_latitude', 10, 8).nullable();
    table.decimal('venue_longitude', 11, 8).nullable();
    table.timestamp('start_date').notNullable();
    table.timestamp('end_date').notNullable();
    table.string('timezone').defaultTo('UTC');
    table.string('cover_image_url').nullable();
    table.json('images').nullable();
    table.enum('status', ['draft', 'published', 'cancelled']).defaultTo('draft');
    table.integer('max_attendees').nullable();
    table.boolean('is_free').defaultTo(false);
    table.decimal('base_price', 10, 2).nullable();
    table.timestamps(true, true);
    
    table.index(['organizer_id']);
    table.index(['status']);
    table.index(['start_date']);
    table.index(['slug']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('events');
};