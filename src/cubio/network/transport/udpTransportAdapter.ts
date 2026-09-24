/**
 * CUBiO AI — Real UDP Datagram Transport Driver
 * =============================================
 *
 * Implements real operating system UDP socket communication using Node.js 'node:dgram'.
 * Binds Phase 1 canonical packet framing to actual datagram send/receive operations.
 *
 * INVARIANTS:
 *   - Real OS UDP sockets (zero in-memory simulation).
 *   - Wire framing header: 4-byte uint32 payload length prefix + 6-byte 'CUBTR1' magic token.
 *   - Strict fail-closed rejection of corrupted magic, truncated datagrams, or malformed packets.
 *   - Clean socket lifecycle: bind, connect, send, receive, and close.
 */

import * as dgram from 'node:dgram';
import { BaseTransportAdapter } from './baseTransportAdapter';
import {
  TransportType,
  TransportCapabilities,
  TransportEndpoint,
  TransportSession,
  TransportSendOptions,
  TransportDeliveryReceipt,
} from './types';
import {
  TRANSPORT_FRAME_CONSTANTS,
  TRANSPORT_PORTS,
  TRANSPORT_TIMEOUTS,
} from './constants';
import {
  serializeCanonicalPacket,
  deserializeCanonicalPacket,
} from '../protocol/v1/canonicalSerializer';
import { CubiOPacket } from '../protocol/v1/packetTypes';
import { CubiOProtocolValidator } from '../protocol/v1/protocolValidator';

export interface UdpAdapterOptions {
  /** Socket type: 'udp4' (default) or 'udp6' */
  readonly type?: 'udp4' | 'udp6';
  /** Socket address reuse */
  readonly reuseAddr?: boolean;
}

export class UdpTransportAdapter extends BaseTransportAdapter {
  public readonly transportType: TransportType = 'UDP';

  public readonly capabilities: TransportCapabilities = Object.freeze({
    connectionOriented: false,
    reliable: false,
    ordered: false,
    messageOriented: true,
    supportsBroadcast: true,
    supportsTls: false,
    maxPayloadBytes: 65507, // Maximum safe IPv4 UDP payload (65,535 - 8 byte UDP header - 20 byte IP header)
    defaultMtu: 1400,       // Safe Ethernet MTU avoiding IP fragmentation
  });

  private _socket: dgram.Socket | undefined;
  private _remoteEndpoint: TransportEndpoint | undefined;
  private _activeSession: TransportSession | undefined;
  private readonly _socketType: 'udp4' | 'udp6';
  private readonly _reuseAddr: boolean;

  constructor(options?: UdpAdapterOptions) {
    super();
    this._socketType = options?.type ?? 'udp4';
    this._reuseAddr = options?.reuseAddr ?? true;
  }

  public get remoteEndpoint(): TransportEndpoint | undefined {
    return this._remoteEndpoint ? Object.freeze({ ...this._remoteEndpoint }) : undefined;
  }

  public setRemoteEndpoint(endpoint: TransportEndpoint): void {
    this._remoteEndpoint = Object.freeze({ ...endpoint });
  }

  // ─── Subclass Driver Hooks ────────────────────────────────────────────────

  protected async _doListen(endpoint: TransportEndpoint): Promise<void> {
    if (this._socket) {
      throw new Error('UDP socket already initialized.');
    }

    const socket = dgram.createSocket({
      type: this._socketType,
      reuseAddr: this._reuseAddr,
    });

    this._socket = socket;
    this.setupSocketEvents(socket);

    await new Promise<void>((resolve, reject) => {
      const onError = (err: Error) => {
        socket.removeListener('listening', onListening);
        reject(err);
      };

      const onListening = () => {
        socket.removeListener('error', onError);
        const actual = socket.address();
        this._localEndpoint = Object.freeze({
          transportType: 'UDP',
          host: actual.address,
          port: actual.port,
          coordinateUri: endpoint.coordinateUri,
        });
        resolve();
      };

      socket.once('error', onError);
      socket.once('listening', onListening);
      socket.bind(endpoint.port, endpoint.host);
    });
  }

  protected async _doConnect(remoteEndpoint: TransportEndpoint): Promise<TransportSession> {
    this._remoteEndpoint = Object.freeze({ ...remoteEndpoint });

    // If socket is not yet bound, bind to ephemeral port on any local interface
    if (!this._socket) {
      const socket = dgram.createSocket({
        type: this._socketType,
        reuseAddr: this._reuseAddr,
      });
      this._socket = socket;
      this.setupSocketEvents(socket);

      await new Promise<void>((resolve, reject) => {
        socket.once('error', reject);
        socket.once('listening', () => {
          const actual = socket.address();
          this._localEndpoint = Object.freeze({
            transportType: 'UDP',
            host: actual.address,
            port: actual.port,
          });
          resolve();
        });
        const bindHost = (remoteEndpoint.host === '127.0.0.1' || remoteEndpoint.host === 'localhost') ? '127.0.0.1' : '0.0.0.0';
        socket.bind(0, bindHost);
      });
    }

    const sessionId = `UDP_SESS_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const session: TransportSession = Object.freeze({
      sessionId,
      transportType: 'UDP',
      localEndpoint: this._localEndpoint ?? { transportType: 'UDP' as const, host: '127.0.0.1', port: 0 },
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
    return session;
  }

  protected async _doSend(packet: CubiOPacket, options?: TransportSendOptions): Promise<TransportDeliveryReceipt> {
    if (!this._socket) {
      throw new Error('UDP socket is not open.');
    }

    const targetEp = options?.destinationEndpoint ?? this._remoteEndpoint;
    if (!targetEp) {
      throw new Error('UDP transport has no target destination endpoint configured.');
    }

    const start = Date.now();

    // 1. Serialize Phase 1 packet to canonical JSON wire string
    const serializedPacket = serializeCanonicalPacket(packet);
    const payloadBuffer = Buffer.from(serializedPacket, 'utf8');

    // 2. Wrap into canonical wire frame: [4 bytes length][6 bytes MAGIC 'CUBTR1'][payload]
    const headerSize = TRANSPORT_FRAME_CONSTANTS.HEADER_SIZE_BYTES; // 10 bytes
    const frameBuffer = Buffer.allocUnsafe(headerSize + payloadBuffer.length);

    frameBuffer.writeUInt32BE(payloadBuffer.length, 0);
    frameBuffer.write(TRANSPORT_FRAME_CONSTANTS.MAGIC, 4, 6, 'ascii');
    payloadBuffer.copy(frameBuffer, headerSize);

    // 3. Send raw datagram over OS UDP socket
    await new Promise<void>((resolve, reject) => {
      let timer: NodeJS.Timeout | undefined;
      if (options?.timeoutMs && options.timeoutMs > 0) {
        timer = setTimeout(() => {
          reject(new Error(`UDP transmission timed out after ${options.timeoutMs}ms`));
        }, options.timeoutMs);
      }

      this._socket!.send(
        frameBuffer,
        0,
        frameBuffer.length,
        targetEp.port,
        targetEp.host,
        (err) => {
          if (timer) clearTimeout(timer);
          if (err) reject(err);
          else resolve();
        }
      );
    });

    return Object.freeze({
      success: true,
      packetId: packet.header.packetId,
      bytesTransmitted: frameBuffer.length,
      timestamp: Date.now(),
      latencyMs: Date.now() - start,
    });
  }

  protected async _doClose(reason: string): Promise<void> {
    if (this._socket) {
      const sock = this._socket;
      this._socket = undefined;
      this._remoteEndpoint = undefined;
      this._activeSession = undefined;

      await new Promise<void>((resolve) => {
        try {
          sock.close(() => resolve());
        } catch {
          resolve();
        }
      });
    }
  }

  // ─── Socket Event Handlers ────────────────────────────────────────────────

  private setupSocketEvents(socket: dgram.Socket): void {
    socket.on('message', (msg: Buffer, rinfo: dgram.RemoteInfo) => {
      this.handleIncomingDatagram(msg, rinfo);
    });

    socket.on('error', (err: Error) => {
      this.emitError('ERR_TRANSPORT_SOCKET_ERROR', `UDP socket error: ${err.message}`, {
        fatal: false,
        cause: err.message,
      });
    });
  }

  /**
   * Processes a raw inbound UDP datagram from the OS socket.
   */
  private handleIncomingDatagram(msg: Buffer, rinfo: dgram.RemoteInfo): void {
    const headerSize = TRANSPORT_FRAME_CONSTANTS.HEADER_SIZE_BYTES;

    // 1. Minimum frame header size check
    if (msg.length < headerSize) {
      this._packetsDropped++;
      this.emitError(
        'ERR_TRANSPORT_FRAME_CORRUPTED',
        `Truncated UDP datagram: received ${msg.length} bytes, minimum header is ${headerSize} bytes`
      );
      return;
    }

    // 2. Wire frame header validation
    const payloadLength = msg.readUInt32BE(0);
    const magic = msg.toString('ascii', 4, 10);

    if (magic !== TRANSPORT_FRAME_CONSTANTS.MAGIC) {
      this._packetsDropped++;
      this.emitError(
        'ERR_TRANSPORT_FRAME_CORRUPTED',
        `Invalid UDP wire frame magic: expected '${TRANSPORT_FRAME_CONSTANTS.MAGIC}', got '${magic}'`
      );
      return;
    }

    if (headerSize + payloadLength !== msg.length) {
      this._packetsDropped++;
      this.emitError(
        'ERR_TRANSPORT_FRAME_CORRUPTED',
        `Datagram length mismatch: declared ${payloadLength} bytes payload, got ${msg.length - headerSize}`
      );
      return;
    }

    // 3. Deserialize canonical packet payload
    const payloadString = msg.toString('utf8', headerSize, headerSize + payloadLength);
    let packet: CubiOPacket;
    try {
      packet = deserializeCanonicalPacket(payloadString);
    } catch (err: any) {
      this._packetsDropped++;
      this.emitError('ERR_TRANSPORT_FRAME_CORRUPTED', `Failed to deserialize packet JSON: ${err.message}`);
      return;
    }

    // 4. Construct transport session context from rinfo
    const remoteEp: TransportEndpoint = Object.freeze({
      transportType: 'UDP',
      host: rinfo.address,
      port: rinfo.port,
    });

    // Auto-record remoteEndpoint so listener can send replies
    if (!this._remoteEndpoint) {
      this._remoteEndpoint = remoteEp;
    }

    const session: TransportSession = Object.freeze({
      sessionId: `UDP_${rinfo.address}_${rinfo.port}`,
      transportType: 'UDP',
      localEndpoint: this._localEndpoint ?? { transportType: 'UDP' as const, host: '0.0.0.0', port: 0 },
      remoteEndpoint: remoteEp,
      establishedAt: Date.now(),
      protocolVersion: Object.freeze({ major: 1, minor: 0, patch: 0 }),
      bytesReceived: msg.length,
      bytesSent: 0,
      packetsReceived: 1,
      packetsSent: 0,
      lastActivityAt: Date.now(),
      state: 'CONNECTED',
    });

    // 5. Ingest through canonical base validator & dispatch
    this.handleInboundPacket(packet, session);
  }
}
