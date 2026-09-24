/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-02: Authentication Repository Interfaces
 *
 * Pluggable repository boundaries for Sessions, Credentials, Audit Events, and Rate Limits.
 * Decouples in-memory test fixtures from future production SQL / Firestore / Redis storage.
 */

import { AuthSession, AuthSessionStatus, AuthEvent, RateLimitResult, AuthEventType } from '../types';

export interface NativeCredentialRecord {
  readonly subjectId: string;
  readonly salt: string;
  readonly passwordHash: string;
  readonly iterations: number;
  readonly algorithm: 'PBKDF2_SHA256_SIM';
  readonly updatedAt: number;
}

export interface IAuthSessionRepository {
  saveSession(session: AuthSession): Promise<void>;
  getSession(sessionId: string): Promise<AuthSession | undefined>;
  updateSessionStatus(sessionId: string, status: AuthSessionStatus, refreshedAt?: number): Promise<boolean>;
  deleteSession(sessionId: string): Promise<boolean>;
  listUserSessions(cubId: string): Promise<readonly AuthSession[]>;
  clear(): Promise<void>;
}

export interface IAuthCredentialRepository {
  saveCredential(record: NativeCredentialRecord): Promise<void>;
  getCredential(subjectId: string): Promise<NativeCredentialRecord | undefined>;
  deleteCredential(subjectId: string): Promise<boolean>;
  clear(): Promise<void>;
}

export interface IAuthEventRepository {
  recordEvent(event: AuthEvent): Promise<void>;
  listEvents(filter?: {
    cubId?: string;
    subjectId?: string;
    type?: AuthEventType;
    limit?: number;
  }): Promise<readonly AuthEvent[]>;
  clear(): Promise<void>;
}

export interface IAuthRateLimitRepository {
  checkAndConsume(key: string, limit: number, windowMs: number): Promise<RateLimitResult>;
  reset(key: string): Promise<void>;
  clear(): Promise<void>;
}
