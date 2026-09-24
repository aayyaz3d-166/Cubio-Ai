/**
 * CUBiO Network Protocol v1 — Canonical Node Architecture Types
 * ============================================================
 *
 * Formal architectural contracts, interfaces, and state representations
 * for real network nodes (daemons, relays, gateways, edge units).
 *
 * ARCHITECTURAL BOUNDARY:
 *   - This module defines the INTERFACES and SPECIFICATIONS that real nodes must implement.
 *   - It explicitly isolates node architecture contracts from simulated in-memory networks.
 *   - Implementing these interfaces in TypeScript provides testable architectural validation
 *     without fabricating false claims of operational socket daemons.
 *
 * INVARIANTS:
 *   1. Every node must hold a verified identity bound to a sovereign owner (CUB-XXXXXXXX).
 *   2. Every node must hold a valid CNC coordinate (CUBIO://NETWORK/<dim>/<zone>/<node>/<svc>).
 *   3. Node lifecycle transitions must be deterministic and monotonic.
 *   4. Packets arriving at a node must be verified for integrity before routing or local dispatch.
 *   5. Nodes cannot route or forward packets unless granted the 'PACKET_ROUTING' capability.
 */

import { CubiOPacket } from './packetTypes';
import { CubiOMessage } from './messageTypes';

/**
 * Node operational roles within the CUBiO network hierarchy.
 */
export type NodeRole =
  | 'EDGE'      // Client-facing endpoint; local application terminal
  | 'RELAY'     // High-throughput packet routing and forwarding
  | 'COMPUTE'   // Dedicated to intelligence / spatial simulation execution
  | 'STORAGE'   // Content-addressable storage & state retention
  | 'GATEWAY'   // Ingress/egress bridge between network zones
  | 'CORE';     // Root coordination, coordinate allocation & directory

/**
 * Functional capabilities declared by a node.
 */
export type NodeCapability =
  | 'PACKET_ROUTING'           // Ability to forward packets not addressed to self
  | 'ENVELOPE_FORWARDING'      // Multi-hop envelope routing
  | 'MESSAGE_DISPATCH'         // Application message delivery
  | 'STORAGE_PERSISTENCE'      // Local database / persistent block storage
  | 'AI_INFERENCE_EXECUTION'   // Local neural / reasoning execution
  | 'STATE_SYNCHRONIZATION'    // Spatial delta synchronization (CRDT)
  | 'GATEWAY_TRANSIT'          // Protocol translation / boundary traversal
  | 'OBSERVABILITY_TELEMETRY'; // Metric collection and trace propagation

/**
 * Lifecycle states of an architectural node.
 *
 * State Machine:
 *   INITIALIZING ──▶ READY ──▶ ONLINE ──▶ DRAINING ──▶ STOPPED
 *        │             │          │           ▲
 *        ▼             ▼          ▼           │
 *     FAULTED       FAULTED    DEGRADED ──────┘
 */
export type NodeLifecycleState =
  | 'INITIALIZING'  // Bootstrapping configuration, validating identity
  | 'READY'         // Initialized, endpoints bound, awaiting start signal
  | 'ONLINE'        // Fully operational, accepting and forwarding traffic
  | 'DEGRADED'      // Operational with impaired capacity or failing peers
  | 'DRAINING'      // Rejecting new requests, completing active operations
  | 'STOPPED'       // Cleanly shut down, endpoints closed
  | 'FAULTED';      // Critical unrecoverable error

/**
 * Inbound listen endpoint descriptor.
 */
export interface NodeListenEndpoint {
  readonly protocol: 'TCP' | 'WEBSOCKET' | 'VIRTUAL';
  readonly host: string;
  readonly port: number;
  readonly tls: boolean;
}

/**
 * Cryptographic & operational identity of a canonical node.
 */
export interface CanonicalNodeIdentity {
  /** Deterministic node ID (e.g. "NODE_0x...") */
  readonly nodeId: string;
  /** Human-readable node name */
  readonly nodeName: string;
  /** Canonical CNC coordinate */
  readonly coordinateUri: string;
  /** Sovereign administrator / owner identity (CUB-XXXXXXXX) */
  readonly ownerCubId: string;
  /** Node operational role */
  readonly role: NodeRole;
  /** Cryptographic public key */
  readonly publicKey: string;
  /** Optional hardware fingerprint / attestation */
  readonly hardwareFingerprint?: string;
}

/**
 * Operational configuration for a node.
 */
export interface CanonicalNodeConfig {
  /** Node identity */
  readonly identity: CanonicalNodeIdentity;
  /** Declared listen endpoints */
  readonly listenEndpoints: readonly NodeListenEndpoint[];
  /** Maximum Transmission Unit (bytes) */
  readonly mtu: number;
  /** Maximum concurrent peer connections */
  readonly maxConcurrentPeers: number;
  /** Heartbeat keep-alive interval (ms) */
  readonly heartbeatIntervalMs: number;
  /** Storage quota allocation (bytes) */
  readonly storageQuotaBytes: number;
  /** Inbound packet rate limit (packets per minute) */
  readonly rateLimitPerMinute: number;
  /** Declared capabilities */
  readonly capabilities: readonly NodeCapability[];
  /** Routing dispatch policy */
  readonly routingPolicy: 'STRICT_COORDINATE' | 'DIRECT_ONLY';
}

/**
 * Real-time operational telemetry for a node.
 */
export interface NodeTelemetry {
  readonly uptimeMs: number;
  readonly connectedPeersCount: number;
  readonly packetsReceived: number;
  readonly packetsSent: number;
  readonly packetsForwarded: number;
  readonly packetsDropped: number;
  readonly messagesProcessed: number;
  readonly bytesReceived: number;
  readonly bytesSent: number;
  readonly errorsCount: number;
  readonly healthStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
}

/**
 * Result of a node processing an incoming packet.
 */
export interface NodePacketProcessingResult {
  readonly action: 'TERMINATED_LOCAL' | 'FORWARDED' | 'DROPPED' | 'REJECTED';
  readonly reason?: string;
  readonly packetId: string;
  readonly targetService?: string;
  readonly nextHopUri?: string;
}

/**
 * Generic node service interface that can register with a node.
 */
export interface INodeService {
  readonly serviceId: string;
  readonly serviceType: string;
  readonly coordinateUri: string;
  handleMessage(message: CubiOMessage): Promise<CubiOMessage | void> | CubiOMessage | void;
}

/**
 * Canonical Node Interface.
 * Real daemon processes or mock nodes implement this authoritative interface.
 */
export interface INetworkNode {
  readonly identity: CanonicalNodeIdentity;
  readonly config: CanonicalNodeConfig;
  readonly lifecycleState: NodeLifecycleState;
  readonly telemetry: NodeTelemetry;

  /** Lifecycle controls */
  start(): void;
  stop(graceful?: boolean): void;
  transitionState(nextState: NodeLifecycleState, reason: string): void;

  /** Capability checks */
  hasCapability(capability: NodeCapability): boolean;

  /** Service management */
  registerService(service: INodeService): void;
  unregisterService(serviceId: string): boolean;
  hasService(serviceId: string): boolean;
  getServices(): readonly INodeService[];

  /** Protocol responsibilities */
  processInboundPacket(packet: CubiOPacket): NodePacketProcessingResult;
  dispatchOutboundMessage(message: CubiOMessage): readonly CubiOPacket[];
}

/**
 * Node configuration validation error codes.
 */
export type NodeConfigErrorCode =
  | 'ERR_INVALID_NODE_ID'
  | 'ERR_INVALID_COORDINATE'
  | 'ERR_INVALID_OWNER_ID'
  | 'ERR_INVALID_ROLE'
  | 'ERR_INVALID_MTU'
  | 'ERR_INVALID_PEER_LIMIT'
  | 'ERR_INVALID_ENDPOINT'
  | 'ERR_MISSING_CAPABILITIES'
  | 'ERR_MALFORMED_CONFIG';

export interface NodeConfigValidationError {
  readonly code: NodeConfigErrorCode;
  readonly message: string;
  readonly field?: string;
}

export interface NodeConfigValidationResult {
  readonly valid: boolean;
  readonly errors: readonly NodeConfigValidationError[];
}
