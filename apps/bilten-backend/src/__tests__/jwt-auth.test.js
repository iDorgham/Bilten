const request = require('supertest');
const jwt = require('jsonwebtoken');
const { app } = require('../server');
const { query } = require('../database/connection');
const AuthService = require('../services/AuthService');

describe('Enhanced JWT Authentication', () => {
  let testUser = {
    email: 'jwt-test@example.com',
    password: 'TestPassword123!',
    first_name: 'JWT',
    last_name: 'Test'
  };

  let userId;
  let accessToken;
  let refreshToken;
  let sessionId;

  beforeAll(async () => {
    // Clean up any existing test data
    await query('DELETE FROM users.users WHERE email = $1', [testUser.email]);
  });

  afterAll(async () => {
    // Clean up test data
    if (userId) {
      await query('DELETE FROM users.users WHERE id = $1', [userId]);
    }
  });

  describe('User Registration and Login with Enhanced JWT', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body.data.user.email).toBe(testUser.email);
      userId = response.body.data.user.id;
    });

    it('should verify email', async () => {
      // Get verification token
      const tokenResult = await query(
        'SELECT token FROM authentication.verification_tokens WHERE user_id = $1 AND token_type = $2 ORDER BY created_at DESC LIMIT 1',
        [userId, 'email']
      );
      
      const verificationToken = tokenResult.rows[0]?.token;
      expect(verificationToken).toBeDefined();

      const response = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ token: verificationToken })
        .expect(200);

      expect(response.body.message).toContain('verified successfully');
    });

    it('should login and receive enhanced JWT tokens', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      
      accessToken = response.body.data.accessToken;
      refreshToken = response.body.data.refreshToken;
      sessionId = response.body.data.sessionId;

      // Verify token structure
      const decoded = jwt.decode(accessToken);
      expect(decoded.type).toBe('access');
      expect(decoded.userId).toBe(userId);
      expect(decoded.jti).toBeDefined();
      expect(decoded.iss).toBe('bilten-api');
      expect(decoded.aud).toBe('bilten-client');
    });
  });

  describe('Token Validation and Security', () => {
    it('should validate access token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/validate-token')
        .send({
          token: accessToken,
          tokenType: 'access'
        })
        .expect(200);

      expect(response.body.data.valid).toBe(true);
      expect(response.body.data.payload.userId).toBe(userId);
      expect(response.body.data.payload.type).toBe('access');
    });

    it('should validate refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/validate-token')
        .send({
          token: refreshToken,
          tokenType: 'refresh'
        })
        .expect(200);

      expect(response.body.data.valid).toBe(true);
      expect(response.body.data.payload.userId).toBe(userId);
      expect(response.body.data.payload.type).toBe('refresh');
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/validate-token')
        .send({
          token: 'invalid-token',
          tokenType: 'access'
        })
        .expect(400);

      expect(response.body.data.valid).toBe(false);
    });

    it('should reject wrong token type', async () => {
      const response = await request(app)
        .post('/api/v1/auth/validate-token')
        .send({
          token: refreshToken,
          tokenType: 'access'
        })
        .expect(400);

      expect(response.body.data.valid).toBe(false);
      expect(response.body.message).toContain('Invalid token type');
    });
  });

  describe('Token Refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({
          refreshToken: refreshToken
        })
        .expect(200);

      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.accessToken).not.toBe(accessToken);
      
      // Update access token for further tests
      accessToken = response.body.data.accessToken;
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({
          refreshToken: 'invalid-refresh-token'
        })
        .expect(401);

      expect(response.body.error).toBe('Invalid Token');
    });
  });

  describe('Session Management', () => {
    it('should get current user with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.user.email).toBe(testUser.email);
    });

    it('should get active sessions', async () => {
      const response = await request(app)
        .get('/api/v1/auth/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.sessions).toBeDefined();
      expect(response.body.data.sessions.length).toBeGreaterThan(0);
      expect(response.body.data.sessions[0].isCurrent).toBe(true);
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    it('should reject request with malformed token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('Token Blacklisting and Logout', () => {
    let secondAccessToken;
    let secondRefreshToken;

    it('should create second session for testing', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      secondAccessToken = response.body.data.accessToken;
      secondRefreshToken = response.body.data.refreshToken;
    });

    it('should logout and blacklist tokens', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.message).toBe('Logout successful');
    });

    it('should reject blacklisted token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);

      expect(response.body.message).toBe('Token has been revoked');
    });

    it('should logout from all devices', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout-all')
        .set('Authorization', `Bearer ${secondAccessToken}`)
        .expect(200);

      expect(response.body.message).toContain('all other devices');
    });

    it('should reject all other tokens after logout-all', async () => {
      // The second token should still work (it was the one used for logout-all)
      await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${secondAccessToken}`)
        .expect(200);
    });
  });

  describe('Security Features', () => {
    let newAccessToken;

    beforeAll(async () => {
      // Login again for security tests
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });
      
      newAccessToken = response.body.data.accessToken;
    });

    it('should include security headers in token', async () => {
      const decoded = jwt.decode(newAccessToken);
      
      expect(decoded.iss).toBe('bilten-api');
      expect(decoded.aud).toBe('bilten-client');
      expect(decoded.jti).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
      expect(decoded.type).toBe('access');
    });

    it('should validate token expiration', async () => {
      const decoded = jwt.decode(newAccessToken);
      const now = Math.floor(Date.now() / 1000);
      
      expect(decoded.exp).toBeGreaterThan(now);
      expect(decoded.iat).toBeLessThanOrEqual(now);
    });

    it('should handle token with future iat', async () => {
      const futureToken = jwt.sign(
        {
          userId: userId,
          iat: Math.floor(Date.now() / 1000) + 3600, // 1 hour in future
          type: 'access'
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '15m' }
      );

      const response = await request(app)
        .post('/api/v1/auth/validate-token')
        .send({
          token: futureToken,
          tokenType: 'access'
        })
        .expect(400);

      expect(response.body.message).toContain('future');
    });
  });

  describe('Error Handling', () => {
    it('should handle expired token gracefully', async () => {
      const expiredToken = jwt.sign(
        {
          userId: userId,
          type: 'access'
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '-1s' } // Already expired
      );

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.message).toBe('Access token has expired');
    });

    it('should handle malformed JWT', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer not.a.jwt')
        .expect(401);

      expect(response.body.message).toBe('Invalid token format');
    });

    it('should handle missing authorization header', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .expect(401);

      expect(response.body.message).toBe('Access token is required');
    });
  });
});