Locus Hackathon Docs
Ctrl
k

    Introduction
    Getting Started
    MCP Spec

Powered by GitBook

    Overview
    Authentication
    Built-in Payment Tools
    x402 Tools
    Scope System
    x402 Tool Lifecycle
    Architecture Summary
    Key Features
    Summary

MCP Spec
Overview

The AgentPay MCP (Model Context Protocol) server provides AI agents with tools for executing cryptocurrency payments and accessing paid API services. The server supports two categories of tools:

    Built-in Payment Tools - Core payment functionality for sending USDC

    x402 Tools - Dynamically generated tools for accessing paid API services using the x402 protocol

All tools are scope-based and require OAuth 2.0 Client Credentials authentication or API key authentication.
Authentication

The MCP server supports two authentication flows:
OAuth 2.0 Client Credentials (M2M)

    Standard machine-to-machine authentication

    JWT tokens issued by AWS Cognito

    Scopes determine tool access

API Key Authentication

    Custom API keys prefixed with locus_

    Backend validates key and returns associated OAuth client scopes

    Simpler authentication for testing and development

Built-in Payment Tools
1. get_payment_context

Description: Get payment context including budget status and whitelisted contacts

Required Scope: payment_context:read

Parameters: None

Returns: String containing:

    Current budget status

    Available balance

    Whitelisted contacts with numbers

    Payment capabilities

Example Response:

Budget Status: Active
Available Balance: 100.50 USDC
Whitelisted Contacts:
  1. Alice (alice@example.com)
  2. Bob (bob@example.com)

2. send_to_contact

Description: Send USDC to a whitelisted contact by contact number

Required Scope: contact_payments:write

Parameters:

    contact_number (number, required) - Contact number from your whitelisted contacts (1, 2, 3...)

    amount (number, required) - Amount in USDC to send (must be positive)

    memo (string, required) - Payment memo/description

Returns:

    Success message with transaction details

    Transaction ID

    Payment type (direct wallet or escrow)

    Contact information

    Escrow ID (if applicable)

Example:

{
  contact_number: 1,
  amount: 10.50,
  memo: "Lunch payment"
}

3. send_to_address

Description: Send USDC to any wallet address

Required Scope: address_payments:write

Parameters:

    address (string, required) - Recipient wallet address (0x...)

    amount (number, required) - Amount in USDC to send (must be positive)

    memo (string, required) - Payment memo/description

Returns:

    Transaction ID

    Amount sent

    Recipient address

    Payment status

Example:

{
  address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  amount: 25.00,
  memo: "Payment for services"
}

4. send_to_email

Description: Send USDC via escrow to an email address

Required Scope: email_payments:write

Parameters:

    email (string, required) - Recipient email address (must be valid email)

    amount (number, required) - Amount in USDC to send (must be positive)

    memo (string, optional) - Payment memo/description

Returns:

    Transaction ID

    Escrow ID

    Amount sent

    Recipient email

    Payment status

Use Case: Send payment to someone who doesn't have a wallet yet. They'll receive an email to claim the funds.

Example:

{
  email: "recipient@example.com",
  amount: 15.00,
  memo: "Payment for consulting"
}

5. send_to_sms (Coming Soon)

Description: Send USDC via escrow to a phone number

Required Scope: sms_payments:write

Status: Currently commented out in code, planned for future implementation
x402 Tools
What is x402?

x402 is a protocol for micropayments to API services. Instead of API keys and subscriptions, services can charge small amounts of USDC per request. The protocol standardizes:

    Payment metadata and amounts

    Request/response schemas

    Settlement flow

    Discovery via Coinbase Bazaar

x402 Tool Generation Process

x402 tools are dynamically generated at runtime based on approved endpoints for each policy group. Here's how it works:

1. Endpoint Discovery

The backend fetches available x402 endpoints from the Coinbase Bazaar API:

// BazaarDiscoveryService.fetchBazaarCatalog()
const response = await fetch(
  'https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources'
);

Endpoints are cached in the database with:

    Resource URL

    Input/output schemas

    Payment details (cost, network, recipient)

    Method (GET/POST)

    Description

2. Policy Group Approval

Endpoints must be approved for a policy group before they become available as tools:

// X402EndpointService.approveEndpoint()
await prisma.x402EndpointApproval.create({
  data: {
    policyGroupId: "policy-123",
    x402EndpointId: "endpoint-456",
    isActive: true
  }
});

3. Tool Name Generation

Tool names are automatically generated from endpoint URLs:

// BazaarDiscoveryService.generateToolName()
function generateToolName(resource: string): string {
  // Extract last path segment
  // Example: https://api.example.com/v1/get-news -> "get_news"
  
  const url = new URL(resource);
  const segments = url.pathname.split('/').filter(s => s.length > 0);
  const lastSegment = segments[segments.length - 1] || 'tool';
  
  // Sanitize: lowercase, replace non-alphanumeric with underscore
  const sanitized = lastSegment
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  
  // Ensure starts with letter
  if (!/^[a-z]/.test(sanitized)) {
    return `x402_${sanitized}`;
  }
  
  return sanitized;
}

Examples:

    https://api.weather.com/v1/forecast → forecast

    https://news-api.com/get-headlines → get_headlines

    https://api.example.com/123-data → x402_123_data (prepends x402_ if doesn't start with letter)

4. Schema Mapping

x402 input schemas (JSON Schema format) are converted to Zod schemas for MCP:

// mergeX402SchemasToZod() in schema-mapper.ts
function mergeX402SchemasToZod(x402Schema: X402InputSchema): z.ZodObject<any> {
  // Merges URL parameters, query parameters, and body schema
  // into a single Zod object schema
  
  const shape: Record<string, z.ZodType<any>> = {};
  
  // Map URL params
  for (const param of x402Schema.urlParameters || []) {
    shape[param.name] = createZodTypeFromParam(param);
  }
  
  // Map query params
  for (const param of x402Schema.queryParameters || []) {
    shape[param.name] = createZodTypeFromParam(param);
  }
  
  // Map body schema
  if (x402Schema.body) {
    Object.assign(shape, mapBodySchema(x402Schema.body));
  }
  
  return z.object(shape);
}

5. Tool Execution Flow

When an agent calls an x402 tool:

┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────────┐
│  Agent  │────▶│   MCP   │────▶│ Backend │────▶│ x402 Endpoint│
└─────────┘     └─────────┘     └─────────┘     └─────────────┘
                                      │
                                      ├─ Validates auth
                                      ├─ Creates payment
                                      ├─ Sends USDC on Base
                                      ├─ Includes payment proof
                                      └─ Returns API response

Steps:

    Agent calls tool with parameters

    MCP handler receives call and forwards to backend proxy

    Backend (/api/mcp/x402-proxy):

        Validates endpoint approval

        Creates x402 payment transaction

        Sends USDC to endpoint's payment address

        Includes payment proof in request headers

        Forwards request to actual x402 endpoint

    x402 endpoint validates payment and returns data

    Response flows back to agent

x402 Tool Naming Examples

Here are real examples of x402 tools generated from the Coinbase Bazaar:
Resource URL
Generated Tool Name

https://api.weather.com/v1/forecast

forecast

https://news-api.com/get-headlines

get_headlines

https://crypto-api.com/price-data

price_data

https://api.example.com/v2/sentiment-analysis

sentiment_analysis

https://api.maps.com/geocode

geocode
x402 Tool Description Format

Each x402 tool includes payment information in its description:

Call Weather Forecast API (Cost: 0.01 USDC)

Format: {original_description} (Cost: {amount} USDC)
x402 Payment Configuration

Each x402 tool includes payment metadata:

interface X402PaymentConfig {
  asset: string;              // "USDC"
  network: string;            // "base-mainnet"
  maxAmountRequired: string;  // "10000" (in smallest units, 6 decimals)
  maxTimeoutSeconds: number;  // 300
  payTo: string;             // Recipient wallet address
  scheme: string;            // "x402"
}

x402 Error Handling

The system provides friendly error messages for common issues:

    AA24_SIGNATURE_ERROR → "Payment failed due to invalid session key. Rotate the session key and retry."

    ENDPOINT_DECOMPRESSION_FAILED → "Remote endpoint error. Retry later or use different endpoint."

    HTTP 404/405 → "Endpoint not available. Service may be down or removed."

Scope System

The MCP server uses OAuth scopes to control tool access:
Scope
Tools Granted
Description

payment_context:read

get_payment_context

Minimum scope to connect

contact_payments:write

send_to_contact

Send to whitelisted contacts

address_payments:write

send_to_address

Send to any wallet address

email_payments:write

send_to_email

Send via email escrow

sms_payments:write

send_to_sms

Send via SMS escrow (future)

x402:execute

All approved x402 tools

Execute x402 API calls

Note: x402 tools require the x402:execute scope. Individual endpoints are controlled by policy group approvals, not scopes.
x402 Tool Lifecycle
Adding New Endpoints

    Discovery: Run backend sync script to fetch from Bazaar

npm run sync:x402-endpoints

Review: Check endpoints in admin UI at /admin/x402-endpoints

Approve: Approve endpoints for policy groups

    curl -X POST /api/x402/endpoints/{id}/approve \
      -H "Authorization: Bearer $TOKEN" \
      -d '{"policyGroupId": "policy-123"}'

    Available: Tools automatically available on next client connection

Removing Endpoints

    Deactivate: Set approval to inactive

    Tools: Removed on next client reconnection

    No disruption: Active sessions continue with existing tools

Architecture Summary

┌──────────────────────────────────────────────────────────────┐
│                        AI Agent                              │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                   MCP Client Wrapper                         │
│  (@locus/mcp-client-credentials)                             │
│  - OAuth 2.0 Client Credentials flow                         │
│  - Auto-discovers tools from server                          │
│  - LangChain compatible                                      │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                    MCP Lambda Server                         │
│  - Validates OAuth tokens                                    │
│  - Registers built-in payment tools                          │
│  - Dynamically loads x402 tools from backend                 │
│  - Tool execution proxies to backend                         │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                      Backend API                             │
│  - Manages policy groups & approvals                         │
│  - Syncs x402 endpoints from Bazaar                          │
│  - Executes payments (smart wallet)                          │
│  - Proxies x402 requests with payment proof                  │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                  x402 API Endpoints                          │
│  - Weather APIs, News APIs, Data APIs, etc.                  │
│  - Validate payment proof in request                         │
│  - Return data if payment valid                              │
└──────────────────────────────────────────────────────────────┘

Key Features
1. Dynamic Tool Generation

    Tools are generated at runtime based on policy group

    No hardcoded tool definitions

    Automatic schema conversion (JSON Schema → Zod)

2. Scope-Based Access Control

    Fine-grained permissions via OAuth scopes

    Built-in tools controlled by scopes

    x402 tools controlled by policy group approvals

3. Automatic Payment Handling

    Payments happen transparently during x402 tool calls

    Smart wallet manages USDC transfers

    Payment proofs included in API requests

4. LangChain Integration

    Tools are LangChain DynamicStructuredTools

    Compatible with LangGraph agents

    Works with any LangChain LLM

5. Error Resilience

    Friendly error messages for payment failures

    Automatic retry suggestions

    Endpoint availability detection

Summary

The AgentPay MCP server provides:

    4 built-in payment tools for sending USDC (contacts, addresses, email escrow)

    Dynamic x402 tools generated from Coinbase Bazaar endpoints

    OAuth 2.0 authentication with scope-based access control

    Automatic payment handling for x402 API requests

    LangChain integration for AI agent workflows

x402 tools are generated by:

    Discovering endpoints from Bazaar API

    Approving endpoints for policy groups

    Generating tool names from URLs

    Converting schemas (JSON Schema → Zod)

    Registering tools with MCP server at connection time

    Proxying calls through backend with automatic payment

This enables AI agents to autonomously pay for and access external API services using cryptocurrency micropayments.
PreviousGetting Started

Last updated 3 hours ago
