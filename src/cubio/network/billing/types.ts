/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-19: CubiO Billing / Marketplace Layer (Types & Models)
 *
 * Master specification for products, plans, subscriptions, orders, entitlements,
 * payment-provider abstraction, and cryptographically verified billing webhooks.
 *
 * CRITICAL ARCHITECTURAL INVARIANT:
 * - "Do not store raw payment credentials." (Only store tokenized provider references).
 * - "Keep payment processing behind a provider abstraction."
 * - All billing entitlements bind directly to sovereign CUB-XXXXXXXX identities and NET-04 Accounts.
 */

export type ProductType =
  | 'SUBSCRIPTION_TIER'
  | 'PREMIUM_ADDRESS'
  | 'STORAGE_PACK'
  | 'COMPUTE_PACK'
  | 'MARKETPLACE_PLUGIN';

export type BillingInterval = 'MONTHLY' | 'ANNUAL' | 'ONE_TIME';

export type OrderStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED';

export type SubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED';

export type EntitlementStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';

export interface ProductRecord {
  readonly productId: string; // PROD_...
  readonly name: string;
  readonly description: string;
  readonly productType: ProductType;
  readonly priceCents: number;
  readonly currency: string; // "USD"
  readonly interval: BillingInterval;
  readonly entitlements: readonly string[]; // ['TIER_PRO', 'PREMIUM_ADDRESS_ALLOWANCE', 'STORAGE_100GB']
  readonly isActive: boolean;
  readonly createdAt: number;
}

export interface OrderRecord {
  readonly orderId: string; // ORD_...
  readonly buyerCubId: string; // Sovereign buyer CUB-XXXXXXXX
  readonly productId: string;
  readonly amountCents: number;
  readonly currency: string;
  readonly status: OrderStatus;
  readonly paymentTransactionId?: string;
  readonly createdAt: number;
  readonly paidAt?: number;
}

export interface SubscriptionRecord {
  readonly subscriptionId: string; // SUB_BILL_...
  readonly subscriberCubId: string;
  readonly productId: string;
  readonly status: SubscriptionStatus;
  readonly currentPeriodStart: number;
  readonly currentPeriodEnd: number;
  readonly cancelAtPeriodEnd: boolean;
  readonly providerSubscriptionId?: string;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface EntitlementRecord {
  readonly entitlementId: string; // ENT_...
  readonly ownerCubId: string; // Sovereign CUB-XXXXXXXX
  readonly capability: string; // e.g. "TIER_PRO", "PREMIUM_ADDRESS_CLAIM", "GPU_COMPUTE"
  readonly sourceType: 'ORDER' | 'SUBSCRIPTION' | 'GRANT';
  readonly sourceId: string;
  readonly status: EntitlementStatus;
  readonly expiresAt?: number;
  readonly grantedAt: number;
}

export interface PaymentTransaction {
  readonly transactionId: string; // TXN_...
  readonly orderId: string;
  readonly payerCubId: string;
  readonly amountCents: number;
  readonly currency: string;
  readonly provider: string;
  readonly status: 'SUCCESS' | 'FAILED' | 'PENDING';
  readonly tokenizedPaymentMethodId: string; // e.g. "pm_tok_mock_9918" (Tokenized only!)
  readonly createdAt: number;
}

export interface CreateProductInput {
  readonly name: string;
  readonly description: string;
  readonly productType: ProductType;
  readonly priceCents: number;
  readonly currency?: string;
  readonly interval?: BillingInterval;
  readonly entitlements: readonly string[];
}

export interface PurchaseProductInput {
  readonly productId: string;
  readonly tokenizedPaymentMethodId: string; // e.g. "pm_tok_mock_123"
  readonly targetPremiumAddress?: string; // Optional if buying a premium address
}
