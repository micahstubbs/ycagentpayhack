# Agentic Payments Hackathon - Design Document

**Date:** November 15, 2025
**Event:** Agentic Payments Hackathon by Locus @ YC HQ
**Project:** Invoice-Backed Lending Marketplace for AI Agents

---

## Overview

Build an agent-to-agent marketplace where AI agents can obtain liquidity by leveraging invoice NFTs as collateral. The primary use case: a business agent needs to rent compute resources (H200 GPUs) but has outstanding receivables locked in invoice NFTs. The system enables autonomous lending, creditworthiness analysis, and payment execution.

---

## Problem Statement

AI agents operating businesses face cash flow challenges similar to human-run businesses:
- They have receivables (invoices) but need immediate liquidity
- Traditional financing is slow and requires human intervention
- Agent-to-agent commerce requires trustless settlement mechanisms

---

## Solution

An autonomous lending marketplace where:
1. **Business Agent** (borrower) posts invoice NFT as collateral
2. **Credit Analyst Agent** evaluates creditworthiness of the invoice debtor
3. **Lender Agent** provides liquidity based on invoice value and credit analysis
4. **Smart Contract Escrow** holds the invoice NFT and manages settlement
5. Business Agent uses borrowed funds to purchase compute resources via Locus payments

---

## Key Design Decisions

### 1. Focus Area
**Agent-to-agent marketplace** - AI agents trading services and providing financial services to each other

### 2. Service Types
**Hybrid/general marketplace** - Open platform where agents can offer various services (lending, credit analysis, compute rental, etc.)

### 3. Discovery Mechanism
**Service registry + direct negotiation** - Agents register capabilities in a catalog, then negotiate terms directly

### 4. Demo Scenario
**Trade finance use case** - Agent running a business has invoice NFTs (receivables) but needs immediate cash to rent H200 GPU compute time

### 5. Lending Flow
**Smart contract escrow** - Invoice NFT held in escrow; when debtor pays, lender gets principal + interest, borrower gets remainder

### 6. Agent Roles (Core Implementation)
- **Business Agent (borrower)** - Has invoice NFTs, needs liquidity
- **Lender Agent** - Provides capital against invoice collateral
- **Credit Analyst Agent** - Evaluates debtor creditworthiness (paid service)
- *Compute Provider & Debtor agents assumed to be pre-existing/simulated*

### 7. Blockchain Platform
**Base (Coinbase L2)** - Aligns with sponsor, low fees, good developer experience

### 8. User Interaction
**Fully autonomous simulation** - Agents run end-to-end without human intervention

---

## Architectural Approaches Considered

### Approach 1: Lightweight - Message Broker + Anthropic SDK
Simple message queue (Redis/RabbitMQ) for agent coordination. Each agent uses Anthropic SDK with tools for messaging, Locus API, and Base blockchain interaction.

**Pros:**
- Fast to build in hackathon timeframe
- Minimal infrastructure
- Clear separation of concerns

**Cons:**
- Not "blockchain native"
- Simpler than full smart contract marketplace

### Approach 2: Smart Contract Marketplace
Full on-chain marketplace with service registry, escrow, and settlement in Base smart contracts. Agents interact via web3 tools.

**Pros:**
- Web3 native and trustless
- Strong security guarantees

**Cons:**
- Heavy development lift
- Risk of running out of time
- Contract complexity may overshadow agent intelligence

### Approach 3: Hybrid - Off-chain Coordination, On-chain Settlement ✅ **RECOMMENDED**
Agents negotiate off-chain using Anthropic SDK + REST API. Critical state (invoice NFT ownership, escrow) on Base. Locus handles agent-to-agent payments. Smart contracts focused on escrow logic only.

**Pros:**
- Best balance: fast agent negotiation + trustless settlement
- Focused smart contracts (easier to build correctly)
- Showcases AI intelligence AND Web3 guarantees
- Achievable in hackathon timeframe

**Cons:**
- Slightly more complex to explain
- Need clear on-chain vs off-chain boundaries

---

## Recommended Architecture: Hybrid Approach

### Components

#### 1. Off-Chain Layer
- **Agent Runtime:** Anthropic SDK agents
- **Coordination:** Simple REST API or message broker for agent discovery and negotiation
- **Payment Rails:** Locus for agent-to-agent service payments

#### 2. On-Chain Layer (Base)
- **Invoice NFT Contract:** ERC-721 representing receivables
- **Escrow Contract:** Holds invoice NFT, manages collateral and settlement
- **Events:** Emit events for agent monitoring (loan created, invoice paid, settlement complete)

#### 3. Agent Tools (Anthropic SDK)
Each agent has tools for:
- Querying service registry
- Sending/receiving messages to other agents
- Making Locus payments
- Interacting with Base contracts (read state, submit transactions)
- Evaluating creditworthiness (for analyst agent)

---

## System Flow

### End-to-End Scenario

1. **Business Agent** discovers it needs H200 compute time but lacks sufficient USDC
2. **Business Agent** checks its assets, finds invoice NFT worth $1000 due in 30 days
3. **Business Agent** queries service registry for lenders
4. **Lender Agent** receives request, needs credit analysis
5. **Lender Agent** queries service registry, finds **Credit Analyst Agent**
6. **Lender Agent** pays **Credit Analyst** via Locus for creditworthiness report
7. **Credit Analyst** analyzes invoice debtor, returns risk score and recommended terms
8. **Lender Agent** proposes loan: $800 advance (80% of face value) at 5% interest
9. **Business Agent** accepts terms
10. **Smart Contract** creates escrow: locks invoice NFT, transfers $800 USDC to Business Agent
11. **Business Agent** uses $800 to pay Compute Provider for H200 time (via Locus)
12. *(Simulated)* After 30 days, Debtor pays invoice → $1000 goes to escrow
13. **Smart Contract** settles: $840 to Lender ($800 + $40 interest), $160 to Business Agent
14. Invoice NFT returned to Business Agent

---

## Technical Stack

### AI & Agents
- **Anthropic SDK** - Agent orchestration and intelligence
- **Claude (Sonnet 4.5)** - Underlying LLM for agent decision-making

### Payments
- **Locus** - Agent-to-agent payment infrastructure (credit analyst fees, compute rental)

### Blockchain
- **Base (L2)** - Invoice NFTs and escrow smart contracts
- **Coinbase Developer Platform** - Wallet management and Base interaction

### Infrastructure
- **Node.js/TypeScript** - Agent runtime
- **Solidity** - Smart contracts (invoice NFT, escrow)
- **Hardhat/Foundry** - Smart contract development and testing
- **Redis** (optional) - Message broker for agent coordination

---

## Judging Criteria Alignment

### Originality ✅
Invoice-backed lending for AI agents is novel. Combining trade finance primitives with autonomous agents creates a genuinely new use case.

### Technical Execution ✅
- Multiple Anthropic SDK agents with custom tools
- Real Locus payments between agents
- Smart contracts on Base for trustless escrow
- End-to-end autonomous workflow

### Real-World Value ✅
Solves actual cash flow problems for AI agents operating businesses. Extensible to human businesses using AI agent intermediaries.

### Feasibility ✅
Hybrid architecture is achievable in hackathon timeframe:
- Simple escrow contract (~100-150 lines)
- 3 core agents (borrower, lender, analyst)
- Simulated debtor and compute provider

### Storytelling ✅
Clear narrative: "AI agent needs compute NOW but has invoice NFT locked up for 30 days. Watch autonomous lending market solve this in real-time."

---

## Implementation Priorities (Hackathon Day)

### Must Have (Core Demo)
1. Invoice NFT contract on Base
2. Escrow smart contract with basic deposit/settlement logic
3. Business Agent with tools (check assets, request loan, pay for compute)
4. Lender Agent with tools (evaluate requests, execute loans)
5. Credit Analyst Agent with tools (analyze credit, accept Locus payment)
6. Simple service registry (can be JSON file or in-memory)
7. Locus payment integration for analyst fee
8. End-to-end autonomous flow demonstration

### Nice to Have (If Time)
- Web dashboard showing agent messages and blockchain state in real-time
- Multiple lenders competing with different terms
- More sophisticated credit analysis (on-chain debtor history)
- Actual compute provider agent (vs simulation)

### Out of Scope (Hackathon)
- Production-grade smart contract security (auditing, formal verification)
- Scalability optimizations
- Full lending protocol features (liquidation, default handling, etc.)
- Mobile interface

---

## Success Metrics

### Demo Success
- Autonomous flow completes without errors
- All payments execute via Locus
- Smart contract escrow correctly manages NFT and funds
- Clear visualization of agent decision-making

### Judging Success
- Finalist in at least one prize category
- Strong technical depth questions from judges
- Interest from sponsors (Anthropic, Coinbase, Locus)

---

## Risks & Mitigations

### Risk: Smart contract bugs during demo
**Mitigation:** Extensive local testing, simple contract scope, backup demo video

### Risk: Agent hallucination or errors
**Mitigation:** Constrained action space via tools, deterministic test scenario, retry logic

### Risk: Locus API integration issues
**Mitigation:** Early integration testing, mock Locus layer as backup

### Risk: Time management
**Mitigation:** Focus on must-haves first, have working checkpoint every 2 hours

---

## Next Steps

1. ✅ Validate this design approach
2. Set up git worktree for isolated development
3. Create detailed implementation plan with task breakdown
4. Begin implementation: smart contracts first, then agents
5. Integrate Locus SDK and test payments
6. Build demo scenario and test end-to-end
7. Create presentation materials
8. Practice demo run-through

---

## Questions to Resolve

- Exact Locus API endpoints and authentication flow
- Base testnet vs mainnet for demo (likely testnet)
- Mock vs real compute provider integration
- Dashboard tech stack (React? Terminal UI?)

---

## Resources

- [Locus Documentation](https://docs.uselocus.com/)
- [Anthropic SDK](https://github.com/anthropics/anthropic-sdk-python)
- [Base Developer Docs](https://docs.base.org/)
- [Coinbase Developer Platform](https://www.coinbase.com/cloud)
- [Hackathon Details](https://events.ycombinator.com/agenticpaymentshackathon)
