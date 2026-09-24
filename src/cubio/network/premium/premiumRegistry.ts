/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-08: Master Premium Address Registry & Management Engine
 *
 * Implements sovereign @cubio.com address registry, availability checks,
 * time-limited reservations with cryptographic tokens & TTL, clean billing
 * boundary verification, ownership lifecycles, and cross-account transfers.
 */

import { deterministicHash } from '../../state/determinism';
import { CubiOIdentityRegistry } from '../identity/identityRegistry';
import { CubiOAuthEngine } from '../auth/authEngine';
import { CubiOPolicyEngine } from '../authz/policyEngine';
import { CubiOAccountService } from '../account/accountService';
import { CubiOAddressRegistry } from '../address/addressRegistry';
import {
  PremiumAddressRecord,
  PremiumAddressReservation,
  PremiumAddressTransferRecord,
  CheckAvailabilityResult,
  ReservePremiumInput,
  ClaimPremiumInput,
  TransferPremiumInput,
  IBillingGateway,
} from './types';
import { CubiOPremiumPricingEngine } from './pricingEngine';
import { IPremiumAddressRepository } from './repositories/types';
import { MemoryPremiumAddressRepository } from './repositories/memoryRepositories';
import { MockBillingGateway } from './billingGateway';

export class CubiOPremiumRegistry {
  private repository: IPremiumAddressRepository;
  private identityRegistry?: CubiOIdentityRegistry;
  private authEngine?: CubiOAuthEngine;
  private policyEngine?: CubiOPolicyEngine;
  private accountService?: CubiOAccountService;
  private addressRegistry?: CubiOAddressRegistry;
  private billingGateway: IBillingGateway;

  constructor(options: {
    repository?: IPremiumAddressRepository;
    identityRegistry?: CubiOIdentityRegistry;
    authEngine?: CubiOAuthEngine;
    policyEngine?: CubiOPolicyEngine;
    accountService?: CubiOAccountService;
    addressRegistry?: CubiOAddressRegistry;
    billingGateway?: IBillingGateway;
  } = {}) {
    this.repository = options.repository || new MemoryPremiumAddressRepository();
    this.identityRegistry = options.identityRegistry;
    this.authEngine = options.authEngine;
    this.policyEngine = options.policyEngine;
    this.accountService = options.accountService;
    this.addressRegistry = options.addressRegistry;
    this.billingGateway = options.billingGateway || new MockBillingGateway();
  }

  public getRepository(): IPremiumAddressRepository {
    return this.repository;
  }

  public getBillingGateway(): IBillingGateway {
    return this.billingGateway;
  }

  /**
   * Helper: Authenticates session / token and extracts sovereign caller CUB-ID.
   */
  public async authenticateCaller(tokenOrSession: string): Promise<string> {
    if (!this.authEngine) {
      if (tokenOrSession.startsWith('CUB-')) {
        return tokenOrSession;
      }
      throw new Error('Authentication engine not configured in PremiumRegistry.');
    }

    let verification;
    if (tokenOrSession.startsWith('CUBTOK.')) {
      verification = await this.authEngine.verifyToken(tokenOrSession);
    } else {
      verification = await this.authEngine.verifySession(tokenOrSession);
    }

    if (!verification.isValid || !verification.identity) {
      throw new Error(`Premium Address Authentication failed: ${verification.error || 'Invalid session'}`);
    }

    return verification.identity.cubId;
  }

  /**
   * Checks the availability, pricing tier, and reservation status of a @cubio.com username.
   */
  public async checkAvailability(rawUsername: string): Promise<CheckAvailabilityResult> {
    const validation = CubiOPremiumPricingEngine.validateUsername(rawUsername);
    const username = CubiOPremiumPricingEngine.normalizeUsername(rawUsername);
    const fullAddress = `${username}@cubio.com`;
    const pricing = CubiOPremiumPricingEngine.evaluateTier(username);

    if (!validation.isValid) {
      return Object.freeze({
        username,
        fullAddress,
        available: false,
        status: 'REVOKED',
        tier: pricing.tier,
        pricing,
        reason: validation.error,
      });
    }

    if (pricing.tier === 'SYSTEM') {
      return Object.freeze({
        username,
        fullAddress,
        available: false,
        status: 'REVOKED',
        tier: 'SYSTEM',
        pricing,
        reason: `Username '${username}' is a protected system-reserved identifier.`,
      });
    }

    // Check existing address record
    const existing = await this.repository.getAddress(username);
    if (existing) {
      const now = Date.now();
      if (existing.status === 'ACTIVE' || existing.status === 'LEASED') {
        if (existing.expiresAt > now) {
          return Object.freeze({
            username,
            fullAddress,
            available: false,
            status: existing.status,
            tier: existing.tier,
            pricing,
            currentOwnerCubId: existing.ownerCubId,
            reason: `Address is already owned by sovereign identity '${existing.ownerCubId}'.`,
          });
        }
      } else if (existing.status === 'SUSPENDED') {
        return Object.freeze({
          username,
          fullAddress,
          available: false,
          status: 'SUSPENDED',
          tier: existing.tier,
          pricing,
          currentOwnerCubId: existing.ownerCubId,
          reason: 'Address is currently suspended by network administration.',
        });
      }
    }

    // Check active reservation
    const reservation = await this.repository.getReservation(username);
    if (reservation && reservation.status === 'ACTIVE' && reservation.expiresAt > Date.now()) {
      return Object.freeze({
        username,
        fullAddress,
        available: false,
        status: 'RESERVED',
        tier: reservation.tier,
        pricing,
        currentOwnerCubId: reservation.reservedForCubId,
        reservationExpiresAt: reservation.expiresAt,
        reason: `Address is currently reserved by sovereign identity '${reservation.reservedForCubId}'.`,
      });
    }

    return Object.freeze({
      username,
      fullAddress,
      available: true,
      status: 'AVAILABLE',
      tier: pricing.tier,
      pricing,
    });
  }

  /**
   * Places a time-limited reservation on a premium address.
   */
  public async reserveAddress(
    tokenOrSession: string,
    input: ReservePremiumInput
  ): Promise<Readonly<PremiumAddressReservation>> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);
    const username = CubiOPremiumPricingEngine.normalizeUsername(input.username);
    const fullAddress = `${username}@cubio.com`;

    const avail = await this.checkAvailability(username);
    if (!avail.available) {
      // If reserved by caller themselves, return existing active reservation
      if (avail.status === 'RESERVED' && avail.currentOwnerCubId === callerCubId) {
        const existingRes = await this.repository.getReservation(username);
        if (existingRes && existingRes.status === 'ACTIVE') {
          return existingRes;
        }
      }
      throw new Error(`Address '${fullAddress}' is not available for reservation: ${avail.reason}`);
    }

    const now = Date.now();
    const duration = input.durationMs || 15 * 60 * 1000; // 15 minutes default TTL
    const expiresAt = now + duration;
    const reservationToken = `RESTOK_${deterministicHash(`${callerCubId}:${username}:${now}`).slice(2, 26)}`;
    const reservationId = `RES_${deterministicHash(`RESERVATION:${username}:${now}`).slice(2, 18)}`;

    const reservation: PremiumAddressReservation = Object.freeze({
      reservationId,
      username,
      fullAddress,
      reservedForCubId: callerCubId,
      tier: avail.tier,
      priceUsd: avail.pricing.basePriceUsd,
      reservationToken,
      createdAt: now,
      expiresAt,
      status: 'ACTIVE',
    });

    await this.repository.saveReservation(reservation);
    return reservation;
  }

  /**
   * Claims or purchases a premium address, connecting to the clean billing boundary.
   */
  public async claimOrPurchaseAddress(
    tokenOrSession: string,
    input: ClaimPremiumInput
  ): Promise<Readonly<PremiumAddressRecord>> {
    // 1. Authenticate caller (NET-02)
    const callerCubId = await this.authenticateCaller(tokenOrSession);

    // 2. Verify sovereign identity (NET-01)
    if (this.identityRegistry && !this.identityRegistry.has(callerCubId)) {
      throw new Error(`Premium Address Error: Sovereign Identity '${callerCubId}' not found in NET-01 registry.`);
    }

    const username = CubiOPremiumPricingEngine.normalizeUsername(input.username);
    const fullAddress = `${username}@cubio.com`;
    const avail = await this.checkAvailability(username);

    // 3. Validate reservation / availability
    let reservation: PremiumAddressReservation | undefined;
    if (input.reservationToken) {
      reservation = await this.repository.getReservationByToken(input.reservationToken);
      if (!reservation || reservation.username !== username) {
        throw new Error('Invalid reservation token for requested username.');
      }
      if (reservation.reservedForCubId !== callerCubId) {
        throw new Error('Reservation token belongs to another sovereign identity.');
      }
      if (reservation.status !== 'ACTIVE' || reservation.expiresAt < Date.now()) {
        throw new Error('Reservation has expired. Please create a new reservation.');
      }
    } else {
      if (!avail.available) {
        // If caller owns active reservation without passing token explicitly, allow claim
        if (avail.status === 'RESERVED' && avail.currentOwnerCubId === callerCubId) {
          reservation = await this.repository.getReservation(username);
        } else {
          throw new Error(`Address '${fullAddress}' is not available: ${avail.reason}`);
        }
      }
    }

    // 4. Clean Billing Boundary Interaction
    const priceUsd = avail.pricing.basePriceUsd;
    if (priceUsd > 0) {
      const invoice = await this.billingGateway.createInvoice(
        callerCubId,
        priceUsd,
        `Registration for premium address ${fullAddress}`
      );
      const paymentResult = await this.billingGateway.verifyPayment(invoice.invoiceId, input.paymentToken);
      if (!paymentResult.success) {
        throw new Error(`Billing Verification Failed: ${paymentResult.error || 'Payment declined'}`);
      }
    }

    // 5. Create / Activate Premium Address Record
    const now = Date.now();
    const durationYears = input.durationYears || 1;
    const expiresAt = now + durationYears * 365 * 24 * 60 * 60 * 1000;
    const addressId = `PADDR_${deterministicHash(`${callerCubId}:${username}`).slice(2, 18)}`;

    const record: PremiumAddressRecord = Object.freeze({
      addressId,
      username,
      fullAddress,
      ownerCubId: callerCubId,
      tier: avail.tier,
      status: 'ACTIVE',
      pricePaidUsd: priceUsd,
      registeredAt: now,
      expiresAt,
      autoRenew: input.autoRenew ?? true,
      reservationToken: reservation?.reservationToken,
      transferHistory: Object.freeze([
        Object.freeze({
          transferId: `TRF_${deterministicHash(`INITIAL:${username}:${now}`).slice(2, 18)}`,
          address: fullAddress,
          fromCubId: 'SYSTEM',
          toCubId: callerCubId,
          transferredAt: now,
          reason: 'PURCHASE',
          notes: `Initial registration at ${priceUsd} USD`,
        }),
      ]),
      metadata: input.metadata ? Object.freeze({ ...input.metadata }) : undefined,
    });

    await this.repository.saveAddress(record);

    // 6. Mark reservation claimed
    if (reservation) {
      await this.repository.saveReservation(
        Object.freeze({
          ...reservation,
          status: 'CLAIMED',
        })
      );
    }

    // 7. Synchronize Dual-Address Layer & NET-04 Account
    if (this.addressRegistry) {
      await this.addressRegistry.claimPremiumAddress(callerCubId, username, {
        reservationToken: reservation?.reservationToken,
        tier: avail.tier as any,
      });
    }

    if (this.accountService) {
      await this.accountService.updateProfile(callerCubId, {
        cubioAddress: fullAddress,
        email: fullAddress,
      });
    }

    return record;
  }

  /**
   * Transfers a premium address from the current owner to a new sovereign identity.
   */
  public async transferAddress(
    tokenOrSession: string,
    input: TransferPremiumInput
  ): Promise<Readonly<PremiumAddressRecord>> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);
    const username = CubiOPremiumPricingEngine.normalizeUsername(input.username);
    const fullAddress = `${username}@cubio.com`;

    const record = await this.repository.getAddress(username);
    if (!record) {
      throw new Error(`Premium Address Error: Address '${fullAddress}' not found.`);
    }

    if (record.ownerCubId !== callerCubId) {
      throw new Error(`Security Violation: Identity '${callerCubId}' does not own address '${fullAddress}'.`);
    }

    if (record.status !== 'ACTIVE' && record.status !== 'LEASED') {
      throw new Error(`Address '${fullAddress}' status is '${record.status}'. Transfers only permitted for ACTIVE addresses.`);
    }

    // Resolve target CUB-ID
    let targetCubId = input.targetCubIdOrAddress.trim();
    if (!targetCubId.startsWith('CUB-')) {
      if (this.addressRegistry) {
        const resolution = await this.addressRegistry.resolveAddress(targetCubId);
        if (resolution.found && resolution.cubId) {
          targetCubId = resolution.cubId;
        } else {
          throw new Error(`Transfer Error: Target address '${targetCubId}' could not be resolved.`);
        }
      } else {
        throw new Error(`Transfer Error: Target '${targetCubId}' must be a valid CUB-XXXXXXXX identity.`);
      }
    }

    if (targetCubId === callerCubId) {
      throw new Error('Cannot transfer address to oneself.');
    }

    if (this.identityRegistry && !this.identityRegistry.has(targetCubId)) {
      throw new Error(`Transfer Error: Target identity '${targetCubId}' not found in NET-01 registry.`);
    }

    const now = Date.now();
    const transferRecord: PremiumAddressTransferRecord = Object.freeze({
      transferId: `TRF_${deterministicHash(`${fullAddress}:${callerCubId}:${targetCubId}:${now}`).slice(2, 18)}`,
      address: fullAddress,
      fromCubId: callerCubId,
      toCubId: targetCubId,
      transferredAt: now,
      reason: input.reason || 'PURCHASE',
      notes: input.notes,
    });

    const updatedRecord: PremiumAddressRecord = Object.freeze({
      ...record,
      ownerCubId: targetCubId,
      transferHistory: Object.freeze([...record.transferHistory, transferRecord]),
    });

    await this.repository.saveAddress(updatedRecord);

    // Rebind in Address Registry & NET-04 Accounts
    if (this.addressRegistry) {
      await this.addressRegistry.releaseAddress(callerCubId, fullAddress, 'cubio.com');
      await this.addressRegistry.claimPremiumAddress(targetCubId, username, {
        tier: record.tier as any,
      });
    }

    if (this.accountService) {
      await this.accountService.updateProfile(targetCubId, {
        cubioAddress: fullAddress,
      });
    }

    return updatedRecord;
  }

  /**
   * Renews an existing premium address.
   */
  public async renewAddress(
    tokenOrSession: string,
    rawUsername: string,
    durationYears: number = 1
  ): Promise<Readonly<PremiumAddressRecord>> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);
    const username = CubiOPremiumPricingEngine.normalizeUsername(rawUsername);
    const record = await this.repository.getAddress(username);

    if (!record) {
      throw new Error(`Address '${username}@cubio.com' not found.`);
    }

    if (record.ownerCubId !== callerCubId) {
      throw new Error(`Security Violation: Caller does not own address '${username}@cubio.com'.`);
    }

    const pricing = CubiOPremiumPricingEngine.evaluateTier(username);
    const renewalPrice = pricing.annualRenewalUsd * durationYears;

    if (renewalPrice > 0) {
      const invoice = await this.billingGateway.createInvoice(
        callerCubId,
        renewalPrice,
        `Renewal for ${username}@cubio.com (${durationYears} year(s))`
      );
      await this.billingGateway.verifyPayment(invoice.invoiceId);
    }

    const extensionMs = durationYears * 365 * 24 * 60 * 60 * 1000;
    const newExpiry = Math.max(Date.now(), record.expiresAt) + extensionMs;

    const renewed: PremiumAddressRecord = Object.freeze({
      ...record,
      expiresAt: newExpiry,
      status: 'ACTIVE',
    });

    await this.repository.saveAddress(renewed);
    return renewed;
  }

  /**
   * Suspends a premium address (Admin operation).
   */
  public async suspendAddress(
    adminTokenOrSession: string,
    rawUsername: string,
    reason: string = 'Administrative review'
  ): Promise<boolean> {
    const adminCubId = await this.authenticateCaller(adminTokenOrSession);
    const username = CubiOPremiumPricingEngine.normalizeUsername(rawUsername);

    if (this.policyEngine) {
      const decision = this.policyEngine.evaluate({
        cubId: adminCubId,
        action: 'ADMIN_MANAGE',
        resourceUri: 'CUBIO://NETWORK/0/01/00000/SECURITY',
      });
      if (!decision.allowed) {
        throw new Error(`Authorization Denied: Identity '${adminCubId}' cannot suspend premium addresses.`);
      }
    }

    const record = await this.repository.getAddress(username);
    if (!record) {
      throw new Error(`Address '${username}@cubio.com' not found.`);
    }

    const suspended: PremiumAddressRecord = Object.freeze({
      ...record,
      status: 'SUSPENDED',
      metadata: Object.freeze({
        ...record.metadata,
        suspendedReason: reason,
        suspendedAt: Date.now(),
        suspendedBy: adminCubId,
      }),
    });

    await this.repository.saveAddress(suspended);
    if (this.addressRegistry) {
      await this.addressRegistry.suspendAddress(adminCubId, `${username}@cubio.com`, 'cubio.com');
    }

    return true;
  }

  /**
   * Unsuspends a premium address (Admin operation).
   */
  public async unsuspendAddress(
    adminTokenOrSession: string,
    rawUsername: string
  ): Promise<boolean> {
    const adminCubId = await this.authenticateCaller(adminTokenOrSession);
    const username = CubiOPremiumPricingEngine.normalizeUsername(rawUsername);

    if (this.policyEngine) {
      const decision = this.policyEngine.evaluate({
        cubId: adminCubId,
        action: 'ADMIN_MANAGE',
        resourceUri: 'CUBIO://NETWORK/0/01/00000/SECURITY',
      });
      if (!decision.allowed) {
        throw new Error(`Authorization Denied: Identity '${adminCubId}' cannot unsuspend premium addresses.`);
      }
    }

    const record = await this.repository.getAddress(username);
    if (!record) {
      throw new Error(`Address '${username}@cubio.com' not found.`);
    }

    const unsuspended: PremiumAddressRecord = Object.freeze({
      ...record,
      status: 'ACTIVE',
    });

    await this.repository.saveAddress(unsuspended);
    if (this.addressRegistry) {
      await this.addressRegistry.unsuspendAddress(adminCubId, `${username}@cubio.com`, 'cubio.com');
    }

    return true;
  }

  /**
   * Retrieves all premium addresses owned by an identity.
   */
  public async getAddressesByOwner(
    tokenOrSession: string,
    targetCubId?: string
  ): Promise<readonly PremiumAddressRecord[]> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);
    const owner = targetCubId || callerCubId;
    return this.repository.getAddressesByOwner(owner);
  }

  /**
   * Looks up a premium address record by username.
   */
  public async getAddress(username: string): Promise<PremiumAddressRecord | undefined> {
    const norm = CubiOPremiumPricingEngine.normalizeUsername(username);
    return this.repository.getAddress(norm);
  }

  /**
   * Retrieves transfer history for an address.
   */
  public async getTransferHistory(username: string): Promise<readonly PremiumAddressTransferRecord[]> {
    const norm = CubiOPremiumPricingEngine.normalizeUsername(username);
    return this.repository.getTransferHistory(`${norm}@cubio.com`);
  }
}
