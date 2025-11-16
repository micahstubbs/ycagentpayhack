/**
 * Test Autonomous Agent
 *
 * Quick test to verify autonomous borrower agent works
 */

import { createAutonomousBorrower, BorrowerNeed } from '../agents/autonomous-borrower';
import { locusService } from '../services/locus.service';

async function testAutonomousAgent() {
  console.log('\n🧪 Testing Autonomous Borrower Agent\n');

  // Setup environment
  console.log('Setting up agents...');
  await locusService.createOrUpdateAgent('lender-001', 1000);
  await locusService.createOrUpdateAgent('analyst-001', 0);
  await locusService.createOrUpdateAgent('test-borrower-001', 0);

  locusService.addContact('lender-001', {
    id: 1,
    name: 'Credit Analyst',
    email: 'analyst-001@platform.com',
    walletAddress: '0xanalyst001'
  });

  console.log('✅ Environment ready\n');

  // Create autonomous borrower with specific need
  const need: BorrowerNeed = {
    purpose: 'Rent H200 GPU cluster for 24 hours',
    amountNeeded: 800,
    deadline: '2 hours from now',
    invoiceAmount: 1000,
    invoiceDebtor: '0xCustomerABC123',
    invoiceDueDate: '30 days from now'
  };

  await createAutonomousBorrower('test-borrower-001', need);

  console.log('\n✅ Test complete!');
  console.log('\nFinal Balances:');
  console.log(`   Lender:   ${locusService.getBalance('lender-001')} USDC`);
  console.log(`   Borrower: ${locusService.getBalance('test-borrower-001')} USDC`);
  console.log(`   Analyst:  ${locusService.getBalance('analyst-001')} USDC`);

  const transactions = locusService.getTransactions();
  console.log(`\nTotal Transactions: ${transactions.length}`);
  transactions.forEach((tx, i) => {
    console.log(`   ${i + 1}. ${tx.from} → ${tx.to}: ${tx.amount} USDC (${tx.memo})`);
  });
}

testAutonomousAgent().catch((error) => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});
