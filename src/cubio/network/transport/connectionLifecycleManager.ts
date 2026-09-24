/**
 * CUBiO AI — Canonical Connection Lifecycle Manager
 * ==================================================
 *
 * Implements the centralized CUBiO Connection Lifecycle Manager.
 * Enforces canonical lifecycle states (CONNECTING, CONNECTED, DEGRADED,
 * CLOSING, CLOSED, FAILED) across all transports (UDP, TCP, WebSocket, IPC).
 *
 * Core Capabilities:
 *   1. Strict State Transitions: Rejects illegal transitions fail-closed.
 *   2. Duplicate Shutdown Prevention: Idempotent teardown preventing race conditions.
 *   3. Stale Connection Management: Heartbeat/inactivity tracking with automatic
 *      degradation, recovery upon traffic, and orderly termination of dead links.
 *   4. Zero Resource Leaks: Clean detachment of socket listeners and timers.
 */

import {
  ConnectionState,
  PERMITTED_CONNECTION_TRANSITIONS,
  IllegalConnectionTransitionError,
  ManagedConnection,
  ConnectionLifecycleManagerOptions,
  ConnectionLifecycleMetrics,
  ConnectionStateChangeHandler,
  ConnectionPacketHandler,
  ConnectionClosedHandler,
  ConnectionDegradedHandler,
  ConnectionFailedHandler,
} from './connectionLifecycleTypes';
import {
  ITransportAdapter,
  TransportEndpoint,
  TransportType,
  TransportDeliveryReceipt,
  TransportSendOptions,
  CanonicalTransportError,
  TransportLifecycleState,
} from './types';
import { CubiOPacket } from '../protocol/v1/packetTypes';
import { TRANSPORT_TIMEOUTS } from './constants';

interface MutableConnectionRecord {
  readonly connectionId: string;
  readonly transportType: TransportType;
  localEndpoint?: TransportEndpoint;
  readonly remoteEndpoint: TransportEndpoint;
  readonly adapter: ITransportAdapter;
  state: ConnectionState;
  readonly createdAt: number;
  connectedAt?: number;
  closedAt?: number;
  lastActivityAt: number;
  bytesSent: number;
  bytesReceived: number;
  packetsSent: number;
  packetsReceived: number;
  failureReason?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export class ConnectionLifecycleManager {
  private readonly _options: Required<ConnectionLifecycleManagerOptions>;
  private readonly _connections: Map<string, MutableConnectionRecord> = new Map();
  private readonly _closedHistory: Map<string, ManagedConnection> = new Map();
  private readonly _closingPromises: Map<string, Promise<void>> = new Map();
  private readonly _adapterCleanups: Map<string, () => void> = new Map();

  private _sweepTimer: NodeJS.Timeout | null = null;

  // Metrics
  private _totalCreated: number = 0;
  private _staleDegradedEvents: number = 0;
  private _staleFailedEvents: number = 0;
  private _duplicateCloseAttempts: number = 0;

  // Event Handlers
  private readonly _stateChangeHandlers: Set<ConnectionStateChangeHandler> = new Set();
  private readonly _packetHandlers: Set<ConnectionPacketHandler> = new Set();
  private readonly _closedHandlers: Set<ConnectionClosedHandler> = new Set();
  private readonly _degradedHandlers: Set<ConnectionDegradedHandler> = new Set();
  private readonly _failedHandlers: Set<ConnectionFailedHandler> = new Set();

  constructor(options?: ConnectionLifecycleManagerOptions) {
    this._options = {
      staleTimeoutMs: options?.staleTimeoutMs ?? TRANSPORT_TIMEOUTS.INACTIVITY_TIMEOUT_MS,
      failureTimeoutMs: options?.failureTimeoutMs ?? (TRANSPORT_TIMEOUTS.INACTIVITY_TIMEOUT_MS * 1.5),
      sweepIntervalMs: options?.sweepIntervalMs ?? 0,
      maxConnections: options?.maxConnections ?? 1024,
    };

    if (this._options.sweepIntervalMs > 0) {
      this.startStaleSweep(this._options.sweepIntervalMs);
    }
  }

  // ─── Metric & Status Queries ──────────────────────────────────────────────

  public get metrics(): ConnectionLifecycleMetrics {
    let connecting = 0;
    let connected = 0;
    let degraded = 0;
    let closing = 0;
    let failed = 0;
    let totalBytesSent = 0;
    let totalBytesReceived = 0;
    let totalPacketsSent = 0;
    let totalPacketsReceived = 0;

    for (const record of this._connections.values()) {
      switch (record.state) {
        case 'CONNECTING': connecting++; break;
        case 'CONNECTED': connected++; break;
        case 'DEGRADED': degraded++; break;
        case 'CLOSING': closing++; break;
        case 'FAILED': failed++; break;
      }
      totalBytesSent += record.bytesSent;
      totalBytesReceived += record.bytesReceived;
      totalPacketsSent += record.packetsSent;
      totalPacketsReceived += record.packetsReceived;
    }

    return Object.freeze({
      totalCreated: this._totalCreated,
      activeCount: this._connections.size,
      connectingCount: connecting,
      connectedCount: connected,
      degradedCount: degraded,
      closingCount: closing,
      closedCount: this._closedHistory.size,
      failedCount: failed,
      totalBytesSent,
      totalBytesReceived,
      totalPacketsSent,
      totalPacketsReceived,
      staleDegradedEvents: this._staleDegradedEvents,
      staleFailedEvents: this._staleFailedEvents,
      duplicateCloseAttempts: this._duplicateCloseAttempts,
    });
  }

  public getConnection(connectionId: string): ManagedConnection | undefined {
    const record = this._connections.get(connectionId);
    if (record) return this._snapshot(record);
    return this._closedHistory.get(connectionId);
  }

  public getActiveConnections(): ManagedConnection[] {
    return Array.from(this._connections.values()).map(r => this._snapshot(r));
  }

  public getAllConnections(): ManagedConnection[] {
    const active = this.getActiveConnections();
    const closed = Array.from(this._closedHistory.values());
    return [...active, ...closed];
  }

  public getConnectionsByState(state: ConnectionState): ManagedConnection[] {
    if (state === 'CLOSED') {
      return Array.from(this._closedHistory.values());
    }
    return Array.from(this._connections.values())
      .filter(r => r.state === state)
      .map(r => this._snapshot(r));
  }

  public getConnectionsByTransport(transportType: TransportType): ManagedConnection[] {
    return this.getAllConnections().filter(c => c.transportType === transportType);
  }

  // ─── Event Subscriptions ──────────────────────────────────────────────────

  public onStateChange(handler: ConnectionStateChangeHandler): () => void {
    this._stateChangeHandlers.add(handler);
    return () => this._stateChangeHandlers.delete(handler);
  }

  public onPacket(handler: ConnectionPacketHandler): () => void {
    this._packetHandlers.add(handler);
    return () => this._packetHandlers.delete(handler);
  }

  public onConnectionClosed(handler: ConnectionClosedHandler): () => void {
    this._closedHandlers.add(handler);
    return () => this._closedHandlers.delete(handler);
  }

  public onConnectionDegraded(handler: ConnectionDegradedHandler): () => void {
    this._degradedHandlers.add(handler);
    return () => this._degradedHandlers.delete(handler);
  }

  public onConnectionFailed(handler: ConnectionFailedHandler): () => void {
    this._failedHandlers.add(handler);
    return () => this._failedHandlers.delete(handler);
  }

  // ─── Outbound Connection Lifecycle ────────────────────────────────────────

  /**
   * Establishes and manages an outbound connection using a transport adapter.
   */
  public async connect(
    adapter: ITransportAdapter,
    remoteEndpoint: TransportEndpoint,
    options?: { connectionId?: string; metadata?: Record<string, unknown> }
  ): Promise<ManagedConnection> {
    if (this._connections.size >= this._options.maxConnections) {
      throw new Error(`Connection limit reached: ${this._options.maxConnections}`);
    }

    const connectionId = options?.connectionId ?? this._generateId('conn');
    const now = Date.now();

    const record: MutableConnectionRecord = {
      connectionId,
      transportType: adapter.transportType,
      localEndpoint: adapter.localEndpoint,
      remoteEndpoint: Object.freeze({ ...remoteEndpoint }),
      adapter,
      state: 'CONNECTING',
      createdAt: now,
      lastActivityAt: now,
      bytesSent: 0,
      bytesReceived: 0,
      packetsSent: 0,
      packetsReceived: 0,
      metadata: options?.metadata ? Object.freeze({ ...options.metadata }) : undefined,
    };

    this._connections.set(connectionId, record);
    this._totalCreated++;

    // Hook adapter events
    this._bindAdapter(record);

    try {
      await adapter.connect(remoteEndpoint);
      record.localEndpoint = adapter.localEndpoint;
      this._transition(record, 'CONNECTED', 'Physical connection established');
      return this._snapshot(record);
    } catch (err: any) {
      if (record.state !== 'CLOSED' && record.state !== 'FAILED') {
        try {
          this._transition(record, 'FAILED', `Connect failed: ${err.message}`);
        } catch {}
      } else if (!record.failureReason) {
        record.failureReason = `Connect failed: ${err.message}`;
      }
      await this.closeConnection(connectionId, `Teardown after connect failure: ${err.message}`);
      throw err;
    }
  }

  // ─── Server Listener Lifecycle ────────────────────────────────────────────

  /**
   * Registers and manages a listening server adapter.
   */
  public async registerServer(
    adapter: ITransportAdapter,
    localEndpoint: TransportEndpoint,
    options?: { connectionId?: string; metadata?: Record<string, unknown> }
  ): Promise<ManagedConnection> {
    if (this._connections.size >= this._options.maxConnections) {
      throw new Error(`Connection limit reached: ${this._options.maxConnections}`);
    }

    const connectionId = options?.connectionId ?? this._generateId('srv');
    const now = Date.now();

    const record: MutableConnectionRecord = {
      connectionId,
      transportType: adapter.transportType,
      localEndpoint: Object.freeze({ ...localEndpoint }),
      remoteEndpoint: Object.freeze({ ...localEndpoint }),
      adapter,
      state: 'CONNECTING',
      createdAt: now,
      lastActivityAt: now,
      bytesSent: 0,
      bytesReceived: 0,
      packetsSent: 0,
      packetsReceived: 0,
      metadata: options?.metadata ? Object.freeze({ ...options.metadata }) : undefined,
    };

    this._connections.set(connectionId, record);
    this._totalCreated++;

    this._bindAdapter(record);

    try {
      await adapter.listen(localEndpoint);
      record.localEndpoint = adapter.localEndpoint;
      this._transition(record, 'CONNECTED', 'Server listener bound');
      return this._snapshot(record);
    } catch (err: any) {
      this._transition(record, 'FAILED', `Listen failed: ${err.message}`);
      await this.closeConnection(connectionId, `Teardown after listen failure: ${err.message}`);
      throw err;
    }
  }

  // ─── Manual / Inbound Connection Registration ─────────────────────────────

  /**
   * Directly registers an existing connection/session into the manager.
   */
  public registerConnection(
    adapter: ITransportAdapter,
    remoteEndpoint: TransportEndpoint,
    options?: {
      connectionId?: string;
      initialState?: ConnectionState;
      metadata?: Record<string, unknown>;
    }
  ): ManagedConnection {
    if (this._connections.size >= this._options.maxConnections) {
      throw new Error(`Connection limit reached: ${this._options.maxConnections}`);
    }

    const connectionId = options?.connectionId ?? this._generateId('conn');
    const now = Date.now();
    const initialState = options?.initialState ?? (adapter.state === 'CONNECTED' ? 'CONNECTED' : 'CONNECTING');

    const record: MutableConnectionRecord = {
      connectionId,
      transportType: adapter.transportType,
      localEndpoint: adapter.localEndpoint,
      remoteEndpoint: Object.freeze({ ...remoteEndpoint }),
      adapter,
      state: initialState,
      createdAt: now,
      connectedAt: initialState === 'CONNECTED' ? now : undefined,
      lastActivityAt: now,
      bytesSent: 0,
      bytesReceived: 0,
      packetsSent: 0,
      packetsReceived: 0,
      metadata: options?.metadata ? Object.freeze({ ...options.metadata }) : undefined,
    };

    this._connections.set(connectionId, record);
    this._totalCreated++;

    this._bindAdapter(record);
    return this._snapshot(record);
  }

  // ─── Outbound Transmission & Activity Tracking ────────────────────────────

  /**
   * Sends a Phase 1 CubiOPacket over a managed connection.
   * Updates lastActivityAt and auto-recovers DEGRADED links to CONNECTED.
   */
  public async send(
    connectionId: string,
    packet: CubiOPacket,
    options?: TransportSendOptions
  ): Promise<TransportDeliveryReceipt> {
    const record = this._connections.get(connectionId);
    if (!record) {
      throw new Error(`Cannot send: connection '${connectionId}' not found or closed`);
    }

    if (record.state !== 'CONNECTED' && record.state !== 'DEGRADED') {
      throw new Error(
        `Cannot send packet on connection '${connectionId}' in state '${record.state}'. Expected 'CONNECTED' or 'DEGRADED'.`
      );
    }

    try {
      const receipt = await record.adapter.send(packet, options);

      if (receipt.success) {
        record.packetsSent++;
        record.bytesSent += receipt.bytesTransmitted;
        record.lastActivityAt = Date.now();

        // Traffic resumption automatically recovers DEGRADED state to CONNECTED
        if (record.state === 'DEGRADED') {
          this._transition(record, 'CONNECTED', 'Outbound transmission confirmed link recovery');
        }
      }

      return receipt;
    } catch (err: any) {
      record.lastActivityAt = Date.now();
      // Outbound failure on degraded connection may trigger immediate failure
      if (record.state === 'DEGRADED') {
        this._transition(record, 'FAILED', `Send failed while degraded: ${err.message}`);
      }
      throw err;
    }
  }

  /**
   * Records heartbeat or activity on a connection.
   * Auto-recovers DEGRADED links to CONNECTED.
   */
  public touchActivity(connectionId: string): void {
    const record = this._connections.get(connectionId);
    if (!record || record.state === 'CLOSED' || record.state === 'CLOSING') return;

    record.lastActivityAt = Date.now();
    if (record.state === 'DEGRADED') {
      this._transition(record, 'CONNECTED', 'Activity touch recovered link health');
    }
  }

  /**
   * Explicitly marks a connection as DEGRADED.
   */
  public markDegraded(connectionId: string, reason: string): void {
    const record = this._connections.get(connectionId);
    if (!record) return;
    this._transition(record, 'DEGRADED', reason);
  }

  /**
   * Explicitly marks a connection as FAILED.
   */
  public markFailed(connectionId: string, reason: string): void {
    const record = this._connections.get(connectionId);
    if (!record) return;
    this._transition(record, 'FAILED', reason);
  }

  // ─── Duplicate-Safe Idempotent Close ──────────────────────────────────────

  /**
   * Closes a managed connection cleanly and idempotently.
   * Guarantees 0 duplicate teardowns, unhooks all listeners, and frees resources.
   */
  public async closeConnection(
    connectionId: string,
    reason: string = 'Normal closure'
  ): Promise<void> {
    const record = this._connections.get(connectionId);
    if (!record) {
      // If already closed in history, this is an idempotent duplicate call
      if (this._closedHistory.has(connectionId)) {
        this._duplicateCloseAttempts++;
      }
      return;
    }

    if (record.state === 'CLOSED') {
      this._duplicateCloseAttempts++;
      return;
    }

    // If already in the process of closing, wait for existing teardown to finish
    if (record.state === 'CLOSING') {
      this._duplicateCloseAttempts++;
      const inFlight = this._closingPromises.get(connectionId);
      if (inFlight) await inFlight;
      return;
    }

    const closePromise = (async () => {
      try {
        this._transition(record, 'CLOSING', reason);

        // 1. Unhook adapter listeners to prevent callback memory leaks
        const unbind = this._adapterCleanups.get(connectionId);
        if (unbind) {
          try { unbind(); } catch {}
          this._adapterCleanups.delete(connectionId);
        }

        // 2. Teardown underlying transport adapter
        try {
          await record.adapter.close(reason);
        } catch {
          // Adapter close error shouldn't abort manager state transition
        }

        // 3. Complete transition to terminal CLOSED state
        this._transition(record, 'CLOSED', reason);
      } catch (err: any) {
        // Fallback to CLOSED on unexpected error
        if (record.state !== 'CLOSED') {
          try {
            this._transition(record, 'FAILED', err.message);
            this._transition(record, 'CLOSED', 'Forced close after failure');
          } catch {
            record.state = 'CLOSED';
            record.closedAt = Date.now();
          }
        }
      } finally {
        this._closingPromises.delete(connectionId);
        this._connections.delete(connectionId);
        this._archiveClosed(this._snapshot(record));
      }
    })();

    this._closingPromises.set(connectionId, closePromise);
    await closePromise;
  }

  // ─── Stale Connection Sweep ───────────────────────────────────────────────

  /**
   * Evaluates all active connections for staleness.
   * - Inactivity > staleTimeoutMs: CONNECTED -> DEGRADED
   * - Inactivity > failureTimeoutMs: DEGRADED -> FAILED (and scheduled for auto-teardown)
   */
  public checkStaleConnections(now: number = Date.now()): {
    degraded: string[];
    failed: string[];
  } {
    const degraded: string[] = [];
    const failed: string[] = [];

    for (const record of this._connections.values()) {
      const idleMs = now - record.lastActivityAt;

      if (record.state === 'CONNECTED' && idleMs >= this._options.staleTimeoutMs) {
        this._transition(
          record,
          'DEGRADED',
          `Inactivity timeout: ${idleMs}ms without activity (threshold: ${this._options.staleTimeoutMs}ms)`
        );
        degraded.push(record.connectionId);
      } else if (record.state === 'DEGRADED' && idleMs >= this._options.failureTimeoutMs) {
        this._transition(
          record,
          'FAILED',
          `Stale dead link timeout: ${idleMs}ms without recovery (threshold: ${this._options.failureTimeoutMs}ms)`
        );
        failed.push(record.connectionId);
        // Clean up dead connection asynchronously
        this.closeConnection(record.connectionId, 'Auto-cleanup stale failed connection').catch(() => {});
      }
    }

    return { degraded, failed };
  }

  public startStaleSweep(intervalMs: number): void {
    this.stopStaleSweep();
    this._sweepTimer = setInterval(() => {
      this.checkStaleConnections();
    }, intervalMs);
    // Unref so the timer does not keep Node process alive
    if (this._sweepTimer && typeof this._sweepTimer.unref === 'function') {
      this._sweepTimer.unref();
    }
  }

  public stopStaleSweep(): void {
    if (this._sweepTimer) {
      clearInterval(this._sweepTimer);
      this._sweepTimer = null;
    }
  }

  // ─── Global Clean Teardown ────────────────────────────────────────────────

  /**
   * Gracefully shuts down all managed connections, clears timers, and resets manager.
   */
  public async shutdown(reason: string = 'Manager shutdown'): Promise<void> {
    this.stopStaleSweep();

    const connectionIds = Array.from(this._connections.keys());
    await Promise.allSettled(
      connectionIds.map(id => this.closeConnection(id, reason))
    );

    this._stateChangeHandlers.clear();
    this._packetHandlers.clear();
    this._closedHandlers.clear();
    this._degradedHandlers.clear();
    this._failedHandlers.clear();
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  private _transition(
    record: MutableConnectionRecord,
    nextState: ConnectionState,
    reason: string
  ): void {
    const prevState = record.state;
    if (prevState === nextState) return;

    const allowed = PERMITTED_CONNECTION_TRANSITIONS.get(prevState);
    if (!allowed || !allowed.has(nextState)) {
      throw new IllegalConnectionTransitionError(
        record.connectionId,
        prevState,
        nextState,
        reason
      );
    }

    record.state = nextState;

    if (nextState === 'CONNECTED' && !record.connectedAt) {
      record.connectedAt = Date.now();
    } else if (nextState === 'CLOSED') {
      record.closedAt = Date.now();
    } else if (nextState === 'FAILED') {
      record.failureReason = reason;
    }

    const snapshot = this._snapshot(record);

    // Emit state change event
    for (const handler of this._stateChangeHandlers) {
      try { handler(snapshot, prevState, nextState, reason); } catch {}
    }

    // Emit specialized lifecycle events
    if (nextState === 'DEGRADED') {
      this._staleDegradedEvents++;
      for (const h of this._degradedHandlers) {
        try { h(snapshot, reason); } catch {}
      }
    } else if (nextState === 'FAILED') {
      this._staleFailedEvents++;
      for (const h of this._failedHandlers) {
        try { h(snapshot, reason); } catch {}
      }
    } else if (nextState === 'CLOSED') {
      for (const h of this._closedHandlers) {
        try { h(snapshot, reason); } catch {}
      }
    }
  }

  private _bindAdapter(record: MutableConnectionRecord): void {
    // We bind to adapter packet receiver, state change, and error callbacks
    const packetHandler = (packet: CubiOPacket) => {
      record.packetsReceived++;
      record.bytesReceived += packet.payload.byteLength;
      record.lastActivityAt = Date.now();

      // Inbound traffic auto-recovers DEGRADED connections to CONNECTED
      if (record.state === 'DEGRADED') {
        this._transition(record, 'CONNECTED', 'Inbound packet confirmed link recovery');
      }

      const snap = this._snapshot(record);
      for (const h of this._packetHandlers) {
        try { h(snap, packet); } catch {}
      }
    };

    const stateHandler = (
      _prev: TransportLifecycleState,
      next: TransportLifecycleState,
      reason: string
    ) => {
      if (next === 'DISCONNECTED') {
        if (record.state === 'CONNECTING') {
          try {
            this._transition(record, 'FAILED', `Transport disconnected during connect: ${reason}`);
          } catch {}
          this.closeConnection(record.connectionId, `Teardown after connect failure: ${reason}`).catch(() => {});
        } else if (record.state !== 'CLOSING' && record.state !== 'CLOSED') {
          this.closeConnection(record.connectionId, `Underlying transport disconnected: ${reason}`).catch(() => {});
        }
      } else if (next === 'FAULTED') {
        if (record.state !== 'FAILED' && record.state !== 'CLOSED') {
          try {
            this._transition(record, 'FAILED', `Underlying transport faulted: ${reason}`);
          } catch {}
          this.closeConnection(record.connectionId, `Teardown after transport fault: ${reason}`).catch(() => {});
        }
      }
    };

    const errorHandler = (err: CanonicalTransportError) => {
      if (err.fatal) {
        if (record.state !== 'FAILED' && record.state !== 'CLOSED') {
          try {
            this._transition(record, 'FAILED', `Fatal transport error: ${err.message}`);
          } catch {}
          this.closeConnection(record.connectionId, `Teardown after fatal transport error: ${err.message}`).catch(() => {});
        }
      } else {
        // Non-fatal error might degrade connection
        if (record.state === 'CONNECTED') {
          try {
            this._transition(record, 'DEGRADED', `Transport warning: ${err.message}`);
          } catch {}
        }
      }
    };

    const unregPacket = record.adapter.receive(packetHandler);
    const unregState = record.adapter.onStateChange(stateHandler);
    const unregError = record.adapter.onError(errorHandler);

    this._adapterCleanups.set(record.connectionId, () => {
      if (typeof unregPacket === 'function') {
        try { unregPacket(); } catch {}
      } else if (typeof record.adapter.removeReceive === 'function') {
        try { record.adapter.removeReceive(packetHandler); } catch {}
      }

      if (typeof unregState === 'function') {
        try { unregState(); } catch {}
      } else if (typeof (record.adapter as any).removeStateChange === 'function') {
        try { (record.adapter as any).removeStateChange(stateHandler); } catch {}
      }

      if (typeof unregError === 'function') {
        try { unregError(); } catch {}
      } else if (typeof (record.adapter as any).removeError === 'function') {
        try { (record.adapter as any).removeError(errorHandler); } catch {}
      }
    });
  }

  private _archiveClosed(snapshot: ManagedConnection): void {
    this._closedHistory.set(snapshot.connectionId, snapshot);
    // Keep closed history capped at 200 items to avoid unbounded memory growth
    if (this._closedHistory.size > 200) {
      const oldestKey = this._closedHistory.keys().next().value;
      if (oldestKey) this._closedHistory.delete(oldestKey);
    }
  }

  private _snapshot(record: MutableConnectionRecord): ManagedConnection {
    return Object.freeze({
      connectionId: record.connectionId,
      transportType: record.transportType,
      localEndpoint: record.localEndpoint ? Object.freeze({ ...record.localEndpoint }) : undefined,
      remoteEndpoint: Object.freeze({ ...record.remoteEndpoint }),
      adapter: record.adapter,
      state: record.state,
      createdAt: record.createdAt,
      connectedAt: record.connectedAt,
      closedAt: record.closedAt,
      lastActivityAt: record.lastActivityAt,
      bytesSent: record.bytesSent,
      bytesReceived: record.bytesReceived,
      packetsSent: record.packetsSent,
      packetsReceived: record.packetsReceived,
      failureReason: record.failureReason,
      metadata: record.metadata,
    });
  }

  private _generateId(prefix: string): string {
    return `cubio-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}
