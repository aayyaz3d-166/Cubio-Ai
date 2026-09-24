/**
 * CUBiO AI — Real WebSocket Transport Driver
 * ===========================================
 *
 * Implements real WebSocket client and server transport using the 'ws' library.
 * Binds Phase 1 canonical packet framing to message-oriented WebSocket channels,
 * preserving message boundaries, strict fail-closed framing validation,
 * connection lifecycle management, disconnect detection, and clean teardown.
 *
 * INVARIANTS:
 *   - Real OS WebSocket connections (zero mock or simulated peers).
 *   - 10-byte wire framing header: [4 bytes uint32 BE length prefix][6 bytes 'CUBTR1' magic].
 *   - Message-oriented framing: each WebSocket message frame encapsulates an entire CUBiO frame.
 *   - Strict fail-closed rejection of invalid magic, corrupted packets, or boundary violations.
 *   - Clean separation of transport framing from higher-level application semantics.
 */

import { WebSocket, WebSocketServer, RawData } from 'ws';
import * as https from 'node:https';
import { BaseTransportAdapter } from './baseTransportAdapter';
import {
  TlsServerConfig,
  TlsClientConfig,
  SECURE_TLS_DEFAULTS,
} from './transportSecurityTypes';
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
import { PROTOCOL_LIMITS } from '../protocol/v1/constants';
import {
  serializeCanonicalPacket,
  deserializeCanonicalPacket,
} from '../protocol/v1/canonicalSerializer';
import { CubiOPacket } from '../protocol/v1/packetTypes';

export interface WebSocketAdapterOptions {
  /** Optional URL path for WebSocket server/client (default: '/') */
  readonly path?: string;
  /** Keepalive ping interval in ms (default: 10,000; 0 to disable) */
  readonly pingIntervalMs?: number;
  /** Connection timeout in ms (default: 5,000) */
  readonly connectTimeoutMs?: number;
  /** Maximum allowable payload bytes per frame (default: 65,536) */
  readonly maxPayloadBytes?: number;
  /** Server-side TLS / HTTPS configuration for secure WSS */
  readonly tlsServer?: TlsServerConfig;
  /** Client-side TLS / WSS configuration */
  readonly tlsClient?: TlsClientConfig;
}

interface WsClientContext {
  readonly socket: WebSocket;
  readonly session: TransportSession;
}

export class WebSocketTransportAdapter extends BaseTransportAdapter {
  public readonly transportType: TransportType = 'WEBSOCKET';

  public readonly capabilities: TransportCapabilities;

  private _server: WebSocketServer | undefined;
  private _httpsServer: https.Server | undefined;
  private _clientSocket: WebSocket | undefined;
  private _activeSession: TransportSession | undefined;
  private _remoteEndpoint: TransportEndpoint | undefined;

  // Server-side connected client registry: sessionId -> WsClientContext
  private readonly _acceptedClients: Map<string, WsClientContext> = new Map();
  private _activeClientContext: WsClientContext | undefined;

  private readonly _path: string;
  private readonly _connectTimeoutMs: number;
  private readonly _tlsServer?: TlsServerConfig;
  private readonly _tlsClient?: TlsClientConfig;

  constructor(options?: WebSocketAdapterOptions) {
    super();
    this._path = options?.path ?? '/';
    this._connectTimeoutMs = options?.connectTimeoutMs ?? TRANSPORT_TIMEOUTS.CONNECT_TIMEOUT_MS;
    this._tlsServer = options?.tlsServer;
    this._tlsClient = options?.tlsClient;

    const maxPayload = options?.maxPayloadBytes ?? PROTOCOL_LIMITS.MAX_PACKET_BYTES;
    const isTls = Boolean(options?.tlsServer || options?.tlsClient);

    this.capabilities = Object.freeze({
      connectionOriented: true,
      reliable: true,
      ordered: true,
      messageOriented: true, // WebSocket natively frames discrete messages
      supportsBroadcast: false,
      supportsTls: isTls,
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

  // ─── Subclass Driver Hooks ────────────────────────────────────────────────

  protected async _doListen(endpoint: TransportEndpoint): Promise<void> {
    if (this._server || this._clientSocket) {
      throw new Error('WebSocket adapter already initialized or active.');
    }

    await new Promise<void>((resolve, reject) => {
      const onError = (err: Error) => {
        try { this._httpsServer?.close(); } catch {}
        try { this._server?.close(); } catch {}
        this._httpsServer = undefined;
        this._server = undefined;
        reject(err);
      };

      const onListening = () => {
        const addr = this._httpsServer ? this._httpsServer.address() : this._server?.address();
        if (typeof addr === 'object' && addr !== null) {
          this._localEndpoint = Object.freeze({
            transportType: 'WEBSOCKET' as const,
            host: addr.address === '::' ? '127.0.0.1' : addr.address,
            port: addr.port,
            path: this._path,
            coordinateUri: endpoint.coordinateUri,
          });
        }
        resolve();
      };

      if (this._tlsServer) {
        try {
          const httpsSrv = https.createServer({
            cert: this._tlsServer.cert,
            key: this._tlsServer.key,
            ca: this._tlsServer.ca,
            requestCert: this._tlsServer.requestCert ?? false,
            rejectUnauthorized: this._tlsServer.rejectUnauthorized ?? true,
            minVersion: this._tlsServer.minVersion ?? SECURE_TLS_DEFAULTS.minVersion,
            maxVersion: this._tlsServer.maxVersion ?? SECURE_TLS_DEFAULTS.maxVersion,
            ciphers: this._tlsServer.ciphers ?? SECURE_TLS_DEFAULTS.ciphers,
          });
          this._httpsServer = httpsSrv;

          const server = new WebSocketServer({
            server: httpsSrv,
            path: this._path === '/' ? undefined : this._path,
          });
          this._server = server;

          httpsSrv.once('error', onError);
          server.on('connection', (socket: WebSocket, req) => {
            this.handleInboundConnection(socket, req);
          });

          httpsSrv.listen(endpoint.port, endpoint.host, onListening);
        } catch (err: any) {
          return reject(err);
        }
      } else {
        let server: WebSocketServer;
        try {
          server = new WebSocketServer({
            host: endpoint.host,
            port: endpoint.port,
            path: this._path === '/' ? undefined : this._path,
          });
        } catch (err) {
          return reject(err);
        }

        this._server = server;
        server.once('error', onError);
        server.once('listening', onListening);
        server.on('connection', (socket: WebSocket, req) => {
          this.handleInboundConnection(socket, req);
        });
      }
    });
  }

  protected async _doConnect(remoteEndpoint: TransportEndpoint): Promise<TransportSession> {
    if (this._server || this._clientSocket) {
      throw new Error('WebSocket adapter already initialized or active.');
    }

    this._remoteEndpoint = Object.freeze({ ...remoteEndpoint });

    const pathPart = remoteEndpoint.path ?? this._path;
    const cleanPath = pathPart.startsWith('/') ? pathPart : `/${pathPart}`;
    const isTls = Boolean(this._tlsClient || remoteEndpoint.path?.startsWith('wss'));
    const scheme = isTls ? 'wss' : 'ws';
    const url = `${scheme}://${remoteEndpoint.host}:${remoteEndpoint.port}${cleanPath}`;

    const wsOpts: any = {};
    if (this._tlsClient) {
      wsOpts.ca = this._tlsClient.ca;
      wsOpts.cert = this._tlsClient.cert;
      wsOpts.key = this._tlsClient.key;
      wsOpts.rejectUnauthorized = this._tlsClient.rejectUnauthorized ?? SECURE_TLS_DEFAULTS.rejectUnauthorized;
      wsOpts.minVersion = this._tlsClient.minVersion ?? SECURE_TLS_DEFAULTS.minVersion;
      wsOpts.maxVersion = this._tlsClient.maxVersion ?? SECURE_TLS_DEFAULTS.maxVersion;
      wsOpts.ciphers = this._tlsClient.ciphers ?? SECURE_TLS_DEFAULTS.ciphers;
    }

    const socket = new WebSocket(url, wsOpts);
    this._clientSocket = socket;

    return new Promise<TransportSession>((resolve, reject) => {
      let timer: NodeJS.Timeout | undefined;
      let connected = false;

      const cleanupListeners = () => {
        if (timer) clearTimeout(timer);
        socket.removeListener('open', onOpen);
        socket.removeListener('error', onError);
      };

      const onOpen = () => {
        cleanupListeners();
        connected = true;

        this._localEndpoint = Object.freeze({
          transportType: 'WEBSOCKET' as const,
          host: '127.0.0.1',
          port: 0, // Client side ephemeral port
        });

        const sessionId = `WS_CLI_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const session: TransportSession = Object.freeze({
          sessionId,
          transportType: 'WEBSOCKET' as const,
          localEndpoint: this._localEndpoint,
          remoteEndpoint: Object.freeze({
            transportType: 'WEBSOCKET' as const,
            host: remoteEndpoint.host,
            port: remoteEndpoint.port,
            path: cleanPath,
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

        socket.on('message', (data: RawData) => {
          this.handleInboundMessage(data, session, socket);
        });

        socket.on('error', (err: Error) => {
          this.emitError('ERR_TRANSPORT_SOCKET_ERROR', `WebSocket client error: ${err.message}`, {
            fatal: false,
            cause: err.message,
          });
        });

        socket.on('close', () => {
          if (this._state === 'CONNECTED' || this._state === 'DEGRADED') {
            this.emitError('ERR_TRANSPORT_DISCONNECTED', 'Remote WebSocket peer closed connection.');
            this.transitionState('DISCONNECTED', 'Remote WebSocket peer closed');
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
            socket.terminate();
            reject(new Error(`WebSocket connection timed out after ${this._connectTimeoutMs}ms`));
          }
        }, this._connectTimeoutMs);
      }

      socket.once('open', onOpen);
      socket.once('error', onError);
    });
  }

  protected async _doSend(packet: CubiOPacket, options?: TransportSendOptions): Promise<TransportDeliveryReceipt> {
    const targetSocket = this.resolveTargetSocket(options);
    if (!targetSocket || targetSocket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket transport has no open socket to target destination.');
    }

    const start = Date.now();

    // 1. Serialize Phase 1 packet to canonical RFC 8785 JSON wire string
    const serializedPacket = serializeCanonicalPacket(packet);
    const payloadBuffer = Buffer.from(serializedPacket, 'utf8');

    // 2. Wrap into canonical 10-byte wire frame: [4B len][6B 'CUBTR1' magic][payload]
    const headerSize = TRANSPORT_FRAME_CONSTANTS.HEADER_SIZE_BYTES;
    const frameBuffer = Buffer.allocUnsafe(headerSize + payloadBuffer.length);

    frameBuffer.writeUInt32BE(payloadBuffer.length, 0);
    frameBuffer.write(TRANSPORT_FRAME_CONSTANTS.MAGIC, 4, 6, 'ascii');
    payloadBuffer.copy(frameBuffer, headerSize);

    // 3. Send binary WebSocket message frame
    await new Promise<void>((resolve, reject) => {
      let timer: NodeJS.Timeout | undefined;
      if (options?.timeoutMs && options.timeoutMs > 0) {
        timer = setTimeout(() => {
          reject(new Error(`WebSocket send timed out after ${options.timeoutMs}ms`));
        }, options.timeoutMs);
      }

      targetSocket.send(frameBuffer, { binary: true }, (err?: Error) => {
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

      await new Promise<void>((resolve) => {
        try {
          if (sock.readyState === WebSocket.OPEN || sock.readyState === WebSocket.CONNECTING) {
            sock.close(1000, reason);
          }
          sock.terminate();
          resolve();
        } catch {
          resolve();
        }
      });
    }

    // 2. Close all accepted server clients
    for (const ctx of this._acceptedClients.values()) {
      try {
        ctx.socket.terminate();
      } catch {
        // Suppress individual terminate errors
      }
    }
    this._acceptedClients.clear();
    this._activeClientContext = undefined;

    // 3. Close server
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

    // 4. Close HTTPS server if WSS
    if (this._httpsServer) {
      const httpsSrv = this._httpsServer;
      this._httpsServer = undefined;

      await new Promise<void>((resolve) => {
        try {
          httpsSrv.close(() => resolve());
        } catch {
          resolve();
        }
      });
    }
  }

  // ─── Internal Event Handlers ──────────────────────────────────────────────

  private handleInboundConnection(socket: WebSocket, req: any): void {
    const remotePort = req.socket?.remotePort ?? 0;
    const remoteAddr = req.socket?.remoteAddress ?? '127.0.0.1';

    const remoteEp: TransportEndpoint = Object.freeze({
      transportType: 'WEBSOCKET' as const,
      host: remoteAddr === '::1' ? '127.0.0.1' : remoteAddr,
      port: remotePort,
      path: req.url,
    });

    const sessionId = `WS_SRV_${remoteEp.host}_${remoteEp.port}_${Date.now()}`;
    const session: TransportSession = Object.freeze({
      sessionId,
      transportType: 'WEBSOCKET' as const,
      localEndpoint: this._localEndpoint ?? { transportType: 'WEBSOCKET' as const, host: '127.0.0.1', port: 0 },
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

    const context: WsClientContext = {
      socket,
      session,
    };

    this._acceptedClients.set(sessionId, context);
    this._activeClientContext = context;

    socket.on('message', (data: RawData) => {
      this.handleInboundMessage(data, session, socket);
    });

    socket.on('error', (err: Error) => {
      this.emitError('ERR_TRANSPORT_SOCKET_ERROR', `Inbound WebSocket client error: ${err.message}`, {
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
   * Validates wire framing on inbound WebSocket message and dispatches packet.
   */
  private handleInboundMessage(data: RawData, session: TransportSession, socket: WebSocket): void {
    const buffer = Buffer.isBuffer(data)
      ? data
      : Array.isArray(data)
      ? Buffer.concat(data)
      : Buffer.from(data as ArrayBuffer);

    const headerSize = TRANSPORT_FRAME_CONSTANTS.HEADER_SIZE_BYTES; // 10 bytes

    // 1. Check minimum frame length
    if (buffer.length < headerSize) {
      this._packetsDropped++;
      this.emitError(
        'ERR_TRANSPORT_FRAME_CORRUPTED',
        `Truncated WebSocket frame: received ${buffer.length} bytes, minimum header is ${headerSize} bytes`
      );
      return;
    }

    // 2. Validate magic token
    const payloadLength = buffer.readUInt32BE(0);
    const magic = buffer.toString('ascii', 4, 10);

    if (magic !== TRANSPORT_FRAME_CONSTANTS.MAGIC) {
      this._packetsDropped++;
      this.emitError(
        'ERR_TRANSPORT_FRAME_CORRUPTED',
        `Invalid WebSocket wire frame magic: expected '${TRANSPORT_FRAME_CONSTANTS.MAGIC}', got '${magic}'`
      );
      return;
    }

    // 3. Enforce maximum payload limit
    if (payloadLength > this.capabilities.maxPayloadBytes) {
      this._packetsDropped++;
      this.emitError(
        'ERR_TRANSPORT_FRAME_CORRUPTED',
        `WebSocket frame payload (${payloadLength} bytes) exceeds adapter maxPayloadBytes (${this.capabilities.maxPayloadBytes} bytes)`
      );
      return;
    }

    // 4. Validate exact message boundary alignment
    if (headerSize + payloadLength !== buffer.length) {
      this._packetsDropped++;
      this.emitError(
        'ERR_TRANSPORT_FRAME_CORRUPTED',
        `WebSocket frame boundary mismatch: declared ${payloadLength} bytes payload, message contains ${buffer.length - headerSize} bytes`
      );
      return;
    }

    // 5. Canonical deserialization and validation
    const payloadString = buffer.toString('utf8', headerSize, headerSize + payloadLength);
    let packet: CubiOPacket;
    try {
      packet = deserializeCanonicalPacket(payloadString);
    } catch (err: any) {
      this._packetsDropped++;
      this.emitError('ERR_TRANSPORT_FRAME_CORRUPTED', `Failed to deserialize packet JSON: ${err.message}`);
      return;
    }

    // 6. Ingest into canonical base adapter
    this.handleInboundPacket(packet, session);
  }

  private resolveTargetSocket(options?: TransportSendOptions): WebSocket | undefined {
    // 1. Client mode socket
    if (this._clientSocket) {
      return this._clientSocket;
    }

    // 2. Specific destination requested
    if (options?.destinationEndpoint) {
      for (const ctx of this._acceptedClients.values()) {
        if (
          ctx.session.remoteEndpoint.port === options.destinationEndpoint.port &&
          (ctx.session.remoteEndpoint.host === options.destinationEndpoint.host ||
            options.destinationEndpoint.host === '127.0.0.1' ||
            options.destinationEndpoint.host === 'localhost')
        ) {
          return ctx.socket;
        }
      }
    }

    // 3. Active client context or first connected client on server
    if (this._activeClientContext && this._activeClientContext.socket.readyState === WebSocket.OPEN) {
      return this._activeClientContext.socket;
    }

    const first = Array.from(this._acceptedClients.values())[0];
    return first?.socket;
  }
}
