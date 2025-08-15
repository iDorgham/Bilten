/**
 * Migration: Create recommendation system tables
 * Date: 2025-01-11
 */

exports.up = function(knex) {
  return knex.schema
    // Search history table to track user search behavior
    .createTable('search_history', table => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
      table.string('search_term', 255).notNullable();
      table.string('category', 100);
      table.string('location', 100);
      table.json('filters');
      table.integer('results_count').defaultTo(0);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      
      // Indexes for performance
      table.index(['user_id', 'created_at']);
      table.index(['search_term']);
      table.index(['category']);
      table.index(['location']);
    })
    
    // Recommendation interactions table to track user behavior with recommendations
    .createTable('recommendation_interactions', table => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
      table.integer('event_id').unsigned().references('id').inTable('events').onDelete('CASCADE');
      table.enum('action', ['view', 'click', 'purchase', 'wishlist', 'share']).notNullable();
      table.string('recommendation_type', 50); // content_based, collaborative, trending, popular
      table.decimal('confidence_score', 3, 2); // 0.00 to 1.00
      table.json('context'); // Additional context like source, position, etc.
      table.timestamp('created_at').defaultTo(knex.fn.now());
      
      // Indexes for performance
      table.index(['user_id', 'created_at']);
      table.index(['event_id']);
      table.index(['action']);
      table.index(['recommendation_type']);
      table.index(['user_id', 'event_id']);
    })
    
    // User preferences table to store explicit user preferences
    .createTable('user_preferences', table => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE').unique();
      table.json('categories'); // Array of preferred categories
      table.json('organizers'); // Array of preferred organizer IDs
      table.json('price_range'); // {min: number, max: number}
      table.json('locations'); // Array of preferred locations
      table.json('search_terms'); // Array of frequently searched terms
      table.boolean('notifications_enabled').defaultTo(true);
      table.boolean('personalization_enabled').defaultTo(true);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      
      // Indexes
      table.index(['user_id']);
    })
    
    // Event similarity matrix for collaborative filtering
    .createTable('event_similarities', table => {
      table.increments('id').primary();
      table.integer('event_id_1').unsigned().references('id').inTable('events').onDelete('CASCADE');
      table.integer('event_id_2').unsigned().references('id').inTable('events').onDelete('CASCADE');
      table.decimal('similarity_score', 5, 4).notNullable(); // 0.0000 to 1.0000
      table.string('similarity_type', 50); // category, organizer, price, location, combined
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      
      // Ensure unique pairs and add indexes
      table.unique(['event_id_1', 'event_id_2']);
      table.index(['event_id_1', 'similarity_score']);
      table.index(['event_id_2', 'similarity_score']);
      table.index(['similarity_type']);
    })
    
    // User similarity matrix for collaborative filtering
    .createTable('user_similarities', table => {
      table.increments('id').primary();
      table.integer('user_id_1').unsigned().references('id').inTable('users').onDelete('CASCADE');
      table.integer('user_id_2').unsigned().references('id').inTable('users').onDelete('CASCADE');
      table.decimal('similarity_score', 5, 4).notNullable(); // 0.0000 to 1.0000
      table.integer('common_events').defaultTo(0);
      table.json('common_categories'); // Array of categories both users like
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      
      // Ensure unique pairs and add indexes
      table.unique(['user_id_1', 'user_id_2']);
      table.index(['user_id_1', 'similarity_score']);
      table.index(['user_id_2', 'similarity_score']);
    })
    
    // Recommendation cache table for storing computed recommendations
    .createTable('recommendation_cache', table => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
      table.string('cache_key', 255).notNullable();
      table.json('recommendations').notNullable();
      table.timestamp('expires_at').notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      
      // Indexes
      table.index(['user_id']);
      table.index(['cache_key']);
      table.index(['expires_at']);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('recommendation_cache')
    .dropTableIfExists('user_similarities')
    .dropTableIfExists('event_similarities')
    .dropTableIfExists('user_preferences')
    .dropTableIfExists('recommendation_interactions')
    .dropTableIfExists('search_history');
};
