# Funding API Documentation

This document describes the Convex-based funding flow API for managing AI agent funding via Stripe.

## Overview

The funding flow enables users to fund AI agents via Stripe, which then converts to USDC in Locus wallets:

1. **Create Funding Intent**: Generate a Stripe Payment Intent for funding
2. **Execute Funding**: Transfer funds to agent's Stripe Connect account
3. **Webhook Processing**: Stripe webhook deposits USDC to Locus (see `WEBHOOKS.md`)
4. **Query Balances**: Check agent balances across Stripe and Locus

## API Functions

### `createFundingIntent` (Action)

Creates a Stripe Payment Intent for funding an agent.

**Arguments:**
```typescript
{
  agentId: string;    // ID of the agent to fund
  amountUsd: number;  // Amount in USD to fund
}
```

**Returns:**
```typescript
{
  clientSecret: string;        // Stripe client secret for frontend
  agentId: string;
  amountUsd: number;
  paymentIntentId?: string;    // Stripe payment intent ID (omitted in mock mode)
  mock?: boolean;              // True if using mock Stripe
}
```

**Example Usage (Client):**
```typescript
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

const createIntent = useAction(api.funding.createFundingIntent);

const handleFunding = async () => {
  const result = await createIntent({
    agentId: "lender-001",
    amountUsd: 1000,
  });

  // Use result.clientSecret with Stripe Elements
  console.log("Client secret:", result.clientSecret);
};
```

**Example Usage (Server):**
```typescript
import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

const result = await client.action(api.funding.createFundingIntent, {
  agentId: "lender-001",
  amountUsd: 1000,
});
```

**Notes:**
- Validates that `amountUsd > 0`
- Works in both real and mock Stripe modes
- Mock mode is enabled when `STRIPE_SECRET_KEY` is missing or contains `...`

---

### `executeFunding` (Action)

Executes the actual funding by transferring to the agent's Stripe Connect account.

**Arguments:**
```typescript
{
  agentId: string;    // ID of the agent to fund
  amountUsd: number;  // Amount in USD to transfer
}
```

**Returns:**
```typescript
{
  success: boolean;
  agentId: string;
  amountUsd: number;
  transferId: string;  // Stripe transfer ID or mock ID
}
```

**Example Usage:**
```typescript
const executeFund = useAction(api.funding.executeFunding);

const result = await executeFund({
  agentId: "lender-001",
  amountUsd: 1000,
});

console.log("Transfer ID:", result.transferId);
```

**Flow:**
1. Loads agent from registry file (`data/agent-registry.json`)
2. Creates Stripe transfer to Connect account
3. Records transaction in `fundingTransactions` table
4. In mock mode, immediately deposits to Locus
5. In real mode, webhook handles Locus deposit when transfer confirms

**Notes:**
- Requires agent to exist in registry
- Creates `pending` funding transaction
- Webhook updates transaction to `completed` when Stripe confirms

---

### `getAgentBalances` (Action)

Queries agent balances from Stripe, Locus, and Convex database.

**Arguments:**
```typescript
{
  agentId: string;  // ID of the agent
}
```

**Returns:**
```typescript
{
  agentId: string;
  balances: {
    stripe_usd: number;              // Stripe Connect account balance (USD)
    locus_usdc: number;              // Locus wallet balance (USDC)
    convex_total_deposited: number;  // Total deposited via Convex (USDC)
  };
  transactionCount: number;
}
```

**Example Usage:**
```typescript
const getBalances = useAction(api.funding.getAgentBalances);

const balances = await getBalances({
  agentId: "lender-001",
});

console.log("Stripe USD:", balances.balances.stripe_usd);
console.log("Locus USDC:", balances.balances.locus_usdc);
console.log("Total deposited:", balances.balances.convex_total_deposited);
```

**Notes:**
- `stripe_usd`: Current available balance in Stripe Connect account
- `locus_usdc`: Current balance in mock Locus service (in-memory)
- `convex_total_deposited`: Historical total from Convex database
- In production, `locus_usdc` would query real Locus API

---

### `getAllAgentBalances` (Query)

Gets summary balances for all agents (useful for admin dashboard).

**Arguments:** None

**Returns:**
```typescript
Array<{
  agentId: string;
  totalUsdc: number;
  transactionCount: number;
}>
```

**Example Usage:**
```typescript
const allBalances = useQuery(api.funding.getAllAgentBalances);

allBalances?.forEach(agent => {
  console.log(`${agent.agentId}: ${agent.totalUsdc} USDC (${agent.transactionCount} txs)`);
});
```

---

### `getAgentFundingHistory` (Query)

Gets complete funding transaction history for an agent.

**Arguments:**
```typescript
{
  agentId: string;
}
```

**Returns:**
```typescript
Array<{
  _id: Id<"fundingTransactions">;
  _creationTime: number;
  agentId: string;
  stripeTransferId: string;
  amountUsd: number;
  amountUsdc: number;
  status: "pending" | "completed" | "failed";
  createdAt: number;
  completedAt?: number;
  locusTransactionId?: string;
}>
```

**Example Usage:**
```typescript
const history = useQuery(api.funding.getAgentFundingHistory, {
  agentId: "lender-001",
});

history?.forEach(tx => {
  console.log(`${tx.status}: $${tx.amountUsd} at ${new Date(tx.createdAt)}`);
});
```

---

## Database Schema

### `fundingTransactions` Table

Tracks all funding transactions from Stripe to agent accounts.

**Fields:**
```typescript
{
  agentId: string;              // Agent identifier
  stripeTransferId: string;     // Stripe transfer ID
  amountUsd: number;            // Amount in USD
  amountUsdc: number;           // Converted USDC amount (1:1 for hackathon)
  status: string;               // "pending", "completed", "failed"
  createdAt: number;            // Timestamp when created
  completedAt?: number;         // Timestamp when completed
  locusTransactionId?: string;  // Locus transaction ID
}
```

**Indexes:**
- `by_agent`: Index on `agentId` for efficient agent-specific queries

---

## Integration with Services

### StripeService

The funding API integrates with `src/services/stripe.service.ts`:

```typescript
// Create payment intent
const clientSecret = await stripeService.createFundingPaymentIntent(agentId, amountUsd);

// Transfer to Connect account
const transferId = await stripeService.transferToConnectAccount(
  accountId,
  amountUsd,
  agentId
);

// Get balance
const balance = await stripeService.getConnectAccountBalance(accountId);
```

### LocusService

Integration with `src/services/locus.service.ts` (mock for hackathon):

```typescript
// Deposit USDC (called by webhook)
const txId = await locusService.depositUSDC(agentId, amountUsdc);

// Get balance
const balance = await locusService.getBalance(agentId);
```

### AgentRegistry

Loads agent data from `src/services/agent-registry.service.ts`:

```typescript
// Get agent
const agent = agentRegistry.getAgent(agentId);
const stripeAccountId = agent.stripeConnectAccountId;
```

---

## Complete Funding Flow

### 1. Create Payment Intent (Frontend)

```typescript
// In React component
const createIntent = useAction(api.funding.createFundingIntent);
const [clientSecret, setClientSecret] = useState<string>();

const handleFund = async () => {
  const result = await createIntent({
    agentId: "lender-001",
    amountUsd: 1000,
  });
  setClientSecret(result.clientSecret);
};
```

### 2. Complete Payment (Frontend with Stripe Elements)

```typescript
// Use Stripe Elements to complete payment
const stripe = await loadStripe(publishableKey);
const { error } = await stripe.confirmCardPayment(clientSecret, {
  payment_method: {
    card: cardElement,
  },
});
```

### 3. Execute Transfer (Backend)

```typescript
// After payment succeeds
const result = await ctx.runAction(api.funding.executeFunding, {
  agentId: "lender-001",
  amountUsd: 1000,
});
```

### 4. Webhook Processing (Automatic)

Stripe webhook receives `transfer.created` event and:
- Records event in `stripeEvents` table
- Creates `fundingTransactions` record
- Deposits USDC to Locus wallet
- Updates transaction status to `completed`

See `WEBHOOKS.md` for details.

### 5. Query Balances

```typescript
const balances = await ctx.runAction(api.funding.getAgentBalances, {
  agentId: "lender-001",
});

console.log("Balance:", balances.balances.locus_usdc);
```

---

## Error Handling

### Validation Errors

```typescript
// Amount validation
if (amountUsd <= 0) {
  throw new Error("Amount must be greater than 0");
}

// Agent existence
if (!agent) {
  throw new Error(`Agent ${agentId} not found`);
}
```

### Stripe Errors

```typescript
try {
  const transfer = await stripe.transfers.create(...);
} catch (error) {
  console.error("[Stripe] Transfer failed:", error);
  throw error;
}
```

### Webhook Errors

Recorded in `stripeEvents.error` field:
```typescript
await ctx.db.patch(eventId, {
  processed: true,
  error: error.message,
});
```

---

## Mock Mode

When `STRIPE_SECRET_KEY` is missing or contains `...`, the API runs in mock mode:

- **Payment Intents**: Returns mock client secrets
- **Transfers**: Returns mock transfer IDs, immediately deposits to Locus
- **Balances**: Returns 0 for Stripe balances
- **Webhooks**: Can be simulated manually

**Enable Mock Mode:**
```bash
# In .env
STRIPE_SECRET_KEY=sk_test_...  # Leave as placeholder
```

---

## Testing

### Test Funding Flow

```typescript
// 1. Create intent
const intent = await client.action(api.funding.createFundingIntent, {
  agentId: "lender-001",
  amountUsd: 100,
});

// 2. Execute funding
const result = await client.action(api.funding.executeFunding, {
  agentId: "lender-001",
  amountUsd: 100,
});

// 3. Check balances
const balances = await client.action(api.funding.getAgentBalances, {
  agentId: "lender-001",
});

console.assert(balances.balances.locus_usdc >= 100, "USDC deposited");
```

### Test Transaction History

```typescript
const history = await client.query(api.funding.getAgentFundingHistory, {
  agentId: "lender-001",
});

console.assert(history.length > 0, "Transaction recorded");
console.assert(history[0].status === "completed", "Transaction completed");
```

---

## Next Steps

1. **Frontend Integration**: Build UI for funding agents using Stripe Elements
2. **Real Locus Integration**: Replace mock service with real Locus SDK
3. **Production Stripe**: Add real Stripe keys and test with live mode
4. **Error Handling**: Add retry logic and user notifications
5. **Analytics**: Add dashboard for tracking funding metrics

---

## Related Documentation

- [Webhooks Documentation](./WEBHOOKS.md) - Stripe webhook handling
- [Schema Documentation](./schema.ts) - Database schema
- [Funding Queries](./fundingQueries.ts) - Read-only queries

---

**Last Updated**: Task 9 Implementation
**Status**: Complete - Ready for testing
