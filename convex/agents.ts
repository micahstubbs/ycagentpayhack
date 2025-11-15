import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Agent Registry Management
 *
 * These functions manage agent identities in Convex database,
 * replacing the file-based agent-registry.json approach.
 */

/**
 * Create a new agent
 */
export const createAgent = mutation({
  args: {
    agentId: v.string(),
    agentType: v.string(),
    stripeConnectAccountId: v.string(),
    locusWalletAddress: v.string(),
    baseWalletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if agent already exists
    const existing = await ctx.db
      .query("agents")
      .withIndex("by_agent_id", (q) => q.eq("agentId", args.agentId))
      .first();

    if (existing) {
      throw new Error(`Agent ${args.agentId} already exists`);
    }

    const agentId = await ctx.db.insert("agents", {
      agentId: args.agentId,
      agentType: args.agentType,
      stripeConnectAccountId: args.stripeConnectAccountId,
      locusWalletAddress: args.locusWalletAddress,
      baseWalletAddress: args.baseWalletAddress,
    });

    console.log(`[Convex] Created agent ${args.agentId}`);
    return agentId;
  },
});

/**
 * Get an agent by ID
 */
export const getAgent = query({
  args: {
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_agent_id", (q) => q.eq("agentId", args.agentId))
      .first();

    return agent;
  },
});

/**
 * Get all agents
 */
export const getAllAgents = query({
  args: {},
  handler: async (ctx) => {
    const agents = await ctx.db.query("agents").collect();
    return agents;
  },
});

/**
 * Get agents by type
 */
export const getAgentsByType = query({
  args: {
    agentType: v.string(),
  },
  handler: async (ctx, args) => {
    const agents = await ctx.db.query("agents").collect();
    return agents.filter((agent) => agent.agentType === args.agentType);
  },
});

/**
 * Sync agents from file system to Convex
 * (Helper for migration)
 */
export const syncAgentsFromRegistry = mutation({
  args: {
    agents: v.array(
      v.object({
        agentId: v.string(),
        agentType: v.string(),
        stripeConnectAccountId: v.string(),
        locusWalletAddress: v.string(),
        baseWalletAddress: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const synced = [];

    for (const agent of args.agents) {
      // Check if already exists
      const existing = await ctx.db
        .query("agents")
        .withIndex("by_agent_id", (q) => q.eq("agentId", agent.agentId))
        .first();

      if (!existing) {
        const id = await ctx.db.insert("agents", agent);
        synced.push({ agentId: agent.agentId, id });
      }
    }

    console.log(`[Convex] Synced ${synced.length} agents to database`);
    return synced;
  },
});
