/**
 * CUBiO AI — 3D Memory Studio
 * AGENT-004 — EIA (Evidence & Audit Agent)
 * src/cubio/agents/eia/types.ts
 *
 * Authoritative type definitions and contracts for evidence creation,
 * artifact identity, chain-of-custody tracking, discrepancy detection,
 * and cryptographic audit sealing.
 */

export type EIAArtifactType =
  | 'SOURCE_FILE'
  | 'TEST_RESULT'
  | 'GATE_REPORT'
  | 'PMA_HANDOFF'
  | 'STATE_T_TRANSITION'
  | 'MEMORY_RECORD'
  | 'BINARY_DB'
  | 'RAW_PAYLOAD';

export interface EIAEvidenceArtifact {
  readonly uri: string;
  readonly artifactType: EIAArtifactType;
  readonly contentHash: string;
  readonly sizeBytes?: number;
  readonly timestamp?: number;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface EIAStageTransition {
  readonly fromStage: number;
  readonly toStage: number;
  readonly transitionHash: string;
  readonly timestamp: number;
  readonly agentId: string;
  readonly isMonotonic: boolean;
}

export interface EIAChainOfCustodyStep {
  readonly stepIndex: number;
  readonly stage: number;
  readonly stageName: string;
  readonly action: string;
  readonly actor: string;
  readonly inputHash: string;
  readonly outputHash: string;
  readonly previousStepHash: string;
  readonly stepHash: string;
  readonly timestamp: number;
}

export type EIADiscrepancySeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export type EIADiscrepancyType =
  | 'HASH_MISMATCH'
  | 'STAGE_SKIPPED'
  | 'OUT_OF_ORDER'
  | 'FROZEN_FILE_TOUCHED'
  | 'ACTUATION_UNASSERTED'
  | 'INVARIANT_DRIFT'
  | 'MISSING_ARTIFACT'
  | 'UNLINKED_PROVENANCE';

export interface EIADiscrepancy {
  readonly discrepancyId: string;
  readonly severity: EIADiscrepancySeverity;
  readonly type: EIADiscrepancyType;
  readonly description: string;
  readonly targetReference: string;
  readonly expected?: string;
  readonly actual?: string;
}

export interface EIAAuditScope {
  readonly taskId: string;
  readonly objective: string;
  readonly artifacts?: readonly EIAEvidenceArtifact[];
  readonly transitions?: readonly EIAStageTransition[];
  readonly custodySteps?: readonly EIAChainOfCustodyStep[];
  readonly allowedFiles?: readonly string[];
  readonly touchedFiles?: readonly string[];
  readonly agentReports?: readonly {
    readonly agentId: string;
    readonly masterHash: string;
    readonly verdict: string;
  }[];
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export type EIAAuditStatus =
  | 'CERTIFIED_SEALED'
  | 'DISCREPANCY_FLAGGED'
  | 'REJECTED_CORRUPTED';

export interface EIAAuditReport {
  readonly agentId: 'AGENT-004-EIA';
  readonly version: '1.0.0';
  readonly auditId: string;
  readonly taskId: string;
  readonly status: EIAAuditStatus;
  readonly totalArtifacts: number;
  readonly verifiedArtifacts: number;
  readonly corruptedArtifacts: number;
  readonly totalTransitions: number;
  readonly validTransitions: number;
  readonly chainOfCustody: readonly EIAChainOfCustodyStep[];
  readonly discrepancies: readonly EIADiscrepancy[];
  readonly masterAuditHash: string;
  readonly executionTimeMs: number;
  readonly rxLifecycleId: string;
  readonly isActuationBlocked: true;
}

export interface EIASafetyStatus {
  readonly isActuationBlocked: boolean;
  readonly isOfflineOnly: boolean;
  readonly externalAiDetected: boolean;
}
