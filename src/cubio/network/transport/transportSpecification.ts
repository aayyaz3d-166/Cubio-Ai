/**
 * CUBiO AI — Real Transport Layer Specification Engine
 * ====================================================
 *
 * Implements validation logic, state transition enforcement, error factory,
 * and compatibility bridges ensuring strict alignment with Phase 1 Protocol specifications.
 */

import {
  TransportType,
  TransportLifecycleState,
  TransportEndpoint,
  CanonicalTransportError,
  TransportErrorCode,
  PERMITTED_TRANSPORT_TRANSITIONS,
} from './types';
import {
  CUBIO_TRANSPORT_CONSTANTS,
  TRANSPORT_FRAME_CONSTANTS,
} from './constants';
import { CubiONetworkCoordinateEngine } from '../coordinate/coordinate';

/**
 * Validates a TransportEndpoint descriptor.
 */
export function validateTransportEndpoint(endpoint: unknown): { isValid: boolean; error?: string } {
  if (!endpoint || typeof endpoint !== 'object') {
    return { isValid: false, error: 'Endpoint must be a non-null object' };
  }

  const ep = endpoint as Partial<TransportEndpoint>;

  const validTypes: ReadonlySet<TransportType> = new Set(['MEMORY', 'UDP', 'TCP', 'WEBSOCKET', 'IPC_PIPE']);
  if (!ep.transportType || !validTypes.has(ep.transportType)) {
    return { isValid: false, error: `Invalid transportType: ${ep.transportType}` };
  }

  if (typeof ep.host !== 'string' || ep.host.trim().length === 0) {
    return { isValid: false, error: 'Host must be a non-empty string' };
  }

  if (typeof ep.port !== 'number' || ep.port < 0 || ep.port > 65535 || !Number.isInteger(ep.port)) {
    return { isValid: false, error: `Port must be an integer between 0 and 65535, got: ${ep.port}` };
  }

  if (ep.coordinateUri) {
    const coordVal = CubiONetworkCoordinateEngine.tryParse(ep.coordinateUri);
    if (!coordVal.isValid) {
      return { isValid: false, error: `Invalid coordinateUri: ${coordVal.errors[0]?.message}` };
    }
  }

  return { isValid: true };
}

/**
 * Validates whether a transport state transition is permitted.
 */
export function validateTransportTransition(
  currentState: TransportLifecycleState,
  nextState: TransportLifecycleState
): boolean {
  const allowed = PERMITTED_TRANSPORT_TRANSITIONS.get(currentState);
  return allowed ? allowed.has(nextState) : false;
}

/**
 * Enforces a state transition; throws if illegal.
 */
export function assertTransportTransition(
  currentState: TransportLifecycleState,
  nextState: TransportLifecycleState,
  context?: string
): void {
  if (!validateTransportTransition(currentState, nextState)) {
    const allowed = PERMITTED_TRANSPORT_TRANSITIONS.get(currentState);
    const allowedStr = allowed ? Array.from(allowed).join(', ') : 'NONE';
    throw new Error(
      `Illegal transport lifecycle transition: '${currentState}' → '${nextState}'. ` +
      `Allowed: [${allowedStr}]. ${context ? `Context: ${context}` : ''}`
    );
  }
}

/**
 * Constructs a structured CanonicalTransportError.
 */
export function createTransportError(
  code: TransportErrorCode,
  message: string,
  transportType: TransportType,
  options?: {
    endpoint?: TransportEndpoint;
    fatal?: boolean;
    cause?: string;
  }
): CanonicalTransportError {
  return Object.freeze({
    code,
    message,
    transportType,
    endpoint: options?.endpoint ? Object.freeze({ ...options.endpoint }) : undefined,
    timestamp: Date.now(),
    fatal: options?.fatal ?? false,
    cause: options?.cause,
  });
}

/**
 * Validates raw wire frame framing parameters.
 */
export function validateWireFrameHeader(
  magic: string,
  frameLength: number
): { isValid: boolean; error?: string } {
  if (magic !== TRANSPORT_FRAME_CONSTANTS.MAGIC) {
    return {
      isValid: false,
      error: `Invalid wire frame magic: expected '${TRANSPORT_FRAME_CONSTANTS.MAGIC}', got '${magic}'`,
    };
  }

  if (frameLength < TRANSPORT_FRAME_CONSTANTS.MIN_FRAME_BYTES) {
    return {
      isValid: false,
      error: `Frame length ${frameLength} below minimum ${TRANSPORT_FRAME_CONSTANTS.MIN_FRAME_BYTES} bytes`,
    };
  }

  if (frameLength > TRANSPORT_FRAME_CONSTANTS.MAX_FRAME_BYTES) {
    return {
      isValid: false,
      error: `Frame length ${frameLength} exceeds maximum ${TRANSPORT_FRAME_CONSTANTS.MAX_FRAME_BYTES} bytes`,
    };
  }

  return { isValid: true };
}
