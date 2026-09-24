/**
 * CUBiO Network Protocol v1 — Canonical Packet Model Types
 * ============================================================
 *
 * Defines the wire-level packet primitives for the CUBiO Network Protocol (CNP/1.0).
 * Packets represent bounded, deterministic transmission frames that encapsulate
 * protocol envelopes or fragment chunks.
 *
 * ARCHITECTURAL LAYERING:
 *   ProtocolEnvelope (Task 01) ──▶ Packetization (Task 02) ──▶ Wire Serialization
 *
 * INVARIANTS:
 *   1. Magic bytes must strictly match "CUB1" (0x43554231).
 *   2. Packets carry deterministic identifiers: f(source, dest, seq, nonce).
 *   3. Payloads exceeding MTU must be fragmented with monotonically ordered fragmentIndex.
 *   4. Integrity checksum covers header + payload + metadata deterministically.
 *   5. Total packet size must never exceed MAX_PACKET_BYTES (65,536 bytes).
 */

import { ProtocolVersion } from './types';

/** Protocol Magic Token identifying CUBiO network packets */
export const PACKET_MAGIC = 'CUB1' as const;

/** Hard packet bounds */
export const MAX_PACKET_BYTES = 65_536;        // 64 KB absolute packet limit
export const DEFAULT_PACKET_MTU = 1_400;       // Standard conservative payload MTU
export const MIN_PACKET_MTU = 128;             // Minimum sensible MTU
export const MAX_PACKET_TTL = 255;             // 8-bit hop limit
export const DEFAULT_PACKET_TTL = 64;          // Default hop limit
export const MAX_SEQUENCE_NUMBER = 4_294_967_295; // 32-bit unsigned max

/**
 * 8-bit packet control flags.
 */
export const PacketFlags = {
  NONE: 0x00,
  ACK: 0x01,          // Acknowledging receipt of prior packet
  SYN: 0x02,          // Synchronization / connection establishment intent
  FIN: 0x04,          // Final packet / graceful shutdown intent
  RST: 0x08,          // Reset connection intent
  FRAG: 0x10,         // Packet is a fragment of a larger envelope
  LAST_FRAG: 0x20,    // Final fragment of a fragmented sequence
  COMPRESSED: 0x40,   // Payload data is compressed
  ENCRYPTED: 0x80,    // Payload data is encrypted
} as const;

export type PacketFlagValue = typeof PacketFlags[keyof typeof PacketFlags];

/**
 * Fixed-field header for CUBiO packets.
 */
export interface PacketHeader {
  /** Magic identifier — must be "CUB1" */
  readonly magic: typeof PACKET_MAGIC;
  /** Protocol version — major must be 1 */
  readonly version: ProtocolVersion;
  /** Globally unique deterministic packet ID (e.g. "PKT_0x...") */
  readonly packetId: string;
  /** Originating protocol envelope ID (e.g. "ENV_0x...") */
  readonly envelopeId: string;
  /** Source CNC address URI */
  readonly sourceUri: string;
  /** Destination CNC address URI */
  readonly destinationUri: string;
  /** Packet sequence number [0..4294967295] */
  readonly sequenceNumber: number;
  /** 8-bit flag bitmask */
  readonly flags: number;
  /** 0-based fragment index */
  readonly fragmentIndex: number;
  /** Total number of fragments in this envelope sequence (>= 1) */
  readonly totalFragments: number;
  /** Remaining hop count / time-to-live [1..255] */
  readonly ttl: number;
  /** Creation epoch timestamp in milliseconds */
  readonly timestamp: number;
}

/**
 * Supported payload serialization encodings.
 */
export type PacketPayloadType = 'JSON' | 'UTF8' | 'BINARY_BASE64';

/**
 * Packet payload container.
 */
export interface PacketPayload {
  /** Encoding format */
  readonly type: PacketPayloadType;
  /** Byte length of decoded payload data */
  readonly byteLength: number;
  /** Encoded payload string representation */
  readonly data: string;
  /** Deterministic content hash of data */
  readonly contentHash: string;
}

/**
 * The canonical CUBiO Packet.
 * Bounded, self-contained unit of network serialization.
 */
export interface CubiOPacket {
  /** Fixed packet header */
  readonly header: PacketHeader;
  /** Typed payload */
  readonly payload: PacketPayload;
  /** Protocol options & routing metadata */
  readonly metadata: Readonly<Record<string, string>>;
  /** Cryptographic / deterministic integrity checksum over header + payload + metadata */
  readonly checksum: string;
}

/**
 * Packet validation error codes.
 */
export type PacketErrorCode =
  | 'ERR_INVALID_MAGIC'
  | 'ERR_INVALID_VERSION'
  | 'ERR_INVALID_PACKET_ID'
  | 'ERR_INVALID_ENVELOPE_ID'
  | 'ERR_INVALID_SOURCE'
  | 'ERR_INVALID_DESTINATION'
  | 'ERR_SEQUENCE_OUT_OF_RANGE'
  | 'ERR_INVALID_FLAGS'
  | 'ERR_INVALID_FRAGMENT_INDEX'
  | 'ERR_INVALID_TOTAL_FRAGMENTS'
  | 'ERR_FRAGMENT_INDEX_EXCEEDS_TOTAL'
  | 'ERR_FRAG_FLAG_MISMATCH'
  | 'ERR_LAST_FRAG_FLAG_MISMATCH'
  | 'ERR_TTL_OUT_OF_RANGE'
  | 'ERR_TIMESTAMP_INVALID'
  | 'ERR_PAYLOAD_TYPE_INVALID'
  | 'ERR_PAYLOAD_TOO_LARGE'
  | 'ERR_PAYLOAD_HASH_MISMATCH'
  | 'ERR_PACKET_TOO_LARGE'
  | 'ERR_CHECKSUM_MISMATCH'
  | 'ERR_MALFORMED_STRUCTURE';

/**
 * Structured validation error.
 */
export interface PacketValidationError {
  readonly code: PacketErrorCode;
  readonly message: string;
  readonly field?: string;
}

/**
 * Result of packet validation.
 */
export interface PacketValidationResult {
  readonly valid: boolean;
  readonly errors: readonly PacketValidationError[];
  readonly packet?: CubiOPacket;
}

/**
 * Options for constructing a packet.
 */
export interface CreatePacketOptions {
  readonly envelopeId: string;
  readonly sourceUri: string;
  readonly destinationUri: string;
  readonly payloadData: string;
  readonly payloadType?: PacketPayloadType;
  readonly sequenceNumber?: number;
  readonly flags?: number;
  readonly fragmentIndex?: number;
  readonly totalFragments?: number;
  readonly ttl?: number;
  readonly timestamp?: number;
  readonly metadata?: Record<string, string>;
  readonly nonce?: string;
}
