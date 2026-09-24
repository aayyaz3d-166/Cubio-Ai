/**
 * CUBiO Network Protocol v1 — Canonical Network State Model Types
 * ============================================================
 *
 * Formal state machine definitions across all 4 operational tiers:
 *   1. Network Cluster State  (Global mesh health and convergence)
 *   2. Node State             (Node process lifecycle)
 *   3. Connection State       (Peer-to-peer transport link lifecycle)
 *   4. Protocol Session State (Application/stream session lifecycle)
 *
 * INVARIANTS:
 *   1. All transitions are deterministic, explicit, and verified against a transition matrix.
 *   2. Invalid state transitions throw structured errors and are rejected without mutating state.
 *   3. Every state change produces an immutable state snapshot with deterministic hashing.
 *   4. State recovery procedures are explicit, verifiable, and bounded.
 *   5. Simulation state is strictly separated from production network state models.
 */

import { NodeLifecycleState } from './nodeTypes';

// Re-export NodeLifecycleState for centralized state access
export type { NodeLifecycleState };

// ─────────────────────────────────────────────────────────────────────────────
// 1. Network Cluster State Tier
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Global cluster/mesh network topology and health state.
 */
export type NetworkClusterState =
  | 'BOOTSTRAP'      // Seed nodes launching; cluster directory forming
  | 'FORMING'        // Initial discovery, peer handshakes, and route synthesis
  | 'CONVERGED'      // Normal steady-state; quorum maintained and all routes stable
  | 'DEGRADED'       // Partial node/link loss; quorum intact but capacity reduced
  | 'PARTITIONED'    // Split network or unreachable subnet detected; isolated mode
  | 'RECONFIGURING'  // Topology healing, route re-synthesis, or dynamic migration
  | 'HALTED';        // Emergency freeze, administrative shutdown, or critical safety lock

// ─────────────────────────────────────────────────────────────────────────────
// 2. Peer Connection State Tier
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Transport-level link state between two nodes.
 */
export type PeerConnectionState =
  | 'DISCONNECTED'   // No physical or virtual connection exists
  | 'CONNECTING'     // Transport connection attempt in progress
  | 'HANDSHAKING'    // Exchanging CNP/1.0 protocol handshake and identity proofs
  | 'ESTABLISHED'    // Verified, authenticated, active for packet transmission
  | 'DRAINING'       // Graceful disconnect initiated; in-flight packets flushing
  | 'CLOSING'        // Final socket teardown in progress
  | 'FAILED'         // Abrupt connection termination or auth failure
  | 'RECONNECTING';  // Exponential backoff reconnection in progress

// ─────────────────────────────────────────────────────────────────────────────
// 3. Protocol Session State Tier
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Higher-level protocol session state across an established connection.
 */
export type ProtocolSessionState =
  | 'IDLE'                 // Session allocated; awaiting version negotiation
  | 'VERSION_NEGOTIATING'  // Exchanging VERSION_NEGOTIATE envelopes (Task 01)
  | 'AUTHENTICATING'       // Verifying CUB-XXXXXXXX sovereign signatures (Task 01)
  | 'STREAMING'            // Active bidirectional message/packet streaming
  | 'PAUSED'               // Flow-control or backpressure pause
  | 'TERMINATED';          // Session cleanly closed or aborted

// ─────────────────────────────────────────────────────────────────────────────
// State Transition Logs & Recovery
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Audit record of an individual state transition.
 */
export interface StateTransitionRecord<TState extends string> {
  readonly transitionId: string;
  readonly entityId: string;
  readonly fromState: TState;
  readonly toState: TState;
  readonly reason: string;
  readonly timestamp: number;
  readonly triggeredBy?: string;
}

/**
 * State of a peer-to-peer connection link.
 */
export interface ConnectionStateRecord {
  readonly connectionId: string;
  readonly localNodeId: string;
  readonly remoteNodeId: string;
  readonly remoteCoordinateUri: string;
  readonly state: PeerConnectionState;
  readonly establishedAt?: number;
  readonly closedAt?: number;
  readonly retryCount: number;
  readonly maxRetries: number;
  readonly lastError?: string;
}

/**
 * State of a protocol session.
 */
export interface ProtocolSessionRecord {
  readonly sessionId: string;
  readonly connectionId: string;
  readonly negotiatedVersion?: string;
  readonly state: ProtocolSessionState;
  readonly authenticatedCubId?: string;
  readonly startedAt: number;
  readonly closedAt?: number;
  readonly lastActivityAt: number;
}

/**
 * Node state entry within the network state snapshot.
 */
export interface NodeStateRecord {
  readonly nodeId: string;
  readonly coordinateUri: string;
  readonly state: NodeLifecycleState;
  readonly lastHeartbeat: number;
  readonly healthScore: number; // 0..100
}

/**
 * Complete, immutable state snapshot of the canonical CUBiO network.
 */
export interface CanonicalNetworkStateSnapshot {
  readonly epoch: number;
  readonly timestamp: number;
  readonly clusterState: NetworkClusterState;
  readonly nodes: Readonly<Record<string, NodeStateRecord>>;
  readonly connections: Readonly<Record<string, ConnectionStateRecord>>;
  readonly sessions: Readonly<Record<string, ProtocolSessionRecord>>;
  readonly transitionHistory: readonly StateTransitionRecord<string>[];
  readonly stateHash: string;
}

/**
 * Error taxonomy for state transitions.
 */
export type StateErrorCode =
  | 'ERR_INVALID_TRANSITION'
  | 'ERR_ENTITY_NOT_FOUND'
  | 'ERR_DUPLICATE_ENTITY'
  | 'ERR_MAX_RETRIES_EXCEEDED'
  | 'ERR_STATE_CORRUPTED'
  | 'ERR_INCOMPATIBLE_STATE';

export interface StateTransitionError {
  readonly code: StateErrorCode;
  readonly message: string;
  readonly entityId?: string;
  readonly fromState?: string;
  readonly toState?: string;
}
