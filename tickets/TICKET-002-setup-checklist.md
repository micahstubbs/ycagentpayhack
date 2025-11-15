# TICKET-002: Production Setup Checklist

**Priority**: High
**Type**: Setup & Configuration
**Created**: 2025-11-15
**Status**: Not Started

---

## Overview

Complete checklist of all API keys, configuration values, and manual steps required to get the Invoice-Backed Lending Marketplace system fully operational and ready for production deployment.

---

## API Keys & Credentials

### Stripe Configuration

- [ ] **Create Stripe Account**
  - Go to: https://stripe.com
  - Sign up or log in
  - Navigate to Dashboard

- [ ] **Get Stripe Secret Key**
  - Dashboard → Developers → API keys
  - Copy "Secret key" (starts with `sk_test_` for test mode or `sk_live_` for live)
  - Add to `.env`: `STRIPE_SECRET_KEY=sk_test_...`

- [ ] **Enable Stripe Connect**
  - Dashboard → Connect → Get started
  - Choose "Platform" type (not Marketplace)
  - Complete onboarding

- [ ] **Get Stripe Platform Account ID**
  - Dashboard → Settings → Account details
  - Copy "Account ID" (starts with `acct_`)
  - Add to `.env`: `STRIPE_PLATFORM_ACCOUNT_ID=acct_...`

- [ ] **Set Up Stripe Webhooks**
  - Dashboard → Developers → Webhooks → Add endpoint
  - Endpoint URL: `https://your-deployment.convex.site/stripe/webhook`
  - Events to listen for:
    - [x] `transfer.created`
    - [x] `payment_intent.succeeded`
  - Copy "Signing secret" (starts with `whsec_`)
  - Add to `.env`: `STRIPE_WEBHOOK_SECRET=whsec_...`

- [ ] **Test with Stripe CLI** (Development)
  - Install: https://stripe.com/docs/stripe-cli
  - Login: `stripe login`
  - Forward webhooks: `stripe listen --forward-to http://127.0.0.1:3210/stripe/webhook`
  - Get webhook secret from CLI output
  - Add to `.env` for local testing

---

### Anthropic Configuration

- [ ] **Get Anthropic API Key**
  - Go to: https://console.anthropic.com/
  - Sign up or log in
  - Navigate to API keys
  - Create new key or copy existing
  - Add to `.env`: `ANTHROPIC_API_KEY=sk-ant-...`

- [ ] **Verify Claude Sonnet 4.5 Access**
  - Check that your account has access to `claude-sonnet-4-20250514` model
  - Test with simple API call if needed

---

### Convex Configuration

- [ ] **Initialize Convex Project**
  - Run: `pnpm convex dev` (first time setup)
  - Follow prompts to create account/project
  - Choose project name

- [ ] **Get Convex Deployment URL**
  - After initialization, Convex provides deployment URL
  - Format: `https://your-project.convex.cloud`
  - Add to `.env`: `NEXT_PUBLIC_CONVEX_URL=https://...`

- [ ] **Deploy Convex Functions**
  - Run: `pnpm convex deploy --prod` (for production)
  - Or: `pnpm convex dev` (for development)
  - Verify functions deployed successfully

- [ ] **Set Convex Environment Variables**
  - Dashboard → Settings → Environment Variables
  - Add:
    - `STRIPE_SECRET_KEY`
    - `STRIPE_WEBHOOK_SECRET`
    - `ANTHROPIC_API_KEY`
    - `BASE_RPC_URL`
    - `PRIVATE_KEY`
    - `INVOICE_NFT_ADDRESS`
    - `LOAN_ESCROW_ADDRESS`

---

### Base Blockchain Configuration

- [ ] **Get Base Sepolia Testnet ETH**
  - Faucet option 1: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
  - Faucet option 2: https://faucets.chain.link/base-sepolia
  - Faucet option 3: https://www.alchemy.com/faucets/base-sepolia
  - Need at least 0.05 ETH for contract deployment

- [ ] **Create Deployment Wallet**
  - Use MetaMask or generate new wallet
  - Export private key (KEEP SECURE - test wallet only!)
  - Add to `.env`: `PRIVATE_KEY=0x...`
  - Add wallet address to DEPLOYMENT.md for reference

- [ ] **Configure Base RPC URL**
  - Public endpoint: `https://sepolia.base.org`
  - Or use Alchemy/Infura Base Sepolia endpoint
  - Add to `.env`: `BASE_RPC_URL=https://sepolia.base.org`

- [ ] **Deploy Smart Contracts**
  - Run: `yarn deploy:contracts`
  - Wait for deployment to complete
  - Copy contract addresses from output

- [ ] **Update .env with Contract Addresses**
  - Add: `INVOICE_NFT_ADDRESS=0x...`
  - Add: `LOAN_ESCROW_ADDRESS=0x...`

- [ ] **Verify Contracts on BaseScan**
  - Visit: `https://sepolia.basescan.org/address/[CONTRACT_ADDRESS]`
  - Verify contract source code (optional but impressive for judges)

---

### Locus Configuration (Mock Mode)

- [ ] **Note: Using Mock Mode for Hackathon**
  - The current implementation uses mock Locus service
  - No real Locus API keys needed
  - If integrating real Locus SDK later:
    - Get API key from Locus
    - Add to `.env`: `LOCUS_API_KEY=...`

---

## Manual Configuration Steps

### 1. Environment File Setup

- [ ] **Copy .env.example to .env**
  ```bash
  cp .env.example .env
  ```

- [ ] **Fill in all API keys** (see sections above)

- [ ] **Verify all required variables are set**
  - Run: `node -e "require('dotenv').config(); console.log(process.env)"`
  - Check that all keys from .env.example are present

---

### 2. Initialize Agents

- [ ] **Run agent initialization**
  ```bash
  yarn init:agents
  ```

- [ ] **Sync agents to Convex**
  ```bash
  yarn sync:agents
  ```

- [ ] **Verify agents created**
  ```bash
  cat data/agent-registry.json
  ```
  Should show 3 agents: business-001, lender-001, analyst-001

- [ ] **Check agents in Convex Dashboard**
  - Convex Dashboard → Data → agents table
  - Should see 3 agent records

---

### 3. Smart Contract Deployment

- [ ] **Ensure sufficient testnet ETH** (at least 0.05 ETH)

- [ ] **Deploy contracts**
  ```bash
  yarn deploy:contracts
  ```

- [ ] **Save deployment output**
  - Copy InvoiceNFT address
  - Copy LoanEscrow address
  - Save for reference

- [ ] **Update .env file**
  - Add both contract addresses
  - Restart any running services

- [ ] **Update Convex environment variables**
  - Add contract addresses to Convex dashboard
  - Redeploy if needed

---

### 4. Stripe Connect Setup

- [ ] **Enable Stripe Connect in Dashboard**
  - Dashboard → Connect
  - Set up as "Platform"
  - Complete platform profile

- [ ] **Create Express Connect Accounts**
  - Option 1: Run `yarn init:agents` (creates mock accounts in dev mode)
  - Option 2: Manually create via Stripe Dashboard
  - Verify 3 Connect accounts exist

- [ ] **Configure webhook endpoint**
  - Use Convex deployment URL + `/stripe/webhook`
  - Test with Stripe CLI first

---

### 5. Frontend Configuration (Next.js)

- [ ] **Install dependencies**
  ```bash
  yarn install
  ```

- [ ] **Build frontend**
  ```bash
  yarn build
  ```

- [ ] **Start development server**
  ```bash
  yarn dev
  ```

- [ ] **Verify frontend loads**
  - Visit: `http://localhost:3000`
  - Check for errors in console

---

### 6. Convex Backend Deployment

- [ ] **Deploy Convex functions**
  ```bash
  pnpm convex deploy --prod
  ```

- [ ] **Verify deployment**
  - Check Convex Dashboard → Functions
  - All functions should show "deployed" status

- [ ] **Test webhook endpoint**
  ```bash
  curl -X POST https://your-deployment.convex.site/stripe/webhook \
    -H "stripe-signature: test" \
    -d '{"type":"test","id":"evt_test"}'
  ```

---

## Testing & Verification

### Pre-Demo Testing

- [ ] **Test smart contracts**
  ```bash
  npx hardhat test
  ```
  Expected: 4/4 tests passing

- [ ] **Test backend compilation**
  ```bash
  yarn build:backend
  ```
  Expected: No TypeScript errors

- [ ] **Test agent initialization**
  ```bash
  yarn init:agents
  ```
  Expected: 3 agents created

- [ ] **Test Convex connection**
  - Open Convex Dashboard
  - Check agents table has 3 entries
  - Check functions are deployed

- [ ] **Test Stripe webhook (local)**
  ```bash
  stripe listen --forward-to http://127.0.0.1:3210/stripe/webhook
  stripe trigger transfer.created
  ```

- [ ] **Run demo script** (may need mocked steps)
  ```bash
  yarn demo
  ```

---

### Integration Testing

- [ ] **Fund an agent via Stripe**
  - Use Stripe test card: `4242 4242 4242 4242`
  - Verify transfer appears in Stripe Dashboard
  - Check webhook is received in Convex
  - Verify USDC deposited to agent

- [ ] **Check agent balances**
  ```bash
  # Via Convex query
  # Or via frontend dashboard
  ```

- [ ] **Test agent tool execution**
  - Run simple agent with `check_stripe_balance` tool
  - Verify tool returns correct balance

---

## Production Deployment Checklist

### Pre-Production

- [ ] **Switch to Live Mode**
  - Use `sk_live_` Stripe keys
  - Deploy to mainnet (Base) instead of testnet
  - Update all API keys to production

- [ ] **Add Security Measures**
  - Enable rate limiting on webhook endpoint
  - Set up monitoring (Sentry, Datadog, etc.)
  - Configure alerts for failed transactions

- [ ] **Complete Security Audit**
  - Fix smart contract reentrancy issues (see CODE_REVIEW.md)
  - Add additional validation
  - Consider formal audit for smart contracts

### Production Deployment

- [ ] **Deploy smart contracts to Base Mainnet**
  - Get mainnet ETH (real money!)
  - Deploy with `--network baseMainnet`
  - Verify on BaseScan

- [ ] **Update all environment variables**
  - Production API keys
  - Mainnet contract addresses
  - Production webhook URLs

- [ ] **Deploy Convex to production**
  ```bash
  pnpm convex deploy --prod
  ```

- [ ] **Deploy Next.js frontend**
  - Deploy to Vercel/Netlify
  - Configure environment variables
  - Test production build

---

## Common Issues & Solutions

### Issue: "Missing required environment variables"
**Solution**: Check `.env` file has all variables from `.env.example`

### Issue: "Insufficient funds for gas"
**Solution**: Get more testnet ETH from faucets

### Issue: "Contract deployment failed"
**Solution**: Check RPC URL, private key, and network configuration

### Issue: "Webhook signature verification failed"
**Solution**: Ensure `STRIPE_WEBHOOK_SECRET` matches webhook endpoint in Stripe Dashboard

### Issue: "Anthropic API error"
**Solution**: Verify API key is valid and has Claude Sonnet 4.5 access

### Issue: "Convex connection failed"
**Solution**: Check `NEXT_PUBLIC_CONVEX_URL` is correct deployment URL

---

## Completion Criteria

This ticket is complete when:
- [ ] All API keys obtained and configured
- [ ] All environment variables set in .env
- [ ] Smart contracts deployed to Base Sepolia
- [ ] Agents initialized in Convex database
- [ ] Convex functions deployed successfully
- [ ] Webhooks configured and tested
- [ ] Demo script runs end-to-end without errors
- [ ] Frontend loads and displays agent data
- [ ] All integration points verified working

---

## Timeline

**Estimated Time**: 3-4 hours for complete setup

**Breakdown**:
- API key acquisition: 30 min
- Smart contract deployment: 30 min
- Convex setup and deployment: 45 min
- Stripe Connect configuration: 45 min
- Agent initialization: 15 min
- Testing and verification: 1 hour

---

## Resources

- [Stripe Dashboard](https://dashboard.stripe.com)
- [Anthropic Console](https://console.anthropic.com)
- [Convex Dashboard](https://dashboard.convex.dev)
- [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
- [DEPLOYMENT.md](../DEPLOYMENT.md)
- [convex/WEBHOOKS.md](../convex/WEBHOOKS.md)
- [convex/FUNDING_API.md](../convex/FUNDING_API.md)
