const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/eventsController');
const auth = require('../middleware/auth');

// Public routes
router.get('/', eventsController.getAllEvents);
router.get('/:id', eventsController.getEventById);
router.get('/:id/tickets', eventsController.getEventTickets);

// Protected routes (require authentication)
router.post('/', auth.authenticateToken, eventsController.createEvent);
router.put('/:id', auth.authenticateToken, eventsController.updateEvent);
router.delete('/:id', auth.authenticateToken, eventsController.deleteEvent);

// Organizer routes
router.get('/organizer/my-events', auth.authenticateToken, eventsController.getMyEvents);
router.get('/:id/statistics', auth.authenticateToken, eventsController.getEventStatistics);

module.exports = router;