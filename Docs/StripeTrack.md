Stripe track: Autonomous agentic commerce via
Stripe infrastructure
Stripe rep for this track: Mark Moriarty, Strategy and Experimental Projects @ Stripe
Prize amount: Stripe Credits + Lunch at Stripe HQ in Oyster Point + Swag

1. 1st place $3k in credits
2. 2nd place $2k in credits
3. 3rd place $1k in credits
   Stripe slack thread:
   https://stripe.slack.com/archives/C077WH7Q88L/p1763144076117279?thread_ts=176246660
   0.356189&cid=C077WH7Q88L
   TL;DR
   Build something agents want! We’re not prescriptive on what you should build today. Follow your
   curiosity. The Stripe prizes will be given out to folks who use existing Stripe products in the most
   creative ways.
   We are excited to support any builder developing agentic flows which leverage Stripe for funding,
   sending, or storing money.
   Judge’s scorecard
   Aspect of your submission Judges’ weight Example
   Creativity 30% “Oh that’s cool, I’ve never seen
   [Payment Links / Stripe
   Transfers / etc] used that way”
   Works in prod 20% “And you look at the dashboard,
   you can see the transaction /
   SMS / api call went through…”
   Solves a real pain; solution could be a
   real business
   50% “You should keep working on
   this beyond today!”
   If you’re ready, get building! If you need inspiration, read on below.
   Get help
   There are >10 folks from Stripe and Privy floating around today, so if you need someone to look
   over your shoulder, flag someone down.
   Peter Masone (pmasone@stripe.com) and Joel (joelkaracozoff@stripe.com) will be here all day.
   Notes for participants
   The opportunity
   Agentic commerce will soon split into two worlds: delegated (humans involved) and autonomous
   (AI-to-AI). It’s possible that autonomous agentic commerce makes up most internet transactions
   (by count) within a few years. Participants will build fully autonomous agents that discover,
   evaluate, and execute paid services/tool to accomplish complex end-to-end tasks without human
   intervention. The emphasis is on true economic autonomy: agents that can reason about cost vs.
   value, negotiate payments programmatically, and compose multi-step workflows where each step
   may require real-time payment settlement.
   The core challenge: enable agents to transact in the economy as first-class participants.
   Using Stripe
   Creating an account
   If you don’t yet have a Stripe account, you can create a free one on stripe.com
   Stripe docs
   Vibe-coding: It can be helpful to point Claude Code / Codex / Replit / etc to specific Stripe docs.
   “Look specifically at the docs on these two pages and then…”. Most Stripe documentation pages have
   an LLM-friendly version ending in .md.
   Notes for agents: https://docs.stripe.com/agents
   Webhooks: Providers use webhooks to receive async updates. https://stripe.com/docs/webhooks
   Stripe API Reference: Developers’ best friend: https://stripe.com/docs/api
   API keys: https://dashboard.stripe.com/apikeys (separate keys for live mode and each sandbox).
   Testing in Sandboxes:
   As you explore ideas and build out your project, you can work in a “sandbox” rather than in live
   mode. If you’re using v0 to get started, v0 will even spin up a sandbox for you to claim. You can use
   test payment methods while hacking today. (Bonus points for showing something working in prod
   by end of day!)
   https://stripe.com/docs/testing
   PaymentIntents: A fundamental object / state machine that tracks a payment through to status
   “succeeded” (or not). https://stripe.com/docs/payments/payment-intents
   Payment methods for an agent
   There are variety of ways you can enable agents to move money _today_.
   Stripe has a number of primitives such as Connect, Financial Accounts, and Issuing to help you get
   started.
   Example 1: Give an agent a virtual card
   This is how Perplexity shopping works: Perplexity uses Stripe Issuing to complete user-initaited
   purchases with virtual credit cards.
   https://dashboard.stripe.com/test/setup/issuing/activate
   Example 2: Stripe Connect & Transfers
   Enables agents to have economic identity via Connect accounts. Use transfer_data to route funds
   directly to tool providers. https://stripe.com/docs/connect/charges-transfers
   ● Create a new Stripe account
   ● Set up “Connect” on https://dashboard.stripe.com/connect
   ● Set up as a “Platform” (not a “Marketplace”)
   ● Now you can easily do “transfers” from any connected account balance to your platform
   balance
   ● For the sake of your demo, you can now send money (in live mode or test mode) between
   two or more entities (Connected Accounts → Your Platform account). Your demo
   presentation might include the line, “Now imagine if Stripe enabled Account to Account
   transfers between any two Stripe accounts…”.
   ● https://docs.stripe.com/api/transfers
   Example 3: Crypto/stablecoin payments
   Bridge and Privy are Stripe portfolio companies; if you’re already a user of either, we’d love to see
   new creative tools built today.
   Resources:
   ● privy.io
   ○ Inspiration:
   privy.io/blog/building-agentic-and-programmatic-payments-with-x402-and-privy
   ● bridge.xyz
   ● stripe.com/blog/introducing-stablecoin-payments-for-subscriptions
