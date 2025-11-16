/**
 * Test Convex Agent System
 *
 * Run this to test agents running in Convex.
 */

import { ConvexHttpClient } from "convex/browser";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function main() {
  console.log("🧪 Testing Convex Agent System\n");

  try {
    // Test 1: Run a single agent
    console.log("Test 1: Running business agent...\n");
    const result = await client.action("agentOrchestrator:runAgentById" as any, {
      agentId: "business-001",
      initialMessage: "Check your inbox and assess your situation.",
      maxTurns: 3,
    });

    console.log("\n✅ Agent completed!");
    console.log("Final response:", result.finalResponse);
    console.log("Total tool calls:", result.totalToolCalls);
    console.log("Turns:", result.turns.length);

    // Test 2: Run loan workflow demo
    console.log("\n\nTest 2: Running loan workflow demo...\n");
    const workflowResult = await client.action(
      "agentOrchestrator:runLoanWorkflowDemo" as any,
      {}
    );

    console.log("\n✅ Workflow completed!");
    console.log("Steps:", workflowResult.steps.length);
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    console.error(error);
  }
}

main();
