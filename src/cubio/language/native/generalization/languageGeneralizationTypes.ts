/**
 * CUBiO AI — Phase 6: Task 84 — Language Generalization & Transfer
 * src/cubio/language/native/generalization/languageGeneralizationTypes.ts
 *
 * Types, interfaces, invariants and metrics for measuring native linguistic generalization,
 * concept compositionality, paraphrase invariance, distribution shift tolerance,
 * and fail-closed epistemic UNKNOWN assertion on unsupported extrapolation.
 */

import { LanguageScalingTier } from '../scaling/languageScalingTypes';
import { EpistemicStatus } from '../../../epistemic/native/epistemicTypes';

export type LanguageGeneralizationPartition =
  | 'TRAIN'
  | 'VAL'
  | 'UNSEEN_VOCAB_COMBINATIONS'
  | 'UNSEEN_SYNTAX_STRUCTURES'
  | 'PARAPHRASES'
  | 'UNSEEN_INSTRUCTIONS'
  | 'CROSS_DOMAIN_TRANSFER'
  | 'DISTRIBUTION_SHIFT'
  | 'OOD_UNSUPPORTED_PROBES';

export type DistributionShiftStage =
  | 'IN_DISTRIBUTION'
  | 'MILD_SHIFT'
  | 'SEVERE_SHIFT'
  | 'OOD_EXTRAPOLATION';

export interface LanguageGeneralizationSample {
  readonly id: string;
  readonly text: string;
  readonly target: string;
  readonly partition: LanguageGeneralizationPartition;
  readonly domain: string;
  readonly referenceObjectIds: readonly string[];
  readonly tokenCount: number;
  readonly checksum: string; // SHA-256
}

export interface ParaphrasePair {
  readonly id: string;
  readonly originalText: string;
  readonly paraphrasedText: string;
  readonly underlyingMeaning: string;
  readonly targetConcept: string;
  readonly domain: string;
  readonly checksum: string;
}

export interface CrossDomainTransferPair {
  readonly id: string;
  readonly sourceDomain: string;
  readonly targetDomain: string;
  readonly sourceConcept: string;
  readonly targetContext: string;
  readonly prompt: string;
  readonly expectedGroundedAnswer: string;
  readonly referenceObjectIds: readonly string[];
}

export interface DistributionShiftProbe {
  readonly id: string;
  readonly stage: DistributionShiftStage;
  readonly prompt: string;
  readonly expectedOutput: string;
  readonly isOOD: boolean;
  readonly acceptableStatus: EpistemicStatus;
}

export interface DocumentedFailureCase {
  readonly sampleId: string;
  readonly category: string;
  readonly prompt: string;
  readonly actualOutput: string;
  readonly failureReason: string;
  readonly architecturalMitigation: string;
}

export interface CapacityGeneralizationPoint {
  readonly tier: LanguageScalingTier;
  readonly parameterCount: number;
  readonly trainAccuracy: number;
  readonly testAccuracy: number;
  readonly generalizationGap: number;
  readonly compositionScore: number;
}

export interface LanguageGeneralizationMetrics {
  readonly tenantId: string;
  readonly timestamp: number;
  readonly trainAccuracy: number; // 0.0 to 1.0
  readonly valAccuracy: number; // 0.0 to 1.0
  readonly generalizationGap: number; // trainAccuracy - valAccuracy
  readonly memorizationScore: number; // 0.0 to 1.0 (analytical metric)
  readonly novelCompositionAccuracy: number; // 0.0 to 1.0 (unseen combos + unseen syntax)
  readonly paraphraseInvarianceScore: number; // 0.0 to 1.0 (semantic equivalence consistency)
  readonly instructionTransferAccuracy: number; // 0.0 to 1.0 (execution of unseen instructions)
  readonly crossDomainTransfer: {
    readonly sourceDomain: string;
    readonly targetDomain: string;
    readonly zeroShotAccuracy: number;
    readonly oneShotAccuracy: number;
    readonly threeShotAccuracy: number;
    readonly fiveShotAccuracy: number;
    readonly transferEfficiency: number; // delta / shots
  };
  readonly shiftDegradationCurve: {
    readonly inDistributionAccuracy: number;
    readonly mildShiftAccuracy: number;
    readonly severeShiftAccuracy: number;
    readonly oodRejectionRate: number; // 1.0 = 100%
  };
  readonly epistemicUnknownRecall: number; // 1.0 = 100%
  readonly groundednessScore: number; // 0.0 to 1.0
  readonly unsupportedClaimRate: number; // target <= 0.02
  readonly capacityComparison: readonly CapacityGeneralizationPoint[];
  readonly curriculumImpact: {
    readonly preCurriculumGenScore: number;
    readonly postCurriculumGenScore: number;
    readonly curriculumDelta: number;
  };
  readonly documentedFailures: readonly DocumentedFailureCase[];
  readonly overallGeneralizationScore: number; // 0 to 100
  readonly provenanceDigest: string;
  readonly canActuate: false;
  readonly actuationState: 'PERMANENTLY_BLOCKED';
}

export interface LanguageGeneralizationConfig {
  readonly tenantId?: string;
  readonly seed?: number;
  readonly epochs?: number;
  readonly learningRate?: number;
  readonly evaluateAllTiers?: boolean;
}

export class LanguageGeneralizationError extends Error {
  constructor(message: string) {
    super(`[LANGUAGE_GENERALIZATION_ERROR] ${message}`);
    this.name = 'LanguageGeneralizationError';
  }
}

export class DataContaminationError extends LanguageGeneralizationError {
  constructor(sampleId: string, partition: string) {
    super(`Data contamination detected: Sample ${sampleId} in partition ${partition} overlaps with training data.`);
    this.name = 'DataContaminationError';
  }
}

export class UnsupportedExtrapolationError extends LanguageGeneralizationError {
  constructor(claim: string) {
    super(`Model generated unsupported extrapolation without canonical memory grounding: '${claim}'.`);
    this.name = 'UnsupportedExtrapolationError';
  }
}
