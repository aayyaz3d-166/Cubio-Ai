/**
 * CUBiO AI — Complete Transport Packet Pipeline Types
 * ======================================================
 *
 * Defines the contracts, telemetry, delivery reports, and assembly models
 * for the end-to-end CUBiO packet send/receive pipeline:
 *
 *   Envelope ──▶ Packetization ──▶ Validation ──▶ Framing ──▶ Transport Send
 *                                                                    │
 *                                                             (Real Wire / Socket)
 *                                                                    ▼
 *   Envelope ◀── Reconstruction ◀── Validation ◀── Deframing ◀── Transport Receive
 *
 * INVARIANTS:
 *   1. 100% End-to-end fidelity: Checksums, sequence numbers, routing CNC URIs,
 *      metadata maps, and payload data are preserved bit-for-bit.
 *   2. Fragmentation compliance: Multi-packet sequences strictly adhere to
 *      monotonically increasing fragmentIndex and PacketFlags (FRAG, LAST_FRAG).
 *   3. Fail-closed defense: Tampered checksums, corrupted frames, malformed envelopes,
 *      and out-of-bounds fragments are rejected fail-closed.
 *   4. Zero resource leaks: Assembly buffers for partial sequences enforce
 *      deterministic timeouts and automatic eviction.
 */

import { TransportDeliveryReceipt, TransportSendOptions, TransportSession } from './types';
import { ProtocolEnvelope } from '../protocol/v1/types';
import { CubiOPacket } from '../protocol/v1/packetTypes';

/**
 * Options configuring envelope transmission through the pipeline.
 */
export interface PipelineSendOptions {
  /** Desired MTU payload chunk size in bytes (clamped >= 128). Default: adapter defaultMtu */
  readonly mtu?: number;
  /** Starting sequence number for generated packet fragments. Default: 0 */
  readonly startingSequence?: number;
  /** Validate envelope schema before packetization. Default: true */
  readonly validateOutbound?: boolean;
  /** Maximum duration (ms) for transmitting all fragments before timing out */
  readonly timeoutMs?: number;
  /** Custom send options passed to physical transport driver */
  readonly transportSendOptions?: TransportSendOptions;
}

/**
 * Forensic delivery receipt for an entire ProtocolEnvelope transmission.
 */
export interface PipelineDeliveryReport {
  readonly envelopeId: string;
  readonly totalPackets: number;
  readonly totalBytes: number;
  readonly packetIds: readonly string[];
  readonly checksums: readonly string[];
  readonly receipts: readonly TransportDeliveryReceipt[];
  readonly durationMs: number;
  readonly timestamp: number;
}

/**
 * Configuration options for the inbound fragment assembler.
 */
export interface InboundAssemblerOptions {
  /** Maximum time (ms) to retain incomplete fragment sequences before purging. Default: 10,000ms */
  readonly assemblyTimeoutMs?: number;
  /** Maximum number of concurrent fragmented envelopes buffered in memory. Default: 500 */
  readonly maxBufferedEnvelopes?: number;
  /** Validate inbound packet schema and checksums before assembly. Default: true */
  readonly validateInbound?: boolean;
}

/**
 * Telemetry and accounting metrics for an active packet pipeline.
 */
export interface PipelineMetrics {
  readonly envelopesSent: number;
  readonly envelopesReceived: number;
  readonly packetsSent: number;
  readonly packetsReceived: number;
  readonly fragmentsAssembled: number;
  readonly corruptedPacketsDropped: number;
  readonly duplicateFragmentsIgnored: number;
  readonly assemblyTimeouts: number;
  readonly validationErrors: number;
  readonly bytesSent: number;
  readonly bytesReceived: number;
}

/**
 * Callback invoked when a fully reconstructed, validated ProtocolEnvelope is delivered.
 */
export type EnvelopeReceiveHandler = (
  envelope: ProtocolEnvelope,
  session: TransportSession,
  packets: readonly CubiOPacket[]
) => void;

// ─── Pipeline Errors ────────────────────────────────────────────────────────

export class PipelineAssemblyError extends Error {
  public readonly envelopeId: string;
  public readonly reason: string;

  constructor(envelopeId: string, reason: string) {
    super(`Pipeline assembly error for envelope '${envelopeId}': ${reason}`);
    this.name = 'PipelineAssemblyError';
    this.envelopeId = envelopeId;
    this.reason = reason;
  }
}

export class PipelineValidationError extends Error {
  public readonly objectId: string;
  public readonly validationErrors: readonly string[];

  constructor(objectId: string, errors: readonly string[]) {
    super(`Pipeline validation failed for '${objectId}': ${errors.join('; ')}`);
    this.name = 'PipelineValidationError';
    this.objectId = objectId;
    this.validationErrors = errors;
  }
}

export class PipelineCorruptionError extends Error {
  public readonly packetId?: string;
  public readonly details: string;

  constructor(details: string, packetId?: string) {
    super(`Pipeline corruption detected: ${details}`);
    this.name = 'PipelineCorruptionError';
    this.packetId = packetId;
    this.details = details;
  }
}
