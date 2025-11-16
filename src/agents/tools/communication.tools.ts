/**
 * Agent Communication Tools
 *
 * Allows agents to send messages and check their inbox.
 */

import { agentCommunication } from '../../services/agent-communication.service';

export const communicationTools = [
  {
    name: 'send_message_to_agent',
    description: `Send a message to another agent. Use this to:
- Request services (e.g., Lender requests credit analysis from Analyst)
- Respond to requests (e.g., Analyst sends approval/rejection to Lender)
- Send notifications (e.g., Business notifies Lender of loan settlement)`,
    input_schema: {
      type: 'object' as const,
      properties: {
        from_agent_id: {
          type: 'string',
          description: 'Your agent ID (e.g., "lender-001")'
        },
        to_agent_id: {
          type: 'string',
          description: 'Recipient agent ID (e.g., "analyst-001", "business-001")'
        },
        message_type: {
          type: 'string',
          enum: ['request', 'response', 'notification'],
          description: 'Type of message: request (asking for something), response (replying), notification (info only)'
        },
        subject: {
          type: 'string',
          description: 'Message subject (e.g., "credit_analysis_request", "loan_approved")'
        },
        message_data: {
          type: 'object',
          description: 'Message payload - can contain any data relevant to the message'
        }
      },
      required: ['from_agent_id', 'to_agent_id', 'message_type', 'subject', 'message_data']
    }
  },
  {
    name: 'check_inbox',
    description: `Check your inbox for new messages from other agents.
Returns unread messages. Use this at the start of each turn to see if other agents have sent you requests or responses.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        agent_id: {
          type: 'string',
          description: 'Your agent ID'
        },
        mark_as_read: {
          type: 'boolean',
          description: 'Whether to mark messages as read after checking (default: true)'
        }
      },
      required: ['agent_id']
    }
  }
];

export async function executeCommunicationTool(toolName: string, toolInput: any): Promise<any> {
  switch (toolName) {
    case 'send_message_to_agent':
      const message = agentCommunication.sendMessage(
        toolInput.from_agent_id,
        toolInput.to_agent_id,
        toolInput.message_type,
        toolInput.subject,
        toolInput.message_data
      );

      return {
        success: true,
        message_id: message.messageId,
        sent_to: toolInput.to_agent_id,
        subject: toolInput.subject,
        timestamp: message.timestamp.toISOString()
      };

    case 'check_inbox':
      const messages = agentCommunication.getUnreadMessages(toolInput.agent_id);

      // Mark as read if requested (default true)
      const markAsRead = toolInput.mark_as_read !== false;
      if (markAsRead && messages.length > 0) {
        agentCommunication.markAllAsRead(toolInput.agent_id);
      }

      if (messages.length === 0) {
        return {
          message_count: 0,
          messages: [],
          status: 'No new messages'
        };
      }

      return {
        message_count: messages.length,
        messages: messages.map(msg => ({
          message_id: msg.messageId,
          from: msg.from,
          type: msg.type,
          subject: msg.subject,
          data: msg.payload,
          timestamp: msg.timestamp.toISOString()
        })),
        status: `You have ${messages.length} new message${messages.length > 1 ? 's' : ''}`
      };

    default:
      throw new Error(`Unknown communication tool: ${toolName}`);
  }
}
