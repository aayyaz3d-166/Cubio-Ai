/**
 * CUBiO AI — Canonical In-Memory Loopback Transport Adapter
 * =========================================================
 *
 * Implements the canonical transport abstraction layer over an in-process
 * virtual bus. Provides concrete executable proof that the abstraction layer
 * functions deterministically without requiring operating system network sockets.
 */

import { BaseTransportAdapter } from './baseTransportAdapter';
import {
  TransportType,
  TransportCapabilities,
  TransportEndpoint,
  TransportSession,
  TransportSendOptions,
  TransportDeliveryReceipt,
} from './types';
import { PROTOCOL_LIMITS } from '../protocol/v1/constants';
import { CubiOPacket } from '../protocol/v1/packetTypes';

export interface MemoryAdapterOptions {
  readonly simulatedLatencyMs?: number;
  readonly simulatedDropRate?: number; // 0.0 to 1.0
}

export class MemoryTransportAdapter extends BaseTransportAdapter {
  public readonly transportType: TransportType = 'MEMORY';

  public readonly capabilities: TransportCapabilities = Object.freeze({
    connectionOriented: true,
    reliable: true,
    ordered: true,
    messageOriented: true,
    supportsBroadcast: false,
    supportsTls: false,
    maxPayloadBytes: PROTOCOL_LIMITS.MAX_PACKET_BYTES,
    defaultMtu: 1400,
  });

  private static readonly _virtualBus: Map<string, MemoryTransportAdapter> = new Map();

  private _remotePeer: MemoryTransportAdapter | undefined;
  private _activeSession: TransportSession | undefined;
  private _simulatedLatencyMs: number = 0;
  private _simulatedDropRate: number = 0;

  constructor(options?: MemoryAdapterOptions) {
    super();
    this._simulatedLatencyMs = options?.simulatedLatencyMs ?? 0;
    this._simulatedDropRate = options?.simulatedDropRate ?? 0;
  }

  public static clearVirtualBus(): void {
    MemoryTransportAdapter._virtualBus.clear();
  }

  private getBusKey(endpoint: TransportEndpoint): string {
    return `${endpoint.host}:${endpoint.port}:${endpoint.coordinateUri ?? ''}`;
  }

  // ─── Subclass Driver Hooks ────────────────────────────────────────────────

  protected async _doListen(endpoint: TransportEndpoint): Promise<void> {
    const key = this.getBusKey(endpoint);
    if (MemoryTransportAdapter._virtualBus.has(key)) {
      throw new Error(`Address '${key}' already in use on virtual bus.`);
    }
    MemoryTransportAdapter._virtualBus.set(key, this);
  }

  protected async _doConnect(remoteEndpoint: TransportEndpoint): Promise<TransportSession> {
    const remoteKey = this.getBusKey(remoteEndpoint);
    const target = MemoryTransportAdapter._virtualBus.get(remoteKey);
    if (!target) {
      throw new Error(`Remote virtual endpoint '${remoteKey}' not listening.`);
    }

    if (this._simulatedLatencyMs > 0) {
      await new Promise(res => setTimeout(res, this._simulatedLatencyMs));
    }

    this._remotePeer = target;

    const sessionId = `MEM_SESS_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const session: TransportSession = Object.freeze({
      sessionId,
      transportType: 'MEMORY',
      localEndpoint: this._localEndpoint ?? { transportType: 'MEMORY' as const, host: 'localhost', port: 0 },
      remoteEndpoint: Object.freeze({ ...remoteEndpoint }),
      establishedAt: Date.now(),
      protocolVersion: Object.freeze({ major: 1, minor: 0, patch: 0 }),
      bytesReceived: 0,
      bytesSent: 0,
      packetsReceived: 0,
      packetsSent: 0,
      lastActivityAt: Date.now(),
      state: 'CONNECTED',
    });

    this._activeSession = session;

    // Register inbound connection on target server peer
    target._remotePeer = this;
    target._activeSession = Object.freeze({
      ...session,
      localEndpoint: target._localEndpoint ?? remoteEndpoint,
      remoteEndpoint: session.localEndpoint,
    });

    return session;
  }

  protected async _doSend(packet: CubiOPacket, options?: TransportSendOptions): Promise<TransportDeliveryReceipt> {
    if (!this._remotePeer) {
      throw new Error('Not connected to a remote virtual peer.');
    }

    const start = Date.now();

    // Simulated artificial latency
    const latency = options?.timeoutMs !== undefined ? 0 : this._simulatedLatencyMs;
    if (latency > 0) {
      await new Promise(res => setTimeout(res, latency));
    }

    // Simulated packet loss
    if (this._simulatedDropRate > 0 && Math.random() < this._simulatedDropRate) {
      return Object.freeze({
        success: false,
        packetId: packet.header.packetId,
        bytesTransmitted: 0,
        timestamp: Date.now(),
        error: 'Simulated packet drop on virtual bus',
      });
    }

    // Direct delivery to remote peer's inbound handler
    const target = this._remotePeer;
    const session = target._activeSession ?? {
      sessionId: 'VIRTUAL',
      transportType: 'MEMORY',
      localEndpoint: target._localEndpoint ?? { transportType: 'MEMORY' as const, host: 'localhost', port: 0 },
      remoteEndpoint: this._localEndpoint ?? { transportType: 'MEMORY' as const, host: 'localhost', port: 0 },
      establishedAt: Date.now(),
      protocolVersion: Object.freeze({ major: 1, minor: 0, patch: 0 }),
      bytesReceived: 0,
      bytesSent: 0,
      packetsReceived: 0,
      packetsSent: 0,
      lastActivityAt: Date.now(),
      state: 'CONNECTED',
    };

    target.handleInboundPacket(packet, session);

    return Object.freeze({
      success: true,
      packetId: packet.header.packetId,
      bytesTransmitted: packet.payload.byteLength,
      timestamp: Date.now(),
      latencyMs: Date.now() - start,
    });
  }

  protected async _doClose(reason: string): Promise<void> {
    if (this._localEndpoint) {
      const key = this.getBusKey(this._localEndpoint);
      MemoryTransportAdapter._virtualBus.delete(key);
    }
    if (this._remotePeer) {
      this._remotePeer._remotePeer = undefined;
      this._remotePeer = undefined;
    }
    this._activeSession = undefined;
  }
}
