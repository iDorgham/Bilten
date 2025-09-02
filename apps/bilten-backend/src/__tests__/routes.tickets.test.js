const request = require('supertest');
const { app } = require('../server');

describe('Tickets routes', () => {
  it('GET /api/v1/tickets/event/:eventId lists tickets for event', async () => {
    const res = await request(app).get('/api/v1/tickets/event/550e8400-e29b-41d4-a716-446655440101');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body?.data?.tickets)).toBe(true);
  });

  it('GET /api/v1/tickets/:id returns ticket or 404', async () => {
    const ok = await request(app).get('/api/v1/tickets/1');
    expect(ok.status).toBe(200);

    const notFound = await request(app).get('/api/v1/tickets/9999');
    expect(notFound.status).toBe(404);
  });

  it('POST /api/v1/tickets/validate handles missing and used states', async () => {
    // Not found
    const nf = await request(app).post('/api/v1/tickets/validate').send({ ticketId: 'nope', eventId: 'x', timestamp: Date.now() });
    expect(nf.status).toBe(404);

    // Valid path then used path
    const valid = await request(app).post('/api/v1/tickets/validate').send({ ticketId: 'ticket-001', eventId: 'live-event-test-001', timestamp: Date.now() });
    expect(valid.status).toBe(200);
    expect(valid.body.valid).toBe(true);

    const used = await request(app).post('/api/v1/tickets/validate').send({ ticketId: 'ticket-001', eventId: 'live-event-test-001', timestamp: Date.now() });
    expect(used.status).toBe(200);
    expect(used.body.valid).toBe(false);
    expect(used.body.error).toBe('TICKET_ALREADY_USED');
  });
});


