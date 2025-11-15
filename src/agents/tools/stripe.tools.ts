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
