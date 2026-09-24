/**
 * CUBiO AI — Task 190: Native Long-Term Knowledge Memory
 * src/cubio/model/native_long_term_knowledge_memory/evictionPolicy.ts
 *
 * Deterministic Epistemic-Aware Eviction Policy:
 * Prioritizes retention of higher epistemic ranks (AXIOM, FACT) and pinned items,
 * while deterministically evicting lower epistemic ranks (HYPOTHESIS, OBSERVATION)
 * and least-accessed entries under memory capacity pressure.
 */

import {
  KnowledgeMemoryReference,
  L1MaterializedPayload,
} from './types';
import { EPISTEMIC_WEIGHTS } from '../native_knowledge_architecture/types';

export class EvictionPolicy {
  /**
   * Computes deterministic retention score for a reference.
   * Higher score = stronger retention resistance (evicted last).
   */
  public static computeRetentionScore(ref: KnowledgeMemoryReference): number {
    if (ref.isPinned) {
      return Number.MAX_SAFE_INTEGER;
    }

    const epistemicBase = (EPISTEMIC_WEIGHTS[ref.epistemicStatus] ?? 0.50) * 1000;
    const accessScore = ref.accessCount * 10;
    const recencyScore = ref.lastAccessTick;

    return epistemicBase + accessScore + recencyScore;
  }

  /**
   * Selects an eviction victim from an array of candidates in a tier.
   * Throws an error if all candidates are pinned and cannot be evicted.
   */
  public static selectEvictionVictim(
    candidates: readonly KnowledgeMemoryReference[]
  ): KnowledgeMemoryReference {
    const unpinned = candidates.filter((c) => !c.isPinned);
    if (unpinned.length === 0) {
      throw new Error('[EvictionPolicy] Cannot evict: all items in tier are pinned anchors.');
    }

    // Sort ascending by retention score (lowest score is evicted first)
    const sorted = [...unpinned].sort((a, b) => {
      const scoreA = this.computeRetentionScore(a);
      const scoreB = this.computeRetentionScore(b);

      if (Math.abs(scoreA - scoreB) > 1e-4) {
        return scoreA - scoreB;
      }

      // Tie-breaking: lower accessCount first, older tick first, then objectId ascending
      if (a.accessCount !== b.accessCount) {
        return a.accessCount - b.accessCount;
      }
      if (a.lastAccessTick !== b.lastAccessTick) {
        return a.lastAccessTick - b.lastAccessTick;
      }
      return a.objectId.localeCompare(b.objectId);
    });

    return sorted[0];
  }

  /**
   * Selects an L1 payload eviction victim.
   */
  public static selectL1Victim(
    payloads: readonly L1MaterializedPayload[],
    referenceMap: Map<string, KnowledgeMemoryReference>
  ): L1MaterializedPayload {
    const sorted = [...payloads].sort((a, b) => {
      const refA = referenceMap.get(a.referenceId);
      const refB = referenceMap.get(b.referenceId);

      const scoreA = refA ? this.computeRetentionScore(refA) : a.materializedTick;
      const scoreB = refB ? this.computeRetentionScore(refB) : b.materializedTick;

      if (Math.abs(scoreA - scoreB) > 1e-4) {
        return scoreA - scoreB;
      }
      return a.objectId.localeCompare(b.objectId);
    });

    return sorted[0];
  }
}
