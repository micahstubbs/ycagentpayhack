import { AgentIdentity, AgentType } from '../types/agent.types';
import { stripeService } from './stripe.service';
import { locusService } from './locus.service';
import * as fs from 'fs';
import * as path from 'path';

const REGISTRY_FILE = path.join(__dirname, '../../data/agent-registry.json');

export class AgentRegistryService {
  private agents: Map<string, AgentIdentity> = new Map();

  constructor() {
    this.loadRegistry();
  }

  private loadRegistry() {
    try {
      if (fs.existsSync(REGISTRY_FILE)) {
        const data = JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf-8'));
        this.agents = new Map(Object.entries(data));
        console.log(`Loaded ${this.agents.size} agents from registry`);
      }
    } catch (error) {
      console.error('Error loading agent registry:', error);
    }
  }

  private saveRegistry() {
    try {
      const dir = path.dirname(REGISTRY_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const data = Object.fromEntries(this.agents);
      fs.writeFileSync(REGISTRY_FILE, JSON.stringify(data, null, 2));
      console.log('Agent registry saved');
    } catch (error) {
      console.error('Error saving agent registry:', error);
    }
  }

  async createAgent(agentId: string, agentType: AgentType): Promise<AgentIdentity> {
    if (this.agents.has(agentId)) {
      throw new Error(`Agent ${agentId} already exists`);
    }

    console.log(`Creating agent: ${agentId} (${agentType})...`);

    // Create Stripe Connect account
    const stripeConnectAccountId = await stripeService.createConnectAccount(
      agentId,
      agentType
    );

    // Create Locus wallet
    const locusWalletAddress = await locusService.createWallet(agentId);

    // Mock Base wallet (in real implementation, generate from private key)
    const baseWalletAddress = `0x${agentId.replace(/-/g, '').padEnd(40, '0')}`;

    const agent: AgentIdentity = {
      agentId,
      agentType,
      stripeConnectAccountId,
      locusWalletAddress,
      baseWalletAddress,
    };

    this.agents.set(agentId, agent);
    this.saveRegistry();

    console.log(`Agent created: ${agentId}`);
    return agent;
  }

  getAgent(agentId: string): AgentIdentity | undefined {
    return this.agents.get(agentId);
  }

  getAllAgents(): AgentIdentity[] {
    return Array.from(this.agents.values());
  }

  getAgentsByType(agentType: AgentType): AgentIdentity[] {
    return this.getAllAgents().filter((agent) => agent.agentType === agentType);
  }
}

export const agentRegistry = new AgentRegistryService();
