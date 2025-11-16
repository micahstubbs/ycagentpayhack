// Test Locus API connectivity
const https = require('https');

const options = {
  hostname: 'api.uselocus.com',
  port: 443,
  path: '/v1/payment-context',
  method: 'GET',
  headers: {
    'x-api-key': 'locus_dev_4e28xFLsPZElgXzjawhiolE8wLVNu69l',
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('\nResponse Body:');
    console.log(data);
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.end();
