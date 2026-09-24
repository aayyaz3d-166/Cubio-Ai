/**
 * CUBiO AI — 3D Memory Studio
 * AGENT-003 — TGA (Test & Gate Agent)
 * src/cubio/agents/tga/types.ts
 *
 * Authoritative type contracts for CUBiO's native Test & Gate Agent.
 * Enables pre-execution gate and test discovery, prerequisite validation,
 * regression detection, and PASS/FAIL/BLOCKED decision governance.
 */

export type TGATaskCategory =
  | 'BUILD'
  | 'FEATURE'
  | 'REFACTOR'
  | 'TEST'
  | 'SECURITY'
  | 'BENCHMARK'
  | 'MIGRATION'
  | 'UNKNOWN';

export type TGAGateCategory =
  | 'PREREQUISITE'
  | 'UNIT'
  | 'INTEGRATION'
  | 'REGRESSION'
  | 'INVARIANT'
  | 'BUILD'
  | 'SECURITY';

export type TGAGateVerdictStatus = 'PASS' | 'FAIL' | 'BLOCKED';

export interface TGATaskScope {
  /** Objective or task description */
  readonly objective: string;
  /** Primary and candidate subsystem IDs (e.g. 'SPATIAL_369', 'DATABASE_VDB') */
  readonly targetSubsystems?: readonly string[];
  /** File paths proposed for modification or creation */
  readonly touchedFiles?: readonly string[];
  /** Specific Task ID if available (e.g. 'TASK32') */
  readonly taskId?: string;
  /** Categorized task nature */
  readonly taskCategory?: TGATaskCategory;
}

export interface TGAGateDefinition {
  readonly gateId: string;
  readonly name: string;
  readonly category: TGAGateCategory;
  readonly testPath?: string;
  readonly isMandatory: boolean;
  readonly timeoutMs: number;
  readonly description: string;
}

export interface TGAPrerequisiteStatus {
  readonly databaseBaselineValid: boolean;
  readonly spatial369Valid: boolean;
  readonly actuationLocked: boolean;
  readonly boundaryPreserved: boolean;
  readonly isReadyForTesting: boolean;
  readonly failureReasons: readonly string[];
}

export interface TGAGateResult {
  readonly gateId: string;
  readonly name: string;
  readonly category: TGAGateCategory;
  readonly status: TGAGateVerdictStatus;
  readonly durationMs: number;
  readonly evidenceHash: string;
  readonly errorMessage?: string;
}

export interface TGARegressionStatus {
  readonly regressionDetected: boolean;
  readonly driftedInvariants: readonly string[];
  readonly baselineStatus: 'LOCKED_ZERO_DRIFT' | 'DRIFT_DETECTED';
}

export interface TGAVerdict {
  readonly finalStatus: TGAGateVerdictStatus;
  readonly passedGates: number;
  readonly totalGates: number;
  readonly failedGates: readonly string[];
  readonly blockedReason?: string;
}

export interface TGAGateReport {
  readonly agentId: 'AGENT-003-TGA';
  readonly version: '1.0.0';
  readonly taskId?: string;
  readonly taskScope: TGATaskScope;
  readonly prerequisites: TGAPrerequisiteStatus;
  readonly discoveredGates: readonly TGAGateDefinition[];
  readonly gateResults: readonly TGAGateResult[];
  readonly regressionStatus: TGARegressionStatus;
  readonly verdict: TGAVerdict;
  readonly masterProvenanceHash: string;
  readonly executionTimeMs: number;
  readonly rxLifecycleId?: string;
}

export interface TGASafetyStatus {
  readonly is_actuation_blocked: boolean;
  readonly external_ai_dependencies: number;
  readonly canonical_db_unmutated: boolean;
  readonly address369_unmutated: boolean;
}
