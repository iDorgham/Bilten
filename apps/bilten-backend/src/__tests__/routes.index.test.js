const request = require('supertest');
const { app } = require('../server');

describe('API index routes', () => {
  it('GET /api/v1 returns API metadata and endpoints', async () => {
    const res = await request(app).get('/api/v1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Bilten API v1');
    expect(res.body).toHaveProperty('version');
    expect(res.body).toHaveProperty('endpoints');
    expect(Object.keys(res.body.endpoints)).toEqual(
      expect.arrayContaining(['auth', 'events', 'tickets', 'users'])
    );
  });
});


