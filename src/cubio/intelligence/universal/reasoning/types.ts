/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F48: Advanced Reasoning Engine Types & Contracts
 *
 * Formal contracts for the 7-stage reasoning pipeline:
 * Question -> Understand -> Decompose -> Plan -> Reason -> Verify -> Synthesize
 *
 * Across 6 specialized domains:
 * 1. Mathematical Reasoning
 * 2. Logical Reasoning
 * 3. Technical Reasoning
 * 4. Comparative Reasoning
 * 5. Hypothesis Generation
 * 6. Formal Verification
 */

import { CubiODimension } from '../../../types';

export type ReasoningDomain =
  | 'MATHEMATICAL'
  | 'LOGICAL'
  | 'TECHNICAL'
  | 'COMPARATIVE'
  | 'HYPOTHESIS_GENERATION'
  | 'FORMAL_VERIFICATION';

export type ReasoningStage =
  | 'UNDERSTAND'
  | 'DECOMPOSE'
  | 'PLAN'
  | 'REASON'
  | 'VERIFY'
  | 'SYNTHESIZE';

// ─── STAGE 1: UNDERSTANDING ────────────────────────────────────────────────

export interface ProblemUnderstanding {
  readonly rawQuestion: string;
  readonly primaryDomain: ReasoningDomain;
  readonly secondaryDomains: readonly ReasoningDomain[];
  readonly coreEntities: readonly string[];
  readonly explicitConstraints: readonly string[];
  readonly implicitAssumptions: readonly string[];
  readonly targetDimension: CubiODimension;
}

// ─── STAGE 2: DECOMPOSITION ────────────────────────────────────────────────

export interface SubQuestionNode {
  readonly subId: string;
  readonly question: string;
  readonly domain: ReasoningDomain;
  readonly dependencies: readonly string[];
  readonly estimatedDepth: number;
}

export interface ReasoningProblemDecomposition {
  readonly subQuestions: readonly SubQuestionNode[];
  readonly dependencyDAG: Readonly<Record<string, readonly string[]>>;
  readonly isAtomic: boolean;
}

// ─── STAGE 3: PLANNING ─────────────────────────────────────────────────────

export interface ReasoningPlanStep {
  readonly stepIndex: number;
  readonly subId: string;
  readonly solverStrategy: string;
  readonly expectedOutputType: string;
}

export interface ReasoningPlan {
  readonly planId: string;
  readonly strategy: 'DIRECT_DEDUCTIVE' | 'DIVIDE_AND_CONQUER' | 'DIALECTICAL' | 'EMPIRICAL_CONJECTURE';
  readonly steps: readonly ReasoningPlanStep[];
  readonly estimatedComplexity: string;
}

// ─── STAGE 4: REASONING ────────────────────────────────────────────────────

export interface ReasoningProofStep {
  readonly stepIndex: number;
  readonly premise: string;
  readonly inferenceRule: string;
  readonly conclusion: string;
  readonly confidence: number;
  readonly intermediateArtifacts?: Readonly<Record<string, unknown>>;
}

export interface DomainReasoningResult {
  readonly domain: ReasoningDomain;
  readonly proofSteps: readonly ReasoningProofStep[];
  readonly domainSynthesis: string;
  readonly confidence: number;
}

// ─── STAGE 5: VERIFICATION ─────────────────────────────────────────────────

export interface InvariantCheckResult {
  readonly invariantName: string;
  readonly passed: boolean;
  readonly reason: string;
  readonly mathematicalTolerance: number;
}

export interface VerificationReport {
  readonly isValid: boolean;
  readonly contradictionDetected: boolean;
  readonly invariantChecks: readonly InvariantCheckResult[];
  readonly boundaryConditionsSatisfied: boolean;
  readonly verificationScore: number; // 0.0 to 1.0
  readonly verificationChecksum: string;
}

// ─── STAGE 6: SYNTHESIS ────────────────────────────────────────────────────

export interface AdvancedReasoningReport {
  readonly reportId: string;
  readonly originalQuestion: string;
  readonly primaryDomain: ReasoningDomain;
  readonly understanding: ProblemUnderstanding;
  readonly decomposition: ReasoningProblemDecomposition;
  readonly plan: ReasoningPlan;
  readonly domainResults: readonly DomainReasoningResult[];
  readonly verification: VerificationReport;
  readonly finalSynthesizedConclusion: string;
  readonly formalProofQED: string;
  readonly overallConfidence: number;
  readonly executionTimeMs: number;
  readonly masterChecksum: string;
  readonly timestamp: number;
}

// ─── MASTER INTERFACE ──────────────────────────────────────────────────────

export interface AdvancedReasoningRequest {
  readonly question: string;
  readonly domainHint?: ReasoningDomain;
  readonly targetDimension?: CubiODimension;
  readonly context?: string;
  readonly strictVerification?: boolean;
}

export interface IAdvancedReasoningEngine {
  reasonQuestion(request: AdvancedReasoningRequest): Promise<Readonly<AdvancedReasoningReport>>;
}
