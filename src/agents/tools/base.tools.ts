/**
 * Base Smart Contract Tools
 *
 * Tools for interacting with InvoiceNFT and LoanEscrow contracts on Base.
 */

import { baseService } from '../../services/base.service';

export const baseTools = [
  {
    name: 'mint_invoice_nft',
    description: `Mint a new invoice NFT representing a receivable.
Use this when you have an invoice from a customer that you want to tokenize as collateral for a loan.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        owner_address: {
          type: 'string',
          description: 'Your wallet address that will own the NFT'
        },
        debtor_address: {
          type: 'string',
          description: 'Wallet address of the customer who owes the money'
        },
        amount_eth: {
          type: 'number',
          description: 'Invoice amount in ETH'
        },
        days_until_due: {
          type: 'number',
          description: 'Number of days until invoice payment is due'
        }
      },
      required: ['owner_address', 'debtor_address', 'amount_eth', 'days_until_due']
    }
  },
  {
    name: 'get_invoice_details',
    description: `Get details of an invoice NFT by token ID.
Returns debtor, amount, due date, and payment status.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        token_id: {
          type: 'number',
          description: 'Token ID of the invoice NFT'
        }
      },
      required: ['token_id']
    }
  },
  {
    name: 'approve_nft_transfer',
    description: `Approve the loan escrow contract to transfer your invoice NFT.
Required before creating a loan - this allows the escrow to lock your NFT as collateral.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        token_id: {
          type: 'number',
          description: 'Token ID of your invoice NFT'
        },
        escrow_address: {
          type: 'string',
          description: 'Address of the loan escrow contract'
        }
      },
      required: ['token_id', 'escrow_address']
    }
  },
  {
    name: 'create_loan',
    description: `Create a loan with an invoice NFT as collateral.
This locks the borrower's invoice NFT in escrow and disburses the principal.
Only lenders should use this tool.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        lender_address: {
          type: 'string',
          description: 'Your wallet address (the lender)'
        },
        borrower_address: {
          type: 'string',
          description: 'Borrower wallet address'
        },
        invoice_token_id: {
          type: 'number',
          description: 'Token ID of the invoice NFT to use as collateral'
        },
        principal_eth: {
          type: 'number',
          description: 'Loan principal amount in ETH'
        },
        interest_eth: {
          type: 'number',
          description: 'Interest amount in ETH'
        }
      },
      required: ['lender_address', 'borrower_address', 'invoice_token_id', 'principal_eth', 'interest_eth']
    }
  },
  {
    name: 'get_loan_status',
    description: `Get the status of a loan by loan ID.
Returns lender, borrower, amounts, and settlement status.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        loan_id: {
          type: 'number',
          description: 'Loan ID'
        }
      },
      required: ['loan_id']
    }
  },
  {
    name: 'settle_loan',
    description: `Settle a loan by repaying the principal + interest.
This returns the invoice NFT to the borrower and sends payment to the lender.
Only borrowers should use this tool when ready to repay.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        loan_id: {
          type: 'number',
          description: 'Loan ID to settle'
        },
        payment_eth: {
          type: 'number',
          description: 'Payment amount in ETH (must be >= total owed)'
        }
      },
      required: ['loan_id', 'payment_eth']
    }
  }
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

    case 'approve_nft_transfer':
      return await baseService.approveNFTTransfer(
        toolInput.token_id,
        toolInput.escrow_address
      );

    case 'create_loan':
      return await baseService.createLoan(
        toolInput.lender_address,
        toolInput.borrower_address,
        toolInput.invoice_token_id,
        toolInput.principal_eth,
        toolInput.interest_eth
      );

    case 'get_loan_status':
      return await baseService.getLoanStatus(toolInput.loan_id);

    case 'settle_loan':
      return await baseService.settleLoan(
        toolInput.loan_id,
        toolInput.payment_eth
      );

    default:
      throw new Error(`Unknown Base tool: ${toolName}`);
  }
}
