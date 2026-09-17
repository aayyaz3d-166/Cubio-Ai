/**
 * 3D Memory Studio — Phase 5: Observation & Reconstruction
 * Funnel P5.2: Information Gain Calculator
 *
 * Quantifies exact information gain and entropy reduction when transitioning
 * across observation combinations:
 * {F0} -> {F0, F1} -> {F0, F1, F2}
 */

import { ReconstructionIntersection } from './types';

export interface InformationGainStep {
  readonly fromKey: string;
  readonly toKey: string;
  readonly addedObserver: string;
  readonly previousLoss: number;
  readonly currentLoss: number;
  readonly gain: number;
  readonly volumeReductionRatio: number;
}

export function calculateInformationGainProgression(
  reconstructions: readonly ReconstructionIntersection[]
): readonly InformationGainStep[] {
  const steps: InformationGainStep[] = [];

  for (let i = 1; i < reconstructions.length; i++) {
    const prev = reconstructions[i - 1];
    const curr = reconstructions[i];

    const prevLoss = prev.informationLoss;
    const currLoss = curr.informationLoss;
    const gain = Number(Math.max(0, prevLoss - currLoss).toFixed(2));

    const added = curr.observerIds.find((id) => !prev.observerIds.includes(id)) || 'N/A';

    steps.push({
      fromKey: prev.combinationKey,
      toKey: curr.combinationKey,
      addedObserver: added,
      previousLoss: prevLoss,
      currentLoss: currLoss,
      gain,
      volumeReductionRatio: curr.volumeReductionRatio,
    });
  }

  return Object.freeze(steps);
}
