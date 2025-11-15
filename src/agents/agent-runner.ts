import Anthropic from '@anthropic-ai/sdk';
import { allTools, executeTool } from './tools';
import * as dotenv from 'dotenv';

dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export interface AgentRunConfig {
  agentId: string;
  systemPrompt: string;
  initialMessage: string;
  maxTurns?: number;
}

export async function runAgent(config: AgentRunConfig): Promise<string> {
  const { agentId, systemPrompt, initialMessage, maxTurns = 10 } = config;

  console.log(`\n========== Running Agent: ${agentId} ==========\n`);

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: initialMessage },
  ];

  for (let turn = 0; turn < maxTurns; turn++) {
    console.log(`\n--- Turn ${turn + 1} ---\n`);

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages,
      tools: allTools as Anthropic.Tool[],
    });

    console.log(`Stop reason: ${response.stop_reason}`);

    // Add assistant response to messages
    messages.push({
      role: 'assistant',
      content: response.content,
    });

    // If agent is done (no tool use), return final response
    if (response.stop_reason === 'end_turn') {
      const textBlock = response.content.find((block) => block.type === 'text');
      if (textBlock && 'text' in textBlock) {
        console.log(`\nAgent ${agentId} response:`, textBlock.text);
        return textBlock.text;
      }
    }

    // Execute tool calls
    if (response.stop_reason === 'tool_use') {
      const toolResults: Anthropic.MessageParam = {
        role: 'user',
        content: [],
      };

      for (const block of response.content) {
        if (block.type === 'tool_use') {
          console.log(`\nExecuting tool: ${block.name}`);
          console.log('Tool input:', JSON.stringify(block.input, null, 2));

          try {
            const result = await executeTool(block.name, block.input);
            console.log('Tool result:', JSON.stringify(result, null, 2));

            (toolResults.content as any[]).push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: JSON.stringify(result),
            });
          } catch (error: any) {
            console.error(`Tool execution error: ${error.message}`);

            (toolResults.content as any[]).push({
              type: 'tool_result',
              tool_use_id: block.id,
              is_error: true,
              content: error.message,
            });
          }
        }
      }

      messages.push(toolResults);
    }
  }

  return 'Max turns reached';
}
