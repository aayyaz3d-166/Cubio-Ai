/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-19: Mock Payment Provider
 *
 * Implements tokenized payment processing, subscription lifecycles,
 * and deterministic webhook signature verification without storing raw card data.
 */

import { deterministicHash } from '../../../state/determinism';
import {
  IPaymentProvider,
  ProcessPaymentInput,
  ProcessPaymentResult,
  CreateSubscriptionInput,
  CreateSubscriptionResult,
} from './types';

export class MockPaymentProvider implements IPaymentProvider {
  public readonly providerName = 'MOCK_PAYMENT_GATEWAY';
  private webhookSecret: string;

  constructor(webhookSecret: string = 'whsec_cubio_mock_secret_9988') {
    this.webhookSecret = webhookSecret;
  }

  public getWebhookSecret(): string {
    return this.webhookSecret;
  }

  public async processPayment(input: ProcessPaymentInput): Promise<ProcessPaymentResult> {
    // Fail if token explicitly specifies decline
    if (input.tokenizedPaymentMethodId.includes('decline')) {
      return {
        success: false,
        transactionId: `TXN_FAIL_${deterministicHash(`${input.customerId}:${Date.now()}`).slice(2, 12)}`,
        providerReference: 'ch_mock_declined',
        error: 'Payment method declined by issuing bank.',
      };
    }

    const now = Date.now();
    const transactionId = `TXN_${deterministicHash(`${input.customerId}:${input.amountCents}:${now}`).slice(2, 18)}`;

    return {
      success: true,
      transactionId,
      providerReference: `ch_mock_${transactionId.slice(4)}`,
    };
  }

  public async createSubscription(input: CreateSubscriptionInput): Promise<CreateSubscriptionResult> {
    if (input.tokenizedPaymentMethodId.includes('decline')) {
      return {
        success: false,
        subscriptionId: '',
        currentPeriodEnd: 0,
        error: 'Subscription creation declined: Invalid payment method.',
      };
    }

    const now = Date.now();
    const subscriptionId = `sub_mock_${deterministicHash(`${input.customerId}:${input.planId}:${now}`).slice(2, 18)}`;
    const currentPeriodEnd = now + 30 * 86400000; // 30 days

    return {
      success: true,
      subscriptionId,
      currentPeriodEnd,
    };
  }

  public async cancelSubscription(providerSubscriptionId: string): Promise<boolean> {
    return !!providerSubscriptionId;
  }

  public verifyWebhookSignature(
    payloadString: string,
    signatureHeader: string,
    secret: string = this.webhookSecret
  ): boolean {
    const expectedSig = `SIG_${deterministicHash(`${payloadString}:${secret}`).slice(2, 26)}`;
    return signatureHeader === expectedSig;
  }
}
