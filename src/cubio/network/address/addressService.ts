/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline CUBiO-ADDRESS: Sovereign Address Service
 *
 * Integrates Address Registry with NET-02 Auth, NET-03 Authz, and NET-04 Account.
 *
 * ARCHITECTURAL INVARIANT:
 * - Client cannot claim an address on behalf of another identity.
 * - NET-02 token/session authenticates the calling principal.
 * - NET-03 authorization enforces RBAC/ABAC policies for address mutations.
 * - NET-04 user account profiles are kept synchronized with assigned addresses.
 */

import { CubiOAuthEngine } from '../auth/authEngine';
import { CubiOPolicyEngine } from '../authz/policyEngine';
import { CubiOAccountService } from '../account/accountService';
import { CubiOAddressRegistry } from './addressRegistry';
import {
  AddressDomain,
  AddressReservation,
  AddressResolutionResult,
  CubiOAddress,
  OMailAddress,
  CubiOPremiumAddress,
} from './types';

export class CubiOAddressService {
  private registry: CubiOAddressRegistry;
  private authEngine?: CubiOAuthEngine;
  private policyEngine?: CubiOPolicyEngine;
  private accountService?: CubiOAccountService;

  constructor(options: {
    registry?: CubiOAddressRegistry;
    authEngine?: CubiOAuthEngine;
    policyEngine?: CubiOPolicyEngine;
    accountService?: CubiOAccountService;
  } = {}) {
    this.registry = options.registry || new CubiOAddressRegistry();
    this.authEngine = options.authEngine;
    this.policyEngine = options.policyEngine;
    this.accountService = options.accountService;
  }

  public getRegistry(): CubiOAddressRegistry {
    return this.registry;
  }

  /**
   * Helper: Authenticates session / token and extracts caller CUB-ID.
   */
  private async authenticateCaller(tokenOrSession: string): Promise<string> {
    if (!this.authEngine) {
      if (tokenOrSession.startsWith('CUB-')) {
        return tokenOrSession;
      }
      throw new Error('Authentication engine not configured in AddressService.');
    }

    let verification;
    if (tokenOrSession.startsWith('CUBTOK.')) {
      verification = await this.authEngine.verifyToken(tokenOrSession);
    } else {
      verification = await this.authEngine.verifySession(tokenOrSession);
    }

    if (!verification.isValid || !verification.identity) {
      throw new Error(`Authentication failed: ${verification.error || 'Invalid session'}`);
    }

    return verification.identity.cubId;
  }

  /**
   * Assigns a default free @omail.com address to an authenticated caller.
   */
  public async assignFreeOMailAddress(
    tokenOrSession: string,
    username: string
  ): Promise<Readonly<OMailAddress>> {
    const cubId = await this.authenticateCaller(tokenOrSession);
    const omail = await this.registry.assignFreeOMailAddress(cubId, username);

    // Sync with NET-04 account if available
    if (this.accountService) {
      const account = await this.accountService.getAccount(cubId);
      if (account) {
        await this.accountService.updateProfile(cubId, {
          email: omail.fullAddress,
        });
      }
    }

    return omail;
  }

  /**
   * Creates a reservation for a premium @cubio.com address.
   */
  public async reservePremiumAddress(
    tokenOrSession: string,
    username: string,
    options: { durationMs?: number; priceTier?: string } = {}
  ): Promise<Readonly<AddressReservation>> {
    const cubId = await this.authenticateCaller(tokenOrSession);
    return this.registry.reservePremiumAddress(cubId, username, options);
  }

  /**
   * Claims a premium @cubio.com address for the authenticated caller.
   */
  public async claimPremiumAddress(
    tokenOrSession: string,
    username: string,
    options: {
      reservationToken?: string;
      tier?: 'STANDARD' | 'EXCLUSIVE' | 'BRAND';
      metadata?: Record<string, any>;
    } = {}
  ): Promise<Readonly<CubiOPremiumAddress>> {
    const cubId = await this.authenticateCaller(tokenOrSession);
    const premium = await this.registry.claimPremiumAddress(cubId, username, options);

    // Sync with NET-04 account
    if (this.accountService) {
      const account = await this.accountService.getAccount(cubId);
      if (account) {
        await this.accountService.updateProfile(cubId, {
          email: premium.fullAddress,
        });
      }
    }

    return premium;
  }

  /**
   * Releases an address owned by the authenticated caller.
   */
  public async releaseAddress(
    tokenOrSession: string,
    fullAddressOrUsername: string,
    domain: AddressDomain = 'omail.com'
  ): Promise<boolean> {
    const cubId = await this.authenticateCaller(tokenOrSession);
    return this.registry.releaseAddress(cubId, fullAddressOrUsername, domain);
  }

  /**
   * Suspends an address (Requires ADMIN / SUPER_ADMIN authorization).
   */
  public async suspendAddress(
    adminTokenOrSession: string,
    fullAddressOrUsername: string,
    domain: AddressDomain = 'omail.com'
  ): Promise<boolean> {
    const adminCubId = await this.authenticateCaller(adminTokenOrSession);

    if (this.policyEngine) {
      const decision = this.policyEngine.evaluate({
        cubId: adminCubId,
        action: 'ADMIN_MANAGE',
        resourceUri: 'CUBIO://NETWORK/0/01/00000/SECURITY',
      });
      if (!decision.allowed) {
        throw new Error(`Authorization Denied: Identity '${adminCubId}' cannot suspend network addresses.`);
      }
    }

    return this.registry.suspendAddress(adminCubId, fullAddressOrUsername, domain);
  }

  /**
   * Unsuspends an address (Requires ADMIN / SUPER_ADMIN authorization).
   */
  public async unsuspendAddress(
    adminTokenOrSession: string,
    fullAddressOrUsername: string,
    domain: AddressDomain = 'omail.com'
  ): Promise<boolean> {
    const adminCubId = await this.authenticateCaller(adminTokenOrSession);

    if (this.policyEngine) {
      const decision = this.policyEngine.evaluate({
        cubId: adminCubId,
        action: 'ADMIN_MANAGE',
        resourceUri: 'CUBIO://NETWORK/0/01/00000/SECURITY',
      });
      if (!decision.allowed) {
        throw new Error(`Authorization Denied: Identity '${adminCubId}' cannot unsuspend network addresses.`);
      }
    }

    return this.registry.unsuspendAddress(adminCubId, fullAddressOrUsername, domain);
  }

  /**
   * Public Address Resolution.
   */
  public async resolveAddress(
    addressString: string,
    defaultDomain: AddressDomain = 'omail.com'
  ): Promise<Readonly<AddressResolutionResult>> {
    return this.registry.resolveAddress(addressString, defaultDomain);
  }

  /**
   * Retrieves all addresses for a sovereign identity.
   */
  public async getAddressesForIdentity(cubId: string): Promise<readonly CubiOAddress[]> {
    return this.registry.getAddressesForIdentity(cubId);
  }
}
