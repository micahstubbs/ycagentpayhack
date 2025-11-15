const hre = require("hardhat");

async function main() {
  console.log("Deploying contracts to Base Sepolia...");
  console.log("Network:", hre.network.name);

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Check deployer balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  if (balance === 0n) {
    console.error("\nERROR: Account has no ETH!");
    console.error("Please fund your account with Base Sepolia ETH from:");
    console.error("https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet");
    process.exit(1);
  }

  // Deploy InvoiceNFT
  console.log("\n1. Deploying InvoiceNFT...");
  const InvoiceNFT = await hre.ethers.getContractFactory("InvoiceNFT");
  const invoiceNFT = await InvoiceNFT.deploy();
  await invoiceNFT.waitForDeployment();
  const invoiceNFTAddress = await invoiceNFT.getAddress();
  console.log("InvoiceNFT deployed to:", invoiceNFTAddress);

  // Deploy LoanEscrow
  console.log("\n2. Deploying LoanEscrow...");
  const LoanEscrow = await hre.ethers.getContractFactory("LoanEscrow");
  const loanEscrow = await LoanEscrow.deploy();
  await loanEscrow.waitForDeployment();
  const loanEscrowAddress = await loanEscrow.getAddress();
  console.log("LoanEscrow deployed to:", loanEscrowAddress);

  console.log("\n========================================");
  console.log("Deployment complete!");
  console.log("========================================");
  console.log("\nAdd these to your .env file:");
  console.log(`INVOICE_NFT_ADDRESS=${invoiceNFTAddress}`);
  console.log(`LOAN_ESCROW_ADDRESS=${loanEscrowAddress}`);

  console.log("\nVerify on BaseScan:");
  console.log(`InvoiceNFT: https://sepolia.basescan.org/address/${invoiceNFTAddress}`);
  console.log(`LoanEscrow: https://sepolia.basescan.org/address/${loanEscrowAddress}`);

  console.log("\nTo verify contracts, run:");
  console.log(`npx hardhat verify --network baseSepolia ${invoiceNFTAddress}`);
  console.log(`npx hardhat verify --network baseSepolia ${loanEscrowAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
