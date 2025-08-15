/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.string('first_name', 100);
    table.string('last_name', 100);
    table.string('role', 50).defaultTo('user');
    table.boolean('email_verified').defaultTo(false);
    table.timestamp('email_verified_at');
    table.string('verification_token', 255);
    table.string('reset_password_token', 255);
    table.timestamp('reset_password_expires');
    table.timestamps(true, true); // created_at, updated_at
    
    // Indexes
    table.index('email');
    table.index('role');
    table.index('verification_token');
    table.index('reset_password_token');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('users');
};
