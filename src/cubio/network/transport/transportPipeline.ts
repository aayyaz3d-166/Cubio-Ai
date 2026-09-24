/**
 * CUBiO AI — Complete Transport Packet Pipeline Integration
 * ============================================================
 *
 * Implements the end-to-end packet send/receive pipeline connecting
 * Phase 1 protocol envelopes, packetization, framing, real transport drivers,
 * deframing, verification, and deterministic reconstruction.
 *
 * Pipeline Flow:
 *   Outbound: ProtocolEnvelope ──▶ Packetization (MTU split) ──▶ Validation ──▶ Transport Frame ──▶ OS Driver Send
 *   Inbound:  OS Driver Receive ──▶ Stream Deframing ──▶ Packet Validation ──▶ Reassembly ──▶ ProtocolEnvelope
 *
 * INVARIANTS:
 *   - Checksums, sequence information, routing addresses, metadata, and payload
 *     are preserved with 100% fidelity end-to-end.
 *   - Any corrupted checksum, malformed frame, or out-of-sequence fragment is rejected fail-closed.
 *   - Pending assembly buffers enforce automated expiration timeouts to prevent resource leaks.
 */

import {
  ITransportAdapter,
  TransportSession,
  TransportDeliveryReceipt,
} from './types';
import { ProtocolEnvelope } from '../protocol/v1/types';
import { CubiOPacket } from '../protocol/v1/packetTypes';
import {
  packetizeEnvelope,
  reassembleEnvelope,
  validatePacket,
  computePacketChecksum,
} from '../protocol/v1/packetEngine';
import { CubiOProtocolValidator } from '../protocol/v1/protocolValidator';
import {
  PipelineSendOptions,
  PipelineDeliveryReport,
  InboundAssemblerOptions,
  PipelineMetrics,
  EnvelopeReceiveHandler,
  PipelineAssemblyError,
  PipelineValidationError,
  PipelineCorruptionError,
} from './transportPipelineTypes';

interface PendingAssemblyEntry {
  readonly envelopeId: string;
  readonly totalFragments: number;
  readonly fragments: Map<number, CubiOPacket>;
  readonly firstReceivedAt: number;
  readonly session: TransportSession;
  lastFragmentAt: number;
}

/**
 * Inbound fragment aggregator and deterministic envelope reconstruction engine.
 */
export class InboundEnvelopeAssembler {
  private readonly _assemblyTimeoutMs: number;
  private readonly _maxBufferedEnvelopes: number;
  private readonly _validateInbound: boolean;

  private readonly _pendingAssemblies: Map<string, PendingAssemblyEntry> = new Map();
  private _evictionTimer?: NodeJS.Timeout;

  public envelopesReceived: number = 0;
  public packetsReceived: number = 0;
  public fragmentsAssembled: number = 0;
  public corruptedPacketsDropped: number = 0;
  public duplicateFragmentsIgnored: number = 0;
  public assemblyTimeouts: number = 0;
  public validationErrors: number = 0;
  public bytesReceived: number = 0;

  constructor(options?: InboundAssemblerOptions) {
    this._assemblyTimeoutMs = options?.assemblyTimeoutMs ?? 10_000;
    this._maxBufferedEnvelopes = options?.maxBufferedEnvelopes ?? 500;
    this._validateInbound = options?.validateInbound ?? true;

    // Periodic sweep for stale partial fragment sequences
    this._evictionTimer = setInterval(() => {
      this.purgeExpired();
    }, 2_000);
    if (this._evictionTimer.unref) this._evictionTimer.unref();
  }

  /**
   * Ingests a raw CubiOPacket from transport, validates framing & checksum,
   * buffers fragments, and returns a fully reconstructed ProtocolEnvelope when complete.
   */
  public processPacket(
    packet: CubiOPacket,
    session: TransportSession
  ): { envelope: ProtocolEnvelope; packets: readonly CubiOPacket[] } | null {
    this.packetsReceived++;
    this.bytesReceived += packet.payload.byteLength;

    // 1. Packet Structure Validation
    if (this._validateInbound) {
      const valResult = validatePacket(packet);
      if (!valResult.valid) {
        const errorMessages = valResult.errors.map((e) => `[${e.code}] ${e.field}: ${e.message}`);
        if (valResult.errors.some((e) => e.code === 'ERR_CHECKSUM_MISMATCH' || e.code === 'ERR_PAYLOAD_HASH_MISMATCH')) {
          this.corruptedPacketsDropped++;
          throw new PipelineCorruptionError(errorMessages.join('; '), packet.header.packetId);
        }
        this.validationErrors++;
        throw new PipelineValidationError(packet.header.packetId, errorMessages);
      }
    }

    // 2. Cryptographic Checksum Integrity Check
    const { packetId, ...headerWithoutId } = packet.header;
    const computedChecksum = computePacketChecksum(headerWithoutId, packet.payload, packet.metadata ?? {});
    if (packet.checksum !== computedChecksum) {
      this.corruptedPacketsDropped++;
      throw new PipelineCorruptionError(
        `Checksum mismatch for packet '${packet.header.packetId}': expected '${computedChecksum}', got '${packet.checksum}'`,
        packet.header.packetId
      );
    }

    // 3. Single-packet envelope optimization
    if (packet.header.totalFragments === 1) {
      const reconstructedEnvelope = reassembleEnvelope([packet]);
      if (this._validateInbound) {
        const envVal = CubiOProtocolValidator.validateEnvelope(reconstructedEnvelope);
        if (!envVal.isValid) {
          this.validationErrors++;
          throw new PipelineValidationError(reconstructedEnvelope.envelopeId, envVal.errors.map((e) => e.message));
        }
      }
      this.envelopesReceived++;
      return { envelope: reconstructedEnvelope, packets: Object.freeze([packet]) };
    }

    // 4. Multi-packet fragment aggregation
    const envelopeId = packet.header.envelopeId;
    let entry = this._pendingAssemblies.get(envelopeId);

    if (!entry) {
      // Guard against unbounded memory expansion
      if (this._pendingAssemblies.size >= this._maxBufferedEnvelopes) {
        this.purgeExpired(0); // Aggressively purge oldest
      }

      entry = {
        envelopeId,
        totalFragments: packet.header.totalFragments,
        fragments: new Map<number, CubiOPacket>(),
        firstReceivedAt: Date.now(),
        session,
        lastFragmentAt: Date.now(),
      };
      this._pendingAssemblies.set(envelopeId, entry);
    }

    // Check for duplicate fragment
    if (entry.fragments.has(packet.header.fragmentIndex)) {
      this.duplicateFragmentsIgnored++;
      return null;
    }

    // Check bounds
    if (packet.header.fragmentIndex < 0 || packet.header.fragmentIndex >= entry.totalFragments) {
      throw new PipelineAssemblyError(
        envelopeId,
        `Fragment index ${packet.header.fragmentIndex} out of bounds [0..${entry.totalFragments - 1}]`
      );
    }

    entry.fragments.set(packet.header.fragmentIndex, packet);
    entry.lastFragmentAt = Date.now();

    // Check if sequence is now complete
    if (entry.fragments.size === entry.totalFragments) {
      this._pendingAssemblies.delete(envelopeId);

      const sortedPackets = Array.from(entry.fragments.values()).sort(
        (a, b) => a.header.fragmentIndex - b.header.fragmentIndex
      );

      const reconstructedEnvelope = reassembleEnvelope(sortedPackets);

      if (this._validateInbound) {
        const envVal = CubiOProtocolValidator.validateEnvelope(reconstructedEnvelope);
        if (!envVal.isValid) {
          this.validationErrors++;
          throw new PipelineValidationError(reconstructedEnvelope.envelopeId, envVal.errors.map((e) => e.message));
        }
      }

      this.envelopesReceived++;
      this.fragmentsAssembled += entry.totalFragments;

      return {
        envelope: reconstructedEnvelope,
        packets: Object.freeze(sortedPackets),
      };
    }

    return null;
  }

  /**
   * Purges incomplete assembly sequences that exceeded the retention timeout.
   */
  public purgeExpired(maxAgeMs: number = this._assemblyTimeoutMs): number {
    const now = Date.now();
    let purged = 0;

    for (const [id, entry] of this._pendingAssemblies.entries()) {
      if (now - entry.lastFragmentAt > maxAgeMs) {
        this._pendingAssemblies.delete(id);
        this.assemblyTimeouts++;
        purged++;
      }
    }

    return purged;
  }

  public reset(): void {
    this._pendingAssemblies.clear();
  }

  public dispose(): void {
    if (this._evictionTimer) {
      clearInterval(this._evictionTimer);
      this._evictionTimer = undefined;
    }
    this.reset();
  }

  public get pendingCount(): number {
    return this._pendingAssemblies.size;
  }
}

/**
 * High-level integrated pipeline coordinator for CUBiO AI Transports.
 */
export class CubiOTransportPipeline {
  private readonly _adapter: ITransportAdapter;
  private readonly _assembler: InboundEnvelopeAssembler;
  private readonly _handlers: Set<EnvelopeReceiveHandler> = new Set();
  private _unregisterReceiver?: () => void;

  private _envelopesSent: number = 0;
  private _packetsSent: number = 0;
  private _bytesSent: number = 0;

  constructor(adapter: ITransportAdapter, assemblerOptions?: InboundAssemblerOptions) {
    this._adapter = adapter;
    this._assembler = new InboundEnvelopeAssembler(assemblerOptions);

    // Bind assembler to transport receiver
    const unregister = this._adapter.receive((packet: CubiOPacket, session: TransportSession) => {
      try {
        const result = this._assembler.processPacket(packet, session);
        if (result) {
          for (const handler of this._handlers) {
            try {
              handler(result.envelope, session, result.packets);
            } catch {}
          }
        }
      } catch (err) {
        // Discard corrupted packets or validation failures without crashing transport receiver
      }
    });

    if (typeof unregister === 'function') {
      this._unregisterReceiver = unregister;
    }
  }

  public get adapter(): ITransportAdapter {
    return this._adapter;
  }

  public get assembler(): InboundEnvelopeAssembler {
    return this._assembler;
  }

  // ─── Outbound Envelope Transmission Pipeline ──────────────────────────────

  /**
   * Transmits a complete ProtocolEnvelope across the real transport driver:
   *   1. Outbound envelope validation
   *   2. Packetization into MTU-sized CubiOPacket frames
   *   3. Checksum generation & packet validation
   *   4. Transport wire framing & transmission
   */
  public async sendEnvelope(
    envelope: ProtocolEnvelope,
    options?: PipelineSendOptions
  ): Promise<PipelineDeliveryReport> {
    const startTime = Date.now();

    // 1. Outbound Schema Validation
    if (options?.validateOutbound !== false) {
      const envVal = CubiOProtocolValidator.validateEnvelope(envelope);
      if (!envVal.isValid) {
        throw new PipelineValidationError(envelope.envelopeId, envVal.errors.map((e) => e.message));
      }
    }

    // 2. MTU Determination & Envelope Packetization
    const effectiveMtu = Math.max(128, options?.mtu ?? this._adapter.capabilities.defaultMtu);
    const packets = packetizeEnvelope(envelope, effectiveMtu, options?.startingSequence ?? 0);

    // 3. Outbound Packet Validation
    for (const pkt of packets) {
      const pktVal = validatePacket(pkt);
      if (!pktVal.valid) {
        throw new PipelineValidationError(pkt.header.packetId, pktVal.errors.map((e) => e.message));
      }
    }

    // 4. Sequential Transport Transmission
    const receipts: TransportDeliveryReceipt[] = [];
    const packetIds: string[] = [];
    const checksums: string[] = [];
    let totalBytes = 0;

    for (const pkt of packets) {
      const receipt = await this._adapter.send(pkt, options?.transportSendOptions);
      receipts.push(receipt);
      packetIds.push(pkt.header.packetId);
      checksums.push(pkt.checksum);
      totalBytes += receipt.bytesTransmitted;
    }

    const durationMs = Date.now() - startTime;
    this._envelopesSent++;
    this._packetsSent += packets.length;
    this._bytesSent += totalBytes;

    return Object.freeze({
      envelopeId: envelope.envelopeId,
      totalPackets: packets.length,
      totalBytes,
      packetIds: Object.freeze(packetIds),
      checksums: Object.freeze(checksums),
      receipts: Object.freeze(receipts),
      durationMs,
      timestamp: Date.now(),
    });
  }

  // ─── Inbound Envelope Subscription & Request/Response ──────────────────────

  /**
   * Subscribes to fully assembled and validated inbound ProtocolEnvelopes.
   * Returns an unregister function.
   */
  public onEnvelope(handler: EnvelopeReceiveHandler): () => void {
    this._handlers.add(handler);
    return () => {
      this._handlers.delete(handler);
    };
  }

  /**
   * Sends a request envelope and awaits a correlated response envelope with timeout.
   */
  public async requestEnvelope(
    requestEnvelope: ProtocolEnvelope,
    matcher: (response: ProtocolEnvelope) => boolean,
    options?: { timeoutMs?: number; sendOptions?: PipelineSendOptions }
  ): Promise<ProtocolEnvelope> {
    const timeoutMs = options?.timeoutMs ?? 5_000;

    return new Promise<ProtocolEnvelope>((resolve, reject) => {
      let timer: NodeJS.Timeout | undefined;
      let unregister: (() => void) | undefined;
      let settled = false;

      const cleanup = () => {
        if (timer) clearTimeout(timer);
        if (unregister) unregister();
        settled = true;
      };

      timer = setTimeout(() => {
        if (settled) return;
        cleanup();
        reject(new Error(`Pipeline request timed out after ${timeoutMs}ms waiting for correlated response`));
      }, timeoutMs);

      unregister = this.onEnvelope((envelope) => {
        if (settled) return;
        if (matcher(envelope)) {
          cleanup();
          resolve(envelope);
        }
      });

      this.sendEnvelope(requestEnvelope, options?.sendOptions).catch((err) => {
        if (!settled) {
          cleanup();
          reject(err);
        }
      });
    });
  }

  // ─── Telemetry & Teardown ─────────────────────────────────────────────────

  public getMetrics(): PipelineMetrics {
    return Object.freeze({
      envelopesSent: this._envelopesSent,
      envelopesReceived: this._assembler.envelopesReceived,
      packetsSent: this._packetsSent,
      packetsReceived: this._assembler.packetsReceived,
      fragmentsAssembled: this._assembler.fragmentsAssembled,
      corruptedPacketsDropped: this._assembler.corruptedPacketsDropped,
      duplicateFragmentsIgnored: this._assembler.duplicateFragmentsIgnored,
      assemblyTimeouts: this._assembler.assemblyTimeouts,
      validationErrors: this._assembler.validationErrors,
      bytesSent: this._bytesSent,
      bytesReceived: this._assembler.bytesReceived,
    });
  }

  public dispose(): void {
    if (this._unregisterReceiver) {
      this._unregisterReceiver();
      this._unregisterReceiver = undefined;
    }
    this._handlers.clear();
    this._assembler.dispose();
  }
}
