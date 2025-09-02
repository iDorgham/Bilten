/**
 * Migration: Create Refunds Table
 * 
 * This migration creates the refunds table for storing payment refund records
 * with relations to transactions.
 */

const up = async (client) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS refunds (
      id UUID PRIMARY KEY,
      transaction_id UUID NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      reason VARCHAR(255),
      status VARCHAR(20) NOT NULL,
      refund_method VARCHAR(50) NOT NULL,
      processed_by UUID,
      gateway_refund_id VARCHAR(255),
      requested_at TIMESTAMP WITH TIME ZONE NOT NULL,
      processed_at TIMESTAMP WITH TIME ZONE,
      completed_at TIMESTAMP WITH TIME ZONE,
      FOREIGN KEY (transaction_id) REFERENCES transactions(id)
    );
    
    CREATE INDEX idx_refunds_transaction_id ON refunds(transaction_id);
    CREATE INDEX idx_refunds_status ON refunds(status);
    CREATE INDEX idx_refunds_requested_at ON refunds(requested_at);
  `);
};

const down = async (client) => {
  await client.query(`
    DROP TABLE IF EXISTS refunds;
  `);
};

module.exports = {
  up,
  down,
};