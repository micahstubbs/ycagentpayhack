# Convex Webhook Quickstart

## Webhook Endpoint

```
POST https://[your-deployment].convex.site/stripe/webhook
```

Local dev:
```
POST http://127.0.0.1:3210/stripe/webhook
```

## Supported Events

- `transfer.created` - Deposits USDC to Locus wallet
- `payment_intent.succeeded` - Logs successful funding

## Query Examples

```typescript
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

// Get agent balance
const balance = useQuery(api.fundingQueries.getAgentBalance, {
  agentId: "lender-001"
});
// Returns: { agentId: string, totalUsdc: number, transactionCount: number }

// Get funding transactions
const transactions = useQuery(api.fundingQueries.getAgentFundingTransactions, {
  agentId: "lender-001"
});
// Returns: Array of transaction objects

// Get all webhook events
const events = useQuery(api.fundingQueries.getWebhookEvents, {});
// Returns: Array of webhook event objects
```

## Testing with Stripe CLI

```bash
# 1. Start Convex
pnpm convex dev

# 2. Forward webhooks
stripe listen --forward-to http://127.0.0.1:3210/stripe/webhook

# 3. Trigger events
stripe trigger transfer.created
stripe trigger payment_intent.succeeded
```

## Database Tables

### stripeEvents
- `eventId` - Stripe event ID
- `eventType` - Event type
- `agentId` - Associated agent
- `amount` - Transaction amount
- `processed` - Processing status

### fundingTransactions
- `agentId` - Agent receiving funds
- `stripeTransferId` - Stripe transfer ID
- `amountUsd` - USD amount
- `amountUsdc` - USDC amount
- `status` - "pending" | "completed" | "failed"
- `locusTransactionId` - Locus transaction ID

## Environment Variables

Add to `.env.local`:
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Integration with Services

Works with existing:
- `stripeService` (src/services/stripe.service.ts)
- `locusService` (src/services/locus.service.ts)
- `agentRegistry` (src/services/agent-registry.service.ts)

## Documentation

- Full guide: `convex/WEBHOOKS.md`
- Testing: `docs/WEBHOOK_TESTING.md`
- Summary: `docs/TASK_8_SUMMARY.md`
