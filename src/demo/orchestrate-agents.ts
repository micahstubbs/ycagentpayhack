/**
 * Agent Orchestration Demo
 *
 * Coordinates 3 autonomous agents to execute an invoice-backed loan:
 * 1. Business Agent (borrower)
 * 2. Lender Agent (capital provider)
 * 3. Analyst Agent (credit analyst)
 */

import { runAgent } from '../agents/agent-runner';
import { businessAgentPrompt } from '../agents/prompts/business-agent';
import { lenderAgentPrompt } from '../agents/prompts/lender-agent';
import { analystAgentPrompt } from '../agents/prompts/analyst-agent';
import { locusService } from '../services/locus.service';
import { agentCommunication } from '../services/agent-communication.service';

async function setupEnvironment() {
  console.log('\n🔧 Setting up environment...\n');

  // Initialize Locus balances
  await locusService.createOrUpdateAgent('lender-001', 1000); // Lender starts with 1000 USDC
  await locusService.createOrUpdateAgent('business-001', 0); // Business starts with 0
  await locusService.createOrUpdateAgent('analyst-001', 0); // Analyst starts with 0

  // Add analyst as whitelisted contact for lender
  locusService.addContact('lender-001', {
    id: 1,
    name: 'Credit Analyst',
    email: 'analyst-001@platform.com',
    walletAddress: '0xanalyst001000000000000000000000000000000000'
  });

  console.log('✅ Environment ready');
  console.log(`   Lender balance: ${locusService.getBalance('lender-001')} USDC`);
  console.log(`   Business balance: ${locusService.getBalance('business-001')} USDC`);
  console.log(`   Analyst balance: ${locusService.getBalance('analyst-001')} USDC\n`);
}

async function runDemoWorkflow() {
  console.log('\n' + '='.repeat(80));
  console.log('🎬 INVOICE-BACKED LENDING DEMO - AUTONOMOUS AGENT WORKFLOW');
  console.log('='.repeat(80));

  await setupEnvironment();

  // ========================================
  // ROUND 1: Business Agent initiates
  // ========================================
  console.log('\n📍 ROUND 1: Business Agent needs funding\n');

  await runAgent({
    agentId: 'business-001',
    systemPrompt: businessAgentPrompt,
    initialMessage: `You need $800 to rent H200 GPUs for an AI training job.
You have a $1000 invoice from customer 0xdebtor123 due in 30 days.
Check your balance and take action to get funding.`,
    maxTurns: 5
  });

  // ========================================
  // ROUND 2: Lender Agent responds
  // ========================================
  console.log('\n📍 ROUND 2: Lender Agent processes loan request\n');

  await runAgent({
    agentId: 'lender-001',
    systemPrompt: lenderAgentPrompt,
    initialMessage: 'Check your inbox for any loan requests and process them according to your protocol.',
    maxTurns: 5
  });

  // ========================================
  // ROUND 3: Analyst Agent analyzes
  // ========================================
  console.log('\n📍 ROUND 3: Analyst Agent performs credit analysis\n');

  await runAgent({
    agentId: 'analyst-001',
    systemPrompt: analystAgentPrompt,
    initialMessage: 'Check your inbox for analysis requests. Verify payment and provide credit analysis.',
    maxTurns: 8
  });

  // ========================================
  // ROUND 4: Lender Agent executes loan
  // ========================================
  console.log('\n📍 ROUND 4: Lender Agent executes or declines loan\n');

  await runAgent({
    agentId: 'lender-001',
    systemPrompt: lenderAgentPrompt,
    initialMessage: 'Check your inbox for the analyst report. Execute the loan if approved, or decline if rejected.',
    maxTurns: 8
  });

  // ========================================
  // ROUND 5: Business Agent uses funds
  // ========================================
  console.log('\n📍 ROUND 5: Business Agent uses loan proceeds\n');

  await runAgent({
    agentId: 'business-001',
    systemPrompt: businessAgentPrompt,
    initialMessage: 'Check your inbox and balance. If you received the loan, pay for the H200 compute (send to 0xcompute_provider).',
    maxTurns: 5
  });

  // ========================================
  // Simulate passage of time (customer pays invoice)
  // ========================================
  console.log('\n⏰ [30 DAYS LATER...] Customer paid the invoice!\n');

  // ========================================
  // ROUND 6: Business Agent settles loan
  // ========================================
  console.log('\n📍 ROUND 6: Business Agent settles the loan\n');

  // Give business agent the funds from customer payment
  const currentBalance = locusService.getBalance('business-001');
  await locusService.createOrUpdateAgent('business-001', currentBalance + 1000);

  await runAgent({
    agentId: 'business-001',
    systemPrompt: businessAgentPrompt,
    initialMessage: 'Good news! Your customer paid the $1000 invoice. Settle your loan with the lender.',
    maxTurns: 5
  });

  // ========================================
  // Final Report
  // ========================================
  console.log('\n' + '='.repeat(80));
  console.log('📊 FINAL REPORT');
  console.log('='.repeat(80) + '\n');

  console.log('💰 Final Balances:');
  console.log(`   Lender:   ${locusService.getBalance('lender-001')} USDC`);
  console.log(`   Business: ${locusService.getBalance('business-001')} USDC`);
  console.log(`   Analyst:  ${locusService.getBalance('analyst-001')} USDC\n`);

  console.log('📨 Total Messages:');
  const allMessages = agentCommunication.getAllMessagesDebug();
  console.log(`   ${allMessages.length} messages exchanged between agents\n`);

  console.log('💸 Transactions:');
  const transactions = locusService.getTransactions();
  console.log(`   ${transactions.length} USDC transactions executed\n`);

  transactions.forEach((tx, i) => {
    console.log(`   ${i + 1}. ${tx.from} → ${tx.to}: ${tx.amount} USDC`);
    console.log(`      Memo: ${tx.memo}`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('✅ DEMO COMPLETE!');
  console.log('='.repeat(80) + '\n');

  console.log('🎉 Autonomous agents successfully executed an invoice-backed loan!');
  console.log('   • Business Agent borrowed $800 against invoice NFT');
  console.log('   • Lender Agent obtained credit approval before lending');
  console.log('   • Analyst Agent provided paid analysis service');
  console.log('   • Loan was settled with interest');
  console.log('   • All transactions tracked on-chain (Base) and via Locus\n');
}

// Run the demo
runDemoWorkflow().catch((error) => {
  console.error('\n❌ Demo failed:', error);
  process.exit(1);
});
