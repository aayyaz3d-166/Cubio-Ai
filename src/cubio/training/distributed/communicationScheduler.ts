/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 44: Communication Scheduler
 *
 * Schedules non-blocking AllReduce communication events overlapping with
 * backward pass layer computation.
 */

import {
  GradientBucket,
} from './types';
import { deterministicHash } from '../../state/determinism';

export interface CommunicationSyncResult {
  readonly bucketId: string;
  readonly syncDurationMs: number;
  readonly bytesTransferred: number;
  readonly isOverlappedWithCompute: boolean;
  readonly syncChecksum: string;
}

export class CommunicationScheduler {
  private totalTransferredBytes = 0;
  private totalSyncTimeMs = 0;
  private overlappedSyncCount = 0;
  private totalSyncCount = 0;

  /**
   * Dispatches non-blocking bucket AllReduce synchronization.
   */
  public scheduleBucketSync(
    bucket: GradientBucket,
    clusterNodeCount = 4,
    simulateOverlapped = true
  ): CommunicationSyncResult {
    const t0 = Date.now();
    const bytes = bucket.byteSize * (clusterNodeCount - 1);
    const dur = Math.max(1, Math.round(bucket.byteSize / (50 * 1024 * 1024))); // simulated 50MB/s

    this.totalTransferredBytes += bytes;
    this.totalSyncTimeMs += dur;
    this.totalSyncCount++;
    if (simulateOverlapped) {
      this.overlappedSyncCount++;
    }

    const syncHash = deterministicHash(`SYNC_RES:${bucket.bucketId}:${bytes}:${dur}`);

    return Object.freeze({
      bucketId: bucket.bucketId,
      syncDurationMs: dur,
      bytesTransferred: bytes,
      isOverlappedWithCompute: simulateOverlapped,
      syncChecksum: `0x${syncHash}`,
    });
  }

  public getOverlapRatio(): number {
    return this.totalSyncCount > 0
      ? parseFloat((this.overlappedSyncCount / this.totalSyncCount).toFixed(4))
      : 1.0;
  }

  public getTotalBytesTransferred(): number {
    return this.totalTransferredBytes;
  }

  public getMeanSyncLatencyMs(): number {
    return this.totalSyncCount > 0
      ? parseFloat((this.totalSyncTimeMs / this.totalSyncCount).toFixed(2))
      : 1.0;
  }

  public reset(): void {
    this.totalTransferredBytes = 0;
    this.totalSyncTimeMs = 0;
    this.overlappedSyncCount = 0;
    this.totalSyncCount = 0;
  }
}
