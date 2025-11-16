// Test Locus API with fetch
const https = require('https');

// Create custom agent that ignores SSL errors
const agent = new https.Agent({
  rejectUnauthorized: false,
  servername: 'api.uselocus.com'
});

async function testLocusAPI() {
  try {
    console.log('Testing Locus API with fetch...\n');

    const response = await fetch('https://api.uselocus.com/v1/payment-context', {
      method: 'GET',
      headers: {
        'x-api-key': 'YOUR_LOCUS_API_KEY_HERE',
        'Content-Type': 'application/json'
      },
      agent: agent
    });

    console.log(`✅ Status: ${response.status} ${response.statusText}`);
    console.log(`Headers:`, JSON.stringify(Object.fromEntries(response.headers), null, 2));

    const data = await response.text();
    console.log('\n📦 Response:');

    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.log(data);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
  }
}

testLocusAPI();
