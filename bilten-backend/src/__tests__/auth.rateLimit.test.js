const request = require('supertest');
const { app } = require('../server');

jest.setTimeout(20000);

describe('Auth rate limiting', () => {
  it('should return 429 after exceeding threshold for /api/v1/auth/login', async () => {
    // Use a distinct IP bucket to avoid interference with other tests
    const ip = '123.123.123.123';
    let got429 = false;
    for (let i = 0; i < 20; i++) {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('X-Forwarded-For', ip)
        .send({ email: 'nouser@example.com', password: 'wrongpassword' });
      if (res.status === 429) {
        got429 = true;
        break;
      }
    }
    expect(got429).toBe(true);
  });
});


