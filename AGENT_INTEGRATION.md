# AI Agent Loan Processing Integration

## Overview

This document describes the complete integration between the Next.js frontend and the autonomous AI agent backend for invoice-backed loan processing.

## Architecture

```
User (Frontend) → Convex → Agent Backend API → 3 AI Agents → Base Smart Contracts
                     ↓
                 Database (loan tracking)
```

## Components

### 1. Frontend UI ([app/product/Chat/Chat.tsx](app/product/Chat/Chat.tsx))

The main interface now includes:
- **Loan Request Form** - User submits invoice details
- **Loan Status Dashboard** - Real-time tracking of the 8-step workflow
- Tab navigation between AI Loan Processing and Chat

### 2. Loan Request Form ([app/product/Chat/LoanRequestForm.tsx](app/product/Chat/LoanRequestForm.tsx))

User inputs:
- Invoice Amount (total receivable)
- Loan Amount (requested funding, typically 70-90% of invoice)
- Customer Wallet Address (debtor)
- Days Until Invoice Due
- Loan Purpose (e.g., "Rent H200 GPU compute")

### 3. Loan Status Dashboard ([app/product/Chat/LoanStatusDashboard.tsx](app/product/Chat/LoanStatusDashboard.tsx))

Displays:
- All user's loan requests
- Current workflow step (1-8)
- Progress bar visualization
- Loan details (amounts, credit score, interest rate)
- Status badges (Pending, Analyzing, Approved, Rejected, etc.)

### 4. Convex Backend ([convex/loans.ts](convex/loans.ts))

**Mutations:**
- `create` - User creates new loan request
- `updateStatus` - Agent backend updates loan progress

**Queries:**
- `listByUser` - Get user's loan history
- `getById` - Get specific loan details

**Actions:**
- `triggerAgentWorkflow` - Calls agent backend API via HTTP

**Database Schema:**
```typescript
loanRequests: {
  userId: Id<"users">,
  invoiceAmount: number,
  loanAmount: number,
  debtorAddress: string,
  daysUntilDue: number,
  purpose: string,
  status: string, // "pending", "analyzing", "approved", etc.
  creditScore?: number,
  interestRate?: number,
  loanId?: number,
  invoiceTokenId?: number,
  createdAt: number,
  updatedAt: number
}
```

### 5. Agent Backend API ([src/api/loan-api.ts](src/api/loan-api.ts))

**Express Server** (Port 3001)

**Endpoints:**
- `POST /api/loan/process` - Trigger 8-step agent workflow
- `GET /api/loan/status/:loanRequestId` - Check loan status

**8-Step Workflow:**

1. **Business Agent Initiates** (`business-001`)
   - Checks balance
   - Mints invoice NFT
   - Approves NFT for escrow
   - Sends loan request to lender

2. **Lender Agent Processes** (`lender-001`)
   - Reads inbox for loan requests
   - Validates request details
   - Requests credit analysis from analyst
   - Sends payment to analyst

3. **Analyst Agent Analyzes** (`analyst-001`)
   - Reads inbox for analysis requests
   - Verifies payment received
   - Analyzes invoice and credit risk
   - Assigns credit score (0-10)
   - Sends report back to lender

4. **Lender Agent Executes** (`lender-001`)
   - Reads analyst report
   - Approves if credit score ≥ 7
   - Creates loan via smart contract
   - Disburses USDC to business

5-8. **Settlement Steps** (Future: when customer pays invoice)
   - Business receives customer payment
   - Business settles loan (principal + interest)
   - Lender receives repayment
   - Invoice NFT returned to business

### 6. AI Agent Tools

**Locus Payment Tools:**
- `get_payment_context` - Check USDC balance
- `send_to_contact` - Send to whitelisted contact
- `send_to_address` - Send to any wallet address
- `send_to_email` - Send to agent by email

**Base Smart Contract Tools:**
- `mint_invoice_nft` - Tokenize invoice as ERC-721
- `approve_nft_transfer` - Allow escrow to lock NFT
- `create_loan` - Execute loan with collateral
- `get_loan_status` - Check loan state
- `settle_loan` - Repay and retrieve NFT
- `get_invoice_details` - View invoice metadata

**Communication Tools:**
- `check_inbox` - Read messages from other agents
- `send_message_to_agent` - Send message to agent by ID

## Running the System

### Development Mode

Start all services in parallel:

```bash
npm run dev
```

This starts:
1. Frontend (Next.js) - http://localhost:3000
2. Convex Backend - Database and serverless functions
3. Agent Backend API - http://localhost:3001

### Individual Services

```bash
# Frontend only
npm run dev:frontend

# Convex only
npm run dev:backend

# Agent API only
npm run dev:agent-api
```

### Demo Mode (Without Frontend)

Test the 8-step agent workflow directly:

```bash
npm run demo
```

This runs the full agent orchestration with:
- Business agent requesting $800 loan
- Lender agent processing request
- Analyst agent performing credit analysis
- Lender agent executing loan
- ~25 autonomous sub-actions

## Environment Variables

Required in `.env`:

```bash
# Anthropic API (for AI agents)
ANTHROPIC_API_KEY=sk-ant-...

# Convex (for database)
CONVEX_DEPLOYMENT=...
CONVEX_URL=https://...

# Locus (for USDC payments - currently mocked)
LOCUS_API_KEY=lsk_...
LOCUS_SECRET_KEY=lss_...

# Base Smart Contracts (currently mocked)
INVOICE_NFT_ADDRESS=0x...
LOAN_ESCROW_ADDRESS=0x...
BASE_RPC_URL=https://sepolia.base.org

# Agent Backend API
AGENT_BACKEND_PORT=3001
AGENT_BACKEND_URL=http://localhost:3001
```

## User Flow Example

1. User logs in via Convex Auth
2. User navigates to "AI Loan Processing" tab
3. User fills out loan request form:
   - Invoice Amount: $1000
   - Loan Amount: $800
   - Customer Address: 0xdebtor123...
   - Days Until Due: 30
   - Purpose: "Rent H200 GPU compute"
4. User clicks "Submit Loan Request"
5. Frontend calls `api.loans.create` mutation
6. Convex creates loan record and triggers `triggerAgentWorkflow` action
7. Convex action calls Agent Backend API `POST /api/loan/process`
8. Agent Backend initializes 3 agents and runs 8-step workflow
9. Agents autonomously:
   - Mint invoice NFT
   - Perform credit analysis
   - Execute loan via smart contract
   - Disburse USDC
10. Agent Backend updates Convex loan status throughout workflow
11. User sees real-time progress in Loan Status Dashboard

## Status Flow

```
pending → pending_lender → analyzing → pending_approval → approved → disbursed → settling → settled
                                                        ↓
                                                    rejected
```

## Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS
- **Backend:** Convex (database + serverless)
- **Agent API:** Express.js, TypeScript
- **AI:** Anthropic Claude Sonnet 4
- **Payments:** Locus AgentPay (mocked for hackathon)
- **Blockchain:** Base L2, Ethers.js (mocked for hackathon)
- **Smart Contracts:** InvoiceNFT (ERC-721), LoanEscrow

## Key Features

✅ Autonomous multi-agent coordination
✅ Real-time loan status tracking
✅ Invoice NFT tokenization
✅ Credit analysis via AI
✅ Smart contract escrow
✅ USDC payment rails
✅ 8-step workflow visualization

## Testing

1. Start all services: `npm run dev`
2. Navigate to http://localhost:3000
3. Login or create account
4. Go to "AI Loan Processing" tab
5. Submit a test loan request
6. Watch the agents process it autonomously
7. Monitor progress in the dashboard

## Troubleshooting

**Agent API not starting:**
- Check port 3001 is available
- Verify ANTHROPIC_API_KEY is set
- Check logs in terminal

**Loan status not updating:**
- Verify Agent Backend can reach Convex
- Check CONVEX_URL is set correctly
- Look for errors in agent backend logs

**Agents not coordinating:**
- Check all 3 agent prompts are loaded
- Verify Locus service is initialized
- Increase maxTurns if workflow incomplete

## Next Steps

1. Deploy real Base smart contracts
2. Integrate real Locus USDC transfers
3. Add webhook for Convex status updates
4. Implement loan settlement (steps 5-8)
5. Add email notifications
6. Deploy to production
