/**
 * CUBiO AI — Phase 6: Task 88
 * Native Language + Multimodal Intelligence Layer
 * src/cubio/language/native/multimodal/multimodalLanguageTypes.ts
 *
 * Types, contracts, epistemic models, and error hierarchy for connecting
 * native natural language reasoning with validated visual, audio, and structured pathways.
 */

import { CanonicalModality } from '../../../information/native/multimodal/multimodalTypes';

export type MultimodalEpistemicStatus =
  | 'CANONICAL_FACT'
  | 'SUPPORTED_HYPOTHESIS'
  | 'CROSS_MODAL_CONTRADICTION'
  | 'EPISTEMIC_UNKNOWN';

export interface MultimodalEvidenceObject {
  readonly evidenceId: string;
  readonly objectId: string;
  readonly tenantId: string;
  readonly facetId: string;
  readonly modality: CanonicalModality;
  readonly featureKey: string;
  readonly observedValue: number | string | boolean | readonly number[];
  readonly unit?: string;
  readonly spatialCellId?: number;
  readonly provenance: readonly string[];
  readonly recordChecksum: string;
  readonly isObservedFeature: boolean;
  readonly epistemicStatus: 'OBSERVED_FACT' | 'SUPPORTED_HYPOTHESIS';
  readonly confidence: number;
}

export interface CrossModalContradiction {
  readonly contradictionId: string;
  readonly objectId: string;
  readonly tenantId: string;
  readonly modalityA: CanonicalModality;
  readonly modalityB: CanonicalModality;
  readonly featureOrClaimA: string;
  readonly featureOrClaimB: string;
  readonly divergenceReason: string;
  readonly refutationText: string;
}

export interface MultimodalLanguageQuery {
  readonly queryText: string;
  readonly tenantId?: string;
  readonly targetObjectId?: string;
  readonly modalityFilter?: CanonicalModality;
}

export interface MultimodalLanguageResponse {
  readonly responseId: string;
  readonly queryText: string;
  readonly tenantId: string;
  readonly targetObjectId?: string;
  readonly generatedText: string;
  readonly epistemicStatus: MultimodalEpistemicStatus;
  readonly confidence: number;
  readonly isGrounded: boolean;
  readonly citedEvidences: readonly MultimodalEvidenceObject[];
  readonly contradictions?: readonly CrossModalContradiction[];
  readonly provenance?: readonly string[];
  readonly durationMs: number;
}

export interface MultimodalBenchmarkMetrics {
  readonly totalQueries: number;
  readonly passedQueries: number;
  readonly overallAccuracy: number;
  readonly visualQuestionAccuracy: number;
  readonly audioQuestionAccuracy: number;
  readonly structuredQuestionAccuracy: number;
  readonly textQuestionAccuracy: number;
  readonly crossModalConsistencyRate: number;
  readonly contradictionDetectionRate: number;
  readonly unknownRejectionRate: number;
  readonly actuationInterceptionRate: number;
  readonly averageLatencyMs: number;
  readonly memoryFootprintBytes: number;
}

// =============================================================================
// DOMAIN ERROR HIERARCHY
// =============================================================================

export class MultimodalLanguageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MultimodalLanguageError';
  }
}

export class UnresolvedModalityEvidenceError extends MultimodalLanguageError {
  constructor(entityName: string, modality: string, tenantId: string) {
    super(`Evidence for entity "${entityName}" in modality "${modality}" is missing for tenant "${tenantId}".`);
    this.name = 'UnresolvedModalityEvidenceError';
  }
}

export class CrossModalContradictionDetectedError extends MultimodalLanguageError {
  constructor(objectId: string, reason: string) {
    super(`Cross-modal contradiction detected on entity "${objectId}": ${reason}`);
    this.name = 'CrossModalContradictionDetectedError';
  }
}

export class MultimodalActuationBlockedError extends MultimodalLanguageError {
  constructor(message = 'Multimodal hardware actuation is permanently blocked in CUBiO AI sovereign runtime. Advisory output only.') {
    super(message);
    this.name = 'MultimodalActuationBlockedError';
  }
}
