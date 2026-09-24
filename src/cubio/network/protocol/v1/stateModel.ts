/**
 * CUBiO Network Protocol v1 — Canonical Network State Model Engine
 * ============================================================
 *
 * Implements deterministic state management, explicit transition validation,
 * state recovery procedures, and serialization across all four network state tiers.
 *
 * REUSED SYSTEMS:
 *   - deterministicHash (src/cubio/state/determinism.ts)
 *   - CubiONetworkCoordinateEngine (src/cubio/network/coordinate/coordinate.ts)
 *   - NodeLifecycleState (src/cubio/network/protocol/v1/nodeTypes.ts)
 */

import { deterministicHash } from '../../../state/determinism';
import { CubiONetworkCoordinateEngine } from '../../coordinate/coordinate';
import {
  type NetworkClusterState,
  type PeerConnectionState,
  type ProtocolSessionState,
  type NodeLifecycleState,
  type StateTransitionRecord,
  type NodeStateRecord,
  type ConnectionStateRecord,
  type ProtocolSessionRecord,
  type CanonicalNetworkStateSnapshot,
} from './stateTypes';

// ─────────────────────────────────────────────────────────────────────────────
// Permitted State Transition Matrices
// ─────────────────────────────────────────────────────────────────────────────

export const CLUSTER_TRANSITIONS: ReadonlyMap<NetworkClusterState, ReadonlySet<NetworkClusterState>> = new Map([
  ['BOOTSTRAP',     new Set<NetworkClusterState>(['FORMING', 'HALTED'])],
  ['FORMING',       new Set<NetworkClusterState>(['CONVERGED', 'DEGRADED', 'HALTED'])],
  ['CONVERGED',     new Set<NetworkClusterState>(['DEGRADED', 'PARTITIONED', 'RECONFIGURING', 'HALTED'])],
  ['DEGRADED',      new Set<NetworkClusterState>(['CONVERGED', 'PARTITIONED', 'RECONFIGURING', 'HALTED'])],
  ['PARTITIONED',   new Set<NetworkClusterState>(['RECONFIGURING', 'HALTED'])],
  ['RECONFIGURING', new Set<NetworkClusterState>(['CONVERGED', 'DEGRADED', 'HALTED'])],
  ['HALTED',        new Set<NetworkClusterState>(['BOOTSTRAP'])],
]);

export const NODE_TRANSITIONS: ReadonlyMap<NodeLifecycleState, ReadonlySet<NodeLifecycleState>> = new Map([
  ['INITIALIZING', new Set<NodeLifecycleState>(['READY', 'FAULTED'])],
  ['READY',        new Set<NodeLifecycleState>(['ONLINE', 'STOPPED', 'FAULTED'])],
  ['ONLINE',       new Set<NodeLifecycleState>(['DEGRADED', 'DRAINING', 'STOPPED', 'FAULTED'])],
  ['DEGRADED',     new Set<NodeLifecycleState>(['ONLINE', 'DRAINING', 'STOPPED', 'FAULTED'])],
  ['DRAINING',     new Set<NodeLifecycleState>(['STOPPED', 'FAULTED'])],
  ['STOPPED',      new Set<NodeLifecycleState>(['READY'])],
  ['FAULTED',      new Set<NodeLifecycleState>(['INITIALIZING'])],
]);

export const CONNECTION_TRANSITIONS: ReadonlyMap<PeerConnectionState, ReadonlySet<PeerConnectionState>> = new Map([
  ['DISCONNECTED', new Set<PeerConnectionState>(['CONNECTING'])],
  ['CONNECTING',   new Set<PeerConnectionState>(['HANDSHAKING', 'FAILED', 'DISCONNECTED'])],
  ['HANDSHAKING',  new Set<PeerConnectionState>(['ESTABLISHED', 'FAILED'])],
  ['ESTABLISHED',  new Set<PeerConnectionState>(['DRAINING', 'FAILED', 'CLOSING'])],
  ['DRAINING',     new Set<PeerConnectionState>(['CLOSING', 'FAILED'])],
  ['CLOSING',      new Set<PeerConnectionState>(['DISCONNECTED'])],
  ['FAILED',       new Set<PeerConnectionState>(['RECONNECTING', 'DISCONNECTED'])],
  ['RECONNECTING', new Set<PeerConnectionState>(['CONNECTING', 'FAILED', 'DISCONNECTED'])],
]);

export const SESSION_TRANSITIONS: ReadonlyMap<ProtocolSessionState, ReadonlySet<ProtocolSessionState>> = new Map([
  ['IDLE',                new Set<ProtocolSessionState>(['VERSION_NEGOTIATING', 'TERMINATED'])],
  ['VERSION_NEGOTIATING', new Set<ProtocolSessionState>(['AUTHENTICATING', 'TERMINATED'])],
  ['AUTHENTICATING',      new Set<ProtocolSessionState>(['STREAMING', 'TERMINATED'])],
  ['STREAMING',           new Set<ProtocolSessionState>(['PAUSED', 'TERMINATED'])],
  ['PAUSED',              new Set<ProtocolSessionState>(['STREAMING', 'TERMINATED'])],
  ['TERMINATED',          new Set<ProtocolSessionState>()],
]);

// ─────────────────────────────────────────────────────────────────────────────
// State Checksum & Hash Computation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Computes deterministic content-addressable hash over a network snapshot.
 */
export function computeNetworkStateHash(
  snapshot: Omit<CanonicalNetworkStateSnapshot, 'stateHash'>
): string {
  const sortedNodes = Object.keys(snapshot.nodes)
    .sort()
    .map(id => `${id}:${snapshot.nodes[id].state}:${snapshot.nodes[id].healthScore}`)
    .join(';');

  const sortedConns = Object.keys(snapshot.connections)
    .sort()
    .map(id => `${id}:${snapshot.connections[id].state}:${snapshot.connections[id].retryCount}`)
    .join(';');

  const sortedSessions = Object.keys(snapshot.sessions)
    .sort()
    .map(id => `${id}:${snapshot.sessions[id].state}:${snapshot.sessions[id].negotiatedVersion ?? ''}`)
    .join(';');

  const raw = [
    snapshot.epoch.toString(),
    snapshot.clusterState,
    sortedNodes,
    sortedConns,
    sortedSessions,
  ].join('|');

  return `0xNET_${deterministicHash(raw).slice(2, 18)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Canonical Network State Model Class
// ─────────────────────────────────────────────────────────────────────────────

export class CanonicalNetworkStateModel {
  private _epoch: number = 0;
  private _clusterState: NetworkClusterState = 'BOOTSTRAP';
  private _nodes: Map<string, NodeStateRecord> = new Map();
  private _connections: Map<string, ConnectionStateRecord> = new Map();
  private _sessions: Map<string, ProtocolSessionRecord> = new Map();
  private _history: StateTransitionRecord<string>[] = [];

  constructor(initialClusterState: NetworkClusterState = 'BOOTSTRAP') {
    this._clusterState = initialClusterState;
  }

  public get epoch(): number {
    return this._epoch;
  }

  public get clusterState(): NetworkClusterState {
    return this._clusterState;
  }

  /**
   * Generates a frozen, deterministic snapshot of current state.
   */
  public getSnapshot(): CanonicalNetworkStateSnapshot {
    const nodesObj: Record<string, NodeStateRecord> = {};
    this._nodes.forEach((record, id) => {
      nodesObj[id] = Object.freeze({ ...record });
    });

    const connsObj: Record<string, ConnectionStateRecord> = {};
    this._connections.forEach((record, id) => {
      connsObj[id] = Object.freeze({ ...record });
    });

    const sessionsObj: Record<string, ProtocolSessionRecord> = {};
    this._sessions.forEach((record, id) => {
      sessionsObj[id] = Object.freeze({ ...record });
    });

    const base = {
      epoch: this._epoch,
      timestamp: Date.now(),
      clusterState: this._clusterState,
      nodes: Object.freeze(nodesObj),
      connections: Object.freeze(connsObj),
      sessions: Object.freeze(sessionsObj),
      transitionHistory: Object.freeze([...this._history]),
    };

    const stateHash = computeNetworkStateHash(base);

    return Object.freeze({
      ...base,
      stateHash,
    });
  }

  // ─── 1. Cluster State Transitions ──────────────────────────────────────────

  public transitionClusterState(nextState: NetworkClusterState, reason: string): void {
    const allowed = CLUSTER_TRANSITIONS.get(this._clusterState);
    if (!allowed || !allowed.has(nextState)) {
      throw new Error(
        `Invalid cluster state transition: '${this._clusterState}' → '${nextState}'. ` +
        `Reason: ${reason}. Allowed: [${allowed ? Array.from(allowed).join(', ') : 'NONE'}].`
      );
    }

    this.recordTransition('CLUSTER', this._clusterState, nextState, reason);
    this._clusterState = nextState;
    this._epoch++;
  }

  // ─── 2. Node State Transitions ─────────────────────────────────────────────

  public registerNode(nodeId: string, coordinateUri: string, initialHealth: number = 100): void {
    if (this._nodes.has(nodeId)) {
      throw new Error(`Node '${nodeId}' already registered.`);
    }

    const coordVal = CubiONetworkCoordinateEngine.tryParse(coordinateUri);
    if (!coordVal.isValid) {
      throw new Error(`Invalid node coordinate: ${coordVal.errors[0]?.message}`);
    }

    this._nodes.set(nodeId, {
      nodeId,
      coordinateUri,
      state: 'INITIALIZING',
      lastHeartbeat: Date.now(),
      healthScore: initialHealth,
    });
    this._epoch++;
  }

  public transitionNodeState(nodeId: string, nextState: NodeLifecycleState, reason: string): void {
    const node = this._nodes.get(nodeId);
    if (!node) {
      throw new Error(`Node '${nodeId}' not found in state model.`);
    }

    const allowed = NODE_TRANSITIONS.get(node.state);
    if (!allowed || !allowed.has(nextState)) {
      throw new Error(
        `Invalid node state transition for '${nodeId}': '${node.state}' → '${nextState}'. ` +
        `Reason: ${reason}. Allowed: [${allowed ? Array.from(allowed).join(', ') : 'NONE'}].`
      );
    }

    this.recordTransition(nodeId, node.state, nextState, reason);
    this._nodes.set(nodeId, {
      ...node,
      state: nextState,
      lastHeartbeat: Date.now(),
    });
    this._epoch++;
  }

  public updateNodeHeartbeat(nodeId: string, healthScore: number = 100): void {
    const node = this._nodes.get(nodeId);
    if (!node) throw new Error(`Node '${nodeId}' not found.`);

    this._nodes.set(nodeId, {
      ...node,
      lastHeartbeat: Date.now(),
      healthScore: Math.max(0, Math.min(100, healthScore)),
    });
  }

  public getNode(nodeId: string): NodeStateRecord | undefined {
    return this._nodes.get(nodeId);
  }

  // ─── 3. Peer Connection State Transitions ──────────────────────────────────

  public registerConnection(
    connectionId: string,
    localNodeId: string,
    remoteNodeId: string,
    remoteCoordinateUri: string,
    maxRetries: number = 3
  ): void {
    if (this._connections.has(connectionId)) {
      throw new Error(`Connection '${connectionId}' already registered.`);
    }

    this._connections.set(connectionId, {
      connectionId,
      localNodeId,
      remoteNodeId,
      remoteCoordinateUri,
      state: 'DISCONNECTED',
      retryCount: 0,
      maxRetries,
    });
    this._epoch++;
  }

  public transitionConnectionState(
    connectionId: string,
    nextState: PeerConnectionState,
    reason: string,
    error?: string
  ): void {
    const conn = this._connections.get(connectionId);
    if (!conn) {
      throw new Error(`Connection '${connectionId}' not found.`);
    }

    const allowed = CONNECTION_TRANSITIONS.get(conn.state);
    if (!allowed || !allowed.has(nextState)) {
      throw new Error(
        `Invalid connection state transition for '${connectionId}': '${conn.state}' → '${nextState}'. ` +
        `Reason: ${reason}. Allowed: [${allowed ? Array.from(allowed).join(', ') : 'NONE'}].`
      );
    }

    const now = Date.now();
    let retryCount = conn.retryCount;
    let establishedAt = conn.establishedAt;
    let closedAt = conn.closedAt;

    if (nextState === 'ESTABLISHED') {
      establishedAt = now;
      retryCount = 0; // Reset retries on successful link
    } else if (nextState === 'RECONNECTING') {
      retryCount++;
      if (retryCount > conn.maxRetries) {
        // Enforce max retry boundary -> force to DISCONNECTED
        this.recordTransition(connectionId, conn.state, 'DISCONNECTED', 'Max reconnection retries exceeded');
        this._connections.set(connectionId, {
          ...conn,
          state: 'DISCONNECTED',
          retryCount,
          lastError: 'Max retries exceeded',
          closedAt: now,
        });
        this._epoch++;
        return;
      }
    } else if (nextState === 'DISCONNECTED') {
      closedAt = now;
    }

    this.recordTransition(connectionId, conn.state, nextState, reason);
    this._connections.set(connectionId, {
      ...conn,
      state: nextState,
      establishedAt,
      closedAt,
      retryCount,
      lastError: error ?? conn.lastError,
    });
    this._epoch++;
  }

  // ─── 4. Protocol Session State Transitions ─────────────────────────────────

  public createSession(sessionId: string, connectionId: string): void {
    if (this._sessions.has(sessionId)) {
      throw new Error(`Session '${sessionId}' already exists.`);
    }

    const conn = this._connections.get(connectionId);
    if (!conn || conn.state !== 'ESTABLISHED') {
      throw new Error(`Cannot open protocol session on unestablished connection '${connectionId}'.`);
    }

    const now = Date.now();
    this._sessions.set(sessionId, {
      sessionId,
      connectionId,
      state: 'IDLE',
      startedAt: now,
      lastActivityAt: now,
    });
    this._epoch++;
  }

  public transitionSessionState(
    sessionId: string,
    nextState: ProtocolSessionState,
    reason: string,
    metadata: { version?: string; cubId?: string } = {}
  ): void {
    const session = this._sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session '${sessionId}' not found.`);
    }

    const allowed = SESSION_TRANSITIONS.get(session.state);
    if (!allowed || !allowed.has(nextState)) {
      throw new Error(
        `Invalid protocol session transition for '${sessionId}': '${session.state}' → '${nextState}'. ` +
        `Reason: ${reason}. Allowed: [${allowed ? Array.from(allowed).join(', ') : 'NONE'}].`
      );
    }

    const now = Date.now();
    this.recordTransition(sessionId, session.state, nextState, reason);
    this._sessions.set(sessionId, {
      ...session,
      state: nextState,
      negotiatedVersion: metadata.version ?? session.negotiatedVersion,
      authenticatedCubId: metadata.cubId ?? session.authenticatedCubId,
      lastActivityAt: now,
      closedAt: nextState === 'TERMINATED' ? now : session.closedAt,
    });
    this._epoch++;
  }

  // ─── 5. State Reconciliation & Recovery ────────────────────────────────────

  /**
   * Evaluates aggregate network health and automatically reconciles cluster state.
   */
  public reconcileClusterHealth(): NetworkClusterState {
    if (this._clusterState === 'HALTED') return 'HALTED';

    const totalNodes = this._nodes.size;
    if (totalNodes === 0) return this._clusterState;

    let onlineNodes = 0;
    let degradedNodes = 0;
    let faultedNodes = 0;

    this._nodes.forEach(node => {
      if (node.state === 'ONLINE') onlineNodes++;
      else if (node.state === 'DEGRADED') degradedNodes++;
      else if (node.state === 'FAULTED') faultedNodes++;
    });

    const healthyRatio = (onlineNodes + degradedNodes * 0.5) / totalNodes;

    if (faultedNodes > totalNodes / 2) {
      if (this._clusterState !== 'PARTITIONED' && this._clusterState !== 'RECONFIGURING') {
        this.transitionClusterState('PARTITIONED', 'Majority of nodes faulted or unreachable');
      }
    } else if (healthyRatio < 0.8) {
      if (this._clusterState !== 'DEGRADED') {
        this.transitionClusterState('DEGRADED', `Healthy ratio dropped to ${(healthyRatio * 100).toFixed(1)}%`);
      }
    } else if (healthyRatio >= 0.8 && (this._clusterState === 'DEGRADED' || this._clusterState === 'FORMING')) {
      this.transitionClusterState('CONVERGED', 'Network quorum stabilized');
    }

    return this._clusterState;
  }

  /**
   * Recovers a partitioned cluster through topology re-synthesis.
   */
  public recoverPartition(reason: string = 'Network partition healed'): void {
    if (this._clusterState !== 'PARTITIONED') {
      throw new Error(`Cannot recover partition: cluster is in state '${this._clusterState}', not 'PARTITIONED'.`);
    }

    this.transitionClusterState('RECONFIGURING', `${reason}: Reconfiguring topology`);
    this.transitionClusterState('CONVERGED', `${reason}: Re-converged`);
  }

  // ─── 6. Deterministic Wire Serialization & Deserialization ─────────────────

  public serialize(): string {
    const snapshot = this.getSnapshot();
    return JSON.stringify(snapshot);
  }

  public static deserialize(wireString: string): CanonicalNetworkStateModel {
    let parsed: any;
    try {
      parsed = JSON.parse(wireString);
    } catch (err: any) {
      throw new Error(`Failed to deserialize network state: Invalid JSON - ${err.message}`);
    }

    // Verify state checksum integrity
    const expectedHash = computeNetworkStateHash(parsed);
    if (parsed.stateHash !== expectedHash) {
      throw new Error(`Network state checksum mismatch: expected '${expectedHash}', got '${parsed.stateHash}'.`);
    }

    const model = new CanonicalNetworkStateModel(parsed.clusterState);
    (model as any)._epoch = parsed.epoch;

    if (parsed.nodes) {
      for (const [id, n] of Object.entries(parsed.nodes as Record<string, NodeStateRecord>)) {
        (model as any)._nodes.set(id, { ...n });
      }
    }

    if (parsed.connections) {
      for (const [id, c] of Object.entries(parsed.connections as Record<string, ConnectionStateRecord>)) {
        (model as any)._connections.set(id, { ...c });
      }
    }

    if (parsed.sessions) {
      for (const [id, s] of Object.entries(parsed.sessions as Record<string, ProtocolSessionRecord>)) {
        (model as any)._sessions.set(id, { ...s });
      }
    }

    if (parsed.transitionHistory) {
      (model as any)._history = [...parsed.transitionHistory];
    }

    return model;
  }

  // ─── Internal Helper ───────────────────────────────────────────────────────

  private recordTransition(
    entityId: string,
    fromState: string,
    toState: string,
    reason: string
  ): void {
    const transitionId = `TR_${deterministicHash(`${entityId}:${fromState}:${toState}:${Date.now()}:${this._history.length}`).slice(2, 14)}`;
    this._history.push(Object.freeze({
      transitionId,
      entityId,
      fromState,
      toState,
      reason,
      timestamp: Date.now(),
    }));
  }
}
