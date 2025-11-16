import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema is normally optional, but Convex Auth
// requires indexes defined on `authTables`.
export default defineSchema({
  ...authTables,
  messages: defineTable({
    userId: v.id("users"),
    body: v.string(),
  }),

  // Stripe webhook events tracking
  stripeEvents: defineTable({
    eventId: v.string(),
    eventType: v.string(),
    agentId: v.optional(v.string()),
    amount: v.optional(v.number()),
    metadata: v.optional(v.any()),
    processed: v.boolean(),
    processedAt: v.optional(v.number()),
    error: v.optional(v.string()),
  }).index("by_event_id", ["eventId"]),

  // Agent funding transactions
  fundingTransactions: defineTable({
    agentId: v.string(),
    stripeTransferId: v.string(),
    amountUsd: v.number(),
    amountUsdc: v.number(),
    locusTransactionId: v.optional(v.string()),
    status: v.string(), // "pending", "completed", "failed"
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  }).index("by_agent", ["agentId"]),

  // Agent registry (replaces file-based agent-registry.json)
  agents: defineTable({
    agentId: v.string(),
    agentType: v.string(), // "business", "lender", "analyst"
    stripeConnectAccountId: v.string(),
    locusWalletAddress: v.string(),
    baseWalletAddress: v.string(),
  }).index("by_agent_id", ["agentId"]),

  // Agent messages (for inter-agent communication)
  agentMessages: defineTable({
    messageId: v.string(),
    from: v.string(), // sender agent ID
    to: v.string(), // recipient agent ID
    type: v.string(), // "request", "response", "notification"
    subject: v.string(),
    payload: v.any(),
    read: v.boolean(),
    timestamp: v.number(),
  })
    .index("by_recipient", ["to", "read"])
    .index("by_message_id", ["messageId"]),

  // Agent execution history
  agentExecutions: defineTable({
    agentId: v.string(),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    status: v.string(), // "running", "completed", "failed"
    turns: v.number(),
    toolCalls: v.number(),
    finalResponse: v.optional(v.string()),
    error: v.optional(v.string()),
  }).index("by_agent", ["agentId", "startTime"]),

  // Agent execution logs (for real-time display)
  agentLogs: defineTable({
    executionId: v.id("agentExecutions"),
    timestamp: v.number(),
    level: v.string(), // "info", "tool", "thinking", "error"
    message: v.string(),
    data: v.optional(v.any()),
  }).index("by_execution", ["executionId", "timestamp"]),
});
