const express = require('express');
const router = express.Router();

// Get user profile
router.get('/profile', (req, res) => {
  // This would typically use authentication middleware
  res.json({
    data: {
      user: {
        id: 1,
        email: 'user@bilten.com',
        first_name: 'Regular',
        last_name: 'User',
        role: 'user',
        is_verified: true
      }
    }
  });
});

// Update user profile
router.put('/profile', (req, res) => {
  // This would typically use authentication middleware
  res.json({
    data: {
      user: {
        id: 1,
        email: 'user@bilten.com',
        first_name: 'Updated',
        last_name: 'User',
        role: 'user',
        is_verified: true
      }
    },
    message: 'Profile updated successfully'
  });
});

module.exports = router;
