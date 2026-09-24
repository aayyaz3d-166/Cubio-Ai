/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F55: Atomic Fact Extractor
 *
 * Extracts structured facts from collected research sources with provenance linking.
 */

import { deterministicHash } from '../../../../state/determinism';
import { ExtractedFact, ResearchSource } from '../types';

export class FactExtractor {
  public extractFacts(sources: readonly ResearchSource[]): readonly ExtractedFact[] {
    const facts: ExtractedFact[] = [];

    for (const source of sources) {
      const text = source.fullContent || source.snippet;
      const sentences = text
        .split(/(?<=[.?!])\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 20 && !s.startsWith('#'));

      for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i];
        const factId = `FACT_${deterministicHash(`${source.sourceId}:${i}:${sentence.slice(0, 30)}`).slice(2, 10)}`;

        facts.push(
          Object.freeze({
            factId,
            statement: sentence,
            confidence: Math.min(0.99, source.reliabilityScore * 0.95 + 0.05),
            sourceId: source.sourceId,
            sourceTitle: source.title,
            sourceUrl: source.url,
            topic: source.title,
          })
        );
      }
    }

    return Object.freeze(facts);
  }
}
