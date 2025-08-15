const { v4: uuidv4 } = require('uuid');

exports.seed = async function(knex) {
  // Get existing users and events for foreign key references
  const users = await knex('users').select('id').limit(10);
  const events = await knex('events').select('id').limit(5);
  
  if (users.length === 0 || events.length === 0) {
    console.log('Skipping tracking data seed - no users or events found');
    return;
  }

  const userIds = users.map(user => user.id);
  const eventIds = events.map(event => event.id);

  // Generate sample tracking data
  const generateTrackingData = () => {
    const eventTypes = ['page_view', 'click', 'scroll', 'search', 'form_submit', 'button_click'];
    const interactionTypes = ['view', 'like', 'share', 'bookmark', 'comment'];
    const conversionTypes = ['purchase', 'registration', 'newsletter_signup', 'download'];
    const pages = ['/events', '/events/123', '/profile', '/checkout', '/about', '/contact'];
    
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    return {
      now,
      oneMonthAgo,
      eventTypes,
      interactionTypes,
      conversionTypes,
      pages
    };
  };

  const { now, oneMonthAgo, eventTypes, interactionTypes, conversionTypes, pages } = generateTrackingData();

  // Sample user activity tracking data
  const userActivityData = [];
  for (let i = 0; i < 1000; i++) {
    const randomDate = new Date(oneMonthAgo.getTime() + Math.random() * (now.getTime() - oneMonthAgo.getTime()));
    const sessionId = `session_${Math.floor(Math.random() * 100)}`;
    
    userActivityData.push({
      id: uuidv4(),
      user_id: userIds[Math.floor(Math.random() * userIds.length)],
      session_id: sessionId,
      event_type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
      event_data: JSON.stringify({
        page: pages[Math.floor(Math.random() * pages.length)],
        referrer: Math.random() > 0.5 ? 'google.com' : 'direct',
        searchTerm: Math.random() > 0.7 ? 'music events' : null
      }),
      page_url: pages[Math.floor(Math.random() * pages.length)],
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
      created_at: randomDate,
      updated_at: randomDate
    });
  }

  // Sample event interaction tracking data
  const eventInteractionData = [];
  for (let i = 0; i < 500; i++) {
    const randomDate = new Date(oneMonthAgo.getTime() + Math.random() * (now.getTime() - oneMonthAgo.getTime()));
    const sessionId = `session_${Math.floor(Math.random() * 100)}`;
    
    eventInteractionData.push({
      id: uuidv4(),
      user_id: userIds[Math.floor(Math.random() * userIds.length)],
      event_id: eventIds[Math.floor(Math.random() * eventIds.length)],
      interaction_type: interactionTypes[Math.floor(Math.random() * interactionTypes.length)],
      interaction_data: JSON.stringify({
        duration: Math.floor(Math.random() * 300),
        scrollDepth: Math.floor(Math.random() * 100),
        source: Math.random() > 0.5 ? 'search_results' : 'homepage'
      }),
      session_id: sessionId,
      created_at: randomDate,
      updated_at: randomDate
    });
  }

  // Sample conversion tracking data
  const conversionData = [];
  for (let i = 0; i < 200; i++) {
    const randomDate = new Date(oneMonthAgo.getTime() + Math.random() * (now.getTime() - oneMonthAgo.getTime()));
    const sessionId = `session_${Math.floor(Math.random() * 100)}`;
    const conversionType = conversionTypes[Math.floor(Math.random() * conversionTypes.length)];
    
    conversionData.push({
      id: uuidv4(),
      user_id: userIds[Math.floor(Math.random() * userIds.length)],
      conversion_type: conversionType,
      conversion_value: conversionType === 'purchase' ? Math.floor(Math.random() * 200) + 20 : 0,
      conversion_data: JSON.stringify({
        orderId: conversionType === 'purchase' ? `order_${Math.floor(Math.random() * 1000)}` : null,
        eventId: conversionType === 'purchase' ? eventIds[Math.floor(Math.random() * eventIds.length)] : null,
        ticketCount: conversionType === 'purchase' ? Math.floor(Math.random() * 4) + 1 : null,
        source: Math.random() > 0.5 ? 'event_page' : 'homepage'
      }),
      session_id: sessionId,
      campaign_id: Math.random() > 0.7 ? 'summer2024' : null,
      created_at: randomDate,
      updated_at: randomDate
    });
  }

  // Sample performance tracking data
  const performanceData = [];
  const endpoints = ['/api/v1/events', '/api/v1/users', '/api/v1/orders', '/api/v1/tickets'];
  
  for (let i = 0; i < 300; i++) {
    const randomDate = new Date(oneMonthAgo.getTime() + Math.random() * (now.getTime() - oneMonthAgo.getTime()));
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    const statusCode = Math.random() > 0.95 ? 500 : (Math.random() > 0.9 ? 404 : 200);
    
    performanceData.push({
      id: uuidv4(),
      endpoint,
      response_time: Math.floor(Math.random() * 500) + 50,
      status_code: statusCode,
      error_message: statusCode >= 400 ? 'Internal server error' : null,
      created_at: randomDate,
      updated_at: randomDate
    });
  }

  // Sample heatmap data
  const heatmapData = [];
  for (let i = 0; i < 800; i++) {
    const randomDate = new Date(oneMonthAgo.getTime() + Math.random() * (now.getTime() - oneMonthAgo.getTime()));
    const sessionId = `session_${Math.floor(Math.random() * 100)}`;
    
    heatmapData.push({
      id: uuidv4(),
      page_url: pages[Math.floor(Math.random() * pages.length)],
      element_selector: Math.random() > 0.5 ? '.event-card' : '.button',
      x_position: Math.floor(Math.random() * 1200),
      y_position: Math.floor(Math.random() * 800),
      click_count: Math.floor(Math.random() * 5) + 1,
      hover_count: Math.floor(Math.random() * 10) + 1,
      scroll_depth: Math.floor(Math.random() * 100),
      session_id: sessionId,
      user_id: userIds[Math.floor(Math.random() * userIds.length)],
      created_at: randomDate,
      updated_at: randomDate
    });
  }

  // Sample campaign tracking data
  const campaignData = [
    {
      id: uuidv4(),
      campaign_id: 'summer2024',
      campaign_name: 'Summer Events 2024',
      campaign_source: 'google',
      campaign_medium: 'cpc',
      campaign_term: 'summer events',
      campaign_content: 'summer_events_banner',
      start_date: new Date('2024-06-01'),
      end_date: new Date('2024-08-31'),
      is_active: true,
      campaign_data: JSON.stringify({
        budget: 5000,
        targetAudience: 'music lovers',
        keywords: ['summer', 'music', 'events', 'festival']
      }),
      created_at: new Date('2024-05-15'),
      updated_at: new Date('2024-05-15')
    },
    {
      id: uuidv4(),
      campaign_id: 'winter2024',
      campaign_name: 'Winter Concert Series',
      campaign_source: 'facebook',
      campaign_medium: 'social',
      campaign_term: null,
      campaign_content: 'winter_concert_ad',
      start_date: new Date('2024-12-01'),
      end_date: new Date('2025-02-28'),
      is_active: true,
      campaign_data: JSON.stringify({
        budget: 3000,
        targetAudience: 'classical music fans',
        keywords: ['winter', 'classical', 'concert', 'orchestra']
      }),
      created_at: new Date('2024-11-15'),
      updated_at: new Date('2024-11-15')
    }
  ];

  // Sample A/B testing data
  const abTestingData = [
    {
      id: uuidv4(),
      test_name: 'homepage_cta_button',
      test_type: 'page',
      variants: JSON.stringify([
        { name: 'A', description: 'Original blue button' },
        { name: 'B', description: 'Green button with different text' }
      ]),
      total_participants: 1000,
      variant_a_participants: 500,
      variant_b_participants: 500,
      variant_a_conversions: 45,
      variant_b_conversions: 52,
      variant_a_conversion_rate: 9.0,
      variant_b_conversion_rate: 10.4,
      confidence_level: 85.2,
      winner: 'B',
      is_active: false,
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31'),
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-31')
    }
  ];

  // Insert sample data
  try {
    await knex('user_activity_tracking').insert(userActivityData);
    await knex('event_interaction_tracking').insert(eventInteractionData);
    await knex('conversion_tracking').insert(conversionData);
    await knex('performance_tracking').insert(performanceData);
    await knex('heatmap_data').insert(heatmapData);
    await knex('campaign_tracking').insert(campaignData);
    await knex('ab_testing').insert(abTestingData);

    console.log('✅ Tracking data seeded successfully');
    console.log(`   - ${userActivityData.length} user activity records`);
    console.log(`   - ${eventInteractionData.length} event interaction records`);
    console.log(`   - ${conversionData.length} conversion records`);
    console.log(`   - ${performanceData.length} performance records`);
    console.log(`   - ${heatmapData.length} heatmap records`);
    console.log(`   - ${campaignData.length} campaign records`);
    console.log(`   - ${abTestingData.length} A/B testing records`);

  } catch (error) {
    console.error('❌ Error seeding tracking data:', error);
    throw error;
  }
};
