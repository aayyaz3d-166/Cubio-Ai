/**
 * CubiO — Universal Spatial Operating Environment
 * Step 83: Modality Mixture Controller
 *
 * Controls simplex proportions (40% Text, 25% Vision, 15% Audio, 15% 3D, 5% Multimodal) and tracks deviation.
 *
 * Classification: SOFTWARE_VALIDATED
 */

import { ModalityMixtureRecord, ModalityStreamType } from '../types';

export class ModalityMixtureController {
  private actualCounts: Record<ModalityStreamType, number> = {
    TEXT: 0,
    VISION: 0,
    AUDIO: 0,
    '3D_SPATIAL': 0,
    MULTIMODAL_INSTRUCTION: 0,
  };

  private requestedRatios: Record<ModalityStreamType, number> = {
    TEXT: 0.40,
    VISION: 0.25,
    AUDIO: 0.15,
    '3D_SPATIAL': 0.15,
    MULTIMODAL_INSTRUCTION: 0.05,
  };

  public recordTokens(modality: ModalityStreamType, count: number): void {
    this.actualCounts[modality] += count;
  }

  public getMixtureRecord(): ModalityMixtureRecord {
    let total = 0;
    for (const mod in this.actualCounts) {
      total += this.actualCounts[mod as ModalityStreamType];
    }

    const actualRatios: Record<ModalityStreamType, number> = {
      TEXT: total > 0 ? parseFloat((this.actualCounts.TEXT / total).toFixed(4)) : 0,
      VISION: total > 0 ? parseFloat((this.actualCounts.VISION / total).toFixed(4)) : 0,
      AUDIO: total > 0 ? parseFloat((this.actualCounts.AUDIO / total).toFixed(4)) : 0,
      '3D_SPATIAL': total > 0 ? parseFloat((this.actualCounts['3D_SPATIAL'] / total).toFixed(4)) : 0,
      MULTIMODAL_INSTRUCTION: total > 0 ? parseFloat((this.actualCounts.MULTIMODAL_INSTRUCTION / total).toFixed(4)) : 0,
    };

    let devSum = 0;
    for (const mod in this.requestedRatios) {
      const m = mod as ModalityStreamType;
      devSum += Math.abs(actualRatios[m] - this.requestedRatios[m]);
    }
    const devPct = total > 0 ? parseFloat((devSum * 100).toFixed(2)) : 0;

    return Object.freeze({
      requestedMixture: Object.freeze({ ...this.requestedRatios }),
      actualMixture: Object.freeze(actualRatios),
      actualTokenCounts: Object.freeze({ ...this.actualCounts }),
      totalActualTokens: total,
      mixtureDeviationPercentage: devPct,
      isMixtureConforming: total > 0 && devPct < 5.0,
    });
  }
}
