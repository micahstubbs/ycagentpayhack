# Funding API Quick Start

This guide shows how to use the Convex-based funding API to fund AI agents via Stripe.

## Prerequisites

1. Convex backend running: `pnpm convex dev`
2. Agents synced to Convex database (see below)
3. Environment variables set (`.env` file)

## Step 1: Sync Agents to Convex

If you've already created agents using `yarn init:agents`, sync them to Convex:

```bash
# Sync agents from file to Convex database
yarn sync:agents
```

This reads `data/agent-registry.json` and imports all agents into the Convex `agents` table.

**Verify sync:**
```typescript
// In React component or Node.js script
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
const agents = await client.query(api.agents.getAllAgents);
console.log("Agents in Convex:", agents);
```

## Step 2: Execute Funding

### Option A: Direct Funding (Mock Mode)

For testing without real Stripe, use `executeFunding` directly:

```typescript
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

// Fund lender agent with $1000
const result = await client.action(api.funding.executeFunding, {
  agentId: "lender-001",
  amountUsd: 1000,
});

console.log("Transfer ID:", result.transferId);
console.log("Success:", result.success);
```

In mock mode (when `STRIPE_SECRET_KEY` is missing or contains `...`):
- Creates mock transfer ID
- Records transaction in database
- Immediately marks as completed
- Simulates Locus USDC deposit

### Option B: Payment Flow (Real Stripe)

For production with real Stripe:

**1. Create Payment Intent:**
```typescript
const intent = await client.action(api.funding.createFundingIntent, {
  agentId: "lender-001",
  amountUsd: 1000,
});

// Use intent.clientSecret with Stripe Elements on frontend
```

**2. User completes payment** (using Stripe Elements)

**3. Execute transfer:**
```typescript
const result = await client.action(api.funding.executeFunding, {
  agentId: "lender-001",
  amountUsd: 1000,
});
```

**4. Webhook processes transfer** and deposits USDC to Locus

## Step 3: Query Balances

```typescript
const balances = await client.action(api.funding.getAgentBalances, {
  agentId: "lender-001",
});

console.log("Stripe USD:", balances.balances.stripe_usd);
console.log("Locus USDC:", balances.balances.locus_usdc);
console.log("Total deposited:", balances.balances.convex_total_deposited);
```

## Step 4: View Transaction History

```typescript
const history = await client.query(api.funding.getAgentFundingHistory, {
  agentId: "lender-001",
});

history.forEach(tx => {
  console.log(`${tx.status}: $${tx.amountUsd} at ${new Date(tx.createdAt)}`);
});
```

## React Component Example

```typescript
"use client";

import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";

export function FundAgentButton({ agentId }: { agentId: string }) {
  const executeFunding = useAction(api.funding.executeFunding);
  const balances = useAction(api.funding.getAgentBalances);
  const [loading, setLoading] = useState(false);

  const handleFund = async () => {
    setLoading(true);
    try {
      // Execute funding
      const result = await executeFunding({
        agentId,
        amountUsd: 1000,
      });

      console.log("Funded!", result);

      // Query updated balances
      const updated = await balances({ agentId });
      console.log("New balance:", updated.balances.locus_usdc);

      alert(`Successfully funded ${agentId} with $1000!`);
    } catch (error) {
      console.error("Funding failed:", error);
      alert("Funding failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleFund} disabled={loading}>
      {loading ? "Funding..." : "Fund Agent $1000"}
    </button>
  );
}
```

## Admin Dashboard Example

```typescript
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function AgentDashboard() {
  const allBalances = useQuery(api.funding.getAllAgentBalances);

  return (
    <div>
      <h2>All Agent Balances</h2>
      <table>
        <thead>
          <tr>
            <th>Agent ID</th>
            <th>Total USDC</th>
            <th>Transactions</th>
          </tr>
        </thead>
        <tbody>
          {allBalances?.map(agent => (
            <tr key={agent.agentId}>
              <td>{agent.agentId}</td>
              <td>${agent.totalUsdc}</td>
              <td>{agent.transactionCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## Testing Checklist

- [ ] Sync agents to Convex: `yarn sync:agents`
- [ ] Verify agents exist: `api.agents.getAllAgents`
- [ ] Fund agent: `api.funding.executeFunding`
- [ ] Check balances: `api.funding.getAgentBalances`
- [ ] View history: `api.funding.getAgentFundingHistory`
- [ ] Test with multiple agents
- [ ] Verify transactions in Convex dashboard

## Mock vs Real Stripe

### Mock Mode (Default)
```bash
# .env
STRIPE_SECRET_KEY=sk_test_...  # Leave as placeholder
```

- Instant transactions
- No webhook delays
- Perfect for development

### Real Stripe Mode
```bash
# .env
STRIPE_SECRET_KEY=sk_test_51ABC...  # Real key
STRIPE_WEBHOOK_SECRET=whsec_...     # From Stripe CLI
```

- Real Stripe API calls
- Webhook processing
- Test with real credit cards (Stripe test mode)

## Troubleshooting

### Agent Not Found
```
Error: Agent lender-001 not found
```

**Solution:** Sync agents to Convex
```bash
yarn sync:agents
```

### Convex URL Not Set
```
Error: NEXT_PUBLIC_CONVEX_URL environment variable not set
```

**Solution:** Add to `.env`
```bash
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
```

### Transaction Stuck in Pending
```
Status: pending (never completed)
```

**Solution (Mock Mode):** Check console logs for errors

**Solution (Real Stripe):**
1. Check webhook is running: `stripe listen --forward-to http://localhost:3000/stripe/webhook`
2. Verify webhook secret matches `.env`
3. Check Convex logs for webhook errors

## Next Steps

1. **Build UI**: Create frontend components for funding
2. **Add Error Handling**: User-friendly error messages
3. **Real Locus Integration**: Replace mock with real Locus SDK
4. **Analytics**: Track funding metrics and trends
5. **Multi-Agent Funding**: Fund multiple agents at once

## Related Docs

- [Funding API Documentation](./FUNDING_API.md) - Complete API reference
- [Webhooks Documentation](./WEBHOOKS.md) - Stripe webhook handling
- [Schema](./schema.ts) - Database schema

---

**Quick Commands:**

```bash
# Sync agents to Convex
yarn sync:agents

# Start Convex dev server
pnpm convex dev

# Test funding (Node.js)
node -e "
const { ConvexHttpClient } = require('convex/browser');
const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
client.action('funding:executeFunding', { agentId: 'lender-001', amountUsd: 100 })
  .then(r => console.log('Funded!', r));
"
```
