import * as dotenv from 'dotenv';

dotenv.config();

// Mock Locus service for hackathon
// Replace with real Locus SDK when available
export class LocusService {
  private balances: Map<string, number> = new Map();

  async depositUSDC(agentId: string, amount: number): Promise<string> {
    const currentBalance = this.balances.get(agentId) || 0;
    this.balances.set(agentId, currentBalance + amount);

    console.log(`[Locus] Deposited ${amount} USDC to agent ${agentId}`);
    console.log(`[Locus] New balance: ${this.balances.get(agentId)} USDC`);

    // Return mock transaction ID
    return `locus_tx_${Date.now()}_${agentId}`;
  }

  async getBalance(agentId: string): Promise<number> {
    return this.balances.get(agentId) || 0;
  }

  async transfer(
    fromAgentId: string,
    toAgentId: string,
    amount: number
  ): Promise<string> {
    const fromBalance = this.balances.get(fromAgentId) || 0;

    if (fromBalance < amount) {
      throw new Error(`Insufficient balance for agent ${fromAgentId}`);
    }

    // Deduct from sender
    this.balances.set(fromAgentId, fromBalance - amount);

    // Add to recipient
    const toBalance = this.balances.get(toAgentId) || 0;
    this.balances.set(toAgentId, toBalance + amount);

    console.log(`[Locus] Transferred ${amount} USDC from ${fromAgentId} to ${toAgentId}`);

    // Return mock transaction ID
    return `locus_tx_${Date.now()}_${fromAgentId}_to_${toAgentId}`;
  }

  async createWallet(agentId: string): Promise<string> {
    // Mock wallet address
    const walletAddress = `0x${agentId.padStart(40, '0')}`;
    this.balances.set(agentId, 0);

    console.log(`[Locus] Created wallet for agent ${agentId}: ${walletAddress}`);

    return walletAddress;
  }
}

export const locusService = new LocusService();
