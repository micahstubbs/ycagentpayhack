# Autonomous AI Agent Demo

An AI agent that autonomously requests and manages loans through your invoice-backed lending platform.

## 🎯 What It Does

The autonomous borrower agent:
1. **Monitors its financial needs** - Knows when it needs money
2. **Checks current balance** - Sees if it has sufficient USDC
3. **Mints Invoice NFTs** - Creates collateral from receivables
4. **Requests loans** - Communicates with lender agents
5. **Manages repayment** - Tracks obligations and settles loans

## 🚀 Quick Start

### Option 1: API Demo (Recommended for Presentation)

**Terminal 1 - Start the API server:**
```bash
npm run dev:agent-api
```

**Terminal 2 - Trigger autonomous agent:**
```bash
curl -X POST http://localhost:3001/api/demo/quick-autonomous-loan \
     -H "Content-Type: application/json" \
     -d '{
       "amount": 800,
       "purpose": "Rent H200 GPU cluster for AI training"
     }'
```

**Watch Terminal 1** to see the agent working autonomously!

### Option 2: Direct Script

```bash
npm run demo:autonomous
```

### Option 3: Test Script

```bash
npm run test:autonomous
```

## 📡 API Endpoints

### Create Autonomous Borrower

**POST** `/api/agent/autonomous-loan`

```json
{
  "agentId": "my-ai-agent-001",
  "purpose": "GPU compute rental",
  "amountNeeded": 800,
  "deadline": "2 hours",
  "invoiceAmount": 1000,
  "invoiceDebtor": "0xCustomerAddress",
  "invoiceDueDate": "30 days"
}
```

### Check Agent Status

**GET** `/api/agent/status/:agentId`

Returns:
```json
{
  "success": true,
  "agentId": "my-ai-agent-001",
  "balance": 800,
  "messageCount": 3,
  "recentMessages": [...],
  "transactionCount": 2,
  "recentTransactions": [...]
}
```

### Quick Demo

**POST** `/api/demo/quick-autonomous-loan`

```json
{
  "amount": 800,
  "purpose": "GPU rental"
}
```

## 🎬 Demo Flow

**What you'll see in the terminal:**

```
🤖 Autonomous Borrower Agent: autonomous-1731234567890
==================================================================

Need: {
  "purpose": "Rent H200 GPU cluster for AI training",
  "amountNeeded": 800,
  "deadline": "2 hours from now",
  "invoiceAmount": 1000,
  "invoiceDebtor": "0xdebtor123abc",
  "invoiceDueDate": "30 days from now"
}

--- Turn 1/15 ---

💭 Agent thinking:
I need to assess my current financial situation first. Let me check
my USDC balance to see if I already have the funds I need.

🔧 Tool: get_payment_context
Input: {}
✅ Result: {
  "message": "Budget Status: Active\nAvailable Balance: 0.00 USDC\n..."
}

--- Turn 2/15 ---

💭 Agent thinking:
I have 0 USDC but need 800 USDC. I have a 1000 USDC invoice that I can
use as collateral. Let me mint an Invoice NFT from this receivable.

🔧 Tool: mint_invoice_nft
Input: {
  "debtor": "0xdebtor123abc",
  "amount": 1000,
  "dueDate": "2025-12-15"
}
✅ Result: {
  "success": true,
  "tokenId": 0,
  "amount": 1000
}

--- Turn 3/15 ---

💭 Agent thinking:
Great! I've minted Invoice NFT #0. Now I need to request a loan from
the lender. Let me send a message to the lender agent.

🔧 Tool: send_message_to_agent
Input: {
  "toAgentId": "lender-001",
  "subject": "Loan Request - 800 USDC",
  "content": "I need 800 USDC for GPU rental. I have Invoice NFT #0..."
}
✅ Result: {
  "success": true
}

✅ Agent autonomous-1731234567890 completed its task

🏁 Agent session ended
==================================================================
```

## 💡 Use Cases

### 1. GPU Rental
```bash
curl -X POST http://localhost:3001/api/agent/autonomous-loan \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "ai-trainer-001",
    "purpose": "Rent A100 GPUs for model training",
    "amountNeeded": 2000,
    "invoiceAmount": 3000,
    "invoiceDebtor": "0xClientABC"
  }'
```

### 2. API Credits
```bash
curl -X POST http://localhost:3001/api/agent/autonomous-loan \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "data-scraper-001",
    "purpose": "Purchase API credits for data collection",
    "amountNeeded": 500,
    "invoiceAmount": 800,
    "invoiceDebtor": "0xClientXYZ"
  }'
```

### 3. Database Hosting
```bash
curl -X POST http://localhost:3001/api/agent/autonomous-loan \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "saas-backend-001",
    "purpose": "Pay for database hosting",
    "amountNeeded": 300,
    "invoiceAmount": 500,
    "invoiceDebtor": "0xCustomer123"
  }'
```

## 🎭 Demo for Hackathon Judges

### Interactive Demo

**Setup (before demo):**
```bash
# Terminal 1
npm run dev:agent-api

# Keep this running
```

**During presentation:**

1. **Explain the scenario:**
   > "This AI agent needs $800 to rent GPUs, but has 0 USDC.
   > It has a $1,000 invoice due in 30 days. Watch it autonomously
   > get funding."

2. **Trigger the agent:**
   ```bash
   curl -X POST http://localhost:3001/api/demo/quick-autonomous-loan \
        -H "Content-Type: application/json" \
        -d '{"amount": 800}'
   ```

3. **Watch Terminal 1** - Agent will:
   - Check its balance (0 USDC)
   - Mint Invoice NFT from receivable
   - Request loan from lender
   - Receive 800 USDC
   - Pay for GPU rental

4. **Show the results:**
   ```bash
   curl http://localhost:3001/api/agent/status/autonomous-[TIMESTAMP]
   ```

## 🔥 Why This Outshines Handshake Payments

| Feature | Handshake Payment | Autonomous Agent |
|---------|------------------|------------------|
| Intelligence | None (manual) | Full AI autonomy |
| Workflow | Simple transfer | Complex loan workflow |
| Collateral | None | Invoice NFT |
| Credit Analysis | No | Yes (AI analyst) |
| Smart Contracts | No | Yes (Base escrow) |
| Value Creation | Move existing money | Unlock new liquidity |
| Business Impact | Send $10 to friend | Fund $800 operation |

## 🛠️ Technical Details

**Agent Components:**
- **Autonomous Borrower** ([src/agents/autonomous-borrower.ts](src/agents/autonomous-borrower.ts))
  - System prompt with financial decision-making
  - Tool access for payments, NFTs, messaging
  - Autonomous loop with max 15 turns

- **API Server** ([src/api/loan-api.ts](src/api/loan-api.ts))
  - Express REST API
  - CORS enabled
  - Async agent execution

**Tools Available to Agent:**
- `get_payment_context` - Check Locus balance
- `mint_invoice_nft` - Create NFT collateral
- `send_message_to_agent` - Communicate with lender
- `check_inbox` - Read responses
- `send_to_address` - Pay for services
- `get_loan_status` - Track loan
- `settle_loan` - Repay when due

## 📊 Demo Outcomes

**Expected Results:**
```
Final Balances:
   Lender:   1040 USDC  (earned 40 USDC interest)
   Borrower: 160 USDC   (surplus after loan repayment)
   Analyst:  20 USDC    (paid for credit analysis)

Total Transactions: 5
   1. lender-001 → analyst-001: 20 USDC (Credit analysis payment)
   2. lender-001 → business-001: 800 USDC (Loan disbursement)
   3. business-001 → 0xcompute: 800 USDC (GPU rental payment)
   4. business-001 → lender-001: 840 USDC (Loan repayment + interest)
```

## 🎯 Talking Points

1. **"This isn't just a payment - it's autonomous financial decision-making"**
   - Agent assesses its situation
   - Makes strategic decisions
   - Executes complex workflows

2. **"Invoice NFTs unlock $2.7 trillion in working capital"**
   - Real business problem
   - Real solution with blockchain

3. **"3 AI agents coordinate without human intervention"**
   - Borrower, Lender, Analyst
   - Messaging, payments, credit analysis
   - All autonomous

4. **"From $0 to $800 in under 2 minutes"**
   - No bank applications
   - No credit checks
   - No waiting

## 🚀 Next Steps

**After winning the hackathon:**
1. Connect to real Locus API (currently mock)
2. Deploy smart contracts to Base mainnet
3. Add ChatGPT integration for voice-activated loans
4. Build monitoring dashboard
5. Add fraud detection
6. Implement loan marketplace

---

**Built for the Agentic Payments Hackathon by Locus @ YC HQ**
