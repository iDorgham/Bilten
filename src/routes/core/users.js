const express = require('express');
const knex = require('../../utils/database');
const { authenticateToken } = require('../../middleware/auth');

const router = express.Router();

// GET /users/profile - Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await knex('users')
      .select(['id', 'email', 'first_name', 'last_name', 'phone', 'bio', 'profile_image_url', 'role', 'email_verified'])
      .where('id', req.user.id)
      .first();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PUT /users/profile - Update current user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const updateData = {};
    const allowedFields = ['first_name', 'last_name', 'phone', 'bio', 'profile_image_url'];

    // Only update provided fields
    Object.keys(req.body).forEach(key => {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (allowedFields.includes(snakeKey)) {
        updateData[snakeKey] = req.body[key];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    const [updatedUser] = await knex('users')
      .where('id', req.user.id)
      .update(updateData)
      .returning(['id', 'email', 'first_name', 'last_name', 'phone', 'bio', 'profile_image_url', 'role']);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /users/:id - Get user by ID (public profile)
router.get('/:id', async (req, res) => {
  try {
    const user = await knex('users')
      .select(['id', 'first_name', 'last_name', 'bio', 'profile_image_url'])
      .where('id', req.params.id)
      .first();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;