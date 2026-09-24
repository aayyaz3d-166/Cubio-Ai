/**
 * CUBiO Network Protocol v1 — Protocol Versioning Manager
 * ============================================================
 *
 * Implements deterministic semantic version parsing, comparison,
 * compatibility bounds verification, and handshake negotiation.
 *
 * REUSED SYSTEMS:
 *   - deterministicHash (src/cubio/state/determinism.ts)
 *   - ProtocolVersion (src/cubio/network/protocol/v1/types.ts)
 */

import { deterministicHash } from '../../../state/determinism';
import {
  CNP_VERSION_SCHEME,
  CURRENT_PROTOCOL_VERSION,
  MINIMUM_SUPPORTED_VERSION,
  MAXIMUM_SUPPORTED_VERSION,
  type CanonicalProtocolVersion,
  type VersionRange,
  type VersionCompatibilityMode,
  type VersionNegotiationOffer,
  type VersionNegotiationResult,
  type VersionValidationResult,
  type VersionRejectionCode,
} from './versionTypes';

// ─────────────────────────────────────────────────────────────────────────────
// Feature Capability Registry
// ─────────────────────────────────────────────────────────────────────────────

const VERSION_FEATURE_MAP: readonly { minMinor: number; feature: string }[] = [
  { minMinor: 0, feature: 'BASE_FRAMING' },
  { minMinor: 0, feature: 'CNC_ADDRESSING' },
  { minMinor: 0, feature: 'SOVEREIGN_AUTH' },
  { minMinor: 1, feature: 'PAYLOAD_COMPRESSION' },
  { minMinor: 1, feature: 'STREAM_FLOW_CONTROL' },
  { minMinor: 2, feature: 'PRIORITY_PREEMPTION' },
  { minMinor: 2, feature: 'DYNAMIC_RECONNECT' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Parsing & Formatting
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parses a version string into a CanonicalProtocolVersion.
 * Accepts formats:
 *   - "CNP/1.0"
 *   - "CNP/1.0.0"
 *   - "CNP/1.2.3-alpha.1"
 *   - "1.0.0"
 */
export function parseVersion(versionStr: string): VersionValidationResult {
  if (!versionStr || typeof versionStr !== 'string') {
    return Object.freeze({
      valid: false,
      error: {
        code: 'ERR_INVALID_VERSION_FORMAT' as const,
        message: 'Version string must be a non-empty string.',
        input: String(versionStr),
      },
    });
  }

  const trimmed = versionStr.trim();

  // Strip scheme prefix if present
  let raw = trimmed;
  if (raw.toUpperCase().startsWith(`${CNP_VERSION_SCHEME}/`)) {
    raw = raw.slice(CNP_VERSION_SCHEME.length + 1);
  } else if (raw.includes('/')) {
    // Other unknown scheme prefix (e.g. "HTTP/1.1")
    return Object.freeze({
      valid: false,
      error: {
        code: 'ERR_INVALID_VERSION_FORMAT' as const,
        message: `Version must start with '${CNP_VERSION_SCHEME}/' or be naked semver. Found '${trimmed}'.`,
        input: trimmed,
      },
    });
  }

  // Validate overall syntax using strict regex
  // Format: ^(\d+)\.(\d+)(?:\.(\d+))?(?:-([a-zA-Z0-9_.-]+))?$
  const semverRegex = /^(\d+)\.(\d+)(?:\.(\d+))?(?:-([a-zA-Z0-9_.-]+))?$/;
  const match = semverRegex.exec(raw);
  if (!match) {
    return Object.freeze({
      valid: false,
      error: {
        code: 'ERR_INVALID_VERSION_FORMAT' as const,
        message: `Version requires dot-separated non-negative integers. Received '${raw}'.`,
        input: trimmed,
      },
    });
  }

  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = match[3] !== undefined ? Number(match[3]) : 0;
  const preRelease = match[4];

  if (
    !Number.isInteger(major) || major < 0 ||
    !Number.isInteger(minor) || minor < 0 ||
    !Number.isInteger(patch) || patch < 0
  ) {
    return Object.freeze({
      valid: false,
      error: {
        code: 'ERR_INVALID_VERSION_FORMAT' as const,
        message: 'Version components must be non-negative integers.',
        input: trimmed,
      },
    });
  }

  return Object.freeze({
    valid: true,
    version: Object.freeze({
      major,
      minor,
      patch,
      preRelease,
    }),
  });
}

/**
 * Formats a CanonicalProtocolVersion into canonical string format.
 */
export function formatVersion(
  version: CanonicalProtocolVersion,
  includePatch: boolean = true
): string {
  let str = `${CNP_VERSION_SCHEME}/${version.major}.${version.minor}`;
  if (includePatch || version.patch > 0) {
    str += `.${version.patch}`;
  }
  if (version.preRelease) {
    str += `-${version.preRelease}`;
  }
  return str;
}

// ─────────────────────────────────────────────────────────────────────────────
// Comparison & Ordering
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Monotonically compares two versions:
 * Returns -1 if a < b, 0 if a == b, 1 if a > b.
 */
export function compareVersions(
  a: CanonicalProtocolVersion,
  b: CanonicalProtocolVersion
): -1 | 0 | 1 {
  if (a.major !== b.major) return a.major < b.major ? -1 : 1;
  if (a.minor !== b.minor) return a.minor < b.minor ? -1 : 1;
  if (a.patch !== b.patch) return a.patch < b.patch ? -1 : 1;
  return 0;
}

export function isVersionEqual(a: CanonicalProtocolVersion, b: CanonicalProtocolVersion): boolean {
  return compareVersions(a, b) === 0;
}

export function isVersionGreaterThan(a: CanonicalProtocolVersion, b: CanonicalProtocolVersion): boolean {
  return compareVersions(a, b) === 1;
}

export function isVersionLessThan(a: CanonicalProtocolVersion, b: CanonicalProtocolVersion): boolean {
  return compareVersions(a, b) === -1;
}

export function isVersionInRange(
  version: CanonicalProtocolVersion,
  range: VersionRange
): boolean {
  return compareVersions(version, range.min) >= 0 && compareVersions(version, range.max) <= 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Compatibility Evaluation
// ─────────────────────────────────────────────────────────────────────────────

export interface CompatibilityCheckResult {
  readonly compatible: boolean;
  readonly reason?: string;
  readonly code?: VersionRejectionCode;
}

/**
 * Evaluates whether an incoming version is compatible under specified policy.
 */
export function checkVersionCompatibility(
  incoming: CanonicalProtocolVersion,
  target: CanonicalProtocolVersion = CURRENT_PROTOCOL_VERSION,
  mode: VersionCompatibilityMode = 'STRICT_MAJOR',
  range: VersionRange = { min: MINIMUM_SUPPORTED_VERSION, max: MAXIMUM_SUPPORTED_VERSION }
): CompatibilityCheckResult {
  // 1. Major version check (for STRICT_MAJOR)
  if (mode === 'STRICT_MAJOR' && incoming.major !== target.major) {
    return Object.freeze({
      compatible: false,
      code: 'ERR_VERSION_INCOMPATIBLE',
      reason: `Major version mismatch: target major is ${target.major}, incoming major is ${incoming.major}.`,
    });
  }

  // 2. Mode check: EXACT
  if (mode === 'EXACT') {
    if (compareVersions(incoming, target) !== 0) {
      return Object.freeze({
        compatible: false,
        code: 'ERR_VERSION_INCOMPATIBLE',
        reason: `Exact match required: expected ${formatVersion(target)}, got ${formatVersion(incoming)}.`,
      });
    }
    return Object.freeze({ compatible: true });
  }

  // 3. Minimum bound check
  if (compareVersions(incoming, range.min) < 0) {
    return Object.freeze({
      compatible: false,
      code: 'ERR_VERSION_DEPRECATED',
      reason: `Version ${formatVersion(incoming)} is below minimum supported version ${formatVersion(range.min)}.`,
    });
  }

  // 4. Maximum bound check
  if (compareVersions(incoming, range.max) > 0) {
    return Object.freeze({
      compatible: false,
      code: 'ERR_VERSION_TOO_NEW',
      reason: `Version ${formatVersion(incoming)} exceeds maximum supported version ${formatVersion(range.max)}.`,
    });
  }

  // 5. Minor check for STRICT_MAJOR
  if (mode === 'STRICT_MAJOR') {
    if (incoming.minor < target.minor) {
      return Object.freeze({
        compatible: false,
        code: 'ERR_VERSION_DEPRECATED',
        reason: `Minor version ${incoming.minor} is below target minimum minor ${target.minor}.`,
      });
    }
  }

  // 6. Mode check: BOUNDED_RANGE
  if (mode === 'BOUNDED_RANGE') {
    if (!isVersionInRange(incoming, range)) {
      return Object.freeze({
        compatible: false,
        code: 'ERR_NO_COMPATIBLE_VERSION',
        reason: `Version ${formatVersion(incoming)} is outside bounds [${formatVersion(range.min)}..${formatVersion(range.max)}].`,
      });
    }
  }

  return Object.freeze({ compatible: true });
}

export const evaluateVersionCompatibility = checkVersionCompatibility;

// ─────────────────────────────────────────────────────────────────────────────
// Feature Capability Discovery
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns all protocol features supported by a given version.
 */
export function getFeaturesForVersion(version: CanonicalProtocolVersion): readonly string[] {
  return VERSION_FEATURE_MAP
    .filter(entry => entry.minMinor <= version.minor)
    .map(entry => entry.feature);
}

// ─────────────────────────────────────────────────────────────────────────────
// Protocol Version Manager Class
// ─────────────────────────────────────────────────────────────────────────────

export class ProtocolVersionManager {
  public readonly nodeId: string;
  public readonly implementationId: string;
  public readonly supportedRange: VersionRange;
  private readonly supportedCapabilities: Set<string>;

  constructor(options: {
    nodeId?: string;
    implementationId?: string;
    supportedRange?: VersionRange;
    capabilities?: readonly string[];
  } = {}) {
    this.nodeId = options.nodeId ?? 'NODE_CANONICAL_001';
    this.implementationId = options.implementationId ?? 'cubio-cnp-v1-reference';
    this.supportedRange = Object.freeze(options.supportedRange ?? {
      min: MINIMUM_SUPPORTED_VERSION,
      max: MAXIMUM_SUPPORTED_VERSION,
    });
    this.supportedCapabilities = new Set(options.capabilities ?? [
      'BASE_FRAMING',
      'CNC_ADDRESSING',
      'SOVEREIGN_AUTH',
      'PAYLOAD_COMPRESSION',
      'STREAM_FLOW_CONTROL',
    ]);
  }

  /**
   * Constructs an outbound version negotiation offer.
   */
  public createOffer(
    offeredVersions: readonly CanonicalProtocolVersion[] = [CURRENT_PROTOCOL_VERSION],
    requestedCaps: readonly string[] = Array.from(this.supportedCapabilities)
  ): VersionNegotiationOffer {
    const nonce = `NONCE_${deterministicHash(`${this.nodeId}:${Date.now()}`).slice(2, 14)}`;
    return Object.freeze({
      initiatorNodeId: this.nodeId,
      offeredVersions: Object.freeze([...offeredVersions]),
      requestedCapabilities: Object.freeze([...requestedCaps]),
      clientImplementation: this.implementationId,
      nonce,
    });
  }

  /**
   * Deterministically negotiates an incoming peer offer.
   */
  public negotiate(offer: VersionNegotiationOffer): VersionNegotiationResult {
    if (!offer || !Array.isArray(offer.offeredVersions) || offer.offeredVersions.length === 0) {
      return Object.freeze({
        status: 'REJECTED',
        responderNodeId: this.nodeId,
        serverImplementation: this.implementationId,
        rejectionCode: 'ERR_NO_COMPATIBLE_VERSION',
        rejectionReason: 'Offer contained no versions.',
        supportedRange: this.supportedRange,
      });
    }

    // Filter compatible versions
    const compatible = offer.offeredVersions.filter(v => {
      const check = checkVersionCompatibility(
        v,
        CURRENT_PROTOCOL_VERSION,
        'STRICT_MAJOR',
        this.supportedRange
      );
      return check.compatible;
    });

    if (compatible.length === 0) {
      // Analyze dominant failure reason
      const sample = offer.offeredVersions[0];
      const check = checkVersionCompatibility(sample, CURRENT_PROTOCOL_VERSION, 'STRICT_MAJOR', this.supportedRange);

      return Object.freeze({
        status: 'REJECTED',
        responderNodeId: this.nodeId,
        serverImplementation: this.implementationId,
        rejectionCode: check.code ?? 'ERR_NO_COMPATIBLE_VERSION',
        rejectionReason: check.reason ?? 'No offered versions match supported range.',
        supportedRange: this.supportedRange,
      });
    }

    // Sort descending by semver to select the highest mutual version
    compatible.sort((a, b) => compareVersions(b, a));
    const selectedVersion = compatible[0];

    // Compute capability intersection
    const agreedCapabilities = offer.requestedCapabilities.filter(cap =>
      this.supportedCapabilities.has(cap)
    );

    return Object.freeze({
      status: 'ACCEPTED',
      selectedVersion,
      versionString: formatVersion(selectedVersion),
      agreedCapabilities: Object.freeze(agreedCapabilities),
      responderNodeId: this.nodeId,
      serverImplementation: this.implementationId,
      supportedRange: this.supportedRange,
    });
  }
}
