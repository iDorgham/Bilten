const express = require('express');
const knex = require('../../utils/database');
const { authenticateToken } = require('../../middleware/auth');
const { createIdempotencyMiddleware, validateIdempotencyKey } = require('../../middleware/idempotency');
const WebhookService = require('../../services/webhookService');

const router = express.Router();

// Apply idempotency middleware
const idempotencyMiddleware = createIdempotencyMiddleware({
  ttl: 60 * 60 * 1000, // 1 hour
  required: true
});

// GET /webhook-management/endpoints - List webhook endpoints
router.get('/endpoints', authenticateToken, async (req, res) => {
  try {
    const { user } = req;
    
    // Only admins and organizers can manage webhooks
    if (user.role !== 'admin' && user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators and organizers can manage webhooks.'
      });
    }

    const endpoints = await knex('webhook_endpoints')
      .select('id', 'name', 'url', 'event_types', 'is_active', 'created_at', 'updated_at')
      .orderBy('created_at', 'desc');

    res.json({
      success: true,
      data: endpoints.map(endpoint => ({
        ...endpoint,
        event_types: JSON.parse(endpoint.event_types)
      }))
    });

  } catch (error) {
    console.error('Failed to list webhook endpoints:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list webhook endpoints',
      error: error.message
    });
  }
});

// POST /webhook-management/endpoints - Create webhook endpoint
router.post('/endpoints', authenticateToken, validateIdempotencyKey, idempotencyMiddleware, async (req, res) => {
  try {
    const { user } = req;
    const { name, url, eventTypes, secretKey } = req.body;

    // Only admins and organizers can manage webhooks
    if (user.role !== 'admin' && user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators and organizers can manage webhooks.'
      });
    }

    // Validation
    if (!name || !url || !eventTypes || !secretKey) {
      return res.status(400).json({
        success: false,
        message: 'Name, URL, event types, and secret key are required'
      });
    }

    if (!Array.isArray(eventTypes) || eventTypes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Event types must be a non-empty array'
      });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid URL format'
      });
    }

    // Check if endpoint already exists
    const existingEndpoint = await knex('webhook_endpoints')
      .where('url', url)
      .first();

    if (existingEndpoint) {
      return res.status(409).json({
        success: false,
        message: 'Webhook endpoint with this URL already exists'
      });
    }

    // Create webhook endpoint
    const [endpoint] = await knex('webhook_endpoints').insert({
      name,
      url,
      secret_key: secretKey,
      event_types: JSON.stringify(eventTypes),
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }).returning('*');

    res.status(201).json({
      success: true,
      message: 'Webhook endpoint created successfully',
      data: {
        id: endpoint.id,
        name: endpoint.name,
        url: endpoint.url,
        event_types: JSON.parse(endpoint.event_types),
        is_active: endpoint.is_active,
        created_at: endpoint.created_at
      }
    });

  } catch (error) {
    console.error('Failed to create webhook endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create webhook endpoint',
      error: error.message
    });
  }
});

// PUT /webhook-management/endpoints/:id - Update webhook endpoint
router.put('/endpoints/:id', authenticateToken, validateIdempotencyKey, idempotencyMiddleware, async (req, res) => {
  try {
    const { user } = req;
    const { id } = req.params;
    const { name, url, eventTypes, secretKey, isActive } = req.body;

    // Only admins and organizers can manage webhooks
    if (user.role !== 'admin' && user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators and organizers can manage webhooks.'
      });
    }

    // Check if endpoint exists
    const existingEndpoint = await knex('webhook_endpoints')
      .where('id', id)
      .first();

    if (!existingEndpoint) {
      return res.status(404).json({
        success: false,
        message: 'Webhook endpoint not found'
      });
    }

    // Prepare update data
    const updateData = {
      updated_at: new Date()
    };

    if (name !== undefined) updateData.name = name;
    if (url !== undefined) updateData.url = url;
    if (eventTypes !== undefined) updateData.event_types = JSON.stringify(eventTypes);
    if (secretKey !== undefined) updateData.secret_key = secretKey;
    if (isActive !== undefined) updateData.is_active = isActive;

    // Update endpoint
    const [updatedEndpoint] = await knex('webhook_endpoints')
      .where('id', id)
      .update(updateData)
      .returning('*');

    res.json({
      success: true,
      message: 'Webhook endpoint updated successfully',
      data: {
        id: updatedEndpoint.id,
        name: updatedEndpoint.name,
        url: updatedEndpoint.url,
        event_types: JSON.parse(updatedEndpoint.event_types),
        is_active: updatedEndpoint.is_active,
        updated_at: updatedEndpoint.updated_at
      }
    });

  } catch (error) {
    console.error('Failed to update webhook endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update webhook endpoint',
      error: error.message
    });
  }
});

// DELETE /webhook-management/endpoints/:id - Delete webhook endpoint
router.delete('/endpoints/:id', authenticateToken, validateIdempotencyKey, idempotencyMiddleware, async (req, res) => {
  try {
    const { user } = req;
    const { id } = req.params;

    // Only admins and organizers can manage webhooks
    if (user.role !== 'admin' && user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators and organizers can manage webhooks.'
      });
    }

    // Check if endpoint exists
    const existingEndpoint = await knex('webhook_endpoints')
      .where('id', id)
      .first();

    if (!existingEndpoint) {
      return res.status(404).json({
        success: false,
        message: 'Webhook endpoint not found'
      });
    }

    // Delete endpoint
    await knex('webhook_endpoints')
      .where('id', id)
      .del();

    res.json({
      success: true,
      message: 'Webhook endpoint deleted successfully'
    });

  } catch (error) {
    console.error('Failed to delete webhook endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete webhook endpoint',
      error: error.message
    });
  }
});

// POST /webhook-management/retry-failed - Retry failed webhook deliveries
router.post('/retry-failed', authenticateToken, async (req, res) => {
  try {
    const { user } = req;

    // Only admins can retry failed webhooks
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can retry failed webhooks.'
      });
    }

    const retryCount = await WebhookService.retryFailedWebhooks();

    res.json({
      success: true,
      message: `Retried ${retryCount} failed webhook deliveries`,
      data: { retryCount }
    });

  } catch (error) {
    console.error('Failed to retry failed webhooks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retry failed webhooks',
      error: error.message
    });
  }
});

module.exports = router;
