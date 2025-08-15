const express = require('express');
const QRController = require('../../controllers/qrController');
const { authenticateToken, requireRole } = require('../../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/v1/qr/tickets/{ticketId}:
 *   get:
 *     summary: Generate QR code for a specific ticket
 *     tags: [QR Codes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *         description: Ticket ID
 *     responses:
 *       200:
 *         description: QR code generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     qr_code:
 *                       type: string
 *                       description: Base64 encoded QR code image
 *                     ticket:
 *                       type: object
 *       404:
 *         description: Ticket not found
 *       400:
 *         description: Ticket is not active
 */
router.get('/tickets/:ticketId', authenticateToken, QRController.generateTicketQR);

/**
 * @swagger
 * /api/v1/qr/validate:
 *   post:
 *     summary: Validate QR code for event entry
 *     tags: [QR Codes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - qrData
 *             properties:
 *               qrData:
 *                 type: string
 *                 description: QR code data to validate
 *     responses:
 *       200:
 *         description: Ticket validated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     ticket:
 *                       type: object
 *       400:
 *         description: Invalid QR code or ticket already used
 *       404:
 *         description: Ticket not found
 */
router.post('/validate', authenticateToken, QRController.validateQRCode);

/**
 * @swagger
 * /api/v1/qr/bulk:
 *   post:
 *     summary: Generate QR codes for multiple tickets
 *     tags: [QR Codes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ticketIds
 *             properties:
 *               ticketIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of ticket IDs
 *     responses:
 *       200:
 *         description: QR codes generated successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: No valid tickets found
 */
router.post('/bulk', authenticateToken, QRController.generateBulkQRCodes);

/**
 * @swagger
 * /api/v1/qr/stats/{eventId}:
 *   get:
 *     summary: Get QR code statistics for an event (organizer only)
 *     tags: [QR Codes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     event_id:
 *                       type: string
 *                     event_title:
 *                       type: string
 *                     total_tickets:
 *                       type: integer
 *                     used_tickets:
 *                       type: integer
 *                     active_tickets:
 *                       type: integer
 *                     usage_rate:
 *                       type: integer
 *                     status_breakdown:
 *                       type: array
 *       403:
 *         description: Access denied - not the event organizer
 */
router.get('/stats/:eventId', authenticateToken, requireRole(['organizer', 'admin']), QRController.getQRCodeStats);

/**
 * @swagger
 * /api/v1/qr/scanner/validate:
 *   post:
 *     summary: Validate QR code for event entry (scanner endpoint)
 *     tags: [QR Codes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - qrData
 *             properties:
 *               qrData:
 *                 type: string
 *                 description: QR code data to validate
 *     responses:
 *       200:
 *         description: Ticket validated successfully
 *       400:
 *         description: Invalid QR code or ticket already used
 *       404:
 *         description: Ticket not found
 */
router.post('/scanner/validate', authenticateToken, requireRole(['organizer', 'admin']), QRController.validateQRCode);

module.exports = router;
