/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline CUBiO-ADDRESS: Master Address Registry
 *
 * Authoritative registry managing availability, reservations, assignment,
 * lifecycle states, and resolution for @omail.com and @cubio.com addresses.
 *
 * ARCHITECTURAL INVARIANT:
 * - Sovereign identity CUB-XXXXXXXX (NET-01) is the single authoritative owner.
 * - Client cannot claim an address already assigned to another CUB-ID.
 * - Server-side resolution guarantees cross-account isolation and determinism.
 */

import { deterministicHash } from '../../state/determinism';
import { CubiOIdentityRegistry } from '../identity/identityRegistry';
import {
  AddressDomain,
  AddressOwnership,
  AddressReservation,
  AddressResolutionResult,
  AddressStatus,
  CubiOAddress,
  OMailAddress,
  CubiOPremiumAddress,
  AddressType,
} from './types';
import { CubiOAddressValidator } from './addressValidator';
import { IAddressRepository } from './repositories/types';
import { MemoryAddressRepository } from './repositories/memoryRepositories';

export class CubiOAddressRegistry {
  private repository: IAddressRepository;
  private identityRegistry: CubiOIdentityRegistry;

  constructor(
    repository?: IAddressRepository,
    identityRegistry?: CubiOIdentityRegistry
  ) {
    this.repository = repository || new MemoryAddressRepository();
    this.identityRegistry = identityRegistry || new CubiOIdentityRegistry();
  }

  public getRepository(): IAddressRepository {
    return this.repository;
  }

  public getIdentityRegistry(): CubiOIdentityRegistry {
    return this.identityRegistry;
  }

  /**
   * Checks the availability of an address or username.
   */
  public async checkAvailability(
    usernameOrAddress: string,
    domain: AddressDomain = 'omail.com'
  ): Promise<{
    available: boolean;
    fullAddress: string;
    localPart: string;
    domain: AddressDomain;
    type: AddressType;
    status: AddressStatus;
    reservedForCubId?: string;
    reason?: string;
  }> {
    const validation = CubiOAddressValidator.validateAddress(usernameOrAddress, domain);
    if (!validation.isValid || !validation.fullAddress || !validation.localPart || !validation.domain) {
      return {
        available: false,
        fullAddress: validation.fullAddress || usernameOrAddress,
        localPart: validation.localPart || usernameOrAddress,
        domain,
        type: domain === 'cubio.com' ? 'CUBIO_PREMIUM' : 'OMAIL_FREE',
        status: 'AVAILABLE',
        reason: validation.error || 'Invalid address format',
      };
    }

    const { fullAddress, localPart } = validation;
    const targetDomain = validation.domain;
    const type: AddressType = targetDomain === 'cubio.com' ? 'CUBIO_PREMIUM' : 'OMAIL_FREE';

    // 1. Check existing address in repository
    const existing = await this.repository.getAddress(fullAddress);
    if (existing) {
      if (existing.status === 'OWNED') {
        return {
          available: false,
          fullAddress,
          localPart,
          domain: targetDomain,
          type,
          status: 'OWNED',
          reason: `Address '${fullAddress}' is already registered and owned.`,
        };
      }
      if (existing.status === 'SUSPENDED') {
        return {
          available: false,
          fullAddress,
          localPart,
          domain: targetDomain,
          type,
          status: 'SUSPENDED',
          reason: `Address '${fullAddress}' is currently suspended.`,
        };
      }
    }

    // 2. Check active reservations
    const reservation = await this.repository.getReservation(fullAddress);
    if (reservation && reservation.status === 'ACTIVE' && Date.now() < reservation.expiresAt) {
      return {
        available: false,
        fullAddress,
        localPart,
        domain: targetDomain,
        type,
        status: 'RESERVED',
        reservedForCubId: reservation.reservedForCubId,
        reason: `Address '${fullAddress}' is currently held under an active reservation.`,
      };
    }

    return {
      available: true,
      fullAddress,
      localPart,
      domain: targetDomain,
      type,
      status: 'AVAILABLE',
    };
  }

  /**
   * Assigns the default free @omail.com address to a sovereign CUB-XXXXXXXX identity.
   */
  public async assignFreeOMailAddress(
    cubId: string,
    username: string,
    metadata?: Record<string, any>
  ): Promise<Readonly<OMailAddress>> {
    const cleanCubId = cubId.trim();

    // 1. Verify identity exists in NET-01
    if (!this.identityRegistry.has(cleanCubId)) {
      throw new Error(`Cannot assign OMail address: Sovereign identity '${cleanCubId}' not found in NET-01 registry.`);
    }

    // 2. Validate address format
    const validation = CubiOAddressValidator.validateAddress(username, 'omail.com');
    if (!validation.isValid || !validation.fullAddress || !validation.localPart) {
      throw new Error(`OMail address assignment failed: ${validation.error}`);
    }

    const { fullAddress, localPart } = validation;

    // 3. Check existing ownership
    const existing = await this.repository.getAddress(fullAddress);
    if (existing) {
      if (existing.status === 'OWNED') {
        if (existing.ownerCubId === cleanCubId) {
          return existing as OMailAddress;
        }
        throw new Error(
          `Conflict: OMail address '${fullAddress}' is already owned by sovereign identity '${existing.ownerCubId}'.`
        );
      }
      if (existing.status === 'SUSPENDED') {
        throw new Error(`Cannot assign OMail address '${fullAddress}': Address is currently SUSPENDED.`);
      }
    }

    const now = Date.now();
    const addressId = `ADDR_${deterministicHash(`${cleanCubId}:${fullAddress}:${now}`).slice(2, 18)}`;

    const address: OMailAddress = Object.freeze({
      addressId,
      fullAddress,
      localPart,
      domain: 'omail.com',
      type: 'OMAIL_FREE',
      status: 'OWNED',
      ownerCubId: cleanCubId,
      registeredAt: now,
      updatedAt: now,
      metadata: metadata ? Object.freeze({ ...metadata }) : undefined,
    });

    const ownershipId = `OWN_${deterministicHash(`${cleanCubId}:${addressId}`).slice(2, 18)}`;
    const ownership: AddressOwnership = Object.freeze({
      ownershipId,
      addressId,
      fullAddress,
      cubId: cleanCubId,
      type: 'OMAIL_FREE',
      status: 'OWNED',
      isPrimary: true,
      boundAt: now,
      updatedAt: now,
    });

    await this.repository.saveAddress(address);
    await this.repository.saveOwnership(ownership);

    return address;
  }

  /**
   * Creates a time-limited reservation for a premium @cubio.com address.
   */
  public async reservePremiumAddress(
    cubId: string,
    username: string,
    options: {
      durationMs?: number;
      priceTier?: string;
    } = {}
  ): Promise<Readonly<AddressReservation>> {
    const cleanCubId = cubId.trim();

    // 1. Verify sovereign identity exists in NET-01
    if (!this.identityRegistry.has(cleanCubId)) {
      throw new Error(`Cannot reserve address: Sovereign identity '${cleanCubId}' not found in NET-01 registry.`);
    }

    // 2. Validate address format for cubio.com
    const validation = CubiOAddressValidator.validateAddress(username, 'cubio.com');
    if (!validation.isValid || !validation.fullAddress || !validation.localPart) {
      throw new Error(`Premium address reservation failed: ${validation.error}`);
    }

    const { fullAddress, localPart } = validation;

    // 3. Check current availability
    const avail = await this.checkAvailability(fullAddress, 'cubio.com');
    if (!avail.available) {
      if (avail.status === 'RESERVED' && avail.reservedForCubId === cleanCubId) {
        // Return existing active reservation for this CUB ID
        const existingRes = await this.repository.getReservation(fullAddress);
        if (existingRes && existingRes.status === 'ACTIVE') {
          return existingRes;
        }
      }
      throw new Error(`Cannot reserve '${fullAddress}': ${avail.reason || 'Address is not available.'}`);
    }

    const now = Date.now();
    const duration = options.durationMs || 15 * 60 * 1000; // Default: 15 minutes TTL
    const expiresAt = now + duration;
    const reservationId = `RES_${deterministicHash(`${cleanCubId}:${fullAddress}:${now}`).slice(2, 18)}`;
    const reservationToken = `RESTOK.${deterministicHash(`${reservationId}:${expiresAt}:${cleanCubId}`).slice(2, 34)}`;
    const addressId = `ADDR_${deterministicHash(`PREMIUM:${fullAddress}`).slice(2, 18)}`;

    const reservation: AddressReservation = Object.freeze({
      reservationId,
      addressId,
      fullAddress,
      localPart,
      domain: 'cubio.com',
      reservedForCubId: cleanCubId,
      reservedAt: now,
      expiresAt,
      status: 'ACTIVE',
      reservationToken,
      priceTier: options.priceTier || 'STANDARD',
    });

    await this.repository.saveReservation(reservation);
    return reservation;
  }

  /**
   * Claims / purchases a premium @cubio.com address and binds ownership to the sovereign CUB-ID.
   */
  public async claimPremiumAddress(
    cubId: string,
    username: string,
    options: {
      reservationToken?: string;
      tier?: 'STANDARD' | 'EXCLUSIVE' | 'BRAND';
      metadata?: Record<string, any>;
    } = {}
  ): Promise<Readonly<CubiOPremiumAddress>> {
    const cleanCubId = cubId.trim();

    // 1. Verify sovereign identity exists in NET-01
    if (!this.identityRegistry.has(cleanCubId)) {
      throw new Error(`Cannot claim address: Sovereign identity '${cleanCubId}' not found in NET-01 registry.`);
    }

    // 2. Validate address format
    const validation = CubiOAddressValidator.validateAddress(username, 'cubio.com');
    if (!validation.isValid || !validation.fullAddress || !validation.localPart) {
      throw new Error(`Premium address claim failed: ${validation.error}`);
    }

    const { fullAddress, localPart } = validation;

    // 3. Check existing address ownership
    const existing = await this.repository.getAddress(fullAddress);
    if (existing && existing.status === 'OWNED') {
      if (existing.ownerCubId === cleanCubId) {
        return existing as CubiOPremiumAddress;
      }
      throw new Error(
        `Conflict: Premium address '${fullAddress}' is already owned by sovereign identity '${existing.ownerCubId}'.`
      );
    }

    // 4. Verify reservation if present
    const reservation = await this.repository.getReservation(fullAddress);
    if (reservation && reservation.status === 'ACTIVE' && Date.now() < reservation.expiresAt) {
      if (reservation.reservedForCubId !== cleanCubId) {
        // Check if matching valid reservation token provided
        if (!options.reservationToken || options.reservationToken !== reservation.reservationToken) {
          throw new Error(
            `Cannot claim address '${fullAddress}': Address is reserved for another entity ('${reservation.reservedForCubId}').`
          );
        }
      }
    }

    const now = Date.now();
    const addressId = `ADDR_${deterministicHash(`${cleanCubId}:${fullAddress}:${now}`).slice(2, 18)}`;

    const address: CubiOPremiumAddress = Object.freeze({
      addressId,
      fullAddress,
      localPart,
      domain: 'cubio.com',
      type: 'CUBIO_PREMIUM',
      status: 'OWNED',
      ownerCubId: cleanCubId,
      registeredAt: now,
      updatedAt: now,
      reservationId: reservation?.reservationId,
      tier: options.tier || 'STANDARD',
      metadata: options.metadata ? Object.freeze({ ...options.metadata }) : undefined,
    });

    const ownershipId = `OWN_${deterministicHash(`${cleanCubId}:${addressId}`).slice(2, 18)}`;
    const ownership: AddressOwnership = Object.freeze({
      ownershipId,
      addressId,
      fullAddress,
      cubId: cleanCubId,
      type: 'CUBIO_PREMIUM',
      status: 'OWNED',
      isPrimary: false,
      boundAt: now,
      updatedAt: now,
    });

    if (reservation) {
      await this.repository.saveReservation({
        ...reservation,
        status: 'CLAIMED',
      });
    }

    await this.repository.saveAddress(address);
    await this.repository.saveOwnership(ownership);

    return address;
  }

  /**
   * Releases an address owned by a sovereign CUB-ID.
   */
  public async releaseAddress(
    cubId: string,
    fullAddressOrUsername: string,
    domain: AddressDomain = 'omail.com'
  ): Promise<boolean> {
    const cleanCubId = cubId.trim();
    const fullAddress = CubiOAddressValidator.normalizeAddress(fullAddressOrUsername, domain);

    const existing = await this.repository.getAddress(fullAddress);
    if (!existing) {
      throw new Error(`Address '${fullAddress}' not found.`);
    }

    if (existing.ownerCubId !== cleanCubId) {
      throw new Error(`Security Violation: Identity '${cleanCubId}' does not own address '${fullAddress}'.`);
    }

    await this.repository.updateAddressStatus(fullAddress, 'RELEASED');
    await this.repository.deleteOwnership(fullAddress);
    return true;
  }

  /**
   * Suspends an address (Administrative action).
   */
  public async suspendAddress(
    adminCubId: string,
    fullAddressOrUsername: string,
    domain: AddressDomain = 'omail.com'
  ): Promise<boolean> {
    const fullAddress = CubiOAddressValidator.normalizeAddress(fullAddressOrUsername, domain);
    const existing = await this.repository.getAddress(fullAddress);
    if (!existing) {
      throw new Error(`Address '${fullAddress}' not found.`);
    }

    return this.repository.updateAddressStatus(fullAddress, 'SUSPENDED');
  }

  /**
   * Unsuspends an address (Administrative action).
   */
  public async unsuspendAddress(
    adminCubId: string,
    fullAddressOrUsername: string,
    domain: AddressDomain = 'omail.com'
  ): Promise<boolean> {
    const fullAddress = CubiOAddressValidator.normalizeAddress(fullAddressOrUsername, domain);
    const existing = await this.repository.getAddress(fullAddress);
    if (!existing) {
      throw new Error(`Address '${fullAddress}' not found.`);
    }

    return this.repository.updateAddressStatus(fullAddress, 'OWNED');
  }

  /**
   * Resolves a public email address (@omail.com or @cubio.com) to its sovereign CUB-ID.
   */
  public async resolveAddress(
    addressString: string,
    defaultDomain: AddressDomain = 'omail.com'
  ): Promise<Readonly<AddressResolutionResult>> {
    let normalized: string;
    try {
      normalized = CubiOAddressValidator.normalizeAddress(addressString, defaultDomain);
    } catch (err: any) {
      return Object.freeze({
        found: false,
        fullAddress: addressString,
        error: `Invalid address: ${err.message}`,
      });
    }

    const address = await this.repository.getAddress(normalized);
    if (!address || address.status !== 'OWNED' || !address.ownerCubId) {
      return Object.freeze({
        found: false,
        fullAddress: normalized,
        status: address?.status || 'AVAILABLE',
        error: `Address '${normalized}' is not currently owned by any sovereign identity.`,
      });
    }

    return Object.freeze({
      found: true,
      fullAddress: normalized,
      cubId: address.ownerCubId,
      address,
      status: address.status,
    });
  }

  /**
   * Retrieves all addresses owned by a sovereign CUB-XXXXXXXX identity.
   */
  public async getAddressesForIdentity(cubId: string): Promise<readonly CubiOAddress[]> {
    return this.repository.getAddressesByCubId(cubId.trim());
  }

  /**
   * Resolves the primary address for an identity.
   */
  public async getPrimaryAddress(cubId: string): Promise<CubiOAddress | undefined> {
    const addresses = await this.getAddressesForIdentity(cubId);
    if (addresses.length === 0) return undefined;

    // Prefer @cubio.com if owned, else first active @omail.com
    const premium = addresses.find((a) => a.type === 'CUBIO_PREMIUM' && a.status === 'OWNED');
    if (premium) return premium;

    const free = addresses.find((a) => a.type === 'OMAIL_FREE' && a.status === 'OWNED');
    if (free) return free;

    return addresses[0];
  }
}
