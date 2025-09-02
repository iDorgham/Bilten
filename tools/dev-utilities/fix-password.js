const bcrypt = require('bcryptjs');

async function fixPassword() {
  const password = 'admin123';
  const hash = await bcrypt.hash(password, 10);
  
  console.log('Password:', password);
  console.log('Hash:', hash);
  
  // Test the hash
  const isValid = await bcrypt.compare(password, hash);
  console.log('Hash validation:', isValid);
  
  // Generate SQL command
  console.log('\nSQL Commands:');
  console.log(`UPDATE users.users SET password_hash = '${hash}' WHERE email = 'admin@bilten.com';`);
  console.log(`UPDATE users.users SET password_hash = '${hash}' WHERE email = 'user@bilten.com';`);
}

fixPassword().catch(console.error);
