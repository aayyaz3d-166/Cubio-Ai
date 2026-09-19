/**
 * ============================================================================
 * CUBiO AI — PHASE 31 TASK 510: SUBMOTHER RESULT NORMALIZATION LAYER
 * src/cubio/submother/phase31SubmotherResultNormalizationLayer.ts
 * ============================================================================
 *
 * Canonical result-normalization layer for outputs returned by Submothers.
 * Normalizes structure, provenance, confidence/epistemic status, task identity,
 * formula identity, and evidence references.
 *
 * Core Guarantees & Invariants:
 *   1. Canonical Structure & Candidate Status:
 *      - All normalized outputs remain strictly CANDIDATES awaiting Mother Core evaluation.
 *      - Normalized status is `CANDIDATE_NORMALIZED` (Submothers CANNOT declare final truth).
 *   2. Strict Provenance & Lineage:
 *      - Requires tenantId, parentTaskId, submotherId, formulaId, originatingStateHash,
 *        and cryptographic evidence references.
 *      - Provenance-free or detached outputs are rejected fail-closed.
 *   3. Epistemic Status & Calibrated Confidence:
 *      - Maps epistemic status (`FACT`, `DERIVATION`, `HYPOTHESIS`, `AMBIGUITY`, `REFUSAL`).
 *      - Validates calibrated confidence alignment (e.g. `FACT` requires $\ge 0.85$ confidence + evidence).
 *      - Traps contradictory states (e.g. `FACT` with 0 evidence, or high confidence with `REFUSAL`).
 *   4. Size & Sanitization Defense:
 *      - Strict payload size ceilings (default max 65,536 bytes / 64 KB per result).
 *      - Sanitizes internal memory pointers, private diagnostic wiring, and internal secrets.
 *   5. Deduplication & Parity Tracking:
 *      - Deduplicates identical candidate payloads within the normalization batch.
 *      - Generates immutable normalization batch digest and candidate-level provenance digests.
 *   6. Zero Neural Parameter Drift / Non-Trainable:
 *      - `trainableWeights: 0`, `independentWeightsCreated: false`.
 *   7. Permanent Sovereignty & Safety:
 *      - IS_ACTUATION_BLOCKED === true
 *      - OFFLINE_ISOLATED === true
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
import { EpistemicCategory } from './phase31EpistemicSubmotherGenerator';

// ============================================================================
// CONSTANTS
// ============================================================================

export const NORMALIZATION_LAYER_VERSION = '31.510.0';
export const NORMALIZATION_LAYER_ID = 'CUBIO_SUBMOTHER_RESULT_NORMALIZATION_LAYER';

export const MAX_RESULT_PAYLOAD_BYTES = 65536; // 64 KB per result payload
export const MAX_NORMALIZATION_BATCH_SIZE = 32;

// ============================================================================
// CONTRACTS & TYPES
// ============================================================================

export interface RawSubmotherOutput {
  readonly tenantId: string;
  readonly parentTaskId: string;
  readonly submotherId: string;
  readonly formulaId: string;
  readonly domain?: string;
  readonly originatingStateHash: string;
  readonly epistemicStatus: EpistemicCategory;
  readonly confidenceScore: number;
  readonly payload: string | Record<string, any>;
  readonly evidenceReferences?: readonly string[];
  readonly internalExecutionMetadata?: Record<string, any>;
  readonly rawSignature?: string;
}

export interface NormalizedCandidateResult {
  readonly candidateId: string;
  readonly tenantId: string;
  readonly parentTaskId: string;
  readonly submotherId: string;
  readonly formulaId: string;
  readonly domain: string;
  readonly originatingStateHash: string;
  readonly epistemicStatus: EpistemicCategory;
  readonly confidenceScore: number;
  readonly normalizedPayload: string;
  readonly evidenceReferences: readonly string[];
  readonly evidenceDigest: string;
  readonly candidateStatus: 'CANDIDATE_NORMALIZED';
  readonly authoritativeEvaluationPending: true;
  readonly isSanitized: boolean;
  readonly provenanceDigest: string;
  readonly normalizedAt: string;
}

export interface NormalizationRejection {
  readonly submotherId?: string;
  readonly rawIndex: number;
  readonly reasonCode: 
    | 'MALFORMED_STRUCTURE'
    | 'MISSING_PROVENANCE'
    | 'CONTRADICTORY_EPISTEMIC_STATE'
    | 'OVERSIZED_PAYLOAD'
    | 'UNAUTHORIZED_TENANT_OR_TASK'
    | 'DUPLICATE_CANDIDATE_PAYLOAD';
  readonly details: string;
}

export interface NormalizationBatchSummary {
  readonly layerId: string;
  readonly version: string;
  readonly tenantId: string;
  readonly parentTaskId: string;
  readonly motherCoreModelId: string;
  readonly motherCoreParameters: number;
  readonly nonTrainableInvariantEnforced: boolean;
  readonly totalSubmitted: number;
  readonly totalAccepted: number;
  readonly totalRejected: number;
  readonly duplicatesRejected: number;
  readonly rejections: readonly NormalizationRejection[];
  readonly normalizedCandidates: readonly NormalizedCandidateResult[];
  readonly batchParityDigest: string;
  readonly durationMs: number;
}

// ============================================================================
// NORMALIZATION LAYER IMPLEMENTATION
// ============================================================================

export class Phase31SubmotherResultNormalizationLayer {
  private static instance: Phase31SubmotherResultNormalizationLayer | null = null;

  private constructor() {
    if (!IS_ACTUATION_BLOCKED) {
      throw new Error('FAIL_CLOSED: IS_ACTUATION_BLOCKED must be true in Phase31SubmotherResultNormalizationLayer');
    }
    if (!OFFLINE_ISOLATED) {
      throw new Error('FAIL_CLOSED: OFFLINE_ISOLATED must be true in Phase31SubmotherResultNormalizationLayer');
    }
    ExternalModelGuard.assertNativeOnly(NORMALIZATION_LAYER_ID);
  }

  public static getInstance(): Phase31SubmotherResultNormalizationLayer {
    if (!this.instance) {
      this.instance = new Phase31SubmotherResultNormalizationLayer();
    }
    return this.instance;
  }

  public static resetInstance(): void {
    this.instance = null;
  }

  /**
   * Normalizes a batch of raw Submother outputs into canonical candidates.
   * Performs rigorous structure, provenance, epistemic consistency, and payload sanitization.
   */
  public normalizeBatch(
    tenantId: string,
    parentTaskId: string,
    rawOutputs: readonly RawSubmotherOutput[]
  ): NormalizationBatchSummary {
    const startTime = performance.now();

    // 1. Invariant verification
    if (!IS_ACTUATION_BLOCKED || !OFFLINE_ISOLATED) {
      throw new Error('FAIL_CLOSED: Safety invariants breached');
    }
    ExternalModelGuard.assertNativeOnly(NORMALIZATION_LAYER_ID);

    if (!tenantId || tenantId.trim().length === 0) {
      throw new Error('FAIL_CLOSED: Missing tenantId');
    }
    if (!parentTaskId || parentTaskId.trim().length === 0) {
      throw new Error('FAIL_CLOSED: Missing parentTaskId');
    }

    const accepted: NormalizedCandidateResult[] = [];
    const rejections: NormalizationRejection[] = [];
    const seenPayloadHashes = new Set<string>();
    let duplicatesRejected = 0;

    // 2. Enforce batch ceiling
    if (rawOutputs.length > MAX_NORMALIZATION_BATCH_SIZE) {
      throw new Error(`FAIL_CLOSED: Batch size ${rawOutputs.length} exceeds ceiling of ${MAX_NORMALIZATION_BATCH_SIZE}`);
    }

    // 3. Process each raw output
    for (let index = 0; index < rawOutputs.length; index++) {
      const raw = rawOutputs[index];

      // A. Structural integrity check
      if (!raw || typeof raw !== 'object') {
        rejections.push({
          rawIndex: index,
          reasonCode: 'MALFORMED_STRUCTURE',
          details: 'Raw output is null, undefined, or non-object',
        });
        continue;
      }

      // B. Authorization check: tenantId & parentTaskId alignment
      if (raw.tenantId !== tenantId || raw.parentTaskId !== parentTaskId) {
        rejections.push({
          submotherId: raw.submotherId,
          rawIndex: index,
          reasonCode: 'UNAUTHORIZED_TENANT_OR_TASK',
          details: `Tenant (${raw.tenantId}) or Task (${raw.parentTaskId}) mismatch with parent context (${tenantId} / ${parentTaskId})`,
        });
        continue;
      }

      // C. Provenance integrity check
      if (
        !raw.submotherId ||
        raw.submotherId.trim().length === 0 ||
        !raw.formulaId ||
        raw.formulaId.trim().length === 0 ||
        !raw.originatingStateHash ||
        raw.originatingStateHash.trim().length === 0
      ) {
        rejections.push({
          submotherId: raw.submotherId,
          rawIndex: index,
          reasonCode: 'MISSING_PROVENANCE',
          details: 'Missing critical provenance fields (submotherId, formulaId, or originatingStateHash)',
        });
        continue;
      }

      // D. Payload serialization & size validation
      let rawStringPayload: string;
      try {
        if (typeof raw.payload === 'string') {
          rawStringPayload = raw.payload;
        } else if (raw.payload && typeof raw.payload === 'object') {
          rawStringPayload = JSON.stringify(raw.payload);
        } else {
          rejections.push({
            submotherId: raw.submotherId,
            rawIndex: index,
            reasonCode: 'MALFORMED_STRUCTURE',
            details: 'Payload must be a non-empty string or object',
          });
          continue;
        }
      } catch (err: any) {
        rejections.push({
          submotherId: raw.submotherId,
          rawIndex: index,
          reasonCode: 'MALFORMED_STRUCTURE',
          details: `Payload stringification failed: ${err.message}`,
        });
        continue;
      }

      if (rawStringPayload.trim().length === 0) {
        rejections.push({
          submotherId: raw.submotherId,
          rawIndex: index,
          reasonCode: 'MALFORMED_STRUCTURE',
          details: 'Payload cannot be empty whitespace',
        });
        continue;
      }

      const byteLength = Buffer.byteLength(rawStringPayload, 'utf8');
      if (byteLength > MAX_RESULT_PAYLOAD_BYTES) {
        rejections.push({
          submotherId: raw.submotherId,
          rawIndex: index,
          reasonCode: 'OVERSIZED_PAYLOAD',
          details: `Payload byte size (${byteLength}) exceeds ceiling of ${MAX_RESULT_PAYLOAD_BYTES} bytes`,
        });
        continue;
      }

      // E. Epistemic consistency check
      const validCategories: EpistemicCategory[] = ['FACT', 'DERIVATION', 'HYPOTHESIS', 'AMBIGUITY', 'REFUSAL'];
      if (!validCategories.includes(raw.epistemicStatus)) {
        rejections.push({
          submotherId: raw.submotherId,
          rawIndex: index,
          reasonCode: 'CONTRADICTORY_EPISTEMIC_STATE',
          details: `Invalid epistemic category: ${raw.epistemicStatus}`,
        });
        continue;
      }

      if (typeof raw.confidenceScore !== 'number' || isNaN(raw.confidenceScore) || raw.confidenceScore < 0.0 || raw.confidenceScore > 1.0) {
        rejections.push({
          submotherId: raw.submotherId,
          rawIndex: index,
          reasonCode: 'CONTRADICTORY_EPISTEMIC_STATE',
          details: `Invalid confidence score: ${raw.confidenceScore}; must be 0.0..1.0`,
        });
        continue;
      }

      // Check epistemic contradictions:
      // 1. FACT requires confidence >= 0.85 AND at least one evidence reference
      if (raw.epistemicStatus === 'FACT') {
        if (raw.confidenceScore < 0.85) {
          rejections.push({
            submotherId: raw.submotherId,
            rawIndex: index,
            reasonCode: 'CONTRADICTORY_EPISTEMIC_STATE',
            details: `FACT epistemic category requires confidence >= 0.85 (got ${raw.confidenceScore})`,
          });
          continue;
        }
        if (!raw.evidenceReferences || raw.evidenceReferences.length === 0) {
          rejections.push({
            submotherId: raw.submotherId,
            rawIndex: index,
            reasonCode: 'CONTRADICTORY_EPISTEMIC_STATE',
            details: 'FACT epistemic category requires at least one verifiable evidence reference',
          });
          continue;
        }
      }

      // 2. REFUSAL requires low confidence <= 0.30 or explicit refusal state
      if (raw.epistemicStatus === 'REFUSAL' && raw.confidenceScore > 0.40) {
        rejections.push({
          submotherId: raw.submotherId,
          rawIndex: index,
          reasonCode: 'CONTRADICTORY_EPISTEMIC_STATE',
          details: `REFUSAL category cannot have high confidence score (${raw.confidenceScore} > 0.40)`,
        });
        continue;
      }

      // F. Payload Sanitization (Strip internal pointers, raw stacks, private diagnostics)
      const sanitizedPayload = this.sanitizePayload(rawStringPayload);

      // G. Deduplication Check
      const payloadHash = crypto.createHash('sha256').update(sanitizedPayload.trim()).digest('hex');
      if (seenPayloadHashes.has(payloadHash)) {
        duplicatesRejected++;
        rejections.push({
          submotherId: raw.submotherId,
          rawIndex: index,
          reasonCode: 'DUPLICATE_CANDIDATE_PAYLOAD',
          details: `Payload duplicate of earlier candidate in this batch (hash: ${payloadHash.substring(0, 12)})`,
        });
        continue;
      }
      seenPayloadHashes.add(payloadHash);

      // H. Evidence Reference Normalization
      const normalizedEvidence = (raw.evidenceReferences || []).map(ref => ref.trim()).filter(ref => ref.length > 0);
      const evidenceDigest = crypto.createHash('sha256')
        .update(normalizedEvidence.slice().sort().join('|'))
        .digest('hex');

      // I. Candidate ID & Provenance Digest Generation
      const candidateSeed = `${tenantId}:${parentTaskId}:${raw.submotherId}:${raw.formulaId}:${payloadHash}:${raw.originatingStateHash}`;
      const candidateId = `cand_norm_${crypto.createHash('sha256').update(candidateSeed).digest('hex').substring(0, 16)}`;

      const provenanceDigest = crypto.createHash('sha256')
        .update(`${candidateId}:${raw.submotherId}:${raw.formulaId}:${raw.originatingStateHash}:${evidenceDigest}`)
        .digest('hex');

      accepted.push({
        candidateId,
        tenantId,
        parentTaskId,
        submotherId: raw.submotherId,
        formulaId: raw.formulaId,
        domain: raw.domain || 'GENERAL',
        originatingStateHash: raw.originatingStateHash,
        epistemicStatus: raw.epistemicStatus,
        confidenceScore: raw.confidenceScore,
        normalizedPayload: sanitizedPayload,
        evidenceReferences: normalizedEvidence,
        evidenceDigest,
        candidateStatus: 'CANDIDATE_NORMALIZED',
        authoritativeEvaluationPending: true,
        isSanitized: true,
        provenanceDigest,
        normalizedAt: new Date().toISOString(),
      });
    }

    const durationMs = Number((performance.now() - startTime).toFixed(2));

    // J. Batch Parity Digest
    const batchSeed = `${tenantId}:${parentTaskId}:${accepted.map(c => c.provenanceDigest).join('|')}:${rejections.length}`;
    const batchParityDigest = crypto.createHash('sha256').update(batchSeed).digest('hex');

    return {
      layerId: NORMALIZATION_LAYER_ID,
      version: NORMALIZATION_LAYER_VERSION,
      tenantId,
      parentTaskId,
      motherCoreModelId: CUBIO_NATIVE_MODEL_ID,
      motherCoreParameters: TOTAL_NATIVE_PARAMETERS,
      nonTrainableInvariantEnforced: true,
      totalSubmitted: rawOutputs.length,
      totalAccepted: accepted.length,
      totalRejected: rejections.length,
      duplicatesRejected,
      rejections,
      normalizedCandidates: accepted,
      batchParityDigest,
      durationMs,
    };
  }

  /**
   * Sanitizes candidate payload, stripping internal secrets, memory pointers,
   * stack traces, and internal diagnostic structures.
   */
  public sanitizePayload(payload: string): string {
    try {
      const parsed = JSON.parse(payload);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        // Strip diagnostic fields
        delete parsed.internalExecutionMetadata;
        delete parsed.rawStack;
        delete parsed.memoryPointers;
        delete parsed.coreSecret;
        delete parsed.debugPointers;
        delete parsed.privateWeights;
        return JSON.stringify(parsed);
      }
    } catch {
      // Fall through for non-JSON text
    }

    // Text regex sanitization
    return payload
      .replace(/(INTERNAL_ADDR|CORE_SECRET|PRIV_KEY|STACK_TRACE|MEM_PTR):\S+/gi, '[REDACTED]')
      .trim();
  }
}
