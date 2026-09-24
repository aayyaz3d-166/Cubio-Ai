/**
 * CUBiO Network Protocol v1 — Protocol Versioning Subsystem Types
 * ============================================================
 *
 * Defines the formal semantics, identifiers, comparison rules,
 * capability negotiation, and rejection taxonomy for the CUBiO Network Protocol.
 *
 * INVARIANTS:
 *   1. Version format strictly adheres to 'CNP/<major>.<minor>[.<patch>][-<preRelease>]'.
 *   2. Major version mismatch is non-negotiable and strictly incompatible unless an explicit
 *      bridge is registered.
 *   3. Minor versions within the same major version guarantee backward compatibility.
 *   4. Version negotiation is purely deterministic: given identical offers and configurations,
 *      outcomes are identical.
 *   5. Deprecated or out-of-range versions are deterministically rejected with structured errors.
 */

/** Canonical prefix for all CUBiO Network Protocol versions */
export const CNP_VERSION_SCHEME = 'CNP' as const;

/** Current implementation authoritative protocol version */
export const CURRENT_PROTOCOL_VERSION: Readonly<CanonicalProtocolVersion> = Object.freeze({
  major: 1,
  minor: 0,
  patch: 0,
});

/** Formatted string of current version */
export const CURRENT_PROTOCOL_VERSION_STRING = 'CNP/1.0.0' as const;

/** Minimum protocol version accepted by this runtime */
export const MINIMUM_SUPPORTED_VERSION: Readonly<CanonicalProtocolVersion> = Object.freeze({
  major: 1,
  minor: 0,
  patch: 0,
});

/** Maximum protocol version supported by this runtime */
export const MAXIMUM_SUPPORTED_VERSION: Readonly<CanonicalProtocolVersion> = Object.freeze({
  major: 1,
  minor: 99,
  patch: 999,
});

/**
 * Structured semantic protocol version.
 */
export interface CanonicalProtocolVersion {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
  readonly preRelease?: string;
}

/**
 * Version boundary range [min..max].
 */
export interface VersionRange {
  readonly min: CanonicalProtocolVersion;
  readonly max: CanonicalProtocolVersion;
}

/**
 * Version compatibility evaluation modes.
 */
export type VersionCompatibilityMode =
  | 'STRICT_MAJOR'    // Major must match; minor >= min
  | 'EXACT'           // Major, minor, and patch must match exactly
  | 'BOUNDED_RANGE';  // Version must fall within [min..max] range inclusive

/**
 * Capabilities declared per protocol minor version.
 */
export interface VersionFeatureMap {
  readonly minVersion: CanonicalProtocolVersion;
  readonly featureFlag: string;
  readonly description: string;
}

/**
 * Peer version handshake offer.
 */
export interface VersionNegotiationOffer {
  readonly initiatorNodeId: string;
  readonly offeredVersions: readonly CanonicalProtocolVersion[];
  readonly requestedCapabilities: readonly string[];
  readonly clientImplementation: string;
  readonly nonce: string;
}

/**
 * Rejection error codes during version negotiation.
 */
export type VersionRejectionCode =
  | 'ERR_VERSION_INCOMPATIBLE'     // Major version mismatch
  | 'ERR_VERSION_DEPRECATED'       // Version is too old / below minimum supported
  | 'ERR_VERSION_TOO_NEW'          // Version exceeds maximum supported
  | 'ERR_NO_COMPATIBLE_VERSION'    // Offered versions list shares no intersection
  | 'ERR_INVALID_VERSION_FORMAT'   // Unparseable version string
  | 'ERR_CAPABILITY_MISMATCH';     // Required capabilities cannot be satisfied

/**
 * Result of a deterministic version negotiation exchange.
 */
export interface VersionNegotiationResult {
  readonly status: 'ACCEPTED' | 'REJECTED';
  readonly selectedVersion?: CanonicalProtocolVersion;
  readonly versionString?: string;
  readonly agreedCapabilities?: readonly string[];
  readonly responderNodeId: string;
  readonly serverImplementation: string;
  readonly rejectionCode?: VersionRejectionCode;
  readonly rejectionReason?: string;
  readonly supportedRange: VersionRange;
}

/**
 * Version parsing or comparison validation error.
 */
export interface VersionValidationError {
  readonly code: VersionRejectionCode;
  readonly message: string;
  readonly input?: string;
}

export interface VersionValidationResult {
  readonly valid: boolean;
  readonly version?: CanonicalProtocolVersion;
  readonly error?: VersionValidationError;
}
