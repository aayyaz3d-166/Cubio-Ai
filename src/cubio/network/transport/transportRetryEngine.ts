/**
 * CUBiO AI — Canonical Transport Resilience & Retry Engine
 * ==========================================================
 *
 * Implements deterministic execution wrappers with bounded timeouts,
 * controlled exponential backoff retries, cooperative cancellation,
 * idempotency enforcement, and forensic telemetry recording.
 *
 * ARCHITECTURAL INVARIANTS:
 *   1. Blind retry is strictly prohibited: bounded by maxAttempts, exponential backoff,
 *      and strict error classification.
 *   2. Duplicate delivery assumptions are prevented: non-idempotent operations are blocked
 *      from blind retry once wire transmission has commenced.
 *   3. Zero resource leaks: all timeouts, event handlers, and socket resources are strictly
 *      disposed of in finally blocks and cancellation handlers.
 *   4. Seamless integration with Phase 1 Protocol Error / Response models.
 */

import {
  ITransportAdapter,
  TransportEndpoint,
  TransportSession,
  TransportDeliveryReceipt,
  TransportSendOptions,
} from './types';
import { CubiOPacket } from '../protocol/v1/packetTypes';
import {
  RetryPolicy,
  TimeoutPolicy,
  DEFAULT_RETRY_POLICY,
  DEFAULT_TIMEOUT_POLICY,
  ICancellationToken,
  RetryExecutionTelemetry,
  RetryAttemptRecord,
  TransportTimeoutError,
  TransportRetryExhaustedError,
  TransportCancelledError,
  NonRetryableOperationError,
  TimeoutType,
  calculateBackoffDelay,
  isRetryableError,
} from './transportRetryTypes';

export interface ResilienceExecutionOptions {
  /** Descriptive operation name for forensic logging */
  readonly operationName: string;
  /** Unique operation identifier */
  readonly operationId?: string;
  /** Custom retry policy override */
  readonly retryPolicy?: Partial<RetryPolicy>;
  /** Custom timeout in milliseconds for each attempt */
  readonly timeoutMs?: number;
  /** Category of timeout */
  readonly timeoutType?: TimeoutType;
  /** Cooperative cancellation token */
  readonly cancellationToken?: ICancellationToken;
  /**
   * Idempotency flag. If false, retrying after a transmission failure is strictly
   * prohibited when idempotencyEnforced is true to prevent duplicate delivery.
   */
  readonly idempotent?: boolean;
  /** Target endpoint for diagnostic context */
  readonly endpoint?: TransportEndpoint;
  /** Optional attempt observer callback */
  readonly onAttempt?: (attempt: RetryAttemptRecord) => void;
}

export interface ConnectResilienceOptions {
  readonly operationId?: string;
  readonly retryPolicy?: Partial<RetryPolicy>;
  readonly timeoutMs?: number;
  readonly cancellationToken?: ICancellationToken;
  readonly onAttempt?: (attempt: RetryAttemptRecord) => void;
}

export interface SendResilienceOptions {
  readonly operationId?: string;
  readonly retryPolicy?: Partial<RetryPolicy>;
  readonly timeoutMs?: number;
  readonly cancellationToken?: ICancellationToken;
  /** Whether the packet transmission is safely idempotent */
  readonly idempotent?: boolean;
  readonly sendOptions?: TransportSendOptions;
  readonly onAttempt?: (attempt: RetryAttemptRecord) => void;
}

export interface RequestResponseResilienceOptions {
  readonly operationId?: string;
  readonly retryPolicy?: Partial<RetryPolicy>;
  readonly sendTimeoutMs?: number;
  readonly receiveTimeoutMs?: number;
  readonly cancellationToken?: ICancellationToken;
  readonly idempotent?: boolean;
  readonly onAttempt?: (attempt: RetryAttemptRecord) => void;
}

/**
 * Sleeps for a given duration while cooperatively observing cancellation.
 */
export function cancellableSleep(ms: number, token?: ICancellationToken): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  if (token?.isCancelled) {
    return Promise.reject(new TransportCancelledError('SLEEP', token.reason ?? 'Cancelled prior to delay'));
  }

  return new Promise<void>((resolve, reject) => {
    let unregisterCancel: (() => void) | undefined;

    const timer = setTimeout(() => {
      if (unregisterCancel) unregisterCancel();
      resolve();
    }, ms);

    if (token) {
      unregisterCancel = token.onCancelled(() => {
        clearTimeout(timer);
        reject(new TransportCancelledError('SLEEP', token.reason ?? 'Cancelled during backoff delay'));
      });
    }
  });
}

/**
 * Executes a promise with an enforced timeout and cancellation check.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutType: TimeoutType,
  endpoint?: TransportEndpoint,
  token?: ICancellationToken
): Promise<T> {
  if (timeoutMs <= 0 || !Number.isFinite(timeoutMs)) {
    return promise;
  }

  return new Promise<T>((resolve, reject) => {
    let timer: NodeJS.Timeout | undefined;
    let unregisterCancel: (() => void) | undefined;
    let settled = false;

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      if (unregisterCancel) unregisterCancel();
      settled = true;
    };

    timer = setTimeout(() => {
      if (settled) return;
      cleanup();
      reject(new TransportTimeoutError(timeoutType, timeoutMs, endpoint));
    }, timeoutMs);

    if (token) {
      if (token.isCancelled) {
        cleanup();
        return reject(new TransportCancelledError(timeoutType, token.reason ?? 'Cancelled prior to execution'));
      }
      unregisterCancel = token.onCancelled(() => {
        if (settled) return;
        cleanup();
        reject(new TransportCancelledError(timeoutType, token.reason ?? 'Cancelled during execution'));
      });
    }

    promise
      .then((val) => {
        if (!settled) {
          cleanup();
          resolve(val);
        }
      })
      .catch((err) => {
        if (!settled) {
          cleanup();
          reject(err);
        }
      });
  });
}

/**
 * Canonical Transport Resilience Engine.
 */
export class TransportResilienceEngine {
  /**
   * Executes an arbitrary async operation with bounded timeout, deterministic retry backoff,
   * idempotency checking, and forensic telemetry recording.
   */
  public static async execute<T>(
    operation: (attempt: number) => Promise<T>,
    options: ResilienceExecutionOptions
  ): Promise<{ result: T; telemetry: RetryExecutionTelemetry }> {
    const operationId = options.operationId ?? `op-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const policy: RetryPolicy = Object.freeze({
      ...DEFAULT_RETRY_POLICY,
      ...options.retryPolicy,
      maxAttempts: Math.min(10, Math.max(1, options.retryPolicy?.maxAttempts ?? DEFAULT_RETRY_POLICY.maxAttempts)),
    });

    const isIdempotent = options.idempotent ?? true;
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_POLICY.sendTimeoutMs;
    const timeoutType = options.timeoutType ?? 'SEND';
    const token = options.cancellationToken;

    const attemptHistory: RetryAttemptRecord[] = [];
    const executionStartTime = Date.now();
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
      // 1. Check cancellation before each attempt
      if (token?.isCancelled) {
        const cancelErr = new TransportCancelledError(operationId, token.reason ?? 'Operation cancelled', attempt - 1);
        const telemetry: RetryExecutionTelemetry = Object.freeze({
          operationId,
          operationName: options.operationName,
          idempotent: isIdempotent,
          totalAttempts: attempt - 1,
          maxAttempts: policy.maxAttempts,
          totalDurationMs: Date.now() - executionStartTime,
          finalOutcome: 'CANCELLED',
          attemptHistory: Object.freeze([...attemptHistory]),
          terminalError: cancelErr.message,
          terminalErrorCode: 'ERR_OPERATION_CANCELLED',
        });
        throw cancelErr;
      }

      // 2. Apply deterministic backoff delay if attempt > 1
      let delayBeforeMs = 0;
      if (attempt > 1) {
        delayBeforeMs = calculateBackoffDelay(attempt, policy);
        try {
          await cancellableSleep(delayBeforeMs, token);
        } catch (err: any) {
          const cancelErr = err instanceof TransportCancelledError
            ? err
            : new TransportCancelledError(operationId, err.message, attempt - 1);

          const telemetry: RetryExecutionTelemetry = Object.freeze({
            operationId,
            operationName: options.operationName,
            idempotent: isIdempotent,
            totalAttempts: attempt - 1,
            maxAttempts: policy.maxAttempts,
            totalDurationMs: Date.now() - executionStartTime,
            finalOutcome: 'CANCELLED',
            attemptHistory: Object.freeze([...attemptHistory]),
            terminalError: cancelErr.message,
            terminalErrorCode: 'ERR_OPERATION_CANCELLED',
          });
          throw cancelErr;
        }
      }

      const attemptStartTime = Date.now();

      // 3. Execute operation under timeout guard
      try {
        const result = await withTimeout(
          operation(attempt),
          timeoutMs,
          timeoutType,
          options.endpoint,
          token
        );

        const attemptEndTime = Date.now();
        const successRecord: RetryAttemptRecord = Object.freeze({
          attemptNumber: attempt,
          startTime: attemptStartTime,
          endTime: attemptEndTime,
          durationMs: attemptEndTime - attemptStartTime,
          delayBeforeMs,
          success: true,
          retryable: false,
        });

        attemptHistory.push(successRecord);
        if (options.onAttempt) options.onAttempt(successRecord);

        const telemetry: RetryExecutionTelemetry = Object.freeze({
          operationId,
          operationName: options.operationName,
          idempotent: isIdempotent,
          totalAttempts: attempt,
          maxAttempts: policy.maxAttempts,
          totalDurationMs: Date.now() - executionStartTime,
          finalOutcome: 'SUCCESS',
          attemptHistory: Object.freeze([...attemptHistory]),
        });

        return { result, telemetry };
      } catch (err: any) {
        const attemptEndTime = Date.now();
        lastError = err instanceof Error ? err : new Error(String(err));

        const isRetryable = isRetryableError(lastError, policy);
        const errCode = (lastError as any).code ?? lastError.name;

        const failureRecord: RetryAttemptRecord = Object.freeze({
          attemptNumber: attempt,
          startTime: attemptStartTime,
          endTime: attemptEndTime,
          durationMs: attemptEndTime - attemptStartTime,
          delayBeforeMs,
          success: false,
          error: lastError.message,
          errorCode: errCode,
          retryable: isRetryable,
        });

        attemptHistory.push(failureRecord);
        if (options.onAttempt) options.onAttempt(failureRecord);

        // Handle cancellation
        if (lastError instanceof TransportCancelledError || token?.isCancelled) {
          const cancelErr = lastError instanceof TransportCancelledError
            ? lastError
            : new TransportCancelledError(operationId, token?.reason ?? 'Operation cancelled', attempt);

          const telemetry: RetryExecutionTelemetry = Object.freeze({
            operationId,
            operationName: options.operationName,
            idempotent: isIdempotent,
            totalAttempts: attempt,
            maxAttempts: policy.maxAttempts,
            totalDurationMs: Date.now() - executionStartTime,
            finalOutcome: 'CANCELLED',
            attemptHistory: Object.freeze([...attemptHistory]),
            terminalError: cancelErr.message,
            terminalErrorCode: 'ERR_OPERATION_CANCELLED',
          });
          throw cancelErr;
        }

        // Idempotency Defense: Never retry non-idempotent mutations once initiated
        if (!isIdempotent && policy.idempotencyEnforced) {
          const nonRetryErr = new NonRetryableOperationError(
            operationId,
            `Operation '${options.operationName}' is non-idempotent; blind retry forbidden to prevent duplicate delivery: ${lastError.message}`
          );

          const telemetry: RetryExecutionTelemetry = Object.freeze({
            operationId,
            operationName: options.operationName,
            idempotent: false,
            totalAttempts: attempt,
            maxAttempts: policy.maxAttempts,
            totalDurationMs: Date.now() - executionStartTime,
            finalOutcome: 'NON_RETRYABLE_ERROR',
            attemptHistory: Object.freeze([...attemptHistory]),
            terminalError: nonRetryErr.message,
            terminalErrorCode: 'ERR_NON_RETRYABLE_OPERATION',
          });
          throw nonRetryErr;
        }

        // Fatal/Non-retryable error
        if (!isRetryable) {
          const telemetry: RetryExecutionTelemetry = Object.freeze({
            operationId,
            operationName: options.operationName,
            idempotent: isIdempotent,
            totalAttempts: attempt,
            maxAttempts: policy.maxAttempts,
            totalDurationMs: Date.now() - executionStartTime,
            finalOutcome: 'NON_RETRYABLE_ERROR',
            attemptHistory: Object.freeze([...attemptHistory]),
            terminalError: lastError.message,
            terminalErrorCode: errCode,
          });
          throw lastError;
        }

        // Check if max attempts exhausted
        if (attempt >= policy.maxAttempts) {
          if (policy.maxAttempts === 1) {
            throw lastError;
          }
          const telemetry: RetryExecutionTelemetry = Object.freeze({
            operationId,
            operationName: options.operationName,
            idempotent: isIdempotent,
            totalAttempts: attempt,
            maxAttempts: policy.maxAttempts,
            totalDurationMs: Date.now() - executionStartTime,
            finalOutcome: 'RETRY_EXHAUSTED',
            attemptHistory: Object.freeze([...attemptHistory]),
            terminalError: lastError.message,
            terminalErrorCode: errCode,
          });
          throw new TransportRetryExhaustedError(operationId, attempt, telemetry, lastError);
        }
      }
    }

    // Safety fallback (loop exited without return or throw)
    const exhaustedErr = new TransportRetryExhaustedError(
      operationId,
      policy.maxAttempts,
      Object.freeze({
        operationId,
        operationName: options.operationName,
        idempotent: isIdempotent,
        totalAttempts: policy.maxAttempts,
        maxAttempts: policy.maxAttempts,
        totalDurationMs: Date.now() - executionStartTime,
        finalOutcome: 'RETRY_EXHAUSTED',
        attemptHistory: Object.freeze([...attemptHistory]),
        terminalError: lastError?.message,
      }),
      lastError
    );
    throw exhaustedErr;
  }

  // ─── Resilient Transport Operations ───────────────────────────────────────

  /**
   * Connects to a remote endpoint with retry backoff, connect timeout, and cancellation.
   * Cleans up sockets between failed attempts to guarantee zero descriptor leaks.
   */
  public static async connectWithResilience(
    adapter: ITransportAdapter,
    endpoint: TransportEndpoint,
    options?: ConnectResilienceOptions
  ): Promise<{ session: TransportSession; telemetry: RetryExecutionTelemetry }> {
    const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_POLICY.connectTimeoutMs;

    const { result, telemetry } = await this.execute<TransportSession>(
      async (_attempt) => {
        // If adapter is in a faulted or half-open state from a previous attempt, reset it
        if (adapter.state === 'CONNECTED' || adapter.state === 'INITIALIZING' || adapter.state === 'CONNECTING') {
          await adapter.close('Resetting for next connection attempt').catch(() => {});
        }

        try {
          return await adapter.connect(endpoint);
        } catch (err: any) {
          // Immediately close lingering socket resources on failure
          await adapter.close('Connection attempt failed').catch(() => {});
          throw err;
        }
      },
      {
        operationName: `CONNECT:${endpoint.transportType}://${endpoint.host}:${endpoint.port}`,
        operationId: options?.operationId,
        retryPolicy: options?.retryPolicy,
        timeoutMs,
        timeoutType: 'CONNECT',
        cancellationToken: options?.cancellationToken,
        endpoint,
        idempotent: true, // Connection is inherently idempotent
        onAttempt: options?.onAttempt,
      }
    );

    return { session: result, telemetry };
  }

  /**
   * Transmits a packet with bounded timeout, cancellation, and idempotency enforcement.
   */
  public static async sendWithResilience(
    adapter: ITransportAdapter,
    packet: CubiOPacket,
    options?: SendResilienceOptions
  ): Promise<{ receipt: TransportDeliveryReceipt; telemetry: RetryExecutionTelemetry }> {
    const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_POLICY.sendTimeoutMs;
    const isIdempotent = options?.idempotent ?? true;

    const { result, telemetry } = await this.execute<TransportDeliveryReceipt>(
      async (_attempt) => {
        return adapter.send(packet, options?.sendOptions);
      },
      {
        operationName: `SEND_PACKET:${packet.header.packetId}`,
        operationId: options?.operationId ?? `send-${packet.header.packetId}`,
        retryPolicy: options?.retryPolicy,
        timeoutMs,
        timeoutType: 'SEND',
        cancellationToken: options?.cancellationToken,
        idempotent: isIdempotent,
        onAttempt: options?.onAttempt,
      }
    );

    return { receipt: result, telemetry };
  }

  /**
   * Transmits a request packet and awaits a correlated response with full timeout,
   * cancellation, listener cleanup, and idempotent retry.
   */
  public static async requestResponseWithResilience(
    adapter: ITransportAdapter,
    requestPacket: CubiOPacket,
    matcher: (responsePacket: CubiOPacket) => boolean,
    options?: RequestResponseResilienceOptions
  ): Promise<{ response: CubiOPacket; telemetry: RetryExecutionTelemetry }> {
    const sendTimeoutMs = options?.sendTimeoutMs ?? DEFAULT_TIMEOUT_POLICY.sendTimeoutMs;
    const receiveTimeoutMs = options?.receiveTimeoutMs ?? DEFAULT_TIMEOUT_POLICY.receiveTimeoutMs;
    const isIdempotent = options?.idempotent ?? true;

    const { result, telemetry } = await this.execute<CubiOPacket>(
      async (_attempt) => {
        let unregisterReceive: (() => void) | undefined;
        let responsePromise: Promise<CubiOPacket>;

        responsePromise = new Promise<CubiOPacket>((resolve) => {
          const handler = (incoming: CubiOPacket) => {
            if (matcher(incoming)) {
              resolve(incoming);
            }
          };

          const unregister = adapter.receive(handler);
          if (typeof unregister === 'function') {
            unregisterReceive = unregister;
          } else if (typeof (adapter as any).removeReceive === 'function') {
            unregisterReceive = () => (adapter as any).removeReceive(handler);
          }
        });

        try {
          // Send request first under send timeout
          await withTimeout(
            adapter.send(requestPacket),
            sendTimeoutMs,
            'SEND',
            undefined,
            options?.cancellationToken
          );

          // Await correlated response under receive timeout
          return await withTimeout(
            responsePromise,
            receiveTimeoutMs,
            'RECEIVE',
            undefined,
            options?.cancellationToken
          );
        } finally {
          if (unregisterReceive) {
            unregisterReceive();
          }
        }
      },
      {
        operationName: `REQUEST_RESPONSE:${requestPacket.header.packetId}`,
        operationId: options?.operationId ?? `req-res-${requestPacket.header.packetId}`,
        retryPolicy: options?.retryPolicy,
        timeoutMs: sendTimeoutMs + receiveTimeoutMs + 500,
        timeoutType: 'RECEIVE',
        cancellationToken: options?.cancellationToken,
        idempotent: isIdempotent,
        onAttempt: options?.onAttempt,
      }
    );

    return { response: result, telemetry };
  }
}
