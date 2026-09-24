/**
 * CUBiO AI — Transport Handshake & Version Negotiation Types
 * ============================================================
 *
 * Defines the formal contracts, message payloads, negotiation models,
 * and errors for real CUBiO transport handshakes.
 *
 * Reuses certified Phase 1 types:
 *   - ProtocolPrincipal (from src/cubio/network/protocol/v1/types.ts)
 *   - CanonicalProtocolVersion, VersionRejectionCode (from src/cubio/network/protocol/v1/versionTypes.ts)
 *   - TransportCapabilities, TransportEndpoint (from src/cubio/network/transport/types.ts)
 */

import { ProtocolPrincipal } from '../protocol/v1/types';
import {
  CanonicalProtocolVersion,
  VersionRejectionCode,
} from '../protocol/v1/versionTypes';
import {
  TransportCapabilities,
  TransportEndpoint,
} from './types';

/**
 * Rejection error codes covering version mismatches, security replay, malformed payloads, and timeouts.
 */
export type HandshakeRejectionCode =
  | VersionRejectionCode
  | 'ERR_HANDSHAKE_REPLAYED'
  | 'ERR_MALFORMED_HANDSHAKE'
  | 'ERR_HANDSHAKE_TIMEOUT'
  | 'ERR_PRINCIPAL_INVALID';

/**
 * Outbound handshake negotiation offer initiated by a connecting peer.
 */
export interface TransportHandshakeOffer {
  /** Unique deterministic handshake transaction ID */
  readonly handshakeId: string;
  /** Monotonic epoch timestamp (ms) when offer was generated */
  readonly timestamp: number;
  /** Cryptographic / deterministic single-use nonce preventing replay */
  readonly nonce: string;
  /** Authenticated sovereign identity of the initiator */
  readonly initiatorPrincipal: ProtocolPrincipal;
  /** Optional local transport endpoint of the initiator */
  readonly initiatorEndpoint?: TransportEndpoint;
  /** Ordered list of protocol versions supported by the initiator */
  readonly offeredVersions: readonly CanonicalProtocolVersion[];
  /** Preferred protocol version */
  readonly preferredVersion?: CanonicalProtocolVersion;
  /** Client implementation identification string */
  readonly clientImplementation: string;
  /** Application and protocol feature capability flags requested */
  readonly requestedCapabilities: readonly string[];
  /** Physical transport capabilities and limits of the initiator */
  readonly transportCapabilities: TransportCapabilities;
}

/**
 * Handshake response returned by the responding server.
 */
export interface TransportHandshakeResult {
  /** Unique handshake transaction ID matching offer or generated for response */
  readonly handshakeId: string;
  /** Correlation ID linking directly to the initiator's handshakeId */
  readonly correlationId: string;
  /** Monotonic epoch timestamp (ms) of the response */
  readonly timestamp: number;
  /** Responder's fresh single-use nonce */
  readonly nonce: string;
  /** Negotiation status: ACCEPTED or REJECTED */
  readonly status: 'ACCEPTED' | 'REJECTED';
  /** Authenticated identity of the responder */
  readonly responderPrincipal: ProtocolPrincipal;
  /** Optional local transport endpoint of the responder */
  readonly responderEndpoint?: TransportEndpoint;
  /** Selected mutually-compatible protocol version (if ACCEPTED) */
  readonly selectedVersion?: CanonicalProtocolVersion;
  /** Canonical formatted string of selected version (e.g. 'CNP/1.0.0') */
  readonly versionString?: string;
  /** Mutually agreed capability flags */
  readonly agreedCapabilities?: readonly string[];
  /** Minimum shared payload size in bytes */
  readonly negotiatedMaxPayloadBytes?: number;
  /** Server implementation identification string */
  readonly serverImplementation: string;
  /** Rejection taxonomy code (if REJECTED) */
  readonly rejectionCode?: HandshakeRejectionCode;
  /** Forensic diagnostic reason for rejection */
  readonly rejectionReason?: string;
}

/**
 * Configuration options for the transport handshake coordinator.
 */
export interface HandshakeOptions {
  /** Maximum time (ms) to await handshake response before aborting. Default: 5,000 ms */
  readonly handshakeTimeoutMs?: number;
  /** Maximum allowed clock skew (ms) between peer timestamps. Default: 30,000 ms */
  readonly maxClockSkewMs?: number;
  /** Duration (ms) to retain seen nonces in memory cache for replay defense. Default: 60,000 ms */
  readonly nonceCacheTtlMs?: number;
}

/**
 * Thrown when a peer explicitly rejects a handshake offer.
 */
export class HandshakeRejectedError extends Error {
  public readonly rejectionCode: HandshakeRejectionCode;
  public readonly rejectionReason: string;

  constructor(code: HandshakeRejectionCode, reason: string) {
    super(`CUBiO transport handshake rejected [${code}]: ${reason}`);
    this.name = 'HandshakeRejectedError';
    this.rejectionCode = code;
    this.rejectionReason = reason;
  }
}

/**
 * Thrown when a handshake negotiation times out.
 */
export class HandshakeTimeoutError extends Error {
  public readonly timeoutMs: number;

  constructor(timeoutMs: number, context?: string) {
    super(`CUBiO transport handshake timed out after ${timeoutMs}ms. ${context ?? ''}`);
    this.name = 'HandshakeTimeoutError';
    this.timeoutMs = timeoutMs;
  }
}

/**
 * Thrown when an incoming handshake payload is corrupted, malformed, or violates schema.
 */
export class HandshakeMalformedError extends Error {
  public readonly details: string;

  constructor(details: string) {
    super(`CUBiO transport handshake payload is malformed: ${details}`);
    this.name = 'HandshakeMalformedError';
    this.details = details;
  }
}
