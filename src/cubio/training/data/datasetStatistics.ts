/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 43: Dataset Statistics & Harmonic Profiler
 *
 * Computes dataset distribution metrics, digital root frequencies (1..9),
 * triadic balance score, and storage compression ratios.
 */

import {
  NormalizedDatasetRecord,
  DatasetStatisticsReport,
} from './types';
import { ModalityType } from '../../multimodal/types';

export class DatasetStatistics {
  /**
   * Generates a comprehensive dataset statistics report.
   */
  public static computeReport(
    datasetName: string,
    records: readonly NormalizedDatasetRecord[],
    deduplicationSavingsRatio = 0.0
  ): DatasetStatisticsReport {
    const total = records.length;
    const modalityCount: Record<ModalityType, number> = {
      TEXT: 0,
      IMAGE: 0,
      AUDIO: 0,
      THREED: 0,
    };

    const drCount: Record<number, number> = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0,
    };

    let totalBytes = 0;
    let triadicCount = 0;

    for (const r of records) {
      modalityCount[r.modality] = (modalityCount[r.modality] || 0) + 1;
      drCount[r.digitalRoot369] = (drCount[r.digitalRoot369] || 0) + 1;
      totalBytes += r.byteSize;

      if (r.digitalRoot369 === 3 || r.digitalRoot369 === 6 || r.digitalRoot369 === 9) {
        triadicCount++;
      }
    }

    const meanBytes = total > 0 ? parseFloat((totalBytes / total).toFixed(1)) : 0;
    const balanceScore = total > 0 ? parseFloat((triadicCount / total).toFixed(4)) : 0.3333;

    return Object.freeze({
      datasetName,
      totalSamples: total,
      modalityDistribution: Object.freeze(modalityCount),
      digitalRootFrequencies: Object.freeze(drCount),
      harmonicBalanceScore: balanceScore,
      meanByteSizePerSample: meanBytes,
      totalStorageBytes: totalBytes,
      deduplicationSavingsRatio,
    });
  }
}
