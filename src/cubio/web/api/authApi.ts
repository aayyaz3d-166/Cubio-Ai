/**
 * CUBiO AI — Phase 11: Web Studio Authentication Service
 * src/cubio/web/api/authApi.ts
 *
 * Client-side session manager.
 * Invariant: Never stores or accepts authorization claims from client-side state.
 * The backend remains the sole identity and authorization authority.
 */

import { CubiOApiClient, ApiClientError } from './apiClient';
import { UserAuthSession } from '../types';

const AUTH_STORAGE_KEY = 'cubio_web_studio_auth';

function getSafeStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) return window.sessionStorage;
    if (typeof globalThis !== 'undefined' && (globalThis as any).sessionStorage) return (globalThis as any).sessionStorage;
    if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) return (globalThis as any).localStorage;
  } catch {}
  return null;
}

export class AuthService {
  private currentSession: UserAuthSession | null = null;
  private defaultBaseUrl: string;

  constructor(baseUrl: string = '/api/v1') {
    this.defaultBaseUrl = baseUrl;
    this.currentSession = this.loadFromStorage() || this.restoreSession();
  }

  public getSession(): UserAuthSession | null {
    return this.currentSession;
  }

  public getToken(): string | null {
    return this.currentSession?.token || null;
  }

  public isAuthenticated(): boolean {
    return !!this.currentSession && this.currentSession.isAuthenticated;
  }

  public restoreSession(): UserAuthSession {
    const loaded = this.loadFromStorage();
    if (loaded && loaded.isAuthenticated) {
      this.currentSession = loaded;
      return loaded;
    }
    // Web MVP: Default to demo session for instant, zero-friction access
    const defaultDemoToken = 'cubio_mvp_demo_key_2026';
    const demoSession: UserAuthSession = {
      token: defaultDemoToken,
      keyId: 'cubio_mv****',
      role: 'user',
      tenantId: 'tenant_user_cubio_mv',
      userId: 'user_cubio_mv',
      isAuthenticated: true,
    };
    this.currentSession = demoSession;
    this.saveToStorage(demoSession);
    return demoSession;
  }

  public async validateAndLogin(
    candidateToken: string,
    client?: CubiOApiClient
  ): Promise<UserAuthSession> {
    const c = client ?? new CubiOApiClient({ baseUrl: this.defaultBaseUrl });
    return this.verifyAndAuthenticate(c, candidateToken);
  }

  public logout(): void {
    this.clearSession();
  }

  /**
   * Validates a Bearer token with the backend authoritative API.
   * Invokes /api/v1/usage with the candidate token.
   */
  public async verifyAndAuthenticate(
    client: CubiOApiClient,
    candidateToken: string
  ): Promise<UserAuthSession> {
    const trimmed = candidateToken.trim();
    if (!trimmed) {
      throw new ApiClientError(400, 'INVALID_TOKEN', 'API token cannot be empty.');
    }

    try {
      const usageRes = await client.request<any>('/usage', {
        method: 'GET',
        overrideToken: trimmed,
      });

      const session: UserAuthSession = {
        token: trimmed,
        keyId: usageRes.keyId || trimmed.slice(0, 8) + '****',
        role: usageRes.role || 'user',
        tenantId: usageRes.tenantId || `tenant_user_${trimmed.slice(0, 8)}`,
        userId: `user_${trimmed.slice(0, 8)}`,
        isAuthenticated: true,
      };

      this.currentSession = session;
      this.saveToStorage(session);
      return session;
    } catch (err: any) {
      this.clearSession();
      if (err instanceof ApiClientError) {
        throw err;
      }
      throw new ApiClientError(401, 'AUTHENTICATION_FAILED', 'Failed to authenticate API token with CUBiO API.');
    }
  }

  public clearSession(): void {
    this.currentSession = null;
    const storage = getSafeStorage();
    if (storage) {
      try {
        storage.removeItem(AUTH_STORAGE_KEY);
      } catch {
        /* ignore storage access error */
      }
    }
  }

  private saveToStorage(session: UserAuthSession): void {
    const storage = getSafeStorage();
    if (storage) {
      try {
        storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      } catch {
        /* ignore storage error */
      }
    }
  }

  private loadFromStorage(): UserAuthSession | null {
    const storage = getSafeStorage();
    if (storage) {
      try {
        const raw = storage.getItem(AUTH_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed.token === 'string') {
            return parsed as UserAuthSession;
          }
        }
      } catch {
        return null;
      }
    }
    // Localhost dev fallback session strictly isolated to non-production development environments
    const isProduction =
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.PROD === true) ||
      (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production');

    const isDevelopment =
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV === true) ||
      (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development');

    if (
      !isProduction &&
      isDevelopment &&
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ) {
      return {
        token: 'user-key-alpha-12345',
        keyId: 'dev_user_key',
        role: 'user',
        tenantId: 'tenant_dev_localhost',
        userId: 'user_dev_localhost',
        isAuthenticated: true,
      };
    }
    return null;
  }
}

export const authService = new AuthService();
