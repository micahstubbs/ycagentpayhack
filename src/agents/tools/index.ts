import { stripeTools, executeStripeTool } from './stripe.tools';
import { locusTools, executeLocusTool } from './locus.tools';
import { baseTools, executeBaseTool } from './base.tools';

export const allTools = [...stripeTools, ...locusTools, ...baseTools];

export async function executeTool(toolName: string, toolInput: any): Promise<any> {
  // Determine which category the tool belongs to
  if (stripeTools.some((tool) => tool.name === toolName)) {
    return await executeStripeTool(toolName, toolInput);
  } else if (locusTools.some((tool) => tool.name === toolName)) {
    return await executeLocusTool(toolName, toolInput);
  } else if (baseTools.some((tool) => tool.name === toolName)) {
    return await executeBaseTool(toolName, toolInput);
  } else {
    throw new Error(`Unknown tool: ${toolName}`);
  }
}
