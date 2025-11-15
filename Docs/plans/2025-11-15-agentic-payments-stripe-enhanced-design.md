# Agentic Payments Hackathon - Enhanced Design with Stripe Integration

**Date:** November 15, 2025
**Event:** Agentic Payments Hackathon by Locus @ YC HQ
**Project:** Invoice-Backed Lending Marketplace for AI Agents
**Target Tracks:** Overall + Stripe Track

---

## Executive Summary

Build an agent-to-agent marketplace where AI agents obtain liquidity by leveraging invoice NFTs as collateral. **Key Innovation:** Stripe Connect provides the fiat on-ramp, enabling traditional users to fund autonomous agents that operate in the crypto-native economy (Locus + Base).

**The Bridge:** Stripe (traditional finance) → Locus (agent payments) → Base (trustless settlement)

---

## Overview

An invoice-backed lending marketplace where:
1. **Users fund AI agents** via Stripe Connect accounts (fiat on-ramp)
2. **Agents operate autonomously** using Locus for payments and Base for escrow
3. **Business Agent** borrows against invoice NFT collateral
4. **Credit Analyst Agent** provides creditworthiness analysis (paid service)
5. **Lender Agent** provides liquidity based on credit analysis
6. **Smart Contract Escrow** manages trustless settlement on Base
7. **Agents can withdraw profits** back to Stripe Connect accounts (fiat off-ramp)

---

## Problem Statement

AI agents operating businesses face multiple challenges:
- **Funding problem:** How do agents get initial capital to operate?
- **Cash flow problem:** They have receivables (invoices) but need immediate liquidity
- **Payment rails problem:** Traditional finance (credit cards) vs crypto-native commerce (USDC)
- **Trust problem:** Agent-to-agent commerce requires trustless settlement mechanisms

---

## Solution

### Core Innovation

**Stripe-Funded Autonomous Agent Economy**

- Humans fund agents using familiar payment methods (Stripe)
- Agents operate autonomously in crypto-native economy (Locus USDC payments)
- Trustless settlement via Base smart contracts
- Profits can flow back to Stripe (fiat off-ramp)

### System Components

1. **Fiat Layer (Stripe):** Agent funding and withdrawal via Connect accounts
2. **Payment Layer (Locus):** Fast, low-cost agent-to-agent USDC payments
3. **Settlement Layer (Base):** Invoice NFTs and escrow smart contracts
4. **Intelligence Layer (Anthropic SDK):** Autonomous agent decision-making

---

## Stripe Integration Architecture

### Why Stripe + Stripe Track Alignment

**Creativity (30%):**
- Novel use of Stripe Connect to give AI agents economic identity
- First-of-its-kind fiat-to-crypto bridge for autonomous agents
- "We've never seen Connect accounts used this way before"

**Works in Prod (20%):**
- Real Stripe API integration (test mode → live mode ready)
- Demonstrable transactions in Stripe Dashboard
- Production-grade webhook handling

**Real Business Potential (50%):**
- Solves critical "how do agents get funded?" barrier
- Bridges mainstream users (credit cards) to agent economy (crypto)
- Clear revenue model (platform fees on transfers)
- Extensible beyond hackathon

### Stripe Products Used

1. **Stripe Connect (Primary)**
   - Express Connect accounts for each agent (Business, Lender, Credit Analyst)
   - Agents have their own economic identity and balance

2. **Stripe Transfers**
   - Move funds from platform account to agent Connect accounts
   - Enables programmatic funding of agent wallets

3. **Stripe Payment Intents / Checkout**
   - Accept user payments to fund agents
   - Standard payment flow users understand

4. **Stripe Webhooks**
   - `transfer.created` - Trigger USDC deposit to Locus wallet
   - `payment_intent.succeeded` - Confirm user funding received
   - Real-time async payment notifications

5. **Future: Stripe Issuing (Stretch Goal)**
   - Virtual cards for agents to make direct purchases
   - Perplexity Shopping model for AI agents

---

## Complete System Flow

### Phase 1: Agent Funding (Stripe Integration)

1. **Human user** visits platform, selects "Fund Lender Agent"
2. **User pays $1000** via Stripe Checkout (card, ACH, bank transfer)
3. **Platform receives payment** in main Stripe account
4. **Stripe Transfer API** moves $1000 to Lender Agent's Connect account
5. **Webhook fired:** `transfer.created` event
6. **Platform converts** $1000 to 1000 USDC (simulated 1:1, or real via Circle/Coinbase)
7. **USDC deposited** to Lender Agent's Locus wallet
8. **Lender Agent notified** via Anthropic SDK tool: "Wallet funded with 1000 USDC"

### Phase 2: Loan Request (Agent Discovery)

9. **Business Agent** discovers need: "I need $800 for H200 compute rental"
10. **Business Agent** checks assets: finds invoice NFT worth $1000, due in 30 days
11. **Business Agent** queries service registry for lenders
12. **Lender Agent** receives loan request with collateral details

### Phase 3: Credit Analysis (Agent-to-Agent Payment via Locus)

13. **Lender Agent** needs credit analysis before lending
14. **Lender Agent** queries service registry, finds **Credit Analyst Agent**
15. **Lender Agent** pays **Credit Analyst $20 USDC** via Locus for creditworthiness report
16. **Credit Analyst** analyzes invoice debtor (on-chain history, credit score simulation)
17. **Credit Analyst** returns: risk score 7/10, recommended terms: 80% advance, 5% interest
18. **Locus payment confirmed** - Credit Analyst received $20 USDC

### Phase 4: Loan Execution (Base Smart Contract)

19. **Lender Agent** proposes loan terms: $800 advance (80% of $1000 face value), 5% interest ($40)
20. **Business Agent** accepts terms
21. **Base Smart Contract** invoked:
    - Locks invoice NFT in escrow (transferred from Business Agent)
    - Transfers $800 USDC from Lender's Locus wallet to escrow contract
    - Escrow contract transfers $800 to Business Agent's Locus wallet
22. **Business Agent** now has $800 USDC available

### Phase 5: Compute Purchase (Locus Payment)

23. **Business Agent** pays **Compute Provider $800 USDC** via Locus for H200 GPU time
24. **Compute Provider** confirms reservation
25. **Business Agent** begins compute job

### Phase 6: Invoice Settlement (Base Smart Contract)

26. *(Time passes - simulated as instant for demo)*
27. **Debtor** pays invoice: $1000 USDC sent directly to escrow contract on Base
28. **Smart Contract** emits `InvoicePaid` event
29. **Smart Contract** automatically settles:
    - $840 USDC to Lender Agent's Locus wallet ($800 principal + $40 interest)
    - $160 USDC to Business Agent's Locus wallet (remaining proceeds)
    - Invoice NFT returned to Business Agent
30. **Settlement complete** - all balances updated

### Phase 7: Profit Withdrawal (Stripe Integration - Optional)

31. **Lender Agent** can withdraw profits to Stripe Connect account
32. **Platform converts** 840 USDC → $840 USD
33. **Stripe Transfer** moves $840 from Lender's Connect account to external bank
34. **Lender receives fiat** in traditional bank account

---

## Technical Stack

### AI & Agents
- **Anthropic SDK** - Agent orchestration and intelligence
- **Claude (Sonnet 4.5)** - Underlying LLM for agent decision-making

### Payments & Finance
- **Stripe Connect** - Agent economic identity and fiat funding
- **Stripe Transfers** - Programmatic funding of agent accounts
- **Stripe Webhooks** - Async payment notifications
- **Locus** - Agent-to-agent USDC payment infrastructure

### Blockchain
- **Base (L2)** - Invoice NFTs and escrow smart contracts
- **Coinbase Developer Platform** - Wallet management and Base interaction
- **Solidity** - Smart contract development

### Infrastructure
- **Node.js/TypeScript** - Agent runtime and platform backend
- **Express.js** - Webhook endpoint and API server
- **Hardhat/Foundry** - Smart contract development and testing
- **Redis** (optional) - Message broker for agent coordination

---

## Agent Architecture

### Agent Types & Responsibilities

#### 1. Business Agent (Borrower)
**Economic Identity:** Stripe Connect account + Locus wallet + Base address

**Tools:**
- `check_stripe_balance()` - Query Connect account balance
- `check_locus_balance()` - Query USDC in Locus wallet
- `list_assets()` - View owned invoice NFTs
- `request_loan(collateral, amount)` - Request loan from lender
- `accept_loan_terms(terms)` - Accept proposed loan
- `pay_with_locus(recipient, amount)` - Make Locus payment
- `request_stripe_funding(amount)` - Generate payment link for users

#### 2. Lender Agent
**Economic Identity:** Stripe Connect account + Locus wallet + Base address

**Tools:**
- `check_stripe_balance()` - Query Connect account balance
- `check_locus_balance()` - Query USDC available for lending
- `evaluate_loan_request(request)` - Analyze loan request
- `request_credit_analysis(debtor)` - Pay for credit report
- `propose_loan_terms(borrower, terms)` - Offer loan
- `execute_loan(borrower, amount, collateral)` - Transfer funds to escrow
- `withdraw_to_stripe(amount)` - Move USDC profits to Stripe account

#### 3. Credit Analyst Agent
**Economic Identity:** Stripe Connect account + Locus wallet

**Tools:**
- `analyze_creditworthiness(debtor)` - Perform credit analysis
- `check_locus_balance()` - Verify payment received
- `set_service_price(price)` - Configure analysis fee
- `return_credit_report(lender, report)` - Deliver analysis

---

## Smart Contracts (Base)

### 1. InvoiceNFT.sol

```solidity
// ERC-721 representing receivables
contract InvoiceNFT {
    struct Invoice {
        address debtor;
        uint256 amount;
        uint256 dueDate;
        bool paid;
    }

    mapping(uint256 => Invoice) public invoices;

    function mint(address debtor, uint256 amount, uint256 dueDate) external returns (uint256);
    function payInvoice(uint256 tokenId) external payable;
}
```

### 2. LoanEscrow.sol

```solidity
// Escrow for invoice-backed loans
contract LoanEscrow {
    struct Loan {
        address lender;
        address borrower;
        uint256 invoiceTokenId;
        uint256 principalAmount;
        uint256 interestAmount;
        uint256 totalOwed;
        bool settled;
    }

    mapping(uint256 => Loan) public loans;

    function createLoan(
        address borrower,
        uint256 invoiceTokenId,
        uint256 principal,
        uint256 interest
    ) external payable returns (uint256 loanId);

    function settleLoan(uint256 loanId) external;
}
```

---

## Implementation Priorities (Hackathon Day)

### Must Have (Core Demo)

**Stripe Infrastructure (2 hours):**
1. Create Stripe account, enable Connect
2. Create 3 Express Connect accounts (Business, Lender, Credit Analyst)
3. Implement webhook endpoint for `transfer.created`, `payment_intent.succeeded`
4. Build simple funding UI (Stripe Checkout)
5. Implement Stripe → USDC conversion (simulated 1:1)
6. Test funding flow: Stripe → Connect account → Locus wallet

**Smart Contracts (2 hours):**
1. InvoiceNFT contract (ERC-721 with payment logic)
2. LoanEscrow contract (deposit, settlement, NFT custody)
3. Deploy to Base testnet
4. Verify on Base block explorer

**Agent Implementation (3 hours):**
1. Business Agent with Stripe/Locus/Base tools
2. Lender Agent with funding check and loan execution
3. Credit Analyst Agent with payment acceptance
4. Service registry (JSON file or in-memory)

**Integration & Demo (1 hour):**
1. End-to-end test: funding → loan → analysis → settlement
2. Dashboard showing Stripe + Locus + Base state
3. Demo run-through and timing

**Total: 8 hours** (fits hackathon schedule with buffer)

### Nice to Have (Stretch Goals)

- Real-time dashboard with transaction visualizations
- Multiple lenders competing for loans
- Stripe Payment Links for easy agent funding
- Withdrawal flow: USDC → Stripe → bank account
- Stripe Issuing virtual cards for agents
- More sophisticated credit analysis (on-chain history)

### Out of Scope (Hackathon)

- Production smart contract security (auditing, formal verification)
- Real USDC conversion (use simulated 1:1)
- Liquidation and default handling
- Mobile interface
- Multi-currency support

---

## Demo Strategy

### Pre-Demo Setup

1. **Pre-fund agents** with test amounts (save demo time)
2. **Seed invoice NFT** in Business Agent's wallet
3. **Test full flow** 2-3 times to ensure reliability
4. **Prepare backup** video in case of live demo issues

### Demo Narrative (5-7 minutes)

**Act 1: The Problem (30 seconds)**
"AI agents are learning to transact, but how do they get funded? Meet our Business Agent - it runs an AI business, has $1000 in receivables locked up for 30 days, but needs $800 NOW to rent compute."

**Act 2: The Stripe Bridge (1 minute)**
"Watch as a user funds our Lender Agent with $1000 using Stripe - just like paying for anything online. [Show Stripe Checkout] Stripe transfers the money to the agent's Connect account. [Show Stripe Dashboard] Our platform converts it to USDC and deposits it into the agent's Locus wallet. [Show Locus balance] The Lender Agent is now ready to operate autonomously."

**Act 3: Autonomous Commerce (2 minutes)**
"Now watch the agents work together with zero human intervention. [Show agent dashboard]
- Business Agent requests a loan, offering its invoice NFT as collateral
- Lender Agent needs credit analysis first
- Lender pays Credit Analyst $20 USDC via Locus for a report
- Credit Analyst evaluates the debtor, recommends 80% advance at 5% interest
- Lender proposes $800 loan
- Business Agent accepts
- Smart contract on Base locks the NFT, transfers $800 to Business Agent
- Business Agent immediately pays for compute rental
[Show all transactions in real-time]"

**Act 4: Settlement (1 minute)**
"30 days later - simulated as instant for demo - the debtor pays the $1000 invoice in USDC directly to the escrow contract on Base. [Show Base block explorer] The smart contract automatically settles: $840 to the Lender (principal + interest), $160 to the Business Agent. The invoice NFT is returned. [Show final balances]"

**Act 5: The Future (30 seconds)**
"The Lender can now withdraw its $840 profit back to Stripe and into a traditional bank account. Or reinvest in more loans. This is the bridge between traditional finance and autonomous agent commerce."

### What to Show Judges

1. **Stripe Dashboard:** Connect accounts, transfers, transaction history
2. **Locus Dashboard:** Agent-to-agent USDC payments
3. **Base Block Explorer:** Escrow contract, NFT transfers, settlement
4. **Agent Logs:** Decision-making process, tool calls, autonomous reasoning
5. **System Architecture Diagram:** Stripe → Locus → Base flow

---

## Judging Criteria Alignment

### Overall Track

**Originality ✅**
- Invoice-backed lending for AI agents is novel
- Stripe-funded autonomous agent economy is first-of-its-kind
- Combines trade finance primitives with agentic commerce

**Technical Execution ✅**
- Multiple Anthropic SDK agents with custom tools
- Real Stripe integration (Connect, Transfers, Webhooks)
- Locus payments between agents
- Smart contracts on Base for trustless escrow
- End-to-end autonomous workflow

**Real-World Value ✅**
- Solves critical funding problem for AI agents
- Bridges mainstream users to crypto agent economy
- Extensible to human businesses using AI intermediaries
- Clear business model (platform fees)

**Feasibility ✅**
- Achievable in 8-hour hackathon timeframe
- Simple, focused smart contracts
- Well-defined agent responsibilities
- Proven Stripe APIs

**Storytelling ✅**
- Clear narrative: funding → borrowing → credit analysis → settlement → profit
- Visual demo with multiple dashboards
- Relatable problem (cash flow, invoice financing)

### Stripe Track

**Creativity (30%) ✅**
- **Novel use of Connect:** AI agents with economic identity
- **Fiat-to-crypto bridge:** Stripe as on-ramp to agent economy
- **Judge quote:** "We've never seen Stripe Connect used to fund autonomous AI agents - this is genuinely creative"

**Works in Prod (20%) ✅**
- **Real Stripe transactions** in test mode (live mode ready)
- **Stripe Dashboard evidence** of Connect accounts and transfers
- **Webhook integration** with proper signature verification
- **Judge quote:** "Here's the Stripe Dashboard showing actual transfers, and here's our webhook logs processing events in real-time"

**Real Business Potential (50%) ✅**
- **Solves critical barrier:** "How do agents get funded?"
- **Bridges two economies:** Credit cards (mainstream) → USDC (crypto)
- **Clear revenue model:** Platform fees on transfers, subscription for funding access
- **Massive market:** Every AI agent that transacts needs funding
- **Judge quote:** "This solves the cold-start problem for agentic commerce. Keep working on this beyond today - this could be a real business"

**Total Stripe Track Score Estimate:** 85-95/100

---

## Technical Integration Details

### Stripe Connect Setup

```javascript
// Create Express Connect account for an agent
const account = await stripe.accounts.create({
  type: 'express',
  country: 'US',
  email: `agent-${agentId}@platform.com`,
  capabilities: {
    transfers: {requested: true},
  },
  metadata: {
    agentId: agentId,
    agentType: 'lender', // or 'business', 'analyst'
  }
});
```

### Funding Flow

```javascript
// 1. User pays platform
const paymentIntent = await stripe.paymentIntents.create({
  amount: 100000, // $1000.00
  currency: 'usd',
  metadata: {
    purpose: 'fund_agent',
    agentId: 'lender-001',
  }
});

// 2. Transfer to agent's Connect account
const transfer = await stripe.transfers.create({
  amount: 100000,
  currency: 'usd',
  destination: agentConnectAccountId,
  metadata: {
    agentId: 'lender-001',
  }
});

// 3. Webhook receives transfer.created
app.post('/webhook', async (req, res) => {
  const event = req.body;

  if (event.type === 'transfer.created') {
    const transfer = event.data.object;
    const agentId = transfer.metadata.agentId;

    // Convert to USDC (simulated)
    const usdcAmount = transfer.amount / 100; // cents to dollars

    // Deposit to Locus wallet
    await locus.deposit(agentId, usdcAmount);

    // Notify agent
    await notifyAgent(agentId, 'wallet_funded', usdcAmount);
  }

  res.json({received: true});
});
```

### Agent Tool Examples

```typescript
// Business Agent tool
async function checkBalances() {
  const stripeBalance = await stripe.balance.retrieve({
    stripeAccount: businessAgentConnectId
  });

  const locusBalance = await locus.getBalance(businessAgentId);

  return {
    stripe_usd: stripeBalance.available[0].amount / 100,
    locus_usdc: locusBalance
  };
}

// Lender Agent tool
async function executeLoan(borrower, amount, invoiceNftId) {
  // Check Locus balance
  const balance = await locus.getBalance(lenderAgentId);
  if (balance < amount) {
    throw new Error('Insufficient funds');
  }

  // Call Base smart contract
  const tx = await escrowContract.createLoan(
    borrower,
    invoiceNftId,
    ethers.parseUnits(amount.toString(), 6), // USDC has 6 decimals
    ethers.parseUnits((amount * 0.05).toString(), 6) // 5% interest
  );

  await tx.wait();
  return tx.hash;
}
```

---

## Risk Mitigation

### Technical Risks

**Risk: Stripe webhook delivery issues**
- **Mitigation:** Implement retry logic, use Stripe CLI for local testing, backup polling mechanism

**Risk: Smart contract bugs during demo**
- **Mitigation:** Extensive testing, simple contract scope, backup demo video

**Risk: Locus API rate limits or downtime**
- **Mitigation:** Mock Locus layer as backup, cache balances locally

**Risk: Agent hallucination or errors**
- **Mitigation:** Constrained action space via tools, deterministic test scenario, retry logic

### Demo Risks

**Risk: Network connectivity issues**
- **Mitigation:** Local testnet deployment, backup video, pre-funded accounts

**Risk: Time management**
- **Mitigation:** Focus on must-haves, 2-hour checkpoints, working demo by hour 6

---

## Success Metrics

### Demo Success
- Autonomous flow completes without errors
- Stripe transactions visible in Dashboard
- Locus payments execute successfully
- Smart contract escrow works correctly
- Clear visualization of all three layers (Stripe, Locus, Base)

### Judging Success
- **Overall Track:** Finalist (top 10)
- **Stripe Track:** Top 3 ($1k-$3k in credits + lunch at Stripe HQ)
- Strong technical questions from judges
- Sponsor interest (Anthropic, Stripe, Locus, Coinbase)

---

## Next Steps

1. ✅ Validate Stripe integration design
2. Set up Stripe account and enable Connect
3. Create detailed implementation plan with task breakdown
4. Begin implementation:
   - Stripe integration first (2 hours)
   - Smart contracts (2 hours)
   - Agents (3 hours)
   - Integration & demo (1 hour)
5. Test end-to-end flow multiple times
6. Create presentation materials and demo script
7. Practice demo run-through

---

## Questions to Resolve

- Use Stripe test mode or live mode for demo? (Test mode safer, live mode more impressive)
- Real USDC conversion or simulated? (Simulated 1:1 for hackathon)
- Host webhook endpoint locally (ngrok) or deploy? (Deploy to Replit/Vercel for reliability)
- Dashboard tech stack: React or terminal UI? (React for better visualization)
- Base testnet or mainnet? (Testnet for safety)

---

## Resources

### Stripe
- [Stripe Connect Documentation](https://stripe.com/docs/connect)
- [Stripe Transfers API](https://stripe.com/docs/api/transfers)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe for Agents](https://docs.stripe.com/agents)
- [Stripe Dashboard](https://dashboard.stripe.com)

### Agent Infrastructure
- [Locus Documentation](https://docs.uselocus.com/)
- [Anthropic SDK](https://github.com/anthropics/anthropic-sdk-python)

### Blockchain
- [Base Developer Docs](https://docs.base.org/)
- [Coinbase Developer Platform](https://www.coinbase.com/cloud)

### Event
- [Hackathon Details](https://events.ycombinator.com/agenticpaymentshackathon)

---

## Appendix: Alternative Stripe Integrations Considered

### Option 1: Stripe Issuing Virtual Cards (Not Selected)
**Concept:** Give each agent a Stripe Issuing virtual card; agents use cards directly for purchases

**Pros:** Very creative, follows Perplexity Shopping model, direct payment capability

**Cons:** Requires merchant acceptance of cards, more complex integration, doesn't showcase Locus as well

**Decision:** Keep as stretch goal, focus on Connect + Locus for core demo

### Option 2: Stripe Payment Links for Invoice Payment (Not Selected)
**Concept:** Invoice NFT includes Stripe Payment Link; debtor pays via Stripe, triggers on-chain settlement

**Pros:** Brings Stripe into settlement flow, enables fiat invoice payment

**Cons:** Breaks crypto-native settlement story, adds complexity, requires Stripe webhook → blockchain bridge

**Decision:** Keep invoice payment crypto-only for cleaner architecture

### Option 3: Multi-Currency Support (Not Selected)
**Concept:** Support funding in multiple currencies (USD, EUR, GBP), convert all to USDC

**Pros:** More globally accessible, shows Stripe's multi-currency capabilities

**Cons:** Adds complexity for marginal demo value, currency conversion adds risk

**Decision:** Out of scope for hackathon, USD-only

---

**End of Design Document**
