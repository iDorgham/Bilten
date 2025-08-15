exports.up = function(knex) {
  return knex.schema.table('users', function(table) {
    // Password reset columns
    table.string('reset_token').nullable();
    table.timestamp('reset_token_expires').nullable();
    
    // Email verification columns (email_verified already exists)
    table.string('email_verification_token').nullable();
    table.timestamp('email_verification_expires').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.table('users', function(table) {
    table.dropColumn('reset_token');
    table.dropColumn('reset_token_expires');
    table.dropColumn('email_verification_token');
    table.dropColumn('email_verification_expires');
  });
};
