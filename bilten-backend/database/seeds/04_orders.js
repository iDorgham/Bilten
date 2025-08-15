exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('order_items').del();
  await knex('orders').del();

  // Insert sample orders (simplified for now)
  await knex('orders').insert([
    {
      id: 1,
      user_id: 3, // Regular user
      event_id: 1, // Monolink event
      total_amount: 50.00,
      status: 'completed',
      payment_intent_id: 'pi_test_1234567890',
      created_at: new Date('2025-01-10'),
      updated_at: new Date('2025-01-10'),
    },
    {
      id: 2,
      user_id: 5, // Sara Mohamed
      event_id: 2, // Amr Diab event
      total_amount: 150.00,
      status: 'completed',
      payment_intent_id: 'pi_test_1234567891',
      created_at: new Date('2025-01-11'),
      updated_at: new Date('2025-01-11'),
    },
    {
      id: 3,
      user_id: 3, // Regular user
      event_id: 3, // Anima event
      total_amount: 25.00,
      status: 'pending',
      payment_intent_id: 'pi_test_1234567892',
      created_at: new Date('2025-01-12'),
      updated_at: new Date('2025-01-12'),
    },
  ]);

  // Reset sequences
  await knex.raw('SELECT setval(\'orders_id_seq\', (SELECT MAX(id) FROM orders))');
};