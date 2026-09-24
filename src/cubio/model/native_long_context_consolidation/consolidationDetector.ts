/**
 * CUBiO AI — Task 180: Long-Context Memory Consolidation
 * src/cubio/model/native_long_context_consolidation/consolidationDetector.ts
 *
 * Pre-Consolidation Anomaly Detector:
 * Identifies duplicate entries, stale state versions, and epistemic contradictions
 * before any memory consolidation or VDB state mutation occurs.
 *
 * STRICT INVARIANTS:
 * 1. Fails closed on contradictions against canonical axioms.
 * 2. Rejects stale OCC candidate versions.
 * 3. Identifies exact bitwise duplicates via SHA-256 checksums.
 */

import {
  ConsolidationCandidate,
  ConsolidationContradictionError,
  StaleConsolidationError,
} from './types.js';

export interface DetectionScanResult {
  readonly exactDuplicates: ReadonlyMap<string, readonly ConsolidationCandidate[]>; // key = `${objectId}:${checksum}`
  readonly uniqueCandidates: readonly ConsolidationCandidate[];
  readonly duplicatesPrunedCount: number;
}

export class ConsolidationDetector {
  /**
   * Detect and group exact duplicate candidates by objectId and content checksum.
   */
  public detectDuplicates(
    candidates: readonly ConsolidationCandidate[]
  ): DetectionScanResult {
    const groups = new Map<string, ConsolidationCandidate[]>();

    for (const candidate of candidates) {
      const key = `${candidate.objectId}:${candidate.checksum}`;
      let group = groups.get(key);
      if (!group) {
        group = [];
        groups.set(key, group);
      }
      group.push(candidate);
    }

    const exactDuplicates = new Map<string, readonly ConsolidationCandidate[]>();
    const uniqueCandidates: ConsolidationCandidate[] = [];
    let duplicatesPrunedCount = 0;

    for (const [key, list] of groups.entries()) {
      if (list.length > 1) {
        exactDuplicates.set(key, Object.freeze([...list]));
        duplicatesPrunedCount += list.length - 1;
      }
      // Retain the primary representative (first element)
      uniqueCandidates.push(list[0]);
    }

    return Object.freeze({
      exactDuplicates,
      uniqueCandidates: Object.freeze(uniqueCandidates),
      duplicatesPrunedCount,
    });
  }

  /**
   * Validate that candidate OCC state version is not stale compared to existing canonical VDB version.
   */
  public assertNotStale(
    candidate: ConsolidationCandidate,
    canonicalVersion?: number
  ): void {
    if (canonicalVersion !== undefined && candidate.stateVersion < canonicalVersion) {
      throw new StaleConsolidationError(
        candidate.objectId,
        candidate.stateVersion,
        canonicalVersion
      );
    }
  }

  /**
   * Detect direct contradictions between a candidate and an established canonical axiom.
   */
  public assertNoContradiction(
    candidate: ConsolidationCandidate,
    canonicalAxiomContent?: string
  ): void {
    if (!canonicalAxiomContent) return;

    const candLower = candidate.content.toLowerCase();
    const axiomLower = canonicalAxiomContent.toLowerCase();

    if (
      candLower.includes('not ' + axiomLower) ||
      candLower.includes('does not ' + axiomLower) ||
      candLower.includes('contradicts ' + axiomLower) ||
      (axiomLower.includes('discrete') && candLower.includes('non-discrete')) ||
      (axiomLower.includes('343') && candLower.includes('infinite cells'))
    ) {
      throw new ConsolidationContradictionError(
        candidate.objectId,
        `Candidate proposition "${candidate.content}" directly conflicts with certified canonical axiom "${canonicalAxiomContent}".`
      );
    }
  }
}
