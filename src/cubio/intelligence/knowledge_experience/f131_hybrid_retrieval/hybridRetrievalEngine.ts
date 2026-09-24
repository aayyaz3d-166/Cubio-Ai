import { CanonicalKnowledgeItem, HybridRetrievalResult } from '../types';

export class HybridRetrievalEngineL9 {
  public retrieve(queryTask: string, nodes: readonly CanonicalKnowledgeItem[]): HybridRetrievalResult {
    const retrievedItems = nodes.map(item => {
      const vectorScore = 0.95;
      const invariantScore = item.mathematicalInvariants.length > 0 ? 1.0 : 0.8;
      const provenanceScore = item.provenanceTier === 'TIER_1_HUMAN_AXIOM' ? 1.0 : 0.9;
      const compositeRankScore = parseFloat((0.4 * vectorScore + 0.35 * invariantScore + 0.25 * provenanceScore).toFixed(3));

      return {
        item,
        vectorScore,
        invariantScore,
        provenanceScore,
        compositeRankScore,
      };
    }).sort((a, b) => b.compositeRankScore - a.compositeRankScore);

    return Object.freeze({
      queryTask,
      retrievedItems: Object.freeze(retrievedItems),
      topMatchCompositeScore: retrievedItems.length > 0 ? retrievedItems[0].compositeRankScore : 0.0,
    });
  }
}
