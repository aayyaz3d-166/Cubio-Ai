/**
 * CUBiO AI — Funnel 42: Native Epistemic Reasoning Layer
 * Phase 3 — Information Intelligence
 * src/cubio/epistemic/native/epistemicTypes.ts
 *
 * Universal type contracts for native epistemic reasoning.
 * Strictly separates FACT, EVIDENCE, ASSUMPTION, HYPOTHESIS, and UNKNOWN states.
 * Enforces discrete epistemic status orthogonal to continuous bounded confidence in [0, 1].
 * Defines immutable, cryptographically-chained transition records and distribution validation contracts.
 */

import type { CanonicalDomain } from '../../core/canonicalIdentity';

/** Primary categorical epistemic classification */
export type EpistemicType =
  | 'FACT'
  | 'EVIDENCE'
  | 'ASSUMPTION'
  | 'HYPOTHESIS'
  | 'UNKNOWN';

/** Formal discrete epistemic status */
export type EpistemicStatus =
  | 'CANONICAL_FACT'         // Verified ground-truth observation or mathematical axiom (confidence = 1.0)
  | 'EMPIRICAL_EVIDENCE'      // Concrete empirical observation with polarity and bounded strength
  | 'PROVISIONAL_ASSUMPTION'  // Working premise adopted for exploration (confidence strictly capped <= 0.50)
  | 'SUPPORTED_HYPOTHESIS'    // Testable proposition supported by predominant empirical evidence (confidence <= 0.98)
  | 'WEAKENED_HYPOTHESIS'     // Proposition challenged by emergent contradictory evidence
  | 'REJECTED_HYPOTHESIS'     // Proposition decisively refuted by contradictory evidence
  | 'EPISTEMIC_UNKNOWN';      // Absence of empirical evidence or indeterminate status (confidence = 0.0)

/** Directional polarity of evidence */
export type EvidencePolarity = 'SUPPORTING' | 'CONTRADICTING' | 'NEUTRAL';

/**
 * Epistemic Fact: Absolute canonical ground-truth or mathematical invariant.
 * Epistemic status: CANONICAL_FACT. Confidence is strictly 1.0.
 */
export interface EpistemicFact {
  readonly mathType: 'EPISTEMIC_FACT';
  readonly id: string;
  readonly tenantId: string;
  readonly domain: CanonicalDomain;
  readonly statement: string;
  readonly subject: string;
  readonly predicate: string;
  readonly value: unknown;
  readonly epistemicType: 'FACT';
  readonly epistemicStatus: 'CANONICAL_FACT';
  readonly confidence: 1.0;
  readonly provenanceId: string;
  readonly timestamp: number;
  readonly checksum: string;
}

/**
 * Epistemic Evidence Item: An empirical observation contextualized with polarity and strength.
 * Epistemic status: EMPIRICAL_EVIDENCE.
 */
export interface EpistemicEvidenceItem {
  readonly mathType: 'EPISTEMIC_EVIDENCE';
  readonly id: string;
  readonly tenantId: string;
  readonly domain: CanonicalDomain;
  readonly observationId: string;
  readonly subject: string;
  readonly predicate: string;
  readonly observedValue: unknown;
  readonly polarity: EvidencePolarity;
  readonly strength: number; // Strictly bounded [0.0, 1.0]
  readonly epistemicType: 'EVIDENCE';
  readonly epistemicStatus: 'EMPIRICAL_EVIDENCE';
  readonly confidence: number; // Strictly bounded [0.0, 1.0]
  readonly justification: string;
  readonly timestamp: number;
  readonly checksum: string;
}

/**
 * Epistemic Assumption: A working premise adopted for branching/exploratory reasoning.
 * Epistemic status: PROVISIONAL_ASSUMPTION.
 * HARD RULE: Confidence is strictly capped (default <= 0.50), and never promotes to FACT.
 */
export interface EpistemicAssumption {
  readonly mathType: 'EPISTEMIC_ASSUMPTION';
  readonly id: string;
  readonly tenantId: string;
  readonly domain: CanonicalDomain;
  readonly statement: string;
  readonly subject: string;
  readonly predicate: string;
  readonly assumedValue: unknown;
  readonly isAssumption: true;
  readonly epistemicType: 'ASSUMPTION';
  readonly epistemicStatus: 'PROVISIONAL_ASSUMPTION';
  readonly confidence: number; // Strictly bounded [0.0, 0.50]
  readonly rationale: string;
  readonly timestamp: number;
  readonly checksum: string;
}

/**
 * Immutable cryptographic audit record of an epistemic transition.
 */
export interface EpistemicTransitionRecord {
  readonly transitionId: string;
  readonly propositionId: string;
  readonly version: number;
  readonly fromStatus: EpistemicStatus;
  readonly toStatus: EpistemicStatus;
  readonly fromConfidence: number;
  readonly toConfidence: number;
  readonly deltaEvidenceId?: string;
  readonly reason: string;
  readonly parentRecordChecksum?: string;
  readonly checksum: string;
  readonly timestamp: number;
}

/**
 * Epistemic Hypothesis: Testable candidate claim evaluated against evidence bindings.
 * Epistemic status: SUPPORTED_HYPOTHESIS | WEAKENED_HYPOTHESIS | REJECTED_HYPOTHESIS | EPISTEMIC_UNKNOWN.
 * HARD RULE: Empirical confidence is capped at <= 0.98.
 */
export interface EpistemicHypothesis {
  readonly mathType: 'EPISTEMIC_HYPOTHESIS';
  readonly id: string;
  readonly tenantId: string;
  readonly domain: CanonicalDomain;
  readonly statement: string;
  readonly subject: string;
  readonly predicate: string;
  readonly expectedValue: unknown;
  readonly epistemicType: 'HYPOTHESIS';
  readonly epistemicStatus:
    | 'SUPPORTED_HYPOTHESIS'
    | 'WEAKENED_HYPOTHESIS'
    | 'REJECTED_HYPOTHESIS'
    | 'EPISTEMIC_UNKNOWN';
  readonly confidence: number; // Strictly bounded [0.0, 0.98]
  readonly supportingWeight: number;
  readonly contradictingWeight: number;
  readonly supportingEvidenceIds: readonly string[];
  readonly contradictingEvidenceIds: readonly string[];
  readonly version: number;
  readonly history: readonly EpistemicTransitionRecord[];
  readonly timestamp: number;
  readonly checksum: string;
}

/**
 * Epistemic Unknown: An explicit first-class entity for missing or indeterminate knowledge.
 * Epistemic status: EPISTEMIC_UNKNOWN. Confidence is strictly 0.0.
 */
export interface EpistemicUnknown {
  readonly mathType: 'EPISTEMIC_UNKNOWN';
  readonly id: string;
  readonly tenantId: string;
  readonly domain: CanonicalDomain;
  readonly queryOrStatement: string;
  readonly subject: string;
  readonly predicate: string;
  readonly epistemicType: 'UNKNOWN';
  readonly epistemicStatus: 'EPISTEMIC_UNKNOWN';
  readonly confidence: 0.0;
  readonly reasonForUnknown: string;
  readonly timestamp: number;
  readonly checksum: string;
}

/** Discriminated union of all native epistemic entities */
export type EpistemicProposition =
  | EpistemicFact
  | EpistemicEvidenceItem
  | EpistemicAssumption
  | EpistemicHypothesis
  | EpistemicUnknown;

/** Validation report for a mathematical probability distribution */
export interface ProbabilityDistributionValidation {
  readonly isValid: boolean;
  readonly sum: number;
  readonly elementCount: number;
  readonly error?: string;
}

/** Configuration parameters for epistemic evaluation and confidence scoring */
export interface EpistemicEvaluationConfig {
  readonly supportThreshold?: number;           // Supporting weight required for SUPPORTED_HYPOTHESIS (default: 1.5)
  readonly weakenThreshold?: number;            // Contradicting weight required for WEAKENED_HYPOTHESIS (default: 0.8)
  readonly rejectThreshold?: number;            // Contradicting weight required for REJECTED_HYPOTHESIS (default: 2.0)
  readonly dampingConstant?: number;            // Epistemic damping constant lambda (default: 1.0)
  readonly assumptionConfidenceCeiling?: number;// Upper bound on assumption confidence (default: 0.50)
  readonly hypothesisConfidenceCeiling?: number;// Upper bound on empirical hypothesis confidence (default: 0.98)
  readonly defaultTenantId?: string;            // Default tenant ID (default: 'tenant_main')
}
