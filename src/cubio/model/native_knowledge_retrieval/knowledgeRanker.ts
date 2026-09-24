/**
 * CUBiO AI — Task 189: Native Knowledge Indexing and Retrieval
 * src/cubio/model/native_knowledge_retrieval/knowledgeRanker.ts
 *
 * Deterministic Multi-Factor Knowledge Ranker:
 * Combines lexical relevance, epistemic status, provenance depth,
 * and Euler 369 / 343-cell spatial proximity into a unified score.
 */

import {
  KnowledgeIndexEntry,
  KnowledgeRetrievalQuery,
  KnowledgeRetrievalRankedItem,
} from './types';
import {
  EPISTEMIC_WEIGHTS,
} from '../native_knowledge_architecture/types';
import { KnowledgeSpatialBridge } from '../native_knowledge_architecture/knowledgeSpatialBridge';

export class KnowledgeRanker {
  public static readonly DEFAULT_WEIGHTS = Object.freeze({
    relevance: 0.40,
    epistemic: 0.25,
    provenance: 0.15,
    spatial: 0.20,
  });

  /**
   * Computes multi-factor score for a single index entry against query.
   */
  public static scoreEntry(
    entry: KnowledgeIndexEntry,
    query: KnowledgeRetrievalQuery,
    queryTokens: readonly string[]
  ): KnowledgeRetrievalRankedItem {
    // 1. Relevance Score (lexical token overlap + phrase match boost)
    let relevanceScore = 0.0;
    if (queryTokens.length > 0) {
      let matchCount = 0;
      const entryTokenSet = new Set(entry.tokens);
      for (const qt of queryTokens) {
        if (entryTokenSet.has(qt)) {
          matchCount++;
        }
      }
      relevanceScore = matchCount / queryTokens.length;

      // Exact phrase or prefix boost
      if (entry.label.toLowerCase().includes(query.query.toLowerCase())) {
        relevanceScore = Math.min(1.0, relevanceScore + 0.25);
      }
    } else {
      relevanceScore = 0.50; // Neutral if wildcard/empty query
    }

    // 2. Epistemic Score (grounded in sovereign epistemic hierarchy)
    const epistemicScore = EPISTEMIC_WEIGHTS[entry.epistemicStatus] ?? 0.50;

    // 3. Provenance Score (grounded in derivation steps or evidence count)
    const provenanceScore = Math.min(1.0, 0.20 + entry.provenanceDepth * 0.20);

    // 4. Spatial Score (grounded in Euler 369 and 343 cell lattice)
    let spatialScore = 0.50; // Neutral default
    if (query.spatialFocalAddress !== undefined) {
      spatialScore = KnowledgeSpatialBridge.computeSpatialAffinity(
        query.spatialFocalAddress,
        entry.address369
      );
    }

    // 5. Composite Score Computation
    const wRel = query.weights?.relevance ?? KnowledgeRanker.DEFAULT_WEIGHTS.relevance;
    const wEpi = query.weights?.epistemic ?? KnowledgeRanker.DEFAULT_WEIGHTS.epistemic;
    const wPrv = query.weights?.provenance ?? KnowledgeRanker.DEFAULT_WEIGHTS.provenance;
    const wSpt = query.weights?.spatial ?? KnowledgeRanker.DEFAULT_WEIGHTS.spatial;
    const totalWeight = wRel + wEpi + wPrv + wSpt;

    const rawComposite =
      (wRel * relevanceScore + wEpi * epistemicScore + wPrv * provenanceScore + wSpt * spatialScore) /
      (totalWeight > 0 ? totalWeight : 1.0);

    const compositeScore = Math.round(rawComposite * 10000) / 10000;

    return Object.freeze({
      ref: entry,
      relevanceScore: Math.round(relevanceScore * 10000) / 10000,
      epistemicScore: Math.round(epistemicScore * 10000) / 10000,
      provenanceScore: Math.round(provenanceScore * 10000) / 10000,
      spatialScore: Math.round(spatialScore * 10000) / 10000,
      compositeScore,
      rank: 0, // Assigned after sorting
    });
  }
}
