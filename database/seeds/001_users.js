const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('users').del();
  
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  // Inserts seed entries
  await knex('users').insert([
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      email: 'admin@bilten.com',
      password_hash: hashedPassword,
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin',
      email_verified: true,
      email_verified_at: new Date()
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      email: 'organizer@bilten.com',
      password_hash: hashedPassword,
      first_name: 'Event',
      last_name: 'Organizer',
      role: 'organizer',
      email_verified: true,
      email_verified_at: new Date()
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      email: 'user@bilten.com',
      password_hash: hashedPassword,
      first_name: 'Regular',
      last_name: 'User',
      role: 'user',
      email_verified: true,
      email_verified_at: new Date()
    }
  ]);
};