/**
 * 3D Memory Studio - Funnel 10: Candidate Grouping Engine
 * 
 * Groups individual composite candidate occurrences into canonical candidate families.
 * 
 * Invariants:
 * - Uses Funnel 9's collision-safe canonical comparator (areCanonicalCompositesEqual).
 * - Never treats two distinct canonical patterns as equal due to a hash/fingerprint collision.
 * - Enforces 100% deterministic sorting across families and occurrences.
 */

import { areCanonicalCompositesEqual } from '../../funnel9/core/comparator';
import {
  CompositeCandidateFamily,
  CompositeCandidateOccurrence,
} from '../types/candidate';

/**
 * Groups a list of discovered candidate occurrences into canonical candidate families.
 */
export function groupCandidatesIntoFamilies(
  occurrences: readonly CompositeCandidateOccurrence[]
): CompositeCandidateFamily[] {
  // Hash bucket structure for acceleration: Map<fingerprint, family[]>
  const fingerprintBuckets = new Map<string, {
    canonical: typeof occurrences[0]['canonical'];
    signature: string;
    fingerprint: string;
    occurrences: CompositeCandidateOccurrence[];
  }[]>();

  for (const occ of occurrences) {
    const fp = occ.fingerprint;
    let bucket = fingerprintBuckets.get(fp);
    if (!bucket) {
      bucket = [];
      fingerprintBuckets.set(fp, bucket);
    }

    // Two-stage collision safe match: compare with existing candidates in bucket
    let matchedGroup: typeof bucket[0] | undefined;
    for (const group of bucket) {
      if (areCanonicalCompositesEqual(group.canonical, occ.canonical)) {
        matchedGroup = group;
        break;
      }
    }

    if (matchedGroup) {
      matchedGroup.occurrences.push(occ);
    } else {
      bucket.push({
        canonical: occ.canonical,
        signature: occ.signature,
        fingerprint: occ.fingerprint,
        occurrences: [occ],
      });
    }
  }

  // Convert bucket entries into frozen CompositeCandidateFamily structures
  const families: CompositeCandidateFamily[] = [];

  for (const bucket of fingerprintBuckets.values()) {
    for (const group of bucket) {
      // Deterministically sort occurrences within the family:
      // Sort key: blockId ASC, originCellId ASC, occurrenceId ASC
      const sortedOccurrences = [...group.occurrences].sort((a, b) => {
        if (a.blockId !== b.blockId) return a.blockId - b.blockId;
        if (a.originCellId !== b.originCellId) return a.originCellId - b.originCellId;
        return a.occurrenceId.localeCompare(b.occurrenceId);
      });

      // Extract unique block IDs
      const blockIdSet = new Set<number>();
      let totalCells = 0;
      for (const occ of sortedOccurrences) {
        blockIdSet.add(occ.blockId);
        totalCells += occ.coveredCells.length;
      }
      const sortedBlockIds = Array.from(blockIdSet).sort((a, b) => a - b);

      families.push(
        Object.freeze({
          signature: group.signature,
          fingerprint: group.fingerprint,
          canonical: group.canonical,
          occurrences: Object.freeze(sortedOccurrences),
          occurrenceCount: sortedOccurrences.length,
          blockIds: Object.freeze(sortedBlockIds),
          totalCoveredCells: totalCells,
        })
      );
    }
  }

  // Deterministically sort families:
  // Sort key: occurrenceCount DESC, signature ASC
  families.sort((a, b) => {
    if (b.occurrenceCount !== a.occurrenceCount) {
      return b.occurrenceCount - a.occurrenceCount;
    }
    return a.signature.localeCompare(b.signature);
  });

  return families;
}
