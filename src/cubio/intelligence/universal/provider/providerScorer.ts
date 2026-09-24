/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F71: Provider Scorer
 *
 * Evaluates candidate providers across Health, Latency, Cost, Fidelity, and Sovereign status.
 */

import {
  ProviderScoredCandidate,
  ProviderSelectionCriteria,
  UniversalProviderProfile,
} from './types';

export class ProviderScorer {
  public scoreProvider(
    profile: UniversalProviderProfile,
    criteria: ProviderSelectionCriteria
  ): ProviderScoredCandidate {
    const reasons: string[] = [];

    // 1. Health Factor
    let healthFactor = 0;
    if (profile.health === 'UP') healthFactor = 1.0;
    else if (profile.health === 'DEGRADED') healthFactor = 0.5;
    else healthFactor = 0.0;
    reasons.push(`Health: ${profile.health} (${healthFactor})`);

    // 2. Latency Factor (Normalized against 2000ms max baseline)
    const normalizedLatency = Math.min(1.0, profile.latencyMs / 2000);
    const latencyFactor = 1.0 - normalizedLatency;
    reasons.push(`Latency: ${profile.latencyMs}ms (${latencyFactor.toFixed(2)})`);

    // 3. Cost Factor (Normalized against $0.05/1K max baseline)
    const normalizedCost = Math.min(1.0, profile.costPer1kUnits / 0.05);
    const costFactor = 1.0 - normalizedCost;
    reasons.push(`Cost: $${profile.costPer1kUnits}/1k (${costFactor.toFixed(2)})`);

    // 4. Fidelity Factor
    const fidelityFactor = profile.fidelityScore;
    reasons.push(`Fidelity: ${fidelityFactor}`);

    // 5. Sovereign Preference Boost
    const sovereignBoost = criteria.preferLocalSovereign && profile.isLocalSovereign ? 0.2 : 0;
    if (sovereignBoost > 0) reasons.push(`Local Sovereign Boost: +${sovereignBoost}`);

    // Composite Weighted Score: 40% Health + 25% Latency + 15% Cost + 20% Fidelity + Sovereign Boost
    let compositeScore = 0;
    if (profile.health === 'DOWN') {
      compositeScore = 0;
    } else {
      compositeScore =
        healthFactor * 0.4 +
        latencyFactor * 0.25 +
        costFactor * 0.15 +
        fidelityFactor * 0.2 +
        sovereignBoost;
    }

    return {
      profile,
      compositeScore: Math.round(compositeScore * 100) / 100,
      reasons: Object.freeze(reasons),
    };
  }
}
