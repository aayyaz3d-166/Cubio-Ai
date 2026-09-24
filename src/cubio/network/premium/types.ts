/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-08: CubiO Premium Address Network (Types & Models)
 *
 * Formal specification for premium @cubio.com address registry,
 * availability checks, time-limited reservations, pricing tiers,
 * ownership lifecycles, transfers, and billing boundaries.
 *
 * ARCHITECTURAL INVARIANT:
 * - Premium addresses (@cubio.com) are authoritative public routing handles.
 * - Every premium address is anchored to a sovereign CUB-XXXXXXXX identity (NET-01).
 * - Billing integration is an isolated boundary interface for future fiat/crypto gateways.
 * - CNC Canonical Coordinate: CUBIO://NETWORK/0/01/00005/API (or standard coordinate).
 */

export type PremiumAddressTier =
  | 'STANDARD'   // 5+ chars, normal words
  | 'VANITY'     // 3-4 chars, popular dictionary words
  | 'EXCLUSIVE'  // 1-2 chars, single letters/numbers (e.g. a@cubio.com, 3d@cubio.com)
  | 'BRAND'      // Trademark / Brand protected
  | 'SYSTEM';    // System reserved names (admin, root, cubio, etc.)

export type PremiumAddressStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'ACTIVE'
  | 'LEASED'
  | 'GRACE_PERIOD'
  | 'SUSPENDED'
  | 'EXPIRED'
  | 'REVOKED';

export type PremiumTransferReason =
  | 'PURCHASE'
  | 'GIFT'
  | 'ADMIN_REASSIGNMENT'
  | 'EXPIRATION';

export interface PremiumPricingModel {
  readonly tier: PremiumAddressTier;
  readonly basePriceUsd: number;
  readonly annualRenewalUsd: number;
  readonly minimumLength: number;
  readonly isAuctionOnly: boolean;
  readonly isRestricted: boolean;
}

export interface PremiumAddressTransferRecord {
  readonly transferId: string; // TRF_...
  readonly address: string; // username@cubio.com
  readonly fromCubId: string; // CUB-XXXXXXXX
  readonly toCubId: string; // CUB-XXXXXXXX
  readonly transferredAt: number;
  readonly reason: PremiumTransferReason;
  readonly notes?: string;
}

export interface PremiumAddressRecord {
  readonly addressId: string; // PADDR_...
  readonly username: string; // e.g. "designer"
  readonly fullAddress: string; // "designer@cubio.com"
  readonly ownerCubId: string; // Sovereign CUB-XXXXXXXX
  readonly tier: PremiumAddressTier;
  readonly status: PremiumAddressStatus;
  readonly pricePaidUsd: number;
  readonly registeredAt: number;
  readonly expiresAt: number; // Unix timestamp for annual renewal
  readonly autoRenew: boolean;
  readonly reservationToken?: string;
  readonly transferHistory: readonly PremiumAddressTransferRecord[];
  readonly metadata?: Readonly<Record<string, any>>;
}

export interface PremiumAddressReservation {
  readonly reservationId: string; // RES_...
  readonly username: string;
  readonly fullAddress: string;
  readonly reservedForCubId: string; // Sovereign CUB-XXXXXXXX
  readonly tier: PremiumAddressTier;
  readonly priceUsd: number;
  readonly reservationToken: string; // RESTOK_...
  readonly createdAt: number;
  readonly expiresAt: number;
  readonly status: 'ACTIVE' | 'CLAIMED' | 'EXPIRED' | 'CANCELLED';
}

export interface CheckAvailabilityResult {
  readonly username: string;
  readonly fullAddress: string;
  readonly available: boolean;
  readonly status: PremiumAddressStatus;
  readonly tier: PremiumAddressTier;
  readonly pricing: PremiumPricingModel;
  readonly currentOwnerCubId?: string;
  readonly reservationExpiresAt?: number;
  readonly reason?: string;
}

// Clean Future Billing Boundary Interface
export interface BillingInvoice {
  readonly invoiceId: string; // INV_...
  readonly cubId: string;
  readonly amountUsd: number;
  readonly currency: 'USD' | 'CUB_CREDITS';
  readonly description: string;
  readonly status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  readonly createdAt: number;
  readonly paidAt?: number;
}

export interface PaymentVerificationResult {
  readonly success: boolean;
  readonly invoiceId: string;
  readonly transactionReference?: string;
  readonly error?: string;
}

export interface IBillingGateway {
  createInvoice(cubId: string, amountUsd: number, description: string): Promise<BillingInvoice>;
  verifyPayment(invoiceId: string, paymentToken?: string): Promise<PaymentVerificationResult>;
  processRefund(invoiceId: string, reason: string): Promise<boolean>;
}

export interface ReservePremiumInput {
  readonly username: string;
  readonly durationMs?: number; // default: 15 minutes (900,000 ms)
}

export interface ClaimPremiumInput {
  readonly username: string;
  readonly reservationToken?: string;
  readonly paymentToken?: string; // Future billing token
  readonly durationYears?: number; // default: 1 year
  readonly autoRenew?: boolean;
  readonly metadata?: Record<string, any>;
}

export interface TransferPremiumInput {
  readonly username: string;
  readonly targetCubIdOrAddress: string; // CUB-ID or @omail.com
  readonly reason?: PremiumTransferReason;
  readonly notes?: string;
}
