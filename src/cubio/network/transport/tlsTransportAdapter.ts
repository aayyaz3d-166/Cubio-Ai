/**
 * CUBiO AI — Canonical TLS Transport Adapter
 * ============================================
 *
 * Implements the secure connection-oriented TLS transport driver for CUBiO AI.
 * Provides authenticated, encrypted wire delivery over TCP streams with TLS 1.2 / 1.3.
 *
 * Security Invariants:
 *   - Uses modern AEAD ciphers with Perfect Forward Secrecy (PFS).
 *   - Rejects legacy, broken protocols (SSLv2, SSLv3, TLS 1.0, TLS 1.1) fail-closed.
 *   - Enforces certificate authority chain validation and SAN hostname verification.
 *   - Supports Mutual TLS (mTLS) for peer-authenticated links.
 *   - Seamlessly preserves certified Phase 1 packet framing and RFC 8785 JSON canonicalization.
 */

import * as tls from 'node:tls';
import * as net from 'node:net';
import { BaseTransportAdapter } from './baseTransportAdapter';
import {
  TransportType,
  TransportCapabilities,
  TransportEndpoint,
  TransportSession,
  TransportDeliveryReceipt,
  TransportSendOptions,
} from './types';
import {
  TlsServerConfig,
  TlsClientConfig,
  TlsSessionInfo,
  TlsHandshakeFailedError,
  SECURE_TLS_DEFAULTS,
} from './transportSecurityTypes';
import { TransportFrameCodec, StreamFrameDecoder } from './transportFramingAdapter';
import { CubiOPacket } from '../protocol/v1/packetTypes';
import { PROTOCOL_LIMITS } from '../protocol/v1/constants';
import { CURRENT_PROTOCOL_VERSION } from '../protocol/v1/versionTypes';

export interface TlsAdapterOptions {
  readonly serverTls?: TlsServerConfig;
  readonly clientTls?: TlsClientConfig;
  readonly connectTimeoutMs?: number;
  readonly maxPayloadBytes?: number;
}

interface TlsSocketContext {
  readonly socket: tls.TLSSocket;
  readonly session: TransportSession;
  readonly decoder: StreamFrameDecoder;
}

export class TlsTransportAdapter extends BaseTransportAdapter {
  public readonly transportType: TransportType = 'TCP';
  public readonly capabilities: TransportCapabilities;

  private _server: tls.Server | undefined;
  private _clientSocket: tls.TLSSocket | undefined;
  private _activeSession: TransportSession | undefined;
  private _remoteEndpoint: TransportEndpoint | undefined;

  private readonly _acceptedClients: Map<string, TlsSocketContext> = new Map();
  private _activeClientContext: TlsSocketContext | undefined;

  private readonly _serverTls?: TlsServerConfig;
  private readonly _clientTls?: TlsClientConfig;
  private readonly _connectTimeoutMs: number;

  constructor(options?: TlsAdapterOptions) {
    super();
    this._serverTls = options?.serverTls;
    this._clientTls = options?.clientTls;
    this._connectTimeoutMs = options?.connectTimeoutMs ?? SECURE_TLS_DEFAULTS.handshakeTimeoutMs;

    const maxPayload = options?.maxPayloadBytes ?? PROTOCOL_LIMITS.MAX_PACKET_BYTES;

    this.capabilities = Object.freeze({
      connectionOriented: true,
      reliable: true,
      ordered: true,
      messageOriented: false, // TLS wraps continuous byte streams
      supportsBroadcast: false,
      supportsTls: true,       // Natively encrypted
      maxPayloadBytes: maxPayload,
      defaultMtu: 16_384,
    });
  }

  // ─── Inspection & Telemetry ───────────────────────────────────────────────

  /**
   * Inspects the active TLS session (cipher, protocol, certificate, authorization).
   */
  public getTlsSessionInfo(): TlsSessionInfo | undefined {
    const sock = this._clientSocket ?? this._activeClientContext?.socket;
    if (!sock || typeof sock.getProtocol !== 'function') return undefined;

    const cipher = sock.getCipher();
    const peerCert = sock.getPeerCertificate(true);

    return Object.freeze({
      encrypted: sock.encrypted ?? true,
      protocol: sock.getProtocol() ?? 'UNKNOWN',
      cipherName: cipher?.name ?? 'UNKNOWN',
      cipherVersion: cipher?.version,
      authorized: sock.authorized ?? false,
      authorizationError: sock.authorizationError?.message ?? (sock.authorizationError as any),
      peerCertificate: peerCert && Object.keys(peerCert).length > 0 ? Object.freeze({
        subject: peerCert.subject ? Object.freeze({ ...peerCert.subject }) : {},
        issuer: peerCert.issuer ? Object.freeze({ ...peerCert.issuer }) : {},
        validFrom: peerCert.valid_from ?? '',
        validTo: peerCert.valid_to ?? '',
        fingerprint256: peerCert.fingerprint256 ?? '',
        serialNumber: peerCert.serialNumber ?? '',
        subjectAltName: peerCert.subjectaltname,
      }) : undefined,
    });
  }

  // ─── BaseTransportAdapter Hooks ───────────────────────────────────────────

  protected async _doListen(endpoint: TransportEndpoint): Promise<void> {
    if (!this._serverTls) {
      throw new Error("Cannot start TLS server: 'serverTls' configuration (cert, key) was not provided");
    }

    return new Promise<void>((resolve, reject) => {
      const minVer = this._serverTls!.minVersion ?? SECURE_TLS_DEFAULTS.minVersion;
      const maxVer = this._serverTls!.maxVersion ?? SECURE_TLS_DEFAULTS.maxVersion;
      const ciphers = this._serverTls!.ciphers ?? SECURE_TLS_DEFAULTS.ciphers;

      const serverOpts: tls.TlsOptions = {
        cert: this._serverTls!.cert,
        key: this._serverTls!.key,
        ca: this._serverTls!.ca,
        requestCert: this._serverTls!.requestCert ?? false,
        rejectUnauthorized: this._serverTls!.rejectUnauthorized ?? true,
        minVersion: minVer,
        maxVersion: maxVer,
        ciphers,
      };

      const srv = tls.createServer(serverOpts, (socket: tls.TLSSocket) => {
        this._handleIncomingTlsSocket(socket);
      });

      srv.on('error', (err: any) => {
        this.emitError('ERR_TRANSPORT_BIND_FAILED', `TLS Server socket error: ${err.message}`, { fatal: true });
        reject(err);
      });

      srv.listen(endpoint.port, endpoint.host, () => {
        const addr = srv.address();
        if (addr && typeof addr === 'object') {
          this._localEndpoint = Object.freeze({
            transportType: 'TCP',
            host: addr.address,
            port: addr.port,
            coordinateUri: endpoint.coordinateUri,
          });
        }
        this._server = srv;
        resolve();
      });
    });
  }

  protected async _doConnect(remoteEndpoint: TransportEndpoint): Promise<TransportSession> {
    return new Promise<TransportSession>((resolve, reject) => {
      this._remoteEndpoint = Object.freeze({ ...remoteEndpoint });

      const minVer = this._clientTls?.minVersion ?? SECURE_TLS_DEFAULTS.minVersion;
      const maxVer = this._clientTls?.maxVersion ?? SECURE_TLS_DEFAULTS.maxVersion;
      const ciphers = this._clientTls?.ciphers ?? SECURE_TLS_DEFAULTS.ciphers;
      const rejectUnauthorized = this._clientTls?.rejectUnauthorized ?? SECURE_TLS_DEFAULTS.rejectUnauthorized;

      // Determine servername for SNI
      let servername = this._clientTls?.servername;
      if (!servername && !net.isIP(remoteEndpoint.host)) {
        servername = remoteEndpoint.host;
      }

      const connectOpts: tls.ConnectionOptions = {
        host: remoteEndpoint.host,
        port: remoteEndpoint.port,
        servername,
        ca: this._clientTls?.ca,
        cert: this._clientTls?.cert,
        key: this._clientTls?.key,
        rejectUnauthorized,
        minVersion: minVer,
        maxVersion: maxVer,
        ciphers,
      };

      let timer: NodeJS.Timeout | null = null;
      let settled = false;

      const cleanup = () => {
        if (timer) clearTimeout(timer);
        settled = true;
      };

      timer = setTimeout(() => {
        if (settled) return;
        cleanup();
        if (socket) socket.destroy();
        const err = new TlsHandshakeFailedError(
          `TLS handshake timed out after ${this._connectTimeoutMs}ms`,
          remoteEndpoint
        );
        this.emitError('ERR_TRANSPORT_CONNECT_TIMEOUT', err.message);
        reject(err);
      }, this._connectTimeoutMs);

      const socket = tls.connect(connectOpts, () => {
        if (settled) return;
        cleanup();

        if (!socket.authorized && rejectUnauthorized) {
          const authErr = socket.authorizationError ?? new Error('Peer certificate unauthorized');
          socket.destroy();
          const err = new TlsHandshakeFailedError(
            `TLS peer certificate rejected: ${authErr.message}`,
            remoteEndpoint,
            authErr.message
          );
          this.emitError('ERR_TRANSPORT_TLS_HANDSHAKE_FAILED', err.message, { fatal: true });
          return reject(err);
        }

        const localAddr = socket.address();
        if (localAddr && typeof localAddr === 'object' && 'address' in localAddr && 'port' in localAddr) {
          this._localEndpoint = Object.freeze({
            transportType: 'TCP',
            host: (localAddr as net.AddressInfo).address,
            port: (localAddr as net.AddressInfo).port,
          });
        }

        const sessionId = `tls-sess-client-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const session: TransportSession = Object.freeze({
          sessionId,
          transportType: 'TCP',
          localEndpoint: this._localEndpoint!,
          remoteEndpoint,
          establishedAt: Date.now(),
          protocolVersion: CURRENT_PROTOCOL_VERSION,
          bytesReceived: 0,
          bytesSent: 0,
          packetsReceived: 0,
          packetsSent: 0,
          lastActivityAt: Date.now(),
          state: 'CONNECTED',
        });

        this._activeSession = session;
        this._clientSocket = socket;

        // Attach streaming frame decoder
        const decoder = new StreamFrameDecoder(this.capabilities.maxPayloadBytes);
        socket.on('data', (chunk: Buffer) => {
          try {
            const packets = decoder.push(chunk);
            for (const pkt of packets) {
              this.handleInboundPacket(pkt, session);
            }
          } catch (err: any) {
            this.emitError('ERR_TRANSPORT_FRAME_CORRUPTED', `TLS Stream frame error: ${err.message}`);
            socket.destroy();
          }
        });

        socket.on('error', (err: any) => {
          this.emitError('ERR_TRANSPORT_SOCKET_ERROR', `TLS socket error: ${err.message}`);
        });

        socket.on('close', () => {
          if (this._state !== 'DISCONNECTING' && this._state !== 'DISCONNECTED') {
            this.emitError('ERR_TRANSPORT_DISCONNECTED', 'TLS remote peer closed connection');
            try {
              this.transitionState('DISCONNECTED', 'Remote peer TLS close');
            } catch {}
          }
        });

        resolve(session);
      });

      socket.on('error', (err: any) => {
        if (settled) return;
        cleanup();
        const tlsErr = new TlsHandshakeFailedError(err.message, remoteEndpoint, err.code);
        this.emitError('ERR_TRANSPORT_TLS_HANDSHAKE_FAILED', tlsErr.message);
        reject(tlsErr);
      });
    });
  }

  protected async _doSend(
    packet: CubiOPacket,
    _options?: TransportSendOptions
  ): Promise<TransportDeliveryReceipt> {
    const socket = this._clientSocket ?? this._activeClientContext?.socket;

    if (!socket || socket.destroyed || !socket.writable) {
      throw new Error("Cannot send packet: TLS socket is not writable or destroyed");
    }

    const wireFrame = TransportFrameCodec.encode(packet);

    return new Promise<TransportDeliveryReceipt>((resolve, reject) => {
      socket.write(wireFrame, (err?: Error | null) => {
        if (err) {
          return reject(err);
        }
        resolve(Object.freeze({
          success: true,
          packetId: packet.header.packetId,
          bytesTransmitted: wireFrame.length,
          timestamp: Date.now(),
        }));
      });
    });
  }

  protected async _doClose(reason: string): Promise<void> {
    // 1. Close outbound client socket
    if (this._clientSocket) {
      try {
        this._clientSocket.destroy();
      } catch {}
      this._clientSocket = undefined;
    }

    // 2. Close all accepted server clients
    for (const ctx of this._acceptedClients.values()) {
      try {
        ctx.socket.destroy();
      } catch {}
    }
    this._acceptedClients.clear();
    this._activeClientContext = undefined;

    // 3. Close TLS server listener
    if (this._server) {
      await new Promise<void>((resolve) => {
        this._server!.close(() => resolve());
      });
      this._server = undefined;
    }
  }

  // ─── Inbound TLS Server Socket Handling ───────────────────────────────────

  private _handleIncomingTlsSocket(socket: tls.TLSSocket): void {
    const remoteAddr = socket.remoteAddress ?? '127.0.0.1';
    const remotePort = socket.remotePort ?? 0;
    const remoteEndpoint: TransportEndpoint = Object.freeze({
      transportType: 'TCP',
      host: remoteAddr,
      port: remotePort,
    });

    const sessionId = `tls-srv-sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const session: TransportSession = Object.freeze({
      sessionId,
      transportType: 'TCP',
      localEndpoint: this._localEndpoint!,
      remoteEndpoint,
      establishedAt: Date.now(),
      protocolVersion: CURRENT_PROTOCOL_VERSION,
      bytesReceived: 0,
      bytesSent: 0,
      packetsReceived: 0,
      packetsSent: 0,
      lastActivityAt: Date.now(),
      state: 'CONNECTED',
    });

    const decoder = new StreamFrameDecoder(this.capabilities.maxPayloadBytes);
    const context: TlsSocketContext = { socket, session, decoder };

    this._acceptedClients.set(sessionId, context);
    this._activeClientContext = context;

    socket.on('data', (chunk: Buffer) => {
      try {
        const packets = decoder.push(chunk);
        for (const pkt of packets) {
          this.handleInboundPacket(pkt, session);
        }
      } catch (err: any) {
        this.emitError('ERR_TRANSPORT_FRAME_CORRUPTED', `TLS inbound frame error: ${err.message}`);
        socket.destroy();
      }
    });

    socket.on('error', (err: any) => {
      this.emitError('ERR_TRANSPORT_SOCKET_ERROR', `TLS accepted socket error: ${err.message}`);
    });

    socket.on('close', () => {
      this._acceptedClients.delete(sessionId);
      if (this._activeClientContext?.session.sessionId === sessionId) {
        this._activeClientContext = this._acceptedClients.values().next().value;
      }
    });
  }
}
