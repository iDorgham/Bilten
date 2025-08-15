exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('user_wishlists').del();
  
  // Insert sample wishlist entries
  await knex('user_wishlists').insert([
    {
      id: '550e8400-e29b-41d4-a716-446655440301',
      user_id: '550e8400-e29b-41d4-a716-446655440003', // regular user
      event_id: '550e8400-e29b-41d4-a716-446655440101', // Tech Conference 2024
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440302',
      user_id: '550e8400-e29b-41d4-a716-446655440003', // regular user
      event_id: '550e8400-e29b-41d4-a716-446655440103', // Digital Art Exhibition
    }
  ]);
};