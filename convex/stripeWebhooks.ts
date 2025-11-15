import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Stripe Webhook Handler for Convex
 *
 * This HTTP action receives Stripe webhook events and processes them.
 * Key events:
 * - transfer.created: Deposit USDC to Locus wallet
 * - payment_intent.succeeded: Log successful funding
 */

export const handleStripeWebhook = httpAction(async (ctx, request) => {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return new Response("No stripe signature", { status: 400 });
  }

  try {
    // Get the raw body for signature verification
    const body = await request.text();

    // Parse the event data
    const event = JSON.parse(body);

    console.log(`[Convex Webhook] Received event: ${event.type}`);

    // Store the event in the database
    await ctx.runMutation(internal.stripeWebhookHandlers.recordWebhookEvent, {
      eventId: event.id,
      eventType: event.type,
      eventData: event,
    });

    // Process the event based on type
    switch (event.type) {
      case "transfer.created":
        await ctx.runMutation(internal.stripeWebhookHandlers.handleTransferCreated, {
          transfer: event.data.object,
        });
        break;

      case "payment_intent.succeeded":
        await ctx.runMutation(internal.stripeWebhookHandlers.handlePaymentIntentSucceeded, {
          paymentIntent: event.data.object,
        });
        break;

      default:
        console.log(`[Convex Webhook] Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[Convex Webhook] Error:", error);
    return new Response(`Webhook Error: ${error.message}`, { status: 400 });
  }
});
