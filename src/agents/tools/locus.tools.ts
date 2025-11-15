/**
 * Locus Payment Tools for Anthropic SDK Agents
 *
 * These tools allow AI agents to execute USDC payments using Locus infrastructure.
 * Based on the Locus MCP specification.
 */

import { locusService } from '../../services/locus.service';

export const locusTools = [
  {
    name: 'get_payment_context',
    description: `Get payment context including budget status, available USDC balance, and whitelisted contacts.
Use this tool first to check your balance before making payments.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        agent_id: {
          type: 'string',
          description: 'Your agent ID (e.g., "lender-001", "business-001")'
        }
      },
      required: ['agent_id']
    }
  },
  {
    name: 'send_to_contact',
    description: `Send USDC to a whitelisted contact by contact number.
The contact number is from your whitelisted contacts list (use get_payment_context to see contacts).`,
    input_schema: {
      type: 'object' as const,
      properties: {
        from_agent_id: {
          type: 'string',
          description: 'Your agent ID sending the payment'
        },
        contact_number: {
          type: 'number',
          description: 'Contact number from your whitelisted contacts (1, 2, 3...)'
        },
        amount: {
          type: 'number',
          description: 'Amount of USDC to send (must be positive)'
        },
        memo: {
          type: 'string',
          description: 'Payment description/memo'
        }
      },
      required: ['from_agent_id', 'contact_number', 'amount', 'memo']
    }
  },
  {
    name: 'send_to_address',
    description: `Send USDC to any wallet address on Base network.
Use this for direct payments when you know the recipient's wallet address.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        from_agent_id: {
          type: 'string',
          description: 'Your agent ID sending the payment'
        },
        to_address: {
          type: 'string',
          description: 'Recipient wallet address (0x...)'
        },
        amount: {
          type: 'number',
          description: 'Amount of USDC to send (must be positive)'
        },
        memo: {
          type: 'string',
          description: 'Payment description/memo'
        }
      },
      required: ['from_agent_id', 'to_address', 'amount', 'memo']
    }
  },
  {
    name: 'send_to_email',
    description: `Send USDC via escrow to an email address.
The recipient will receive an email to claim the funds. Use this when the recipient doesn't have a wallet yet.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        from_agent_id: {
          type: 'string',
          description: 'Your agent ID sending the payment'
        },
        email: {
          type: 'string',
          description: 'Recipient email address'
        },
        amount: {
          type: 'number',
          description: 'Amount of USDC to send (must be positive)'
        },
        memo: {
          type: 'string',
          description: 'Optional payment description/memo'
        }
      },
      required: ['from_agent_id', 'email', 'amount']
    }
  }
];

/**
 * Execute a Locus payment tool
 */
export async function executeLocusTool(toolName: string, toolInput: any): Promise<any> {
  switch (toolName) {
    case 'get_payment_context':
      return await locusService.getPaymentContext(toolInput.agent_id);

    case 'send_to_contact':
      return await locusService.sendToContact(
        toolInput.from_agent_id,
        toolInput.contact_number,
        toolInput.amount,
        toolInput.memo
      );

    case 'send_to_address':
      return await locusService.sendToAddress(
        toolInput.from_agent_id,
        toolInput.to_address,
        toolInput.amount,
        toolInput.memo
      );

    case 'send_to_email':
      return await locusService.sendToEmail(
        toolInput.from_agent_id,
        toolInput.email,
        toolInput.amount,
        toolInput.memo
      );

    default:
      throw new Error(`Unknown Locus tool: ${toolName}`);
  }
}
