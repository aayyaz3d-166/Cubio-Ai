/**
 * CUBiO AI — Canonical Transport Framing Adapter
 * ===============================================
 *
 * Connects certified Phase 1 packetization to byte stream and message transports.
 * Provides deterministic encoding, decoding, stream accumulation, fragmentation
 * reassembly, and fail-closed corruption defense without duplicating Phase 1 rules.
 *
 * INVARIANTS:
 *   - Canonical wire framing: [4 bytes uint32 BE length prefix][6 bytes 'CUBTR1' magic][payload].
 *   - Zero duplication of Phase 1 validation: delegates packet validation to CubiOProtocolValidator
 *     and serialization to canonical RFC 8785 serializeCanonicalPacket / deserializeCanonicalPacket.
 *   - Deterministic round-trip fidelity: encode(decode(frame)) is bit-for-bit identical.
 *   - Stream accumulator handles arbitrary partial fragments, single-byte feeds, and multi-packet coalescing.
 *   - Strict fail-closed defense: rejects magic mismatch, oversized frames, truncated data, and malformed JSON.
 */

import {
  TRANSPORT_FRAME_CONSTANTS,
} from './constants';
import { PROTOCOL_LIMITS } from '../protocol/v1/constants';
import {
  serializeCanonicalPacket,
  deserializeCanonicalPacket,
} from '../protocol/v1/canonicalSerializer';
import { CubiOPacket } from '../protocol/v1/packetTypes';
import { CubiOProtocolValidator } from '../protocol/v1/protocolValidator';

export class TransportFramingError extends Error {
  public readonly code: string;

  constructor(code: string, message: string) {
    super(`[${code}] ${message}`);
    this.name = 'TransportFramingError';
    this.code = code;
  }
}

export interface DecodedFrame {
  readonly packet: CubiOPacket;
  readonly payloadLength: number;
  readonly totalFrameLength: number;
}

/**
 * Static encoding and discrete frame decoding utilities.
 */
export class TransportFrameCodec {
  public static readonly HEADER_SIZE = TRANSPORT_FRAME_CONSTANTS.HEADER_SIZE_BYTES; // 10 bytes
  public static readonly MAGIC = TRANSPORT_FRAME_CONSTANTS.MAGIC; // 'CUBTR1'

  /**
   * Encodes a Phase 1 CubiOPacket into a canonical 10-byte wire framed buffer.
   */
  public static encode(packet: CubiOPacket): Buffer {
    // 1. Strict Phase 1 validation gate
    const valResult = CubiOProtocolValidator.validatePacket(packet);
    if (!valResult.isValid) {
      const errs = valResult.errors.map((e) => e.message).join('; ');
      throw new TransportFramingError(
        'ERR_FRAME_VALIDATION_FAILED',
        `Cannot encode invalid Phase 1 packet: ${errs}`
      );
    }

    // 2. Deterministic RFC 8785 canonical serialization
    const serialized = serializeCanonicalPacket(packet);
    const payloadBuffer = Buffer.from(serialized, 'utf8');

    // 3. Prepend 10-byte wire header: [4B BE length][6B 'CUBTR1']
    const frameBuffer = Buffer.allocUnsafe(this.HEADER_SIZE + payloadBuffer.length);
    frameBuffer.writeUInt32BE(payloadBuffer.length, 0);
    frameBuffer.write(this.MAGIC, 4, 6, 'ascii');
    payloadBuffer.copy(frameBuffer, this.HEADER_SIZE);

    return frameBuffer;
  }

  /**
   * Decodes a single discrete frame (for message-oriented transports: UDP, WebSocket).
   * Verifies exact frame boundaries with zero extra or missing bytes.
   */
  public static decodeDiscrete(
    buffer: Buffer,
    maxPayloadBytes: number = PROTOCOL_LIMITS.MAX_PACKET_BYTES
  ): DecodedFrame {
    if (buffer.length < this.HEADER_SIZE) {
      throw new TransportFramingError(
        'ERR_FRAME_TRUNCATED',
        `Truncated frame: received ${buffer.length} bytes, minimum header size is ${this.HEADER_SIZE} bytes`
      );
    }

    const payloadLength = buffer.readUInt32BE(0);
    const magic = buffer.toString('ascii', 4, 10);

    if (magic !== this.MAGIC) {
      throw new TransportFramingError(
        'ERR_FRAME_MAGIC_MISMATCH',
        `Invalid wire frame magic: expected '${this.MAGIC}', got '${magic}'`
      );
    }

    if (payloadLength > maxPayloadBytes) {
      throw new TransportFramingError(
        'ERR_FRAME_OVERSIZED',
        `Declared payload length (${payloadLength} bytes) exceeds maximum allowance (${maxPayloadBytes} bytes)`
      );
    }

    const expectedTotal = this.HEADER_SIZE + payloadLength;
    if (buffer.length !== expectedTotal) {
      throw new TransportFramingError(
        'ERR_FRAME_BOUNDARY_MISMATCH',
        `Message boundary mismatch: header declared ${payloadLength} bytes payload (${expectedTotal} total), buffer has ${buffer.length} bytes`
      );
    }

    const payloadString = buffer.toString('utf8', this.HEADER_SIZE, expectedTotal);
    let packet: CubiOPacket;
    try {
      packet = deserializeCanonicalPacket(payloadString);
    } catch (err: any) {
      throw new TransportFramingError('ERR_FRAME_CORRUPTED_JSON', `Failed to deserialize packet JSON: ${err.message}`);
    }

    const valResult = CubiOProtocolValidator.validatePacket(packet);
    if (!valResult.isValid) {
      throw new TransportFramingError('ERR_FRAME_INVALID_PACKET', 'Deserialized packet failed Phase 1 validation');
    }

    return Object.freeze({
      packet,
      payloadLength,
      totalFrameLength: expectedTotal,
    });
  }
}

/**
 * Stateful stream accumulator for continuous stream-oriented transports (TCP, IPC).
 * Accumulates streaming byte chunks, reassembles arbitrary fragment splits,
 * and extracts all complete frames in arrival sequence.
 */
export class StreamFrameDecoder {
  private _buffer: Buffer = Buffer.alloc(0);
  private readonly _maxPayloadBytes: number;

  constructor(maxPayloadBytes: number = PROTOCOL_LIMITS.MAX_PACKET_BYTES) {
    this._maxPayloadBytes = maxPayloadBytes;
  }

  public get pendingBytes(): number {
    return this._buffer.length;
  }

  public reset(): void {
    this._buffer = Buffer.alloc(0);
  }

  /**
   * Appends an inbound stream chunk and returns all complete packets reassembled in this tick.
   * Throws TransportFramingError fail-closed if stream desynchronization or bounds violation is detected.
   */
  public push(chunk: Buffer): CubiOPacket[] {
    if (chunk.length === 0) return [];

    this._buffer = Buffer.concat([this._buffer, chunk]);
    const headerSize = TransportFrameCodec.HEADER_SIZE;
    const packets: CubiOPacket[] = [];

    while (this._buffer.length >= headerSize) {
      const payloadLength = this._buffer.readUInt32BE(0);
      const magic = this._buffer.toString('ascii', 4, 10);

      // 1. Magic verification
      if (magic !== TransportFrameCodec.MAGIC) {
        this._buffer = Buffer.alloc(0);
        throw new TransportFramingError(
          'ERR_FRAME_MAGIC_MISMATCH',
          `Desynchronized stream: expected magic '${TransportFrameCodec.MAGIC}', got '${magic}'`
        );
      }

      // 2. Payload size bounds verification
      if (payloadLength > this._maxPayloadBytes) {
        this._buffer = Buffer.alloc(0);
        throw new TransportFramingError(
          'ERR_FRAME_OVERSIZED',
          `Stream frame payload length (${payloadLength} bytes) exceeds limit (${this._maxPayloadBytes} bytes)`
        );
      }

      const totalFrameLength = headerSize + payloadLength;

      // 3. Fragment check: wait for more bytes if full frame is not yet assembled
      if (this._buffer.length < totalFrameLength) {
        break;
      }

      // 4. Extract complete frame
      const payloadString = this._buffer.toString('utf8', headerSize, totalFrameLength);
      this._buffer = this._buffer.subarray(totalFrameLength);

      // 5. Canonical deserialization and validation
      let packet: CubiOPacket;
      try {
        packet = deserializeCanonicalPacket(payloadString);
      } catch (err: any) {
        throw new TransportFramingError(
          'ERR_FRAME_CORRUPTED_JSON',
          `Failed to deserialize packet in stream: ${err.message}`
        );
      }

      const valResult = CubiOProtocolValidator.validatePacket(packet);
      if (!valResult.isValid) {
        throw new TransportFramingError(
          'ERR_FRAME_INVALID_PACKET',
          'Stream packet failed Phase 1 validation'
        );
      }

      packets.push(packet);
    }

    return packets;
  }
}
