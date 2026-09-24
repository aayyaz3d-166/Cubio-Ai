/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-03: Authorization Middleware & Security Guard
 *
 * Verifies session credentials from NET-02 and evaluates authorization via NET-03 policy engine.
 *
 * Security Invariant:
 * Never trust client-supplied CUB IDs or roles. Derives identity solely from verified server sessions.
 */

import { CubiOAuthEngine } from '../auth/authEngine';
import { CubiOPolicyEngine } from './policyEngine';
import { AccessDecision } from './types';
import { CubiOIdentity } from '../identity/types';
import { AuthSession } from '../auth/types';

export class CubiOAuthzMiddleware {
  private policyEngine: CubiOPolicyEngine;

  constructor(policyEngine?: CubiOPolicyEngine) {
    this.policyEngine = policyEngine || new CubiOPolicyEngine();
  }

  public getPolicyEngine(): CubiOPolicyEngine {
    return this.policyEngine;
  }

  /**
   * Authorizes an incoming network operation by validating the session token and evaluating access policies.
   */
  public async authorizeRequest(
    authEngine: CubiOAuthEngine,
    tokenStringOrSessionId: string,
    destinationCoordinate: string,
    action: string
  ): Promise<{
    authorized: boolean;
    cubId?: string;
    session?: AuthSession;
    identity?: CubiOIdentity;
    decision?: AccessDecision;
    error?: string;
  }> {
    // 1. Authenticate session / token via NET-02
    let authVerification;
    if (tokenStringOrSessionId.startsWith('CUBTOK.')) {
      authVerification = await authEngine.verifyToken(tokenStringOrSessionId);
    } else {
      authVerification = await authEngine.verifySession(tokenStringOrSessionId);
    }

    if (!authVerification.isValid || !authVerification.identity || !authVerification.session) {
      return {
        authorized: false,
        error: `Authentication failed: ${authVerification.error || 'Invalid session credentials.'}`,
      };
    }

    const { identity, session } = authVerification;

    // 2. Evaluate authorization policy via NET-03
    const decision = this.policyEngine.evaluate({
      cubId: identity.cubId,
      action,
      resourceUri: destinationCoordinate,
    });

    if (!decision.allowed) {
      return {
        authorized: false,
        cubId: identity.cubId,
        session,
        identity,
        decision,
        error: `Authorization denied: ${decision.reason}`,
      };
    }

    return {
      authorized: true,
      cubId: identity.cubId,
      session,
      identity,
      decision,
    };
  }
}
