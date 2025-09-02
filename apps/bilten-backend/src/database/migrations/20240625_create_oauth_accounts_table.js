/**
 * Migration: Create OAuth accounts table
 * Stores OAuth provider connections for users
 */

exports.up = async function(knex) {
  await knex.schema.createTable('authentication.oauth_accounts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users.users').onDelete('CASCADE');
    table.string('provider').notNullable(); // google, facebook, apple
    table.string('provider_user_id').notNullable(); // ID from OAuth provider
    table.string('email');
    table.string('first_name');
    table.string('last_name');
    table.string('picture_url');
    table.jsonb('provider_data'); // Store additional provider-specific data
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Unique constraint on provider + provider_user_id
    table.unique(['provider', 'provider_user_id']);
    
    // Indexes
    table.index(['user_id']);
    table.index(['provider']);
    table.index(['email']);
  });

  // Add OAuth-related columns to users table
  await knex.schema.alterTable('users.users', (table) => {
    table.boolean('oauth_enabled').defaultTo(false);
    table.string('primary_oauth_provider'); // Which OAuth provider is primary
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('authentication.oauth_accounts');
  
  await knex.schema.alterTable('users.users', (table) => {
    table.dropColumn('oauth_enabled');
    table.dropColumn('primary_oauth_provider');
  });
};
