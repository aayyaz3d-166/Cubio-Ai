/**
 * CubiO — Universal Spatial Operating Environment
 * Process 2: Master CubiO User Flow Manager
 *
 * Implements the complete end-to-end reactive user flow:
 * User opens CubiO
 *   ↓
 * Login / Authentication (Google / Native / Passkey / Web3)
 *   ↓
 * Resolve CUB-XXXXXXXX (Sovereign NET-01 Identity)
 *   ↓
 * Create authenticated session & cryptographic token (NET-02)
 *   ↓
 * Check permissions (NET-03 Authorization & Roles)
 *   ↓
 * Resolve CubiO Account (NET-04 Profile, Settings, Tier)
 *   ↓
 * Connect account to CubiO Network Coordinate (NET-00 Canonical Address)
 *   ↓
 * Access CubiO services (Spatial Studio, Intelligence, Mail, Storage, Terminal)
 */

import { CubiONetworkStack } from '../stack';
import { CubiOIdentityCoordinateAdapter } from '../identity/coordinateAdapter';
import {
  CubiOUserSessionState,
  UserLoginInput,
  ServiceAccessResult,
  UserFlowStage,
} from './types';
import { NetworkRole, NetworkPermission } from '../authz/types';

export class CubiOUserFlowManager {
  private stack: CubiONetworkStack;
  private state: CubiOUserSessionState;
  private listeners: Set<(state: CubiOUserSessionState) => void> = new Set();

  constructor(stack?: CubiONetworkStack) {
    this.stack = stack || new CubiONetworkStack();
    this.state = Object.freeze({
      stage: 'UNAUTHENTICATED',
      isAuthenticated: false,
      role: 'GUEST',
      permissions: Object.freeze(['NETWORK_READ']),
      activeService: 'CORE_STUDIO',
      completedHops: Object.freeze([]),
    });
  }

  public getStack(): CubiONetworkStack {
    return this.stack;
  }

  public getState(): Readonly<CubiOUserSessionState> {
    return this.state;
  }

  public subscribe(listener: (state: CubiOUserSessionState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private updateState(partial: Partial<CubiOUserSessionState>): void {
    this.state = Object.freeze({
      ...this.state,
      ...partial,
    });
    this.listeners.forEach((listener) => listener(this.state));
  }

  /**
   * Executes the complete multi-stage user authentication & connection flow.
   */
  public async authenticate(input: UserLoginInput): Promise<Readonly<CubiOUserSessionState>> {
    const hops: string[] = ['USER_FLOW_START'];

    try {
      // 1. Stage: AUTHENTICATING
      this.updateState({ stage: 'AUTHENTICATING', lastError: undefined });
      hops.push(`AUTH_PROVIDER:${input.provider}`);

      const authResult = await this.stack.authEngine.authenticate(
        {
          provider: input.provider,
          payload: input.payload,
        },
        {
          autoProvisionIdentity: input.autoProvision !== false,
        }
      );

      if (!authResult.success || !authResult.identity || !authResult.session || !authResult.sessionToken) {
        throw new Error(authResult.error || 'Authentication rejected by provider.');
      }

      const { identity, session, sessionToken, subject } = authResult;

      // 2. Stage: RESOLVING_IDENTITY
      hops.push(`NET01_SOVEREIGN_ID:${identity.cubId}`);
      this.updateState({
        stage: 'RESOLVING_IDENTITY',
        cubId: identity.cubId,
        identity,
      });

      // 3. Stage: CREATING_SESSION
      hops.push(`NET02_SESSION_ACTIVE:${session.sessionId}`);
      this.updateState({
        stage: 'CREATING_SESSION',
        session,
        sessionToken,
      });

      // 4. Stage: CHECKING_PERMISSIONS
      const role: NetworkRole = this.stack.roleManager.getRole(identity.cubId);
      const permissions: readonly NetworkPermission[] = this.stack.roleManager.getPermissions(role);
      hops.push(`NET03_ROLE_PERMS:${role}`);
      this.updateState({
        stage: 'CHECKING_PERMISSIONS',
        role,
        permissions,
      });

      // 5. Stage: RESOLVING_ACCOUNT
      let account = await this.stack.accountService.getAccount(identity.cubId);
      if (!account) {
        // Auto-provision account profile if first-time onboarding
        const username = input.username || subject?.displayName?.toLowerCase().replace(/\s+/g, '_') || `user_${identity.cubId.slice(4).toLowerCase()}`;
        account = await this.stack.accountService.createAccount(identity.cubId, {
          username,
          displayName: input.displayName || subject?.displayName || identity.name,
          email: subject?.email,
          tier: 'FREE',
        });
      }

      if (account.status !== 'ACTIVE') {
        throw new Error(`CubiO Account status is '${account.status}'. Access restricted.`);
      }

      hops.push(`NET04_ACCOUNT:${account.username}`);
      this.updateState({
        stage: 'RESOLVING_ACCOUNT',
        account,
      });

      // 6. Stage: CONNECTING_COORDINATE
      const coordinate = CubiOIdentityCoordinateAdapter.mapIdentityToCoordinate(identity, {
        dimension: account.settings.defaultDimension,
        zone: account.settings.defaultZone,
      });
      const coordinateUri = CubiOIdentityCoordinateAdapter.formatIdentityAddress(identity, {
        dimension: account.settings.defaultDimension,
        zone: account.settings.defaultZone,
      });

      hops.push(`NET00_COORDINATE:${coordinateUri}`);
      this.updateState({
        stage: 'CONNECTING_COORDINATE',
        coordinate,
        coordinateUri,
      });

      // 7. Stage: AUTHENTICATED_READY
      hops.push('USER_FLOW_READY');
      this.updateState({
        stage: 'AUTHENTICATED_READY',
        isAuthenticated: true,
        completedHops: Object.freeze(hops),
      });

      return this.state;
    } catch (err: any) {
      hops.push(`USER_FLOW_ERROR:${err.message}`);
      this.updateState({
        stage: 'ERROR',
        isAuthenticated: false,
        lastError: err.message || 'Authentication flow failed.',
        completedHops: Object.freeze(hops),
      });
      throw err;
    }
  }

  /**
   * Dispatches a network operation to access a CubiO service.
   */
  public async accessService(
    serviceCoordinate: string,
    action = 'SERVICE_INVOKE',
    payload?: any
  ): Promise<ServiceAccessResult> {
    if (!this.state.isAuthenticated || !this.state.sessionToken) {
      return {
        success: false,
        service: 'UNKNOWN',
        action,
        coordinateUri: serviceCoordinate,
        traceHops: ['UNAUTHENTICATED'],
        error: 'User is not authenticated. Please log in first.',
      };
    }

    const execution = await this.stack.executeNetworkOperation(
      this.state.sessionToken.token,
      serviceCoordinate,
      action,
      payload
    );

    return {
      success: execution.success,
      service: serviceCoordinate.split('/').pop() || 'SERVICE',
      action,
      coordinateUri: serviceCoordinate,
      traceHops: execution.traceHops,
      error: execution.error,
    };
  }

  /**
   * Logs out the active user and invalidates the session.
   */
  public async logout(): Promise<void> {
    if (this.state.session?.sessionId) {
      await this.stack.authEngine.logout(this.state.session.sessionId);
    }

    this.state = Object.freeze({
      stage: 'UNAUTHENTICATED',
      isAuthenticated: false,
      role: 'GUEST',
      permissions: Object.freeze(['NETWORK_READ']),
      activeService: 'CORE_STUDIO',
      completedHops: Object.freeze([]),
    });

    this.listeners.forEach((listener) => listener(this.state));
  }
}
