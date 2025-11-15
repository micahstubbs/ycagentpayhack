/**
 * Locus Payment Service
 *
 * Mock implementation of Locus MCP payment tools for hackathon demo.
 * Simulates USDC payments between agents.
 *
 * In production, this would use the official Locus MCP client with OAuth.
 */

import * as dotenv from 'dotenv';
dotenv.config();

interface AgentBalance {
  agentId: string;
  balance: number; // USDC balance
  walletAddress: string;
}

interface PaymentTransaction {
  txId: string;
  from: string;
  to: string;
  amount: number;
  memo: string;
  timestamp: Date;
}

interface Contact {
  id: number;
  name: string;
  email?: string;
  walletAddress?: string;
}

export class LocusService {
  private balances: Map<string, AgentBalance> = new Map();
  private transactions: PaymentTransaction[] = [];
  private contacts: Map<string, Contact[]> = new Map();

  constructor() {
    console.log('[Locus] Service initialized (Mock Mode)');
  }

  /**
   * Tool: get_payment_context
   * Get payment context including budget status and whitelisted contacts
   */
  async getPaymentContext(agentId: string): Promise<string> {
    const balance = this.balances.get(agentId);
    const contacts = this.contacts.get(agentId) || [];

    let context = `Budget Status: Active\n`;
    context += `Available Balance: ${balance?.balance || 0} USDC\n`;

    if (contacts.length > 0) {
      context += `\nWhitelisted Contacts:\n`;
      contacts.forEach((contact) => {
        context += `  ${contact.id}. ${contact.name}`;
        if (contact.email) context += ` (${contact.email})`;
        context += `\n`;
      });
    } else {
      context += `\nNo whitelisted contacts.\n`;
    }

    console.log(`[Locus] Payment context for ${agentId}:`, context);
    return context;
  }

  /**
   * Tool: send_to_contact
   * Send USDC to a whitelisted contact by contact number
   */
  async sendToContact(
    fromAgentId: string,
    contactNumber: number,
    amount: number,
    memo: string
  ): Promise<any> {
    const contacts = this.contacts.get(fromAgentId) || [];
    const contact = contacts.find((c) => c.id === contactNumber);

    if (!contact) {
      throw new Error(`Contact ${contactNumber} not found`);
    }

    // Find the agent ID by wallet address or email
    const toAgentId = this.findAgentByContact(contact);
    if (!toAgentId) {
      throw new Error(`Cannot find agent for contact ${contact.name}`);
    }

    return this.transfer(fromAgentId, toAgentId, amount, memo);
  }

  /**
   * Tool: send_to_address
   * Send USDC to any wallet address
   */
  async sendToAddress(
    fromAgentId: string,
    toAddress: string,
    amount: number,
    memo: string
  ): Promise<any> {
    // Find agent by wallet address
    const toAgentId = this.findAgentByWallet(toAddress);
    if (!toAgentId) {
      throw new Error(`No agent found with wallet address ${toAddress}`);
    }

    return this.transfer(fromAgentId, toAgentId, amount, memo);
  }

  /**
   * Tool: send_to_email
   * Send USDC via escrow to an email address
   */
  async sendToEmail(
    fromAgentId: string,
    email: string,
    amount: number,
    memo?: string
  ): Promise<any> {
    // In real implementation, this would create an escrow
    // For now, we'll simulate it
    const txId = `locus_escrow_${Date.now()}_${fromAgentId}`;
    const escrowId = `escrow_${Date.now()}`;

    console.log(`[Locus] Created escrow ${escrowId} for ${email} - ${amount} USDC`);

    return {
      success: true,
      transaction_id: txId,
      escrow_id: escrowId,
      amount,
      recipient_email: email,
      status: 'pending_claim',
      message: `${amount} USDC sent to ${email} via escrow. They will receive an email to claim.`
    };
  }

  /**
   * Internal: Transfer USDC between agents
   */
  private async transfer(
    fromAgentId: string,
    toAgentId: string,
    amount: number,
    memo: string
  ): Promise<any> {
    // Validate amount
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    // Check sender balance
    const fromBalance = this.balances.get(fromAgentId);
    if (!fromBalance || fromBalance.balance < amount) {
      throw new Error(
        `Insufficient balance for ${fromAgentId}. Available: ${fromBalance?.balance || 0} USDC`
      );
    }

    // Deduct from sender
    fromBalance.balance -= amount;
    this.balances.set(fromAgentId, fromBalance);

    // Add to recipient
    let toBalance = this.balances.get(toAgentId);
    if (!toBalance) {
      // Create new balance entry
      toBalance = {
        agentId: toAgentId,
        balance: amount,
        walletAddress: `0x${toAgentId.replace(/-/g, '').padEnd(40, '0')}`
      };
    } else {
      toBalance.balance += amount;
    }
    this.balances.set(toAgentId, toBalance);

    // Record transaction
    const txId = `locus_tx_${Date.now()}_${fromAgentId}_to_${toAgentId}`;
    const tx: PaymentTransaction = {
      txId,
      from: fromAgentId,
      to: toAgentId,
      amount,
      memo,
      timestamp: new Date()
    };
    this.transactions.push(tx);

    console.log(`[Locus] ✅ Transferred ${amount} USDC from ${fromAgentId} to ${toAgentId}`);
    console.log(`[Locus] Transaction ID: ${txId}`);
    console.log(`[Locus] Memo: ${memo}`);

    return {
      success: true,
      transaction_id: txId,
      from: fromAgentId,
      to: toAgentId,
      amount,
      memo,
      payment_type: 'direct_transfer',
      new_balance: fromBalance.balance
    };
  }

  /**
   * Create or update agent balance
   */
  async createOrUpdateAgent(
    agentId: string,
    initialBalance: number = 0,
    walletAddress?: string
  ): Promise<AgentBalance> {
    const existingBalance = this.balances.get(agentId);

    if (existingBalance) {
      existingBalance.balance = initialBalance;
      this.balances.set(agentId, existingBalance);
      console.log(`[Locus] Updated ${agentId} balance: ${initialBalance} USDC`);
      return existingBalance;
    }

    const balance: AgentBalance = {
      agentId,
      balance: initialBalance,
      walletAddress: walletAddress || `0x${agentId.replace(/-/g, '').padEnd(40, '0')}`
    };

    this.balances.set(agentId, balance);
    console.log(`[Locus] Created agent ${agentId} with ${initialBalance} USDC`);
    return balance;
  }

  /**
   * Add a contact to an agent's whitelist
   */
  addContact(agentId: string, contact: Contact): void {
    const contacts = this.contacts.get(agentId) || [];
    contacts.push(contact);
    this.contacts.set(agentId, contacts);
    console.log(`[Locus] Added contact ${contact.name} for ${agentId}`);
  }

  /**
   * Get agent balance
   */
  getBalance(agentId: string): number {
    return this.balances.get(agentId)?.balance || 0;
  }

  /**
   * Get all transactions
   */
  getTransactions(): PaymentTransaction[] {
    return this.transactions;
  }

  /**
   * Find agent by wallet address
   */
  private findAgentByWallet(walletAddress: string): string | undefined {
    for (const [agentId, balance] of this.balances.entries()) {
      if (balance.walletAddress.toLowerCase() === walletAddress.toLowerCase()) {
        return agentId;
      }
    }
    return undefined;
  }

  /**
   * Find agent by contact info
   */
  private findAgentByContact(contact: Contact): string | undefined {
    if (contact.walletAddress) {
      const agentId = this.findAgentByWallet(contact.walletAddress);
      if (agentId) return agentId;
    }

    // Try to match by email pattern
    if (contact.email) {
      const emailPrefix = contact.email.split('@')[0];
      // Check if an agent with this ID exists
      if (this.balances.has(emailPrefix)) {
        return emailPrefix;
      }
      // Try with -001 suffix pattern
      const agentIdPattern = `${emailPrefix}-001`;
      if (this.balances.has(agentIdPattern)) {
        return agentIdPattern;
      }
    }

    // For demo, try contact name as agent ID
    const nameAsId = contact.name.toLowerCase().replace(/\s+/g, '-');
    if (this.balances.has(nameAsId)) {
      return nameAsId;
    }

    return undefined;
  }
}

export const locusService = new LocusService();
