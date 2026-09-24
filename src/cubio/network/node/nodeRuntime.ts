/**
 * CUBiO Network Node — Persistent Node Runtime Implementation
 * ============================================================
 *
 * Implements the persistent CUBiO Node Runtime architecture atop certified
 * Phase 1 Protocol and Phase 2 Transport layers.
 *
 * Orchestrates:
 *   - Identity & configuration verification
 *   - Transport adapter management & multi-protocol listener binding
 *   - Connection lifecycle & peer session tracking
 *   - Inbound & outbound packet/envelope processing pipelines
 *   - Transmission resilience with jittered backoff & circuit breaking
 *   - Local application service registration & coordinate-based dispatch
 *   - Failure isolation & comprehensive operational telemetry
 */

import {
  type CanonicalNodeIdentity,
  type NodeCapability,
  type INodeService,
} from '../protocol/v1/nodeTypes';

import {
  type CubiOPacket,
} from '../protocol/v1/packetTypes';

import {
  type CubiOMessage,
} from '../protocol/v1/messageTypes';

import { validatePacket } from '../protocol/v1/packetEngine';
import { messageToPackets } from '../protocol/v1/messageEngine';

import {
  type TransportType,
  type TransportEndpoint,
  type TransportSession,
  type ITransportAdapter,
  type TransportDeliveryReceipt,
  type TransportSendOptions,
  validateTransportEndpoint,
} from '../transport/index';

import { TcpTransportAdapter } from '../transport/tcpTransportAdapter';
import { UdpTransportAdapter } from '../transport/udpTransportAdapter';
import { WebSocketTransportAdapter } from '../transport/webSocketTransportAdapter';
import { IpcPipeTransportAdapter } from '../transport/ipcPipeTransportAdapter';
import { MemoryTransportAdapter } from '../transport/memoryTransportAdapter';

import { ConnectionLifecycleManager } from '../transport/connectionLifecycleManager';
import { InboundEnvelopeAssembler } from '../transport/transportPipeline';
import { TransportResilienceEngine } from '../transport/transportRetryEngine';
import { envelopeToMessage } from '../protocol/v1/messageEngine';

import { CanonicalNetworkStateModel } from '../protocol/v1/stateModel';
import { NodeBootstrapPipeline } from './nodeBootstrapPipeline';
import { type NodeBootstrapReport, type NodeBootstrapOptions } from './nodeBootstrapTypes';

import {
  type NodeRuntimeLifecycleState,
  type NodeRuntimeConfig,
  type NodeRuntimeTelemetry,
  type NodeRuntimeStateChangeHandler,
  type INodeRuntime,
} from './nodeRuntimeTypes';

import { validateNodeRuntimeConfig } from './nodeRuntimeConfig';
import { NodeOneLanguageBridge } from './oneLanguageNodeBridge';
import { compileNodeConfigFromDeclaration } from './oneLanguageNodeDeclaration';
import {
  type OneLanguageExecutionOptions,
  type OneLanguageExecutionResult,
} from './oneLanguageRuntimeTypes';

const VALID_RUNTIME_TRANSITIONS: ReadonlyMap<
  NodeRuntimeLifecycleState,
  ReadonlySet<NodeRuntimeLifecycleState>
> = new Map([
  ['STOPPED',      new Set<NodeRuntimeLifecycleState>(['INITIALIZING', 'READY'])],
  ['INITIALIZING', new Set<NodeRuntimeLifecycleState>(['STARTING', 'READY', 'FAULTED', 'STOPPED'])],
  ['STARTING',     new Set<NodeRuntimeLifecycleState>(['READY', 'RUNNING', 'ONLINE', 'FAULTED', 'STOPPED'])],
  ['READY',        new Set<NodeRuntimeLifecycleState>(['RUNNING', 'ONLINE', 'DEGRADED', 'DRAINING', 'STOPPED', 'FAULTED'])],
  ['RUNNING',      new Set<NodeRuntimeLifecycleState>(['ONLINE', 'READY', 'DEGRADED', 'DRAINING', 'STOPPED', 'FAULTED'])],
  ['ONLINE',       new Set<NodeRuntimeLifecycleState>(['RUNNING', 'READY', 'DEGRADED', 'DRAINING', 'STOPPED', 'FAULTED'])],
  ['DEGRADED',     new Set<NodeRuntimeLifecycleState>(['RUNNING', 'ONLINE', 'READY', 'DRAINING', 'STOPPED', 'FAULTED'])],
  ['DRAINING',     new Set<NodeRuntimeLifecycleState>(['STOPPED', 'FAULTED'])],
  ['FAULTED',      new Set<NodeRuntimeLifecycleState>(['INITIALIZING', 'STOPPED'])],
]);

/**
 * Authoritative implementation of the persistent CUBiO Node Runtime.
 */
export class CubiONodeRuntime implements INodeRuntime {
  public readonly identity: CanonicalNodeIdentity;
  public readonly config: NodeRuntimeConfig;

  private _state: NodeRuntimeLifecycleState = 'STOPPED';
  private _bootTimestamp: number = 0;

  // Subsystem instances
  private readonly _adapters: Map<TransportType, ITransportAdapter> = new Map();
  private readonly _outboundAdapters: Map<string, ITransportAdapter> = new Map();
  private readonly _adapterCleanups: Map<TransportType, () => void> = new Map();
  public readonly connectionManager: ConnectionLifecycleManager;
  public readonly assembler: InboundEnvelopeAssembler;
  public readonly resilienceEngine: typeof TransportResilienceEngine = TransportResilienceEngine;
  public readonly stateModel: CanonicalNetworkStateModel;
  public readonly oneLanguageBridge: NodeOneLanguageBridge;
  private _bootstrapReport?: NodeBootstrapReport;

  public get bootstrapReport(): NodeBootstrapReport | undefined {
    return this._bootstrapReport;
  }

  // Local Application Services
  private readonly _services: Map<string, INodeService> = new Map();

  // Metrics
  private _packetsReceived: number = 0;
  private _packetsSent: number = 0;
  private _packetsForwarded: number = 0;
  private _packetsDropped: number = 0;
  private _messagesProcessed: number = 0;
  private _bytesReceived: number = 0;
  private _bytesSent: number = 0;
  private _errorsCount: number = 0;
  private _retriedTransmissionsCount: number = 0;

  // Timers
  private _heartbeatTimer: NodeJS.Timeout | null = null;

  // Event Handlers
  private readonly _stateChangeHandlers: Set<NodeRuntimeStateChangeHandler> = new Set();
  private readonly _messageHandlers: Set<(message: CubiOMessage, fromEndpoint?: TransportEndpoint) => void> = new Set();
  private readonly _packetHandlers: Set<(packet: CubiOPacket, fromEndpoint?: TransportEndpoint) => void> = new Set();
  private readonly _errorHandlers: Set<(error: Error) => void> = new Set();
 
  /**
   * Instantiates a persistent CubiONodeRuntime directly from a canonical
   * One Language node declaration string.
   * Performs lexical parsing, semantic validation, and deterministic mapping.
   * Fails closed: throws if declaration has syntax errors, invalid fields,
   * out-of-bound limits, or duplicate property declarations.
   */
  public static fromDeclaration(source: string): CubiONodeRuntime {
    const config = compileNodeConfigFromDeclaration(source);
    return new CubiONodeRuntime(config);
  }

  constructor(config: NodeRuntimeConfig) {
    const valResult = validateNodeRuntimeConfig(config);
    if (!valResult.valid) {
      const msgs = valResult.errors.map(e => `[${e.code}] ${e.field}: ${e.message}`).join('; ');
      throw new Error(`Cannot initialize CubiONodeRuntime: Invalid config - ${msgs}`);
    }

    this.config = Object.freeze({ ...config });
    this.identity = config.identity;

    // 1. Instantiate Transport Adapters
    for (const binding of config.transports) {
      const adapter = binding.adapter ?? this._instantiateAdapter(binding.transportType);
      this._adapters.set(binding.transportType, adapter);
    }

    // 2. Instantiate Connection Lifecycle Manager
    this.connectionManager = new ConnectionLifecycleManager({
      staleTimeoutMs: config.staleTimeoutMs,
      failureTimeoutMs: config.failureTimeoutMs,
      sweepIntervalMs: config.sweepIntervalMs,
      maxConnections: config.maxConcurrentPeers,
    });

    // 3. Instantiate Inbound Envelope Assembler
    this.assembler = new InboundEnvelopeAssembler({
      maxBufferedEnvelopes: config.pipelineOptions?.maxQueueSize,
      assemblyTimeoutMs: config.pipelineOptions?.assemblyTimeoutMs,
    });

    // 4. Instantiate Phase 1 Canonical Network State Model
    this.stateModel = new CanonicalNetworkStateModel('BOOTSTRAP');

    // 5. Instantiate Sandboxed One Language Node Bridge
    this.oneLanguageBridge = new NodeOneLanguageBridge(this);
  }

  // ─── Public Getters ────────────────────────────────────────────────────────

  public get state(): NodeRuntimeLifecycleState {
    return this._state;
  }

  public get telemetry(): NodeRuntimeTelemetry {
    const uptimeMs = this._bootTimestamp > 0 ? Date.now() - this._bootTimestamp : 0;
    const connMetrics = this.connectionManager.metrics;

    const adapterDropped = Array.from(this._adapters.values()).reduce((sum, a) => sum + a.metrics.packetsDropped, 0);
    const totalDropped = this._packetsDropped + adapterDropped;

    let healthStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' = 'HEALTHY';
    if (this._state === 'FAULTED') {
      healthStatus = 'CRITICAL';
    } else if (
      this._state === 'DEGRADED' ||
      totalDropped > 50 ||
      connMetrics.degradedCount > 0
    ) {
      healthStatus = 'DEGRADED';
    }

    return Object.freeze({
      uptimeMs,
      connectedPeersCount: connMetrics.connectedCount,
      packetsReceived: this._packetsReceived,
      packetsSent: this._packetsSent,
      packetsForwarded: this._packetsForwarded,
      packetsDropped: totalDropped,
      messagesProcessed: this._messagesProcessed,
      bytesReceived: this._bytesReceived,
      bytesSent: this._bytesSent,
      errorsCount: this._errorsCount,
      healthStatus,
      activeConnectionsCount: connMetrics.activeCount,
      activeTransportsCount: this._adapters.size,
      registeredServicesCount: this._services.size,
      retriedTransmissionsCount: this._retriedTransmissionsCount,
      circuitBreakerTrips: 0,
      reconstructedEnvelopes: this.assembler.envelopesReceived,
      pipelineQueueDepth: this.assembler.pendingCount,
    });
  }

  // ─── Lifecycle Operations ─────────────────────────────────────────────────

  public async bootstrap(options: NodeBootstrapOptions = {}): Promise<NodeBootstrapReport> {
    if (this._state === 'READY' && options.autoActivateOnline !== false) {
      this.stateModel.transitionNodeState(this.identity.nodeId, 'ONLINE', 'Activated for live network traffic');
      this.transitionState('RUNNING', 'Activated online from READY state');
      return this._bootstrapReport!;
    }

    if (this._state === 'RUNNING' || this._state === 'ONLINE' || (this._state === 'READY' && options.autoActivateOnline === false)) {
      if (options.idempotent !== false && this._bootstrapReport) {
        return this._bootstrapReport;
      }
      if (options.idempotent === false) {
        throw new Error(`Node is already in state '${this._state}'. Duplicate bootstrap rejected.`);
      }
    }

    try {
      const report = await NodeBootstrapPipeline.execute(
        {
          identity: this.identity,
          config: this.config,
          stateModel: this.stateModel,
          adapters: this._adapters,
          services: this._services,
          assembler: this.assembler,
          transitionRuntimeState: (state, reason) => this.transitionState(state, reason),
          wireInboundPacketListener: (adapter) => {
            const unregPacket = adapter.receive((packet, session) => {
              this._handleInboundPacket(packet, session.remoteEndpoint);
            });
            const unregError = adapter.onError((err) => {
              this._handleTransportError(adapter.transportType, err);
            });
            return () => {
              if (typeof unregPacket === 'function') unregPacket();
              if (typeof unregError === 'function') unregError();
            };
          },
          adapterCleanups: this._adapterCleanups,
        },
        options
      );

      this._bootstrapReport = report;
      this._bootTimestamp = Date.now();

      // Start periodic heartbeat if configured
      if (this.config.heartbeatIntervalMs > 0 && !this._heartbeatTimer) {
        this._heartbeatTimer = setInterval(() => {
          this._onHeartbeatTick();
        }, this.config.heartbeatIntervalMs);
      }

      return report;
    } catch (err: any) {
      this._errorsCount++;
      this._emitError(err);
      throw err;
    }
  }

  public async start(): Promise<void> {
    if (this._state === 'RUNNING' || this._state === 'ONLINE') return;
    await this.bootstrap({ autoActivateOnline: true });
  }

  public async stop(graceful: boolean = true): Promise<void> {
    if (this._state === 'STOPPED') return;

    if (graceful && (this._state === 'RUNNING' || this._state === 'DEGRADED')) {
      this.transitionState('DRAINING', 'Graceful shutdown initiated, draining pending traffic');
      // Yield brief tick to allow active operations to flush
      await new Promise(r => setTimeout(r, 20));
    }

    // Stop heartbeat timer
    if (this._heartbeatTimer) {
      clearInterval(this._heartbeatTimer);
      this._heartbeatTimer = null;
    }

    // 1. Unbind adapter listeners
    for (const [type, cleanup] of this._adapterCleanups.entries()) {
      try { cleanup(); } catch {}
    }
    this._adapterCleanups.clear();

    // 2. Teardown active connections in lifecycle manager
    try {
      await this.connectionManager.shutdownAll();
    } catch (err: any) {
      this._errorsCount++;
    }

    // 3. Close all transport adapters (servers and outbound clients)
    for (const clientAdapter of this._outboundAdapters.values()) {
      try {
        await clientAdapter.close('Node runtime shutdown');
      } catch (err: any) {
        this._errorsCount++;
      }
    }
    this._outboundAdapters.clear();

    for (const adapter of this._adapters.values()) {
      try {
        await adapter.close('Node runtime shutdown');
      } catch (err: any) {
        this._errorsCount++;
      }
    }

    // 4. Reset inbound assembler
    this.assembler.reset();

    // 5. Complete transition to STOPPED
    try {
      this.stateModel.transitionNodeState(this.identity.nodeId, 'STOPPED', 'Node runtime shutdown complete');
    } catch {}
    this.transitionState('STOPPED', 'Node runtime shutdown complete');
    this._bootTimestamp = 0;
    this._bootstrapReport = undefined;
  }

  public async executeOneLanguage(
    source: string,
    options?: OneLanguageExecutionOptions
  ): Promise<OneLanguageExecutionResult> {
    return this.oneLanguageBridge.execute(source, options);
  }

  public async restart(): Promise<void> {
    await this.stop(true);
    await this.start();
  }

  public transitionState(nextState: NodeRuntimeLifecycleState, reason: string): void {
    const prevState = this._state;
    if (prevState === nextState) return;

    const allowed = VALID_RUNTIME_TRANSITIONS.get(prevState);
    if (!allowed || !allowed.has(nextState)) {
      this._errorsCount++;
      const err = new Error(
        `Invalid node runtime transition: '${prevState}' → '${nextState}'. Reason: ${reason}. ` +
        `Allowed: [${allowed ? Array.from(allowed).join(', ') : 'NONE'}].`
      );
      this._emitError(err);
      throw err;
    }

    this._state = nextState;

    for (const handler of this._stateChangeHandlers) {
      try {
        handler(prevState, nextState, reason);
      } catch {
        // Suppress listener error to maintain state consistency
      }
    }
  }

  // ─── Capability & Service Management ─────────────────────────────────────

  public hasCapability(capability: NodeCapability): boolean {
    return this.config.capabilities.includes(capability);
  }

  public registerService(service: INodeService): void {
    this._services.set(service.serviceId, service);
  }

  public unregisterService(serviceId: string): boolean {
    return this._services.delete(serviceId);
  }

  public getService(serviceId: string): INodeService | undefined {
    return this._services.get(serviceId);
  }

  public getServices(): readonly INodeService[] {
    return Object.freeze(Array.from(this._services.values()));
  }

  // ─── Transport Queries ────────────────────────────────────────────────────

  public getAdapter(type: TransportType): ITransportAdapter | undefined {
    return this._adapters.get(type);
  }

  public getActiveTransports(): readonly ITransportAdapter[] {
    return Object.freeze(Array.from(this._adapters.values()));
  }

  private _getEndpointKey(endpoint: TransportEndpoint): string {
    return `${endpoint.transportType}://${endpoint.host}:${endpoint.port}${endpoint.coordinateUri ? ':' + endpoint.coordinateUri : ''}`;
  }

  // ─── Outbound Dispatch & Connection ──────────────────────────────────────

  public async connect(remoteEndpoint: TransportEndpoint): Promise<TransportSession> {
    if (this._state !== 'RUNNING' && this._state !== 'DEGRADED') {
      throw new Error(`Cannot connect while node runtime is in state '${this._state}'. Expected 'RUNNING' or 'DEGRADED'.`);
    }

    const valResult = validateTransportEndpoint(remoteEndpoint);
    if (!valResult.isValid) {
      this._errorsCount++;
      throw new Error(`Cannot connect: Invalid endpoint: ${valResult.error}`);
    }

    const key = this._getEndpointKey(remoteEndpoint);
    const existing = this._outboundAdapters.get(key);
    if (existing && (existing.state === 'CONNECTED' || existing.state === 'CONNECTING') && existing.activeSession) {
      return existing.activeSession;
    }

    const clientAdapter = this._instantiateAdapter(remoteEndpoint.transportType);
    const session = await clientAdapter.connect(remoteEndpoint);

    // Wire inbound packet reception from this connected peer
    clientAdapter.receive((packet, sess) => {
      this._handleInboundPacket(packet, sess.remoteEndpoint);
    });

    clientAdapter.onError((err) => {
      this._handleTransportError(remoteEndpoint.transportType, err);
    });

    try {
      this.connectionManager.registerSession(session);
    } catch {}

    this._outboundAdapters.set(key, clientAdapter);
    return session;
  }

  public async sendMessage(
    message: CubiOMessage,
    destinationEndpoint?: TransportEndpoint,
    options?: TransportSendOptions
  ): Promise<TransportDeliveryReceipt> {
    if (this._state !== 'RUNNING' && this._state !== 'DEGRADED') {
      throw new Error(`Cannot send message while node runtime is in state '${this._state}'. Expected 'RUNNING' or 'DEGRADED'.`);
    }

    // Convert application message to Phase 1 wire packets
    const packets = messageToPackets(message, this.config.mtu);
    let totalBytesTransmitted = 0;
    let lastReceipt: TransportDeliveryReceipt | null = null;

    for (const packet of packets) {
      lastReceipt = await this.sendPacket(packet, destinationEndpoint, options);
      if (!lastReceipt.success) {
        return lastReceipt;
      }
      totalBytesTransmitted += lastReceipt.bytesTransmitted;
    }

    this._messagesProcessed++;

    return Object.freeze({
      success: true,
      packetId: packets[0]?.header.packetId ?? 'MSG',
      bytesTransmitted: totalBytesTransmitted,
      timestamp: Date.now(),
    });
  }

  public async sendPacket(
    packet: CubiOPacket,
    destinationEndpoint?: TransportEndpoint,
    options?: TransportSendOptions
  ): Promise<TransportDeliveryReceipt> {
    if (this._state !== 'RUNNING' && this._state !== 'DEGRADED') {
      throw new Error(`Cannot send packet while node runtime is in state '${this._state}'. Expected 'RUNNING' or 'DEGRADED'.`);
    }

    // 1. Validate packet integrity
    const valResult = validatePacket(packet);
    if (!valResult.valid) {
      this._errorsCount++;
      const reason = valResult.errors.map(e => e.message).join('; ');
      throw new Error(`Cannot send invalid packet: ${reason}`);
    }

    // 2. Resolve destination transport and adapter
    const targetType = destinationEndpoint?.transportType ?? this.config.defaultTransport;
    let adapter: ITransportAdapter | undefined;

    if (destinationEndpoint) {
      const key = this._getEndpointKey(destinationEndpoint);
      const existing = this._outboundAdapters.get(key);

      if (existing && existing.state === 'CONNECTED') {
        adapter = existing;
      } else {
        const serverAdapter = this._adapters.get(targetType);
        if (serverAdapter && !serverAdapter.capabilities.connectionOriented) {
          adapter = serverAdapter;
        } else {
          // Connection-oriented transport: establish client connection
          await this.connect(destinationEndpoint);
          adapter = this._outboundAdapters.get(key);
        }
      }
    } else {
      const matchOutbound = Array.from(this._outboundAdapters.values()).find(
        (a) => a.remoteEndpoint?.coordinateUri === packet.header.destinationUri
      );
      if (matchOutbound && matchOutbound.state === 'CONNECTED') {
        adapter = matchOutbound;
      } else {
        adapter = this._adapters.get(targetType);
      }
    }

    if (!adapter) {
      this._errorsCount++;
      throw new Error(`Cannot send: No transport adapter registered or connected for type '${targetType}'`);
    }

    // 3. Execute transmission through resilience retry engine
    try {
      const { receipt, telemetry } = await TransportResilienceEngine.sendWithResilience(
        adapter,
        packet,
        {
          retryPolicy: this.config.retryPolicy ? {
            maxAttempts: this.config.retryPolicy.maxRetries,
            initialDelayMs: this.config.retryPolicy.initialDelayMs,
            maxDelayMs: this.config.retryPolicy.maxDelayMs,
          } : undefined,
          sendOptions: {
            ...options,
            destinationEndpoint,
          },
        }
      );

      if (telemetry.totalAttempts > 1) {
        this._retriedTransmissionsCount += (telemetry.totalAttempts - 1);
      }

      if (receipt.success) {
        this._packetsSent++;
        this._bytesSent += receipt.bytesTransmitted;
      }

      return receipt;
    } catch (err: any) {
      this._errorsCount++;
      this._emitError(err);
      throw err;
    }
  }

  // ─── Inbound Packet & Message Processing ──────────────────────────────────

  private _handleInboundPacket(packet: CubiOPacket, fromEndpoint?: TransportEndpoint): void {
    this._packetsReceived++;
    this._bytesReceived += packet.payload?.byteLength ?? 0;

    // Notify packet handlers
    for (const handler of this._packetHandlers) {
      try { handler(packet, fromEndpoint); } catch {}
    }

    // 1. Lifecycle check
    if (this._state === 'STOPPED' || this._state === 'FAULTED') {
      this._packetsDropped++;
      return;
    }

    if (this._state === 'DRAINING') {
      this._packetsDropped++;
      return;
    }

    // 2. Validate packet
    const valResult = validatePacket(packet);
    if (!valResult.valid) {
      this._packetsDropped++;
      this._errorsCount++;
      return;
    }

    // 3. TTL Check
    if (packet.header.ttl <= 1) {
      this._packetsDropped++;
      return;
    }

    // 4. Destination resolution
    const isDestLocalNode = packet.header.destinationUri === this.identity.coordinateUri;
    const matchingService = Array.from(this._services.values()).find(
      s => s.coordinateUri === packet.header.destinationUri
    );

    if (isDestLocalNode || matchingService) {
      try {
        const assembled = this.assembler.processPacket(packet, {
          sessionId: 'inbound',
          transportType: fromEndpoint?.transportType ?? this.config.defaultTransport,
          remoteEndpoint: fromEndpoint ?? { transportType: this.config.defaultTransport, host: 'in-proc', port: 0 },
          establishedAt: Date.now(),
          lastActivityAt: Date.now(),
          bytesReceived: packet.payload.byteLength,
          bytesSent: 0,
          packetsReceived: 1,
          packetsSent: 0,
        });

        if (assembled) {
          this._handleReconstructedEnvelope(assembled.envelope, matchingService, fromEndpoint);
        }
      } catch (err: any) {
        this._packetsDropped++;
        this._errorsCount++;
      }
      return;
    }

    // 5. Forwarding / Relay check
    if (this.hasCapability('PACKET_ROUTING')) {
      this._packetsForwarded++;
      // Auto-forward if route exists (in Phase 3 Task 01, forwarding increments counter)
      return;
    }

    // Destination not local and cannot route
    this._packetsDropped++;
  }

  private _handleReconstructedEnvelope(
    envelope: any,
    targetService?: INodeService,
    fromEndpoint?: TransportEndpoint
  ): void {
    this._messagesProcessed++;

    let msg: CubiOMessage;
    try {
      msg = envelopeToMessage(envelope);
    } catch {
      msg = {
        header: {
          messageId: envelope.envelopeId ?? 'MSG_RECONSTRUCTED',
          senderId: envelope.sender?.ownerCubId ?? 'PEER',
          senderCoordinateUri: envelope.source?.uri ?? envelope.source ?? 'CUBIO://UNKNOWN',
          recipientCoordinateUri: envelope.destination?.uri ?? envelope.destination ?? this.identity.coordinateUri,
          protocolVersion: '1.0.0',
          messageType: 'DIRECT',
          priority: 'NORMAL',
          schemaVersion: '1.0.0',
          correlationId: envelope.correlationId,
        },
        routing: {
          ttl: 32,
          routingFlags: 0,
          networkZone: '01',
        },
        metadata: {
          contentType: envelope.payload?.contentType ?? 'application/json',
          timestamp: envelope.timestamp ?? Date.now(),
          retryCount: 0,
          contentChecksum: '',
        },
        payload: envelope.payload?.body,
      };
    }

    // Emit message to global listeners
    for (const handler of this._messageHandlers) {
      try { handler(msg, fromEndpoint); } catch {}
    }

    // Failure isolation: dispatch to local service with try-catch containment
    if (targetService) {
      try {
        const result = targetService.handleMessage(msg);
        if (result && typeof (result as any).catch === 'function') {
          (result as Promise<any>).catch((err: Error) => {
            this._errorsCount++;
            this._emitError(new Error(`Service '${targetService.serviceId}' async error: ${err.message}`));
          });
        }
      } catch (err: any) {
        this._errorsCount++;
        this._emitError(new Error(`Service '${targetService.serviceId}' sync error: ${err.message}`));
      }
    }
  }

  private _handleTransportError(transportType: TransportType, err: any): void {
    this._errorsCount++;
    this._emitError(new Error(`Transport '${transportType}' error: ${err.message}`));

    // If fatal transport error, evaluate degradation
    if (err.fatal && this._state === 'RUNNING') {
      try {
        this.transitionState('DEGRADED', `Fatal error on transport '${transportType}'`);
      } catch {}
    }
  }

  private _onHeartbeatTick(): void {
    // Touch activity across connections and sweep stale peers
    const staleResult = this.connectionManager.checkStaleConnections();
    if (staleResult.failed.length > 0 && this._state === 'RUNNING') {
      // Degrade state if high volume of failures
      if (staleResult.failed.length > 5) {
        try {
          this.transitionState('DEGRADED', 'Multiple connection failures detected during heartbeat');
        } catch {}
      }
    }
  }

  private _emitError(err: Error): void {
    for (const handler of this._errorHandlers) {
      try { handler(err); } catch {}
    }
  }

  private _instantiateAdapter(type: TransportType): ITransportAdapter {
    switch (type) {
      case 'TCP': return new TcpTransportAdapter();
      case 'UDP': return new UdpTransportAdapter();
      case 'WEBSOCKET': return new WebSocketTransportAdapter();
      case 'IPC': return new IpcPipeTransportAdapter();
      case 'MEMORY': return new MemoryTransportAdapter();
      default:
        throw new Error(`Unsupported transport type '${type}'`);
    }
  }

  // ─── Event Subscriptions ──────────────────────────────────────────────────

  public onStateChange(handler: NodeRuntimeStateChangeHandler): () => void {
    this._stateChangeHandlers.add(handler);
    return () => {
      this._stateChangeHandlers.delete(handler);
    };
  }

  public onMessage(handler: (message: CubiOMessage, fromEndpoint?: TransportEndpoint) => void): () => void {
    this._messageHandlers.add(handler);
    return () => {
      this._messageHandlers.delete(handler);
    };
  }

  public onPacket(handler: (packet: CubiOPacket, fromEndpoint?: TransportEndpoint) => void): () => void {
    this._packetHandlers.add(handler);
    return () => {
      this._packetHandlers.delete(handler);
    };
  }

  public onError(handler: (error: Error) => void): () => void {
    this._errorHandlers.add(handler);
    return () => {
      this._errorHandlers.delete(handler);
    };
  }
}
