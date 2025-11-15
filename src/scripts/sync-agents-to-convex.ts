import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Sync agents from file-based registry to Convex database
 *
 * This is a one-time migration script to move agents from
 * data/agent-registry.json into the Convex agents table.
 */

async function syncAgentsToConvex() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    console.error("Error: NEXT_PUBLIC_CONVEX_URL environment variable not set");
    process.exit(1);
  }

  console.log("Connecting to Convex...");
  const client = new ConvexHttpClient(convexUrl);

  // Load agents from file registry
  const registryPath = path.join(__dirname, "../../data/agent-registry.json");

  if (!fs.existsSync(registryPath)) {
    console.log("No agent registry file found. Nothing to sync.");
    return;
  }

  console.log(`Loading agents from ${registryPath}...`);
  const registryData = fs.readFileSync(registryPath, "utf-8");
  const registry = JSON.parse(registryData);

  // Convert registry object to array
  const agents = Object.values(registry) as Array<{
    agentId: string;
    agentType: string;
    stripeConnectAccountId: string;
    locusWalletAddress: string;
    baseWalletAddress: string;
  }>;

  console.log(`Found ${agents.length} agents to sync`);

  // Sync to Convex
  try {
    const result = await client.mutation(api.agents.syncAgentsFromRegistry, {
      agents,
    });

    console.log(`\nSync complete! Synced ${result.length} new agents to Convex:`);
    result.forEach((r: any) => {
      console.log(`  - ${r.agentId}`);
    });

    // Verify by querying all agents
    const allAgents = await client.query(api.agents.getAllAgents);
    console.log(`\nTotal agents in Convex: ${allAgents.length}`);

  } catch (error) {
    console.error("Error syncing agents:", error);
    process.exit(1);
  }

  console.log("\nAgent sync completed successfully!");
}

syncAgentsToConvex().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
