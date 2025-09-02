#!/usr/bin/env node

/**
 * MFA Integration Test Script
 * 
 * This script tests the complete Multi-Factor Authentication implementation
 * including TOTP, SMS, and backup codes functionality.
 */

const axios = require('axios');
const crypto = require('crypto');

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api/v1';
const TEST_USER = {
  email: 'test@bilten.com',
  password: 'TestPassword123!',
  name: 'Test User'
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function runTest(testName, testFunction) {
  try {
    log(`Running test: ${testName}`);
    await testFunction();
    testResults.passed++;
    log(`Test passed: ${testName}`, 'success');
  } catch (error) {
    testResults.failed++;
    testResults.errors.push({ test: testName, error: error.message });
    log(`Test failed: ${testName} - ${error.message}`, 'error');
  }
}

// TOTP token generation (for testing)
function generateTOTPToken(secret, time = Math.floor(Date.now() / 30000)) {
  const key = Buffer.from(secret, 'base32');
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(time), 0);
  
  const hmac = crypto.createHmac('sha1', key);
  hmac.update(message);
  const hash = hmac.digest();
  
  const offset = hash[hash.length - 1] & 0xf;
  const code = ((hash[offset] & 0x7f) << 24) |
               ((hash[offset + 1] & 0xff) << 16) |
               ((hash[offset + 2] & 0xff) << 8) |
               (hash[offset + 3] & 0xff);
  
  return (code % 1000000).toString().padStart(6, '0');
}

// Test functions
async function testUserRegistration() {
  const response = await axios.post(`${BASE_URL}/auth/register`, TEST_USER);
  assert(response.status === 201, 'User registration failed');
  assert(response.data.success, 'Registration response should indicate success');
  log('User registered successfully');
  return response.data.data.user;
}

async function testUserLogin() {
  const response = await axios.post(`${BASE_URL}/auth/login`, {
    email: TEST_USER.email,
    password: TEST_USER.password
  });
  assert(response.status === 200, 'User login failed');
  assert(response.data.success, 'Login response should indicate success');
  log('User logged in successfully');
  return response.data.data;
}

async function testTOTPSetup(accessToken) {
  const response = await axios.post(`${BASE_URL}/mfa/setup/totp`, {}, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  assert(response.status === 200, 'TOTP setup failed');
  assert(response.data.success, 'TOTP setup should indicate success');
  assert(response.data.data.secret, 'TOTP secret should be returned');
  assert(response.data.data.qrCodeUrl, 'QR code URL should be returned');
  assert(response.data.data.backupCodes, 'Backup codes should be returned');
  log('TOTP setup completed successfully');
  return response.data.data;
}

async function testTOTPEnable(accessToken, secret) {
  const token = generateTOTPToken(secret);
  const response = await axios.post(`${BASE_URL}/mfa/enable/totp`, {
    token: token
  }, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  assert(response.status === 200, 'TOTP enable failed');
  assert(response.data.success, 'TOTP enable should indicate success');
  log('TOTP enabled successfully');
}

async function testMFAStatus(accessToken) {
  const response = await axios.get(`${BASE_URL}/mfa/status`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  assert(response.status === 200, 'MFA status check failed');
  assert(response.data.success, 'MFA status should indicate success');
  assert(response.data.data.enabled, 'MFA should be enabled');
  assert(response.data.data.totpEnabled, 'TOTP should be enabled');
  log('MFA status verified successfully');
  return response.data.data;
}

async function testLoginWithMFA() {
  // First login attempt should require MFA
  const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
    email: TEST_USER.email,
    password: TEST_USER.password
  });
  assert(loginResponse.status === 200, 'Login failed');
  assert(loginResponse.data.requiresMFA, 'Login should require MFA');
  assert(loginResponse.data.userId, 'User ID should be returned');
  log('Login correctly requires MFA');
  return loginResponse.data;
}

async function testTOTPVerification(userId, secret) {
  const token = generateTOTPToken(secret);
  const response = await axios.post(`${BASE_URL}/mfa/verify/totp`, {
    userId: userId,
    token: token
  });
  assert(response.status === 200, 'TOTP verification failed');
  assert(response.data.success, 'TOTP verification should indicate success');
  log('TOTP verification successful');
}

async function testBackupCodeVerification(userId, backupCodes) {
  const backupCode = backupCodes[0];
  const response = await axios.post(`${BASE_URL}/mfa/verify/backup`, {
    userId: userId,
    code: backupCode
  });
  assert(response.status === 200, 'Backup code verification failed');
  assert(response.data.success, 'Backup code verification should indicate success');
  log('Backup code verification successful');
}

async function testCompleteLoginWithMFA(userId, secret) {
  const token = generateTOTPToken(secret);
  const response = await axios.post(`${BASE_URL}/auth/verify-mfa`, {
    userId: userId,
    method: 'totp',
    token: token
  });
  assert(response.status === 200, 'Complete login with MFA failed');
  assert(response.data.success, 'Complete login should indicate success');
  assert(response.data.data.accessToken, 'Access token should be returned');
  assert(response.data.data.refreshToken, 'Refresh token should be returned');
  log('Complete login with MFA successful');
  return response.data.data;
}

async function testBackupCodesGeneration(accessToken) {
  const response = await axios.post(`${BASE_URL}/mfa/backup-codes/generate`, {}, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  assert(response.status === 200, 'Backup codes generation failed');
  assert(response.data.success, 'Backup codes generation should indicate success');
  assert(response.data.data.backupCodes, 'New backup codes should be returned');
  assert(response.data.data.backupCodes.length === 10, 'Should generate 10 backup codes');
  log('New backup codes generated successfully');
  return response.data.data.backupCodes;
}

async function testBackupCodesRetrieval(accessToken) {
  const response = await axios.get(`${BASE_URL}/mfa/backup-codes`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  assert(response.status === 200, 'Backup codes retrieval failed');
  assert(response.data.success, 'Backup codes retrieval should indicate success');
  assert(response.data.data.backupCodes, 'Backup codes should be returned');
  log('Backup codes retrieved successfully (masked)');
}

async function testSMSSend(accessToken) {
  const response = await axios.post(`${BASE_URL}/mfa/sms/send`, {
    phoneNumber: '+1234567890'
  }, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  assert(response.status === 200, 'SMS send failed');
  assert(response.data.success, 'SMS send should indicate success');
  assert(response.data.code, 'SMS code should be returned (for testing)');
  log('SMS verification code sent successfully');
  return response.data.code;
}

async function testSMSVerification(userId, code) {
  const response = await axios.post(`${BASE_URL}/mfa/sms/verify`, {
    userId: userId,
    code: code
  });
  assert(response.status === 200, 'SMS verification failed');
  assert(response.data.success, 'SMS verification should indicate success');
  log('SMS verification successful');
}

async function testInvalidTOTPToken(userId) {
  try {
    await axios.post(`${BASE_URL}/mfa/verify/totp`, {
      userId: userId,
      token: '000000'
    });
    throw new Error('Should have failed with invalid token');
  } catch (error) {
    assert(error.response.status === 400, 'Should return 400 for invalid token');
    log('Invalid TOTP token correctly rejected');
  }
}

async function testInvalidBackupCode(userId) {
  try {
    await axios.post(`${BASE_URL}/mfa/verify/backup`, {
      userId: userId,
      code: 'INVALID1'
    });
    throw new Error('Should have failed with invalid backup code');
  } catch (error) {
    assert(error.response.status === 400, 'Should return 400 for invalid backup code');
    log('Invalid backup code correctly rejected');
  }
}

async function testTOTPDisable(accessToken) {
  const response = await axios.post(`${BASE_URL}/mfa/disable/totp`, {}, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  assert(response.status === 200, 'TOTP disable failed');
  assert(response.data.success, 'TOTP disable should indicate success');
  log('TOTP disabled successfully');
}

async function testMFAStatusAfterDisable(accessToken) {
  const response = await axios.get(`${BASE_URL}/mfa/status`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  assert(response.status === 200, 'MFA status check failed');
  assert(response.data.success, 'MFA status should indicate success');
  assert(!response.data.data.enabled, 'MFA should be disabled');
  assert(!response.data.data.totpEnabled, 'TOTP should be disabled');
  log('MFA status correctly shows disabled state');
}

// Main test execution
async function runAllTests() {
  log('🚀 Starting MFA Integration Tests', 'info');
  log('=====================================', 'info');

  let user, loginData, totpData, accessToken, backupCodes, smsCode;

  // Test 1: User Registration
  await runTest('User Registration', async () => {
    user = await testUserRegistration();
  });

  // Test 2: Initial Login (without MFA)
  await runTest('Initial Login', async () => {
    loginData = await testUserLogin();
    accessToken = loginData.accessToken;
  });

  // Test 3: TOTP Setup
  await runTest('TOTP Setup', async () => {
    totpData = await testTOTPSetup(accessToken);
    backupCodes = totpData.backupCodes;
  });

  // Test 4: TOTP Enable
  await runTest('TOTP Enable', async () => {
    await testTOTPEnable(accessToken, totpData.secret);
  });

  // Test 5: MFA Status Check
  await runTest('MFA Status Check', async () => {
    await testMFAStatus(accessToken);
  });

  // Test 6: Login with MFA Required
  await runTest('Login with MFA Required', async () => {
    await testLoginWithMFA();
  });

  // Test 7: TOTP Verification
  await runTest('TOTP Verification', async () => {
    await testTOTPVerification(user.id, totpData.secret);
  });

  // Test 8: Complete Login with MFA
  await runTest('Complete Login with MFA', async () => {
    const newLoginData = await testCompleteLoginWithMFA(user.id, totpData.secret);
    accessToken = newLoginData.accessToken;
  });

  // Test 9: Backup Code Verification
  await runTest('Backup Code Verification', async () => {
    await testBackupCodeVerification(user.id, backupCodes);
  });

  // Test 10: Generate New Backup Codes
  await runTest('Generate New Backup Codes', async () => {
    await testBackupCodesGeneration(accessToken);
  });

  // Test 11: Retrieve Backup Codes (Masked)
  await runTest('Retrieve Backup Codes', async () => {
    await testBackupCodesRetrieval(accessToken);
  });

  // Test 12: SMS Send
  await runTest('SMS Send', async () => {
    smsCode = await testSMSSend(accessToken);
  });

  // Test 13: SMS Verification
  await runTest('SMS Verification', async () => {
    await testSMSVerification(user.id, smsCode);
  });

  // Test 14: Invalid TOTP Token
  await runTest('Invalid TOTP Token Rejection', async () => {
    await testInvalidTOTPToken(user.id);
  });

  // Test 15: Invalid Backup Code
  await runTest('Invalid Backup Code Rejection', async () => {
    await testInvalidBackupCode(user.id);
  });

  // Test 16: TOTP Disable
  await runTest('TOTP Disable', async () => {
    await testTOTPDisable(accessToken);
  });

  // Test 17: MFA Status After Disable
  await runTest('MFA Status After Disable', async () => {
    await testMFAStatusAfterDisable(accessToken);
  });

  // Test Summary
  log('=====================================', 'info');
  log(`Test Results: ${testResults.passed} passed, ${testResults.failed} failed`, 'info');
  
  if (testResults.errors.length > 0) {
    log('Failed Tests:', 'error');
    testResults.errors.forEach(error => {
      log(`  - ${error.test}: ${error.error}`, 'error');
    });
  }

  if (testResults.failed === 0) {
    log('🎉 All MFA tests passed successfully!', 'success');
  } else {
    log(`⚠️  ${testResults.failed} test(s) failed. Please review the errors above.`, 'error');
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    log(`Test execution failed: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testResults
};
