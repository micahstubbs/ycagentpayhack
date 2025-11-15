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
