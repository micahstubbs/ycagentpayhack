# Locus Integration Architecture

## Locus's Role in the System

Locus serves as the **Agent Payment Layer**, enabling fast, low-cost USDC transfers between AI agents.

```mermaid
graph TB
    subgraph "INPUT: Fiat On-Ramp"
        User[Human User<br/>💳 Credit Card]
        Stripe[Stripe Platform<br/>$1000 USD]
    end

    subgraph "CONVERSION: Platform Backend"
        Convex[Convex Backend<br/>Webhook Handler]
        Conversion[USD → USDC<br/>1:1 Conversion<br/>Mock for demo]
    end

    subgraph "LOCUS LAYER: Agent Commerce"
        LocusService[Locus Service<br/>src/services/locus.service.ts]

        subgraph "Locus Wallets (USDC Balances)"
            W1[Business Agent<br/>💰 0 → 800 → 0 USDC]
            W2[Lender Agent<br/>💰 0 → 1000 → 980 → 840 USDC]
            W3[Analyst Agent<br/>💰 0 → 20 USDC]
            W4[Compute Provider<br/>💰 0 → 800 USDC]
        end

        LocusOps[Locus Operations]
        Deposit[📥 depositUSDC<br/>Add funds to wallet]
        Transfer[💸 transfer<br/>Agent-to-agent payment]
        Balance[🔍 getBalance<br/>Check wallet balance]

        LocusService --> LocusOps
        LocusOps --> Deposit
        LocusOps --> Transfer
        LocusOps --> Balance
    end

    subgraph "OUTPUT: Blockchain Settlement"
        Base[Base Smart Contract<br/>LoanEscrow.sol]
        Settlement[Final Settlement<br/>840 USDC to Lender<br/>160 USDC to Business]
    end

    %% Flow connections
    User -->|1. Fund Agent| Stripe
    Stripe -->|2. Webhook| Convex
    Convex -->|3. Convert| Conversion
    Conversion -->|4. Deposit| LocusService
    LocusService -->|5. Credit to Wallet| W2

    %% Agent-to-Agent Payments
    W2 -.->|Payment #1<br/>20 USDC<br/>Credit Analysis Fee| W3
    W1 -.->|Payment #2<br/>800 USDC<br/>H200 Compute Rental| W4

    %% Blockchain Integration
    W2 -.->|Loan Funding<br/>via Base Contract| Base
    Base -.->|Settlement| Settlement
    Settlement -.->|Update Balances| W2
    Settlement -.->|Update Balances| W1

    style User fill:#e1f5ff
    style Stripe fill:#635bff,color:#fff
    style Convex fill:#f97316,color:#fff
    style LocusService fill:#22c55e,color:#fff
    style W1 fill:#fef3c7
    style W2 fill:#fef3c7
    style W3 fill:#fef3c7
    style W4 fill:#fef3c7
    style Base fill:#0052ff,color:#fff
```

---

## Locus Transaction Flow

### Transaction 1: Deposit (Stripe → Locus)

```mermaid
sequenceDiagram
    participant Stripe
    participant Webhook as Convex Webhook
    participant Locus as LocusService
    participant Wallet as Lender Wallet

    Note over Stripe: transfer.created event
    Stripe->>Webhook: POST /stripe/webhook
    Note over Webhook: eventType: transfer.created<br/>amount: $1000

    Webhook->>Webhook: Verify signature
    Webhook->>Webhook: Record event in DB

    Webhook->>Locus: depositUSDC(lender-001, 1000)
    Locus->>Locus: currentBalance = 0
    Locus->>Locus: newBalance = 0 + 1000 = 1000
    Locus->>Wallet: Set balance to 1000 USDC

    Locus-->>Webhook: transactionId: locus_tx_...
    Webhook->>Webhook: Update funding transaction status

    Note over Wallet: Balance: 1000 USDC ✅
```

---

### Transaction 2: Agent-to-Agent Transfer (Lender → Analyst)

```mermaid
sequenceDiagram
    participant Lender as Lender Agent
    participant Tool as Locus Tools
    participant Locus as LocusService
    participant LenderWallet as Lender Wallet<br/>(980 USDC)
    participant AnalystWallet as Analyst Wallet<br/>(0 USDC)

    Lender->>Tool: transfer_usdc<br/>(from: lender-001, to: analyst-001, amount: 20)
    Tool->>Locus: transfer(lender-001, analyst-001, 20)

    Locus->>LenderWallet: Get balance
    LenderWallet-->>Locus: 1000 USDC

    Locus->>Locus: Validate: 1000 >= 20 ✅

    Locus->>LenderWallet: Deduct 20 USDC
    Note over LenderWallet: 1000 - 20 = 980 USDC

    Locus->>AnalystWallet: Add 20 USDC
    Note over AnalystWallet: 0 + 20 = 20 USDC

    Locus->>Locus: Generate transaction ID
    Locus-->>Tool: transactionId: locus_tx_..._lender-001_to_analyst-001

    Tool-->>Lender: Transfer complete ✅

    Note over LenderWallet: Final: 980 USDC
    Note over AnalystWallet: Final: 20 USDC (earned)
```

---

## Locus Service Architecture

```mermaid
graph TB
    subgraph "Locus Service Implementation"
        LocusService[LocusService Class<br/>src/services/locus.service.ts]
        GlobalState[(Global Balance Map<br/>In-Memory State)]

        subgraph "Public Methods"
            M1[depositUSDC]
            M2[transfer]
            M3[getBalance]
            M4[createWallet]
        end

        LocusService --> M1
        LocusService --> M2
        LocusService --> M3
        LocusService --> M4

        M1 -->|updates| GlobalState
        M2 -->|updates| GlobalState
        M3 -->|reads from| GlobalState
        M4 -->|initializes| GlobalState
    end

    subgraph "Consumers"
        C1[Convex Webhooks<br/>Deposit on funding]
        C2[Agent Tools<br/>Locus tools]
        C3[Demo Script<br/>Balance queries]
        C4[Funding API<br/>Balance aggregation]
    end

    subgraph "Future: Real Locus SDK"
        RealLocus[Real Locus API<br/>Production Integration]
        RealWallet[Real USDC Wallets<br/>On-chain]
    end

    C1 -->|calls| M1
    C2 -->|calls| M2
    C2 -->|calls| M3
    C3 -->|calls| M3
    C4 -->|calls| M3

    LocusService -.->|replace with| RealLocus
    GlobalState -.->|migrate to| RealWallet

    style LocusService fill:#22c55e,color:#fff
    style GlobalState fill:#fef3c7
    style RealLocus fill:#16a34a,color:#fff
```

---

## Locus Payment Scenarios

### Scenario 1: Service Payment (Micro-transaction)

```mermaid
graph LR
    A[Lender Agent<br/>Needs credit analysis] -->|Request| B[Credit Analyst<br/>Fee: $20 USDC]
    A -->|Pay via Locus| C[Locus Transfer<br/>20 USDC]
    C -->|Instant| B
    B -->|Deliver| D[Credit Report<br/>Risk Score: 7/10]
    D -->|Return to| A

    style A fill:#4ecdc4,color:#fff
    style B fill:#ffe66d,color:#000
    style C fill:#22c55e,color:#fff
```

**Why Locus is Perfect for This:**
- **Fast**: Instant transfer, no waiting for settlement
- **Cheap**: Micro-payment friendly (no $0.30 base fee like Stripe)
- **Programmatic**: No human approval needed
- **Agent-to-Agent**: Direct payment between autonomous systems

**Alternative with Stripe:**
- ❌ Can't transfer between Connect accounts
- ❌ $0.30 fee + 2.9% = $0.88 total (440% overhead on $20!)
- ❌ Requires human approval for transfers

---

### Scenario 2: High-Value Payment (Compute Purchase)

```mermaid
graph LR
    A[Business Agent<br/>Needs H200 GPUs] -->|Request| B[Compute Provider<br/>Cost: $800 USDC]
    A -->|Pay via Locus| C[Locus Transfer<br/>800 USDC]
    C -->|Instant| B
    B -->|Provision| D[H200 GPU Time<br/>Reserved]
    D -->|Allocated to| A

    style A fill:#ff6b6b,color:#fff
    style B fill:#a78bfa,color:#fff
    style C fill:#22c55e,color:#fff
```

**Why Locus is Perfect for This:**
- **Instant**: Agent can start compute immediately
- **Autonomous**: No human approval for $800 transfer
- **Atomic**: Payment and service provision can be atomic
- **Programmable**: Easy to integrate with compute APIs

**Alternative with Stripe:**
- ❌ Can't do account-to-account transfers
- ❌ Would need human approval for $800 payment
- ⚠️ ACH settlement takes 2-3 days
- ❌ High fees: $23.50 + $0.30 = $23.80 (3% overhead)

---

## State Management: Current vs. Proposed

### Current Implementation (Hackathon)

```mermaid
graph TB
    subgraph "Current: Global Map (In-Memory)"
        Map[(Global Map<br/>agentId → balance)]
        L1[Agent 1: 1000 USDC]
        L2[Agent 2: 20 USDC]
        L3[Agent 3: 800 USDC]

        Map --> L1
        Map --> L2
        Map --> L3
    end

    Restart[Server Restart]
    Restart -.->|💥 Data Lost| Map

    style Map fill:#fef3c7
    style Restart fill:#fee2e2,color:#991b1b
```

**Pros:**
- ✅ Fast (in-memory)
- ✅ Simple implementation
- ✅ Fixed state isolation bug

**Cons:**
- ❌ Lost on restart
- ❌ No transaction history
- ❌ No real-time subscriptions
- ❌ Not production-ready

---

### Proposed: Convex Database (Production)

```mermaid
graph TB
    subgraph "Proposed: Convex Database (Persistent)"
        ConvexDB[(Convex Database)]

        Balances[locusBalances Table]
        B1[business-001: 160 USDC]
        B2[lender-001: 840 USDC]
        B3[analyst-001: 20 USDC]

        Transactions[locusTransactions Table]
        T1[TX1: Deposit 1000 to lender]
        T2[TX2: Transfer 20 to analyst]
        T3[TX3: Transfer 800 to compute]

        ConvexDB --> Balances
        ConvexDB --> Transactions

        Balances --> B1
        Balances --> B2
        Balances --> B3

        Transactions --> T1
        Transactions --> T2
        Transactions --> T3
    end

    Frontend[Next.js Frontend]
    Frontend -->|Real-time Subscribe| ConvexDB

    Restart[Server Restart]
    Restart -.->|✅ Data Persists| ConvexDB

    style ConvexDB fill:#f97316,color:#fff
    style Restart fill:#dcfce7,color:#166534
```

**Pros:**
- ✅ Persists across restarts
- ✅ Transaction history and audit trail
- ✅ Real-time subscriptions for frontend
- ✅ Production-ready
- ✅ Type-safe with schema

**Cons:**
- ⚠️ Slightly more complex
- ⚠️ Requires migration work

**Migration Ticket**: [Issue #2](https://github.com/micahstubbs/ycagentpayhack/issues/2)

---

## Locus Integration Points

```mermaid
graph TB
    subgraph "Integration Points"
        I1[Convex Webhooks<br/>stripeWebhookHandlers.ts]
        I2[Agent Tools<br/>locus.tools.ts]
        I3[Demo Script<br/>run-demo.ts]
        I4[Funding API<br/>funding.ts]
        I5[Base Service<br/>Loan settlement]
    end

    subgraph "Locus Service"
        LS[LocusService<br/>Central Hub]
        Op1[depositUSDC]
        Op2[transfer]
        Op3[getBalance]
    end

    I1 -->|Stripe webhook| Op1
    I2 -->|Agent calls| Op2
    I2 -->|Agent calls| Op3
    I3 -->|Balance checks| Op3
    I4 -->|Aggregation| Op3

    Op1 --> LS
    Op2 --> LS
    Op3 --> LS

    style LS fill:#22c55e,color:#fff
```

### When Locus is Called

**1. Stripe Webhook (Funding)**
- **Trigger**: User funds agent via Stripe
- **File**: `convex/stripeWebhookHandlers.ts:71-80`
- **Operation**: `depositUSDC(agentId, usdcAmount)`
- **Result**: Agent's Locus wallet credited with USDC

**2. Agent Tool Execution (Transfers)**
- **Trigger**: Agent decides to pay another agent
- **File**: `src/agents/tools/locus.tools.ts:32-50`
- **Operation**: `transfer(fromAgent, toAgent, amount)`
- **Result**: USDC moves between agent wallets

**3. Balance Queries**
- **Trigger**: Agent checks balance, demo displays balances, API queries
- **Files**: Multiple (agent tools, demo script, funding API)
- **Operation**: `getBalance(agentId)`
- **Result**: Current USDC balance returned

---

## Locus vs. Other Components: Clear Separation

```mermaid
graph LR
    subgraph "Stripe's Job"
        S1[Accept fiat from users]
        S2[Manage Connect accounts]
        S3[Send webhooks]
    end

    subgraph "Locus's Job"
        L1[Store USDC balances]
        L2[Transfer between agents]
        L3[Enable micro-payments]
    end

    subgraph "Base's Job"
        B1[Hold NFT collateral]
        B2[Escrow large amounts]
        B3[Trustless settlement]
    end

    subgraph "Convex's Job"
        C1[Coordinate services]
        C2[Store transaction history]
        C3[Provide real-time UI]
    end

    S1 -.->|converts to| L1
    L2 -.->|settles via| B2
    C2 -.->|tracks| L2

    style S1 fill:#635bff,color:#fff
    style L1 fill:#22c55e,color:#fff
    style B1 fill:#0052ff,color:#fff
    style C1 fill:#f97316,color:#fff
```

---

## Why Three Payment Layers Instead of One?

```mermaid
flowchart TD
    Q1{User has crypto wallet?}
    Q1 -->|No - 99% of users| Stripe[Use Stripe<br/>Accept credit cards]
    Q1 -->|Yes - crypto native| Direct[Direct crypto deposit<br/>Skip Stripe]

    Stripe -->|Converts to| USDC[USDC in Locus]
    Direct -->|Deposits| USDC

    USDC --> Q2{What type of payment?}

    Q2 -->|Small: $0.20 - $50| LocusTransfer[Locus Transfer<br/>Fast & cheap]
    Q2 -->|Large: $100+| Q3{Needs escrow?}

    Q3 -->|No trust issues| LocusTransfer
    Q3 -->|Yes - needs guarantee| BaseEscrow[Base Smart Contract<br/>Trustless escrow]

    LocusTransfer --> Done1[Payment Complete<br/>Instant settlement]
    BaseEscrow --> Done2[Payment Complete<br/>On-chain settlement]

    style Stripe fill:#635bff,color:#fff
    style USDC fill:#22c55e,color:#fff
    style LocusTransfer fill:#22c55e,color:#fff
    style BaseEscrow fill:#0052ff,color:#fff
```

**Key Insight**: Each layer solves a different problem:
- **Stripe**: Mainstream user access (fiat on-ramp)
- **Locus**: Fast operational payments (agent-to-agent)
- **Base**: High-value trustless settlements (escrow)

---

## Locus in the Demo Flow: Step-by-Step

```mermaid
stateDiagram-v2
    [*] --> Funded: Step 1: Stripe deposits 1000 USDC<br/>Locus: Lender = 1000

    Funded --> Analysis: Step 4: Lender pays Analyst 20 USDC<br/>Locus: Lender = 980, Analyst = 20

    Analysis --> Loaned: Step 6: Loan created on Base<br/>(Locus balances unchanged)

    Loaned --> Compute: Step 7: Business pays Compute 800 USDC<br/>Locus: Business = 0, Compute = 800

    Compute --> Settled: Step 8: Base settlement<br/>Locus: Lender = 840, Business = 160

    Settled --> [*]

    note right of Funded
        Locus Operation: depositUSDC
        Transaction: External funding
    end note

    note right of Analysis
        Locus Operation: transfer
        Transaction: Service payment
        Fee: 0% of amount
    end note

    note right of Compute
        Locus Operation: transfer
        Transaction: Compute purchase
        Instant settlement
    end note

    note right of Settled
        Final Balances (via Locus):
        - Lender: 840 USDC (+40 profit)
        - Business: 160 USDC (after loan)
        - Analyst: 20 USDC (earned)
        - Compute: 800 USDC (revenue)
    end note
```

---

## Mock vs. Real Locus Implementation

### Current: Mock Implementation

```mermaid
graph LR
    subgraph "Mock Locus (Hackathon)"
        MockService[LocusService<br/>TypeScript Class]
        GlobalMap[(Global Map<br/>In-Memory)]
        MockTx[Mock Transaction IDs<br/>locus_tx_timestamp]

        MockService --> GlobalMap
        MockService --> MockTx
    end

    Calls[Service Calls] -->|depositUSDC| MockService
    Calls -->|transfer| MockService
    Calls -->|getBalance| MockService

    MockService -.->|Future| RealLocus[Real Locus SDK]

    style MockService fill:#fef3c7
    style RealLocus fill:#22c55e,color:#fff
```

**Mock Service Behavior:**
- ✅ Simulates all Locus operations
- ✅ Returns realistic transaction IDs
- ✅ Validates balances (throws on insufficient funds)
- ✅ Console logs all operations
- ⚠️ Data only in memory (lost on restart)
- ⚠️ Not connected to real Locus infrastructure

---

### Future: Real Locus Integration

```mermaid
graph LR
    subgraph "Real Locus (Production)"
        RealService[LocusService<br/>SDK Wrapper]
        LocusAPI[Locus API<br/>api.uselocus.com]
        RealWallet[Real USDC Wallets<br/>On-chain Addresses]

        RealService -->|HTTP/API| LocusAPI
        LocusAPI -->|manages| RealWallet
    end

    Calls[Service Calls] -->|depositUSDC| RealService
    Calls -->|transfer| RealService
    Calls -->|getBalance| RealService

    Webhooks[Locus Webhooks] -.->|confirmation| Backend[Convex Backend]

    style RealService fill:#22c55e,color:#fff
    style LocusAPI fill:#16a34a,color:#fff
```

**Real Service Behavior:**
- ✅ Actually moves USDC on-chain
- ✅ Real wallet addresses
- ✅ Persistent balances
- ✅ Transaction confirmations
- ✅ Webhook notifications
- ⚠️ Requires API keys and configuration
- ⚠️ Subject to rate limits and network issues

---

## Key Metrics: Locus Transaction Volume in Demo

```mermaid
pie title USDC Flow Through Locus (Demo)
    "Funding (Stripe → Locus)" : 1000
    "Service Payment (Lender → Analyst)" : 20
    "Compute Purchase (Business → Provider)" : 800
    "Final Settlement" : 1000
```

**Total USDC Moved Through Locus**: $1,820 across 4 operations

**Transaction Breakdown**:
1. **Deposit**: $1,000 (Stripe → Lender)
2. **Service Payment**: $20 (Lender → Analyst)
3. **Compute Purchase**: $800 (Business → Compute)
4. **Settlement**: $840 to Lender, $160 to Business (via Base, then visible in Locus)

**Average Transaction Size**: $455 USDC
**Smallest Transaction**: $20 USDC (credit analysis fee)
**Largest Transaction**: $1,000 USDC (initial funding)

---

## Summary

**Locus is the glue layer** that enables AI agents to operate as economic participants:

- **Accepts deposits** from fiat layer (Stripe)
- **Enables agent-to-agent commerce** (service payments, purchases)
- **Integrates with blockchain** for final settlements (Base)
- **Purpose-built for agents** (not humans)

Without Locus, agents would need to:
- Manage blockchain wallets directly (complex)
- Pay gas fees for every transaction (expensive)
- Wait for block confirmations (slow)
- Handle private key security (risky)

**Locus abstracts away blockchain complexity** while maintaining the benefits of crypto-native payments (fast, cheap, programmable).

---

## Related Documentation

- [FAQ.md](../FAQ.md) - Why Locus? (detailed comparison)
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Full system architecture
- [tickets/TICKET-001](../tickets/TICKET-001-migrate-locus-to-convex-db.md) - Migration plan
- [convex/FUNDING_API.md](../convex/FUNDING_API.md) - Funding flow integration
