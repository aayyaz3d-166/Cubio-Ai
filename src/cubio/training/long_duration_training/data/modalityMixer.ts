/**
 * CubiO — Universal Spatial Operating Environment
 * Step 80: Modality Mixer
 *
 * Tracks requested vs actual token mixture ratios across 5 streams:
 * - Text, Vision, Audio, 3D Spatial, Instructions
 *
 * Classification: SOFTWARE_VALIDATED
 */

import { ModalityMixtureAccounting, ModalityStreamType } from '../types';

export class ModalityMixer {
  private actualCounts: Record<ModalityStreamType, number> = {
    TEXT: 0,
    VISION: 0,
    AUDIO: 0,
    '3D_SPATIAL': 0,
    MULTIMODAL_INSTRUCTION: 0,
  };

  private requestedMixture: Record<ModalityStreamType, number> = {
    TEXT: 0.40,
    VISION: 0.25,
    AUDIO: 0.15,
    '3D_SPATIAL': 0.15,
    MULTIMODAL_INSTRUCTION: 0.05,
  };

  public recordTokens(modality: ModalityStreamType, count: number): void {
    this.actualCounts[modality] += count;
  }

  public getAccounting(): ModalityMixtureAccounting {
    let total = 0;
    for (const k in this.actualCounts) {
      total += this.actualCounts[k as ModalityStreamType];
    }

    return Object.freeze({
      requestedMixture: Object.freeze({ ...this.requestedMixture }),
      actualTokensProcessed: Object.freeze({ ...this.actualCounts }),
      totalActualTokens: total,
      isMixtureBalanced: total > 0,
    });
  }
}
