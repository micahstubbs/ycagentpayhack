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
