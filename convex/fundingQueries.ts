import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Queries for funding transactions and webhook events
 */

export const getAgentFundingTransactions = query({
  args: {
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("fundingTransactions")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .collect();

    return transactions;
  },
});

export const getAllFundingTransactions = query({
  args: {},
  handler: async (ctx) => {
    const transactions = await ctx.db
      .query("fundingTransactions")
      .collect();

    return transactions;
  },
});

export const getWebhookEvents = query({
  args: {
    eventType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("stripeEvents");

    const events = await query.collect();

    if (args.eventType) {
      return events.filter((e) => e.eventType === args.eventType);
    }

    return events;
  },
});

export const getAgentBalance = query({
  args: {
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    // Calculate total USDC deposited to this agent
    const transactions = await ctx.db
      .query("fundingTransactions")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .collect();

    const totalUsdc = transactions.reduce(
      (sum, tx) => sum + tx.amountUsdc,
      0
    );

    return {
      agentId: args.agentId,
      totalUsdc,
      transactionCount: transactions.length,
    };
  },
});
