const request = require('supertest');
const { app } = require('../server');

describe('Auth routes', () => {
  it('POST /api/v1/auth/login validates input', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'bad', password: '123' });
    expect(res.status).toBe(400);
  });

  it('POST /api/v1/auth/login rejects unknown user', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'nouser@example.com', password: 'password123' });
    expect(res.status).toBe(401);
  });

  it('POST /api/v1/auth/login accepts valid admin credentials', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'admin@bilten.com', password: 'admin123' });
    expect(res.status).toBe(200);
    expect(res.body?.data?.token).toBeTruthy();
    expect(res.body?.data?.user?.role).toBe('admin');
  });

  it('POST /api/v1/auth/register validates and creates user', async () => {
    const invalid = await request(app).post('/api/v1/auth/register').send({ email: 'x', password: '1', first_name: 'a', last_name: 'b' });
    expect(invalid.status).toBe(400);

    const ok = await request(app).post('/api/v1/auth/register').send({ email: 'newuser@example.com', password: 'password123', first_name: 'New', last_name: 'User' });
    expect(ok.status).toBe(201);
    expect(ok.body?.data?.user?.email).toBe('newuser@example.com');
    expect(ok.body?.data?.token).toBeTruthy();
  });
});


