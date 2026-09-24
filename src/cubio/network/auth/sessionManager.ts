/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-02: Authentication Session Lifecycle Manager
 *
 * Implements session creation, verification, TTL expiration, refresh, and revocation.
 */

import { deterministicHash } from '../../state/determinism';
import { AuthSession, AuthenticationProviderType } from './types';
import { IAuthSessionRepository } from './repositories/types';
import { MemoryAuthSessionRepository } from './repositories/memoryRepositories';

export class CubiOSessionManager {
  private repository: IAuthSessionRepository;
  private defaultSessionTtlSeconds: number;

  constructor(repository?: IAuthSessionRepository, defaultSessionTtlSeconds = 86400) {
    this.repository = repository || new MemoryAuthSessionRepository();
    this.defaultSessionTtlSeconds = defaultSessionTtlSeconds; // 24 hours
  }

  /**
   * Creates an active authentication session tied to a sovereign CubiO ID.
   */
  public async createSession(
    cubId: string,
    provider: AuthenticationProviderType,
    subjectId: string,
    options: {
      ttlSeconds?: number;
      clientMetadata?: Record<string, any>;
      createdAt?: number;
    } = {}
  ): Promise<Readonly<AuthSession>> {
    const createdAt = options.createdAt || Date.now();
    const ttl = options.ttlSeconds !== undefined ? options.ttlSeconds : this.defaultSessionTtlSeconds;
    const expiresAt = createdAt + ttl * 1000;

    const sessionId = `SESS_${deterministicHash(`${cubId}:${provider}:${subjectId}:${createdAt}:${Math.random()}`).slice(2, 18)}`;

    const session: AuthSession = Object.freeze({
      sessionId,
      cubId,
      provider,
      subjectId,
      createdAt,
      expiresAt,
      status: 'ACTIVE',
      clientMetadata: Object.freeze({ ...(options.clientMetadata || {}) }),
    });

    await this.repository.saveSession(session);
    return session;
  }

  /**
   * Verifies an active session by ID.
   */
  public async verifySession(sessionId: string): Promise<{
    isValid: boolean;
    session?: AuthSession;
    error?: string;
  }> {
    if (!sessionId) {
      return { isValid: false, error: 'Session ID is required.' };
    }

    const session = await this.repository.getSession(sessionId.trim());
    if (!session) {
      return { isValid: false, error: 'Session not found.' };
    }

    if (session.status === 'REVOKED') {
      return { isValid: false, session, error: 'Session has been explicitly revoked.' };
    }

    if (session.status === 'EXPIRED' || Date.now() > session.expiresAt) {
      if (session.status !== 'EXPIRED') {
        await this.repository.updateSessionStatus(session.sessionId, 'EXPIRED');
      }
      return { isValid: false, session, error: 'Session has expired.' };
    }

    return { isValid: true, session };
  }

  /**
   * Refreshes / extends an active session.
   */
  public async refreshSession(
    sessionId: string,
    extendSeconds = this.defaultSessionTtlSeconds
  ): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
    const verification = await this.verifySession(sessionId);
    if (!verification.isValid || !verification.session) {
      return { success: false, error: verification.error || 'Cannot refresh invalid session.' };
    }

    const now = Date.now();
    const updatedSession: AuthSession = Object.freeze({
      ...verification.session,
      expiresAt: now + extendSeconds * 1000,
      refreshedAt: now,
      status: 'ACTIVE',
    });

    await this.repository.saveSession(updatedSession);
    return { success: true, session: updatedSession };
  }

  /**
   * Revokes an active session.
   */
  public async revokeSession(sessionId: string): Promise<boolean> {
    return this.repository.updateSessionStatus(sessionId.trim(), 'REVOKED');
  }

  /**
   * Logout helper (revokes session).
   */
  public async logout(sessionId: string): Promise<boolean> {
    return this.revokeSession(sessionId);
  }

  /**
   * Lists all sessions for a sovereign CubiO user.
   */
  public async getUserSessions(cubId: string): Promise<readonly AuthSession[]> {
    return this.repository.listUserSessions(cubId.trim());
  }
}
