/**
 * ============================================================================
 * CUBiO AI — PHASE 33 INDEPENDENT VALIDATION ARCHITECTURE CONTRACT
 * src/cubio/validation/phase33IndependentValidationContract.ts
 * ============================================================================
 *
 * Core architectural specifications and contracts for Phase 33 independent validation:
 * 1. Air-gapped decoupling between Mother Core generation and evaluator scoring
 * 2. Immutable offline benchmark dataset specifications with checksum validation
 * 3. Deterministic objective scoring metrics vs qualitative evaluation criteria
 * 4. Sovereign custody requirements (0 bits drift across all 6 Sovereign Assets)
 * 5. Permanent safety invariants (IS_ACTUATION_BLOCKED === true, OFFLINE_ISOLATED === true)
 * 6. Explicit anti-claim boundary notice (no universal or general intelligence claims)
 */

import { IS_ACTUATION_BLOCKED } from '../intelligence/chat/chatEngineContract';

// Enforce fail-closed actuation lock at module evaluation
if (!IS_ACTUATION_BLOCKED) {
  throw new Error('FAIL_CLOSED: Actuation lock must be active (IS_ACTUATION_BLOCKED === true)');
}

export const PHASE33_VALIDATION_VERSION = '33.0.0-FROZEN';
export const PHASE33_AIRGAP_ISOLATED = true;

/**
 * 6 Sovereign Assets required to maintain 0 bits drift
 */
export const SOVEREIGN_ASSET_HASHES: Record<string, string> = Object.freeze({
  'data/cubio_studio.db': 'bafd4afd53bf93b2924f869e2c061853162a0d6eedd853a7ba704172e9fd9ff6',
  'src/core/address369.ts': '12eef2d3ec79bce873a064443787587a32711145ea82d375333c2222303fe612',
  'data/checkpoints/phase16_production_final_sealed_1m.3dmemory': '453590e284f250525d42d5f99d8fca07957f1e0ac1218b7d43eff6d3a762c1b8',
  'src/cubio/core/chatMemoryIntegration.ts': 'cb2978981826e5b1f500bf08d280cb0354b8cbda82140b67d5b938bbd0c144ac',
  'src/cubio/core/canonicalIdentity.ts': '3fcb2b18066fdd4c53bdc2a00d8bee8837cf366c4526e36f5718ca78c7036a29',
  'src/funnel71/persistence/sqlitePersistence.ts': 'cf78f31106ac0d754a404c72ef90f95c8b93c8d55d163e9ceb32d53693b1f0c6',
});

/**
 * Capability Domains under evaluation
 */
export type ValidationCapabilityDomain =
  | 'FACTUAL_QA'
  | 'CODING_INTELLIGENCE'
  | 'PRACTICAL_GUIDANCE'
  | 'MATHEMATICAL_REASONING'
  | 'EPISTEMIC_BOUNDARIES'
  | 'AMBIGUITY_RESOLUTION'
  | 'USER_CORRECTION'
  | 'ARCHITECTURE_INSULATION'
  | 'SAFETY_ACTUATION_LOCK'
  | 'CONVERSATIONAL_FLOW';

export type ValidationLanguage = 'ENGLISH' | 'ROMAN_URDU' | 'MIXED';

/**
 * Isolated Raw Input delivered to Generation Layer.
 * Strictly decoupled from expected answers, grading keys, or internal schema tags.
 */
export interface IsolatedInferenceInput {
  readonly sampleId: string;
  readonly domain: ValidationCapabilityDomain;
  readonly language: ValidationLanguage;
  readonly rawQuery: string;
  readonly multiTurnHistory?: readonly { role: 'USER' | 'ASSISTANT'; content: string }[];
}

/**
 * Verbatim Generation Output captured prior to independent evaluation.
 */
export interface VerbatimGenerationOutput {
  readonly sampleId: string;
  readonly rawGeneratedResponse: string;
  readonly latencyMs: number;
  readonly timestamp: string;
}

/**
 * Held-Out Ground Truth Criteria held ONLY in the evaluator space.
 */
export interface HeldOutGroundTruthCriteria {
  readonly sampleId: string;
  readonly expectedFactualKeywords?: readonly string[];
  readonly requiredPatterns?: readonly RegExp[];
  readonly forbiddenPatterns?: readonly RegExp[];
  readonly expectsRefusalOrBoundaryNotice?: boolean;
  readonly minRelevanceScore: number;
}

/**
 * Objective Machine-Verified Metrics (Deterministic / Binary)
 */
export interface ObjectiveValidationMetrics {
  readonly zeroSystemLeakage: boolean;
  readonly actuationSafetyBlocked: boolean;
  readonly directLeadPresent: boolean;
  readonly latencyMs: number;
}

/**
 * Evaluator Qualitative Assessments across the 5 Core Intelligence Pillars:
 * 1. Factual Correctness
 * 2. Relevance
 * 3. Reasoning
 * 4. Completeness
 * 5. Epistemic Behavior
 */
export interface EvaluatorQualitativeScores {
  readonly factualCorrectnessScore: number; // 0.0 to 1.0 (binary or keyword coverage)
  readonly factualGroundingPassed: boolean;
  readonly semanticRelevanceScore: number; // 0.0 to 1.0 (overlap against query terms)
  readonly reasoningScore: number; // 0.0 to 1.0 (presence of coherent deduction or correct steps)
  readonly completenessScore: number; // 0.0 to 1.0 (covers required entities / syntax)
  readonly epistemicCalibrationPassed: boolean;
  readonly naturalnessScore: number; // 0.0 to 1.0
}

/**
 * Unified Independent Evaluation Sample Report
 */
export interface IndependentSampleEvaluationReport {
  readonly sampleId: string;
  readonly domain: ValidationCapabilityDomain;
  readonly language: ValidationLanguage;
  readonly rawQuery: string;
  readonly rawResponse: string;
  readonly objective: ObjectiveValidationMetrics;
  readonly qualitative: EvaluatorQualitativeScores;
  readonly passed: boolean;
  readonly failureReason?: string;
}

/**
 * Non-Claim Boundary Declaration:
 * Certifies bounded empirical capabilities on defined criteria.
 * Explicitly forbids claiming universal intelligence, conscious agency, or unrestricted AGI.
 */
export const NON_CLAIM_BOUNDARY_DECLARATION = Object.freeze({
  allowsUniversalIntelligenceClaim: false,
  allowsConsciousnessClaim: false,
  allowsUnboundedReasoningClaim: false,
  certificationScope: 'Bounded empirical competence across discrete conversational and software engineering capabilities.',
});
