# TICKET-001: Migrate Locus Balance State to Convex Database

**Priority**: Medium
**Type**: Architectural Improvement
**Estimated Effort**: 2-3 hours
**Created**: 2025-11-15
**Status**: Not Started

---

## Problem Statement

### Current Implementation (Global Map)

The `LocusService` currently uses a global in-memory `Map<string, number>` to track agent USDC balances:

```typescript
// src/services/locus.service.ts
const globalBalances = new Map<string, number>();

export class LocusService {
  private balances: Map<string, number> = globalBalances;
  // ...
}
```

### Why This Is Suboptimal

1. **No Persistence**: Balances are lost on server/process restart
2. **No History**: Can't track transaction history or audit trail
3. **Inconsistent with Architecture**: Rest of the app uses Convex database
4. **No Real-time Updates**: Frontend can't subscribe to balance changes
5. **State Fragmentation**: Multiple sources of truth (Locus Map, Convex fundingTransactions)

### Why We Used Global Map (Short-term Fix)

The original bug (#1 from CODE_REVIEW.md) was that each `LocusService` instance had its own isolated `Map`, causing balances to reset between service calls. The global Map was a **quick fix** to ensure state consistency during the hackathon, but it's not the proper long-term solution.

---

## Proposed Solution: Convex Database

Migrate Locus balance tracking to Convex database tables, similar to how agent funding transactions are already tracked.

### Benefits

✅ **Persistence** - Balances survive restarts
✅ **Real-time Subscriptions** - Frontend gets instant balance updates
✅ **Transaction History** - Complete audit trail
✅ **Consistency** - Single source of truth in Convex
✅ **Type Safety** - Convex schema validation
✅ **Better Developer Experience** - Query balances with Convex queries

---

## Implementation Plan

### 1. Update Convex Schema

Add `locusBalances` and `locusTransactions` tables:

```typescript
// convex/schema.ts
export default defineSchema({
  // ... existing tables

  locusBalances: defineTable({
    agentId: v.string(),
    balance: v.number(),
    lastUpdated: v.number(),
  }).index("by_agent", ["agentId"]),

  locusTransactions: defineTable({
    transactionId: v.string(),
    fromAgent: v.optional(v.string()), // null for deposits
    toAgent: v.string(),
    amount: v.number(),
    type: v.union(v.literal("deposit"), v.literal("transfer")),
    timestamp: v.number(),
    status: v.string(), // "completed", "pending", "failed"
  }).index("by_agent", ["toAgent"])
    .index("by_from_agent", ["fromAgent"]),
});
```

### 2. Create Convex Locus Mutations

```typescript
// convex/locusService.ts

export const depositUSDC = internalMutation({
  args: {
    agentId: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    // Get current balance
    const balance = await ctx.db
      .query("locusBalances")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .first();

    const currentBalance = balance?.balance || 0;
    const newBalance = currentBalance + args.amount;

    if (balance) {
      // Update existing
      await ctx.db.patch(balance._id, {
        balance: newBalance,
        lastUpdated: Date.now(),
      });
    } else {
      // Create new
      await ctx.db.insert("locusBalances", {
        agentId: args.agentId,
        balance: newBalance,
        lastUpdated: Date.now(),
      });
    }

    // Record transaction
    const txId = `locus_tx_${Date.now()}_${args.agentId}`;
    await ctx.db.insert("locusTransactions", {
      transactionId: txId,
      toAgent: args.agentId,
      amount: args.amount,
      type: "deposit",
      timestamp: Date.now(),
      status: "completed",
    });

    console.log(`[Locus DB] Deposited ${args.amount} USDC to ${args.agentId}`);
    return txId;
  },
});

export const transfer = internalMutation({
  args: {
    fromAgent: v.string(),
    toAgent: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    // Get sender balance
    const fromBalance = await ctx.db
      .query("locusBalances")
      .withIndex("by_agent", (q) => q.eq("agentId", args.fromAgent))
      .first();

    const currentBalance = fromBalance?.balance || 0;

    if (currentBalance < args.amount) {
      throw new Error(`Insufficient balance for ${args.fromAgent}`);
    }

    // Deduct from sender
    if (fromBalance) {
      await ctx.db.patch(fromBalance._id, {
        balance: currentBalance - args.amount,
        lastUpdated: Date.now(),
      });
    }

    // Add to recipient
    const toBalance = await ctx.db
      .query("locusBalances")
      .withIndex("by_agent", (q) => q.eq("agentId", args.toAgent))
      .first();

    if (toBalance) {
      await ctx.db.patch(toBalance._id, {
        balance: toBalance.balance + args.amount,
        lastUpdated: Date.now(),
      });
    } else {
      await ctx.db.insert("locusBalances", {
        agentId: args.toAgent,
        balance: args.amount,
        lastUpdated: Date.now(),
      });
    }

    // Record transaction
    const txId = `locus_tx_${Date.now()}_${args.fromAgent}_to_${args.toAgent}`;
    await ctx.db.insert("locusTransactions", {
      transactionId: txId,
      fromAgent: args.fromAgent,
      toAgent: args.toAgent,
      amount: args.amount,
      type: "transfer",
      timestamp: Date.now(),
      status: "completed",
    });

    console.log(`[Locus DB] Transferred ${args.amount} USDC from ${args.fromAgent} to ${args.toAgent}`);
    return txId;
  },
});

export const getBalance = query({
  args: { agentId: v.string() },
  handler: async (ctx, args) => {
    const balance = await ctx.db
      .query("locusBalances")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .first();

    return balance?.balance || 0;
  },
});
```

### 3. Update convex/locusIntegration.ts

Replace mock actions with calls to the new mutations:

```typescript
// convex/locusIntegration.ts
export const depositUSDC = action({
  args: { agentId: v.string(), amount: v.number() },
  handler: async (ctx, args) => {
    const txId = await ctx.runMutation(internal.locusService.depositUSDC, args);

    return {
      success: true,
      transactionId: txId,
      agentId: args.agentId,
      amount: args.amount,
    };
  },
});
```

### 4. Update src/services/locus.service.ts

Make it call Convex instead of using local state:

```typescript
// src/services/locus.service.ts
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

export class LocusService {
  private client: ConvexHttpClient;

  constructor() {
    this.client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  }

  async depositUSDC(agentId: string, amount: number): Promise<string> {
    return await this.client.action(api.locusIntegration.depositUSDC, {
      agentId,
      amount,
    });
  }

  async getBalance(agentId: string): Promise<number> {
    return await this.client.query(api.locusService.getBalance, { agentId });
  }

  async transfer(fromAgent: string, toAgent: string, amount: number): Promise<string> {
    return await this.client.action(api.locusIntegration.transfer, {
      fromAgent,
      toAgent,
      amount,
    });
  }
}
```

---

## Migration Strategy

1. **Deploy schema changes** to Convex
2. **Migrate existing balances** from global Map to Convex (if any exist in running instance)
3. **Update LocusService** to use Convex client
4. **Test integration** with webhook flow and agent tools
5. **Update documentation** to reflect new architecture

---

## Testing Checklist

- [ ] Schema deploys successfully
- [ ] depositUSDC creates/updates balance records
- [ ] transfer validates balances and updates both parties
- [ ] getBalance returns correct values
- [ ] Webhook integration still works
- [ ] Agent tools can call Locus functions
- [ ] Demo script completes successfully
- [ ] Frontend can subscribe to balance changes

---

## Risks & Mitigations

**Risk**: Convex cold starts could add latency
**Mitigation**: Acceptable for hackathon; optimize if needed

**Risk**: Breaking changes to existing code
**Mitigation**: Comprehensive testing before deployment

**Risk**: Migration complexity
**Mitigation**: Start fresh - no need to migrate data for hackathon

---

## Why This Should Be Done

### For Hackathon Demo
- **More Impressive**: Shows proper architecture with database persistence
- **Real-time Dashboard**: Can show live balance updates during demo
- **Better Story**: "Built on Convex serverless platform" vs "in-memory map"

### For Production
- **Required**: Can't use in-memory state in production
- **Scalability**: Database scales, global Map doesn't
- **Reliability**: Survives restarts and failures

---

## Acceptance Criteria

- [ ] All Locus balances stored in Convex database
- [ ] All Locus transactions recorded with audit trail
- [ ] LocusService calls Convex instead of using local state
- [ ] All existing tests still pass
- [ ] Demo script works end-to-end
- [ ] Documentation updated
- [ ] Global Map removed from locus.service.ts

---

## Related Files

- `/Users/m/workspace/ycagentpayhack/src/services/locus.service.ts` - Main service file
- `/Users/m/workspace/ycagentpayhack/convex/locusIntegration.ts` - Convex actions
- `/Users/m/workspace/ycagentpayhack/convex/schema.ts` - Database schema
- `/Users/m/workspace/ycagentpayhack/src/demo/run-demo.ts` - Demo script using Locus
- `/Users/m/workspace/ycagentpayhack/convex/stripeWebhookHandlers.ts` - Webhook deposit calls

---

## Notes

This ticket was created after implementing a quick fix (global Map) for the state isolation bug. The global Map works for the hackathon but should be replaced with proper database storage for production readiness and better demo presentation.
