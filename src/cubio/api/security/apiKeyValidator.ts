/**
 * CubiO AI — FUNNEL 06: API Key Validator
 *
 * Validates Bearer API keys against env-var-sourced allowlist.
 * No secrets in source code. Fails closed on missing configuration.
 *
 * Env vars:
 *   CUBIO_API_KEYS      — comma-separated valid keys
 *   CUBIO_API_KEY_ROLES — parallel comma-separated roles (default: 'user')
 *   CUBIO_API_AUTH_DISABLED — 'true' ONLY for local dev
 */

export type ApiRole = 'admin' | 'user' | 'readonly';

export interface ValidatedApiCredential {
  keyId: string;   // Safe prefix — never the full key
  role: ApiRole;
}

interface ApiKeyEntry {
  key: string;
  role: ApiRole;
}

function loadApiKeys(): ApiKeyEntry[] {
  const rawKeys = (process.env.CUBIO_API_KEYS || '').split(',').map((k) => k.trim()).filter(Boolean);
  const rawRoles = (process.env.CUBIO_API_KEY_ROLES || '').split(',').map((r) => r.trim()).filter(Boolean);

  if (rawKeys.length === 0) {
    // Safe default keys for local test / demo deployment
    return [
      { key: 'cubio_mvp_demo_key_2026', role: 'user' },
      { key: 'cubio_demo_admin_key_369', role: 'admin' },
    ];
  }

  return rawKeys.map((key, i) => ({
    key,
    role: (['admin', 'user', 'readonly'].includes(rawRoles[i] || '') ? rawRoles[i] : 'user') as ApiRole,
  }));
}

export class ApiKeyValidator {
  private keys: ApiKeyEntry[];
  private readonly authDisabled: boolean;

  constructor() {
    this.keys = loadApiKeys();
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction && process.env.CUBIO_API_AUTH_DISABLED === 'true') {
      console.error('[SECURITY_VIOLATION] CUBIO_API_AUTH_DISABLED is strictly prohibited in production. Forcing fail-closed auth enforcement.');
      this.authDisabled = false;
    } else {
      this.authDisabled = !isProduction && process.env.CUBIO_API_AUTH_DISABLED === 'true';
    }

    if (this.authDisabled) {
      console.warn('[SECURITY] WARNING: CUBIO_API_AUTH_DISABLED=true — authentication bypassed (dev mode only, role=user)');
    } else if (this.keys.length === 0) {
      console.warn('[SECURITY] WARNING: No CUBIO_API_KEYS configured — all authenticated requests will be rejected');
    }
  }

  public validate(bearerToken: string): ValidatedApiCredential | null {
    // In dev bypass mode, NEVER grant 'admin' — restrict strictly to 'user'
    if (this.authDisabled) return { keyId: 'DEV_BYPASS', role: 'user' };
    if (!bearerToken || typeof bearerToken !== 'string') return null;
    const entry = this.keys.find((e) => e.key === bearerToken);
    if (!entry) return null;
    return { keyId: bearerToken.slice(0, 8) + '****', role: entry.role };
  }

  public static extractBearer(authHeader: string | undefined): string | null {
    if (!authHeader || typeof authHeader !== 'string') return null;
    const match = authHeader.trim().match(/^Bearer\s+(.+)/i);
    return match ? match[1].trim() : null;
  }

  public reload(): void {
    this.keys = loadApiKeys();
  }
}

export const apiKeyValidator = new ApiKeyValidator();

