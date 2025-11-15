import { action } from "./_generated/server";
import { v } from "convex/values";

/**
 * Locus Integration Actions
 *
 * These actions integrate with the mock Locus service to handle USDC deposits
 * In production, these would call the real Locus API
 */

export const depositUSDC = action({
  args: {
    agentId: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    // For the hackathon, we'll simulate the Locus deposit
    // In production, this would call the Locus API
    console.log(`[Locus Action] Depositing ${args.amount} USDC to agent ${args.agentId}`);

    // Simulate the deposit (in production, use Locus SDK)
    const transactionId = `locus_tx_${Date.now()}_${args.agentId}`;

    console.log(`[Locus Action] Transaction ID: ${transactionId}`);

    return {
      success: true,
      transactionId,
      agentId: args.agentId,
      amount: args.amount,
    };
  },
});

export const getBalance = action({
  args: {
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    // For the hackathon, we'll return a mock balance
    // In production, this would call the Locus API
    console.log(`[Locus Action] Getting balance for agent ${args.agentId}`);

    // Simulate balance check (in production, use Locus SDK)
    return {
      agentId: args.agentId,
      balance: 0, // Would query from Locus
    };
  },
});
