/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-02: In-Memory Authentication Repositories
 *
 * Deterministic in-memory implementations of session, credential, event, and rate limit stores.
 */

import { AuthSession, AuthSessionStatus, AuthEvent, RateLimitResult, AuthEventType } from '../types';
import {
  IAuthSessionRepository,
  IAuthCredentialRepository,
  IAuthEventRepository,
  IAuthRateLimitRepository,
  NativeCredentialRecord,
} from './types';

export class MemoryAuthSessionRepository implements IAuthSessionRepository {
  private sessions: Map<string, AuthSession> = new Map();

  public async saveSession(session: AuthSession): Promise<void> {
    this.sessions.set(session.sessionId, Object.freeze({ ...session }));
  }

  public async getSession(sessionId: string): Promise<AuthSession | undefined> {
    return this.sessions.get(sessionId);
  }

  public async updateSessionStatus(
    sessionId: string,
    status: AuthSessionStatus,
    refreshedAt?: number
  ): Promise<boolean> {
    const existing = this.sessions.get(sessionId);
    if (!existing) return false;

    this.sessions.set(
      sessionId,
      Object.freeze({
        ...existing,
        status,
        ...(refreshedAt !== undefined ? { refreshedAt } : {}),
      })
    );
    return true;
  }

  public async deleteSession(sessionId: string): Promise<boolean> {
    return this.sessions.delete(sessionId);
  }

  public async listUserSessions(cubId: string): Promise<readonly AuthSession[]> {
    return Object.freeze(
      Array.from(this.sessions.values()).filter((s) => s.cubId === cubId)
    );
  }

  public async clear(): Promise<void> {
    this.sessions.clear();
  }
}

export class MemoryAuthCredentialRepository implements IAuthCredentialRepository {
  private credentials: Map<string, NativeCredentialRecord> = new Map();

  public async saveCredential(record: NativeCredentialRecord): Promise<void> {
    this.credentials.set(record.subjectId, Object.freeze({ ...record }));
  }

  public async getCredential(subjectId: string): Promise<NativeCredentialRecord | undefined> {
    return this.credentials.get(subjectId);
  }

  public async deleteCredential(subjectId: string): Promise<boolean> {
    return this.credentials.delete(subjectId);
  }

  public async clear(): Promise<void> {
    this.credentials.clear();
  }
}

export class MemoryAuthEventRepository implements IAuthEventRepository {
  private events: AuthEvent[] = [];

  public async recordEvent(event: AuthEvent): Promise<void> {
    this.events.push(Object.freeze({ ...event }));
  }

  public async listEvents(filter?: {
    cubId?: string;
    subjectId?: string;
    type?: AuthEventType;
    limit?: number;
  }): Promise<readonly AuthEvent[]> {
    let list = [...this.events];

    if (filter?.cubId) {
      list = list.filter((e) => e.cubId === filter.cubId);
    }
    if (filter?.subjectId) {
      list = list.filter((e) => e.subjectId === filter.subjectId);
    }
    if (filter?.type) {
      list = list.filter((e) => e.type === filter.type);
    }
    if (filter?.limit && filter.limit > 0) {
      list = list.slice(-filter.limit);
    }

    return Object.freeze(list);
  }

  public async clear(): Promise<void> {
    this.events = [];
  }
}

export class MemoryAuthRateLimitRepository implements IAuthRateLimitRepository {
  private buckets: Map<string, { count: number; windowStart: number }> = new Map();

  public async checkAndConsume(
    key: string,
    limit: number,
    windowMs: number
  ): Promise<RateLimitResult> {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket || now - bucket.windowStart >= windowMs) {
      bucket = { count: 1, windowStart: now };
      this.buckets.set(key, bucket);
      return {
        allowed: true,
        remaining: limit - 1,
        resetTimeMs: now + windowMs,
      };
    }

    if (bucket.count < limit) {
      bucket.count++;
      return {
        allowed: true,
        remaining: limit - bucket.count,
        resetTimeMs: bucket.windowStart + windowMs,
      };
    }

    return {
      allowed: false,
      remaining: 0,
      resetTimeMs: bucket.windowStart + windowMs,
      error: 'Rate limit exceeded: too many authentication attempts.',
    };
  }

  public async reset(key: string): Promise<void> {
    this.buckets.delete(key);
  }

  public async clear(): Promise<void> {
    this.buckets.clear();
  }
}
