/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 44: Gradient Bucketizer
 *
 * Partitions layer gradients into fixed-size buckets to overlap AllReduce
 * communication with backward pass computation.
 */

import {
  GradientBucketConfig,
  GradientBucket,
} from './types';
import { deterministicHash } from '../../state/determinism';

export class GradientBucketizer {
  private config: GradientBucketConfig;
  private buckets: GradientBucket[] = [];

  constructor(configOverrides?: Partial<GradientBucketConfig>) {
    this.config = Object.freeze({
      bucketSizeLimitBytes: 1 * 1024 * 1024, // 1MB for 2GB edge compliance
      enableOverlap: true,
      defaultQuantization: 'INT8',
      ...configOverrides,
    });
  }

  /**
   * Partitions 12 model layers into gradient buckets.
   */
  public partitionLayers(totalLayers = 12, elementsPerLayer = 1000000): readonly GradientBucket[] {
    const bytesPerElement = this.config.defaultQuantization === 'INT4' ? 0.5 : this.config.defaultQuantization === 'INT8' ? 1.0 : 2.0;
    const layerBytes = elementsPerLayer * bytesPerElement;

    const result: GradientBucket[] = [];
    let currentLayers: number[] = [];
    let currentBytes = 0;
    let currentElements = 0;
    let bucketIndex = 0;

    for (let layer = totalLayers - 1; layer >= 0; layer--) { // Backward order
      currentLayers.push(layer);
      currentBytes += layerBytes;
      currentElements += elementsPerLayer;

      if (currentBytes >= this.config.bucketSizeLimitBytes || layer === 0) {
        const bucketHash = deterministicHash(`BUCKET:${bucketIndex}:${currentLayers.join(',')}:${currentBytes}`);
        const casCid = `bafk_gbucket_${bucketHash.slice(2, 10)}`;

        const b: GradientBucket = Object.freeze({
          bucketId: `BUCKET_${bucketIndex}`,
          bucketIndex,
          layerIndices: Object.freeze([...currentLayers]),
          totalElements: currentElements,
          byteSize: currentBytes,
          isReadyForSync: true,
          isSynchronized: false,
          casCid,
          checksum: `0x${bucketHash}`,
        });

        result.push(b);
        bucketIndex++;
        currentLayers = [];
        currentBytes = 0;
        currentElements = 0;
      }
    }

    this.buckets = [...result];
    return Object.freeze([...result]);
  }

  public markBucketSynchronized(bucketId: string): void {
    const idx = this.buckets.findIndex((b) => b.bucketId === bucketId);
    if (idx !== -1) {
      const next = [...this.buckets];
      next[idx] = Object.freeze({
        ...next[idx],
        isSynchronized: true,
      });
      this.buckets = next;
    }
  }

  public getBuckets(): readonly GradientBucket[] {
    return Object.freeze(this.buckets);
  }

  public reset(): void {
    this.buckets = [];
  }
}
