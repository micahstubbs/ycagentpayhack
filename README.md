# Invoice-Backed Lending for AI Agents

Built for the **Agentic Payments Hackathon** by Locus @ YC HQ

An autonomous agent marketplace where AI agents obtain liquidity by leveraging invoice NFTs as collateral. This project bridges traditional finance (Stripe) with the crypto-native agent economy (Locus + Base).

## 🎯 Overview

This project demonstrates:

- **Stripe Connect** - Fiat on-ramp for funding AI agents
- **Locus** - Agent-to-agent USDC payment infrastructure
- **Base L2** - Smart contracts for invoice NFTs and trustless escrow
- **Anthropic SDK** - Autonomous agent decision-making
- **Next.js + Convex** - Modern full-stack architecture

## 🚀 Tech Stack

- [Next.js](https://nextjs.org/) - React framework with App Router
- [Convex](https://convex.dev/) - Backend database and server logic
- [Convex Auth](https://labs.convex.dev/auth) - Authentication
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Stripe Connect](https://stripe.com/connect) - Agent funding infrastructure
- [Locus](https://paywithlocus.com/) - Agent payment rails
- [Base](https://base.org/) - L2 blockchain for smart contracts
- [Anthropic SDK](https://www.anthropic.com/) - AI agent orchestration

## 🎨 Landing Page Features

The landing page features an Apple-inspired minimal design:

- **Sophisticated Grid Animation** - Interactive mesh that responds to mouse movement
- **Neutral Monochrome Palette** - Clean blacks, whites, and grays for professional aesthetic
- **Refined Typography** - Large, bold headlines with careful spacing and hierarchy
- **Subtle Interactions** - Smooth hover states and transitions without distraction
- **Responsive Design** - Mobile-first approach optimized for all devices
- **Feature Cards** - Clean cards highlighting trustless escrow, agent economy, and instant liquidity

## 🏃 Get Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the landing page.

## 📁 Project Structure

```
├── app/
│   ├── (splash)/              # Landing page with canvas animation
│   │   └── GetStarted/        # Main landing component
│   ├── product/               # Demo application (requires sign-in)
│   ├── signin/                # Authentication page
│   └── layout.tsx             # Root layout with metadata
├── components/                # Reusable UI components
├── convex/                    # Backend logic and database
│   ├── auth.ts               # Authentication configuration
│   └── messages.ts           # Chat backend
├── Docs/                      # Project documentation
│   ├── plans/                # Design and implementation plans
│   └── *.md                  # Technical documentation
└── public/                    # Static assets
```

## 🎯 Key Features

### Landing Page

- **Canvas Animation** - Real-time particle network visualization
- **Responsive Design** - Works seamlessly on all devices
- **Dark/Light Mode** - Theme toggle support
- **Smooth Animations** - Hover effects and transitions

### Architecture

- **Hybrid Approach** - Off-chain coordination, on-chain settlement
- **Agent Tools** - Stripe, Locus, and Base smart contract integrations
- **Autonomous Flow** - End-to-end agent decision-making

## Configuring other authentication methods

To configure different authentication methods, see [Configuration](https://labs.convex.dev/auth/config) in the Convex Auth docs.

## Learn more

To learn more about developing your project with Convex, check out:

- The [Tour of Convex](https://docs.convex.dev/get-started) for a thorough introduction to Convex principles.
- The rest of [Convex docs](https://docs.convex.dev/) to learn about all Convex features.
- [Stack](https://stack.convex.dev/) for in-depth articles on advanced topics.

## Join the community

Join thousands of developers building full-stack apps with Convex:

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

# Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

- Join the [Convex Discord community](https://convex.dev/community) to get help in real-time.
- Follow [Convex on GitHub](https://github.com/get-convex/), star and contribute to the open-source implementation of Convex.
