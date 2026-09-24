/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-19: In-Memory Billing Repository
 */

import {
  ProductRecord,
  OrderRecord,
  SubscriptionRecord,
  EntitlementRecord,
  PaymentTransaction,
} from '../types';
import { IBillingRepository } from './types';

export class MemoryBillingRepository implements IBillingRepository {
  private products: Map<string, ProductRecord> = new Map();
  private orders: Map<string, OrderRecord> = new Map();
  private subscriptions: Map<string, SubscriptionRecord> = new Map();
  private entitlements: Map<string, EntitlementRecord> = new Map();
  private transactions: Map<string, PaymentTransaction> = new Map();

  // --- PRODUCTS ---

  public async saveProduct(product: ProductRecord): Promise<void> {
    this.products.set(product.productId, Object.freeze({ ...product }));
  }

  public async getProduct(productId: string): Promise<ProductRecord | undefined> {
    return this.products.get(productId);
  }

  public async listProducts(): Promise<readonly ProductRecord[]> {
    return Object.freeze(Array.from(this.products.values()));
  }

  // --- ORDERS ---

  public async saveOrder(order: OrderRecord): Promise<void> {
    this.orders.set(order.orderId, Object.freeze({ ...order }));
  }

  public async getOrder(orderId: string): Promise<OrderRecord | undefined> {
    return this.orders.get(orderId);
  }

  public async listOrders(buyerCubId?: string): Promise<readonly OrderRecord[]> {
    let list = Array.from(this.orders.values());
    if (buyerCubId) {
      list = list.filter((o) => o.buyerCubId === buyerCubId);
    }
    return Object.freeze(list);
  }

  // --- SUBSCRIPTIONS ---

  public async saveSubscription(subscription: SubscriptionRecord): Promise<void> {
    this.subscriptions.set(subscription.subscriptionId, Object.freeze({ ...subscription }));
  }

  public async getSubscription(subscriptionId: string): Promise<SubscriptionRecord | undefined> {
    return this.subscriptions.get(subscriptionId);
  }

  public async listSubscriptions(subscriberCubId?: string): Promise<readonly SubscriptionRecord[]> {
    let list = Array.from(this.subscriptions.values());
    if (subscriberCubId) {
      list = list.filter((s) => s.subscriberCubId === subscriberCubId);
    }
    return Object.freeze(list);
  }

  // --- ENTITLEMENTS ---

  public async saveEntitlement(entitlement: EntitlementRecord): Promise<void> {
    this.entitlements.set(entitlement.entitlementId, Object.freeze({ ...entitlement }));
  }

  public async getEntitlement(entitlementId: string): Promise<EntitlementRecord | undefined> {
    return this.entitlements.get(entitlementId);
  }

  public async listEntitlements(ownerCubId?: string): Promise<readonly EntitlementRecord[]> {
    let list = Array.from(this.entitlements.values());
    if (ownerCubId) {
      list = list.filter((e) => e.ownerCubId === ownerCubId);
    }
    return Object.freeze(list);
  }

  // --- TRANSACTIONS ---

  public async saveTransaction(transaction: PaymentTransaction): Promise<void> {
    this.transactions.set(transaction.transactionId, Object.freeze({ ...transaction }));
  }

  public async getTransaction(transactionId: string): Promise<PaymentTransaction | undefined> {
    return this.transactions.get(transactionId);
  }
}
