# Smart Contract Deployment Guide

This guide explains how to deploy the InvoiceNFT and LoanEscrow smart contracts to Base Sepolia testnet.

## Prerequisites

Before deploying, ensure you have:

1. **Node.js and Yarn** installed
2. **A MetaMask wallet** (or similar) with a test account
3. **Base Sepolia ETH** in your wallet for gas fees

## Step 1: Get Base Sepolia Testnet ETH

You need testnet ETH to pay for gas fees when deploying contracts.

### Option A: Coinbase Faucet (Recommended)
1. Visit: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
2. Connect your wallet
3. Request testnet ETH (you'll receive ~0.05 ETH)

### Option B: Base Sepolia Faucet
1. Visit: https://www.alchemy.com/faucets/base-sepolia
2. Enter your wallet address
3. Request testnet ETH

**Note:** You may need to have some Sepolia ETH first. Get Sepolia ETH from:
- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia

## Step 2: Set Up Environment Variables

1. **Create a .env file** (if you haven't already):
   ```bash
   cp .env.example .env
   ```

2. **Add your private key to .env**:
   ```bash
   # In your .env file:
   PRIVATE_KEY=your_private_key_here
   BASE_RPC_URL=https://sepolia.base.org
   ```

   **How to get your private key from MetaMask:**
   - Click the three dots next to your account
   - Select "Account Details"
   - Click "Export Private Key"
   - Enter your MetaMask password
   - Copy the private key (starts with 0x)

   **SECURITY WARNING:**
   - NEVER commit your .env file to git
   - NEVER share your private key
   - Only use test wallets for development
   - The .env file is already in .gitignore

3. **Optional: Add BaseScan API Key** (for contract verification):
   ```bash
   BASESCAN_API_KEY=your_basescan_api_key
   ```

   Get a free API key from: https://basescan.org/myapikey

## Step 3: Verify Your Setup

Before deploying, verify your configuration:

```bash
# Check that you have testnet ETH
npx hardhat run scripts/check-balance.js --network baseSepolia
```

Or create a quick check script:
```javascript
// scripts/check-balance.js
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH");

  if (balance === 0n) {
    console.log("\n⚠️  No ETH! Get testnet ETH before deploying.");
  } else {
    console.log("\n✅ Ready to deploy!");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

## Step 4: Deploy Contracts

Run the deployment script:

```bash
yarn deploy:contracts
```

Or using npx directly:

```bash
npx hardhat run scripts/deploy.js --network baseSepolia
```

### Expected Output

You should see output like:

```
Deploying contracts to Base Sepolia...
Network: baseSepolia
Deploying contracts with account: 0x1234...
Account balance: 0.05 ETH

1. Deploying InvoiceNFT...
InvoiceNFT deployed to: 0xAbCd...

2. Deploying LoanEscrow...
LoanEscrow deployed to: 0xEfGh...

========================================
Deployment complete!
========================================

Add these to your .env file:
INVOICE_NFT_ADDRESS=0xAbCd...
LOAN_ESCROW_ADDRESS=0xEfGh...

Verify on BaseScan:
InvoiceNFT: https://sepolia.basescan.org/address/0xAbCd...
LoanEscrow: https://sepolia.basescan.org/address/0xEfGh...
```

## Step 5: Update .env File

Copy the contract addresses from the deployment output and add them to your .env file:

```bash
INVOICE_NFT_ADDRESS=0xAbCd...  # Replace with actual address
LOAN_ESCROW_ADDRESS=0xEfGh...  # Replace with actual address
```

## Step 6: Verify Deployment

### A. Check on BaseScan

1. Visit the URLs printed by the deployment script
2. You should see your deployed contracts
3. The contracts will show:
   - Contract address
   - Creation transaction
   - Balance (should be 0)

### B. Verify Contract Source Code (Optional)

To make your contracts readable on BaseScan:

```bash
npx hardhat verify --network baseSepolia <INVOICE_NFT_ADDRESS>
npx hardhat verify --network baseSepolia <LOAN_ESCROW_ADDRESS>
```

This uploads your source code to BaseScan so others can read it.

### C. Test the Deployment

Run the contract tests against the deployed contracts (optional):

```bash
npx hardhat test --network baseSepolia
```

**Note:** This will cost gas fees as it runs on the real testnet.

## Troubleshooting

### Error: "insufficient funds"
- You need more testnet ETH
- Visit the faucets listed in Step 1

### Error: "network does not exist"
- Check your hardhat.config.js
- Ensure baseSepolia network is configured
- Verify BASE_RPC_URL in .env

### Error: "invalid private key"
- Check your PRIVATE_KEY in .env
- Ensure it starts with 0x
- Make sure there are no extra spaces or quotes

### Error: "nonce too high"
- Your account's nonce is out of sync
- Wait a few minutes and try again
- Or reset your MetaMask account (Settings > Advanced > Reset Account)

### Deployment is slow
- Base Sepolia can sometimes be slow
- Wait for confirmations (usually 1-2 minutes per contract)
- Check https://sepolia.basescan.org/ to see if the network is congested

### Contract verification fails
- Wait a few minutes after deployment before verifying
- Ensure BASESCAN_API_KEY is set in .env
- Check that you're using the correct contract address

## Post-Deployment Checklist

- [ ] Contracts deployed successfully
- [ ] Contract addresses saved in .env
- [ ] Contracts verified on BaseScan (optional)
- [ ] Contracts visible at BaseScan URLs
- [ ] .env file NOT committed to git
- [ ] Ready to run the demo!

## Next Steps

After deploying contracts:

1. **Initialize agents:**
   ```bash
   yarn init:agents
   ```

2. **Start the webhook server:**
   ```bash
   yarn dev
   ```

3. **Run the demo:**
   ```bash
   yarn demo
   ```

## Useful Commands

```bash
# Check contract status
npx hardhat run scripts/check-deployment.js --network baseSepolia

# Get contract info
cast contract <ADDRESS> --rpc-url https://sepolia.base.org

# Check transaction
npx hardhat etherscan-verify --network baseSepolia

# Clean and rebuild
npx hardhat clean
npx hardhat compile
```

## Resources

- **Base Sepolia Explorer:** https://sepolia.basescan.org/
- **Base Sepolia RPC:** https://sepolia.base.org
- **Base Documentation:** https://docs.base.org/
- **Hardhat Documentation:** https://hardhat.org/docs
- **Base Faucet:** https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet

## Security Notes

1. **Never use real funds** - This is a testnet deployment only
2. **Keep your private key secure** - Never commit it to git
3. **Use a test wallet** - Don't use your main wallet's private key
4. **Check the network** - Always verify you're on Base Sepolia (chainId: 84532)
5. **Backup your .env** - Store it securely outside the repo

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the deployment script output for error messages
3. Check Base Sepolia network status
4. Verify your .env configuration
5. Ensure you have enough testnet ETH
