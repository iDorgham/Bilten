/**
 * Migration: Create Transactions Table
 * 
 * This migration creates the transactions table for storing payment transaction records
 * with relations to users, events, and orders.
 */

const up = async (client) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL,
      event_id UUID,
      order_id UUID,
      amount DECIMAL(10, 2) NOT NULL,
      currency VARCHAR(3) NOT NULL,
      payment_method VARCHAR(50) NOT NULL,
      gateway_transaction_id VARCHAR(255) NOT NULL,
      status VARCHAR(20) NOT NULL,
      metadata JSONB,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
      completed_at TIMESTAMP WITH TIME ZONE
    );
    
    CREATE INDEX idx_transactions_user_id ON transactions(user_id);
    CREATE INDEX idx_transactions_event_id ON transactions(event_id);
    CREATE INDEX idx_transactions_order_id ON transactions(order_id);
    CREATE INDEX idx_transactions_status ON transactions(status);
    CREATE INDEX idx_transactions_created_at ON transactions(created_at);
  `);
};

const down = async (client) => {
  await client.query(`
    DROP TABLE IF EXISTS transactions;
  `);
};

module.exports = {
  up,
  down,
};