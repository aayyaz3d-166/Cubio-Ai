/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-02: Master Authentication Engine
 *
 * Unified authentication orchestrator executing:
 * 1. Rate-limit evaluation
 * 2. Provider adapter authentication
 * 3. NET-01 Sovereign Identity resolution (or provisioning)
 * 4. Session & token issuance
 * 5. NET-00 Coordinate attachment
 * 6. Audit event logging
 *
 * Strict Architectural Separation:
 * NET-02 authenticates -> NET-01 identifies -> NET-00 locates.
 */

import { CubiOIdentityRegistry } from '../identity/identityRegistry';
import { CubiOIdentityCoordinateAdapter } from '../identity/coordinateAdapter';
import { CubiOIdentity } from '../identity/types';
import { CubiOAuthRegistry } from './authRegistry';
import { CubiOSessionManager } from './sessionManager';
import { CubiOTokenManager } from './tokenManager';
import { CubiOAuthRateLimiter } from './rateLimiter';
import { CubiOAuthEventLogger } from './authEvents';
import {
  AuthenticationRequest,
  AuthenticationResult,
  AuthSession,
  CubiOAuthToken,
} from './types';

export class CubiOAuthEngine {
  private authRegistry: CubiOAuthRegistry;
  private identityRegistry: CubiOIdentityRegistry;
  private sessionManager: CubiOSessionManager;
  private tokenManager: CubiOTokenManager;
  private rateLimiter: CubiOAuthRateLimiter;
  private eventLogger: CubiOAuthEventLogger;

  constructor(options: {
    authRegistry?: CubiOAuthRegistry;
    identityRegistry?: CubiOIdentityRegistry;
    sessionManager?: CubiOSessionManager;
    tokenManager?: CubiOTokenManager;
    rateLimiter?: CubiOAuthRateLimiter;
    eventLogger?: CubiOAuthEventLogger;
  } = {}) {
    this.authRegistry = options.authRegistry || new CubiOAuthRegistry();
    this.identityRegistry = options.identityRegistry || new CubiOIdentityRegistry();
    this.sessionManager = options.sessionManager || new CubiOSessionManager();
    this.tokenManager = options.tokenManager || new CubiOTokenManager();
    this.rateLimiter = options.rateLimiter || new CubiOAuthRateLimiter();
    this.eventLogger = options.eventLogger || new CubiOAuthEventLogger();
  }

  public getAuthRegistry(): CubiOAuthRegistry {
    return this.authRegistry;
  }

  public getIdentityRegistry(): CubiOIdentityRegistry {
    return this.identityRegistry;
  }

  public getSessionManager(): CubiOSessionManager {
    return this.sessionManager;
  }

  public getTokenManager(): CubiOTokenManager {
    return this.tokenManager;
  }

  public getRateLimiter(): CubiOAuthRateLimiter {
    return this.rateLimiter;
  }

  public getEventLogger(): CubiOAuthEventLogger {
    return this.eventLogger;
  }

  /**
   * Primary authentication endpoint.
   */
  public async authenticate(
    request: AuthenticationRequest,
    options: {
      autoProvisionIdentity?: boolean;
      sessionTtlSeconds?: number;
      defaultDimension?: number;
      defaultZone?: number;
    } = {}
  ): Promise<Readonly<AuthenticationResult>> {
    const provider = request.provider?.toUpperCase();
    const ip = request.clientMetadata?.ipAddress || '127.0.0.1';

    // 1. Rate Limit Evaluation
    const rateCheck = await this.rateLimiter.evaluateLimit('IP', ip);
    if (!rateCheck.allowed) {
      await this.eventLogger.logEvent('AUTH_RATE_LIMITED', {
        provider,
        ipAddress: ip,
        details: `IP '${ip}' exceeded authentication rate limit.`,
      });
      return Object.freeze({
        success: false,
        error: rateCheck.error || 'Authentication rate limit exceeded.',
        errorCode: 'ERR_RATE_LIMITED',
      });
    }

    // 2. Dispatch to Provider Adapter
    const adapter = this.authRegistry.getAdapter(provider);
    if (!adapter) {
      await this.eventLogger.logEvent('AUTH_FAILURE', {
        provider,
        ipAddress: ip,
        details: `Unknown or unregistered authentication provider '${provider}'.`,
      });
      return Object.freeze({
        success: false,
        error: `Unsupported authentication provider: '${provider}'.`,
        errorCode: 'ERR_UNKNOWN_PROVIDER',
      });
    }

    await this.eventLogger.logEvent('AUTH_STARTED', {
      provider,
      ipAddress: ip,
      details: `Authentication attempt initiated via provider '${provider}'.`,
    });

    let subject;
    try {
      subject = await adapter.authenticate(request);
    } catch (err: any) {
      await this.eventLogger.logEvent('AUTH_FAILURE', {
        provider,
        ipAddress: ip,
        details: `Provider authentication rejected: ${err.message}`,
      });
      return Object.freeze({
        success: false,
        error: err.message || 'Provider authentication failed.',
        errorCode: 'ERR_PROVIDER_REJECTED',
      });
    }

    // 3. Resolve Sovereign NET-01 Identity
    let identity: CubiOIdentity | undefined = this.identityRegistry.resolveByProvider(
      subject.provider,
      subject.subjectId
    );

    // If not found and auto-provision enabled, create NET-01 identity
    if (!identity) {
      if (options.autoProvisionIdentity !== false) {
        const canonicalSeed = subject.email || `${subject.provider}:${subject.subjectId}`;
        try {
          identity = this.identityRegistry.createAndRegister('USER', canonicalSeed, {
            name: subject.displayName || `User_${subject.subjectId.slice(0, 8)}`,
            initialProvider: {
              provider: subject.provider,
              subjectId: subject.subjectId,
              email: subject.email,
              displayName: subject.displayName,
              linkedAt: Date.now(),
            },
            originSource: `${subject.provider}_PROVISION`,
          });
        } catch (provErr: any) {
          await this.eventLogger.logEvent('AUTH_FAILURE', {
            provider: subject.provider,
            subjectId: subject.subjectId,
            ipAddress: ip,
            details: `Identity provisioning failed: ${provErr.message}`,
          });
          return Object.freeze({
            success: false,
            error: `Failed to provision identity: ${provErr.message}`,
            errorCode: 'ERR_IDENTITY_PROVISION',
          });
        }
      } else {
        await this.eventLogger.logEvent('AUTH_FAILURE', {
          provider: subject.provider,
          subjectId: subject.subjectId,
          ipAddress: ip,
          details: `No NET-01 identity linked to provider subject '${subject.subjectId}'.`,
        });
        return Object.freeze({
          success: false,
          subject,
          error: `No sovereign CubiO Identity linked to provider '${subject.provider}' subject '${subject.subjectId}'.`,
          errorCode: 'ERR_UNLINKED_IDENTITY',
        });
      }
    }

    // 4. Create Active Session
    const session = await this.sessionManager.createSession(
      identity.cubId,
      subject.provider,
      subject.subjectId,
      {
        ttlSeconds: options.sessionTtlSeconds,
        clientMetadata: request.clientMetadata,
      }
    );

    // 5. Issue Signed Token
    const sessionToken = this.tokenManager.issueToken(
      session.sessionId,
      identity.cubId,
      subject.provider,
      options.sessionTtlSeconds
    );

    // 6. NET-00 Network Coordinate Attachment
    const coordinateUri = CubiOIdentityCoordinateAdapter.formatIdentityAddress(identity, {
      dimension: options.defaultDimension !== undefined ? options.defaultDimension : 0,
      zone: options.defaultZone !== undefined ? options.defaultZone : 1,
    });

    // 7. Log Success Event & Reset Rate Limiter
    await this.rateLimiter.resetLimit('IP', ip);
    await this.eventLogger.logEvent('AUTH_SUCCESS', {
      provider: subject.provider,
      cubId: identity.cubId,
      subjectId: subject.subjectId,
      ipAddress: ip,
      details: `Authentication succeeded for ${identity.cubId} via ${subject.provider}.`,
    });

    await this.eventLogger.logEvent('SESSION_CREATED', {
      provider: subject.provider,
      cubId: identity.cubId,
      subjectId: subject.subjectId,
      details: `Session '${session.sessionId}' created.`,
    });

    return Object.freeze({
      success: true,
      subject,
      cubId: identity.cubId,
      identity,
      session,
      sessionToken,
      coordinateUri,
    });
  }

  /**
   * Verifies an active session and returns the associated NET-01 sovereign identity.
   */
  public async verifySession(sessionId: string): Promise<{
    isValid: boolean;
    session?: AuthSession;
    identity?: CubiOIdentity;
    error?: string;
  }> {
    const sessionVerification = await this.sessionManager.verifySession(sessionId);
    if (!sessionVerification.isValid || !sessionVerification.session) {
      return { isValid: false, error: sessionVerification.error || 'Invalid session.' };
    }

    const identity = this.identityRegistry.get(sessionVerification.session.cubId);
    if (!identity) {
      return { isValid: false, error: `Sovereign identity '${sessionVerification.session.cubId}' not found.` };
    }

    await this.eventLogger.logEvent('SESSION_VERIFIED', {
      cubId: identity.cubId,
      details: `Session '${sessionId}' verified.`,
    });

    return {
      isValid: true,
      session: sessionVerification.session,
      identity,
    };
  }

  /**
   * Verifies a session token string, checks its signature, expiration, and resolves the session & identity.
   */
  public async verifyToken(tokenString: string): Promise<{
    isValid: boolean;
    session?: AuthSession;
    identity?: CubiOIdentity;
    error?: string;
  }> {
    const tokenResult = this.tokenManager.verifyToken(tokenString);
    if (!tokenResult.isValid || !tokenResult.sessionId) {
      return { isValid: false, error: tokenResult.error || 'Invalid token.' };
    }

    return this.verifySession(tokenResult.sessionId);
  }

  /**
   * Refreshes an active session.
   */
  public async refreshSession(
    sessionId: string,
    extendSeconds?: number
  ): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
    const result = await this.sessionManager.refreshSession(sessionId, extendSeconds);
    if (result.success && result.session) {
      await this.eventLogger.logEvent('SESSION_REFRESHED', {
        cubId: result.session.cubId,
        details: `Session '${sessionId}' refreshed.`,
      });
    }
    return result;
  }

  /**
   * Revokes an active session.
   */
  public async revokeSession(sessionId: string, reason = 'Explicit revocation'): Promise<boolean> {
    const session = await this.sessionManager.verifySession(sessionId);
    const ok = await this.sessionManager.revokeSession(sessionId);
    if (ok && session.session) {
      await this.eventLogger.logEvent('SESSION_REVOKED', {
        cubId: session.session.cubId,
        details: `Session '${sessionId}' revoked: ${reason}.`,
      });
    }
    return ok;
  }

  /**
   * Logout endpoint.
   */
  public async logout(sessionId: string): Promise<boolean> {
    const session = await this.sessionManager.verifySession(sessionId);
    const ok = await this.sessionManager.logout(sessionId);
    if (ok && session.session) {
      await this.eventLogger.logEvent('LOGOUT', {
        cubId: session.session.cubId,
        details: `User logged out of session '${sessionId}'.`,
      });
    }
    return ok;
  }
}
