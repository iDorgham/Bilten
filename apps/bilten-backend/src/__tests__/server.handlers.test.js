const request = require('supertest');
const { app } = require('../server');

describe('server.js handlers', () => {
  it('returns 404 JSON for unknown routes', async () => {
    const res = await request(app).get('/definitely-not-found');
    expect(res.status).toBe(404);
    expect(res.body).toEqual(
      expect.objectContaining({ error: 'Not Found', message: expect.stringContaining('/definitely-not-found') })
    );
  });

  it('invokes error handler on malformed JSON body', async () => {
    const res = await request(app)
      .post('/api/v1/events')
      .set('Content-Type', 'application/json')
      .send('{"bad json"');
    // Body parser should throw -> our error handler responds with 400/500
    expect([400, 500]).toContain(res.status);
    expect(res.body).toHaveProperty('error', 'Internal Server Error');
    expect(res.body).toHaveProperty('message');
  });
});


