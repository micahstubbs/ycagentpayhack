# System Architecture

## Complete System Architecture

```mermaid
graph TB
    subgraph "Fiat Layer - Traditional Finance"
        User[Human User]
        StripeCheckout[Stripe Checkout]
        StripePlatform[Stripe Platform Account]
        StripeConnect1[Stripe Connect<br/>Business Agent]
        StripeConnect2[Stripe Connect<br/>Lender Agent]
        StripeConnect3[Stripe Connect<br/>Analyst Agent]
    end

    subgraph "Backend Platform - Convex Serverless"
        ConvexAPI[Convex HTTP Actions]
        ConvexDB[(Convex Database)]
        WebhookHandler[Webhook Handler<br/>stripeWebhooks.ts]
        FundingAPI[Funding API<br/>funding.ts]
        AgentRegistry[Agent Registry<br/>agents.ts]

        ConvexDB --> |stores| Agents[agents table]
        ConvexDB --> |stores| StripeEvents[stripeEvents table]
        ConvexDB --> |stores| FundingTx[fundingTransactions table]
    end

    subgraph "Agent Payment Layer - Locus"
        LocusService[LocusService<br/>Mock Implementation]
        LocusWallet1[Locus Wallet<br/>Business: 1000 USDC]
        LocusWallet2[Locus Wallet<br/>Lender: 1000 USDC]
        LocusWallet3[Locus Wallet<br/>Analyst: 20 USDC]
        LocusWallet4[Locus Wallet<br/>Compute: 800 USDC]
    end

    subgraph "Settlement Layer - Base Blockchain"
        BaseRPC[Base Sepolia<br/>RPC Node]
        InvoiceNFT[InvoiceNFT.sol<br/>ERC-721 Contract]
        LoanEscrow[LoanEscrow.sol<br/>Escrow Contract]
        BaseExplorer[BaseScan Explorer]
    end

    subgraph "AI Agent Intelligence - Anthropic SDK"
        BusinessAgent[Business Agent<br/>Claude Sonnet 4.5]
        LenderAgent[Lender Agent<br/>Claude Sonnet 4.5]
        AnalystAgent[Credit Analyst<br/>Claude Sonnet 4.5]
        AgentRunner[Agent Runner<br/>agent-runner.ts]

        AgentTools[Agent Tools]
        StripeTools[Stripe Tools<br/>check_balance]
        LocusTools[Locus Tools<br/>transfer, check_balance]
        BaseTools[Base Tools<br/>mint_nft, create_loan]

        AgentTools --> StripeTools
        AgentTools --> LocusTools
        AgentTools --> BaseTools
    end

    subgraph "Frontend - Next.js"
        NextApp[Next.js App]
        Dashboard[Agent Dashboard]
        FundingUI[Funding Interface]
    end

    %% Fiat Layer Connections
    User -->|$1000 USD| StripeCheckout
    StripeCheckout -->|Payment Intent| StripePlatform
    StripePlatform -->|Transfer| StripeConnect2

    %% Stripe to Convex Webhook Flow
    StripePlatform -.->|webhook: transfer.created| WebhookHandler
    WebhookHandler -->|verify signature| ConvexAPI
    WebhookHandler -->|store event| ConvexDB
    WebhookHandler -->|deposit USDC| LocusService

    %% Convex to Locus Conversion
    FundingAPI -->|convert 1:1| LocusService
    LocusService -->|deposit| LocusWallet2

    %% Agent Funding Flow
    FundingAPI <-->|query/mutate| ConvexDB
    AgentRegistry <-->|manage| ConvexDB

    %% Locus Payment Layer
    LocusService -->|manages| LocusWallet1
    LocusService -->|manages| LocusWallet2
    LocusService -->|manages| LocusWallet3
    LocusService -->|manages| LocusWallet4

    %% Agent to Agent Payments via Locus
    LocusWallet2 -->|$20 USDC| LocusWallet3
    LocusWallet1 -->|$800 USDC| LocusWallet4

    %% Base Blockchain Connections
    BusinessAgent -->|mint NFT| BaseTools
    LenderAgent -->|create loan| BaseTools
    BaseTools -->|ethers.js| BaseRPC
    BaseRPC -->|calls| InvoiceNFT
    BaseRPC -->|calls| LoanEscrow

    %% NFT Escrow Flow
    InvoiceNFT -.->|locked as collateral| LoanEscrow
    LoanEscrow -.->|$800 ETH| LocusWallet1

    %% Agent Orchestration
    AgentRunner -->|executes| BusinessAgent
    AgentRunner -->|executes| LenderAgent
    AgentRunner -->|executes| AnalystAgent

    BusinessAgent -->|uses| AgentTools
    LenderAgent -->|uses| AgentTools
    AnalystAgent -->|uses| AgentTools

    %% Tool Integration
    StripeTools -->|API calls| StripeConnect1
    StripeTools -->|API calls| StripeConnect2
    StripeTools -->|API calls| StripeConnect3
    LocusTools -->|transfer/balance| LocusService

    %% Frontend Integration
    NextApp -->|subscribe| ConvexDB
    Dashboard -->|query| FundingAPI
    Dashboard -->|query| AgentRegistry
    FundingUI -->|execute| FundingAPI

    %% Monitoring
    BaseExplorer -.->|view transactions| LoanEscrow
    BaseExplorer -.->|view NFTs| InvoiceNFT

    style User fill:#e1f5ff
    style StripePlatform fill:#635bff,color:#fff
    style ConvexDB fill:#f97316,color:#fff
    style LocusService fill:#22c55e,color:#fff
    style InvoiceNFT fill:#0052ff,color:#fff
    style LoanEscrow fill:#0052ff,color:#fff
    style BusinessAgent fill:#ff6b6b,color:#fff
    style LenderAgent fill:#4ecdc4,color:#fff
    style AnalystAgent fill:#ffe66d,color:#000
```

---

## Data Flow: End-to-End Lending Flow

```mermaid
sequenceDiagram
    participant User as Human User
    participant Stripe as Stripe Platform
    participant Convex as Convex Backend
    participant Locus as Locus Service
    participant Business as Business Agent
    participant Lender as Lender Agent
    participant Analyst as Credit Analyst
    participant Base as Base Blockchain

    Note over User,Base: Step 1: Fund Lender Agent
    User->>Stripe: Pay $1000 (credit card)
    Stripe->>Stripe: Create transfer to Connect account
    Stripe-->>Convex: Webhook: transfer.created
    Convex->>Locus: Deposit 1000 USDC to Lender
    Note over Lender: Lender: 1000 USDC

    Note over User,Base: Step 2: Mint Invoice NFT
    Business->>Base: mint(business, debtor, 1000 ETH, 30 days)
    Base-->>Business: Invoice NFT #0
    Note over Business: Has Invoice NFT worth $1000

    Note over User,Base: Step 3: Request Loan
    Business->>Lender: Request $800 loan<br/>(collateral: Invoice NFT #0)
    Note over Lender: Needs credit analysis

    Note over User,Base: Step 4-5: Credit Analysis (Agent-to-Agent Payment)
    Lender->>Analyst: Request credit report
    Lender->>Locus: Transfer 20 USDC to Analyst
    Locus->>Locus: Deduct 20 from Lender
    Locus->>Locus: Add 20 to Analyst
    Note over Lender: Balance: 980 USDC
    Note over Analyst: Balance: 20 USDC
    Analyst->>Lender: Credit report (Risk: 7/10, Recommend: 80% advance, 5% interest)

    Note over User,Base: Step 6: Execute Loan
    Lender->>Base: Approve escrow to transfer NFT #0
    Base-->>Lender: Approval confirmed
    Lender->>Base: createLoan(business, NFT#0, 800 ETH, 40 ETH)
    Base->>Base: Lock Invoice NFT #0 in escrow
    Base->>Base: Transfer 800 ETH to Business
    Base-->>Lender: Loan #0 created
    Note over Business: Received 800 ETH from escrow
    Note over Lender: 800 ETH locked in escrow

    Note over User,Base: Step 7: Pay for Compute
    Business->>Locus: Transfer 800 USDC to Compute Provider
    Locus->>Locus: Deduct 800 from Business
    Locus->>Locus: Add 800 to Compute Provider
    Note over Business: Balance: 0 USDC (spent on compute)

    Note over User,Base: Step 8: Settlement (30 days later - simulated)
    Note over Base: Debtor pays 1000 ETH to escrow
    Base->>Base: settleLoan(0, 1000 ETH)
    Base->>Base: Pay Lender 840 ETH (800 + 40 interest)
    Base->>Base: Pay Business 160 ETH (remaining)
    Base->>Base: Return Invoice NFT to Business
    Note over Lender: 840 ETH profit (40 ETH interest)
    Note over Business: 160 ETH profit + NFT returned
    Note over Analyst: 20 USDC earned
```

---

## Component Architecture

```mermaid
graph LR
    subgraph "Layer 1: Fiat On-Ramp"
        A[Stripe Connect]
        A1[Payment Intents]
        A2[Transfers API]
        A3[Webhooks]
    end

    subgraph "Layer 2: Backend Platform"
        B[Convex Serverless]
        B1[HTTP Actions]
        B2[Mutations]
        B3[Queries]
        B4[Real-time DB]
    end

    subgraph "Layer 3: Agent Payments"
        C[Locus Service]
        C1[Deposit USDC]
        C2[Transfer USDC]
        C3[Get Balance]
    end

    subgraph "Layer 4: Blockchain"
        D[Base L2]
        D1[InvoiceNFT]
        D2[LoanEscrow]
    end

    subgraph "Layer 5: AI Agents"
        E[Anthropic SDK]
        E1[Agent Runner]
        E2[Agent Tools]
    end

    A --> B
    B --> C
    C --> D
    E --> B
    E --> C
    E --> D

    style A fill:#635bff,color:#fff
    style B fill:#f97316,color:#fff
    style C fill:#22c55e,color:#fff
    style D fill:#0052ff,color:#fff
    style E fill:#cc785c,color:#fff
```

---

## Technology Stack Map

```mermaid
mindmap
  root((Invoice-Backed<br/>Lending<br/>Marketplace))
    Frontend
      Next.js 15
      React 19
      Tailwind CSS
      Convex React
    Backend
      Convex Serverless
        HTTP Actions
        Mutations
        Queries
        Real-time DB
      TypeScript
      Node.js
    Payments
      Stripe
        Connect API
        Transfers
        Webhooks
        Payment Intents
      Locus Mock
        USDC Deposits
        Transfers
        Balance Tracking
    Blockchain
      Base Sepolia L2
        InvoiceNFT
        LoanEscrow
      Hardhat
      ethers.js v6
      OpenZeppelin
    AI Agents
      Anthropic SDK
        Claude Sonnet 4.5
        Tool Use
        Message Loop
      Agent Tools
        Stripe Tools
        Locus Tools
        Base Tools
```

---

## See Also

- [LOCUS_ARCHITECTURE.md](./LOCUS_ARCHITECTURE.md) - Detailed Locus integration diagram
- [README.md](../README.md) - Main project documentation
- [FAQ.md](../FAQ.md) - Frequently asked questions
