const bcrypt = require('bcryptjs');

async function generateSimpleHash() {
  const password = 'admin123';
  const hash = await bcrypt.hash(password, 8); // Lower rounds for shorter hash
  
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('Hash length:', hash.length);
  
  // Test the hash
  const isValid = await bcrypt.compare(password, hash);
  console.log('Hash validation:', isValid);
  
  // Try a different approach - use a simple hash for testing
  const simpleHash = '$2a$08$rQZ9K8mN2pL7vX1wY3sA6eB4cF8gH2jK5mN7pQ9rS3tU6vW8xY1zA4bC7dE0fG';
  const isSimpleValid = await bcrypt.compare(password, simpleHash);
  console.log('Simple hash validation:', isSimpleValid);
}

generateSimpleHash().catch(console.error);
