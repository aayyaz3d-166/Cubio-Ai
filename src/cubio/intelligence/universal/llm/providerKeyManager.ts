/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F81: Provider Key Manager & Credential Isolation Vault
 *
 * Secure server-side isolation vault for external LLM provider API keys.
 * Invariant: API keys MUST NEVER be exposed in UI responses, logs, or telemetry payloads.
 */

export class ProviderKeyManager {
  private static instance: ProviderKeyManager;
  private readonly keys: Map<string, string> = new Map();

  private constructor() {
    this.ingestEnvironmentKeys();
  }

  public static getInstance(): ProviderKeyManager {
    if (!ProviderKeyManager.instance) {
      ProviderKeyManager.instance = new ProviderKeyManager();
    }
    return ProviderKeyManager.instance;
  }

  private ingestEnvironmentKeys(): void {
    // 1. Node / Process Environment
    if (typeof process !== 'undefined' && process.env) {
      if (process.env.GEMINI_API_KEY) {
        this.keys.set('gemini', process.env.GEMINI_API_KEY);
      }
      if (process.env.OPENAI_API_KEY) {
        this.keys.set('openai', process.env.OPENAI_API_KEY);
      }
      if (process.env.ANTHROPIC_API_KEY) {
        this.keys.set('anthropic', process.env.ANTHROPIC_API_KEY);
      }
    }

    // 2. Vite Client Environment (import.meta.env)
    try {
      if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
        const env = (import.meta as any).env;
        if (env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY) {
          this.keys.set('gemini', env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY);
        }
        if (env.VITE_OPENAI_API_KEY || env.OPENAI_API_KEY) {
          this.keys.set('openai', env.VITE_OPENAI_API_KEY || env.OPENAI_API_KEY);
        }
        if (env.VITE_ANTHROPIC_API_KEY || env.ANTHROPIC_API_KEY) {
          this.keys.set('anthropic', env.VITE_ANTHROPIC_API_KEY || env.ANTHROPIC_API_KEY);
        }
      }
    } catch {
      // Ignore if import.meta is unavailable in runtime context
    }

    // 3. Browser Local Storage Environment
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const storedGemini = window.localStorage.getItem('gemini_api_key') || window.localStorage.getItem('GEMINI_API_KEY');
        if (storedGemini) {
          this.keys.set('gemini', storedGemini);
        }
        const storedOpenAI = window.localStorage.getItem('openai_api_key') || window.localStorage.getItem('OPENAI_API_KEY');
        if (storedOpenAI) {
          this.keys.set('openai', storedOpenAI);
        }
      }
    } catch {
      // Ignore if localStorage is unavailable
    }
  }

  /**
   * Securely sets an API key in the in-memory vault.
   */

  public setKey(providerId: string, apiKey: string): void {
    const norm = providerId.toLowerCase().trim();
    if (apiKey && apiKey.trim().length > 0) {
      this.keys.set(norm, apiKey.trim());
    } else {
      this.keys.delete(norm);
    }
  }

  /**
   * Retrieves an API key for internal backend execution.
   */
  public getKey(providerId: string): string | undefined {
    const norm = providerId.toLowerCase().trim();
    return this.keys.get(norm);
  }

  /**
   * Checks if an API key exists for a provider.
   */
  public hasKey(providerId: string): boolean {
    const norm = providerId.toLowerCase().trim();
    const key = this.keys.get(norm);
    return Boolean(key && key.length > 0);
  }

  /**
   * Returns a masked fingerprint of the key for diagnostics (e.g. "sk-...1a2b").
   */
  public getMaskedKey(providerId: string): string {
    const key = this.getKey(providerId);
    if (!key) return '[UNCONFIGURED]';
    if (key.length <= 8) return '****';
    return `${key.slice(0, 3)}...${key.slice(-4)}`;
  }

  /**
   * Deep sanitization: strips all API key substrings and auth tokens from strings or objects before returning to UI.
   */
  public sanitizeData<T>(data: T): T {
    if (!data) return data;

    let str = JSON.stringify(data);
    for (const key of this.keys.values()) {
      if (key && key.length >= 6) {
        str = str.split(key).join('[REDACTED_API_KEY]');
      }
    }

    // Mask Bearer tokens and generic key regexes
    str = str.replace(/Bearer\s+[A-Za-z0-9_\-\.]{16,}/gi, 'Bearer [REDACTED_TOKEN]');
    str = str.replace(/sk-[A-Za-z0-9_\-]{20,}/gi, 'sk-[REDACTED]');
    str = str.replace(/AIza[0-9A-Za-z_\-]{35}/gi, 'AIza[REDACTED]');

    return JSON.parse(str) as T;
  }
}
