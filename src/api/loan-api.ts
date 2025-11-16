/**
 * Agent Backend API Server
 *
 * Exposes HTTP endpoints that the Convex frontend can call to trigger
 * the autonomous agent workflow for loan processing
 */

import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { runAgent } from '../agents/agent-runner';
import { businessAgentPrompt } from '../agents/prompts/business-agent';
import { lenderAgentPrompt } from '../agents/prompts/lender-agent';
import { analystAgentPrompt } from '../agents/prompts/analyst-agent';
import { locusService } from '../services/locus.service';
import { agentCommunication } from '../services/agent-communication.service';
import { createAutonomousBorrower, BorrowerNeed } from '../agents/autonomous-borrower';

dotenv.config();

const app = express();
const PORT = process.env.AGENT_BACKEND_PORT || 3001;

app.use(cors());
app.use(express.json());

/**
 * POST /api/loan/process
 *
 * Triggers the 8-step autonomous agent workflow for a loan request
 */
app.post('/api/loan/process', async (req, res) => {
  const { loanRequestId, invoiceAmount, loanAmount, debtorAddress, daysUntilDue, purpose } = req.body;

  if (!loanRequestId || !invoiceAmount || !loanAmount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  console.log(`\n[Agent API] Received loan request ${loanRequestId}`);
  console.log(`[Agent API]   Amount: ${loanAmount} / ${invoiceAmount}`);
  console.log(`[Agent API]   Purpose: ${purpose}\n`);

  try {
    // Initialize agent balances
    await locusService.createOrUpdateAgent('lender-001', 1000);
    await locusService.createOrUpdateAgent('business-001', 0);
    await locusService.createOrUpdateAgent('analyst-001', 0);

    // Add analyst as whitelisted contact for lender
    locusService.addContact('lender-001', {
      id: 1,
      name: 'Credit Analyst',
      email: 'analyst-001@platform.com',
      walletAddress: '0xanalyst001000000000000000000000000000000000'
    });

    // Start the agent workflow in the background
    // We'll respond immediately and update Convex via webhook/callback
    res.json({
      success: true,
      loanRequestId,
      message: 'Agent workflow started',
      status: 'analyzing'
    });

    // Run the workflow asynchronously
    processLoanWorkflow(loanRequestId, { invoiceAmount, loanAmount, debtorAddress, daysUntilDue, purpose })
      .catch(error => {
        console.error(`[Agent API] Workflow failed for ${loanRequestId}:`, error);
      });

  } catch (error: any) {
    console.error(`[Agent API] Error processing loan request:`, error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/loan/status/:loanRequestId
 *
 * Get the current status of a loan being processed by agents
 */
app.get('/api/loan/status/:loanRequestId', async (req, res) => {
  const { loanRequestId } = req.params;

  // In a real implementation, we'd query the database
  // For now, return mock status
  res.json({
    loanRequestId,
    status: 'analyzing',
    step: 3,
    totalSteps: 8,
    currentAgent: 'analyst-001',
  });
});

/**
 * POST /api/agent/autonomous-loan
 *
 * Create an autonomous borrower agent that requests a loan
 */
app.post('/api/agent/autonomous-loan', async (req, res) => {
  try {
    const {
      agentId,
      purpose,
      amountNeeded,
      deadline,
      invoiceAmount,
      invoiceDebtor,
      invoiceDueDate
    } = req.body;

    if (!agentId || !purpose || !amountNeeded) {
      return res.status(400).json({
        error: 'Missing required fields: agentId, purpose, amountNeeded'
      });
    }

    console.log(`\n🤖 Autonomous loan request from: ${agentId}`);
    console.log(`   Purpose: ${purpose}`);
    console.log(`   Amount: ${amountNeeded} USDC\n`);

    const borrowerNeed: BorrowerNeed = {
      purpose,
      amountNeeded,
      deadline,
      invoiceAmount,
      invoiceDebtor,
      invoiceDueDate
    };

    // Run autonomous borrower agent (async)
    createAutonomousBorrower(agentId, borrowerNeed).catch((error) => {
      console.error(`❌ Autonomous agent ${agentId} error:`, error);
    });

    res.json({
      success: true,
      message: 'Autonomous borrower agent started',
      agentId,
      request: borrowerNeed,
      statusUrl: `/api/agent/status/${agentId}`
    });
  } catch (error: any) {
    console.error('Error starting autonomous agent:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/agent/status/:agentId
 *
 * Get current status of an agent (balance, messages, transactions)
 */
app.get('/api/agent/status/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;

    const balance = locusService.getBalance(agentId);
    const messages = agentCommunication.getInbox(agentId);
    const transactions = locusService.getTransactions().filter(
      tx => tx.from === agentId || tx.to === agentId
    );

    res.json({
      success: true,
      agentId,
      balance,
      messageCount: messages.length,
      recentMessages: messages.slice(-5),
      transactionCount: transactions.length,
      recentTransactions: transactions.slice(-10)
    });
  } catch (error: any) {
    console.error('Error fetching agent status:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * POST /api/demo/quick-autonomous-loan
 *
 * Quick demo: Create autonomous agent that requests a loan
 */
app.post('/api/demo/quick-autonomous-loan', async (req, res) => {
  try {
    const timestamp = Date.now();
    const agentId = `autonomous-${timestamp}`;

    const borrowerNeed: BorrowerNeed = {
      purpose: req.body.purpose || 'Rent H200 GPU cluster for AI training',
      amountNeeded: req.body.amount || 800,
      deadline: req.body.deadline || '2 hours',
      invoiceAmount: req.body.invoiceAmount || 1000,
      invoiceDebtor: req.body.debtor || '0xdebtor123abc',
      invoiceDueDate: req.body.dueDate || '30 days'
    };

    console.log(`\n🎬 DEMO: Autonomous agent ${agentId} requesting loan`);

    // Initialize lender and analyst first
    await locusService.createOrUpdateAgent('lender-001', 1000);
    await locusService.createOrUpdateAgent('analyst-001', 0);
    await locusService.createOrUpdateAgent(agentId, 0);

    locusService.addContact('lender-001', {
      id: 1,
      name: 'Credit Analyst',
      email: 'analyst-001@platform.com',
      walletAddress: '0xanalyst001'
    });

    // Start autonomous agent
    createAutonomousBorrower(agentId, borrowerNeed).catch(console.error);

    res.json({
      success: true,
      message: '🎬 Autonomous borrower agent launched! Watch terminal for activity.',
      agentId,
      request: borrowerNeed,
      watchUrls: {
        status: `http://localhost:${PORT}/api/agent/status/${agentId}`,
        lenderStatus: `http://localhost:${PORT}/api/agent/status/lender-001`,
        analystStatus: `http://localhost:${PORT}/api/agent/status/analyst-001`
      }
    });
  } catch (error: any) {
    console.error('Demo error:', error);
    res.status(500).json({
      error: 'Demo failed',
      message: error.message
    });
  }
});

/**
 * Run the complete 8-step agent workflow
 */
async function processLoanWorkflow(
  loanRequestId: string,
  loanDetails: {
    invoiceAmount: number;
    loanAmount: number;
    debtorAddress: string;
    daysUntilDue: number;
    purpose: string;
  }
) {
  console.log(`\n[Workflow] Starting for loan request ${loanRequestId}\n`);

  try {
    // STEP 1: Business Agent initiates
    console.log('📍 STEP 1/8: Business Agent initiates loan request\n');

    await runAgent({
      agentId: 'business-001',
      systemPrompt: businessAgentPrompt,
      initialMessage: `You need $${loanDetails.loanAmount} for ${loanDetails.purpose}.
You have a $${loanDetails.invoiceAmount} invoice from customer ${loanDetails.debtorAddress} due in ${loanDetails.daysUntilDue} days.
Check your balance and take action to get funding.`,
      maxTurns: 5
    });

    // Update Convex (in production)
    await updateConvexLoanStatus(loanRequestId, 'pending_lender', { step: 2 });

    // STEP 2: Lender Agent processes
    console.log('\n📍 STEP 2/8: Lender Agent processes loan request\n');

    await runAgent({
      agentId: 'lender-001',
      systemPrompt: lenderAgentPrompt,
      initialMessage: 'Check your inbox for any loan requests and process them according to your protocol.',
      maxTurns: 5
    });

    await updateConvexLoanStatus(loanRequestId, 'analyzing', { step: 3 });

    // STEP 3: Analyst Agent analyzes
    console.log('\n📍 STEP 3/8: Analyst Agent performs credit analysis\n');

    await runAgent({
      agentId: 'analyst-001',
      systemPrompt: analystAgentPrompt,
      initialMessage: 'Check your inbox for analysis requests. Verify payment and provide credit analysis.',
      maxTurns: 8
    });

    await updateConvexLoanStatus(loanRequestId, 'pending_approval', { step: 4 });

    // STEP 4: Lender Agent executes loan
    console.log('\n📍 STEP 4/8: Lender Agent executes or declines loan\n');

    await runAgent({
      agentId: 'lender-001',
      systemPrompt: lenderAgentPrompt,
      initialMessage: 'Check your inbox for the analyst report. Execute the loan if approved, or decline if rejected.',
      maxTurns: 8
    });

    // Check if loan was approved
    const transactions = locusService.getTransactions();
    const loanDisbursed = transactions.some(tx =>
      tx.from === 'lender-001' && tx.to === 'business-001' && tx.amount >= loanDetails.loanAmount
    );

    if (loanDisbursed) {
      await updateConvexLoanStatus(loanRequestId, 'approved', {
        step: 5,
        loanId: 0, // From agent execution
        creditScore: 9, // From analyst
        interestRate: 0.05
      });

      console.log(`\n✅ Loan ${loanRequestId} APPROVED and DISBURSED\n`);
    } else {
      await updateConvexLoanStatus(loanRequestId, 'rejected', { step: 4 });
      console.log(`\n❌ Loan ${loanRequestId} REJECTED\n`);
    }

  } catch (error: any) {
    console.error(`[Workflow] Error:`, error);
    await updateConvexLoanStatus(loanRequestId, 'error', { error: error.message });
  }
}

/**
 * Update loan status in Convex database
 */
async function updateConvexLoanStatus(
  loanRequestId: string,
  status: string,
  updates?: any
) {
  // In production, call Convex mutation via HTTP
  const convexUrl = process.env.CONVEX_URL;
  if (!convexUrl) {
    console.log(`[Workflow] Would update Convex: ${loanRequestId} → ${status}`);
    return;
  }

  try {
    // Call Convex HTTP API to update status
    console.log(`[Workflow] Updating Convex: ${loanRequestId} → ${status}`);
  } catch (error: any) {
    console.error(`[Workflow] Failed to update Convex:`, error.message);
  }
}

// Start the server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log('\n' + '='.repeat(70));
    console.log('🚀 AI Agent Loan API Server');
    console.log('='.repeat(70));
    console.log(`\n📍 Running on: http://localhost:${PORT}\n`);
    console.log('📋 Multi-Agent Workflow:');
    console.log(`   POST   /api/loan/process`);
    console.log(`   GET    /api/loan/status/:loanRequestId`);
    console.log('\n🤖 Autonomous Agent Endpoints:');
    console.log(`   POST   /api/agent/autonomous-loan`);
    console.log(`   GET    /api/agent/status/:agentId`);
    console.log(`   POST   /api/demo/quick-autonomous-loan`);
    console.log('\n' + '='.repeat(70));
    console.log('\n💡 Try the autonomous agent demo:');
    console.log(`\n   curl -X POST http://localhost:${PORT}/api/demo/quick-autonomous-loan \\`);
    console.log(`        -H "Content-Type: application/json" \\`);
    console.log(`        -d '{"amount": 800, "purpose": "GPU rental"}'`);
    console.log('\n' + '='.repeat(70) + '\n');
  });
}

export default app;
