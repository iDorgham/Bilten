const request = require('supertest');
const { app } = require('../server');

describe('Events routes', () => {
  it('GET /api/v1/events returns paginated events', async () => {
    const res = await request(app).get('/api/v1/events?limit=1&page=1');
    expect(res.status).toBe(200);
    expect(res.body?.data?.events?.length).toBe(1);
    expect(res.body?.data?.pagination).toEqual(
      expect.objectContaining({ page: 1, limit: 1, total: expect.any(Number), pages: expect.any(Number) })
    );
  });

  it('GET /api/v1/events/:id returns event or 404', async () => {
    const ok = await request(app).get('/api/v1/events/live-event-test-001');
    expect(ok.status).toBe(200);
    expect(ok.body?.data?.event?.id).toBe('live-event-test-001');

    const notFound = await request(app).get('/api/v1/events/not-exist');
    expect(notFound.status).toBe(404);
  });

  it('POST /api/v1/events creates draft event', async () => {
    const payload = { title: 'Test Event', location: 'Test Place', date: '2025-01-01' };
    const res = await request(app).post('/api/v1/events').send(payload);
    expect(res.status).toBe(201);
    expect(res.body?.data?.event).toEqual(expect.objectContaining({ title: 'Test Event', status: 'draft' }));
  });
});


