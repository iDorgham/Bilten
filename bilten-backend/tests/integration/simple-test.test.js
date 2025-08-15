const request = require('supertest');
const app = require('../../src/server');

describe('Simple Server Test', () => {
  it('should load the server without errors', () => {
    expect(app).toBeDefined();
  });

  it('should respond to health check', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body.success).toBe(true);
  });
});
