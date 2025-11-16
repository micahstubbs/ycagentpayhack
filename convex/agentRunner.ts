/**
 * Agent Runner for Convex
 *
 * Runs autonomous AI agents using Anthropic SDK with access to all tools.
 * This is the Convex-compatible version of the agent runner.
 */

import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import Anthropic from "@anthropic-ai/sdk";

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

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
 * This is a Convex action that can call external APIs (Anthropic)
 */
export const runAgent = action({
  args: {
    agentId: v.string(),
    systemPrompt: v.string(),
    initialMessage: v.optional(v.string()),
    maxTurns: v.optional(v.number()),
    tools: v.array(v.any()), // Tool definitions
  },
  handler: async (ctx, args): Promise<{
    finalResponse: string;
    turns: AgentTurn[];
    totalToolCalls: number;
    executionId?: string;
  }> => {
    const { agentId, systemPrompt, initialMessage, maxTurns = 10, tools } = args;

    const { api } = await import("./_generated/api");
    
    console.log(`\n${"=".repeat(60)}`);
    console.log(`🤖 Starting Agent: ${agentId}`);
    console.log(`${"=".repeat(60)}\n`);

    // Create execution record
    const executionId = await ctx.runMutation(api.agentRunner.createExecution, {
      agentId,
      startTime: Date.now(),
    });

    // Log start
    await ctx.runMutation((api as any).agentRunner.addLog, {
      executionId,
      level: "info",
      message: `🤖 Starting Agent: ${agentId}`,
    });

    const messages: Anthropic.MessageParam[] = [];
    const turns: AgentTurn[] = [];
    let totalToolCalls = 0;

    // Add initial message
    if (initialMessage) {
      messages.push({
        role: "user",
        content: initialMessage,
      });
    } else {
      messages.push({
        role: "user",
        content:
          "Check your inbox and assess your current situation. What should you do next?",
      });
    }

    for (let turn = 0; turn < maxTurns; turn++) {
      console.log(`\n--- Turn ${turn + 1}/${maxTurns} ---\n`);

      await ctx.runMutation((api as any).agentRunner.addLog, {
        executionId,
        level: "info",
        message: `Turn ${turn + 1}/${maxTurns}`,
      });

      const currentTurn: AgentTurn = {
        turnNumber: turn + 1,
        toolCalls: [],
      };

      try {
        const response = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4096,
          system: systemPrompt,
          messages,
          tools,
        });

        console.log(`Stop reason: ${response.stop_reason}`);

        // Add assistant response to conversation
        messages.push({
          role: "assistant",
          content: response.content,
        });

        // Check for text blocks (thinking/response)
        const textBlocks = response.content.filter(
          (block) => block.type === "text"
        );
        if (textBlocks.length > 0) {
          const text = textBlocks
            .map((b) => ("text" in b ? b.text : ""))
            .join("\n");
          currentTurn.thinking = text;
          console.log(`Agent thinking: ${text.substring(0, 200)}...`);
          
          await ctx.runMutation((api as any).agentRunner.addLog, {
            executionId,
            level: "thinking",
            message: `💭 ${text.substring(0, 200)}${text.length > 200 ? "..." : ""}`,
          });
        }

        // If agent is done (no tool use), return final response
        if (response.stop_reason === "end_turn") {
          const finalText = textBlocks
            .map((b) => ("text" in b ? b.text : ""))
            .join("\n");
          currentTurn.response = finalText;
          turns.push(currentTurn);

          console.log(`\n✅ Agent ${agentId} completed`);
          console.log(`Final response: ${finalText}`);

          await ctx.runMutation((api as any).agentRunner.addLog, {
            executionId,
            level: "info",
            message: `✅ Agent completed`,
          });

          // Update execution record
          await ctx.runMutation(api.agentRunner.updateExecution, {
            executionId,
            endTime: Date.now(),
            status: "completed",
            turns: turns.length,
            toolCalls: totalToolCalls,
            finalResponse: finalText,
          });

          return {
            finalResponse: finalText,
            turns,
            totalToolCalls,
            executionId,
          };
        }

        // Execute tool calls
        if (response.stop_reason === "tool_use") {
          const toolResults: Anthropic.MessageParam = {
            role: "user",
            content: [],
          };

          for (const block of response.content) {
            if (block.type === "tool_use") {
              console.log(`\n🔧 Executing tool: ${block.name}`);
              console.log(`Input: ${JSON.stringify(block.input, null, 2)}`);

              await ctx.runMutation((api as any).agentRunner.addLog, {
                executionId,
                level: "tool",
                message: `🔧 ${block.name}`,
                data: { input: block.input },
              });

              try {
                // Execute tool via Convex action
                const result = await ctx.runAction(
                  api.agentTools.executeTool,
                  {
                    toolName: block.name,
                    toolInput: block.input,
                  }
                );

                console.log(`✅ Result: ${JSON.stringify(result, null, 2)}`);

                await ctx.runMutation((api as any).agentRunner.addLog, {
                  executionId,
                  level: "tool",
                  message: `✅ ${block.name} completed`,
                  data: { result },
                });

                currentTurn.toolCalls.push({
                  toolName: block.name,
                  input: block.input,
                  result,
                });

                totalToolCalls++;

                (toolResults.content as any[]).push({
                  type: "tool_result",
                  tool_use_id: block.id,
                  content: JSON.stringify(result),
                });
              } catch (error: any) {
                console.error(`❌ Tool error: ${error.message}`);

                await ctx.runMutation((api as any).agentRunner.addLog, {
                  executionId,
                  level: "error",
                  message: `❌ ${block.name} failed: ${error.message}`,
                });

                currentTurn.toolCalls.push({
                  toolName: block.name,
                  input: block.input,
                  result: { error: error.message },
                });

                (toolResults.content as any[]).push({
                  type: "tool_result",
                  tool_use_id: block.id,
                  is_error: true,
                  content: error.message,
                });
              }
            }
          }

          messages.push(toolResults);
        }

        turns.push(currentTurn);
      } catch (error: any) {
        console.error(`\n❌ Agent error on turn ${turn + 1}:`, error.message);
        
        // Update execution record with error
        await ctx.runMutation(api.agentRunner.updateExecution, {
          executionId,
          endTime: Date.now(),
          status: "failed",
          turns: turns.length,
          toolCalls: totalToolCalls,
          error: error.message,
        });
        
        throw error;
      }
    }

    console.log(`\n⚠️  Agent ${agentId} reached max turns (${maxTurns})`);

    // Update execution record
    await ctx.runMutation(api.agentRunner.updateExecution, {
      executionId,
      endTime: Date.now(),
      status: "completed",
      turns: turns.length,
      toolCalls: totalToolCalls,
      finalResponse: "Max turns reached",
    });

    return {
      finalResponse: "Max turns reached",
      turns,
      totalToolCalls,
      executionId,
    };
  },
});

/**
 * Run multiple agents in sequence
 */
export const runMultiAgentSequence = action({
  args: {
    agents: v.array(
      v.object({
        agentId: v.string(),
        systemPrompt: v.string(),
        initialMessage: v.optional(v.string()),
        maxTurns: v.optional(v.number()),
        tools: v.array(v.any()),
      })
    ),
  },
  handler: async (ctx, args) => {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`🎭 Running Multi-Agent Sequence (${args.agents.length} agents)`);
    console.log(`${"=".repeat(60)}\n`);

    const results = [];

    for (const agentConfig of args.agents) {
      const result = await ctx.runAction("agentRunner.runAgent" as any, agentConfig);
      results.push(result);
      console.log(`\n${"=".repeat(60)}\n`);
    }

    return results;
  },
});


/**
 * Create execution record
 */
export const createExecution = mutation({
  args: {
    agentId: v.string(),
    startTime: v.number(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("agentExecutions", {
      agentId: args.agentId,
      startTime: args.startTime,
      status: "running",
      turns: 0,
      toolCalls: 0,
    });
    return id;
  },
});

/**
 * Update execution record
 */
export const updateExecution = mutation({
  args: {
    executionId: v.id("agentExecutions"),
    endTime: v.optional(v.number()),
    status: v.string(),
    turns: v.number(),
    toolCalls: v.number(),
    finalResponse: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { executionId, ...updates } = args;
    await ctx.db.patch(executionId, updates);
  },
});

/**
 * Get execution history for an agent
 */
export const getExecutionHistory = query({
  args: {
    agentId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const executions = await ctx.db
      .query("agentExecutions")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .order("desc")
      .take(args.limit || 20);
    return executions;
  },
});


/**
 * Add log entry for an execution
 */
export const addLog = mutation({
  args: {
    executionId: v.id("agentExecutions"),
    level: v.string(),
    message: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const logId = await ctx.db.insert("agentLogs", {
      executionId: args.executionId,
      timestamp: Date.now(),
      level: args.level,
      message: args.message,
      data: args.data,
    });
    console.log(`[LOG SAVED] ${args.level}: ${args.message} (${logId})`);
  },
});

/**
 * Get logs for an execution
 */
export const getLogs = query({
  args: {
    executionId: v.id("agentExecutions"),
  },
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query("agentLogs")
      .withIndex("by_execution", (q) => q.eq("executionId", args.executionId))
      .collect();
    return logs;
  },
});


/**
 * Get the most recent execution for an agent
 */
export const getLatestExecution = query({
  args: {
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    const execution = await ctx.db
      .query("agentExecutions")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .order("desc")
      .first();
    return execution;
  },
});

/**
 * Get logs for the latest execution of an agent
 */
export const getLatestLogs = query({
  args: {
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    const execution = await ctx.db
      .query("agentExecutions")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .order("desc")
      .first();
    
    console.log(`[GET LOGS] Agent: ${args.agentId}, Execution: ${execution?._id}, Status: ${execution?.status}`);
    
    if (!execution) {
      console.log(`[GET LOGS] No execution found for ${args.agentId}`);
      return [];
    }
    
    const logs = await ctx.db
      .query("agentLogs")
      .withIndex("by_execution", (q) => q.eq("executionId", execution._id))
      .collect();
    
    console.log(`[GET LOGS] Found ${logs.length} logs for execution ${execution._id}`);
    return logs;
  },
});


/**
 * Get logs for multiple agents (for workflow)
 */
export const getLogsForAgents = query({
  args: {
    agentIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const allLogs = [];
    
    for (const agentId of args.agentIds) {
      const execution = await ctx.db
        .query("agentExecutions")
        .withIndex("by_agent", (q) => q.eq("agentId", agentId))
        .order("desc")
        .first();
      
      if (execution) {
        const logs = await ctx.db
          .query("agentLogs")
          .withIndex("by_execution", (q) => q.eq("executionId", execution._id))
          .collect();
        
        // Add agent info to each log
        allLogs.push(...logs.map(log => ({
          ...log,
          agentId,
        })));
      }
    }
    
    // Sort by timestamp
    allLogs.sort((a, b) => a.timestamp - b.timestamp);
    
    return allLogs;
  },
});
