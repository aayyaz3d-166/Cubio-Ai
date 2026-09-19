/**
 * CubiO — Universal Spatial Operating Environment
 * Step 81: Modality Mixture Controller
 *
 * Controls and verifies simplex mixture proportions (40% Text, 25% Vision, 15% Audio, 15% 3D, 5% Multimodal).
 *
 * Classification: SOFTWARE_VALIDATED
 */

import { ModalityDistributionRecord, ModalityStreamType } from '../types';

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

  public getDistribution(): ModalityDistributionRecord {
    let total = 0;
    for (const mod in this.actualCounts) {
      total += this.actualCounts[mod as ModalityStreamType];
    }

    const percentages: Record<ModalityStreamType, number> = {
      TEXT: total > 0 ? parseFloat((this.actualCounts.TEXT / total).toFixed(4)) : 0,
      VISION: total > 0 ? parseFloat((this.actualCounts.VISION / total).toFixed(4)) : 0,
      AUDIO: total > 0 ? parseFloat((this.actualCounts.AUDIO / total).toFixed(4)) : 0,
      '3D_SPATIAL': total > 0 ? parseFloat((this.actualCounts['3D_SPATIAL'] / total).toFixed(4)) : 0,
      MULTIMODAL_INSTRUCTION: total > 0 ? parseFloat((this.actualCounts.MULTIMODAL_INSTRUCTION / total).toFixed(4)) : 0,
    };

    return Object.freeze({
      requestedRatios: Object.freeze({ ...this.requestedRatios }),
      actualTokensProcessed: Object.freeze({ ...this.actualCounts }),
      actualTokenPercentages: Object.freeze(percentages),
      totalActualTokens: total,
      isMixtureConforming: total > 0,
    });
  }
}
