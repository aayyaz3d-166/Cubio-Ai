/**
 * CUBiO Network Protocol v1 — Canonical Packet Engine
 * ============================================================
 *
 * Implements packet creation, validation, deterministic serialization,
 * envelope fragmentation, and reassembly.
 *
 * REUSES VERIFIED SYSTEMS:
 *   - deterministicHash (src/cubio/state/determinism.ts)
 *   - CubiONetworkCoordinateEngine (src/cubio/network/coordinate/coordinate.ts)
 *   - ProtocolEnvelope (src/cubio/network/protocol/v1/types.ts)
 */

import { deterministicHash } from '../../../state/determinism';
import { CubiONetworkCoordinateEngine } from '../../coordinate/coordinate';
import { ProtocolEnvelope, PROTOCOL_VERSION } from './types';
import {
  PACKET_MAGIC,
  MAX_PACKET_BYTES,
  DEFAULT_PACKET_MTU,
  MAX_PACKET_TTL,
  DEFAULT_PACKET_TTL,
  MAX_SEQUENCE_NUMBER,
  PacketFlags,
  type PacketHeader,
  type PacketPayload,
  type PacketPayloadType,
  type CubiOPacket,
  type CreatePacketOptions,
  type PacketValidationError,
  type PacketValidationResult,
} from './packetTypes';

// ─────────────────────────────────────────────────────────────────────────────
// Checksum & Hash Computations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Computes deterministic content hash of payload data.
 */
export function computePayloadHash(data: string): string {
  return `0xPLD_${deterministicHash(data).slice(2, 18)}`;
}

/**
 * Computes deterministic checksum over packet fields (header + payload + metadata).
 */
export function computePacketChecksum(
  header: Omit<PacketHeader, 'packetId'>,
  payload: PacketPayload,
  metadata: Readonly<Record<string, string>> = {}
): string {
  const sortedMeta = Object.keys(metadata)
    .sort()
    .map(k => `${k}=${metadata[k]}`)
    .join('&');

  const raw = [
    header.magic,
    `${header.version.major}.${header.version.minor}`,
    header.envelopeId,
    header.sourceUri,
    header.destinationUri,
    header.sequenceNumber.toString(),
    header.flags.toString(),
    header.fragmentIndex.toString(),
    header.totalFragments.toString(),
    header.ttl.toString(),
    header.timestamp.toString(),
    payload.type,
    payload.byteLength.toString(),
    payload.contentHash,
    sortedMeta,
  ].join('|');

  return `0xCHK_${deterministicHash(raw).slice(2, 18)}`;
}

/**
 * Computes deterministic packet ID from key identifiers.
 */
export function generatePacketId(
  envelopeId: string,
  sourceUri: string,
  destUri: string,
  seq: number,
  fragIndex: number,
  nonce?: string
): string {
  const seed = `${envelopeId}|${sourceUri}|${destUri}|${seq}|${fragIndex}|${nonce ?? ''}`;
  return `PKT_${deterministicHash(seed).slice(2, 18)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Packet Factory
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Constructs a frozen, validated, deterministic CubiOPacket.
 */
export function createPacket(options: CreatePacketOptions): CubiOPacket {
  const timestamp = options.timestamp ?? Date.now();
  const sequenceNumber = options.sequenceNumber ?? 0;
  const flags = options.flags ?? PacketFlags.NONE;
  const fragmentIndex = options.fragmentIndex ?? 0;
  const totalFragments = options.totalFragments ?? 1;
  const ttl = options.ttl ?? DEFAULT_PACKET_TTL;
  const payloadType: PacketPayloadType = options.payloadType ?? 'JSON';
  const metadata = Object.freeze({ ...(options.metadata ?? {}) });

  const payloadData = options.payloadData;
  const byteLength = Buffer.byteLength(payloadData, 'utf8');
  const contentHash = computePayloadHash(payloadData);

  const payload: PacketPayload = Object.freeze({
    type: payloadType,
    byteLength,
    data: payloadData,
    contentHash,
  });

  const headerWithoutId: Omit<PacketHeader, 'packetId'> = {
    magic: PACKET_MAGIC,
    version: PROTOCOL_VERSION,
    envelopeId: options.envelopeId,
    sourceUri: options.sourceUri,
    destinationUri: options.destinationUri,
    sequenceNumber,
    flags,
    fragmentIndex,
    totalFragments,
    ttl,
    timestamp,
  };

  const packetId = generatePacketId(
    options.envelopeId,
    options.sourceUri,
    options.destinationUri,
    sequenceNumber,
    fragmentIndex,
    options.nonce
  );

  const header: PacketHeader = Object.freeze({
    ...headerWithoutId,
    packetId,
  });

  const checksum = computePacketChecksum(headerWithoutId, payload, metadata);

  return Object.freeze({
    header,
    payload,
    metadata,
    checksum,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Packet Validator
// ─────────────────────────────────────────────────────────────────────────────

const VALID_PAYLOAD_TYPES: ReadonlySet<string> = new Set<PacketPayloadType>([
  'JSON',
  'UTF8',
  'BINARY_BASE64',
]);

/**
 * Exhaustively validates a packet against all canonical constraints.
 */
export function validatePacket(packet: any): PacketValidationResult {
  const errors: PacketValidationError[] = [];

  if (!packet || typeof packet !== 'object') {
    errors.push({ code: 'ERR_MALFORMED_STRUCTURE', message: 'Packet must be a non-null object.' });
    return Object.freeze({ valid: false, errors: Object.freeze(errors) });
  }

  const { header, payload, metadata, checksum } = packet;

  // 1. Header structural check
  if (!header || typeof header !== 'object') {
    errors.push({ code: 'ERR_MALFORMED_STRUCTURE', message: 'Missing packet header.', field: 'header' });
    return Object.freeze({ valid: false, errors: Object.freeze(errors) });
  }

  // 2. Magic
  if (header.magic !== PACKET_MAGIC) {
    errors.push({
      code: 'ERR_INVALID_MAGIC',
      message: `Expected magic '${PACKET_MAGIC}', got '${header.magic}'.`,
      field: 'header.magic',
    });
  }

  // 3. Version
  if (!header.version || header.version.major !== PROTOCOL_VERSION.major) {
    errors.push({
      code: 'ERR_INVALID_VERSION',
      message: `Incompatible version. Expected major ${PROTOCOL_VERSION.major}.`,
      field: 'header.version',
    });
  }

  // 4. Packet & Envelope ID
  if (!header.packetId || typeof header.packetId !== 'string' || !header.packetId.startsWith('PKT_')) {
    errors.push({ code: 'ERR_INVALID_PACKET_ID', message: 'Invalid or missing packetId.', field: 'header.packetId' });
  }
  if (!header.envelopeId || typeof header.envelopeId !== 'string' || !header.envelopeId.startsWith('ENV_')) {
    errors.push({ code: 'ERR_INVALID_ENVELOPE_ID', message: 'Invalid or missing envelopeId.', field: 'header.envelopeId' });
  }

  // 5. Source & Destination CNC Coordinates
  if (!header.sourceUri || typeof header.sourceUri !== 'string') {
    errors.push({ code: 'ERR_INVALID_SOURCE', message: 'Missing sourceUri.', field: 'header.sourceUri' });
  } else {
    const srcVal = CubiONetworkCoordinateEngine.tryParse(header.sourceUri);
    if (!srcVal.isValid) {
      errors.push({ code: 'ERR_INVALID_SOURCE', message: `Invalid sourceUri: ${srcVal.errors[0]?.message}`, field: 'header.sourceUri' });
    }
  }

  if (!header.destinationUri || typeof header.destinationUri !== 'string') {
    errors.push({ code: 'ERR_INVALID_DESTINATION', message: 'Missing destinationUri.', field: 'header.destinationUri' });
  } else {
    const dstVal = CubiONetworkCoordinateEngine.tryParse(header.destinationUri);
    if (!dstVal.isValid) {
      errors.push({ code: 'ERR_INVALID_DESTINATION', message: `Invalid destinationUri: ${dstVal.errors[0]?.message}`, field: 'header.destinationUri' });
    }
  }

  // 6. Sequence Number
  if (
    typeof header.sequenceNumber !== 'number' ||
    !Number.isInteger(header.sequenceNumber) ||
    header.sequenceNumber < 0 ||
    header.sequenceNumber > MAX_SEQUENCE_NUMBER
  ) {
    errors.push({
      code: 'ERR_SEQUENCE_OUT_OF_RANGE',
      message: `Sequence number must be an integer in [0..${MAX_SEQUENCE_NUMBER}].`,
      field: 'header.sequenceNumber',
    });
  }

  // 7. Flags
  if (
    typeof header.flags !== 'number' ||
    !Number.isInteger(header.flags) ||
    header.flags < 0 ||
    header.flags > 0xFF
  ) {
    errors.push({ code: 'ERR_INVALID_FLAGS', message: 'Flags must be an 8-bit integer [0..255].', field: 'header.flags' });
  }

  // 8. Fragmentation constraints
  if (typeof header.totalFragments !== 'number' || header.totalFragments < 1) {
    errors.push({ code: 'ERR_INVALID_TOTAL_FRAGMENTS', message: 'totalFragments must be >= 1.', field: 'header.totalFragments' });
  }
  if (typeof header.fragmentIndex !== 'number' || header.fragmentIndex < 0) {
    errors.push({ code: 'ERR_INVALID_FRAGMENT_INDEX', message: 'fragmentIndex must be >= 0.', field: 'header.fragmentIndex' });
  }
  if (
    typeof header.fragmentIndex === 'number' &&
    typeof header.totalFragments === 'number' &&
    header.fragmentIndex >= header.totalFragments
  ) {
    errors.push({
      code: 'ERR_FRAGMENT_INDEX_EXCEEDS_TOTAL',
      message: `fragmentIndex (${header.fragmentIndex}) cannot be >= totalFragments (${header.totalFragments}).`,
      field: 'header.fragmentIndex',
    });
  }

  // Fragment flag consistency
  const hasFragFlag = (header.flags & PacketFlags.FRAG) !== 0;
  const hasLastFragFlag = (header.flags & PacketFlags.LAST_FRAG) !== 0;

  if (header.totalFragments > 1 && !hasFragFlag) {
    errors.push({
      code: 'ERR_FRAG_FLAG_MISMATCH',
      message: 'totalFragments > 1 requires PacketFlags.FRAG to be set.',
      field: 'header.flags',
    });
  }
  if (header.totalFragments > 1 && header.fragmentIndex === header.totalFragments - 1 && !hasLastFragFlag) {
    errors.push({
      code: 'ERR_LAST_FRAG_FLAG_MISMATCH',
      message: 'Final fragment requires PacketFlags.LAST_FRAG to be set.',
      field: 'header.flags',
    });
  }

  // 9. TTL
  if (
    typeof header.ttl !== 'number' ||
    !Number.isInteger(header.ttl) ||
    header.ttl < 1 ||
    header.ttl > MAX_PACKET_TTL
  ) {
    errors.push({
      code: 'ERR_TTL_OUT_OF_RANGE',
      message: `TTL must be an integer in [1..${MAX_PACKET_TTL}].`,
      field: 'header.ttl',
    });
  }

  // 10. Timestamp
  if (typeof header.timestamp !== 'number' || header.timestamp <= 0) {
    errors.push({ code: 'ERR_TIMESTAMP_INVALID', message: 'Timestamp must be positive.', field: 'header.timestamp' });
  }

  // 11. Payload checks
  if (!payload || typeof payload !== 'object') {
    errors.push({ code: 'ERR_MALFORMED_STRUCTURE', message: 'Missing payload object.', field: 'payload' });
  } else {
    if (!VALID_PAYLOAD_TYPES.has(payload.type)) {
      errors.push({ code: 'ERR_PAYLOAD_TYPE_INVALID', message: `Unknown payload type '${payload.type}'.`, field: 'payload.type' });
    }
    if (typeof payload.data !== 'string') {
      errors.push({ code: 'ERR_MALFORMED_STRUCTURE', message: 'Payload data must be a string.', field: 'payload.data' });
    } else {
      const actualByteLength = Buffer.byteLength(payload.data, 'utf8');
      if (actualByteLength > MAX_PACKET_BYTES) {
        errors.push({
          code: 'ERR_PAYLOAD_TOO_LARGE',
          message: `Payload (${actualByteLength} bytes) exceeds MAX_PACKET_BYTES (${MAX_PACKET_BYTES}).`,
          field: 'payload.byteLength',
        });
      }
      const expectedHash = computePayloadHash(payload.data);
      if (payload.contentHash !== expectedHash) {
        errors.push({
          code: 'ERR_PAYLOAD_HASH_MISMATCH',
          message: 'Payload contentHash does not match calculated hash.',
          field: 'payload.contentHash',
        });
      }
    }
  }

  // 12. Checksum validation
  if (!checksum || typeof checksum !== 'string') {
    errors.push({ code: 'ERR_CHECKSUM_MISMATCH', message: 'Missing checksum.', field: 'checksum' });
  } else if (payload && payload.contentHash) {
    const headerWithoutId: Omit<PacketHeader, 'packetId'> = {
      magic: header.magic,
      version: header.version,
      envelopeId: header.envelopeId,
      sourceUri: header.sourceUri,
      destinationUri: header.destinationUri,
      sequenceNumber: header.sequenceNumber,
      flags: header.flags,
      fragmentIndex: header.fragmentIndex,
      totalFragments: header.totalFragments,
      ttl: header.ttl,
      timestamp: header.timestamp,
    };
    const expectedChecksum = computePacketChecksum(headerWithoutId, payload, metadata ?? {});
    if (checksum !== expectedChecksum) {
      errors.push({
        code: 'ERR_CHECKSUM_MISMATCH',
        message: `Checksum mismatch: expected '${expectedChecksum}', got '${checksum}'.`,
        field: 'checksum',
      });
    }
  }

  const valid = errors.length === 0;
  return Object.freeze({
    valid,
    errors: Object.freeze(errors),
    packet: valid ? (packet as CubiOPacket) : undefined,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Serialization & Deserialization
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Deterministically serializes a CubiOPacket into its canonical wire JSON string.
 */
export function serializePacket(packet: CubiOPacket): string {
  // Sort metadata keys deterministically
  const sortedMeta: Record<string, string> = {};
  for (const k of Object.keys(packet.metadata).sort()) {
    sortedMeta[k] = packet.metadata[k];
  }

  const normalized = {
    header: {
      magic: packet.header.magic,
      version: {
        major: packet.header.version.major,
        minor: packet.header.version.minor,
      },
      packetId: packet.header.packetId,
      envelopeId: packet.header.envelopeId,
      sourceUri: packet.header.sourceUri,
      destinationUri: packet.header.destinationUri,
      sequenceNumber: packet.header.sequenceNumber,
      flags: packet.header.flags,
      fragmentIndex: packet.header.fragmentIndex,
      totalFragments: packet.header.totalFragments,
      ttl: packet.header.ttl,
      timestamp: packet.header.timestamp,
    },
    payload: {
      type: packet.payload.type,
      byteLength: packet.payload.byteLength,
      data: packet.payload.data,
      contentHash: packet.payload.contentHash,
    },
    metadata: sortedMeta,
    checksum: packet.checksum,
  };

  return JSON.stringify(normalized);
}

/**
 * Deserializes a canonical wire string into a validated CubiOPacket.
 * Throws if invalid or corrupted.
 */
export function deserializePacket(wireString: string): CubiOPacket {
  let parsed: any;
  try {
    parsed = JSON.parse(wireString);
  } catch (err: any) {
    throw new Error(`Failed to deserialize packet: Invalid JSON - ${err.message}`);
  }

  const valResult = validatePacket(parsed);
  if (!valResult.valid || !valResult.packet) {
    const msg = valResult.errors.map(e => `[${e.code}] ${e.field ?? 'packet'}: ${e.message}`).join('; ');
    throw new Error(`Failed to deserialize packet: Validation failed - ${msg}`);
  }

  return valResult.packet;
}

// ─────────────────────────────────────────────────────────────────────────────
// Envelope Fragmentation & Reassembly
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Splits a ProtocolEnvelope into one or more CubiOPackets based on MTU size.
 */
export function packetizeEnvelope(
  envelope: ProtocolEnvelope,
  mtu: number = DEFAULT_PACKET_MTU,
  startingSeq: number = 0
): readonly CubiOPacket[] {
  if (mtu < 128) {
    throw new Error(`MTU must be at least 128 bytes. Got ${mtu}.`);
  }

  const serializedEnvelope = JSON.stringify(envelope);
  const totalLength = Buffer.byteLength(serializedEnvelope, 'utf8');

  // If envelope fits entirely in one packet
  if (totalLength <= mtu) {
    const single = createPacket({
      envelopeId: envelope.envelopeId,
      sourceUri: envelope.source.uri,
      destinationUri: envelope.destination.uri,
      payloadData: serializedEnvelope,
      payloadType: 'JSON',
      sequenceNumber: startingSeq,
      flags: PacketFlags.NONE,
      fragmentIndex: 0,
      totalFragments: 1,
    });
    return Object.freeze([single]);
  }

  // Fragmenting across multiple packets
  // Chunking by UTF-8 characters safely
  const chunks: string[] = [];
  let remaining = serializedEnvelope;

  while (remaining.length > 0) {
    // Binary byte length slicing
    let sliceLen = Math.min(remaining.length, mtu);
    while (Buffer.byteLength(remaining.slice(0, sliceLen), 'utf8') > mtu && sliceLen > 1) {
      sliceLen--;
    }
    chunks.push(remaining.slice(0, sliceLen));
    remaining = remaining.slice(sliceLen);
  }

  const totalFragments = chunks.length;
  const packets: CubiOPacket[] = [];

  for (let i = 0; i < totalFragments; i++) {
    const isLast = i === totalFragments - 1;
    let flags = PacketFlags.FRAG;
    if (isLast) flags |= PacketFlags.LAST_FRAG;

    const packet = createPacket({
      envelopeId: envelope.envelopeId,
      sourceUri: envelope.source.uri,
      destinationUri: envelope.destination.uri,
      payloadData: chunks[i],
      payloadType: 'JSON',
      sequenceNumber: startingSeq + i,
      flags,
      fragmentIndex: i,
      totalFragments,
    });
    packets.push(packet);
  }

  return Object.freeze(packets);
}

/**
 * Reassembles an array of CubiOPacket fragments into the original ProtocolEnvelope.
 * Checks completeness, fragment ordering, and envelope ID consistency.
 */
export function reassembleEnvelope(packets: readonly CubiOPacket[]): ProtocolEnvelope {
  if (!packets || packets.length === 0) {
    throw new Error('Cannot reassemble envelope from empty packet list.');
  }

  // Ensure all packets belong to same envelope
  const envelopeId = packets[0].header.envelopeId;
  const totalFragments = packets[0].header.totalFragments;

  if (packets.length !== totalFragments) {
    throw new Error(
      `Incomplete packet sequence: expected ${totalFragments} fragments, received ${packets.length}.`
    );
  }

  // Sort by fragmentIndex
  const sorted = [...packets].sort((a, b) => a.header.fragmentIndex - b.header.fragmentIndex);

  // Validate consecutive ordering and envelopeId consistency
  for (let i = 0; i < sorted.length; i++) {
    const p = sorted[i];
    if (p.header.envelopeId !== envelopeId) {
      throw new Error(`Envelope ID mismatch in fragment sequence: ${p.header.envelopeId} vs ${envelopeId}.`);
    }
    if (p.header.fragmentIndex !== i) {
      throw new Error(`Missing or out-of-order fragment: expected index ${i}, got ${p.header.fragmentIndex}.`);
    }
  }

  const reconstructedString = sorted.map(p => p.payload.data).join('');
  let parsedEnvelope: any;
  try {
    parsedEnvelope = JSON.parse(reconstructedString);
  } catch (err: any) {
    throw new Error(`Reassembled envelope payload is invalid JSON: ${err.message}`);
  }

  return parsedEnvelope as ProtocolEnvelope;
}
