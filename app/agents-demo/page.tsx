"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Bot,
  MessageSquare,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function AgentsDemoPage() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [expandedTurn, setExpandedTurn] = useState<number | null>(null);
  const [agentResults, setAgentResults] = useState<any>(null);
  const [currentExecutionId, setCurrentExecutionId] = useState<any>(null);
  const [isWorkflow, setIsWorkflow] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Query agents from database
  const agents = useQuery(api.agents.getAllAgents, {});
  const messages = useQuery(
    api.agentCommunication.getAllMessages,
    selectedAgent ? { agentId: selectedAgent, limit: 50 } : "skip"
  );
  const executionHistory = useQuery(
    api.agentRunner.getExecutionHistory,
    selectedAgent ? { agentId: selectedAgent, limit: 10 } : "skip"
  );
  // Get logs for single agent or workflow
  const singleAgentLogs = useQuery(
    api.agentRunner.getLatestLogs,
    isRunning && selectedAgent && !isWorkflow ? { agentId: selectedAgent } : "skip"
  );
  
  const workflowLogs = useQuery(
    api.agentRunner.getLogsForAgents,
    isRunning && isWorkflow ? { agentIds: ["business-001", "analyst-001", "lender-001"] } : "skip"
  );

  const logs = isWorkflow ? workflowLogs : singleAgentLogs;

  // Auto-scroll to bottom when new logs appear
  useEffect(() => {
    if (logs && logs.length > 0) {
      logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs?.length]);

  // Debug
  console.log("Logs query:", { isRunning, selectedAgent, isWorkflow, logsCount: logs?.length });

  // Action to run agent
  const runAgent = useAction(api.agentOrchestrator.runAgentById);
  const runWorkflow = useAction(api.agentOrchestrator.runLoanWorkflowDemo);

  const handleRunAgent = async () => {
    if (!selectedAgent) return;

    setIsRunning(true);
    setIsWorkflow(false);
    setAgentResults(null);
    setCurrentExecutionId(null);

    try {
      const result = await runAgent({
        agentId: selectedAgent,
        maxTurns: 5,
      });
      setAgentResults(result);
      setCurrentExecutionId(result.executionId);
    } catch (error: any) {
      console.error("Error running agent:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunWorkflow = async () => {
    setIsRunning(true);
    setIsWorkflow(true);
    setAgentResults(null);
    setCurrentExecutionId(null);
    setSelectedAgent(null);

    try {
      const result = await runWorkflow({});
      setAgentResults(result);
    } catch (error: any) {
      console.error("Error running workflow:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setSelectedAgent(null);
    setAgentResults(null);
    setExpandedTurn(null);
    setCurrentExecutionId(null);
    setIsWorkflow(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">AI Agents Demo</h1>
              <p className="text-sm text-muted-foreground">
                Watch autonomous agents orchestrate invoice-backed loans
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Agent Selection & Controls */}
          <div className="space-y-6">
            {/* Agent List */}
            <div className="border rounded-lg p-6 bg-card">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Available Agents
              </h3>

              {!agents && (
                <div className="text-center py-8 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  Loading agents...
                </div>
              )}

              {agents && agents.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                  <p className="text-sm">No agents found</p>
                  <p className="text-xs mt-1">
                    Create agents using the Convex dashboard
                  </p>
                </div>
              )}

              <div className="space-y-2">
                {agents?.map((agent) => (
                  <button
                    key={agent._id}
                    onClick={() => setSelectedAgent(agent.agentId)}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      selectedAgent === agent.agentId
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded ${
                          selectedAgent === agent.agentId
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {agent.agentId}
                        </div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {agent.agentType}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className="border rounded-lg p-6 bg-card space-y-3">
              <h3 className="font-semibold mb-4">Actions</h3>

              <Button
                onClick={handleRunAgent}
                disabled={!selectedAgent || isRunning}
                className="w-full"
                size="lg"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run Selected Agent
                  </>
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <Button
                onClick={handleRunWorkflow}
                disabled={isRunning}
                variant="outline"
                className="w-full"
                size="lg"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run Full Workflow
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center mt-2">
                Full workflow runs all 3 agents in sequence
              </p>
            </div>

            {/* Agent Info */}
            {selectedAgent && agents && (
              <div className="border rounded-lg p-6 bg-card">
                <h3 className="font-semibold mb-4">Agent Details</h3>
                {(() => {
                  const agent = agents.find((a) => a.agentId === selectedAgent);
                  if (!agent) return null;
                  return (
                    <div className="space-y-3 text-sm">
                      <div>
                        <div className="text-muted-foreground">Agent ID</div>
                        <div className="font-mono text-xs">{agent.agentId}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Type</div>
                        <div className="capitalize">{agent.agentType}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Locus Wallet</div>
                        <div className="font-mono text-xs truncate">
                          {agent.locusWalletAddress}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Base Wallet</div>
                        <div className="font-mono text-xs truncate">
                          {agent.baseWalletAddress}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Execution History */}
            {executionHistory && executionHistory.length > 0 && (
              <div className="border rounded-lg p-6 bg-card">
                <h3 className="font-semibold mb-4">Execution History</h3>
                <div className="space-y-2">
                  {executionHistory.map((exec: any) => (
                    <div
                      key={exec._id}
                      className="p-3 border rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-muted-foreground">
                          {new Date(exec.startTime).toLocaleString()}
                        </div>
                        <div
                          className={`text-xs px-2 py-1 rounded ${
                            exec.status === "completed"
                              ? "bg-green-100 text-green-600 dark:bg-green-900/30"
                              : exec.status === "failed"
                              ? "bg-red-100 text-red-600 dark:bg-red-900/30"
                              : "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30"
                          }`}
                        >
                          {exec.status}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Turns:</span>{" "}
                          {exec.turns}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Tools:</span>{" "}
                          {exec.toolCalls}
                        </div>
                      </div>
                      {exec.error && (
                        <div className="mt-2 text-xs text-red-600">
                          Error: {exec.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Middle: Execution Results */}
          <div className="lg:col-span-2 space-y-6">
            {!agentResults && !isRunning && (
              <div className="border rounded-lg p-12 bg-card text-center">
                <Bot className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">
                  Ready to Run Agents
                </h3>
                <p className="text-muted-foreground">
                  Select an agent and click "Run" to see it in action
                </p>
              </div>
            )}

            {isRunning && (
              <div className="border rounded-lg p-6 bg-card">
                <div className="text-center mb-4">
                  <Loader2 className="h-10 w-10 mx-auto mb-3 text-primary animate-spin" />
                  <h3 className="text-lg font-semibold mb-1">Agent Running...</h3>
                  <p className="text-muted-foreground text-xs">
                    Watch the execution in real-time
                  </p>
                </div>

                {/* Real-time logs - BIGGER */}
                <div className="border rounded-lg p-4 bg-muted/30 h-[600px] overflow-y-auto">
                  {!logs || logs.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      <Loader2 className="h-6 w-6 mx-auto mb-2 animate-spin" />
                      Waiting for logs...
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {logs.map((log: any, idx: number) => (
                        <div
                          key={idx}
                          className={`p-3 rounded text-sm ${
                            log.level === "error"
                              ? "bg-red-100 dark:bg-red-900/20 text-red-900 dark:text-red-100"
                              : log.level === "tool"
                              ? "bg-blue-100 dark:bg-blue-900/20"
                              : log.level === "thinking"
                              ? "bg-purple-100 dark:bg-purple-900/20"
                              : "bg-background"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                            {log.agentId && (
                              <span className="text-xs font-mono px-2 py-0.5 rounded bg-muted whitespace-nowrap">
                                {log.agentId}
                              </span>
                            )}
                            <span className="flex-1">{log.message}</span>
                          </div>
                          {log.data && (
                            <pre className="mt-2 text-xs p-2 bg-black/5 dark:bg-white/5 rounded overflow-x-auto">
                              {JSON.stringify(log.data, null, 2)}
                            </pre>
                          )}
                        </div>
                      ))}
                      {/* Scroll anchor */}
                      <div ref={logsEndRef} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {agentResults && !agentResults.workflow && (
              <div className="space-y-6">
                {/* Summary */}
                <div className="border rounded-lg p-6 bg-card">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">
                        Agent Completed Successfully
                      </h3>
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div>
                          <div className="text-sm text-muted-foreground">
                            Total Turns
                          </div>
                          <div className="text-2xl font-bold">
                            {agentResults.turns?.length || 0}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">
                            Tool Calls
                          </div>
                          <div className="text-2xl font-bold">
                            {agentResults.totalToolCalls || 0}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">
                            Status
                          </div>
                          <div className="text-sm font-semibold text-green-600">
                            Complete
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Final Response */}
                <div className="border rounded-lg p-6 bg-card">
                  <h3 className="font-semibold mb-3">Final Response</h3>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">
                      {agentResults.finalResponse}
                    </p>
                  </div>
                </div>

                {/* Turns */}
                <div className="border rounded-lg p-6 bg-card">
                  <h3 className="font-semibold mb-4">Execution Timeline</h3>
                  <div className="space-y-3">
                    {agentResults.turns?.map((turn: any, idx: number) => (
                      <div
                        key={idx}
                        className="border rounded-lg overflow-hidden"
                      >
                        <button
                          onClick={() =>
                            setExpandedTurn(expandedTurn === idx ? null : idx)
                          }
                          className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded bg-primary/10 text-primary">
                              <Clock className="h-4 w-4" />
                            </div>
                            <div className="text-left">
                              <div className="font-medium">
                                Turn {turn.turnNumber}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {turn.toolCalls?.length || 0} tool calls
                              </div>
                            </div>
                          </div>
                          {expandedTurn === idx ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>

                        {expandedTurn === idx && (
                          <div className="p-4 border-t bg-muted/30 space-y-4">
                            {turn.thinking && (
                              <div>
                                <div className="text-sm font-medium mb-2">
                                  Thinking
                                </div>
                                <div className="text-sm text-muted-foreground p-3 bg-background rounded">
                                  {turn.thinking}
                                </div>
                              </div>
                            )}

                            {turn.toolCalls && turn.toolCalls.length > 0 && (
                              <div>
                                <div className="text-sm font-medium mb-2">
                                  Tool Calls
                                </div>
                                <div className="space-y-2">
                                  {turn.toolCalls.map(
                                    (call: any, callIdx: number) => (
                                      <div
                                        key={callIdx}
                                        className="p-3 bg-background rounded"
                                      >
                                        <div className="font-mono text-xs font-semibold mb-2">
                                          {call.toolName}
                                        </div>
                                        <div className="text-xs space-y-1">
                                          <div>
                                            <span className="text-muted-foreground">
                                              Input:
                                            </span>
                                            <pre className="mt-1 p-2 bg-muted/50 rounded overflow-x-auto">
                                              {JSON.stringify(
                                                call.input,
                                                null,
                                                2
                                              )}
                                            </pre>
                                          </div>
                                          <div>
                                            <span className="text-muted-foreground">
                                              Result:
                                            </span>
                                            <pre className="mt-1 p-2 bg-muted/50 rounded overflow-x-auto">
                                              {JSON.stringify(
                                                call.result,
                                                null,
                                                2
                                              )}
                                            </pre>
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}

                            {turn.response && (
                              <div>
                                <div className="text-sm font-medium mb-2">
                                  Response
                                </div>
                                <div className="text-sm text-muted-foreground p-3 bg-background rounded">
                                  {turn.response}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {agentResults && agentResults.workflow && (
              <div className="space-y-6">
                <div className="border rounded-lg p-6 bg-card">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">
                        Workflow Completed
                      </h3>
                      <p className="text-muted-foreground">
                        All {agentResults.steps?.length || 0} agents executed
                        successfully
                      </p>
                    </div>
                  </div>
                </div>

                {agentResults.steps?.map((step: any, idx: number) => (
                  <div key={idx} className="border rounded-lg p-6 bg-card">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Bot className="h-5 w-5" />
                      {step.agent}
                    </h3>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Turns
                        </div>
                        <div className="text-xl font-bold">
                          {step.result.turns?.length || 0}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Tool Calls
                        </div>
                        <div className="text-xl font-bold">
                          {step.result.totalToolCalls || 0}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Status
                        </div>
                        <div className="text-sm font-semibold text-green-600">
                          Complete
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="text-sm font-medium mb-2">
                        Final Response
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {step.result.finalResponse}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Messages */}
            {messages && messages.length > 0 && (
              <div className="border rounded-lg p-6 bg-card">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Agent Messages ({messages.length})
                </h3>
                <div className="space-y-3">
                  {messages.map((msg: any) => (
                    <div
                      key={msg._id}
                      className="p-4 border rounded-lg bg-muted/30"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-medium text-sm">
                            From: {msg.from}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(msg.timestamp).toLocaleString()}
                          </div>
                        </div>
                        <div
                          className={`text-xs px-2 py-1 rounded ${
                            msg.read
                              ? "bg-muted text-muted-foreground"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {msg.read ? "Read" : "Unread"}
                        </div>
                      </div>
                      <div className="text-sm font-medium mb-1">
                        {msg.subject}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Type: {msg.type}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
