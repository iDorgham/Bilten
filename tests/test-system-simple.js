const axios = require('axios');

const config = {
  backendUrl: 'http://localhost:3001',
  frontendUrl: 'http://localhost:3000'
};

async function testSystem() {
  console.log('🚀 Testing Bilten System...\n');
  
  const tests = [
    {
      name: 'Backend Health',
      test: async () => {
        const response = await axios.get(`${config.backendUrl}/health`);
        return response.status === 200;
      }
    },
    {
      name: 'Frontend Health',
      test: async () => {
        const response = await axios.get(config.frontendUrl);
        return response.status === 200;
      }
    },
    {
      name: 'Database Connection',
      test: async () => {
        const response = await axios.get(`${config.backendUrl}/api/v1/events`);
        return response.status === 200 || response.status === 401;
      }
    }
  ];
  
  for (const test of tests) {
    try {
      const result = await test.test();
      console.log(`${result ? '✅' : '❌'} ${test.name}`);
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
    }
  }
}

testSystem();
