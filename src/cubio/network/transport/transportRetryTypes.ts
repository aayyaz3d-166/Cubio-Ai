/**
 * CUBiO AI — Transport Resilience, Timeout & Retry Types
 * ========================================================
 *
 * Defines the canonical policies, telemetry models, cancellation contracts,
 * and error taxonomy for resilient transport operations.
 *
 * ARCHITECTURAL INVARIANTS:
 *   1. Blind retry is strictly prohibited: retries are bounded by maxAttempts, exponential backoff,
 *      and strict error classification.
 *   2. Duplicate delivery assumptions are prevented: non-idempotent operations are blocked from
 *      blind retry once partial wire transmission has occurred.
 *   3. Deterministic timeout & cancellation enforcement: all pending timers, event listeners,
 *      and sockets are cleanly disposed of on success, failure, timeout, or cancellation.
 *   4. Strict integration with the Phase 1 canonical error and response model.
 */

import { TransportEndpoint, TransportType } from './types';
import {
  CanonicalProtocolError,
  ProtocolErrorCodeCatalog,
} from '../protocol/v1/responseTypes';

/**
 * Standard retryable transport error codes.
 */
export const DEFAULT_RETRYABLE_ERROR_CODES: readonly string[] = Object.freeze([
  'ERR_TRANSPORT_CONNECT_TIMEOUT',
  'ERR_TRANSPORT_DISCONNECTED',
  'ERR_TRANSPORT_SOCKET_ERROR',
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'EPIPE',
  'EHOSTUNREACH',
  'ENETUNREACH',
]);

/**
 * Non-retryable fatal error codes where retry is strictly forbidden.
 */
export const NON_RETRYABLE_ERROR_CODES: readonly string[] = Object.freeze([
  'ERR_TRANSPORT_BIND_FAILED',
  'ERR_TRANSPORT_UNSUPPORTED_ADAPTER',
  'ERR_TRANSPORT_INVALID_LIFECYCLE',
  'ERR_TRANSPORT_MTU_EXCEEDED',
  'ERR_TRANSPORT_FRAME_CORRUPTED',
  'ERR_TRANSPORT_TLS_HANDSHAKE_FAILED',
  'ERR_OPERATION_CANCELLED',
  'ERR_NON_RETRYABLE_OPERATION',
]);

/**
 * Deterministic retry policy specification.
 */
export interface RetryPolicy {
  /** Maximum execution attempts before exhaustion (clamped to 1..10). Default: 3 */
  readonly maxAttempts: number;
  /** Initial backoff delay in milliseconds. Default: 50ms */
  readonly initialDelayMs: number;
  /** Maximum cap on backoff delay in milliseconds. Default: 2,000ms */
  readonly maxDelayMs: number;
  /** Exponential backoff multiplier (>= 1.0). Default: 2.0 */
  readonly backoffMultiplier: number;
  /** Jitter mode: 'NONE' (deterministic), 'FULL', or 'EQUAL'. Default: 'NONE' */
  readonly jitter?: 'NONE' | 'FULL' | 'EQUAL';
  /** Whitelist of retryable error codes or tokens */
  readonly retryableErrorCodes?: readonly string[];
  /** If true, blocks retrying operations not explicitly flagged as idempotent. Default: true */
  readonly idempotencyEnforced?: boolean;
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = Object.freeze({
  maxAttempts: 3,
  initialDelayMs: 50,
  maxDelayMs: 2_000,
  backoffMultiplier: 2.0,
  jitter: 'NONE',
  retryableErrorCodes: DEFAULT_RETRYABLE_ERROR_CODES,
  idempotencyEnforced: true,
});

export const NO_RETRY_POLICY: RetryPolicy = Object.freeze({
  maxAttempts: 1,
  initialDelayMs: 0,
  maxDelayMs: 0,
  backoffMultiplier: 1.0,
  jitter: 'NONE',
  retryableErrorCodes: [],
  idempotencyEnforced: true,
});

/**
 * Deterministic timeout policy specification.
 */
export interface TimeoutPolicy {
  /** Maximum duration (ms) for socket connection establishment before timeout */
  readonly connectTimeoutMs: number;
  /** Maximum duration (ms) for single frame transmission before timeout */
  readonly sendTimeoutMs: number;
  /** Maximum duration (ms) for correlated response reception before timeout */
  readonly receiveTimeoutMs: number;
}

export const DEFAULT_TIMEOUT_POLICY: TimeoutPolicy = Object.freeze({
  connectTimeoutMs: 3_000,
  sendTimeoutMs: 2_000,
  receiveTimeoutMs: 3_000,
});

/**
 * Cooperative cancellation token interface.
 */
export interface ICancellationToken {
  readonly isCancelled: boolean;
  readonly reason?: string;
  throwIfCancelled(): void;
  onCancelled(callback: () => void): () => void;
}

/**
 * Cooperative cancellation controller.
 */
export class CancellationTokenSource {
  private _isCancelled: boolean = false;
  private _reason?: string;
  private readonly _listeners: Set<() => void> = new Set();

  public get token(): ICancellationToken {
    const self = this;
    return {
      get isCancelled() {
        return self._isCancelled;
      },
      get reason() {
        return self._reason;
      },
      throwIfCancelled: () => {
        if (self._isCancelled) {
          throw new TransportCancelledError('OPERATION', self._reason ?? 'Operation cancelled by caller');
        }
      },
      onCancelled: (callback: () => void) => {
        if (self._isCancelled) {
          callback();
          return () => {};
        }
        self._listeners.add(callback);
        return () => {
          self._listeners.delete(callback);
        };
      },
    };
  }

  public cancel(reason: string = 'Operation cancelled by caller'): void {
    if (this._isCancelled) return;
    this._isCancelled = true;
    this._reason = reason;
    for (const cb of this._listeners) {
      try {
        cb();
      } catch {}
    }
    this._listeners.clear();
  }
}

/**
 * Record of an individual retry attempt.
 */
export interface RetryAttemptRecord {
  readonly attemptNumber: number;
  readonly startTime: number;
  readonly endTime: number;
  readonly durationMs: number;
  readonly delayBeforeMs: number;
  readonly success: boolean;
  readonly error?: string;
  readonly errorCode?: string;
  readonly retryable: boolean;
}

export type RetryFinalOutcome =
  | 'SUCCESS'
  | 'RETRY_EXHAUSTED'
  | 'CANCELLED'
  | 'TIMEOUT'
  | 'NON_RETRYABLE_ERROR';

/**
 * Forensic telemetry of a completed resilient execution.
 */
export interface RetryExecutionTelemetry {
  readonly operationId: string;
  readonly operationName: string;
  readonly idempotent: boolean;
  readonly totalAttempts: number;
  readonly maxAttempts: number;
  readonly totalDurationMs: number;
  readonly finalOutcome: RetryFinalOutcome;
  readonly attemptHistory: readonly RetryAttemptRecord[];
  readonly terminalError?: string;
  readonly terminalErrorCode?: string;
}

// ─── Error Taxonomy ─────────────────────────────────────────────────────────

export type TimeoutType = 'CONNECT' | 'SEND' | 'RECEIVE' | 'DISCONNECT';

export class TransportTimeoutError extends Error {
  public readonly timeoutType: TimeoutType;
  public readonly timeoutMs: number;
  public readonly endpoint?: TransportEndpoint;

  constructor(timeoutType: TimeoutType, timeoutMs: number, endpoint?: TransportEndpoint, message?: string) {
    super(message ?? `Transport ${timeoutType} timed out after ${timeoutMs}ms`);
    this.name = 'TransportTimeoutError';
    this.timeoutType = timeoutType;
    this.timeoutMs = timeoutMs;
    this.endpoint = endpoint;
  }
}

export class TransportRetryExhaustedError extends Error {
  public readonly operationId: string;
  public readonly totalAttempts: number;
  public readonly lastError?: Error;
  public readonly telemetry: RetryExecutionTelemetry;

  constructor(operationId: string, totalAttempts: number, telemetry: RetryExecutionTelemetry, lastError?: Error) {
    super(
      `Operation '${operationId}' failed after ${totalAttempts} attempts (exhausted): ${lastError?.message ?? 'Unknown error'}`
    );
    this.name = 'TransportRetryExhaustedError';
    this.operationId = operationId;
    this.totalAttempts = totalAttempts;
    this.telemetry = telemetry;
    this.lastError = lastError;
  }
}

export class TransportCancelledError extends Error {
  public readonly operationId: string;
  public readonly reason: string;
  public readonly attemptsMade: number;

  constructor(operationId: string, reason: string, attemptsMade: number = 0) {
    super(`Operation '${operationId}' cancelled: ${reason}`);
    this.name = 'TransportCancelledError';
    this.operationId = operationId;
    this.reason = reason;
    this.attemptsMade = attemptsMade;
  }
}

export class NonRetryableOperationError extends Error {
  public readonly operationId: string;
  public readonly reason: string;

  constructor(operationId: string, reason: string) {
    super(`Operation '${operationId}' cannot be retried: ${reason}`);
    this.name = 'NonRetryableOperationError';
    this.operationId = operationId;
    this.reason = reason;
  }
}

// ─── Helper Functions ───────────────────────────────────────────────────────

/**
 * Calculates deterministic backoff delay with optional jitter.
 */
export function calculateBackoffDelay(
  attempt: number,
  policy: RetryPolicy,
  jitterFn?: () => number
): number {
  if (attempt <= 1) return 0;

  const baseDelay = policy.initialDelayMs * Math.pow(policy.backoffMultiplier, attempt - 2);
  const cappedDelay = Math.min(policy.maxDelayMs, Math.max(0, baseDelay));

  const jitterMode = policy.jitter ?? 'NONE';
  if (jitterMode === 'NONE') {
    return Math.floor(cappedDelay);
  }

  const rnd = jitterFn ? jitterFn() : Math.random();
  if (jitterMode === 'FULL') {
    return Math.floor(rnd * cappedDelay);
  }
  if (jitterMode === 'EQUAL') {
    const half = cappedDelay / 2;
    return Math.floor(half + rnd * half);
  }

  return Math.floor(cappedDelay);
}

/**
 * Determines whether a given error represents a transient, retryable failure.
 */
export function isRetryableError(error: unknown, policy: RetryPolicy = DEFAULT_RETRY_POLICY): boolean {
  if (!error) return false;

  // Never retry cancelled or non-retryable errors
  if (error instanceof TransportCancelledError || error instanceof NonRetryableOperationError) {
    return false;
  }

  const errObj = error as any;
  const code: string | undefined = errObj.code ?? errObj.name;
  const msg: string = errObj.message ?? String(error);

  if (code && NON_RETRYABLE_ERROR_CODES.includes(code)) {
    return false;
  }

  const retryableCodes = policy.retryableErrorCodes ?? DEFAULT_RETRYABLE_ERROR_CODES;

  if (code && retryableCodes.includes(code)) {
    return true;
  }

  if (error instanceof TransportTimeoutError) {
    return true;
  }

  // Check common network failure strings
  for (const token of retryableCodes) {
    if (msg.includes(token)) return true;
  }

  return false;
}

/**
 * Translates transport-level errors into the canonical Phase 1 CanonicalProtocolError.
 */
export function toPhase1ProtocolError(
  error: unknown,
  options?: { correlationId?: string; retryable?: boolean; retryAfterMs?: number }
): CanonicalProtocolError {
  const err = error as any;
  const msg = err?.message ?? String(error);

  let code: string = ProtocolErrorCodeCatalog.ERR_INTERNAL_ERROR;
  let retryable = options?.retryable ?? false;

  if (error instanceof TransportTimeoutError) {
    code = ProtocolErrorCodeCatalog.ERR_NETWORK_CONNECTION_TIMEOUT;
    retryable = true;
  } else if (error instanceof TransportRetryExhaustedError) {
    code = ProtocolErrorCodeCatalog.ERR_NETWORK_CONNECTION_RESET;
    retryable = false; // Retries already exhausted
  } else if (error instanceof TransportCancelledError) {
    code = ProtocolErrorCodeCatalog.ERR_NETWORK_PEER_DISCONNECTED;
    retryable = false;
  } else if (msg.includes('ECONNREFUSED') || msg.includes('refused')) {
    code = ProtocolErrorCodeCatalog.ERR_NETWORK_CONNECTION_REFUSED;
    retryable = true;
  } else if (msg.includes('ECONNRESET') || msg.includes('reset')) {
    code = ProtocolErrorCodeCatalog.ERR_NETWORK_CONNECTION_RESET;
    retryable = true;
  } else if (msg.includes('timeout') || msg.includes('ETIMEDOUT')) {
    code = ProtocolErrorCodeCatalog.ERR_NETWORK_CONNECTION_TIMEOUT;
    retryable = true;
  }

  return Object.freeze({
    category: 'NETWORK_ERROR',
    code,
    message: msg,
    details: options?.correlationId ? Object.freeze({ correlationId: options.correlationId }) : undefined,
    retryable,
    retryAfterMs: options?.retryAfterMs,
  });
}
