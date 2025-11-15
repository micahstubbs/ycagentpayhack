# Invoice-Backed Lending Marketplace for AI Agents

Built for the **Agentic Payments Hackathon** by Locus @ YC HQ

**Demo:** AI agents autonomously execute invoice-backed lending using Stripe for funding, Locus for payments, and Base smart contracts for escrow.

---

## Overview

This project bridges traditional finance (Stripe) with the crypto-native agent economy (Locus + Base):

1. **Users fund AI agents** via Stripe Connect
2. **Agents operate autonomously** using Anthropic SDK
3. **Business Agent** borrows against invoice NFT collateral
4. **Credit Analyst Agent** provides paid creditworthiness analysis
5. **Lender Agent** executes loans via Base smart contracts
6. **Locus handles** all agent-to-agent USDC payments

**The Innovation:** Stripe Connect provides fiat on-ramp for autonomous agents that transact in crypto-native economy.

---

## Architecture

```
┌─────────────────┐
│  Human User     │
│  (Stripe Card)  │
└────────┬────────┘
         │ $1000 USD
         ▼
┌─────────────────┐      Webhook      ┌──────────────────┐
│ Stripe Connect  │─────────────────→ │  Convex Backend  │
│  (Lender Acct)  │                    │  (converts 1:1)  │
└─────────────────┘                    └────────┬─────────┘
                                                │
                                                │ 1000 USDC
                                                ▼
                                       ┌──────────────────┐
                                       │  Locus Wallet    │
                                       │  (Lender Agent)  │
                                       └────────┬─────────┘
                                                │
         ┌──────────────────────────────────────┼──────────────────────┐
         │                                      │                      │
         ▼                                      ▼                      ▼
┌─────────────────┐              ┌─────────────────┐      ┌─────────────────┐
│ Anthropic SDK   │              │ Anthropic SDK   │      │ Anthropic SDK   │
│ Lender Agent    │◀────────────▶│ Business Agent  │      │ Analyst Agent   │
└────────┬────────┘              └────────┬────────┘      └────────┬────────┘
         │                                │                         │
         │ $20 USDC (via Locus)           │                         │
         └────────────────────────────────┼─────────────────────────┘
                                          │
                                          ▼
                                 ┌──────────────────┐
                                 │  Base L2         │
                                 │  Smart Contracts │
                                 │  • InvoiceNFT    │
                                 │  • LoanEscrow    │
                                 └──────────────────┘
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- Yarn or npm
- Stripe account (test mode)
- Anthropic API key
- Base Sepolia testnet ETH

### Installation

```bash
# Clone repo
git clone <repo-url>
cd ycagentpayhack

# Install dependencies
npm install

# Copy env file
cp .env.example .env

# Edit .env with your keys
```

### Setup

```bash
# 1. Deploy smart contracts to Base Sepolia
npm run deploy:contracts

# 2. Update .env with contract addresses (printed by deploy script)

# 3. Initialize agents (creates Stripe Connect accounts)
npm run init:agents

# 4. Sync agents to Convex database
npm run sync:agents

# 5. Start development servers (Convex + Next.js)
npm run dev
```

### Run Demo

```bash
npm run demo
```

---

## Project Structure

```
ycagentpayhack/
├── app/                    # Next.js application
│   ├── (splash)/          # Landing page with canvas animation
│   ├── product/           # Demo application (requires sign-in)
│   └── signin/            # Authentication page
├── components/            # React UI components
├── convex/                # Convex backend (replaces Express)
│   ├── agents.ts         # Agent registry management
│   ├── funding.ts        # Funding API (Stripe → Locus)
│   ├── stripeWebhooks.ts # Stripe webhook handler
│   ├── locusIntegration.ts # Locus service integration
│   ├── schema.ts         # Database schema
│   ├── FUNDING_API.md    # API documentation
│   └── WEBHOOKS.md       # Webhook documentation
├── contracts/             # Solidity smart contracts
│   ├── InvoiceNFT.sol
│   └── LoanEscrow.sol
├── src/
│   ├── agents/           # Anthropic SDK agents
│   │   ├── tools/       # Agent tool definitions
│   │   │   ├── stripe.tools.ts
│   │   │   ├── locus.tools.ts
│   │   │   ├── base.tools.ts
│   │   │   └── index.ts
│   │   └── agent-runner.ts
│   ├── services/        # Core services
│   │   ├── stripe.service.ts
│   │   ├── locus.service.ts
│   │   ├── base.service.ts
│   │   └── agent-registry.service.ts
│   ├── scripts/         # Utility scripts
│   │   ├── init-agents.ts
│   │   └── sync-agents-to-convex.ts
│   └── demo/            # Demo scripts
│       └── run-demo.ts
├── test/                # Smart contract tests
├── scripts/             # Deployment scripts
├── Docs/                # Documentation
│   ├── DEPLOYMENT.md
│   └── plans/
└── TASKS.md            # Implementation tasks tracker
```

---

## API Endpoints (Convex)

All API endpoints are implemented as Convex functions, not Express routes.

### Funding

**Action:** `api.funding.createFundingIntent`
```typescript
await convex.action(api.funding.createFundingIntent, {
  agentId: "lender-001",
  amountUsd: 1000
});
```

**Action:** `api.funding.executeFunding`
```typescript
await convex.action(api.funding.executeFunding, {
  agentId: "lender-001",
  amountUsd: 1000
});
```

**Action:** `api.funding.getAgentBalances`
```typescript
const balances = await convex.action(api.funding.getAgentBalances, {
  agentId: "lender-001"
});

// Returns:
{
  agentId: "lender-001",
  balances: {
    stripe_usd: 0,
    locus_usdc: 1000,
    convex_total_deposited: 1000
  },
  transactionCount: 1
}
```

**Query:** `api.funding.getAllAgentBalances`
```typescript
const allBalances = useQuery(api.funding.getAllAgentBalances);
```

**Query:** `api.funding.getAgentFundingHistory`
```typescript
const history = useQuery(api.funding.getAgentFundingHistory, {
  agentId: "lender-001"
});
```

### Agents

**Query:** `api.agents.getAgent`
```typescript
const agent = useQuery(api.agents.getAgent, {
  agentId: "lender-001"
});
```

**Query:** `api.agents.getAllAgents`
```typescript
const agents = useQuery(api.agents.getAllAgents);
```

### Webhooks

**HTTP Endpoint:** `/stripe/webhook`

Stripe webhooks are sent to:
```
https://your-convex-deployment.convex.site/stripe/webhook
```

For local development:
```
http://localhost:3210/stripe/webhook
```

See [convex/WEBHOOKS.md](./convex/WEBHOOKS.md) for details.

---

## Smart Contracts

### InvoiceNFT.sol

ERC-721 contract representing receivables (invoices).

**Functions:**
- `mint(to, debtor, amount, dueDate)` - Create invoice NFT
- `payInvoice(tokenId)` - Debtor pays invoice
- `getInvoice(tokenId)` - View invoice details

**Deployed on Base Sepolia**: See `.env` for contract address

### LoanEscrow.sol

Escrow contract for invoice-backed loans.

**Functions:**
- `createLoan(borrower, nftContract, tokenId, principal, interest)` - Create loan, lock NFT
- `settleLoan(loanId)` - Pay off loan, release NFT

**Deployed on Base Sepolia**: See `.env` for contract address

See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment instructions.

---

## Agent Tools

Each Anthropic SDK agent has access to these tools:

### Stripe Tools
- `check_stripe_balance` - Query Connect account balance

### Locus Tools
- `check_locus_balance` - Query USDC balance
- `transfer_usdc` - Send USDC to another agent

### Base Tools
- `mint_invoice_nft` - Create invoice NFT on Base
- `get_invoice_details` - View invoice data
- `create_loan` - Execute loan with NFT collateral

See [src/agents/tools/](./src/agents/tools/) for implementation.

---

## Demo Flow

The autonomous demo (`npm run demo`) executes this 8-step flow:

1. **Fund Lender:** User transfers $1000 via Stripe → Lender's Connect account → 1000 USDC in Locus
2. **Mint Invoice:** Business Agent creates invoice NFT ($1000, due 30 days)
3. **Request Loan:** Business Agent requests $800 loan
4. **Credit Analysis:** Lender pays Analyst $20 USDC for credit report
5. **Analyst Reviews:** Credit Analyst analyzes invoice and recommends loan terms
6. **Execute Loan:** Lender creates loan on Base (locks NFT, transfers $800 USDC)
7. **Pay Compute:** Business Agent pays $800 USDC to compute provider
8. **Settle:** Debtor pays invoice → $840 to Lender, $160 to Business, NFT returned

**Final Balances:**
- Lender: 1040 USDC (started with 1000, earned 40 interest)
- Business: 160 USDC (kept surplus after loan repayment)
- Analyst: 20 USDC (earned for credit analysis)

---

## Tech Stack

### Frontend
- Next.js 16 with App Router
- React 19
- Tailwind CSS + shadcn/ui
- Canvas animations

### Backend
- Convex (replaces Express)
- TypeScript
- Real-time database
- HTTP actions for webhooks

### AI & Agents
- Anthropic SDK
- Claude Sonnet 4.5
- Custom tool definitions

### Payments
- Stripe Connect (agent funding)
- Stripe Transfers (fiat → agent accounts)
- Stripe Webhooks (async notifications)
- Locus (agent-to-agent USDC payments)

### Blockchain
- Base Sepolia (L2 testnet)
- Solidity smart contracts
- Hardhat (development)
- ethers.js v6 (blockchain interaction)

---

## Hackathon Track Alignment

### Overall Track
- ✅ **Originality:** Invoice-backed lending for AI agents
- ✅ **Technical execution:** Multi-layer integration (Stripe + Locus + Base + Anthropic)
- ✅ **Real-world value:** Solves agent funding problem
- ✅ **Feasibility:** Working demo with autonomous agents

### Stripe Track
- ✅ **Creativity (30%):** Novel use of Stripe Connect for AI agent funding
- ✅ **Works in prod (20%):** Real Stripe API integration with webhooks
- ✅ **Real business (50%):** Solves cold-start problem for agentic commerce

**Why Stripe?** Traditional users fund agents with credit cards (familiar UX), while agents operate in crypto-native economy (USDC on Locus). Stripe Connect bridges these worlds.

---

## Resources

### Documentation
- [Funding API Documentation](./convex/FUNDING_API.md)
- [Webhook Documentation](./convex/WEBHOOKS.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Design Document](./Docs/plans/2025-11-15-agentic-payments-stripe-enhanced-design.md)
- [Implementation Plan](./Docs/plans/2025-11-15-implementation-plan.md)
- [Tasks Tracker](./TASKS.md)

### External Resources
- [Stripe Connect Docs](https://stripe.com/docs/connect)
- [Locus Docs](https://paywithlocus.com/)
- [Base Docs](https://docs.base.org/)
- [Anthropic SDK](https://github.com/anthropics/anthropic-sdk-typescript)
- [Convex Docs](https://docs.convex.dev/)

---

## Development

### Run Tests

```bash
# Smart contract tests
npx hardhat test

# Expected: 4 passing tests
```

### Start Webhook Server

```bash
# Terminal 1: Start Convex
pnpm convex dev

# Terminal 2: Forward Stripe webhooks
stripe listen --forward-to http://localhost:3210/stripe/webhook
```

### Deploy Contracts

```bash
# Deploy to Base Sepolia
npm run deploy:contracts

# Verify on BaseScan
npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS>
```

---

## Environment Variables

Required in `.env`:

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PLATFORM_ACCOUNT_ID=acct_...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Locus
LOCUS_API_KEY=...
LOCUS_API_URL=https://api.uselocus.com

# Base/Blockchain
BASE_RPC_URL=https://sepolia.base.org
PRIVATE_KEY=...
INVOICE_NFT_ADDRESS=...
LOAN_ESCROW_ADDRESS=...

# Convex
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

See `.env.example` for complete list.

---

## Security Notes

1. **Never use real funds** - This is a testnet/demo deployment
2. **Keep private keys secure** - Never commit to git
3. **Use test wallets** - Don't use main wallet's private key
4. **Verify network** - Always confirm Base Sepolia (chainId: 84532)
5. **Mock mode available** - Run demo without real API keys

---

## Troubleshooting

### Contracts won't deploy
- Ensure you have Base Sepolia ETH from faucet
- Check `PRIVATE_KEY` in `.env`
- Verify `BASE_RPC_URL` is correct

### Stripe webhooks not working
- Run `stripe listen --forward-to http://localhost:3210/stripe/webhook`
- Copy webhook secret to `STRIPE_WEBHOOK_SECRET`
- Check Convex is running (`pnpm convex dev`)

### Agents not found
- Run `npm run init:agents` to create agents
- Run `npm run sync:agents` to sync to Convex
- Check `data/agent-registry.json` exists

### Demo fails
- Ensure all agents are initialized
- Check `.env` has all required keys
- Verify contracts are deployed

---

## Contributing

This is a hackathon project. For production use:

1. Replace mock Locus service with real SDK
2. Add comprehensive error handling
3. Implement retry logic for failed transactions
4. Add monitoring and logging
5. Security audit smart contracts
6. Add rate limiting and abuse prevention

---

## License

MIT

---

## Acknowledgments

Built for the Agentic Payments Hackathon by Locus @ YC HQ

**Team:** Solo project showcasing multi-layer agent architecture

**Technologies:** Stripe Connect, Locus, Base, Anthropic SDK, Convex, Next.js

**Timeline:** 8 hours from design to working demo
