/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-19: Payment Provider Interfaces
 */

export interface ProcessPaymentInput {
  readonly amountCents: number;
  readonly currency: string;
  readonly tokenizedPaymentMethodId: string;
  readonly customerId: string;
  readonly metadata?: Readonly<Record<string, any>>;
}

export interface ProcessPaymentResult {
  readonly success: boolean;
  readonly transactionId: string;
  readonly providerReference: string;
  readonly error?: string;
}

export interface CreateSubscriptionInput {
  readonly customerId: string;
  readonly planId: string;
  readonly tokenizedPaymentMethodId: string;
}

export interface CreateSubscriptionResult {
  readonly success: boolean;
  readonly subscriptionId: string;
  readonly currentPeriodEnd: number;
  readonly error?: string;
}

export interface IPaymentProvider {
  readonly providerName: string;
  processPayment(input: ProcessPaymentInput): Promise<ProcessPaymentResult>;
  createSubscription(input: CreateSubscriptionInput): Promise<CreateSubscriptionResult>;
  cancelSubscription(providerSubscriptionId: string): Promise<boolean>;
  verifyWebhookSignature(payloadString: string, signatureHeader: string, secret: string): boolean;
}
