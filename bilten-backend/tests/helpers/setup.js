// Test setup file
process.env.NODE_ENV = 'test';

// Set test environment variables
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5433';
process.env.DB_NAME = 'bilten_test';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'password';

// Global test timeout
jest.setTimeout(10000);

// Clean up after tests
afterAll(async () => {
  // Close any open connections
  if (global.__KNEX__) {
    await global.__KNEX__.destroy();
  }
});