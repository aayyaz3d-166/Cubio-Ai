/**
 * CUBiO Network Protocol v1 — Canonical Serializer Engine
 * ============================================================
 *
 * Implements deterministic RFC 8785 (JSON Canonicalization Scheme) encoding,
 * strict decoding, cycle detection, and cryptographic hash stability.
 *
 * REUSES VERIFIED SYSTEMS:
 *   - deterministicHash (src/cubio/state/determinism.ts)
 *   - validatePacket (src/cubio/network/protocol/v1/packetEngine.ts)
 *   - validateMessage (src/cubio/network/protocol/v1/messageEngine.ts)
 *   - validateEnvelope (src/cubio/network/protocol/v1/protocolEngine.ts)
 *   - validateNodeConfig (src/cubio/network/protocol/v1/nodeArchitecture.ts)
 *   - CubiONetworkCoordinateEngine (src/cubio/network/coordinate/coordinate.ts)
 *
 * ANTI-FABRICATION NOTICE:
 *   Serialization produces deterministic wire representations. It does NOT
 *   constitute evidence of live network socket transmission.
 */

import { deterministicHash } from '../../../state/determinism';
import { CubiONetworkCoordinateEngine } from '../../coordinate/coordinate';
import { CubiOPacket } from './packetTypes';
import { validatePacket } from './packetEngine';
import { CubiOMessage } from './messageTypes';
import { validateMessage } from './messageEngine';
import { ProtocolEnvelope, ProtocolAddress } from './types';
import { validateEnvelope, createProtocolAddress } from './protocolEngine';
import { CanonicalNodeConfig } from './nodeTypes';
import { validateNodeConfig } from './nodeArchitecture';
import { CanonicalNetworkStateSnapshot } from './stateTypes';
import { computeNetworkStateHash } from './stateModel';
import { SerializationError, SerializationErrorCode } from './serializationTypes';

// ─────────────────────────────────────────────────────────────────────────────
// Core RFC 8785 (JCS) Canonical JSON Serializer
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Serializes any JavaScript object into an immutable, deterministic,
 * canonical JSON string with recursively sorted keys and zero extraneous whitespace.
 *
 * Throws SerializationError if the input contains:
 *   - Circular references
 *   - NaN or +/-Infinity
 *   - Functions or Symbols
 */
export function serializeCanonical(value: unknown): string {
  const seen = new Set<object>();

  function serializeNode(node: unknown, path: string): string {
    if (node === null) return 'null';
    if (node === undefined) return '';

    const nodeType = typeof node;

    if (nodeType === 'boolean') {
      return node ? 'true' : 'false';
    }

    if (nodeType === 'number') {
      if (!Number.isFinite(node)) {
        throw new Error(`[ERR_NON_FINITE_NUMBER] Non-finite number (${node}) at '${path}' cannot be canonically serialized.`);
      }
      // Standardize -0 to 0
      return Object.is(node, -0) ? '0' : (node as number).toString();
    }

    if (nodeType === 'string') {
      return JSON.stringify(node);
    }

    if (nodeType === 'function' || nodeType === 'symbol' || nodeType === 'bigint') {
      throw new Error(`[ERR_UNSUPPORTED_TYPE] Unsupported type '${nodeType}' at '${path}' cannot be canonically serialized.`);
    }

    if (nodeType === 'object') {
      const obj = node as object;

      if (seen.has(obj)) {
        throw new Error(`[ERR_CIRCULAR_REFERENCE] Circular reference detected at path '${path}'.`);
      }
      seen.add(obj);

      try {
        if (Array.isArray(obj)) {
          const elements = obj.map((item, idx) => {
            const res = serializeNode(item, `${path}[${idx}]`);
            return res === '' ? 'null' : res;
          });
          return `[${elements.join(',')}]`;
        }

        // Regular object: extract keys and sort strictly by UTF-16 code units
        const keys = Object.keys(obj).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
        const entries: string[] = [];

        for (const key of keys) {
          const val = (obj as Record<string, unknown>)[key];
          if (val === undefined || typeof val === 'function' || typeof val === 'symbol') {
            // In standard JSON, undefined properties in objects are omitted
            continue;
          }
          const serializedKey = JSON.stringify(key);
          const serializedVal = serializeNode(val, `${path}.${key}`);
          entries.push(`${serializedKey}:${serializedVal}`);
        }

        return `{${entries.join(',')}}`;
      } finally {
        seen.delete(obj);
      }
    }

    return 'null';
  }

  return serializeNode(value, '$');
}

/**
 * Parses a canonical JSON string.
 */
export function deserializeCanonical<T = unknown>(wireString: string): T {
  if (typeof wireString !== 'string' || wireString.trim() === '') {
    throw new Error('[ERR_MALFORMED_JSON] Wire string must be a non-empty string.');
  }

  try {
    return JSON.parse(wireString) as T;
  } catch (err: any) {
    throw new Error(`[ERR_MALFORMED_JSON] Failed to parse JSON wire string: ${err.message}`);
  }
}

/**
 * Checks whether a wire string strictly satisfies canonical JSON formatting
 * (no extraneous whitespace, strictly sorted keys, identical re-serialization).
 */
export function isCanonical(wireString: string): boolean {
  try {
    const parsed = deserializeCanonical(wireString);
    const reSerialized = serializeCanonical(parsed);
    return wireString === reSerialized;
  } catch {
    return false;
  }
}

/**
 * Computes a deterministic content-addressable checksum of any serializable object.
 */
export function canonicalHash(value: unknown): string {
  const canonStr = serializeCanonical(value);
  return `0xCANON_${deterministicHash(canonStr).slice(2, 18)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Typed Protocol Object Serializers & Deserializers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Canonical serializer for CubiOPacket (Task 02).
 */
export function serializeCanonicalPacket(packet: CubiOPacket): string {
  const valResult = validatePacket(packet);
  if (!valResult.valid) {
    const msg = valResult.errors.map(e => e.message).join('; ');
    throw new Error(`[ERR_SCHEMA_VALIDATION_FAILED] Cannot canonically serialize invalid packet: ${msg}`);
  }
  return serializeCanonical(packet);
}

export function deserializeCanonicalPacket(wireString: string): CubiOPacket {
  const parsed = deserializeCanonical<any>(wireString);
  const valResult = validatePacket(parsed);
  if (!valResult.valid || !valResult.packet) {
    const msg = valResult.errors.map(e => e.message).join('; ');
    throw new Error(`[ERR_CORRUPTED_PAYLOAD] Deserialized packet validation failed: ${msg}`);
  }
  if (valResult.packet.header) Object.freeze(valResult.packet.header);
  if (valResult.packet.payload) Object.freeze(valResult.packet.payload);
  return Object.freeze(valResult.packet);
}

/**
 * Canonical serializer for CubiOMessage (Task 03).
 */
export function serializeCanonicalMessage<T = unknown>(message: CubiOMessage<T>): string {
  const valResult = validateMessage(message);
  if (!valResult.valid) {
    const msg = valResult.errors.map(e => e.message).join('; ');
    throw new Error(`[ERR_SCHEMA_VALIDATION_FAILED] Cannot canonically serialize invalid message: ${msg}`);
  }
  return serializeCanonical(message);
}

export function deserializeCanonicalMessage<T = unknown>(wireString: string): CubiOMessage<T> {
  const parsed = deserializeCanonical<any>(wireString);
  const valResult = validateMessage(parsed);
  if (!valResult.valid || !valResult.message) {
    const msg = valResult.errors.map(e => e.message).join('; ');
    throw new Error(`[ERR_CORRUPTED_PAYLOAD] Deserialized message validation failed: ${msg}`);
  }
  return valResult.message as CubiOMessage<T>;
}

/**
 * Canonical serializer for ProtocolEnvelope (Task 01).
 */
export function serializeCanonicalEnvelope<T = unknown>(envelope: ProtocolEnvelope<T>): string {
  const valResult = validateEnvelope(envelope);
  if (!valResult.valid) {
    const msg = valResult.errors.map(e => e.message).join('; ');
    throw new Error(`[ERR_SCHEMA_VALIDATION_FAILED] Cannot canonically serialize invalid envelope: ${msg}`);
  }
  return serializeCanonical(envelope);
}

export function deserializeCanonicalEnvelope<T = unknown>(wireString: string): ProtocolEnvelope<T> {
  const parsed = deserializeCanonical<any>(wireString);
  const valResult = validateEnvelope(parsed);
  if (!valResult.valid || !valResult.envelope) {
    const msg = valResult.errors.map(e => e.message).join('; ');
    throw new Error(`[ERR_CORRUPTED_PAYLOAD] Deserialized envelope validation failed: ${msg}`);
  }
  return valResult.envelope as ProtocolEnvelope<T>;
}

/**
 * Canonical serializer for ProtocolAddress (Task 01).
 */
export function serializeCanonicalAddress(address: ProtocolAddress): string {
  return serializeCanonical({
    coordinate: address.coordinate,
    uri: address.uri,
  });
}

export function deserializeCanonicalAddress(wireString: string): ProtocolAddress {
  const parsed = deserializeCanonical<any>(wireString);
  if (!parsed || !parsed.coordinate || !parsed.uri) {
    throw new Error('[ERR_SCHEMA_VALIDATION_FAILED] Deserialized address missing coordinate or uri.');
  }
  return createProtocolAddress(parsed.coordinate);
}

/**
 * Canonical serializer for CanonicalNodeConfig (Task 04).
 */
export function serializeCanonicalNodeConfig(config: CanonicalNodeConfig): string {
  const valResult = validateNodeConfig(config);
  if (!valResult.valid) {
    const msg = valResult.errors.map(e => e.message).join('; ');
    throw new Error(`[ERR_SCHEMA_VALIDATION_FAILED] Cannot canonically serialize invalid node config: ${msg}`);
  }
  return serializeCanonical(config);
}

export function deserializeCanonicalNodeConfig(wireString: string): CanonicalNodeConfig {
  const parsed = deserializeCanonical<any>(wireString);
  const valResult = validateNodeConfig(parsed);
  if (!valResult.valid) {
    const msg = valResult.errors.map(e => e.message).join('; ');
    throw new Error(`[ERR_CORRUPTED_PAYLOAD] Deserialized node config validation failed: ${msg}`);
  }
  return Object.freeze(parsed as CanonicalNodeConfig);
}

/**
 * Canonical serializer for CanonicalNetworkStateSnapshot (Task 05).
 */
export function serializeCanonicalStateSnapshot(snapshot: CanonicalNetworkStateSnapshot): string {
  const expectedHash = computeNetworkStateHash(snapshot);
  if (snapshot.stateHash !== expectedHash) {
    throw new Error(`[ERR_CHECKSUM_VERIFICATION_FAILED] Snapshot stateHash mismatch before serialization.`);
  }
  return serializeCanonical(snapshot);
}

export function deserializeCanonicalStateSnapshot(wireString: string): CanonicalNetworkStateSnapshot {
  const parsed = deserializeCanonical<any>(wireString);
  const expectedHash = computeNetworkStateHash(parsed);
  if (parsed.stateHash !== expectedHash) {
    throw new Error(`[ERR_CHECKSUM_VERIFICATION_FAILED] Deserialized stateHash mismatch: expected '${expectedHash}', got '${parsed.stateHash}'.`);
  }
  return Object.freeze(parsed as CanonicalNetworkStateSnapshot);
}
