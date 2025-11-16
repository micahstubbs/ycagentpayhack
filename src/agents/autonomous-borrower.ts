/**
 * Autonomous Borrower Agent
 *
 * An AI agent that autonomously:
 * 1. Monitors its financial needs
 * 2. Requests loans when cash flow is tight
 * 3. Provides invoice collateral
 * 4. Manages loan repayment
 */

import Anthropic from '@anthropic-ai/sdk';
import { allTools, executeTool } from './tools';
import * as dotenv from 'dotenv';

dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export interface BorrowerNeed {
  purpose: string;          // e.g., "GPU compute rental", "API credits"
  amountNeeded: number;     // USDC needed
  deadline?: string;        // When funds are needed by
  invoiceAmount?: number;   // Amount of invoice to use as collateral
  invoiceDebtor?: string;   // Who owes the invoice
  invoiceDueDate?: string;  // When invoice is due
}

/**
 * Create an autonomous borrower agent
 */
export async function createAutonomousBorrower(
  agentId: string,
  need: BorrowerNeed
): Promise<void> {
  console.log('\n' + '='.repeat(70));
  console.log(`🤖 Autonomous Borrower Agent: ${agentId}`);
  console.log('='.repeat(70));
  console.log('\nNeed:', JSON.stringify(need, null, 2));
  console.log('\n');

  const systemPrompt = `You are an autonomous AI agent managing financial operations for a business.

Your Identity: ${agentId}

Current Situation:
- Purpose: ${need.purpose}
- Amount needed: ${need.amountNeeded} USDC
${need.deadline ? `- Deadline: ${need.deadline}` : ''}
${need.invoiceAmount ? `- Available invoice: ${need.invoiceAmount} USDC from ${need.invoiceDebtor}, due ${need.invoiceDueDate}` : ''}

Your Mission:
1. Check your current USDC balance
2. If you have sufficient funds, proceed with the purchase
3. If funds are insufficient:
   - Mint an Invoice NFT from your receivable
   - Request a loan from the lending platform
   - Use the loan proceeds for your purpose
4. Track the loan and plan for repayment when the invoice is paid

Available Tools:
- get_payment_context: Check your Locus balance and payment capabilities
- send_to_contact: Send USDC to whitelisted contacts
- send_to_address: Send USDC to any address
- send_to_email: Send USDC via email escrow
- mint_invoice_nft: Create NFT from your invoice
- get_invoice_details: Check invoice status
- approve_nft_transfer: Approve NFT for escrow
- create_loan: Create a loan (lender tool, but you can request via messaging)
- get_loan_status: Check loan details
- settle_loan: Pay back your loan
- send_message_to_agent: Communicate with other agents (lender, analyst)
- check_inbox: See messages from other agents
- analyze_invoice: Get credit analysis
- calculate_risk_score: Assess loan risk

Decision Rules:
- Only borrow what you need (don't over-borrow)
- Ensure invoice amount > loan amount (leave room for interest)
- Communicate clearly with lender about your needs
- Track your obligations and repay on time

Be autonomous, efficient, and financially responsible.`;

  const initialMessage = `You need ${need.amountNeeded} USDC for ${need.purpose}.
${need.deadline ? `You need it by ${need.deadline}. ` : ''}
${need.invoiceAmount ? `You have a ${need.invoiceAmount} USDC invoice from ${need.invoiceDebtor} due ${need.invoiceDueDate}. ` : ''}

Check your balance and take the necessary actions to get the funds you need.`;

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: initialMessage }
  ];

  let conversationActive = true;
  let turnCount = 0;
  const maxTurns = 15;

  while (conversationActive && turnCount < maxTurns) {
    turnCount++;
    console.log(`\n--- Turn ${turnCount}/${maxTurns} ---\n`);

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        messages,
        tools: allTools,
      });

      console.log(`Stop reason: ${response.stop_reason}`);

      // Add assistant response to conversation
      messages.push({
        role: 'assistant',
        content: response.content
      });

      // Check for text blocks (thinking/response)
      const textBlocks = response.content.filter(block => block.type === 'text');
      if (textBlocks.length > 0) {
        const text = textBlocks.map(b => 'text' in b ? b.text : '').join('\n');
        console.log(`\n💭 Agent thinking:\n${text}\n`);
      }

      // If agent is done
      if (response.stop_reason === 'end_turn') {
        console.log(`\n✅ Agent ${agentId} completed its task`);
        conversationActive = false;
        break;
      }

      // Execute tool calls
      if (response.stop_reason === 'tool_use') {
        const toolResults: Anthropic.MessageParam = {
          role: 'user',
          content: []
        };

        for (const block of response.content) {
          if (block.type === 'tool_use') {
            console.log(`\n🔧 Tool: ${block.name}`);
            console.log(`Input: ${JSON.stringify(block.input, null, 2)}`);

            try {
              const result = await executeTool(block.name, block.input);
              console.log(`✅ Result: ${JSON.stringify(result, null, 2)}`);

              (toolResults.content as any[]).push({
                type: 'tool_result',
                tool_use_id: block.id,
                content: JSON.stringify(result)
              });
            } catch (error: any) {
              console.error(`❌ Error: ${error.message}`);

              (toolResults.content as any[]).push({
                type: 'tool_result',
                tool_use_id: block.id,
                is_error: true,
                content: error.message
              });
            }
          }
        }

        messages.push(toolResults);
      }
    } catch (error: any) {
      console.error(`\n❌ Agent error on turn ${turnCount}:`, error.message);
      conversationActive = false;
    }
  }

  if (turnCount >= maxTurns) {
    console.log(`\n⚠️  Agent ${agentId} reached max turns (${maxTurns})`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('🏁 Agent session ended');
  console.log('='.repeat(70) + '\n');
}

/**
 * Run demo: Autonomous agent requests loan
 */
export async function runAutonomousBorrowerDemo() {
  const borrowerNeed: BorrowerNeed = {
    purpose: 'Rent H200 GPU cluster for AI model training',
    amountNeeded: 800,
    deadline: '2 hours from now',
    invoiceAmount: 1000,
    invoiceDebtor: '0xdebtor123abc',
    invoiceDueDate: '30 days from now'
  };

  await createAutonomousBorrower('autonomous-business-001', borrowerNeed);
}

// Run if called directly
if (require.main === module) {
  runAutonomousBorrowerDemo().catch((error) => {
    console.error('\n❌ Demo failed:', error);
    process.exit(1);
  });
}
