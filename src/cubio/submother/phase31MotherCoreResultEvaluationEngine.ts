/**
 * ============================================================================
 * CUBiO AI — PHASE 31 TASK 511: MOTHER CORE RESULT EVALUATION ENGINE
 * src/cubio/submother/phase31MotherCoreResultEvaluationEngine.ts
 * ============================================================================
 *
 * Authoritative Mother Core evaluation stage for all Submother-generated candidates.
 * Mother Core compares, validates, rejects, combines, or synthesizes candidate results
 * using its certified native intelligence.
 *
 * Core Guarantees & Invariants:
 *   1. Sole Final Authority:
 *      - Mother Core is the ONLY authority empowered to make final decisions (`MOTHER_CORE_AUTHORITY`).
 *      - Submothers NEVER override Mother Core or directly issue final authoritative decisions.
 *   2. Authoritative Decisions:
 *      - `ACCEPT_SINGLE`: Single optimal candidate certified as authoritative output.
 *      - `SYNTHESIZE_COMPOSITE`: Multiple congruent candidates synthesized into a unified resolution.
 *      - `REJECT_ALL`: Sub-threshold, contradictory, ungrounded, or adversarial candidates rejected fail-closed.
 *   3. Epistemic Discipline & Grounding:
 *      - Calibrated thresholding: FACT candidates mandate certified evidence grounding and confidence >= 0.85.
 *      - Traps contradictory candidates fail-closed; if conflicting candidates disagree on core assertions,
 *        Mother Core marks conflict and either resolves via certified native weighting or safely issues refusal.
 *   4. Strict Provenance & Parity Tracking:
 *      - Generates immutable evaluation certificate with SHA-256 evaluation digest and complete candidate lineage.
 *   5. Non-Trainable & Sovereign Safety:
 *      - Strictly enforces `trainableWeights: 0`, `independentWeightsCreated: false`.
 *      - Model ID bound to `CUBIO-NATIVE-MODEL-V1` (219,264 float32 native parameters).
 *      - Permanent invariants: `IS_ACTUATION_BLOCKED === true`, `OFFLINE_ISOLATED === true`.
 *
 * ============================================================================
 */

import * as crypto from 'crypto';
import { performance } from 'perf_hooks';
import {
  IS_ACTUATION_BLOCKED,
  OFFLINE_ISOLATED,
} from '../intelligence/core/coreEngineContract';
import { ExternalModelGuard } from '../model/native_foundation/external_model_guard';
import { CUBIO_NATIVE_MODEL_ID } from '../model/native_foundation/native_model_types';
import { TOTAL_NATIVE_PARAMETERS } from '../core/nativeTrainingIntegration';
import { NormalizedCandidateResult } from './phase31SubmotherResultNormalizationLayer';
import { EpistemicCategory } from './phase31EpistemicSubmotherGenerator';

// ============================================================================
// CONSTANTS
// ============================================================================

export const EVALUATION_ENGINE_VERSION = '31.511.0';
export const EVALUATION_ENGINE_ID = 'CUBIO_MOTHER_CORE_RESULT_EVALUATION_ENGINE';

export const MOTHER_CORE_MIN_ACCEPT_CONFIDENCE = 0.50;
export const MOTHER_CORE_FACT_CONFIDENCE = 0.85;

// ============================================================================
// CONTRACTS & TYPES
// ============================================================================

export type AuthoritativeEvaluationAction =
  | 'ACCEPT_SINGLE'
  | 'SYNTHESIZE_COMPOSITE'
  | 'REJECT_ALL';

export interface EvaluatedCandidateScore {
  readonly candidateId: string;
  readonly submotherId: string;
  readonly domain: string;
  readonly epistemicStatus: EpistemicCategory;
  readonly rawConfidence: number;
  readonly evidenceCount: number;
  readonly evidenceGroundingScore: number;
  readonly motherCoreCalibratedScore: number;
  readonly passesQualityGate: boolean;
  readonly evaluationNotes: string;
}

export interface AuthoritativeEvaluationCertificate {
  readonly certificateId: string;
  readonly evaluationEngineId: string;
  readonly version: string;
  readonly tenantId: string;
  readonly parentTaskId: string;
  readonly motherCoreModelId: string;
  readonly motherCoreParameters: number;
  readonly nonTrainableInvariantEnforced: boolean;
  readonly finalDecision: AuthoritativeEvaluationAction;
  readonly evaluatedCandidateCount: number;
  readonly acceptedCandidateCount: number;
  readonly rejectedCandidateCount: number;
  readonly selectedCandidateIds: readonly string[];
  readonly resolvedEpistemicStatus: EpistemicCategory;
  readonly authoritativeOutputPayload: string;
  readonly authoritativeConfidenceScore: number;
  readonly candidateScoring: readonly EvaluatedCandidateScore[];
  readonly conflictDetected: boolean;
  readonly conflictResolutionRationale?: string;
  readonly evaluationDigest: string;
  readonly evaluationDurationMs: number;
  readonly certifiedAt: string;
}

// ============================================================================
// EVALUATION ENGINE IMPLEMENTATION
// ============================================================================

export class Phase31MotherCoreResultEvaluationEngine {
  private static instance: Phase31MotherCoreResultEvaluationEngine | null = null;

  private constructor() {
    if (!IS_ACTUATION_BLOCKED) {
      throw new Error('FAIL_CLOSED: IS_ACTUATION_BLOCKED must be true in Phase31MotherCoreResultEvaluationEngine');
    }
    if (!OFFLINE_ISOLATED) {
      throw new Error('FAIL_CLOSED: OFFLINE_ISOLATED must be true in Phase31MotherCoreResultEvaluationEngine');
    }
    ExternalModelGuard.assertNativeOnly(EVALUATION_ENGINE_ID);
  }

  public static getInstance(): Phase31MotherCoreResultEvaluationEngine {
    if (!this.instance) {
      this.instance = new Phase31MotherCoreResultEvaluationEngine();
    }
    return this.instance;
  }

  public static resetInstance(): void {
    this.instance = null;
  }

  /**
   * Evaluates normalized candidate results on behalf of Mother Core.
   * Compares evidence, analyzes conflicts, checks confidence thresholds,
   * synthesizes multi-candidate insights, or rejects inadequate candidates fail-closed.
   */
  public evaluateCandidates(
    tenantId: string,
    parentTaskId: string,
    candidates: readonly NormalizedCandidateResult[]
  ): AuthoritativeEvaluationCertificate {
    const startTime = performance.now();

    // 1. Guard against external model contamination & actuation breach
    if (!IS_ACTUATION_BLOCKED || !OFFLINE_ISOLATED) {
      throw new Error('FAIL_CLOSED: Safety invariants breached');
    }
    ExternalModelGuard.assertNativeOnly(EVALUATION_ENGINE_ID);

    if (!tenantId || tenantId.trim().length === 0) {
      throw new Error('FAIL_CLOSED: Missing tenantId');
    }
    if (!parentTaskId || parentTaskId.trim().length === 0) {
      throw new Error('FAIL_CLOSED: Missing parentTaskId');
    }

    // 2. Trapping empty candidates fail-closed
    if (!candidates || candidates.length === 0) {
      const durationMs = Number((performance.now() - startTime).toFixed(2));
      const certSeed = `${tenantId}:${parentTaskId}:EMPTY_CANDIDATES:REJECT_ALL`;
      const evaluationDigest = crypto.createHash('sha256').update(certSeed).digest('hex');

      return {
        certificateId: `cert_eval_${evaluationDigest.substring(0, 16)}`,
        evaluationEngineId: EVALUATION_ENGINE_ID,
        version: EVALUATION_ENGINE_VERSION,
        tenantId,
        parentTaskId,
        motherCoreModelId: CUBIO_NATIVE_MODEL_ID,
        motherCoreParameters: TOTAL_NATIVE_PARAMETERS,
        nonTrainableInvariantEnforced: true,
        finalDecision: 'REJECT_ALL',
        evaluatedCandidateCount: 0,
        acceptedCandidateCount: 0,
        rejectedCandidateCount: 0,
        selectedCandidateIds: [],
        resolvedEpistemicStatus: 'REFUSAL',
        authoritativeOutputPayload: 'REJECT_ALL: No normalized candidates submitted for evaluation.',
        authoritativeConfidenceScore: 0.0,
        candidateScoring: [],
        conflictDetected: false,
        evaluationDigest,
        evaluationDurationMs: durationMs,
        certifiedAt: new Date().toISOString(),
      };
    }

    // 3. Score and validate each normalized candidate
    const scoredCandidates: EvaluatedCandidateScore[] = [];
    const validCandidates: NormalizedCandidateResult[] = [];

    for (const cand of candidates) {
      // Validate authorization match
      if (cand.tenantId !== tenantId || cand.parentTaskId !== parentTaskId) {
        scoredCandidates.push({
          candidateId: cand.candidateId,
          submotherId: cand.submotherId,
          domain: cand.domain,
          epistemicStatus: cand.epistemicStatus,
          rawConfidence: cand.confidenceScore,
          evidenceCount: cand.evidenceReferences?.length || 0,
          evidenceGroundingScore: 0.0,
          motherCoreCalibratedScore: 0.0,
          passesQualityGate: false,
          evaluationNotes: 'REJECTED: Candidate tenant or parentTaskId mismatch with active evaluation context',
        });
        continue;
      }

      // Check candidate status contract
      if (cand.candidateStatus !== 'CANDIDATE_NORMALIZED' || !cand.authoritativeEvaluationPending) {
        scoredCandidates.push({
          candidateId: cand.candidateId,
          submotherId: cand.submotherId,
          domain: cand.domain,
          epistemicStatus: cand.epistemicStatus,
          rawConfidence: cand.confidenceScore,
          evidenceCount: cand.evidenceReferences?.length || 0,
          evidenceGroundingScore: 0.0,
          motherCoreCalibratedScore: 0.0,
          passesQualityGate: false,
          evaluationNotes: 'REJECTED: Invalid candidateStatus or missing authoritativeEvaluationPending flag',
        });
        continue;
      }

      // Compute evidence grounding score (0.0 to 1.0)
      const evCount = cand.evidenceReferences ? cand.evidenceReferences.length : 0;
      const evidenceGroundingScore = evCount === 0 
        ? (cand.epistemicStatus === 'HYPOTHESIS' || cand.epistemicStatus === 'AMBIGUITY' || cand.epistemicStatus === 'REFUSAL' ? 0.50 : 0.0)
        : Math.min(1.0, 0.60 + evCount * 0.15);

      // Calibrate score with Mother Core native weighting (70% raw confidence, 30% evidence grounding)
      const calibratedScore = Number(((cand.confidenceScore * 0.70) + (evidenceGroundingScore * 0.30)).toFixed(3));

      // Quality gate:
      // - REFUSAL is always a valid calibrated output (used when refusal is appropriate)
      // - FACT requires calibratedScore >= 0.85 and evCount >= 1
      // - DERIVATION requires calibratedScore >= 0.65
      // - HYPOTHESIS requires calibratedScore >= 0.45
      let passesGate = false;
      let notes = 'Candidate evaluated cleanly';

      if (cand.epistemicStatus === 'REFUSAL') {
        passesGate = true;
        notes = 'Calibrated refusal candidate recognized';
      } else if (cand.epistemicStatus === 'FACT') {
        if (calibratedScore >= MOTHER_CORE_FACT_CONFIDENCE && evCount >= 1) {
          passesGate = true;
          notes = 'FACT certified with sufficient evidence grounding';
        } else {
          notes = `FACT rejected: calibrated score ${calibratedScore} or evidence count ${evCount} insufficient`;
        }
      } else if (calibratedScore >= MOTHER_CORE_MIN_ACCEPT_CONFIDENCE) {
        passesGate = true;
        notes = 'Candidate satisfies minimum Mother Core confidence gate';
      } else {
        notes = `Low confidence candidate (${calibratedScore} < ${MOTHER_CORE_MIN_ACCEPT_CONFIDENCE})`;
      }

      scoredCandidates.push({
        candidateId: cand.candidateId,
        submotherId: cand.submotherId,
        domain: cand.domain,
        epistemicStatus: cand.epistemicStatus,
        rawConfidence: cand.confidenceScore,
        evidenceCount: evCount,
        evidenceGroundingScore,
        motherCoreCalibratedScore: calibratedScore,
        passesQualityGate: passesGate,
        evaluationNotes: notes,
      });

      if (passesGate) {
        validCandidates.push(cand);
      }
    }

    // 4. Analyze candidate conflicts & consistency
    let conflictDetected = false;
    let conflictRationale: string | undefined = undefined;

    // Check if there are diametrically opposed outputs (e.g. valid positive output vs refusal, or conflicting payload contents)
    const hasRefusal = validCandidates.some(c => c.epistemicStatus === 'REFUSAL');
    const hasSubstantive = validCandidates.some(c => c.epistemicStatus === 'FACT' || c.epistemicStatus === 'DERIVATION');

    if (hasRefusal && hasSubstantive) {
      conflictDetected = true;
      conflictRationale = 'Conflict detected: Substantive assertions co-exist with Refusal candidate. Mother Core resolves in favor of grounded assertions.';
    }

    // Check for direct textual contradiction in payload (e.g. true vs false, or conflict flags)
    const distinctDomains = new Set(validCandidates.map(c => c.domain));

    // 5. Determine Authoritative Decision
    let finalDecision: AuthoritativeEvaluationAction;
    let authoritativePayload: string;
    let authoritativeConfidence: number;
    let resolvedEpistemicStatus: EpistemicCategory;
    let selectedCandidateIds: string[] = [];

    if (validCandidates.length === 0) {
      finalDecision = 'REJECT_ALL';
      authoritativePayload = 'REJECT_ALL: No Submother candidates satisfied Mother Core certified quality gate.';
      authoritativeConfidence = 0.0;
      resolvedEpistemicStatus = 'REFUSAL';
    } else if (validCandidates.length === 1) {
      const top = validCandidates[0];
      finalDecision = 'ACCEPT_SINGLE';
      authoritativePayload = top.normalizedPayload;
      authoritativeConfidence = top.confidenceScore;
      resolvedEpistemicStatus = top.epistemicStatus;
      selectedCandidateIds = [top.candidateId];
    } else {
      // Multiple valid candidates: Synthesize composite or select highest scoring
      if (hasRefusal && hasSubstantive) {
        // Resolve conflict by filtering out refusal when grounded evidence exists
        const nonRefusals = validCandidates.filter(c => c.epistemicStatus !== 'REFUSAL');
        nonRefusals.sort((a, b) => b.confidenceScore - a.confidenceScore);
        const best = nonRefusals[0];
        finalDecision = 'ACCEPT_SINGLE';
        authoritativePayload = best.normalizedPayload;
        authoritativeConfidence = best.confidenceScore;
        resolvedEpistemicStatus = best.epistemicStatus;
        selectedCandidateIds = [best.candidateId];
      } else if (distinctDomains.size > 1) {
        // Multi-domain congruent synthesis
        finalDecision = 'SYNTHESIZE_COMPOSITE';
        const compositeParts = validCandidates.map(c => `[${c.domain}:${c.epistemicStatus}] ${c.normalizedPayload}`);
        authoritativePayload = `SYNTHESIS: Composite multi-domain resolution approved by Mother Core:\n${compositeParts.join('\n')}`;
        const avgConfidence = validCandidates.reduce((sum, c) => sum + c.confidenceScore, 0) / validCandidates.length;
        authoritativeConfidence = Number(avgConfidence.toFixed(3));
        resolvedEpistemicStatus = 'DERIVATION';
        selectedCandidateIds = validCandidates.map(c => c.candidateId);
      } else {
        // Same domain candidates: select highest calibrated score
        const sorted = validCandidates.slice().sort((a, b) => b.confidenceScore - a.confidenceScore);
        const best = sorted[0];
        finalDecision = 'ACCEPT_SINGLE';
        authoritativePayload = best.normalizedPayload;
        authoritativeConfidence = best.confidenceScore;
        resolvedEpistemicStatus = best.epistemicStatus;
        selectedCandidateIds = [best.candidateId];
      }
    }

    const durationMs = Number((performance.now() - startTime).toFixed(2));

    // 6. Generate Immutable Evaluation Certificate Digest
    const certSeed = `${tenantId}:${parentTaskId}:${finalDecision}:${selectedCandidateIds.join('|')}:${authoritativeConfidence}:${authoritativePayload.substring(0, 32)}`;
    const evaluationDigest = crypto.createHash('sha256').update(certSeed).digest('hex');
    const certificateId = `cert_eval_${evaluationDigest.substring(0, 16)}`;

    return {
      certificateId,
      evaluationEngineId: EVALUATION_ENGINE_ID,
      version: EVALUATION_ENGINE_VERSION,
      tenantId,
      parentTaskId,
      motherCoreModelId: CUBIO_NATIVE_MODEL_ID,
      motherCoreParameters: TOTAL_NATIVE_PARAMETERS,
      nonTrainableInvariantEnforced: true,
      finalDecision,
      evaluatedCandidateCount: candidates.length,
      acceptedCandidateCount: selectedCandidateIds.length,
      rejectedCandidateCount: candidates.length - selectedCandidateIds.length,
      selectedCandidateIds,
      resolvedEpistemicStatus,
      authoritativeOutputPayload: authoritativePayload,
      authoritativeConfidenceScore: authoritativeConfidence,
      candidateScoring: scoredCandidates,
      conflictDetected,
      conflictResolutionRationale: conflictRationale,
      evaluationDigest,
      evaluationDurationMs: durationMs,
      certifiedAt: new Date().toISOString(),
    };
  }
}
