/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 46: Modality-Balanced Sampler
 *
 * Stratifies sampling across Text, Image, Audio, and 3D to ensure equal representation
 * and prevent gradient dominance from single modalities.
 */

import {
  NativeMultimodalSample,
} from './types';
import { ModalityType } from '../../multimodal/types';

export class ModalityBalancedSampler {
  /**
   * Samples a balanced batch from a multi-modality candidate pool.
   */
  public sampleBalanced(
    candidates: readonly NativeMultimodalSample[],
    samplesPerModality = 2
  ): readonly NativeMultimodalSample[] {
    const pools: Record<ModalityType, NativeMultimodalSample[]> = {
      TEXT: [],
      IMAGE: [],
      AUDIO: [],
      THREED: [],
    };

    for (const c of candidates) {
      pools[c.promptModality]?.push(c);
    }

    const selected: NativeMultimodalSample[] = [];

    const modalities: ModalityType[] = ['TEXT', 'IMAGE', 'AUDIO', 'THREED'];
    for (const m of modalities) {
      const p = pools[m];
      const count = Math.min(samplesPerModality, p.length);
      for (let i = 0; i < count; i++) {
        selected.push(p[i]);
      }
    }

    return Object.freeze(selected);
  }
}
