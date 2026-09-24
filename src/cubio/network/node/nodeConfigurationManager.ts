/**
 * CUBiO AI — Phase 3 / Task 06: Node Configuration Manager
 * =========================================================
 *
 * Implements controlled One Language configuration for CUBiO Node runtime parameters.
 *
 * Enforces:
 *   - Authoritative 3-tier precedence: System/Env > One Language Script > Certified Defaults
 *   - Security boundary: Prevents script tampering with restricted system settings
 *   - Hardware & system ceiling enforcement (MTU, peers, quota, heartbeat floor)
 *   - Pre-activation dependency & conflict validation (timing chains, backoff monotonicity)
 *   - Parameter-level provenance auditing
 *   - Fail-closed security gating
 */

import {
  type SystemEnvironmentConfig,
  type OneLanguageNodeConfig,
  type ResolvedParameterProvenance,
  type NodeConfigurationConflict,
  type NodeConfigurationResolutionResult,
  type NodeConfigurationPrecedenceTier,
  type ConfigurationParameterScope,
} from './nodeConfigurationTypes';

import {
  type NodeRuntimeConfig,
  type NodeTransportBindingConfig,
} from './nodeRuntimeTypes';

import {
  type NodeRole,
  type NodeCapability,
  type CanonicalNodeIdentity,
  type CanonicalNodeConfig,
} from '../protocol/v1/nodeTypes';

import { createNodeIdentity } from '../protocol/v1/nodeArchitecture';
import { type TransportType, type TransportEndpoint } from '../transport/types';
import { parseNodeDeclaration } from './oneLanguageNodeDeclaration';
import { type CubiONodeDeclarationAST } from './oneLanguageNodeDeclarationTypes';
import { CubiONetworkCoordinateEngine } from '../coordinate/coordinate';

/**
 * Certified Phase 1 and Phase 2 baseline defaults (Tier 3).
 */
export const CERTIFIED_PROTOCOL_DEFAULTS = Object.freeze({
  mtu: 1400,
  heartbeatIntervalMs: 5000,
  rateLimitPerMinute: 1000,
  maxConcurrentPeers: 128,
  storageQuotaBytes: 1024 * 1024 * 100, // 100 MB
  routingPolicy: 'STRICT_COORDINATE' as const,
  staleTimeoutMs: 15000,
  failureTimeoutMs: 30000,
  sweepIntervalMs: 5000,
  retryPolicy: Object.freeze({
    maxRetries: 3,
    initialDelayMs: 100,
    maxDelayMs: 2000,
  }),
  pipelineOptions: Object.freeze({
    maxQueueSize: 1000,
    assemblyTimeoutMs: 5000,
  }),
});

/** Default role capabilities */
const DEFAULT_ROLE_CAPS: Record<NodeRole, NodeCapability[]> = {
  EDGE: ['MESSAGE_DISPATCH', 'OBSERVABILITY_TELEMETRY'],
  RELAY: ['PACKET_ROUTING', 'ENVELOPE_FORWARDING', 'OBSERVABILITY_TELEMETRY'],
  COMPUTE: ['MESSAGE_DISPATCH', 'AI_INFERENCE_EXECUTION', 'OBSERVABILITY_TELEMETRY'],
  STORAGE: ['MESSAGE_DISPATCH', 'STORAGE_PERSISTENCE', 'STATE_SYNCHRONIZATION'],
  GATEWAY: ['PACKET_ROUTING', 'GATEWAY_TRANSIT', 'OBSERVABILITY_TELEMETRY'],
  CORE: ['PACKET_ROUTING', 'ENVELOPE_FORWARDING', 'MESSAGE_DISPATCH', 'OBSERVABILITY_TELEMETRY'],
};

export class NodeConfigurationManager {
  /**
   * Loads system configuration from process.env or system defaults.
   */
  public static loadSystemEnvironmentConfig(): SystemEnvironmentConfig {
    const env = process.env;

    const maxMtuCeiling = env.CUBIO_MAX_MTU_CEILING ? parseInt(env.CUBIO_MAX_MTU_CEILING, 10) : undefined;
    const maxPeersCeiling = env.CUBIO_MAX_PEERS_CEILING ? parseInt(env.CUBIO_MAX_PEERS_CEILING, 10) : undefined;
    const maxStorageQuotaCeiling = env.CUBIO_MAX_STORAGE_QUOTA_CEILING ? parseInt(env.CUBIO_MAX_STORAGE_QUOTA_CEILING, 10) : undefined;
    const minHeartbeatFloor = env.CUBIO_MIN_HEARTBEAT_FLOOR ? parseInt(env.CUBIO_MIN_HEARTBEAT_FLOOR, 10) : undefined;

    let authorizedRoles: NodeRole[] | undefined = undefined;
    if (env.CUBIO_AUTHORIZED_ROLES) {
      authorizedRoles = env.CUBIO_AUTHORIZED_ROLES.split(',').map(r => r.trim().toUpperCase() as NodeRole);
    }

    return {
      enforcementMode: (env.CUBIO_CONFIG_ENFORCEMENT_MODE === 'PERMISSIVE' ? 'PERMISSIVE' : 'STRICT'),
      systemOwnerCubId: env.CUBIO_SYSTEM_OWNER_ID,
      systemPublicKey: env.CUBIO_SYSTEM_PUBLIC_KEY,
      systemHardwareFingerprint: env.CUBIO_SYSTEM_HARDWARE_FINGERPRINT,
      maxMtuCeiling: !isNaN(maxMtuCeiling as number) ? maxMtuCeiling : undefined,
      maxPeersCeiling: !isNaN(maxPeersCeiling as number) ? maxPeersCeiling : undefined,
      maxStorageQuotaCeiling: !isNaN(maxStorageQuotaCeiling as number) ? maxStorageQuotaCeiling : undefined,
      minHeartbeatFloor: !isNaN(minHeartbeatFloor as number) ? minHeartbeatFloor : undefined,
      authorizedRoles,
      allowScriptRoleElevation: env.CUBIO_ALLOW_SCRIPT_ROLE_ELEVATION === 'true',
    };
  }

  /**
   * Resolves configuration by applying authoritative 3-tier precedence and validation.
   *
   * @param input.systemConfig Tier 1 system/environment overrides and ceilings
   * @param input.scriptConfig Tier 2 One Language script config or AST or source string
   */
  public resolve(input: {
    systemConfig?: SystemEnvironmentConfig;
    scriptConfig?: OneLanguageNodeConfig | CubiONodeDeclarationAST | string;
  }): NodeConfigurationResolutionResult {
    const conflicts: NodeConfigurationConflict[] = [];
    const warnings: string[] = [];
    const provenance: Record<string, ResolvedParameterProvenance> = {};

    const system = input.systemConfig ?? NodeConfigurationManager.loadSystemEnvironmentConfig();
    const isStrict = (system.enforcementMode ?? 'STRICT') === 'STRICT';

    // 1. Convert script input to normalized OneLanguageNodeConfig
    let script: OneLanguageNodeConfig = {};
    let nodeName = 'Node_Default';

    if (input.scriptConfig) {
      if (typeof input.scriptConfig === 'string') {
        try {
          const ast = parseNodeDeclaration(input.scriptConfig);
          nodeName = ast.name;
          script = this.astToScriptConfig(ast);
        } catch (err: any) {
          conflicts.push({
            code: 'SCRIPT_PARSE_ERROR',
            message: `Failed to parse One Language script declaration: ${err.message}`,
            field: 'script',
            severity: 'ERROR',
            tier: 'ONE_LANGUAGE_SCRIPT',
          });
          return { success: false, provenance, conflicts, warnings };
        }
      } else if ('type' in input.scriptConfig && input.scriptConfig.type === 'CubiONodeDeclaration') {
        nodeName = input.scriptConfig.name;
        script = this.astToScriptConfig(input.scriptConfig);
      } else {
        script = input.scriptConfig as OneLanguageNodeConfig;
      }
    }

    // 2. Validate & Enforce Sovereign Identity (Tier 1 vs Tier 2)
    let finalOwner = script.owner ?? system.systemOwnerCubId;
    let ownerTier: NodeConfigurationPrecedenceTier = 'CERTIFIED_DEFAULT';

    if (system.systemOwnerCubId) {
      if (script.owner && script.owner !== system.systemOwnerCubId) {
        if (isStrict) {
          conflicts.push({
            code: 'RESTRICTED_CONFIG_VIOLATION',
            message: `Script attempted to override sovereign owner ID '${system.systemOwnerCubId}' with unauthorized '${script.owner}'`,
            field: 'owner',
            severity: 'ERROR',
            tier: 'ONE_LANGUAGE_SCRIPT',
          });
        } else {
          warnings.push(`Permissive override: script replaced system owner ID '${system.systemOwnerCubId}' with '${script.owner}'`);
          finalOwner = script.owner;
          ownerTier = 'ONE_LANGUAGE_SCRIPT';
        }
      } else {
        finalOwner = system.systemOwnerCubId;
        ownerTier = 'SYSTEM_ENVIRONMENT';
      }
    } else if (script.owner) {
      finalOwner = script.owner;
      ownerTier = 'ONE_LANGUAGE_SCRIPT';
    } else {
      conflicts.push({
        code: 'MISSING_OWNER_ID',
        message: 'No sovereign owner ID provided in system environment or script declaration',
        field: 'owner',
        severity: 'ERROR',
      });
    }

    provenance['owner'] = {
      parameter: 'owner',
      value: finalOwner,
      tier: ownerTier,
      scope: 'RESTRICTED_SYSTEM',
    };

    // Public Key & Hardware Fingerprint (RESTRICTED_SYSTEM)
    let finalPublicKey = system.systemPublicKey ?? script.publicKey;
    let pubKeyTier: NodeConfigurationPrecedenceTier = system.systemPublicKey ? 'SYSTEM_ENVIRONMENT' : (script.publicKey ? 'ONE_LANGUAGE_SCRIPT' : 'CERTIFIED_DEFAULT');

    if (system.systemPublicKey && script.publicKey && script.publicKey !== system.systemPublicKey) {
      if (isStrict) {
        conflicts.push({
          code: 'RESTRICTED_CONFIG_VIOLATION',
          message: 'Script attempted to override system provisioned public key',
          field: 'publicKey',
          severity: 'ERROR',
          tier: 'ONE_LANGUAGE_SCRIPT',
        });
      }
    }
    provenance['publicKey'] = { parameter: 'publicKey', value: finalPublicKey, tier: pubKeyTier, scope: 'RESTRICTED_SYSTEM' };

    let finalHwFingerprint = system.systemHardwareFingerprint ?? script.hardwareFingerprint;
    provenance['hardwareFingerprint'] = {
      parameter: 'hardwareFingerprint',
      value: finalHwFingerprint,
      tier: system.systemHardwareFingerprint ? 'SYSTEM_ENVIRONMENT' : (script.hardwareFingerprint ? 'ONE_LANGUAGE_SCRIPT' : 'CERTIFIED_DEFAULT'),
      scope: 'RESTRICTED_SYSTEM',
    };

    // 3. Operational Role & Elevation Protection (RESTRICTED_SYSTEM)
    let finalRole: NodeRole = script.role ?? 'EDGE';
    let roleTier: NodeConfigurationPrecedenceTier = script.role ? 'ONE_LANGUAGE_SCRIPT' : 'CERTIFIED_DEFAULT';

    if (system.authorizedRoles && system.authorizedRoles.length > 0) {
      if (!system.authorizedRoles.includes(finalRole)) {
        if (!system.allowScriptRoleElevation && isStrict) {
          conflicts.push({
            code: 'ROLE_ELEVATION_UNAUTHORIZED',
            message: `Host is restricted to roles [${system.authorizedRoles.join(', ')}]. Script requested unauthorized role '${finalRole}'`,
            field: 'role',
            severity: 'ERROR',
            tier: 'ONE_LANGUAGE_SCRIPT',
          });
        } else {
          warnings.push(`Permissive execution: unauthorized role '${finalRole}' permitted by configuration override`);
        }
      }
    }
    provenance['role'] = { parameter: 'role', value: finalRole, tier: roleTier, scope: 'RESTRICTED_SYSTEM' };

    // Coordinate URI
    const coordinateUri = script.coordinateUri;
    if (!coordinateUri) {
      conflicts.push({
        code: 'MISSING_COORDINATE_URI',
        message: "Mandatory 'coordinate' is missing from configuration",
        field: 'coordinateUri',
        severity: 'ERROR',
      });
    } else {
      const coordVal = CubiONetworkCoordinateEngine.tryParse(coordinateUri);
      if (!coordVal.isValid) {
        conflicts.push({
          code: 'INVALID_COORDINATE_URI',
          message: `Coordinate URI '${coordinateUri}' is invalid: ${coordVal.errors.map(e => e.message).join('; ')}`,
          field: 'coordinateUri',
          severity: 'ERROR',
        });
      }
    }
    provenance['coordinateUri'] = {
      parameter: 'coordinateUri',
      value: coordinateUri,
      tier: 'ONE_LANGUAGE_SCRIPT',
      scope: 'PERMITTED_OPERATIONAL',
    };

    // 4. Resolve MTU & Physical Ceiling
    let finalMtu = CERTIFIED_PROTOCOL_DEFAULTS.mtu;
    let mtuTier: NodeConfigurationPrecedenceTier = 'CERTIFIED_DEFAULT';
    let mtuClampedFrom: number | undefined = undefined;

    if (script.mtu !== undefined) {
      finalMtu = script.mtu;
      mtuTier = 'ONE_LANGUAGE_SCRIPT';
    }

    if (system.maxMtuCeiling !== undefined && finalMtu > system.maxMtuCeiling) {
      mtuClampedFrom = finalMtu;
      finalMtu = system.maxMtuCeiling;
      warnings.push(`MTU clamped from ${mtuClampedFrom} down to system ceiling ${system.maxMtuCeiling}`);
    }

    if (finalMtu < 1024 || finalMtu > 65536) {
      conflicts.push({
        code: 'MTU_OUT_OF_BOUNDS',
        message: `Resolved MTU ${finalMtu} is outside certified bounds [1024..65536]`,
        field: 'mtu',
        severity: 'ERROR',
      });
    }

    provenance['mtu'] = {
      parameter: 'mtu',
      value: finalMtu,
      tier: mtuTier,
      scope: 'PERMITTED_OPERATIONAL',
      clampedFrom: mtuClampedFrom,
      reason: mtuClampedFrom ? `Clamped to system maxMtuCeiling (${system.maxMtuCeiling})` : undefined,
    };

    // 5. Resolve Heartbeat & Floor
    let finalHeartbeat = CERTIFIED_PROTOCOL_DEFAULTS.heartbeatIntervalMs;
    let hbTier: NodeConfigurationPrecedenceTier = 'CERTIFIED_DEFAULT';
    let hbClampedFrom: number | undefined = undefined;

    if (script.heartbeatIntervalMs !== undefined) {
      finalHeartbeat = script.heartbeatIntervalMs;
      hbTier = 'ONE_LANGUAGE_SCRIPT';
    }

    if (system.minHeartbeatFloor !== undefined && finalHeartbeat < system.minHeartbeatFloor) {
      hbClampedFrom = finalHeartbeat;
      finalHeartbeat = system.minHeartbeatFloor;
      warnings.push(`Heartbeat raised from ${hbClampedFrom}ms up to system floor ${system.minHeartbeatFloor}ms`);
    }

    if (finalHeartbeat < 100 || finalHeartbeat > 60000) {
      conflicts.push({
        code: 'HEARTBEAT_OUT_OF_BOUNDS',
        message: `Resolved heartbeat ${finalHeartbeat}ms is outside certified bounds [100..60000]ms`,
        field: 'heartbeatIntervalMs',
        severity: 'ERROR',
      });
    }

    provenance['heartbeatIntervalMs'] = {
      parameter: 'heartbeatIntervalMs',
      value: finalHeartbeat,
      tier: hbTier,
      scope: 'PERMITTED_OPERATIONAL',
      clampedFrom: hbClampedFrom,
      reason: hbClampedFrom ? `Enforced minHeartbeatFloor (${system.minHeartbeatFloor}ms)` : undefined,
    };

    // 6. Max Concurrent Peers & Ceiling
    let finalPeers = CERTIFIED_PROTOCOL_DEFAULTS.maxConcurrentPeers;
    let peersTier: NodeConfigurationPrecedenceTier = 'CERTIFIED_DEFAULT';
    let peersClampedFrom: number | undefined = undefined;

    if (script.maxConcurrentPeers !== undefined) {
      finalPeers = script.maxConcurrentPeers;
      peersTier = 'ONE_LANGUAGE_SCRIPT';
    }

    if (system.maxPeersCeiling !== undefined && finalPeers > system.maxPeersCeiling) {
      peersClampedFrom = finalPeers;
      finalPeers = system.maxPeersCeiling;
      warnings.push(`maxConcurrentPeers clamped from ${peersClampedFrom} down to system ceiling ${system.maxPeersCeiling}`);
    }

    if (finalPeers < 1 || finalPeers > 10000) {
      conflicts.push({
        code: 'MAX_PEERS_OUT_OF_BOUNDS',
        message: `Resolved maxConcurrentPeers ${finalPeers} is outside certified bounds [1..10000]`,
        field: 'maxConcurrentPeers',
        severity: 'ERROR',
      });
    }

    provenance['maxConcurrentPeers'] = {
      parameter: 'maxConcurrentPeers',
      value: finalPeers,
      tier: peersTier,
      scope: 'PERMITTED_OPERATIONAL',
      clampedFrom: peersClampedFrom,
      reason: peersClampedFrom ? `Clamped to system maxPeersCeiling (${system.maxPeersCeiling})` : undefined,
    };

    // 7. Storage Quota & Ceiling
    let finalStorage = CERTIFIED_PROTOCOL_DEFAULTS.storageQuotaBytes;
    let storageTier: NodeConfigurationPrecedenceTier = 'CERTIFIED_DEFAULT';
    let storageClampedFrom: number | undefined = undefined;

    if (script.storageQuotaBytes !== undefined) {
      finalStorage = script.storageQuotaBytes;
      storageTier = 'ONE_LANGUAGE_SCRIPT';
    }

    if (system.maxStorageQuotaCeiling !== undefined && finalStorage > system.maxStorageQuotaCeiling) {
      storageClampedFrom = finalStorage;
      finalStorage = system.maxStorageQuotaCeiling;
      warnings.push(`storageQuotaBytes clamped from ${storageClampedFrom} down to system ceiling ${system.maxStorageQuotaCeiling}`);
    }

    provenance['storageQuotaBytes'] = {
      parameter: 'storageQuotaBytes',
      value: finalStorage,
      tier: storageTier,
      scope: 'PERMITTED_OPERATIONAL',
      clampedFrom: storageClampedFrom,
      reason: storageClampedFrom ? `Clamped to system maxStorageQuotaCeiling (${system.maxStorageQuotaCeiling})` : undefined,
    };

    // Rate limit per minute
    const rateLimitPerMinute = script.rateLimitPerMinute ?? CERTIFIED_PROTOCOL_DEFAULTS.rateLimitPerMinute;
    if (rateLimitPerMinute < 1 || rateLimitPerMinute > 1000000) {
      conflicts.push({
        code: 'RATE_LIMIT_OUT_OF_BOUNDS',
        message: `Rate limit ${rateLimitPerMinute} is out of allowable range [1..1000000]`,
        field: 'rateLimitPerMinute',
        severity: 'ERROR',
      });
    }
    provenance['rateLimitPerMinute'] = {
      parameter: 'rateLimitPerMinute',
      value: rateLimitPerMinute,
      tier: script.rateLimitPerMinute !== undefined ? 'ONE_LANGUAGE_SCRIPT' : 'CERTIFIED_DEFAULT',
      scope: 'PERMITTED_OPERATIONAL',
    };

    // Routing Policy
    const routingPolicy = script.routingPolicy ?? CERTIFIED_PROTOCOL_DEFAULTS.routingPolicy;
    provenance['routingPolicy'] = {
      parameter: 'routingPolicy',
      value: routingPolicy,
      tier: script.routingPolicy ? 'ONE_LANGUAGE_SCRIPT' : 'CERTIFIED_DEFAULT',
      scope: 'PERMITTED_OPERATIONAL',
    };

    // 8. Resilience & Timing Dependency Validation
    const staleTimeoutMs = script.staleTimeoutMs ?? Math.max(CERTIFIED_PROTOCOL_DEFAULTS.staleTimeoutMs, finalHeartbeat * 3);
    const failureTimeoutMs = script.failureTimeoutMs ?? Math.max(CERTIFIED_PROTOCOL_DEFAULTS.failureTimeoutMs, staleTimeoutMs * 2);
    const sweepIntervalMs = script.sweepIntervalMs ?? CERTIFIED_PROTOCOL_DEFAULTS.sweepIntervalMs;

    // Timing Chain Invariant: heartbeat < staleTimeout < failureTimeout
    if (finalHeartbeat >= staleTimeoutMs) {
      conflicts.push({
        code: 'CONFIG_DEPENDENCY_CONFLICT',
        message: `Timing violation: heartbeatIntervalMs (${finalHeartbeat}ms) must be strictly less than staleTimeoutMs (${staleTimeoutMs}ms)`,
        field: 'heartbeatIntervalMs',
        severity: 'ERROR',
      });
    }
    if (staleTimeoutMs >= failureTimeoutMs) {
      conflicts.push({
        code: 'CONFIG_DEPENDENCY_CONFLICT',
        message: `Timing violation: staleTimeoutMs (${staleTimeoutMs}ms) must be strictly less than failureTimeoutMs (${failureTimeoutMs}ms)`,
        field: 'staleTimeoutMs',
        severity: 'ERROR',
      });
    }

    provenance['staleTimeoutMs'] = {
      parameter: 'staleTimeoutMs',
      value: staleTimeoutMs,
      tier: script.staleTimeoutMs !== undefined ? 'ONE_LANGUAGE_SCRIPT' : 'CERTIFIED_DEFAULT',
      scope: 'PERMITTED_RESILIENCE',
    };
    provenance['failureTimeoutMs'] = {
      parameter: 'failureTimeoutMs',
      value: failureTimeoutMs,
      tier: script.failureTimeoutMs !== undefined ? 'ONE_LANGUAGE_SCRIPT' : 'CERTIFIED_DEFAULT',
      scope: 'PERMITTED_RESILIENCE',
    };
    provenance['sweepIntervalMs'] = {
      parameter: 'sweepIntervalMs',
      value: sweepIntervalMs,
      tier: script.sweepIntervalMs !== undefined ? 'ONE_LANGUAGE_SCRIPT' : 'CERTIFIED_DEFAULT',
      scope: 'PERMITTED_RESILIENCE',
    };

    // 9. Retry Policy & Backoff Monotonicity Invariant
    const retryPolicy = {
      maxRetries: script.retryPolicy?.maxRetries ?? CERTIFIED_PROTOCOL_DEFAULTS.retryPolicy.maxRetries,
      initialDelayMs: script.retryPolicy?.initialDelayMs ?? CERTIFIED_PROTOCOL_DEFAULTS.retryPolicy.initialDelayMs,
      maxDelayMs: script.retryPolicy?.maxDelayMs ?? CERTIFIED_PROTOCOL_DEFAULTS.retryPolicy.maxDelayMs,
    };

    if (retryPolicy.initialDelayMs > retryPolicy.maxDelayMs) {
      conflicts.push({
        code: 'CONFIG_DEPENDENCY_CONFLICT',
        message: `Retry policy error: initialDelayMs (${retryPolicy.initialDelayMs}ms) cannot exceed maxDelayMs (${retryPolicy.maxDelayMs}ms)`,
        field: 'retryPolicy.initialDelayMs',
        severity: 'ERROR',
      });
    }
    provenance['retryPolicy'] = {
      parameter: 'retryPolicy',
      value: retryPolicy,
      tier: script.retryPolicy ? 'ONE_LANGUAGE_SCRIPT' : 'CERTIFIED_DEFAULT',
      scope: 'PERMITTED_RESILIENCE',
    };

    // 10. Pipeline Options
    const pipelineOptions = {
      maxQueueSize: script.pipelineOptions?.maxQueueSize ?? CERTIFIED_PROTOCOL_DEFAULTS.pipelineOptions.maxQueueSize,
      assemblyTimeoutMs: script.pipelineOptions?.assemblyTimeoutMs ?? CERTIFIED_PROTOCOL_DEFAULTS.pipelineOptions.assemblyTimeoutMs,
    };

    if (pipelineOptions.maxQueueSize < 10) {
      conflicts.push({
        code: 'CONFIG_DEPENDENCY_CONFLICT',
        message: `Pipeline queue size (${pipelineOptions.maxQueueSize}) must be at least 10`,
        field: 'pipelineOptions.maxQueueSize',
        severity: 'ERROR',
      });
    }
    provenance['pipelineOptions'] = {
      parameter: 'pipelineOptions',
      value: pipelineOptions,
      tier: script.pipelineOptions ? 'ONE_LANGUAGE_SCRIPT' : 'CERTIFIED_DEFAULT',
      scope: 'PERMITTED_RESILIENCE',
    };

    // 11. Transports & Listen Bindings
    // System pinned transports take precedence if specified; otherwise script transports
    let transports: readonly NodeTransportBindingConfig[] = [];
    if (system.pinnedTransports && system.pinnedTransports.length > 0) {
      transports = system.pinnedTransports;
      provenance['transports'] = { parameter: 'transports', value: transports, tier: 'SYSTEM_ENVIRONMENT', scope: 'RESTRICTED_SYSTEM' };
    } else if (script.transports && script.transports.length > 0) {
      transports = script.transports;
      provenance['transports'] = { parameter: 'transports', value: transports, tier: 'ONE_LANGUAGE_SCRIPT', scope: 'PERMITTED_OPERATIONAL' };
    } else {
      conflicts.push({
        code: 'MISSING_TRANSPORTS',
        message: 'No transport bindings declared in system or script configuration',
        field: 'transports',
        severity: 'ERROR',
      });
    }

    // Default transport check
    const activeProtocols = new Set<TransportType>(transports.map(t => t.transportType));
    const defaultTransport: TransportType =
      script.defaultTransport ??
      (transports.length > 0 ? transports[0].transportType : 'TCP');

    if (!activeProtocols.has(defaultTransport) && transports.length > 0) {
      conflicts.push({
        code: 'DEFAULT_TRANSPORT_NOT_BOUND',
        message: `defaultTransport '${defaultTransport}' does not match any active transport (${Array.from(activeProtocols).join(', ')})`,
        field: 'defaultTransport',
        severity: 'ERROR',
      });
    }
    provenance['defaultTransport'] = {
      parameter: 'defaultTransport',
      value: defaultTransport,
      tier: script.defaultTransport ? 'ONE_LANGUAGE_SCRIPT' : 'CERTIFIED_DEFAULT',
      scope: 'PERMITTED_OPERATIONAL',
    };

    // 12. Capabilities
    let capabilities: readonly NodeCapability[];
    if (script.capabilities && script.capabilities.length > 0) {
      capabilities = Object.freeze([...script.capabilities]);
    } else {
      capabilities = Object.freeze([...(DEFAULT_ROLE_CAPS[finalRole] ?? ['MESSAGE_DISPATCH'])]);
    }

    // Invariant: CORE and RELAY must possess PACKET_ROUTING
    if ((finalRole === 'CORE' || finalRole === 'RELAY') && !capabilities.includes('PACKET_ROUTING')) {
      conflicts.push({
        code: 'ROLE_CAPABILITY_INVARIANT_VIOLATION',
        message: `Role '${finalRole}' requires capability 'PACKET_ROUTING'`,
        field: 'capabilities',
        severity: 'ERROR',
      });
    }
    provenance['capabilities'] = {
      parameter: 'capabilities',
      value: capabilities,
      tier: script.capabilities ? 'ONE_LANGUAGE_SCRIPT' : 'CERTIFIED_DEFAULT',
      scope: 'PERMITTED_OPERATIONAL',
    };

    // 13. Construct Final NodeRuntimeConfig if no errors
    const hasErrors = conflicts.some(c => c.severity === 'ERROR');
    if (hasErrors || !coordinateUri || !finalOwner) {
      return {
        success: false,
        provenance,
        conflicts,
        warnings,
      };
    }

    const identity: CanonicalNodeIdentity = createNodeIdentity({
      nodeName,
      coordinateUri,
      ownerCubId: finalOwner,
      role: finalRole,
      publicKey: finalPublicKey,
      hardwareFingerprint: finalHwFingerprint,
    });

    const config: NodeRuntimeConfig = Object.freeze({
      identity,
      mtu: finalMtu,
      heartbeatIntervalMs: finalHeartbeat,
      rateLimitPerMinute,
      capabilities,
      routingPolicy,
      transports,
      defaultTransport,
      staleTimeoutMs,
      failureTimeoutMs,
      sweepIntervalMs,
      maxConcurrentPeers: finalPeers,
      retryPolicy,
      pipelineOptions,
    });

    return {
      success: true,
      config,
      provenance,
      conflicts,
      warnings,
    };
  }

  // --- Helper: Convert CubiONodeDeclarationAST to OneLanguageNodeConfig ---

  private astToScriptConfig(ast: CubiONodeDeclarationAST): OneLanguageNodeConfig {
    const transports: NodeTransportBindingConfig[] = ast.listenBindings.map(b => ({
      transportType: b.protocol,
      endpoint: {
        transportType: b.protocol,
        host: b.host,
        port: b.port,
        path: b.path,
      },
      enabled: true,
    }));

    return {
      coordinateUri: ast.coordinateUri,
      owner: ast.owner,
      role: ast.role,
      mtu: ast.mtu,
      heartbeatIntervalMs: ast.heartbeat,
      rateLimitPerMinute: ast.rateLimit,
      maxConcurrentPeers: ast.maxPeers,
      storageQuotaBytes: ast.storageQuota,
      routingPolicy: ast.routingPolicy,
      capabilities: ast.capabilities,
      defaultTransport: ast.defaultTransport,
      transports,
      publicKey: ast.publicKey,
      hardwareFingerprint: ast.hardwareFingerprint,
      staleTimeoutMs: ast.staleTimeoutMs,
      failureTimeoutMs: ast.failureTimeoutMs,
      sweepIntervalMs: ast.sweepIntervalMs,
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
    };
  }
}
