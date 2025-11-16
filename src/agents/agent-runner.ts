/**
 * Agent Runner
 *
 * Runs an autonomous AI agent using Anthropic SDK with access to all tools.
 */

import Anthropic from '@anthropic-ai/sdk';
import { allTools, executeTool } from './tools';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

console.log("wwaefewafea", process.env.ANTHROPIC_API_KEY)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export interface AgentConfig {
  agentId: string;
  systemPrompt: string;
  initialMessage?: string;
  maxTurns?: number;
}

export interface AgentTurn {
  turnNumber: number;
  thinking?: string;
  toolCalls: Array<{
    toolName: string;
    input: any;
    result: any;
  }>;
  response?: string;
}

/**
 * Run an autonomous agent
 */
export async function runAgent(config: AgentConfig): Promise<{
  finalResponse: string;
  turns: AgentTurn[];
  totalToolCalls: number;
}> {
  const { agentId, systemPrompt, initialMessage, maxTurns = 10 } = config;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🤖 Starting Agent: ${agentId}`);
  console.log(`${'='.repeat(60)}\n`);

  const messages: Anthropic.MessageParam[] = [];
  const turns: AgentTurn[] = [];
  let totalToolCalls = 0;

  // Add initial message if provided
  if (initialMessage) {
    messages.push({
      role: 'user',
      content: initialMessage
    });
  } else {
    // Default: check inbox and assess situation
    messages.push({
      role: 'user',
      content: 'Check your inbox and assess your current situation. What should you do next?'
    });
  }

  for (let turn = 0; turn < maxTurns; turn++) {
    console.log(`\n--- Turn ${turn + 1}/${maxTurns} ---\n`);

    const currentTurn: AgentTurn = {
      turnNumber: turn + 1,
      toolCalls: []
    };

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        messages,
        tools: allTools,
      });

      console.log(`Stop reason: ${response.stop_reason}`);

      // Add assistant response to conversation
      messages.push({
        role: 'assistant',
        content: response.content
      });

      // Check for text blocks (thinking/response)
      const textBlocks = response.content.filter(block => block.type === 'text');
      if (textBlocks.length > 0) {
        const text = textBlocks.map(b => 'text' in b ? b.text : '').join('\n');
        currentTurn.thinking = text;
        console.log(`Agent thinking: ${text.substring(0, 200)}...`);
      }

      // If agent is done (no tool use), return final response
      if (response.stop_reason === 'end_turn') {
        const finalText = textBlocks.map(b => 'text' in b ? b.text : '').join('\n');
        currentTurn.response = finalText;
        turns.push(currentTurn);

        console.log(`\n✅ Agent ${agentId} completed`);
        console.log(`Final response: ${finalText}`);

        return {
          finalResponse: finalText,
          turns,
          totalToolCalls
        };
      }

      // Execute tool calls
      if (response.stop_reason === 'tool_use') {
        const toolResults: Anthropic.MessageParam = {
          role: 'user',
          content: []
        };

        for (const block of response.content) {
          if (block.type === 'tool_use') {
            console.log(`\n🔧 Executing tool: ${block.name}`);
            console.log(`Input: ${JSON.stringify(block.input, null, 2)}`);

            try {
              const result = await executeTool(block.name, block.input);
              console.log(`✅ Result: ${JSON.stringify(result, null, 2)}`);

              currentTurn.toolCalls.push({
                toolName: block.name,
                input: block.input,
                result
              });

              totalToolCalls++;

              (toolResults.content as any[]).push({
                type: 'tool_result',
                tool_use_id: block.id,
                content: JSON.stringify(result)
              });
            } catch (error: any) {
              console.error(`❌ Tool error: ${error.message}`);

              currentTurn.toolCalls.push({
                toolName: block.name,
                input: block.input,
                result: { error: error.message }
              });

              (toolResults.content as any[]).push({
                type: 'tool_result',
                tool_use_id: block.id,
                is_error: true,
                content: error.message
              });
            }
          }
        }

        messages.push(toolResults);
      }

      turns.push(currentTurn);

    } catch (error: any) {
      console.error(`\n❌ Agent error on turn ${turn + 1}:`, error.message);
      throw error;
    }
  }

  console.log(`\n⚠️  Agent ${agentId} reached max turns (${maxTurns})`);

  return {
    finalResponse: 'Max turns reached',
    turns,
    totalToolCalls
  };
}

/**
 * Run multiple agents in sequence (turn-by-turn coordination)
 */
export async function runMultiAgentSequence(agents: AgentConfig[]): Promise<void> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🎭 Running Multi-Agent Sequence (${agents.length} agents)`);
  console.log(`${'='.repeat(60)}\n`);

  for (const agentConfig of agents) {
    await runAgent(agentConfig);
    console.log(`\n${'='.repeat(60)}\n`);
  }
}
