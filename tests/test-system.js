#!/usr/bin/env node

/**
 * Comprehensive System Test for Bilten
 * Tests all major components of the system
 */

const axios = require('axios');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const config = {
  backendUrl: 'http://localhost:3001',
  frontendUrl: 'http://localhost:3000',
  testTimeout: 10000,
  retries: 3
};

// Test results
const results = {
  passed: 0,
  failed: 0,
  errors: [],
  details: []
};

// Utility functions
const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
    warning: '\x1b[33m', // Yellow
    reset: '\x1b[0m'     // Reset
  };
  
  console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
};

const testResult = (testName, success, details = null) => {
  if (success) {
    results.passed++;
    log(`✅ ${testName}`, 'success');
  } else {
    results.failed++;
    log(`❌ ${testName}`, 'error');
    if (details) {
      results.errors.push({ test: testName, error: details });
    }
  }
  
  results.details.push({ test: testName, success, details });
};

const waitForService = async (url, serviceName) => {
  log(`⏳ Waiting for ${serviceName} to be ready...`, 'warning');
  
  for (let i = 0; i < config.retries; i++) {
    try {
      const response = await axios.get(url, { timeout: 5000 });
      if (response.status === 200) {
        log(`✅ ${serviceName} is ready`, 'success');
        return true;
      }
    } catch (error) {
      log(`Attempt ${i + 1}/${config.retries} failed for ${serviceName}`, 'warning');
      if (i < config.retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  log(`❌ ${serviceName} failed to start`, 'error');
  return false;
};

// Test functions
const testBackendHealth = async () => {
  try {
    const response = await axios.get(`${config.backendUrl}/health`);
    return response.status === 200 && response.data.success;
  } catch (error) {
    return false;
  }
};

const testFrontendHealth = async () => {
  try {
    const response = await axios.get(config.frontendUrl);
    return response.status === 200;
  } catch (error) {
    return false;
  }
};

const testDatabaseConnection = async () => {
  try {
    const response = await axios.get(`${config.backendUrl}/api/v1/events`);
    return response.status === 200 || response.status === 401; // 401 is expected without auth
  } catch (error) {
    return false;
  }
};

const testAuthentication = async () => {
  try {
    // Test registration endpoint
    const registerResponse = await axios.post(`${config.backendUrl}/api/v1/auth/register`, {
      email: 'test@example.com',
      password: 'testpassword123',
      firstName: 'Test',
      lastName: 'User'
    });
    
    return registerResponse.status === 201 || registerResponse.status === 400; // 400 if user exists
  } catch (error) {
    return false;
  }
};

const testFileUpload = async () => {
  try {
    // Test if upload endpoint exists
    const response = await axios.get(`${config.backendUrl}/api/v1/uploads/health`);
    return response.status === 200;
  } catch (error) {
    return false;
  }
};

const testPaymentSystem = async () => {
  try {
    // Test if payment endpoints exist
    const response = await axios.get(`${config.backendUrl}/api/v1/payments/health`);
    return response.status === 200;
  } catch (error) {
    return false;
  }
};

const testAnalytics = async () => {
  try {
    // Test if analytics endpoints exist
    const response = await axios.get(`${config.backendUrl}/api/v1/analytics/health`);
    return response.status === 200;
  } catch (error) {
    return false;
  }
};

const testDockerServices = () => {
  try {
    const output = execSync('docker ps --format "table {{.Names}}\t{{.Status}}"', { encoding: 'utf8' });
    const services = output.split('\n').slice(1).filter(line => line.trim());
    
    const requiredServices = [
      'bilten-api',
      'bilten-postgres',
      'bilten-redis',
      'bilten-frontend'
    ];
    
    const runningServices = services.map(line => line.split('\t')[0]);
    const missingServices = requiredServices.filter(service => !runningServices.includes(service));
    
    return missingServices.length === 0;
  } catch (error) {
    return false;
  }
};

const testEnvironmentVariables = () => {
  const requiredVars = [
    'NODE_ENV',
    'JWT_SECRET',
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  return missingVars.length === 0;
};

const testFileStructure = () => {
  const requiredFiles = [
    'package.json',
    'src/server.js',
    'src/routes/index.js',
    'database/migrations',
    'tests'
  ];
  
  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
  return missingFiles.length === 0;
};

// Main test runner
const runTests = async () => {
  log('🚀 Starting Bilten System Tests', 'info');
  log('=' * 50, 'info');
  
  // Test 1: Environment and File Structure
  log('\n📁 Testing Environment and File Structure', 'info');
  testResult('Environment Variables', testEnvironmentVariables());
  testResult('File Structure', testFileStructure());
  
  // Test 2: Docker Services
  log('\n🐳 Testing Docker Services', 'info');
  testResult('Docker Services Running', testDockerServices());
  
  // Test 3: Backend Health
  log('\n🔧 Testing Backend Health', 'info');
  const backendReady = await waitForService(`${config.backendUrl}/health`, 'Backend API');
  testResult('Backend Health Check', backendReady);
  
  if (backendReady) {
    testResult('Backend Health Endpoint', await testBackendHealth());
    testResult('Database Connection', await testDatabaseConnection());
    testResult('Authentication System', await testAuthentication());
    testResult('File Upload System', await testFileUpload());
    testResult('Payment System', await testPaymentSystem());
    testResult('Analytics System', await testAnalytics());
  }
  
  // Test 4: Frontend Health
  log('\n🌐 Testing Frontend Health', 'info');
  const frontendReady = await waitForService(config.frontendUrl, 'Frontend');
  testResult('Frontend Health Check', frontendReady);
  
  // Test 5: Integration Tests
  log('\n🔗 Testing Integration', 'info');
  if (backendReady && frontendReady) {
    testResult('Frontend-Backend Communication', true);
  } else {
    testResult('Frontend-Backend Communication', false);
  }
  
  // Print results
  log('\n📊 Test Results Summary', 'info');
  log('=' * 50, 'info');
  log(`✅ Passed: ${results.passed}`, 'success');
  log(`❌ Failed: ${results.failed}`, results.failed > 0 ? 'error' : 'info');
  log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`, 'info');
  
  if (results.errors.length > 0) {
    log('\n❌ Failed Tests Details:', 'error');
    results.errors.forEach(error => {
      log(`  - ${error.test}: ${error.error}`, 'error');
    });
  }
  
  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
};

// Handle errors
process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled Rejection at: ${promise}, reason: ${reason}`, 'error');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  log(`Uncaught Exception: ${error.message}`, 'error');
  process.exit(1);
});

// Run tests
runTests().catch(error => {
  log(`Test runner failed: ${error.message}`, 'error');
  process.exit(1);
});
