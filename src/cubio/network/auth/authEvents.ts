/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-02: Authentication Audit Event Logger
 *
 * Records append-only, security-safe authentication audit events.
 *
 * Security Invariant:
 * Passwords, tokens, and private keys must NEVER be logged.
 */

import { deterministicHash } from '../../state/determinism';
import { AuthEvent, AuthEventType, AuthenticationProviderType } from './types';
import { IAuthEventRepository } from './repositories/types';
import { MemoryAuthEventRepository } from './repositories/memoryRepositories';

export class CubiOAuthEventLogger {
  private repository: IAuthEventRepository;

  constructor(repository?: IAuthEventRepository) {
    this.repository = repository || new MemoryAuthEventRepository();
  }

  /**
   * Logs an authentication event safely.
   */
  public async logEvent(
    type: AuthEventType,
    options: {
      provider?: AuthenticationProviderType;
      cubId?: string;
      subjectId?: string;
      ipAddress?: string;
      details: string;
      timestamp?: number;
    }
  ): Promise<Readonly<AuthEvent>> {
    const timestamp = options.timestamp || Date.now();
    const eventId = `AUTHEVT_${deterministicHash(`${type}:${options.cubId || options.subjectId || 'ANON'}:${timestamp}`).slice(2, 12)}`;

    const event: AuthEvent = Object.freeze({
      eventId,
      type,
      timestamp,
      provider: options.provider,
      cubId: options.cubId,
      subjectId: options.subjectId,
      ipAddress: options.ipAddress,
      details: options.details,
    });

    await this.repository.recordEvent(event);
    return event;
  }

  public async getEvents(filter?: {
    cubId?: string;
    subjectId?: string;
    type?: AuthEventType;
    limit?: number;
  }): Promise<readonly AuthEvent[]> {
    return this.repository.listEvents(filter);
  }
}
