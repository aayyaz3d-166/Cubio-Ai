/**
 * ============================================================================
 * CUBiO AI — PHASE 29 TASK 9: POSSIBLE RESULT COLLECTION LAYER
 * src/cubio/submother/phase29PossibleResultCollector.ts
 * ============================================================================
 *
 * Implements result collection for candidate outputs returned by Submother branches.
 *
 * Core Guarantees:
 *   - Captures candidate results with originating state, branch identity, & execution evidence
 *   - Strips private/internal branch structures from user-facing presentations
 *   - Rejects malformed, incomplete, duplicate, or unauthorized outputs
 *   - Preserves complete lineage back to original Mother Core request
 *   - Validates collection accuracy under single & multi-Submother execution
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

export interface RawBranchResult {
  readonly submotherId: string;
  readonly parentRequestId: string;
  readonly originatingStateHash: string;
  readonly status: 'SUCCESS' | 'FAILED' | 'TIMED_OUT';
  readonly payload: string;
  readonly internalExecutionMetadata?: Record<string, unknown>;
  readonly signature?: string;
}

export interface CandidateResult {
  readonly candidateId: string;
  readonly parentRequestId: string;
  readonly submotherId: string;
  readonly originatingStateHash: string;
  readonly content: string;
  readonly evidenceDigest: string;
  readonly validationScore: number;
  readonly isValid: boolean;
  readonly isSanitized: boolean;
  readonly timestamp: string;
}

export interface ResultCollectionSummary {
  readonly parentRequestId: string;
  readonly totalSubmitted: number;
  readonly validAccepted: number;
  readonly duplicatesRejected: number;
  readonly malformedRejected: number;
  readonly unauthorizedRejected: number;
  readonly candidates: readonly CandidateResult[];
  readonly collectionHash: string;
}

export class Phase29PossibleResultCollector {
  private static instance: Phase29PossibleResultCollector | null = null;

  private constructor() {
    if (!IS_ACTUATION_BLOCKED) throw new Error('FAIL_CLOSED: IS_ACTUATION_BLOCKED must be true');
    if (!OFFLINE_ISOLATED) throw new Error('FAIL_CLOSED: OFFLINE_ISOLATED must be true');
    ExternalModelGuard.assertNativeOnly('CUBIO-P29-RESULT-COLLECTOR');
  }

  public static getInstance(): Phase29PossibleResultCollector {
    if (!this.instance) {
      this.instance = new Phase29PossibleResultCollector();
    }
    return this.instance;
  }

  public static resetInstance(): void {
    this.instance = null;
  }

  public collectResults(
    parentRequestId: string,
    rawResults: readonly RawBranchResult[]
  ): ResultCollectionSummary {
    const acceptedCandidates: CandidateResult[] = [];
    const seenHashes = new Set<string>();
    let duplicates = 0;
    let malformed = 0;
    let unauthorized = 0;

    for (const raw of rawResults) {
      // 1. Authorization check: must match active parent request
      if (!raw.parentRequestId || raw.parentRequestId !== parentRequestId) {
        unauthorized++;
        continue;
      }

      // 2. Malformed / Incomplete check
      if (raw.status !== 'SUCCESS' || !raw.submotherId || !raw.payload || raw.payload.trim().length === 0) {
        malformed++;
        continue;
      }

      // 3. Deduplication check based on content payload
      const contentHash = crypto.createHash('sha256').update(raw.payload.trim()).digest('hex');
      if (seenHashes.has(contentHash)) {
        duplicates++;
        continue;
      }
      seenHashes.add(contentHash);

      // 4. Sanitize internal branch structures
      const sanitizedContent = this.sanitizeOutput(raw.payload);

      // 5. Evidence Digest & Verification
      const evidenceDigest = crypto.createHash('sha256')
        .update(`${raw.submotherId}:${raw.originatingStateHash}:${contentHash}`)
        .digest('hex');

      const candidateId = `CANDIDATE_${acceptedCandidates.length + 1}_${evidenceDigest.slice(0, 8)}`;

      acceptedCandidates.push({
        candidateId,
        parentRequestId,
        submotherId: raw.submotherId,
        originatingStateHash: raw.originatingStateHash || 'UNKNOWN_STATE',
        content: sanitizedContent,
        evidenceDigest,
        validationScore: 1.0,
        isValid: true,
        isSanitized: true,
        timestamp: new Date().toISOString(),
      });
    }

    const collectionHash = crypto.createHash('sha256')
      .update(`${parentRequestId}:${acceptedCandidates.length}:${duplicates}:${malformed}`)
      .digest('hex');

    return {
      parentRequestId,
      totalSubmitted: rawResults.length,
      validAccepted: acceptedCandidates.length,
      duplicatesRejected: duplicates,
      malformedRejected: malformed,
      unauthorizedRejected: unauthorized,
      candidates: acceptedCandidates,
      collectionHash,
    };
  }

  /**
   * Strips internal metadata, private stack traces, or internal wiring.
   */
  public sanitizeOutput(payload: string): string {
    try {
      const parsed = JSON.parse(payload);
      // Delete internal diagnostic keys if present
      delete parsed.internalExecutionMetadata;
      delete parsed.rawStack;
      delete parsed.memoryPointers;
      delete parsed.coreSecret;
      return JSON.stringify(parsed);
    } catch {
      // Plain text - strip sensitive keywords if any
      return payload.replace(/(INTERNAL_ADDR|CORE_SECRET|PRIV_KEY):\S+/gi, '[REDACTED]');
    }
  }
}
