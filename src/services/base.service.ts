/**
 * Base Smart Contract Service
 *
 * Interacts with InvoiceNFT and LoanEscrow contracts on Base Sepolia.
 * For hackathon: Uses mock data if contracts not deployed.
 */

import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import { locusService } from './locus.service';

dotenv.config();

// Mock mode if no contracts deployed yet
const MOCK_MODE = !process.env.INVOICE_NFT_ADDRESS || process.env.INVOICE_NFT_ADDRESS === '...';

interface Invoice {
  tokenId: number;
  debtor: string;
  amount: string; // in ETH
  dueDate: Date;
  paid: boolean;
  owner: string;
}

interface Loan {
  loanId: number;
  lender: string;
  borrower: string;
  invoiceTokenId: number;
  principalAmount: string; // in ETH
  interestAmount: string; // in ETH
  totalOwed: string; // in ETH
  settled: boolean;
}

export class BaseService {
  private invoices: Map<number, Invoice> = new Map();
  private loans: Map<number, Loan> = new Map();
  private invoiceCounter = 0;
  private loanCounter = 0;

  constructor() {
    if (MOCK_MODE) {
      console.log('[Base] Running in MOCK mode (contracts not deployed)');
    } else {
      console.log('[Base] Connected to Base Sepolia');
      console.log(`[Base] InvoiceNFT: ${process.env.INVOICE_NFT_ADDRESS}`);
      console.log(`[Base] LoanEscrow: ${process.env.LOAN_ESCROW_ADDRESS}`);
    }
  }

  /**
   * Mint a new invoice NFT
   */
  async mintInvoiceNFT(
    ownerAddress: string,
    debtorAddress: string,
    amountEth: number,
    daysUntilDue: number
  ): Promise<{ tokenId: number; txHash: string }> {
    if (MOCK_MODE) {
      const tokenId = this.invoiceCounter++;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + daysUntilDue);

      const invoice: Invoice = {
        tokenId,
        debtor: debtorAddress,
        amount: amountEth.toString(),
        dueDate,
        paid: false,
        owner: ownerAddress
      };

      this.invoices.set(tokenId, invoice);

      console.log(`[Base] ✅ Minted Invoice NFT #${tokenId}`);
      console.log(`[Base]    Owner: ${ownerAddress}`);
      console.log(`[Base]    Amount: ${amountEth} ETH`);
      console.log(`[Base]    Due: ${dueDate.toISOString()}`);

      return {
        tokenId,
        txHash: `0xmock_mint_${tokenId}_${Date.now()}`
      };
    }

    // TODO: Real contract interaction
    throw new Error('Real contract integration not yet implemented');
  }

  /**
   * Get invoice details
   */
  async getInvoiceDetails(tokenId: number): Promise<any> {
    if (MOCK_MODE) {
      const invoice = this.invoices.get(tokenId);
      if (!invoice) {
        throw new Error(`Invoice NFT #${tokenId} not found`);
      }

      return {
        tokenId: invoice.tokenId,
        debtor: invoice.debtor,
        amount: invoice.amount,
        dueDate: invoice.dueDate.toISOString(),
        paid: invoice.paid,
        owner: invoice.owner,
        daysUntilDue: Math.ceil(
          (invoice.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      };
    }

    // TODO: Real contract interaction
    throw new Error('Real contract integration not yet implemented');
  }

  /**
   * Approve NFT transfer to escrow
   */
  async approveNFTTransfer(
    tokenId: number,
    escrowAddress: string
  ): Promise<{ txHash: string }> {
    if (MOCK_MODE) {
      console.log(`[Base] ✅ Approved Invoice NFT #${tokenId} for escrow`);
      return {
        txHash: `0xmock_approve_${tokenId}_${Date.now()}`
      };
    }

    // TODO: Real contract interaction
    throw new Error('Real contract integration not yet implemented');
  }

  /**
   * Create a loan with invoice NFT as collateral
   */
  async createLoan(
    lenderAddress: string,
    borrowerAddress: string,
    invoiceTokenId: number,
    principalEth: number,
    interestEth: number
  ): Promise<{ loanId: number; txHash: string }> {
    if (MOCK_MODE) {
      const loanId = this.loanCounter++;
      const totalOwed = principalEth + interestEth;

      const loan: Loan = {
        loanId,
        lender: lenderAddress,
        borrower: borrowerAddress,
        invoiceTokenId,
        principalAmount: principalEth.toString(),
        interestAmount: interestEth.toString(),
        totalOwed: totalOwed.toString(),
        settled: false
      };

      this.loans.set(loanId, loan);

      // Transfer NFT ownership to escrow
      const invoice = this.invoices.get(invoiceTokenId);
      if (invoice) {
        invoice.owner = 'ESCROW';
      }

      console.log(`[Base] ✅ Created Loan #${loanId}`);
      console.log(`[Base]    Lender: ${lenderAddress}`);
      console.log(`[Base]    Borrower: ${borrowerAddress}`);
      console.log(`[Base]    Principal: ${principalEth} ETH`);
      console.log(`[Base]    Interest: ${interestEth} ETH`);
      console.log(`[Base]    Collateral: Invoice NFT #${invoiceTokenId}`);

      // Disburse principal via Locus (convert addresses to agent IDs)
      const lenderAgentId = this.addressToAgentId(lenderAddress);
      const borrowerAgentId = this.addressToAgentId(borrowerAddress);

      try {
        await locusService.sendToAddress(
          lenderAgentId,
          borrowerAddress,
          principalEth,
          `Loan disbursement - Principal for Loan #${loanId}`
        );
        console.log(`[Base] 💸 Disbursed ${principalEth} USDC to borrower`);
      } catch (error: any) {
        console.log(`[Base] ⚠️  Locus transfer failed: ${error.message}`);
      }

      return {
        loanId,
        txHash: `0xmock_loan_${loanId}_${Date.now()}`
      };
    }

    // TODO: Real contract interaction
    throw new Error('Real contract integration not yet implemented');
  }

  /**
   * Get loan status
   */
  async getLoanStatus(loanId: number): Promise<any> {
    if (MOCK_MODE) {
      const loan = this.loans.get(loanId);
      if (!loan) {
        throw new Error(`Loan #${loanId} not found`);
      }

      return {
        loanId: loan.loanId,
        lender: loan.lender,
        borrower: loan.borrower,
        invoiceTokenId: loan.invoiceTokenId,
        principalAmount: loan.principalAmount,
        interestAmount: loan.interestAmount,
        totalOwed: loan.totalOwed,
        settled: loan.settled,
        status: loan.settled ? 'Settled' : 'Active'
      };
    }

    // TODO: Real contract integration
    throw new Error('Real contract integration not yet implemented');
  }

  /**
   * Settle a loan (repay + return NFT)
   */
  async settleLoan(
    loanId: number,
    paymentEth: number
  ): Promise<{ txHash: string }> {
    if (MOCK_MODE) {
      const loan = this.loans.get(loanId);
      if (!loan) {
        throw new Error(`Loan #${loanId} not found`);
      }

      if (loan.settled) {
        throw new Error(`Loan #${loanId} already settled`);
      }

      const totalOwed = parseFloat(loan.totalOwed);
      if (paymentEth < totalOwed) {
        throw new Error(
          `Insufficient payment: ${paymentEth} ETH < ${totalOwed} ETH required`
        );
      }

      loan.settled = true;

      // Return NFT to borrower
      const invoice = this.invoices.get(loan.invoiceTokenId);
      if (invoice) {
        invoice.owner = loan.borrower;
      }

      console.log(`[Base] ✅ Settled Loan #${loanId}`);
      console.log(`[Base]    Payment: ${paymentEth} ETH`);
      console.log(`[Base]    Returned Invoice NFT #${loan.invoiceTokenId} to borrower`);

      // Transfer payment to lender via Locus
      const borrowerAgentId = this.addressToAgentId(loan.borrower);
      const lenderAgentId = this.addressToAgentId(loan.lender);

      try {
        await locusService.sendToAddress(
          borrowerAgentId,
          loan.lender,
          paymentEth,
          `Loan repayment - ${loan.principalAmount} principal + ${loan.interestAmount} interest for Loan #${loanId}`
        );
        console.log(`[Base] 💸 Transferred ${paymentEth} USDC to lender`);
      } catch (error: any) {
        console.log(`[Base] ⚠️  Locus transfer failed: ${error.message}`);
      }

      return {
        txHash: `0xmock_settle_${loanId}_${Date.now()}`
      };
    }

    // TODO: Real contract integration
    throw new Error('Real contract integration not yet implemented');
  }

  /**
   * Convert wallet address to agent ID
   */
  private addressToAgentId(address: string): string {
    // Extract agent ID pattern from address
    // Addresses follow pattern: 0x{agentId}...
    const lowerAddress = address.toLowerCase();

    if (lowerAddress.includes('lender')) {
      return 'lender-001';
    } else if (lowerAddress.includes('business')) {
      return 'business-001';
    } else if (lowerAddress.includes('analyst')) {
      return 'analyst-001';
    }

    // Default fallback
    return address.substring(2, 15).replace(/0+$/, '');
  }
}

export const baseService = new BaseService();
