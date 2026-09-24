/**
 * CUBiO Network Protocol v1 — Canonical Protocol Constants Registry
 * ============================================================
 *
 * Centralized, immutable, typed registry of all CUBiO Network Protocol (CNP/1.0)
 * identifiers, coordinate bounds, payload limits, packet framing constants,
 * version tuples, lifecycle states, and error taxonomies.
 *
 * RECONCILIATION EVIDENCE:
 *   - Reconciles CNC coordinate bounds from NET-00 (`coordinate.ts`).
 *   - Reconciles envelope framing and limits from CNP/1.0 (`types.ts`, Task 01).
 *   - Reconciles wire packet bounds from packet model (`packetTypes.ts`, Task 02).
 *   - Reconciles message thresholds from message model (`messageTypes.ts`, Task 03).
 *   - Reconciles node architecture limits from node model (`nodeTypes.ts`, Task 04).
 *   - Reconciles state taxonomy from state model (`stateTypes.ts`, Task 05).
 *   - Reconciles semantic version boundaries from version subsystem (`versionTypes.ts`, Task 06).
 *
 * PROTECTION:
 *   All constant objects and nested collections are deeply frozen (`Object.freeze`)
 *   and strictly typed with `as const` to guarantee immutability at runtime.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Deep Freeze Helper
// ─────────────────────────────────────────────────────────────────────────────

function deepFreeze<T>(obj: T): Readonly<T> {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  Object.freeze(obj);
  for (const key of Object.keys(obj)) {
    const val = (obj as any)[key];
    if (val !== null && typeof val === 'object' && !Object.isFrozen(val)) {
      deepFreeze(val);
    }
  }
  return obj;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Protocol Identifiers
// ─────────────────────────────────────────────────────────────────────────────

export const PROTOCOL_IDENTIFIERS = deepFreeze({
  /** Canonical protocol scheme prefix */
  CNP_SCHEME: 'CNP',
  /** Scheme prefix for CNC addressing URIs */
  CNC_SCHEME_PREFIX: 'CUBIO://NETWORK/',
  /** Magic 4-character ASCII / byte header identifying CUBiO wire packets (0x43554231) */
  PACKET_MAGIC: 'CUB1',
  /** Canonical protocol specification string */
  PROTOCOL_VERSION_STRING: 'CNP/1.0',
  /** Canonical SemVer version string with patch level */
  CANONICAL_SEMVER_STRING: 'CNP/1.0.0',
  /** Sovereign identity string prefix */
  SOVEREIGN_ID_PREFIX: 'CUB-',
  /** Message ID prefix */
  MESSAGE_ID_PREFIX: 'MSG_',
  /** Envelope ID prefix */
  ENVELOPE_ID_PREFIX: 'ENV_',
  /** Packet ID prefix */
  PACKET_ID_PREFIX: 'PKT_',
  /** Node ID prefix */
  NODE_ID_PREFIX: 'NODE_',
  /** State Transition ID prefix */
  TRANSITION_ID_PREFIX: 'TR_',
} as const);

// ─────────────────────────────────────────────────────────────────────────────
// 2. Coordinate System Bounds (CNC / NET-00)
// ─────────────────────────────────────────────────────────────────────────────

export const COORDINATE_BOUNDS = deepFreeze({
  /** Minimum dimension index */
  MIN_DIMENSION: 0,
  /** Maximum dimension index */
  MAX_DIMENSION: 99,
  /** Minimum zone index */
  MIN_ZONE: 0,
  /** Maximum zone index */
  MAX_ZONE: 99,
  /** Zone zero-padding character count in canonical URI */
  ZONE_PADDING: 2,
  /** Minimum node index */
  MIN_NODE: 0,
  /** Maximum node index */
  MAX_NODE: 99999,
  /** Node zero-padding character count in canonical URI */
  NODE_PADDING: 5,
  /** Number of path segments in a canonical CNC URI (<dim>/<zone>/<node>/<service>) */
  SEGMENT_COUNT: 4,
} as const);

// ─────────────────────────────────────────────────────────────────────────────
// 3. Regular Expression Patterns
// ─────────────────────────────────────────────────────────────────────────────

export const PROTOCOL_PATTERNS = deepFreeze({
  /** Sovereign entity identity format (e.g. CUB-A1B2C3D4) */
  SOVEREIGN_CUB_ID: /^CUB-[A-Z0-9]{8}$/,
  /** Service identifier token format */
  SERVICE_IDENTIFIER: /^[A-Z0-9_-]+$/,
  /** Semantic version format with optional patch and pre-release */
  SEMVER_PATTERN: /^(\d+)\.(\d+)(?:\.(\d+))?(?:-([a-zA-Z0-9_.-]+))?$/,
  /** Strict CNC URI matching pattern */
  CNC_URI_PATTERN: /^CUBIO:\/\/NETWORK\/\d+\/\d{2}\/\d{5}\/[A-Z0-9_-]+$/i,
} as const);

// ─────────────────────────────────────────────────────────────────────────────
// 4. Protocol Transmission & Payload Limits
// ─────────────────────────────────────────────────────────────────────────────

export const PROTOCOL_LIMITS = deepFreeze({
  /** Maximum payload size in bytes for a ProtocolEnvelope (64 KB) */
  MAX_ENVELOPE_PAYLOAD_BYTES: 65_536,
  /** Maximum payload size in bytes for a CubiOMessage (64 KB) */
  MAX_MESSAGE_PAYLOAD_BYTES: 65_536,
  /** Absolute maximum size in bytes for an individual CubiOPacket frame (64 KB) */
  MAX_PACKET_BYTES: 65_536,
  /** Default Maximum Transmission Unit for packet payloads */
  DEFAULT_PACKET_MTU: 1_400,
  /** Minimum viable MTU for packet chunking */
  MIN_PACKET_MTU: 128,
  /** Maximum hops in an envelope trace route before loop/drop */
  MAX_TRACE_HOPS: 16,
  /** Absolute maximum envelope TTL in milliseconds (5 minutes) */
  MAX_ENVELOPE_TTL_MS: 300_000,
  /** Default envelope TTL in milliseconds (30 seconds) */
  DEFAULT_ENVELOPE_TTL_MS: 30_000,
  /** Default application message TTL in milliseconds (5 minutes) */
  DEFAULT_MESSAGE_TTL_MS: 300_000,
  /** Maximum 8-bit packet hop TTL */
  MAX_PACKET_TTL: 255,
  /** Default 8-bit packet hop TTL */
  DEFAULT_PACKET_TTL: 64,
  /** 32-bit unsigned maximum sequence number */
  MAX_SEQUENCE_NUMBER: 4_294_967_295,
  /** Default maximum connection retry backoff count */
  DEFAULT_MAX_RETRIES: 3,
} as const);

// ─────────────────────────────────────────────────────────────────────────────
// 5. Semantic Version Tuples
// ─────────────────────────────────────────────────────────────────────────────

export const PROTOCOL_VERSIONS = deepFreeze({
  /** Authoritative current protocol version */
  CURRENT: { major: 1, minor: 0, patch: 0 },
  /** Minimum compatible protocol version accepted by this runtime */
  MINIMUM_SUPPORTED: { major: 1, minor: 0, patch: 0 },
  /** Maximum protocol version ceiling supported by this runtime */
  MAXIMUM_SUPPORTED: { major: 1, minor: 99, patch: 999 },
} as const);

// ─────────────────────────────────────────────────────────────────────────────
// 6. Packet Control Flags
// ─────────────────────────────────────────────────────────────────────────────

export const PACKET_FLAG_REGISTRY = deepFreeze({
  NONE: 0x00,
  ACK: 0x01,          // Acknowledging receipt of prior packet
  SYN: 0x02,          // Synchronization / connection establishment intent
  FIN: 0x04,          // Final packet / graceful shutdown intent
  RST: 0x08,          // Reset connection intent
  FRAG: 0x10,         // Packet is a fragment of a larger envelope
  LAST_FRAG: 0x20,    // Final fragment of a fragmented sequence
  COMPRESSED: 0x40,   // Payload data is compressed
  ENCRYPTED: 0x80,    // Payload data is encrypted
} as const);

// ─────────────────────────────────────────────────────────────────────────────
// 7. Node Operational Defaults
// ─────────────────────────────────────────────────────────────────────────────

export const NODE_DEFAULTS = deepFreeze({
  /** Default listen port for CUBiO protocol daemons */
  DEFAULT_PORT: 3690,
  /** Default local loopback listen host */
  DEFAULT_HOST: '127.0.0.1',
  /** Default maximum concurrent peer connections */
  DEFAULT_MAX_PEERS: 64,
  /** Default node keepalive heartbeat interval (15 seconds) */
  DEFAULT_HEARTBEAT_MS: 15_000,
  /** Default storage quota per node (100 MB) */
  DEFAULT_STORAGE_QUOTA_BYTES: 104_857_600,
  /** Default rate limit in packets per minute */
  DEFAULT_RATE_LIMIT_PER_MIN: 600,
  /** Health score threshold below which a node is marked DEGRADED */
  DEGRADED_HEALTH_THRESHOLD: 80,
} as const);

// ─────────────────────────────────────────────────────────────────────────────
// 8. State Enumerations
// ─────────────────────────────────────────────────────────────────────────────

export const NETWORK_STATE_ENUMS = deepFreeze({
  CLUSTER_STATES: [
    'BOOTSTRAP',
    'FORMING',
    'CONVERGED',
    'DEGRADED',
    'PARTITIONED',
    'RECONFIGURING',
    'HALTED',
  ],
  NODE_STATES: [
    'INITIALIZING',
    'READY',
    'ONLINE',
    'DEGRADED',
    'DRAINING',
    'STOPPED',
    'FAULTED',
  ],
  CONNECTION_STATES: [
    'DISCONNECTED',
    'CONNECTING',
    'HANDSHAKING',
    'ESTABLISHED',
    'DRAINING',
    'CLOSING',
    'FAILED',
    'RECONNECTING',
  ],
  SESSION_STATES: [
    'IDLE',
    'VERSION_NEGOTIATING',
    'AUTHENTICATING',
    'STREAMING',
    'PAUSED',
    'TERMINATED',
  ],
  MESSAGE_STATES: [
    'DRAFT',
    'QUEUED',
    'IN_TRANSIT',
    'DELIVERED',
    'READ',
    'REJECTED',
    'FAILED',
    'EXPIRED',
  ],
} as const);

// ─────────────────────────────────────────────────────────────────────────────
// 9. Consolidated Master Constants Registry
// ─────────────────────────────────────────────────────────────────────────────

export const CUBIO_NETWORK_CONSTANTS = deepFreeze({
  IDENTIFIERS: PROTOCOL_IDENTIFIERS,
  COORDINATES: COORDINATE_BOUNDS,
  PATTERNS: PROTOCOL_PATTERNS,
  LIMITS: PROTOCOL_LIMITS,
  VERSIONS: PROTOCOL_VERSIONS,
  FLAGS: PACKET_FLAG_REGISTRY,
  NODE: NODE_DEFAULTS,
  STATES: NETWORK_STATE_ENUMS,
} as const);

export type CubiONetworkConstantsRegistry = typeof CUBIO_NETWORK_CONSTANTS;
