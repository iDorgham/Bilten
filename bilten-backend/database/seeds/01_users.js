const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('users').del();

  // Hash passwords
  const adminPassword = await bcrypt.hash('admin123', 12);
  const organizerPassword = await bcrypt.hash('organizer123', 12);
  const userPassword = await bcrypt.hash('user123', 12);

  // Insert seed entries
  await knex('users').insert([
    {
      id: 1,
      email: 'admin@bilten.com',
      password_hash: adminPassword,
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin',
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 2,
      email: 'organizer@bilten.com',
      password_hash: organizerPassword,
      first_name: 'Event',
      last_name: 'Organizer',
      role: 'organizer',
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 3,
      email: 'user@bilten.com',
      password_hash: userPassword,
      first_name: 'Regular',
      last_name: 'User',
      role: 'user',
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 4,
      email: 'ahmed.hassan@example.com',
      password_hash: userPassword,
      first_name: 'Ahmed',
      last_name: 'Hassan',
      role: 'organizer',
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 5,
      email: 'sara.mohamed@example.com',
      password_hash: userPassword,
      first_name: 'Sara',
      last_name: 'Mohamed',
      role: 'user',
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);

  // Reset sequence
  await knex.raw('SELECT setval(\'users_id_seq\', (SELECT MAX(id) FROM users))');
};