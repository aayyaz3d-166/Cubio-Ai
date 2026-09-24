/**
 * CUBiO AI — 3D Memory Studio
 * AGENT-002 — DRA (Dependency & Reuse Agent)
 * src/cubio/agents/dra/types.ts
 *
 * Authoritative type contracts for CUBiO's native Dependency & Reuse Agent.
 * Ensures targeted dependency graphing, capability reuse recommendations,
 * duplicate prevention, and frozen authority guarding before new development.
 */

import { PMAReuseStrategy } from '../../language/native/pma/types';

export type DRANodeStatus = 'FROZEN_AUTHORITY' | 'CERTIFIED' | 'ACTIVE' | 'EXPERIMENTAL';

export type DRAConflictType =
  | 'DUPLICATE_IMPLEMENTATION'
  | 'FROZEN_MODIFICATION_RISK'
  | 'CIRCULAR_DEPENDENCY'
  | 'SCOPE_OVERLAP'
  | 'EXTERNAL_AI_DETECTED';

export type DRASeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface DRATaskQuery {
  /** User prompt or task description */
  readonly prompt: string;
  /** Primary and candidate subsystem IDs (e.g. 'SPATIAL_369', 'DATABASE_VDB') */
  readonly targetSubsystems?: readonly string[];
  /** Proposed new or modified file paths */
  readonly proposedFiles?: readonly string[];
  /** Expected external or internal dependencies */
  readonly proposedDependencies?: readonly string[];
  /** Specific Task ID if available */
  readonly taskId?: string;
  /** If true, triggers cycle detection across all affected subsystems */
  readonly auditCycles?: boolean;
}

export interface DRADependencyNode {
  readonly id: string;
  readonly name: string;
  readonly primaryDir: string;
  readonly keyFiles: readonly string[];
  readonly tests: readonly string[];
  readonly reports: readonly string[];
  readonly status: DRANodeStatus;
  readonly isFrozen: boolean;
  readonly upstreamDependencies: readonly string[];
  readonly downstreamDependents: readonly string[];
}

export interface DRADependencyGraph {
  readonly nodes: readonly DRADependencyNode[];
  readonly edges: readonly { from: string; to: string; type: 'IMPORTS' | 'DEPENDS_ON' }[];
  readonly hasCycles: boolean;
  readonly cyclePaths: readonly (readonly string[])[];
  readonly topologicalOrder: readonly string[];
}

export interface DRAReuseCandidate {
  readonly capabilityId: string;
  readonly capabilityName: string;
  readonly path: string;
  readonly implementation: string;
  readonly status: string;
  readonly tests: string;
  readonly dependencies: readonly string[];
  readonly reuseValue: 'MAXIMUM' | 'HIGH' | 'MEDIUM' | 'LOW';
  readonly recommendedStrategy: PMAReuseStrategy;
  readonly rationale: string;
}

export interface DRAConflictWarning {
  readonly type: DRAConflictType;
  readonly severity: DRASeverity;
  readonly target: string;
  readonly reason: string;
  readonly impact: string;
  readonly safeAlternatives: readonly string[];
}

export interface DRASourceReference {
  readonly sourcePath: string;
  readonly referenceType: 'SOURCE_CODE' | 'TEST_SUITE' | 'FORENSIC_REPORT' | 'MANIFEST';
  readonly description: string;
  readonly isFrozen: boolean;
  readonly checksum?: string;
}

export interface DRAReuseReport {
  readonly agentId: 'AGENT-002-DRA';
  readonly version: '1.0.0';
  readonly taskId?: string;
  readonly query: DRATaskQuery;
  readonly recommendedStrategy: PMAReuseStrategy;
  readonly matchedCapabilities: readonly DRAReuseCandidate[];
  readonly dependencyGraph: DRADependencyGraph;
  readonly conflicts: readonly DRAConflictWarning[];
  readonly protectedFilesImpacted: readonly string[];
  readonly exactSourceReferences: readonly DRASourceReference[];
  readonly isApprovedForDevelopment: boolean;
  readonly masterProvenanceHash: string;
  readonly executionTimeMs: number;
  readonly rxLifecycleId?: string;
}

export interface DRASafetyStatus {
  readonly is_actuation_blocked: boolean;
  readonly external_ai_dependencies: number;
  readonly canonical_db_unmutated: boolean;
  readonly address369_unmutated: boolean;
}
