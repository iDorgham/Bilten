const request = require('supertest');
const { app } = require('../server');

describe('Health endpoint', () => {
  it('GET /health should return 200 with status OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'OK');
  });
});


