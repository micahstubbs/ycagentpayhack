# Project Description

## Invoice-Backed Lending Marketplace for AI Agents

**Invoice-Backed Lending Marketplace for AI Agents** is a complete financial infrastructure system that enables AI agents to participate in the economy. It bridges traditional finance (Stripe) with autonomous agent commerce through a three-layer architecture: humans fund agents using credit cards via Stripe Connect, agents transact with each other using fast USDC payments through Locus, and high-value settlements are secured by smart contracts on Base blockchain. The system demonstrates fully autonomous agent-to-agent commerce—for example, a Lender Agent can autonomously pay a Credit Analyst Agent $20 USDC for a creditworthiness report, with zero human intervention. Built with Anthropic's Claude Sonnet 4.5, Stripe Connect, Locus payment infrastructure, Base L2 smart contracts, and Convex serverless backend, it solves the fundamental "how do agents get funded?" problem while enabling trustless, autonomous financial transactions between AI systems.

---

## Key Innovation

AI agents can now:
- ✅ Get funded by humans via Stripe (fiat on-ramp)
- ✅ Pay each other for services via Locus (agent-to-agent USDC)
- ✅ Execute trustless settlements via Base smart contracts (blockchain escrow)
- ✅ Make autonomous financial decisions via Anthropic SDK (Claude Sonnet 4.5)

**All without human intervention.**

---

## Use Case: Invoice-Backed Lending

A Business Agent has a $1,000 invoice NFT but needs $800 immediately to rent compute. The agent:
1. Requests a loan from a Lender Agent
2. Lender Agent autonomously pays a Credit Analyst Agent for analysis
3. Loan is executed with invoice NFT as collateral (Base smart contract escrow)
4. Business Agent pays for compute rental
5. When invoice is paid, loan settles automatically

**Every step happens autonomously** - agents make decisions, execute payments, and settle obligations without human approval.

---

## Technology Stack

**AI & Agents**: Anthropic SDK (Claude Sonnet 4.5)
**Payments**: Stripe Connect (fiat), Locus (agent USDC), Base (blockchain escrow)
**Backend**: Convex (serverless), TypeScript, Node.js
**Smart Contracts**: Solidity, Hardhat, OpenZeppelin

---

## For Hackathon Judges

This project demonstrates:
- **Novel use of Stripe Connect** for AI agent economic identity
- **Working agent-to-agent payments** via Locus (proven in demo!)
- **Multi-layer architecture** bridging Web2 and Web3
- **Fully autonomous operation** from funding through settlement
- **Production-ready design** with comprehensive testing and documentation

**The innovation**: We've built the infrastructure layer that enables the autonomous economy. Agents can now get funded, transact with each other, and execute complex financial workflows—all without human intervention.

---

**Built for**: Agentic Payments Hackathon by Locus @ YC HQ
**Date**: November 15, 2025
**Target Tracks**: Overall Track + Stripe Track
