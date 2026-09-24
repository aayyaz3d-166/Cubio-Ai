/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F71: Provider Router
 *
 * Ranks and selects optimal provider candidates based on composite scores.
 */

import {
  ProviderScoredCandidate,
  ProviderSelectionCriteria,
} from './types';
import { ProviderHealthMonitor } from './providerHealthMonitor';
import { ProviderScorer } from './providerScorer';

export class ProviderRouter {
  constructor(
    private monitor: ProviderHealthMonitor,
    private scorer: ProviderScorer
  ) {}

  public rankCandidates(criteria: ProviderSelectionCriteria): readonly ProviderScoredCandidate[] {
    const allProviders = this.monitor.getAll();

    // 1. Filter by requested provider class
    const classMatches = allProviders.filter((p) => p.providerClass === criteria.providerClass);

    // 2. Filter by required features if specified
    const featureMatches = criteria.requiredFeatures && criteria.requiredFeatures.length > 0
      ? classMatches.filter((p) =>
          criteria.requiredFeatures!.every((feat) => p.supportedFeatures.includes(feat))
        )
      : classMatches;

    // 3. Score candidates
    const scored = featureMatches
      .map((p) => this.scorer.scoreProvider(p, criteria))
      .filter((s) => s.profile.health !== 'DOWN'); // Exclude down providers from execution

    // 4. Sort descending by composite score
    return Object.freeze(scored.sort((a, b) => b.compositeScore - a.compositeScore));
  }
}
