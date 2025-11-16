"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect } from "react";
import { UserMenu } from "@/components/UserMenu";
import { 
  DollarSign, 
  Users, 
  Activity, 
  CheckCircle, 
  Building2, 
  Landmark, 
  BarChart3,
  ArrowRightLeft,
  TrendingUp
} from "lucide-react";

interface AgentBalance {
  agentId: string;
  totalUsdc: number;
  transactionCount: number;
}

export function FlowDashboard() {
  const agents = useQuery(api.agents.getAllAgents);
  const balances = useQuery(api.funding.getAllAgentBalances);
  const viewer = useQuery(api.users.viewer);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  const agentHistory = useQuery(
    api.funding.getAgentFundingHistory,
    selectedAgent ? { agentId: selectedAgent } : "skip"
  );

  // Calculate total volume
  const totalVolume = balances?.reduce((sum, b) => sum + b.totalUsdc, 0) || 0;
  const totalTransactions = balances?.reduce((sum, b) => sum + b.transactionCount, 0) || 0;

  return (
    <main className="flex max-h-screen grow flex-col overflow-hidden">
      {/* Header matching product page style */}
      <div className="flex items-start justify-between border-b p-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-lg font-semibold md:text-2xl">Agent Flow Dashboard</h1>
          <p className="hidden sm:block text-sm text-muted-foreground">
            Real-time monitoring of autonomous AI agent lending
          </p>
        </div>
        <UserMenu>{viewer?.name}</UserMenu>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto p-6 bg-background">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Volume"
            value={`${totalVolume} USDC`}
            icon={<DollarSign className="h-6 w-6" />}
          />
          <StatCard
            title="Active Agents"
            value={agents?.length || 0}
            icon={<Users className="h-6 w-6" />}
          />
          <StatCard
            title="Transactions"
            value={totalTransactions}
            icon={<Activity className="h-6 w-6" />}
          />
          <StatCard
            title="Success Rate"
            value="100%"
            icon={<CheckCircle className="h-6 w-6" />}
          />
        </div>

        {/* Agent Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {agents?.map((agent) => {
            const balance = balances?.find((b) => b.agentId === agent.agentId);
            return (
              <AgentCard
                key={agent.agentId}
                agent={agent}
                balance={balance}
                isSelected={selectedAgent === agent.agentId}
                onClick={() => setSelectedAgent(agent.agentId)}
              />
            );
          })}
        </div>

        {/* Transaction History */}
        {selectedAgent && agentHistory && (
          <div className="border rounded-lg p-6 mb-6 bg-card">
            <h2 className="text-xl font-semibold mb-4">
              Transaction History: {selectedAgent}
            </h2>
            <div className="space-y-3">
              {agentHistory.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No transactions yet
                </p>
              ) : (
                agentHistory.map((tx: any) => (
                  <TransactionItem key={tx._id} transaction={tx} />
                ))
              )}
            </div>
          </div>
        )}

        {/* Flow Visualization */}
        <div className="border rounded-lg p-6 bg-card">
          <h2 className="text-xl font-semibold mb-4">
            System Architecture
          </h2>
          <FlowVisualization balances={balances} />
        </div>
      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex items-center justify-between">
        <div className="text-muted-foreground">{icon}</div>
        <div className="text-right">
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-sm text-muted-foreground">{title}</div>
        </div>
      </div>
    </div>
  );
}

function AgentCard({
  agent,
  balance,
  isSelected,
  onClick,
}: {
  agent: any;
  balance?: AgentBalance;
  isSelected: boolean;
  onClick: () => void;
}) {
  const agentIcons: Record<string, React.ReactNode> = {
    lender: <Landmark className="h-8 w-8" />,
    business: <Building2 className="h-8 w-8" />,
    analyst: <BarChart3 className="h-8 w-8" />,
  };

  const icon = agentIcons[agent.agentType] || <Users className="h-8 w-8" />;

  return (
    <div
      onClick={onClick}
      className={`border rounded-lg p-4 bg-card cursor-pointer transition-all hover:border-primary ${
        isSelected ? "border-primary ring-2 ring-primary/20" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="text-muted-foreground">{icon}</div>
        <div className="text-right">
          <div className="text-sm font-medium uppercase tracking-wide">
            {agent.agentType}
          </div>
          <div className="text-xs text-muted-foreground">{agent.agentId}</div>
        </div>
      </div>

      <div className="border-t pt-3">
        <div className="text-2xl font-bold mb-1">
          {balance?.totalUsdc || 0} USDC
        </div>
        <div className="text-sm text-muted-foreground">
          {balance?.transactionCount || 0} transactions
        </div>
      </div>

      <div className="mt-3 text-xs text-muted-foreground space-y-1">
        <div>Stripe: {agent.stripeConnectAccountId.slice(0, 20)}...</div>
        <div>Base: {agent.baseWalletAddress.slice(0, 20)}...</div>
      </div>
    </div>
  );
}

function TransactionItem({ transaction }: { transaction: any }) {
  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  const statusColor = statusColors[transaction.status] || "bg-muted text-muted-foreground";

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />
          <div>
            <div className="font-semibold">
              {transaction.amountUsdc} USDC
            </div>
            <div className="text-sm text-muted-foreground">
              {new Date(transaction.createdAt).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden md:block">
          <div className="text-sm text-muted-foreground">
            {transaction.stripeTransferId.slice(0, 15)}...
          </div>
          {transaction.locusTransactionId && (
            <div className="text-xs text-muted-foreground">
              Locus: {transaction.locusTransactionId.slice(0, 15)}...
            </div>
          )}
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor}`}>
          {transaction.status}
        </span>
      </div>
    </div>
  );
}

function FlowVisualization({ balances }: { balances?: AgentBalance[] }) {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    { name: "Fund Lender", layer: "Fiat → Backend" },
    { name: "Mint Invoice NFT", layer: "Blockchain" },
    { name: "Request Loan", layer: "Agent Communication" },
    { name: "Pay Analyst", layer: "Locus Payment" },
    { name: "Credit Analysis", layer: "AI Processing" },
    { name: "Execute Loan", layer: "Smart Contract" },
    { name: "Pay Compute", layer: "Locus Payment" },
    { name: "Settle Loan", layer: "Smart Contract" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="relative">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
            style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className={`text-xs text-center transition-all ${
                idx <= activeStep ? "text-purple-600 font-bold" : "text-gray-400"
              }`}
            >
              {step.name}
            </div>
          ))}
        </div>
      </div>

      {/* Current Step */}
      <div className="border rounded-lg p-6 bg-primary/5">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <div className="text-sm text-muted-foreground">
            Step {activeStep + 1} of {steps.length}
          </div>
        </div>
        <div className="text-2xl font-bold mb-2">{steps[activeStep].name}</div>
        <div className="text-sm text-muted-foreground">{steps[activeStep].layer}</div>
      </div>

      {/* Layer Diagram */}
      <div className="grid grid-cols-4 gap-4">
        <LayerBox title="💳 Fiat" items={["Stripe", "User"]} />
        <LayerBox title="⚡ Backend" items={["Convex", "Webhooks"]} />
        <LayerBox title="💰 Payments" items={["Locus", "USDC"]} />
        <LayerBox title="⛓️ Blockchain" items={["Base", "NFT", "Escrow"]} />
      </div>
    </div>
  );
}

function LayerBox({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
      <div className="font-bold text-gray-800 mb-3">{title}</div>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="bg-white rounded px-3 py-2 text-sm text-gray-700 border border-gray-200"
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
