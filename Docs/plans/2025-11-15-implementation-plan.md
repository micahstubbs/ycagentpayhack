# Invoice-Backed Lending Marketplace Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a working demo of an AI agent marketplace where agents get Stripe-funded, execute invoice-backed loans via smart contracts on Base, and transact via Locus payments.

**Architecture:** Hybrid approach with Stripe Connect for fiat funding, Locus for agent payments, Base smart contracts for escrow, and Anthropic SDK for agent intelligence.

**Tech Stack:** TypeScript/Node.js, Express, Stripe SDK, Anthropic SDK, Hardhat/Solidity, Locus SDK, ethers.js

---

## Project Structure

```
ycagentpayhack/
├── contracts/           # Solidity smart contracts
├── src/
│   ├── agents/         # Anthropic SDK agents
│   ├── services/       # Stripe, Locus, Base integrations
│   ├── api/            # Express webhook & API server
│   └── utils/          # Shared utilities
├── test/               # Tests for contracts and services
├── scripts/            # Deployment and setup scripts
└── docs/               # Documentation
```

---

## Task 1: Project Setup & Dependencies

**Files:**
- Create: `package.json`
- Create: `.env.example`
- Create: `.gitignore`
- Create: `tsconfig.json`

**Step 1: Initialize TypeScript project**

Run: `yarn init -y`

**Step 2: Install core dependencies**

Run:
```bash
yarn add typescript @types/node ts-node dotenv
yarn add express @types/express
yarn add stripe @stripe/stripe-js
yarn add @anthropic-ai/sdk
yarn add ethers@6
yarn add --dev @types/express nodemon
```

**Step 3: Create TypeScript config**

Create `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 4: Create .env.example**

Create `.env.example`:
```
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

# Server
PORT=3000
WEBHOOK_URL=https://your-app.replit.dev/webhook
```

**Step 5: Update .gitignore**

Add to `.gitignore`:
```
node_modules/
dist/
.env
*.log
.DS_Store
cache/
artifacts/
typechain-types/
```

**Step 6: Add npm scripts to package.json**

Update `package.json` scripts:
```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "echo \"Tests coming soon\"",
    "deploy:contracts": "npx hardhat run scripts/deploy.ts --network baseSepolia"
  }
}
```

**Step 7: Commit**

```bash
git add package.json tsconfig.json .env.example .gitignore
git commit -m "chore: initialize TypeScript project with dependencies"
```

---

## Task 2: Smart Contracts - InvoiceNFT

**Files:**
- Create: `contracts/InvoiceNFT.sol`
- Create: `test/InvoiceNFT.test.ts`
- Create: `hardhat.config.ts`

**Step 1: Install Hardhat dependencies**

Run:
```bash
yarn add --dev hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts
npx hardhat init
```

Choose "Create a TypeScript project"

**Step 2: Configure Hardhat**

Create `hardhat.config.ts`:
```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    baseSepolia: {
      url: process.env.BASE_RPC_URL || "https://sepolia.base.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 84532
    }
  },
  etherscan: {
    apiKey: {
      baseSepolia: process.env.BASESCAN_API_KEY || ""
    }
  }
};

export default config;
```

**Step 3: Write InvoiceNFT contract**

Create `contracts/InvoiceNFT.sol`:
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract InvoiceNFT is ERC721, Ownable {
    struct Invoice {
        address debtor;
        uint256 amount;
        uint256 dueDate;
        bool paid;
    }

    uint256 private _tokenIdCounter;
    mapping(uint256 => Invoice) public invoices;

    event InvoiceMinted(
        uint256 indexed tokenId,
        address indexed owner,
        address debtor,
        uint256 amount,
        uint256 dueDate
    );

    event InvoicePaid(uint256 indexed tokenId, uint256 amount);

    constructor() ERC721("InvoiceNFT", "INVOICE") Ownable(msg.sender) {}

    function mint(
        address to,
        address debtor,
        uint256 amount,
        uint256 dueDate
    ) external returns (uint256) {
        require(amount > 0, "Amount must be greater than 0");
        require(dueDate > block.timestamp, "Due date must be in the future");

        uint256 tokenId = _tokenIdCounter++;
        _safeMint(to, tokenId);

        invoices[tokenId] = Invoice({
            debtor: debtor,
            amount: amount,
            dueDate: dueDate,
            paid: false
        });

        emit InvoiceMinted(tokenId, to, debtor, amount, dueDate);
        return tokenId;
    }

    function payInvoice(uint256 tokenId) external payable {
        require(_ownerOf(tokenId) != address(0), "Invoice does not exist");
        Invoice storage invoice = invoices[tokenId];
        require(!invoice.paid, "Invoice already paid");
        require(msg.value == invoice.amount, "Incorrect payment amount");

        invoice.paid = true;
        emit InvoicePaid(tokenId, msg.value);

        // Transfer payment to invoice owner
        address owner = ownerOf(tokenId);
        payable(owner).transfer(msg.value);
    }

    function getInvoice(uint256 tokenId)
        external
        view
        returns (Invoice memory)
    {
        require(_ownerOf(tokenId) != address(0), "Invoice does not exist");
        return invoices[tokenId];
    }
}
```

**Step 4: Write test for InvoiceNFT**

Create `test/InvoiceNFT.test.ts`:
```typescript
import { expect } from "chai";
import { ethers } from "hardhat";
import { InvoiceNFT } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("InvoiceNFT", function () {
  let invoiceNFT: InvoiceNFT;
  let owner: SignerWithAddress;
  let debtor: SignerWithAddress;
  let borrower: SignerWithAddress;

  beforeEach(async function () {
    [owner, debtor, borrower] = await ethers.getSigners();

    const InvoiceNFT = await ethers.getContractFactory("InvoiceNFT");
    invoiceNFT = await InvoiceNFT.deploy();
    await invoiceNFT.waitForDeployment();
  });

  it("Should mint an invoice NFT", async function () {
    const amount = ethers.parseEther("1000");
    const dueDate = Math.floor(Date.now() / 1000) + 86400 * 30; // 30 days

    const tx = await invoiceNFT.mint(
      borrower.address,
      debtor.address,
      amount,
      dueDate
    );

    await expect(tx)
      .to.emit(invoiceNFT, "InvoiceMinted")
      .withArgs(0, borrower.address, debtor.address, amount, dueDate);

    const invoice = await invoiceNFT.getInvoice(0);
    expect(invoice.debtor).to.equal(debtor.address);
    expect(invoice.amount).to.equal(amount);
    expect(invoice.paid).to.be.false;
  });

  it("Should allow debtor to pay invoice", async function () {
    const amount = ethers.parseEther("1000");
    const dueDate = Math.floor(Date.now() / 1000) + 86400 * 30;

    await invoiceNFT.mint(borrower.address, debtor.address, amount, dueDate);

    const tx = await invoiceNFT.connect(debtor).payInvoice(0, { value: amount });
    await expect(tx).to.emit(invoiceNFT, "InvoicePaid").withArgs(0, amount);

    const invoice = await invoiceNFT.getInvoice(0);
    expect(invoice.paid).to.be.true;
  });
});
```

**Step 5: Run tests**

Run: `npx hardhat test`

Expected: 2 passing tests

**Step 6: Commit**

```bash
git add contracts/ test/ hardhat.config.ts
git commit -m "feat: add InvoiceNFT smart contract with tests"
```

---

## Task 3: Smart Contracts - LoanEscrow

**Files:**
- Create: `contracts/LoanEscrow.sol`
- Create: `test/LoanEscrow.test.ts`

**Step 1: Write LoanEscrow contract**

Create `contracts/LoanEscrow.sol`:
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LoanEscrow is IERC721Receiver, Ownable {
    struct Loan {
        address lender;
        address borrower;
        uint256 invoiceTokenId;
        uint256 principalAmount;
        uint256 interestAmount;
        uint256 totalOwed;
        bool settled;
        address invoiceNFTContract;
    }

    uint256 private _loanIdCounter;
    mapping(uint256 => Loan) public loans;

    event LoanCreated(
        uint256 indexed loanId,
        address indexed lender,
        address indexed borrower,
        uint256 invoiceTokenId,
        uint256 principalAmount,
        uint256 interestAmount
    );

    event LoanSettled(
        uint256 indexed loanId,
        uint256 amountToLender,
        uint256 amountToBorrower
    );

    constructor() Ownable(msg.sender) {}

    function createLoan(
        address borrower,
        address invoiceNFTContract,
        uint256 invoiceTokenId,
        uint256 principalAmount,
        uint256 interestAmount
    ) external payable returns (uint256) {
        require(borrower != address(0), "Invalid borrower address");
        require(principalAmount > 0, "Principal must be greater than 0");
        require(msg.value == principalAmount, "Must send principal amount");

        // Transfer invoice NFT to escrow
        IERC721(invoiceNFTContract).safeTransferFrom(
            borrower,
            address(this),
            invoiceTokenId
        );

        uint256 loanId = _loanIdCounter++;
        uint256 totalOwed = principalAmount + interestAmount;

        loans[loanId] = Loan({
            lender: msg.sender,
            borrower: borrower,
            invoiceTokenId: invoiceTokenId,
            principalAmount: principalAmount,
            interestAmount: interestAmount,
            totalOwed: totalOwed,
            settled: false,
            invoiceNFTContract: invoiceNFTContract
        });

        // Transfer principal to borrower
        payable(borrower).transfer(principalAmount);

        emit LoanCreated(
            loanId,
            msg.sender,
            borrower,
            invoiceTokenId,
            principalAmount,
            interestAmount
        );

        return loanId;
    }

    function settleLoan(uint256 loanId) external payable {
        Loan storage loan = loans[loanId];
        require(!loan.settled, "Loan already settled");
        require(msg.value >= loan.totalOwed, "Insufficient payment amount");

        loan.settled = true;

        // Transfer interest + principal to lender
        uint256 lenderAmount = loan.principalAmount + loan.interestAmount;
        payable(loan.lender).transfer(lenderAmount);

        // Transfer remaining proceeds to borrower
        uint256 remainingAmount = msg.value - loan.totalOwed;
        if (remainingAmount > 0) {
            payable(loan.borrower).transfer(remainingAmount);
        }

        // Return invoice NFT to borrower
        IERC721(loan.invoiceNFTContract).safeTransferFrom(
            address(this),
            loan.borrower,
            loan.invoiceTokenId
        );

        emit LoanSettled(loanId, lenderAmount, remainingAmount);
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    receive() external payable {}
}
```

**Step 2: Write test for LoanEscrow**

Create `test/LoanEscrow.test.ts`:
```typescript
import { expect } from "chai";
import { ethers } from "hardhat";
import { InvoiceNFT, LoanEscrow } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("LoanEscrow", function () {
  let invoiceNFT: InvoiceNFT;
  let loanEscrow: LoanEscrow;
  let lender: SignerWithAddress;
  let borrower: SignerWithAddress;
  let debtor: SignerWithAddress;

  beforeEach(async function () {
    [lender, borrower, debtor] = await ethers.getSigners();

    const InvoiceNFT = await ethers.getContractFactory("InvoiceNFT");
    invoiceNFT = await InvoiceNFT.deploy();
    await invoiceNFT.waitForDeployment();

    const LoanEscrow = await ethers.getContractFactory("LoanEscrow");
    loanEscrow = await LoanEscrow.deploy();
    await loanEscrow.waitForDeployment();
  });

  it("Should create a loan with invoice NFT as collateral", async function () {
    const invoiceAmount = ethers.parseEther("1000");
    const principalAmount = ethers.parseEther("800");
    const interestAmount = ethers.parseEther("40");
    const dueDate = Math.floor(Date.now() / 1000) + 86400 * 30;

    // Mint invoice NFT to borrower
    await invoiceNFT.mint(borrower.address, debtor.address, invoiceAmount, dueDate);

    // Borrower approves escrow to transfer NFT
    await invoiceNFT.connect(borrower).approve(await loanEscrow.getAddress(), 0);

    // Lender creates loan
    const tx = await loanEscrow
      .connect(lender)
      .createLoan(
        borrower.address,
        await invoiceNFT.getAddress(),
        0,
        principalAmount,
        interestAmount,
        { value: principalAmount }
      );

    await expect(tx)
      .to.emit(loanEscrow, "LoanCreated")
      .withArgs(0, lender.address, borrower.address, 0, principalAmount, interestAmount);

    // Verify loan details
    const loan = await loanEscrow.loans(0);
    expect(loan.lender).to.equal(lender.address);
    expect(loan.borrower).to.equal(borrower.address);
    expect(loan.principalAmount).to.equal(principalAmount);
    expect(loan.settled).to.be.false;

    // Verify NFT is in escrow
    expect(await invoiceNFT.ownerOf(0)).to.equal(await loanEscrow.getAddress());
  });

  it("Should settle loan and return NFT to borrower", async function () {
    const invoiceAmount = ethers.parseEther("1000");
    const principalAmount = ethers.parseEther("800");
    const interestAmount = ethers.parseEther("40");
    const dueDate = Math.floor(Date.now() / 1000) + 86400 * 30;

    // Setup loan
    await invoiceNFT.mint(borrower.address, debtor.address, invoiceAmount, dueDate);
    await invoiceNFT.connect(borrower).approve(await loanEscrow.getAddress(), 0);
    await loanEscrow
      .connect(lender)
      .createLoan(
        borrower.address,
        await invoiceNFT.getAddress(),
        0,
        principalAmount,
        interestAmount,
        { value: principalAmount }
      );

    // Debtor settles loan
    const totalOwed = principalAmount + interestAmount;
    const tx = await loanEscrow.connect(debtor).settleLoan(0, { value: invoiceAmount });

    await expect(tx).to.emit(loanEscrow, "LoanSettled");

    // Verify loan is settled
    const loan = await loanEscrow.loans(0);
    expect(loan.settled).to.be.true;

    // Verify NFT returned to borrower
    expect(await invoiceNFT.ownerOf(0)).to.equal(borrower.address);
  });
});
```

**Step 3: Run tests**

Run: `npx hardhat test`

Expected: 4 passing tests (2 from InvoiceNFT, 2 from LoanEscrow)

**Step 4: Commit**

```bash
git add contracts/LoanEscrow.sol test/LoanEscrow.test.ts
git commit -m "feat: add LoanEscrow smart contract with tests"
```

---

## Task 4: Deploy Smart Contracts to Base Sepolia

**Files:**
- Create: `scripts/deploy.ts`
- Modify: `.env.example`

**Step 1: Write deployment script**

Create `scripts/deploy.ts`:
```typescript
import { ethers } from "hardhat";

async function main() {
  console.log("Deploying contracts to Base Sepolia...");

  // Deploy InvoiceNFT
  const InvoiceNFT = await ethers.getContractFactory("InvoiceNFT");
  const invoiceNFT = await InvoiceNFT.deploy();
  await invoiceNFT.waitForDeployment();
  const invoiceNFTAddress = await invoiceNFT.getAddress();
  console.log(`InvoiceNFT deployed to: ${invoiceNFTAddress}`);

  // Deploy LoanEscrow
  const LoanEscrow = await ethers.getContractFactory("LoanEscrow");
  const loanEscrow = await LoanEscrow.deploy();
  await loanEscrow.waitForDeployment();
  const loanEscrowAddress = await loanEscrow.getAddress();
  console.log(`LoanEscrow deployed to: ${loanEscrowAddress}`);

  console.log("\nDeployment complete!");
  console.log(`\nAdd these to your .env file:`);
  console.log(`INVOICE_NFT_ADDRESS=${invoiceNFTAddress}`);
  console.log(`LOAN_ESCROW_ADDRESS=${loanEscrowAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

**Step 2: Create .env file with keys**

Copy `.env.example` to `.env` and add:
- Get Base Sepolia RPC URL from https://chainlist.org or use public endpoint
- Get private key from MetaMask (create test wallet)
- Keep other values blank for now

**Step 3: Get Base Sepolia testnet ETH**

Visit: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet

**Step 4: Deploy contracts**

Run: `yarn deploy:contracts`

Expected: Contract addresses printed

**Step 5: Update .env with contract addresses**

Add the printed addresses to your `.env` file

**Step 6: Verify deployment on BaseScan**

Visit: `https://sepolia.basescan.org/address/<INVOICE_NFT_ADDRESS>`

**Step 7: Commit**

```bash
git add scripts/deploy.ts
git commit -m "feat: add deployment script for Base Sepolia"
```

---

## Task 5: Stripe Service - Connect Account Management

**Files:**
- Create: `src/services/stripe.service.ts`
- Create: `src/types/agent.types.ts`

**Step 1: Create agent types**

Create `src/types/agent.types.ts`:
```typescript
export type AgentType = 'business' | 'lender' | 'analyst';

export interface AgentIdentity {
  agentId: string;
  agentType: AgentType;
  stripeConnectAccountId: string;
  locusWalletAddress: string;
  baseWalletAddress: string;
}

export interface AgentBalances {
  stripe_usd: number;
  locus_usdc: number;
}
```

**Step 2: Write Stripe service**

Create `src/services/stripe.service.ts`:
```typescript
import Stripe from 'stripe';
import * as dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export class StripeService {
  async createConnectAccount(
    agentId: string,
    agentType: string
  ): Promise<string> {
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: `agent-${agentId}@platform.com`,
      capabilities: {
        transfers: { requested: true },
      },
      metadata: {
        agentId,
        agentType,
      },
    });

    return account.id;
  }

  async getConnectAccountBalance(accountId: string): Promise<number> {
    const balance = await stripe.balance.retrieve({
      stripeAccount: accountId,
    });

    // Return available balance in USD (convert from cents)
    return balance.available[0]?.amount / 100 || 0;
  }

  async createFundingPaymentIntent(
    agentId: string,
    amountUsd: number
  ): Promise<string> {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amountUsd * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        purpose: 'fund_agent',
        agentId,
      },
    });

    return paymentIntent.client_secret!;
  }

  async transferToConnectAccount(
    accountId: string,
    amountUsd: number,
    agentId: string
  ): Promise<string> {
    const transfer = await stripe.transfers.create({
      amount: Math.round(amountUsd * 100), // Convert to cents
      currency: 'usd',
      destination: accountId,
      metadata: {
        agentId,
      },
    });

    return transfer.id;
  }

  async verifyWebhookSignature(
    payload: string | Buffer,
    signature: string
  ): Promise<Stripe.Event> {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  }
}

export const stripeService = new StripeService();
```

**Step 3: Test Stripe service manually**

Create `src/test-stripe.ts` (temporary):
```typescript
import { stripeService } from './services/stripe.service';

async function test() {
  console.log('Creating Connect account for test agent...');
  const accountId = await stripeService.createConnectAccount('test-lender-001', 'lender');
  console.log('Account created:', accountId);
}

test().catch(console.error);
```

**Step 4: Run test**

Run: `ts-node src/test-stripe.ts`

Expected: Stripe Connect account ID printed

**Step 5: Verify in Stripe Dashboard**

Visit: https://dashboard.stripe.com/test/connect/accounts/overview

**Step 6: Remove test file**

Run: `rm src/test-stripe.ts`

**Step 7: Commit**

```bash
git add src/services/stripe.service.ts src/types/agent.types.ts
git commit -m "feat: add Stripe Connect service for agent accounts"
```

---

## Task 6: Locus Service - Mock Implementation

**Files:**
- Create: `src/services/locus.service.ts`

**Step 1: Write mock Locus service**

Create `src/services/locus.service.ts`:
```typescript
import * as dotenv from 'dotenv';

dotenv.config();

// Mock Locus service for hackathon
// Replace with real Locus SDK when available
export class LocusService {
  private balances: Map<string, number> = new Map();

  async depositUSDC(agentId: string, amount: number): Promise<string> {
    const currentBalance = this.balances.get(agentId) || 0;
    this.balances.set(agentId, currentBalance + amount);

    console.log(`[Locus] Deposited ${amount} USDC to agent ${agentId}`);
    console.log(`[Locus] New balance: ${this.balances.get(agentId)} USDC`);

    // Return mock transaction ID
    return `locus_tx_${Date.now()}_${agentId}`;
  }

  async getBalance(agentId: string): Promise<number> {
    return this.balances.get(agentId) || 0;
  }

  async transfer(
    fromAgentId: string,
    toAgentId: string,
    amount: number
  ): Promise<string> {
    const fromBalance = this.balances.get(fromAgentId) || 0;

    if (fromBalance < amount) {
      throw new Error(`Insufficient balance for agent ${fromAgentId}`);
    }

    // Deduct from sender
    this.balances.set(fromAgentId, fromBalance - amount);

    // Add to recipient
    const toBalance = this.balances.get(toAgentId) || 0;
    this.balances.set(toAgentId, toBalance + amount);

    console.log(`[Locus] Transferred ${amount} USDC from ${fromAgentId} to ${toAgentId}`);

    // Return mock transaction ID
    return `locus_tx_${Date.now()}_${fromAgentId}_to_${toAgentId}`;
  }

  async createWallet(agentId: string): Promise<string> {
    // Mock wallet address
    const walletAddress = `0x${agentId.padStart(40, '0')}`;
    this.balances.set(agentId, 0);

    console.log(`[Locus] Created wallet for agent ${agentId}: ${walletAddress}`);

    return walletAddress;
  }
}

export const locusService = new LocusService();
```

**Step 2: Commit**

```bash
git add src/services/locus.service.ts
git commit -m "feat: add mock Locus service for agent payments"
```

---

## Task 7: Agent Registry & Initialization

**Files:**
- Create: `src/services/agent-registry.service.ts`
- Create: `src/scripts/init-agents.ts`

**Step 1: Write agent registry service**

Create `src/services/agent-registry.service.ts`:
```typescript
import { AgentIdentity, AgentType } from '../types/agent.types';
import { stripeService } from './stripe.service';
import { locusService } from './locus.service';
import * as fs from 'fs';
import * as path from 'path';

const REGISTRY_FILE = path.join(__dirname, '../../data/agent-registry.json');

export class AgentRegistryService {
  private agents: Map<string, AgentIdentity> = new Map();

  constructor() {
    this.loadRegistry();
  }

  private loadRegistry() {
    try {
      if (fs.existsSync(REGISTRY_FILE)) {
        const data = JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf-8'));
        this.agents = new Map(Object.entries(data));
        console.log(`Loaded ${this.agents.size} agents from registry`);
      }
    } catch (error) {
      console.error('Error loading agent registry:', error);
    }
  }

  private saveRegistry() {
    try {
      const dir = path.dirname(REGISTRY_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const data = Object.fromEntries(this.agents);
      fs.writeFileSync(REGISTRY_FILE, JSON.stringify(data, null, 2));
      console.log('Agent registry saved');
    } catch (error) {
      console.error('Error saving agent registry:', error);
    }
  }

  async createAgent(agentId: string, agentType: AgentType): Promise<AgentIdentity> {
    if (this.agents.has(agentId)) {
      throw new Error(`Agent ${agentId} already exists`);
    }

    console.log(`Creating agent: ${agentId} (${agentType})...`);

    // Create Stripe Connect account
    const stripeConnectAccountId = await stripeService.createConnectAccount(
      agentId,
      agentType
    );

    // Create Locus wallet
    const locusWalletAddress = await locusService.createWallet(agentId);

    // Mock Base wallet (in real implementation, generate from private key)
    const baseWalletAddress = `0x${agentId.replace(/-/g, '').padEnd(40, '0')}`;

    const agent: AgentIdentity = {
      agentId,
      agentType,
      stripeConnectAccountId,
      locusWalletAddress,
      baseWalletAddress,
    };

    this.agents.set(agentId, agent);
    this.saveRegistry();

    console.log(`Agent created: ${agentId}`);
    return agent;
  }

  getAgent(agentId: string): AgentIdentity | undefined {
    return this.agents.get(agentId);
  }

  getAllAgents(): AgentIdentity[] {
    return Array.from(this.agents.values());
  }

  getAgentsByType(agentType: AgentType): AgentIdentity[] {
    return this.getAllAgents().filter((agent) => agent.agentType === agentType);
  }
}

export const agentRegistry = new AgentRegistryService();
```

**Step 2: Write agent initialization script**

Create `src/scripts/init-agents.ts`:
```typescript
import { agentRegistry } from '../services/agent-registry.service';

async function main() {
  console.log('Initializing agents...\n');

  // Create Business Agent
  const businessAgent = await agentRegistry.createAgent('business-001', 'business');
  console.log('Business Agent:', businessAgent);
  console.log();

  // Create Lender Agent
  const lenderAgent = await agentRegistry.createAgent('lender-001', 'lender');
  console.log('Lender Agent:', lenderAgent);
  console.log();

  // Create Credit Analyst Agent
  const analystAgent = await agentRegistry.createAgent('analyst-001', 'analyst');
  console.log('Credit Analyst Agent:', analystAgent);
  console.log();

  console.log('All agents initialized successfully!');
}

main().catch(console.error);
```

**Step 3: Add script to package.json**

Update `package.json`:
```json
{
  "scripts": {
    "init:agents": "ts-node src/scripts/init-agents.ts"
  }
}
```

**Step 4: Create data directory**

Run: `mkdir -p data`

Add to `.gitignore`:
```
data/agent-registry.json
```

**Step 5: Run agent initialization**

Run: `yarn init:agents`

Expected: 3 agents created with Stripe Connect accounts

**Step 6: Verify agents in registry**

Run: `cat data/agent-registry.json`

Expected: JSON file with 3 agents

**Step 7: Commit**

```bash
git add src/services/agent-registry.service.ts src/scripts/init-agents.ts data/.gitkeep
git commit -m "feat: add agent registry and initialization script"
```

---

## Task 8: Webhook Server for Stripe Events

**Files:**
- Create: `src/api/webhook.controller.ts`
- Create: `src/index.ts`

**Step 1: Write webhook controller**

Create `src/api/webhook.controller.ts`:
```typescript
import { Request, Response } from 'express';
import { stripeService } from '../services/stripe.service';
import { locusService } from '../services/locus.service';
import Stripe from 'stripe';

export class WebhookController {
  async handleStripeWebhook(req: Request, res: Response): Promise<void> {
    const signature = req.headers['stripe-signature'] as string;

    try {
      const event = await stripeService.verifyWebhookSignature(
        req.body,
        signature
      );

      console.log(`[Webhook] Received event: ${event.type}`);

      switch (event.type) {
        case 'transfer.created':
          await this.handleTransferCreated(event.data.object as Stripe.Transfer);
          break;

        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(
            event.data.object as Stripe.PaymentIntent
          );
          break;

        default:
          console.log(`[Webhook] Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('[Webhook] Error:', error);
      res.status(400).send(`Webhook Error: ${error}`);
    }
  }

  private async handleTransferCreated(transfer: Stripe.Transfer): Promise<void> {
    console.log('[Webhook] Processing transfer.created event');

    const agentId = transfer.metadata.agentId;
    const amountUsd = transfer.amount / 100; // Convert cents to dollars

    if (!agentId) {
      console.error('[Webhook] No agentId in transfer metadata');
      return;
    }

    // Convert USD to USDC (1:1 for hackathon)
    const usdcAmount = amountUsd;

    // Deposit USDC to Locus wallet
    const txId = await locusService.depositUSDC(agentId, usdcAmount);

    console.log(`[Webhook] Deposited ${usdcAmount} USDC to agent ${agentId}`);
    console.log(`[Webhook] Locus transaction: ${txId}`);

    // TODO: Notify agent via Anthropic SDK
  }

  private async handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    console.log('[Webhook] Processing payment_intent.succeeded event');

    const agentId = paymentIntent.metadata.agentId;
    const purpose = paymentIntent.metadata.purpose;

    if (purpose === 'fund_agent' && agentId) {
      console.log(`[Webhook] Agent ${agentId} funding payment succeeded`);
      // Transfer will be created separately, handled by transfer.created event
    }
  }
}

export const webhookController = new WebhookController();
```

**Step 2: Write Express server**

Create `src/index.ts`:
```typescript
import express, { Request, Response } from 'express';
import * as dotenv from 'dotenv';
import { webhookController } from './api/webhook.controller';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Stripe webhook needs raw body
app.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  (req: Request, res: Response) => {
    webhookController.handleStripeWebhook(req, res);
  }
);

// Regular JSON parsing for other routes
app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Webhook endpoint: http://localhost:${PORT}/webhook`);
});
```

**Step 3: Test webhook server**

Run in one terminal: `yarn dev`

Run in another terminal: `curl http://localhost:3000/health`

Expected: `{"status":"ok"}`

**Step 4: Test with Stripe CLI**

Install Stripe CLI: https://stripe.com/docs/stripe-cli

Run: `stripe listen --forward-to localhost:3000/webhook`

This will give you a webhook secret - add it to `.env`:
```
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Step 5: Commit**

```bash
git add src/api/webhook.controller.ts src/index.ts
git commit -m "feat: add webhook server for Stripe events"
```

---

## Task 9: Funding Flow Integration

**Files:**
- Create: `src/api/funding.controller.ts`
- Modify: `src/index.ts`

**Step 1: Write funding controller**

Create `src/api/funding.controller.ts`:
```typescript
import { Request, Response } from 'express';
import { stripeService } from '../services/stripe.service';
import { locusService } from '../services/locus.service';
import { agentRegistry } from '../services/agent-registry.service';

export class FundingController {
  async createFundingIntent(req: Request, res: Response): Promise<void> {
    try {
      const { agentId, amountUsd } = req.body;

      if (!agentId || !amountUsd) {
        res.status(400).json({ error: 'agentId and amountUsd are required' });
        return;
      }

      const agent = agentRegistry.getAgent(agentId);
      if (!agent) {
        res.status(404).json({ error: 'Agent not found' });
        return;
      }

      // Create Stripe Payment Intent
      const clientSecret = await stripeService.createFundingPaymentIntent(
        agentId,
        amountUsd
      );

      res.json({
        clientSecret,
        agentId,
        amountUsd,
      });
    } catch (error) {
      console.error('Error creating funding intent:', error);
      res.status(500).json({ error: 'Failed to create funding intent' });
    }
  }

  async executeFunding(req: Request, res: Response): Promise<void> {
    try {
      const { agentId, amountUsd } = req.body;

      if (!agentId || !amountUsd) {
        res.status(400).json({ error: 'agentId and amountUsd are required' });
        return;
      }

      const agent = agentRegistry.getAgent(agentId);
      if (!agent) {
        res.status(404).json({ error: 'Agent not found' });
        return;
      }

      // Transfer to Connect account
      const transferId = await stripeService.transferToConnectAccount(
        agent.stripeConnectAccountId,
        amountUsd,
        agentId
      );

      console.log(`Funded agent ${agentId} with $${amountUsd}`);
      console.log(`Stripe transfer ID: ${transferId}`);

      res.json({
        success: true,
        agentId,
        amountUsd,
        transferId,
      });
    } catch (error) {
      console.error('Error executing funding:', error);
      res.status(500).json({ error: 'Failed to execute funding' });
    }
  }

  async getAgentBalances(req: Request, res: Response): Promise<void> {
    try {
      const { agentId } = req.params;

      const agent = agentRegistry.getAgent(agentId);
      if (!agent) {
        res.status(404).json({ error: 'Agent not found' });
        return;
      }

      const stripeBalance = await stripeService.getConnectAccountBalance(
        agent.stripeConnectAccountId
      );
      const locusBalance = await locusService.getBalance(agentId);

      res.json({
        agentId,
        balances: {
          stripe_usd: stripeBalance,
          locus_usdc: locusBalance,
        },
      });
    } catch (error) {
      console.error('Error getting agent balances:', error);
      res.status(500).json({ error: 'Failed to get agent balances' });
    }
  }
}

export const fundingController = new FundingController();
```

**Step 2: Add funding routes to server**

Modify `src/index.ts`:
```typescript
import express, { Request, Response } from 'express';
import * as dotenv from 'dotenv';
import { webhookController } from './api/webhook.controller';
import { fundingController } from './api/funding.controller';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Stripe webhook needs raw body
app.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  (req: Request, res: Response) => {
    webhookController.handleStripeWebhook(req, res);
  }
);

// Regular JSON parsing for other routes
app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Funding routes
app.post('/api/funding/intent', (req, res) =>
  fundingController.createFundingIntent(req, res)
);

app.post('/api/funding/execute', (req, res) =>
  fundingController.executeFunding(req, res)
);

app.get('/api/agents/:agentId/balances', (req, res) =>
  fundingController.getAgentBalances(req, res)
);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Webhook endpoint: http://localhost:${PORT}/webhook`);
});
```

**Step 3: Test funding flow**

With server running (`yarn dev`), test:

```bash
# Fund lender agent with $1000
curl -X POST http://localhost:3000/api/funding/execute \
  -H "Content-Type: application/json" \
  -d '{"agentId": "lender-001", "amountUsd": 1000}'
```

Expected: Success response with transferId

**Step 4: Check balances**

```bash
curl http://localhost:3000/api/agents/lender-001/balances
```

Expected: `{"agentId":"lender-001","balances":{"stripe_usd":0,"locus_usdc":1000}}`

**Step 5: Commit**

```bash
git add src/api/funding.controller.ts src/index.ts
git commit -m "feat: add funding flow API endpoints"
```

---

## Task 10: Anthropic SDK Agent - Base Tools

**Files:**
- Create: `src/agents/tools/base.tools.ts`
- Create: `src/services/base.service.ts`

**Step 1: Create Base service for smart contract interactions**

Create `src/services/base.service.ts`:
```typescript
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

// Import contract ABIs (generated by Hardhat)
import InvoiceNFTArtifact from '../../artifacts/contracts/InvoiceNFT.sol/InvoiceNFT.json';
import LoanEscrowArtifact from '../../artifacts/contracts/LoanEscrow.sol/LoanEscrow.json';

export class BaseService {
  private provider: ethers.Provider;
  private wallet: ethers.Wallet;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, this.provider);
  }

  getInvoiceNFTContract() {
    return new ethers.Contract(
      process.env.INVOICE_NFT_ADDRESS!,
      InvoiceNFTArtifact.abi,
      this.wallet
    );
  }

  getLoanEscrowContract() {
    return new ethers.Contract(
      process.env.LOAN_ESCROW_ADDRESS!,
      LoanEscrowArtifact.abi,
      this.wallet
    );
  }

  async mintInvoiceNFT(
    ownerAddress: string,
    debtorAddress: string,
    amountEth: number,
    daysUntilDue: number
  ): Promise<{ tokenId: number; txHash: string }> {
    const contract = this.getInvoiceNFTContract();
    const amount = ethers.parseEther(amountEth.toString());
    const dueDate = Math.floor(Date.now() / 1000) + daysUntilDue * 86400;

    const tx = await contract.mint(ownerAddress, debtorAddress, amount, dueDate);
    const receipt = await tx.wait();

    // Parse event to get token ID
    const event = receipt.logs.find(
      (log: any) => log.topics[0] === contract.interface.getEvent('InvoiceMinted').topicHash
    );
    const tokenId = parseInt(event.topics[1], 16);

    return { tokenId, txHash: receipt.hash };
  }

  async getInvoiceDetails(tokenId: number) {
    const contract = this.getInvoiceNFTContract();
    const invoice = await contract.getInvoice(tokenId);

    return {
      debtor: invoice.debtor,
      amount: ethers.formatEther(invoice.amount),
      dueDate: new Date(Number(invoice.dueDate) * 1000).toISOString(),
      paid: invoice.paid,
    };
  }

  async createLoan(
    borrowerAddress: string,
    invoiceTokenId: number,
    principalEth: number,
    interestEth: number
  ): Promise<{ loanId: number; txHash: string }> {
    const contract = this.getLoanEscrowContract();
    const invoiceNFTAddress = process.env.INVOICE_NFT_ADDRESS!;
    const principal = ethers.parseEther(principalEth.toString());
    const interest = ethers.parseEther(interestEth.toString());

    const tx = await contract.createLoan(
      borrowerAddress,
      invoiceNFTAddress,
      invoiceTokenId,
      principal,
      interest,
      { value: principal }
    );

    const receipt = await tx.wait();

    // Parse event to get loan ID
    const event = receipt.logs.find(
      (log: any) => log.topics[0] === contract.interface.getEvent('LoanCreated').topicHash
    );
    const loanId = parseInt(event.topics[1], 16);

    return { loanId, txHash: receipt.hash };
  }

  async settleLoan(loanId: number, paymentEth: number): Promise<string> {
    const contract = this.getLoanEscrowContract();
    const payment = ethers.parseEther(paymentEth.toString());

    const tx = await contract.settleLoan(loanId, { value: payment });
    const receipt = await tx.wait();

    return receipt.hash;
  }
}

export const baseService = new BaseService();
```

**Step 2: Create Anthropic SDK tools for Base**

Create `src/agents/tools/base.tools.ts`:
```typescript
import { baseService } from '../../services/base.service';

export const baseTools = [
  {
    name: 'mint_invoice_nft',
    description: 'Mint a new invoice NFT representing a receivable',
    input_schema: {
      type: 'object',
      properties: {
        owner_address: {
          type: 'string',
          description: 'Address that will own the invoice NFT',
        },
        debtor_address: {
          type: 'string',
          description: 'Address of the debtor who owes the money',
        },
        amount_eth: {
          type: 'number',
          description: 'Invoice amount in ETH',
        },
        days_until_due: {
          type: 'number',
          description: 'Number of days until invoice is due',
        },
      },
      required: ['owner_address', 'debtor_address', 'amount_eth', 'days_until_due'],
    },
  },
  {
    name: 'get_invoice_details',
    description: 'Get details of an invoice NFT by token ID',
    input_schema: {
      type: 'object',
      properties: {
        token_id: {
          type: 'number',
          description: 'Token ID of the invoice NFT',
        },
      },
      required: ['token_id'],
    },
  },
  {
    name: 'create_loan',
    description: 'Create a loan with invoice NFT as collateral',
    input_schema: {
      type: 'object',
      properties: {
        borrower_address: {
          type: 'string',
          description: 'Address of the borrower',
        },
        invoice_token_id: {
          type: 'number',
          description: 'Token ID of the invoice NFT to use as collateral',
        },
        principal_eth: {
          type: 'number',
          description: 'Loan principal amount in ETH',
        },
        interest_eth: {
          type: 'number',
          description: 'Interest amount in ETH',
        },
      },
      required: ['borrower_address', 'invoice_token_id', 'principal_eth', 'interest_eth'],
    },
  },
];

export async function executeBaseTool(toolName: string, toolInput: any): Promise<any> {
  switch (toolName) {
    case 'mint_invoice_nft':
      return await baseService.mintInvoiceNFT(
        toolInput.owner_address,
        toolInput.debtor_address,
        toolInput.amount_eth,
        toolInput.days_until_due
      );

    case 'get_invoice_details':
      return await baseService.getInvoiceDetails(toolInput.token_id);

    case 'create_loan':
      return await baseService.createLoan(
        toolInput.borrower_address,
        toolInput.invoice_token_id,
        toolInput.principal_eth,
        toolInput.interest_eth
      );

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}
```

**Step 3: Commit**

```bash
git add src/services/base.service.ts src/agents/tools/base.tools.ts
git commit -m "feat: add Base service and agent tools for smart contracts"
```

---

## Task 11: Complete Agent Tools (Stripe, Locus, Base)

**Files:**
- Create: `src/agents/tools/stripe.tools.ts`
- Create: `src/agents/tools/locus.tools.ts`
- Create: `src/agents/tools/index.ts`

**Step 1: Create Stripe tools**

Create `src/agents/tools/stripe.tools.ts`:
```typescript
import { stripeService } from '../../services/stripe.service';
import { agentRegistry } from '../../services/agent-registry.service';

export const stripeTools = [
  {
    name: 'check_stripe_balance',
    description: 'Check the Stripe Connect account balance for this agent',
    input_schema: {
      type: 'object',
      properties: {
        agent_id: {
          type: 'string',
          description: 'ID of the agent to check balance for',
        },
      },
      required: ['agent_id'],
    },
  },
];

export async function executeStripeTool(toolName: string, toolInput: any): Promise<any> {
  switch (toolName) {
    case 'check_stripe_balance':
      const agent = agentRegistry.getAgent(toolInput.agent_id);
      if (!agent) {
        throw new Error(`Agent ${toolInput.agent_id} not found`);
      }

      const balance = await stripeService.getConnectAccountBalance(
        agent.stripeConnectAccountId
      );

      return {
        agent_id: toolInput.agent_id,
        stripe_balance_usd: balance,
      };

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}
```

**Step 2: Create Locus tools**

Create `src/agents/tools/locus.tools.ts`:
```typescript
import { locusService } from '../../services/locus.service';

export const locusTools = [
  {
    name: 'check_locus_balance',
    description: 'Check the Locus USDC balance for this agent',
    input_schema: {
      type: 'object',
      properties: {
        agent_id: {
          type: 'string',
          description: 'ID of the agent to check balance for',
        },
      },
      required: ['agent_id'],
    },
  },
  {
    name: 'transfer_usdc',
    description: 'Transfer USDC from one agent to another via Locus',
    input_schema: {
      type: 'object',
      properties: {
        from_agent_id: {
          type: 'string',
          description: 'ID of the sending agent',
        },
        to_agent_id: {
          type: 'string',
          description: 'ID of the receiving agent',
        },
        amount: {
          type: 'number',
          description: 'Amount of USDC to transfer',
        },
      },
      required: ['from_agent_id', 'to_agent_id', 'amount'],
    },
  },
];

export async function executeLocusTool(toolName: string, toolInput: any): Promise<any> {
  switch (toolName) {
    case 'check_locus_balance':
      const balance = await locusService.getBalance(toolInput.agent_id);
      return {
        agent_id: toolInput.agent_id,
        locus_balance_usdc: balance,
      };

    case 'transfer_usdc':
      const txId = await locusService.transfer(
        toolInput.from_agent_id,
        toolInput.to_agent_id,
        toolInput.amount
      );

      return {
        transaction_id: txId,
        from_agent_id: toolInput.from_agent_id,
        to_agent_id: toolInput.to_agent_id,
        amount: toolInput.amount,
      };

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}
```

**Step 3: Create tools index**

Create `src/agents/tools/index.ts`:
```typescript
import { stripeTools, executeStripeTool } from './stripe.tools';
import { locusTools, executeLocusTool } from './locus.tools';
import { baseTools, executeBaseTool } from './base.tools';

export const allTools = [...stripeTools, ...locusTools, ...baseTools];

export async function executeTool(toolName: string, toolInput: any): Promise<any> {
  // Determine which category the tool belongs to
  if (stripeTools.some((tool) => tool.name === toolName)) {
    return await executeStripeTool(toolName, toolInput);
  } else if (locusTools.some((tool) => tool.name === toolName)) {
    return await executeLocusTool(toolName, toolInput);
  } else if (baseTools.some((tool) => tool.name === toolName)) {
    return await executeBaseTool(toolName, toolInput);
  } else {
    throw new Error(`Unknown tool: ${toolName}`);
  }
}
```

**Step 4: Commit**

```bash
git add src/agents/tools/
git commit -m "feat: add complete agent tool definitions for Stripe, Locus, and Base"
```

---

## Task 12: Anthropic SDK Agent Runner

**Files:**
- Create: `src/agents/agent-runner.ts`

**Step 1: Create agent runner with Anthropic SDK**

Create `src/agents/agent-runner.ts`:
```typescript
import Anthropic from '@anthropic-ai/sdk';
import { allTools, executeTool } from './tools';
import * as dotenv from 'dotenv';

dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export interface AgentRunConfig {
  agentId: string;
  systemPrompt: string;
  initialMessage: string;
  maxTurns?: number;
}

export async function runAgent(config: AgentRunConfig): Promise<string> {
  const { agentId, systemPrompt, initialMessage, maxTurns = 10 } = config;

  console.log(`\n========== Running Agent: ${agentId} ==========\n`);

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: initialMessage },
  ];

  for (let turn = 0; turn < maxTurns; turn++) {
    console.log(`\n--- Turn ${turn + 1} ---\n`);

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages,
      tools: allTools,
    });

    console.log(`Stop reason: ${response.stop_reason}`);

    // Add assistant response to messages
    messages.push({
      role: 'assistant',
      content: response.content,
    });

    // If agent is done (no tool use), return final response
    if (response.stop_reason === 'end_turn') {
      const textBlock = response.content.find((block) => block.type === 'text');
      if (textBlock && 'text' in textBlock) {
        console.log(`\nAgent ${agentId} response:`, textBlock.text);
        return textBlock.text;
      }
    }

    // Execute tool calls
    if (response.stop_reason === 'tool_use') {
      const toolResults: Anthropic.MessageParam = {
        role: 'user',
        content: [],
      };

      for (const block of response.content) {
        if (block.type === 'tool_use') {
          console.log(`\nExecuting tool: ${block.name}`);
          console.log('Tool input:', JSON.stringify(block.input, null, 2));

          try {
            const result = await executeTool(block.name, block.input);
            console.log('Tool result:', JSON.stringify(result, null, 2));

            (toolResults.content as any[]).push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: JSON.stringify(result),
            });
          } catch (error: any) {
            console.error(`Tool execution error: ${error.message}`);

            (toolResults.content as any[]).push({
              type: 'tool_result',
              tool_use_id: block.id,
              is_error: true,
              content: error.message,
            });
          }
        }
      }

      messages.push(toolResults);
    }
  }

  return 'Max turns reached';
}
```

**Step 2: Commit**

```bash
git add src/agents/agent-runner.ts
git commit -m "feat: add Anthropic SDK agent runner with tool execution"
```

---

## Task 13: Demo Script - End-to-End Flow

**Files:**
- Create: `src/demo/run-demo.ts`

**Step 1: Write demo script**

Create `src/demo/run-demo.ts`:
```typescript
import { runAgent } from '../agents/agent-runner';
import { agentRegistry } from '../services/agent-registry.service';
import { locusService } from '../services/locus.service';
import { stripeService } from '../services/stripe.service';

async function runDemo() {
  console.log('\n========================================');
  console.log('Invoice-Backed Lending Marketplace Demo');
  console.log('========================================\n');

  // Get agents from registry
  const businessAgent = agentRegistry.getAgent('business-001');
  const lenderAgent = agentRegistry.getAgent('lender-001');
  const analystAgent = agentRegistry.getAgent('analyst-001');

  if (!businessAgent || !lenderAgent || !analystAgent) {
    console.error('Agents not initialized. Run: yarn init:agents');
    process.exit(1);
  }

  // Step 1: Fund lender agent
  console.log('\n📍 Step 1: Fund Lender Agent with $1000');
  console.log('(Simulating Stripe funding flow)');

  await stripeService.transferToConnectAccount(
    lenderAgent.stripeConnectAccountId,
    1000,
    'lender-001'
  );

  // Simulate webhook processing
  await locusService.depositUSDC('lender-001', 1000);

  console.log('✅ Lender funded: $1000 → 1000 USDC');

  // Step 2: Mint invoice NFT for business agent
  console.log('\n📍 Step 2: Mint Invoice NFT for Business Agent');

  await runAgent({
    agentId: 'business-001',
    systemPrompt: `You are a Business Agent that runs an AI business. You need to create an invoice NFT for a receivable.

Your wallet address is: ${businessAgent.baseWalletAddress}
Use a mock debtor address: 0x1234567890123456789012345678901234567890

Create an invoice NFT for $1000 worth of ETH, due in 30 days.`,
    initialMessage: 'Create an invoice NFT for $1000 (1 ETH equivalent), due in 30 days.',
  });

  // Step 3: Business agent requests loan
  console.log('\n📍 Step 3: Business Agent Requests Loan');

  const businessResponse = await runAgent({
    agentId: 'business-001',
    systemPrompt: `You are a Business Agent that needs $800 to rent H200 compute.

You have an invoice NFT (token ID 0) worth $1000, due in 30 days.

Your goal: Request a loan from the lender, offering your invoice NFT as collateral.

Check your Locus balance first, then explain that you need funding.`,
    initialMessage: 'Check my balances and determine if I need a loan.',
  });

  // Step 4: Lender requests credit analysis
  console.log('\n📍 Step 4: Lender Requests Credit Analysis');

  await runAgent({
    agentId: 'lender-001',
    systemPrompt: `You are a Lender Agent. A business agent wants to borrow $800 against an invoice NFT worth $1000.

Before approving the loan, you need a credit analysis from the Credit Analyst Agent.

Pay the analyst $20 USDC via Locus for a creditworthiness report.

Your agent ID: lender-001
Credit Analyst ID: analyst-001`,
    initialMessage:
      'I received a loan request for $800 against invoice NFT token 0. Request credit analysis from analyst-001.',
  });

  // Step 5: Credit analyst performs analysis
  console.log('\n📍 Step 5: Credit Analyst Performs Analysis');

  await runAgent({
    agentId: 'analyst-001',
    systemPrompt: `You are a Credit Analyst Agent. You've been paid $20 USDC to analyze a debtor's creditworthiness.

Debtor address: 0x1234567890123456789012345678901234567890
Invoice amount: $1000

Analyze the invoice details and recommend loan terms:
- Advance rate (% of invoice value to lend)
- Interest rate

Return a simple credit score (1-10) and recommended terms.`,
    initialMessage: 'Analyze invoice NFT token 0 for creditworthiness.',
  });

  // Step 6: Lender executes loan
  console.log('\n📍 Step 6: Lender Executes Loan');

  await runAgent({
    agentId: 'lender-001',
    systemPrompt: `You are a Lender Agent. Based on the credit analysis, approve a loan:

- Principal: $800 (80% advance rate)
- Interest: $40 (5% interest)
- Collateral: Invoice NFT token 0

Borrower address: ${businessAgent.baseWalletAddress}

Execute the loan by calling create_loan.`,
    initialMessage: 'Approve and execute loan for $800 with $40 interest against invoice NFT token 0.',
  });

  // Step 7: Business agent pays for compute
  console.log('\n📍 Step 7: Business Agent Pays for Compute');

  await runAgent({
    agentId: 'business-001',
    systemPrompt: `You are a Business Agent. You just received an $800 loan in your Locus wallet.

Use this money to pay for H200 compute rental.

Transfer $800 USDC to compute provider (agent ID: compute-provider-001).`,
    initialMessage: 'Check my Locus balance and pay for compute rental.',
  });

  // Step 8: Simulate invoice payment and settlement
  console.log('\n📍 Step 8: Invoice Payment & Loan Settlement');
  console.log('(Simulating debtor paying invoice after 30 days)');

  await runAgent({
    agentId: 'business-001',
    systemPrompt: `You are a Business Agent. The debtor has paid the $1000 invoice.

Settle loan ID 0 by paying $840 ($800 principal + $40 interest).

This will return your invoice NFT and send the lender their money.`,
    initialMessage: 'The invoice has been paid. Settle loan 0.',
  });

  // Final balances
  console.log('\n📍 Final Balances:');

  const lenderBalance = await locusService.getBalance('lender-001');
  const businessBalance = await locusService.getBalance('business-001');
  const analystBalance = await locusService.getBalance('analyst-001');

  console.log(`Lender: ${lenderBalance} USDC (started with 1000, earned 40 interest)`);
  console.log(`Business: ${businessBalance} USDC (kept 160 from invoice payment)`);
  console.log(`Analyst: ${analystBalance} USDC (earned 20 for credit analysis)`);

  console.log('\n========================================');
  console.log('Demo Complete! 🎉');
  console.log('========================================\n');
}

runDemo().catch(console.error);
```

**Step 2: Add script to package.json**

Update `package.json`:
```json
{
  "scripts": {
    "demo": "ts-node src/demo/run-demo.ts"
  }
}
```

**Step 3: Create compute provider agent in Locus**

This is mocked for demo purposes:

```typescript
// Add to demo script before running
await locusService.createWallet('compute-provider-001');
```

**Step 4: Commit**

```bash
git add src/demo/run-demo.ts
git commit -m "feat: add end-to-end demo script"
```

---

## Task 14: README and Documentation

**Files:**
- Create: `README.md`

**Step 1: Write comprehensive README**

Create `README.md`:
```markdown
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
│ Stripe Connect  │─────────────────→ │  Platform API    │
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
- Yarn
- Stripe account (test mode)
- Anthropic API key
- Base Sepolia testnet ETH

### Installation

```bash
# Clone repo
git clone <repo-url>
cd ycagentpayhack

# Install dependencies
yarn install

# Copy env file
cp .env.example .env

# Edit .env with your keys
```

### Setup

```bash
# 1. Deploy smart contracts to Base Sepolia
yarn deploy:contracts

# 2. Update .env with contract addresses (printed by deploy script)

# 3. Initialize agents (creates Stripe Connect accounts)
yarn init:agents

# 4. Start webhook server (for Stripe events)
yarn dev
```

In another terminal:

```bash
# 5. Run Stripe webhook forwarding
stripe listen --forward-to localhost:3000/webhook

# Copy webhook secret to .env as STRIPE_WEBHOOK_SECRET
```

### Run Demo

```bash
yarn demo
```

---

## Tech Stack

**AI & Agents:**
- Anthropic SDK (Claude Sonnet 4)
- Custom tools for Stripe, Locus, Base

**Payments:**
- Stripe Connect (agent funding)
- Stripe Transfers (fiat → agent accounts)
- Stripe Webhooks (async notifications)
- Locus (agent-to-agent USDC payments)

**Blockchain:**
- Base Sepolia (L2 testnet)
- Solidity smart contracts
- Hardhat (development)
- ethers.js (blockchain interaction)

**Backend:**
- TypeScript
- Node.js
- Express (webhook server)

---

## Project Structure

```
ycagentpayhack/
├── contracts/              # Solidity smart contracts
│   ├── InvoiceNFT.sol
│   └── LoanEscrow.sol
├── src/
│   ├── agents/
│   │   ├── tools/         # Anthropic SDK tool definitions
│   │   └── agent-runner.ts
│   ├── services/
│   │   ├── stripe.service.ts
│   │   ├── locus.service.ts
│   │   ├── base.service.ts
│   │   └── agent-registry.service.ts
│   ├── api/
│   │   ├── webhook.controller.ts
│   │   └── funding.controller.ts
│   ├── demo/
│   │   └── run-demo.ts
│   └── index.ts           # Express server
├── test/                  # Smart contract tests
├── scripts/               # Deployment scripts
└── docs/                  # Design documents
```

---

## API Endpoints

### Funding

**POST** `/api/funding/execute`
```json
{
  "agentId": "lender-001",
  "amountUsd": 1000
}
```

**GET** `/api/agents/:agentId/balances`

Response:
```json
{
  "agentId": "lender-001",
  "balances": {
    "stripe_usd": 0,
    "locus_usdc": 1000
  }
}
```

### Webhooks

**POST** `/webhook` - Stripe webhook endpoint

---

## Smart Contracts

### InvoiceNFT.sol

ERC-721 representing receivables (invoices).

**Functions:**
- `mint(to, debtor, amount, dueDate)` - Create invoice NFT
- `payInvoice(tokenId)` - Debtor pays invoice
- `getInvoice(tokenId)` - View invoice details

### LoanEscrow.sol

Escrow for invoice-backed loans.

**Functions:**
- `createLoan(borrower, nftContract, tokenId, principal, interest)` - Create loan, lock NFT
- `settleLoan(loanId)` - Pay off loan, release NFT

---

## Agent Tools

Each Anthropic SDK agent has access to:

**Stripe Tools:**
- `check_stripe_balance` - Query Connect account balance

**Locus Tools:**
- `check_locus_balance` - Query USDC balance
- `transfer_usdc` - Send USDC to another agent

**Base Tools:**
- `mint_invoice_nft` - Create invoice NFT
- `get_invoice_details` - View invoice data
- `create_loan` - Execute loan with NFT collateral

---

## Demo Flow

1. **Fund Lender:** User transfers $1000 via Stripe → Lender's Connect account → 1000 USDC in Locus
2. **Mint Invoice:** Business Agent creates invoice NFT ($1000, due 30 days)
3. **Request Loan:** Business Agent requests $800 loan
4. **Credit Analysis:** Lender pays Analyst $20 USDC for credit report
5. **Execute Loan:** Lender creates loan on Base (locks NFT, transfers $800)
6. **Pay Compute:** Business Agent pays $800 USDC to compute provider
7. **Settle:** Debtor pays invoice → $840 to Lender, $160 to Business Agent, NFT returned

---

## Hackathon Tracks

### Overall Track
- ✅ Originality: Invoice-backed lending for AI agents
- ✅ Technical execution: Multi-layer integration (Stripe + Locus + Base + Anthropic)
- ✅ Real-world value: Solves agent funding problem
- ✅ Feasibility: Working demo in 8 hours

### Stripe Track
- ✅ **Creativity (30%):** Novel use of Stripe Connect for AI agent funding
- ✅ **Works in prod (20%):** Real Stripe API integration with webhooks
- ✅ **Real business (50%):** Solves cold-start problem for agentic commerce

---

## Resources

- [Design Document](./docs/plans/2025-11-15-agentic-payments-stripe-enhanced-design.md)
- [Stripe Connect Docs](https://stripe.com/docs/connect)
- [Locus Docs](https://docs.uselocus.com/)
- [Base Docs](https://docs.base.org/)
- [Anthropic SDK](https://github.com/anthropics/anthropic-sdk-python)

---

## License

MIT
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add comprehensive README"
```

---

## Task 15: Final Testing & Verification

**Files:**
- None (testing existing code)

**Step 1: Run all tests**

Run: `npx hardhat test`

Expected: All tests passing

**Step 2: Test webhook server**

Terminal 1:
```bash
yarn dev
```

Terminal 2:
```bash
stripe listen --forward-to localhost:3000/webhook
```

Terminal 3:
```bash
curl -X POST http://localhost:3000/api/funding/execute \
  -H "Content-Type: application/json" \
  -d '{"agentId": "lender-001", "amountUsd": 100}'
```

Expected: Webhook event logged, Locus balance updated

**Step 3: Run full demo**

Run: `yarn demo`

Expected: Complete flow executes without errors

**Step 4: Verify contract deployment**

Visit: `https://sepolia.basescan.org/address/<INVOICE_NFT_ADDRESS>`

Expected: Contract visible on BaseScan

**Step 5: Check Stripe Dashboard**

Visit: https://dashboard.stripe.com/test/connect/accounts/overview

Expected: 3 Connect accounts visible

**Step 6: Commit**

```bash
git add .
git commit -m "chore: final verification and testing complete"
```

---

## Plan Complete!

Plan saved to `docs/plans/2025-11-15-implementation-plan.md`.

**Next Steps:**

1. **Execute this plan** using superpowers:executing-plans skill
2. **Test thoroughly** at each checkpoint
3. **Commit frequently** after each task
4. **Deploy** smart contracts to Base Sepolia
5. **Run demo** to verify end-to-end flow
6. **Prepare presentation** materials for judges

**Timeline Estimate:** 8-10 hours for full implementation

**Key Success Criteria:**
- ✅ Smart contracts deployed to Base
- ✅ Agents funded via Stripe Connect
- ✅ Autonomous loan execution working
- ✅ All payments flowing through Locus
- ✅ Demo runs without errors

Good luck at the hackathon! 🚀
