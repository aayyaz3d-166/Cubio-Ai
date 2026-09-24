/**
 * CUBiO AI — Phase 3 / Task 05: One Language Node Declaration Validator
 * =====================================================================
 *
 * Pre-flight validator enforcing schema integrity, required fields, format
 * constraints, numerical boundaries, and role-capability invariants before any
 * declaration can affect runtime state or allocate transport resources.
 */

import {
  type CubiONodeDeclarationAST,
  type NodeDeclarationValidationResult,
  type NodeDeclarationValidationError,
  type NodeDeclarationListenBindingAST,
} from './oneLanguageNodeDeclarationTypes';
import { type NodeRole, type NodeCapability } from '../protocol/v1/nodeTypes';
import { type TransportType } from '../transport/types';
import { CubiONetworkCoordinateEngine } from '../coordinate/coordinate';

/** Canonical Coordinate URI Pattern: CUBIO://NETWORK/<dim>/<zone>/<node>/<svc> */
const COORDINATE_URI_REGEX = /^CUBIO:\/\/NETWORK\/[A-Z0-9_\-]+\/[A-Z0-9_\-]+\/[A-Z0-9_\-]+\/[A-Z0-9_\-]+$/i;

/** Sovereign Owner Pattern: CUB-XXXXXXXX */
const OWNER_CUB_ID_REGEX = /^CUB\-[A-F0-9]{8}$/i;

/** Valid Node Roles */
const VALID_ROLES = new Set<NodeRole>(['EDGE', 'RELAY', 'COMPUTE', 'STORAGE', 'GATEWAY', 'CORE']);

/** Valid Node Capabilities */
const VALID_CAPABILITIES = new Set<NodeCapability>([
  'PACKET_ROUTING',
  'ENVELOPE_FORWARDING',
  'MESSAGE_DISPATCH',
  'STORAGE_PERSISTENCE',
  'AI_INFERENCE_EXECUTION',
  'STATE_SYNCHRONIZATION',
  'GATEWAY_TRANSIT',
  'OBSERVABILITY_TELEMETRY',
]);

/** Valid Transport Types */
const VALID_TRANSPORTS = new Set<string>(['TCP', 'UDP', 'WEBSOCKET', 'IPC_PIPE', 'IPC', 'MEMORY']);

export class CubiONodeDeclarationValidator {
  /**
   * Performs exhaustive pre-flight validation on a parsed CubiONodeDeclarationAST.
   */
  public validate(ast: CubiONodeDeclarationAST): NodeDeclarationValidationResult {
    const errors: NodeDeclarationValidationError[] = [];
    const warnings: string[] = [];

    // 1. Node Name Validation
    if (!ast.name || ast.name.trim().length === 0) {
      errors.push({
        code: 'MISSING_NODE_NAME',
        message: 'Node declaration requires a non-empty name identifier',
        severity: 'ERROR',
        field: 'name',
        location: ast.nameLocation,
      });
    }

    // 2. Coordinate URI (REQUIRED)
    if (!ast.coordinateUri) {
      errors.push({
        code: 'MISSING_COORDINATE_URI',
        message: "Mandatory property 'coordinate' is missing from node declaration",
        severity: 'ERROR',
        field: 'coordinate',
        location: ast.nameLocation,
      });
    } else {
      const coordResult = CubiONetworkCoordinateEngine.tryParse(ast.coordinateUri);
      if (!coordResult.isValid) {
        errors.push({
          code: 'INVALID_COORDINATE_URI',
          message: `Coordinate URI '${ast.coordinateUri}' is invalid: ${coordResult.errors.map(e => e.message).join('; ')}`,
          severity: 'ERROR',
          field: 'coordinate',
          location: ast.coordinateLocation,
        });
      }
    }

    // 3. Owner CUB ID (REQUIRED)
    if (!ast.owner) {
      errors.push({
        code: 'MISSING_OWNER_ID',
        message: "Mandatory property 'owner' is missing from node declaration",
        severity: 'ERROR',
        field: 'owner',
        location: ast.nameLocation,
      });
    } else if (!OWNER_CUB_ID_REGEX.test(ast.owner)) {
      errors.push({
        code: 'INVALID_OWNER_ID',
        message: `Owner ID '${ast.owner}' does not match sovereign format 'CUB-XXXXXXXX' (8 hex chars)`,
        severity: 'ERROR',
        field: 'owner',
        location: ast.ownerLocation,
      });
    }

    // 4. Operational Role (REQUIRED)
    if (!ast.role) {
      errors.push({
        code: 'MISSING_ROLE',
        message: "Mandatory property 'role' is missing from node declaration",
        severity: 'ERROR',
        field: 'role',
        location: ast.nameLocation,
      });
    } else if (!VALID_ROLES.has(ast.role)) {
      errors.push({
        code: 'INVALID_ROLE',
        message: `Role '${ast.role}' is invalid. Allowed roles: EDGE, RELAY, COMPUTE, STORAGE, GATEWAY, CORE`,
        severity: 'ERROR',
        field: 'role',
        location: ast.roleLocation,
      });
    }

    // 5. Transport Listen Bindings (REQUIRED: at least 1)
    if (!ast.listenBindings || ast.listenBindings.length === 0) {
      errors.push({
        code: 'MISSING_LISTEN_BINDINGS',
        message: "Node declaration must declare at least one 'listen' transport binding",
        severity: 'ERROR',
        field: 'listen',
        location: ast.nameLocation,
      });
    } else {
      const boundProtocols = new Set<TransportType>();
      const boundPorts = new Set<string>();

      for (const binding of ast.listenBindings) {
        if (!VALID_TRANSPORTS.has(binding.protocol)) {
          errors.push({
            code: 'INVALID_TRANSPORT_PROTOCOL',
            message: `Unsupported transport protocol '${binding.protocol}'`,
            severity: 'ERROR',
            field: 'listen',
            location: binding.location,
          });
        }
        boundProtocols.add(binding.protocol);

        // Port bounds check for socket transports
        if (binding.protocol === 'TCP' || binding.protocol === 'UDP' || binding.protocol === 'WEBSOCKET') {
          if (binding.port < 1 || binding.port > 65535) {
            errors.push({
              code: 'INVALID_PORT_BOUNDS',
              message: `Port ${binding.port} on transport ${binding.protocol} is out of valid range (1..65535)`,
              severity: 'ERROR',
              field: 'listen',
              location: binding.location,
            });
          }
          const endpointKey = `${binding.protocol}:${binding.host}:${binding.port}`;
          if (boundPorts.has(endpointKey)) {
            errors.push({
              code: 'DUPLICATE_LISTEN_ENDPOINT',
              message: `Duplicate listen endpoint declared: ${endpointKey}`,
              severity: 'ERROR',
              field: 'listen',
              location: binding.location,
            });
          }
          boundPorts.add(endpointKey);
        }
      }

      // Default transport check
      if (ast.defaultTransport) {
        if (!VALID_TRANSPORTS.has(ast.defaultTransport)) {
          errors.push({
            code: 'INVALID_DEFAULT_TRANSPORT',
            message: `Default transport '${ast.defaultTransport}' is not a valid transport type`,
            severity: 'ERROR',
            field: 'default_transport',
            location: ast.defaultTransportLocation,
          });
        } else if (!boundProtocols.has(ast.defaultTransport)) {
          errors.push({
            code: 'DEFAULT_TRANSPORT_NOT_BOUND',
            message: `Declared default transport '${ast.defaultTransport}' does not match any declared 'listen' binding (${Array.from(boundProtocols).join(', ')})`,
            severity: 'ERROR',
            field: 'default_transport',
            location: ast.defaultTransportLocation,
          });
        }
      }
    }

    // 6. MTU Numerical Boundary Check [1024..65536]
    if (ast.mtu !== undefined) {
      if (!Number.isInteger(ast.mtu) || ast.mtu < 1024 || ast.mtu > 65536) {
        errors.push({
          code: 'MTU_OUT_OF_BOUNDS',
          message: `MTU ${ast.mtu} is out of allowable range [1024..65536] bytes`,
          severity: 'ERROR',
          field: 'mtu',
          location: ast.mtuLocation,
        });
      }
    }

    // 7. Heartbeat Interval Numerical Boundary Check [100..60000]
    if (ast.heartbeat !== undefined) {
      if (!Number.isInteger(ast.heartbeat) || ast.heartbeat < 100 || ast.heartbeat > 60000) {
        errors.push({
          code: 'HEARTBEAT_OUT_OF_BOUNDS',
          message: `Heartbeat interval ${ast.heartbeat}ms is out of allowable range [100..60000] ms`,
          severity: 'ERROR',
          field: 'heartbeat',
          location: ast.heartbeatLocation,
        });
      }
    }

    // 8. Rate Limit Boundary Check [1..1000000]
    if (ast.rateLimit !== undefined) {
      if (!Number.isInteger(ast.rateLimit) || ast.rateLimit < 1 || ast.rateLimit > 1000000) {
        errors.push({
          code: 'RATE_LIMIT_OUT_OF_BOUNDS',
          message: `Rate limit ${ast.rateLimit} packets/min is out of allowable range [1..1000000]`,
          severity: 'ERROR',
          field: 'rate_limit',
          location: ast.rateLimitLocation,
        });
      }
    }

    // 9. Max Peers Boundary Check [1..10000]
    if (ast.maxPeers !== undefined) {
      if (!Number.isInteger(ast.maxPeers) || ast.maxPeers < 1 || ast.maxPeers > 10000) {
        errors.push({
          code: 'MAX_PEERS_OUT_OF_BOUNDS',
          message: `Max concurrent peers ${ast.maxPeers} is out of allowable range [1..10000]`,
          severity: 'ERROR',
          field: 'max_peers',
          location: ast.maxPeersLocation,
        });
      }
    }

    // 10. Storage Quota Check >= 0
    if (ast.storageQuota !== undefined) {
      if (ast.storageQuota < 0) {
        errors.push({
          code: 'STORAGE_QUOTA_NEGATIVE',
          message: `Storage quota cannot be negative (${ast.storageQuota})`,
          severity: 'ERROR',
          field: 'storage_quota',
          location: ast.storageQuotaLocation,
        });
      }
    }

    // 11. Routing Policy Check
    if (ast.routingPolicy !== undefined) {
      if (ast.routingPolicy !== 'STRICT_COORDINATE' && ast.routingPolicy !== 'DIRECT_ONLY') {
        errors.push({
          code: 'INVALID_ROUTING_POLICY',
          message: `Routing policy '${ast.routingPolicy}' is invalid. Allowed: STRICT_COORDINATE, DIRECT_ONLY`,
          severity: 'ERROR',
          field: 'routing_policy',
          location: ast.routingPolicyLocation,
        });
      }
    }

    // 12. Capabilities Verification
    if (ast.capabilities !== undefined) {
      for (const cap of ast.capabilities) {
        if (!VALID_CAPABILITIES.has(cap)) {
          errors.push({
            code: 'INVALID_CAPABILITY',
            message: `Capability '${cap}' is not a recognized NodeCapability`,
            severity: 'ERROR',
            field: 'capabilities',
            location: ast.capabilitiesLocation,
          });
        }
      }
    }

    // 13. Role & Capability Invariants
    if (ast.role === 'CORE' || ast.role === 'RELAY') {
      if (ast.capabilities && !ast.capabilities.includes('PACKET_ROUTING')) {
        errors.push({
          code: 'ROLE_CAPABILITY_INVARIANT_VIOLATION',
          message: `Role '${ast.role}' requires capability 'PACKET_ROUTING', but it was omitted from declared capabilities`,
          severity: 'ERROR',
          field: 'capabilities',
          location: ast.capabilitiesLocation,
        });
      }
    }

    // 14. Public Key Format (if provided)
    if (ast.publicKey !== undefined) {
      if (typeof ast.publicKey !== 'string' || ast.publicKey.trim().length < 32) {
        errors.push({
          code: 'INVALID_PUBLIC_KEY',
          message: 'Public key must be at least 32 characters hex/string',
          severity: 'ERROR',
          field: 'public_key',
          location: ast.publicKeyLocation,
        });
      }
    }

    // 15. Grid777 Boundaries (0..6)
    if (ast.grid777 !== undefined) {
      const { i, j, k } = ast.grid777;
      if (
        !Number.isInteger(i) || i < 0 || i > 6 ||
        !Number.isInteger(j) || j < 0 || j > 6 ||
        !Number.isInteger(k) || k < 0 || k > 6
      ) {
        errors.push({
          code: 'GRID777_OUT_OF_BOUNDS',
          message: `Grid777 indices (${i}, ${j}, ${k}) must all be integers within [0..6]`,
          severity: 'ERROR',
          field: 'grid777',
          location: ast.grid777Location,
        });
      }
    }

    // 16. Retry Policy Checks
    if (ast.retryPolicy) {
      if (ast.retryPolicy.maxRetries !== undefined && ast.retryPolicy.maxRetries < 0) {
        errors.push({
          code: 'INVALID_RETRY_POLICY',
          message: 'maxRetries in retry_policy cannot be negative',
          severity: 'ERROR',
          field: 'retry_policy',
          location: ast.retryPolicy.location,
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
