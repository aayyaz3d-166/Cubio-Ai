/**
 * CUBiO AI — Transport Security & TLS Configuration Types
 * =========================================================
 *
 * Defines the configuration contracts, secure defaults, session inspection,
 * and error models for transport-layer security (TLS 1.2 / TLS 1.3 and WSS).
 *
 * ARCHITECTURAL SEPARATION:
 *   - Transport security provides link-layer encryption and hop-by-hop authentication (TLS/WSS).
 *   - Application-level sovereign identities (CUBiO ProtocolPrincipal, cubId, envelope signatures)
 *     remain strictly separate and unweakened.
 */

import { TransportEndpoint } from './types';

/**
 * Allowed TLS protocol versions.
 * Legacy versions (SSLv2, SSLv3, TLS 1.0, TLS 1.1) are strictly disallowed.
 */
export type TlsVersion = 'TLSv1.2' | 'TLSv1.3';

/**
 * Cryptographic cipher suites recommended for CUBiO TLS transports.
 * Prioritizes AEAD ciphers with Perfect Forward Secrecy (PFS).
 */
export const SECURE_CIPHER_SUITES: readonly string[] = Object.freeze([
  // TLS 1.3 ciphers
  'TLS_AES_256_GCM_SHA384',
  'TLS_CHACHA20_POLY1305_SHA256',
  'TLS_AES_128_GCM_SHA256',
  // TLS 1.2 ECDHE ciphers
  'ECDHE-ECDSA-AES256-GCM-SHA384',
  'ECDHE-RSA-AES256-GCM-SHA384',
  'ECDHE-ECDSA-AES128-GCM-SHA256',
  'ECDHE-RSA-AES128-GCM-SHA256',
]);

/**
 * Secure baseline configuration defaults for TLS.
 */
export const SECURE_TLS_DEFAULTS = Object.freeze({
  minVersion: 'TLSv1.2' as TlsVersion,
  maxVersion: 'TLSv1.3' as TlsVersion,
  rejectUnauthorized: true,
  ciphers: SECURE_CIPHER_SUITES.join(':'),
  handshakeTimeoutMs: 5_000,
});

/**
 * Client-side TLS configuration options.
 */
export interface TlsClientConfig {
  /** Minimum TLS protocol version. Default: 'TLSv1.2' */
  readonly minVersion?: TlsVersion;
  /** Maximum TLS protocol version. Default: 'TLSv1.3' */
  readonly maxVersion?: TlsVersion;
  /** Strict certificate chain validation. Default: true */
  readonly rejectUnauthorized?: boolean;
  /** Custom trusted Certificate Authority (CA) certs in PEM format */
  readonly ca?: string | Buffer | (string | Buffer)[];
  /** Client certificate for Mutual TLS (mTLS) in PEM format */
  readonly cert?: string | Buffer;
  /** Client private key for Mutual TLS (mTLS) in PEM format */
  readonly key?: string | Buffer;
  /** Expected Server Name Indication (SNI) / hostname */
  readonly servername?: string;
  /** Colon-delimited cipher suites */
  readonly ciphers?: string;
  /** Maximum duration (ms) for TLS handshake completion before aborting */
  readonly handshakeTimeoutMs?: number;
}

/**
 * Server-side TLS configuration options.
 */
export interface TlsServerConfig {
  /** Server public certificate chain in PEM format (Required) */
  readonly cert: string | Buffer;
  /** Server private key in PEM format (Required) */
  readonly key: string | Buffer;
  /** Trusted CA cert(s) for client mTLS authentication */
  readonly ca?: string | Buffer | (string | Buffer)[];
  /** Demand client certificate during handshake (mTLS). Default: false */
  readonly requestCert?: boolean;
  /** Reject client if certificate is unauthorized or missing when requestCert is true. Default: true */
  readonly rejectUnauthorized?: boolean;
  /** Minimum TLS protocol version. Default: 'TLSv1.2' */
  readonly minVersion?: TlsVersion;
  /** Maximum TLS protocol version. Default: 'TLSv1.3' */
  readonly maxVersion?: TlsVersion;
  /** Colon-delimited cipher suites */
  readonly ciphers?: string;
  /** Maximum duration (ms) for TLS handshake completion */
  readonly handshakeTimeoutMs?: number;
}

/**
 * Peer certificate metadata extracted from an established TLS session.
 */
export interface PeerCertificateInfo {
  readonly subject: Readonly<Record<string, string | string[] | undefined>>;
  readonly issuer: Readonly<Record<string, string | string[] | undefined>>;
  readonly validFrom: string;
  readonly validTo: string;
  readonly fingerprint256: string;
  readonly serialNumber: string;
  readonly subjectAltName?: string;
}

/**
 * Detailed telemetry of an active encrypted TLS session.
 */
export interface TlsSessionInfo {
  readonly encrypted: boolean;
  readonly protocol: string;
  readonly cipherName: string;
  readonly cipherVersion?: string;
  readonly authorized: boolean;
  readonly authorizationError?: string;
  readonly peerCertificate?: PeerCertificateInfo;
}

/**
 * Thrown when a TLS handshake fails due to bad certs, untrusted CA, or protocol errors.
 */
export class TlsHandshakeFailedError extends Error {
  public readonly endpoint?: TransportEndpoint;
  public readonly causeError?: string;

  constructor(message: string, endpoint?: TransportEndpoint, cause?: string) {
    super(`TLS handshake failed: ${message}`);
    this.name = 'TlsHandshakeFailedError';
    this.endpoint = endpoint;
    this.causeError = cause;
  }
}
