exports.up = function(knex) {
  return knex.schema
    // User Activity Tracking Table
    .createTable('user_activity_tracking', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('session_id').notNullable();
      table.string('event_type').notNullable(); // page_view, click, scroll, search, etc.
      table.json('event_data').nullable(); // Additional event-specific data
      table.string('page_url').nullable();
      table.text('user_agent').nullable();
      table.string('ip_address').nullable();
      table.timestamps(true, true);
      
      table.index(['user_id']);
      table.index(['session_id']);
      table.index(['event_type']);
      table.index(['created_at']);
      table.index(['user_id', 'created_at']);
    })
    
    // Event Interaction Tracking Table
    .createTable('event_interaction_tracking', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.uuid('event_id').references('id').inTable('events').onDelete('CASCADE');
      table.string('interaction_type').notNullable(); // view, like, share, bookmark, etc.
      table.json('interaction_data').nullable(); // Additional interaction data
      table.string('session_id').notNullable();
      table.timestamps(true, true);
      
      table.index(['user_id']);
      table.index(['event_id']);
      table.index(['interaction_type']);
      table.index(['created_at']);
      table.index(['event_id', 'interaction_type']);
    })
    
    // Conversion Tracking Table
    .createTable('conversion_tracking', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('conversion_type').notNullable(); // purchase, registration, signup, etc.
      table.decimal('conversion_value', 10, 2).nullable();
      table.json('conversion_data').nullable(); // Additional conversion data
      table.string('session_id').notNullable();
      table.string('campaign_id').nullable(); // For campaign tracking
      table.timestamps(true, true);
      
      table.index(['user_id']);
      table.index(['conversion_type']);
      table.index(['created_at']);
      table.index(['campaign_id']);
      table.index(['conversion_type', 'created_at']);
    })
    
    // Performance Tracking Table
    .createTable('performance_tracking', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('endpoint').notNullable();
      table.integer('response_time').notNullable(); // in milliseconds
      table.integer('status_code').notNullable();
      table.text('error_message').nullable();
      table.timestamps(true, true);
      
      table.index(['endpoint']);
      table.index(['status_code']);
      table.index(['created_at']);
      table.index(['endpoint', 'created_at']);
    })
    
    // User Engagement Metrics Table
    .createTable('user_engagement_metrics', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.integer('total_events').defaultTo(0);
      table.integer('total_sessions').defaultTo(0);
      table.integer('total_page_views').defaultTo(0);
      table.integer('total_clicks').defaultTo(0);
      table.integer('total_conversions').defaultTo(0);
      table.decimal('total_conversion_value', 10, 2).defaultTo(0);
      table.integer('avg_session_duration').defaultTo(0); // in seconds
      table.timestamp('last_activity').nullable();
      table.timestamp('first_activity').nullable();
      table.timestamps(true, true);
      
      table.index(['user_id']);
      table.index(['last_activity']);
      table.index(['total_events']);
      table.index(['total_conversion_value']);
    })
    
    // Event Engagement Metrics Table
    .createTable('event_engagement_metrics', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('event_id').references('id').inTable('events').onDelete('CASCADE');
      table.integer('total_views').defaultTo(0);
      table.integer('total_interactions').defaultTo(0);
      table.integer('total_likes').defaultTo(0);
      table.integer('total_shares').defaultTo(0);
      table.integer('total_bookmarks').defaultTo(0);
      table.integer('total_conversions').defaultTo(0);
      table.decimal('total_conversion_value', 10, 2).defaultTo(0);
      table.decimal('engagement_rate', 5, 2).defaultTo(0); // percentage
      table.timestamp('last_interaction').nullable();
      table.timestamp('first_interaction').nullable();
      table.timestamps(true, true);
      
      table.index(['event_id']);
      table.index(['last_interaction']);
      table.index(['total_views']);
      table.index(['engagement_rate']);
    })
    
    // Conversion Metrics Table
    .createTable('conversion_metrics', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('conversion_type').notNullable();
      table.integer('total_conversions').defaultTo(0);
      table.decimal('total_value', 10, 2).defaultTo(0);
      table.decimal('avg_value', 10, 2).defaultTo(0);
      table.decimal('conversion_rate', 5, 2).defaultTo(0); // percentage
      table.timestamp('last_conversion').nullable();
      table.timestamp('first_conversion').nullable();
      table.timestamps(true, true);
      
      table.index(['conversion_type']);
      table.index(['last_conversion']);
      table.index(['total_conversions']);
      table.index(['total_value']);
    })
    
    // Campaign Tracking Table
    .createTable('campaign_tracking', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('campaign_id').notNullable().unique();
      table.string('campaign_name').notNullable();
      table.string('campaign_source').nullable();
      table.string('campaign_medium').nullable();
      table.string('campaign_term').nullable();
      table.string('campaign_content').nullable();
      table.timestamp('start_date').nullable();
      table.timestamp('end_date').nullable();
      table.boolean('is_active').defaultTo(true);
      table.json('campaign_data').nullable();
      table.timestamps(true, true);
      
      table.index(['campaign_id']);
      table.index(['campaign_source']);
      table.index(['is_active']);
      table.index(['start_date', 'end_date']);
    })
    
    // A/B Testing Table
    .createTable('ab_testing', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('test_name').notNullable();
      table.string('test_type').notNullable(); // page, feature, content, etc.
      table.json('variants').notNullable(); // Array of test variants
      table.integer('total_participants').defaultTo(0);
      table.integer('variant_a_participants').defaultTo(0);
      table.integer('variant_b_participants').defaultTo(0);
      table.integer('variant_a_conversions').defaultTo(0);
      table.integer('variant_b_conversions').defaultTo(0);
      table.decimal('variant_a_conversion_rate', 5, 2).defaultTo(0);
      table.decimal('variant_b_conversion_rate', 5, 2).defaultTo(0);
      table.decimal('confidence_level', 5, 2).defaultTo(0);
      table.string('winner').nullable(); // A, B, or null if inconclusive
      table.boolean('is_active').defaultTo(true);
      table.timestamp('start_date').nullable();
      table.timestamp('end_date').nullable();
      table.timestamps(true, true);
      
      table.index(['test_name']);
      table.index(['test_type']);
      table.index(['is_active']);
      table.index(['start_date', 'end_date']);
    })
    
    // Heatmap Data Table
    .createTable('heatmap_data', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('page_url').notNullable();
      table.string('element_selector').nullable();
      table.integer('x_position').nullable();
      table.integer('y_position').nullable();
      table.integer('click_count').defaultTo(0);
      table.integer('hover_count').defaultTo(0);
      table.integer('scroll_depth').nullable();
      table.string('session_id').notNullable();
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.timestamps(true, true);
      
      table.index(['page_url']);
      table.index(['session_id']);
      table.index(['user_id']);
      table.index(['created_at']);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('heatmap_data')
    .dropTableIfExists('ab_testing')
    .dropTableIfExists('campaign_tracking')
    .dropTableIfExists('conversion_metrics')
    .dropTableIfExists('event_engagement_metrics')
    .dropTableIfExists('user_engagement_metrics')
    .dropTableIfExists('performance_tracking')
    .dropTableIfExists('conversion_tracking')
    .dropTableIfExists('event_interaction_tracking')
    .dropTableIfExists('user_activity_tracking');
};
