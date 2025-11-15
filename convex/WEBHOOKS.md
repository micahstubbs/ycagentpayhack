# Stripe Webhooks with Convex

This directory contains the Convex backend implementation for handling Stripe webhooks.

## Architecture

The webhook system uses Convex's HTTP actions to receive Stripe events and process them:

```
Stripe → Convex HTTP Endpoint → Internal Mutations → Database
                                      ↓
                                 Locus Actions (USDC deposit)
```

## Files

- `http.ts` - HTTP router configuration with webhook endpoint
- `stripeWebhooks.ts` - HTTP action that receives webhook events
- `stripeWebhookHandlers.ts` - Internal mutations that process events
- `locusIntegration.ts` - Actions to integrate with Locus service
- `fundingQueries.ts` - Queries to fetch funding data
- `schema.ts` - Database schema with webhook tracking

## Webhook Endpoint

The webhook is available at:
```
https://your-convex-deployment.convex.site/stripe/webhook
```

For local development:
```
http://localhost:3210/stripe/webhook
```

## Supported Events

### transfer.created
When Stripe transfers funds to an agent's Connect account:
1. Record the webhook event
2. Create a funding transaction record
3. Simulate USDC deposit to Locus wallet
4. Mark transaction as completed

### payment_intent.succeeded
When a user's payment intent succeeds:
1. Record the webhook event
2. Log the successful funding
3. Wait for transfer.created event

## Database Schema

### stripeEvents
Tracks all received webhook events for idempotency:
- `eventId` - Stripe event ID
- `eventType` - Event type (e.g., "transfer.created")
- `agentId` - Agent associated with event
- `amount` - Transaction amount
- `processed` - Whether event has been processed
- `processedAt` - Timestamp of processing

### fundingTransactions
Tracks agent funding operations:
- `agentId` - Agent receiving funds
- `stripeTransferId` - Stripe transfer ID
- `amountUsd` - Amount in USD
- `amountUsdc` - Amount in USDC (1:1 for hackathon)
- `locusTransactionId` - Locus transaction ID
- `status` - "pending", "completed", or "failed"
- `createdAt` - Creation timestamp
- `completedAt` - Completion timestamp

## Testing with Stripe CLI

1. Install Stripe CLI:
```bash
brew install stripe/stripe-cli/stripe
```

2. Forward webhooks to Convex:
```bash
stripe listen --forward-to https://your-convex-deployment.convex.site/stripe/webhook
```

For local development:
```bash
stripe listen --forward-to http://localhost:3210/stripe/webhook
```

3. Trigger test events:
```bash
stripe trigger transfer.created
stripe trigger payment_intent.succeeded
```

## Queries

Use these queries to fetch funding data:

```typescript
// Get all funding transactions for an agent
const transactions = useQuery(api.fundingQueries.getAgentFundingTransactions, {
  agentId: "lender-001"
});

// Get agent's total USDC balance
const balance = useQuery(api.fundingQueries.getAgentBalance, {
  agentId: "lender-001"
});

// Get all webhook events
const events = useQuery(api.fundingQueries.getWebhookEvents, {});
```

## Integration with Existing Services

The Convex webhook handlers work alongside the existing Node.js services:

- **StripeService** (`src/services/stripe.service.ts`) - Creates Connect accounts and transfers
- **LocusService** (`src/services/locus.service.ts`) - Mock USDC wallet management
- **AgentRegistry** (`src/services/agent-registry.service.ts`) - Agent identity management

For the hackathon, we simulate Locus deposits in the webhook handler. In production, you would:

1. Import the Locus SDK in `locusIntegration.ts`
2. Call the real Locus API to deposit USDC
3. Update the transaction status based on Locus response

## Environment Variables

Required in `.env.local`:
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Deployment

Convex automatically deploys when you run:
```bash
pnpm convex dev
```

Or for production:
```bash
pnpm convex deploy
```

The webhook endpoint URL will be printed in the console.
