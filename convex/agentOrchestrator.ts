/**
 * Agent Orchestrator
 *
 * High-level functions to run agents with proper configuration.
 */

import { action } from "./_generated/server";
import { v } from "convex/values";
import { getAgentPrompt } from "./agentPrompts";
import { allTools } from "./agentTools";

/**
 * Run a single agent by ID
 */
export const runAgentById = action({
  args: {
    agentId: v.string(),
    initialMessage: v.optional(v.string()),
    maxTurns: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { api } = await import("./_generated/api");
    
    // Get agent from database
    const agent = await ctx.runQuery((api as any).agents.getAgent, {
      agentId: args.agentId,
    });

    if (!agent) {
      throw new Error(`Agent ${args.agentId} not found`);
    }

    // Get system prompt based on agent type
    const systemPrompt = getAgentPrompt(
      agent.agentType as "business" | "lender" | "analyst"
    );

    // Run the agent
    return await ctx.runAction((api as any).agentRunner.runAgent, {
      agentId: args.agentId,
      systemPrompt,
      initialMessage: args.initialMessage,
      maxTurns: args.maxTurns || 10,
      tools: allTools,
    });
  },
});

/**
 * Run multiple agents in sequence
 */
export const runAgentSequence = action({
  args: {
    agentIds: v.array(v.string()),
    maxTurns: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { api } = await import("./_generated/api");
    const results = [];

    for (const agentId of args.agentIds) {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`Running agent: ${agentId}`);
      console.log(`${"=".repeat(60)}\n`);

      const result = await ctx.runAction((api as any).agentOrchestrator.runAgentById, {
        agentId,
        maxTurns: args.maxTurns,
      });

      results.push({
        agentId,
        result,
      });
    }

    return results;
  },
});

/**
 * Demo: Run a complete loan workflow
 */
export const runLoanWorkflowDemo = action({
  args: {},
  handler: async (ctx) => {
    const { api } = await import("./_generated/api");
    console.log("\n🎬 Starting Loan Workflow Demo\n");

    // Step 1: Business agent mints invoice and requests loan
    console.log("Step 1: Business agent requests loan...");
    const businessResult = await ctx.runAction((api as any).agentOrchestrator.runAgentById, {
      agentId: "business-001",
      initialMessage:
        "You have a $5000 invoice from a customer due in 30 days. Mint it as an NFT and request a loan.",
      maxTurns: 5,
    });

    // Step 2: Analyst analyzes the request
    console.log("\nStep 2: Analyst reviews the loan request...");
    const analystResult = await ctx.runAction((api as any).agentOrchestrator.runAgentById, {
      agentId: "analyst-001",
      maxTurns: 3,
    });

    // Step 3: Lender reviews and approves
    console.log("\nStep 3: Lender reviews and decides...");
    const lenderResult = await ctx.runAction((api as any).agentOrchestrator.runAgentById, {
      agentId: "lender-001",
      maxTurns: 5,
    });

    return {
      workflow: "loan_request",
      steps: [
        { agent: "business-001", result: businessResult },
        { agent: "analyst-001", result: analystResult },
        { agent: "lender-001", result: lenderResult },
      ],
    };
  },
});
