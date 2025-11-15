import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

/**
 * Funding Flow API
 *
 * Convex mutations and queries for managing agent funding via Stripe.
 * This replaces the Express-based funding controller from the original plan.
 */

/**
 * Create a Stripe Payment Intent for funding an agent
 *
 * This creates a client secret that can be used to complete payment on the frontend.
 */
export const createFundingIntent = action({
  args: {
    agentId: v.string(),
    amountUsd: v.number(),
  },
  handler: async (ctx, args) => {
    const { agentId, amountUsd } = args;

    if (amountUsd <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    // Verify agent exists
    const agent = await ctx.runQuery(api.agents.getAgent, { agentId });
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    console.log(`[Funding] Creating funding intent for agent ${agentId}: $${amountUsd}`);

    // Import Stripe SDK dynamically in action
    const Stripe = (await import("stripe")).default;
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey || stripeSecretKey.includes('...')) {
      // Mock mode
      const mockSecret = `pi_mock_${agentId}_${Date.now()}_secret`;
      console.log(`[Mock Stripe] Created payment intent for $${amountUsd}`);

      return {
        clientSecret: mockSecret,
        agentId,
        amountUsd,
        mock: true,
      };
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-10-29.clover',
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amountUsd * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        purpose: 'fund_agent',
        agentId,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret!,
      agentId,
      amountUsd,
      paymentIntentId: paymentIntent.id,
    };
  },
});

/**
 * Execute funding by transferring to Stripe Connect account
 *
 * This triggers the actual transfer to the agent's Stripe Connect account.
 * The webhook will handle the Locus USDC deposit when Stripe confirms the transfer.
 */
export const executeFunding = action({
  args: {
    agentId: v.string(),
    amountUsd: v.number(),
  },
  handler: async (ctx, args) => {
    const { agentId, amountUsd } = args;

    if (amountUsd <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    console.log(`[Funding] Executing funding for agent ${agentId}: $${amountUsd}`);

    // Get agent from Convex
    const agent = await ctx.runQuery(api.agents.getAgent, { agentId });
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const stripeConnectAccountId = agent.stripeConnectAccountId;

    // Import Stripe SDK
    const Stripe = (await import("stripe")).default;
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    let transferId: string;

    if (!stripeSecretKey || stripeSecretKey.includes('...')) {
      // Mock mode
      transferId = `tr_mock_${agentId}_${Date.now()}`;
      console.log(`[Mock Stripe] Transferred $${amountUsd} to ${stripeConnectAccountId}`);

      // In mock mode, immediately record and complete the transaction
      await ctx.runMutation(api.funding.recordFundingTransaction, {
        agentId,
        transferId,
        amountUsd,
      });

      // Simulate webhook by marking as completed
      await ctx.runMutation(api.funding.completeFundingTransaction, {
        transferId,
        locusTransactionId: `locus_tx_${Date.now()}_${agentId}`,
      });
    } else {
      const stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2025-10-29.clover',
      });

      const transfer = await stripe.transfers.create({
        amount: Math.round(amountUsd * 100), // Convert to cents
        currency: 'usd',
        destination: stripeConnectAccountId,
        metadata: {
          agentId,
        },
      });

      transferId = transfer.id;
      console.log(`[Stripe] Created transfer ${transferId} for $${amountUsd}`);

      // Record the funding transaction
      await ctx.runMutation(api.funding.recordFundingTransaction, {
        agentId,
        transferId,
        amountUsd,
      });
    }

    return {
      success: true,
      agentId,
      amountUsd,
      transferId,
    };
  },
});

/**
 * Internal mutation to record a funding transaction
 */
export const recordFundingTransaction = mutation({
  args: {
    agentId: v.string(),
    transferId: v.string(),
    amountUsd: v.number(),
  },
  handler: async (ctx, args) => {
    const { agentId, transferId, amountUsd } = args;

    const transactionId = await ctx.db.insert("fundingTransactions", {
      agentId,
      stripeTransferId: transferId,
      amountUsd,
      amountUsdc: amountUsd, // 1:1 conversion for hackathon
      status: "pending",
      createdAt: Date.now(),
    });

    console.log(`[Convex] Recorded funding transaction ${transactionId}`);

    return transactionId;
  },
});

/**
 * Internal mutation to complete a funding transaction
 * (Called by webhook or mock simulation)
 */
export const completeFundingTransaction = mutation({
  args: {
    transferId: v.string(),
    locusTransactionId: v.string(),
  },
  handler: async (ctx, args) => {
    const { transferId, locusTransactionId } = args;

    // Find the transaction by Stripe transfer ID
    const transactions = await ctx.db.query("fundingTransactions").collect();
    const transaction = transactions.find(tx => tx.stripeTransferId === transferId);

    if (!transaction) {
      console.error(`[Convex] Transaction not found for transfer ${transferId}`);
      return null;
    }

    // Update to completed
    await ctx.db.patch(transaction._id, {
      status: "completed",
      completedAt: Date.now(),
      locusTransactionId,
    });

    console.log(`[Convex] Completed funding transaction for transfer ${transferId}`);

    return transaction._id;
  },
});

/**
 * Query agent balances from Stripe, Locus, and Convex
 *
 * Returns the current balance in Stripe Connect account (USD),
 * Locus wallet (USDC), and total deposited via Convex.
 */
export const getAgentBalances = action({
  args: {
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    const { agentId } = args;

    console.log(`[Funding] Getting balances for agent ${agentId}`);

    // Get agent from Convex
    const agent = await ctx.runQuery(api.agents.getAgent, { agentId });
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // Get Stripe balance
    const Stripe = (await import("stripe")).default;
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    let stripeBalance = 0;

    if (!stripeSecretKey || stripeSecretKey.includes('...')) {
      // Mock mode
      console.log(`[Mock Stripe] Getting balance for account: ${agent.stripeConnectAccountId}`);
      stripeBalance = 0;
    } else {
      const stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2025-10-29.clover',
      });

      try {
        const balance = await stripe.balance.retrieve({
          stripeAccount: agent.stripeConnectAccountId,
        });
        stripeBalance = balance.available[0]?.amount / 100 || 0;
      } catch (error) {
        console.error(`[Stripe] Error getting balance: ${error}`);
        stripeBalance = 0;
      }
    }

    // Get Locus balance (would be from Locus API in production)
    // For hackathon, we estimate from completed transactions
    const locusBalance = 0; // Mock - would query Locus API

    // Get Convex balance (total deposited)
    const convexBalance = await ctx.runQuery(api.fundingQueries.getAgentBalance, {
      agentId,
    });

    return {
      agentId,
      balances: {
        stripe_usd: stripeBalance,
        locus_usdc: convexBalance.totalUsdc, // Use Convex-tracked balance
        convex_total_deposited: convexBalance.totalUsdc,
      },
      transactionCount: convexBalance.transactionCount,
    };
  },
});

/**
 * Query to get all agents with their balances
 * Useful for admin dashboard
 */
export const getAllAgentBalances = query({
  args: {},
  handler: async (ctx) => {
    // Get all unique agent IDs from funding transactions
    const transactions = await ctx.db.query("fundingTransactions").collect();

    const agentIds = new Set(transactions.map(tx => tx.agentId));

    const balances = [];
    for (const agentId of agentIds) {
      const agentTransactions = transactions.filter(tx => tx.agentId === agentId);
      const totalUsdc = agentTransactions
        .filter(tx => tx.status === "completed")
        .reduce((sum, tx) => sum + tx.amountUsdc, 0);

      balances.push({
        agentId,
        totalUsdc,
        transactionCount: agentTransactions.length,
      });
    }

    return balances;
  },
});

/**
 * Query to get funding transaction history for an agent
 */
export const getAgentFundingHistory = query({
  args: {
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("fundingTransactions")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .order("desc")
      .collect();

    return transactions;
  },
});
