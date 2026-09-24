/**
 * CUBiO AI — Canonical Connection Lifecycle Types
 * =================================================
 *
 * Defines the connection states, transition rules, lifecycle events,
 * and management interfaces for CUBiO network connections across
 * all physical and logical transports (UDP, TCP, WebSocket, IPC).
 */

import {
  TransportType,
  TransportEndpoint,
  ITransportAdapter,
  TransportDeliveryReceipt,
  TransportSendOptions,
} from './types';
import { CubiOPacket } from '../protocol/v1/packetTypes';

/**
 * Canonical CUBiO Connection Lifecycle States.
 *
 * State Machine:
 *
 *               ┌───────────────────────────────────────────────┐
 *               │                                               ▼
 *  CONNECTING ──┴──▶ CONNECTED ──(inactivity / missed ack)──▶ DEGRADED
 *      │                 │   ▲                                  │
 *      │                 │   │──(resumed activity / recovery)───┘
 *      │                 │
 *      │(failure)        │(orderly close)
 *      │                 │
 *      ▼                 ▼
 *    FAILED ◄───────── CLOSING ──(cleanup complete)──────────▶ CLOSED
 *      │                 ▲                                       ▲
 *      │                 │                                       │
 *      └─────────────────┴───────────────────────────────────────┘
 *
 * Note: CLOSED is strictly terminal. No transitions out of CLOSED are permitted.
 */
export type ConnectionState =
  | 'CONNECTING'
  | 'CONNECTED'
  | 'DEGRADED'
  | 'CLOSING'
  | 'CLOSED'
  | 'FAILED';

/**
 * Authoritative transition matrix for connection lifecycle.
 */
export const PERMITTED_CONNECTION_TRANSITIONS: ReadonlyMap<
  ConnectionState,
  ReadonlySet<ConnectionState>
> = new Map([
  [
    'CONNECTING',
    new Set<ConnectionState>(['CONNECTED', 'FAILED', 'CLOSING', 'CLOSED']),
  ],
  [
    'CONNECTED',
    new Set<ConnectionState>(['DEGRADED', 'CLOSING', 'CLOSED', 'FAILED']),
  ],
  [
    'DEGRADED',
    new Set<ConnectionState>(['CONNECTED', 'CLOSING', 'CLOSED', 'FAILED']),
  ],
  [
    'CLOSING',
    new Set<ConnectionState>(['CLOSED', 'FAILED']),
  ],
  [
    'FAILED',
    new Set<ConnectionState>(['CLOSING', 'CLOSED']),
  ],
  [
    'CLOSED',
    new Set<ConnectionState>([]), // Terminal state: strictly no permitted transitions
  ],
]);

/**
 * Thrown when an illegal connection state transition is attempted.
 */
export class IllegalConnectionTransitionError extends Error {
  public readonly connectionId: string;
  public readonly fromState: ConnectionState;
  public readonly toState: ConnectionState;

  constructor(
    connectionId: string,
    fromState: ConnectionState,
    toState: ConnectionState,
    context?: string
  ) {
    const allowed = PERMITTED_CONNECTION_TRANSITIONS.get(fromState);
    const allowedStr = allowed && allowed.size > 0 ? Array.from(allowed).join(', ') : 'NONE (TERMINAL)';
    super(
      `Illegal connection state transition for '${connectionId}': '${fromState}' -> '${toState}'. ` +
      `Permitted next states: [${allowedStr}]. ${context ? `Context: ${context}` : ''}`
    );
    this.name = 'IllegalConnectionTransitionError';
    this.connectionId = connectionId;
    this.fromState = fromState;
    this.toState = toState;
  }
}

/**
 * Public immutable descriptor of an active or terminated managed connection.
 */
export interface ManagedConnection {
  readonly connectionId: string;
  readonly transportType: TransportType;
  readonly localEndpoint?: TransportEndpoint;
  readonly remoteEndpoint: TransportEndpoint;
  readonly adapter: ITransportAdapter;
  readonly state: ConnectionState;
  readonly createdAt: number;
  readonly connectedAt?: number;
  readonly closedAt?: number;
  readonly lastActivityAt: number;
  readonly bytesSent: number;
  readonly bytesReceived: number;
  readonly packetsSent: number;
  readonly packetsReceived: number;
  readonly failureReason?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/**
 * Options configuring the Connection Lifecycle Manager.
 */
export interface ConnectionLifecycleManagerOptions {
  /** Inactivity threshold in ms before declaring DEGRADED. Default: 20,000 ms */
  readonly staleTimeoutMs?: number;
  /** Inactivity threshold in ms before declaring FAILED and terminating. Default: 40,000 ms */
  readonly failureTimeoutMs?: number;
  /** Optional background sweep interval in ms (0 or undefined = manual sweep). Default: 0 */
  readonly sweepIntervalMs?: number;
  /** Max concurrent active connections. Default: 1,024 */
  readonly maxConnections?: number;
}

/**
 * Telemetry and accounting metrics for connection lifecycle.
 */
export interface ConnectionLifecycleMetrics {
  readonly totalCreated: number;
  readonly activeCount: number;
  readonly connectingCount: number;
  readonly connectedCount: number;
  readonly degradedCount: number;
  readonly closingCount: number;
  readonly closedCount: number;
  readonly failedCount: number;
  readonly totalBytesSent: number;
  readonly totalBytesReceived: number;
  readonly totalPacketsSent: number;
  readonly totalPacketsReceived: number;
  readonly staleDegradedEvents: number;
  readonly staleFailedEvents: number;
  readonly duplicateCloseAttempts: number;
}

/**
 * Event callbacks emitted by the Connection Lifecycle Manager.
 */
export type ConnectionStateChangeHandler = (
  conn: ManagedConnection,
  prevState: ConnectionState,
  nextState: ConnectionState,
  reason: string
) => void;

export type ConnectionPacketHandler = (
  conn: ManagedConnection,
  packet: CubiOPacket
) => void;

export type ConnectionClosedHandler = (
  conn: ManagedConnection,
  reason: string
) => void;

export type ConnectionDegradedHandler = (
  conn: ManagedConnection,
  reason: string
) => void;

export type ConnectionFailedHandler = (
  conn: ManagedConnection,
  reason: string
) => void;
