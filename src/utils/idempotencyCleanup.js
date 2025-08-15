const { IdempotencyMiddleware } = require('../middleware/idempotency');
const WebhookService = require('../services/webhookService');
const knex = require('./database');

/**
 * Cleanup utility for idempotency keys and webhook data
 */
class CleanupService {
  /**
   * Cleanup expired idempotency keys
   */
  static async cleanupIdempotencyKeys() {
    try {
      const deleted = await IdempotencyMiddleware.cleanup();
      console.log(`✅ Cleaned up ${deleted} expired idempotency keys`);
      return deleted;
    } catch (error) {
      console.error('❌ Failed to cleanup idempotency keys:', error);
      throw error;
    }
  }

  /**
   * Cleanup old webhook data
   */
  static async cleanupWebhookData(daysToKeep = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      // Cleanup old webhook events
      const deletedEvents = await knex('webhook_events')
        .where('created_at', '<', cutoffDate)
        .del();

      // Cleanup old webhook deliveries
      const deletedDeliveries = await knex('webhook_deliveries')
        .where('created_at', '<', cutoffDate)
        .del();

      console.log(`✅ Cleaned up ${deletedEvents} webhook events and ${deletedDeliveries} deliveries`);
      return { deletedEvents, deletedDeliveries };
    } catch (error) {
      console.error('❌ Failed to cleanup webhook data:', error);
      throw error;
    }
  }

  /**
   * Retry failed webhook deliveries
   */
  static async retryFailedWebhooks() {
    try {
      const retryCount = await WebhookService.retryFailedWebhooks();
      console.log(`✅ Retried ${retryCount} failed webhook deliveries`);
      return retryCount;
    } catch (error) {
      console.error('❌ Failed to retry webhooks:', error);
      throw error;
    }
  }

  /**
   * Get cleanup statistics
   */
  static async getCleanupStats() {
    try {
      // Get idempotency key stats
      const idempotencyStats = await knex('idempotency_keys')
        .select(
          knex.raw('COUNT(*) as total'),
          knex.raw('COUNT(CASE WHEN expires_at < NOW() THEN 1 END) as expired'),
          knex.raw('COUNT(CASE WHEN expires_at >= NOW() THEN 1 END) as active')
        )
        .first();

      // Get webhook event stats
      const webhookEventStats = await knex('webhook_events')
        .select(
          knex.raw('COUNT(*) as total'),
          knex.raw('COUNT(CASE WHEN status = \'completed\' THEN 1 END) as completed'),
          knex.raw('COUNT(CASE WHEN status = \'failed\' THEN 1 END) as failed'),
          knex.raw('COUNT(CASE WHEN status = \'processing\' THEN 1 END) as processing')
        )
        .first();

      // Get webhook delivery stats
      const webhookDeliveryStats = await knex('webhook_deliveries')
        .select(
          knex.raw('COUNT(*) as total'),
          knex.raw('COUNT(CASE WHEN status = \'delivered\' THEN 1 END) as delivered'),
          knex.raw('COUNT(CASE WHEN status = \'failed\' THEN 1 END) as failed'),
          knex.raw('COUNT(CASE WHEN status = \'pending\' THEN 1 END) as pending')
        )
        .first();

      return {
        idempotency: idempotencyStats,
        webhookEvents: webhookEventStats,
        webhookDeliveries: webhookDeliveryStats
      };
    } catch (error) {
      console.error('❌ Failed to get cleanup stats:', error);
      throw error;
    }
  }

  /**
   * Run full cleanup
   */
  static async runFullCleanup(daysToKeep = 30) {
    console.log('🧹 Starting full cleanup...');
    
    try {
      const results = {
        idempotencyKeys: await this.cleanupIdempotencyKeys(),
        webhookData: await this.cleanupWebhookData(daysToKeep),
        retryWebhooks: await this.retryFailedWebhooks()
      };

      console.log('✅ Full cleanup completed successfully');
      return results;
    } catch (error) {
      console.error('❌ Full cleanup failed:', error);
      throw error;
    }
  }
}

// CLI support
if (require.main === module) {
  const command = process.argv[2];
  const daysToKeep = parseInt(process.argv[3]) || 30;

  async function runCommand() {
    try {
      switch (command) {
        case 'idempotency':
          await CleanupService.cleanupIdempotencyKeys();
          break;
        case 'webhooks':
          await CleanupService.cleanupWebhookData(daysToKeep);
          break;
        case 'retry':
          await CleanupService.retryFailedWebhooks();
          break;
        case 'stats':
          const stats = await CleanupService.getCleanupStats();
          console.log('📊 Cleanup Statistics:');
          console.log(JSON.stringify(stats, null, 2));
          break;
        case 'full':
          await CleanupService.runFullCleanup(daysToKeep);
          break;
        default:
          console.log('Usage: node idempotencyCleanup.js <command> [daysToKeep]');
          console.log('Commands:');
          console.log('  idempotency  - Cleanup expired idempotency keys');
          console.log('  webhooks     - Cleanup old webhook data');
          console.log('  retry        - Retry failed webhook deliveries');
          console.log('  stats        - Show cleanup statistics');
          console.log('  full         - Run full cleanup');
          console.log('');
          console.log('Examples:');
          console.log('  node idempotencyCleanup.js full 30');
          console.log('  node idempotencyCleanup.js stats');
      }
    } catch (error) {
      console.error('❌ Command failed:', error);
      process.exit(1);
    }
  }

  runCommand();
}

module.exports = CleanupService;
