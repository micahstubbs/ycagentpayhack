// Test Locus API with SSL workaround
const https = require('https');

const options = {
  hostname: 'api.uselocus.com',
  port: 443,
  path: '/v1/payment-context',
  method: 'GET',
  headers: {
    'x-api-key': 'locus_dev_4e28xFLsPZElgXzjawhiolE8wLVNu69l',
    'Content-Type': 'application/json'
  },
  // Try disabling SNI check
  servername: 'api.uselocus.com',
  rejectUnauthorized: false  // WARNING: Only for testing!
};

console.log('Testing Locus API connection...\n');

const req = https.request(options, (res) => {
  console.log(`✅ Connection successful!`);
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Headers:`, JSON.stringify(res.headers, null, 2));

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('\n📦 Response Body:');
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
  console.error('Stack:', error.stack);
});

req.end();
