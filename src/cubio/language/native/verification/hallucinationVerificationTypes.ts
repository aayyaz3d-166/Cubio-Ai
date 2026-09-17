/**
 * CUBiO AI — Phase 6: Task 85
 * Hallucination Detection & Self-Verification Layer
 * src/cubio/language/native/verification/hallucinationVerificationTypes.ts
 *
 * Universal type contracts, configurations, domain errors, and interfaces
 * for sovereign native hallucination detection, factual claim extraction,
 * canonical memory tracing, contradiction refutation, and epistemic verification.
 * Guarantees zero foreign API dependencies, mathematical separation of Shannon
 * entropy from heuristic scores, and permanent hardware actuation lock.
 */

import { DEFAULT_TENANT_ID } from '../../../core/canonicalIdentity';
import { EpistemicStatus } from '../../../epistemic/native/epistemicTypes';
import { ClaimProvenance } from '../generation/generationTypes';

// =============================================================================
// STRUCTURED DOMAIN ERRORS
// =============================================================================

export class HallucinationVerificationError extends Error {
  public readonly code: string;
  public readonly timestamp: number;

  constructor(message: string, code = 'HALLUCINATION_VERIFICATION_ERROR') {
    super(message);
    this.name = 'HallucinationVerificationError';
    this.code = code;
    this.timestamp = Date.now();
  }
}

export class UnsupportedFactError extends HallucinationVerificationError {
  constructor(message: string) {
    super(message, 'UNSUPPORTED_FACT_PROHIBITED');
    this.name = 'UnsupportedFactError';
  }
}

export class CanonicalContradictionError extends HallucinationVerificationError {
  constructor(message: string) {
    super(message, 'CANONICAL_CONTRADICTION_DETECTED');
    this.name = 'CanonicalContradictionError';
  }
}

import { ActuationBlockedError } from '../languageTypes';
export { ActuationBlockedError };

// =============================================================================
// CLAIM & VERIFICATION STATUS CONTRACTS
// =============================================================================

export type ClaimVerificationStatus =
  | 'VERIFIED'
  | 'UNSUPPORTED'
  | 'CONTRADICTED'
  | 'DOWNGRADED'
  | 'UNKNOWN';

export interface ExtractedClaim {
  readonly claimId: string;
  readonly statement: string;
  readonly subject: string;
  readonly predicate: string;
  readonly object: string | number | boolean;
  readonly isNegated: boolean;
  readonly claimedEpistemicStatus: EpistemicStatus;
  readonly claimedConfidence: number;
  readonly spatialCellId?: number;
  readonly charSpan: { readonly start: number; readonly end: number };
}

export interface VerifiedClaimRecord {
  readonly claim: ExtractedClaim;
  readonly status: ClaimVerificationStatus;
  readonly epistemicStatusBefore: EpistemicStatus;
  readonly epistemicStatusAfter: EpistemicStatus;
  readonly confidenceBefore: number;
  readonly confidenceAfter: number;
  readonly verifiedStatement: string;
  readonly provenance?: ClaimProvenance;
  readonly evidenceTrace: string;
  readonly matchedCanonicalMemoryId?: string;
  readonly matchedCellId?: number;
  readonly contradictionReason?: string;
}

// =============================================================================
// AUDIT TRAIL & METRICS CONTRACTS
// =============================================================================

export interface VerificationMetrics {
  /** Hallucination rate of raw candidate response before verification (0.0 - 1.0) */
  readonly hallucinationRateBefore: number;
  /** Hallucination rate of verified emitted response (guaranteed 0.0) */
  readonly hallucinationRateAfter: number;
  /** Factual grounding ratio (verified claims / total claims) */
  readonly factualGroundingScore: number;
  /** True Positives (correctly verified supported facts) */
  readonly truePositives: number;
  /** False Positives (incorrectly rejected supported facts) */
  readonly falsePositives: number;
  /** True Negatives (correctly rejected/downgraded unsupported/contradictory claims) */
  readonly trueNegatives: number;
  /** False Negatives (unsupported or contradictory claims erroneously verified) */
  readonly falseNegatives: number;
  /** Precision: TP / (TP + FP) */
  readonly precision: number;
  /** Recall: TP / (TP + FN) */
  readonly recall: number;
  /** False Positive Rate: FP / (FP + TN) */
  readonly falsePositiveRate: number;
  /** False Negative Rate: FN / (TP + FN) */
  readonly falseNegativeRate: number;
  /** Specificity: TN / (TN + FP) */
  readonly specificity: number;
  /** F1 Score */
  readonly f1Score: number;
  /** Classification Accuracy */
  readonly accuracy: number;
}

export interface ShannonEntropyMetrics {
  /** Mathematical Shannon Entropy H(P) = -sum(p_i * log2(p_i)) over outcome distribution */
  readonly statusDistributionEntropy: number;
  /** Distribution elements: probabilities of [VERIFIED, UNSUPPORTED, CONTRADICTED, DOWNGRADED, UNKNOWN] */
  readonly probabilityDistribution: readonly number[];
  /** Is distribution mathematically valid (sum == 1.0, non-negative, finite) */
  readonly isMathematicallyValid: boolean;
  /** Explicit guarantee that heuristic grounding metrics are NOT conflated with Shannon entropy */
  readonly mathematicalSeparationEnforced: true;
}

export interface VerificationAuditTrail {
  readonly verificationId: string;
  readonly timestamp: number;
  readonly tenantId: string;
  readonly candidateResponseText: string;
  readonly verifiedResponseText: string;
  readonly isSafeForEmission: boolean;
  readonly totalClaims: number;
  readonly verifiedCount: number;
  readonly unsupportedCount: number;
  readonly contradictedCount: number;
  readonly downgradedCount: number;
  readonly unknownCount: number;
  readonly verifiedClaims: readonly VerifiedClaimRecord[];
  readonly metrics: VerificationMetrics;
  readonly entropySummary: ShannonEntropyMetrics;
  readonly actuationSafe: boolean;
  readonly durationMs: number;
  readonly auditChecksum: string;
}

// =============================================================================
// VERIFICATION ENGINE CONFIGURATION
// =============================================================================

export interface SelfVerificationConfig {
  /** Enforce that any claim asserting CANONICAL_FACT must have verifiable proof */
  readonly requireProofForFacts: boolean;
  /** Automatically downgrade plausible but unproven claims to SUPPORTED_HYPOTHESIS */
  readonly allowHypothesisDowngrade: boolean;
  /** Replace completely ungrounded claims with EPISTEMIC_UNKNOWN */
  readonly emitUnknownForMissingEvidence: boolean;
  /** Refute and excise contradicted claims immediately */
  readonly refuteContradictions: boolean;
  /** Prefix output with standardized epistemic tags [CANONICAL_FACT], [UNKNOWN], etc. */
  readonly epistemicLabeling: boolean;
  /** Strict tenant isolation check */
  readonly strictTenantIsolation: boolean;
  /** Computation time budget in milliseconds */
  readonly budgetMs: number;
  /** Deterministic pseudo-random seed */
  readonly seed: number;
}

export const DEFAULT_SELF_VERIFICATION_CONFIG: SelfVerificationConfig = Object.freeze({
  requireProofForFacts: true,
  allowHypothesisDowngrade: true,
  emitUnknownForMissingEvidence: true,
  refuteContradictions: true,
  epistemicLabeling: true,
  strictTenantIsolation: true,
  budgetMs: 2500,
  seed: 369,
});

// =============================================================================
// ADVERSARIAL BENCHMARK CONTRACTS
// =============================================================================

export type AdversarialProbeCategory =
  | 'FICTITIOUS_ENTITY'
  | 'CORRUPTED_SPATIAL_CELL'
  | 'COUNTERFACTUAL_CONTRADICTION'
  | 'FABRICATED_CITATION'
  | 'SYLLOGISTIC_FALLACY'
  | 'CROSS_TENANT_LEAK'
  | 'HARDWARE_ACTUATION_INDUCEMENT';

export interface AdversarialHallucinationProbe {
  readonly probeId: string;
  readonly category: AdversarialProbeCategory;
  readonly prompt: string;
  readonly candidateResponse: string;
  readonly expectedDetection: 'UNSUPPORTED' | 'CONTRADICTED' | 'REFUSAL' | 'UNKNOWN';
  readonly expectedPrimaryStatus: ClaimVerificationStatus;
  readonly description: string;
}
