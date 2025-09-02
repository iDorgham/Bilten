const { query, getClient } = require('../database/connection');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../utils/logger');

/**
 * Transaction Model
 * Handles database operations for payment transactions
 */
class Transaction {
  /**
   * Create a new transaction record
   * @param {Object} transactionData - Transaction information
   * @returns {Promise<Object>} Created transaction
   */
  static async create(transactionData) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      
      const {
        userId,
        eventId,
        orderId,
        amount,
        currency,
        paymentMethod,
        gatewayTransactionId,
        status = 'pending',
        metadata = {}
      } = transactionData;
      
      const id = uuidv4();
      const now = new Date().toISOString();
      
      const { rows } = await client.query(
        `INSERT INTO transactions (
          id, user_id, event_id, order_id, amount, currency, 
          payment_method, gateway_transaction_id, status, metadata, 
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
        RETURNING *`,
        [
          id, userId, eventId, orderId, amount, currency,
          paymentMethod, gatewayTransactionId, status, JSON.stringify(metadata),
          now, now
        ]
      );
      
      await client.query('COMMIT');
      
      logger.info('Transaction created', { transactionId: id });
      
      return this.formatTransaction(rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error creating transaction', { error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Update a transaction's status
   * @param {string} id - Transaction ID
   * @param {string} status - New status
   * @param {Object} additionalData - Additional data to update
   * @returns {Promise<Object>} Updated transaction
   */
  static async updateStatus(id, status, additionalData = {}) {
    try {
      const updateFields = ['status = $1', 'updated_at = $2'];
      const updateValues = [status, new Date().toISOString()];
      let paramIndex = 3;
      
      // Add additional fields to update
      Object.entries(additionalData).forEach(([key, value]) => {
        const snakeCaseKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        updateFields.push(`${snakeCaseKey} = $${paramIndex}`);
        updateValues.push(value);
        paramIndex++;
      });
      
      const { rows } = await query(
        `UPDATE transactions 
        SET ${updateFields.join(', ')} 
        WHERE id = $${paramIndex} 
        RETURNING *`,
        [...updateValues, id]
      );
      
      if (rows.length === 0) {
        throw new Error(`Transaction with ID ${id} not found`);
      }
      
      logger.info('Transaction status updated', { 
        transactionId: id, 
        status,
        additionalFields: Object.keys(additionalData)
      });
      
      return this.formatTransaction(rows[0]);
    } catch (error) {
      logger.error('Error updating transaction status', { 
        error: error.message,
        transactionId: id 
      });
      throw error;
    }
  }
  
  /**
   * Get a transaction by ID
   * @param {string} id - Transaction ID
   * @returns {Promise<Object>} Transaction
   */
  static async getById(id) {
    try {
      const { rows } = await query(
        'SELECT * FROM transactions WHERE id = $1',
        [id]
      );
      
      if (rows.length === 0) {
        throw new Error(`Transaction with ID ${id} not found`);
      }
      
      return this.formatTransaction(rows[0]);
    } catch (error) {
      logger.error('Error getting transaction', { 
        error: error.message,
        transactionId: id 
      });
      throw error;
    }
  }
  
  /**
   * Get transactions by user ID
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Transactions
   */
  static async getByUserId(userId, options = {}) {
    try {
      const { limit = 50, offset = 0, status } = options;
      
      let query = 'SELECT * FROM transactions WHERE user_id = $1';
      const queryParams = [userId];
      
      if (status) {
        query += ' AND status = $2';
        queryParams.push(status);
      }
      
      query += ' ORDER BY created_at DESC LIMIT $' + (queryParams.length + 1) + 
              ' OFFSET $' + (queryParams.length + 2);
      queryParams.push(limit, offset);
      
      const { rows } = await query(query, queryParams);
      
      return rows.map(row => this.formatTransaction(row));
    } catch (error) {
      logger.error('Error getting user transactions', { 
        error: error.message,
        userId 
      });
      throw error;
    }
  }
  
  /**
   * Format transaction data from database row
   * @param {Object} row - Database row
   * @returns {Object} Formatted transaction
   */
  static formatTransaction(row) {
    return {
      id: row.id,
      userId: row.user_id,
      eventId: row.event_id,
      orderId: row.order_id,
      amount: row.amount,
      currency: row.currency,
      paymentMethod: row.payment_method,
      gatewayTransactionId: row.gateway_transaction_id,
      status: row.status,
      metadata: row.metadata || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      completedAt: row.completed_at
    };
  }
}

module.exports = Transaction;