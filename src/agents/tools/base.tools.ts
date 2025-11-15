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
