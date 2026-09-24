/**
 * CUBiO AI — 3D Memory Studio
 * Task 29 — tinyPMA: Task & Experiment Interpreter
 * src/cubio/language/native/pma/tinyPMATypes.ts
 *
 * Type definitions exclusively for tinyPMA.
 * Extends existing PMA types — does NOT duplicate PMAReuseStrategy,
 * PMATaskType, or any type already defined in types.ts.
 */

import type { PMAReuseStrategy, PMATaskType } from './types';

// ---------------------------------------------------------------------------
// tinyPMA Request Classification
// ---------------------------------------------------------------------------

/**
 * Extended classification taxonomy for tinyPMA.
 * Superset of PMATaskType — covers user-facing natural-language request categories.
 */
export type TinyPMARequestType =
  | 'TASK'
  | 'EXPERIMENT'
  | 'TEST'
  | 'RESEARCH'
  | 'BUILD'
  | 'AUDIT'
  | 'BENCHMARK'
  | 'TRAINING'
  | 'DEBUG'
  | 'OPTIMIZATION'
  | 'INTEGRATION'
  | 'REFACTOR'
  | 'MIGRATION'
  | 'ARCHITECTURE'
  | 'VALIDATION'
  | 'REGRESSION'
  | 'UNKNOWN';

/**
 * Maps TinyPMARequestType → PMATaskType for downstream PMA handoff.
 */
export type TinyPMAToPMATaskTypeMap = Readonly<Record<TinyPMARequestType, PMATaskType>>;

// ---------------------------------------------------------------------------
// Extracted Intelligence
// ---------------------------------------------------------------------------

export interface TinyPMAExtractedTerms {
  /** Project-specific vocabulary detected in the prompt */
  readonly projectTerms: readonly string[];
  /** Subsystem IDs mentioned or inferred (matching ProjectNavigator catalog IDs) */
  readonly subsystemIds: readonly string[];
  /** Capability names from CapabilityResolver registry that were referenced */
  readonly capabilityNames: readonly string[];
  /** Known frozen components referenced */
  readonly frozenComponents: readonly string[];
  /** Experiment identifiers, test names, task numbers detected */
  readonly taskReferences: readonly string[];
  /** Mathematical / algorithmic references (369, formula A, etc.) */
  readonly mathReferences: readonly string[];
}

// ---------------------------------------------------------------------------
// Related Work Discovery
// ---------------------------------------------------------------------------

export interface TinyPMARelatedTask {
  readonly taskId: string;
  readonly taskTitle: string;
  readonly subsystem: string;
  readonly relevanceScore: number;  // 0–100
  readonly relevanceReason: string;
}

export interface TinyPMARelatedExperiment {
  readonly name: string;
  readonly path: string;
  readonly subsystem: string;
  readonly relevanceScore: number;
  readonly relevanceReason: string;
}

export interface TinyPMARelatedEngine {
  readonly capabilityId: string;
  readonly capabilityName: string;
  readonly path: string;
  readonly reuseValue: 'MAXIMUM' | 'HIGH' | 'MEDIUM' | 'LOW';
  readonly reuseStrategy: PMAReuseStrategy;
  readonly relevanceScore: number;
}

export interface TinyPMARelatedReport {
  readonly reportPath: string;
  readonly subsystem: string;
  readonly relevanceScore: number;
}

// ---------------------------------------------------------------------------
// Risk Assessment
// ---------------------------------------------------------------------------

export type TinyPMARiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface TinyPMARiskFactors {
  readonly touchesFrozenComponent: boolean;
  readonly touchesDatabase: boolean;
  readonly touches369: boolean;
  readonly requestsActuation: boolean;
  readonly requestsExternalAI: boolean;
  readonly requestsDuplicateImplementation: boolean;
  readonly crossSubsystemScope: boolean;
  readonly riskLevel: TinyPMARiskLevel;
  readonly riskReasons: readonly string[];
}

// ---------------------------------------------------------------------------
// tinyPMA Handoff — Structured Output to Native PMA
// ---------------------------------------------------------------------------

/**
 * tinyPMA Handoff Contract.
 * The structured output of tinyPMA.interpretRequest().
 * This feeds directly into CubiOProjectManagerAgent.planTask().
 */
export interface TinyPMAHandoff {
  /** Unique ID for this interpretation pass */
  readonly interpretationId: string;
  /** Raw user text as provided */
  readonly requestText: string;
  /** Classified request type */
  readonly requestType: TinyPMARequestType;
  /** Human-readable task title extracted or synthesized from the prompt */
  readonly taskTitle: string;
  /** Extracted project vocabulary and references */
  readonly extractedTerms: TinyPMAExtractedTerms;
  /** Subsystem scope domains resolved */
  readonly domains: readonly string[];
  /** Related tasks from existing project memory */
  readonly relatedTasks: readonly TinyPMARelatedTask[];
  /** Related experiment paths discovered */
  readonly relatedExperiments: readonly TinyPMARelatedExperiment[];
  /** Related forensic reports */
  readonly relatedReports: readonly TinyPMARelatedReport[];
  /** Matching capability engines from CapabilityResolver */
  readonly relatedEngines: readonly TinyPMARelatedEngine[];
  /** Existing capabilities relevant to the request */
  readonly relatedCapabilities: readonly string[];
  /** Protected/frozen files that the request may touch */
  readonly frozenDependencies: readonly string[];
  /** Risk assessment */
  readonly riskLevel: TinyPMARiskLevel;
  readonly riskFactors: TinyPMARiskFactors;
  /** REUSE / COMPOSE / EXTEND / NEW recommendation */
  readonly recommendedAction: PMAReuseStrategy;
  readonly recommendationReason: string;
  /** Subsystem IDs for downstream PMA.planTask() scope */
  readonly pmaStudyScope: readonly string[];
  /** Duplicate creation warnings */
  readonly duplicateWarnings: readonly string[];
  /** Whether tinyPMA approves routing to PMA planner */
  readonly isApprovedForPMAHandoff: boolean;
  readonly rejectionReason?: string;
  /** PMA task type translation */
  readonly mappedPMATaskType: PMATaskType;
  readonly timestamp: number;
}

// ---------------------------------------------------------------------------
// tinyPMA Classification Evidence
// (Used internally for deterministic classification audit trail)
// ---------------------------------------------------------------------------

export interface TinyPMAClassificationEvidence {
  readonly candidateType: TinyPMARequestType;
  readonly matchedKeywords: readonly string[];
  readonly score: number;
}

export interface TinyPMAClassificationResult {
  readonly winner: TinyPMARequestType;
  readonly confidence: number;  // 0–100
  readonly evidence: readonly TinyPMAClassificationEvidence[];
  readonly isAmbiguous: boolean;
}
