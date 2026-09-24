/**
 * CUBiO AI — Phase 3 / Task 05: One Language Node Declaration Types
 * =================================================================
 *
 * Formal AST structures, validation types, and mapping interfaces for canonical
 * CUBiO Node Declarations authored in the One Language declarative syntax.
 */

import {
  type NodeRole,
  type NodeCapability,
  type CanonicalNodeIdentity,
  type CanonicalNodeConfig,
} from '../protocol/v1/nodeTypes';

import {
  type TransportType,
  type TransportEndpoint,
} from '../transport/types';

import {
  type NodeRuntimeConfig,
  type NodeTransportBindingConfig,
} from './nodeRuntimeTypes';

/**
 * Source location metadata for precise error reporting and debugging.
 */
export interface NodeDeclarationSourceLocation {
  readonly line: number;
  readonly column: number;
}

/**
 * Transport listen binding AST node parsed from a declaration.
 * Example: `listen: tcp "127.0.0.1:44001";`
 */
export interface NodeDeclarationListenBindingAST {
  readonly protocol: TransportType;
  readonly address: string;
  readonly host: string;
  readonly port: number;
  readonly path?: string;
  readonly tls?: boolean;
  readonly location: NodeDeclarationSourceLocation;
}

/**
 * Retry policy declaration AST node.
 */
export interface NodeDeclarationRetryPolicyAST {
  readonly maxRetries?: number;
  readonly initialDelayMs?: number;
  readonly maxDelayMs?: number;
  readonly location: NodeDeclarationSourceLocation;
}

/**
 * Pipeline options declaration AST node.
 */
export interface NodeDeclarationPipelineOptionsAST {
  readonly maxQueueSize?: number;
  readonly assemblyTimeoutMs?: number;
  readonly location: NodeDeclarationSourceLocation;
}

/**
 * Canonical AST representation of a parsed CUBiO Node Declaration.
 */
export interface CubiONodeDeclarationAST {
  readonly type: 'CubiONodeDeclaration';
  readonly name: string;
  readonly nameLocation: NodeDeclarationSourceLocation;
  
  // Mandatory semantic fields
  readonly coordinateUri?: string;
  readonly coordinateLocation?: NodeDeclarationSourceLocation;

  readonly owner?: string;
  readonly ownerLocation?: NodeDeclarationSourceLocation;

  readonly role?: NodeRole;
  readonly roleLocation?: NodeDeclarationSourceLocation;

  readonly listenBindings: readonly NodeDeclarationListenBindingAST[];

  // Optional operational fields
  readonly defaultTransport?: TransportType;
  readonly defaultTransportLocation?: NodeDeclarationSourceLocation;

  readonly mtu?: number;
  readonly mtuLocation?: NodeDeclarationSourceLocation;

  readonly heartbeat?: number;
  readonly heartbeatLocation?: NodeDeclarationSourceLocation;

  readonly rateLimit?: number;
  readonly rateLimitLocation?: NodeDeclarationSourceLocation;

  readonly maxPeers?: number;
  readonly maxPeersLocation?: NodeDeclarationSourceLocation;

  readonly storageQuota?: number;
  readonly storageQuotaLocation?: NodeDeclarationSourceLocation;

  readonly routingPolicy?: 'STRICT_COORDINATE' | 'DIRECT_ONLY';
  readonly routingPolicyLocation?: NodeDeclarationSourceLocation;

  readonly capabilities?: readonly NodeCapability[];
  readonly capabilitiesLocation?: NodeDeclarationSourceLocation;

  readonly publicKey?: string;
  readonly publicKeyLocation?: NodeDeclarationSourceLocation;

  readonly hardwareFingerprint?: string;
  readonly hardwareFingerprintLocation?: NodeDeclarationSourceLocation;

  // Spatial & Grid alignment (optional)
  readonly space?: { readonly x: number; readonly y: number; readonly z: number };
  readonly spaceLocation?: NodeDeclarationSourceLocation;

  readonly grid777?: { readonly i: number; readonly j: number; readonly k: number };
  readonly grid777Location?: NodeDeclarationSourceLocation;

  // Advanced lifecycle & resilience
  readonly staleTimeoutMs?: number;
  readonly failureTimeoutMs?: number;
  readonly sweepIntervalMs?: number;
  readonly retryPolicy?: NodeDeclarationRetryPolicyAST;
  readonly pipelineOptions?: NodeDeclarationPipelineOptionsAST;

  // Raw property occurrence tracker for duplicate rejection verification
  readonly declaredProperties: readonly string[];
}

/**
 * Severity of a validation issue.
 */
export type NodeDeclarationIssueSeverity = 'ERROR' | 'WARNING';

/**
 * Structured validation error with source location and error code.
 */
export interface NodeDeclarationValidationError {
  readonly code: string;
  readonly message: string;
  readonly severity: NodeDeclarationIssueSeverity;
  readonly field?: string;
  readonly location?: NodeDeclarationSourceLocation;
}

/**
 * Result of validating a CubiONodeDeclarationAST.
 */
export interface NodeDeclarationValidationResult {
  readonly valid: boolean;
  readonly errors: readonly NodeDeclarationValidationError[];
  readonly warnings: readonly string[];
}

/**
 * Result of parsing, validating, and mapping a One Language node declaration.
 */
export interface NodeDeclarationCompilationResult {
  readonly success: boolean;
  readonly ast?: CubiONodeDeclarationAST;
  readonly runtimeConfig?: NodeRuntimeConfig;
  readonly canonicalConfig?: CanonicalNodeConfig;
  readonly identity?: CanonicalNodeIdentity;
  readonly errors: readonly NodeDeclarationValidationError[];
  readonly warnings: readonly string[];
}
