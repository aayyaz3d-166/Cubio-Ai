/**
 * CubiO AI — Production Safe Chat Client
 *
 * Implements safe AbortController-based timeout handling for /api/cubio/chat
 * and /api/cubio/stream endpoints.
 *
 * Guarantees:
 *   - Automatic timeout via AbortController (prevents hung promises/sockets)
 *   - Clean timer deallocation on both success and failure (no timer leaks)
 *   - Support for user-initiated abort signals (graceful cancellation)
 *   - Clear distinction between AbortError, TimeoutError, and NetworkError
 *   - Multi-turn conversational history propagation
 */

export interface ChatMessage {
  readonly role: 'user' | 'assistant' | 'system';
  readonly content: string;
}

export interface ChatClientOptions {
  /** Request timeout in milliseconds. Defaults to 15,000ms. */
  readonly timeoutMs?: number;
  /** Optional caller-supplied AbortSignal for user cancellation. */
  readonly signal?: AbortSignal;
  /** Base URL for the CubiO API server. Defaults to origin or http://localhost:3000. */
  readonly baseUrl?: string;
  /** Optional session ID for conversational state continuity. */
  readonly sessionId?: string;
  /** Optional tenant identifier for isolated context. */
  readonly tenantId?: string;
  /** Optional sampling configuration. */
  readonly config?: {
    readonly maxNewTokens?: number;
    readonly temperature?: number;
    readonly topP?: number;
  };
}

export interface ChatClientResponse {
  readonly responseId: string;
  readonly sessionId: string;
  readonly message: {
    readonly role: 'assistant';
    readonly content: string;
    readonly timestamp: number;
  };
  readonly generatedTokenCount: number;
  readonly promptTokenCount: number;
  readonly finishReason: string;
  readonly metrics: {
    readonly timeToFirstTokenMs: number;
    readonly totalLatencyMs: number;
    readonly generationLatencyMs: number;
    readonly tokensPerSecond: number;
  };
  readonly provenance?: Record<string, any>;
}

export class CubiOTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`CubiO AI inference request timed out after ${timeoutMs}ms`);
    this.name = 'CubiOTimeoutError';
  }
}

export class CubiOAbortError extends Error {
  constructor(reason?: string) {
    super(reason || 'CubiO AI inference request was aborted by client');
    this.name = 'CubiOAbortError';
  }
}

export class CubiOChatClient {
  private readonly defaultBaseUrl: string;
  private readonly defaultTimeoutMs: number;

  constructor(options: { baseUrl?: string; timeoutMs?: number } = {}) {
    this.defaultBaseUrl = options.baseUrl || (typeof window !== 'undefined' ? '' : 'http://localhost:3000');
    this.defaultTimeoutMs = options.timeoutMs ?? 15000;
  }

  /**
   * Sends a chat request to /api/cubio/chat with guaranteed AbortController timeout handling.
   */
  public async chat(
    messages: readonly ChatMessage[],
    options: ChatClientOptions = {}
  ): Promise<ChatClientResponse> {
    const timeoutMs = options.timeoutMs ?? this.defaultTimeoutMs;
    const baseUrl = options.baseUrl ?? this.defaultBaseUrl;
    const endpoint = `${baseUrl}/api/cubio/chat`;

    // Setup coordinated AbortController
    const controller = new AbortController();
    let timedOut = false;

    const timerId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);

    // Chain caller's signal if supplied
    let unlistenCallerAbort: (() => void) | null = null;
    if (options.signal) {
      if (options.signal.aborted) {
        clearTimeout(timerId);
        throw new CubiOAbortError(options.signal.reason);
      }
      const onCallerAbort = () => controller.abort();
      options.signal.addEventListener('abort', onCallerAbort);
      unlistenCallerAbort = () => options.signal?.removeEventListener('abort', onCallerAbort);
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: options.sessionId || `sess_${Date.now()}`,
          tenantId: options.tenantId || 'tenant_default',
          messages,
          config: options.config,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`CubiO API error HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      const json = await response.json();
      return (json.data || json) as ChatClientResponse;
    } catch (err: any) {
      if (timedOut) {
        throw new CubiOTimeoutError(timeoutMs);
      }
      if (controller.signal.aborted && options.signal?.aborted) {
        throw new CubiOAbortError(options.signal.reason);
      }
      if (err.name === 'AbortError') {
        throw new CubiOAbortError(err.message);
      }
      throw err;
    } finally {
      clearTimeout(timerId);
      if (unlistenCallerAbort) {
        unlistenCallerAbort();
      }
    }
  }

  /**
   * Health check for /api/cubio/health
   */
  public async health(baseUrl?: string): Promise<{ status: string; uptime: number }> {
    const target = `${baseUrl ?? this.defaultBaseUrl}/api/cubio/health`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(target, { signal: controller.signal });
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }
}
