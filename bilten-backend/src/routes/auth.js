const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const xss = require('xss');
const router = express.Router();

// Mock user database (replace with real database)
const users = [
  {
    id: 1,
    email: 'admin@bilten.com',
    password: '$2a$12$tbTWbz5IZpC6iiI2nmKCW.QLinC3FGH8ABPcvlZNH.hPtaSccYbpS', // admin123
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin',
    is_verified: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    email: 'user@bilten.com',
    password: '$2a$12$tbTWbz5IZpC6iiI2nmKCW.QLinC3FGH8ABPcvlZNH.hPtaSccYbpS', // user123
    first_name: 'Regular',
    last_name: 'User',
    role: 'user',
    is_verified: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 3,
    email: 'organizer@bilten.com',
    password: '$2a$12$tbTWbz5IZpC6iiI2nmKCW.QLinC3FGH8ABPcvlZNH.hPtaSccYbpS', // organizer123
    first_name: 'Event',
    last_name: 'Organizer',
    role: 'organizer',
    is_verified: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

// Validation middleware
const validateLogin = [
  body('email').isString().trim().isEmail().normalizeEmail(),
  body('password').isString().isLength({ min: 8, max: 128 })
];

const validateRegister = [
  body('email').isString().trim().isEmail().normalizeEmail(),
  body('password').isString().isLength({ min: 8, max: 128 }),
  body('first_name').isString().trim().isLength({ min: 2, max: 50 }).escape(),
  body('last_name').isString().trim().isLength({ min: 2, max: 50 }).escape()
];

// Login endpoint
router.post('/login', validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid input data',
        details: errors.array()
      });
    }

    const email = xss(req.body.email);
    const password = req.body.password;

    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      data: {
        user: userWithoutPassword,
        token: token
      },
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Login failed'
    });
  }
});

// Register endpoint
router.post('/register', validateRegister, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid input data',
        details: errors.array()
      });
    }

    const email = xss(req.body.email);
    const password = req.body.password;
    const first_name = xss(req.body.first_name);
    const last_name = xss(req.body.last_name);

    // Check if user already exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(409).json({
        error: 'User Exists',
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const newUser = {
      id: users.length + 1,
      email,
      password: hashedPassword,
      first_name,
      last_name,
      role: 'user',
      is_verified: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    users.push(newUser);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: newUser.id, 
        email: newUser.email, 
        role: newUser.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      data: {
        user: userWithoutPassword,
        token: token
      },
      message: 'Registration successful'
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Registration failed'
    });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  // In a real application, you might want to blacklist the token
  res.json({
    message: 'Logout successful'
  });
});

// Get current user
router.get('/me', (req, res) => {
  // This would typically use middleware to verify JWT token
  res.json({
    message: 'Get current user endpoint - implement JWT middleware'
  });
});

// Forgot password endpoint
router.post('/forgot-password', [
  body('email').isString().trim().isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid email address',
        details: errors.array()
      });
    }

    const email = xss(req.body.email);

    // Check if user exists
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'User with this email does not exist'
      });
    }

    // Generate reset token (in production, this would be a secure token with expiration)
    const resetToken = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        type: 'password_reset'
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    // In production, you would:
    // 1. Store the reset token in database with expiration
    // 2. Send email with reset link
    // 3. Use a proper email service (SendGrid, AWS SES, etc.)

    console.log(`Password reset requested for ${email}. Reset token: ${resetToken}`);

    res.json({
      message: 'Password reset email sent. Check your email for reset instructions.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process password reset request'
    });
  }
});

// Reset password endpoint
router.post('/reset-password', [
  body('token').isString().notEmpty(),
  body('newPassword').isString().isLength({ min: 8, max: 128 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid input data',
        details: errors.array()
      });
    }

    const token = req.body.token;
    const newPassword = req.body.newPassword;

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      return res.status(400).json({
        error: 'Invalid Token',
        message: 'Invalid or expired reset token'
      });
    }

    // Check if token is for password reset
    if (decoded.type !== 'password_reset') {
      return res.status(400).json({
        error: 'Invalid Token',
        message: 'Invalid token type'
      });
    }

    // Find user
    const user = users.find(u => u.id === decoded.userId);
    if (!user) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'User not found'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password
    user.password = hashedPassword;
    user.updated_at = new Date().toISOString();

    // In production, you would:
    // 1. Update password in database
    // 2. Invalidate all existing sessions
    // 3. Send confirmation email

    console.log(`Password reset successful for user ${user.email}`);

    res.json({
      message: 'Password reset successful'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to reset password'
    });
  }
});

module.exports = router;
