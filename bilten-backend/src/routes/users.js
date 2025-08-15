const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const auth = require('../middleware/auth');

// Protected routes (require authentication)
router.get('/profile', auth.authenticateToken, usersController.getProfile);
router.put('/profile', auth.authenticateToken, usersController.updateProfile);
router.put('/change-password', auth.authenticateToken, usersController.changePassword);

// Admin routes
router.get('/', auth.authenticateToken, auth.requireRole('admin'), usersController.getAllUsers);
router.get('/:id', auth.authenticateToken, auth.requireRole('admin'), usersController.getUserById);
router.delete('/:id', auth.authenticateToken, auth.requireRole('admin'), usersController.deleteUser);

module.exports = router;