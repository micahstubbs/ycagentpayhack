/**
 * Agent Tools for Convex
 *
 * Unified tool registry and execution for agents running in Convex.
 * This replaces src/agents/tools/index.ts
 */

import { action } from "./_generated/server";
import { v } from "convex/values";

/**
 * All tool definitions
 * These will be imported from separate files
 */
export const allTools = [
  // Locus tools
  {
    name: "get_payment_context",
    description: `Get payment context including budget status, available USDC balance, and whitelisted contacts.
Use this tool first to check your balance before making payments.`,
    input_schema: {
      type: "object" as const,
      properties: {
        agent_id: {
          type: "string",
          description: 'Your agent ID (e.g., "lender-001", "business-001")',
        },
      },
      required: ["agent_id"],
    },
  },
  {
    name: "send_to_contact",
    description: `Send USDC to a whitelisted contact by contact number.`,
    input_schema: {
      type: "object" as const,
      properties: {
        from_agent_id: { type: "string" },
        contact_number: { type: "number" },
        amount: { type: "number" },
        memo: { type: "string" },
      },
      required: ["from_agent_id", "contact_number", "amount", "memo"],
    },
  },
  {
    name: "send_to_address",
    description: `Send USDC to any wallet address on Base network.`,
    input_schema: {
      type: "object" as const,
      properties: {
        from_agent_id: { type: "string" },
        to_address: { type: "string" },
        amount: { type: "number" },
        memo: { type: "string" },
      },
      required: ["from_agent_id", "to_address", "amount", "memo"],
    },
  },
  {
    name: "send_to_email",
    description: `Send USDC via escrow to an email address.`,
    input_schema: {
      type: "object" as const,
      properties: {
        from_agent_id: { type: "string" },
        email: { type: "string" },
        amount: { type: "number" },
        memo: { type: "string" },
      },
      required: ["from_agent_id", "email", "amount"],
    },
  },
  // Communication tools
  {
    name: "send_message_to_agent",
    description: `Send a message to another agent.`,
    input_schema: {
      type: "object" as const,
      properties: {
        from_agent_id: { type: "string" },
        to_agent_id: { type: "string" },
        message_type: {
          type: "string",
          enum: ["request", "response", "notification"],
        },
        subject: { type: "string" },
        message_data: { type: "object" },
      },
      required: [
        "from_agent_id",
        "to_agent_id",
        "message_type",
        "subject",
        "message_data",
      ],
    },
  },
  {
    name: "check_inbox",
    description: `Check your inbox for new messages from other agents.`,
    input_schema: {
      type: "object" as const,
      properties: {
        agent_id: { type: "string" },
        mark_as_read: { type: "boolean" },
      },
      required: ["agent_id"],
    },
  },
];

/**
 * Execute a tool by name
 * This is a Convex action that can call external services
 */
export const executeTool = action({
  args: {
    toolName: v.string(),
    toolInput: v.any(),
  },
  handler: async (ctx, args) => {
    const { toolName, toolInput } = args;

    console.log(`[Tool] Executing: ${toolName}`);

    // Route to appropriate executor - check communication first!
    if (
      toolName === "send_message_to_agent" ||
      toolName === "check_inbox"
    ) {
      return await executeCommunicationTool(ctx, toolName, toolInput);
    }

    if (
      toolName === "send_to_contact" ||
      toolName === "send_to_address" ||
      toolName === "send_to_email" ||
      toolName === "get_payment_context"
    ) {
      return await executeLocusTool(ctx, toolName, toolInput);
    }

    if (
      [
        "mint_invoice_nft",
        "get_invoice_details",
        "approve_nft_transfer",
        "create_loan",
        "get_loan_status",
        "settle_loan",
      ].includes(toolName)
    ) {
      return await executeBaseTool(ctx, toolName, toolInput);
    }

    if (
      toolName === "analyze_invoice" ||
      toolName === "calculate_risk_score"
    ) {
      return await executeAnalysisTool(ctx, toolName, toolInput);
    }

    throw new Error(`Unknown tool: ${toolName}`);
  },
});

/**
 * Execute Locus payment tools
 */
async function executeLocusTool(
  ctx: any,
  toolName: string,
  toolInput: any
): Promise<any> {
  // Import Locus service dynamically or call via mutation/action
  // For now, return mock data - you'll need to integrate with actual Locus service
  console.log(`[Locus] ${toolName}:`, toolInput);

  switch (toolName) {
    case "get_payment_context":
      return {
        agent_id: toolInput.agent_id,
        balance_usdc: 1000,
        contacts: [],
        status: "active",
      };

    case "send_to_contact":
    case "send_to_address":
    case "send_to_email":
      return {
        success: true,
        transaction_id: `tx_${Date.now()}`,
        amount: toolInput.amount,
      };

    default:
      throw new Error(`Unknown Locus tool: ${toolName}`);
  }
}

/**
 * Execute communication tools
 */
async function executeCommunicationTool(
  ctx: any,
  toolName: string,
  toolInput: any
): Promise<any> {
  const { api } = await import("./_generated/api");
  console.log(`[Communication] ${toolName}:`, toolInput);

  switch (toolName) {
    case "send_message_to_agent":
      const result = await ctx.runMutation(api.agentCommunication.sendMessage, {
        from: toolInput.from_agent_id,
        to: toolInput.to_agent_id,
        type: toolInput.message_type,
        subject: toolInput.subject,
        payload: toolInput.message_data,
      });

      return {
        success: true,
        message_id: result.messageId,
        sent_to: toolInput.to_agent_id,
        subject: toolInput.subject,
        timestamp: new Date(result.timestamp).toISOString(),
      };

    case "check_inbox":
      const messages = await ctx.runQuery(api.agentCommunication.getUnreadMessages, {
        agentId: toolInput.agent_id,
      });

      // Mark as read if requested (default true)
      const markAsRead = toolInput.mark_as_read !== false;
      if (markAsRead && messages.length > 0) {
        await ctx.runMutation(api.agentCommunication.markAllAsRead, {
          agentId: toolInput.agent_id,
        });
      }

      if (messages.length === 0) {
        return {
          message_count: 0,
          messages: [],
          status: "No new messages",
        };
      }

      return {
        message_count: messages.length,
        messages: messages.map((msg: any) => ({
          message_id: msg.messageId,
          from: msg.from,
          type: msg.type,
          subject: msg.subject,
          data: msg.payload,
          timestamp: new Date(msg.timestamp).toISOString(),
        })),
        status: `You have ${messages.length} new message${messages.length > 1 ? "s" : ""}`,
      };

    default:
      throw new Error(`Unknown communication tool: ${toolName}`);
  }
}

/**
 * Execute Base smart contract tools
 */
async function executeBaseTool(
  ctx: any,
  toolName: string,
  toolInput: any
): Promise<any> {
  console.log(`[Base] ${toolName}:`, toolInput);

  // Mock implementation - integrate with actual Base service
  return {
    success: true,
    tool: toolName,
    input: toolInput,
  };
}

/**
 * Execute analysis tools
 */
async function executeAnalysisTool(
  ctx: any,
  toolName: string,
  toolInput: any
): Promise<any> {
  console.log(`[Analysis] ${toolName}:`, toolInput);

  // Mock implementation
  return {
    success: true,
    tool: toolName,
    result: "Analysis complete",
  };
}
