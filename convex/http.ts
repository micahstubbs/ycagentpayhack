import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { handleStripeWebhook } from "./stripeWebhooks";

const http = httpRouter();

auth.addHttpRoutes(http);

// Stripe webhook endpoint
http.route({
  path: "/stripe/webhook",
  method: "POST",
  handler: handleStripeWebhook,
});

export default http;
