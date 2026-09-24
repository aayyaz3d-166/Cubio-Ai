/**
 * CUBiO Network Protocol v1 — Canonical Error and Response Engine
 * ===============================================================
 *
 * Implements deterministic construction, validation, sanitization,
 * serialization, and cross-subsystem adapters for CUBiO responses and errors.
 *
 * REUSED VERIFIED STRUCTURES:
 *   - deterministicHash       (response ID generation)
 *   - serializeCanonical     (RFC 8785 JCS wire serialization)
 *   - deserializeCanonical   (safe JSON deserialization)
 *   - canonicalHash          (content-addressable response hashing)
 *
 * LEAKAGE DEFENSE GUARANTEES:
 *   1. Redacts file system paths (Windows C:\... and POSIX /home/...) from messages and details.
 *   2. Redacts stack traces and internal call-sites from messages and details.
 *   3. Deeply redacts sensitive keys (passwords, tokens, private keys, secrets, credentials).
 *   4. Freezes constructed response frames to guarantee runtime immutability.
 */

import { deterministicHash } from '../../../state/determinism';
import {
  serializeCanonical,
  deserializeCanonical,
  canonicalHash,
} from './canonicalSerializer';
import {
  ProtocolErrorCategory,
  ResponseStatusCode,
  ProtocolErrorCodeCatalog,
  CanonicalProtocolError,
  CubiOSuccessResponse,
  CubiOErrorResponse,
  CubiOResponse,
  SuccessResponseOptions,
  ErrorResponseOptions,
  ResponseValidationResult,
} from './responseTypes';
import { EnvelopeValidationResult } from './types';
import { VersionNegotiationResult } from './versionTypes';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Sanitization & Sensitive Data Redaction
// ─────────────────────────────────────────────────────────────────────────────

const SENSITIVE_KEY_REGEX =
  /^(?:password|secret|token|credential|credentials|private_?key|privatekey|api_?key|auth_?token|authorization|cookie|session_?id|jwt)$/i;

const WINDOWS_PATH_REGEX = /[a-zA-Z]:\\(?:[^\\/:*?"<>|\r\n]+\\)*[^\\/:*?"<>|\r\n]*/g;
const POSIX_PATH_REGEX = /(?:\/(?:Users|home|var|etc|usr|tmp|app|private|sys|proc|opt))\/[^\s"']+/g;
const STACK_FRAME_REGEX = /(?:\r?\n)\s+at\s+[^\r\n]+/g;

/**
 * Strips filesystem paths, stack frames, and sensitive patterns from error strings.
 */
export function sanitizeString(val: string): string {
  if (!val || typeof val !== 'string') return '';
  return val
    .replace(STACK_FRAME_REGEX, '')
    .replace(WINDOWS_PATH_REGEX, '[REDACTED_PATH]')
    .replace(POSIX_PATH_REGEX, '[REDACTED_PATH]')
    .trim();
}

/**
 * Recursively redacts sensitive dictionary keys, file paths, and stack traces.
 */
export function sanitizeDetails(
  details?: Record<string, unknown>,
  visited: WeakSet<object> = new WeakSet()
): Record<string, unknown> | undefined {
  if (!details || typeof details !== 'object') return undefined;
  if (visited.has(details)) return { '[CIRCULAR]': true };
  visited.add(details);

  const clean: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(details)) {
    if (SENSITIVE_KEY_REGEX.test(key)) {
      clean[key] = '[REDACTED]';
      continue;
    }

    if (typeof value === 'string') {
      clean[key] = sanitizeString(value);
    } else if (value instanceof Error) {
      clean[key] = {
        name: value.name,
        message: sanitizeString(value.message),
      };
    } else if (Array.isArray(value)) {
      clean[key] = value.map((item) => {
        if (typeof item === 'string') return sanitizeString(item);
        if (item && typeof item === 'object') {
          return sanitizeDetails(item as Record<string, unknown>, visited);
        }
        return item;
      });
    } else if (value !== null && typeof value === 'object') {
      clean[key] = sanitizeDetails(value as Record<string, unknown>, visited);
    } else {
      clean[key] = value;
    }
  }

  return clean;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Response Identifier Generation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Computes a deterministic, content-addressable response ID.
 */
export function generateResponseId(
  correlationId: string,
  timestamp: number,
  status: 'SUCCESS' | 'ERROR',
  salt: string = 'CNP_RSP'
): string {
  const seed = serializeCanonical({
    correlationId,
    salt,
    status,
    timestamp,
  });
  const hash = deterministicHash(seed);
  return `RSP_${hash}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Response Factories
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Constructs a canonical success response frame.
 */
export function createSuccessResponse<T = unknown>(
  correlationId: string,
  payload: T,
  options?: SuccessResponseOptions
): Readonly<CubiOSuccessResponse<T>> {
  if (!correlationId || typeof correlationId !== 'string') {
    throw new Error('createSuccessResponse: correlationId must be a non-empty string');
  }

  const timestamp = options?.timestamp ?? Date.now();
  const statusCode = options?.statusCode ?? ResponseStatusCode.OK;
  const responseId =
    options?.responseId ?? generateResponseId(correlationId, timestamp, 'SUCCESS');

  const metadata = options?.metadata ? sanitizeDetails(options.metadata) : undefined;

  const response: CubiOSuccessResponse<T> = {
    status: 'SUCCESS',
    responseId,
    correlationId,
    timestamp,
    statusCode,
    payload,
    ...(metadata ? { metadata } : {}),
  };

  return Object.freeze(response);
}

/**
 * Constructs a canonical error response frame with mandatory sanitization.
 */
export function createErrorResponse(
  correlationId: string,
  category: ProtocolErrorCategory,
  code: string,
  message: string,
  options?: ErrorResponseOptions
): Readonly<CubiOErrorResponse> {
  if (!correlationId || typeof correlationId !== 'string') {
    throw new Error('createErrorResponse: correlationId must be a non-empty string');
  }
  if (!category || typeof category !== 'string') {
    throw new Error('createErrorResponse: category must be a non-empty string');
  }
  if (!code || typeof code !== 'string') {
    throw new Error('createErrorResponse: code must be a non-empty string');
  }

  const timestamp = options?.timestamp ?? Date.now();
  const statusCode = options?.statusCode ?? ResponseStatusCode.BAD_REQUEST;
  const responseId =
    options?.responseId ?? generateResponseId(correlationId, timestamp, 'ERROR');

  const sanitizedMessage = sanitizeString(message) || 'Unknown protocol error';
  const sanitizedDetails = options?.details ? sanitizeDetails(options.details) : undefined;
  const sanitizedMetadata = options?.metadata ? sanitizeDetails(options.metadata) : undefined;

  const canonicalError: CanonicalProtocolError = {
    category,
    code: code.trim(),
    message: sanitizedMessage,
    ...(sanitizedDetails ? { details: sanitizedDetails } : {}),
    retryable: options?.retryable ?? false,
    ...(typeof options?.retryAfterMs === 'number'
      ? { retryAfterMs: Math.max(0, Math.floor(options.retryAfterMs)) }
      : {}),
  };

  const response: CubiOErrorResponse = {
    status: 'ERROR',
    responseId,
    correlationId,
    timestamp,
    statusCode,
    error: Object.freeze(canonicalError),
    ...(sanitizedMetadata ? { metadata: sanitizedMetadata } : {}),
  };

  return Object.freeze(response);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Specialized Error Category Factories
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Constructs a PROTOCOL_ERROR response.
 */
export function createProtocolError(
  correlationId: string,
  code: string,
  message: string,
  options?: ErrorResponseOptions
): Readonly<CubiOErrorResponse> {
  return createErrorResponse(correlationId, 'PROTOCOL_ERROR', code, message, {
    statusCode: ResponseStatusCode.BAD_REQUEST,
    retryable: false,
    ...options,
  });
}

/**
 * Constructs a VALIDATION_ERROR response.
 */
export function createValidationError(
  correlationId: string,
  code: string,
  message: string,
  options?: ErrorResponseOptions
): Readonly<CubiOErrorResponse> {
  return createErrorResponse(correlationId, 'VALIDATION_ERROR', code, message, {
    statusCode: ResponseStatusCode.UNPROCESSABLE_ENTITY,
    retryable: false,
    ...options,
  });
}

/**
 * Constructs a VERSION_ERROR response.
 */
export function createVersionError(
  correlationId: string,
  code: string,
  message: string,
  options?: ErrorResponseOptions
): Readonly<CubiOErrorResponse> {
  return createErrorResponse(correlationId, 'VERSION_ERROR', code, message, {
    statusCode: ResponseStatusCode.UPGRADE_REQUIRED,
    retryable: false,
    ...options,
  });
}

/**
 * Constructs a future-proof NETWORK_ERROR response.
 */
export function createNetworkError(
  correlationId: string,
  code: string,
  message: string,
  options?: ErrorResponseOptions
): Readonly<CubiOErrorResponse> {
  return createErrorResponse(correlationId, 'NETWORK_ERROR', code, message, {
    statusCode: ResponseStatusCode.BAD_GATEWAY,
    retryable: true,
    retryAfterMs: 1_000,
    ...options,
  });
}

/**
 * Constructs a SECURITY_ERROR response.
 */
export function createSecurityError(
  correlationId: string,
  code: string,
  message: string,
  options?: ErrorResponseOptions
): Readonly<CubiOErrorResponse> {
  return createErrorResponse(correlationId, 'SECURITY_ERROR', code, message, {
    statusCode: ResponseStatusCode.FORBIDDEN,
    retryable: false,
    ...options,
  });
}

/**
 * Constructs a RATE_LIMIT_ERROR response.
 */
export function createRateLimitError(
  correlationId: string,
  retryAfterMs: number,
  details?: Record<string, unknown>
): Readonly<CubiOErrorResponse> {
  return createErrorResponse(
    correlationId,
    'RATE_LIMIT_ERROR',
    ProtocolErrorCodeCatalog.ERR_RATE_LIMIT_EXCEEDED,
    `Rate limit exceeded; backoff required for ${retryAfterMs}ms`,
    {
      statusCode: ResponseStatusCode.TOO_MANY_REQUESTS,
      retryable: true,
      retryAfterMs,
      details,
    }
  );
}

/**
 * Constructs an INTERNAL_ERROR response, guaranteeing no sensitive data or stack leaks.
 */
export function createInternalError(
  correlationId: string,
  rawError?: unknown,
  options?: ErrorResponseOptions
): Readonly<CubiOErrorResponse> {
  let message = 'An internal protocol engine error occurred';
  const details: Record<string, unknown> = {};

  if (rawError instanceof Error) {
    message = sanitizeString(rawError.message) || message;
    details.errorName = rawError.name;
  } else if (typeof rawError === 'string') {
    message = sanitizeString(rawError) || message;
  }

  return createErrorResponse(
    correlationId,
    'INTERNAL_ERROR',
    ProtocolErrorCodeCatalog.ERR_INTERNAL_ERROR,
    message,
    {
      statusCode: ResponseStatusCode.INTERNAL_SERVER_ERROR,
      retryable: false,
      details: Object.keys(details).length > 0 ? details : undefined,
      ...options,
    }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Response Validation
// ─────────────────────────────────────────────────────────────────────────────

const VALID_ERROR_CATEGORIES = new Set<ProtocolErrorCategory>([
  'PROTOCOL_ERROR',
  'VALIDATION_ERROR',
  'VERSION_ERROR',
  'NETWORK_ERROR',
  'SECURITY_ERROR',
  'RATE_LIMIT_ERROR',
  'INTERNAL_ERROR',
]);

/**
 * Validates arbitrary input against the canonical CubiOResponse schema.
 */
export function validateResponse(input: unknown): ResponseValidationResult {
  const errors: string[] = [];

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { isValid: false, errors: ['Response must be a non-null object'] };
  }

  const r = input as Record<string, any>;

  // Common Header Validation
  if (r.status !== 'SUCCESS' && r.status !== 'ERROR') {
    errors.push(`Invalid status "${r.status}": must be "SUCCESS" or "ERROR"`);
  }

  if (typeof r.responseId !== 'string' || !r.responseId.startsWith('RSP_')) {
    errors.push('responseId must be a non-empty string starting with "RSP_"');
  }

  if (typeof r.correlationId !== 'string' || r.correlationId.trim() === '') {
    errors.push('correlationId must be a non-empty string');
  }

  if (typeof r.timestamp !== 'number' || !Number.isFinite(r.timestamp) || r.timestamp <= 0) {
    errors.push('timestamp must be a positive finite number');
  }

  if (
    typeof r.statusCode !== 'number' ||
    !Number.isInteger(r.statusCode) ||
    r.statusCode < 100 ||
    r.statusCode > 599
  ) {
    errors.push('statusCode must be an integer between 100 and 599');
  }

  // Branch Specific Validation
  if (r.status === 'SUCCESS') {
    if (r.payload === undefined) {
      errors.push('Success response must define a payload');
    }
  } else if (r.status === 'ERROR') {
    if (!r.error || typeof r.error !== 'object' || Array.isArray(r.error)) {
      errors.push('Error response must contain a valid error object');
    } else {
      const err = r.error;
      if (!VALID_ERROR_CATEGORIES.has(err.category)) {
        errors.push(`Invalid error category "${err.category}"`);
      }
      if (typeof err.code !== 'string' || err.code.trim() === '') {
        errors.push('error.code must be a non-empty string');
      }
      if (typeof err.message !== 'string' || err.message.trim() === '') {
        errors.push('error.message must be a non-empty string');
      }
      if (typeof err.retryable !== 'boolean') {
        errors.push('error.retryable must be a boolean');
      }
      if (err.retryAfterMs !== undefined) {
        if (
          typeof err.retryAfterMs !== 'number' ||
          !Number.isFinite(err.retryAfterMs) ||
          err.retryAfterMs < 0
        ) {
          errors.push('error.retryAfterMs must be a non-negative number');
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Subsystem Integration Adapters
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Maps an EnvelopeValidationResult (from Task 01) into a canonical CubiOResponse.
 */
export function fromEnvelopeValidation(
  correlationId: string,
  result: EnvelopeValidationResult
): CubiOResponse {
  if (result.valid && result.envelope) {
    return createSuccessResponse(correlationId, result.envelope);
  }

  const primaryError = result.errors[0];
  const code = primaryError ? primaryError.code : 'ERR_VALIDATION_FAILED';
  const message = primaryError ? primaryError.message : 'Envelope validation failed';

  // Classify based on error code
  let category: ProtocolErrorCategory = 'VALIDATION_ERROR';
  if (code.includes('VERSION')) {
    category = 'VERSION_ERROR';
  } else if (code.includes('UNAUTHORIZED') || code.includes('SIGNATURE')) {
    category = 'SECURITY_ERROR';
  } else if (code.includes('UNREACHABLE') || code.includes('LOOP')) {
    category = 'NETWORK_ERROR';
  }

  return createErrorResponse(correlationId, category, code, message, {
    details: {
      field: primaryError?.field,
      allErrors: result.errors.map((e) => ({
        code: e.code,
        field: e.field,
        message: sanitizeString(e.message),
      })),
    },
  });
}

/**
 * Maps a VersionNegotiationResult (from Task 06) into a canonical CubiOResponse.
 */
export function fromVersionNegotiation(
  correlationId: string,
  result: VersionNegotiationResult
): CubiOResponse {
  if (result.status === 'ACCEPTED') {
    return createSuccessResponse(correlationId, {
      status: 'ACCEPTED',
      selectedVersion: result.selectedVersion,
      versionString: result.versionString,
      agreedCapabilities: result.agreedCapabilities,
      responderNodeId: result.responderNodeId,
    });
  }

  const code = result.rejectionCode || 'ERR_VERSION_INCOMPATIBLE';
  const reason = result.rejectionReason || 'Version negotiation rejected';

  return createVersionError(correlationId, code, reason, {
    details: {
      responderNodeId: result.responderNodeId,
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Deterministic Serialization & Hashing
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Serializes a CubiOResponse to an RFC 8785 canonical JSON string.
 */
export function serializeResponse(response: CubiOResponse): string {
  const validation = validateResponse(response);
  if (!validation.isValid) {
    throw new Error(`Cannot serialize invalid response: ${validation.errors.join('; ')}`);
  }
  return serializeCanonical(response);
}

/**
 * Deserializes an RFC 8785 canonical JSON string into a validated CubiOResponse.
 */
export function deserializeResponse<T = unknown>(json: string): CubiOResponse<T> {
  const parsed = deserializeCanonical(json);
  const validation = validateResponse(parsed);
  if (!validation.isValid) {
    throw new Error(`Deserialized object failed response validation: ${validation.errors.join('; ')}`);
  }
  return parsed as CubiOResponse<T>;
}

/**
 * Produces the content-addressable hash of a response frame.
 */
export function responseHash(response: CubiOResponse): string {
  return canonicalHash(response);
}
