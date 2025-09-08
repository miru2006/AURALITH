const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000';

// Test script to verify all mock endpoints are working
async function testMockEndpoints() {
  console.log('🧪 Testing Tourist Safety Backend Mock Endpoints\n');
  console.log('Base URL:', BASE_URL);
  console.log('=' .repeat(60));

  const tests = [
    {
      name: 'Health Check',
      method: 'GET',
      url: '/health',
      headers: {}
    },
    {
      name: 'All Test Endpoints List',
      method: 'GET',
      url: '/api/test/all-endpoints',
      headers: {}
    },
    {
      name: 'Sample User Data',
      method: 'GET',
      url: '/api/test/user/sample',
      headers: {}
    },
    {
      name: 'Mock Login',
      method: 'POST',
      url: '/api/test/auth/mock-login',
      headers: { 'Content-Type': 'application/json' },
      body: {
        email: 'john.tourist@gmail.com',
        password: 'test123'
      }
    },
    {
      name: 'Sample SOS Alerts',
      method: 'GET',
      url: '/api/test/sos/samples',
      headers: {}
    },
    {
      name: 'Mock Create SOS Alert',
      method: 'POST',
      url: '/api/test/sos/mock-create',
      headers: { 'Content-Type': 'application/json' },
      body: {
        type: 'emergency',
        description: 'Test emergency alert for frontend testing',
        location: {
          coordinates: [77.5946, 12.9716],
          address: 'MG Road, Bangalore'
        }
      }
    },
    {
      name: 'Sample E-FIR Data',
      method: 'GET',
      url: '/api/test/efir/samples',
      headers: {}
    },
    {
      name: 'Mock Create E-FIR',
      method: 'POST',
      url: '/api/test/efir/mock-create',
      headers: { 'Content-Type': 'application/json' },
      body: {
        incidentType: 'theft',
        description: 'Test theft incident for frontend testing',
        location: {
          coordinates: [77.5946, 12.9716],
          address: 'Brigade Road, Bangalore'
        }
      }
    },
    {
      name: 'Mock Chatbot Chat',
      method: 'POST',
      url: '/api/test/chatbot/mock-chat',
      headers: { 'Content-Type': 'application/json' },
      body: {
        message: 'I need help, I am lost in Bangalore'
      }
    },
    {
      name: 'Mock Translation',
      method: 'POST',
      url: '/api/test/translation/mock-translate',
      headers: { 'Content-Type': 'application/json' },
      body: {
        text: 'Help me please',
        targetLanguage: 'hi'
      }
    },
    {
      name: 'Emergency Phrases',
      method: 'GET',
      url: '/api/test/translation/emergency-phrases',
      headers: {}
    },
    {
      name: 'Mock Dashboard Stats',
      method: 'GET',
      url: '/api/test/dashboard/mock-stats',
      headers: {}
    }
  ];

  let passed = 0;
  let failed = 0;

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`\n${i + 1}. ${test.name}`);
    console.log(`   ${test.method} ${test.url}`);
    
    try {
      const options = {
        method: test.method,
        headers: test.headers
      };

      if (test.body) {
        options.body = JSON.stringify(test.body);
      }

      const response = await fetch(`${BASE_URL}${test.url}`, options);
      const data = await response.json();

      if (response.ok && data.success !== false) {
        console.log(`   ✅ PASSED (${response.status})`);
        if (data.message) {
          console.log(`   📝 ${data.message}`);
        }
        passed++;
      } else {
        console.log(`   ❌ FAILED (${response.status})`);
        console.log(`   📝 ${data.message || 'Unknown error'}`);
        failed++;
      }
    } catch (error) {
      console.log(`   ❌ FAILED - ${error.message}`);
      failed++;
    }
  }

  console.log('\n' + '=' .repeat(60));
  console.log(`📊 Test Summary:`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All mock endpoints are working perfectly!');
    console.log('🚀 Frontend team can start development with these APIs.');
  } else {
    console.log('\n⚠️  Some endpoints failed. Check server status and try again.');
  }

  console.log('\n📚 Additional Resources:');
  console.log(`   • API Documentation: ${BASE_URL}/api-docs`);
  console.log(`   • Health Check: ${BASE_URL}/health`);
  console.log(`   • All Test Endpoints: ${BASE_URL}/api/test/all-endpoints`);
  console.log(`   • Frontend Guide: See README_FRONTEND.md`);
}

// Frontend Integration Example
function generateFrontendExamples() {
  console.log('\n🔧 Frontend Integration Examples:');
  console.log('=' .repeat(60));

  console.log('\n1. JavaScript Fetch Example:');
  console.log(`
// Login example
const login = async (email, password) => {
  const response = await fetch('${BASE_URL}/api/test/auth/mock-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  if (data.success) {
    localStorage.setItem('authToken', data.data.token);
  }
  return data;
};

// Create SOS Alert example
const createSOSAlert = async (alertData) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch('${BASE_URL}/api/sos/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${token}\`
    },
    body: JSON.stringify(alertData)
  });
  return response.json();
};
  `);

  console.log('\n2. React Hook Example:');
  console.log(`
import { useState, useEffect } from 'react';

const useAPI = (endpoint) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('${BASE_URL}' + endpoint)
      .then(res => res.json())
      .then(result => {
        setData(result.data);
        setLoading(false);
      });
  }, [endpoint]);

  return { data, loading };
};

// Usage
const Dashboard = () => {
  const { data: stats } = useAPI('/api/test/dashboard/mock-stats');
  return <div>Total Alerts: {stats?.overview?.totalAlerts}</div>;
};
  `);

  console.log('\n3. Axios Example:');
  console.log(`
import axios from 'axios';

const api = axios.create({
  baseURL: '${BASE_URL}/api',
  headers: { 'Content-Type': 'application/json' }
});

// Add auth token to requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = \`Bearer \${token}\`;
  }
  return config;
});

// Usage
const getUserData = () => api.get('/test/user/sample');
const createAlert = (data) => api.post('/sos/create', data);
  `);
}

// Run the test
if (require.main === module) {
  testMockEndpoints()
    .then(() => generateFrontendExamples())
    .catch(console.error);
}

module.exports = { testMockEndpoints };
