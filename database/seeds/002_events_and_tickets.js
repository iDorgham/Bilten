exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('order_items').del();
  await knex('orders').del();
  await knex('tickets').del();
  await knex('events').del();
  
  // Insert sample events - Techno Events in Egypt
  const [event1] = await knex('events').insert([
    {
      id: '550e8400-e29b-41d4-a716-446655440101',
      organizer_id: '550e8400-e29b-41d4-a716-446655440002', // organizer user
      title: 'Artbat - Deep Techno Journey',
      description: 'Experience the hypnotic deep techno sounds of Artbat in an immersive night of electronic music at Cairo\'s premier venue.',
      slug: 'artbat-deep-techno-journey',
      category: 'deep-techno',
      venue_name: 'Cairo Opera House',
      venue_address: 'Gezira Island, Cairo, Egypt',
      start_date: '2025-03-15T21:00:00Z',
      end_date: '2025-03-16T03:00:00Z',
      timezone: 'Africa/Cairo',
      max_attendees: 2500,
      is_free: false,
      base_price: 1500.00,
      status: 'published',
      cover_image_url: 'https://images.unsplash.com/photo-1571266028243-d220c9c3b2d2?w=800&h=600&fit=crop'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440102',
      organizer_id: '550e8400-e29b-41d4-a716-446655440002',
      title: 'Amr Diab - The Plateau Concert',
      description: 'The legendary Amr Diab returns with his greatest hits and new songs in an exclusive concert at the iconic venue.',
      slug: 'amr-diab-plateau-concert',
      category: 'concert',
      venue_name: 'New Administrative Capital Arena',
      venue_address: 'New Administrative Capital, Cairo, Egypt',
      start_date: '2025-02-20T20:00:00Z',
      end_date: '2025-02-20T23:00:00Z',
      timezone: 'Africa/Cairo',
      max_attendees: 15000,
      is_free: false,
      base_price: 800.00,
      status: 'published',
      cover_image_url: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=600&fit=crop'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440103',
      organizer_id: '550e8400-e29b-41d4-a716-446655440002',
      title: 'Anyma - Melodic Techno Experience',
      description: 'Join Anyma for a spiritual journey through melodic techno rhythms and organic sounds that will move your soul.',
      slug: 'anyma-melodic-techno-experience',
      category: 'melodic-techno',
      venue_name: 'Sahel Beach Club',
      venue_address: 'North Coast, Egypt',
      start_date: '2025-02-28T22:00:00Z',
      end_date: '2025-03-01T04:00:00Z',
      timezone: 'Africa/Cairo',
      max_attendees: 1200,
      is_free: false,
      base_price: 1000.00,
      status: 'published',
      cover_image_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440104',
      organizer_id: '550e8400-e29b-41d4-a716-446655440002',
      title: 'Solomun - Organic House Sunset',
      description: 'Experience Solomun\'s signature organic house sounds as the sun sets over the Red Sea in this magical evening.',
      slug: 'solomun-organic-house-sunset',
      category: 'organic-house',
      venue_name: 'El Gouna Marina',
      venue_address: 'El Gouna, Red Sea, Egypt',
      start_date: '2025-03-10T18:00:00Z',
      end_date: '2025-03-11T01:00:00Z',
      timezone: 'Africa/Cairo',
      max_attendees: 1500,
      is_free: false,
      base_price: 1200.00,
      status: 'published',
      cover_image_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop'
    }
  ]).returning('*');

  // Insert sample tickets for Artbat Event
  await knex('tickets').insert([
    {
      id: '550e8400-e29b-41d4-a716-446655440201',
      event_id: '550e8400-e29b-41d4-a716-446655440101',
      type: 'standing',
      name: 'General Admission',
      description: 'General admission standing area with great views of the stage',
      price: 1500.00,
      quantity_total: 200,
      quantity_sold: 25,
      sale_start: '2024-01-01T00:00:00Z',
      sale_end: '2025-03-14T23:59:59Z',
      max_per_order: 5,
      is_active: true
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440202',
      event_id: '550e8400-e29b-41d4-a716-446655440101',
      type: 'vip',
      name: 'VIP Access',
      description: 'Premium standing area with exclusive access and better views',
      price: 2500.00,
      quantity_total: 80,
      quantity_sold: 10,
      sale_start: '2024-01-01T00:00:00Z',
      sale_end: '2025-03-14T23:59:59Z',
      max_per_order: 3,
      is_active: true
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440203',
      event_id: '550e8400-e29b-41d4-a716-446655440101',
      type: 'backstage',
      name: 'Backstage Access',
      description: 'Exclusive backstage access with meet & greet opportunity',
      price: 3500.00,
      quantity_total: 30,
      quantity_sold: 5,
      sale_start: '2024-01-01T00:00:00Z',
      sale_end: '2025-03-14T23:59:59Z',
      max_per_order: 2,
      is_active: true
    }
  ]);

  // Insert sample tickets for Amr Diab Concert
  await knex('tickets').insert([
    {
      id: '550e8400-e29b-41d4-a716-446655440204',
      event_id: '550e8400-e29b-41d4-a716-446655440102',
      type: 'standing',
      name: 'General Admission',
      description: 'General admission standing area',
      price: 800.00,
      quantity_total: 500,
      quantity_sold: 100,
      sale_start: '2024-01-01T00:00:00Z',
      sale_end: '2025-02-19T23:59:59Z',
      max_per_order: 4,
      is_active: true
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440205',
      event_id: '550e8400-e29b-41d4-a716-446655440102',
      type: 'vip',
      name: 'VIP Access',
      description: 'VIP standing area with premium amenities',
      price: 1500.00,
      quantity_total: 200,
      quantity_sold: 50,
      sale_start: '2024-01-01T00:00:00Z',
      sale_end: '2025-02-19T23:59:59Z',
      max_per_order: 3,
      is_active: true
    }
  ]);
};