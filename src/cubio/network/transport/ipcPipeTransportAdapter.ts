/**
 * CUBiO AI — Real Local IPC Named Pipe Transport Driver
 * ========================================================
 *
 * Implements real local inter-process communication (IPC) using operating system
 * named pipes on Windows ('\\\\.\\pipe\\...') and UNIX domain sockets on POSIX.
 * Binds Phase 1 canonical packet framing to IPC streams with explicit length-prefixed
 * framing, stream accumulation, fragmented read reassembly, multi-client routing,
 * disconnect detection, and clean resource teardown.
 *
 * INVARIANTS:
 *   - Real OS IPC transport channels (zero in-memory queues or simulated sockets).
 *   - 10-byte wire framing header: [4 bytes uint32 BE length prefix][6 bytes 'CUBTR1' magic].
 *   - Stream accumulator buffer handles arbitrary stream fragmentation and packet coalescing.
 *   - Strict fail-closed defense against desynchronized magic, oversized length prefixes, and corrupted JSON.
 *   - Complete multi-process isolation and cross-process transmission fidelity.
 */

import * as net from 'node:net';
import * as os from 'node:os';
import * as fs from 'node:fs';
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
  TRANSPORT_TIMEOUTS,
} from './constants';
import { PROTOCOL_LIMITS } from '../protocol/v1/constants';
import {
  serializeCanonicalPacket,
  deserializeCanonicalPacket,
} from '../protocol/v1/canonicalSerializer';
import { CubiOPacket } from '../protocol/v1/packetTypes';

export interface IpcPipeAdapterOptions {
  /** Connect timeout in ms (default 5,000) */
  readonly connectTimeoutMs?: number;
  /** Maximum allowable payload bytes per frame (default 65,536) */
  readonly maxPayloadBytes?: number;
}

interface IpcClientContext {
  readonly socket: net.Socket;
  readonly session: TransportSession;
  buffer: Buffer;
}

export class IpcPipeTransportAdapter extends BaseTransportAdapter {
  public readonly transportType: TransportType = 'IPC_PIPE';

  public readonly capabilities: TransportCapabilities;

  private _server: net.Server | undefined;
  private _clientSocket: net.Socket | undefined;
  private _activeSession: TransportSession | undefined;
  private _remoteEndpoint: TransportEndpoint | undefined;
  private _boundPipePath: string | undefined;

  // Server-side connected client registry: sessionId -> IpcClientContext
  private readonly _acceptedClients: Map<string, IpcClientContext> = new Map();
  private _activeClientContext: IpcClientContext | undefined;

  // Client-side buffer accumulator
  private _clientAccumulator: { buffer: Buffer } = { buffer: Buffer.alloc(0) };

  private readonly _connectTimeoutMs: number;

  constructor(options?: IpcPipeAdapterOptions) {
    super();
    this._connectTimeoutMs = options?.connectTimeoutMs ?? TRANSPORT_TIMEOUTS.CONNECT_TIMEOUT_MS;

    const maxPayload = options?.maxPayloadBytes ?? PROTOCOL_LIMITS.MAX_PACKET_BYTES;

    this.capabilities = Object.freeze({
      connectionOriented: true,
      reliable: true,
      ordered: true,
      messageOriented: false, // Stream-oriented; framing layer provides message boundaries
      supportsBroadcast: false,
      supportsTls: false,
      maxPayloadBytes: maxPayload,
      defaultMtu: 1400,
    });
  }

  public get remoteEndpoint(): TransportEndpoint | undefined {
    return this._remoteEndpoint ? Object.freeze({ ...this._remoteEndpoint }) : undefined;
  }

  public get activeSession(): TransportSession | undefined {
    return this._activeSession;
  }

  public get acceptedSessions(): readonly TransportSession[] {
    return Array.from(this._acceptedClients.values()).map((ctx) => ctx.session);
  }

  public setRemoteEndpoint(endpoint: TransportEndpoint): void {
    this._remoteEndpoint = Object.freeze({ ...endpoint });
  }

  /**
   * Resolves the canonical platform-appropriate IPC pipe path.
   */
  public static resolvePipePath(customPathOrName?: string): string {
    const raw = customPathOrName ?? `cubio-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    if (process.platform === 'win32') {
      if (raw.startsWith('\\\\.\\pipe\\')) {
        return raw;
      }
      return `\\\\.\\pipe\\${raw.replace(/^[\\/]+/, '')}`;
    } else {
      if (raw.startsWith('/') || raw.startsWith('.')) {
        return raw;
      }
      return `${os.tmpdir()}/${raw}.sock`;
    }
  }

  // ─── Subclass Driver Hooks ────────────────────────────────────────────────

  protected async _doListen(endpoint: TransportEndpoint): Promise<void> {
    if (this._server || this._clientSocket) {
      throw new Error('IPC adapter already initialized or active.');
    }

    const pipePath = IpcPipeTransportAdapter.resolvePipePath(endpoint.path);
    this._boundPipePath = pipePath;

    // On POSIX systems, remove leftover stale domain socket files
    if (process.platform !== 'win32' && fs.existsSync(pipePath)) {
      try {
        fs.unlinkSync(pipePath);
      } catch {
        // Ignore unlink error
      }
    }

    const server = net.createServer();
    this._server = server;

    server.on('connection', (socket: net.Socket) => {
      this.handleInboundConnection(socket, pipePath);
    });

    server.on('error', (err: Error) => {
      this.emitError('ERR_TRANSPORT_SOCKET_ERROR', `IPC server error: ${err.message}`, {
        fatal: false,
        cause: err.message,
      });
    });

    await new Promise<void>((resolve, reject) => {
      const onError = (err: Error) => {
        server.removeListener('listening', onListening);
        try { server.close(); } catch {}
        this._server = undefined;
        reject(err);
      };

      const onListening = () => {
        server.removeListener('error', onError);
        this._localEndpoint = Object.freeze({
          transportType: 'IPC_PIPE' as const,
          host: 'localhost',
          port: 0,
          path: pipePath,
          coordinateUri: endpoint.coordinateUri,
        });
        resolve();
      };

      server.once('error', onError);
      server.once('listening', onListening);
      server.listen(pipePath);
    });
  }

  protected async _doConnect(remoteEndpoint: TransportEndpoint): Promise<TransportSession> {
    if (this._server || this._clientSocket) {
      throw new Error('IPC adapter already initialized or active.');
    }

    this._remoteEndpoint = Object.freeze({ ...remoteEndpoint });

    const pipePath = IpcPipeTransportAdapter.resolvePipePath(remoteEndpoint.path);
    const socket = new net.Socket();
    this._clientSocket = socket;
    this._clientAccumulator = { buffer: Buffer.alloc(0) };

    return new Promise<TransportSession>((resolve, reject) => {
      let timer: NodeJS.Timeout | undefined;
      let connected = false;

      const cleanupListeners = () => {
        if (timer) clearTimeout(timer);
        socket.removeListener('connect', onConnect);
        socket.removeListener('error', onError);
      };

      const onConnect = () => {
        cleanupListeners();
        connected = true;

        this._localEndpoint = Object.freeze({
          transportType: 'IPC_PIPE' as const,
          host: 'localhost',
          port: 0,
          path: pipePath,
        });

        const sessionId = `IPC_CLI_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const session: TransportSession = Object.freeze({
          sessionId,
          transportType: 'IPC_PIPE' as const,
          localEndpoint: this._localEndpoint,
          remoteEndpoint: Object.freeze({
            transportType: 'IPC_PIPE' as const,
            host: 'localhost',
            port: 0,
            path: pipePath,
          }),
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

        socket.on('data', (chunk: Buffer) => {
          this.processStreamBuffer(socket, session, this._clientAccumulator, chunk);
        });

        socket.on('error', (err: Error) => {
          this.emitError('ERR_TRANSPORT_SOCKET_ERROR', `IPC socket error: ${err.message}`, {
            fatal: false,
            cause: err.message,
          });
        });

        socket.on('close', () => {
          if (this._state === 'CONNECTED' || this._state === 'DEGRADED') {
            this.emitError('ERR_TRANSPORT_DISCONNECTED', 'Remote IPC peer closed connection.');
            this.transitionState('DISCONNECTED', 'Remote IPC peer closed');
          }
        });

        resolve(session);
      };

      const onError = (err: Error) => {
        cleanupListeners();
        reject(err);
      };

      if (this._connectTimeoutMs > 0) {
        timer = setTimeout(() => {
          if (!connected) {
            cleanupListeners();
            socket.destroy();
            reject(new Error(`IPC connection timed out after ${this._connectTimeoutMs}ms`));
          }
        }, this._connectTimeoutMs);
      }

      socket.once('connect', onConnect);
      socket.once('error', onError);
      socket.connect(pipePath);
    });
  }

  protected async _doSend(packet: CubiOPacket, options?: TransportSendOptions): Promise<TransportDeliveryReceipt> {
    const targetSocket = this.resolveTargetSocket(options);
    if (!targetSocket || targetSocket.destroyed) {
      throw new Error('IPC transport has no open socket to target destination.');
    }

    const start = Date.now();

    // 1. Serialize Phase 1 packet to canonical RFC 8785 JSON wire string
    const serializedPacket = serializeCanonicalPacket(packet);
    const payloadBuffer = Buffer.from(serializedPacket, 'utf8');

    // 2. Wrap into 10-byte wire frame: [4B len prefix][6B 'CUBTR1' magic][payload]
    const headerSize = TRANSPORT_FRAME_CONSTANTS.HEADER_SIZE_BYTES;
    const frameBuffer = Buffer.allocUnsafe(headerSize + payloadBuffer.length);

    frameBuffer.writeUInt32BE(payloadBuffer.length, 0);
    frameBuffer.write(TRANSPORT_FRAME_CONSTANTS.MAGIC, 4, 6, 'ascii');
    payloadBuffer.copy(frameBuffer, headerSize);

    // 3. Write raw stream frame to real OS IPC named pipe
    await new Promise<void>((resolve, reject) => {
      let timer: NodeJS.Timeout | undefined;
      if (options?.timeoutMs && options.timeoutMs > 0) {
        timer = setTimeout(() => {
          reject(new Error(`IPC send timed out after ${options.timeoutMs}ms`));
        }, options.timeoutMs);
      }

      targetSocket.write(frameBuffer, (err) => {
        if (timer) clearTimeout(timer);
        if (err) reject(err);
        else resolve();
      });
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
    // 1. Close outbound client socket if active
    if (this._clientSocket) {
      const sock = this._clientSocket;
      this._clientSocket = undefined;
      this._activeSession = undefined;
      this._clientAccumulator.buffer = Buffer.alloc(0);

      await new Promise<void>((resolve) => {
        try {
          sock.end(() => {
            sock.destroy();
            resolve();
          });
        } catch {
          resolve();
        }
      });
    }

    // 2. Close accepted server client sockets
    for (const ctx of this._acceptedClients.values()) {
      try {
        ctx.socket.destroy();
      } catch {
        // Suppress individual socket destroy errors
      }
    }
    this._acceptedClients.clear();
    this._activeClientContext = undefined;

    // 3. Close server listener
    if (this._server) {
      const srv = this._server;
      this._server = undefined;

      await new Promise<void>((resolve) => {
        try {
          srv.close(() => resolve());
        } catch {
          resolve();
        }
      });
    }

    // 4. Clean up POSIX domain socket file
    if (process.platform !== 'win32' && this._boundPipePath && fs.existsSync(this._boundPipePath)) {
      try {
        fs.unlinkSync(this._boundPipePath);
      } catch {
        // Suppress unlink error
      }
    }
  }

  // ─── Internal Event Handlers ──────────────────────────────────────────────

  private handleInboundConnection(socket: net.Socket, pipePath: string): void {
    const remoteEp: TransportEndpoint = Object.freeze({
      transportType: 'IPC_PIPE' as const,
      host: 'localhost',
      port: 0,
      path: pipePath,
    });

    const sessionId = `IPC_SRV_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const session: TransportSession = Object.freeze({
      sessionId,
      transportType: 'IPC_PIPE' as const,
      localEndpoint: this._localEndpoint ?? { transportType: 'IPC_PIPE' as const, host: 'localhost', port: 0, path: pipePath },
      remoteEndpoint: remoteEp,
      establishedAt: Date.now(),
      protocolVersion: Object.freeze({ major: 1, minor: 0, patch: 0 }),
      bytesReceived: 0,
      bytesSent: 0,
      packetsReceived: 0,
      packetsSent: 0,
      lastActivityAt: Date.now(),
      state: 'CONNECTED',
    });

    const context: IpcClientContext = {
      socket,
      session,
      buffer: Buffer.alloc(0),
    };

    this._acceptedClients.set(sessionId, context);
    this._activeClientContext = context;

    socket.on('data', (chunk: Buffer) => {
      this.processStreamBuffer(socket, session, context, chunk);
    });

    socket.on('error', (err: Error) => {
      this.emitError('ERR_TRANSPORT_SOCKET_ERROR', `Inbound IPC client error: ${err.message}`, {
        fatal: false,
        cause: err.message,
      });
    });

    socket.on('close', () => {
      this._acceptedClients.delete(sessionId);
      if (this._activeClientContext === context) {
        this._activeClientContext = Array.from(this._acceptedClients.values())[0];
      }
    });
  }

  /**
   * Processes the streaming byte accumulator buffer for an IPC socket.
   */
  private processStreamBuffer(
    socket: net.Socket,
    session: TransportSession,
    accumulator: { buffer: Buffer },
    chunk: Buffer
  ): void {
    accumulator.buffer = Buffer.concat([accumulator.buffer, chunk]);
    const headerSize = TRANSPORT_FRAME_CONSTANTS.HEADER_SIZE_BYTES; // 10 bytes

    while (accumulator.buffer.length >= headerSize) {
      const payloadLength = accumulator.buffer.readUInt32BE(0);
      const magic = accumulator.buffer.toString('ascii', 4, 10);

      // 1. Fail-closed verification of magic token
      if (magic !== TRANSPORT_FRAME_CONSTANTS.MAGIC) {
        this._packetsDropped++;
        this.emitError(
          'ERR_TRANSPORT_FRAME_CORRUPTED',
          `Invalid IPC wire frame magic: expected '${TRANSPORT_FRAME_CONSTANTS.MAGIC}', got '${magic}'`
        );
        // Destroy socket on desynchronized stream
        socket.destroy();
        accumulator.buffer = Buffer.alloc(0);
        return;
      }

      // 2. Enforce upper bound on payload length
      if (payloadLength > this.capabilities.maxPayloadBytes) {
        this._packetsDropped++;
        this.emitError(
          'ERR_TRANSPORT_FRAME_CORRUPTED',
          `IPC frame payload length (${payloadLength} bytes) exceeds adapter maxPayloadBytes (${this.capabilities.maxPayloadBytes} bytes)`
        );
        socket.destroy();
        accumulator.buffer = Buffer.alloc(0);
        return;
      }

      const totalFrameLength = headerSize + payloadLength;

      // 3. Fragmentation check: if complete frame hasn't arrived yet, wait for next stream chunk
      if (accumulator.buffer.length < totalFrameLength) {
        break;
      }

      // 4. Slice out the complete frame
      const payloadString = accumulator.buffer.toString('utf8', headerSize, totalFrameLength);
      accumulator.buffer = accumulator.buffer.subarray(totalFrameLength);

      // 5. Canonical deserialization and validation
      let packet: CubiOPacket;
      try {
        packet = deserializeCanonicalPacket(payloadString);
      } catch (err: any) {
        this._packetsDropped++;
        this.emitError('ERR_TRANSPORT_FRAME_CORRUPTED', `Failed to deserialize packet JSON: ${err.message}`);
        continue;
      }

      // 6. Ingest into canonical base adapter
      this.handleInboundPacket(packet, session);
    }
  }

  private resolveTargetSocket(options?: TransportSendOptions): net.Socket | undefined {
    // 1. Outbound client mode socket
    if (this._clientSocket) {
      return this._clientSocket;
    }

    // 2. Active client context or first connected client on server
    if (this._activeClientContext && !this._activeClientContext.socket.destroyed) {
      return this._activeClientContext.socket;
    }

    const first = Array.from(this._acceptedClients.values())[0];
    return first?.socket;
  }
}
