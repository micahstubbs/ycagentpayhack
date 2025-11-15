export type AgentType = 'business' | 'lender' | 'analyst';

export interface AgentIdentity {
  agentId: string;
  agentType: AgentType;
  stripeConnectAccountId: string;
  locusWalletAddress: string;
  baseWalletAddress: string;
}

export interface AgentBalances {
  stripe_usd: number;
  locus_usdc: number;
}
