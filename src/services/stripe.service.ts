import Stripe from 'stripe';
import * as dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});

export class StripeService {
  private useMock = !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('...');

  async createConnectAccount(
    agentId: string,
    agentType: string
  ): Promise<string> {
    // Use mock mode if no real API key
    if (this.useMock) {
      const mockAccountId = `acct_mock_${agentId}_${Date.now()}`;
      console.log(`[Mock Stripe] Created Connect account: ${mockAccountId}`);
      return mockAccountId;
    }

    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: `agent-${agentId}@platform.com`,
      capabilities: {
        transfers: { requested: true },
      },
      metadata: {
        agentId,
        agentType,
      },
    });

    return account.id;
  }

  async getConnectAccountBalance(accountId: string): Promise<number> {
    if (this.useMock) {
      console.log(`[Mock Stripe] Getting balance for account: ${accountId}`);
      return 0;
    }

    const balance = await stripe.balance.retrieve({
      stripeAccount: accountId,
    });

    // Return available balance in USD (convert from cents)
    return balance.available[0]?.amount / 100 || 0;
  }

  async createFundingPaymentIntent(
    agentId: string,
    amountUsd: number
  ): Promise<string> {
    if (this.useMock) {
      const mockSecret = `pi_mock_${agentId}_${Date.now()}_secret`;
      console.log(`[Mock Stripe] Created payment intent for $${amountUsd}`);
      return mockSecret;
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amountUsd * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        purpose: 'fund_agent',
        agentId,
      },
    });

    return paymentIntent.client_secret!;
  }

  async transferToConnectAccount(
    accountId: string,
    amountUsd: number,
    agentId: string
  ): Promise<string> {
    if (this.useMock) {
      const mockTransferId = `tr_mock_${agentId}_${Date.now()}`;
      console.log(`[Mock Stripe] Transferred $${amountUsd} to ${accountId}`);
      return mockTransferId;
    }

    const transfer = await stripe.transfers.create({
      amount: Math.round(amountUsd * 100), // Convert to cents
      currency: 'usd',
      destination: accountId,
      metadata: {
        agentId,
      },
    });

    return transfer.id;
  }

  async verifyWebhookSignature(
    payload: string | Buffer,
    signature: string
  ): Promise<Stripe.Event> {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  }
}

export const stripeService = new StripeService();
