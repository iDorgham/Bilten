const { v4: uuidv4 } = require('uuid');

exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('promo_codes').del();

  // Get a user ID for created_by field (assuming first user exists)
  const users = await knex('users').select('id').limit(1);
  const userId = users.length > 0 ? users[0].id : null;

  // Get some event IDs for applicable_events
  const events = await knex('events').select('id').limit(3);
  const eventIds = events.map(event => event.id);

  const promoCodeData = [
    {
      id: uuidv4(),
      code: 'WELCOME10',
      name: 'Welcome Discount',
      description: '10% off for new customers',
      discount_type: 'percentage',
      discount_value: 10.00,
      minimum_order_amount: 25.00,
      maximum_discount_amount: 50.00,
      max_uses: 100,
      used_count: 0,
      max_uses_per_user: 1,
      valid_from: new Date(),
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      applicable_events: null, // All events
      applicable_ticket_types: null, // All ticket types
      is_active: true,
      created_by: userId,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      code: 'SAVE20',
      name: 'Save $20',
      description: 'Save $20 on orders over $100',
      discount_type: 'fixed_amount',
      discount_value: 20.00,
      minimum_order_amount: 100.00,
      maximum_discount_amount: 20.00,
      max_uses: 50,
      used_count: 0,
      max_uses_per_user: 2,
      valid_from: new Date(),
      valid_until: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
      applicable_events: eventIds.length > 0 ? JSON.stringify(eventIds.slice(0, 2)) : null,
      applicable_ticket_types: null,
      is_active: true,
      created_by: userId,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      code: 'VIP25',
      name: 'VIP Discount',
      description: '25% off for VIP customers',
      discount_type: 'percentage',
      discount_value: 25.00,
      minimum_order_amount: 50.00,
      maximum_discount_amount: 100.00,
      max_uses: null, // Unlimited
      used_count: 0,
      max_uses_per_user: 3,
      valid_from: new Date(),
      valid_until: null, // No expiration
      applicable_events: null,
      applicable_ticket_types: JSON.stringify(['vip', 'premium']),
      is_active: true,
      created_by: userId,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      code: 'FLASH15',
      name: 'Flash Sale',
      description: '15% off for limited time',
      discount_type: 'percentage',
      discount_value: 15.00,
      minimum_order_amount: 0.00,
      maximum_discount_amount: 75.00,
      max_uses: 25,
      used_count: 0,
      max_uses_per_user: 1,
      valid_from: new Date(),
      valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      applicable_events: eventIds.length > 0 ? JSON.stringify([eventIds[0]]) : null,
      applicable_ticket_types: null,
      is_active: true,
      created_by: userId,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      code: 'FIRST5',
      name: 'First Order',
      description: '$5 off your first order',
      discount_type: 'fixed_amount',
      discount_value: 5.00,
      minimum_order_amount: 10.00,
      maximum_discount_amount: 5.00,
      max_uses: 200,
      used_count: 0,
      max_uses_per_user: 1,
      valid_from: new Date(),
      valid_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      applicable_events: null,
      applicable_ticket_types: null,
      is_active: true,
      created_by: userId,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      code: 'EXPIRED',
      name: 'Expired Code',
      description: 'This code has expired',
      discount_type: 'percentage',
      discount_value: 10.00,
      minimum_order_amount: 0.00,
      maximum_discount_amount: null,
      max_uses: 100,
      used_count: 0,
      max_uses_per_user: 1,
      valid_from: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
      valid_until: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      applicable_events: null,
      applicable_ticket_types: null,
      is_active: false,
      created_by: userId,
      created_at: new Date(),
      updated_at: new Date()
    }
  ];

  // Insert promo codes
  await knex('promo_codes').insert(promoCodeData);

  console.log('✅ Promo codes seeded successfully');
};
