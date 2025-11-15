# Quick Deployment Guide

Follow these steps to deploy smart contracts to Base Sepolia:

## Step 1: Get Testnet ETH

Get Base Sepolia ETH from: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet

You'll need ~0.01 ETH for deployment.

## Step 2: Configure Environment

1. Copy the mock environment file:
   ```bash
   cp .env.mock .env
   ```

2. Edit `.env` and add your private key:
   ```bash
   PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
   ```

   **How to get your private key:**
   - Open MetaMask
   - Click the three dots → Account Details
   - Click "Export Private Key"
   - Enter your password
   - Copy the key (starts with 0x)

   **IMPORTANT:** Only use a TEST wallet! Never use your main wallet's private key.

## Step 3: Deploy

Run the deployment script:

```bash
yarn deploy:contracts
```

## Step 4: Save Contract Addresses

The script will print contract addresses like:

```
INVOICE_NFT_ADDRESS=0xAbCd...
LOAN_ESCROW_ADDRESS=0xEfGh...
```

Copy these addresses and add them to your `.env` file.

## Step 5: Verify

Visit the BaseScan URLs printed by the script to verify your contracts are deployed.

---

**That's it!** Your contracts are now deployed to Base Sepolia.

For detailed troubleshooting, see [DEPLOYMENT.md](./DEPLOYMENT.md)
