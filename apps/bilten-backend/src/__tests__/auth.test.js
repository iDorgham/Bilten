const request = require('supertest');
const { app } = require('../server');
const { query } = require('../database/connection');

describe('Authentication Endpoints', () => {
  let testUser = {
    email: 'test@example.com',
    password: 'testpassword123',
    first_name: 'Test',
    last_name: 'User'
  };

  let verificationToken;
  let accessToken;
  let refreshToken;

  beforeAll(async () => {
    // Clean up any existing test data
    await query('DELETE FROM users.users WHERE email = $1', [testUser.email]);
  });

  afterAll(async () => {
    // Clean up test data
    await query('DELETE FROM users.users WHERE email = $1', [testUser.email]);
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body.message).toContain('Registration successful');
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user.email_verified).toBe(false);
      expect(response.body.data.user.status).toBe('pending_verification');
    });

    it('should not register user with existing email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(409);

      expect(response.body.error).toBe('User Exists');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: '123', // too short
          first_name: '',
          last_name: ''
        })
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
      expect(response.body.details).toBeDefined();
    });
  });

  describe('POST /api/v1/auth/verify-email', () => {
    beforeAll(async () => {
      // Get verification token from database
      const tokenResult = await query(
        'SELECT token FROM authentication.verification_tokens WHERE user_id = (SELECT id FROM users.users WHERE email = $1) AND token_type = $2 ORDER BY created_at DESC LIMIT 1',
        [testUser.email, 'email']
      );
      verificationToken = tokenResult.rows[0]?.token;
    });

    it('should verify email with valid token', async () => {
      if (!verificationToken) {
        throw new Error('Verification token not found');
      }

      const response = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ token: verificationToken })
        .expect(200);

      expect(response.body.message).toContain('verified successfully');
      expect(response.body.data.user.email_verified).toBe(true);
      expect(response.body.data.user.status).toBe('active');
    });

    it('should not verify with invalid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ token: 'invalid-token' })
        .expect(400);

      expect(response.body.error).toBe('Invalid Token');
    });

    it('should not verify with used token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ token: verificationToken })
        .expect(400);

      expect(response.body.error).toBe('Invalid Token');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(response.body.message).toBe('Login successful');
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();

      accessToken = response.body.data.accessToken;
      refreshToken = response.body.data.refreshToken;
    });

    it('should not login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.error).toBe('Authentication Failed');
    });

    it('should not login unverified user', async () => {
      // Create unverified user
      const unverifiedUser = {
        email: 'unverified@example.com',
        password: 'password123',
        first_name: 'Unverified',
        last_name: 'User'
      };

      await request(app)
        .post('/api/v1/auth/register')
        .send(unverifiedUser);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: unverifiedUser.email,
          password: unverifiedUser.password
        })
        .expect(401);

      expect(response.body.message).toContain('verify your email');

      // Clean up
      await query('DELETE FROM users.users WHERE email = $1', [unverifiedUser.email]);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should get current user with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should not get user without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    it('should not get user with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('POST /api/v1/auth/refresh-token', () => {
    it('should refresh access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.user.email).toBe(testUser.email);

      // Update access token for further tests
      accessToken = response.body.data.accessToken;
    });

    it('should not refresh with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken: 'invalid-refresh-token' })
        .expect(401);

      expect(response.body.error).toBe('Invalid Token');
    });
  });

  describe('POST /api/v1/auth/resend-verification', () => {
    it('should not resend verification for already verified user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/resend-verification')
        .send({ email: testUser.email })
        .expect(400);

      expect(response.body.error).toBe('Already Verified');
    });

    it('should not resend verification for non-existent user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/resend-verification')
        .send({ email: 'nonexistent@example.com' })
        .expect(404);

      expect(response.body.error).toBe('User Not Found');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully with valid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.message).toBe('Logout successful');
    });

    it('should not access protected routes after logout', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);

      expect(response.body.message).toContain('Session not found');
    });
  });
});