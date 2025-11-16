/**
 * Test Locus API with API Key Authentication
 * According to Locus docs: "Custom API keys prefixed with locus_"
 */

import * as dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.LOCUS_API_KEY!;
const API_URL = process.env.LOCUS_API_URL || 'https://api.uselocus.com';

async function testLocusAPIKey() {
  console.log('🔑 Testing Locus API Key Authentication\n');
  console.log(`API Key: ${API_KEY?.substring(0, 15)}...`);
  console.log(`API URL: ${API_URL}\n`);

  // Test 1: Get payment context
  console.log('📊 Test 1: Get Payment Context\n');

  try {
    const response = await fetch(`${API_URL}/v1/payment-context`, {
      method: 'GET',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.text();
      console.log('✅ Success! Response:');
      console.log(data);
    } else {
      const error = await response.text();
      console.log('❌ Error response:', error);
    }
  } catch (error: any) {
    console.error('❌ Request failed:', error.message);

    if (error.cause) {
      console.error('Cause:', error.cause);
    }
  }

  // Test 2: Try with insecure agent (NODE_TLS_REJECT_UNAUTHORIZED)
  console.log('\n\n🔓 Test 2: Trying with TLS verification disabled...\n');

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  try {
    const response = await fetch(`${API_URL}/v1/payment-context`, {
      method: 'GET',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.text();
      console.log('✅ Success with insecure mode! Response:');
      console.log(data);
    } else {
      const error = await response.text();
      console.log('Response:', error);
    }
  } catch (error: any) {
    console.error('❌ Still failed:', error.message);
  } finally {
    delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  }
}

testLocusAPIKey();
