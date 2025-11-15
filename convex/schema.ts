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
});
