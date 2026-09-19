/**
 * CubiO — Step 85 Distributed Poisoning Filter
 * Detects Byzantine gradient outliers and adversarial gradient injections.
 */

import { GradientRuntime } from '../runtime/gradientRuntime';

export class DistributedPoisoningFilter {
  public static filterByzantineGradients(
    rankGradients: readonly (readonly number[])[],
    maxNormThreshold = 50.0
  ): {
    cleanGradients: readonly (readonly number[])[];
    quarantinedRanks: readonly number[];
  } {
    const clean: (readonly number[])[] = [];
    const quarantined: number[] = [];

    for (let r = 0; r < rankGradients.length; r++) {
      const grad = rankGradients[r];
      const norm = GradientRuntime.computeL2Norm(grad);
      if (norm > maxNormThreshold || isNaN(norm)) {
        quarantined.push(r);
      } else {
        clean.push(grad);
      }
    }

    return {
      cleanGradients: Object.freeze(clean),
      quarantinedRanks: Object.freeze(quarantined),
    };
  }
}
