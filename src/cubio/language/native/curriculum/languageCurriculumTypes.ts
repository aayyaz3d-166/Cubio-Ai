/**
 * CUBiO AI — Phase 6: Task 78
 * Native Language Training & Curriculum
 * src/cubio/language/native/curriculum/languageCurriculumTypes.ts
 *
 * Universal type contracts, curriculum stages, split definitions,
 * reference-based sample specifications, and structured errors for native language training.
 */

import { CanonicalDomain } from '../../../core/canonicalIdentity';
import { EpistemicStatus } from '../../native/languageTypes';

export enum LanguageCurriculumStage {
  STAGE_1_SYMBOLS_AND_VOCABULARY = 'STAGE_1_SYMBOLS_AND_VOCABULARY',
  STAGE_2_SYNTAX_AND_GRAMMAR = 'STAGE_2_SYNTAX_AND_GRAMMAR',
  STAGE_3_ORDERED_SEQUENCES = 'STAGE_3_ORDERED_SEQUENCES',
  STAGE_4_SEMANTICS_AND_PROPOSITIONS = 'STAGE_4_SEMANTICS_AND_PROPOSITIONS',
  STAGE_5_REASONING_GROUNDED_GENERATION = 'STAGE_5_REASONING_GROUNDED_GENERATION',
}

export const ORDERED_LANGUAGE_CURRICULUM_STAGES: readonly LanguageCurriculumStage[] = Object.freeze([
  LanguageCurriculumStage.STAGE_1_SYMBOLS_AND_VOCABULARY,
  LanguageCurriculumStage.STAGE_2_SYNTAX_AND_GRAMMAR,
  LanguageCurriculumStage.STAGE_3_ORDERED_SEQUENCES,
  LanguageCurriculumStage.STAGE_4_SEMANTICS_AND_PROPOSITIONS,
  LanguageCurriculumStage.STAGE_5_REASONING_GROUNDED_GENERATION,
]);

export enum LanguageDatasetSplit {
  TRAIN = 'TRAIN',
  VALIDATION = 'VALIDATION',
  TEST = 'TEST',
}

export interface LanguageCurriculumSample {
  readonly sampleId: string;
  readonly text: string;
  readonly tokenIds: readonly number[];
  readonly stage: LanguageCurriculumStage;
  readonly split: LanguageDatasetSplit;
  readonly epistemicStatus: EpistemicStatus;
  readonly domain: CanonicalDomain;
  readonly provenanceId: string;
  readonly referenceObjectIds: readonly string[];
  readonly contentHash: string;
  readonly timestamp: number;
}

export interface LanguageCurriculumStageConfig {
  readonly stage: LanguageCurriculumStage;
  readonly name: string;
  readonly description: string;
  readonly targetLoss: number;
  readonly targetAccuracy: number;
  readonly allowedEpistemic: readonly EpistemicStatus[];
  readonly batchSize: number;
  readonly learningRate: number;
  readonly epochs: number;
}

export interface StageTrainingProgress {
  readonly stage: LanguageCurriculumStage;
  readonly epochLosses: readonly number[];
  readonly initialLoss: number;
  readonly finalLoss: number;
  readonly valLoss: number;
  readonly valPerplexity: number;
  readonly valAccuracy: number;
  readonly generalizationScore: number;
  readonly unseenAccuracy: number;
  readonly checkpointChecksum: string;
  readonly passed: boolean;
}

export interface CurriculumExecutionReport {
  readonly modelId: string;
  readonly tenantId: string;
  readonly stagesCompleted: number;
  readonly stageProgress: readonly StageTrainingProgress[];
  readonly initialLoss: number;
  readonly finalLoss: number;
  readonly finalPerplexity: number;
  readonly finalAccuracy: number;
  readonly finalGeneralization: number;
  readonly totalEpochs: number;
  readonly durationMs: number;
  readonly passed: boolean;
}

export const STAGE_CURRICULUM_CONFIGS: Readonly<Record<LanguageCurriculumStage, LanguageCurriculumStageConfig>> = {
  [LanguageCurriculumStage.STAGE_1_SYMBOLS_AND_VOCABULARY]: Object.freeze({
    stage: LanguageCurriculumStage.STAGE_1_SYMBOLS_AND_VOCABULARY,
    name: 'Symbols, Tokens & Vocabulary Grounding',
    description: 'Elementary symbols, subwords, special tokens, byte fallbacks, and spatial lattice grounding.',
    targetLoss: 5.2,
    targetAccuracy: 0.15,
    allowedEpistemic: Object.freeze(['CANONICAL_FACT'] as EpistemicStatus[]),
    batchSize: 8,
    learningRate: 0.05,
    epochs: 2,
  }),
  [LanguageCurriculumStage.STAGE_2_SYNTAX_AND_GRAMMAR]: Object.freeze({
    stage: LanguageCurriculumStage.STAGE_2_SYNTAX_AND_GRAMMAR,
    name: 'Syntax, Punctuation & Structural Grammar',
    description: 'Sentence structures, punctuation, whitespace preservation, clause composition, and grammar patterns.',
    targetLoss: 4.8,
    targetAccuracy: 0.20,
    allowedEpistemic: Object.freeze(['CANONICAL_FACT'] as EpistemicStatus[]),
    batchSize: 8,
    learningRate: 0.04,
    epochs: 2,
  }),
  [LanguageCurriculumStage.STAGE_3_ORDERED_SEQUENCES]: Object.freeze({
    stage: LanguageCurriculumStage.STAGE_3_ORDERED_SEQUENCES,
    name: 'Ordered Sequences & Contextual Continuity',
    description: 'Multi-sentence transitions, context window retention, out-of-window referrals, and narrative coherence.',
    targetLoss: 4.4,
    targetAccuracy: 0.25,
    allowedEpistemic: Object.freeze(['CANONICAL_FACT', 'EMPIRICAL_EVIDENCE'] as EpistemicStatus[]),
    batchSize: 8,
    learningRate: 0.03,
    epochs: 2,
  }),
  [LanguageCurriculumStage.STAGE_4_SEMANTICS_AND_PROPOSITIONS]: Object.freeze({
    stage: LanguageCurriculumStage.STAGE_4_SEMANTICS_AND_PROPOSITIONS,
    name: 'Semantic Truth, Triples & Propositional Facts',
    description: 'Subject-predicate-object triples, domain factual assertions, and strict epistemic truth gating.',
    targetLoss: 4.0,
    targetAccuracy: 0.30,
    allowedEpistemic: Object.freeze(['CANONICAL_FACT', 'EMPIRICAL_EVIDENCE', 'SUPPORTED_HYPOTHESIS'] as EpistemicStatus[]),
    batchSize: 8,
    learningRate: 0.03,
    epochs: 2,
  }),
  [LanguageCurriculumStage.STAGE_5_REASONING_GROUNDED_GENERATION]: Object.freeze({
    stage: LanguageCurriculumStage.STAGE_5_REASONING_GROUNDED_GENERATION,
    name: 'Reasoning-Grounded Generation & Epistemic Deduction',
    description: 'Multi-hop logical deductions, syllogisms, contradiction refutation, hypothesis revision, and UNKNOWN states.',
    targetLoss: 3.6,
    targetAccuracy: 0.35,
    allowedEpistemic: Object.freeze([
      'CANONICAL_FACT',
      'EMPIRICAL_EVIDENCE',
      'SUPPORTED_HYPOTHESIS',
      'EPISTEMIC_UNKNOWN',
    ] as EpistemicStatus[]),
    batchSize: 8,
    learningRate: 0.02,
    epochs: 2,
  }),
};

export const DEFAULT_CURRICULUM_BUDGET = Object.freeze({
  maxBatchSize: 32,
  maxSequenceTokens: 512,
  maxStages: 8,
  minAccuracyThreshold: 0.15,
  maxPerplexityThreshold: 200.0,
});

// =============================================================================
// STRUCTURED ERRORS
// =============================================================================

export class LanguageCurriculumError extends Error {
  public readonly code: string;
  public readonly timestamp: number;

  constructor(message: string, code = 'LANGUAGE_CURRICULUM_ERROR') {
    super(`[${code}] ${message}`);
    this.name = 'LanguageCurriculumError';
    this.code = code;
    this.timestamp = Date.now();
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class LanguageSplitLeakageError extends LanguageCurriculumError {
  constructor(message: string) {
    super(message, 'LANGUAGE_SPLIT_LEAKAGE_DETECTED');
    this.name = 'LanguageSplitLeakageError';
  }
}

export class EpistemicTrainingViolationError extends LanguageCurriculumError {
  constructor(message: string) {
    super(message, 'EPISTEMIC_TRAINING_VIOLATION');
    this.name = 'EpistemicTrainingViolationError';
  }
}

export class CurriculumStageProgressionError extends LanguageCurriculumError {
  constructor(message: string) {
    super(message, 'CURRICULUM_STAGE_PROGRESSION_ERROR');
    this.name = 'CurriculumStageProgressionError';
  }
}

export class LanguageCurriculumBudgetExceededError extends LanguageCurriculumError {
  constructor(message: string) {
    super(message, 'LANGUAGE_CURRICULUM_BUDGET_EXCEEDED');
    this.name = 'LanguageCurriculumBudgetExceededError';
  }
}
