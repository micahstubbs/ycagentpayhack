import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Internal mutations for processing Stripe webhook events
 * These are called by the HTTP action and handle the business logic
 */

export const recordWebhookEvent = internalMutation({
  args: {
    eventId: v.string(),
    eventType: v.string(),
    eventData: v.any(),
  },
  handler: async (ctx, args) => {
    // Check if we've already processed this event (idempotency)
    const existing = await ctx.db
      .query("stripeEvents")
      .withIndex("by_event_id", (q) => q.eq("eventId", args.eventId))
      .first();

    if (existing) {
      console.log(`[Convex] Event ${args.eventId} already processed`);
      return existing._id;
    }

    // Store the event
    const eventId = await ctx.db.insert("stripeEvents", {
      eventId: args.eventId,
      eventType: args.eventType,
      metadata: args.eventData,
      processed: false,
    });

    console.log(`[Convex] Recorded webhook event: ${args.eventType}`);
    return eventId;
  },
});

export const handleTransferCreated = internalMutation({
  args: {
    transfer: v.any(),
  },
  handler: async (ctx, args) => {
    const transfer = args.transfer;
    const agentId = transfer.metadata?.agentId;
    const amountUsd = transfer.amount / 100; // Convert cents to dollars

    if (!agentId) {
      console.error("[Convex] No agentId in transfer metadata");
      return;
    }

    console.log(`[Convex] Processing transfer.created for agent ${agentId}`);

    // Convert USD to USDC (1:1 for hackathon)
    const usdcAmount = amountUsd;

    // Create a funding transaction record
    const transactionId = await ctx.db.insert("fundingTransactions", {
      agentId,
      stripeTransferId: transfer.id,
      amountUsd,
      amountUsdc: usdcAmount,
      status: "pending",
      createdAt: Date.now(),
    });

    console.log(`[Convex] Created funding transaction ${transactionId}`);

    // In a real implementation, we would call Locus API here
    // For the hackathon, we'll log this and rely on the external service
    console.log(`[Convex] Would deposit ${usdcAmount} USDC to agent ${agentId} via Locus`);

    // Update the funding transaction to completed
    // (In production, this would happen after Locus confirms)
    await ctx.db.patch(transactionId, {
      status: "completed",
      completedAt: Date.now(),
      locusTransactionId: `locus_tx_${Date.now()}_${agentId}`,
    });

    // Mark the event as processed
    const event = await ctx.db
      .query("stripeEvents")
      .withIndex("by_event_id", (q) => q.eq("eventId", transfer.id))
      .first();

    if (event) {
      await ctx.db.patch(event._id, {
        processed: true,
        processedAt: Date.now(),
        agentId,
        amount: amountUsd,
      });
    }

    console.log(`[Convex] Deposited ${usdcAmount} USDC to agent ${agentId}`);
  },
});

export const handlePaymentIntentSucceeded = internalMutation({
  args: {
    paymentIntent: v.any(),
  },
  handler: async (ctx, args) => {
    const paymentIntent = args.paymentIntent;
    const agentId = paymentIntent.metadata?.agentId;
    const purpose = paymentIntent.metadata?.purpose;

    if (purpose === "fund_agent" && agentId) {
      console.log(`[Convex] Agent ${agentId} funding payment succeeded`);
      // Transfer will be created separately, handled by transfer.created event

      // Mark the event as processed
      const event = await ctx.db
        .query("stripeEvents")
        .withIndex("by_event_id", (q) => q.eq("eventId", paymentIntent.id))
        .first();

      if (event) {
        await ctx.db.patch(event._id, {
          processed: true,
          processedAt: Date.now(),
          agentId,
          amount: paymentIntent.amount / 100,
        });
      }
    }
  },
});
