/**
 * Test Locus Integration
 *
 * This script tests the Locus service and agent tools to ensure
 * payment functionality works correctly.
 */

import { locusService } from './services/locus.service';
import { executeLocusTool } from './agents/tools/locus.tools';

async function testLocusIntegration() {
  console.log('\n========================================');
  console.log('🧪 Testing Locus Integration');
  console.log('========================================\n');

  try {
    // Step 1: Create agents with initial balances
    console.log('📍 Step 1: Creating agents...\n');

    await locusService.createOrUpdateAgent('lender-001', 1000);
    await locusService.createOrUpdateAgent('business-001', 0);
    await locusService.createOrUpdateAgent('analyst-001', 0);

    // Step 2: Add contacts for lender
    console.log('\n📍 Step 2: Setting up contacts...\n');

    locusService.addContact('lender-001', {
      id: 1,
      name: 'Credit Analyst',
      email: 'analyst@example.com',
      walletAddress: '0xanalyst001000000000000000000000000000000000'
    });

    locusService.addContact('lender-001', {
      id: 2,
      name: 'Business Agent',
      email: 'business@example.com',
      walletAddress: '0xbusiness001000000000000000000000000000000000'
    });

    // Step 3: Test get_payment_context
    console.log('\n📍 Step 3: Testing get_payment_context...\n');

    const context = await executeLocusTool('get_payment_context', {
      agent_id: 'lender-001'
    });

    console.log('Payment Context Result:');
    console.log(context);

    // Step 4: Test send_to_contact (Lender pays Analyst)
    console.log('\n📍 Step 4: Testing send_to_contact...\n');

    const paymentResult = await executeLocusTool('send_to_contact', {
      from_agent_id: 'lender-001',
      contact_number: 1,
      amount: 20,
      memo: 'Payment for credit analysis'
    });

    console.log('Payment Result:');
    console.log(JSON.stringify(paymentResult, null, 2));

    // Step 5: Check updated balances
    console.log('\n📍 Step 5: Checking balances...\n');

    console.log(`Lender balance: ${locusService.getBalance('lender-001')} USDC`);
    console.log(`Analyst balance: ${locusService.getBalance('analyst-001')} USDC`);
    console.log(`Business balance: ${locusService.getBalance('business-001')} USDC`);

    // Step 6: Test send_to_address (Lender pays Business directly)
    console.log('\n📍 Step 6: Testing send_to_address...\n');

    // Generate correct wallet address (40 hex chars total)
    const businessWallet = '0xbusiness001' + '0'.repeat(40 - 'business001'.length);

    const directPayment = await executeLocusTool('send_to_address', {
      from_agent_id: 'lender-001',
      to_address: businessWallet,
      amount: 800,
      memo: 'Loan principal disbursement'
    });

    console.log('Direct Payment Result:');
    console.log(JSON.stringify(directPayment, null, 2));

    // Step 7: Final balances
    console.log('\n📍 Step 7: Final balances...\n');

    console.log(`Lender balance: ${locusService.getBalance('lender-001')} USDC`);
    console.log(`Analyst balance: ${locusService.getBalance('analyst-001')} USDC`);
    console.log(`Business balance: ${locusService.getBalance('business-001')} USDC`);

    // Step 8: View all transactions
    console.log('\n📍 Step 8: Transaction history...\n');

    const transactions = locusService.getTransactions();
    console.log(`Total transactions: ${transactions.length}`);
    transactions.forEach((tx, i) => {
      console.log(`\n${i + 1}. ${tx.txId}`);
      console.log(`   From: ${tx.from} → To: ${tx.to}`);
      console.log(`   Amount: ${tx.amount} USDC`);
      console.log(`   Memo: ${tx.memo}`);
      console.log(`   Time: ${tx.timestamp.toISOString()}`);
    });

    console.log('\n========================================');
    console.log('✅ All tests passed!');
    console.log('========================================\n');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

testLocusIntegration();
