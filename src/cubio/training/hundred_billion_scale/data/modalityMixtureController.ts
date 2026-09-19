/**
 * CubiO — Step 86 Modality Mixture Controller
 */

import { HundredBillionModalityStreamType } from '../types';
import { HundredBillionDatasetManifest } from './hundredBillionDatasetManifest';

export class ModalityMixtureController {
  public static getTargetWeight(stream: HundredBillionModalityStreamType): number {
    return HundredBillionDatasetManifest.STREAM_WEIGHTS[stream];
  }

  public static verifyMixtureConformity(
    actualTokenCounts: Readonly<Record<HundredBillionModalityStreamType, number>>,
    totalTokens: number,
    tolerance = 0.05
  ): boolean {
    if (totalTokens <= 0) return false;
    for (const stream of HundredBillionDatasetManifest.STREAMS) {
      const targetRatio = HundredBillionDatasetManifest.STREAM_WEIGHTS[stream];
      const actualRatio = (actualTokenCounts[stream] || 0) / totalTokens;
      if (Math.abs(actualRatio - targetRatio) > tolerance) {
        return false;
      }
    }
    return true;
  }
}
