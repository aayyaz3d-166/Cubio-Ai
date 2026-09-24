/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-19: Billing Repository Interfaces
 */

import {
  ProductRecord,
  OrderRecord,
  SubscriptionRecord,
  EntitlementRecord,
  PaymentTransaction,
} from '../types';

export interface IBillingRepository {
  // Products
  saveProduct(product: ProductRecord): Promise<void>;
  getProduct(productId: string): Promise<ProductRecord | undefined>;
  listProducts(): Promise<readonly ProductRecord[]>;

  // Orders
  saveOrder(order: OrderRecord): Promise<void>;
  getOrder(orderId: string): Promise<OrderRecord | undefined>;
  listOrders(buyerCubId?: string): Promise<readonly OrderRecord[]>;

  // Subscriptions
  saveSubscription(subscription: SubscriptionRecord): Promise<void>;
  getSubscription(subscriptionId: string): Promise<SubscriptionRecord | undefined>;
  listSubscriptions(subscriberCubId?: string): Promise<readonly SubscriptionRecord[]>;

  // Entitlements
  saveEntitlement(entitlement: EntitlementRecord): Promise<void>;
  getEntitlement(entitlementId: string): Promise<EntitlementRecord | undefined>;
  listEntitlements(ownerCubId?: string): Promise<readonly EntitlementRecord[]>;

  // Transactions
  saveTransaction(transaction: PaymentTransaction): Promise<void>;
  getTransaction(transactionId: string): Promise<PaymentTransaction | undefined>;
}
