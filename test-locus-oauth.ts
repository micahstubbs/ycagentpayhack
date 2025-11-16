/**
 * Test Locus OAuth Client Credentials flow
 * This uses the CLIENT_ID and SECRET_KEY from .env
 */

import * as dotenv from 'dotenv';
dotenv.config();

const CLIENT_ID = process.env.LOCUS_CLIENT_ID!;
const CLIENT_SECRET = process.env.LOCUS_SECRET_KEY!;
const TOKEN_URL = 'https://api.uselocus.com/oauth2/token';

async function testLocusOAuth() {
  console.log('🔑 Testing Locus OAuth Client Credentials Flow\n');
  console.log(`Client ID: ${CLIENT_ID}`);
  console.log(`Token URL: ${TOKEN_URL}\n`);

  try {
    // OAuth 2.0 Client Credentials flow
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);
    params.append('scope', 'payment_context:read contact_payments:write address_payments:write');

    console.log('📤 Requesting access token...\n');

    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OAuth failed:', errorText);
      return;
    }

    const tokenData = await response.json();
    console.log('\n✅ OAuth Success!');
    console.log('Token Data:', JSON.stringify(tokenData, null, 2));

    // Now try to use the token to get payment context
    if (tokenData.access_token) {
      console.log('\n📊 Testing payment_context API...\n');

      const contextResponse = await fetch('https://api.uselocus.com/v1/payment-context', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`Status: ${contextResponse.status} ${contextResponse.statusText}`);
      const contextData = await contextResponse.text();
      console.log('Response:', contextData);
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);

    // Check if it's SSL error
    if (error.message.includes('SSL') || error.message.includes('EPROTO')) {
      console.log('\n⚠️  SSL Error Detected');
      console.log('This is a server-side issue with Locus API.');
      console.log('\n💡 Recommendation: Use mock mode for hackathon demo.');
    }
  }
}

testLocusOAuth();
