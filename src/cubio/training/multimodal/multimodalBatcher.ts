/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 46: Multimodal Batcher
 *
 * Constructs unified multimodal batches across Text, Image, Audio, and 3D,
 * managing modality dropout and memory-bounded payload packing.
 */

import {
  NativeMultimodalSample,
  UnifiedMultimodalBatch,
} from './types';
import { ModalityType } from '../../multimodal/types';
import { deterministicHash } from '../../state/determinism';

export class MultimodalBatcher {
  private dropoutRatio: number;

  constructor(dropoutRatio = 0.0) {
    this.dropoutRatio = Math.max(0.0, Math.min(0.5, dropoutRatio));
  }

  /**
   * Constructs a unified batch from an array of native samples.
   */
  public createBatch(batchId: string, samples: readonly NativeMultimodalSample[]): UnifiedMultimodalBatch {
    const counts: Record<ModalityType, number> = {
      TEXT: 0,
      IMAGE: 0,
      AUDIO: 0,
      THREED: 0,
    };

    let totalTokens = 0;
    let totalBytes = 0;
    const keptSamples: NativeMultimodalSample[] = [];

    for (let i = 0; i < samples.length; i++) {
      const s = samples[i];
      // Deterministic dropout
      if (this.dropoutRatio > 0 && (i % Math.round(1 / this.dropoutRatio)) === 0) {
        continue;
      }

      counts[s.promptModality] = (counts[s.promptModality] || 0) + 1;
      totalTokens += s.rawPrompt.length;
      totalBytes += 1024; // Estimated sample payload
      keptSamples.push(s);
    }

    const batchHash = deterministicHash(
      `MM_BATCH:${batchId}:${keptSamples.map((s) => s.sampleId).join(',')}:${totalTokens}`
    );

    return Object.freeze({
      batchId,
      samples: Object.freeze(keptSamples),
      modalityCounts: Object.freeze(counts),
      totalTokens,
      totalBytes,
      activeDropoutRatio: this.dropoutRatio,
      batchChecksum: `0x${batchHash}`,
    });
  }

  public setDropoutRatio(ratio: number): void {
    this.dropoutRatio = Math.max(0.0, Math.min(0.5, ratio));
  }
}
