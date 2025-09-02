const request = require('supertest');
const { app } = require('../server');

describe('Users routes', () => {
  it('GET /api/v1/users/profile returns mock user', async () => {
    const res = await request(app).get('/api/v1/users/profile');
    expect(res.status).toBe(200);
    expect(res.body?.data?.user?.email).toBe('user@bilten.com');
  });

  it('PUT /api/v1/users/profile returns updated mock user', async () => {
    const res = await request(app).put('/api/v1/users/profile').send({ first_name: 'Updated' });
    expect(res.status).toBe(200);
    expect(res.body?.data?.user?.first_name).toBe('Updated');
  });
});


