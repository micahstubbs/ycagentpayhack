/**
 * Test Real Locus API Integration
 *
 * This tests the actual Locus AgentPay API with your credentials.
 * Based on Locus API documentation.
 */

import * as dotenv from 'dotenv';
dotenv.config();

const LOCUS_API_KEY = process.env.LOCUS_API_KEY;
const LOCUS_CLIENT_ID = process.env.LOCUS_CLIENT_ID;
const LOCUS_SECRET_KEY = process.env.LOCUS_SECRET_KEY;

async function testRealLocusAPI() {
  console.log('\n========================================');
  console.log('🧪 Testing REAL Locus API');
  console.log('========================================\n');

  // Check credentials
  console.log('📋 Checking credentials...');
  console.log(`API Key: ${LOCUS_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`Client ID: ${LOCUS_CLIENT_ID ? '✅ Set' : '❌ Missing'}`);
  console.log(`Secret Key: ${LOCUS_SECRET_KEY ? '✅ Set' : '❌ Missing'}`);

  if (!LOCUS_API_KEY || !LOCUS_CLIENT_ID || !LOCUS_SECRET_KEY) {
    console.error('\n❌ Missing Locus credentials!');
    console.error('Please set LOCUS_API_KEY, LOCUS_CLIENT_ID, and LOCUS_SECRET_KEY in .env');
    process.exit(1);
  }

  try {
    // Test 1: Get account info / balance
    console.log('\n📍 Test 1: Getting account info...\n');

    const accountResponse = await fetch('https://api.locus.agentpay.com/v1/account', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${LOCUS_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!accountResponse.ok) {
      const errorText = await accountResponse.text();
      console.error('❌ Account request failed:', accountResponse.status, errorText);
    } else {
      const accountData = await accountResponse.json();
      console.log('✅ Account info retrieved:');
      console.log(JSON.stringify(accountData, null, 2));
    }

    // Test 2: List wallets/balances
    console.log('\n📍 Test 2: Listing wallets...\n');

    const walletsResponse = await fetch('https://api.locus.agentpay.com/v1/wallets', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${LOCUS_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!walletsResponse.ok) {
      const errorText = await walletsResponse.text();
      console.error('❌ Wallets request failed:', walletsResponse.status, errorText);
    } else {
      const walletsData = await walletsResponse.json();
      console.log('✅ Wallets retrieved:');
      console.log(JSON.stringify(walletsData, null, 2));
    }

    // Test 3: Check API version/health
    console.log('\n📍 Test 3: Checking API health...\n');

    const healthResponse = await fetch('https://api.locus.agentpay.com/health', {
      method: 'GET',
    });

    if (!healthResponse.ok) {
      console.log('⚠️  Health endpoint not available (this is okay)');
    } else {
      const healthData = await healthResponse.json();
      console.log('✅ API health:');
      console.log(JSON.stringify(healthData, null, 2));
    }

    console.log('\n========================================');
    console.log('✅ Locus API test complete!');
    console.log('========================================\n');
    console.log('💡 Next Steps:');
    console.log('   1. If you see valid account/wallet data, the API keys work!');
    console.log('   2. You can now integrate real USDC transfers');
    console.log('   3. Update src/services/locus.service.ts to use real API');
    console.log('   4. Replace mock transfers with actual Locus API calls\n');

  } catch (error: any) {
    console.error('\n❌ Error testing Locus API:', error.message);
    console.error('\nPossible issues:');
    console.error('   - Network connectivity');
    console.error('   - Invalid API credentials');
    console.error('   - Locus API endpoint changed');
    console.error('\nCheck the Locus documentation: https://docs.locus.agentpay.com\n');
    process.exit(1);
  }
}

testRealLocusAPI();
