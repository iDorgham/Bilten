/**
 * Migration: Create file storage table
 * Stores file metadata and URLs for cloud storage integration
 */

exports.up = async function(knex) {
  await knex.schema.createTable('file_storage.files', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('original_name').notNullable();
    table.string('filename').notNullable();
    table.string('mimetype').notNullable();
    table.bigInteger('size').notNullable();
    table.string('path').notNullable();
    table.jsonb('urls').notNullable(); // Different sizes and formats
    table.jsonb('metadata').defaultTo('{}'); // Additional metadata
    table.uuid('uploaded_by').references('id').inTable('users.users');
    table.string('folder').defaultTo('uploads');
    table.boolean('is_public').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index(['uploaded_by']);
    table.index(['folder']);
    table.index(['mimetype']);
    table.index(['created_at']);
    table.index(['path']);
  });

  // Create file_storage schema if it doesn't exist
  await knex.raw('CREATE SCHEMA IF NOT EXISTS file_storage');
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('file_storage.files');
};
