/**
 * CUBiO Network Node — Runtime Architecture Types
 * ===============================================
 *
 * Core architectural types, interfaces, and state representations for the
 * persistent CUBiO Node Runtime executing atop Phase 1 Protocol and Phase 2 Transport.
 */

import {
  type NodeRole,
  type NodeCapability,
  type CanonicalNodeIdentity,
  type CanonicalNodeConfig,
  type NodeTelemetry,
  type INodeService,
} from '../protocol/v1/nodeTypes';

import {
  type CubiOPacket,
} from '../protocol/v1/packetTypes';

import {
  type CubiOMessage,
} from '../protocol/v1/messageTypes';

import {
  type TransportType,
  type TransportEndpoint,
  type ITransportAdapter,
  type TransportDeliveryReceipt,
  type TransportSendOptions,
} from '../transport/types';

import { ConnectionLifecycleManager } from '../transport/connectionLifecycleManager';
import { InboundEnvelopeAssembler, CubiOTransportPipeline } from '../transport/transportPipeline';
import { TransportResilienceEngine } from '../transport/transportRetryEngine';
import { CanonicalNetworkStateModel } from '../protocol/v1/stateModel';
import { type NodeBootstrapReport, type NodeBootstrapOptions } from './nodeBootstrapTypes';
import {
  type INodeOneLanguageBridge,
  type OneLanguageExecutionOptions,
  type OneLanguageExecutionResult,
} from './oneLanguageRuntimeTypes';

/**
 * High-level persistent node runtime lifecycle states.
 * Monotonic lifecycle:
 *   STOPPED ──▶ INITIALIZING ──▶ STARTING ──▶ RUNNING ──▶ DRAINING ──▶ STOPPED
 *      ▲                                         │           │
 *      │                                         ▼           │
 *      └──────────────────────────────────── FAULTED ◀───────┘
 */
export type NodeRuntimeLifecycleState =
  | 'STOPPED'
  | 'INITIALIZING'
  | 'STARTING'
  | 'READY'
  | 'RUNNING'
  | 'ONLINE'
  | 'DEGRADED'
  | 'DRAINING'
  | 'FAULTED';

/**
 * Transport binding descriptor configuring which transport adapters the node binds.
 */
export interface NodeTransportBindingConfig {
  readonly transportType: TransportType;
  readonly endpoint: TransportEndpoint;
  readonly adapter?: ITransportAdapter;
  readonly enabled?: boolean;
}

/**
 * Complete runtime configuration for a persistent CUBiO node.
 * Unifies Phase 1 CanonicalNodeConfig with Phase 2 Transport bindings.
 */
export interface NodeRuntimeConfig {
  readonly identity: CanonicalNodeIdentity;
  readonly mtu: number;
  readonly heartbeatIntervalMs: number;
  readonly rateLimitPerMinute: number;
  readonly capabilities: readonly NodeCapability[];
  readonly routingPolicy: 'STRICT_COORDINATE' | 'DIRECT_ONLY';
  
  /** Declared transport listeners to bind upon startup */
  readonly transports: readonly NodeTransportBindingConfig[];
  /** Default transport driver to use for outbound routing when not specified */
  readonly defaultTransport: TransportType;

  /** Session & lifecycle options */
  readonly staleTimeoutMs?: number;
  readonly failureTimeoutMs?: number;
  readonly sweepIntervalMs?: number;
  readonly maxConcurrentPeers?: number;

  /** Retry & resilience options */
  readonly retryPolicy?: {
    readonly maxRetries?: number;
    readonly initialDelayMs?: number;
    readonly maxDelayMs?: number;
  };

  /** Pipeline options */
  readonly pipelineOptions?: {
    readonly maxQueueSize?: number;
    readonly assemblyTimeoutMs?: number;
  };
}

/**
 * Comprehensive runtime telemetry combining Phase 1 protocol stats with Phase 2 transport metrics.
 */
export interface NodeRuntimeTelemetry extends NodeTelemetry {
  readonly activeConnectionsCount: number;
  readonly activeTransportsCount: number;
  readonly registeredServicesCount: number;
  readonly retriedTransmissionsCount: number;
  readonly circuitBreakerTrips: number;
  readonly reconstructedEnvelopes: number;
  readonly pipelineQueueDepth: number;
}

/**
 * State change callback for the node runtime.
 */
export type NodeRuntimeStateChangeHandler = (
  previousState: NodeRuntimeLifecycleState,
  newState: NodeRuntimeLifecycleState,
  reason: string
) => void;

/**
 * Interface contract for the CUBiO Node Runtime supervisor.
 */
export interface INodeRuntime {
  readonly identity: CanonicalNodeIdentity;
  readonly config: NodeRuntimeConfig;
  readonly state: NodeRuntimeLifecycleState;
  readonly telemetry: NodeRuntimeTelemetry;

  /** Core Subsystem References */
  readonly connectionManager: ConnectionLifecycleManager;
  readonly assembler: InboundEnvelopeAssembler;
  readonly resilienceEngine: typeof TransportResilienceEngine;
  readonly stateModel: CanonicalNetworkStateModel;
  readonly bootstrapReport?: NodeBootstrapReport;
  readonly oneLanguageBridge?: INodeOneLanguageBridge;

  /** Canonical Bootstrap Sequence */
  bootstrap(options?: NodeBootstrapOptions): Promise<NodeBootstrapReport>;

  /** One Language Execution */
  executeOneLanguage(source: string, options?: OneLanguageExecutionOptions): Promise<OneLanguageExecutionResult>;

  /** Startup and Shutdown */
  start(): Promise<void>;
  stop(graceful?: boolean): Promise<void>;
  restart(): Promise<void>;
  transitionState(nextState: NodeRuntimeLifecycleState, reason: string): void;

  /** Capability checks */
  hasCapability(capability: NodeCapability): boolean;

  /** Service registry */
  registerService(service: INodeService): void;
  unregisterService(serviceId: string): boolean;
  getService(serviceId: string): INodeService | undefined;
  getServices(): readonly INodeService[];

  /** Transport management */
  getAdapter(type: TransportType): ITransportAdapter | undefined;
  getActiveTransports(): readonly ITransportAdapter[];

  /** Outbound dispatch & connection */
  connect(remoteEndpoint: TransportEndpoint): Promise<TransportSession>;
  sendMessage(
    message: CubiOMessage,
    destinationEndpoint?: TransportEndpoint,
    options?: TransportSendOptions
  ): Promise<TransportDeliveryReceipt>;

  sendPacket(
    packet: CubiOPacket,
    destinationEndpoint?: TransportEndpoint,
    options?: TransportSendOptions
  ): Promise<TransportDeliveryReceipt>;

  /** Event subscriptions */
  onStateChange(handler: NodeRuntimeStateChangeHandler): () => void;
  onMessage(handler: (message: CubiOMessage, fromEndpoint?: TransportEndpoint) => void): () => void;
  onPacket(handler: (packet: CubiOPacket, fromEndpoint?: TransportEndpoint) => void): () => void;
  onError(handler: (error: Error) => void): () => void;
}
