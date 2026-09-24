/**
 * CUBiO AI — Phase 3 / Task 06: Node Configuration Architecture Types
 * ===================================================================
 *
 * Types, interfaces, and permission specifications governing controlled One
 * Language configuration of CUBiO Node runtime parameters, multi-tier precedence,
 * restricted system settings, and conflict detection.
 */

import {
  type NodeRole,
  type NodeCapability,
  type CanonicalNodeIdentity,
} from '../protocol/v1/nodeTypes';

import {
  type TransportType,
} from '../transport/types';

import {
  type NodeRuntimeConfig,
  type NodeTransportBindingConfig,
} from './nodeRuntimeTypes';

import {
  type CubiONodeDeclarationAST,
} from './oneLanguageNodeDeclarationTypes';

/**
 * Precedence tiers in authoritative configuration hierarchy.
 * Tier 1 (highest) overrides Tier 2, which overrides Tier 3.
 */
export type NodeConfigurationPrecedenceTier =
  | 'SYSTEM_ENVIRONMENT'  // Tier 1: Host environment, provisioning, hardware caps, fixed identities
  | 'ONE_LANGUAGE_SCRIPT'  // Tier 2: User script / One Language declarative configuration
  | 'CERTIFIED_DEFAULT';   // Tier 3: Built-in protocol & transport baseline defaults

/**
 * Categorization of settings within the security permission boundary.
 */
export type ConfigurationParameterScope =
  | 'PERMITTED_OPERATIONAL'  // Freely tunable by scripts within system limits
  | 'PERMITTED_RESILIENCE'   // Timing, retry, and pipeline policies tunable by scripts
  | 'RESTRICTED_SYSTEM';     // Sovereign identity, physical NIC MTU, role grants, host credentials

/**
 * System and Environment Configuration Tier (Tier 1).
 * Typically loaded from environment variables, CLI flags, or hardware attestation.
 */
export interface SystemEnvironmentConfig {
  /** Enforcement mode: STRICT rejects script tampering with restricted settings; PERMISSIVE logs warnings */
  readonly enforcementMode?: 'STRICT' | 'PERMISSIVE';

  /** Sovereign cryptographic identity roots */
  readonly systemOwnerCubId?: string;
  readonly systemPublicKey?: string;
  readonly systemHardwareFingerprint?: string;

  /** Physical hardware & operational ceilings */
  readonly maxMtuCeiling?: number;            // e.g. 1500 (Ethernet) or 9000 (Jumbo)
  readonly maxPeersCeiling?: number;          // e.g. 512
  readonly maxStorageQuotaCeiling?: number;   // e.g. 10 GB
  readonly minHeartbeatFloor?: number;        // e.g. 500 ms

  /** Role permissions: Roles this host process is authorized to assume */
  readonly authorizedRoles?: readonly NodeRole[];
  readonly allowScriptRoleElevation?: boolean;

  /** Pinned transport listeners enforced by host system infrastructure */
  readonly pinnedTransports?: readonly NodeTransportBindingConfig[];

  /** TLS and credential filesystem paths */
  readonly tlsKeyPath?: string;
  readonly tlsCertPath?: string;
  readonly tlsCaPath?: string;
}

/**
 * Script-Declarable Operational Configuration (Tier 2).
 * Directly extracted from a One Language AST or declaration block.
 */
export interface OneLanguageNodeConfig {
  readonly coordinateUri?: string;
  readonly owner?: string;
  readonly role?: NodeRole;
  readonly mtu?: number;
  readonly heartbeatIntervalMs?: number;
  readonly rateLimitPerMinute?: number;
  readonly maxConcurrentPeers?: number;
  readonly storageQuotaBytes?: number;
  readonly routingPolicy?: 'STRICT_COORDINATE' | 'DIRECT_ONLY';
  readonly capabilities?: readonly NodeCapability[];
  readonly defaultTransport?: TransportType;
  readonly transports?: readonly NodeTransportBindingConfig[];

  // Resilience & Timing
  readonly staleTimeoutMs?: number;
  readonly failureTimeoutMs?: number;
  readonly sweepIntervalMs?: number;
  readonly retryPolicy?: {
    readonly maxRetries?: number;
    readonly initialDelayMs?: number;
    readonly maxDelayMs?: number;
  };
  readonly pipelineOptions?: {
    readonly maxQueueSize?: number;
    readonly assemblyTimeoutMs?: number;
  };

  // Optional Identity overrides (checked against RESTRICTED_SYSTEM scope)
  readonly publicKey?: string;
  readonly hardwareFingerprint?: string;
}

/**
 * Provenance tracking record for an individual resolved parameter.
 */
export interface ResolvedParameterProvenance<T = any> {
  readonly parameter: string;
  readonly value: T;
  readonly tier: NodeConfigurationPrecedenceTier;
  readonly scope: ConfigurationParameterScope;
  readonly clampedFrom?: T;
  readonly reason?: string;
}

/**
 * Structured diagnostic for a configuration conflict, dependency violation, or security breach.
 */
export interface NodeConfigurationConflict {
  readonly code: string;
  readonly message: string;
  readonly field: string;
  readonly severity: 'ERROR' | 'WARNING';
  readonly tier?: NodeConfigurationPrecedenceTier;
}

/**
 * Result of multi-tier configuration resolution.
 */
export interface NodeConfigurationResolutionResult {
  readonly success: boolean;
  readonly config?: NodeRuntimeConfig;
  readonly provenance: Readonly<Record<string, ResolvedParameterProvenance>>;
  readonly conflicts: readonly NodeConfigurationConflict[];
  readonly warnings: readonly string[];
}
