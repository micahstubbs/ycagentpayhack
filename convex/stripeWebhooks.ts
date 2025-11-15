import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import Stripe from "stripe";

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

    // CRITICAL: Verify webhook signature before processing
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.warn("[Convex Webhook] WARNING: No STRIPE_WEBHOOK_SECRET set - skipping verification (dev mode)");
      // In dev mode without secret, parse directly (insecure but allows testing)
      const event = JSON.parse(body);
      console.log(`[Convex Webhook] DEV MODE - Received unverified event: ${event.type}`);
    } else {
      // Production mode: verify signature
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!,{
        apiVersion: '2025-10-29.clover' as any,
      });

      const event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );

      console.log(`[Convex Webhook] ✅ Verified event: ${event.type}`);
    }

    // Parse event for processing (use verified event if available, or parsed for dev)
    const event = webhookSecret
      ? (() => {
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
            apiVersion: '2025-10-29.clover' as any,
          });
          return stripe.webhooks.constructEvent(body, signature, webhookSecret);
        })()
      : JSON.parse(body);

    console.log(`[Convex Webhook] Processing event: ${event.type}`);

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
