/**
 * CUBiO Network Node — Runtime Configuration & Validation
 * ========================================================
 *
 * Implements strict configuration validation and default factory builders
 * for the persistent CUBiO Node Runtime.
 */

import {
  type CanonicalNodeIdentity,
  type NodeRole,
  type NodeCapability,
  type NodeConfigValidationError,
  type NodeConfigValidationResult,
} from '../protocol/v1/nodeTypes';

import { validateTransportEndpoint } from '../transport/transportSpecification';
import { type TransportType, type TransportEndpoint } from '../transport/types';
import { type NodeRuntimeConfig, type NodeTransportBindingConfig } from './nodeRuntimeTypes';

const CUB_ID_REGEX = /^CUB-[A-Z0-9]{8}$/;

const VALID_ROLES: ReadonlySet<NodeRole> = new Set<NodeRole>([
  'EDGE',
  'RELAY',
  'COMPUTE',
  'STORAGE',
  'GATEWAY',
  'CORE',
]);

const VALID_CAPABILITIES: ReadonlySet<NodeCapability> = new Set<NodeCapability>([
  'PACKET_ROUTING',
  'ENVELOPE_FORWARDING',
  'MESSAGE_DISPATCH',
  'STORAGE_PERSISTENCE',
  'AI_INFERENCE_EXECUTION',
  'STATE_SYNCHRONIZATION',
  'GATEWAY_TRANSIT',
  'OBSERVABILITY_TELEMETRY',
]);

const VALID_TRANSPORTS: ReadonlySet<string> = new Set<string>([
  'UDP',
  'TCP',
  'WEBSOCKET',
  'IPC',
  'IPC_PIPE',
  'MEMORY',
]);

/**
 * Validates a complete NodeRuntimeConfig.
 * Checks identity, MTU, declared capabilities, routing policy, and transport bindings.
 */
export function validateNodeRuntimeConfig(config: NodeRuntimeConfig): NodeConfigValidationResult {
  const errors: NodeConfigValidationError[] = [];

  if (!config || typeof config !== 'object') {
    return {
      valid: false,
      errors: [{ code: 'ERR_MALFORMED_CONFIG', message: 'Config must be an object' }],
    };
  }

  // 1. Identity Validation
  const id = config.identity;
  if (!id || typeof id !== 'object') {
    errors.push({ code: 'ERR_MALFORMED_CONFIG', message: 'Missing node identity object' });
  } else {
    if (!id.nodeId || typeof id.nodeId !== 'string' || !id.nodeId.startsWith('NODE_')) {
      errors.push({ code: 'ERR_INVALID_NODE_ID', message: "Node ID must start with 'NODE_'", field: 'identity.nodeId' });
    }
    if (!id.coordinateUri || typeof id.coordinateUri !== 'string' || !id.coordinateUri.startsWith('CUBIO://NETWORK/')) {
      errors.push({ code: 'ERR_INVALID_COORDINATE', message: "Coordinate URI must start with 'CUBIO://NETWORK/'", field: 'identity.coordinateUri' });
    }
    if (!id.ownerCubId || !CUB_ID_REGEX.test(id.ownerCubId)) {
      errors.push({ code: 'ERR_INVALID_OWNER_ID', message: "Owner CUB ID must match 'CUB-XXXXXXXX'", field: 'identity.ownerCubId' });
    }
    if (!VALID_ROLES.has(id.role)) {
      errors.push({ code: 'ERR_INVALID_ROLE', message: `Invalid node role '${id.role}'`, field: 'identity.role' });
    }
    if (!id.publicKey || typeof id.publicKey !== 'string' || id.publicKey.length < 8) {
      errors.push({ code: 'ERR_MALFORMED_CONFIG', message: 'Public key must be at least 8 characters', field: 'identity.publicKey' });
    }
  }

  // 2. MTU Validation
  if (typeof config.mtu !== 'number' || config.mtu < 128 || config.mtu > 65535) {
    errors.push({ code: 'ERR_INVALID_MTU', message: 'MTU must be between 128 and 65535 bytes', field: 'mtu' });
  }

  // 3. Heartbeat & Rate Limits
  if (typeof config.heartbeatIntervalMs !== 'number' || config.heartbeatIntervalMs < 100) {
    errors.push({ code: 'ERR_MALFORMED_CONFIG', message: 'Heartbeat interval must be >= 100ms', field: 'heartbeatIntervalMs' });
  }
  if (typeof config.rateLimitPerMinute !== 'number' || config.rateLimitPerMinute <= 0) {
    errors.push({ code: 'ERR_MALFORMED_CONFIG', message: 'Rate limit per minute must be > 0', field: 'rateLimitPerMinute' });
  }

  // 4. Capabilities Validation
  if (!Array.isArray(config.capabilities) || config.capabilities.length === 0) {
    errors.push({ code: 'ERR_MISSING_CAPABILITIES', message: 'Node must declare at least one capability', field: 'capabilities' });
  } else {
    for (const cap of config.capabilities) {
      if (!VALID_CAPABILITIES.has(cap)) {
        errors.push({ code: 'ERR_MISSING_CAPABILITIES', message: `Unknown capability '${cap}'`, field: 'capabilities' });
      }
    }
  }

  // 5. Routing Policy Validation
  if (config.routingPolicy !== 'STRICT_COORDINATE' && config.routingPolicy !== 'DIRECT_ONLY') {
    errors.push({ code: 'ERR_MALFORMED_CONFIG', message: "Routing policy must be 'STRICT_COORDINATE' or 'DIRECT_ONLY'", field: 'routingPolicy' });
  }

  // 6. Transports Validation
  if (!Array.isArray(config.transports) || config.transports.length === 0) {
    errors.push({ code: 'ERR_MALFORMED_CONFIG', message: 'Node must declare at least one transport binding', field: 'transports' });
  } else {
    const boundTypes = new Set<TransportType>();
    for (let i = 0; i < config.transports.length; i++) {
      const binding = config.transports[i];
      if (!VALID_TRANSPORTS.has(binding.transportType)) {
        errors.push({
          code: 'ERR_INVALID_ENDPOINT',
          message: `Invalid transportType '${binding.transportType}' at transports[${i}]`,
          field: `transports[${i}].transportType`,
        });
      }
      boundTypes.add(binding.transportType);

      const epVal = validateTransportEndpoint(binding.endpoint);
      if (!epVal.isValid) {
        errors.push({
          code: 'ERR_INVALID_ENDPOINT',
          message: `Invalid endpoint at transports[${i}]: ${epVal.error}`,
          field: `transports[${i}].endpoint`,
        });
      }
    }

    // Check that defaultTransport is one of the declared transports
    if (!config.defaultTransport || !boundTypes.has(config.defaultTransport)) {
      errors.push({
        code: 'ERR_INVALID_ENDPOINT',
        message: `defaultTransport '${config.defaultTransport}' must be declared in transports array`,
        field: 'defaultTransport',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Creates a default NodeRuntimeConfig with valid parameters and sensible role defaults.
 */
export function createDefaultNodeRuntimeConfig(
  identity: CanonicalNodeIdentity,
  transports: readonly NodeTransportBindingConfig[],
  overrides: Partial<NodeRuntimeConfig> = {}
): NodeRuntimeConfig {
  const defaultCapabilities: Record<NodeRole, NodeCapability[]> = {
    EDGE: ['MESSAGE_DISPATCH', 'OBSERVABILITY_TELEMETRY'],
    RELAY: ['PACKET_ROUTING', 'ENVELOPE_FORWARDING', 'OBSERVABILITY_TELEMETRY'],
    COMPUTE: ['AI_INFERENCE_EXECUTION', 'MESSAGE_DISPATCH', 'OBSERVABILITY_TELEMETRY'],
    STORAGE: ['STORAGE_PERSISTENCE', 'MESSAGE_DISPATCH', 'OBSERVABILITY_TELEMETRY'],
    GATEWAY: ['GATEWAY_TRANSIT', 'PACKET_ROUTING', 'ENVELOPE_FORWARDING', 'OBSERVABILITY_TELEMETRY'],
    CORE: [
      'PACKET_ROUTING',
      'ENVELOPE_FORWARDING',
      'MESSAGE_DISPATCH',
      'STORAGE_PERSISTENCE',
      'AI_INFERENCE_EXECUTION',
      'STATE_SYNCHRONIZATION',
      'GATEWAY_TRANSIT',
      'OBSERVABILITY_TELEMETRY',
    ],
  };

  const defaultTransport = overrides.defaultTransport ?? (transports.length > 0 ? transports[0].transportType : 'TCP');

  return Object.freeze({
    identity,
    mtu: overrides.mtu ?? 1400,
    heartbeatIntervalMs: overrides.heartbeatIntervalMs ?? 5000,
    rateLimitPerMinute: overrides.rateLimitPerMinute ?? 6000,
    capabilities: overrides.capabilities ?? defaultCapabilities[identity.role],
    routingPolicy: overrides.routingPolicy ?? 'STRICT_COORDINATE',
    transports: Object.freeze([...transports]),
    defaultTransport,
    staleTimeoutMs: overrides.staleTimeoutMs ?? 15000,
    failureTimeoutMs: overrides.failureTimeoutMs ?? 30000,
    sweepIntervalMs: overrides.sweepIntervalMs ?? 0,
    maxConcurrentPeers: overrides.maxConcurrentPeers ?? 256,
    retryPolicy: overrides.retryPolicy ? Object.freeze({ ...overrides.retryPolicy }) : undefined,
    pipelineOptions: overrides.pipelineOptions ? Object.freeze({ ...overrides.pipelineOptions }) : undefined,
  });
}
