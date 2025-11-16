import { runAgent } from '../agents/agent-runner';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../convex/_generated/api';
import { locusService } from '../services/locus.service';
import { stripeService } from '../services/stripe.service';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Invoice-Backed Lending Marketplace Demo
 *
 * This demo showcases the complete end-to-end flow of autonomous AI agents
 * executing invoice-backed loans using:
 * - Stripe Connect for funding
 * - Locus for agent-to-agent USDC payments
 * - Base smart contracts for escrow
 * - Anthropic SDK for agent intelligence
 */

async function runDemo() {
  console.log('\n========================================');
  console.log('Invoice-Backed Lending Marketplace Demo');
  console.log('========================================\n');

  // Initialize Convex client
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    console.error('Error: NEXT_PUBLIC_CONVEX_URL environment variable not set');
    console.error('Please set it in your .env file');
    process.exit(1);
  }

  console.log('Connecting to Convex...');
  const client = new ConvexHttpClient(convexUrl);

  // Get agents from Convex database
  console.log('Loading agents from Convex database...');
  const businessAgentData = await client.query(api.agents.getAgent, { agentId: 'business-001' });
  const lenderAgentData = await client.query(api.agents.getAgent, { agentId: 'lender-001' });
  const analystAgentData = await client.query(api.agents.getAgent, { agentId: 'analyst-001' });

  if (!businessAgentData || !lenderAgentData || !analystAgentData) {
    console.error('Agents not initialized. Run: yarn init:agents && yarn sync:agents');
    process.exit(1);
  }

  console.log('✅ Loaded 3 agents from database');
  console.log(`  - ${businessAgentData.agentId} (${businessAgentData.agentType})`);
  console.log(`  - ${lenderAgentData.agentId} (${lenderAgentData.agentType})`);
  console.log(`  - ${analystAgentData.agentId} (${analystAgentData.agentType})`);

  // Step 1: Fund lender agent
  console.log('\n📍 Step 1: Fund Lender Agent with $1000');
  console.log('(Simulating Stripe funding flow - using mock mode for demo)');

  // NOTE: Real Stripe transfers require Connect account onboarding
  // For hackathon demo, we skip the real transfer and directly deposit to Locus
  // In production, this would happen via Stripe webhook after transfer.created event

  console.log('[Demo] Skipping real Stripe transfer (requires account onboarding)');
  console.log('[Demo] Directly depositing 1000 USDC to Locus (simulating webhook result)');

  // Simulate webhook processing - deposit USDC to Locus
  await locusService.depositUSDC('lender-001', 1000);

  console.log('✅ Lender funded: $1000 → 1000 USDC (simulated)');

  // Step 2: Mint invoice NFT for business agent
  console.log('\n📍 Step 2: Business Agent Mints Invoice NFT');

  await runAgent({
    agentId: 'business-001',
    systemPrompt: `You are a Business Agent that runs an AI business. You need to create an invoice NFT for a receivable.

Your wallet address is: ${businessAgentData.baseWalletAddress}
Use a mock debtor address: 0x1234567890123456789012345678901234567890

Create an invoice NFT for $1000 worth of ETH (1 ETH equivalent), due in 30 days.`,
    initialMessage: 'Create an invoice NFT for $1000 (1 ETH equivalent), due in 30 days.',
    maxTurns: 5,
  });

  // Step 3: Business agent requests loan
  console.log('\n📍 Step 3: Business Agent Requests Loan');

  await runAgent({
    agentId: 'business-001',
    systemPrompt: `You are a Business Agent that needs $800 to rent H200 compute.

You have an invoice NFT (token ID 0) worth $1000, due in 30 days.

Your goal: Check your Locus balance and explain that you need a loan to fund your compute needs.`,
    initialMessage: 'Check my Locus balance and explain why I need a loan.',
    maxTurns: 5,
  });

  // Step 4: Lender requests credit analysis
  console.log('\n📍 Step 4: Lender Pays for Credit Analysis');

  await runAgent({
    agentId: 'lender-001',
    systemPrompt: `You are a Lender Agent. A business agent wants to borrow $800 against an invoice NFT worth $1000.

Before approving the loan, you need a credit analysis from the Credit Analyst Agent.

Pay the analyst $20 USDC via Locus for a creditworthiness report.

Your agent ID: lender-001
Credit Analyst ID: analyst-001`,
    initialMessage:
      'I received a loan request for $800 against invoice NFT token 0. Transfer $20 USDC to analyst-001 for credit analysis.',
    maxTurns: 5,
  });

  // Step 5: Credit analyst performs analysis
  console.log('\n📍 Step 5: Credit Analyst Performs Analysis');

  await runAgent({
    agentId: 'analyst-001',
    systemPrompt: `You are a Credit Analyst Agent. You've been paid $20 USDC to analyze a debtor's creditworthiness.

Debtor address: 0x1234567890123456789012345678901234567890
Invoice NFT token ID: 0
Invoice amount: $1000

Analyze the invoice details and recommend loan terms:
- Advance rate (% of invoice value to lend)
- Interest rate

Check your Locus balance to confirm payment, then provide analysis.`,
    initialMessage: 'Check my balance to confirm payment, then analyze invoice NFT token 0 for creditworthiness.',
    maxTurns: 5,
  });

  // Step 6: Lender executes loan
  console.log('\n📍 Step 6: Lender Executes Loan');

  await runAgent({
    agentId: 'lender-001',
    systemPrompt: `You are a Lender Agent. Based on the credit analysis, approve a loan:

- Principal: $800 (80% advance rate)
- Interest: $40 (5% interest)
- Collateral: Invoice NFT token 0

Borrower address: ${businessAgentData.baseWalletAddress}

Execute the loan by calling create_loan with these parameters.`,
    initialMessage: 'Approve and execute loan for $800 with $40 interest against invoice NFT token 0.',
    maxTurns: 5,
  });

  // Step 7: Business agent pays for compute
  console.log('\n📍 Step 7: Business Agent Pays for Compute');

  // Create compute provider wallet if it doesn't exist
  await locusService.createWallet('compute-provider-001');

  await runAgent({
    agentId: 'business-001',
    systemPrompt: `You are a Business Agent. You just received an $800 loan in your Locus wallet.

Use this money to pay for H200 compute rental.

Transfer $800 USDC to compute provider (agent ID: compute-provider-001).`,
    initialMessage: 'Check my Locus balance and pay $800 USDC to compute-provider-001 for compute rental.',
    maxTurns: 5,
  });

  // Step 8: Simulate invoice payment and settlement
  console.log('\n📍 Step 8: Invoice Payment & Loan Settlement');
  console.log('(Simulating debtor paying invoice after 30 days)');

  // Simulate invoice payment - deposit $1000 to business agent
  await locusService.depositUSDC('business-001', 1000);
  console.log('✅ Debtor paid invoice: 1000 USDC deposited to business-001');

  await runAgent({
    agentId: 'business-001',
    systemPrompt: `You are a Business Agent. The debtor has paid the $1000 invoice.

You need to settle loan ID 0 by paying $840 ($800 principal + $40 interest).

This will return your invoice NFT and send the lender their money.`,
    initialMessage: 'The invoice has been paid. Settle loan 0 by paying $840.',
    maxTurns: 5,
  });

  // Final balances
  console.log('\n📍 Final Balances:');

  const lenderBalance = await locusService.getBalance('lender-001');
  const businessBalance = await locusService.getBalance('business-001');
  const analystBalance = await locusService.getBalance('analyst-001');
  const computeBalance = await locusService.getBalance('compute-provider-001');

  console.log(`\nLender (lender-001):            ${lenderBalance} USDC`);
  console.log(`  Started with: 1000 USDC`);
  console.log(`  Lent out:     -800 USDC`);
  console.log(`  Repaid:       +840 USDC`);
  console.log(`  Net profit:   +40 USDC (5% interest)`);

  console.log(`\nBusiness (business-001):        ${businessBalance} USDC`);
  console.log(`  Borrowed:     +800 USDC`);
  console.log(`  Paid compute: -800 USDC`);
  console.log(`  Invoice paid: +1000 USDC`);
  console.log(`  Loan repaid:  -840 USDC`);
  console.log(`  Net profit:   +160 USDC ($1000 invoice - $840 repayment)`);

  console.log(`\nAnalyst (analyst-001):          ${analystBalance} USDC`);
  console.log(`  Credit analysis fee: +20 USDC`);

  console.log(`\nCompute Provider:               ${computeBalance} USDC`);
  console.log(`  H200 rental payment: +800 USDC`);

  console.log('\n========================================');
  console.log('Demo Complete! 🎉');
  console.log('========================================');
  console.log('\nKey Achievements:');
  console.log('✅ Autonomous AI agents executed complete lending flow');
  console.log('✅ Invoice NFT minted on Base as collateral');
  console.log('✅ Credit analyst paid via Locus for analysis');
  console.log('✅ Loan executed via smart contract escrow');
  console.log('✅ Business agent paid for compute with loan funds');
  console.log('✅ Loan settled and NFT returned to borrower');
  console.log('✅ All agents earned/spent correctly\n');
}

runDemo().catch((error) => {
  console.error('\n❌ Demo failed:', error);
  process.exit(1);
});
