import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * Loan Request Management
 *
 * Handles creating loan requests from the frontend and tracking their status
 * through the 8-step agent workflow
 */

export const create = mutation({
  args: {
    invoiceAmount: v.number(),
    loanAmount: v.number(),
    debtorAddress: v.string(),
    daysUntilDue: v.number(),
    purpose: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not signed in");
    }

    // Create loan request
    const loanRequestId = await ctx.db.insert("loanRequests", {
      userId,
      invoiceAmount: args.invoiceAmount,
      loanAmount: args.loanAmount,
      debtorAddress: args.debtorAddress,
      daysUntilDue: args.daysUntilDue,
      purpose: args.purpose,
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    console.log(`[Convex] Created loan request ${loanRequestId} for user ${userId}`);

    // Trigger agent workflow (via action)
    await ctx.scheduler.runAfter(0, api.loans.triggerAgentWorkflow, {
      loanRequestId,
    });

    return loanRequestId;
  },
});

export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }

    const loans = await ctx.db
      .query("loanRequests")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return loans;
  },
});

export const getById = query({
  args: { loanRequestId: v.id("loanRequests") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not signed in");
    }

    const loan = await ctx.db.get(args.loanRequestId);

    if (!loan) {
      throw new Error("Loan request not found");
    }

    // Verify ownership
    if (loan.userId !== userId) {
      throw new Error("Unauthorized");
    }

    return loan;
  },
});

export const updateStatus = mutation({
  args: {
    loanRequestId: v.id("loanRequests"),
    status: v.string(),
    updates: v.optional(v.object({
      invoiceTokenId: v.optional(v.number()),
      creditScore: v.optional(v.number()),
      interestRate: v.optional(v.number()),
      loanId: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.loanRequestId, {
      status: args.status,
      updatedAt: Date.now(),
      ...args.updates,
    });

    console.log(`[Convex] Updated loan request ${args.loanRequestId} status to ${args.status}`);
  },
});

/**
 * Action to trigger the agent workflow
 * This runs the autonomous agent system for a loan request
 */
export const triggerAgentWorkflow = action({
  args: { loanRequestId: v.id("loanRequests") },
  handler: async (ctx, args) => {
    // Get loan request details
    const loanRequest = await ctx.runQuery(api.loans.getById, {
      loanRequestId: args.loanRequestId,
    });

    if (!loanRequest) {
      console.error(`[Convex] Loan request ${args.loanRequestId} not found`);
      return;
    }

    console.log(`[Convex] Triggering agent workflow for loan request ${args.loanRequestId}`);

    // Call the agent backend API
    try {
      const response = await fetch(`${process.env.AGENT_BACKEND_URL || 'http://localhost:3001'}/api/loan/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          loanRequestId: args.loanRequestId,
          invoiceAmount: loanRequest.invoiceAmount,
          loanAmount: loanRequest.loanAmount,
          debtorAddress: loanRequest.debtorAddress,
          daysUntilDue: loanRequest.daysUntilDue,
          purpose: loanRequest.purpose,
        }),
      });

      if (!response.ok) {
        throw new Error(`Agent backend returned ${response.status}`);
      }

      const result = await response.json();
      console.log(`[Convex] Agent workflow initiated:`, result);

      // Update status to analyzing
      await ctx.runMutation(api.loans.updateStatus, {
        loanRequestId: args.loanRequestId,
        status: "analyzing",
      });

    } catch (error: any) {
      console.error(`[Convex] Failed to trigger agent workflow:`, error.message);

      await ctx.runMutation(api.loans.updateStatus, {
        loanRequestId: args.loanRequestId,
        status: "error",
      });
    }
  },
});
