/**
 * CubiO — Universal Spatial Operating Environment
 * Process 3: Security & Data Boundary Guard
 *
 * Enforces strict ontological and cryptographic isolation across:
 * NET-00: WHERE (Network Coordinate)
 * NET-01: WHO (Sovereign Identity CUB-XXXXXXXX)
 * NET-02: PROVE WHO (Authentication & Sessions)
 * NET-03: WHAT IS ALLOWED (Authorization & Policies)
 * NET-04: ACCOUNT (Profile & Settings)
 *
 * Critical Security Invariants:
 * 1. Zero secrets in sovereign identity objects (no passwords, private keys, OAuth tokens).
 * 2. Never trust client-supplied CUB IDs, roles, permissions, or auth status.
 * 3. Server-side session verification, expiration, and instant revocation enforcement.
 * 4. Strict account ownership boundary matching verified CUB ID.
 */

import { CubiOIdentity } from '../identity/types';
import { AuthSession, CubiOAuthToken } from '../auth/types';
import { CubiOAccount } from '../account/types';
import { CubiONetworkCoordinate } from '../coordinate/types';

export class CubiOSecurityBoundaryGuard {
  private static FORBIDDEN_SECRET_KEYS = [
    'password',
    'passwordHash',
    'salt',
    'secret',
    'serverSecret',
    'privateKey',
    'token',
    'sessionToken',
    'accessToken',
    'refreshToken',
    'idToken',
    'apiKey',
  ];

  /**
   * Asserts that a CubiOIdentity object is completely clean of secrets, credentials, and tokens.
   */
  public static assertIdentityCleanliness(identity: CubiOIdentity): { isClean: boolean; violations: string[] } {
    const violations: string[] = [];

    if (!identity || typeof identity !== 'object') {
      return { isClean: false, violations: ['Invalid identity object'] };
    }

    const checkObject = (obj: any, path: string) => {
      if (!obj || typeof obj !== 'object') return;
      for (const [key, value] of Object.entries(obj)) {
        const fullPath = path ? `${path}.${key}` : key;
        const lowerKey = key.toLowerCase();

        let isForbidden = false;
        for (const forbidden of this.FORBIDDEN_SECRET_KEYS) {
          if (lowerKey === forbidden.toLowerCase() || lowerKey.includes('password') || lowerKey.includes('secret') || lowerKey.includes('token') || lowerKey.includes('key')) {
            isForbidden = true;
            break;
          }
        }
        if (isForbidden) {
          violations.push(`Forbidden secret key '${fullPath}' exposed in sovereign identity object.`);
        }

        if (typeof value === 'object' && value !== null) {
          checkObject(value, fullPath);
        }
      }
    };

    checkObject(identity, '');

    return {
      isClean: violations.length === 0,
      violations,
    };
  }

  /**
   * Asserts that caller identity and roles derive strictly from server-verified sessions.
   */
  public static assertServerDerivedAuthority(
    clientClaimedCubId: string | undefined,
    verifiedSessionCubId: string
  ): boolean {
    if (!verifiedSessionCubId || typeof verifiedSessionCubId !== 'string') {
      throw new Error('Security Exception: Missing verified server session identity.');
    }

    // If client supplied a cubId, it MUST match the verified server session CUB ID exactly
    if (clientClaimedCubId && clientClaimedCubId.trim() !== verifiedSessionCubId.trim()) {
      throw new Error(
        `Security Boundary Violation: Client-claimed CUB ID '${clientClaimedCubId}' does not match server-verified session CUB ID '${verifiedSessionCubId}'.`
      );
    }

    return true;
  }

  /**
   * Asserts that a session is active, unexpired, and not revoked.
   */
  public static assertSessionIntegrity(session: AuthSession, now = Date.now()): void {
    if (!session || !session.sessionId) {
      throw new Error('Security Exception: Malformed or missing session.');
    }

    if (session.status === 'REVOKED') {
      throw new Error(`Security Exception: Session '${session.sessionId}' has been revoked.`);
    }

    if (session.status === 'EXPIRED' || now > session.expiresAt) {
      throw new Error(`Security Exception: Session '${session.sessionId}' expired at ${new Date(session.expiresAt).toISOString()}.`);
    }

    if (session.status !== 'ACTIVE') {
      throw new Error(`Security Exception: Session status is '${session.status}', must be 'ACTIVE'.`);
    }
  }

  /**
   * Asserts that an account operation is permitted only for the verified sovereign owner.
   */
  public static assertAccountOwnership(account: CubiOAccount, verifiedCubId: string): void {
    if (!account || !account.cubId) {
      throw new Error('Security Exception: Invalid account object.');
    }

    if (account.cubId.trim() !== verifiedCubId.trim()) {
      throw new Error(
        `Security Exception: Sovereign CUB ID '${verifiedCubId}' does not own account '${account.accountId}' (Owner: '${account.cubId}').`
      );
    }
  }

  /**
   * Asserts that network coordinate matches canonical NET-00 addressing structure.
   */
  public static assertCoordinateAlignment(
    coordinate: CubiONetworkCoordinate,
    expectedDimension = 0,
    expectedZone = 1
  ): void {
    if (coordinate.network !== 'CUBIO') {
      throw new Error(`Invalid network scheme: '${coordinate.network}'. Must be 'CUBIO'.`);
    }

    if (coordinate.dimension < 0 || coordinate.dimension > 99) {
      throw new Error(`Invalid dimension: ${coordinate.dimension}. Must be in range [0..99].`);
    }

    if (coordinate.zone < 0 || coordinate.zone > 99) {
      throw new Error(`Invalid zone: ${coordinate.zone}. Must be in range [0..99].`);
    }

    if (coordinate.node < 0 || coordinate.node > 99999) {
      throw new Error(`Invalid node: ${coordinate.node}. Must be in range [0..99999].`);
    }
  }
}
