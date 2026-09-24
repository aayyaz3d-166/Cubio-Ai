/**
 * CUBiO Network Protocol v1 — Central Protocol Validation Layer Engine
 * ====================================================================
 *
 * Authoritative, fail-closed validation orchestrator for all CUBiO
 * Network Protocol (CNP/1.0) objects.
 *
 * UNIFIED VALIDATION TARGETS:
 *   1. CubiOPacket                 (Wire packet frames, framing, checksums)
 *   2. CubiOMessage                (Application messages, identities, addresses)
 *   3. ProtocolEnvelope            (Transmission envelopes, TTL, trace route)
 *   4. CanonicalNodeConfig         (Node identities, roles, capabilities, limits)
 *   5. CanonicalProtocolVersion    (SemVer version tuples, compatibility ranges)
 *   6. CanonicalNetworkStateSnapshot (Cluster, node, connection, session states)
 *   7. CubiOResponse               (Success & error response envelopes)
 *   8. Serialized Payloads         (RFC 8785 canonical JSON compliance)
 *
 * INVARIANTS:
 *   - Strictly fail-closed: unrecognized, malformed, or out-of-range objects fail deterministically.
 *   - Zero arbitrary bounds: uses CUBIO_NETWORK_CONSTANTS registry as source of truth.
 *   - Anti-fabrication: validation success guarantees structural integrity only;
 *     it does NOT imply or assert live physical network socket connectivity.
 */

import {
  CUBIO_NETWORK_CONSTANTS,
  PROTOCOL_IDENTIFIERS,
  COORDINATE_BOUNDS,
  PROTOCOL_PATTERNS,
  PROTOCOL_LIMITS,
  PROTOCOL_VERSIONS,
  PACKET_FLAG_REGISTRY,
  NETWORK_STATE_ENUMS,
} from './constants';
import {
  ProtocolObjectType,
  StructuredValidationError,
  ValidationOutcome,
  ValidationOptions,
} from './validatorTypes';
import { CubiOPacket } from './packetTypes';
import { validatePacket as validatePacketEngine, computePacketChecksum } from './packetEngine';
import { CubiOMessage } from './messageTypes';
import { validateMessage as validateMessageEngine } from './messageEngine';
import { ProtocolEnvelope } from './types';
import { validateEnvelope as validateEnvelopeEngine } from './protocolEngine';
import { CanonicalNodeConfig } from './nodeTypes';
import { validateNodeConfig as validateNodeConfigEngine } from './nodeArchitecture';
import { CanonicalProtocolVersion } from './versionTypes';
import { isVersionInRange } from './versionManager';
import { CanonicalNetworkStateSnapshot } from './stateTypes';
import { CubiOResponse } from './responseTypes';
import { validateResponse as validateResponseEngine } from './responseEngine';
import {
  isCanonical,
  deserializeCanonical,
  canonicalHash,
} from './canonicalSerializer';
import { CubiONetworkCoordinateEngine } from '../../coordinate/coordinate';

export class CubiOProtocolValidator {
  // ───────────────────────────────────────────────────────────────────────────
  // 1. Packet Validation
  // ───────────────────────────────────────────────────────────────────────────

  public static validatePacket(
    input: unknown,
    options?: ValidationOptions
  ): ValidationOutcome<CubiOPacket> {
    const errors: StructuredValidationError[] = [];
    const warnings: string[] = [];

    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      return this.failure('PACKET', [
        {
          code: 'ERR_PACKET_NOT_AN_OBJECT',
          message: 'Packet must be a non-null object.',
          path: 'packet',
          category: 'PROTOCOL_ERROR',
        },
      ]);
    }

    const p = input as any;

    // Run underlying packet engine validation
    const engineResult = validatePacketEngine(p);
    if (!engineResult.valid) {
      for (const err of engineResult.errors) {
        errors.push({
          code: err.code,
          message: err.message,
          path: err.field ?? 'packet',
          category: 'PROTOCOL_ERROR',
        });
      }
    }

    // Secondary deep verification using constants registry
    if (p.header && typeof p.header === 'object') {
      const h = p.header;

      if (h.magic !== PROTOCOL_IDENTIFIERS.PACKET_MAGIC) {
        errors.push({
          code: 'ERR_INVALID_MAGIC',
          message: `Expected magic '${PROTOCOL_IDENTIFIERS.PACKET_MAGIC}', got '${h.magic}'`,
          path: 'header.magic',
          category: 'PROTOCOL_ERROR',
          received: h.magic,
          expected: PROTOCOL_IDENTIFIERS.PACKET_MAGIC,
        });
      }

      if (typeof h.ttl === 'number') {
        if (h.ttl < 0 || h.ttl > PROTOCOL_LIMITS.MAX_PACKET_TTL) {
          errors.push({
            code: 'ERR_INVALID_TTL',
            message: `Packet TTL ${h.ttl} exceeds 8-bit limit ${PROTOCOL_LIMITS.MAX_PACKET_TTL}`,
            path: 'header.ttl',
            category: 'PROTOCOL_ERROR',
            received: h.ttl,
            expected: `0..${PROTOCOL_LIMITS.MAX_PACKET_TTL}`,
          });
        }
      }

      if (typeof h.flags === 'number') {
        if ((h.flags & ~0xff) !== 0) {
          errors.push({
            code: 'ERR_INVALID_FLAGS',
            message: `Packet flags 0x${h.flags.toString(16)} contain undefined high bits`,
            path: 'header.flags',
            category: 'PROTOCOL_ERROR',
            received: h.flags,
            expected: '8-bit bitmask (0x00..0xFF)',
          });
        }
      }
    }

    // Payload size checks
    if (p.payload && typeof p.payload === 'object') {
      const maxBytes = options?.maxPayloadBytes ?? PROTOCOL_LIMITS.MAX_PACKET_BYTES;
      if (typeof p.payload.length === 'number' && p.payload.length > maxBytes) {
        errors.push({
          code: 'ERR_PACKET_PAYLOAD_TOO_LARGE',
          message: `Packet payload length ${p.payload.length} exceeds max ${maxBytes}`,
          path: 'payload.length',
          category: 'PROTOCOL_ERROR',
          received: p.payload.length,
          expected: `<=${maxBytes}`,
        });
      }
    }

    // Checksum verification
    if (errors.length === 0 && options?.verifyChecksums !== false && p.header && p.payload) {
      try {
        const { packetId, ...headerWithoutId } = p.header;
        const expectedChecksum = computePacketChecksum(headerWithoutId, p.payload, p.metadata ?? {});
        if (p.checksum !== expectedChecksum) {
          errors.push({
            code: 'ERR_CHECKSUM_MISMATCH',
            message: `Packet checksum ${p.checksum} does not match computed ${expectedChecksum}`,
            path: 'checksum',
            category: 'PROTOCOL_ERROR',
            received: p.checksum,
            expected: expectedChecksum,
          });
        }
      } catch (err: any) {
        errors.push({
          code: 'ERR_CHECKSUM_COMPUTATION_FAILED',
          message: `Failed to compute packet checksum: ${err.message}`,
          path: 'checksum',
          category: 'PROTOCOL_ERROR',
        });
      }
    }

    if (errors.length > 0) {
      return this.failure('PACKET', errors, warnings);
    }

    return this.success('PACKET', Object.freeze(p) as CubiOPacket, warnings);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Message Validation
  // ───────────────────────────────────────────────────────────────────────────

  public static validateMessage(
    input: unknown,
    options?: ValidationOptions
  ): ValidationOutcome<CubiOMessage> {
    const errors: StructuredValidationError[] = [];
    const warnings: string[] = [];

    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      return this.failure('MESSAGE', [
        {
          code: 'ERR_MESSAGE_NOT_AN_OBJECT',
          message: 'Message must be a non-null object.',
          path: 'message',
          category: 'VALIDATION_ERROR',
        },
      ]);
    }

    const m = input as any;

    // Run underlying message engine validator
    const engineResult = validateMessageEngine(m);
    if (!engineResult.valid) {
      for (const err of engineResult.errors) {
        errors.push({
          code: err.code,
          message: err.message,
          path: err.field ?? 'message',
          category: 'VALIDATION_ERROR',
        });
      }
    }

    // Check sovereign ID format
    if (m.source && typeof m.source === 'object') {
      const cubId = m.source.cubId ?? m.source.senderCubId;
      if (cubId && !PROTOCOL_PATTERNS.SOVEREIGN_CUB_ID.test(cubId)) {
        errors.push({
          code: 'ERR_INVALID_SENDER_ID',
          message: `Sender sovereign ID '${cubId}' is not in canonical CUB-XXXXXXXX format`,
          path: 'source.cubId',
          category: 'VALIDATION_ERROR',
          received: cubId,
        });
      }

      if (m.source.coordinateUri && !PROTOCOL_PATTERNS.CNC_URI_PATTERN.test(m.source.coordinateUri)) {
        errors.push({
          code: 'ERR_INVALID_COORDINATE_URI',
          message: `Source coordinate URI '${m.source.coordinateUri}' is not a canonical CNC URI`,
          path: 'source.coordinateUri',
          category: 'VALIDATION_ERROR',
          received: m.source.coordinateUri,
        });
      }
    }

    if (m.destination && typeof m.destination === 'object') {
      if (m.destination.coordinateUri && !PROTOCOL_PATTERNS.CNC_URI_PATTERN.test(m.destination.coordinateUri)) {
        errors.push({
          code: 'ERR_INVALID_COORDINATE_URI',
          message: `Destination coordinate URI '${m.destination.coordinateUri}' is not a canonical CNC URI`,
          path: 'destination.coordinateUri',
          category: 'VALIDATION_ERROR',
          received: m.destination.coordinateUri,
        });
      }
    }

    // Payload size checks
    if (m.payload && typeof m.payload === 'object') {
      const maxBytes = options?.maxPayloadBytes ?? PROTOCOL_LIMITS.MAX_MESSAGE_PAYLOAD_BYTES;
      if (typeof m.payload.bodyBytes === 'number' && m.payload.bodyBytes > maxBytes) {
        errors.push({
          code: 'ERR_PAYLOAD_TOO_LARGE',
          message: `Message bodyBytes ${m.payload.bodyBytes} exceeds limit ${maxBytes}`,
          path: 'payload.bodyBytes',
          category: 'VALIDATION_ERROR',
          received: m.payload.bodyBytes,
          expected: `<=${maxBytes}`,
        });
      }
    }

    if (errors.length > 0) {
      return this.failure('MESSAGE', errors, warnings);
    }

    return this.success('MESSAGE', Object.freeze(m) as CubiOMessage, warnings);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Envelope Validation
  // ───────────────────────────────────────────────────────────────────────────

  public static validateEnvelope(
    input: unknown,
    options?: ValidationOptions
  ): ValidationOutcome<ProtocolEnvelope> {
    const errors: StructuredValidationError[] = [];
    const warnings: string[] = [];

    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      return this.failure('ENVELOPE', [
        {
          code: 'ERR_ENVELOPE_NOT_AN_OBJECT',
          message: 'Envelope must be a non-null object.',
          path: 'envelope',
          category: 'PROTOCOL_ERROR',
        },
      ]);
    }

    const env = input as any;
    const engineResult = validateEnvelopeEngine(env);

    if (!engineResult.valid) {
      for (const err of engineResult.errors) {
        let cat = 'VALIDATION_ERROR' as any;
        if (err.code.includes('VERSION')) cat = 'VERSION_ERROR';
        else if (err.code.includes('SIGNATURE') || err.code.includes('UNAUTHORIZED')) cat = 'SECURITY_ERROR';
        else if (err.code.includes('UNREACHABLE') || err.code.includes('LOOP')) cat = 'NETWORK_ERROR';

        errors.push({
          code: err.code,
          message: err.message,
          path: err.field ?? 'envelope',
          category: cat,
        });
      }
    }

    // Verify trace route hop limits
    if (env.trace && typeof env.trace === 'object' && Array.isArray(env.trace.path)) {
      if (env.trace.path.length > PROTOCOL_LIMITS.MAX_TRACE_HOPS) {
        errors.push({
          code: 'ERR_TRACE_TOO_LONG',
          message: `Trace hops ${env.trace.path.length} exceeds limit ${PROTOCOL_LIMITS.MAX_TRACE_HOPS}`,
          path: 'trace.path',
          category: 'PROTOCOL_ERROR',
          received: env.trace.path.length,
          expected: `<=${PROTOCOL_LIMITS.MAX_TRACE_HOPS}`,
        });
      }
    }

    if (errors.length > 0) {
      return this.failure('ENVELOPE', errors, warnings);
    }

    return this.success('ENVELOPE', Object.freeze(env) as ProtocolEnvelope, warnings);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Node Metadata Validation
  // ───────────────────────────────────────────────────────────────────────────

  public static validateNodeMetadata(
    input: unknown,
    options?: ValidationOptions
  ): ValidationOutcome<CanonicalNodeConfig> {
    const errors: StructuredValidationError[] = [];
    const warnings: string[] = [];

    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      return this.failure('NODE_METADATA', [
        {
          code: 'ERR_NODE_CONFIG_NOT_AN_OBJECT',
          message: 'Node configuration must be a non-null object.',
          path: 'nodeConfig',
          category: 'VALIDATION_ERROR',
        },
      ]);
    }

    const cfg = input as any;
    const engineResult = validateNodeConfigEngine(cfg);

    if (!engineResult.valid) {
      for (const err of engineResult.errors) {
        errors.push({
          code: err.code,
          message: err.message,
          path: err.field ?? 'nodeConfig',
          category: 'VALIDATION_ERROR',
        });
      }
    }

    // Additional boundary verification against PROTOCOL_LIMITS
    if (typeof cfg.mtu === 'number') {
      if (cfg.mtu < PROTOCOL_LIMITS.MIN_PACKET_MTU || cfg.mtu > PROTOCOL_LIMITS.MAX_PACKET_BYTES) {
        errors.push({
          code: 'ERR_INVALID_MTU',
          message: `Node MTU ${cfg.mtu} is outside allowed bounds [${PROTOCOL_LIMITS.MIN_PACKET_MTU}..${PROTOCOL_LIMITS.MAX_PACKET_BYTES}]`,
          path: 'mtu',
          category: 'VALIDATION_ERROR',
          received: cfg.mtu,
        });
      }
    }

    if (errors.length > 0) {
      return this.failure('NODE_METADATA', errors, warnings);
    }

    return this.success('NODE_METADATA', Object.freeze(cfg) as CanonicalNodeConfig, warnings);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 5. Protocol Version Validation
  // ───────────────────────────────────────────────────────────────────────────

  public static validateProtocolVersion(
    input: unknown,
    options?: ValidationOptions
  ): ValidationOutcome<CanonicalProtocolVersion> {
    const errors: StructuredValidationError[] = [];
    const warnings: string[] = [];

    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      return this.failure('VERSION', [
        {
          code: 'ERR_VERSION_NOT_AN_OBJECT',
          message: 'Version tuple must be an object.',
          path: 'version',
          category: 'VERSION_ERROR',
        },
      ]);
    }

    const v = input as any;

    if (typeof v.major !== 'number' || !Number.isInteger(v.major) || v.major < 0) {
      errors.push({
        code: 'ERR_INVALID_MAJOR_VERSION',
        message: 'Major version must be a non-negative integer.',
        path: 'major',
        category: 'VERSION_ERROR',
        received: v.major,
      });
    }

    if (typeof v.minor !== 'number' || !Number.isInteger(v.minor) || v.minor < 0) {
      errors.push({
        code: 'ERR_INVALID_MINOR_VERSION',
        message: 'Minor version must be a non-negative integer.',
        path: 'minor',
        category: 'VERSION_ERROR',
        received: v.minor,
      });
    }

    if (typeof v.patch !== 'number' || !Number.isInteger(v.patch) || v.patch < 0) {
      errors.push({
        code: 'ERR_INVALID_PATCH_VERSION',
        message: 'Patch version must be a non-negative integer.',
        path: 'patch',
        category: 'VERSION_ERROR',
        received: v.patch,
      });
    }

    if (errors.length === 0) {
      const canonicalV: CanonicalProtocolVersion = {
        major: v.major,
        minor: v.minor,
        patch: v.patch,
        ...(v.preRelease ? { preRelease: String(v.preRelease) } : {}),
      };

      const inRange = isVersionInRange(canonicalV, {
        min: PROTOCOL_VERSIONS.MINIMUM_SUPPORTED,
        max: PROTOCOL_VERSIONS.MAXIMUM_SUPPORTED,
      });

      if (!inRange) {
        errors.push({
          code: 'ERR_VERSION_OUT_OF_SUPPORTED_RANGE',
          message: `Version ${canonicalV.major}.${canonicalV.minor}.${canonicalV.patch} is outside supported range [1.0.0..1.99.999]`,
          path: 'version',
          category: 'VERSION_ERROR',
          received: canonicalV,
        });
      }

      if (errors.length > 0) {
        return this.failure('VERSION', errors, warnings);
      }

      return this.success('VERSION', Object.freeze(canonicalV), warnings);
    }

    return this.failure('VERSION', errors, warnings);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 6. Network State Snapshot Validation
  // ───────────────────────────────────────────────────────────────────────────

  public static validateNetworkState(
    input: unknown,
    options?: ValidationOptions
  ): ValidationOutcome<CanonicalNetworkStateSnapshot> {
    const errors: StructuredValidationError[] = [];
    const warnings: string[] = [];

    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      return this.failure('STATE_SNAPSHOT', [
        {
          code: 'ERR_SNAPSHOT_NOT_AN_OBJECT',
          message: 'State snapshot must be a non-null object.',
          path: 'snapshot',
          category: 'VALIDATION_ERROR',
        },
      ]);
    }

    const s = input as any;

    if (typeof s.epoch !== 'number' || !Number.isInteger(s.epoch) || s.epoch < 0) {
      errors.push({
        code: 'ERR_INVALID_EPOCH',
        message: 'epoch must be a non-negative integer.',
        path: 'epoch',
        category: 'VALIDATION_ERROR',
        received: s.epoch,
      });
    }

    if (typeof s.timestamp !== 'number' || !Number.isFinite(s.timestamp) || s.timestamp <= 0) {
      errors.push({
        code: 'ERR_INVALID_TIMESTAMP',
        message: 'timestamp must be a positive finite number.',
        path: 'timestamp',
        category: 'VALIDATION_ERROR',
        received: s.timestamp,
      });
    }

    const clusterStates = NETWORK_STATE_ENUMS.CLUSTER_STATES as readonly string[];
    if (!clusterStates.includes(s.clusterState)) {
      errors.push({
        code: 'ERR_INVALID_CLUSTER_STATE',
        message: `Unknown clusterState '${s.clusterState}'.`,
        path: 'clusterState',
        category: 'VALIDATION_ERROR',
        received: s.clusterState,
        expected: clusterStates.join(', '),
      });
    }

    if (!s.nodes || typeof s.nodes !== 'object' || Array.isArray(s.nodes)) {
      errors.push({
        code: 'ERR_INVALID_NODES_MAP',
        message: 'nodes must be a dictionary object.',
        path: 'nodes',
        category: 'VALIDATION_ERROR',
      });
    } else {
      const nodeStates = NETWORK_STATE_ENUMS.NODE_STATES as readonly string[];
      for (const [nodeId, record] of Object.entries(s.nodes)) {
        const nr = record as any;
        if (!nr || typeof nr !== 'object' || !nodeStates.includes(nr.state)) {
          errors.push({
            code: 'ERR_INVALID_NODE_STATE',
            message: `Invalid state '${nr?.state}' for node '${nodeId}'.`,
            path: `nodes.${nodeId}.state`,
            category: 'VALIDATION_ERROR',
          });
        }
      }
    }

    if (!s.connections || typeof s.connections !== 'object' || Array.isArray(s.connections)) {
      errors.push({
        code: 'ERR_INVALID_CONNECTIONS_MAP',
        message: 'connections must be a dictionary object.',
        path: 'connections',
        category: 'VALIDATION_ERROR',
      });
    }

    if (!s.sessions || typeof s.sessions !== 'object' || Array.isArray(s.sessions)) {
      errors.push({
        code: 'ERR_INVALID_SESSIONS_MAP',
        message: 'sessions must be a dictionary object.',
        path: 'sessions',
        category: 'VALIDATION_ERROR',
      });
    }

    if (typeof s.stateHash !== 'string' || !s.stateHash.startsWith('0x')) {
      errors.push({
        code: 'ERR_INVALID_STATE_HASH',
        message: 'stateHash must be a valid hex string starting with 0x.',
        path: 'stateHash',
        category: 'VALIDATION_ERROR',
      });
    }

    if (errors.length > 0) {
      return this.failure('STATE_SNAPSHOT', errors, warnings);
    }

    return this.success('STATE_SNAPSHOT', Object.freeze(s) as CanonicalNetworkStateSnapshot, warnings);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 7. Response Validation
  // ───────────────────────────────────────────────────────────────────────────

  public static validateResponse(
    input: unknown,
    options?: ValidationOptions
  ): ValidationOutcome<CubiOResponse> {
    const res = validateResponseEngine(input);
    if (!res.isValid) {
      const errors = res.errors.map((msg) => ({
        code: 'ERR_INVALID_RESPONSE_SCHEMA',
        message: msg,
        path: 'response',
        category: 'PROTOCOL_ERROR' as const,
      }));
      return this.failure('RESPONSE', errors);
    }

    return this.success('RESPONSE', Object.freeze(input) as CubiOResponse);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 8. Serialized Payload Validation (RFC 8785)
  // ───────────────────────────────────────────────────────────────────────────

  public static validateSerializedPayload(
    serialized: string,
    expectedType: ProtocolObjectType,
    options?: ValidationOptions
  ): ValidationOutcome<unknown> {
    if (typeof serialized !== 'string' || serialized.trim() === '') {
      return this.failure(expectedType, [
        {
          code: 'ERR_EMPTY_SERIALIZED_PAYLOAD',
          message: 'Serialized payload must be a non-empty string.',
          path: 'serialized',
          category: 'PROTOCOL_ERROR',
        },
      ]);
    }

    if (options?.enforceCanonicalEncoding) {
      if (!isCanonical(serialized)) {
        return this.failure(expectedType, [
          {
            code: 'ERR_NON_CANONICAL_ENCODING',
            message: 'Payload violates RFC 8785 JSON Canonicalization Scheme constraints.',
            path: 'serialized',
            category: 'PROTOCOL_ERROR',
          },
        ]);
      }
    }

    let parsed: unknown;
    try {
      parsed = deserializeCanonical(serialized);
    } catch (err: any) {
      return this.failure(expectedType, [
        {
          code: 'ERR_DESERIALIZATION_FAILED',
          message: `Failed to deserialize JSON: ${err.message}`,
          path: 'serialized',
          category: 'PROTOCOL_ERROR',
        },
      ]);
    }

    return this.validateProtocolObject(parsed, expectedType, options);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 9. Central Universal Validator & Auto-Detection
  // ───────────────────────────────────────────────────────────────────────────

  public static validateProtocolObject(
    input: unknown,
    objectType?: ProtocolObjectType,
    options?: ValidationOptions
  ): ValidationOutcome<unknown> {
    const targetType = objectType ?? this.detectObjectType(input);

    if (!targetType) {
      return this.failure(undefined, [
        {
          code: 'ERR_UNRECOGNIZED_PROTOCOL_OBJECT',
          message: 'Unable to classify input as any known CUBiO protocol object type.',
          path: 'root',
          category: 'PROTOCOL_ERROR',
        },
      ]);
    }

    switch (targetType) {
      case 'PACKET':
        return this.validatePacket(input, options);
      case 'MESSAGE':
        return this.validateMessage(input, options);
      case 'ENVELOPE':
        return this.validateEnvelope(input, options);
      case 'NODE_METADATA':
        return this.validateNodeMetadata(input, options);
      case 'VERSION':
        return this.validateProtocolVersion(input, options);
      case 'STATE_SNAPSHOT':
        return this.validateNetworkState(input, options);
      case 'RESPONSE':
        return this.validateResponse(input, options);
      default:
        return this.failure(targetType, [
          {
            code: 'ERR_UNSUPPORTED_OBJECT_TYPE',
            message: `Validator handler for type '${targetType}' is not implemented.`,
            path: 'root',
            category: 'PROTOCOL_ERROR',
          },
        ]);
    }
  }

  /**
   * Convenience boolean predicate.
   */
  public static isValid(input: unknown, objectType?: ProtocolObjectType): boolean {
    return this.validateProtocolObject(input, objectType).isValid;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Internal Helpers
  // ───────────────────────────────────────────────────────────────────────────

  private static detectObjectType(input: unknown): ProtocolObjectType | undefined {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      return undefined;
    }

    const obj = input as any;

    if (obj.header && obj.header.magic === PROTOCOL_IDENTIFIERS.PACKET_MAGIC) {
      return 'PACKET';
    }
    if (typeof obj.messageId === 'string' && obj.messageId.startsWith(PROTOCOL_IDENTIFIERS.MESSAGE_ID_PREFIX)) {
      return 'MESSAGE';
    }
    if (typeof obj.envelopeId === 'string' && obj.envelopeId.startsWith(PROTOCOL_IDENTIFIERS.ENVELOPE_ID_PREFIX)) {
      return 'ENVELOPE';
    }
    if (obj.identity && typeof obj.identity.nodeId === 'string') {
      return 'NODE_METADATA';
    }
    if (typeof obj.clusterState === 'string' && obj.nodes && typeof obj.nodes === 'object') {
      return 'STATE_SNAPSHOT';
    }
    if (
      (obj.status === 'SUCCESS' || obj.status === 'ERROR') &&
      typeof obj.responseId === 'string' &&
      typeof obj.correlationId === 'string'
    ) {
      return 'RESPONSE';
    }
    if (
      typeof obj.major === 'number' &&
      typeof obj.minor === 'number' &&
      typeof obj.patch === 'number' &&
      Object.keys(obj).length <= 4
    ) {
      return 'VERSION';
    }

    return undefined;
  }

  private static success<T>(
    objectType: ProtocolObjectType,
    validatedObject: T,
    warnings: readonly string[] = []
  ): ValidationOutcome<T> {
    return Object.freeze({
      isValid: true,
      objectType,
      errors: Object.freeze([]),
      warnings: Object.freeze([...warnings]),
      validatedObject,
      canonicalChecksum: canonicalHash(validatedObject),
    });
  }

  private static failure<T = unknown>(
    objectType: ProtocolObjectType | undefined,
    errors: readonly StructuredValidationError[],
    warnings: readonly string[] = []
  ): ValidationOutcome<T> {
    return Object.freeze({
      isValid: false,
      objectType,
      errors: Object.freeze([...errors]),
      warnings: Object.freeze([...warnings]),
    });
  }
}
