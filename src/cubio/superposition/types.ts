/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 5: Superposition Engine Types
 *
 * Formal specification for multi-representation superposition states:
 * Active State, Possible States, Confidence Distribution, Transitions, and Resolution/Collapse.
 *
 * Invariant: Deterministic normalization (Σ P = 1.0), reproducible collapse, and zero state divergence.
 */

import { CubiOState } from '../state/types';
import { CubiODimension } from '../types';

export type SuperpositionCandidateStatus =
  | 'ACTIVE'
  | 'SUPERPOSED'
  | 'COLLAPSED'
  | 'PRUNED'
  | 'BRANCHED';

export interface SuperpositionCandidate {
  readonly candidateId: string;
  readonly state: CubiOState;
  readonly dimension: CubiODimension;
  readonly amplitude: number; // Raw amplitude weight [0..1]
  readonly confidence: number; // Normalized probability P(S_k) = amplitude / Σ amplitudes
  readonly entropy: number;
  readonly resonanceScore: number; // [0..100]
  readonly status: SuperpositionCandidateStatus;
  readonly evidenceNotes?: string;
  readonly checksum: string;
}

export type SuperpositionResolutionCriteria =
  | 'MAX_CONFIDENCE'
  | 'MIN_ENTROPY'
  | 'MAX_RESONANCE'
  | 'MULTI_CRITERIA_WEIGHTED'
  | 'MANUAL_OVERRIDE';

export interface SuperpositionEnvelope {
  readonly superpositionId: string;
  readonly activeCandidateId: string;
  readonly candidates: readonly SuperpositionCandidate[];
  readonly totalEntropy: number;
  readonly isResolved: boolean;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly envelopeChecksum: string;
}

export interface SuperpositionResolutionResult {
  readonly resolutionId: string;
  readonly superpositionId: string;
  readonly resolvedCandidateId: string;
  readonly resolvedState: CubiOState;
  readonly previousActiveId: string;
  readonly criteriaUsed: SuperpositionResolutionCriteria;
  readonly confidenceAtResolution: number;
  readonly entropyReduction: number;
  readonly collapseChecksum: string;
  readonly resolutionTimestamp: number;
}

export interface SuperpositionTransitionDelta {
  readonly transitionId: string;
  readonly fromSuperpositionId: string;
  readonly toSuperpositionId: string;
  readonly candidateChangesCount: number;
  readonly amplitudeShift: number;
  readonly transitionChecksum: string;
}

// ─── TASK 06: SUPERPOSITION V2 (REFERENCE + DELTA ARCHITECTURE) ─────────────

export interface StateDelta {
  readonly proposedCellId?: number;
  readonly propertyPatches?: Readonly<Record<string, unknown>>;
  readonly removedPropertyKeys?: readonly string[];
  readonly action?: Readonly<Record<string, unknown>>;
}

export type SuperpositionCandidateV2Status =
  | 'ACTIVE'
  | 'SUPERPOSED'
  | 'PROMOTED'
  | 'PRUNED'
  | 'COLLAPSED';

export interface SuperpositionCandidateV2 {
  readonly candidateId: string;
  readonly baseObjectId: string;
  readonly baseStateVersion: number;
  readonly parentCandidateId?: string;
  readonly tenantId: string;
  readonly delta: StateDelta;
  readonly probability: number;
  readonly amplitude: number;
  readonly resonanceScore: number;
  readonly entropy: number;
  readonly status: SuperpositionCandidateV2Status;
  readonly reasoningTraceRef?: string;
  readonly checksum: string;
}

export interface SuperpositionEnvelopeV2 {
  readonly superpositionId: string;
  readonly baseObjectId: string;
  readonly baseStateVersion: number;
  readonly tenantId: string;
  readonly activeCandidateId: string;
  readonly candidates: readonly SuperpositionCandidateV2[];
  readonly totalEntropy: number;
  readonly isResolved: boolean;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly envelopeChecksum: string;
}

export interface SuperpositionResolutionResultV2 {
  readonly resolutionId: string;
  readonly superpositionId: string;
  readonly resolvedCandidateId: string;
  readonly baseObjectId: string;
  readonly baseStateVersion: number;
  readonly resultingStateVersion: number;
  readonly criteriaUsed: SuperpositionResolutionCriteria;
  readonly confidenceAtResolution: number;
  readonly entropyReduction: number;
  readonly collapseChecksum: string;
  readonly resolutionTimestamp: number;
  readonly winningDelta: StateDelta;
}
