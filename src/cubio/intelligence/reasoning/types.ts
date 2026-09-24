/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F10: CubiO Intelligence Reasoning Engine (Types & Contracts)
 *
 * Master specification for multi-step deductive, inductive, abductive,
 * and 369 harmonic reasoning combining States, Patterns, and Memory.
 */

import { CubiODimension } from '../../types';
import { CubiOState } from '../../state/types';
import { DetectedPatternEntry } from '../pattern/types';
import { AssociativeMemoryNode } from '../memory/types';

export type ReasoningMode =
  | 'DEDUCTIVE'
  | 'INDUCTIVE'
  | 'ABDUCTIVE'
  | 'HARMONIC_369'
  | 'HYBRID_SPATIAL';

export type InferenceValidationStatus =
  | 'VALID'
  | 'CONTRADICTED'
  | 'PLAUSIBLE';

export interface InferenceStep {
  readonly stepIndex: number;
  readonly mode: ReasoningMode;
  readonly claim: string;
  readonly premises: readonly string[];
  readonly evidenceAnchors: readonly string[]; // State IDs, Pattern IDs, Memory IDs
  readonly dimension: CubiODimension;
  readonly confidence: number; // 0.0 .. 1.0
  readonly resonanceScore: number; // 0 .. 100
  readonly validationStatus: InferenceValidationStatus;
  readonly stepChecksum: string;
}

export interface ReasoningProofReport {
  readonly proofId: string;
  readonly goal: string;
  readonly mode: ReasoningMode;
  readonly steps: readonly InferenceStep[];
  readonly synthesizedConclusion: string;
  readonly isValidProof: boolean;
  readonly overallConfidence: number;
  readonly overallResonanceScore: number;
  readonly usedStateIds: readonly string[];
  readonly usedPatternIds: readonly string[];
  readonly usedMemoryIds: readonly string[];
  readonly proofDurationMs: number;
  readonly proofChecksum: string;
  readonly timestamp: number;
}

export interface ReasoningRequest {
  readonly goal: string;
  readonly mode?: ReasoningMode;
  readonly activeDimension?: CubiODimension;
  readonly states?: readonly CubiOState[];
  readonly patterns?: readonly DetectedPatternEntry[];
  readonly memories?: readonly AssociativeMemoryNode[];
  readonly contextEnvelopeId?: string;
}

export type StructuredReasoningDomain =
  | 'DECOMPOSITION'
  | 'STEP_BY_STEP_MATH'
  | 'COMPARISON'
  | 'TROUBLESHOOTING'
  | 'DEDUCTION'
  | 'CONTRADICTION_DETECTION'
  | 'CAUSAL_RELATIONAL_REASONING'
  | 'SYMBOLIC_MATHEMATICAL'
  | 'TECHNICAL_PROBLEM_SOLVING'
  | 'SELF_CORRECTION_VERIFICATION';

export interface StructuredReasoningRequest {
  readonly goal: string;
  readonly domain: StructuredReasoningDomain;
  readonly premises?: readonly string[];
  readonly constraints?: Readonly<Record<string, string>>;
  readonly parameters?: Readonly<Record<string, any>>;
  readonly language?: 'ROMAN_URDU' | 'ENGLISH' | 'MULTILINGUAL';
}

export interface StructuredReasoningResult {
  readonly reasoningId: string;
  readonly domain: StructuredReasoningDomain;
  readonly proof: ReasoningProofReport;
  readonly structuredAnswer: string;
  readonly keyTakeaways: readonly string[];
  readonly confidence: number;
}
