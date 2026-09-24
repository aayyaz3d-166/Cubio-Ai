/**
 * CUBiO AI — Real Transport Layer Constants
 * =========================================
 *
 * Authoritative registry of all transport layer network constants, default ports,
 * framing limits, timeout bounds, and connection parameters.
 */

import { PROTOCOL_LIMITS } from '../protocol/v1/constants';

function deepFreeze<T extends object>(obj: T): Readonly<T> {
  Object.freeze(obj);
  for (const key of Object.getOwnPropertyNames(obj)) {
    const val = (obj as any)[key];
    if (val !== null && typeof val === 'object' && !Object.isFrozen(val)) {
      deepFreeze(val);
    }
  }
  return obj;
}

export const CUBIO_TRANSPORT_CONSTANTS = deepFreeze({
  /** Wire Frame Identification */
  FRAME: {
    /** 6-byte Wire frame magic header prefix: 'CUBTR1' */
    MAGIC: 'CUBTR1',
    /** Wire frame header byte length: 4 bytes length prefix + 6 bytes magic */
    HEADER_SIZE_BYTES: 10,
    /** Minimum frame payload size */
    MIN_FRAME_BYTES: 32,
    /** Maximum wire frame size: aligned with Phase 1 MAX_PACKET_BYTES */
    MAX_FRAME_BYTES: PROTOCOL_LIMITS.MAX_PACKET_BYTES, // 65,536 bytes
  },

  /** Default Port Allocations */
  PORTS: {
    /** Default UDP port for spatial telemetry and low-latency datagrams */
    DEFAULT_UDP: 3690,
    /** Default TCP port for reliable stream framing and state synchronization */
    DEFAULT_TCP: 3691,
    /** Default WebSocket port for web clients and browser edge gateways */
    DEFAULT_WS: 3692,
    /** Default IPC Pipe path prefix */
    DEFAULT_IPC_PREFIX: '\\\\.\\pipe\\cubio-transport',
  },

  /** Timeouts & Liveness Windows (milliseconds) */
  TIMEOUTS: {
    /** Default connection establishment timeout */
    CONNECT_TIMEOUT_MS: 5_000,
    /** Default socket read/write inactivity timeout */
    INACTIVITY_TIMEOUT_MS: 30_000,
    /** Transport heartbeat / keepalive ping interval */
    HEARTBEAT_INTERVAL_MS: 10_000,
    /** Heartbeat missed ack threshold before declaring DEGRADED */
    MISSED_HEARTBEATS_DEGRADED: 2,
    /** Heartbeat missed ack threshold before declaring FAULTED / DISCONNECTED */
    MISSED_HEARTBEATS_FAULTED: 4,
  },

  /** Exponential Backoff & Reconnection Policy */
  RECONNECT: {
    /** Initial retry delay */
    INITIAL_BACKOFF_MS: 500,
    /** Maximum retry delay cap */
    MAX_BACKOFF_MS: 30_000,
    /** Backoff multiplier */
    BACKOFF_MULTIPLIER: 2.0,
    /** Maximum consecutive reconnection attempts before FAULTED */
    MAX_RETRY_ATTEMPTS: 5,
    /** Random jitter factor (+/- 15%) */
    JITTER_FACTOR: 0.15,
  },

  /** Rate Limiting & DoS Mitigation Thresholds */
  SECURITY: {
    /** Maximum packets per second allowed per individual endpoint */
    MAX_PACKETS_PER_SEC: 1_000,
    /** Maximum bandwidth bytes per second allowed per endpoint (4 MB/s) */
    MAX_BYTES_PER_SEC: 4_194_304,
    /** Maximum pending outbound queue size before backpressure rejection */
    MAX_OUTBOUND_QUEUE_PACKETS: 10_000,
  },
});

export const {
  FRAME: TRANSPORT_FRAME_CONSTANTS,
  PORTS: TRANSPORT_PORTS,
  TIMEOUTS: TRANSPORT_TIMEOUTS,
  RECONNECT: TRANSPORT_RECONNECT,
  SECURITY: TRANSPORT_SECURITY,
} = CUBIO_TRANSPORT_CONSTANTS;
