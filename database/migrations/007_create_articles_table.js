exports.up = function(knex) {
  return knex.schema.createTable('articles', function(table) {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.text('content').notNullable();
    table.string('excerpt', 500); // Short description for preview
    table.string('featured_image_url');
    table.string('author_name').notNullable();
    table.uuid('author_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('category').defaultTo('general'); // technology, business, arts, etc.
    table.string('status').defaultTo('published'); // draft, published, archived
    table.integer('view_count').defaultTo(0);
    table.integer('read_time').defaultTo(5); // Estimated reading time in minutes
    table.jsonb('tags').defaultTo('[]'); // Array of tags
    table.timestamp('published_at');
    table.timestamps(true, true);
    
    // Indexes for better performance
    table.index(['status', 'published_at']);
    table.index(['category']);
    table.index(['author_id']);
    table.index(['title']); // For search functionality
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('articles');
};
