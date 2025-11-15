# Testing Stripe Webhooks with Convex

This guide explains how to test the Stripe webhook integration with Convex.

## Prerequisites

- Convex backend running (`pnpm convex dev`)
- Stripe CLI installed (`brew install stripe/stripe-cli/stripe`)
- Stripe account in test mode

## Getting the Webhook URL

### Local Development

When you run `pnpm convex dev`, you'll see output like:
```
Convex functions running at http://127.0.0.1:3210
```

Your webhook endpoint will be:
```
http://127.0.0.1:3210/stripe/webhook
```

### Production Deployment

After running `pnpm convex deploy`, you'll get a URL like:
```
https://your-deployment-name.convex.site
```

Your webhook endpoint will be:
```
https://your-deployment-name.convex.site/stripe/webhook
```

## Testing with Stripe CLI

### 1. Login to Stripe CLI

```bash
stripe login
```

### 2. Forward Webhooks to Local Convex

```bash
stripe listen --forward-to http://127.0.0.1:3210/stripe/webhook
```

You'll see output like:
```
> Ready! Your webhook signing secret is whsec_xxxxx
```

Add this to your `.env.local`:
```
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### 3. Trigger Test Events

In a new terminal:

```bash
# Test transfer.created event
stripe trigger transfer.created

# Test payment_intent.succeeded event
stripe trigger payment_intent.succeeded
```

### 4. View Webhook Events

You should see logs in your Convex terminal showing:
- Event received
- Event type
- Processing status

## Manual Testing with cURL

You can also test the webhook manually:

```bash
curl -X POST http://127.0.0.1:3210/stripe/webhook \
  -H "Content-Type: application/json" \
  -H "stripe-signature: test_signature" \
  -d '{
    "id": "evt_test_123",
    "type": "transfer.created",
    "data": {
      "object": {
        "id": "tr_test_123",
        "amount": 100000,
        "metadata": {
          "agentId": "lender-001"
        }
      }
    }
  }'
```

## Viewing Webhook Data in Convex

Use the Convex dashboard to query webhook events:

```typescript
// In Convex dashboard or your app
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

// Get all webhook events
const events = useQuery(api.fundingQueries.getWebhookEvents, {});

// Get funding transactions for an agent
const transactions = useQuery(api.fundingQueries.getAgentFundingTransactions, {
  agentId: "lender-001"
});

// Get agent balance
const balance = useQuery(api.fundingQueries.getAgentBalance, {
  agentId: "lender-001"
});
```

## Production Webhook Setup

1. Deploy Convex:
```bash
pnpm convex deploy
```

2. Get your webhook URL:
```
https://your-deployment-name.convex.site/stripe/webhook
```

3. Add webhook endpoint in Stripe Dashboard:
   - Go to https://dashboard.stripe.com/test/webhooks
   - Click "Add endpoint"
   - Enter your Convex webhook URL
   - Select events:
     - `transfer.created`
     - `payment_intent.succeeded`
   - Copy the signing secret

4. Add the signing secret to your Convex environment:
```bash
npx convex env set STRIPE_WEBHOOK_SECRET whsec_xxxxx
```

## Troubleshooting

### Webhook not receiving events
- Check Convex is running: `pnpm convex dev`
- Verify webhook URL is correct
- Check Stripe CLI is forwarding: `stripe listen`

### Events not being processed
- Check Convex logs for errors
- Verify event types are supported (transfer.created, payment_intent.succeeded)
- Check database schema is deployed

### Testing with real Stripe account
- Update `.env.local` with real Stripe keys
- Fund agent accounts via the funding API
- Trigger real transfers in Stripe dashboard

## Expected Flow

1. User funds agent via Stripe payment
2. Stripe creates payment intent → `payment_intent.succeeded` webhook
3. Platform creates transfer to Connect account
4. Stripe sends `transfer.created` webhook to Convex
5. Convex receives webhook → stores in `stripeEvents` table
6. Convex processes transfer → creates `fundingTransactions` record
7. Convex calls Locus to deposit USDC (simulated for hackathon)
8. Frontend queries updated balance via `getAgentBalance`

## Webhook Event Examples

### transfer.created
```json
{
  "id": "evt_xxx",
  "type": "transfer.created",
  "data": {
    "object": {
      "id": "tr_xxx",
      "amount": 100000,
      "currency": "usd",
      "destination": "acct_xxx",
      "metadata": {
        "agentId": "lender-001"
      }
    }
  }
}
```

### payment_intent.succeeded
```json
{
  "id": "evt_xxx",
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_xxx",
      "amount": 100000,
      "currency": "usd",
      "metadata": {
        "agentId": "lender-001",
        "purpose": "fund_agent"
      }
    }
  }
}
```

## Next Steps

After testing webhooks:
1. Implement funding flow API (Task 9)
2. Test end-to-end agent funding
3. Integrate with frontend for real-time balance updates
