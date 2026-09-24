/**
 * CUBiO AI — Real Transport Layer Canonical Specification
 * =======================================================
 *
 * Defines the architectural contracts, interfaces, data flows, lifecycles,
 * and security boundaries for the CUBiO Real Transport Layer (Phase 2).
 *
 * ARCHITECTURAL BOUNDARY:
 *   - Phase 1 defined the canonical Protocol Layer: Envelopes, Packets,
 *     Messages, State Models, RFC 8785 Serialization, and Validators.
 *   - Phase 2 defines the Transport Layer: Socket management, frame encoding/decoding,
 *     physical connection lifecycles, rate limiting, and wire transmission.
 *   - Invariant: Phase 2 MUST NOT mutate or weaken any Phase 1 protocol contract.
 */

import { CubiOPacket } from '../protocol/v1/packetTypes';
import { ProtocolEnvelope } from '../protocol/v1/types';
import { CanonicalProtocolVersion } from '../protocol/v1/versionTypes';

/**
 * Supported physical and logical transport driver types.
 */
export type TransportType =
  | 'MEMORY'       // In-memory loopback driver (for testing, IPC simulation, zero latency)
  | 'UDP'          // Unreliable/Low-latency datagram transport (telemetry, spatial heartbeats)
  | 'TCP'          // Reliable stream framing transport (state sync, bulk transfers, RPC)
  | 'WEBSOCKET'    // Bidirectional browser/edge gateway transport (web clients, remote dash)
  | 'IPC_PIPE';    // Named pipe / UNIX domain socket (local daemon to agent process)

/**
 * Transport connection lifecycle states.
 *
 * State Machine:
 *   UNINITIALIZED ──▶ INITIALIZING ──▶ CONNECTING ──▶ CONNECTED ──▶ DEGRADED ──▶ DISCONNECTING ──▶ DISCONNECTED
 *          │               │               │              │             │              │
 *          ▼               ▼               ▼              ▼             ▼              ▼
 *       FAULTED         FAULTED         FAULTED        FAULTED       FAULTED        FAULTED
 */
export type TransportLifecycleState =
  | 'UNINITIALIZED'
  | 'INITIALIZING'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'DEGRADED'
  | 'DISCONNECTING'
  | 'DISCONNECTED'
  | 'FAULTED';

/**
 * Permitted transport lifecycle transitions.
 */
export const PERMITTED_TRANSPORT_TRANSITIONS: ReadonlyMap<TransportLifecycleState, ReadonlySet<TransportLifecycleState>> =
  new Map([
    ['UNINITIALIZED', new Set<TransportLifecycleState>(['INITIALIZING', 'FAULTED'])],
    ['INITIALIZING',  new Set<TransportLifecycleState>(['CONNECTING', 'CONNECTED', 'DISCONNECTED', 'FAULTED'])],
    ['CONNECTING',    new Set<TransportLifecycleState>(['CONNECTED', 'DISCONNECTED', 'FAULTED'])],
    ['CONNECTED',     new Set<TransportLifecycleState>(['DEGRADED', 'DISCONNECTING', 'DISCONNECTED', 'FAULTED'])],
    ['DEGRADED',      new Set<TransportLifecycleState>(['CONNECTED', 'DISCONNECTING', 'DISCONNECTED', 'FAULTED'])],
    ['DISCONNECTING', new Set<TransportLifecycleState>(['DISCONNECTED', 'FAULTED'])],
    ['DISCONNECTED',  new Set<TransportLifecycleState>(['INITIALIZING', 'CONNECTING', 'FAULTED'])],
    ['FAULTED',       new Set<TransportLifecycleState>(['INITIALIZING', 'DISCONNECTED'])],
  ]);

/**
 * Transport endpoint identifier.
 */
export interface TransportEndpoint {
  /** Transport mechanism */
  readonly transportType: TransportType;
  /** Host address (IPv4, IPv6, hostname, or 'localhost') */
  readonly host: string;
  /** Port number (1..65535, or 0 for ephemeral/memory) */
  readonly port: number;
  /** Optional path (e.g. for WebSocket or IPC pipes) */
  readonly path?: string;
  /** Canonical CNC coordinate associated with this endpoint, if bound */
  readonly coordinateUri?: string;
}

/**
 * Transport session metadata.
 */
export interface TransportSession {
  readonly sessionId: string;
  readonly transportType: TransportType;
  readonly localEndpoint: TransportEndpoint;
  readonly remoteEndpoint: TransportEndpoint;
  readonly establishedAt: number;
  readonly protocolVersion: CanonicalProtocolVersion;
  readonly bytesReceived: number;
  readonly bytesSent: number;
  readonly packetsReceived: number;
  readonly packetsSent: number;
  readonly lastActivityAt: number;
  readonly state: TransportLifecycleState;
}

/**
 * Outbound frame transmission options.
 */
export interface TransportSendOptions {
  /** Maximum time to wait for transmission before timing out (ms) */
  readonly timeoutMs?: number;
  /** Priority flag (e.g. bypass queue if urgent) */
  readonly urgent?: boolean;
  /** Desired MTU if packet needs further transport fragmentation */
  readonly overrideMtu?: number;
  /** Optional explicit destination endpoint for connectionless transports (e.g. UDP) */
  readonly destinationEndpoint?: TransportEndpoint;
}

/**
 * Transmission delivery receipt.
 */
export interface TransportDeliveryReceipt {
  readonly success: boolean;
  readonly packetId: string;
  readonly bytesTransmitted: number;
  readonly timestamp: number;
  readonly latencyMs?: number;
  readonly error?: string;
}

/**
 * Standardized transport error codes.
 */
export type TransportErrorCode =
  | 'ERR_TRANSPORT_BIND_FAILED'
  | 'ERR_TRANSPORT_CONNECT_TIMEOUT'
  | 'ERR_TRANSPORT_DISCONNECTED'
  | 'ERR_TRANSPORT_FRAME_CORRUPTED'
  | 'ERR_TRANSPORT_MTU_EXCEEDED'
  | 'ERR_TRANSPORT_RATE_LIMITED'
  | 'ERR_TRANSPORT_TLS_HANDSHAKE_FAILED'
  | 'ERR_TRANSPORT_UNSUPPORTED_ADAPTER'
  | 'ERR_TRANSPORT_INVALID_LIFECYCLE'
  | 'ERR_TRANSPORT_SOCKET_ERROR';

/**
 * Canonical Transport Error.
 */
export interface CanonicalTransportError {
  readonly code: TransportErrorCode;
  readonly message: string;
  readonly transportType: TransportType;
  readonly endpoint?: TransportEndpoint;
  readonly timestamp: number;
  readonly fatal: boolean;
  readonly cause?: string;
}

/**
 * Inbound packet receiver callback.
 */
export type InboundPacketHandler = (packet: CubiOPacket, session: TransportSession) => void;

/**
 * Transport error callback.
 */
export type TransportErrorHandler = (error: CanonicalTransportError) => void;

/**
 * Transport state change callback.
 */
export type TransportStateChangeHandler = (
  previousState: TransportLifecycleState,
  newState: TransportLifecycleState,
  reason: string
) => void;

/**
 * Canonical interface that every physical or logical transport driver must satisfy.
 */
export interface ITransportDriver {
  /** Identification */
  readonly transportType: TransportType;
  readonly localEndpoint: TransportEndpoint;
  readonly state: TransportLifecycleState;

  /** Lifecycle operations */
  initialize(endpoint: TransportEndpoint): Promise<void>;
  connect(remoteEndpoint: TransportEndpoint): Promise<TransportSession>;
  disconnect(reason?: string): Promise<void>;

  /** Transmission */
  sendPacket(packet: CubiOPacket, options?: TransportSendOptions): Promise<TransportDeliveryReceipt>;

  /** Event registration */
  onPacket(handler: InboundPacketHandler): void;
  onError(handler: TransportErrorHandler): void;
  onStateChange(handler: TransportStateChangeHandler): void;

  /** Telemetry & Metrics */
  getMetrics(): Readonly<{
    bytesSent: number;
    bytesReceived: number;
    packetsSent: number;
    packetsReceived: number;
    packetsDropped: number;
    errorsCount: number;
  }>;
}

export interface TransportMetrics {
  readonly bytesSent: number;
  readonly bytesReceived: number;
  readonly packetsSent: number;
  readonly packetsReceived: number;
  readonly packetsDropped: number;
  readonly errorsCount: number;
}

/**
 * Static and dynamic capabilities of a specific transport implementation.
 */
export interface TransportCapabilities {
  /** True if transport is connection-oriented (TCP, WS), false for datagrams (UDP) */
  readonly connectionOriented: boolean;
  /** True if transport guarantees underlying delivery (TCP, WS, IPC) */
  readonly reliable: boolean;
  /** True if transport guarantees sequential in-order packet delivery */
  readonly ordered: boolean;
  /** True if frames are atomic messages (UDP, WS, MEMORY) rather than continuous byte streams (TCP) */
  readonly messageOriented: boolean;
  /** True if transport supports subnet/multicast broadcast (UDP) */
  readonly supportsBroadcast: boolean;
  /** True if transport supports TLS/WSS encryption natively */
  readonly supportsTls: boolean;
  /** Maximum supported individual payload size in bytes */
  readonly maxPayloadBytes: number;
  /** Default recommended MTU for this transport */
  readonly defaultMtu: number;
}

/**
 * Unified canonical interface that every physical or logical transport adapter must satisfy.
 * Defines connect, listen, send, receive, close, state, errors, and transport capabilities.
 */
export interface ITransportAdapter {
  /** Identification & capabilities */
  readonly transportType: TransportType;
  readonly capabilities: TransportCapabilities;
  readonly localEndpoint: TransportEndpoint | undefined;
  readonly state: TransportLifecycleState;
  readonly metrics: TransportMetrics;

  /** Network server listener binding */
  listen(endpoint: TransportEndpoint): Promise<void>;

  /** Outbound peer connection */
  connect(remoteEndpoint: TransportEndpoint): Promise<TransportSession>;

  /** Outbound transmission of Phase 1 CubiOPacket */
  send(packet: CubiOPacket, options?: TransportSendOptions): Promise<TransportDeliveryReceipt>;

  /** Inbound packet handler subscription (returns unsubscribe function) */
  receive(handler: InboundPacketHandler): (() => void) | void;
  removeReceive?(handler: InboundPacketHandler): void;

  /** Clean teardown */
  close(reason?: string): Promise<void>;

  /** Event registration */
  onError(handler: TransportErrorHandler): (() => void) | void;
  removeError?(handler: TransportErrorHandler): void;
  onStateChange(handler: TransportStateChangeHandler): (() => void) | void;
  removeStateChange?(handler: TransportStateChangeHandler): void;
}

/**
 * Transport Manager specification for multiplexing multiple drivers.
 */
export interface ITransportManager {
  readonly activeTransports: ReadonlyMap<TransportType, ITransportDriver>;
  registerDriver(driver: ITransportDriver): void;
  getDriver(type: TransportType): ITransportDriver | undefined;
  routePacket(packet: CubiOPacket, destination: TransportEndpoint): Promise<TransportDeliveryReceipt>;
  shutdownAll(): Promise<void>;
}
