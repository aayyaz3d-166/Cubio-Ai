/**
 * CUBiO AI — Phase 11: Web Studio API Client
 * src/cubio/web/api/apiClient.ts
 *
 * Primary HTTP transport abstraction communicating with /api/v1/*
 */

export class ApiClientError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly detail: string;
  public readonly requestId?: string;

  constructor(status: number, code: string, detail: string, requestId?: string) {
    super(`[${code}] ${detail}`);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.detail = detail;
    this.requestId = requestId;
  }
}

export interface ApiClientConfig {
  baseUrl?: string;
  timeoutMs?: number;
  getToken?: () => string | null;
  defaultToken?: string | null;
}

const FRIENDLY_STATUS_MESSAGES: Record<number, string> = {
  400: 'Invalid request format or input parameter.',
  401: 'Authentication required or session expired.',
  403: 'Action forbidden. Your key does not have permission for this operation.',
  404: 'The requested conversation or resource does not exist.',
  409: 'Turn sequence conflict or duplicate request collision.',
  413: 'Message exceeds maximum allowed payload limit (64KB).',
  429: 'Rate limit reached. Please wait a moment before submitting again.',
  500: 'Internal server error occurred. Sanitized error contract enforced.',
  503: 'CUBiO intelligence service is temporarily at capacity or initializing.',
  504: 'Request execution exceeded time budget.',
};

export class CubiOApiClient {
  private baseUrl: string;
  private timeoutMs: number;
  private tokenGetter: () => string | null;

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = config.baseUrl || '/api/v1';
    this.timeoutMs = config.timeoutMs || 30000;
    if (config.defaultToken) {
      const t = config.defaultToken;
      this.tokenGetter = () => t;
    } else {
      this.tokenGetter = config.getToken || (() => null);
    }
  }

  public setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/+$/, '');
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public getToken(): string | null {
    return this.tokenGetter();
  }

  public setToken(token: string | null): void {
    this.tokenGetter = () => token;
  }

  public setTokenGetter(getter: () => string | null): void {
    this.tokenGetter = getter;
  }

  public async get<T = any>(path: string, options: any = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  public async post<T = any>(path: string, body?: any, options: any = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'POST', body });
  }

  public async request<T = any>(
    path: string,
    options: {
      method?: string;
      body?: any;
      headers?: Record<string, string>;
      overrideToken?: string | null;
      customTimeoutMs?: number;
    } = {}
  ): Promise<T> {
    // 1. Check offline status
    if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' && !navigator.onLine) {
      throw new ApiClientError(0, 'NETWORK_OFFLINE', 'Browser is currently offline. Please check network connection.');
    }

    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const url = `${this.baseUrl}${cleanPath}`;
    const method = options.method || 'GET';
    const timeout = options.customTimeoutMs || this.timeoutMs;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers || {}),
    };

    const token = options.overrideToken !== undefined ? options.overrideToken : this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const fetchOptions: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };

      if (options.body !== undefined && method !== 'GET' && method !== 'HEAD') {
        fetchOptions.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      }

      const res = await fetch(url, fetchOptions);
      clearTimeout(timer);

      let parsedData: any = null;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try {
          parsedData = await res.json();
        } catch {
          parsedData = null;
        }
      } else {
        parsedData = await res.text();
      }

      if (!res.ok) {
        const status = res.status;
        const code = parsedData?.code || `HTTP_${status}`;
        const detail = parsedData?.detail || FRIENDLY_STATUS_MESSAGES[status] || `Request failed with status ${status}.`;
        const reqId = parsedData?.requestId;
        throw new ApiClientError(status, code, detail, reqId);
      }

      return parsedData as T;
    } catch (err: any) {
      clearTimeout(timer);
      if (err instanceof ApiClientError) {
        throw err;
      }
      if (err.name === 'AbortError') {
        throw new ApiClientError(504, 'REQUEST_TIMEOUT', 'Request exceeded time budget and was aborted.');
      }
      throw new ApiClientError(0, 'NETWORK_ERROR', err.message || 'Network request failed or server is unreachable.');
    }
  }
}

export const defaultApiClient = new CubiOApiClient();

export function createApiClient(config: ApiClientConfig = {}): CubiOApiClient {
  return new CubiOApiClient(config);
}
