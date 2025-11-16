/**
 * Agent Communication Service
 *
 * Enables agents to send messages to each other for coordination.
 * Used for loan requests, credit analysis requests, and responses.
 */

export interface AgentMessage {
  messageId: string;
  from: string;
  to: string;
  type: 'request' | 'response' | 'notification';
  subject: string;
  payload: any;
  timestamp: Date;
  read: boolean;
}

export class AgentCommunicationService {
  private messages: AgentMessage[] = [];
  private messageCounter = 0;

  /**
   * Send a message from one agent to another
   */
  sendMessage(
    from: string,
    to: string,
    type: 'request' | 'response' | 'notification',
    subject: string,
    payload: any
  ): AgentMessage {
    const message: AgentMessage = {
      messageId: `msg_${++this.messageCounter}_${Date.now()}`,
      from,
      to,
      type,
      subject,
      payload,
      timestamp: new Date(),
      read: false
    };

    this.messages.push(message);

    console.log(`[AgentComm] 📨 ${from} → ${to}: ${subject}`);
    console.log(`[AgentComm] Message ID: ${message.messageId}`);

    return message;
  }

  /**
   * Get unread messages for an agent
   */
  getUnreadMessages(agentId: string): AgentMessage[] {
    return this.messages.filter(
      msg => msg.to === agentId && !msg.read
    );
  }

  /**
   * Get all messages for an agent (read and unread)
   */
  getAllMessages(agentId: string): AgentMessage[] {
    return this.messages.filter(
      msg => msg.to === agentId || msg.from === agentId
    );
  }

  /**
   * Mark a message as read
   */
  markAsRead(messageId: string): void {
    const message = this.messages.find(m => m.messageId === messageId);
    if (message) {
      message.read = true;
      console.log(`[AgentComm] ✅ Message ${messageId} marked as read`);
    }
  }

  /**
   * Mark all messages for an agent as read
   */
  markAllAsRead(agentId: string): void {
    const unreadCount = this.messages.filter(
      msg => msg.to === agentId && !msg.read
    ).length;

    this.messages
      .filter(msg => msg.to === agentId && !msg.read)
      .forEach(msg => msg.read = true);

    console.log(`[AgentComm] ✅ Marked ${unreadCount} messages as read for ${agentId}`);
  }

  /**
   * Get message by ID
   */
  getMessage(messageId: string): AgentMessage | undefined {
    return this.messages.find(m => m.messageId === messageId);
  }

  /**
   * Get all messages (for debugging)
   */
  getAllMessagesDebug(): AgentMessage[] {
    return this.messages;
  }

  /**
   * Clear all messages (for testing)
   */
  clearAllMessages(): void {
    this.messages = [];
    this.messageCounter = 0;
    console.log('[AgentComm] 🗑️  All messages cleared');
  }
}

export const agentCommunication = new AgentCommunicationService();
