/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-19: Master Billing & Marketplace Engine
 *
 * Implements products, plans, subscriptions, orders, entitlements,
 * payment-provider abstraction, and cryptographically verified billing webhooks.
 *
 * CRITICAL ARCHITECTURAL INVARIANT:
 * - "Do not store raw payment credentials." (Only store tokenized provider references).
 * - "Keep payment processing behind a provider abstraction."
 * - All billing entitlements bind directly to sovereign CUB-XXXXXXXX identities and NET-04 Accounts.
 */

import { deterministicHash } from '../../state/determinism';
import { CubiOIdentityRegistry } from '../identity/identityRegistry';
import { CubiOAuthEngine } from '../auth/authEngine';
import { CubiOPolicyEngine } from '../authz/policyEngine';
import { CubiORoleManager } from '../authz/roleManager';
import { CubiOAccountService } from '../account/accountService';
import { CubiOPremiumRegistry } from '../premium/premiumRegistry';
import {
  ProductRecord,
  OrderRecord,
  SubscriptionRecord,
  EntitlementRecord,
  PaymentTransaction,
  CreateProductInput,
  PurchaseProductInput,
} from './types';
import { IBillingRepository } from './repositories/types';
import { MemoryBillingRepository } from './repositories/memoryRepositories';
import { IPaymentProvider } from './provider/types';
import { MockPaymentProvider } from './provider/mockProvider';

export class CubiOBillingEngine {
  private repository: IBillingRepository;
  private paymentProvider: IPaymentProvider;
  private identityRegistry?: CubiOIdentityRegistry;
  private authEngine?: CubiOAuthEngine;
  private policyEngine?: CubiOPolicyEngine;
  private roleManager?: CubiORoleManager;
  private accountService?: CubiOAccountService;
  private premiumRegistry?: CubiOPremiumRegistry;

  constructor(options: {
    repository?: IBillingRepository;
    paymentProvider?: IPaymentProvider;
    identityRegistry?: CubiOIdentityRegistry;
    authEngine?: CubiOAuthEngine;
    policyEngine?: CubiOPolicyEngine;
    roleManager?: CubiORoleManager;
    accountService?: CubiOAccountService;
    premiumRegistry?: CubiOPremiumRegistry;
  } = {}) {
    this.repository = options.repository || new MemoryBillingRepository();
    this.paymentProvider = options.paymentProvider || new MockPaymentProvider();
    this.identityRegistry = options.identityRegistry;
    this.authEngine = options.authEngine;
    this.policyEngine = options.policyEngine;
    this.roleManager = options.roleManager;
    this.accountService = options.accountService;
    this.premiumRegistry = options.premiumRegistry;

    this.initializeDefaultMarketplace();
  }

  public getRepository(): IBillingRepository {
    return this.repository;
  }

  public getPaymentProvider(): IPaymentProvider {
    return this.paymentProvider;
  }

  /**
   * Helper: Authenticates session / token and extracts sovereign caller CUB-ID.
   */
  public async authenticateCaller(tokenOrSession: string): Promise<string> {
    if (tokenOrSession.startsWith('CUB-')) {
      return tokenOrSession;
    }

    if (!this.authEngine) {
      throw new Error('Authentication engine not configured in BillingEngine.');
    }

    let verification;
    if (tokenOrSession.startsWith('CUBTOK.')) {
      verification = await this.authEngine.verifyToken(tokenOrSession);
    } else {
      verification = await this.authEngine.verifySession(tokenOrSession);
    }

    if (!verification.isValid || !verification.identity) {
      throw new Error(`Billing Authentication failed: ${verification.error || 'Invalid session'}`);
    }

    return verification.identity.cubId;
  }

  /**
   * Populates default Marketplace products and plans.
   */
  private initializeDefaultMarketplace(): void {
    const defaultProducts: ProductRecord[] = [
      {
        productId: 'PROD_TIER_PRO',
        name: 'CubiO PRO Subscription',
        description: 'Enhanced compute quotas, spatial storage and premium address allowance.',
        productType: 'SUBSCRIPTION_TIER',
        priceCents: 1999,
        currency: 'USD',
        interval: 'MONTHLY',
        entitlements: ['TIER_PRO', 'PREMIUM_ADDRESS_ALLOWANCE', 'STORAGE_100GB'],
        isActive: true,
        createdAt: 1700000000000,
      },
      {
        productId: 'PROD_TIER_ENTERPRISE',
        name: 'CubiO Enterprise Subscription',
        description: 'Unlimited compute, 1TB storage, dedicated cluster routing & priority support.',
        productType: 'SUBSCRIPTION_TIER',
        priceCents: 9999,
        currency: 'USD',
        interval: 'MONTHLY',
        entitlements: ['TIER_ENTERPRISE', 'PREMIUM_ADDRESS_ALLOWANCE', 'STORAGE_1TB', 'GPU_COMPUTE'],
        isActive: true,
        createdAt: 1700000000000,
      },
      {
        productId: 'PROD_PREMIUM_ADDRESS',
        name: 'Sovereign Premium Address Claim',
        description: 'Lifetime registration of a custom username@cubio.com sovereign address.',
        productType: 'PREMIUM_ADDRESS',
        priceCents: 2500,
        currency: 'USD',
        interval: 'ONE_TIME',
        entitlements: ['PREMIUM_ADDRESS_CLAIM'],
        isActive: true,
        createdAt: 1700000000000,
      },
      {
        productId: 'PROD_STORAGE_500GB',
        name: 'Spatial Storage Add-on 500GB',
        description: 'Additional 500GB high-performance content-addressable storage.',
        productType: 'STORAGE_PACK',
        priceCents: 999,
        currency: 'USD',
        interval: 'MONTHLY',
        entitlements: ['STORAGE_500GB'],
        isActive: true,
        createdAt: 1700000000000,
      },
    ];

    for (const p of defaultProducts) {
      this.repository.saveProduct(p);
    }
  }

  /**
   * Creates a new Marketplace product (Admin only).
   */
  public async createProduct(
    tokenOrSession: string,
    input: CreateProductInput
  ): Promise<Readonly<ProductRecord>> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);

    if (this.policyEngine) {
      const decision = this.policyEngine.evaluate({
        cubId: callerCubId,
        action: 'BILLING_ADMIN',
        resourceUri: 'CUBIO://NETWORK/0/01/00000/BILLING',
      });
      if (!decision.allowed) {
        throw new Error(`Authorization Denied: Identity '${callerCubId}' lacks permission 'BILLING_ADMIN'.`);
      }
    }

    const now = Date.now();
    const productId = `PROD_${deterministicHash(`${input.name}:${input.priceCents}:${now}`).slice(2, 18)}`;

    const product: ProductRecord = Object.freeze({
      productId,
      name: input.name.trim(),
      description: input.description.trim(),
      productType: input.productType,
      priceCents: input.priceCents,
      currency: input.currency || 'USD',
      interval: input.interval || 'ONE_TIME',
      entitlements: Object.freeze([...input.entitlements]),
      isActive: true,
      createdAt: now,
    });

    await this.repository.saveProduct(product);
    return product;
  }

  /**
   * Lists all available Marketplace products.
   */
  public async listProducts(): Promise<readonly ProductRecord[]> {
    return this.repository.listProducts();
  }

  /**
   * Purchases a product or subscription through the payment provider abstraction.
   */
  public async purchaseProduct(
    tokenOrSession: string,
    input: PurchaseProductInput
  ): Promise<{
    order: Readonly<OrderRecord>;
    transaction: Readonly<PaymentTransaction>;
    subscription?: Readonly<SubscriptionRecord>;
    entitlements: readonly EntitlementRecord[];
  }> {
    const buyerCubId = await this.authenticateCaller(tokenOrSession);

    if (this.policyEngine) {
      const decision = this.policyEngine.evaluate({
        cubId: buyerCubId,
        action: 'BILLING_PURCHASE',
        resourceUri: 'CUBIO://NETWORK/0/01/00000/BILLING',
      });
      if (!decision.allowed) {
        throw new Error(`Authorization Denied: Identity '${buyerCubId}' lacks permission 'BILLING_PURCHASE'.`);
      }
    }

    const product = await this.repository.getProduct(input.productId);
    if (!product || !product.isActive) {
      throw new Error(`Billing Error: Product '${input.productId}' not found or inactive.`);
    }

    const now = Date.now();
    const orderId = `ORD_${deterministicHash(`${buyerCubId}:${product.productId}:${now}`).slice(2, 18)}`;

    // 1. Process payment via provider abstraction (Tokenized only - no raw cards!)
    const paymentResult = await this.paymentProvider.processPayment({
      amountCents: product.priceCents,
      currency: product.currency,
      tokenizedPaymentMethodId: input.tokenizedPaymentMethodId,
      customerId: buyerCubId,
      metadata: { productId: product.productId, orderId },
    });

    if (!paymentResult.success) {
      const failedOrder: OrderRecord = Object.freeze({
        orderId,
        buyerCubId,
        productId: product.productId,
        amountCents: product.priceCents,
        currency: product.currency,
        status: 'FAILED',
        createdAt: now,
      });
      await this.repository.saveOrder(failedOrder);
      throw new Error(`Payment Processing Failed: ${paymentResult.error || 'Card declined'}`);
    }

    // 2. Save successful transaction
    const transaction: PaymentTransaction = Object.freeze({
      transactionId: paymentResult.transactionId,
      orderId,
      payerCubId: buyerCubId,
      amountCents: product.priceCents,
      currency: product.currency,
      provider: this.paymentProvider.providerName,
      status: 'SUCCESS',
      tokenizedPaymentMethodId: input.tokenizedPaymentMethodId,
      createdAt: now,
    });
    await this.repository.saveTransaction(transaction);

    // 3. Mark order PAID
    const order: OrderRecord = Object.freeze({
      orderId,
      buyerCubId,
      productId: product.productId,
      amountCents: product.priceCents,
      currency: product.currency,
      status: 'PAID',
      paymentTransactionId: transaction.transactionId,
      createdAt: now,
      paidAt: now,
    });
    await this.repository.saveOrder(order);

    // 4. Handle Subscriptions & Account Tier Upgrades
    let subscription: SubscriptionRecord | undefined;
    if (product.interval !== 'ONE_TIME' || product.productType === 'SUBSCRIPTION_TIER') {
      const subscriptionId = `SUB_BILL_${deterministicHash(`${buyerCubId}:${product.productId}:${now}`).slice(2, 18)}`;
      subscription = Object.freeze({
        subscriptionId,
        subscriberCubId: buyerCubId,
        productId: product.productId,
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: now + 30 * 86400000,
        cancelAtPeriodEnd: false,
        providerSubscriptionId: `sub_prov_${subscriptionId.slice(9)}`,
        createdAt: now,
        updatedAt: now,
      });
      await this.repository.saveSubscription(subscription);

      // Upgrade account tier in NET-04
      if (this.accountService) {
        if (product.entitlements.includes('TIER_ENTERPRISE')) {
          await this.accountService.updateTier(buyerCubId, 'ENTERPRISE');
        } else if (product.entitlements.includes('TIER_PRO')) {
          await this.accountService.updateTier(buyerCubId, 'PRO');
        }
      }
    }

    // 5. Grant Entitlements
    const grantedEntitlements: EntitlementRecord[] = [];
    for (const cap of product.entitlements) {
      const entitlementId = `ENT_${deterministicHash(`${buyerCubId}:${cap}:${now}`).slice(2, 18)}`;
      const ent: EntitlementRecord = Object.freeze({
        entitlementId,
        ownerCubId: buyerCubId,
        capability: cap,
        sourceType: subscription ? 'SUBSCRIPTION' : 'ORDER',
        sourceId: subscription ? subscription.subscriptionId : order.orderId,
        status: 'ACTIVE',
        grantedAt: now,
        expiresAt: subscription ? subscription.currentPeriodEnd : undefined,
      });
      await this.repository.saveEntitlement(ent);
      grantedEntitlements.push(ent);
    }

    return {
      order,
      transaction,
      subscription,
      entitlements: Object.freeze(grantedEntitlements),
    };
  }

  /**
   * Checks if an identity holds an active entitlement for a capability.
   */
  public async checkEntitlement(ownerCubId: string, capability: string): Promise<boolean> {
    const entitlements = await this.repository.listEntitlements(ownerCubId);
    const now = Date.now();

    return entitlements.some(
      (e) =>
        e.capability === capability &&
        e.status === 'ACTIVE' &&
        (!e.expiresAt || e.expiresAt > now)
    );
  }

  /**
   * Cancels an active subscription.
   */
  public async cancelSubscription(
    tokenOrSession: string,
    subscriptionId: string
  ): Promise<Readonly<SubscriptionRecord>> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);
    const sub = await this.repository.getSubscription(subscriptionId);

    if (!sub) {
      throw new Error(`Billing Error: Subscription '${subscriptionId}' not found.`);
    }

    // Check ownership or admin
    if (sub.subscriberCubId !== callerCubId) {
      if (this.policyEngine) {
        const decision = this.policyEngine.evaluate({
          cubId: callerCubId,
          action: 'BILLING_ADMIN',
          resourceUri: 'CUBIO://NETWORK/0/01/00000/BILLING',
        });
        if (!decision.allowed) {
          throw new Error(`Authorization Denied: Identity '${callerCubId}' cannot cancel foreign subscription.`);
        }
      }
    }

    if (sub.providerSubscriptionId) {
      await this.paymentProvider.cancelSubscription(sub.providerSubscriptionId);
    }

    const updated: SubscriptionRecord = Object.freeze({
      ...sub,
      status: 'CANCELLED',
      cancelAtPeriodEnd: true,
      updatedAt: Date.now(),
    });

    await this.repository.saveSubscription(updated);
    return updated;
  }

  /**
   * Processes cryptographically verified billing webhooks.
   */
  public async processWebhook(
    rawPayload: string,
    signatureHeader: string
  ): Promise<{ processed: boolean; eventType: string }> {
    const isValid = this.paymentProvider.verifyWebhookSignature(rawPayload, signatureHeader, 'whsec_cubio_mock_secret_9988');
    if (!isValid) {
      throw new Error('Billing Webhook Error: Invalid cryptographic signature.');
    }

    const event = JSON.parse(rawPayload);
    const eventType: string = event.type || 'unknown';

    if (eventType === 'customer.subscription.deleted') {
      const subId = event.data?.subscriptionId;
      if (subId) {
        const sub = await this.repository.getSubscription(subId);
        if (sub) {
          await this.repository.saveSubscription({
            ...sub,
            status: 'EXPIRED',
            updatedAt: Date.now(),
          });
        }
      }
    }

    return { processed: true, eventType };
  }
}
