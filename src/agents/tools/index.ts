/**
 * Unified Tool Registry
 *
 * All tools available to agents through the shared MCP server.
 * Total: 14 tools across 4 categories
 */

import { locusTools, executeLocusTool } from './locus.tools';
import { baseTools, executeBaseTool } from './base.tools';
import { communicationTools, executeCommunicationTool } from './communication.tools';
import { analysisTools, executeAnalysisTool } from './analysis.tools';

// Combine all tools
export const allTools = [
  ...locusTools,         // 4 tools: get_payment_context, send_to_contact, send_to_address, send_to_email
  ...baseTools,          // 6 tools: mint_invoice_nft, get_invoice_details, approve_nft_transfer, create_loan, get_loan_status, settle_loan
  ...communicationTools, // 2 tools: send_message_to_agent, check_inbox
  ...analysisTools       // 2 tools: analyze_invoice, calculate_risk_score
];

console.log(`[Tools] Registered ${allTools.length} tools:`);
console.log(`[Tools]   Locus: ${locusTools.length} tools`);
console.log(`[Tools]   Base: ${baseTools.length} tools`);
console.log(`[Tools]   Communication: ${communicationTools.length} tools`);
console.log(`[Tools]   Analysis: ${analysisTools.length} tools`);

/**
 * Execute a tool by name
 */
export async function executeTool(toolName: string, toolInput: any): Promise<any> {
  // Route to appropriate executor based on tool name
  if (locusTools.some(t => t.name === toolName)) {
    return await executeLocusTool(toolName, toolInput);
  }

  if (baseTools.some(t => t.name === toolName)) {
    return await executeBaseTool(toolName, toolInput);
  }

  if (communicationTools.some(t => t.name === toolName)) {
    return await executeCommunicationTool(toolName, toolInput);
  }

  if (analysisTools.some(t => t.name === toolName)) {
    return await executeAnalysisTool(toolName, toolInput);
  }

  throw new Error(`Unknown tool: ${toolName}`);
}

/**
 * Get tools for a specific agent type (optional filtering)
 */
export function getToolsForAgent(agentType?: 'business' | 'lender' | 'analyst'): any[] {
  if (!agentType) {
    return allTools; // Return all tools if no filtering
  }

  // For now, return all tools and let system prompts guide usage
  // In production, you could filter here for stricter control
  return allTools;
}
