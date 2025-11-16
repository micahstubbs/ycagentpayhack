/**
 * Seed Test Agents
 *
 * Creates test agents in Convex database for demo purposes.
 */

import { ConvexHttpClient } from "convex/browser";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const testAgents = [
  {
    agentId: "business-001",
    agentType: "business",
    stripeConnectAccountId: "acct_business_001",
    locusWalletAddress: "0x1111111111111111111111111111111111111111",
    baseWalletAddress: "0x2222222222222222222222222222222222222222",
  },
  {
    agentId: "lender-001",
    agentType: "lender",
    stripeConnectAccountId: "acct_lender_001",
    locusWalletAddress: "0x3333333333333333333333333333333333333333",
    baseWalletAddress: "0x4444444444444444444444444444444444444444",
  },
  {
    agentId: "analyst-001",
    agentType: "analyst",
    stripeConnectAccountId: "acct_analyst_001",
    locusWalletAddress: "0x5555555555555555555555555555555555555555",
    baseWalletAddress: "0x6666666666666666666666666666666666666666",
  },
];

async function main() {
  console.log("🌱 Seeding test agents...\n");

  try {
    for (const agent of testAgents) {
      console.log(`Creating agent: ${agent.agentId}...`);

      try {
        await client.mutation("agents:createAgent" as any, agent);
        console.log(`✅ Created ${agent.agentId}`);
      } catch (error: any) {
        if (error.message.includes("already exists")) {
          console.log(`⚠️  ${agent.agentId} already exists, skipping`);
        } else {
          throw error;
        }
      }
    }

    console.log("\n✅ Seeding complete!");
    console.log("\nCreated agents:");
    testAgents.forEach((agent) => {
      console.log(`  - ${agent.agentId} (${agent.agentType})`);
    });

    console.log("\n🚀 You can now run: npm run test:convex-agents");
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    console.error(error);
  }
}

main();
