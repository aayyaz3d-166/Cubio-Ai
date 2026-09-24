/**
 * CUBiO AI — Phase 3 / Task 05: One Language Node Declaration Mapper
 * ===================================================================
 *
 * Deterministically maps validated CubiONodeDeclarationAST nodes into
 * concrete NodeRuntimeConfig and CanonicalNodeConfig structures without
 * introducing ambiguous or duplicate configuration semantics.
 */

import {
  type CubiONodeDeclarationAST,
  type NodeDeclarationCompilationResult,
} from './oneLanguageNodeDeclarationTypes';
import {
  type NodeRuntimeConfig,
  type NodeTransportBindingConfig,
} from './nodeRuntimeTypes';
import {
  type CanonicalNodeIdentity,
  type CanonicalNodeConfig,
  type NodeCapability,
  type NodeListenEndpoint,
} from '../protocol/v1/nodeTypes';
import { createNodeIdentity } from '../protocol/v1/nodeArchitecture';
import { type TransportType, type TransportEndpoint } from '../transport/types';

/** Default capability assignments matching role profiles */
const DEFAULT_ROLE_CAPABILITIES: Record<string, NodeCapability[]> = {
  EDGE: ['MESSAGE_DISPATCH', 'OBSERVABILITY_TELEMETRY'],
  RELAY: ['PACKET_ROUTING', 'ENVELOPE_FORWARDING', 'OBSERVABILITY_TELEMETRY'],
  COMPUTE: ['MESSAGE_DISPATCH', 'AI_INFERENCE_EXECUTION', 'OBSERVABILITY_TELEMETRY'],
  STORAGE: ['MESSAGE_DISPATCH', 'STORAGE_PERSISTENCE', 'STATE_SYNCHRONIZATION'],
  GATEWAY: ['PACKET_ROUTING', 'GATEWAY_TRANSIT', 'OBSERVABILITY_TELEMETRY'],
  CORE: ['PACKET_ROUTING', 'ENVELOPE_FORWARDING', 'MESSAGE_DISPATCH', 'OBSERVABILITY_TELEMETRY'],
};

export class CubiONodeDeclarationMapper {
  /**
   * Maps a validated AST into concrete runtime and canonical node configurations.
   */
  public mapToRuntimeConfig(ast: CubiONodeDeclarationAST): {
    runtimeConfig: NodeRuntimeConfig;
    canonicalConfig: CanonicalNodeConfig;
    identity: CanonicalNodeIdentity;
  } {
    if (!ast.coordinateUri || !ast.owner || !ast.role) {
      throw new Error('[CubiONodeDeclarationMapper] Cannot map incomplete AST: missing required fields');
    }

    // 1. Construct Deterministic Identity
    const identity = createNodeIdentity({
      nodeName: ast.name,
      coordinateUri: ast.coordinateUri,
      ownerCubId: ast.owner,
      role: ast.role,
      publicKey: ast.publicKey,
      hardwareFingerprint: ast.hardwareFingerprint,
    });

    // 2. Map Transport Listen Bindings
    const transportBindings: NodeTransportBindingConfig[] = [];
    const listenEndpoints: NodeListenEndpoint[] = [];

    for (const binding of ast.listenBindings) {
      const endpoint: TransportEndpoint = {
        transportType: binding.protocol,
        host: binding.host,
        port: binding.port,
        path: binding.path,
      };

      transportBindings.push({
        transportType: binding.protocol,
        endpoint,
        enabled: true,
      });

      // Map to Canonical Node Listen Endpoint for Phase 1 compatibility
      let canonicalProto: 'TCP' | 'WEBSOCKET' | 'VIRTUAL' = 'VIRTUAL';
      if (binding.protocol === 'TCP') canonicalProto = 'TCP';
      else if (binding.protocol === 'WEBSOCKET') canonicalProto = 'WEBSOCKET';

      listenEndpoints.push({
        protocol: canonicalProto,
        host: binding.host,
        port: binding.port,
        tls: binding.tls ?? false,
      });
    }

    // 3. Resolve Default Transport
    const defaultTransport: TransportType =
      ast.defaultTransport ??
      (ast.listenBindings.length > 0 ? ast.listenBindings[0].protocol : 'TCP');

    // 4. Resolve Capabilities
    let capabilities: readonly NodeCapability[];
    if (ast.capabilities && ast.capabilities.length > 0) {
      capabilities = Object.freeze([...ast.capabilities]);
    } else {
      const defCaps = DEFAULT_ROLE_CAPABILITIES[ast.role] ?? ['MESSAGE_DISPATCH'];
      capabilities = Object.freeze([...defCaps]);
    }

    // Ensure CORE and RELAY always have PACKET_ROUTING
    if ((ast.role === 'CORE' || ast.role === 'RELAY') && !capabilities.includes('PACKET_ROUTING')) {
      capabilities = Object.freeze([...capabilities, 'PACKET_ROUTING']);
    }

    // 5. Common Operational Parameters
    const mtu = ast.mtu ?? 1400;
    const heartbeatIntervalMs = ast.heartbeat ?? 5000;
    const rateLimitPerMinute = ast.rateLimit ?? 1000;
    const maxConcurrentPeers = ast.maxPeers ?? 128;
    const storageQuotaBytes = ast.storageQuota ?? 1024 * 1024 * 100; // 100MB
    const routingPolicy = ast.routingPolicy ?? 'STRICT_COORDINATE';

    // 6. Build NodeRuntimeConfig
    const runtimeConfig: NodeRuntimeConfig = Object.freeze({
      identity,
      mtu,
      heartbeatIntervalMs,
      rateLimitPerMinute,
      capabilities,
      routingPolicy,
      transports: Object.freeze(transportBindings),
      defaultTransport,
      staleTimeoutMs: ast.staleTimeoutMs,
      failureTimeoutMs: ast.failureTimeoutMs,
      sweepIntervalMs: ast.sweepIntervalMs,
      maxConcurrentPeers,
      retryPolicy: ast.retryPolicy
        ? {
            maxRetries: ast.retryPolicy.maxRetries,
            initialDelayMs: ast.retryPolicy.initialDelayMs,
            maxDelayMs: ast.retryPolicy.maxDelayMs,
          }
        : undefined,
      pipelineOptions: ast.pipelineOptions
        ? {
            maxQueueSize: ast.pipelineOptions.maxQueueSize,
            assemblyTimeoutMs: ast.pipelineOptions.assemblyTimeoutMs,
          }
        : undefined,
    });

    // 7. Build CanonicalNodeConfig (Phase 1 protocol contract)
    const canonicalConfig: CanonicalNodeConfig = Object.freeze({
      identity,
      listenEndpoints: Object.freeze(listenEndpoints),
      mtu,
      maxConcurrentPeers,
      heartbeatIntervalMs,
      storageQuotaBytes,
      rateLimitPerMinute,
      capabilities,
      routingPolicy,
    });

    return {
      runtimeConfig,
      canonicalConfig,
      identity,
    };
  }
}
