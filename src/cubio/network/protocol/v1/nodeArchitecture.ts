/**
 * CUBiO Network Protocol v1 — Canonical Node Architecture Implementation
 * ============================================================
 *
 * Implements the reference node architecture, configuration validator,
 * lifecycle state machine, and packet routing responsibilities.
 *
 * REUSES VERIFIED SYSTEMS:
 *   - deterministicHash (src/cubio/state/determinism.ts)
 *   - CubiONetworkCoordinateEngine (src/cubio/network/coordinate/coordinate.ts)
 *   - validatePacket (src/cubio/network/protocol/v1/packetEngine.ts)
 *   - messageToPackets (src/cubio/network/protocol/v1/messageEngine.ts)
 *
 * ANTI-FABRICATION NOTICE:
 *   This implementation validates node architecture, configuration contracts,
 *   lifecycle state transitions, and protocol responsibilities.
 *   It does NOT launch real OS daemon processes or bind raw TCP sockets.
 */

import { deterministicHash } from '../../../state/determinism';
import { CubiONetworkCoordinateEngine } from '../../coordinate/coordinate';
import { validatePacket } from './packetEngine';
import { messageToPackets } from './messageEngine';
import { CubiOPacket } from './packetTypes';
import { CubiOMessage } from './messageTypes';
import {
  type NodeRole,
  type NodeCapability,
  type NodeLifecycleState,
  type CanonicalNodeIdentity,
  type CanonicalNodeConfig,
  type NodeTelemetry,
  type NodePacketProcessingResult,
  type INodeService,
  type INetworkNode,
  type NodeConfigValidationError,
  type NodeConfigValidationResult,
} from './nodeTypes';

const CUB_ID_REGEX = /^CUB-[A-Z0-9]{8}$/;

const VALID_ROLES: ReadonlySet<NodeRole> = new Set<NodeRole>([
  'EDGE',
  'RELAY',
  'COMPUTE',
  'STORAGE',
  'GATEWAY',
  'CORE',
]);

const VALID_LIFECYCLE_TRANSITIONS: ReadonlyMap<NodeLifecycleState, ReadonlySet<NodeLifecycleState>> = new Map([
  ['INITIALIZING', new Set<NodeLifecycleState>(['READY', 'FAULTED'])],
  ['READY',        new Set<NodeLifecycleState>(['ONLINE', 'STOPPED', 'FAULTED'])],
  ['ONLINE',       new Set<NodeLifecycleState>(['DEGRADED', 'DRAINING', 'STOPPED', 'FAULTED'])],
  ['DEGRADED',     new Set<NodeLifecycleState>(['ONLINE', 'DRAINING', 'STOPPED', 'FAULTED'])],
  ['DRAINING',     new Set<NodeLifecycleState>(['STOPPED', 'FAULTED'])],
  ['STOPPED',      new Set<NodeLifecycleState>(['READY'])], // Can reboot into READY
  ['FAULTED',      new Set<NodeLifecycleState>(['INITIALIZING'])], // Reset
]);

// ─────────────────────────────────────────────────────────────────────────────
// Node Identity & Configuration Factory
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a deterministic node identity.
 */
export function createNodeIdentity(params: {
  nodeName: string;
  coordinateUri: string;
  ownerCubId: string;
  role: NodeRole;
  publicKey?: string;
  hardwareFingerprint?: string;
}): CanonicalNodeIdentity {
  const seed = `${params.ownerCubId}|${params.coordinateUri}|${params.role}|${params.nodeName}`;
  const nodeId = `NODE_${deterministicHash(seed).slice(2, 18)}`;
  const publicKey = params.publicKey ?? `0xPUB_${deterministicHash(`${nodeId}:KEY`).slice(2, 34)}`;

  return Object.freeze({
    nodeId,
    nodeName: params.nodeName,
    coordinateUri: params.coordinateUri,
    ownerCubId: params.ownerCubId,
    role: params.role,
    publicKey,
    hardwareFingerprint: params.hardwareFingerprint,
  });
}

/**
 * Creates a valid default CanonicalNodeConfig from an identity.
 */
export function createDefaultNodeConfig(
  identity: CanonicalNodeIdentity,
  overrides: Partial<CanonicalNodeConfig> = {}
): CanonicalNodeConfig {
  const defaultCapabilities: Record<NodeRole, NodeCapability[]> = {
    EDGE: ['MESSAGE_DISPATCH', 'OBSERVABILITY_TELEMETRY'],
    RELAY: ['PACKET_ROUTING', 'ENVELOPE_FORWARDING', 'OBSERVABILITY_TELEMETRY'],
    COMPUTE: ['MESSAGE_DISPATCH', 'AI_INFERENCE_EXECUTION', 'OBSERVABILITY_TELEMETRY'],
    STORAGE: ['MESSAGE_DISPATCH', 'STORAGE_PERSISTENCE', 'STATE_SYNCHRONIZATION'],
    GATEWAY: ['PACKET_ROUTING', 'GATEWAY_TRANSIT', 'OBSERVABILITY_TELEMETRY'],
    CORE: ['PACKET_ROUTING', 'ENVELOPE_FORWARDING', 'MESSAGE_DISPATCH', 'OBSERVABILITY_TELEMETRY'],
  };

  return Object.freeze({
    identity,
    listenEndpoints: Object.freeze(overrides.listenEndpoints ?? [
      { protocol: 'VIRTUAL' as const, host: '127.0.0.1', port: 3690, tls: false },
    ] as const),
    mtu: overrides.mtu ?? 1400,
    maxConcurrentPeers: overrides.maxConcurrentPeers ?? 64,
    heartbeatIntervalMs: overrides.heartbeatIntervalMs ?? 15000,
    storageQuotaBytes: overrides.storageQuotaBytes ?? 1024 * 1024 * 100, // 100 MB
    rateLimitPerMinute: overrides.rateLimitPerMinute ?? 600,
    capabilities: Object.freeze(overrides.capabilities ?? defaultCapabilities[identity.role]),
    routingPolicy: overrides.routingPolicy ?? 'STRICT_COORDINATE',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Node Configuration Validator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates a CanonicalNodeConfig against all architectural constraints.
 */
export function validateNodeConfig(config: any): NodeConfigValidationResult {
  const errors: NodeConfigValidationError[] = [];

  if (!config || typeof config !== 'object') {
    errors.push({ code: 'ERR_MALFORMED_CONFIG', message: 'Config must be a non-null object.' });
    return Object.freeze({ valid: false, errors: Object.freeze(errors) });
  }

  const { identity, mtu, maxConcurrentPeers, storageQuotaBytes, rateLimitPerMinute, capabilities, listenEndpoints } = config;

  if (!identity || typeof identity !== 'object') {
    errors.push({ code: 'ERR_MALFORMED_CONFIG', message: 'Missing node identity.', field: 'identity' });
  } else {
    if (!identity.nodeId || typeof identity.nodeId !== 'string' || !identity.nodeId.startsWith('NODE_')) {
      errors.push({ code: 'ERR_INVALID_NODE_ID', message: 'nodeId must start with NODE_.', field: 'identity.nodeId' });
    }
    if (!identity.ownerCubId || !CUB_ID_REGEX.test(identity.ownerCubId)) {
      errors.push({ code: 'ERR_INVALID_OWNER_ID', message: 'ownerCubId must match CUB-XXXXXXXX.', field: 'identity.ownerCubId' });
    }
    if (!identity.role || !VALID_ROLES.has(identity.role)) {
      errors.push({ code: 'ERR_INVALID_ROLE', message: `Invalid node role '${identity.role}'.`, field: 'identity.role' });
    }
    if (!identity.coordinateUri || typeof identity.coordinateUri !== 'string') {
      errors.push({ code: 'ERR_INVALID_COORDINATE', message: 'Missing coordinateUri.', field: 'identity.coordinateUri' });
    } else {
      const coordVal = CubiONetworkCoordinateEngine.tryParse(identity.coordinateUri);
      if (!coordVal.isValid) {
        errors.push({ code: 'ERR_INVALID_COORDINATE', message: `Invalid coordinateUri: ${coordVal.errors[0]?.message}`, field: 'identity.coordinateUri' });
      }
    }
  }

  // MTU check
  if (typeof mtu !== 'number' || mtu < 128 || mtu > 65536) {
    errors.push({ code: 'ERR_INVALID_MTU', message: 'MTU must be an integer in [128..65536].', field: 'mtu' });
  }

  // Peer limit
  if (typeof maxConcurrentPeers !== 'number' || maxConcurrentPeers < 1) {
    errors.push({ code: 'ERR_INVALID_PEER_LIMIT', message: 'maxConcurrentPeers must be >= 1.', field: 'maxConcurrentPeers' });
  }

  // Capabilities
  if (!Array.isArray(capabilities) || capabilities.length === 0) {
    errors.push({ code: 'ERR_MISSING_CAPABILITIES', message: 'Node must declare at least one capability.', field: 'capabilities' });
  }

  // Endpoints
  if (!Array.isArray(listenEndpoints)) {
    errors.push({ code: 'ERR_INVALID_ENDPOINT', message: 'listenEndpoints must be an array.', field: 'listenEndpoints' });
  }

  const valid = errors.length === 0;
  return Object.freeze({
    valid,
    errors: Object.freeze(errors),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Canonical Network Node Reference Class
// ─────────────────────────────────────────────────────────────────────────────

export class CanonicalNetworkNode implements INetworkNode {
  public readonly identity: CanonicalNodeIdentity;
  public readonly config: CanonicalNodeConfig;
  private _lifecycleState: NodeLifecycleState = 'INITIALIZING';
  private _bootTimestamp: number = 0;
  private services: Map<string, INodeService> = new Map();

  // Telemetry counters
  private _packetsReceived: number = 0;
  private _packetsSent: number = 0;
  private _packetsForwarded: number = 0;
  private _packetsDropped: number = 0;
  private _messagesProcessed: number = 0;
  private _bytesReceived: number = 0;
  private _bytesSent: number = 0;
  private _errorsCount: number = 0;

  constructor(config: CanonicalNodeConfig) {
    const valResult = validateNodeConfig(config);
    if (!valResult.valid) {
      const msgs = valResult.errors.map(e => `[${e.code}] ${e.field}: ${e.message}`).join('; ');
      throw new Error(`Cannot instantiate CanonicalNetworkNode: Invalid config - ${msgs}`);
    }
    this.identity = config.identity;
    this.config = config;
    this._lifecycleState = 'READY';
  }

  public get lifecycleState(): NodeLifecycleState {
    return this._lifecycleState;
  }

  public get telemetry(): NodeTelemetry {
    const uptimeMs = this._bootTimestamp > 0 ? Date.now() - this._bootTimestamp : 0;
    let healthStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' = 'HEALTHY';

    if (this._lifecycleState === 'FAULTED') {
      healthStatus = 'CRITICAL';
    } else if (this._lifecycleState === 'DEGRADED' || this._packetsDropped > 50) {
      healthStatus = 'DEGRADED';
    }

    return Object.freeze({
      uptimeMs,
      connectedPeersCount: 0,
      packetsReceived: this._packetsReceived,
      packetsSent: this._packetsSent,
      packetsForwarded: this._packetsForwarded,
      packetsDropped: this._packetsDropped,
      messagesProcessed: this._messagesProcessed,
      bytesReceived: this._bytesReceived,
      bytesSent: this._bytesSent,
      errorsCount: this._errorsCount,
      healthStatus,
    });
  }

  public start(): void {
    if (this._lifecycleState !== 'READY' && this._lifecycleState !== 'STOPPED') {
      throw new Error(`Cannot start node from state '${this._lifecycleState}'. Expected 'READY' or 'STOPPED'.`);
    }
    this.transitionState('ONLINE', 'Node start invoked');
    this._bootTimestamp = Date.now();
  }

  public stop(graceful: boolean = true): void {
    if (this._lifecycleState === 'STOPPED') return;
    if (graceful && this._lifecycleState === 'ONLINE') {
      this.transitionState('DRAINING', 'Graceful shutdown initiated');
      this.transitionState('STOPPED', 'Drain complete, stopped');
    } else {
      this.transitionState('STOPPED', 'Immediate stop invoked');
    }
  }

  public transitionState(nextState: NodeLifecycleState, reason: string): void {
    const allowed = VALID_LIFECYCLE_TRANSITIONS.get(this._lifecycleState);
    if (!allowed || !allowed.has(nextState)) {
      this._errorsCount++;
      throw new Error(
        `Invalid node lifecycle transition: '${this._lifecycleState}' → '${nextState}'. ` +
        `Reason: ${reason}. Allowed: [${allowed ? Array.from(allowed).join(', ') : 'NONE'}].`
      );
    }
    this._lifecycleState = nextState;
  }

  public hasCapability(capability: NodeCapability): boolean {
    return this.config.capabilities.includes(capability);
  }

  public registerService(service: INodeService): void {
    this.services.set(service.serviceId, service);
  }

  public unregisterService(serviceId: string): boolean {
    return this.services.delete(serviceId);
  }

  public hasService(serviceId: string): boolean {
    return this.services.has(serviceId);
  }

  public getServices(): readonly INodeService[] {
    return Object.freeze(Array.from(this.services.values()));
  }

  /**
   * Protocol responsibility: processes an inbound wire packet.
   * Validates integrity, enforces lifecycle, routes to local service or forwards.
   */
  public processInboundPacket(packet: CubiOPacket): NodePacketProcessingResult {
    this._packetsReceived++;
    this._bytesReceived += packet.payload.byteLength;

    // 1. Lifecycle check
    if (this._lifecycleState === 'STOPPED' || this._lifecycleState === 'FAULTED') {
      this._packetsDropped++;
      return Object.freeze({
        action: 'REJECTED',
        reason: `Node is in ${this._lifecycleState} state. Inbound traffic rejected.`,
        packetId: packet.header?.packetId ?? 'UNKNOWN',
      });
    }

    if (this._lifecycleState === 'DRAINING') {
      this._packetsDropped++;
      return Object.freeze({
        action: 'REJECTED',
        reason: 'Node is DRAINING. New traffic rejected.',
        packetId: packet.header?.packetId ?? 'UNKNOWN',
      });
    }

    // 2. Validate packet integrity
    const valResult = validatePacket(packet);
    if (!valResult.valid) {
      this._packetsDropped++;
      this._errorsCount++;
      const reason = valResult.errors.map(e => e.message).join('; ');
      return Object.freeze({
        action: 'DROPPED',
        reason: `Integrity check failed: ${reason}`,
        packetId: packet.header?.packetId ?? 'UNKNOWN',
      });
    }

    // 3. TTL check
    if (packet.header.ttl <= 1) {
      this._packetsDropped++;
      return Object.freeze({
        action: 'DROPPED',
        reason: 'TTL expired in transit.',
        packetId: packet.header.packetId,
      });
    }

    // 4. Destination resolution
    const isDestLocalNode = packet.header.destinationUri === this.identity.coordinateUri;
    const matchingService = Array.from(this.services.values()).find(
      s => s.coordinateUri === packet.header.destinationUri
    );

    if (isDestLocalNode || matchingService) {
      this._messagesProcessed++;
      return Object.freeze({
        action: 'TERMINATED_LOCAL',
        packetId: packet.header.packetId,
        targetService: matchingService?.serviceId ?? 'NODE_CONTROL',
      });
    }

    // 5. Forwarding / Relay check
    if (this.hasCapability('PACKET_ROUTING')) {
      this._packetsForwarded++;
      return Object.freeze({
        action: 'FORWARDED',
        packetId: packet.header.packetId,
        nextHopUri: packet.header.destinationUri,
      });
    }

    // Node is not the destination and cannot route
    this._packetsDropped++;
    return Object.freeze({
      action: 'REJECTED',
      reason: `Packet destination '${packet.header.destinationUri}' is not local and node lacks 'PACKET_ROUTING' capability.`,
      packetId: packet.header.packetId,
    });
  }

  /**
   * Protocol responsibility: serializes an outbound application message into wire packets.
   */
  public dispatchOutboundMessage(message: CubiOMessage): readonly CubiOPacket[] {
    if (this._lifecycleState !== 'ONLINE') {
      throw new Error(`Cannot dispatch outbound message while node is in state '${this._lifecycleState}'. Expected 'ONLINE'.`);
    }

    const packets = messageToPackets(message, this.config.mtu);
    this._packetsSent += packets.length;
    for (const p of packets) {
      this._bytesSent += p.payload.byteLength;
    }
    return packets;
  }
}
