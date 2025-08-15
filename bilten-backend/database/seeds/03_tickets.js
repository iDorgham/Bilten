exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('tickets').del();

  // Insert seed entries - Create ticket types for each event
  const ticketData = [];

  // Event 1: Artbat - Deep Techno Journey (base price: 1500)
  ticketData.push(
    { event_id: 1, type: 'standing', price: 1500.00, quantity_available: 200, description: 'General admission standing area with great views of the stage' },
    { event_id: 1, type: 'vipStanding', price: 2500.00, quantity_available: 80, description: 'Premium standing area with exclusive access and better views' },
    { event_id: 1, type: 'backStage', price: 3500.00, quantity_available: 30, description: 'Exclusive backstage access with meet & greet opportunity' }
  );

  // Event 2: Amr Diab - The Plateau Concert (base price: 800)
  ticketData.push(
    { event_id: 2, type: 'standing', price: 800.00, quantity_available: 500, description: 'General admission standing area' },
    { event_id: 2, type: 'vipStanding', price: 1500.00, quantity_available: 200, description: 'VIP standing area with premium amenities' },
    { event_id: 2, type: 'backStage', price: 2500.00, quantity_available: 50, description: 'Backstage access with artist meet & greet' }
  );

  // Event 3: Anyma - Melodic Techno Experience (base price: 1000)
  ticketData.push(
    { event_id: 3, type: 'standing', price: 1000.00, quantity_available: 150, description: 'Beach club standing area' },
    { event_id: 3, type: 'vipStanding', price: 1800.00, quantity_available: 60, description: 'VIP beach area with bar access' },
    { event_id: 3, type: 'backStage', price: 2800.00, quantity_available: 20, description: 'Exclusive backstage beach access' }
  );

  // Event 4: Solomun - Organic House Sunset (base price: 1200)
  ticketData.push(
    { event_id: 4, type: 'standing', price: 1200.00, quantity_available: 200, description: 'Marina standing area with sunset views' },
    { event_id: 4, type: 'vipStanding', price: 2000.00, quantity_available: 80, description: 'VIP marina area with premium service' },
    { event_id: 4, type: 'backStage', price: 3000.00, quantity_available: 30, description: 'Backstage marina access with artist interaction' }
  );

  // Event 5: Mohamed Hamaki - Live in Alexandria (base price: 600)
  ticketData.push(
    { event_id: 5, type: 'standing', price: 600.00, quantity_available: 300, description: 'Opera house standing area' },
    { event_id: 5, type: 'vipStanding', price: 1200.00, quantity_available: 120, description: 'VIP opera house area' },
    { event_id: 5, type: 'backStage', price: 2000.00, quantity_available: 40, description: 'Backstage access with artist meet & greet' }
  );

  // Event 6: Miss Monique - Progressive Techno Night (base price: 900)
  ticketData.push(
    { event_id: 6, type: 'standing', price: 900.00, quantity_available: 250, description: 'Beach club standing area' },
    { event_id: 6, type: 'vipStanding', price: 1600.00, quantity_available: 100, description: 'VIP beach area with exclusive bar' },
    { event_id: 6, type: 'backStage', price: 2500.00, quantity_available: 35, description: 'Backstage access with DJ interaction' }
  );

  // Event 7: Korolova - Melodic Techno Journey (base price: 700)
  ticketData.push(
    { event_id: 7, type: 'standing', price: 700.00, quantity_available: 120, description: 'Beach resort standing area' },
    { event_id: 7, type: 'vipStanding', price: 1300.00, quantity_available: 50, description: 'VIP beach resort area' },
    { event_id: 7, type: 'backStage', price: 2000.00, quantity_available: 20, description: 'Backstage access with artist interaction' }
  );

  // Event 8: Adriatique - Deep House Sunset (base price: 800)
  ticketData.push(
    { event_id: 8, type: 'standing', price: 800.00, quantity_available: 150, description: 'Marina standing area' },
    { event_id: 8, type: 'vipStanding', price: 1400.00, quantity_available: 60, description: 'VIP marina area' },
    { event_id: 8, type: 'backStage', price: 2200.00, quantity_available: 25, description: 'Backstage access with artist interaction' }
  );

  // Event 9: CamelPhat - Progressive House Night (base price: 1100)
  ticketData.push(
    { event_id: 9, type: 'standing', price: 1100.00, quantity_available: 300, description: 'Festival city standing area' },
    { event_id: 9, type: 'vipStanding', price: 1900.00, quantity_available: 120, description: 'VIP festival area' },
    { event_id: 9, type: 'backStage', price: 2800.00, quantity_available: 40, description: 'Backstage access with artist interaction' }
  );

  // Event 10: Monolink - Live Techno Experience (base price: 950)
  ticketData.push(
    { event_id: 10, type: 'standing', price: 950.00, quantity_available: 200, description: 'Art center standing area' },
    { event_id: 10, type: 'vipStanding', price: 1700.00, quantity_available: 80, description: 'VIP art center area' },
    { event_id: 10, type: 'backStage', price: 2500.00, quantity_available: 30, description: 'Backstage access with artist interaction' }
  );

  // Add timestamps to all tickets
  const ticketsWithTimestamps = ticketData.map(ticket => ({
    ...ticket,
    created_at: new Date(),
  }));

  await knex('tickets').insert(ticketsWithTimestamps);

  // Reset sequence
  await knex.raw('SELECT setval(\'tickets_id_seq\', (SELECT MAX(id) FROM tickets))');
};