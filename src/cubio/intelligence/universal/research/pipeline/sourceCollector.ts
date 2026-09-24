/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F55: Source Collector
 *
 * Collects, filters by reliability, and deduplicates research sources.
 */

import { ResearchSource } from '../types';

export class SourceCollector {
  public filterAndDeduplicate(
    sources: readonly ResearchSource[],
    minReliability: number = 0.5,
    maxCount: number = 10
  ): readonly ResearchSource[] {
    const seenUrls = new Set<string>();
    const filtered: ResearchSource[] = [];

    for (const s of sources) {
      if (s.reliabilityScore >= minReliability && !seenUrls.has(s.url)) {
        seenUrls.add(s.url);
        filtered.push(s);
        if (filtered.length >= maxCount) break;
      }
    }

    return Object.freeze(filtered);
  }
}
