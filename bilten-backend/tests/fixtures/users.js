const bcrypt = require('bcryptjs');

const testUsers = {
  admin: {
    email: 'test-admin@bilten.com',
    password: 'testadmin123',
    firstName: 'Test',
    lastName: 'Admin',
    role: 'admin',
  },
  organizer: {
    email: 'test-organizer@bilten.com',
    password: 'testorganizer123',
    firstName: 'Test',
    lastName: 'Organizer',
    role: 'organizer',
  },
  user: {
    email: 'test-user@bilten.com',
    password: 'testuser123',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
  },
};

const createTestUser = async (userData) => {
  const passwordHash = await bcrypt.hash(userData.password, 12);
  
  return {
    email: userData.email,
    password_hash: passwordHash,
    first_name: userData.firstName,
    last_name: userData.lastName,
    role: userData.role,
    email_verified: true,
    created_at: new Date(),
    updated_at: new Date(),
  };
};

const createAllTestUsers = async () => {
  const users = {};
  
  for (const [key, userData] of Object.entries(testUsers)) {
    users[key] = await createTestUser(userData);
  }
  
  return users;
};

module.exports = {
  testUsers,
  createTestUser,
  createAllTestUsers,
};